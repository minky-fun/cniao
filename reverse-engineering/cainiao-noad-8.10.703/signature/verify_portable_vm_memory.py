"""将真实 VM 内存处理器替换为 TS，与已验证标量/AES 联合比较；不导出数据。"""
import argparse
import base64
from collections import Counter
import json
from pathlib import Path
import plistlib
import select
import struct
import subprocess
from unittest.mock import patch
from zipfile import ZipFile

from unicorn import UC_PROT_READ, UC_PROT_WRITE
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X24, UC_ARM64_REG_X27
import probe_sds_slice as slice_probe
from probe_native import ARGUMENT_REGISTERS, NativeProbe, read_binary
from verify_crypto_operations import AESWorker, CryptoProbe
from verify_signature_candidate import CaptureProbe
from verify_portable_aes_pipeline import ReplacementProbe
from verify_portable_vm_scalar import CombinedReplacement, ScalarReplacement, ScalarWorker

# opcode: native entry, next-fetch boundary, width; ranges are verified in vm-memory-contract.asm.
LOADS = {60: (0x102a2b74c, 0x102a2b768, 1), 62: (0x102a2b7a4, 0x102a2b7c0, 4), 63: (0x102a2b7d0, 0x102a2b7ec, 8), 67: (0x102a2b880, 0x102a2b89c, 4), 68: (0x102a2b990, 0x102a2b9a8, 1), 70: (0x102a2b9e0, 0x102a2b9f8, 4), 71: (0x102a2ba08, 0x102a2ba20, 8), 73: (0x102a2ba58, 0x102a2ba70, 1), 75: (0x102a2baa8, 0x102a2bac0, 4)}
STORES = {76: (0x102a2b8ac, 0x102a2b8cc, 1), 78: (0x102a2b90c, 0x102a2b928, 4), 79: (0x102a2b938, 0x102a2b954, 8), 81: (0x102a2bad0, 0x102a2baec, 1), 82: (0x102a2bafc, 0x102a2bb18, 2), 83: (0x102a2bb28, 0x102a2bb40, 4), 84: (0x102a2bb50, 0x102a2bb68, 8)}
HANDLERS = {**LOADS, **STORES}
MASK64 = (1 << 64) - 1


class MemoryWorker:
    """通过内存管道执行 TS 地址回绕、字节序、截断与符号扩展。"""

    def __init__(self, compiled, node):
        """只加载明确的本地 JS，丢弃诊断，防止数据进入日志。"""
        source = Path(compiled).resolve(strict=True)
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('vm_memory_worker.cjs')), str(source)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def calculate(self, opcode, base, offset, value, source):
        """对照 host 已检查的地址，只接受明确宽度的单次读或写。"""
        width = HANDLERS[opcode][2]
        request = {'opcode': opcode, 'base': str(base), 'offset': str(offset), 'value': str(value), 'address': str((base + offset) & MASK64), 'input': None if source is None else base64.b64encode(source).decode('ascii')}
        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()
        if not select.select([self.process.stdout], [], [], 15)[0]:
            raise RuntimeError('TS 内存计算超时')
        try:
            response = json.loads(self.process.stdout.readline(512))
            result = int(response['result'])
            written = None if response['written'] is None else base64.b64decode(response['written'], validate=True)
            if not 0 <= result <= MASK64 or (opcode in STORES and (written is None or len(written) != width)) or (opcode in LOADS and written is not None):
                raise ValueError()
            return result, written
        except (ValueError, KeyError, TypeError):
            raise RuntimeError('TS 内存响应无效') from None

    def close(self):
        """关闭管道并有界回收子进程，不保留输入输出。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


class MemoryReplacement(CombinedReplacement):
    """联合替换 16 种内存、六种标量与 AES，原生派发及其他处理器保持执行。"""

    memory_worker = None
    latest = None

    def __init__(self, *args, **kwargs):
        """建立精确入口和 guest 可访问区段，不猜测对象字段或分配。"""
        super().__init__(*args, **kwargs)
        self.memory_entries = {entry: opcode for opcode, (entry, _, _) in HANDLERS.items()}
        self.memory_counts = Counter()
        self.memory_regions = list(self.cpu.mem_regions())
        MemoryReplacement.latest = self

    def on_instruction(self, cpu, address, size, context):
        """通过 TS 完成内存语义并还原原生暂存寄存器，跳过原生读写处理器。"""
        if address not in self.memory_entries:
            return super().on_instruction(cpu, address, size, context)
        opcode = self.memory_entries[address]
        instruction = cpu.reg_read(UC_ARM64_REG_X27)
        raw = bytes(cpu.mem_read(instruction, 16))
        if struct.unpack_from('<I', raw)[0] != opcode:
            raise RuntimeError('内存操作码与入口不符')
        slots = cpu.reg_read(UC_ARM64_REG_X24)
        immediate = struct.unpack_from('<Q', raw, 8)[0]
        if opcode in LOADS:
            base = struct.unpack('<Q', cpu.mem_read(slots + raw[5] * 8, 8))[0] if opcode < 68 else immediate
            offset = struct.unpack('<Q', cpu.mem_read(slots + raw[6] * 8, 8))[0]
            value = 0
        else:
            base = struct.unpack('<Q', cpu.mem_read(slots + raw[6 if opcode < 81 else 7] * 8, 8))[0]
            offset = struct.unpack('<Q', cpu.mem_read(slots + raw[7] * 8, 8))[0] if opcode < 81 else immediate
            value = struct.unpack('<Q', cpu.mem_read(slots + raw[5] * 8, 8))[0]
        target = (base + offset) & MASK64
        width = HANDLERS[opcode][2]
        permission = UC_PROT_READ if opcode in LOADS else UC_PROT_WRITE
        if not any(start <= target and target + width - 1 <= end and flags & permission for start, end, flags in self.memory_regions):
            raise RuntimeError('VM 内存访问不在已映射且允许访问的区间')
        source = bytes(cpu.mem_read(target, width)) if opcode in LOADS else None
        result, written = self.memory_worker.calculate(opcode, base, offset, value, source)
        if opcode in LOADS:
            cpu.mem_write(slots + raw[7] * 8, struct.pack('<Q', result))
            cpu.reg_write(ARGUMENT_REGISTERS[0], raw[7])
            cpu.reg_write(ARGUMENT_REGISTERS[2], offset)
        else:
            cpu.mem_write(target, written)
            cpu.reg_write(ARGUMENT_REGISTERS[0], raw[5])
            cpu.reg_write(ARGUMENT_REGISTERS[2], base if opcode < 81 else offset)
            cpu.reg_write(ARGUMENT_REGISTERS[3], offset if opcode < 81 else base)
        cpu.reg_write(ARGUMENT_REGISTERS[1], result)
        self.memory_counts[opcode] += 1
        cpu.reg_write(UC_ARM64_REG_PC, HANDLERS[opcode][1])


def verify_native_vectors(data, worker):
    """用公开数据对照实际原生内存指令，覆盖符号位、非对齐、负偏移和槽位重叠。"""
    probe = NativeProbe(data)
    slots, instruction, memory = probe.stack + 0x100, probe.stack + 0x400, probe.stack + 0x1000
    values = (0, 1, 0x80, 0xffff, 0x80000000, 0x8000000000000000, MASK64)
    count = 0
    for opcode, (entry, stop, width) in HANDLERS.items():
        for value in values:
            for signed_offset in (0, 1, 7, -1):
                offset = signed_offset & MASK64
                target = memory + 16 + signed_offset
                for destination in ((0, 1, 2) if opcode in LOADS else (2,)):
                    before = bytearray(b'\xa5' * 64)
                    before[target - memory:target - memory + 8] = struct.pack('<Q', value)
                    probe.cpu.mem_write(memory, bytes(before))
                    if opcode in LOADS:
                        contents = (memory + 16, offset, 0)
                        raw = struct.pack('<I4BQ', opcode, 0, 0, 1, destination, memory + 16)
                        source = bytes(before[target - memory:target - memory + width])
                        stored_value = 0
                    else:
                        contents = (value, memory + 16, offset) if opcode < 81 else (value, 0, memory + 16)
                        raw = struct.pack('<I4BQ', opcode, 0, 0, 1, 2, offset)
                        source, stored_value = None, value
                    probe.cpu.mem_write(slots, struct.pack('<3Q', *contents))
                    probe.cpu.mem_write(instruction, raw)
                    probe.cpu.reg_write(UC_ARM64_REG_X24, slots)
                    probe.cpu.reg_write(UC_ARM64_REG_X27, instruction)
                    probe.cpu.reg_write(ARGUMENT_REGISTERS[0], 0xa5)
                    probe.cpu.reg_write(ARGUMENT_REGISTERS[3], 0xa5)
                    probe.cpu.emu_start(entry, stop, count=32)
                    if probe.cpu.reg_read(UC_ARM64_REG_PC) != stop:
                        raise RuntimeError('原生内存向量未到达派发点')
                    result, written = worker.calculate(opcode, memory + 16, offset, stored_value, source)
                    if opcode in LOADS:
                        expected_state = (destination, result, offset, 0xa5)
                    else:
                        expected_state = (0, result, memory + 16, offset) if opcode < 81 else (0, result, offset, memory + 16)
                    state_values = tuple(probe.cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:4])
                    if state_values != expected_state:
                        raise RuntimeError('TS 内存运算暂存状态与原生不一致')
                    if opcode in LOADS:
                        if struct.unpack('<Q', probe.cpu.mem_read(slots + destination * 8, 8))[0] != result or bytes(probe.cpu.mem_read(memory, 64)) != bytes(before):
                            raise RuntimeError('TS 读取与原生槽位结果不一致')
                    else:
                        before[target - memory:target - memory + width] = written
                        if bytes(probe.cpu.mem_read(memory, 64)) != bytes(before):
                            raise RuntimeError('TS 写入字节或边界与原生不一致')
                    count += 1
    return count


def compare(sample, compiled_memory, compiled_scalar, compiled_aes, node):
    """四次独立初始化，对照原生和全部已实现 TS 组件的候选输出。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    memory_worker = MemoryWorker(compiled_memory, node)
    scalar_worker = ScalarWorker(compiled_scalar, node)
    aes_worker = AESWorker(compiled_aes, node)
    entropy = []
    original_random = slice_probe.secrets.randbits
    reports = []
    CaptureProbe.captured = []
    try:
        vectors = verify_native_vectors(data, memory_worker)
        for index, (probe_class, changed) in enumerate(((CaptureProbe, False), (MemoryReplacement, False), (CaptureProbe, True), (MemoryReplacement, True))):
            position = 0

            def controlled_entropy(bits):
                """只在进程内重放相同真实熵，禁止位宽或调用顺序变化。"""
                nonlocal position
                if bits != 32:
                    raise RuntimeError('熵位宽不符')
                if index == 0:
                    entropy.append(original_random(bits))
                if position >= len(entropy):
                    raise RuntimeError('联合替换改变熵消耗')
                value = entropy[position]
                position += 1
                return value

            with patch.object(MemoryReplacement, 'memory_worker', memory_worker), patch.object(ScalarReplacement, 'scalar_worker', scalar_worker), patch.object(CryptoProbe, 'worker', aes_worker), patch.object(slice_probe, 'SDSCoreProbe', probe_class), patch.object(slice_probe.secrets, 'randbits', controlled_entropy):
                result = slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True, synthetic_input='synthetic-input-changed' if changed else 'synthetic-input')
            if position != len(entropy):
                raise RuntimeError('联合替换的熵消耗次数不符')
            report = {'changed_input': changed, 'mode': 'TS-memory-scalar-AES' if probe_class is MemoryReplacement else 'native', 'candidate_bytes': result['sds_slice']['signature_candidate']['bytes'], 'arc4random_calls': position}
            if probe_class is MemoryReplacement:
                probe = MemoryReplacement.latest
                if set(probe.memory_counts) != set(HANDLERS) or probe.replaced_aes != 17 or probe.native_aes_wrappers or probe.aes_frame is not None:
                    raise RuntimeError('联合替换覆盖或结束状态不符')
                report.update(memory_opcodes=dict(sorted(probe.memory_counts.items())), replaced_memory_instructions=sum(probe.memory_counts.values()), replaced_scalar_instructions=sum(probe.replacements.values()), replaced_aes_calls=probe.replaced_aes, native_aes_wrappers_executed=0)
            reports.append(report)
        if len(CaptureProbe.captured) != 4:
            raise RuntimeError('联合替换的候选数量不符')
        native, replaced, native_changed, replaced_changed = CaptureProbe.captured
        if native != replaced or native_changed != replaced_changed or native == native_changed:
            raise RuntimeError('联合替换的外层候选未通过对照')
        return {'scope': '16 memory and six scalar opcodes plus AES; native dispatch, remaining opcodes and SDS retained', 'public_native_vector_cases': vectors, 'runs': reports, 'same_input_native_equals_ts': True, 'changed_input_native_equals_ts': True, 'changed_input_changes_candidate': True, 'raw_data_exported': False, 'full_portable_signer_implemented': False, 'server_verified': False}
    finally:
        for worker in (memory_worker, scalar_worker, aes_worker):
            worker.close()
        entropy.clear()
        CaptureProbe.captured.clear()
        MemoryReplacement.latest = None
        ScalarReplacement.latest = None
        ReplacementProbe.latest_replacement = None
        CryptoProbe.latest = None


def main():
    """仅接受样本和显式本地 TS 编译模块，输出脱敏验证结论。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    parser.add_argument('--portable-memory', required=True)
    parser.add_argument('--portable-scalar', required=True)
    parser.add_argument('--portable-aes', required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    print(json.dumps(compare(args.sample, args.portable_memory, args.portable_scalar, args.portable_aes, args.node), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
