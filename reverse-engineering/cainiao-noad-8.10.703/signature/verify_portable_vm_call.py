"""核对调用控制、模块范围和符号解析，并替换全部已观察操作码；原始数据只留在内存。"""
import argparse
import base64
from collections import Counter
import json
from pathlib import Path
import select
import struct
import subprocess
from unittest.mock import patch

from unicorn import UC_HOOK_CODE, UC_PROT_WRITE
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_SP, UC_ARM64_REG_X12, UC_ARM64_REG_X13, UC_ARM64_REG_X14, UC_ARM64_REG_X15, UC_ARM64_REG_D8, UC_ARM64_REG_D9, UC_ARM64_REG_X24, UC_ARM64_REG_X26, UC_ARM64_REG_X27, UC_ARM64_REG_X28, UC_ARM64_REG_X30
from probe_native import NativeProbe, ARGUMENT_REGISTERS, read_binary
import verify_portable_vm_abi as abi_probe

MASK64 = (1 << 64) - 1
ERROR_TARGET = 0x1066706f0
SPECIAL_TARGETS = [0x102a51bcc, 0x102a51afc, 0x102a51aa8, 0x102a51a3c, 0x102a51980, 0x102a518ec, 0x102a5193c]
HANDLERS = {3: 0x102a2af98, 4: 0x102a2af00, 18: 0x102a2ada0}
PRESERVED = [UC_ARM64_REG_X12, UC_ARM64_REG_X13, UC_ARM64_REG_X14, UC_ARM64_REG_X15, UC_ARM64_REG_D8, UC_ARM64_REG_D9]


class CallWorker:
    """同步访存加可重入宿主 continuation，允许真实宿主调用再次进入 VM。"""

    def __init__(self, compiled, node, runtime=None):
        """载入明确的本地模块，子进程不输出原始错误上下文。"""
        source = Path(compiled).resolve(strict=True)
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('vm_call_worker.cjs')), str(source), *([str(Path(runtime).resolve(strict=True))] if runtime is not None else [])], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def send(self, value):
        """只通过父子管道传输运行状态，绝不落盘。"""
        self.process.stdin.write(json.dumps(value) + '\n')
        self.process.stdin.flush()

    def calculate(self, cpu, operation, **values):
        """逐条验证读写宽度和写入映射，不接受任意文件或日志输出。"""
        self.send(dict(operation=operation, **values))
        for _ in range(300000):
            if not select.select([self.process.stdout], [], [], 15)[0]:
                raise RuntimeError('TS 调用控制超时')
            try:
                response = json.loads(self.process.stdout.readline(16384))
                event = response['event']
                if event == 'read':
                    address, width = int(response['address']), response['width']
                    if type(width) is not int or width not in (1, 2, 4, 8, 16, 24, 40, 4096) or not 0 <= address <= MASK64 - width + 1:
                        raise ValueError()
                    self.send({'bytes': base64.b64encode(bytes(cpu.mem_read(address, width))).decode('ascii')})
                elif event == 'write':
                    address = int(response['address'])
                    raw = base64.b64decode(response['bytes'], validate=True)
                    if not 1 <= len(raw) <= 4096 or not any(start <= address and address + len(raw) - 1 <= end and permission & UC_PROT_WRITE for start, end, permission in cpu.mem_regions()):
                        raise ValueError()
                    cpu.mem_write(address, raw)
                    self.send({'accepted': True})
                elif event == 'result':
                    return response
                else:
                    raise ValueError()
            except (KeyError, ValueError, TypeError):
                raise RuntimeError('TS 调用控制响应无效') from None
        raise RuntimeError('TS 调用控制访存次数超限')

    def close(self):
        """关闭管道并有界回收进程，不保留待执行的状态。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


def verify_native_vectors(data, worker):
    """对照原生范围查找、模块顺序、符号转换、调用入口及可变返回位置。"""
    probe = NativeProbe(data)
    root, first, second, arrays, key, context, error, slots, record = (probe.stack + value for value in (0x1000, 0x2000, 0x3000, 0x4000, 0x5000, 0x6000, 0x7000, 0x8000, 0x9000))
    modules = [root, first, second]
    for index, module in enumerate(modules):
        raw = bytearray(0x140)
        raw[16] = 1
        struct.pack_into('<Q', raw, 0x30, probe.stack + 0x10000 + index * 0x1000)
        struct.pack_into('<I', raw, 0x124, 8)
        struct.pack_into('<Q', raw, 0x128, probe.stack + 0x20000 + index * 0x1000)
        probe.cpu.mem_write(module, bytes(raw))
    probe.cpu.mem_write(arrays, struct.pack('<2Q', first, second))
    probe.cpu.mem_write(root + 0xf8, struct.pack('<Q', arrays))
    probe.cpu.mem_write(root + 0x104, struct.pack('<I', 1))
    probe.cpu.mem_write(root + 0x108, struct.pack('<Q', arrays + 8))
    probe.cpu.mem_write(root + 0x114, struct.pack('<I', 1))
    membership = find = resolve = handlers = 0
    for flags in (0, 1, 2, 3):
        for module in modules:
            for base in (probe.stack + 0x10000 + modules.index(module) * 0x1000, probe.stack + 0x20004 + modules.index(module) * 0x1000):
                for delta in (-1, 0, 3, 31, 32, 127, 128):
                    pointer = base + delta
                    probe.cpu.mem_write(key, struct.pack('<I4xQ', flags, pointer))
                    native = probe.run(0x102a4d454, (module, key))
                    portable = worker.calculate(probe.cpu, 'contains', module=str(module), flags=flags, pointer=str(pointer))['value']
                    assert native == int(portable)
                    membership += 1
                    native = probe.run(0x102a4d750, (root, key))
                    portable = worker.calculate(probe.cpu, 'find', root=str(root), flags=flags, pointer=str(pointer))['value']
                    assert native == int(portable)
                    find += 1
    for pointer in [0, *[probe.stack + 0x20000 + index * 0x1000 + offset for index in range(3) for offset in (3, 4, 5, 8, 32, 35, 36)]]:
        raw_context = b'\xa5' * 0x250
        probe.cpu.mem_write(context, raw_context)
        probe.cpu.mem_write(error, b'\xa5' * 8)
        native = probe.run(0x102a4dc60, (root, context, pointer, error))
        status = struct.unpack('<I', probe.cpu.mem_read(error, 4))[0]
        expected = bytes(probe.cpu.mem_read(context, 0x250))
        probe.cpu.mem_write(context, raw_context)
        portable = worker.calculate(probe.cpu, 'resolve', root=str(root), context=str(context), pointer=str(pointer))
        assert portable['done'] and int(portable['value']['target']) == native and portable['value']['status'] == status
        assert bytes(probe.cpu.mem_read(context, 0x250)) == expected
        resolve += 1
    helper_calls = []
    current = {}

    def callback(cpu, address, size, unused):
        """合成 helper 只返回公开目标并改写返回槽，验证 native 保存寄存器和返回选择。"""
        if address not in (0x102a4da04, 0x102a4ea64):
            return
        helper_calls.append([cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:3]])
        cpu.mem_write(slots + 0x78, struct.pack('<Q', current['return_record']))
        for register in PRESERVED:
            cpu.reg_write(register, 0xdeadbeef)
        cpu.reg_write(ARGUMENT_REGISTERS[0], current['result'])
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))

    probe.cpu.hook_add(UC_HOOK_CODE, callback)
    for opcode in (3, 4):
        for source in (0, 15, 255):
            for result in (0, record + 0x100):
                for modified in (record, record + 0x200):
                    raw_slots = bytearray(2048)
                    struct.pack_into('<Q', raw_slots, source * 8, MASK64)
                    raw_record = struct.pack('<I4BQ', opcode, source, source, 0, 0, MASK64)
                    probe.cpu.mem_write(record, raw_record + bytes(0x220))
                    probe.cpu.mem_write(slots, bytes(raw_slots))
                    probe.cpu.reg_write(UC_ARM64_REG_X24, slots)
                    probe.cpu.reg_write(UC_ARM64_REG_X27, record)
                    probe.cpu.reg_write(UC_ARM64_REG_X26, root)
                    probe.cpu.reg_write(UC_ARM64_REG_X28, context)
                    probe.cpu.reg_write(UC_ARM64_REG_SP, probe.stack + 0xfe000)
                    before_regs = [0x123400 + index for index in range(len(PRESERVED))]
                    for register, value in zip(PRESERVED, before_regs):
                        probe.cpu.reg_write(register, value)
                    current.update(result=result, return_record=modified)
                    helper_calls.clear()
                    dispatch = (0x102a2afd4 if opcode == 3 else 0x102a2af4c) if result else (0x102a2afec if opcode == 3 else 0x102a2af64)
                    probe.cpu.emu_start(HANDLERS[opcode], dispatch, count=128)
                    assert probe.cpu.reg_read(UC_ARM64_REG_PC) == dispatch and len(helper_calls) == 1
                    native_target = probe.cpu.reg_read(UC_ARM64_REG_X27)
                    expected = bytes(probe.cpu.mem_read(slots, 2048))
                    assert [probe.cpu.reg_read(register) for register in PRESERVED] == before_regs
                    probe.cpu.mem_write(slots, bytes(raw_slots))
                    portable = worker.calculate(probe.cpu, 'begin', record=base64.b64encode(raw_record).decode('ascii'), slots=str(slots), instruction=str(record))
                    assert portable['helper'] == ('descriptor' if opcode == 3 else 'indirect')
                    assert helper_calls[0] == [root, context, int(portable['operand'])]
                    probe.cpu.mem_write(slots + 0x78, struct.pack('<Q', modified))
                    target = worker.calculate(probe.cpu, 'finish', slots=str(slots), result=str(result))['value']
                    assert int(target) == native_target and bytes(probe.cpu.mem_read(slots, 2048)) == expected
                    handlers += 1
    return {'native_module_membership_cases': membership, 'native_module_search_cases': find, 'native_symbol_resolution_cases': resolve, 'native_call_handler_cases': handlers}


def verify_helper_vectors(data, worker):
    """核对描述符四种类型、暂存类型覆盖、原生展开续点和间接调用的错误路径。"""
    probe = NativeProbe(data)
    engine, root, module, table, descriptor, pending, context = (probe.stack + x for x in (0x1000, 0x1100, 0x2000, 0x3000, 0x4000, 0x5000, 0x6000))
    symbol, code, host = probe.stack + 0x8000, probe.stack + 0xa000, 0x102a51980
    events = []
    active = {}

    def callback(cpu, address, size, unused):
        """原生调用点返回公开状态；只捕获显式描述字段，不比较未初始化的栈填充。"""
        if address == 0x102a4dcf8:
            e, c, d = [cpu.reg_read(reg) for reg in ARGUMENT_REGISTERS[:3]]
            raw = bytes(cpu.mem_read(d, 40))
            events.append({'kind': 'host', 'engine': e, 'context': c, 'descriptor': raw})
            cpu.mem_write(c + 0x78, struct.pack('<Q', 0x123456789abcdef0))
            cpu.reg_write(ARGUMENT_REGISTERS[0], active['status'])
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
        elif address == 0x102a5a97c:
            m = cpu.reg_read(ARGUMENT_REGISTERS[0])
            events.append({'kind': 'expand', 'module': m})
            cpu.mem_write(m + 16, b'\x01')
            cpu.reg_write(ARGUMENT_REGISTERS[0], 0)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))

    probe.cpu.hook_add(UC_HOOK_CODE, callback)
    cases = []
    for kind in range(5):
        for p in (False, True):
            for status in ((0, 7, 22) if kind == 1 else (0,)):
                for expanded in ((False, True) if kind in (0, 2, 3) else (True,)):
                    cases.append(('descriptor', kind, p, status, expanded, None))
    for ptr in (symbol + 4, symbol + 8, 0, host, host + 4):
        for p in (False, True):
            for status in (0, 7, 22):
                cases.append(('indirect', 1, p, status, True, ptr))
    count = 0
    for helper, kind, has_pending, status, expanded, ptr in cases:
        probe.cpu.mem_write(engine, bytes(0x6500))
        probe.cpu.mem_write(engine, struct.pack('<Q', root))
        probe.cpu.mem_write(root, struct.pack('<Q', module))
        probe.cpu.mem_write(module + 16, bytes([int(expanded)]))
        probe.cpu.mem_write(module + 0x30, struct.pack('<Q', code))
        probe.cpu.mem_write(module + 0x98, struct.pack('<Q', table))
        probe.cpu.mem_write(module + 0x124, struct.pack('<I', 16))
        probe.cpu.mem_write(module + 0x128, struct.pack('<Q', symbol))
        probe.cpu.mem_write(context, b'\xa5' * 0x250)
        probe.cpu.mem_write(context + 8, struct.pack('<Q', code))
        probe.cpu.mem_write(context + 16, struct.pack('<Q', pending if has_pending else 0))
        probe.cpu.mem_write(pending, b'\0\x02\x03\0i|ppp\0')
        raw = bytearray(40)
        struct.pack_into('<Q', raw, 8, host)
        raw[17] = 1
        struct.pack_into('<Q', raw, 24, pending + 4)
        struct.pack_into('<II', raw, 32, 2, 3)
        probe.cpu.mem_write(descriptor, bytes(raw))
        target = descriptor if kind in (1, 3) else symbol + 8
        if kind == 3:
            probe.cpu.mem_write(descriptor + 8, struct.pack('<Q', symbol + 8))
        probe.cpu.mem_write(table, struct.pack('<I4xQ', kind, target))
        before = bytes(probe.cpu.mem_read(engine, 0x6500))
        operand = (1 << 32) if helper == 'descriptor' else ptr
        active['status'] = status
        events.clear()
        native = probe.run(0x102a4da04 if helper == 'descriptor' else 0x102a4ea64, (engine, context, operand))
        expected = bytes(probe.cpu.mem_read(engine, 0x6500))
        probe.cpu.mem_write(engine, before)
        response = worker.calculate(probe.cpu, 'call', helper=helper, engine=str(engine), context=str(context), operand=str(operand), errorTarget=str(ERROR_TARGET), specialTargets=[str(x) for x in SPECIAL_TARGETS])
        position = 0
        while not response['done']:
            assert position < len(events), ('unexpected TS yield', helper, kind)
            event = events[position]
            position += 1
            request = response['request']
            assert request['kind'] == event['kind']
            if event['kind'] == 'host':
                assert [int(request[key]) for key in ('engine', 'context')] == [event[key] for key in ('engine', 'context')]
                raw = base64.b64decode(request['descriptor'], validate=True)
                # Native indirect descriptors leave unused padding uninitialized; compare every consumed field.
                for a, b in ((8, 19), (24, 40)):
                    assert raw[a:b] == event['descriptor'][a:b], (helper, kind, a)
                probe.cpu.mem_write(context + 0x78, struct.pack('<Q', 0x123456789abcdef0))
                reply = status
            else:
                assert int(request['module']) == event['module']
                probe.cpu.mem_write(event['module'] + 16, b'\x01')
                reply = 0
            response = worker.calculate(probe.cpu, 'resume', id=response['id'], status=reply)
        assert position == len(events) and int(response['value']) == native, (helper, kind, 'result')
        actual = bytes(probe.cpu.mem_read(engine, 0x6500))
        assert actual == expected, (helper, kind, has_pending, status, ptr, 'memory', [(hex(i),a,b) for i,(a,b) in enumerate(zip(actual,expected)) if a != b][:10])
        count += 1
    return count


class CallReplacement(abi_probe.AbiReplacement):
    """替换调用处理器及其控制助手，真实宿主和需要的模块展开仍显式原生执行。"""

    call_worker = None
    completed_calls = []

    def __init__(self, *args, **kwargs):
        """保存每层真实宿主续点、原生保留寄存器及公开计数。"""
        super().__init__(*args, **kwargs)
        self.call_frames = []
        self.call_counts = Counter()

    def run(self, entry, arguments=(), stop=None):
        """候选完成时要求所有宿主续点已经收回，不把悬挂调用当成成功。"""
        status = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and status == 0:
            if self.call_frames:
                raise RuntimeError('调用控制续点未恢复')
            self.completed_calls.append(dict(self.call_counts))
        return status

    def continue_call(self, frame, response):
        """处理 TS 明确提出的宿主/展开请求，或恢复 handler 后的下一条 VM 指令。"""
        cpu = self.cpu
        if response['done']:
            result = int(response['value'])
            target = int(self.call_worker.calculate(cpu, 'finish', slots=str(frame['slots']), result=str(result))['value'])
            for register, value in zip(PRESERVED, frame['preserved']):
                cpu.reg_write(register, value)
            cpu.reg_write(UC_ARM64_REG_SP, frame['stack'])
            cpu.reg_write(UC_ARM64_REG_X30, frame['return'])
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_X27, target)
            cpu.reg_write(UC_ARM64_REG_PC, 0x102a2ada8)
            return
        request = response['request']
        frame['id'] = response['id']
        self.call_frames.append(frame)
        cpu.reg_write(UC_ARM64_REG_X30, self.callback + 0xc00)
        if request['kind'] == 'host':
            raw = base64.b64decode(request['descriptor'], validate=True)
            if len(raw) != 40:
                raise RuntimeError('调用控制宿主描述符宽度无效')
            stack = frame['stack'] - 0x80
            self.apply_host_writes([(stack, raw)])
            cpu.reg_write(UC_ARM64_REG_SP, stack)
            for register, value in zip(ARGUMENT_REGISTERS, (int(request['engine']), int(request['context']), stack)):
                cpu.reg_write(register, value)
            cpu.reg_write(UC_ARM64_REG_PC, 0x102a4dcf8)
            self.call_counts['host_yields'] += 1
        elif request['kind'] == 'expand':
            cpu.reg_write(ARGUMENT_REGISTERS[0], int(request['module']))
            cpu.reg_write(UC_ARM64_REG_PC, 0x102a5a97c)
            self.call_counts['native_module_expansion_yields'] += 1
        else:
            raise RuntimeError('调用控制出现未知外部依赖')

    def on_instruction(self, cpu, address, size, context):
        """在 opcode 边界暂停并由 TS 选择真实目标；退出只进入原有解释器 ABI 还原尾声。"""
        if address == self.callback + 0xc00:
            frame = self.call_frames.pop()
            response = self.call_worker.calculate(cpu, 'resume', id=frame['id'], status=cpu.reg_read(ARGUMENT_REGISTERS[0]))
            return self.continue_call(frame, response)
        if address not in HANDLERS.values():
            return super().on_instruction(cpu, address, size, context)
        pointer = cpu.reg_read(UC_ARM64_REG_X27)
        record = bytes(cpu.mem_read(pointer, 16))
        opcode = struct.unpack_from('<I', record)[0]
        if HANDLERS.get(opcode) != address:
            raise RuntimeError('调用操作码与入口不符')
        slots = cpu.reg_read(UC_ARM64_REG_X24)
        plan = self.call_worker.calculate(cpu, 'begin', record=base64.b64encode(record).decode('ascii'), slots=str(slots), instruction=str(pointer))
        self.call_counts[str(opcode)] += 1
        if plan['helper'] == 'exit':
            cpu.reg_write(UC_ARM64_REG_PC, 0x102a2ad70)
            return
        frame = {'slots': slots, 'stack': cpu.reg_read(UC_ARM64_REG_SP), 'return': cpu.reg_read(UC_ARM64_REG_X30), 'preserved': [cpu.reg_read(register) for register in PRESERVED]}
        response = self.call_worker.calculate(cpu, 'call', helper=plan['helper'], engine=str(cpu.reg_read(UC_ARM64_REG_X26)), context=str(cpu.reg_read(UC_ARM64_REG_X28)), operand=plan['operand'], errorTarget=str(ERROR_TARGET), specialTargets=[str(value) for value in SPECIAL_TARGETS])
        self.continue_call(frame, response)


def compare(args):
    """复核独立原生边界，再联合全部操作码及 ABI/AES 对照两组候选与逐项次数。"""
    worker = CallWorker(args.portable_call, args.node)
    CallReplacement.completed_calls = []
    try:
        data = read_binary(args.sample)
        vectors = verify_native_vectors(data, worker)
        vectors['native_call_helper_cases'] = verify_helper_vectors(data, worker)
        with patch.object(CallReplacement, 'call_worker', worker), patch.object(abi_probe, 'AbiReplacement', CallReplacement):
            result = abi_probe.compare(args)
        if len(CallReplacement.completed_calls) != 2:
            raise RuntimeError('调用控制对照次数不符')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), CallReplacement.completed_calls):
            if any(counts.get(str(opcode)) != expected for opcode, expected in ((3, 2191), (4, 244), (18, 76))):
                raise RuntimeError('调用/退出操作码次数与原生不符')
            report.update(mode='TS-73-opcodes-call-control-integer-ABI-host-bridges-AES', call_control=counts)
        result.update(scope='all 73 observed opcode semantics and call helper control replaced; interpreter entry/dispatch/ABI exit, actual host targets and initial module setup still native', **vectors)
        return result
    finally:
        worker.close()
        CallReplacement.completed_calls.clear()


def main():
    """限定固定样本及明确本地模块，只输出无签名值或运行数据的验证结果。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('call', 'abi', 'host', 'frame', 'register', 'branch', 'memory', 'scalar', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    print(json.dumps(compare(parser.parse_args()), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
