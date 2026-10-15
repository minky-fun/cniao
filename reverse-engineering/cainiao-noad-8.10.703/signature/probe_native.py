"""隔离复核固定样本的类型解码和处理函数注册；不执行或模拟签名成功。"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from zipfile import ZipFile, is_zipfile

from unicorn import Uc, UcError, UC_ARCH_ARM64, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm64_const import (
    UC_ARM64_REG_X0, UC_ARM64_REG_X1, UC_ARM64_REG_X2,
    UC_ARM64_REG_X3, UC_ARM64_REG_X4, UC_ARM64_REG_X5,
    UC_ARM64_REG_X30, UC_ARM64_REG_SP, UC_ARM64_REG_PC,
)

EXPECTED_SHA256 = 'd305a955a56094e30bc693249e455fdae9fd8ba04cc2ec66e573ca02bb0e5b61'
ARGUMENT_REGISTERS = (
    UC_ARM64_REG_X0, UC_ARM64_REG_X1, UC_ARM64_REG_X2,
    UC_ARM64_REG_X3, UC_ARM64_REG_X4, UC_ARM64_REG_X5,
)
DECODER_TARGETS = {
    0x10442ddd0: 0x102a653a4,
    0x10442dddc: 0x102a65438,
    0x10442dde8: 0x102a65310,
    0x10442ddf4: 0x102b2a388,
    0x10442de0c: 0x102b2a5c0,
}


def read_binary(path):
    """仅接受已核对摘要的主程序或包含该主程序的归档 IPA。"""
    if is_zipfile(path):
        with ZipFile(path) as archive:
            data = archive.read('Payload/Cainiao4iPhone.app/Cainiao4iPhone')
    else:
        data = Path(path).read_bytes()
    if hashlib.sha256(data).hexdigest() != EXPECTED_SHA256:
        raise ValueError('主程序 SHA-256 不匹配，拒绝使用固定地址执行')
    return data


class NativeProbe:
    """运行有限 ARM64 片段；人工回调仅捕获路由，不调用处理函数。"""

    def __init__(self, data):
        """映射已校验样本、合成堆栈、注册表和栈保护值。"""
        segments = []
        offset = 32
        for _ in range(struct.unpack_from('<I', data, 16)[0]):
            command, size = struct.unpack_from('<II', data, offset)
            if command == 25:
                vm, length, file_offset, file_size = struct.unpack_from('<QQQQ', data, offset + 24)
                if vm and length:
                    segments.append((vm, length, file_offset, file_size))
            offset += size
        self.cpu = Uc(UC_ARCH_ARM64, UC_MODE_ARM)
        base = min(segment[0] for segment in segments)
        end = max(segment[0] + segment[1] for segment in segments)
        self.cpu.mem_map(base, (end - base + 4095) & ~4095)
        for vm, length, file_offset, file_size in segments:
            if file_size:
                self.cpu.mem_write(vm, data[file_offset:file_offset + file_size])
        self.stack = 0x700000000
        self.heap = 0x200000000
        self.callback = 0x300000000
        self.stop = self.callback + 0x100
        for address, size in ((self.stack, 0x100000), (self.heap, 0x10000), (self.callback, 4096)):
            self.cpu.mem_map(address, size)
        self.cpu.mem_write(0x1068f5e40, struct.pack('<Q', self.heap))
        self.cpu.mem_write(0x1068fd690, struct.pack('<Q', self.heap))
        self.cpu.mem_write(self.heap, struct.pack('<4Q', *range(self.callback, self.callback + 16, 4)))
        self.cpu.mem_write(0x1053bb718, struct.pack('<Q', self.heap + 0x100))
        self.records = []
        self.capture_dispatcher = False
        self.code_hook = self.cpu.hook_add(UC_HOOK_CODE, self.on_instruction)

    def on_instruction(self, cpu, address, size, context):
        """导入仅重定向至样本自身解码代码；合成回调记录参数并返回 0。"""
        if address in DECODER_TARGETS:
            cpu.reg_write(UC_ARM64_REG_PC, DECODER_TARGETS[address])
            return
        is_table_callback = self.callback <= address < self.callback + 16
        if is_table_callback or (self.capture_dispatcher and address == 0x102aa973c):
            values = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS]
            self.records.append({
                'return_address': hex(cpu.reg_read(UC_ARM64_REG_X30)),
                'target': hex(address),
                'ids': values[:4],
                'argument4': hex(values[4]),
                'argument5': hex(values[5]),
            })
            cpu.reg_write(UC_ARM64_REG_X0, 0)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))

    def run(self, entry, arguments=(), stop=None):
        """按 AArch64 ABI 运行至明确边界；超限或缺少依赖时失败。"""
        for register, value in zip(ARGUMENT_REGISTERS, arguments):
            self.cpu.reg_write(register, value)
        self.cpu.reg_write(UC_ARM64_REG_SP, self.stack + 0xff000)
        self.cpu.reg_write(UC_ARM64_REG_X30, self.stop)
        end = self.stop if stop is None else stop
        try:
            self.cpu.emu_start(entry, end, timeout=2000000, count=100000)
        except UcError as error:
            pc = self.cpu.reg_read(UC_ARM64_REG_PC)
            raise RuntimeError(f'原生片段无法继续：{error}，PC={pc:#x}') from error
        if self.cpu.reg_read(UC_ARM64_REG_PC) != end:
            raise RuntimeError('原生片段超出时间或指令限制')
        return self.cpu.reg_read(UC_ARM64_REG_X0)


def inspect(data):
    """复核类型表、10701 路由、两组注册和元数据字段，返回无凭据证据。"""
    probe = NativeProbe(data)
    requested_type = struct.unpack('<Q', probe.cpu.mem_read(0x1048297c8, 8))[0]
    if requested_type != 7:
        raise RuntimeError('MTOP 请求类型常量与证据不符')
    types = [probe.run(0x102ab58c4, (0, 0, value)) for value in range(13)]
    if types != [2, 12, 2, 1, 0, 17, 18, 19, 20, 16, 21, 22, 23]:
        raise RuntimeError('类型转换表与定点反汇编证据不符')
    probe.run(0x102ae0930)
    open_records = list(probe.records)
    signature_registration = [record for record in open_records if record['ids'] == [1, 7, 1, 1]]
    if len(open_records) != 20 or len(signature_registration) != 1 or signature_registration[0]['argument4'] != '0x102ae051c':
        raise RuntimeError('公开注册函数结果与证据不符')
    probe.records.clear()
    probe.run(0x102b3d750, stop=0x102b3d838)
    unified_records = list(probe.records)
    if ([record['ids'] for record in unified_records] != [[7, 34, 1, 1], [7, 34, 2, 1]]
            or [record['argument4'] for record in unified_records] != ['0x102b3d1e0', '0x102b3d39c']):
        raise RuntimeError('Unified 注册结果与证据不符')
    probe.records.clear()
    input_pointer, error_pointer = probe.heap + 0x500, probe.heap + 0x600
    probe.capture_dispatcher = True
    probe.run(0x102ae03ac, (10701, input_pointer, error_pointer))
    command_record = probe.records[-1]
    if command_record['ids'] != [1, 7, 1, 1]:
        raise RuntimeError('10701 拆分结果与证据不符')
    probe.capture_dispatcher = False
    probe.run(0x102ae051c, (input_pointer, error_pointer))
    inner_record = probe.records[-1]
    if inner_record['ids'] != [1, 4, 1, 0] or inner_record['argument4'] != hex(input_pointer) or inner_record['argument5'] != hex(error_pointer):
        raise RuntimeError('内部转发参数与证据不符')
    probe.run(0x102a66ca8, stop=0x102a66e90)
    metadata_fields = []
    for address, length in ((0x1068f1cf5, 9), (0x1068f1cff, 10), (0x1068f1d0a, 6), (0x1068f1d11, 9), (0x1068f1cd1, 10)):
        value = bytes(probe.cpu.mem_read(address, length)).rstrip(b'\0').decode('ascii')
        metadata_fields.append(value)
    if metadata_fields != ['isPublic', 'destIndex', 'index', 'metainfo', 'stacksize']:
        raise RuntimeError('元数据字段解码与调用位置不符')
    probe.run(0x102b7173c, stop=0x102b71780)
    data_field = bytes(probe.cpu.mem_read(0x1068fd856, 5)).rstrip(b'\0').decode('ascii')
    if data_field != 'data':
        raise RuntimeError('MiddleTier 字段解码与证据不符')
    return {
        'binary_sha256': EXPECTED_SHA256,
        'scope': 'offline bounded execution of routing and decoder fragments; no signing handler executed',
        'synthetic_dependencies': ['function table callbacks capture arguments and return 0', 'zero stack-canary storage'],
        'native_decoder_imports': {hex(stub): hex(target) for stub, target in DECODER_TARGETS.items()},
        'mtop_request_type_constant': {'address': '0x1048297c8', 'value': requested_type},
        'request_type_table_0_to_11': types[:12],
        'middle_tier_data_field': {'address': '0x1068fd856', 'value': data_field},
        'out_of_range_type_12': types[12],
        'open_registrations': open_records,
        'unified_registrations_prefix': unified_records,
        'unified_stop_before_other_initialization': '0x102b3d838',
        'command_10701': command_record,
        'inner_signature_forward': inner_record,
        'metadata_loader_fields': metadata_fields,
        'signing_verified': False,
    }


def main():
    """从指定样本输出路由证据，不读取 BoxJS、凭据或连接网络。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample', help='已归档 IPA 或解出的 Cainiao4iPhone 主程序')
    args = parser.parse_args()
    print(json.dumps(inspect(read_binary(args.sample)), indent=2))


if __name__ == '__main__':
    main()
