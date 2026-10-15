"""用实际 ARM64 CMP/分支核对 TS，并联合已实现内存、标量、AES 比较外层候选。"""
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

from unicorn import UC_HOOK_CODE, UC_PROT_READ
from unicorn.arm64_const import UC_ARM64_REG_NZCV, UC_ARM64_REG_PC, UC_ARM64_REG_X20, UC_ARM64_REG_X24, UC_ARM64_REG_X27, UC_ARM64_REG_X28
import probe_sds_slice as slice_probe
from probe_native import ARGUMENT_REGISTERS, NativeProbe, read_binary
from verify_crypto_operations import AESWorker, CryptoProbe
from verify_signature_candidate import CaptureProbe
from verify_portable_aes_pipeline import ReplacementProbe
from verify_portable_vm_scalar import ScalarReplacement, ScalarWorker
from verify_portable_vm_memory import MemoryReplacement, MemoryWorker, MASK64

HANDLERS = {100: 0x102a2bda8, 101: 0x102a2bddc, 102: 0x102a2be10, 103: 0x102a2be44, 105: 0x102a2beac, 107: 0x102a2bf14, 108: 0x102a2bf48, 109: 0x102a2bf7c, 110: 0x102a2c190, 111: 0x102a2c1c0, 112: 0x102a2c1f0, 115: 0x102a2c280, 116: 0x102a2c2b0, 119: 0x102a2c340, 140: 0x102a2bba0, 145: 0x102a2bca4, 148: 0x102a2bd40, 150: 0x102a2bfb0, 151: 0x102a2bfe0, 152: 0x102a2c010, 156: 0x102a2c0d0, 159: 0x102a2c160}
IMMEDIATE = {110, 111, 112, 115, 116, 119, 150, 151, 152, 156, 159}


class BranchWorker:
    """仅通过内存管道计算 TS 下一指令地址与 NZCV。"""

    def __init__(self, compiled, node):
        """加载明确本地模块并丢弃诊断，避免输出原始比较状态。"""
        source = Path(compiled).resolve(strict=True)
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('vm_branch_worker.cjs')), str(source)], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def calculate(self, opcode, left, right, instruction, displacement):
        """有界读取分支状态；未知或错误响应立即失败。"""
        self.process.stdin.write(json.dumps([opcode, str(left), str(right), str(instruction), str(displacement)]) + '\n')
        self.process.stdin.flush()
        if not select.select([self.process.stdout], [], [], 15)[0]:
            raise RuntimeError('TS 分支计算超时')
        try:
            response = json.loads(self.process.stdout.readline(256))
            target, flags, used = int(response['next']), response['nzcv'], response['usedDisplacement']
            if not 0 <= target <= MASK64 or type(flags) is not int or not 0 <= flags <= 15 or type(used) is not bool:
                raise ValueError()
            return target, flags, used
        except (ValueError, KeyError, TypeError):
            raise RuntimeError('TS 分支响应无效') from None

    def close(self):
        """关闭管道并有界回收子进程，不保存状态。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


class BranchReplacement(MemoryReplacement):
    """再替换 22 种比较分支；保留真实的下一指令派发。"""

    branch_worker = None
    latest = None

    def __init__(self, *args, **kwargs):
        """建立固定入口映射及计数，不改变字节码或调用栈。"""
        super().__init__(*args, **kwargs)
        self.branch_entries = {entry: opcode for opcode, entry in HANDLERS.items()}
        self.branch_counts = Counter()
        BranchReplacement.latest = self

    def on_instruction(self, cpu, address, size, context):
        """还原比较标志、暂存值和指令位置，交由原生公共派发入口继续。"""
        if address not in self.branch_entries:
            return super().on_instruction(cpu, address, size, context)
        opcode = self.branch_entries[address]
        instruction = cpu.reg_read(UC_ARM64_REG_X27)
        raw = bytes(cpu.mem_read(instruction, 32))
        if struct.unpack_from('<I', raw)[0] != opcode:
            raise RuntimeError('分支操作码与入口不符')
        slots = cpu.reg_read(UC_ARM64_REG_X24)
        left = struct.unpack('<Q', cpu.mem_read(slots + raw[4] * 8, 8))[0]
        right = struct.unpack_from('<Q', raw, 8)[0] if opcode in IMMEDIATE else struct.unpack('<Q', cpu.mem_read(slots + raw[5] * 8, 8))[0]
        displacement = struct.unpack_from('<Q', raw, 24)[0]
        target, flags, used = self.branch_worker.calculate(opcode, left, right, instruction, displacement)
        if not any(start <= target and target + 3 <= end and permission & UC_PROT_READ for start, end, permission in self.memory_regions):
            raise RuntimeError('分支目标不在映射的指令内存中')
        if opcode in IMMEDIATE:
            cpu.reg_write(ARGUMENT_REGISTERS[0], raw[4])
        cpu.reg_write(ARGUMENT_REGISTERS[1], left)
        cpu.reg_write(ARGUMENT_REGISTERS[2], right)
        if used:
            cpu.reg_write(ARGUMENT_REGISTERS[3], displacement)
        cpu.reg_write(UC_ARM64_REG_NZCV, flags << 28)
        cpu.reg_write(UC_ARM64_REG_X27, target)
        self.branch_counts[opcode] += 1
        # 此入口只获取当前 x27 的处理器，不会再次前进一个指令。
        cpu.reg_write(UC_ARM64_REG_PC, 0x102a2ada8)


def verify_native_vectors(data, worker):
    """直接执行原生比较与跳转，核对 32/64 位溢出标志和正负位移。"""
    probe = NativeProbe(data)
    slots, instruction, table, state = (probe.stack + offset for offset in (0x100, 0x1800, 0x3000, 0x4000))
    probe.cpu.mem_write(table, struct.pack('<Q', probe.stop))
    values = (0, 1, 0x7fffffff, 0x80000000, 0xffffffff, 0x100000000, 0x7fffffffffffffff, 0x8000000000000000, MASK64)
    count = 0
    for opcode, entry in HANDLERS.items():
        for left in values:
            for right in values:
                for signed_displacement in (-3, -1, 0, 1, 3):
                    displacement = signed_displacement & MASK64
                    probe.cpu.mem_write(instruction - 64, bytes(160))
                    probe.cpu.mem_write(slots, struct.pack('<QQ', left, right))
                    probe.cpu.mem_write(instruction, struct.pack('<I4BQ', opcode, 0, 1, 0, 0, right))
                    probe.cpu.mem_write(instruction + 24, struct.pack('<Q', displacement))
                    probe.cpu.reg_write(UC_ARM64_REG_X24, slots)
                    probe.cpu.reg_write(UC_ARM64_REG_X27, instruction)
                    probe.cpu.reg_write(UC_ARM64_REG_X20, table)
                    probe.cpu.reg_write(UC_ARM64_REG_X28, state)
                    probe.cpu.reg_write(ARGUMENT_REGISTERS[0], 0xa5)
                    probe.cpu.reg_write(ARGUMENT_REGISTERS[3], 0xa5)
                    # 在处理器表读取前中止，允许负位移落回当前指令而不再次执行。
                    stops = {0x102a2adc0, entry + (36 if opcode in IMMEDIATE else 40)}

                    def stop_at_dispatch(cpu, address, size, context):
                        """在真实下一指令派发边界中止，不执行下一个处理器。"""
                        if address in stops:
                            cpu.emu_stop()

                    hook = probe.cpu.hook_add(UC_HOOK_CODE, stop_at_dispatch)
                    try:
                        probe.cpu.emu_start(entry, probe.stop, count=32)
                    finally:
                        probe.cpu.hook_del(hook)
                    if probe.cpu.reg_read(UC_ARM64_REG_PC) not in stops:
                        raise RuntimeError('原生分支未到达实际派发边界')
                    expected, flags, used = worker.calculate(opcode, left, right, instruction, displacement)
                    actual = probe.cpu.reg_read(UC_ARM64_REG_X27)
                    actual_flags = probe.cpu.reg_read(UC_ARM64_REG_NZCV) >> 28
                    state_values = tuple(probe.cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:4])
                    expected_state = (0 if opcode in IMMEDIATE else 0xa5, left, right, displacement if used else 0xa5)
                    if actual != expected or actual_flags != flags or state_values != expected_state:
                        raise RuntimeError('TS 分支目标或标志与原生不一致')
                    count += 1
    return count


def compare(sample, compiled_branch, compiled_memory, compiled_scalar, compiled_aes, node):
    """四次独立初始化，联合全部已迁移 TS 处理器与原生基线对照。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    branch_worker = BranchWorker(compiled_branch, node)
    memory_worker = MemoryWorker(compiled_memory, node)
    scalar_worker = ScalarWorker(compiled_scalar, node)
    aes_worker = AESWorker(compiled_aes, node)
    entropy = []
    original_random = slice_probe.secrets.randbits
    reports = []
    CaptureProbe.captured = []
    try:
        vectors = verify_native_vectors(data, branch_worker)
        for index, (probe_class, changed) in enumerate(((CaptureProbe, False), (BranchReplacement, False), (CaptureProbe, True), (BranchReplacement, True))):
            position = 0

            def controlled_entropy(bits):
                """只在内存重放相同熵，调用位宽和次数不同则失败。"""
                nonlocal position
                if bits != 32:
                    raise RuntimeError('熵位宽不符')
                if index == 0:
                    entropy.append(original_random(bits))
                if position >= len(entropy):
                    raise RuntimeError('联合替换改变熵消耗')
                value = entropy[position]
                position += 1
                return value

            with patch.object(BranchReplacement, 'branch_worker', branch_worker), patch.object(MemoryReplacement, 'memory_worker', memory_worker), patch.object(ScalarReplacement, 'scalar_worker', scalar_worker), patch.object(CryptoProbe, 'worker', aes_worker), patch.object(slice_probe, 'SDSCoreProbe', probe_class), patch.object(slice_probe.secrets, 'randbits', controlled_entropy):
                result = slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True, synthetic_input='synthetic-input-changed' if changed else 'synthetic-input')
            if position != len(entropy):
                raise RuntimeError('联合替换的熵消耗次数不符')
            report = {'changed_input': changed, 'mode': 'TS-branch-memory-scalar-AES' if probe_class is BranchReplacement else 'native', 'candidate_bytes': result['sds_slice']['signature_candidate']['bytes'], 'arc4random_calls': position}
            if probe_class is BranchReplacement:
                probe = BranchReplacement.latest
                if set(probe.branch_counts) != set(HANDLERS) or probe.replaced_aes != 17 or probe.native_aes_wrappers or probe.aes_frame is not None:
                    raise RuntimeError('联合替换覆盖或结束状态不符')
                report.update(branch_opcodes=dict(sorted(probe.branch_counts.items())), replaced_branch_instructions=sum(probe.branch_counts.values()), replaced_memory_instructions=sum(probe.memory_counts.values()), replaced_scalar_instructions=sum(probe.replacements.values()), replaced_aes_calls=probe.replaced_aes, native_aes_wrappers_executed=0)
            reports.append(report)
        if len(CaptureProbe.captured) != 4:
            raise RuntimeError('联合替换的候选数量不符')
        native, replaced, native_changed, replaced_changed = CaptureProbe.captured
        if native != replaced or native_changed != replaced_changed or native == native_changed:
            raise RuntimeError('联合替换的外层候选未通过对照')
        return {'scope': '22 branch, 16 memory and six scalar opcodes plus AES; native dispatch, remaining opcodes and SDS retained', 'public_native_vector_cases': vectors, 'runs': reports, 'same_input_native_equals_ts': True, 'changed_input_native_equals_ts': True, 'changed_input_changes_candidate': True, 'raw_data_exported': False, 'full_portable_signer_implemented': False, 'server_verified': False}
    finally:
        for worker in (branch_worker, memory_worker, scalar_worker, aes_worker):
            worker.close()
        entropy.clear()
        CaptureProbe.captured.clear()
        BranchReplacement.latest = None
        MemoryReplacement.latest = None
        ScalarReplacement.latest = None
        ReplacementProbe.latest_replacement = None
        CryptoProbe.latest = None


def main():
    """仅接受固定样本和显式本地编译模块，输出脱敏验证结论。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    parser.add_argument('--portable-branch', required=True)
    parser.add_argument('--portable-memory', required=True)
    parser.add_argument('--portable-scalar', required=True)
    parser.add_argument('--portable-aes', required=True)
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    print(json.dumps(compare(args.sample, args.portable_branch, args.portable_memory, args.portable_scalar, args.portable_aes, args.node), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
