"""以独立 ARM64 向量与完整 TS VM 联合替换验证标准摘要，不导出私密参数或结果。"""
import argparse
from collections import Counter
import json
from pathlib import Path
import struct
from unittest.mock import patch

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_SP, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, read_binary
import verify_portable_buffer as buffer_probe

ENTRIES = {'md5': 0x102ad4370, 'sha1': 0x102ac4458, 'hmac': 0x102acc6a0, 'base64': 0x102ae5320, 'crc': 0x102adefb8}
ALPHABET = b'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
ALPHABET_ADDRESS = 0x1068f9d65
ALPHABET_FLAG = 0x1068f9da5


class StandardOracle(buffer_probe.BufferOracle):
    """沿用非零填充/失败注入堆，并提供原生 HMAC 实际使用的 checked memcpy。"""

    def __init__(self, data):
        """只补入固定样本已核实的导入地址，不引入未知原生实现。"""
        super().__init__(data)
        self.imports = dict(self.imports)
        self.imports[0x10442ff30] = '___memcpy_chk'


def verify_vectors(data, worker):
    """逐项比较返回位、全部堆字节、scratch 变化、分配/释放顺序及 Base64 表状态。"""
    native, portable = StandardOracle(data), StandardOracle(data)
    counts = Counter()

    def prepare(probe, length=0, key_length=0):
        """构造公开二进制模式和明确 64 字节 HMAC 描述符，不加载用户配置。"""
        probe.next_address = 0x210000000
        probe.allocations.clear()
        probe.frees.clear()
        probe.attempts = 0
        probe.fail_at = None
        source, key, output, scratch, descriptor = [probe.allocate(size) for size in (max(2048, length + 1), 1024, 2048, 4096, 64)]
        probe.cpu.mem_write(source, bytes((index * 31 + 7) & 255 for index in range(length)) + b'\0')
        probe.cpu.mem_write(key, bytes((index * 17 + 11) & 255 for index in range(key_length)) + b'\0')
        raw = struct.pack('<QI4xQI4xQI4xQI4x', key, key_length, source, length, output, 20, 0, 0)
        probe.cpu.mem_write(descriptor, raw)
        probe.cpu.reg_write(UC_ARM64_REG_SP, probe.stack + 0xff000)
        return source, key, output, scratch, descriptor

    def check(name, length=1, key_length=1, capacity=2048, null=None, scratch_capacity=None, failure=False, aliases=None, custom_alphabet=False):
        """执行一组公开输入并只在失败时报告用例序号，避免把通用探针用于私密输出。"""
        arguments = []
        for probe in (native, portable):
            source, key, output, scratch, descriptor = prepare(probe, length, key_length)
            if name == 'crc' and custom_alphabet:
                probe.cpu.mem_write(0x1068f91f8, struct.pack('<256Q', *[0x1234567800000000 | (index * 2654435761 & 0xffffffff) for index in range(256)]))
                probe.cpu.mem_write(0x1068f91f1, b'\x02')
            if name == 'base64' and custom_alphabet:
                probe.cpu.mem_write(ALPHABET_ADDRESS, ALPHABET[::-1])
                probe.cpu.mem_write(ALPHABET_FLAG, b'\x01')
            if name == 'hmac':
                if null == 'source': source = 0
                if null == 'key': key = 0
                if null == 'output': output = 0
                if aliases == 'source-scratch': source = scratch
                if aliases == 'key-scratch': key = scratch
                if aliases == 'output-scratch': output = scratch
                probe.cpu.mem_write(descriptor, struct.pack('<QI4xQI4xQI4xQI4x', key, key_length, source, length, output, capacity, scratch if scratch_capacity is not None else 0, scratch_capacity or 0))
                args = (0 if null == 'descriptor' else descriptor,)
            else:
                if null == 'source': source = 0
                if null == 'output': output = 0
                args = (source, length) if name == 'crc' else (source, length, output) if name == 'md5' else (source, length, output, capacity)
            probe.fail_at = probe.attempts + 1 if failure else None
            arguments.append(args)
        expected = native.run(ENTRIES[name], arguments[0])
        actual = worker.calculate(portable, ENTRIES[name], arguments[1])
        case = str(sum(counts.values()))
        if expected != actual or native.allocations != portable.allocations or native.frees != portable.frees or native.attempts != portable.attempts:
            raise RuntimeError('标准算法 ABI 或堆操作不符，公开用例 ' + case + ' (' + name + ')')
        for address, length in native.allocations.items():
            if bytes(native.cpu.mem_read(address, length)) != bytes(portable.cpu.mem_read(address, length)):
                raise RuntimeError('标准算法输出或 scratch 不符，公开用例 ' + case + ' (' + name + ')')
        if name == 'base64':
            table = bytes(native.cpu.mem_read(ALPHABET_ADDRESS, 65))
            if table != bytes(portable.cpu.mem_read(ALPHABET_ADDRESS, 65)):
                raise RuntimeError('Base64 初始化或已有字母表行为不符')
            if not custom_alphabet and table != ALPHABET + b'\x01':
                raise RuntimeError('固定样本 Base64 字母表未确认')
        if name == 'crc':
            if bytes(native.cpu.mem_read(0x1068f91f8, 2048)) != bytes(portable.cpu.mem_read(0x1068f91f8, 2048)) or bytes(native.cpu.mem_read(0x1068f91f1, 1)) != bytes(portable.cpu.mem_read(0x1068f91f1, 1)):
                raise RuntimeError('SGCrc32 表初始化状态与原生不一致')
        counts[name] += 1

    lengths = (0, 1, 2, 3, 15, 16, 20, 55, 56, 57, 63, 64, 65, 119, 120, 127, 128, 129, 255, 256, 257, 511, 1024)
    for name in ('md5', 'sha1', 'base64', 'crc'):
        for length in lengths:
            check(name, length=length)
        for null in ('source', 'output'):
            check(name, length=0 if name in ('base64', 'crc') else 5, null=null)
    check('crc', length=65537)
    for capacity in (0, 1, 19, 20, 21, 0x100000014):
        check('sha1', length=55, capacity=capacity)
    for capacity in (0, 1, 3, 4, 7, 8, 9, 0x100000008):
        check('base64', length=5, capacity=capacity)
    for length in (1, 2, 3, 55, 128):
        check('base64', length=length, custom_alphabet=True)
        check('crc', length=length, custom_alphabet=True)
    for length in (1, 15, 20, 21, 55, 56, 63, 64, 65, 128, 511, 1024):
        for key_length in (1, 20, 63, 64, 65, 128, 257):
            check('hmac', length=length, key_length=key_length, capacity=20)
    for null in ('descriptor', 'source', 'key', 'output'):
        check('hmac', length=15, key_length=20, null=null, capacity=20)
    for length, key_length in ((0, 20), (15, 0), (0, 0)):
        check('hmac', length=length, key_length=key_length, capacity=20)
    for capacity in (0, 1, 19, 20, 21):
        check('hmac', length=15, key_length=20, capacity=capacity)
    for length in (15, 20, 21, 64, 128):
        for scratch_capacity in (0, 84, 85, 86, 4096):
            check('hmac', length=length, key_length=65, capacity=20, scratch_capacity=scratch_capacity)
        check('hmac', length=length, key_length=20, capacity=20, failure=True)
    for aliases in ('source-scratch', 'key-scratch', 'output-scratch'):
        check('hmac', length=65, key_length=65, capacity=20, scratch_capacity=4096, aliases=aliases)
    return dict(counts)


class StandardReplacement(buffer_probe.BufferReplacement):
    """保留原生对象包装器，核心 MD5/SHA1/HMAC/Base64 完全交由 TS 实现。"""

    standard_worker = None
    completed_standard = []

    def __init__(self, *args, **kwargs):
        """建立无参数的算法入口计数，不保存原始来源或摘要。"""
        super().__init__(*args, **kwargs)
        self.standard_counts = Counter()

    def on_instruction(self, cpu, address, size, context):
        """仅从已确认入口转入 TS；禁止继续执行原生算法体或其摘要核心。"""
        if address in ENTRIES.values():
            self.standard_counts[next(name for name, target in ENTRIES.items() if target == address)] += 1
            result = self.standard_worker.calculate(self, address, [cpu.reg_read(register) for register in ARGUMENT_REGISTERS])
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        if 0x102ad4370 <= address < 0x102ad44d8 or 0x102ac4458 <= address < 0x102ac4538 or 0x102acc6a0 <= address < 0x102acc8c8 or 0x102ae5320 <= address < 0x102ae55c8 or 0x102adefb8 <= address < 0x102adf0a0 or address in (0x102ad44d8, 0x102ad45e0, 0x102ac4358, 0x102ac3f14, 0x102ac4010):
            raise RuntimeError('标准算法替换意外进入原生算法体')
        return super().on_instruction(cpu, address, size, context)

    def run(self, entry, arguments=(), stop=None):
        """外层候选完成后保存脱敏算法次数，供两组输入分别核对。"""
        result = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and result == 0:
            self.completed_standard.append(dict(self.standard_counts))
        return result


def compare(args):
    """先完成逐函数对照，再联合此前 VM、ABI、桥接、AES 与对象移植结果。"""
    worker = buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_standard)
    StandardReplacement.completed_standard = []
    try:
        vectors = verify_vectors(read_binary(args.sample), worker)
        with patch.object(StandardReplacement, 'standard_worker', worker), patch.object(buffer_probe, 'BufferReplacement', StandardReplacement):
            result = buffer_probe.compare(args)
        if len(StandardReplacement.completed_standard) != 2:
            raise RuntimeError('标准算法完整替换次数错误')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), StandardReplacement.completed_standard):
            if not all(counts.get(name) for name in ('md5', 'hmac', 'base64', 'crc')):
                raise RuntimeError('完整路径标准算法覆盖不足')
            report.update(mode='TS-runtime-objects-AES-and-digests', standard_calls=counts, native_replaced_standard_body_entries=0)
        result.update(native_standard_vector_cases=vectors, scope='independent TS VM, object helpers, AES and MD5/HMAC-SHA1/Base64/SGCrc32 cores; object wrappers, other hosts, initialization, expansion and SDS/platform adapters still retained', native_replaced_standard_body_entries_in_ts_runs=0)
        return result
    finally:
        worker.close()
        StandardReplacement.completed_standard.clear()


def main():
    """只接收固定样本和本地 TS 模块，输出脱敏验证计数。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('standard', 'buffer', 'runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--vectors-only', action='store_true')
    args = parser.parse_args()
    if args.vectors_only:
        worker = buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_standard)
        try:
            result = {'native_standard_vector_cases': verify_vectors(read_binary(args.sample), worker)}
        finally:
            worker.close()
    else:
        result = compare(args)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
