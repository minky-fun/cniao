"""在同熵对照中用纯 TypeScript 替换原生 AES，核对外层候选结果；不导出结果或密钥。"""
import argparse
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30

import probe_sds_slice as slice_probe
from probe_native import ARGUMENT_REGISTERS, read_binary
from verify_crypto_operations import AESWorker, CryptoProbe
from verify_signature_candidate import CaptureProbe

BASE_SDS = slice_probe.SDSCoreProbe
AES_WRAPPERS = (0x102aeddd4, 0x102aee0dc)


class CapturedCryptoProbe(CryptoProbe, CaptureProbe):
    """将独立标准算法旁路检查与只在内存保留的候选输出结合。"""


class ReplacementProbe(CapturedCryptoProbe):
    """仅替换已验证的 AES；继续使用真实 VM、其他处理器和原生缓冲对象构造器。"""

    latest_replacement = None

    def __init__(self, *args, **kwargs):
        """创建替换调用帧和计数，不改变原生 VM 或其字节码。"""
        super().__init__(*args, **kwargs)
        self.aes_frame = None
        self.replaced_aes = 0
        self.native_aes_wrappers = 0
        ReplacementProbe.latest_replacement = self

    def on_instruction(self, cpu, address, size, context):
        """执行真实缓冲构造器后填入 TS 结果，按原生成功 ABI 返回给 VM。"""
        if address in AES_WRAPPERS:
            self.native_aes_wrappers += 1
            raise RuntimeError('替换模式仍进入了原生 AES 包装器')
        if address == self.callback + 0x400:
            if self.aes_frame is None:
                raise RuntimeError('AES 构造器回调缺少匹配帧')
            result, error, return_address, capacity = self.aes_frame
            output = cpu.reg_read(ARGUMENT_REGISTERS[0])
            if self.allocations.get(output) != 104:
                raise RuntimeError('真实缓冲构造器未返回预期对象')
            data, length, allocated = struct.unpack('<QII', cpu.mem_read(output, 16))
            if length != 0 or allocated != capacity or self.allocations.get(data) != capacity or len(result) > capacity:
                raise RuntimeError('真实缓冲构造器的容量或初始长度不符')
            cpu.mem_write(data, result)
            cpu.mem_write(output + 8, struct.pack('<I', len(result)))
            if error:
                cpu.mem_write(error, bytes(4))
            self.aes_frame = None
            self.replaced_aes += 1
            cpu.reg_write(UC_ARM64_REG_X30, return_address)
            cpu.reg_write(UC_ARM64_REG_PC, return_address)
            return
        if address == 0x102abc330:
            request = cpu.reg_read(ARGUMENT_REGISTERS[0])
            raw = bytes(cpu.mem_read(request, 40))
            direction, operation, mode = struct.unpack_from('<III', raw)
            if operation in (16, 17, 18):
                if self.aes_frame is not None:
                    raise RuntimeError('AES 替换出现未确认的重入')
                source = self.read_buffer(struct.unpack_from('<Q', raw, 32)[0])
                key = self.read_buffer(struct.unpack_from('<Q', raw, 24)[0])
                required = 16 + (operation - 16) * 8
                iv = self.read_buffer(struct.unpack_from('<Q', raw, 16)[0]) if mode == 2 else None
                if len(key) < required or (iv is not None and len(iv) < 16):
                    raise RuntimeError('AES 替换缺少明确长度的 key 或 IV')
                result = self.calculate_aes(source, key[:required], direction, mode, iv[:16] if iv is not None else None)
                capacity = (len(source) + 16) & ~15
                self.aes_frame = (result, cpu.reg_read(ARGUMENT_REGISTERS[1]), cpu.reg_read(UC_ARM64_REG_X30), capacity)
                # 保留原 SDS 入口的脱敏观测，但不执行 CryptoProbe 的原生旁路帧。
                BASE_SDS.on_instruction(self, cpu, address, size, context)
                cpu.reg_write(ARGUMENT_REGISTERS[0], capacity)
                cpu.reg_write(UC_ARM64_REG_X30, self.callback + 0x400)
                cpu.reg_write(UC_ARM64_REG_PC, 0x102abf544)
                return
        return super().on_instruction(cpu, address, size, context)


def compare(sample, compiled_aes, node='node'):
    """用两组合成 INPUT 分别比较原生/替换结果，并强制确认原生 AES 未执行。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    entropy = []
    original_random = slice_probe.secrets.randbits
    worker = AESWorker(compiled_aes, node)
    CaptureProbe.captured = []
    reports = []
    try:
        for index, (probe_class, changed) in enumerate(((CapturedCryptoProbe, False), (ReplacementProbe, False), (CapturedCryptoProbe, True), (ReplacementProbe, True))):
            position = 0

            def controlled_entropy(bits):
                """首次记录真实系统熵，其余运行只重放同一序列；不保存或打印值。"""
                nonlocal position
                if bits != 32:
                    raise RuntimeError('熵位宽不符')
                if index == 0:
                    entropy.append(original_random(bits))
                if position >= len(entropy):
                    raise RuntimeError('替换运行改变了熵调用次数')
                value = entropy[position]
                position += 1
                return value

            with patch.object(CryptoProbe, 'worker', worker), patch.object(slice_probe, 'SDSCoreProbe', probe_class), patch.object(slice_probe.secrets, 'randbits', controlled_entropy):
                result = slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True, synthetic_input='synthetic-input-changed' if changed else 'synthetic-input')
            if position != len(entropy):
                raise RuntimeError('对照运行熵消耗不一致')
            report = {'changed_input': changed, 'mode': 'replace-native-AES' if probe_class is ReplacementProbe else 'native-with-shadow-comparison', 'arc4random_calls': position, 'candidate_bytes': result['sds_slice']['signature_candidate']['bytes']}
            if probe_class is ReplacementProbe:
                replacement = ReplacementProbe.latest_replacement
                if replacement.replaced_aes != 17 or replacement.native_aes_wrappers != 0 or replacement.aes_frame is not None:
                    raise RuntimeError('替换 AES 覆盖或调用结束状态不符')
                report.update(replaced_aes_calls=replacement.replaced_aes, native_aes_wrappers_executed=0)
            reports.append(report)
        if len(CaptureProbe.captured) != 4:
            raise RuntimeError('外层候选数量不符')
        native, replaced, native_changed, replaced_changed = CaptureProbe.captured
        if native != replaced or native_changed != replaced_changed or native == native_changed:
            raise RuntimeError('纯 TS AES 替换后未保持外层候选一致性')
        return {'scope': 'controlled offline replacement; remaining VM, SDS and non-AES handlers still native', 'runs': reports, 'same_input_native_equals_portable_aes': True, 'changed_input_native_equals_portable_aes': True, 'changed_input_changes_candidate': True, 'raw_inputs_keys_iv_outputs_entropy_exported': False, 'full_portable_signer_implemented': False, 'server_verified': False}
    finally:
        worker.close()
        CaptureProbe.captured.clear()
        entropy.clear()
        CryptoProbe.latest = None
        ReplacementProbe.latest_replacement = None


def main():
    """仅接受固定样本和显式本地编译模块，输出无凭据的替换对照结论。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    parser.add_argument('--portable-aes', required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    print(json.dumps(compare(args.sample, args.portable_aes, args.node), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
