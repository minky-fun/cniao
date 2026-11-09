"""离线执行 Unified 路由表安装与处理器注册，只报告下一个模块依赖。"""
import argparse
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30

import probe_sds_slice as slice_probe
from module_container import parse_container
from probe_native import ARGUMENT_REGISTERS, EXPECTED_SHA256, read_binary
from probe_unified_boundary import MissingLinkedFunction, UnifiedBoundaryProbe, load_module
from probe_vm import MissingCommand


class RouterInitProbe(UnifiedBoundaryProbe):
    """在两段固定注册函数内记录处理器编号，其余调用继续走现有边界模型。"""

    def on_instruction(self, cpu, address, size, context):
        """只为前置注册回调返回既有探针的合成状态，不伪造业务命令。"""
        return_address = cpu.reg_read(UC_ARM64_REG_X30)
        if address == 0x102a598ec:
            symbol = self.cstring(cpu.reg_read(ARGUMENT_REGISTERS[1])).decode('ascii')
            if symbol in ('mach_task_self', 'proc_regionfilename'):
                if getattr(self.host_libc, symbol, None) is None:
                    raise RuntimeError('宿主没有已确认的链接符号：' + symbol)
                pointer = self.linked.setdefault(symbol, self.callback + 0x500 + len(self.linked) * 4)
                self.resolved_system_names.append(symbol)
                cpu.reg_write(ARGUMENT_REGISTERS[0], pointer)
                cpu.reg_write(UC_ARM64_REG_PC, return_address)
                return
        first_registration = 0x102b97dd8 <= return_address < 0x102b9801c
        second_registration = 0x102b9207c <= return_address <= 0x102b9219c
        if address == self.callback and (first_registration or second_registration):
            command = tuple(cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:4])
            target = cpu.reg_read(ARGUMENT_REGISTERS[4])
            expected_flag = 1 if first_registration else 0
            if command[0] != 2 or command[3] != expected_flag or not 0x102000000 <= target < 0x104000000:
                raise RuntimeError('前置注册回调超出固定样本')
            self.registration_records.append((command, target))
            cpu.reg_write(ARGUMENT_REGISTERS[0], 0)
            cpu.reg_write(UC_ARM64_REG_PC, return_address)
            return
        return super().on_instruction(cpu, address, size, context)


def inspect(sample):
    """先准备原生签名与 SDS 资源，再执行路由安装直到模块注册请求。"""
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
            (2, 1, 1, 0), (2, 1, 8, 0), (2, 1, 9, 0),
            (2, 1, 10, 0), (2, 1, 13, 0), (2, 1, 17, 0),
            (2, 1, 18, 0), (2, 1, 19, 0), (2, 1, 20, 0),
            (2, 1, 25, 0),
        ]
        records = probe.registration_records
        router = struct.unpack('<Q', probe.cpu.mem_read(0x1068fe200, 8))[0]
        gate = bytes(probe.cpu.mem_read(0x1069c15b8, 1))[0]
        next_return = probe.cpu.reg_read(UC_ARM64_REG_X30)
        next_descriptor = probe.cpu.reg_read(ARGUMENT_REGISTERS[4])
        descriptor = struct.unpack('<4Q', probe.cpu.mem_read(next_descriptor, 32))
        descriptor_name = probe.cstring(descriptor[0])
        if ([command for command, _ in records] != expected or router != probe.heap
                or probe.missing_command != [1, 34, 13, 0] or next_return != 0x102b92340
                or descriptor != (0x1068fe2ed, 0x102bac1d8, 1, 0)
                or not 1 <= len(descriptor_name) <= 64
                or any(value not in b'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_' for value in descriptor_name)
                or gate != 0):
            raise RuntimeError('前置初始化结果与已核对边界不符')
        source_object = probe.run(descriptor[1])
        source, length = struct.unpack('<QQ', probe.cpu.mem_read(source_object, 16))
        if (source, length) != (0x1066cb560, 77635):
            raise RuntimeError('核心模块来源回调与固定样本不符')
        code, metadata, bindings = parse_container(bytes(probe.cpu.mem_read(source, length)))
        if (metadata['basic']['bizid'] != descriptor_name.decode('ascii') or len(code) != 143128
                or len(bindings) != 22
                or [entry['destIndex'] for entry in bindings] != list(range(66020601, 66020623))):
            raise RuntimeError('核心模块容器与描述符不符')
        _, library = load_module(probe, 0x106672500, 65119, 'lvm_minilibc')
        if library['load_status'] != 0 or probe.import_addresses.get('_mach_task_self_') != 0x1053bc070:
            raise RuntimeError('前置库模块未能加载')
        try:
            _, core = load_module(probe, source, length, descriptor_name.decode('ascii'))
            core_boundary = None
        except MissingLinkedFunction:
            core = None
            core_boundary = 'linked function executed: ' + str(probe.linked_execution)
        except RuntimeError as stopped:
            if not str(stopped).startswith('未解析 VM 系统导入：'):
                raise
            core = None
            core_boundary = 'unresolved VM system import: ' + str(stopped).split('：', 1)[1]
        return {
            'binary_sha256': EXPECTED_SHA256,
            'scope': 'bounded native router installation prefix with synthetic registration callbacks',
            'entry': '0x102b9803c',
            'router_slot': '0x1068fe200',
            'router_installed_from_input': True,
            'registrations': [{'ids': list(command), 'handler': hex(target)} for command, target in records],
            'next_unmodeled_module_registration': {
                'ids': probe.missing_command,
                'descriptor_source': '0x105535618',
                'module_name': descriptor_name.decode('ascii'),
                'descriptor_callback': hex(descriptor[1]),
                'return_address': hex(next_return),
            },
            'core_module_source': {
                'callback_executed': True,
                'container_address': hex(source),
                'container_bytes': length,
                'bytecode_bytes': len(code),
                'business_bindings': len(bindings),
                'library_load_status': library['load_status'],
                'core_load_status': core['load_status'] if core else None,
                'core_load_boundary': core_boundary,
                'different_image_symbol': '_mach_task_self_ at 0x1053bc070',
                'link_only_symbols': sorted(probe.linked),
                'link_only_execution': probe.linked_execution,
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
