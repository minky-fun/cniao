"""用相同真实熵序列对照合成输入，仅输出候选结果是否相等，不输出签名或熵。"""
import argparse
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile

import probe_sds_slice as slice_probe
from probe_native import read_binary


class CaptureProbe(slice_probe.SDSCoreProbe):
    """仅在进程内短暂保留外层 VM 结果，供固定合成输入对照。"""

    captured = []

    def run(self, entry, arguments=(), stop=None):
        """执行原生 VM，并在外层返回后按已确认的字符串布局取出候选字节。"""
        status = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and status == 0:
            output = struct.unpack('<Q', self.cpu.mem_read(arguments[4], 8))[0]
            if not output:
                raise RuntimeError('外层 VM 无候选输出')
            pointer, length = struct.unpack('<QI', self.cpu.mem_read(output, 12))
            if not pointer or not 1 <= length <= 4096:
                raise RuntimeError('候选缓冲区越界')
            self.captured.append(bytes(self.cpu.mem_read(pointer, length)))
        return status


def compare(sample):
    """记录一次真实 arc4random 依赖并只在对照实验中重放，核对重复性与输入敏感性。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle_id = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    entropy = []
    original_random = slice_probe.secrets.randbits
    CaptureProbe.captured = []

    def record(bits):
        """记录真实系统熵到内存，既不序列化也不输出其值。"""
        if bits != 32:
            raise RuntimeError('未确认的熵位宽')
        value = original_random(bits)
        entropy.append(value)
        return value

    with patch.object(slice_probe, 'SDSCoreProbe', CaptureProbe), patch.object(slice_probe.secrets, 'randbits', record):
        baseline = slice_probe.inspect(data, resource, bundle_id, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True)
    replay_counts = []
    for changed in (False, True):
        position = 0

        def replay(bits):
            """仅供离线对照重放已记录的真实序列；消耗越界直接失败。"""
            nonlocal position
            if bits != 32 or position >= len(entropy):
                raise RuntimeError('熵调用顺序或次数不符')
            value = entropy[position]
            position += 1
            return value

        with patch.object(slice_probe, 'SDSCoreProbe', CaptureProbe), patch.object(slice_probe.secrets, 'randbits', replay):
            slice_probe.inspect(data, resource, bundle_id, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True, synthetic_input='synthetic-input-changed' if changed else 'synthetic-input')
        if position != len(entropy):
            raise RuntimeError('对照运行没有消耗相同数量的熵')
        replay_counts.append(position)
    if len(CaptureProbe.captured) != 3:
        raise RuntimeError('候选结果次数不符')
    first, repeated, changed = CaptureProbe.captured
    result = {'scope': 'offline controlled comparison, not production signing or server validation', 'same_input_same_entropy_equal': first == repeated, 'changed_input_same_entropy_differs': first != changed, 'candidate_bytes': [len(value) for value in CaptureProbe.captured], 'arc4random_recorded_calls': len(entropy), 'arc4random_replayed_calls': replay_counts, 'bsd_random': baseline['sds_slice']['bsd_random_calls'], 'time_dependency': 'zero in all three runs', 'candidate_values_exported': False, 'entropy_values_exported': False, 'server_verified': False}
    CaptureProbe.captured.clear()
    entropy.clear()
    if not result['same_input_same_entropy_equal'] or not result['changed_input_same_entropy_differs']:
        raise RuntimeError('候选结果未通过受控输入对照')
    return result


def main():
    """读取固定样本并输出不包含候选签名或随机值的对照结论。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    args = parser.parse_args()
    print(json.dumps(compare(args.sample), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
