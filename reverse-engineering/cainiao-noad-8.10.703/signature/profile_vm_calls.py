"""仅统计剩余 VM 调用入口的描述符类型和公开代码目标，不导出参数或数据。"""
import argparse
from collections import Counter
import json
import plistlib
import struct
from unittest.mock import patch
from zipfile import ZipFile

from unicorn.arm64_const import UC_ARM64_REG_SP, UC_ARM64_REG_X8, UC_ARM64_REG_X9, UC_ARM64_REG_X10, UC_ARM64_REG_X19, UC_ARM64_REG_X26
import probe_sds_slice as slice_probe
from probe_native import ARGUMENT_REGISTERS, read_binary


class CallProfile(slice_probe.SDSCoreProbe):
    """观察真实描述符读取后的寄存器，不推测其余布局字段。"""

    latest = None

    def __init__(self, *args, **kwargs):
        """只保存脱敏计数，并从样本读取真实四项跳转表。"""
        super().__init__(*args, **kwargs)
        self.kinds = Counter()
        self.target_classes = Counter()
        self.ffi_targets = Counter()
        self.descriptor_targets = Counter()
        self.direct_abi_flags = Counter()
        self.result_kinds = Counter()
        self.result_targets = Counter()
        self.complex_abi_calls = []
        self.current_abi = None
        self.descriptor_indices = set()
        self.case_targets = [hex(0x102a4db30 + value * 4) for value in self.cpu.mem_read(0x10481f20e, 4)]
        self.result_case_targets = [hex(0x102a4de70 + value * 4) for value in self.cpu.mem_read(0x10481f212, 6)]
        CallProfile.latest = self

    def on_instruction(self, cpu, address, size, context):
        """仅记录已由汇编明确读取的描述符类型和 FFI 代码入口类别。"""
        if address == 0x102a4db10:
            kind = cpu.reg_read(UC_ARM64_REG_X10) & 0xffffffff
            index = cpu.reg_read(UC_ARM64_REG_X9) & 0xffffffff
            table = cpu.reg_read(UC_ARM64_REG_X8)
            if index > 65535:
                raise RuntimeError('实际调用描述符下标超出调查边界')
            target = struct.unpack('<Q', cpu.mem_read(table + index * 16 + 8, 8))[0]
            category = 'null' if target == 0 else 'image-address' if 0x100000000 <= target < 0x107000000 else 'guest-object'
            self.kinds[kind] += 1
            self.target_classes[(kind, category)] += 1
            self.descriptor_indices.add((table, index))
        elif address == 0x102a4dd9c:
            target = cpu.reg_read(UC_ARM64_REG_X10)
            name = self.imports.get(target) or self.host_targets.get(target)
            label = name if name is not None else hex(target) if 0x100000000 <= target < 0x107000000 else 'non-image-target'
            self.descriptor_targets[label] += 1
        elif address == 0x102a4ddf4:
            self.direct_abi_flags[cpu.reg_read(UC_ARM64_REG_X9) & 0xff] += 1
        elif address == 0x102a4de50:
            selector = cpu.reg_read(UC_ARM64_REG_X8) & 0xffffffff
            target = cpu.reg_read(UC_ARM64_REG_X10)
            name = self.imports.get(target) or self.host_targets.get(target)
            label = name if name is not None else hex(target) if 0x100000000 <= target < 0x107000000 else 'non-image-target'
            self.result_kinds[selector] += 1
            self.result_targets[(selector, label)] += 1
            if selector == 0:
                descriptor = cpu.reg_read(UC_ARM64_REG_X26)
                self.current_abi = {'target': label, 'abi': struct.unpack('<I', cpu.mem_read(descriptor + 32, 4))[0], 'fixed_signed_byte': struct.unpack('<b', cpu.mem_read(descriptor + 18, 1))[0]}
        elif self.current_abi is not None and address in (0x102a4e194, 0x102a4e1f0):
            sp = cpu.reg_read(UC_ARM64_REG_SP)
            count = struct.unpack('<I', cpu.mem_read(sp + 0x78, 4))[0]
            if count > 256:
                raise RuntimeError('复杂 ABI 参数数量超过原生解析器上限')
            if address == 0x102a4e194:
                types = []
                for index in range(count):
                    pointer = struct.unpack('<Q', cpu.mem_read(sp + 0x898 + index * 8, 8))[0]
                    total, alignment, kind = struct.unpack('<QHH', cpu.mem_read(pointer, 12))
                    types.append({'type': kind, 'bytes': total, 'alignment': alignment})
                pointer = struct.unpack('<Q', cpu.mem_read(sp + 0x40, 8))[0]
                total, alignment, kind = struct.unpack('<QHH', cpu.mem_read(pointer, 12))
                self.current_abi.update(arguments=types, result={'type': kind, 'bytes': total, 'alignment': alignment})
            else:
                vm_context = cpu.reg_read(UC_ARM64_REG_X19)
                offsets = []
                for index in range(count):
                    pointer = struct.unpack('<Q', cpu.mem_read(sp + 0x98 + index * 8, 8))[0]
                    offset = pointer - vm_context
                    offsets.append(offset if 0 <= offset < 0x200 else 'outside-context')
                self.current_abi['source_offsets'] = offsets
                self.complex_abi_calls.append(self.current_abi)
                self.current_abi = None
        elif address == 0x102a4ea64:
            target = cpu.reg_read(ARGUMENT_REGISTERS[2])
            name = self.imports.get(target) or self.host_targets.get(target)
            label = name if name is not None else hex(target) if 0x100000000 <= target < 0x107000000 else 'non-image-target'
            self.ffi_targets[label] += 1
        return super().on_instruction(cpu, address, size, context)


def main():
    """读取固定 IPA，仅输出描述符结构及已执行的代码地址/公开绑定名。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    args = parser.parse_args()
    with ZipFile(args.sample) as archive:
        resource = archive.read('Payload/Cainiao4iPhone.app/yw_1222.jpg')
        bundle = plistlib.loads(archive.read('Payload/Cainiao4iPhone.app/Info.plist'))['CFBundleIdentifier']
    with patch.object(slice_probe, 'SDSCoreProbe', CallProfile):
        result = slice_probe.inspect(read_binary(args.sample), resource, bundle, with_zlib=True, with_sdk_directory=True, with_sample_appkey=True)
    probe = CallProfile.latest
    evidence = {'scope': 'original offline VM call helpers, synthetic input only; no call parameters or descriptor contents exported', 'candidate_bytes': result['sds_slice']['signature_candidate']['bytes'], 'descriptor_kind_case_targets': probe.case_targets, 'descriptor_kind_calls': dict(sorted(probe.kinds.items())), 'distinct_descriptor_locations': len(probe.descriptor_indices), 'descriptor_target_classes': [{'kind': kind, 'class': category, 'count': count} for (kind, category), count in sorted(probe.target_classes.items())], 'indirect_gate_targets': [{'target': label, 'count': count} for label, count in probe.ffi_targets.most_common()], 'server_verified': False}
    evidence['descriptor_function_targets'] = [{'target': label, 'count': count} for label, count in probe.descriptor_targets.most_common()]
    evidence['descriptor_helper_scope'] = 'all observed helper invocations, including callers beyond opcode 3; not descriptor_kind_calls alone'
    evidence['descriptor_result_case_targets'] = probe.result_case_targets
    evidence['descriptor_byte_17_counts'] = dict(sorted(probe.direct_abi_flags.items()))
    evidence['descriptor_word_36_counts'] = dict(sorted(probe.result_kinds.items()))
    evidence['selector_targets'] = [{'selector': selector, 'target': label, 'count': count} for (selector, label), count in sorted(probe.result_targets.items())]
    evidence['complex_abi_calls'] = probe.complex_abi_calls
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    CallProfile.latest = None


if __name__ == '__main__':
    main()
