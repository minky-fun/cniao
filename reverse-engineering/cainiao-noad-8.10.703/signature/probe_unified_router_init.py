"""离线执行 Unified 路由表安装前缀，只报告真实注册与下一段注册边界。"""
import argparse
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30

import probe_sds_slice as slice_probe
from probe_native import ARGUMENT_REGISTERS, EXPECTED_SHA256, read_binary
from probe_unified_boundary import UnifiedBoundaryProbe
from probe_vm import MissingCommand


class RouterInitProbe(UnifiedBoundaryProbe):
    """在首段固定注册函数内记录公开命令编号，其余调用继续走现有边界模型。"""

    def on_instruction(self, cpu, address, size, context):
        """只为前置注册回调返回既有探针的合成状态，不伪造业务命令。"""
        return_address = cpu.reg_read(UC_ARM64_REG_X30)
        if address == self.callback and 0x102b97dd8 <= return_address < 0x102b9801c:
            command = tuple(cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:4])
            target = cpu.reg_read(ARGUMENT_REGISTERS[4])
            if command[0] != 2 or command[3] != 1 or not 0x102000000 <= target < 0x104000000:
                raise RuntimeError('前置注册回调超出固定样本')
            self.registration_records.append((command, target))
            cpu.reg_write(ARGUMENT_REGISTERS[0], 0)
            cpu.reg_write(UC_ARM64_REG_PC, return_address)
            return
        return super().on_instruction(cpu, address, size, context)


def inspect(sample):
    """先准备原生签名与 SDS 资源，再执行真实路由安装直到下一段注册。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    created = []

    def create_probe(*args, **kwargs):
        """保留已准备的隔离进程，不将 guest 内存或候选导出。"""
        probe = RouterInitProbe(*args, scenario='baseline', **kwargs)
        created.append(probe)
        return probe

    with patch.object(slice_probe, 'SDSCoreProbe', create_probe):
        slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True)
    if len(created) != 1:
        raise RuntimeError('隔离探针数量不符')
    probe = created[0]
    try:
        try:
            probe.run(0x102b9803c, (probe.heap,))
        except MissingCommand:
            pass
        else:
            raise RuntimeError('初始化边界变化，需重新核对')
        expected = [
            (2, 19, 2, 1), (2, 19, 7, 1), (2, 19, 8, 1),
            (2, 19, 1, 1), (2, 19, 3, 1), (2, 19, 4, 1),
            (2, 19, 5, 1), (2, 4, 1, 1), (2, 29, 1, 1),
            (2, 29, 2, 1), (2, 29, 3, 1), (2, 29, 4, 1),
        ]
        records = probe.registration_records
        router = struct.unpack('<Q', probe.cpu.mem_read(0x1068fe200, 8))[0]
        gate = bytes(probe.cpu.mem_read(0x1069c15b8, 1))[0]
        next_return = probe.cpu.reg_read(UC_ARM64_REG_X30)
        next_handler = probe.cpu.reg_read(ARGUMENT_REGISTERS[4])
        if ([command for command, _ in records] != expected or router != probe.heap
                or probe.missing_command != [2, 1, 1, 0] or next_return != 0x102b9207c
                or next_handler != 0x102b90660 or gate != 0):
            raise RuntimeError('前置初始化结果与已核对边界不符')
        return {
            'binary_sha256': EXPECTED_SHA256,
            'scope': 'bounded native router installation prefix with synthetic registration callbacks',
            'entry': '0x102b9803c',
            'router_slot': '0x1068fe200',
            'router_installed_from_input': True,
            'registrations': [{'ids': list(command), 'handler': hex(target)} for command, target in records],
            'next_unmodeled_registration': {
                'ids': probe.missing_command,
                'handler': hex(next_handler),
                'return_address': hex(next_return),
            },
            'gate_flag_at_stop': gate,
            'signature_generated': False,
            'sdk_initialization_complete': False,
            'network_requests_sent': 0,
            'private_values_exported': False,
        }
    finally:
        probe.appkey = None
        if probe.candidate is not None:
            probe.candidate[:] = bytes(len(probe.candidate))
            probe.candidate.clear()
        created.clear()


def main():
    """仅输出地址、命令编号与初始化边界，不输出候选或账号数据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    args = parser.parse_args()
    print(json.dumps(inspect(args.sample), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
