"""Validate portable registry data operations and section parsing without exporting private runtime state."""
import argparse
from collections import Counter
import json
import struct
from unittest.mock import patch

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, read_binary
import verify_portable_sections as sections_probe

ENTRIES = {'createTable': 0x102a54168, 'destroyTable': 0x102a54228,
           'append': 0x102a56414, 'get': 0x102a56494, 'remove': 0x102a564f4}


class RegistryOracle(sections_probe.expand_probe.module_probe.ModuleOracle):
    """Use real table/list functions with the existing serial synchronization oracle."""

    def __init__(self, data):
        """Add only the three imports verified against the fixed Mach-O indirect symbol table."""
        super().__init__(data)
        self.imports.update({0x104431d84: '_pthread_rwlock_rdlock', 0x104431db4: '_pthread_rwlock_wrlock', 0x104431da8: '_pthread_rwlock_unlock'})


def verify_vectors(data, worker):
    """Compare native returns, all allocated bytes, realloc copying and allocation/free order."""
    native, portable = RegistryOracle(data), RegistryOracle(data)
    counts = Counter()

    def check(name, *, state=0, records=0, null=0, failure=None, capacity=4, count=0, value=0x41, index=0, alias=False):
        """Build explicit public tables or padded lists; no user or SDK state is read."""
        arguments = []
        for probe in (native, portable):
            probe.next_address = 0x210000000
            probe.allocations.clear()
            probe.frees.clear()
            probe.attempts = 0
            probe.fail_at = None
            header = probe.allocate(128)
            probe.cpu.mem_write(header, bytes(128))
            if name in ('createTable', 'destroyTable'):
                array = probe.allocate(max(24, records * 24))
                lookup = probe.allocate(64)
                probe.cpu.mem_write(array, bytes(max(24, records * 24)))
                for cursor in range(records):
                    pointer = probe.allocate(32)
                    probe.cpu.mem_write(array + cursor * 24, struct.pack('<Q', pointer if cursor % 3 else 0))
                probe.cpu.mem_write(header, struct.pack('<QQI', lookup if state & 1 else 0, array if state & 2 else 0, records))
                fields = [header, header if alias else header + 8, header + 16]
                if null:
                    fields[null - 1] = 0
                args = tuple(fields)
            else:
                array = probe.allocate(max(256, (capacity + 2) * 8))
                probe.cpu.mem_write(array, bytes([0xa5]) * probe.allocations[array])
                for cursor in range(count):
                    probe.cpu.mem_write(array + cursor * 8, struct.pack('<Q', (0x41, 0x42, 0x41, 0)[cursor % 4]))
                probe.cpu.mem_write(header, struct.pack('<QII', array, capacity, count))
                args = (header, index if name == 'get' else value)
            probe.fail_at = probe.attempts + failure if failure else None
            arguments.append(args)
        expected = native.run(ENTRIES[name], arguments[0])
        actual = worker.calculate(portable, ENTRIES[name], arguments[1])
        case = str(sum(counts.values()))
        if actual != expected or native.allocations != portable.allocations or native.frees != portable.frees or native.attempts != portable.attempts:
            raise RuntimeError('Registry ABI or heap ordering differs at public case ' + case + ' (' + name + ')')
        for address, size in native.allocations.items():
            if bytes(native.cpu.mem_read(address, size)) != bytes(portable.cpu.mem_read(address, size)):
                raise RuntimeError('Registry visible bytes differ at public case ' + case + ' (' + name + ')')
        counts[name] += 1

    for name in ('createTable', 'destroyTable'):
        for null in (1, 2, 3):
            check(name, null=null)
    for state in range(4):
        for failure in (None, 1, 2):
            check('createTable', state=state, failure=failure)
        for records in (0, 1, 2, 3, 17):
            check('destroyTable', state=state, records=records)
    for state in (0, 1, 3):
        check('createTable', state=state, alias=True)
    for capacity in (0, 1, 2, 3, 4, 5, 7, 8, 9, 16, 20):
        for count in sorted({0, 1, max(0, capacity // 4), max(0, capacity // 4 + 1), capacity}):
            for failure in (None, 1):
                check('append', capacity=capacity, count=count, failure=failure)
                for value in (0, 0x41, 0x42, 0x44):
                    check('remove', capacity=capacity, count=count, value=value, failure=failure)
            for index in (0, 1, count, max(0, count - 1), 0x7fffffff, 0x80000000, 0xffffffff, 0x100000000):
                check('get', capacity=capacity, count=count, index=index)
    return dict(counts)


class RegistryReplacement(sections_probe.SectionsReplacement):
    """Replace table/list bodies while leaving global initializer control and platform contracts explicit."""
    registry_worker = None
    completed_registries = []

    def __init__(self, *args, **kwargs):
        """Record only named entry counts, not module identities or registry contents."""
        super().__init__(*args, **kwargs)
        self.registry_counts = Counter()

    def on_instruction(self, cpu, address, size, context):
        """Delegate only verified entries to TS and prohibit any native body fallback."""
        if address in ENTRIES.values():
            name = next(name for name, target in ENTRIES.items() if target == address)
            self.registry_counts[name] += 1
            result = self.registry_worker.calculate(self, address, [cpu.reg_read(register) for register in ARGUMENT_REGISTERS])
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        if 0x102a54168 <= address < 0x102a542c8 or 0x102a56414 <= address < 0x102a565f4:
            raise RuntimeError('Native registry body executed in TS replacement mode')
        return super().on_instruction(cpu, address, size, context)

    def run(self, entry, arguments=(), stop=None):
        """Keep complete-path totals only when the candidate calculation finishes."""
        result = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and result == 0:
            self.completed_registries.append(dict(self.registry_counts))
        return result


def compare(args):
    """Compose registry native ABI vectors with sections and all previous portable milestones."""
    worker = sections_probe.expand_probe.module_probe.digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_registry)
    RegistryReplacement.completed_registries = []
    try:
        vectors = verify_vectors(read_binary(args.sample), worker)
        with patch.object(RegistryReplacement, 'registry_worker', worker), patch.object(sections_probe, 'SectionsReplacement', RegistryReplacement):
            result = sections_probe.compare(args)
        if len(RegistryReplacement.completed_registries) != 2:
            raise RuntimeError('Complete registry comparison run count differs')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), RegistryReplacement.completed_registries):
            if not all(counts.get(name) for name in ('createTable', 'append')):
                raise RuntimeError('Complete registry path coverage missing')
            report.update(mode='TS-runtime-through-sections-and-registry-data', registry_calls=counts, native_registry_body_entries=0)
        result.update(native_registry_vectors=vectors, native_registry_body_entries_in_ts_runs=0,
                      scope='TS section parsing and registry data plus previous replacements; global initializer control, loader binding and synchronization/platform state remain explicit')
        return result
    finally:
        worker.close()
        RegistryReplacement.completed_registries.clear()


def main():
    """Print sanitized verification counts only; registry pointers and data are never persisted."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('registry', 'sections', 'expand', 'module', 'inflate', 'standard', 'buffer', 'runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--vectors-only', action='store_true')
    args = parser.parse_args()
    if args.vectors_only:
        worker = sections_probe.expand_probe.module_probe.digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_registry)
        try:
            result = {'native_registry_vectors': verify_vectors(read_binary(args.sample), worker)}
        finally:
            worker.close()
    else:
        result = compare(args)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
