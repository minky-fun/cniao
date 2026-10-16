"""真实格式 MTOP 合成输入的离线边界实验；候选、appKey 和熵仅留在进程内。"""
import argparse
from collections import Counter
from functools import partial
import gc
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile

import probe_sds_slice as slice_probe
from guest_clock import GuestClock
from probe_native import ARGUMENT_REGISTERS, EXPECTED_SHA256, read_binary
from sign_input import build_sign_input

API = 'mtop.cainiao.lpc.packageservice.querypdspackagedatalist.cn'
SCENARIOS = ('baseline', 'repeat', 'clock', 'session', 'timestamp', 'data')


class SigningBoundaryProbe(slice_probe.SDSCoreProbe):
    """沿用原生加载和 SDS 切片，仅替换公开合成 INPUT 与明确指定的时钟。"""

    def __init__(self, *args, scenario, **kwargs):
        """记录对照维度；其他隔离依赖仍由已有 SDS 探针负责。"""
        if scenario not in SCENARIOS:
            raise ValueError('未定义的对照情形')
        self.scenario = scenario
        self.clock = GuestClock(1800000001 if scenario == 'clock' else 1800000000, 123456)
        self.clock_calls = Counter()
        self.appkey = None
        self.input_bytes = None
        self.candidate = None
        self.signing_engine = None
        super().__init__(*args, **kwargs)

    def on_instruction(self, cpu, address, size, context):
        """以非零 Darwin 时间运行原生依赖，不更改其他原生处理结果。"""
        if self.clock.handle(self, address):
            self.clock_calls[self.imports[address]] += 1
            return
        super().on_instruction(cpu, address, size, context)

    def fixture_input(self, mode='mtop-sign'):
        """按已还原的字段顺序生成公开测试文字，appKey 仅由样本自身提供。"""
        if self.appkey is None:
            raise RuntimeError('尚未执行样本 getAppKey')
        return build_sign_input(
            utdid='public-fixture-device', app_key=self.appkey, api=API, version='1.0',
            data_json='{"page":2}' if self.scenario == 'data' else '{"page":1}',
            protocol={
                'x-t': '1800000001' if self.scenario == 'timestamp' else '1800000000',
                'x-sid': 'public-fixture-sessio2' if self.scenario == 'session' else 'public-fixture-sessio1',
                'x-ttid': 'public-fixture-client',
            }, headers={'x-uid': 'public-fixture-user'}, mode=mode,
        )

    def write_string(self, value):
        """在原生 HashMap 创建之前替换唯一 INPUT fixture，不重排 guest 调用。"""
        if value == 'synthetic-input' and self.appkey is not None:
            value = self.fixture_input()
            self.input_bytes = len(value.encode('utf8'))
        return super().write_string(value)

    def run(self, entry, arguments=(), stop=None):
        """私下读取已确认的 getAppKey 和普通签名输出对象，不输出其内容。"""
        status = super().run(entry, arguments, stop)
        if entry != 0x102a518ec or len(arguments) != 5 or arguments[1] not in (3, 41) or status != 0:
            return status
        output = struct.unpack('<Q', self.cpu.mem_read(arguments[4], 8))[0]
        if not output:
            raise RuntimeError('边界实验缺少原生输出')
        pointer, length = struct.unpack('<QI', self.cpu.mem_read(output, 12))
        maximum = 64 if arguments[1] == 41 else 4096
        if not pointer or not 1 <= length <= maximum:
            raise RuntimeError('边界实验原生输出越界')
        raw = bytes(self.cpu.mem_read(pointer, length))
        if arguments[1] == 41:
            if not raw.isdigit():
                raise RuntimeError('样本 appKey 形状不符')
            self.appkey = raw.decode('ascii')
        else:
            if self.candidate is not None:
                raise RuntimeError('边界实验重复收集候选')
            self.signing_engine = arguments[0]
            self.candidate = bytearray(raw)
        return status


def compare(sample):
    """私有重放相同真实熵，分开检验时钟、会话、时间戳和请求体的影响。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    entropy = []
    candidates = []
    reports = []
    random_bits = slice_probe.secrets.randbits
    created = []

    def create_probe(*args, scenario, **kwargs):
        """保留当前探针引用，以便提取统计并在下一轮前释放隔离内存。"""
        probe = SigningBoundaryProbe(*args, scenario=scenario, **kwargs)
        created.append(probe)
        return probe

    try:
        for index, scenario in enumerate(SCENARIOS):
            position = 0

            def controlled_entropy(bits):
                """仅在进程内记录或重放 32 位系统熵；越界立即失败。"""
                nonlocal position
                if bits != 32:
                    raise RuntimeError('未知熵位宽')
                if index == 0:
                    entropy.append(random_bits(bits))
                if position >= len(entropy):
                    raise RuntimeError('对照实验熵调用数增加')
                result = entropy[position]
                position += 1
                return result

            with patch.object(slice_probe, 'SDSCoreProbe', partial(create_probe, scenario=scenario)), patch.object(slice_probe.secrets, 'randbits', controlled_entropy):
                evidence = slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True)
            if len(created) != 1 or position != len(entropy):
                raise RuntimeError('对照实验探针数或熵消耗不一致')
            probe = created.pop()
            if probe.candidate is None or probe.input_bytes is None:
                raise RuntimeError('真实格式合成输入未经过已确认的签名输出路径')
            candidates.append(probe.candidate)
            probe.candidate = None
            reports.append({
                'scenario': scenario,
                'input_bytes': probe.input_bytes,
                'candidate_bytes': len(candidates[-1]),
                'clock_seconds': probe.clock.seconds,
                'clock_microseconds': probe.clock.microseconds,
                'clock_import_calls': dict(probe.clock_calls),
                'arc4random_calls': position,
                'same_entropy_replay_complete': True,
                'vm_returned_with_output': evidence['sds_slice']['signature_vm_returned'],
                'error_slot_is_success_criterion': False,
                'sdk_initialization_complete': False,
            })
            probe.appkey = None
            del probe, evidence
            gc.collect()
        baseline = candidates[0]
        relationships = {scenario: candidate == baseline for scenario, candidate in zip(SCENARIOS[1:], candidates[1:])}
        if not relationships['repeat'] or any(relationships[name] for name in ('session', 'timestamp', 'data')):
            raise RuntimeError('同输入重复性或 MTOP 字段敏感性对照失败')
        return {
            'binary_sha256': EXPECTED_SHA256,
            'scope': 'native offline type-19 path with real-format public MTOP fixtures; not a complete portable signer or server validation',
            'runs': reports,
            'equals_baseline': relationships,
            'clock_only_changes_candidate': not relationships['clock'],
            'raw_input_exported': False,
            'candidate_values_exported': False,
            'entropy_values_exported': False,
            'account_or_device_data_read': False,
            'network_requests_sent': 0,
            'retained_dependencies': ['native module loaders and binding', 'native SDK/SDS/crypto object wrappers', 'synthetic empty state directory', 'single-thread and limited Objective-C model', 'monitoring side effects omitted'],
            'x_mini_wua_generated': False,
            'complete_portable_signer': False,
            'server_verified': False,
            'iphone_verified': False,
        }
    finally:
        for candidate in candidates:
            candidate[:] = bytes(len(candidate))
            candidate.clear()
        for probe in created:
            probe.appkey = None
            if probe.candidate is not None:
                probe.candidate[:] = bytes(len(probe.candidate))
                probe.candidate.clear()
        created.clear()
        entropy.clear()
        gc.collect()


def main():
    """读取固定 IPA，仅输出可提交的布尔关系、长度和调用次数。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    args = parser.parse_args()
    print(json.dumps(compare(args.sample), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
