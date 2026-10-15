"""核对剩余 24 种寄存器/跳转指令，并复用此前联合流程比较候选；不导出状态。"""
import argparse
import base64
from collections import Counter
import itertools
import json
from pathlib import Path
import select
import struct
import subprocess
from unittest.mock import patch

from unicorn import UC_HOOK_CODE, UC_PROT_READ, UC_PROT_WRITE
from unicorn.arm64_const import UC_ARM64_REG_NZCV, UC_ARM64_REG_PC, UC_ARM64_REG_X12, UC_ARM64_REG_X13, UC_ARM64_REG_X20, UC_ARM64_REG_X24, UC_ARM64_REG_X27, UC_ARM64_REG_X28
from probe_native import ARGUMENT_REGISTERS, NativeProbe, read_binary
import verify_portable_vm_branch as branch_probe
from verify_portable_vm_memory import MASK64

# Each stop is after x27 advances but before native dispatch stores it in the VM context.
HANDLERS = {
    5: (0x102a2aff8, 0x102a2b00c), 9: (0x102a2aff8, 0x102a2b00c), 25: (0x102a2aff8, 0x102a2b00c),
    14: (0x102a2b034, 0x102a2b048), 24: (0x102a2b014, 0x102a2b02c),
    15: (0x102a2af70, 0x102a2af90), 26: (0x102a2aee8, 0x102a2aef8),
    32: (0x102a2b050, 0x102a2b074), 33: (0x102a2b07c, 0x102a2b0a0), 37: (0x102a2b38c, 0x102a2b3b0),
    44: (0x102a2b5d4, 0x102a2b5f4), 45: (0x102a2b5d4, 0x102a2b5f4), 47: (0x102a2b628, 0x102a2b648),
    54: (0x102a2b650, 0x102a2b674), 55: (0x102a2b67c, 0x102a2b69c),
    56: (0x102a2b6a4, 0x102a2b6c8), 57: (0x102a2b6d0, 0x102a2b6f0), 58: (0x102a2b6f8, 0x102a2b71c),
    86: (0x102a2b238, 0x102a2b258), 92: (0x102a2b334, 0x102a2b354), 93: (0x102a2b0a8, 0x102a2b0cc),
    121: (0x102a2c528, 0x102a2c548), 131: (0x102a2c81c, 0x102a2c838), 161: (0x102a2c398, 0x102a2c3b8),
}
ALU = {32, 33, 37, 44, 45, 47, 54, 55, 56, 57, 58, 86, 92, 93}
REGISTER_PAIR = {32, 33, 37, 93}
CONDITIONAL = {121, 131, 161}
REGISTERS = {'x0': ARGUMENT_REGISTERS[0], 'x1': ARGUMENT_REGISTERS[1], 'x2': ARGUMENT_REGISTERS[2], 'x12': UC_ARM64_REG_X12, 'x13': UC_ARM64_REG_X13}


class RegisterWorker:
    """通过管道发送精确指令及稀疏槽位，只在内存接收受限状态补丁。"""

    def __init__(self, compiled, node):
        """加载明确本地模块，丢弃诊断，避免原始状态被记录。"""
        source = Path(compiled).resolve(strict=True)
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('vm_register_worker.cjs')), str(source)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def calculate(self, record, slots, state):
        """验证 TS 补丁的地址、寄存器名、槽位和写入宽度，不接受泛化执行请求。"""
        request = {'record': base64.b64encode(record).decode('ascii'), 'slots': {index: str(value) for index, value in slots.items()}, 'state': {key: str(value) for key, value in state.items()}}
        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()
        if not select.select([self.process.stdout], [], [], 15)[0]:
            raise RuntimeError('TS 寄存器计算超时')
        try:
            response = json.loads(self.process.stdout.readline(4096))
            target = int(response['next'])
            registers = {key: int(value) for key, value in response['registers'].items()}
            patches = [(item['index'], int(item['value'])) for item in response['slots']]
            writes = [(int(item['address']), base64.b64decode(item['bytes'], validate=True)) for item in response['writes']]
            flags = response.get('nzcv')
            values = [target, *registers.values(), *(value for _, value in patches), *(address for address, _ in writes)]
            if any(not 0 <= value <= MASK64 for value in values) or not set(registers) <= set(REGISTERS) or len(patches) > 1 or len(writes) > 2 or any(type(index) is not int or not 0 <= index <= 255 for index, _ in patches) or any(raw != bytes(8) for _, raw in writes) or (flags is not None and (type(flags) is not int or not 0 <= flags <= 15)):
                raise ValueError()
            return target, registers, patches, writes, flags
        except (ValueError, KeyError, TypeError):
            raise RuntimeError('TS 寄存器响应无效') from None

    def close(self):
        """关闭管道并有界回收子进程，不保存中间状态。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


def slot_indices(opcode, record, state):
    """列出该确切路径实际读取的槽位，不预读未执行的条件赋值源。"""
    if opcode in ALU:
        return {record[5], record[6]} if opcode in REGISTER_PAIR else {record[5]}
    if opcode == 14:
        return {record[4]}
    if opcode == 24:
        return {record[4], record[5]}
    if opcode in (121, 161):
        mask = MASK64 if opcode == 161 else 0xffffffff
        if state['compareLeft'] & mask == state['compareRight'] & mask:
            return {record[5]}
    return set()


class RegisterReplacement(branch_probe.BranchReplacement):
    """再替换 24 种指令，其他已验证 TS 处理器及原生调用路径继续执行。"""

    register_worker = None
    completed_counts = []

    def __init__(self, *args, **kwargs):
        """同入口别名按记录中的操作码核对，避免把共享处理器猜成单一操作码。"""
        super().__init__(*args, **kwargs)
        self.register_entries = {entry for entry, _ in HANDLERS.values()}
        self.register_counts = Counter()

    def run(self, entry, arguments=(), stop=None):
        """仅在外层候选返回时保存无数据的操作码计数，不保留额外 guest 状态。"""
        status = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and status == 0:
            self.completed_counts.append(dict(sorted(self.register_counts.items())))
        return status

    def on_instruction(self, cpu, address, size, context):
        """应用已验证的 TS 状态补丁，再进入不前进 x27 的公共派发入口。"""
        if address not in self.register_entries:
            return super().on_instruction(cpu, address, size, context)
        pointer = cpu.reg_read(UC_ARM64_REG_X27)
        record = bytes(cpu.mem_read(pointer, 16))
        opcode = struct.unpack_from('<I', record)[0]
        if opcode not in HANDLERS or HANDLERS[opcode][0] != address:
            raise RuntimeError('寄存器操作码与实际入口不符')
        state = {'pc': pointer, 'compareLeft': cpu.reg_read(UC_ARM64_REG_X12), 'compareRight': cpu.reg_read(UC_ARM64_REG_X13), 'context': cpu.reg_read(UC_ARM64_REG_X28)}
        slots = cpu.reg_read(UC_ARM64_REG_X24)
        values = {index: struct.unpack('<Q', cpu.mem_read(slots + index * 8, 8))[0] for index in slot_indices(opcode, record, state)}
        target, registers, patches, writes, flags = self.register_worker.calculate(record, values, state)
        if not any(start <= target and target + 3 <= end and permission & UC_PROT_READ for start, end, permission in self.memory_regions):
            raise RuntimeError('寄存器指令目标不在映射内存中')
        patches_as_bytes = [(slots + index * 8, struct.pack('<Q', value)) for index, value in patches]
        for location, raw in [*writes, *patches_as_bytes]:
            if not any(start <= location and location + len(raw) - 1 <= end and permission & UC_PROT_WRITE for start, end, permission in self.memory_regions):
                raise RuntimeError('寄存器指令写入超出 guest 可写内存')
        for location, raw in writes:
            cpu.mem_write(location, raw)
        for location, raw in patches_as_bytes:
            cpu.mem_write(location, raw)
        for key, value in registers.items():
            cpu.reg_write(REGISTERS[key], value)
        if flags is not None:
            cpu.reg_write(UC_ARM64_REG_NZCV, flags << 28)
        cpu.reg_write(UC_ARM64_REG_X27, target)
        self.register_counts[opcode] += 1
        cpu.reg_write(UC_ARM64_REG_PC, 0x102a2ada8)


def verify_native_vectors(data, worker):
    """以公开边界数据直接核对原生状态，覆盖移位掩码、除零、回绕及条件赋值。"""
    probe = NativeProbe(data)
    slots, pointer, context, table = (probe.stack + offset for offset in (0x100, 0x1800, 0x4000, 0x5000))
    values = (0, 1, 31, 32, 63, 64, 65, 0x7fffffff, 0x80000000, 0x100000000, 0x7fffffffffffffff, 0x8000000000000000, MASK64)
    count = 0
    for opcode, (entry, dispatch) in HANDLERS.items():
        if opcode in ALU:
            cases = itertools.product(values, values, (1, 2, 3))
        elif opcode in CONDITIONAL:
            cases = itertools.product(values, values, (1, 2))
        elif opcode in (14, 24):
            cases = itertools.product(values, values, (2,))
        elif opcode in (15, 26):
            cases = (((offset & MASK64), 0, 0) for offset in (-3, -1, 0, 1, 3))
        else:
            cases = ((value, 0, 0) for value in values)
        for left, right, destination in cases:
            immediate = left if opcode in (5, 9, 15, 25, 26, 131) else right
            raw = struct.pack('<I4BQ', opcode, 0, 1, destination if opcode in CONDITIONAL else 2, destination, immediate)
            initial_slots = [0x1122334455667788] * 32
            if opcode in ALU:
                initial_slots[1], initial_slots[2] = left, right
            elif opcode in (14, 24):
                initial_slots[0], initial_slots[1] = left, right
            initial_registers = {'x0': 0xa5, 'x1': 0xb6, 'x2': 0xc7, 'x12': left, 'x13': right}
            state = {'pc': pointer, 'compareLeft': left, 'compareRight': right, 'context': context}
            probe.cpu.mem_write(pointer - 64, bytes(160))
            probe.cpu.mem_write(pointer, raw)
            probe.cpu.mem_write(slots, struct.pack('<32Q', *initial_slots))
            probe.cpu.mem_write(context, b'\xa5' * 64)
            probe.cpu.reg_write(UC_ARM64_REG_X20, table)
            probe.cpu.reg_write(UC_ARM64_REG_X24, slots)
            probe.cpu.reg_write(UC_ARM64_REG_X27, pointer)
            probe.cpu.reg_write(UC_ARM64_REG_X28, context)
            for key, value in initial_registers.items():
                probe.cpu.reg_write(REGISTERS[key], value)
            probe.cpu.reg_write(UC_ARM64_REG_NZCV, 0xa0000000)
            stops = {dispatch, 0x102a2adc0} if opcode in CONDITIONAL else {dispatch}

            def stop_at_dispatch(cpu, address, size, hook_context):
                """在原生派发写回前中止，允许目标指回当前记录而不再次执行。"""
                if address in stops:
                    cpu.emu_stop()

            hook = probe.cpu.hook_add(UC_HOOK_CODE, stop_at_dispatch)
            try:
                probe.cpu.emu_start(entry, probe.stop, count=64)
            finally:
                probe.cpu.hook_del(hook)
            if probe.cpu.reg_read(UC_ARM64_REG_PC) not in stops:
                raise RuntimeError('原生寄存器指令未到达派发边界')
            sparse = {index: initial_slots[index] for index in slot_indices(opcode, raw, state)}
            target, register_patches, patches, writes, flags = worker.calculate(raw, sparse, state)
            expected_slots = initial_slots.copy()
            expected_context = bytearray(b'\xa5' * 64)
            for index, value in patches:
                expected_slots[index] = value
            for address, content in writes:
                offset = address - context
                if not 0 <= offset <= 56:
                    raise RuntimeError('公开向量的上下文写入越界')
                expected_context[offset:offset + len(content)] = content
            expected_registers = {**initial_registers, **register_patches}
            if target != probe.cpu.reg_read(UC_ARM64_REG_X27) or bytes(probe.cpu.mem_read(slots, 256)) != struct.pack('<32Q', *expected_slots) or bytes(probe.cpu.mem_read(context, 64)) != bytes(expected_context) or any(probe.cpu.reg_read(REGISTERS[key]) != value for key, value in expected_registers.items()) or probe.cpu.reg_read(UC_ARM64_REG_NZCV) >> 28 != (10 if flags is None else flags):
                raise RuntimeError('TS 寄存器、槽位、内存或标志与原生不一致')
            count += 1
    return count


def compare(sample, compiled_register, compiled_branch, compiled_memory, compiled_scalar, compiled_aes, node):
    """复用已验证的四次独立初始化流程，加入寄存器替换并检查全部 24 种覆盖。"""
    worker = RegisterWorker(compiled_register, node)
    RegisterReplacement.completed_counts = []
    try:
        vectors = verify_native_vectors(read_binary(sample), worker)
        with patch.object(RegisterReplacement, 'register_worker', worker), patch.object(branch_probe, 'BranchReplacement', RegisterReplacement):
            result = branch_probe.compare(sample, compiled_branch, compiled_memory, compiled_scalar, compiled_aes, node)
        if len(RegisterReplacement.completed_counts) != 2 or any(set(counts) != set(HANDLERS) for counts in RegisterReplacement.completed_counts):
            raise RuntimeError('真实流程未覆盖全部 24 种新指令')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), RegisterReplacement.completed_counts):
            report.update(mode='TS-register-branch-memory-scalar-AES', register_opcodes=counts, replaced_register_instructions=sum(counts.values()))
        result.update(scope='68 observed opcodes plus AES; native call/frame/exit handlers, dispatch, module expansion and SDS retained', public_native_register_vector_cases=vectors)
        return result
    finally:
        worker.close()
        RegisterReplacement.completed_counts.clear()


def main():
    """只接受固定离线样本和本地编译模块，输出无凭据的验证证据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    parser.add_argument('--portable-register', required=True)
    parser.add_argument('--portable-branch', required=True)
    parser.add_argument('--portable-memory', required=True)
    parser.add_argument('--portable-scalar', required=True)
    parser.add_argument('--portable-aes', required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    print(json.dumps(compare(args.sample, args.portable_register, args.portable_branch, args.portable_memory, args.portable_scalar, args.portable_aes, args.node), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
