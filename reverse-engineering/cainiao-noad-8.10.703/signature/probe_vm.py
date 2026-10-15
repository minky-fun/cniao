"""离线复核 lvm_sig 容器、真实宿主绑定、VM 加载及签名依赖边界。"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import struct
import subprocess
from tempfile import TemporaryDirectory

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_SP, UC_ARM64_REG_X30
from module_container import parse_container
from probe_native import ARGUMENT_REGISTERS, EXPECTED_SHA256, NativeProbe, read_binary


class MissingCommand(RuntimeError):
    """遇到未初始化的 SecurityGuard 分发项时中止，不返回伪造成功结果。"""


class ModuleProbe(NativeProbe):
    """使用真实 VM 代码及有界 C 内存依赖，不模拟加密或业务服务。"""

    def __init__(self, data, imports, local_symbols):
        """创建独立堆和单线程状态，并保存已核对的导入符号地址。"""
        self.imports = imports
        self.local_symbols = local_symbols
        self.import_addresses = {name: address for address, name in imports.items()}
        self.next_address = 0x210000000
        self.used = Counter()
        self.tls = {}
        self.host_targets = {}
        self.host_calls = []
        self.resolved_system_names = []
        self.missing_command = None
        self.module_routes = {}
        self.route_frames = []
        self.completed_module_calls = []
        self.observed_commands = []
        super().__init__(data)
        self.cpu.mem_map(self.next_address, 0x4000000)

    def allocate(self, size):
        """在最多 64 MiB 的隔离堆中分配，单次请求上限为 16 MiB。"""
        if size > 0x1000000 or self.next_address + max(size, 16) >= 0x214000000:
            raise RuntimeError('隔离堆分配超限')
        address = self.next_address
        self.next_address += (max(size, 16) + 15) & ~15
        return address

    def cstring(self, address):
        """读取有终止符且不超过 8192 字节的隔离内存字符串。"""
        result = bytearray()
        for offset in range(8192):
            value = bytes(self.cpu.mem_read(address + offset, 1))
            if value == b'\0':
                return bytes(result)
            result.extend(value)
        raise RuntimeError('字符串超出限制')

    def write_string(self, value):
        """仅为公开合成样本分配 C 字符串，不读取账号配置。"""
        raw = value.encode('ascii') + b'\0'
        address = self.allocate(len(raw))
        self.cpu.mem_write(address, raw)
        return address

    def run(self, entry, arguments=(), stop=None):
        """按原生 ABI 有界执行，只有到达指定结束地址才认为片段完成。"""
        for register, value in zip(ARGUMENT_REGISTERS, arguments):
            self.cpu.reg_write(register, value)
        self.cpu.reg_write(UC_ARM64_REG_SP, self.stack + 0xff000)
        self.cpu.reg_write(UC_ARM64_REG_X30, self.stop)
        end = self.stop if stop is None else stop
        self.cpu.emu_start(entry, end, timeout=20000000, count=10000000)
        if self.cpu.reg_read(UC_ARM64_REG_PC) != end:
            raise RuntimeError('VM 片段超出时间或指令限制')
        return self.cpu.reg_read(ARGUMENT_REGISTERS[0])

    def on_instruction(self, cpu, address, size, context):
        """运行本地解码与 VM；未知依赖及业务分发立即停止，不打印参数数据。"""
        if address == self.callback + 0x200:
            if cpu.reg_read(ARGUMENT_REGISTERS[0]) != 0:
                raise RuntimeError('关联模块解释器返回错误')
            frame = self.route_frames.pop()
            result = struct.unpack('<Q', cpu.mem_read(frame['output'], 8))[0]
            self.completed_module_calls.append({'module': frame['module'], 'export_index': frame['export_index'], 'vm_status': 0, 'business_error': struct.unpack('<I', cpu.mem_read(frame['error_pointer'], 4))[0], 'output_present': result != 0})
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_X30, frame['return_address'])
            cpu.reg_write(UC_ARM64_REG_PC, frame['return_address'])
            return
        if self.callback <= address < self.callback + 16:
            self.missing_command = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:4]]
            self.observed_commands.append(list(self.missing_command))
            route = self.module_routes.get(tuple(self.missing_command))
            if route is not None:
                engine, index, name = route
                args = self.allocate(16)
                output = self.allocate(8)
                cpu.mem_write(args, struct.pack('<QQ', cpu.reg_read(ARGUMENT_REGISTERS[4]), cpu.reg_read(ARGUMENT_REGISTERS[5])))
                self.route_frames.append({'module': name, 'export_index': index, 'output': output, 'error_pointer': cpu.reg_read(ARGUMENT_REGISTERS[5]), 'return_address': cpu.reg_read(UC_ARM64_REG_X30)})
                for register, value in zip(ARGUMENT_REGISTERS, (engine, index, args, 2, output)):
                    cpu.reg_write(register, value)
                cpu.reg_write(UC_ARM64_REG_X30, self.callback + 0x200)
                cpu.reg_write(UC_ARM64_REG_PC, 0x102a518ec)
                return
            raise MissingCommand('尚未初始化的 SecurityGuard 分发项')
        if address in self.host_targets:
            self.host_calls.append(self.host_targets[address])
        if address == 0x102a598ec:
            name = self.cstring(cpu.reg_read(ARGUMENT_REGISTERS[1])).decode('ascii')
            target = self.import_addresses.get('_' + name)
            if target is None:
                raise RuntimeError('未解析 VM 系统导入：' + name)
            self.resolved_system_names.append(name)
            result = target
        elif address in self.imports:
            name = self.imports[address]
            args = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:3]]
            a, b, c = args
            self.used[name] += 1
            if name == '_malloc':
                result = self.allocate(a)
            elif name == '_free':
                result = 0
            elif name in ('_memcpy', '_memmove', '___memcpy_chk'):
                if c > 0x1000000:
                    raise RuntimeError('复制长度超限')
                cpu.mem_write(a, bytes(cpu.mem_read(b, c)))
                result = a
            elif name in ('_memset', '_bzero'):
                length, value = (b, 0) if name == '_bzero' else (c, b & 255)
                if length > 0x1000000:
                    raise RuntimeError('填充长度超限')
                cpu.mem_write(a, bytes([value]) * length)
                result = a if name == '_memset' else 0
            elif name == '_strlen':
                result = len(self.cstring(a))
            elif name == '_strdup':
                raw = self.cstring(a) + b'\0'
                result = self.allocate(len(raw))
                cpu.mem_write(result, raw)
            elif name == '_sprintf':
                # 本样本已观察到的唯一格式；Apple ARM64 可变参数从栈读取。
                if self.cstring(b) != b'%d':
                    raise RuntimeError('未实现的 sprintf 格式')
                number = struct.unpack('<i', cpu.mem_read(cpu.reg_read(UC_ARM64_REG_SP), 4))[0]
                raw = str(number).encode('ascii')
                cpu.mem_write(a, raw + b'\0')
                result = len(raw)
            elif name in ('_strcmp', '_memcmp'):
                if name == '_strcmp':
                    left, right = self.cstring(a), self.cstring(b)
                else:
                    if c > 0x1000000:
                        raise RuntimeError('比较长度超限')
                    left, right = bytes(cpu.mem_read(a, c)), bytes(cpu.mem_read(b, c))
                result = (left > right) - (left < right)
            elif name == '_pthread_key_create':
                cpu.mem_write(a, struct.pack('<I', 1))
                result = 0
            elif name == '_pthread_getspecific':
                result = self.tls.get(a, 0)
            elif name == '_pthread_setspecific':
                self.tls[a] = b
                result = 0
            elif name == '_pthread_self':
                result = 1
            elif name == '_gettimeofday':
                cpu.mem_write(a, struct.pack('<qq', 0, 0))
                if b:
                    cpu.mem_write(b, bytes(8))
                result = 0
            elif name in {
                '_pthread_mutex_lock', '_pthread_mutex_unlock', '_pthread_rwlock_init',
                '_pthread_mutex_init', '_pthread_mutexattr_init', '_pthread_mutexattr_settype',
                '_pthread_rwlock_rdlock', '_pthread_rwlock_wrlock', '_pthread_rwlock_unlock',
            }:
                result = 0
            elif name in self.local_symbols:
                cpu.reg_write(UC_ARM64_REG_PC, self.local_symbols[name])
                return
            else:
                raise RuntimeError('不支持的原生导入：' + name)
        else:
            super().on_instruction(cpu, address, size, context)
            return
        cpu.reg_write(ARGUMENT_REGISTERS[0], result & 0xffffffffffffffff)
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))


def inspect(data, with_sds=False):
    """复核固定样本的模块来源与真实绑定，返回不含凭据或静态密钥的证据。"""
    if hashlib.sha256(data).hexdigest() != EXPECTED_SHA256:
        raise ValueError('主程序 SHA-256 不匹配，拒绝执行固定地址')
    # 系统工具只解析固定样本的符号，不加载或启动该 iOS 程序。
    with TemporaryDirectory(prefix='cainiao-vm-symbols-') as directory:
        binary = Path(directory) / 'Cainiao4iPhone'
        binary.write_bytes(data)
        import_text = subprocess.check_output(['otool', '-Iv', str(binary)], text=True)
        symbol_text = subprocess.check_output(['nm', '-n', str(binary)], text=True)
    imports = {int(address, 16): name for address, name in re.findall(r'^(0x[0-9a-f]+)\s+\d+\s+(\S+)', import_text, re.M)}
    locals_by_name = {name: int(address, 16) for address, name in re.findall(r'^([0-9a-f]{16}) [Tt] (\S+)', symbol_text, re.M)}
    probe = ModuleProbe(data, imports, locals_by_name)
    probe.run(0x102a885ac, stop=0x102a88654)
    descriptor = struct.unpack('<4Q', probe.cpu.mem_read(0x105530118, 32))
    module_name = probe.cstring(descriptor[0]).decode('ascii')
    if module_name != 'lvm_sig' or descriptor[1:] != (0x102abfdf4, 1, 0):
        raise RuntimeError('模块描述符与反汇编证据不符')
    buffer = probe.run(descriptor[1], (0,))
    source, length = struct.unpack('<QQ', probe.cpu.mem_read(buffer, 16))
    if (source, length) != (0x106682a00, 17608):
        raise RuntimeError('模块来源与反汇编证据不符')
    container = bytes(probe.cpu.mem_read(source, length))
    code, metadata, commands = parse_container(container)
    if metadata['basic']['bizid'] != module_name or commands != [
        {'index': 3, 'destIndex': 66010401, 'isPublic': 0},
        {'index': 4, 'destIndex': 66011903, 'isPublic': 0},
        {'index': 5, 'destIndex': 66011904, 'isPublic': 0},
    ]:
        raise RuntimeError('签名模块命令绑定与证据不符')
    related_modules = []
    for name, address, size, command, index in (
        ('lvm_sds', 0x1066871e0, 26314, 66010636, 34),
        ('lvm_unifiedsec', 0x10669a7c8, 34317, 66070102, 1),
    ):
        raw = bytes(probe.cpu.mem_read(address, size))
        related_code, related_metadata, related_commands = parse_container(raw)
        matches = [binding for binding in related_commands if binding['destIndex'] == command]
        if related_metadata['basic']['bizid'] != name or len(matches) != 1 or matches[0]['index'] != index:
            raise RuntimeError('关联模块命令绑定与证据不符')
        related_modules.append({'name': name, 'source': hex(address), 'container_bytes': size, 'container_sha256': hashlib.sha256(raw).hexdigest(), 'bytecode_bytes': len(related_code), 'bytecode_sha256': hashlib.sha256(related_code).hexdigest(), 'basic_metadata': related_metadata['basic'], 'selected_command_binding': matches[0]})
    if probe.run(0x102a514ec) != 1:
        raise RuntimeError('VM 初始化失败')
    probe.run(0x102a8f424, stop=0x102a91b4c)
    host_bindings = []
    for index in range(165):
        entry = 0x1055302d8 + index * 24
        name, target, flags = struct.unpack('<QQQ', probe.cpu.mem_read(entry, 24))
        name = probe.cstring(name).decode('ascii')
        if name.startswith('AlgorithmHelper') or name.endswith('LVMBridge'):
            host_bindings.append({'entry': hex(entry), 'name': name, 'target': hex(target), 'flags': flags})
        if target:
            probe.host_targets[target] = name
    if probe.run(0x102a5475c, (0x1055302d8, 165)) != 0:
        raise RuntimeError('宿主函数绑定失败')
    engine = probe.run(0x102a52988, (0,))
    blob = probe.allocate(len(code))
    probe.cpu.mem_write(blob, code)
    if probe.run(0x102a516ac, (engine, blob, len(code))) != 0:
        raise RuntimeError('签名模块加载失败')
    sds_load_status = None
    if with_sds:
        sds_code, _, _ = parse_container(bytes(probe.cpu.mem_read(0x1066871e0, 26314)))
        sds_engine = probe.run(0x102a52988, (0,))
        sds_blob = probe.allocate(len(sds_code))
        probe.cpu.mem_write(sds_blob, sds_code)
        sds_load_status = probe.run(0x102a516ac, (sds_engine, sds_blob, len(sds_code)))
        if sds_load_status != 0:
            raise RuntimeError('SDS 模块加载失败')
        # 仅转发已由元数据与原生包装 ABI 双重核对的这个命令。
        probe.module_routes[(1, 6, 36, 0)] = (sds_engine, 34, 'lvm_sds')
    context = struct.unpack('<Q', probe.cpu.mem_read(engine, 8))[0]
    module = struct.unpack('<Q', probe.cpu.mem_read(context, 8))[0]
    base = struct.unpack('<Q', probe.cpu.mem_read(module + 0x18, 8))[0]
    export_table, export_count = struct.unpack('<QI', probe.cpu.mem_read(module + 0x118, 12))
    if export_count != 6:
        raise RuntimeError('模块导出数量与证据不符')
    exports = struct.unpack('<6I', probe.cpu.mem_read(export_table, 24))
    code_base = struct.unpack('<Q', probe.cpu.mem_read(module + 0x128, 8))[0]
    if exports != (0x6944, 0x6954, 0x6964, 0x5770, 0xb30, 0x988) or code_base - base != 0x214:
        raise RuntimeError('模块导出映射与证据不符')
    # 空参数只验证错误分支；类型 19 使用公开合成文字并在首个业务依赖前停止。
    request, error, args, output = (probe.allocate(size) for size in (128, 8, 16, 8))
    probe.cpu.mem_write(args, struct.pack('<QQ', request, error))
    empty_status = probe.run(0x102a518ec, (engine, 3, args, 2, output))
    empty_error = struct.unpack('<I', probe.cpu.mem_read(error, 4))[0]
    if (empty_status, empty_error) != (0, 1):
        raise RuntimeError('空参数错误分支与证据不符')
    hashmap = probe.run(0x102a9abac)
    text = probe.write_string('synthetic-input')
    value = probe.run(0x102a725dc, (text,))
    probe.run(0x102a72570, (value, text))
    probe.run(0x102a9afd8, (hashmap, probe.write_string('INPUT'), value, 0))
    probe.cpu.mem_write(request, struct.pack('<QQQII', hashmap, probe.write_string(''), probe.write_string('synthetic-appkey'), 19, 0))
    probe.host_calls.clear()
    try:
        probe.run(0x102a518ec, (engine, 3, args, 2, output))
    except MissingCommand:
        pass
    else:
        raise RuntimeError('类型 19 未在预期依赖处停止')
    expected_commands = [[1, 6, 36, 0], [1, 14, 5, 0]] if with_sds else [[1, 6, 36, 0]]
    if probe.observed_commands != expected_commands:
        raise RuntimeError('类型 19 业务依赖顺序与证据不符')
    return {
        'binary_sha256': EXPECTED_SHA256,
        'scope': 'offline bounded VM load and synthetic argument tracing; no cryptographic handler executed',
        'synthetic_dependencies': ['bounded bump allocator; free is deferred', 'single-thread locks return 0', 'single-thread TLS and thread id 1', 'gettimeofday returns zero', 'zero stack-canary storage', 'system symbol lookup uses verified Mach-O import names only', 'sprintf supports only the observed %d format with Apple ARM64 stack varargs'] + (['SDS routing shim uses the metadata-verified export index and native wrapper ABI'] if with_sds else []),
        'module': {'name': module_name, 'initializer': '0x102a885ac', 'descriptor': '0x105530118', 'callback': hex(descriptor[1]), 'source': hex(source), 'container_bytes': length, 'container_sha256': hashlib.sha256(container).hexdigest(), 'compressed_code_bytes': struct.unpack_from('<I', container)[0], 'bytecode_bytes': len(code), 'bytecode_sha256': hashlib.sha256(code).hexdigest(), 'metadata': metadata, 'command_bindings': commands},
        'related_modules': related_modules,
        'host_binding_table': {'decoder_prefix': '0x102a8f424', 'stop_before_copy': '0x102a91b4c', 'source': '0x1055302d8', 'entries': 165, 'entry_bytes': 24, 'registration': '0x102a5475c', 'registration_status': 0, 'selected_bindings': host_bindings},
        'native_vm_load': {'constructor': '0x102a52988', 'loader': '0x102a516ac', 'load_status': 0, 'system_imports': probe.resolved_system_names, 'export_code_offsets': [hex(value) for value in exports], 'code_section_offset': hex(code_base - base), 'signature_export_index': 3, 'signature_entry_bytecode_offset': hex(code_base - base + exports[3])},
        'execution_boundary': {'entry': '0x102a518ec', 'empty_argument_vm_status': empty_status, 'empty_argument_business_error': empty_error, 'synthetic_type': 19, 'observed_commands': probe.observed_commands, 'first_missing_command': probe.missing_command, 'sds_load_status': sds_load_status, 'completed_module_calls': probe.completed_module_calls, 'active_module_calls_at_stop': [{'module': frame['module'], 'export_index': frame['export_index']} for frame in probe.route_frames], 'business_error_at_stop': struct.unpack('<I', probe.cpu.mem_read(error, 4))[0], 'host_call_counts': dict(Counter(probe.host_calls)), 'missing_command_result_fabricated': False},
        'signing_verified': False,
        'widget_integration_completed': False,
    }


def main():
    """从归档 IPA 或解出主程序重建 JSON，不访问网络或账号资料。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample', help='已归档 IPA 或 Cainiao4iPhone 主程序')
    parser.add_argument('--with-sds', action='store_true', help='继续进入真实 SDS 导出项，遇到下一个未初始化命令时停止')
    args = parser.parse_args()
    print(json.dumps(inspect(read_binary(args.sample), with_sds=args.with_sds), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
