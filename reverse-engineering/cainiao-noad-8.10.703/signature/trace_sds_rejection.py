"""复核占位 appKey 查找失败到错误 6、11 的路径，不导出任何安全记录内容。"""
import argparse
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X24, UC_ARM64_REG_X27

import probe_sds_slice as slice_probe
from probe_native import read_binary


class RejectionProbe(slice_probe.SDSCoreProbe):
    """只记录查找次数、是否相等和小型错误状态写入。"""

    latest = None

    def __init__(self, *args, **kwargs):
        """保留原探针行为，在初始化后安装仅观察的内存写钩子。"""
        super().__init__(*args, **kwargs)
        self.code_locations = []
        self.lookup_events = []
        self.error_events = []
        start, end = 0x102a2a000, 0x102a4ea64
        raw = bytes(self.cpu.mem_read(start, end - start))
        self.dispatch_sites = {start + offset for offset in range(0, len(raw) - 3, 4) if raw[offset:offset + 4] == bytes.fromhex('9b0700f9')}
        self.cpu.hook_add(UC_HOOK_MEM_WRITE, self.on_error_write)
        RejectionProbe.latest = self

    def instruction_offset(self):
        """返回展开指令所在分配的相对偏移，绝不将其标为原始压缩字节码偏移。"""
        pointer = self.cpu.reg_read(UC_ARM64_REG_X27)
        for base, length in self.code_locations:
            if base <= pointer < base + length:
                return hex(pointer - base)
        for base, length in self.allocations.items():
            if base <= pointer < base + length:
                self.code_locations.append((base, length))
                return hex(pointer - base)
        return None

    def on_error_write(self, cpu, access, address, size, value, context):
        """仅观察真实错误槽的 6/11 写入，不修改寄存器或内存。"""
        if self.route_frames and address == self.route_frames[-1]['error_pointer'] and value in (6, 11):
            self.error_events.append({'value': value, 'native_pc': hex(cpu.reg_read(UC_ARM64_REG_PC)), 'expanded_instruction_allocation_offset': self.instruction_offset()})

    def on_instruction(self, cpu, address, size, context):
        """在实际比较点核对合成标识并保存布尔值，不输出记录或指针。"""
        if self.route_frames and address in self.dispatch_sites:
            offset = self.instruction_offset()
            if offset in ('0x151c8', '0x152d8', '0x15338', '0x15348'):
                slots = struct.unpack('<32Q', cpu.mem_read(cpu.reg_read(UC_ARM64_REG_X24), 256))
                event = {'offset': offset}
                if offset == '0x151c8':
                    event.update({'index': slots[18], 'count': slots[17], 'requested_kind': slots[25]})
                elif offset == '0x152d8':
                    pointer = struct.unpack('<Q', cpu.mem_read(slots[24], 8))[0]
                    if self.cstring(pointer) != b'synthetic-appkey':
                        raise RuntimeError('查找输入不是已声明的合成 appKey')
                    event['length_matches'] = slots[22] == slots[3]
                elif offset == '0x15338':
                    length = slots[10]
                    if length != len(b'synthetic-appkey') or bytes(cpu.mem_read(slots[8], length)) != b'synthetic-appkey':
                        raise RuntimeError('比较输入不是已声明的合成 appKey')
                    event['record_matches_input'] = bytes(cpu.mem_read(slots[9], length)) == b'synthetic-appkey'
                else:
                    event['comparison_return_is_zero'] = slots[8] == 0
                self.lookup_events.append(event)
        return super().on_instruction(cpu, address, size, context)


def inspect(sample):
    """在旧占位输入路径重建错误因果证据，所有比较结果都经原生指令执行。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle_id = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    with patch.object(slice_probe, 'SDSCoreProbe', RejectionProbe):
        result = slice_probe.inspect(data, resource, bundle_id, with_zlib=True, with_sdk_directory=True)
    probe = RejectionProbe.latest
    items = [event for event in probe.lookup_events if event['offset'] == '0x151c8']
    lengths = [event['length_matches'] for event in probe.lookup_events if 'length_matches' in event]
    comparisons = [event['record_matches_input'] for event in probe.lookup_events if 'record_matches_input' in event]
    if len(items) != 26 or len(lengths) != 24 or sum(lengths) != 2 or comparisons != [False, False] or [event['value'] for event in probe.error_events] != [6, 11]:
        raise RuntimeError('合成 appKey 拒绝路径与已观察证据不符')
    return {'binary_sha256': result['binary_sha256'], 'input': 'synthetic-appkey', 'record_count': 26, 'requested_kind': 6, 'visited_indices': [event['index'] for event in items], 'length_comparisons': len(lengths), 'length_matches': sum(lengths), 'content_comparisons': comparisons, 'error_writes': probe.error_events, 'offset_units': 'relative to expanded instruction allocation, not original compressed bytecode', 'security_record_values_exported': False, 'conclusion': 'synthetic appKey fails record lookup; error 6 is translated to 11; does not establish a missing device token'}


def main():
    """输出可重复核对的占位输入拒绝摘要。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    args = parser.parse_args()
    print(json.dumps(inspect(args.sample), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
