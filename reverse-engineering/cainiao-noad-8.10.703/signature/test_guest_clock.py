"""公开合成内存上的 Darwin 时钟 ABI 与参数边界检查。"""
import struct
import unittest

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from guest_clock import GuestClock
from probe_native import ARGUMENT_REGISTERS
from test_guest_empty_state import StateMemory


class ClockTests(unittest.TestCase):
    """检查非零与负时间、time(NULL)、输出范围和未知导入。"""

    def test_time_64bit_and_null(self):
        """time 返回完整有符号 64 位秒值，NULL 不得产生内存写入。"""
        for seconds in (0, -1, 0x1122334455667788):
            probe = StateMemory()
            probe.imports[0x400] = '_time'
            clock = GuestClock(seconds, 0)
            for pointer in (0, probe.allocate(8)):
                probe.reg_write(ARGUMENT_REGISTERS[0], pointer)
                probe.reg_write(UC_ARM64_REG_X30, 0x800)
                before = bytes(probe.memory)
                self.assertTrue(clock.handle(probe, 0x400))
                self.assertEqual(probe.reg_read(ARGUMENT_REGISTERS[0]), seconds & 0xffffffffffffffff)
                self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), 0x800)
                if pointer:
                    self.assertEqual(struct.unpack('<q', probe.mem_read(pointer, 8))[0], seconds)
                else:
                    self.assertEqual(bytes(probe.memory), before)

    def test_timeval_padding_and_timezone(self):
        """gettimeofday 写 8 字节秒和 4 字节微秒，保持尾部 padding 及相邻字节。"""
        probe = StateMemory()
        probe.imports[0x400] = '_gettimeofday'
        value = probe.allocate(24)
        zone = probe.allocate(16)
        probe.mem_write(value, bytes([0x5a]) * 24)
        probe.mem_write(zone, bytes([0xa5]) * 16)
        probe.reg_write(ARGUMENT_REGISTERS[0], value)
        probe.reg_write(ARGUMENT_REGISTERS[1], zone)
        self.assertTrue(GuestClock(1800000000, 999999).handle(probe, 0x400))
        self.assertEqual(probe.mem_read(value, 24), struct.pack('<qi', 1800000000, 999999) + bytes([0x5a]) * 12)
        self.assertEqual(probe.mem_read(zone, 16), bytes(8) + bytes([0xa5]) * 8)
        self.assertEqual(probe.reg_read(ARGUMENT_REGISTERS[0]), 0)

    def test_null_timeval_and_unknown_import(self):
        """允许显式 NULL 输出；未知导入不改变寄存器或内存。"""
        probe = StateMemory()
        probe.imports[0x400] = '_gettimeofday'
        probe.reg_write(UC_ARM64_REG_X30, 0x900)
        before = bytes(probe.memory)
        self.assertTrue(GuestClock(1, 2).handle(probe, 0x400))
        self.assertEqual(bytes(probe.memory), before)
        registers = dict(probe.registers)
        self.assertFalse(GuestClock(1, 2).handle(probe, 0x401))
        self.assertEqual(probe.registers, registers)

    def test_reject_invalid_clock(self):
        """拒绝布尔值、浮点值、time_t 溢出和非法微秒。"""
        for seconds, micros in ((True, 0), (1.0, 0), (1 << 63, 0), (-(1 << 63) - 1, 0), (0, True), (0, 0.5), (0, -1), (0, 1000000)):
            with self.subTest(seconds=seconds, micros=micros), self.assertRaises(ValueError):
                GuestClock(seconds, micros)


if __name__ == '__main__':
    unittest.main()
