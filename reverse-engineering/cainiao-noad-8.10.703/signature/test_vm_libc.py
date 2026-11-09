"""核对离线 VM 导入模型的 C 字符串 ABI，避免保存指针被误当成结果指针。"""
from collections import Counter
import struct
import unittest

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30

from probe_native import ARGUMENT_REGISTERS
from probe_vm import ModuleProbe
from test_guest_empty_state import StateMemory


class CStringMemory(ModuleProbe, StateMemory):
    """只给 ModuleProbe 提供公开测试字符串和需要的单个导入。"""

    def __init__(self):
        """建立无 IPA、无账号资料的 ABI 测试内存。"""
        StateMemory.__init__(self)
        self.imports = {0x400: '_strtok_r', 0x404: '_atoi'}
        self.used = Counter()
        self.host_targets = {}


class VMStringABITests(unittest.TestCase):
    """用跨调用保存指针和部分数字解析检查真实 C 行为。"""

    def test_strtok_r_saveptr_tracks_next_unread_byte(self):
        """第一次返回 token 时保存指针必须指向下一字节，末尾返回空指针。"""
        probe = CStringMemory()
        source = probe.write_string('alpha,beta')
        separator = probe.write_string(',')
        save = probe.allocate(8)
        probe.reg_write(UC_ARM64_REG_X30, 0x800)
        for first, expected_token, expected_next in ((source, source, source + 6), (0, source + 6, source + 10), (0, 0, source + 10)):
            probe.reg_write(ARGUMENT_REGISTERS[0], first)
            probe.reg_write(ARGUMENT_REGISTERS[1], separator)
            probe.reg_write(ARGUMENT_REGISTERS[2], save)
            ModuleProbe.on_instruction(probe, probe.cpu, 0x400, 4, None)
            self.assertEqual(probe.reg_read(ARGUMENT_REGISTERS[0]), expected_token)
            self.assertEqual(struct.unpack('<Q', probe.mem_read(save, 8))[0], expected_next)
            self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), 0x800)
        self.assertEqual(probe.cstring(source), b'alpha')

    def test_atoi_uses_single_sign_and_numeric_prefix(self):
        """atoi 接受数字后的非数字字节，并拒绝双符号输入。"""
        probe = CStringMemory()
        probe.reg_write(UC_ARM64_REG_X30, 0x800)
        probe.reg_write(ARGUMENT_REGISTERS[0], probe.write_string('  -12tail'))
        ModuleProbe.on_instruction(probe, probe.cpu, 0x404, 4, None)
        self.assertEqual(probe.reg_read(ARGUMENT_REGISTERS[0]), 0xfffffff4)
        probe.reg_write(ARGUMENT_REGISTERS[0], probe.write_string('--12'))
        with self.assertRaisesRegex(RuntimeError, 'atoi'):
            ModuleProbe.on_instruction(probe, probe.cpu, 0x404, 4, None)


if __name__ == '__main__':
    unittest.main()
