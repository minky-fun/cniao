"""用公开合成路径验证空目录模型的 Darwin ABI 与边界拒绝。"""
import struct
import unittest

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X16, UC_ARM64_REG_X30, UC_ARM64_REG_NZCV
from probe_native import ARGUMENT_REGISTERS
from guest_empty_state import EmptyState, STATE_ROOT
from test_guest_zlib import PublicMemory


class StateMemory(PublicMemory):
    """为公开测试内存增加寄存器和固定导入表。"""

    def __init__(self):
        """初始化无账号数据的 CPU 替身。"""
        super().__init__()
        self.registers = {}
        self.imports = {0x400: '_calloc'}
        self.callback = 0x100000
        self.errno_slot = None

    def reg_read(self, register):
        """返回测试显式写入的寄存器或 CPU 初始零值。"""
        return self.registers.get(register, 0)

    def reg_write(self, register, value):
        """保存寄存器值供 ABI 断言读取。"""
        self.registers[register] = value


class EmptyStateTests(unittest.TestCase):
    """核对失败状态、双寄存器返回、calloc 清零与拒绝未知路径。"""

    def test_access_and_cerror(self):
        """access 必须保留 NZCV 其他位；cerror 共享 errno 并返回两个 -1。"""
        probe = StateMemory()
        adapter = EmptyState(probe)
        probe.reg_write(ARGUMENT_REGISTERS[0], probe.write_string(STATE_ROOT.decode() + '/public-fixture'))
        probe.reg_write(UC_ARM64_REG_X16, 33)
        probe.reg_write(UC_ARM64_REG_NZCV, 0x80000000)
        self.assertTrue(adapter.handle(0x102a2f3f0))
        self.assertEqual(probe.reg_read(ARGUMENT_REGISTERS[0]), 2)
        self.assertEqual(probe.reg_read(UC_ARM64_REG_NZCV), 0xa0000000)
        self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), 0x102a2f3f4)
        probe.reg_write(UC_ARM64_REG_X30, 0x800)
        self.assertTrue(adapter.handle(probe.callback + 0x300))
        self.assertEqual(struct.unpack('<I', probe.mem_read(probe.errno_slot, 4))[0], 2)
        self.assertEqual([probe.reg_read(r) for r in ARGUMENT_REGISTERS[:2]], [0xffffffffffffffff] * 2)
        self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), 0x800)

    def test_reject_unknown_access(self):
        """拒绝根外、路径穿越、根本身以及未知系统调用或模式。"""
        probe = StateMemory()
        adapter = EmptyState(probe)
        for path, syscall, mode in [('/other/file', 33, 0), (STATE_ROOT.decode() + '/../file', 33, 0), (STATE_ROOT.decode(), 33, 0), (STATE_ROOT.decode() + '/file', 5, 0), (STATE_ROOT.decode() + '/file', 33, 4)]:
            with self.subTest(path=path, syscall=syscall, mode=mode):
                probe.reg_write(ARGUMENT_REGISTERS[0], probe.write_string(path))
                probe.reg_write(ARGUMENT_REGISTERS[1], mode)
                probe.reg_write(UC_ARM64_REG_X16, syscall)
                with self.assertRaisesRegex(RuntimeError, 'access'):
                    adapter.handle(0x102a2f3f0)

    def test_calloc_zero_and_overflow(self):
        """污染底层内存后仍须得到清零区域，超大乘积须在分配前失败。"""
        probe = StateMemory()
        adapter = EmptyState(probe)
        probe.memory[:] = bytes([0xa5]) * len(probe.memory)
        probe.reg_write(ARGUMENT_REGISTERS[0], 3)
        probe.reg_write(ARGUMENT_REGISTERS[1], 7)
        self.assertTrue(adapter.handle(0x400))
        self.assertEqual(probe.mem_read(probe.reg_read(ARGUMENT_REGISTERS[0]), 21), bytes(21))
        before = probe.next_address
        probe.reg_write(ARGUMENT_REGISTERS[0], 0xffffffffffffffff)
        probe.reg_write(ARGUMENT_REGISTERS[1], 2)
        with self.assertRaisesRegex(RuntimeError, '上限'):
            adapter.handle(0x400)
        self.assertEqual(probe.next_address, before)


if __name__ == '__main__':
    unittest.main()
