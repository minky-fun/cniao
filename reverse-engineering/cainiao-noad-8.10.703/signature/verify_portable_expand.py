"""Compare bounded TS packed-instruction lifting with native output; do not export module data."""
import argparse
from collections import Counter, deque
import json
import random
import struct
from unittest.mock import patch

from unicorn import UC_HOOK_CODE
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, NativeProbe, read_binary
from verify_signature_candidate import CaptureProbe
import verify_portable_module as module_probe

ENTRY = 0x102a5a97c


def verify_vectors(data, worker):
    """Compare entire output regions, padding, metadata and unchanged source on public inputs."""
    native, portable = module_probe.ModuleOracle(data), module_probe.ModuleOracle(data)
    rng = random.Random(1703)
    counts = Counter()

    def check(words, count, group, padding=0xa5):
        """Execute one public stream, with actual mapped lookahead and no inferred fields."""
        arguments = []
        for probe in (native, portable):
            probe.next_address = 0x210000000
            probe.allocations.clear()
            probe.frees.clear()
            probe.attempts = 0
            module = probe.allocate(336)
            source = probe.allocate(len(words) * 4)
            output = probe.allocate(max(16, count * 16))
            probe.cpu.mem_write(module, bytes(336))
            probe.cpu.mem_write(module + 0x30, struct.pack('<Q', output))
            probe.cpu.mem_write(module + 0x124, struct.pack('<IQ', count, source))
            probe.cpu.mem_write(source, struct.pack('<' + 'I' * len(words), *words))
            probe.cpu.mem_write(output, bytes([padding]) * max(16, count * 16))
            probe.cpu.mem_write(probe.stack + 0xff000 - 0x210, bytes([padding]) * 0x210)
            arguments.append((module,))
        expected = native.run(ENTRY, arguments[0])
        try:
            actual = worker.calculate(portable, ENTRY, arguments[1])
        except RuntimeError as error:
            raise RuntimeError('Packed expander rejected public case ' + str(sum(counts.values()))) from error
        if actual != expected or native.allocations != portable.allocations or native.frees != portable.frees:
            raise RuntimeError('Packed expander return or allocation mismatch at public case ' + str(sum(counts.values())) + ', return=' + str(actual))
        for address, size in native.allocations.items():
            if bytes(native.cpu.mem_read(address, size)) != bytes(portable.cpu.mem_read(address, size)):
                raise RuntimeError('Packed expander output mismatch at public case ' + str(sum(counts.values())))
        counts[group] += 1

    for count in (0, 1):
        check([0] * 9, count, 'empty')
    for low in range(1024):
        words = [rng.getrandbits(32) for _ in range(10)]
        words[1] = (words[1] & ~1023) | low
        check(words, 2, 'primary_and_subfields')
    for primary in range(32):
        for value in (0, 0xffffffff, 0x80000000, 0x7fffffff):
            words = [0, (value & ~31) | primary] + [value] * 8
            check(words, 2, 'bit_boundaries', padding=primary * 7 & 255)
    for primary in range(32):
        for following in range(32):
            words = [0, (rng.getrandbits(32) & ~31) | primary, (rng.getrandbits(32) & ~31) | following] + [rng.getrandbits(32) for _ in range(8)]
            check(words, 3, 'adjacent_primary_pairs')
    for index in range(240):
        count = 3 + index % 29
        words = [rng.getrandbits(32) for _ in range(count + 8)]
        check(words, count, 'mixed_streams', padding=index & 255)
    return dict(counts)


class ExpandReplacement(module_probe.ModuleReplacement):
    """Retain previous replacements and prohibit all native packed expander execution."""
    expand_worker = None
    completed_expansions = []
    expected_outputs = deque()

    def __init__(self, *args, **kwargs):
        """Record only the number of entries, not packed or expanded data."""
        super().__init__(*args, **kwargs)
        self.expansions = 0

    def on_instruction(self, cpu, address, size, context):
        """Route the confirmed expander entry to TS and reject native body fallback."""
        if address == ENTRY:
            self.expansions += 1
            module = cpu.reg_read(ARGUMENT_REGISTERS[0])
            count = struct.unpack('<I', cpu.mem_read(module + 0x124, 4))[0]
            target = struct.unpack('<Q', cpu.mem_read(module + 0x30, 8))[0]
            if not self.expected_outputs or self.expected_outputs[0][0] != count:
                raise RuntimeError('Native packed output baseline missing or shape changed')
            result = self.expand_worker.calculate(self, ENTRY, [cpu.reg_read(register) for register in ARGUMENT_REGISTERS])
            expected_count, expected = self.expected_outputs.popleft()
            if result != 0 or count != expected_count or bytes(cpu.mem_read(target, count * 16)) != expected or bytes(cpu.mem_read(module + 16, 1)) != b'\x01':
                raise RuntimeError('Actual module expanded bytes differ from native baseline')
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        if ENTRY < address < 0x102a5cebc:
            raise RuntimeError('Native packed expander body executed in TS replacement mode')
        return super().on_instruction(cpu, address, size, context)

    def run(self, entry, arguments=(), stop=None):
        """Record coverage only after the complete candidate path finishes."""
        result = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and result == 0:
            self.completed_expansions.append(self.expansions)
        return result


def compare(args):
    """Compose full-path native comparison with an independently checked TS expander."""
    worker = module_probe.digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_expand)
    ExpandReplacement.completed_expansions = []
    ExpandReplacement.expected_outputs.clear()
    initialize = NativeProbe.__init__

    def capture_native(probe, *values, **options):
        """Keep native expanded records in private process memory only for bytewise comparison."""
        initialize(probe, *values, **options)
        if not isinstance(probe, CaptureProbe) or isinstance(probe, ExpandReplacement):
            return
        frames = []

        def observe(cpu, address, size, context):
            """Capture only finished expansion buffers; never persist their bytes or hashes."""
            if address == ENTRY:
                module = cpu.reg_read(ARGUMENT_REGISTERS[0])
                count = struct.unpack('<I', cpu.mem_read(module + 0x124, 4))[0]
                target = struct.unpack('<Q', cpu.mem_read(module + 0x30, 8))[0]
                if count > 65536:
                    raise RuntimeError('Native packed baseline exceeds verification boundary')
                frames.append((count, target))
            elif address == 0x102a5ce90:
                count, target = frames.pop()
                ExpandReplacement.expected_outputs.append((count, bytes(cpu.mem_read(target, count * 16))))

        probe.cpu.hook_add(UC_HOOK_CODE, observe, begin=ENTRY, end=0x102a5ce90)

    try:
        vectors = verify_vectors(read_binary(args.sample), worker)
        with patch.object(ExpandReplacement, 'expand_worker', worker), patch.object(module_probe, 'ModuleReplacement', ExpandReplacement), patch.object(NativeProbe, '__init__', capture_native):
            result = module_probe.compare(args)
        if len(ExpandReplacement.completed_expansions) != 2 or not all(ExpandReplacement.completed_expansions) or ExpandReplacement.expected_outputs:
            raise RuntimeError('Packed expander complete path coverage missing')
        for report, count in zip((item for item in result['runs'] if item['mode'] != 'native'), ExpandReplacement.completed_expansions):
            report.update(mode='TS-runtime-objects-crypto-inflate-module-and-packed-expansion', packed_expander_calls=count, native_packed_expander_body_entries=0)
        result.update(native_packed_expander_vectors=vectors, native_packed_expander_body_entries_in_ts_runs=0, actual_expanded_module_bytes_equal_native=True,
                      scope='bounded TS packed-instruction lifting plus previous replacements; module loading, global initialization and SDS/platform dependencies remain explicit')
        return result
    finally:
        worker.close()
        ExpandReplacement.completed_expansions.clear()
        ExpandReplacement.expected_outputs.clear()


def main():
    """Only print public case totals and sanitized complete-path comparison metadata."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('expand', 'module', 'inflate', 'standard', 'buffer', 'runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--vectors-only', action='store_true')
    args = parser.parse_args()
    if args.vectors_only:
        worker = module_probe.digest_probe.buffer_probe.BufferWorker(args.portable_buffer, args.node, standard=args.portable_expand)
        try:
            result = {'native_packed_expander_vectors': verify_vectors(read_binary(args.sample), worker)}
        finally:
            worker.close()
    else:
        result = compare(args)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
