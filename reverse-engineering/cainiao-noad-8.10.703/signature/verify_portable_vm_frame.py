"""替换真实 VM 栈帧保存/恢复，核对重叠内存及全部操作码执行次数，不导出字节。"""
import argparse
import base64
from collections import Counter
import json
from pathlib import Path
import select
import struct
import subprocess
from unittest.mock import patch

from unicorn import UC_HOOK_CODE, UC_PROT_READ, UC_PROT_WRITE
from unicorn.arm64_const import UC_ARM64_REG_NZCV, UC_ARM64_REG_PC, UC_ARM64_REG_X9, UC_ARM64_REG_X10, UC_ARM64_REG_X11, UC_ARM64_REG_X20, UC_ARM64_REG_X22, UC_ARM64_REG_X23, UC_ARM64_REG_X24, UC_ARM64_REG_X27, UC_ARM64_REG_X28
from probe_native import ARGUMENT_REGISTERS, NativeProbe, read_binary
from verify_signature_candidate import CaptureProbe
import verify_portable_vm_register as register_probe
from verify_portable_vm_memory import MASK64

HANDLERS = {0: (0x102a2ae58, 0x102a2aee0), 31: (0x102a2adc8, 0x102a2ae50)}
REGISTERS = {'x0': ARGUMENT_REGISTERS[0], 'x9': UC_ARM64_REG_X9, 'x10': UC_ARM64_REG_X10, 'x11': UC_ARM64_REG_X11, 'x22': UC_ARM64_REG_X22, 'x23': UC_ARM64_REG_X23}


class FrameWorker:
    """在内存管道内对两段精确 guest 区域执行 TS 顺序读写。"""

    def __init__(self, compiled, node):
        """加载本地编译模块，不将字节、寄存器或异常上下文写入日志。"""
        source = Path(compiled).resolve(strict=True)
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('vm_frame_worker.cjs')), str(source)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def calculate(self, opcode, slots, instruction, immediate, x22, x23, ranges):
        """限制输入区域及返回写入，结果只供父进程内应用或比较。"""
        request = {'opcode': opcode, 'slots': str(slots), 'instruction': str(instruction), 'immediate': str(immediate), 'x22': str(x22), 'x23': str(x23), 'ranges': [{'address': str(address), 'bytes': base64.b64encode(raw).decode('ascii')} for address, raw in ranges]}
        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()
        if not select.select([self.process.stdout], [], [], 15)[0]:
            raise RuntimeError('TS 栈帧计算超时')
        try:
            response = json.loads(self.process.stdout.readline(8192))
            target = int(response['next'])
            registers = {key: int(value) for key, value in response['registers'].items()}
            writes = [(int(item['address']), base64.b64decode(item['bytes'], validate=True)) for item in response['writes']]
            if not 0 <= target <= MASK64 or not set(registers) <= set(REGISTERS) or any(not 0 <= value <= MASK64 for value in registers.values()) or len(writes) > 16:
                raise ValueError()
            if any(not any(start <= address and address + len(raw) <= start + len(data) for start, data in ranges) or len(raw) not in (8, 16) for address, raw in writes):
                raise ValueError()
            return target, registers, writes
        except (ValueError, KeyError, TypeError):
            raise RuntimeError('TS 栈帧响应无效') from None

    def close(self):
        """关闭管道并有界回收子进程，不保留 guest 数据。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


class FrameReplacement(register_probe.RegisterReplacement):
    """同时替换已验证的 70 种操作码，调用和退出处理器仍原生执行。"""

    frame_worker = None
    completed_frames = []

    def __init__(self, *args, **kwargs):
        """保存精确栈帧入口和独立计数，不修改原生 VM 状态布局。"""
        super().__init__(*args, **kwargs)
        self.frame_entries = {entry: opcode for opcode, (entry, _) in HANDLERS.items()}
        self.frame_counts = Counter()

    def run(self, entry, arguments=(), stop=None):
        """仅记录外层候选完成时的栈帧计数，不保留其原始数据。"""
        status = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and status == 0:
            self.completed_frames.append(dict(sorted(self.frame_counts.items())))
        return status

    def on_instruction(self, cpu, address, size, context):
        """按 TS 写入顺序恢复完整状态，再使用公共派发入口继续。"""
        if address not in self.frame_entries:
            return super().on_instruction(cpu, address, size, context)
        opcode = self.frame_entries[address]
        instruction = cpu.reg_read(UC_ARM64_REG_X27)
        record = bytes(cpu.mem_read(instruction, 16))
        if struct.unpack_from('<I', record)[0] != opcode:
            raise RuntimeError('栈帧操作码与入口不符')
        slots = cpu.reg_read(UC_ARM64_REG_X24)
        frame = struct.unpack('<Q', cpu.mem_read(slots + (0xf0 if opcode == 0 else 0x70), 8))[0]
        ranges = []
        for start, length in ((slots, 256), (frame, 144)):
            if not any(begin <= start and start + length - 1 <= end and permission & UC_PROT_READ for begin, end, permission in self.memory_regions):
                raise RuntimeError('栈帧区域超出 guest 可读映射')
            ranges.append((start, bytes(cpu.mem_read(start, length))))
        target, registers, writes = self.frame_worker.calculate(opcode, slots, instruction, struct.unpack_from('<Q', record, 8)[0], cpu.reg_read(UC_ARM64_REG_X22), cpu.reg_read(UC_ARM64_REG_X23), ranges)
        if not any(start <= target and target + 3 <= end and permission & UC_PROT_READ for start, end, permission in self.memory_regions):
            raise RuntimeError('栈帧返回目标不在映射内存中')
        for location, raw in writes:
            if not any(start <= location and location + len(raw) - 1 <= end and permission & UC_PROT_WRITE for start, end, permission in self.memory_regions):
                raise RuntimeError('栈帧写入超出 guest 可写映射')
        for location, raw in writes:
            cpu.mem_write(location, raw)
        for key, value in registers.items():
            cpu.reg_write(REGISTERS[key], value)
        cpu.reg_write(UC_ARM64_REG_X27, target)
        self.frame_counts[opcode] += 1
        cpu.reg_write(UC_ARM64_REG_PC, 0x102a2ada8)


def verify_native_vectors(data, worker):
    """直接比较原生保存/恢复，覆盖不重叠和两类重叠布局及全部临时寄存器。"""
    probe = NativeProbe(data)
    slots, pointer, table = (probe.stack + offset for offset in (0x1000, 0x6000, 0x7000))
    count = 0
    for opcode, (entry, dispatch) in HANDLERS.items():
        for frame in (probe.stack + 0x3000, slots + 64, slots + 128):
            for x22 in (0, 1, MASK64):
                for x23 in (0, 1, MASK64):
                    for immediate in ((0, 0x90, 0x100, (-0x90) & MASK64) if opcode == 31 else (0,)):
                        probe.cpu.mem_write(slots, b'\xa5' * 0x2100)
                        probe.cpu.mem_write(frame, struct.pack('<18Q', *(0x1234000000000000 + index for index in range(18))))
                        probe.cpu.mem_write(slots, struct.pack('<32Q', *(0x5678000000000000 + index for index in range(32))))
                        for index, value in ((14, frame), (15, pointer), (30, frame), (31, pointer)):
                            probe.cpu.mem_write(slots + index * 8, struct.pack('<Q', value))
                        probe.cpu.mem_write(pointer, struct.pack('<I4BQ', opcode, 0, 0, 0, 0, immediate) + bytes(16))
                        ranges = [(slots, bytes(probe.cpu.mem_read(slots, 256))), (frame, bytes(probe.cpu.mem_read(frame, 144)))]
                        before = bytearray(probe.cpu.mem_read(slots, 0x2100))
                        initial_registers = {'x0': 0xa5, 'x9': 0xb6, 'x10': 0xc7, 'x11': 0xd8, 'x22': x22, 'x23': x23}
                        for key, value in initial_registers.items():
                            probe.cpu.reg_write(REGISTERS[key], value)
                        probe.cpu.reg_write(UC_ARM64_REG_X20, table)
                        probe.cpu.reg_write(UC_ARM64_REG_X24, slots)
                        probe.cpu.reg_write(UC_ARM64_REG_X27, pointer)
                        probe.cpu.reg_write(UC_ARM64_REG_X28, probe.stack + 0x8000)
                        probe.cpu.reg_write(UC_ARM64_REG_NZCV, 0xa0000000)
                        probe.cpu.emu_start(entry, dispatch, count=96)
                        if probe.cpu.reg_read(UC_ARM64_REG_PC) != dispatch:
                            raise RuntimeError('原生栈帧指令未到达派发边界')
                        target, registers, writes = worker.calculate(opcode, slots, pointer, immediate, x22, x23, ranges)
                        for address, raw in writes:
                            before[address - slots:address - slots + len(raw)] = raw
                        if bytes(probe.cpu.mem_read(slots, 0x2100)) != bytes(before) or target != probe.cpu.reg_read(UC_ARM64_REG_X27) or any(probe.cpu.reg_read(REGISTERS[key]) != value for key, value in {**initial_registers, **registers}.items()) or probe.cpu.reg_read(UC_ARM64_REG_NZCV) != 0xa0000000:
                            raise RuntimeError('TS 栈帧状态或重叠读写与原生不一致')
                        count += 1
    return count


def compare(sample, compiled_frame, compiled_register, compiled_branch, compiled_memory, compiled_scalar, compiled_aes, node):
    """复用四次完整对照，另外要求全部实际处理器入口次数逐项一致。"""
    worker = FrameWorker(compiled_frame, node)
    FrameReplacement.completed_frames = []
    traces = []
    profile = json.loads(Path(__file__).with_name('vm-dispatch-profile.json').read_text())
    entries = {int(entry['handler'], 16) for entry in profile['dispatches']}
    pairs = {(entry['opcode'], int(entry['handler'], 16)) for entry in profile['dispatches']}
    original_init = NativeProbe.__init__
    original_run = CaptureProbe.run

    def initialize_trace(probe, *args, **kwargs):
        """把独立入口计数钩子放在替换钩子之前，保证被替换指令也会计数。"""
        original_init(probe, *args, **kwargs)
        probe.opcode_trace = Counter()

        def count_entry(cpu, address, size, context):
            """仅记录真实操作码与入口对应关系，不读取其参数或槽位。"""
            if address in entries:
                instruction = cpu.reg_read(UC_ARM64_REG_X27)
                opcode = struct.unpack('<I', cpu.mem_read(instruction, 4))[0]
                if (opcode, address) not in pairs:
                    raise RuntimeError('实际入口出现未核对的操作码')
                probe.opcode_trace[opcode] += 1

        probe.cpu.hook_del(probe.code_hook)
        probe.cpu.hook_add(UC_HOOK_CODE, count_entry, begin=0x102a2ada0, end=0x102a2c900)
        probe.code_hook = probe.cpu.hook_add(UC_HOOK_CODE, probe.on_instruction)

    def capture_trace(probe, entry, arguments=(), stop=None):
        """候选返回后保存脱敏次数，原始候选仍只由原有内存比较处理。"""
        status = original_run(probe, entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and status == 0:
            traces.append(dict(probe.opcode_trace))
        return status

    try:
        vectors = verify_native_vectors(read_binary(sample), worker)
        with patch.object(FrameReplacement, 'frame_worker', worker), patch.object(register_probe, 'RegisterReplacement', FrameReplacement), patch.object(NativeProbe, '__init__', initialize_trace), patch.object(CaptureProbe, 'run', capture_trace):
            result = register_probe.compare(sample, compiled_register, compiled_branch, compiled_memory, compiled_scalar, compiled_aes, node)
        if len(traces) != 4 or traces[0] != traces[1] or traces[2] != traces[3]:
            raise RuntimeError('逐操作码入口次数与原生不一致')
        if len(FrameReplacement.completed_frames) != 2 or any(set(counts) != set(HANDLERS) for counts in FrameReplacement.completed_frames):
            raise RuntimeError('真实流程未覆盖两个栈帧处理器')
        for report, trace in zip(result['runs'], traces):
            report['observed_opcode_entries'] = sum(trace.values())
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), FrameReplacement.completed_frames):
            report.update(mode='TS-frame-register-branch-memory-scalar-AES', frame_opcodes=counts, replaced_frame_instructions=sum(counts.values()))
        result.update(scope='70 observed opcodes plus AES; native call/exit handlers, dispatch, module expansion and SDS retained', public_native_frame_vector_cases=vectors, same_input_opcode_counts_equal=True, changed_input_opcode_counts_equal=True)
        return result
    finally:
        worker.close()
        FrameReplacement.completed_frames.clear()
        traces.clear()


def main():
    """仅接受固定样本和本地编译模块，输出无原始内存的验证证据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    parser.add_argument('--portable-frame', required=True)
    parser.add_argument('--portable-register', required=True)
    parser.add_argument('--portable-branch', required=True)
    parser.add_argument('--portable-memory', required=True)
    parser.add_argument('--portable-scalar', required=True)
    parser.add_argument('--portable-aes', required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    print(json.dumps(compare(args.sample, args.portable_frame, args.portable_register, args.portable_branch, args.portable_memory, args.portable_scalar, args.portable_aes, args.node), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
