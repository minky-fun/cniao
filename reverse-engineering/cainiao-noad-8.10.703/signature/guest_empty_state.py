"""仅为显式启用的 SDS 研究切片提供空状态目录与 Darwin 错误 ABI。"""
import struct

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X16, UC_ARM64_REG_X30, UC_ARM64_REG_NZCV
from probe_native import ARGUMENT_REGISTERS, NativeProbe

STATE_ROOT = b'/synthetic/Documents/SGDocuments'


def verify_root_component(data):
    """运行 getSgRootPath 的常量解码前缀，只核对公开目录组件而不输出其他数据。"""
    probe = NativeProbe(data)
    probe.run(0x102abaa04, stop=0x102abab20)
    pointer = struct.unpack('<Q', probe.cpu.mem_read(0x10574ed38 + 16, 8))[0]
    if bytes(probe.cpu.mem_read(pointer, 12)) != b'SGDocuments\0':
        raise RuntimeError('getSgRootPath 的公开目录组件不符')
    return {'selector': 'getSgRootPath', 'implementation': '0x102abaa04', 'directory_enum': 9, 'domain_mask': 1, 'appended_component': 'SGDocuments', 'constructor_argument': 'x5', 'sdk_field_offset': '0x20', 'sdk_callback_offset': '0x70', 'sdk_callback': '0x102a71568', 'synthetic_root': STATE_ROOT.decode('ascii')}


class EmptyState:
    """状态文件始终不存在；拒绝未知系统调用、路径和访问模式。"""

    def __init__(self, probe):
        """绑定隔离内存和事件列表，不读取或创建宿主文件。"""
        self.probe = probe
        self.events = []

    def handle(self, address):
        """处理已核对的 access、cerror 和 calloc，其他入口交还原生执行。"""
        probe = self.probe
        cpu = probe.cpu
        name = probe.imports.get(address)
        if name != '_calloc' and address not in (0x102a2f3f0, 0x102a598ec, probe.callback + 0x300):
            return False
        a, b = (cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:2])
        if address == 0x102a2f3f0:
            path = probe.cstring(a)
            suffix = path[len(STATE_ROOT) + 1:]
            if cpu.reg_read(UC_ARM64_REG_X16) != 33 or b != 0 or not path.startswith(STATE_ROOT + b'/') or not suffix or any(part in (b'', b'.', b'..') for part in suffix.split(b'/')):
                raise RuntimeError('系统调用超出空状态目录 access(F_OK) 模型')
            # Darwin arm64 syscall 失败以 carry=1、x0=errno 返回，不使用 Linux 的负 errno。
            cpu.reg_write(ARGUMENT_REGISTERS[0], 2)
            cpu.reg_write(UC_ARM64_REG_NZCV, cpu.reg_read(UC_ARM64_REG_NZCV) | (1 << 29))
            cpu.reg_write(UC_ARM64_REG_PC, address + 4)
            self.events.append({'operation': 'access', 'syscall': 33, 'mode': 0, 'state_child': True, 'errno': 2, 'carry': True})
            return True
        if address == 0x102a598ec and probe.cstring(b) == b'cerror':
            result = probe.callback + 0x300
        elif address == probe.callback + 0x300:
            if a > 0x7fffffff:
                raise RuntimeError('cerror errno 超出有符号 int')
            if probe.errno_slot is None:
                probe.errno_slot = probe.allocate(4)
            cpu.mem_write(probe.errno_slot, struct.pack('<I', a))
            # XNU libsyscall/custom/errno.c 的 LP64 cerror 返回 128 位全一值。
            # 此离线切片为未取消的单线程；不实现 pthread cancellation 检查。
            result = 0xffffffffffffffff
            cpu.reg_write(ARGUMENT_REGISTERS[1], result)
            self.events.append({'operation': 'cerror', 'errno': a, 'return_x0_x1': '-1'})
        elif name == '_calloc':
            if a * b > 0x1000000:
                raise RuntimeError('calloc 乘积超出隔离堆上限')
            result = probe.allocate(a * b)
            if a * b:
                cpu.mem_write(result, bytes(a * b))
            self.events.append({'operation': 'calloc', 'zero_initialized': True})
        else:
            return False
        cpu.reg_write(ARGUMENT_REGISTERS[0], result)
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
        return True
