"""验证宿主 ABI 计划、返回位模式和待调用描述符，不导出候选、参数或内存。"""
import argparse
import base64
from collections import Counter
import json
import itertools
from pathlib import Path
import select
import struct
import subprocess
from unittest.mock import patch

from unicorn import UC_HOOK_CODE, UC_PROT_WRITE
from unicorn.arm64_const import UC_ARM64_REG_D0, UC_ARM64_REG_NZCV, UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, NativeProbe, read_binary
import verify_portable_vm_frame as frame_probe

MASK64 = (1 << 64) - 1


class HostWorker:
    """仅在管道内传递有界区域、调用计划和寄存器位模式。"""

    def __init__(self, compiled, node):
        """载入明确本地模块，错误诊断不包含 guest 数据。"""
        source = Path(compiled).resolve(strict=True)
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('vm_host_worker.cjs')), str(source)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def calculate(self, operation, ranges, **values):
        """验证返回补丁始终位于输入区域，只允许四或八字节写入。"""
        request = dict(operation=operation, ranges=[{'address': str(address), 'bytes': base64.b64encode(raw).decode('ascii')} for address, raw in ranges], **values)
        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()
        if not select.select([self.process.stdout], [], [], 15)[0]:
            raise RuntimeError('TS 宿主边界计算超时')
        try:
            response = json.loads(self.process.stdout.readline(8192))
            if 'error' in response:
                raise ValueError()
            writes = [(int(item['address']), base64.b64decode(item['bytes'], validate=True)) for item in response['writes']]
            if len(writes) > 1 or any(len(raw) not in (4, 8) or not any(start <= address and address + len(raw) <= start + len(data) for start, data in ranges) for address, raw in writes):
                raise ValueError()
            response['writes'] = writes
            if operation in ('plan', 'dispatch'):
                plan = response['plan']
                if plan['kind'] == 'call':
                    operands = [int(plan['target']), *(int(value) for value in plan['arguments'])]
                    if len(plan['arguments']) not in (2, 6) or any(not 0 <= value <= MASK64 for value in operands):
                        raise ValueError()
                    if 'result' in plan and (plan['result']['width'] not in (4, 8) or plan['result']['source'] not in ('integer', 'floating') or not 0 <= int(plan['result']['address']) <= MASK64):
                        raise ValueError()
                elif plan['kind'] not in ('return', 'marshal'):
                    raise ValueError()
            return response
        except (ValueError, KeyError, TypeError):
            raise RuntimeError('TS 宿主边界响应无效') from None

    def close(self):
        """有界关闭 worker，不持久化任何 guest 状态。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


def verify_native_vectors(data, worker):
    """以公开合成回调复核全部简单选择器、浮点位模式、空指针和描述符开关。"""
    probe = NativeProbe(data)
    engine, root, descriptor, context = (probe.stack + offset for offset in (0x2000, 0x3000, 0x4000, 0x5000))
    target = probe.callback + 0x500
    invoked = []
    return_bits = [0, 0]

    def callback(cpu, address, size, unused):
        """合成宿主返回明确的整数和浮点寄存器位，不替代任何真实签名函数。"""
        if address == target:
            invoked.append([cpu.reg_read(register) for register in ARGUMENT_REGISTERS])
            cpu.reg_write(ARGUMENT_REGISTERS[0], return_bits[0])
            cpu.reg_write(UC_ARM64_REG_D0, return_bits[1])
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))

    probe.cpu.hook_add(UC_HOOK_CODE, callback)
    count = 0
    for flag, selector in [(0, value) for value in (1, 2, 3, 4, 5, 6, 0xffffffff)] + [(value, 0xffffffff) for value in (1, 2, 255)]:
        for integer in (0, 1, 0x8000000000000000, MASK64):
            for floating in (0, 0x8000000000000000, 0x7ff8000000000001, MASK64):
                probe.cpu.mem_write(engine, struct.pack('<Q', root))
                probe.cpu.mem_write(root, bytes(32))
                raw = bytearray(40)
                struct.pack_into('<Q', raw, 8, target)
                raw[17] = flag
                struct.pack_into('<I', raw, 36, selector)
                probe.cpu.mem_write(descriptor, bytes(raw))
                raw = bytearray(b'\xa5' * 0x140)
                args = [0, 1, 0x8000000000000000, MASK64, 9, 10]
                struct.pack_into('<6Q', raw, 0x78, *args)
                probe.cpu.mem_write(context, bytes(raw))
                ranges = [(engine, struct.pack('<Q', root)), (descriptor, bytes(probe.cpu.mem_read(descriptor, 40))), (context, bytes(raw))]
                plan = worker.calculate('plan', ranges, engine=str(engine), context=str(context), descriptor=str(descriptor))['plan']
                invoked.clear()
                return_bits[:] = [integer, floating]
                status = probe.run(0x102a4dcf8, (engine, context, descriptor))
                expected = bytearray(raw)
                if plan['kind'] == 'return':
                    assert status == plan['status'] == 22 and not invoked
                else:
                    assert plan['kind'] == 'call' and len(invoked) == 1 and int(plan['target']) == target
                    actual = invoked[0][:2] if flag else invoked[0]
                    assert actual == [int(value) for value in plan['arguments']]
                    result = worker.calculate('finish', ranges, plan=plan, integer=str(integer), floating=str(floating))
                    assert result['status'] == status == 0
                    for address, value in result['writes']:
                        expected[address - context:address - context + len(value)] = value
                assert bytes(probe.cpu.mem_read(context, 0x140)) == expected
                count += 1
    for missing in ('engine', 'context', 'descriptor', 'root', 'target'):
        probe.cpu.mem_write(engine, struct.pack('<Q', 0 if missing == 'root' else root))
        raw = bytearray(40)
        struct.pack_into('<Q', raw, 8, 0 if missing == 'target' else target)
        probe.cpu.mem_write(descriptor, bytes(raw))
        values = {'engine': engine, 'context': context, 'descriptor': descriptor}
        if missing in values:
            values[missing] = 0
        ranges = [(engine, bytes(probe.cpu.mem_read(engine, 8))), (descriptor, bytes(raw))]
        plan = worker.calculate('plan', ranges, **{key: str(value) for key, value in values.items()})['plan']
        invoked.clear()
        assert probe.run(0x102a4dcf8, tuple(values.values())) == plan['status'] == 7 and not invoked
        count += 1
    thunk_count = 0
    for engine_present in (False, True):
        for context_present in (False, True):
            for root_present in (False, True):
                for mode in (0, 1, 0xffffffff):
                    for pending in (0, 1, MASK64):
                        probe.cpu.mem_write(engine, struct.pack('<Q', root if root_present else 0))
                        raw_root = bytearray(32)
                        struct.pack_into('<I', raw_root, 24, mode)
                        probe.cpu.mem_write(root, bytes(raw_root))
                        raw = bytearray(b'\xa5' * 0x140)
                        struct.pack_into('<Q', raw, 0x78, pending)
                        probe.cpu.mem_write(context, bytes(raw))
                        ranges = [(engine, bytes(probe.cpu.mem_read(engine, 8))), (root, bytes(raw_root)), (context, bytes(raw))]
                        arguments = (engine if engine_present else 0, context if context_present else 0)
                        result = worker.calculate('thunk', ranges, engine=str(arguments[0]), context=str(arguments[1]))
                        probe.run(0x102a53b74, arguments)
                        expected = bytearray(raw)
                        for address, value in result['writes']:
                            expected[address - context:address - context + len(value)] = value
                        assert bytes(probe.cpu.mem_read(context, 0x140)) == expected
                        thunk_count += 1
    common_count = 0
    table = 0x105531300
    probe.cpu.mem_write(table, struct.pack('<64Q', *(0x1234000000000000 + index for index in range(64))))
    for index in range(64):
        for high_bits in (0, 0xffffffff00000000):
            operand = high_bits | index
            location = table + index * 8
            result = worker.calculate('common', [(location, bytes(probe.cpu.mem_read(location, 8)))], index=str(operand), table=str(table))
            assert int(result['value']) == probe.run(0x102a8ea08, (operand,))
            assert not result['writes']
            common_count += 1
    storage = 0x1068f5e40
    request, error = probe.stack + 0x7000, probe.stack + 0x8000
    probe.cpu.mem_write(storage, struct.pack('<Q', root))
    probe.cpu.mem_write(root + 16, struct.pack('<Q', target))
    return_bits[:] = [0x123456789abcdef0, 0]
    dispatch_count = 0
    values = (0, 1, 0x7fffffff, 0x80000000, 0xffffffff, 0x8000000000000000, 0xffffffff00000001)
    for ids in [None, *itertools.product(values, repeat=3)]:
        for error_pointer in (0, error):
            raw = struct.pack('<5Q', *(ids if ids is not None else (0, 0, 0)), 0xaabbccdd00000001, MASK64)
            probe.cpu.mem_write(request, raw)
            probe.cpu.mem_write(error, b'\xa5' * 8)
            pointer = request if ids is not None else 0
            ranges = [(storage, struct.pack('<Q', root)), (root, bytes(probe.cpu.mem_read(root, 32))), (request, raw), (error, b'\xa5' * 8)]
            result = worker.calculate('dispatch', ranges, request=str(pointer), error=str(error_pointer), storage=str(storage))
            invoked.clear()
            native_result = probe.run(0x102a8e9a0, (pointer, error_pointer))
            plan = result['plan']
            expected = bytearray(b'\xa5' * 8)
            for address, raw_write in result['writes']:
                expected[address - error:address - error + len(raw_write)] = raw_write
            assert bytes(probe.cpu.mem_read(error, 8)) == expected
            if plan['kind'] == 'return':
                assert native_result == int(plan['value']) == 0 and not invoked
            else:
                assert native_result == return_bits[0] and int(plan['target']) == target
                assert len(invoked) == 1 and invoked[0] == [int(value) for value in plan['arguments']]
            dispatch_count += 1
    return {'native_host_abi_cases': count, 'native_pending_descriptor_cases': thunk_count, 'native_common_function_cases': common_count, 'native_dispatch_bridge_cases': dispatch_count}


class HostReplacement(frame_probe.FrameReplacement):
    """替换简单 ABI 助手及描述符设置函数；真实宿主函数仍通过有界原生桥执行。"""

    host_worker = None
    completed_hosts = []

    def __init__(self, *args, **kwargs):
        """创建独立返回栈，避免在指令钩子中递归启动 Unicorn。"""
        super().__init__(*args, **kwargs)
        self.host_frames = []
        self.host_counts = Counter()

    def apply_host_writes(self, writes):
        """应用经过 worker 验证且位于 guest 可写映射的精确补丁。"""
        for address, raw in writes:
            if not any(start <= address and address + len(raw) - 1 <= end and permissions & UC_PROT_WRITE for start, end, permissions in self.memory_regions):
                raise RuntimeError('宿主返回补丁超出可写映射')
            self.cpu.mem_write(address, raw)

    def run(self, entry, arguments=(), stop=None):
        """仅报告各运行模式共有的宿主诊断；候选完成后保存次数并检查返回帧。"""
        try:
            status = super().run(entry, arguments, stop)
        except RuntimeError:
            pc = self.cpu.reg_read(UC_ARM64_REG_PC)
            location = hex(pc) if 0x100000000 <= pc < 0x107000000 else 'outside-image'
            raise RuntimeError('宿主替换执行未完成：' + json.dumps({'code': location, 'counts': dict(self.host_counts), 'pending_frames': len(self.host_frames)})) from None
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and status == 0:
            if self.host_frames:
                raise RuntimeError('宿主返回帧未清空')
            self.completed_hosts.append(dict(self.host_counts))
        return status

    def on_instruction(self, cpu, address, size, context):
        """由 TS 选择参数和返回槽，原生目标执行完成后回到独立 continuation。"""
        if address == 0x102a8e9a0:
            request, error = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:2]]
            storage = 0x1068f5e40
            raw = bytes(cpu.mem_read(storage, 8))
            root = struct.unpack('<Q', raw)[0]
            ranges = [(storage, raw), (root, bytes(cpu.mem_read(root, 24)))]
            if request:
                ranges.append((request, bytes(cpu.mem_read(request, 40))))
            if error:
                ranges.append((error, bytes(cpu.mem_read(error, 4))))
            result = self.host_worker.calculate('dispatch', ranges, request=str(request), error=str(error), storage=str(storage))
            self.apply_host_writes(result['writes'])
            plan = result['plan']
            self.host_counts['command_dispatch_bridge'] += 1
            if plan['kind'] == 'return':
                cpu.reg_write(ARGUMENT_REGISTERS[0], int(plan['value']))
                cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            else:
                for register, value in zip(ARGUMENT_REGISTERS, plan['arguments']):
                    cpu.reg_write(register, int(value))
                cpu.reg_write(UC_ARM64_REG_PC, int(plan['target']))
            return
        if address == 0x102a8ea08:
            index = cpu.reg_read(ARGUMENT_REGISTERS[0])
            table = 0x105531300
            location = table + (index & 0xffffffff) * 8
            result = self.host_worker.calculate('common', [(location, bytes(cpu.mem_read(location, 8)))], index=str(index), table=str(table))
            value = int(result['value'])
            if not 0 <= value <= MASK64:
                raise RuntimeError('公共函数表返回值超出 uint64')
            cpu.reg_write(ARGUMENT_REGISTERS[0], value)
            self.host_counts['common_function_lookup'] += 1
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        if address == self.callback + 0x800:
            frame = self.host_frames.pop()
            ranges = [(frame['context'], bytes(cpu.mem_read(frame['context'], 0x140)))]
            result = self.host_worker.calculate('finish', ranges, plan=frame['plan'], integer=str(cpu.reg_read(ARGUMENT_REGISTERS[0])), floating=str(cpu.reg_read(UC_ARM64_REG_D0)))
            self.apply_host_writes(result['writes'])
            cpu.reg_write(ARGUMENT_REGISTERS[0], result['status'])
            cpu.reg_write(UC_ARM64_REG_NZCV, 6 << 28)
            cpu.reg_write(UC_ARM64_REG_X30, frame['return'])
            cpu.reg_write(UC_ARM64_REG_PC, frame['return'])
            return
        if address == 0x102a53b74:
            engine, vm_context = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:2]]
            ranges = []
            if engine:
                raw = bytes(cpu.mem_read(engine, 8))
                ranges.append((engine, raw))
                root = struct.unpack('<Q', raw)[0]
                if root:
                    ranges.append((root, bytes(cpu.mem_read(root, 28))))
            if vm_context:
                ranges.append((vm_context, bytes(cpu.mem_read(vm_context, 0x140))))
            result = self.host_worker.calculate('thunk', ranges, engine=str(engine), context=str(vm_context))
            self.apply_host_writes(result['writes'])
            self.host_counts['pending_descriptor'] += 1
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        if address != 0x102a4dcf8:
            return super().on_instruction(cpu, address, size, context)
        engine, vm_context, descriptor = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:3]]
        ranges = []
        for start, length in ((engine, 8), (vm_context, 0x140), (descriptor, 40)):
            if start:
                ranges.append((start, bytes(cpu.mem_read(start, length))))
        plan = self.host_worker.calculate('plan', ranges, engine=str(engine), context=str(vm_context), descriptor=str(descriptor))['plan']
        if plan['kind'] == 'marshal':
            self.host_counts['native_complex_marshalling'] += 1
            return super().on_instruction(cpu, address, size, context)
        if plan['kind'] == 'return':
            self.host_counts['guard_return'] += 1
            cpu.reg_write(ARGUMENT_REGISTERS[0], plan['status'])
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        self.host_counts['simple_abi'] += 1
        self.host_frames.append({'context': vm_context, 'return': cpu.reg_read(UC_ARM64_REG_X30), 'plan': plan})
        for register, value in zip(ARGUMENT_REGISTERS, plan['arguments']):
            cpu.reg_write(register, int(value))
        cpu.reg_write(UC_ARM64_REG_X30, self.callback + 0x800)
        cpu.reg_write(UC_ARM64_REG_PC, int(plan['target']))


def compare(args):
    """先做独立原生向量，再联合 70 种操作码/AES 核对候选和每种操作码次数。"""
    worker = HostWorker(args.portable_host, args.node)
    HostReplacement.completed_hosts = []
    try:
        vectors = verify_native_vectors(read_binary(args.sample), worker)
        with patch.object(HostReplacement, 'host_worker', worker), patch.object(frame_probe, 'FrameReplacement', HostReplacement):
            result = frame_probe.compare(args.sample, args.portable_frame, args.portable_register, args.portable_branch, args.portable_memory, args.portable_scalar, args.portable_aes, args.node)
        if len(HostReplacement.completed_hosts) != 2:
            raise RuntimeError('宿主替换运行次数不符')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), HostReplacement.completed_hosts):
            report.update(mode='TS-host-ABI-frame-register-branch-memory-scalar-AES', host_boundary=counts)
        result.update(scope='70 opcodes, simple host ABI and pending descriptor thunk plus AES; native complex marshalling, real host targets and other native dependencies retained', **vectors)
        return result
    finally:
        worker.close()
        HostReplacement.completed_hosts.clear()


def main():
    """限定已校验样本及本地编译模块，只输出脱敏结论。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('host', 'frame', 'register', 'branch', 'memory', 'scalar', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    print(json.dumps(compare(parser.parse_args()), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
