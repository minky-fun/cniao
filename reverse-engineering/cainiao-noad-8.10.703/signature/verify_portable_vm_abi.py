"""对照整数复杂 ABI 的寄存器、栈和返回值，并替换真实八次封送；不导出参数。"""
import argparse
import base64
from collections import Counter
import json
from pathlib import Path
import select
import struct
import subprocess
from unittest.mock import patch

from unicorn import UC_HOOK_CODE
from unicorn.arm64_const import UC_ARM64_REG_NZCV, UC_ARM64_REG_PC, UC_ARM64_REG_SP, UC_ARM64_REG_X6, UC_ARM64_REG_X7, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, read_binary
from probe_vm import ModuleProbe
import verify_portable_vm_host as host_probe

REGISTERS = (*ARGUMENT_REGISTERS, UC_ARM64_REG_X6, UC_ARM64_REG_X7)
MASK64 = (1 << 64) - 1


class AbiWorker:
    """只通过内存管道按需读取原始字段，不提前猜测所需内存区域。"""

    def __init__(self, compiled, node):
        """载入明确本地模块，避免把异常状态或参数写入日志。"""
        source = Path(compiled).resolve(strict=True)
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('vm_abi_worker.cjs')), str(source)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def send(self, message):
        """发送一条协议消息，内容只由调用父进程处理而不落盘。"""
        self.process.stdin.write(json.dumps(message) + '\n')
        self.process.stdin.flush()

    def calculate(self, operation, cpu, **values):
        """限制交互次数、访存宽度、调用参数数量及栈补丁范围。"""
        self.send(dict(operation=operation, **values))
        writes = []
        for _ in range(4098):
            if not select.select([self.process.stdout], [], [], 15)[0]:
                raise RuntimeError('TS 复杂 ABI 计算超时')
            try:
                response = json.loads(self.process.stdout.readline(16384))
                event = response['event']
                if event == 'read':
                    address, width = int(response['address']), response['width']
                    if type(width) is not int or width not in (1, 2, 4, 8) or not 0 <= address <= MASK64 - width + 1:
                        raise ValueError()
                    raw = bytes(cpu.mem_read(address, width))
                    self.send({'bytes': base64.b64encode(raw).decode('ascii')})
                elif event == 'write':
                    address = int(response['address'])
                    raw = base64.b64decode(response['bytes'], validate=True)
                    if len(writes) >= 1 or len(raw) != 8 or not 0 <= address <= MASK64 - 7:
                        raise ValueError()
                    writes.append((address, raw))
                    self.send({'accepted': True})
                elif event == 'result':
                    if operation == 'plan':
                        plan = response['plan']
                        if len(plan['arguments']) > 8 or len(plan['stack']) > 256 or any(not 0 <= int(value) <= MASK64 for value in [plan['target'], *plan['arguments']]):
                            raise ValueError()
                        for item in plan['stack']:
                            raw = base64.b64decode(item['bytes'], validate=True)
                            if type(item['offset']) is not int or not 0 <= item['offset'] <= 2048 or len(raw) not in (1, 2, 4, 8):
                                raise ValueError()
                        if plan['result']['width'] not in (1, 2, 4, 8) or type(plan['result']['signed']) is not bool or not 0 <= int(plan['result']['address']) <= MASK64 - 7:
                            raise ValueError()
                    response['writes'] = writes
                    return response
                else:
                    raise ValueError()
            except (ValueError, KeyError, TypeError):
                raise RuntimeError('TS 复杂 ABI 响应无效') from None
        raise RuntimeError('TS 复杂 ABI 交互次数超限')

    def close(self):
        """有界关闭 worker，不保留数据或派生进程。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


def verify_native_vectors(data, worker):
    """用公开整数模式覆盖类型别名、八寄存器、扩展来源、变参及窄返回扩展。"""
    # Fixed-sample otool bindings: libffi copies argument bytes through these C imports.
    probe = ModuleProbe(data, {0x104431448: '_memcpy', 0x1044302b4: '_bzero'}, {})
    engine, root, context, descriptor, signature, overflow = (probe.stack + value for value in (0x2000, 0x3000, 0x4000, 0x5000, 0x6000, 0x7000))
    target = probe.callback + 0x600
    probe.cpu.mem_write(engine, struct.pack('<Q', root))
    observed = []
    active = {}

    def callback(cpu, address, size, unused):
        """只比较明确传入的寄存器和有效栈字节，返回固定公开位模式。"""
        if address != target:
            return
        plan = active['plan']
        assert [cpu.reg_read(register) for register in REGISTERS[:len(plan['arguments'])]] == [int(value) for value in plan['arguments']]
        sp = cpu.reg_read(UC_ARM64_REG_SP)
        for item in plan['stack']:
            raw = base64.b64decode(item['bytes'], validate=True)
            assert bytes(cpu.mem_read(sp + item['offset'], len(raw))) == raw
        observed.append(True)
        cpu.reg_write(ARGUMENT_REGISTERS[0], active['return'])
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))

    probe.cpu.hook_add(UC_HOOK_CODE, callback)
    tokens = [bytes([value]) for value in (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14)] + [bytes([value]) for value in b'cCsSiIlLxXp']
    layouts = [[token] for token in tokens] + [[b'p', b'x', b'p', b'i', b'i'], [b'i'] + [b'x'] * 6, [b'c', b'C', b's', b'S', b'i', b'I', b'x', b'X', b'c', b's', b'i', b'x']]
    patterns = (0, 0x8000000080008000, MASK64)
    returns = (b'c', b'C', b's', b'S', b'i', b'I', b'x', b'X', b'p')
    count = 0
    for layout in layouts:
        for fixed in (0, min(3, len(layout))):
            if fixed and layout == layouts[-1]:
                continue
            for pattern in patterns:
                for result_token in returns:
                    raw_context = bytearray(b'\xa5' * 0x140)
                    for index in range(6):
                        struct.pack_into('<Q', raw_context, 0x78 + index * 8, pattern)
                    struct.pack_into('<Q', raw_context, 0xa8, overflow)
                    probe.cpu.mem_write(context, bytes(raw_context))
                    probe.cpu.mem_write(overflow, struct.pack('<64Q', *([pattern] * 64)))
                    raw_descriptor = bytearray(40)
                    struct.pack_into('<Q', raw_descriptor, 8, target)
                    raw_descriptor[18] = fixed
                    struct.pack_into('<Q', raw_descriptor, 24, signature)
                    struct.pack_into('<I', raw_descriptor, 32, 1)
                    probe.cpu.mem_write(descriptor, bytes(raw_descriptor))
                    probe.cpu.mem_write(signature, result_token + b'|' + b''.join(layout) + b'\0')
                    plan = worker.calculate('plan', probe.cpu, context=str(context), descriptor=str(descriptor))['plan']
                    active.update(plan=plan, **{'return': pattern})
                    observed.clear()
                    status = probe.run(0x102a4dcf8, (engine, context, descriptor))
                    assert status == 0 and len(observed) == 1
                    result = worker.calculate('finish', probe.cpu, plan=plan, integer=str(pattern))
                    expected = bytearray(raw_context)
                    for address, raw in result['writes']:
                        expected[address - context:address - context + len(raw)] = raw
                    assert result['status'] == 0
                    actual = bytes(probe.cpu.mem_read(context, 0x140))
                    if actual != expected:
                        raise RuntimeError('公开 ABI 向量内存不符：' + json.dumps({'case': count, 'result_token': list(result_token), 'layout_tokens': [list(token) for token in layout], 'fixed': fixed, 'pattern_index': patterns.index(pattern), 'different_offsets': [index for index, (left, right) in enumerate(zip(actual, expected)) if left != right]}))
                    count += 1
    return count


class AbiReplacement(host_probe.HostReplacement):
    """将已观察到的八次复杂整数封送替换成 TS，保留真正宿主目标及其返回值。"""

    abi_worker = None
    completed_abi = []
    execution_timeout_us = 40000000

    def __init__(self, *args, **kwargs):
        """保存独立复杂 ABI 返回栈与脱敏计数。"""
        super().__init__(*args, **kwargs)
        self.abi_frames = []
        self.abi_counts = Counter()

    def run(self, entry, arguments=(), stop=None):
        """只在外层候选完成时记录计数，并要求全部临时栈帧已恢复。"""
        status = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and status == 0:
            if self.abi_frames:
                raise RuntimeError('复杂 ABI 临时栈帧未恢复')
            self.completed_abi.append(dict(self.abi_counts))
        return status

    def on_instruction(self, cpu, address, size, context):
        """按 TS 计划设置通用寄存器和对齐栈，完成后恢复原始调用栈。"""
        if address == self.callback + 0xa00:
            frame = self.abi_frames.pop()
            result = self.abi_worker.calculate('finish', cpu, plan=frame['plan'], integer=str(cpu.reg_read(ARGUMENT_REGISTERS[0])))
            self.apply_host_writes(result['writes'])
            cpu.reg_write(UC_ARM64_REG_SP, frame['stack'])
            cpu.reg_write(UC_ARM64_REG_X30, frame['return'])
            cpu.reg_write(ARGUMENT_REGISTERS[0], result['status'])
            cpu.reg_write(UC_ARM64_REG_NZCV, 6 << 28)
            cpu.reg_write(UC_ARM64_REG_PC, frame['return'])
            return
        if address != 0x102a4dcf8:
            return super().on_instruction(cpu, address, size, context)
        engine, vm_context, descriptor = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:3]]
        if not engine or not vm_context or not descriptor:
            return super().on_instruction(cpu, address, size, context)
        raw = bytes(cpu.mem_read(descriptor, 40))
        if raw[17] != 0 or struct.unpack_from('<I', raw, 36)[0] != 0 or struct.unpack_from('<Q', raw, 8)[0] == 0 or struct.unpack('<Q', cpu.mem_read(engine, 8))[0] == 0:
            return super().on_instruction(cpu, address, size, context)
        plan = self.abi_worker.calculate('plan', cpu, context=str(vm_context), descriptor=str(descriptor))['plan']
        original_sp = cpu.reg_read(UC_ARM64_REG_SP)
        length = max((item['offset'] + len(base64.b64decode(item['bytes'], validate=True)) for item in plan['stack']), default=0)
        stack = (original_sp - max(32, (length + 15) & ~15)) & MASK64
        self.abi_frames.append({'plan': plan, 'stack': original_sp, 'return': cpu.reg_read(UC_ARM64_REG_X30)})
        writes = [(stack + item['offset'], base64.b64decode(item['bytes'], validate=True)) for item in plan['stack']]
        self.apply_host_writes(writes)
        for register, value in zip(REGISTERS, plan['arguments']):
            cpu.reg_write(register, int(value))
        cpu.reg_write(UC_ARM64_REG_SP, stack)
        cpu.reg_write(UC_ARM64_REG_X30, self.callback + 0xa00)
        cpu.reg_write(UC_ARM64_REG_PC, int(plan['target']))
        self.abi_counts['integer_complex_calls'] += 1
        self.abi_counts['calls_with_stack_arguments'] += bool(plan['stack'])
        self.abi_counts['calls_with_seven_register_arguments'] += len(plan['arguments']) == 7


def compare(args):
    """独立验证 ABI 参数和返回，再核对完整候选及逐操作码次数。"""
    worker = AbiWorker(args.portable_abi, args.node)
    AbiReplacement.completed_abi = []
    try:
        vectors = verify_native_vectors(read_binary(args.sample), worker)
        with patch.object(AbiReplacement, 'abi_worker', worker), patch.object(host_probe, 'HostReplacement', AbiReplacement):
            result = host_probe.compare(args)
        if len(AbiReplacement.completed_abi) != 2:
            raise RuntimeError('复杂 ABI 替换运行次数不符')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), AbiReplacement.completed_abi):
            if counts != {'integer_complex_calls': 8, 'calls_with_stack_arguments': 7, 'calls_with_seven_register_arguments': 1} or report['host_boundary'].get('native_complex_marshalling', 0) != 0:
                raise RuntimeError('复杂 ABI 调用次数或原生边界与预期不符')
            report.update(mode='TS-integer-ABI-host-bridges-70-opcodes-AES', integer_abi=counts)
        result.update(scope='all eight observed complex integer ABI calls replaced; native call/exit handlers, host targets, initialization and module expansion retained', native_integer_abi_vector_cases=vectors, native_run_timeout_seconds=20, portable_run_timeout_seconds=40, instruction_limit=10000000)
        return result
    finally:
        worker.close()
        AbiReplacement.completed_abi.clear()


def main():
    """限制到固定样本及明确本地模块，只输出无参数数据的证据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('abi', 'host', 'frame', 'register', 'branch', 'memory', 'scalar', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    print(json.dumps(compare(parser.parse_args()), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
