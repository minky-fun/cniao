"""对照真实 libz 流 ABI，并联合 TS VM/摘要/对象验证；不导出资源或候选。"""
import argparse
from collections import Counter
import json
import struct
from unittest.mock import patch
import zlib

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from guest_zlib import GuestZlib
from probe_native import ARGUMENT_REGISTERS, read_binary
import verify_portable_digest as digest_probe
import probe_sds_slice as slice_probe

ENTRIES = {'_inflateInit_': 0x104431184, '_inflate': 0x104431160, '_inflateEnd': 0x10443116c}


class PortableGuestZlib:
    """仅把已确认的 z_stream 导入交给 TS，保留原有脱敏检查接口。"""

    def __init__(self, probe, worker):
        """引用显式计算进程，所有真实资源仅经有界内存管道传递。"""
        self.probe = probe
        self.worker = worker
        self.streams = {}
        self.events = []

    def call(self, name, pointer, second=0, third=0):
        """执行确切导入并记录公开状态计数，不保存输入输出字节。"""
        result = self.worker.calculate(self.probe, ENTRIES[name], (pointer, second, third))
        raw = self.probe.cpu.mem_read(pointer, 112)
        if name == '_inflateInit_':
            self.streams[pointer] = True
        elif name == '_inflateEnd':
            del self.streams[pointer]
        self.events.append({'operation': name, 'return_code': result if result < 0x80000000 else result - 0x100000000,
                            'total_in': struct.unpack_from('<Q', raw, 16)[0], 'total_out': struct.unpack_from('<Q', raw, 40)[0]})
        return result


def verify_vectors(data, worker):
    """逐次比较 z_stream 的 112 字节、输出、状态计数和消息分配。"""
    native, portable = digest_probe.StandardOracle(data), digest_probe.StandardOracle(data)
    counts = Counter()
    calls = 0

    def check(compressed, plain, input_size, output_size, group):
        """构造公开流并在每次调用后比较完整 ABI，故障只报告序号与字段偏移。"""
        nonlocal calls
        adapters = [GuestZlib(native), PortableGuestZlib(portable, worker)]
        pointers = []
        for probe in (native, portable):
            probe.next_address = 0x210000000
            probe.allocations.clear()
            probe.frees.clear()
            probe.attempts = 0
            probe.fail_at = None
            stream = probe.allocate(112)
            probe.cpu.mem_write(stream, bytes(112))
            version = probe.write_string('1.2.11')
            source = probe.allocate(max(1, len(compressed)))
            probe.cpu.mem_write(source, compressed or b'\0')
            target = probe.allocate(max(1, output_size))
            pointers.append((stream, version, source, target))
        restored = bytearray()

        def call(name, available=0):
            """比较一次 libz 与 TS 的返回位及全部可见内存，不打印原始数据。"""
            nonlocal calls
            results = []
            for index, probe in enumerate((native, portable)):
                stream, version, source, target = pointers[index]
                if name == '_inflate':
                    raw = bytearray(probe.cpu.mem_read(stream, 112))
                    offset = struct.unpack_from('<Q', raw, 16)[0]
                    struct.pack_into('<QI', raw, 0, source + offset, available)
                    struct.pack_into('<QI', raw, 24, target, output_size)
                    probe.cpu.mem_write(stream, bytes(raw))
                results.append(adapters[index].call(name, stream, version if name == '_inflateInit_' else 0, 112 if name == '_inflateInit_' else 0))
            if results[0] != results[1]:
                raise RuntimeError('解压返回位不符，公开用例 ' + str(sum(counts.values())) + '，调用 ' + str(calls))
            for address, size in native.allocations.items():
                expected = bytes(native.cpu.mem_read(address, size))
                actual = bytes(portable.cpu.mem_read(address, size))
                if expected != actual:
                    offsets = [index for index, pair in enumerate(zip(expected, actual)) if pair[0] != pair[1]]
                    raise RuntimeError('解压可见内存不符，公开用例 ' + str(sum(counts.values())) + '，调用 ' + str(calls) + '，块偏移 ' + str(offsets[:16]))
            if native.allocations != portable.allocations:
                raise RuntimeError('解压消息或状态分配不符')
            calls += 1
            return results[0]

        call('_inflateInit_')
        for _ in range(max(100, len(compressed) * 2 + len(plain) * 2 + 10)):
            raw = native.cpu.mem_read(pointers[0][0], 112)
            offset = struct.unpack_from('<Q', raw, 16)[0]
            result = call('_inflate', min(input_size, len(compressed) - offset))
            raw = native.cpu.mem_read(pointers[0][0], 112)
            produced = output_size - struct.unpack_from('<I', raw, 32)[0]
            restored.extend(native.cpu.mem_read(pointers[0][3], produced))
            if result != 0:
                break
        else:
            raise RuntimeError('公开解压未完成')
        if group == 'valid' and (result != 1 or restored != plain):
            raise RuntimeError('公开合法压缩流未完整还原')
        call('_inflateEnd')
        counts[group] += 1

    for length in (0, 1, 257, 258, 16383, 16384, 16385, 65537):
        pattern = bytes((index * 31 + (index >> 8)) & 255 for index in range(length))
        seed = 0x12345678
        random = bytearray()
        for _ in range(length):
            seed ^= seed << 13 & 0xffffffff
            seed ^= seed >> 17
            seed ^= seed << 5 & 0xffffffff
            random.append(seed & 255)
        for plain in (pattern, bytes(random)):
            for level, strategy in ((0, zlib.Z_DEFAULT_STRATEGY), (6, zlib.Z_DEFAULT_STRATEGY), (6, zlib.Z_FIXED)):
                compressor = zlib.compressobj(level=level, strategy=strategy)
                compressed = compressor.compress(plain) + compressor.flush()
                for input_size, output_size in ((17, 19), (16384, 16384), (len(compressed), max(1, len(plain) + 1))):
                    check(compressed, plain, input_size, output_size, 'valid')
                if length < 259:
                    check(compressed, plain, 1, 1, 'valid')
    for malformed in (b'\0\1', b'\0\0', bytes.fromhex('789c07'), bytes.fromhex('78010101000100')):
        check(malformed, b'', 17, 19, 'invalid')
    valid = zlib.compress(b'Public checksum and truncation fixture.' * 30)
    check(valid[:-1] + bytes([valid[-1] ^ 1]), b'', 17, 19, 'invalid')
    for cutoff in (0, 1, 2, 3, len(valid) - 1):
        check(valid[:cutoff], b'', 17, 19, 'truncated')
    return {'cases': dict(counts), 'stream_calls': calls}


class InflateReplacement(digest_probe.StandardReplacement):
    """沿用此前全部 TS 替换，另外禁止 TS 运行调用宿主 libz。"""
    inflate_worker = None
    completed_inflate = []

    def on_instruction(self, cpu, address, size, context):
        """三个解压导入只转入 TS；其余算法继续遵守既有函数体禁入检查。"""
        name = self.imports.get(address)
        if name in ENTRIES:
            if self.zlib_adapter is None:
                self.zlib_adapter = PortableGuestZlib(self, self.inflate_worker)
            result = self.zlib_adapter.call(name, *[cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:3]])
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        return super().on_instruction(cpu, address, size, context)

    def run(self, entry, arguments=(), stop=None):
        """外层完成后只保存解压操作及长度，不保存资源内容。"""
        result = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and result == 0:
            self.completed_inflate.append(self.zlib_adapter.events.copy())
        return result


def compare(args):
    """联合独立解释器、对象、摘要和流式解压，对照两组原生候选。"""
    worker = digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_inflate)
    InflateReplacement.completed_inflate = []
    observed = []
    original_inspect = slice_probe.inspect

    def reject_native_zlib(*_args):
        """TS 执行若尝试建立原有宿主 libz 适配器，立即失败。"""
        raise RuntimeError('TS 解压路径意外使用原有 libz 适配器')

    def inspect(*values, **options):
        """采集四轮公开流事件，并禁止 TS 轮次回退原有运行时 libz。"""
        if slice_probe.SDSCoreProbe is InflateReplacement:
            with patch.object(slice_probe, 'GuestZlib', reject_native_zlib):
                result = original_inspect(*values, **options)
            dependencies = result['synthetic_dependencies']
            dependencies.remove('real host libz with bounded guest ABI adapter; no guest custom allocators; host system entropy for arc4random')
            dependencies.append('pure TS streaming zlib runtime via private memory pipes; host zlib used only by baseline/vector/shadow oracles; host entropy replayed by comparison driver')
        else:
            result = original_inspect(*values, **options)
        observed.append(result['sds_slice']['zlib_events'])
        return result

    try:
        vectors = verify_vectors(read_binary(args.sample), worker)
        with patch.object(InflateReplacement, 'inflate_worker', worker), patch.object(digest_probe, 'StandardReplacement', InflateReplacement), patch.object(slice_probe, 'inspect', inspect):
            result = digest_probe.compare(args)
        if len(observed) != 4 or observed[0] != observed[1] or observed[2] != observed[3]:
            raise RuntimeError('原生和 TS 的解压逐次事件不符')
        if len(InflateReplacement.completed_inflate) != 2:
            raise RuntimeError('完整解压替换轮数错误')
        for report, events in zip((item for item in result['runs'] if item['mode'] != 'native'), InflateReplacement.completed_inflate):
            finished = [event for event in events if event['operation'] == '_inflate' and event['return_code'] == 1]
            if [event['total_out'] for event in finished] != [306065, 86480, 1230]:
                raise RuntimeError('完整路径解压长度不符')
            report.update(mode='TS-runtime-objects-AES-digests-and-inflate', inflate_events=events, native_libz_calls=0)
        result.update(native_zlib_vectors=vectors, native_libz_calls_in_ts_runs=0, native_zlib_event_sequences_equal=True, native_zlib_runtime_fallback_forbidden=True,
                      scope='independent TS VM, object helpers, AES, digest cores and streaming zlib; native wrappers, module loading/expansion and SDS/platform adapters retained')
        return result
    finally:
        worker.close()
        InflateReplacement.completed_inflate.clear()


def main():
    """只输出脱敏计数；所有资源、熵和候选留在父子进程内存。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('inflate', 'standard', 'buffer', 'runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--vectors-only', action='store_true')
    args = parser.parse_args()
    if args.vectors_only:
        worker = digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_inflate)
        try:
            result = verify_vectors(read_binary(args.sample), worker)
        finally:
            worker.close()
    else:
        result = compare(args)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
