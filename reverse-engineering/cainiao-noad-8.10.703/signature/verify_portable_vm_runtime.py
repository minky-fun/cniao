"""用独立 TS 解释循环替换原生 VM 入口，宿主与模块初始化仍显式保留。"""
import argparse
from collections import Counter
import json
from pathlib import Path
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile

from unicorn import UC_HOOK_CODE
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_SP, UC_ARM64_REG_X6, UC_ARM64_REG_X8, UC_ARM64_REG_X9, UC_ARM64_REG_X10, UC_ARM64_REG_X11, UC_ARM64_REG_X12, UC_ARM64_REG_X13, UC_ARM64_REG_X14, UC_ARM64_REG_X15, UC_ARM64_REG_X19, UC_ARM64_REG_X20, UC_ARM64_REG_X21, UC_ARM64_REG_X22, UC_ARM64_REG_X23, UC_ARM64_REG_X24, UC_ARM64_REG_X25, UC_ARM64_REG_X26, UC_ARM64_REG_X27, UC_ARM64_REG_X28, UC_ARM64_REG_X29, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, NativeProbe, read_binary
from verify_signature_candidate import CaptureProbe
from verify_crypto_operations import AESWorker, CryptoProbe
from verify_portable_vm_host import HostWorker, HostReplacement
from verify_portable_vm_abi import AbiWorker, AbiReplacement
from verify_portable_vm_call import CallWorker, ERROR_TARGET, SPECIAL_TARGETS
import probe_sds_slice as slice_probe

SAVED = [UC_ARM64_REG_X8, UC_ARM64_REG_X9, UC_ARM64_REG_X10, UC_ARM64_REG_X11, UC_ARM64_REG_X12, UC_ARM64_REG_X13, UC_ARM64_REG_X14, UC_ARM64_REG_X15, UC_ARM64_REG_X19, UC_ARM64_REG_X20, UC_ARM64_REG_X21, UC_ARM64_REG_X22, UC_ARM64_REG_X23, UC_ARM64_REG_X24, UC_ARM64_REG_X25, UC_ARM64_REG_X26, UC_ARM64_REG_X27, UC_ARM64_REG_X28, UC_ARM64_REG_X29]


class RuntimeReplacement(AbiReplacement):
    """直接运行 TS VM 循环，原生 opcode、派发表及解释器 ABI 尾声均不执行。"""

    runtime_worker = None
    latest = None

    def __init__(self, *args, **kwargs):
        """保留明确宿主续点和公开计数，不创建原生 opcode 回退路径。"""
        super().__init__(*args, **kwargs)
        self.runtime_frames = []
        self.runtime_counts = Counter()
        self.runtime_yields = Counter()
        self.runtime_invocations = 0
        RuntimeReplacement.latest = self

    def continue_runtime(self, frame, response):
        """宿主返回后刷新 TS 的内存视图，完成时直接恢复原始调用方 ABI。"""
        cpu = self.cpu
        if response['done']:
            result = response['value']
            counts = {int(key): value for key, value in result['counts'].items()}
            if sum(counts.values()) != result['instructions']:
                raise RuntimeError('TS VM 指令计数不一致')
            self.runtime_counts.update(counts)
            for register, value in zip(SAVED, frame['saved']):
                cpu.reg_write(register, value)
            cpu.reg_write(UC_ARM64_REG_SP, frame['stack'])
            cpu.reg_write(UC_ARM64_REG_X30, frame['return'])
            cpu.reg_write(ARGUMENT_REGISTERS[0], int(result['integer']))
            cpu.reg_write(UC_ARM64_REG_PC, frame['return'])
            return
        frame['id'] = response['id']
        self.runtime_frames.append(frame)
        request = response['request']
        cpu.reg_write(UC_ARM64_REG_X30, self.callback + 0xd00)
        if request['kind'] == 'host':
            import base64
            raw = base64.b64decode(request['descriptor'], validate=True)
            if len(raw) != 40:
                raise RuntimeError('TS VM 宿主描述符宽度错误')
            stack = frame['stack'] - 0x200
            self.apply_host_writes([(stack, raw)])
            cpu.reg_write(UC_ARM64_REG_SP, stack)
            for register, value in zip(ARGUMENT_REGISTERS, (int(request['engine']), int(request['context']), stack)):
                cpu.reg_write(register, value)
            cpu.reg_write(UC_ARM64_REG_PC, 0x102a4dcf8)
        elif request['kind'] == 'expand':
            cpu.reg_write(ARGUMENT_REGISTERS[0], int(request['module']))
            cpu.reg_write(UC_ARM64_REG_PC, 0x102a5a97c)
        else:
            raise RuntimeError('TS VM 出现未知原生依赖')
        self.runtime_yields[request['kind']] += 1

    def on_instruction(self, cpu, address, size, context):
        """只在解释器入口进入 TS；任何原生处理器的意外执行立即失败。"""
        if address == self.callback + 0xd00:
            frame = self.runtime_frames.pop()
            response = self.runtime_worker.calculate(cpu, 'resume', id=frame['id'], status=cpu.reg_read(ARGUMENT_REGISTERS[0]))
            return self.continue_runtime(frame, response)
        if address == 0x102a2ad00:
            values = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS]
            frame = {'stack': cpu.reg_read(UC_ARM64_REG_SP), 'return': cpu.reg_read(UC_ARM64_REG_X30), 'saved': [cpu.reg_read(register) for register in SAVED]}
            state = dict(zip(('engine', 'context', 'code', 'index', 'slots'), (str(value) for value in values[:5])))
            state.update(compareLeft=str(cpu.reg_read(UC_ARM64_REG_X12)), compareRight=str(cpu.reg_read(UC_ARM64_REG_X13)), integer=str(values[0]), errorTarget=str(ERROR_TARGET), specialTargets=[str(value) for value in SPECIAL_TARGETS], maxInstructions=1000000)
            self.runtime_invocations += 1
            return self.continue_runtime(frame, self.runtime_worker.calculate(cpu, 'run', input=state))
        if 0x102a2ad04 <= address < 0x102a2c900:
            raise RuntimeError('TS VM 意外进入原生解释器或操作码处理器')
        return super().on_instruction(cpu, address, size, context)


def verify_runtime_vectors(data, worker):
    """以完整原生入口/退出对照公开程序，核对槽位、分支、返回整数及指令位置。"""
    probe = NativeProbe(data)
    slots, context, code, table = (probe.stack + offset for offset in (0x1000, 0x2000, 0x3000, 0x4000))
    profile = json.loads(Path(__file__).with_name('vm-dispatch-profile.json').read_text())
    for item in profile['dispatches']:
        probe.cpu.mem_write(table + item['opcode'] * 8, struct.pack('<Q', int(item['handler'], 16)))
    cases = 0
    for left in (0, 1, 0xffffffff, 0x8000000000000000, (1 << 64) - 1):
        # The branch compares slots 1/2 and chooses either one increment or a direct exit.
        program = b''.join(struct.pack('<I4BQ', *record) for record in [
            (5, 0, 1, 0, 0, left), (5, 0, 2, 0, 0, 1),
            (32, 0, 1, 2, 3, 0), (110, 3, 0, 0, 0, 0),
            (26, 0, 0, 0, 0, 2), (34, 0, 3, 0, 3, 1),
            (18, 0, 0, 0, 0, 0),
        ])
        probe.cpu.mem_write(code, program)
        initial = bytes(256)
        probe.cpu.mem_write(slots, initial)
        probe.cpu.mem_write(context, initial)
        probe.cpu.reg_write(UC_ARM64_REG_X6, 0)
        native = probe.run(0x102a2ad00, (0, context, code, 0, slots, table))
        expected = bytes(probe.cpu.mem_read(slots, 256)), bytes(probe.cpu.mem_read(context, 256))
        probe.cpu.mem_write(slots, initial)
        probe.cpu.mem_write(context, initial)
        state = {'engine': '0', 'context': str(context), 'code': str(code), 'index': '0', 'slots': str(slots), 'compareLeft': '0', 'compareRight': '0', 'integer': '0', 'errorTarget': str(ERROR_TARGET), 'specialTargets': [], 'maxInstructions': 64}
        result = worker.calculate(probe.cpu, 'run', input=state)
        assert result['done'] and int(result['value']['integer']) == native
        assert (bytes(probe.cpu.mem_read(slots, 256)), bytes(probe.cpu.mem_read(context, 256))) == expected
        cases += 1
    return cases


def compare(args):
    """四次独立初始化，以相同真实熵比较原生和 TS VM 的完整候选及逐操作码次数。"""
    data = read_binary(args.sample)
    with ZipFile(args.sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    runtime = CallWorker(args.portable_call, args.node, runtime=args.portable_runtime)
    abi = AbiWorker(args.portable_abi, args.node)
    host = HostWorker(args.portable_host, args.node)
    aes = AESWorker(args.portable_aes, args.node)
    profile = json.loads(Path(__file__).with_name('vm-dispatch-profile.json').read_text())
    entries = {int(item['handler'], 16) for item in profile['dispatches']}
    native_counts = Counter()
    entropy = []
    random_bits = slice_probe.secrets.randbits
    original_init = NativeProbe.__init__
    CaptureProbe.captured = []
    reports = []

    def initialize_trace(probe, *values, **options):
        """原生基线独立统计真实 handler 入口，TS 运行禁止进入这些入口。"""
        original_init(probe, *values, **options)

        def count(cpu, address, size, unused):
            """仅统计操作码，不记录指令参数、内存或候选数据。"""
            if address in entries:
                pointer = cpu.reg_read(UC_ARM64_REG_X27)
                native_counts[struct.unpack('<I', cpu.mem_read(pointer, 4))[0]] += 1

        probe.cpu.hook_add(UC_HOOK_CODE, count, begin=0x102a2ada0, end=0x102a2c900)

    try:
        vectors = verify_runtime_vectors(data, runtime)
        for run, (replacement, changed) in enumerate(((False, False), (True, False), (False, True), (True, True))):
            position = 0
            native_counts.clear()

            def controlled_entropy(bits):
                """只在当前进程记录或重放系统熵，不导出随机值。"""
                nonlocal position
                if bits != 32:
                    raise RuntimeError('熵位宽改变')
                if run == 0:
                    entropy.append(random_bits(bits))
                if position >= len(entropy):
                    raise RuntimeError('TS VM 熵消耗越界')
                value = entropy[position]
                position += 1
                return value

            with patch.object(NativeProbe, '__init__', initialize_trace), patch.object(RuntimeReplacement, 'runtime_worker', runtime), patch.object(AbiReplacement, 'abi_worker', abi), patch.object(HostReplacement, 'host_worker', host), patch.object(CryptoProbe, 'worker', aes), patch.object(slice_probe, 'SDSCoreProbe', RuntimeReplacement if replacement else CaptureProbe), patch.object(slice_probe.secrets, 'randbits', controlled_entropy):
                result = slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True, synthetic_input='synthetic-input-changed' if changed else 'synthetic-input')
            if position != len(entropy):
                raise RuntimeError('TS VM 熵消耗次数改变')
            report = {'mode': 'TS-runtime' if replacement else 'native', 'changed_input': changed, 'candidate_bytes': result['sds_slice']['signature_candidate']['bytes'], 'arc4random_calls': position}
            if replacement:
                probe = RuntimeReplacement.latest
                if native_counts or probe.runtime_frames or probe.replaced_aes != 17 or probe.native_aes_wrappers != 0:
                    raise RuntimeError('TS VM 存在原生 handler 回退、未完成续点或 AES 覆盖错误')
                report.update(opcode_counts=dict(sorted(probe.runtime_counts.items())), native_opcode_entries=0, vm_invocations=probe.runtime_invocations, runtime_yields=dict(probe.runtime_yields), replaced_aes_calls=probe.replaced_aes, host_boundary=dict(probe.host_counts), integer_abi=dict(probe.abi_counts))
            else:
                report['opcode_counts'] = dict(sorted(native_counts.items()))
            reports.append(report)
        if len(CaptureProbe.captured) != 4:
            raise RuntimeError('TS VM 候选数量错误')
        a, b, c, d = CaptureProbe.captured
        if a != b or c != d or a == c or reports[0]['opcode_counts'] != reports[1]['opcode_counts'] or reports[2]['opcode_counts'] != reports[3]['opcode_counts']:
            raise RuntimeError('TS VM 候选或逐操作码次数与原生不一致')
        return {'scope': 'TypeScript interpreter loop, all observed opcode semantics and call control; real native host targets, module initialization/expansion and SDS still retained', 'native_runtime_vector_cases': vectors, 'runs': reports, 'same_input_native_equals_ts': True, 'changed_input_native_equals_ts': True, 'changed_input_changes_candidate': True, 'same_input_opcode_counts_equal': True, 'changed_input_opcode_counts_equal': True, 'native_vm_handler_entries_in_ts_runs': 0, 'raw_data_exported': False, 'full_portable_signer_implemented': False, 'server_verified': False}
    finally:
        for worker in (runtime, abi, host, aes):
            worker.close()
        CaptureProbe.captured.clear()
        entropy.clear()
        RuntimeReplacement.latest = None


def main():
    """仅加载固定样本及本地 TS 模块，输出脱敏对照结果。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    print(json.dumps(compare(parser.parse_args()), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
