"""显式省略监控副作用的 SDS 切片探针；仅在合成配置与 IPA 资源上离线运行。"""
import argparse
from functools import partial
import hashlib
import json
import plistlib
import secrets
import struct
from zipfile import ZipFile

from unicorn import UC_HOOK_CODE, UcError
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X27, UC_ARM64_REG_X6, UC_ARM64_REG_X7, UC_ARM64_REG_X30

from probe_native import ARGUMENT_REGISTERS, read_binary
from probe_vm import ModuleProbe, load_modules
from guest_zlib import GuestZlib
from guest_bsd_random import GuestBSDRandom
from sample_appkey import read_sample_appkey
from guest_empty_state import EmptyState, STATE_ROOT, verify_root_component

RESOURCE_SHA256 = 'add1c126c9e52bdc4b16335ecfee0f463b0d97d82b98ce150754dd2a359c23dd'
DIRECTORY = b'synthetic-context-argument2'
RESOURCE_PATH = DIRECTORY + b'/yw_1222.jpg'


class SDSCoreProbe(ModuleProbe):
    """保留原生计算，只建模公开包信息、单个只读资源和明确省略的监控调用。"""

    def __init__(self, data, imports, local_symbols, *, resource, bundle_id, with_zlib=False, with_sdk_directory=False, with_sample_appkey=False):
        """解析主程序真实类表，建立有界文件、内存和公开包标识模型。"""
        self.bsd_random = None
        self.sample_sds_bindings = {}
        self.with_sample_appkey = with_sample_appkey
        self.zlib_adapter = None
        self.with_zlib = with_zlib
        self.random_calls = 0
        self.allocation_origins = {}
        self.allocations = {}
        self.errno_slot = None
        self.resource = resource
        self.bundle_id = bundle_id.encode('ascii')
        self.files = {}
        self.file_events = []
        self.crypto_calls = []
        self.omitted_monitor_calls = 0
        self.bundle_queries = []
        super().__init__(data, imports, local_symbols)
        self.empty_state = EmptyState(self) if with_sdk_directory else None
        self.image_classes = {}
        offset = 32
        for _ in range(struct.unpack_from('<I', data, 16)[0]):
            command, size = struct.unpack_from('<II', data, offset)
            if command == 25:
                for index in range(struct.unpack_from('<I', data, offset + 64)[0]):
                    start = offset + 72 + index * 80
                    if data[start:start + 16].split(b'\0')[0] != b'__objc_classlist':
                        continue
                    address, length = struct.unpack_from('<QQ', data, start + 32)
                    for current in range(address, address + length, 8):
                        pointer = struct.unpack('<Q', self.cpu.mem_read(current, 8))[0]
                        ro = struct.unpack('<Q', self.cpu.mem_read(pointer + 32, 8))[0] & ~7
                        name = struct.unpack('<Q', self.cpu.mem_read(ro + 24, 8))[0]
                        self.image_classes[self.cstring(name)] = pointer
            offset += size
        monitor = self.image_classes.get(b'asdu2399asd')
        if monitor != 0x106440e40:
            raise RuntimeError('监控类与主程序元数据不符')
        ro = struct.unpack('<Q', self.cpu.mem_read(monitor + 32, 8))[0] & ~7
        methods = struct.unpack('<Q', self.cpu.mem_read(ro + 32, 8))[0]
        entry_size, count = struct.unpack('<II', self.cpu.mem_read(methods, 8))
        if (entry_size, count) != (24, 59):
            raise RuntimeError('监控方法表格式不符')
        self.monitor_methods = {}
        for index in range(count):
            name, _, implementation = struct.unpack('<QQQ', self.cpu.mem_read(methods + 8 + index * 24, 24))
            selected = self.cstring(name)
            if selected in (b'adsf2332sdd', b'checkApmEnabled', b'getSGRootPath', b'appVersion', b'httpTrackReport:', b'registerAppFGBGObserver'):
                self.monitor_methods[selected.decode('ascii')] = hex(implementation)
        if self.monitor_methods.get('adsf2332sdd') != '0x102be7b7c':
            raise RuntimeError('监控选择子实现不符')
        self.bundle_class, self.bundle_object, self.bundle_id_string = (self.allocate(16) for _ in range(3))
        self.bundle_id_cstring = self.write_string(bundle_id)
        # Mach-O bind 表明确将此引用绑定到 Foundation 的 NSBundle；不建模其他系统类。
        self.cpu.mem_write(0x1062b3570, struct.pack('<Q', self.bundle_class))

    def allocate(self, size):
        """保留父类分配上限，并记录 realloc 可复制的有效请求长度。"""
        result = super().allocate(size)
        self.allocations[result] = size
        self.allocation_origins[result] = self.cpu.reg_read(UC_ARM64_REG_X30)
        return result

    def on_instruction(self, cpu, address, size, context):
        """执行原生代码；未知文件、对象、编码、消息与系统导入均中止。"""
        if self.empty_state is not None and self.empty_state.handle(address):
            return
        name = self.imports.get(address)
        if self.callback <= address < self.callback + 16 and self.sample_sds_bindings:
            command = tuple(cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:4])
            # 仅使用真实容器中的精确绑定；不存在的命令仍交由父类拒绝。
            if command[:2] == (1, 6) and command[3] == 0 and command not in self.module_routes:
                lookup = 66010600 + command[2]
                if lookup in self.sample_sds_bindings:
                    self.module_routes[command] = (self.module_routes[(1, 6, 36, 0)][0], self.sample_sds_bindings[lookup], 'lvm_sds')
        if name is None and not self.callback <= address < self.callback + 16:
            if address == 0x102abc330:
                argument = cpu.reg_read(ARGUMENT_REGISTERS[0])
                self.crypto_calls.append({'native_handler': hex(address), 'type_u32_at_argument_offset4': struct.unpack('<I', cpu.mem_read(argument + 4, 4))[0]})
            super().on_instruction(cpu, address, size, context)
            return
        a, b, c, d = (cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:4])
        if self.callback <= address < self.callback + 16 and [a, b, c, d] == [1, 37, 1, 1]:
            # 仅在本独立切片中省略监控副作用；返回值由原生 0x102aa16ec 的常量指令核对。
            self.observed_commands.append([a, b, c, d])
            self.omitted_monitor_calls += 1
            result = 0
        elif self.with_sample_appkey and name in ('_srandom', '_random'):
            if self.bsd_random is None:
                self.bsd_random = GuestBSDRandom()
            result = self.bsd_random.call(name, a)
        elif self.with_zlib and name in ('_inflateInit_', '_inflate', '_inflateEnd'):
            if self.zlib_adapter is None:
                self.zlib_adapter = GuestZlib(self)
            result = self.zlib_adapter.call(name, a, b, c)
        elif self.with_zlib and name == '_arc4random':
            # 使用宿主系统熵产生同宽度随机数，不输出随机值或假定签名成功。
            self.random_calls += 1
            result = secrets.randbits(32)
        elif name == '_realloc':
            if a and a not in self.allocations:
                raise RuntimeError('realloc 指针不是已记录的分配')
            result = self.allocate(b)
            if a and b:
                cpu.mem_write(result, bytes(cpu.mem_read(a, min(b, self.allocations[a]))))
        elif name == '___error':
            if self.errno_slot is None:
                self.errno_slot = self.allocate(4)
            result = self.errno_slot
        elif name == '_fopen':
            if self.cstring(a) != RESOURCE_PATH or self.cstring(b) != b'rb':
                raise RuntimeError('文件请求超出明确绑定的 IPA 只读资源')
            result = self.allocate(16)
            self.files[result] = 0
            self.file_events.append({'operation': 'fopen', 'resource': 'yw_1222.jpg', 'mode': 'rb'})
        elif name == '_fread':
            if d not in self.files or b * c > 0x1000000:
                raise RuntimeError('未知文件句柄或读取长度超限')
            position = self.files[d]
            raw = self.resource[position:position + b * c]
            if raw:
                cpu.mem_write(a, raw)
            self.files[d] += len(raw)
            result = len(raw) // b if b else 0
            self.file_events.append({'operation': 'fread', 'requested_bytes': b * c, 'copied_bytes': len(raw)})
        elif name == '_fclose':
            if a not in self.files:
                raise RuntimeError('关闭未知文件句柄')
            del self.files[a]
            result = 0
            self.file_events.append({'operation': 'fclose'})
        elif name == '_stat':
            if self.cstring(a) != RESOURCE_PATH:
                raise RuntimeError('stat 请求超出明确绑定的 IPA 资源')
            # iPhoneOS arm64 头文件的 sizeof/offsetof 由 verify_ios_stat.c 编译断言复核。
            status = bytearray(144)
            struct.pack_into('<HHQ', status, 4, 0o100444, 1, 1)
            struct.pack_into('<qqi', status, 96, len(self.resource), (len(self.resource) + 511) // 512, 4096)
            cpu.mem_write(b, bytes(status))
            result = 0
            self.file_events.append({'operation': 'stat', 'file_bytes': len(self.resource)})
        elif name == '_NSClassFromString':
            string_pointer, length = struct.unpack('<QQ', cpu.mem_read(a + 16, 16))
            raw = self.cstring(string_pointer)
            if len(raw) != length or raw != b'OpenSecurityGuardManager':
                raise RuntimeError('类查询超出已验证的主程序类')
            # 此类确实位于主程序类表；缺失时直接失败，不以 nil 代替未知运行时结果。
            if raw not in self.image_classes:
                raise RuntimeError('主程序缺少预期的 SecurityGuard 类')
            result = self.image_classes[raw]
            self.bundle_queries.append({'class': raw.decode('ascii'), 'declared_in_main_image': True})
        elif name == '_objc_msgSend':
            selector = self.cstring(b)
            if a == self.bundle_class and selector == b'bundleForClass:' and c in self.image_classes.values():
                result = self.bundle_object
            elif a == self.bundle_object and selector == b'bundleIdentifier':
                result = self.bundle_id_string
            elif a == self.bundle_id_string and selector == b'length':
                result = len(self.bundle_id)
            elif a == self.bundle_id_string and selector == b'cStringUsingEncoding:' and c == 4:
                result = self.bundle_id_cstring
            else:
                raise RuntimeError('消息超出主程序包标识的明确模型')
        elif name in ('_objc_retain', '_objc_release', '_objc_retainAutorelease', '_objc_retainAutoreleasedReturnValue', '_objc_autoreleaseReturnValue'):
            if a not in (0, self.bundle_object, self.bundle_id_string):
                raise RuntimeError('ARC 对象超出包标识模型')
            # 合成对象保留到探针结束，不模拟完整引用计数或 iOS 对象生命周期。
            result = a
        else:
            super().on_instruction(cpu, address, size, context)
            return
        cpu.reg_write(ARGUMENT_REGISTERS[0], result)
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))


def inspect(data, resource, bundle_id, full_trace=False, with_zlib=False, with_sdk_directory=False, with_sample_appkey=False, synthetic_input='synthetic-input'):
    """运行明确省略监控的切片，按选项验证解压、目录回调和后续错误边界。"""
    if len(resource) != 133573 or hashlib.sha256(resource).hexdigest() != RESOURCE_SHA256:
        raise ValueError('IPA 资源摘要不符')
    if bundle_id != 'com.cainiao.cnwireless':
        raise ValueError('样本公开包标识不符')
    if with_sdk_directory and not with_zlib:
        raise ValueError('状态目录切片必须同时启用真实 zlib')
    if with_sample_appkey and not with_sdk_directory:
        raise ValueError('样本 appKey 路径必须同时启用状态目录和真实 zlib')
    if synthetic_input not in ('synthetic-input', 'synthetic-input-changed'):
        raise ValueError('探针只接受明确的合成输入变体')
    state_directory_evidence = verify_root_component(data) if with_sdk_directory else None
    probe, engine, evidence = load_modules(data, with_sds=True, probe_class=partial(SDSCoreProbe, resource=resource, bundle_id=bundle_id, with_zlib=with_zlib, with_sdk_directory=with_sdk_directory, with_sample_appkey=with_sample_appkey))
    if not full_trace:
        # 此区段只有纯原生计算；所有导入、解码跳板、业务分发和宿主入口仍保留钩子。
        quiet_start, quiet_end = 0x102a6c000, 0x102a6f000
        if any(quiet_start <= address < quiet_end for address in (*probe.imports, *probe.host_targets, 0x102a598ec)):
            raise RuntimeError('省略跟踪的区段包含需要拦截的入口')
        probe.cpu.hook_del(probe.code_hook)
        probe.cpu.hook_add(UC_HOOK_CODE, probe.on_instruction, begin=1, end=quiet_start - 1)
        probe.cpu.hook_add(UC_HOOK_CODE, probe.on_instruction, begin=quiet_end, end=0xffffffffffffffff)
    probe.instruction_limit = 50000000
    if bytes(probe.cpu.mem_read(0x102aa16ec, 4)) != struct.pack('<I', 0xd2800000):
        raise RuntimeError('监控处理器的常量返回指令不符')
    probe.native_routes.update({(1, 1, 3, 0): 0x102aed18c, (1, 9, 2, 0): 0x102aaf54c, (1, 2, 1, 0): 0x102abc330})
    if with_sdk_directory:
        # 注册点 0x102a925b4 / 0x102a925cc 已核对；继续执行真实错误报告处理器。
        probe.native_routes[(1, 14, 5, 0)] = 0x102af24c4
    probe.cpu.reg_write(UC_ARM64_REG_X6, 0)
    probe.cpu.reg_write(UC_ARM64_REG_X7, 0)
    probe.cpu.mem_write(probe.stack + 0xff000, bytes(40))
    state_root = probe.write_string(STATE_ROOT.decode('ascii')) if with_sdk_directory else 0
    sdk_context = probe.run(0x102a71164, (0, 0, probe.write_string(DIRECTORY.decode('ascii')), 0, 0, state_root))
    if with_sdk_directory:
        returned_root = probe.run(0x102a71568, (sdk_context,))
        # 回调返回 0x102a725dc 创建的字符串对象；其首成员才是 C 字符串指针。
        root_data = struct.unpack('<Q', probe.cpu.mem_read(returned_root, 8))[0] if returned_root else 0
        if not root_data or probe.cstring(root_data) != STATE_ROOT:
            raise RuntimeError('SDK +0x70 回调未返回构造器 x5 的状态目录')
    arguments, error, output = (probe.allocate(size) for size in (16, 8, 8))
    probe.cpu.mem_write(arguments, struct.pack('<QQ', sdk_context, error))
    sds_engine = probe.module_routes[(1, 6, 36, 0)][0]
    status = probe.run(0x102a518ec, (sds_engine, 38, arguments, 2, output))
    sds_context = struct.unpack('<Q', probe.cpu.mem_read(sds_engine, 8))[0]
    module = struct.unpack('<Q', probe.cpu.mem_read(sds_context, 8))[0]
    base = struct.unpack('<Q', probe.cpu.mem_read(module + 0x18, 8))[0]
    buffer = struct.unpack('<Q', probe.cpu.mem_read(base + 0xabe8, 8))[0]
    if not buffer or buffer == sdk_context or probe.allocations.get(buffer) != 104:
        raise RuntimeError('SDS 目录缓冲区布局不符')
    buffer_data = struct.unpack('<Q', probe.cpu.mem_read(buffer, 8))[0]
    if probe.cstring(buffer_data) != DIRECTORY or struct.unpack('<Q', probe.cpu.mem_read(buffer + 0x48, 8))[0] != 0x102abf384:
        raise RuntimeError('SDS 目录内容或复制回调不符')
    core_error = struct.unpack('<I', probe.cpu.mem_read(error, 4))[0]
    if (status, core_error, probe.omitted_monitor_calls) != (0, 0, 1):
        raise RuntimeError('切片初始化返回与已知路径不符')
    appkey, appkey_evidence = read_sample_appkey(probe, sds_engine) if with_sample_appkey else ('synthetic-appkey', None)
    hashmap = probe.run(0x102a9abac)
    text = probe.write_string(synthetic_input)
    value = probe.run(0x102a725dc, (text,))
    probe.run(0x102a72570, (value, text))
    probe.run(0x102a9afd8, (hashmap, probe.write_string('INPUT'), value, 0))
    request = probe.allocate(128)
    probe.cpu.mem_write(request, struct.pack('<QQQII', hashmap, probe.write_string(appkey), probe.write_string(''), 19, 0))
    probe.cpu.mem_write(arguments, struct.pack('<QQ', request, error))
    probe.cpu.mem_write(error, bytes(8))
    probe.cpu.mem_write(output, bytes(8))
    instruction_allocation = None
    signature_status = None
    signature_result = None
    try:
        signature_status = probe.run(0x102a518ec, (engine, 3, arguments, 2, output))
    except UcError:
        if with_sample_appkey:
            raise
        if with_sdk_directory or not with_zlib or probe.memory_fault != {'native_pc': '0x102a2b7e4', 'address': '0x0', 'bytes': 8}:
            raise
        current_instruction = probe.cpu.reg_read(UC_ARM64_REG_X27)
        for pointer, allocated in probe.allocations.items():
            if pointer <= current_instruction < pointer + allocated:
                instruction_allocation = {'allocated_bytes': allocated, 'instruction_offset': hex(current_instruction - pointer), 'allocation_return_address': hex(probe.allocation_origins[pointer])}
                break
    except RuntimeError as stopped:
        if with_sample_appkey:
            raise
        if with_sdk_directory:
            if str(stopped) != '消息超出主程序包标识的明确模型' or probe.imports.get(probe.cpu.reg_read(UC_ARM64_REG_PC)) != '_objc_msgSend' or probe.cpu.reg_read(UC_ARM64_REG_X30) != 0x102a69b0c or probe.cstring(probe.cpu.reg_read(ARGUMENT_REGISTERS[1])) != b'stringWithFormat:':
                raise
            if probe.completed_module_calls != [{'module': 'lvm_sds', 'export_index': 34, 'vm_status': 0, 'business_error': 11, 'output_present': False}]:
                raise RuntimeError('SDS 状态目录路径的返回结果与已验证边界不符')
        elif with_zlib or str(stopped) != '不支持的原生导入：_inflateInit_':
            raise
    else:
        if not with_sample_appkey:
            raise RuntimeError('签名切片未在已知解压依赖处停止')
        returned = struct.unpack('<Q', probe.cpu.mem_read(output, 8))[0]
        if signature_status != 0 or not returned:
            raise RuntimeError('样本标识路径未返回签名候选对象')
        data_pointer, byte_count = struct.unpack('<QI', probe.cpu.mem_read(returned, 12))
        if not data_pointer or not 1 <= byte_count <= 4096:
            raise RuntimeError('签名候选对象布局或长度超限')
        raw = bytes(probe.cpu.mem_read(data_pointer, byte_count))
        if not raw.isascii() or b'\0' in raw or bytes(probe.cpu.mem_read(data_pointer + byte_count, 1)) != b'\0':
            raise RuntimeError('返回内容不符合原生包装器的 UTF-8 C 字符串要求')
        # 只保留形状，不导出候选签名、内存、随机值或资源解码结果。
        signature_result = {'vm_status': signature_status, 'output_present': True, 'bytes': byte_count, 'ascii': True, 'nul_terminated': True, 'base64_alphabet_only': all(value in b'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for value in raw), 'value_exported': False, 'wrapper_success_branch': '0x102ab5714', 'wrapper_string_member_read': '0x102ab571c', 'wrapper_utf8_conversion': '0x102ab5730..0x102ab5740', 'error_slot_checked_on_nonnull_output': False, 'server_verified': False}

    if not with_zlib and probe.imports.get(probe.cpu.reg_read(UC_ARM64_REG_PC)) != '_inflateInit_':
        raise RuntimeError('实际停止位置不是 zlib 导入')
    if not probe.crypto_calls or sum(event.get('copied_bytes', 0) for event in probe.file_events) != len(resource) or probe.files:
        raise RuntimeError('资源读取或原生加密调用不完整')
    zlib_events = probe.zlib_adapter.events if probe.zlib_adapter else []
    if with_zlib:
        finished = [event for event in zlib_events if event['operation'] == '_inflate' and event['return_code'] == 1]
        expected_lengths = [306065, 86480, 1230] if with_sample_appkey else [306065, 86480]
        if [event['total_out'] for event in finished] != expected_lengths or probe.zlib_adapter.streams or probe.random_calls < 1:
            raise RuntimeError(f'完整解压或随机依赖执行与已知路径不符: {[event["total_out"] for event in finished]}, streams={len(probe.zlib_adapter.streams)}, arc4random_calls={probe.random_calls}')
    evidence.update({
        'scope': 'offline SDS slice; monitoring side effects explicitly omitted; public bundle metadata and one IPA resource only',
        'synthetic_dependencies': evidence['synthetic_dependencies'] + [
            'monitor command (1,37,1,1) side effects omitted; normal return constant 0 verified at 0x102aa16ec; not full SDK initialization',
            'SDK constructor uses zero flags, a public synthetic resource directory, and an explicit synthetic state directory only when requested; remaining parameters zero',
            'read-only guest file and Darwin arm64 stat metadata for exact IPA asset; no host user files',
            *(['real host libz with bounded guest ABI adapter; no guest custom allocators; host system entropy for arc4random'] if with_zlib else []),
            *(['empty synthetic Documents/SGDocuments state directory; access(F_OK) returns Darwin ENOENT with carry; LP64 cerror writes errno and returns -1 in x0/x1; uncancelled single thread only'] if with_sdk_directory else []),
            *(['sample public appKey from real index-0 export; value not exported; real Darwin BSD random with isolated 128-byte guest state; time remains zero'] if with_sample_appkey else []),
            'NSBundle and NSString model limited to main-image class and Info.plist bundle identifier; ARC lifetime deferred',
        ],
        'sds_slice': {
            'monitor_class_in_main_image': {'name': 'asdu2399asd', 'class_pointer': '0x106440e40', 'instance_method_count': 59, 'selected_methods': probe.monitor_methods, 'runtime_messages_executed': False},
            'monitor_calls_with_omitted_side_effects': probe.omitted_monitor_calls,
            'core_export_vm_status': status,
            'core_export_business_error': core_error,
            'full_sdk_initialization_verified': False,
            'resource_directory_buffer': {'module_slot_offset': '0xabe8', 'allocated_bytes': 104, 'equals_sdk_context': False, 'contains_synthetic_argument2': True, 'copy_member_offset': '0x48', 'copy_target': '0x102abf384', 'constructor': '0x102abf544'},
            'resource': {'archive_entry': 'Payload/Cainiao4iPhone.app/yw_1222.jpg', 'bytes': len(resource), 'sha256': RESOURCE_SHA256, 'events': probe.file_events},
            'bundle_identifier_from_ipa': bundle_id,
            'class_queries': probe.bundle_queries,
            'native_crypto_calls': probe.crypto_calls,
            'observed_commands': probe.observed_commands,
            'native_command_routes': [{'ids': list(ids), 'handler': hex(target)} for ids, target in probe.native_routes.items()],
            'zlib_enabled': with_zlib,
            'zlib_events': zlib_events,
            'host_random_u32_calls': probe.random_calls,
            'sample_appkey': appkey_evidence,
            'signature_candidate': signature_result,
            'bsd_random_calls': probe.bsd_random.calls if probe.bsd_random else {},
            'metadata_sds_routes': [{'lookup': lookup, 'export': index} for lookup, index in sorted(probe.sample_sds_bindings.items())] if with_sample_appkey else [],
            'stop_reason': 'outer_vm_returned' if with_sample_appkey else 'error_reporting_objc_dependency' if with_sdk_directory else 'unresolved_runtime_state_null_read' if with_zlib else 'unsupported_zlib_import',
            'sdk_state_directory_enabled': with_sdk_directory,
            'sdk_state_directory': state_directory_evidence,
            'empty_state_events': probe.empty_state.events if probe.empty_state else [],
            'completed_module_calls': probe.completed_module_calls,
            'memory_fault': probe.memory_fault,
            'fault_instruction_allocation': instruction_allocation,
            'missing_import': None if with_zlib else '_inflateInit_',
            'stop_return_address': hex(probe.cpu.reg_read(UC_ARM64_REG_X30)),
            'signature_vm_returned': signature_status == 0,
            'business_error_at_stop': struct.unpack('<I', probe.cpu.mem_read(error, 4))[0],
            'business_error_is_final': False,
            'error_slot_meaning': 'nonnull output takes wrapper success branch; slot may remain 99' if with_sample_appkey else 'interrupted path; not final',
        },
    })
    return evidence


def main():
    """显式确认使用研究切片，读取固定 IPA 的公开元数据与资源并输出脱敏证据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample', help='归档 8.10.703 IPA；需要其中资源与 Info.plist')
    parser.add_argument('--omit-monitoring', action='store_true', required=True, help='明确省略监控副作用；结果不能视为完整 SDK 初始化')
    parser.add_argument('--with-zlib', action='store_true', help='用真实宿主 libz 完整解压；未知运行状态仍中止')
    parser.add_argument('--with-sdk-directory', action='store_true', help='传入来源已核对的合成 Documents/SGDocuments；状态文件均不存在，需要 --with-zlib')
    parser.add_argument('--with-sample-appkey', action='store_true', help='执行真实 index-0 getAppKey；需要 --with-sdk-directory；只导出候选结果形状')
    parser.add_argument('--changed-input', action='store_true', help='使用明确的第二组合成 INPUT，仅供输入敏感性对照')
    parser.add_argument('--full-trace', action='store_true', help='保留纯原生计算区段的逐指令钩子，用于对照')
    args = parser.parse_args()
    data = read_binary(args.sample)
    with ZipFile(args.sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle_id = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    print(json.dumps(inspect(data, resource, bundle_id, args.full_trace, args.with_zlib, args.with_sdk_directory, args.with_sample_appkey, 'synthetic-input-changed' if args.changed_input else 'synthetic-input'), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
