"""离线执行 lvm_llc_core 的真实注册处理函数，报告注册后的下一个初始化边界。"""
import argparse
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile

from unicorn import UcError
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30

import probe_sds_slice as slice_probe
from probe_native import ARGUMENT_REGISTERS, EXPECTED_SHA256, read_binary
from probe_unified_boundary import MissingLinkedFunction, load_module
from probe_unified_router_init import RouterInitProbe
from probe_vm import MissingCommand

HANDLER_LLC = 0x102ab4068
HANDLER_PATH_OBJECT = 0x102aed450
INSTALLER_CJSON = 0x102ac6f94
SLOT_ALLOC = 0x106686fc8
SLOT_FREE = 0x106686fd0
DEFAULT_ALLOC = 0x1053bc078
DEFAULT_FREE = 0x1053bb838
IMPL1_SELECTOR = 0x1068f7689
# (类名, 类地址, 实现, _objc_getClass 返回地址, _sel_registerName 返回地址, _class_getClassMethod 返回地址)
BRIDGE_SITES = (
    (b'_dklasdm23jsdafImpl1', 0x10643e488, 0x102aefeb8, 0x102a98b3c, 0x102a98b4c, 0x102a98b5c),
    (b'_dklasdm23jsdafImpl2', 0x10643f158, 0x102b9a718, 0x102a98c8c, 0x102a98c9c, 0x102a98cac),
    (b'_dklasdm23jsdafImpl7', 0x10643e618, 0x102b4340c, 0x102a98dd0, 0x102a98de0, 0x102a98df0),
)


class LLCInitProbe(RouterInitProbe):
    """建模 cJSON 钩子与 _dklasdm23jsdafImplN 桥接，其余依赖继续沿用现有边界模型。"""

    def __init__(self, *args, **kwargs):
        """核对桥接类元数据并缓存实现地址，不执行其方法。"""
        super().__init__(*args, **kwargs)
        self.llc_handler_entered = False
        self.llc_handler_returned = False
        self.bridge_sites = {}
        for name, class_addr, implementation, _, _, _ in BRIDGE_SITES:
            cls = self.image_classes.get(name)
            if cls != class_addr:
                raise RuntimeError(f'桥接类 {name.decode()} 地址与主程序元数据不符')
            metaclass = struct.unpack('<Q', self.cpu.mem_read(cls, 8))[0]
            ro = struct.unpack('<Q', self.cpu.mem_read(metaclass + 32, 8))[0] & ~7
            methods = struct.unpack('<Q', self.cpu.mem_read(ro + 32, 8))[0]
            entry_size, count = struct.unpack('<II', self.cpu.mem_read(methods, 8))
            if (entry_size, count) != (24, 1):
                raise RuntimeError('桥接类方法表格式不符')
            method_name, _, method_impl = struct.unpack('<QQQ', self.cpu.mem_read(methods + 8, 24))
            if self.cstring(method_name) != b'ksdjk23dskm:' or method_impl != implementation:
                raise RuntimeError('桥接类方法实现与主程序元数据不符')
            self.bridge_sites[class_addr] = {'name': name, 'implementation': implementation}
        self.bridge_get_class_returns = {site[3]: site[1] for site in BRIDGE_SITES}
        self.bridge_sel_returns = {site[4]: site[1] for site in BRIDGE_SITES}
        self.bridge_method_returns = {site[5]: site[1] for site in BRIDGE_SITES}

    def on_instruction(self, cpu, address, size, context):
        """只在已核对的调用点执行桥接；其他 ObjC 查询仍由父类边界拒绝。"""
        if address == HANDLER_LLC:
            self.llc_handler_entered = True
        elif self.llc_handler_entered and address == 0x102b92340:
            self.llc_handler_returned = True
        name = self.imports.get(address)
        return_address = cpu.reg_read(UC_ARM64_REG_X30)
        a, b, c = (cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:3])
        if name == '_objc_getClass' and return_address in self.bridge_get_class_returns:
            expected = self.bridge_get_class_returns[return_address]
            if self.cstring(a) != self.bridge_sites[expected]['name']:
                raise RuntimeError('objc_getClass 查询超出已核对类名')
            cpu.reg_write(ARGUMENT_REGISTERS[0], expected)
            cpu.reg_write(UC_ARM64_REG_PC, return_address)
            return
        if name == '_sel_registerName' and return_address in self.bridge_sel_returns:
            if self.cstring(a) != b'ksdjk23dskm:':
                raise RuntimeError('sel_registerName 查询超出已核对选择子')
            cpu.reg_write(ARGUMENT_REGISTERS[0], IMPL1_SELECTOR)
            cpu.reg_write(UC_ARM64_REG_PC, return_address)
            return
        if name == '_class_getClassMethod' and return_address in self.bridge_method_returns:
            cls = self.bridge_method_returns[return_address]
            if a != cls or b != IMPL1_SELECTOR:
                raise RuntimeError('class_getClassMethod 参数超出已核对桥接')
            method = self.allocate(8)
            self.cpu.mem_write(method, bytes(8))
            cpu.reg_write(ARGUMENT_REGISTERS[0], method)
            cpu.reg_write(UC_ARM64_REG_PC, return_address)
            return
        if name == '_objc_msgSend' and a in self.bridge_sites and b == IMPL1_SELECTOR:
            cpu.reg_write(UC_ARM64_REG_PC, self.bridge_sites[a]['implementation'])
            return
        return super().on_instruction(cpu, address, size, context)


def inspect(sample):
    """先准备签名/SDS 与 cJSON 钩子，再执行路由安装与真实 LLC 注册。"""
    data = read_binary(sample)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    created = []

    def create_probe(*args, **kwargs):
        """保留单个隔离实例，以便继续原始路由安装。"""
        probe = LLCInitProbe(*args, scenario='baseline', **kwargs)
        created.append(probe)
        return probe

    with patch.object(slice_probe, 'SDSCoreProbe', create_probe):
        slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True)
    if len(created) != 1:
        raise RuntimeError('隔离探针数量不符')
    probe = created[0]
    try:
        # 建模 dyld 绑定：cJSON 默认钩子槽按 bind 流指向 _malloc/_free（la 槽同样被探针导入模型拦截）。
        probe.cpu.mem_write(DEFAULT_ALLOC, struct.pack('<Q', probe.import_addresses['_malloc']))
        probe.cpu.mem_write(DEFAULT_FREE, struct.pack('<Q', probe.import_addresses['_free']))
        # 执行真实安装器 cJSON_InitHooks(NULL)，把默认钩子复制到运行槽；应用内调用点仍未定位。
        if probe.run(INSTALLER_CJSON, (0,)) != 0:
            raise RuntimeError('cJSON_InitHooks 执行状态不符')
        defaults = (struct.unpack('<Q', probe.cpu.mem_read(DEFAULT_ALLOC, 8))[0],
                    struct.unpack('<Q', probe.cpu.mem_read(DEFAULT_FREE, 8))[0])
        slots = (struct.unpack('<Q', probe.cpu.mem_read(SLOT_ALLOC, 8))[0],
                 struct.unpack('<Q', probe.cpu.mem_read(SLOT_FREE, 8))[0])
        if slots != defaults or slots[0] != probe.import_addresses['_malloc']:
            raise RuntimeError('cJSON 运行槽与默认钩子不符')
        # 接上 (1,34,13,0) 的真实处理函数，继续完整初始化。
        probe.native_routes[(1, 34, 13, 0)] = HANDLER_LLC
        probe.native_routes[(1, 1, 8, 0)] = HANDLER_PATH_OBJECT
        probe.observed_commands.clear()
        prior_module_calls = len(probe.completed_module_calls)
        boundary = None
        try:
            probe.run(0x102b9803c, (probe.heap,))
            boundary = {'kind': 'returned_to_stop'}
        except MissingCommand:
            boundary = {'kind': 'uninitialized_command', 'ids': probe.missing_command,
                        'pc': hex(probe.cpu.reg_read(UC_ARM64_REG_PC)), 'return_address': hex(probe.cpu.reg_read(UC_ARM64_REG_X30))}
        except MissingLinkedFunction:
            boundary = {'kind': 'linked_function_executed', 'symbol': probe.linked_execution}
        except UcError as stopped:
            boundary = {'kind': 'unmapped_memory', 'error': str(stopped), 'pc': hex(probe.cpu.reg_read(UC_ARM64_REG_PC)),
                        'fault': probe.memory_fault, 'return_address': hex(probe.cpu.reg_read(UC_ARM64_REG_X30)),
                        'registers': [hex(probe.cpu.reg_read(r)) for r in ARGUMENT_REGISTERS[:4]]}
        except RuntimeError as stopped:
            boundary = {'kind': 'runtime_stop', 'error': str(stopped), 'pc': hex(probe.cpu.reg_read(UC_ARM64_REG_PC)),
                        'import': probe.imports.get(probe.cpu.reg_read(UC_ARM64_REG_PC)),
                        'return_address': hex(probe.cpu.reg_read(UC_ARM64_REG_X30))}
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
        if [command for command, _ in records] != expected:
            raise RuntimeError(f'前置注册顺序与证据不符: {records!r}')
        stream = [command for command in probe.observed_commands if command != [1, 37, 1, 1]]
        if not stream or stream[0] != [1, 34, 13, 0] or not probe.llc_handler_entered:
            raise RuntimeError(f'LLC 分发未在命令流首位: {stream[:8]!r}')
        gate = bytes(probe.cpu.mem_read(0x1069c15b8, 1))[0]
        router = struct.unpack('<Q', probe.cpu.mem_read(0x1068fe200, 8))[0]
        return {
            'binary_sha256': EXPECTED_SHA256,
            'scope': 'bounded native Unified init continuation into real lvm_llc_core registration',
            'entry': '0x102b9803c',
            'llc_handler': hex(HANDLER_LLC),
            'path_object_handler': hex(HANDLER_PATH_OBJECT),
            'llc_handler_entered': probe.llc_handler_entered,
            'llc_handler_returned': probe.llc_handler_returned,
            'llc_handler_chain_reached': 'descriptor callback 0x102bac1d8 -> registrar 0x102a66ca8 -> cJSON metadata parse',
            'registrations': [{'ids': list(command), 'handler': hex(target)} for command, target in records],
            'cjson_hooks': {
                'installer': hex(INSTALLER_CJSON),
                'installer_executed_with_null': True,
                'installer_status': 0,
                'default_slots': {'alloc': hex(DEFAULT_ALLOC), 'free': hex(DEFAULT_FREE)},
                'default_bind_symbols': ['_malloc', '_free'],
                'runtime_slots_match_defaults': slots == defaults,
                'app_internal_call_site_of_installer': 'not yet identified',
            },
            'bridge': {
                'selector': 'ksdjk23dskm:',
                'classes': [{'name': site[0].decode('ascii'), 'class_address': hex(site[1]), 'implementation': hex(site[2])} for site in BRIDGE_SITES],
                'implementations_executed_natively': True,
                'returned_opaque_value_not_exported': True,
            },
            'execution_boundary': boundary,
            'module_routes': [list(k) for k in probe.module_routes],
            'native_routes': [list(k) for k in probe.native_routes],
            'observed_commands': probe.observed_commands,
            'gate_flag_at_stop': gate,
            'router_slot_at_stop': hex(router),
            'completed_module_calls': len(probe.completed_module_calls),
            'module_calls_during_router_init': len(probe.completed_module_calls) - prior_module_calls,
            'llc_registration_complete': False,
            'sdk_initialization_complete': False,
            'security_factors_generated': False,
            'signature_generated': False,
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
    """仅输出地址、命令编号与初始化边界，不输出候选、密钥或账号数据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    args = parser.parse_args()
    print(json.dumps(inspect(args.sample), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
