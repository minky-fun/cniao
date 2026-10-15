"""仅统计解释器操作码和处理器地址，不输出指令操作数或数据。"""
import argparse
import collections
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile
import probe_sds_slice as s
from probe_native import read_binary
from unicorn.arm64_const import UC_ARM64_REG_X8, UC_ARM64_REG_X27

class DispatchProfile(s.SDSCoreProbe):
    """记录实际派发的操作码与原生入口配对。"""
    latest = None
    def __init__(self, *args, **kwargs):
        """从已核对的二进制指令定位派发点。"""
        super().__init__(*args, **kwargs)
        start, end = 0x102a2a000, 0x102a4ea64
        code = bytes(self.cpu.mem_read(start, end-start))
        self.sites = {start+i for i in range(0, len(code)-3, 4) if code[i:i+4] == bytes.fromhex('9b0700f9')}
        self.counts = collections.Counter()
        DispatchProfile.latest = self
    def on_instruction(self, cpu, address, size, context):
        """只保留公开的操作码和处理器地址及次数。"""
        if address in self.sites:
            instruction = cpu.reg_read(UC_ARM64_REG_X27)
            opcode = struct.unpack('<I', cpu.mem_read(instruction, 4))[0]
            self.counts[(opcode, cpu.reg_read(UC_ARM64_REG_X8))] += 1
        return super().on_instruction(cpu, address, size, context)

def main():
    """只导出派发操作码、处理器地址和次数，不导出指令操作数。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    args = parser.parse_args()
    with ZipFile(args.sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    with patch.object(s, 'SDSCoreProbe', DispatchProfile):
        result = s.inspect(read_binary(args.sample), resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True)
    counts = DispatchProfile.latest.counts
    evidence = {'scope': 'next-instruction dispatch sites only; excludes initial dispatch and other unobserved dispatch forms', 'candidate_bytes': result['sds_slice']['signature_candidate']['bytes'], 'dispatches': [{'opcode': op, 'handler': hex(handler), 'count': count} for (op, handler), count in counts.most_common()]}
    print(json.dumps(evidence, indent=2))
    DispatchProfile.latest = None


if __name__ == '__main__':
    main()
