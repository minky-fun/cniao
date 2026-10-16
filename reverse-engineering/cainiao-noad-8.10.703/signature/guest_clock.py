"""显式的离线 Darwin 时钟；只写 ABI 字段，不读取设备或账号状态。"""
from dataclasses import dataclass
import struct

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS


@dataclass(frozen=True)
class GuestClock:
    """调用方指定 Unix 秒与微秒，供可重复的离线对照使用。"""

    seconds: int
    microseconds: int

    def __post_init__(self):
        """拒绝非整数、time_t 溢出和不符合 timeval 范围的微秒。"""
        if type(self.seconds) is not int or not -(1 << 63) <= self.seconds < (1 << 63):
            raise ValueError('时钟秒值超出 Darwin time_t')
        if type(self.microseconds) is not int or not 0 <= self.microseconds < 1000000:
            raise ValueError('时钟微秒必须在 0 至 999999 之间')

    def handle(self, probe, address):
        """处理 time/gettimeofday，保留 timeval 的四字节尾部 padding。"""
        name = probe.imports.get(address)
        if name not in ('_time', '_gettimeofday'):
            return False
        cpu = probe.cpu
        pointer, timezone = (cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:2])
        if pointer:
            raw = struct.pack('<q', self.seconds)
            if name == '_gettimeofday':
                raw += struct.pack('<i', self.microseconds)
            cpu.mem_write(pointer, raw)
        if name == '_gettimeofday' and timezone:
            # 离线模型显式采用 UTC、无夏令时；不声称读取了 iPhone 时区。
            cpu.mem_write(timezone, bytes(8))
        result = self.seconds if name == '_time' else 0
        cpu.reg_write(ARGUMENT_REGISTERS[0], result & 0xffffffffffffffff)
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
        return True
