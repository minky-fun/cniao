"""对照模块准备函数的原生 ABI，并与 TS VM、对象、摘要和解压联合验证。"""
import argparse
from collections import Counter
import json
import struct
from unittest.mock import patch

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_SP, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, read_binary
import verify_portable_digest as digest_probe
import verify_portable_inflate as inflate_probe

ENTRIES = {'prepareCache': 0x102a527f0, 'releaseCache': 0x102a528a4, 'defaultConfig': 0x102a52940,
           'configName': 0x102a5297c, 'createEngine': 0x102a52988, 'decodeStrings': 0x102a5da7c}


class ModuleOracle(digest_probe.StandardOracle):
    """使用真实模块函数体和已有的有界分配器，不替换模块计算。"""

    def __init__(self, data):
        """仅补入本次函数实际依赖的两个已核实 C 导入。"""
        super().__init__(data)
        self.imports.update({0x104430b60: '_gettimeofday', 0x10443146c: '_memset'})


def verify_vectors(data, worker):
    """比较全部已分配内存、返回位、分配/释放顺序及全局时钟字段。"""
    native, portable = ModuleOracle(data), ModuleOracle(data)
    counts = Counter()

    def check(name, *, null=False, failure=None, custom=False, cache_state=0, records=0, table_count=0, length=0, offset=0, key=0):
        """构造公开配置和段描述符；缺失配置或依赖不被替换为伪成功。"""
        arguments = []
        for probe in (native, portable):
            probe.next_address = 0x210000000
            probe.allocations.clear()
            probe.frees.clear()
            probe.attempts = 0
            probe.fail_at = None
            engine, module, base, table, config = [probe.allocate(size) for size in (16, 336, 32768, 44 * max(1, table_count), 32)]
            probe.cpu.mem_write(engine, struct.pack('<Q', module))
            probe.cpu.mem_write(module, bytes(336))
            probe.cpu.mem_write(module + 24, struct.pack('<Q', base))
            probe.cpu.mem_write(base, bytes((index * 31 + 7) & 255 for index in range(32768)))
            probe.cpu.mem_write(config, bytes(index * 7 for index in range(32)))
            if name == 'releaseCache' or cache_state:
                record_array = probe.allocate(max(40, records * 40))
                probe.cpu.mem_write(record_array, bytes(max(40, records * 40)))
                for index in range(records):
                    allocation = probe.allocate(32)
                    probe.cpu.mem_write(record_array + index * 40, struct.pack('<Q', allocation if index % 3 else 0))
                lookup = probe.allocate(32)
                probe.cpu.mem_write(module + 64, struct.pack('<QI4xQ', record_array if cache_state & 1 else 0, records, lookup if cache_state & 2 else 0))
            if name == 'decodeStrings':
                probe.cpu.mem_write(module + 0x108, struct.pack('<QI', table if not null else 0, table_count))
                for index in range(table_count):
                    probe.cpu.mem_write(table + index * 44, struct.pack('<IIIB31x', index, offset + index * 17, length if index % 3 != 1 else 0, (key + index * 3) & 255))
            stack = probe.stack + 0xff000
            probe.cpu.reg_write(UC_ARM64_REG_SP, stack)
            probe.cpu.mem_write(stack - 0x200, b'\x5a' * 0x210)
            probe.cpu.mem_write(0x1068f1664, struct.pack('<I', 1))
            probe.cpu.mem_write(0x1069c1260, b'\xa5' * 8)
            if name == 'createEngine':
                args = (config if custom else 0,)
            elif name == 'decodeStrings':
                args = (engine, module)
            else:
                args = (0 if null else module,)
            arguments.append(args)
            probe.fail_at = probe.attempts + failure if failure else None
        expected = native.run(ENTRIES[name], arguments[0])
        actual = worker.calculate(portable, ENTRIES[name], arguments[1])
        case = str(sum(counts.values()))
        if expected != actual or native.allocations != portable.allocations or native.frees != portable.frees or native.attempts != portable.attempts:
            raise RuntimeError('模块 ABI 或堆操作不符，公开用例 ' + case + ' (' + name + ')')
        for address, size in native.allocations.items():
            if bytes(native.cpu.mem_read(address, size)) != bytes(portable.cpu.mem_read(address, size)):
                raise RuntimeError('模块可见内存不符，公开用例 ' + case + ' (' + name + ')')
        if bytes(native.cpu.mem_read(0x1069c1260, 8)) != bytes(portable.cpu.mem_read(0x1069c1260, 8)):
            raise RuntimeError('模块构造器时钟字段不符')
        counts[name] += 1

    check('configName')
    for null in (False, True):
        check('defaultConfig', null=null)
        check('prepareCache', null=null)
        check('releaseCache', null=null)
    for custom in (False, True):
        for failure in (None, 1, 2):
            check('createEngine', custom=custom, failure=failure)
    for cache_state in (0, 1, 2, 3):
        for failure in (None, 1, 2):
            check('prepareCache', cache_state=cache_state, failure=failure)
        for records in (0, 1, 2, 3, 17):
            check('releaseCache', cache_state=cache_state, records=records)
    for table_count in (0, 1, 2, 3, 17):
        check('decodeStrings', null=True, table_count=table_count)
        for length in (0, 1, 2, 15, 16, 255, 256, 257, 4097):
            for key in (0, 1, 127, 255):
                check('decodeStrings', table_count=table_count, length=length, offset=127, key=key)
    return dict(counts)


class ModuleReplacement(inflate_probe.InflateReplacement):
    """同时启用此前 TS 替换，并禁止六个模块函数体继续原生执行。"""
    module_worker = None
    completed_modules = []

    def __init__(self, *args, **kwargs):
        """只保存入口计数，不记录配置、字符串或设备时间。"""
        super().__init__(*args, **kwargs)
        self.module_counts = Counter()

    def on_instruction(self, cpu, address, size, context):
        """确定入口交给 TS，其他初始化和模块解码逻辑仍显式保留。"""
        if address in ENTRIES.values():
            self.module_counts[next(name for name, target in ENTRIES.items() if target == address)] += 1
            result = self.module_worker.calculate(self, address, [cpu.reg_read(register) for register in ARGUMENT_REGISTERS])
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        if 0x102a527f0 <= address < 0x102a5293c or 0x102a52940 <= address < 0x102a52b08 or 0x102a5da7c <= address < 0x102a5dae8:
            raise RuntimeError('模块替换模式意外执行被替换原生函数体')
        return super().on_instruction(cpu, address, size, context)

    def run(self, entry, arguments=(), stop=None):
        """外层候选完成后记录一次公开入口统计。"""
        result = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and result == 0:
            self.completed_modules.append(dict(self.module_counts))
        return result


def compare(args):
    """先验证公开函数 ABI，再核对两组签名候选及逐操作码执行次数。"""
    worker = digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_module)
    ModuleReplacement.completed_modules = []
    try:
        vectors = verify_vectors(read_binary(args.sample), worker)
        with patch.object(ModuleReplacement, 'module_worker', worker), patch.object(inflate_probe, 'InflateReplacement', ModuleReplacement):
            result = inflate_probe.compare(args)
        if len(ModuleReplacement.completed_modules) != 2:
            raise RuntimeError('模块准备完整替换轮数错误')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), ModuleReplacement.completed_modules):
            if not all(counts.get(name) for name in ('createEngine', 'prepareCache', 'decodeStrings')):
                raise RuntimeError('完整路径模块准备覆盖不足')
            report.update(mode='TS-runtime-objects-crypto-inflate-and-module-preparation', module_calls=counts, native_replaced_module_body_entries=0)
        result.update(native_module_vector_cases=vectors, native_replaced_module_body_entries_in_ts_runs=0,
                      scope='TS VM, object helpers, crypto, zlib and six module preparation helpers; global initialization, module loading/expansion and SDS/platform hosts remain explicit')
        return result
    finally:
        worker.close()
        ModuleReplacement.completed_modules.clear()


def main():
    """输出仅含公开计数，不将模块字符串、资源或候选写入文件。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('module', 'inflate', 'standard', 'buffer', 'runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--vectors-only', action='store_true')
    args = parser.parse_args()
    if args.vectors_only:
        worker = digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_module)
        try:
            result = {'native_module_vector_cases': verify_vectors(read_binary(args.sample), worker)}
        finally:
            worker.close()
    else:
        result = compare(args)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
