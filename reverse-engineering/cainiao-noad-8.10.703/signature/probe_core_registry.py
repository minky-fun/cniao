"""用原生注册表核对 flag 分区和处理函数指针，不执行签名。"""
import argparse
import json
from pathlib import Path
import re
import struct
import subprocess
from tempfile import TemporaryDirectory

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X0, UC_ARM64_REG_X30

from probe_native import EXPECTED_SHA256, read_binary
from probe_vm import ModuleProbe


class CoreRegistryProbe(ModuleProbe):
    """仅补齐原生注册时使用的确定性 POSIX 48 位随机序列。"""

    def on_instruction(self, cpu, address, size, context):
        """以已观察到的零时间种子处理 srand48/lrand48，其余依赖交由父探针。"""
        name = self.imports.get(address)
        if name == '_srand48':
            self.random48 = ((cpu.reg_read(UC_ARM64_REG_X0) & 0xffffffff) << 16) | 0x330e
            result = 0
        elif name == '_lrand48':
            if not hasattr(self, 'random48'):
                raise RuntimeError('lrand48 在 srand48 之前调用')
            self.random48 = (0x5deece66d * self.random48 + 0xb) & ((1 << 48) - 1)
            result = self.random48 >> 17
        else:
            return super().on_instruction(cpu, address, size, context)
        cpu.reg_write(UC_ARM64_REG_X0, result)
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))


def inspect(sample):
    """执行真实核心表安装、注册和双根查找，仅输出状态与公开代码地址。"""
    data = read_binary(sample)
    with TemporaryDirectory(prefix='cainiao-registry-') as directory:
        binary = Path(directory) / 'Cainiao4iPhone'
        binary.write_bytes(data)
        import_text = subprocess.check_output(['otool', '-Iv', str(binary)], text=True)
        symbol_text = subprocess.check_output(['nm', '-n', str(binary)], text=True)
    imports = {int(address, 16): name for address, name in re.findall(r'^(0x[0-9a-f]+)\s+\d+\s+(\S+)', import_text, re.M)}
    locals_by_name = {name: int(address, 16) for address, name in re.findall(r'^([0-9a-f]{16}) [Tt] (\S+)', symbol_text, re.M)}
    probe = CoreRegistryProbe(data, imports, locals_by_name)
    probe.cpu.mem_write(0x1068f5e40, bytes(8))
    install_status = probe.run(0x102aa9a30)
    table = struct.unpack('<Q', probe.cpu.mem_read(0x1068f5e40, 8))[0]
    callbacks = struct.unpack('<4Q', probe.cpu.mem_read(table, 32))
    roots = tuple(struct.unpack('<Q', probe.cpu.mem_read(address, 8))[0] for address in (0x1068f7ea0, 0x1068f7ea8))
    if (install_status != 1 or callbacks != (0x102aa9658, 0x102aa98d4, 0x102aa973c, 0x102aa9940)
            or not all(roots)):
        raise RuntimeError('真实核心表安装结果与固定样本不符')
    registration = probe.run(callbacks[0], (1, 34, 1, 1, 0x102aa9c90))
    output = probe.allocate(8)
    present = probe.run(0x102aa937c, (roots[1], 1, 34, 1, 0, output))
    handler = struct.unpack('<Q', probe.cpu.mem_read(output, 8))[0]
    other_flag = probe.run(0x102aa937c, (roots[0], 1, 34, 1, 0, output))
    missing_module = probe.run(0x102aa937c, (roots[0], 1, 34, 13, 0, output))
    module_registration = probe.run(callbacks[0], (1, 34, 13, 0, 0x102ab4068))
    module_lookup = probe.run(0x102aa937c, (roots[0], 1, 34, 13, 0, output))
    module_handler = struct.unpack('<Q', probe.cpu.mem_read(output, 8))[0]
    if (registration, present, handler, other_flag, missing_module) != (0, 0, 0x102aa9c90, 134019904, 134139904):
        raise RuntimeError('真实注册或 flag 分区查找结果与固定样本不符')
    if (module_registration, module_lookup, module_handler) != (0, 0, 0x102ab4068):
        raise RuntimeError('LLC 处理函数的原生注册表映射与固定样本不符')
    return {
        'binary_sha256': EXPECTED_SHA256,
        'scope': 'isolated native core table install and registry lookup',
        'installer': '0x102aa9a30',
        'callbacks': [hex(callback) for callback in callbacks],
        'registration': {'ids': [1, 34, 1, 1], 'handler': hex(handler), 'status': registration},
        'lookup_flag_1_status': present,
        'lookup_same_ids_flag_0_status': other_flag,
        'lookup_unregistered_module_flag_0_status': missing_module,
        'manually_registered_module': {'ids': [1, 34, 13, 0], 'handler': hex(module_handler), 'registration_status': module_registration, 'lookup_status': module_lookup},
        'synthetic_dependencies': ['zero time for srand48 seed', 'deterministic POSIX 48-bit random sequence'],
        'module_registration_completed': False,
        'signature_generated': False,
        'network_requests_sent': 0,
    }


def main():
    """解析已校验 IPA 或主程序，并打印不含私密值的注册表证据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    print(json.dumps(inspect(parser.parse_args().sample), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
