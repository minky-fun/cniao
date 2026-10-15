"""独立复算真实原生操作，可选用纯 TypeScript AES；只输出长度和相等性。"""
import argparse
import base64
from collections import Counter
import ctypes
import hashlib
import hmac
import json
from pathlib import Path
import plistlib
import select
import subprocess
import struct
from unittest.mock import patch
from zipfile import ZipFile
import zlib

from unicorn.arm64_const import UC_ARM64_REG_X20
import probe_sds_slice as slice_probe
from probe_native import ARGUMENT_REGISTERS, read_binary

MAX_BYTES = 1024 * 1024


class AESWorker:
    """通过内存管道调用编译后的纯 TS AES；参数不进入命令行、文件或诊断。"""

    def __init__(self, compiled, node):
        """只启动明确的本地比较脚本，并将子进程诊断丢弃以防泄露请求。"""
        compiled = Path(compiled).resolve(strict=True)
        worker = Path(__file__).with_name('aes_worker.cjs')
        self.process = subprocess.Popen([node, str(worker), str(compiled)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def calculate(self, source, key, direction, mode, iv):
        """发送一次有界 AES 比较，响应只在父进程内参与相等性比较。"""
        request = {'input': base64.b64encode(source).decode('ascii'), 'key': base64.b64encode(key).decode('ascii'), 'direction': 'encrypt' if direction == 1 else 'decrypt', 'mode': 'ecb' if mode == 1 else 'cbc', 'iv': base64.b64encode(iv).decode('ascii') if iv is not None else None}
        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()
        if not select.select([self.process.stdout], [], [], 15)[0]:
            raise RuntimeError('纯 TS AES 比较超时')
        line = self.process.stdout.readline(MAX_BYTES * 2)
        # 原始响应不得插入异常信息、日志或证据。
        try:
            result = json.loads(line)
            return base64.b64decode(result['result'], validate=True)
        except (ValueError, KeyError, TypeError):
            raise RuntimeError('纯 TS AES 比较响应无效') from None

    def close(self):
        """关闭管道并等待子进程退出，超时则终止，不保存任何输入输出。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


class CryptoProbe(slice_probe.SDSCoreProbe):
    """执行原始处理器，并在返回点独立复算已确认的标准算法。"""

    latest = None
    worker = None

    def __init__(self, *args, **kwargs):
        """保留原有 SDK 模型；比较期间的安全数据只存在于进程内。"""
        super().__init__(*args, **kwargs)
        self.pending_crypto = []
        self.operation_checks = []
        self.common_crypto = ctypes.CDLL('/usr/lib/system/libcommonCrypto.dylib') if self.worker is None else None
        if self.common_crypto is not None:
            self.common_crypto.CCCrypt.argtypes = [ctypes.c_uint, ctypes.c_uint, ctypes.c_uint, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_size_t, ctypes.POINTER(ctypes.c_size_t)]
            self.common_crypto.CCCrypt.restype = ctypes.c_int
        CryptoProbe.latest = self

    def read_buffer(self, pointer):
        """按已确认的字符串/缓冲对象布局读取有界分配，不接受未知指针。"""
        if not pointer or self.allocations.get(pointer, 0) < 16:
            raise RuntimeError('操作对象不是已记录的有界分配')
        data, length = struct.unpack('<QI', self.cpu.mem_read(pointer, 12))
        if not data or length > MAX_BYTES or not any(base <= data and data + length <= base + count for base, count in self.allocations.items()):
            raise RuntimeError('操作缓冲区越界')
        return bytes(self.cpu.mem_read(data, length))

    def calculate_aes(self, source, key, direction, mode, iv):
        """按原生编号执行独立 CBC/ECB PKCS#7 计算，不改动 guest 的计算或结果。"""
        if direction not in (1, 2) or mode not in (1, 2):
            raise RuntimeError('未确认的 AES 操作或模式')
        if self.worker is not None:
            return self.worker.calculate(source, key, direction, mode, iv)
        target = ctypes.create_string_buffer(len(source) + 16)
        written = ctypes.c_size_t()
        status = self.common_crypto.CCCrypt(direction - 1, 0, 1 | (2 if mode == 1 else 0), key, len(key), iv, source, len(source), target, len(target), ctypes.byref(written))
        if status != 0:
            raise RuntimeError('独立 CommonCrypto AES 计算失败')
        return target.raw[:written.value]

    def on_instruction(self, cpu, address, size, context):
        """只观察入口和真实返回点，逐次验证输出；不跳过或替换原生处理器。"""
        if address == 0x102abc330:
            request = cpu.reg_read(ARGUMENT_REGISTERS[0])
            raw = bytes(cpu.mem_read(request, 40))
            selector, operation, mode = struct.unpack_from('<III', raw)
            if operation not in (16, 17, 18, 20, 21, 22, 23):
                raise RuntimeError('出现尚未复核的标准操作编号')
            source = self.read_buffer(struct.unpack_from('<Q', raw, 32)[0])
            key = self.read_buffer(struct.unpack_from('<Q', raw, 24)[0]) if operation in (16, 17, 18, 23) else None
            iv = self.read_buffer(struct.unpack_from('<Q', raw, 16)[0]) if operation in (16, 17, 18) and mode == 2 else None
            self.pending_crypto.append((operation, selector, mode, source, key, iv))
        if address == 0x102abc548:
            if not self.pending_crypto:
                raise RuntimeError('原生操作返回与进入不匹配')
            operation, selector, mode, source, key, iv = self.pending_crypto.pop()
            target = self.read_buffer(cpu.reg_read(UC_ARM64_REG_X20))
            event = {'operation': operation, 'input_bytes': len(source), 'output_bytes': len(target)}
            if operation in (16, 17, 18):
                required = 16 + 8 * (operation - 16)
                if len(key) < required or (mode == 2 and len(iv) < 16):
                    raise RuntimeError('AES 对象长度不足')
                expected = self.calculate_aes(source, key[:required], selector, mode, iv[:16] if iv is not None else None)
                algorithm = f'AES-{required * 8}-' + ('ECB' if mode == 1 else 'CBC') + '-PKCS7'
                event.update(direction='encrypt' if selector == 1 else 'decrypt', mode=mode, key_bits=required * 8)
            elif operation == 20:
                if selector != 2:
                    raise RuntimeError('本路径尚未复核压缩方向')
                stream = zlib.decompressobj()
                expected = stream.decompress(source, MAX_BYTES + 1)
                if len(expected) > MAX_BYTES or not stream.eof or stream.unconsumed_tail or stream.unused_data:
                    raise RuntimeError('原生 zlib 输入不符合完整有界单流')
                algorithm = 'zlib-inflate'
            elif operation == 21:
                if selector != 1:
                    raise RuntimeError('本路径尚未复核 Base64 解码方向')
                expected, algorithm = base64.b64encode(source), 'Base64-encode'
            elif operation == 22:
                expected, algorithm = hashlib.md5(source).digest(), 'MD5'
            else:
                expected, algorithm = hmac.new(key, source, 'sha1').digest(), 'HMAC-SHA1'
            event.update(algorithm=algorithm, matches=target == expected)
            if not event['matches']:
                raise RuntimeError('原生输出与独立算法不一致；内容未导出')
            self.operation_checks.append(event)
        return super().on_instruction(cpu, address, size, context)


def inspect(sample, compiled_aes=None, node='node'):
    """运行真实签名路径并验证所有已到达的操作，只输出脱敏比较证据。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    worker = AESWorker(compiled_aes, node) if compiled_aes else None
    try:
        with patch.object(CryptoProbe, 'worker', worker), patch.object(slice_probe, 'SDSCoreProbe', CryptoProbe):
            result = slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True)
        probe = CryptoProbe.latest
        counts = Counter(event['operation'] for event in probe.operation_checks)
        if counts != {16: 11, 17: 4, 18: 2, 20: 2, 21: 1, 22: 7, 23: 2} or probe.pending_crypto:
            raise RuntimeError('实际操作覆盖与已知路径不一致')
        return {'binary_sha256': result['binary_sha256'], 'scope': 'independent shadow calculation; original ARM64/VM execution remains unchanged', 'aes_backend': 'portable TypeScript, no Node crypto/native AES imports' if worker else 'independent Darwin CommonCrypto', 'operations': probe.operation_checks, 'operation_counts': dict(sorted(counts.items())), 'all_29_operations_match': True, 'aes_comparisons': 17, 'signature_vm_returned': result['sds_slice']['signature_vm_returned'], 'signature_candidate_bytes': result['sds_slice']['signature_candidate']['bytes'], 'raw_inputs_keys_iv_outputs_exported': False, 'full_portable_signer_implemented': False, 'server_verified': False}
    finally:
        if worker is not None:
            worker.close()
        CryptoProbe.latest = None


def main():
    """选择独立 CommonCrypto 或明确编译出的 TS 模块进行比较，不提供生产签名接口。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    parser.add_argument('--portable-aes', help='portable_aes.ts 编译出的本地 JS 路径')
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    print(json.dumps(inspect(args.sample, args.portable_aes, args.node), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
