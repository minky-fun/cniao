"""Verify section parsing against public native vectors and the complete offline module loading path."""
import argparse
from collections import Counter
import json
import struct
from unittest.mock import patch

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, read_binary
import verify_portable_expand as expand_probe

ENTRY = 0x102a5ed74


def verify_vectors(data, worker):
    """Compare all allocated bytes, partial writes, native return bits and untouched padding."""
    native = expand_probe.module_probe.ModuleOracle(data)
    portable = expand_probe.module_probe.ModuleOracle(data)
    counts = Counter()

    def check(descriptors=(), *, group='descriptors', null=0, total=65536, offset=112, declared=None, aggregate=(), alias=None):
        """Construct only synthetic section tables and independently reset both native heaps."""
        arguments = []
        for probe in (native, portable):
            probe.next_address = 0x210000000
            probe.allocations.clear()
            probe.frees.clear()
            probe.attempts = 0
            source = probe.allocate(65536)
            target = probe.allocate(280)
            probe.cpu.mem_write(source, bytes(65536))
            probe.cpu.mem_write(source + 8, struct.pack('<I', total))
            probe.cpu.mem_write(source + 0x34, struct.pack('<II', offset, len(descriptors) if declared is None else declared))
            for index, (tag, value) in enumerate(descriptors):
                probe.cpu.mem_write(source + 112 + index * 8, struct.pack('<II', tag, value))
            probe.cpu.mem_write(target, b'\xa5' * 280)
            probe.cpu.mem_write(target + 0x30, struct.pack('<QI', source + 4096, len(aggregate)))
            for index, value in enumerate(aggregate):
                probe.cpu.mem_write(source + 4096 + index * 8, struct.pack('<II', index, value))
            if alias == 'header':
                target = source
            elif alias == 'next-descriptor':
                target = source + 104
            elif alias == 'table':
                target = source + 112
            arguments.append((0 if null == 1 else source, 0 if null == 2 else target))
        expected = native.run(ENTRY, arguments[0])
        actual = worker.calculate(portable, ENTRY, arguments[1])
        case = str(sum(counts.values()))
        if actual != expected or native.allocations != portable.allocations or native.frees != portable.frees:
            raise RuntimeError('Section parser ABI or heap mismatch at public case ' + case)
        for address, size in native.allocations.items():
            if bytes(native.cpu.mem_read(address, size)) != bytes(portable.cpu.mem_read(address, size)):
                raise RuntimeError('Section parser visible bytes differ at public case ' + case)
        counts[group] += 1

    for null in (1, 2):
        check(null=null, group='null')
    for tag in range(41):
        for value in (0, 1, 2, 17, 512, 0xffffffff):
            if tag == 12 and value == 0xffffffff:
                continue
            check([(tag, value)], group='tags_and_values')
    for tag in (0, 23, 32, 33, 37, 0xffffffff):
        check([(1, 512), (tag, 16), (2, 19)], group='partial_rejection')
    for tag in range(1, 37):
        check([(tag, 17), (tag, 3)], group='repeated_tags')
    for count in (0, 1, 2, 17):
        check([(1, index * 4) for index in range(count)], group='multiple_descriptors')
    for total, offset, count in ((0, 0, 0), (112, 112, 0), (113, 112, 0), (119, 112, 1), (120, 112, 1), (121, 112, 1), (128, 112, 2), (65536, 65535, 1), (65536, 0xffffffff, 1), (65536, 112, 0xffffffff)):
        check([(1, 512), (2, 3)], total=total, offset=offset, declared=count, group='table_boundaries')
    for values in ((), (0,), (1,), (0xffffffff,), (0xffffffff, 2), (1, 2, 3), tuple(range(17))):
        check(aggregate=values, group='aggregate')
        check([(11, 4096), (12, len(values))], aggregate=values, group='aggregate_from_descriptors')
    for alias in ('header', 'next-descriptor', 'table'):
        check([(1, 512), (12, 0) if alias == 'header' else (2, 3)], alias=alias, group='alias')
    check([(11, 4096), (12, 2)], alias='header', group='alias')
    return dict(counts)


class SectionsReplacement(expand_probe.ExpandReplacement):
    """Use TS section parsing during real module loading; native loader helpers remain explicit."""
    sections_worker = None
    completed_sections = []

    def __init__(self, *args, **kwargs):
        """Keep only a section-parser entry count for the complete path report."""
        super().__init__(*args, **kwargs)
        self.section_calls = 0

    def on_instruction(self, cpu, address, size, context):
        """Intercept the exact parser entry and prohibit the native body after replacement."""
        if address == ENTRY:
            self.section_calls += 1
            result = self.sections_worker.calculate(self, ENTRY, [cpu.reg_read(register) for register in ARGUMENT_REGISTERS])
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        if ENTRY < address < 0x102a5f4c0:
            raise RuntimeError('Native section parser body executed in TS replacement mode')
        return super().on_instruction(cpu, address, size, context)

    def run(self, entry, arguments=(), stop=None):
        """Capture only final coverage totals after the full signing candidate path succeeds."""
        result = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and result == 0:
            self.completed_sections.append(self.section_calls)
        return result


def compare(args):
    """Run public parser vectors, then compose with all previous TS replacements."""
    worker = expand_probe.module_probe.digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_sections)
    SectionsReplacement.completed_sections = []
    try:
        vectors = verify_vectors(read_binary(args.sample), worker)
        with patch.object(SectionsReplacement, 'sections_worker', worker), patch.object(expand_probe, 'ExpandReplacement', SectionsReplacement):
            result = expand_probe.compare(args)
        if len(SectionsReplacement.completed_sections) != 2 or not all(SectionsReplacement.completed_sections):
            raise RuntimeError('Complete path section parser coverage missing')
        for report, count in zip((item for item in result['runs'] if item['mode'] != 'native'), SectionsReplacement.completed_sections):
            report.update(mode='TS-runtime-through-module-section-parsing', module_section_calls=count, native_module_section_body_entries=0)
        result.update(native_module_section_vectors=vectors, native_module_section_body_entries_in_ts_runs=0,
                      scope='TS section parsing plus previous replacements; loader validation/allocation/binding, initialization and SDS/platform state remain explicit')
        return result
    finally:
        worker.close()
        SectionsReplacement.completed_sections.clear()


def main():
    """Print only sanitized totals; section contents and decoded resources stay in private pipes."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('sections', 'expand', 'module', 'inflate', 'standard', 'buffer', 'runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--vectors-only', action='store_true')
    args = parser.parse_args()
    if args.vectors_only:
        worker = expand_probe.module_probe.digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_sections)
        try:
            result = {'native_module_section_vectors': verify_vectors(read_binary(args.sample), worker)}
        finally:
            worker.close()
    else:
        result = compare(args)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
