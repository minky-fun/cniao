"""使用原生指令和外层候选对照核对纯 TS 标量子集；不输出操作数或候选值。"""
import argparse
from collections import Counter
import json
from pathlib import Path
import plistlib
import select
import struct
import subprocess
from unittest.mock import patch
from zipfile import ZipFile

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X20, UC_ARM64_REG_X24, UC_ARM64_REG_X27, UC_ARM64_REG_X28
import probe_sds_slice as slice_probe
from probe_native import ARGUMENT_REGISTERS, NativeProbe, read_binary
from verify_signature_candidate import CaptureProbe
from verify_crypto_operations import AESWorker, CryptoProbe
from verify_portable_aes_pipeline import ReplacementProbe

# opcode: (exact native entry, first next-instruction fetch); immediate operand is at +8.
HANDLERS = {34: (0x102a2b1e8, 0x102a2b200), 38: (0x102a2b3b8, 0x102a2b3d4), 39: (0x102a2b3e4, 0x102a2b400), 40: (0x102a2b410, 0x102a2b430), 42: (0x102a2b580, 0x102a2b59c), 43: (0x102a2b5ac, 0x102a2b5c4)}
IMMEDIATE = {34, 42, 43}


class ScalarWorker:
    """在内存管道内执行 TS uint64 运算，避免 JS Number 的精度损失。"""

    def __init__(self, compiled, node):
        """启动明确的本地模块，丢弃子进程诊断，不保存中间数据。"""
        source = Path(compiled).resolve(strict=True)
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('vm_scalar_worker.cjs')), str(source)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def calculate(self, opcode, left, right):
        """读取有界结果；异常仅含固定诊断文本。"""
        self.process.stdin.write(json.dumps([opcode, str(left), str(right)]) + '\n')
        self.process.stdin.flush()
        if not select.select([self.process.stdout], [], [], 15)[0]:
            raise RuntimeError('TS 标量计算超时')
        try:
            result = int(json.loads(self.process.stdout.readline(256))['result'])
            if not 0 <= result <= 0xffffffffffffffff:
                raise ValueError()
            return result
        except (ValueError, KeyError, TypeError):
            raise RuntimeError('TS 标量响应无效') from None

    def close(self):
        """关闭管道并有界回收子进程。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


class ScalarReplacement(CaptureProbe):
    """仅替换已确认的标量处理器，其余指令和所有 SDS、加密仍由原生执行。"""

    scalar_worker = None
    latest = None

    def __init__(self, *args, **kwargs):
        """保留原始 VM，建立精确入口映射和替换次数。"""
        super().__init__(*args, **kwargs)
        self.entries = {entry: opcode for opcode, (entry, _) in HANDLERS.items()}
        self.replacements = Counter()
        ScalarReplacement.latest = self

    def on_instruction(self, cpu, address, size, context):
        """写回 TS 结果后跳至原生下一指令派发，保留该派发的完整寄存器副作用。"""
        if address in self.entries:
            opcode = self.entries[address]
            instruction = cpu.reg_read(UC_ARM64_REG_X27)
            raw = bytes(cpu.mem_read(instruction, 16))
            if struct.unpack_from('<I', raw)[0] != opcode:
                raise RuntimeError('标量操作码和处理器入口不符')
            slots = cpu.reg_read(UC_ARM64_REG_X24)
            left = struct.unpack('<Q', cpu.mem_read(slots + raw[5] * 8, 8))[0]
            right = struct.unpack_from('<Q', raw, 8)[0] if opcode in IMMEDIATE else struct.unpack('<Q', cpu.mem_read(slots + raw[6] * 8, 8))[0]
            result = self.scalar_worker.calculate(opcode, left, right)
            cpu.mem_write(slots + raw[7] * 8, struct.pack('<Q', result))
            # 原生标量计算还写 x0/x1/x2；保留这些真实副作用，避免猜测跨指令活跃性。
            cpu.reg_write(ARGUMENT_REGISTERS[0], raw[7])
            cpu.reg_write(ARGUMENT_REGISTERS[1], result)
            cpu.reg_write(ARGUMENT_REGISTERS[2], right)
            self.replacements[opcode] += 1
            cpu.reg_write(UC_ARM64_REG_PC, HANDLERS[opcode][1])
            return
        return super().on_instruction(cpu, address, size, context)


class CombinedReplacement(ScalarReplacement, ReplacementProbe):
    """同时执行已经分别核对的 TS 标量与 TS AES，保持其余原生依赖。"""


def verify_native_vectors(data, worker):
    """将公开边界数值逐项送入原生处理器，验证溢出、掩码及槽位重叠。"""
    probe = NativeProbe(data)
    slots, instruction = probe.stack + 0x100, probe.stack + 0x400
    probe.cpu.reg_write(UC_ARM64_REG_X24, slots)
    probe.cpu.reg_write(UC_ARM64_REG_X20, 0)
    probe.cpu.reg_write(UC_ARM64_REG_X28, probe.stack + 0x800)
    values = (0, 1, 0xffffffff, 0x100000000, 0x7fffffffffffffff, 0x8000000000000000, 0xffffffffffffffff)
    count = 0
    for opcode, (entry, stop) in HANDLERS.items():
        for left in values:
            for right in values:
                for destination in (0, 1, 2):
                    probe.cpu.mem_write(slots, struct.pack('<QQQ', left, right, 0))
                    probe.cpu.mem_write(instruction, struct.pack('<I4BQ', opcode, 0, 0, 1, destination, right))
                    probe.cpu.reg_write(UC_ARM64_REG_X27, instruction)
                    probe.cpu.emu_start(entry, stop, count=32)
                    if probe.cpu.reg_read(UC_ARM64_REG_PC) != stop:
                        raise RuntimeError('原生标量向量未到达派发点')
                    actual = struct.unpack('<Q', probe.cpu.mem_read(slots + destination * 8, 8))[0]
                    if worker.calculate(opcode, left, right) != actual:
                        raise RuntimeError('TS 与原生标量向量不一致')
                    count += 1
    return count


def compare(sample, compiled, node, compiled_aes=None):
    """四次独立初始化，在相同熵下核对原生和 TS 标量替换的候选结果。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    worker = ScalarWorker(compiled, node)
    aes_worker = AESWorker(compiled_aes, node) if compiled_aes is not None else None
    replacement_class = CombinedReplacement if aes_worker is not None else ScalarReplacement
    entropy = []
    original_random = slice_probe.secrets.randbits
    CaptureProbe.captured = []
    reports = []
    try:
        vectors = verify_native_vectors(data, worker)
        for index, (probe_class, changed) in enumerate(((CaptureProbe, False), (replacement_class, False), (CaptureProbe, True), (replacement_class, True))):
            position = 0

            def controlled_entropy(bits):
                """仅在内存记录或重放真实熵，位宽和消耗次数必须一致。"""
                nonlocal position
                if bits != 32:
                    raise RuntimeError('熵位宽不符')
                if index == 0:
                    entropy.append(original_random(bits))
                if position >= len(entropy):
                    raise RuntimeError('TS 标量替换改变熵消耗')
                value = entropy[position]
                position += 1
                return value

            with patch.object(ScalarReplacement, 'scalar_worker', worker), patch.object(CryptoProbe, 'worker', aes_worker), patch.object(slice_probe, 'SDSCoreProbe', probe_class), patch.object(slice_probe.secrets, 'randbits', controlled_entropy):
                result = slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True, synthetic_input='synthetic-input-changed' if changed else 'synthetic-input')
            if position != len(entropy):
                raise RuntimeError('运行间熵消耗次数不符')
            report = {'changed_input': changed, 'mode': ('TS-scalar-and-AES-replacement' if aes_worker is not None else 'TS-scalar-replacement') if probe_class is replacement_class else 'native', 'candidate_bytes': result['sds_slice']['signature_candidate']['bytes'], 'arc4random_calls': position}
            if probe_class is replacement_class:
                counts = ScalarReplacement.latest.replacements
                if set(counts) != set(HANDLERS):
                    raise RuntimeError('真实路径未覆盖全部标量子集')
                report['replaced_handlers'] = dict(sorted(counts.items()))
                report['replaced_instructions'] = sum(counts.values())
                if aes_worker is not None:
                    probe = ScalarReplacement.latest
                    if probe.replaced_aes != 17 or probe.native_aes_wrappers != 0 or probe.aes_frame is not None:
                        raise RuntimeError('联合替换的 AES 覆盖不符')
                    report.update(replaced_aes_calls=probe.replaced_aes, native_aes_wrappers_executed=0)
            reports.append(report)
        if len(CaptureProbe.captured) != 4:
            raise RuntimeError('候选数量不符')
        native, replaced, native_changed, replaced_changed = CaptureProbe.captured
        if native != replaced or native_changed != replaced_changed or native == native_changed:
            raise RuntimeError('TS 标量替换的外层候选未通过对照')
        return {'scope': 'six scalar opcodes, optionally AES; native VM dispatch, remaining opcodes, SDS and remaining crypto retained', 'public_native_vector_cases': vectors, 'runs': reports, 'same_input_native_equals_ts': True, 'changed_input_native_equals_ts': True, 'changed_input_changes_candidate': True, 'raw_operands_entropy_candidates_exported': False, 'full_portable_signer_implemented': False, 'server_verified': False}
    finally:
        worker.close()
        if aes_worker is not None:
            aes_worker.close()
        CryptoProbe.latest = None
        ReplacementProbe.latest_replacement = None
        CaptureProbe.captured.clear()
        entropy.clear()
        ScalarReplacement.latest = None


def main():
    """输出脱敏验证证据，不接受真实账号参数。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    parser.add_argument('--portable-scalar', required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--portable-aes')
    args = parser.parse_args()
    print(json.dumps(compare(args.sample, args.portable_scalar, args.node, args.portable_aes), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
