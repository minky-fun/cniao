"""Compare module validation and backend tail-call plans; retain actual module payloads only in memory."""
import argparse
from collections import Counter
import json
import struct
from unittest.mock import patch
import zlib

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, read_binary
import verify_portable_registry as registry_probe

ENTRY = 0x102a631e4
BACKENDS = (0x102a5e240, 0x102a626f0)


def checksum(data):
    """Independently derive the native MSB-first CRC from zlib by reversing input and result bits."""
    reversed_input = bytes(int(f'{value:08b}'[::-1], 2) for value in data)
    reflected = zlib.crc32(reversed_input) ^ 0xffffffff
    return int(f'{reflected:032b}'[::-1], 2)


class HeaderOracle(registry_probe.RegistryOracle):
    """Execute the real validator and stop at either confirmed tail-called backend."""

    def __init__(self, data):
        """Keep only synthetic tail-call register packets for isolated native vectors."""
        super().__init__(data)
        self.plans = []

    def on_instruction(self, cpu, address, size, context):
        """Capture backend ABI arguments without simulating loader success or running the backend."""
        if address in BACKENDS:
            fields = [cpu.reg_read(ARGUMENT_REGISTERS[index]) for index in (0, 1, 2, 4)]
            self.plans.append(dict(zip(('context', 'source', 'length', 'output'), fields), kind='tailCall', target=address))
            cpu.reg_write(ARGUMENT_REGISTERS[0], 0x13579)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        return super().on_instruction(cpu, address, size, context)


def verify_vectors(data, worker):
    """Compare all visible bytes, version flags, status codes and exact backend arguments."""
    native, portable = HeaderOracle(data), HeaderOracle(data)
    counts = Counter()
    table = struct.unpack('<256I', native.cpu.mem_read(0x10481f388, 1024))
    for index in range(256):
        value = index << 24
        for _ in range(8):
            value = ((value << 1) ^ (0x04c11db7 if value & 0x80000000 else 0)) & 0xffffffff
        if table[index] != value:
            raise RuntimeError('Native module checksum table differs from verified polynomial')

    def check(*, group='raw', length=128, total=128, version=0x10001, subtype=7, flags=0, magic=0xb225081a,
              null=0, crc_bad=False, bundle=None, bundle_flags=None, alias=None):
        """Construct public raw modules or packed selectors; never read application module resources."""
        arguments = []
        for probe in (native, portable):
            probe.next_address = 0x210000000
            probe.allocations.clear()
            probe.frees.clear()
            probe.attempts = 0
            probe.plans.clear()
            context = probe.allocate(232)
            source = probe.allocate(65536)
            output = probe.allocate(8)
            probe.cpu.mem_write(source, bytes(65536))

            def header(address):
                """Build one synthetic header and checksum with a public reproducible payload pattern."""
                size = min(max(128, total), 32769)
                raw = bytearray((index * 31 + 7) & 255 for index in range(size))
                struct.pack_into('<I', raw, 0, magic)
                struct.pack_into('<IIII', raw, 8, total, flags, 0, version)
                struct.pack_into('<I', raw, 0x48, subtype)
                if flags & 0x40 and 20 <= total <= len(raw):
                    struct.pack_into('<I', raw, 16, checksum(raw[20:total]) ^ (1 if crc_bad else 0))
                probe.cpu.mem_write(address, bytes(raw))

            if bundle is None:
                header(source)
            else:
                probe.cpu.mem_write(source, struct.pack('<4I', magic, 0, 0xba137616, (len(bundle) << 26) | 0x40000 if bundle_flags is None else bundle_flags))
                for index, (kind, offset, child_length) in enumerate(bundle):
                    probe.cpu.mem_write(source + 16 + index * 8, struct.pack('<Q', (kind << 58) | (offset << 29) | child_length))
                    if kind == 0:
                        header(source + offset)
            if alias == 'context-source':
                context = source
            elif alias == 'context-reset-source':
                context = source - 0x58
            args = (0 if null == 1 else context, 0 if null == 2 else source, length, 0x55, output)
            arguments.append(args)
        status = native.run(ENTRY, arguments[0])
        if native.plans:
            if len(native.plans) != 1 or status != 0x13579:
                raise RuntimeError('Native header tail-call capture did not finish')
            expected = native.plans[0]
        else:
            expected = {'kind': 'return', 'status': status}
        actual = worker.calculate(portable, ENTRY, arguments[1], operation='planLoad')
        case = str(sum(counts.values()))
        if actual != expected:
            raise RuntimeError('Module header plan differs at public case ' + case + ' (' + group + ')')
        if native.allocations != portable.allocations or native.frees != portable.frees or native.attempts != portable.attempts:
            raise RuntimeError('Module header changed heap operations at public case ' + case)
        for address, size in native.allocations.items():
            if bytes(native.cpu.mem_read(address, size)) != bytes(portable.cpu.mem_read(address, size)):
                raise RuntimeError('Module header visible bytes differ at public case ' + case)
        counts[group] += 1

    for null in (1, 2):
        check(null=null, group='null')
    for length in (0, 1, 112, 113, 127, 128, 129, 0x100000000, 0x100000071, 0x100000080):
        check(length=length, group='length_bits')
    for version in (0, 1, 0x10000, 0x10001, 0x10002, 0x10003, 0x7fffffff, 0x80000000, 0xffffffff):
        for subtype in (0, 7, 8):
            check(version=version, subtype=subtype, group='versions')
    for magic in (0, 1, 0xba137616, 0xffffffff):
        check(magic=magic, group='magic')
    for total in (0, 1, 19, 20, 112, 113, 128, 129, 512, 0xffffffff):
        check(total=total, group='declared_size')
    for total in (20, 21, 24, 55, 56, 57, 112, 113, 128, 255, 256, 257, 4095, 4096, 4097, 16384, 16385, 32769):
        for bad in (False, True):
            check(length=max(128, total), total=total, flags=0x40, crc_bad=bad, group='checksum')
    for count in (1, 2, 3, 17, 63):
        for selected in (0, count - 1, None):
            bundle = [(0 if index == selected else 1 + index % 63, 1024 + index * 512, 128) for index in range(count)]
            check(bundle=bundle, group='bundle_selection')
    for flags in (0, 0x40000, 1 << 26, (1 << 26) | 0x80000, (1 << 26) | 0x40000):
        check(bundle=[(0, 1024, 128)], bundle_flags=flags, group='bundle_flags')
    for version in (0x10001, 0x10002, 0x10003):
        for subtype in (0, 7, 8):
            check(bundle=[(0, 1024, 128)], version=version, subtype=subtype, group='bundle_versions')
    for child_length in (0, 112, 113, 127, 128, 129):
        check(bundle=[(1, 2048, 128), (0, 1024, child_length)], group='bundle_child_length')
    for magic in (0, 1, 0xffffffff):
        check(bundle=[(0, 1024, 128)], magic=magic, group='bundle_child_magic')
    for total in (20, 128, 4097):
        for bad in (False, True):
            check(bundle=[(0, 1024, max(128, total))], length=128, total=total, flags=0x40, crc_bad=bad, group='bundle_checksum')
    for flags in (0, 0x40):
        for alias in ('context-source', 'context-reset-source'):
            check(flags=flags, alias=alias, group='alias')
    return dict(counts)


class HeaderReplacement(registry_probe.RegistryReplacement):
    """Replace validator control with an explicit TS plan; confirmed core loader targets remain native."""
    header_worker = None
    completed_headers = []

    def __init__(self, *args, **kwargs):
        """Retain only statuses and selected backend counts for verification reports."""
        super().__init__(*args, **kwargs)
        self.header_counts = Counter()

    def on_instruction(self, cpu, address, size, context):
        """Apply the validated plan without entering the original header function body."""
        if address == ENTRY:
            plan = self.header_worker.calculate(self, ENTRY, [cpu.reg_read(register) for register in ARGUMENT_REGISTERS], operation='planLoad')
            if plan['kind'] == 'return':
                self.header_counts['return'] += 1
                cpu.reg_write(ARGUMENT_REGISTERS[0], plan['status'])
                cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            else:
                self.header_counts[hex(plan['target'])] += 1
                for index, key in ((0, 'context'), (1, 'source'), (2, 'length'), (4, 'output')):
                    cpu.reg_write(ARGUMENT_REGISTERS[index], plan[key])
                cpu.reg_write(UC_ARM64_REG_PC, plan['target'])
            return
        if ENTRY < address < 0x102a6379c:
            raise RuntimeError('Native module validator body executed in TS replacement mode')
        return super().on_instruction(cpu, address, size, context)

    def run(self, entry, arguments=(), stop=None):
        """Record backend coverage after the complete candidate path finishes."""
        result = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and result == 0:
            self.completed_headers.append(dict(self.header_counts))
        return result


def compare(args):
    """Check public header plans and all earlier portable replacements in the complete path."""
    worker = registry_probe.sections_probe.expand_probe.module_probe.digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_header)
    HeaderReplacement.completed_headers = []
    try:
        vectors = verify_vectors(read_binary(args.sample), worker)
        with patch.object(HeaderReplacement, 'header_worker', worker), patch.object(registry_probe, 'RegistryReplacement', HeaderReplacement):
            result = registry_probe.compare(args)
        if len(HeaderReplacement.completed_headers) != 2 or not all(HeaderReplacement.completed_headers):
            raise RuntimeError('Complete module header path coverage missing')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), HeaderReplacement.completed_headers):
            report.update(mode='TS-runtime-through-module-header-plans', module_header_calls=counts, native_module_header_body_entries=0)
        result.update(native_module_header_vectors=vectors, native_module_header_body_entries_in_ts_runs=0,
                      scope='TS module validation/selection/checksum plus prior replacements; selected loader core backends, binding and global/platform initialization remain explicit')
        return result
    finally:
        worker.close()
        HeaderReplacement.completed_headers.clear()


def main():
    """Print sanitized comparison totals only; source modules and backend arguments remain private."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('header', 'registry', 'sections', 'expand', 'module', 'inflate', 'standard', 'buffer', 'runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--vectors-only', action='store_true')
    args = parser.parse_args()
    if args.vectors_only:
        worker = registry_probe.sections_probe.expand_probe.module_probe.digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_header)
        try:
            result = {'native_module_header_vectors': verify_vectors(read_binary(args.sample), worker)}
        finally:
            worker.close()
    else:
        result = compare(args)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
