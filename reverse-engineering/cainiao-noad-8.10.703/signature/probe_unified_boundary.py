"""定位统一安全因子的真实加载与执行依赖；不返回猜测的平台结果。"""
import argparse
from collections import Counter
import ctypes
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X22, UC_ARM64_REG_X30
import probe_sds_slice as slice_probe
from module_container import parse_container
from probe_native import ARGUMENT_REGISTERS, EXPECTED_SHA256, NativeProbe, read_binary
from probe_signing_boundary import API, SigningBoundaryProbe
from probe_vm import MissingCommand

LIBRARY = (0x106672500, 65119)
UNIFIED = (0x10669a7c8, 34317)
LOADER_ENVIRONMENT = (b'UVM_LD_LIBRARY_PREFIX', b'UVM_LD_LIBRARY_SUFFIX', b'UVM_LD_LIBRARY_EXTENSION', b'UVM_LD_LIBRARY_PATH')
LINK_ONLY = ('fchmod', 'socketpair')


class MissingLinkedFunction(RuntimeError):
    """已提供链接符号地址，但没有提供该函数的执行语义。"""


class UnifiedBoundaryProbe(SigningBoundaryProbe):
    """补齐明确的链接依赖，实际平台调用仍严格中止。"""

    execution_timeout_us = 40000000

    def __init__(self, *args, **kwargs):
        """创建仅供链接的两个 Darwin 符号槽，不向 guest 写入宿主指针。"""
        self.linked = {}
        self.linked_execution = None
        self.loader_environment_queries = []
        self.extra_imports = Counter()
        self.host_libc = ctypes.CDLL(None)
        super().__init__(*args, **kwargs)

    def on_instruction(self, cpu, address, size, context):
        """只建模已观察的链接环境和 C 函数；未知符号与平台消息不兜底。"""
        if self.callback + 0x500 <= address < self.callback + 0x508:
            for symbol, pointer in self.linked.items():
                if address == pointer:
                    self.linked_execution = symbol
                    raise MissingLinkedFunction('链接占位符没有执行实现')
        if address == 0x102a598ec:
            symbol = self.cstring(cpu.reg_read(ARGUMENT_REGISTERS[1])).decode('ascii')
            if symbol in LINK_ONLY and '_' + symbol not in self.import_addresses:
                if getattr(self.host_libc, symbol, None) is None:
                    raise RuntimeError('Darwin 宿主没有对应的链接符号')
                pointer = self.linked.setdefault(symbol, self.callback + 0x500 + len(self.linked) * 4)
                cpu.reg_write(ARGUMENT_REGISTERS[0], pointer)
                cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
                return
        name = self.imports.get(address)
        if name not in ('_getenv', '_strncpy'):
            super().on_instruction(cpu, address, size, context)
            return
        a, b, c = (cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:3])
        if name == '_getenv':
            variable = self.cstring(a)
            if variable not in LOADER_ENVIRONMENT:
                raise RuntimeError('库搜索环境变量不在明确模型内')
            # 显式空的 guest 搜索环境；不读取或复制用户的宿主环境变量。
            self.loader_environment_queries.append(variable.decode('ascii'))
            result = 0
        elif name == '_strncpy':
            if c > 16384:
                raise RuntimeError('诊断字符串复制超出有界模型')
            if c:
                raw = bytearray()
                for index in range(c):
                    value = bytes(cpu.mem_read(b + index, 1))
                    if len(value) != 1:
                        raise RuntimeError('诊断字符串读取不完整')
                    if value == b'\0':
                        break
                    raw.extend(value)
                cpu.mem_write(a, bytes(raw) + bytes(c - len(raw)))
            result = a
        self.extra_imports[name] += 1
        cpu.reg_write(ARGUMENT_REGISTERS[0], result)
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))


def verify_native_route(data):
    """执行注册片段，核对 (2,23,1,0) 的真实处理地址，不调用处理器。"""
    probe = NativeProbe(data)
    probe.cpu.mem_write(probe.heap + 0x200, struct.pack('<Q', probe.heap))
    probe.cpu.reg_write(UC_ARM64_REG_X22, probe.heap)
    probe.run(0x102ba9958, stop=0x102ba9984)
    if len(probe.records) != 1:
        raise RuntimeError('统一安全原生路由注册次数不符')
    record = probe.records[0]
    if record['ids'] != [2, 23, 1, 0] or record['argument4'] != '0x102ba9304' or record['return_address'] != '0x102ba9984':
        raise RuntimeError('统一安全原生路由与指令证据不符')
    return {'ids': record['ids'], 'target': record['argument4'], 'registration_callsite': '0x102ba9980', 'synthetic_registration_table_only': True}


def load_module(probe, source, size, bizid):
    """在已校验主程序中读取完整容器，按实际模块名称加载原生引擎。"""
    raw = bytes(probe.cpu.mem_read(source, size))
    code, metadata, bindings = parse_container(raw, allow_empty_bindings=bizid == 'lvm_minilibc')
    if metadata['basic']['bizid'] != bizid:
        raise RuntimeError('模块名称与固定来源不符')
    if bizid == 'lvm_minilibc' and bindings:
        raise RuntimeError('库模块不应包含业务命令')
    if bizid == 'lvm_unifiedsec' and [item for item in bindings if item['destIndex'] == 66070102] != [{'index': 1, 'destIndex': 66070102}]:
        raise RuntimeError('统一安全导出映射不符')
    engine = probe.run(0x102a52988, (0,))
    if not engine:
        raise RuntimeError('模块引擎构造失败')
    blob = probe.allocate(len(code))
    probe.cpu.mem_write(blob, code)
    status = probe.run(0x102a516ac, (engine, blob, len(code)))
    return engine, {'bizid': bizid, 'source': hex(source), 'container_bytes': size, 'bytecode_bytes': len(code), 'business_bindings': len(bindings), 'load_status': status}


def inspect(sample, with_native_route=True):
    """先对照缺库/补库加载，再执行有明确字段来源的合成 Unified 原始 ABI。"""
    data = read_binary(sample)
    route = verify_native_route(data)
    with ZipFile(sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    created = []

    def create_probe(*args, **kwargs):
        """保留本轮探针以继续加载依赖，不保存 guest 内存到磁盘。"""
        probe = UnifiedBoundaryProbe(*args, scenario='baseline', **kwargs)
        created.append(probe)
        return probe

    try:
        with patch.object(slice_probe, 'SDSCoreProbe', create_probe):
            slice_probe.inspect(data, resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True)
        if len(created) != 1:
            raise RuntimeError('统一安全实验探针数不符')
        probe = created[0]
        failed_engine, missing = load_module(probe, *UNIFIED, 'lvm_unifiedsec')
        context = struct.unpack('<Q', probe.cpu.mem_read(failed_engine, 8))[0]
        diagnostic = struct.unpack('<II', probe.cpu.mem_read(context + 0x58, 8))
        if missing['load_status'] != 42 or diagnostic != (42, 2) or probe.cstring(context + 0x60) != b'lvm_minilibc':
            raise RuntimeError('缺库负例没有到达预期依赖边界')
        missing.update(diagnostic_fields=list(diagnostic), missing_library='lvm_minilibc')
        _, library = load_module(probe, *LIBRARY, 'lvm_minilibc')
        engine, loaded = load_module(probe, *UNIFIED, 'lvm_unifiedsec')
        if library['load_status'] or loaded['load_status']:
            raise RuntimeError('补齐库后仍未完成原生模块加载')
        if with_native_route:
            probe.native_routes[(2, 23, 1, 0)] = 0x102ba9304
        if not probe.signing_engine:
            raise RuntimeError('尚无已验证的普通签名引擎')
        probe.module_routes[(1, 4, 1, 0)] = (probe.signing_engine, 3, 'lvm_sig')
        request, outputs, public_arguments, error, arguments, result = (probe.allocate(size) for size in (216, 48, 16, 8, 16, 8))
        probe.cpu.mem_write(request, bytes(216))
        probe.cpu.mem_write(outputs, bytes(48))
        # 对应原生包装器 sp+0xd0 的偏移；可选字段显式为空，不猜设备值。
        fields = ((0, probe.appkey), (0x18, probe.fixture_input('security-factors')), (0x40, ''), (0x58, API), (0x70, ''))
        for offset, text in fields:
            probe.cpu.mem_write(request + offset, struct.pack('<QI', probe.write_string(text), len(text.encode('utf8'))))
        probe.cpu.mem_write(public_arguments, struct.pack('<QQ', request, outputs))
        probe.cpu.mem_write(arguments, struct.pack('<QQ', public_arguments, error))
        before = len(probe.observed_commands)
        status = None
        boundary = None
        try:
            status = probe.run(0x102a518ec, (engine, 1, arguments, 2, result))
            boundary = {'kind': 'vm_returned', 'result_is_one': struct.unpack('<Q', probe.cpu.mem_read(result, 8))[0] == 1}
        except MissingCommand:
            boundary = {'kind': 'uninitialized_command', 'ids': probe.missing_command}
        except MissingLinkedFunction:
            boundary = {'kind': 'unimplemented_linked_function', 'symbol': probe.linked_execution}
        except RuntimeError as stopped:
            pc = probe.cpu.reg_read(UC_ARM64_REG_PC)
            if str(stopped) != '消息超出主程序包标识的明确模型' or probe.imports.get(pc) != '_objc_msgSend':
                raise
            selector = probe.cstring(probe.cpu.reg_read(ARGUMENT_REGISTERS[1]))
            if not selector or any(value not in b'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_:' for value in selector) or len(selector) > 100:
                raise RuntimeError('不能安全导出平台选择子名称') from None
            boundary = {'kind': 'unsupported_objc_message', 'native_pc': hex(pc), 'return_address': hex(probe.cpu.reg_read(UC_ARM64_REG_X30)), 'selector': selector.decode('ascii')}
        slots = [index for index in range(6) if struct.unpack('<Q', probe.cpu.mem_read(outputs + 8 * index, 8))[0]]
        next_lookup = None
        if boundary.get('return_address') == '0x102b9abe8':
            if probe.cstring(0x1068fe6b7) != b'One' or probe.cstring(0x1068fe6b0) != b'play:':
                raise RuntimeError('后续平台常量与原生前缀不符')
            next_lookup = {'class_name': 'One', 'selector': 'play:', 'declared_in_main_image': b'One' in probe.image_classes, 'lookup_executed': False, 'source': 'decoded native prefix and subsequent NSClassFromString/NSSelectorFromString instructions'}
        return {
            'binary_sha256': EXPECTED_SHA256,
            'scope': 'native Unified dependency and raw-ABI synthetic execution boundary; not the Objective-C wrapper, portable signer, or server validation',
            'without_library': missing, 'library': library, 'with_library': loaded,
            'native_route': {**route, 'enabled': with_native_route},
            'raw_abi': {'request_bytes': 216, 'output_slots': 6, 'input_mode': 'security-factors', 'input_fields': 22, 'use_wua': 0, 'optional_fields': 'explicitly empty; no device values guessed', 'objc_wrapper_conformance_verified': False},
            'execution': {'vm_status': status, 'boundary': boundary, 'nonzero_output_slots': slots, 'error_slot_at_stop': struct.unpack('<I', probe.cpu.mem_read(error, 4))[0], 'error_slot_is_final': False, 'observed_commands': probe.observed_commands[before:]},
            'next_runtime_lookup': next_lookup,
            'link_only_symbols': sorted(probe.linked), 'link_only_execution': probe.linked_execution,
            'loader_environment_queries': probe.loader_environment_queries,
            'extra_import_calls': dict(probe.extra_imports),
            'execution_limits': {'timeout_per_run_us': probe.execution_timeout_us, 'instruction_limit_per_run': probe.instruction_limit},
            'synthetic_dependencies': ['explicit nonzero clock and UTC timezone', 'empty synthetic SDK state directory', 'single-thread locks/TLS and deferred frees', 'limited Objective-C bundle model', 'four loader environment variables explicitly unset without reading host environment', 'fchmod/socketpair link-only slots trap if executed'],
            'monitor_calls_with_omitted_side_effects': probe.omitted_monitor_calls,
            'private_values_exported': False, 'network_requests_sent': 0,
            'sdk_initialization_complete': False, 'complete_portable_signer': False,
            'server_verified': False, 'iphone_verified': False,
        }
    finally:
        for probe in created:
            probe.appkey = None
            if probe.candidate is not None:
                probe.candidate[:] = bytes(len(probe.candidate))
                probe.candidate.clear()
        created.clear()


def main():
    """仅输出依赖名称、地址、状态码和调用编号，不输出安全因子或原始参数。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    parser.add_argument('--without-native-route', action='store_true', help='保留 (2,23,1,0) 缺失路由作为对照')
    args = parser.parse_args()
    print(json.dumps(inspect(args.sample, not args.without_native_route), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
