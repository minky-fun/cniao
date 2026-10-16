"""验证 Unified 研究适配器不会把链接占位符或未知平台状态当成成功。"""
from collections import Counter
import ctypes
import unittest

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS
from probe_unified_boundary import LOADER_ENVIRONMENT, MissingLinkedFunction, UnifiedBoundaryProbe
from test_guest_empty_state import StateMemory


class UnifiedHostTests(unittest.TestCase):
    """只使用公开 C 字符串、寄存器与内存，不装载 IPA。"""

    def create_memory(self):
        """创建测试适配器需要的状态，不安装真实系统函数实现。"""
        memory = StateMemory()
        memory.linked = {}
        memory.linked_execution = None
        memory.import_addresses = {}
        memory.extra_imports = Counter()
        memory.loader_environment_queries = []
        memory.host_libc = ctypes.CDLL(None)
        memory.reg_write(UC_ARM64_REG_X30, 0x800)
        return memory

    def test_link_only_traps(self):
        """解析只返回隔离回调槽；执行必须失败，不能调用宿主 fchmod/socketpair。"""
        memory = self.create_memory()
        for index, symbol in enumerate(('fchmod', 'socketpair')):
            memory.reg_write(ARGUMENT_REGISTERS[1], memory.write_string(symbol))
            UnifiedBoundaryProbe.on_instruction(memory, memory.cpu, 0x102a598ec, 4, None)
            pointer = memory.reg_read(ARGUMENT_REGISTERS[0])
            self.assertEqual(pointer, memory.callback + 0x500 + index * 4)
            self.assertEqual(memory.reg_read(UC_ARM64_REG_PC), 0x800)
            with self.assertRaises(MissingLinkedFunction):
                UnifiedBoundaryProbe.on_instruction(memory, memory.cpu, pointer, 4, None)
            self.assertEqual(memory.linked_execution, symbol)

    def test_guest_environment_is_explicit(self):
        """仅四个已确认的库搜索变量采用空环境；任何其他变量都拒绝。"""
        memory = self.create_memory()
        memory.imports[0x400] = '_getenv'
        for variable in LOADER_ENVIRONMENT:
            memory.reg_write(ARGUMENT_REGISTERS[0], memory.write_string(variable.decode('ascii')))
            UnifiedBoundaryProbe.on_instruction(memory, memory.cpu, 0x400, 4, None)
            self.assertEqual(memory.reg_read(ARGUMENT_REGISTERS[0]), 0)
        self.assertEqual(memory.loader_environment_queries, [value.decode('ascii') for value in LOADER_ENVIRONMENT])
        memory.reg_write(ARGUMENT_REGISTERS[0], memory.write_string('HOME'))
        with self.assertRaisesRegex(RuntimeError, '明确模型'):
            UnifiedBoundaryProbe.on_instruction(memory, memory.cpu, 0x400, 4, None)

    def test_strncpy_padding_truncation_and_limit(self):
        """复制有终止符时补零，无终止符时不额外加零，并保护长度上限。"""
        memory = self.create_memory()
        memory.imports[0x400] = '_strncpy'
        source, target = memory.allocate(16), memory.allocate(16)
        for raw, count, expected in ((b'ab\0cdefg', 6, b'ab\0\0\0\0'), (b'abcdefgh', 4, b'abcd'), (b'ab\0cdefg', 0, b'')):
            memory.mem_write(source, raw)
            memory.mem_write(target, b'Z' * 16)
            for register, value in zip(ARGUMENT_REGISTERS, (target, source, count)):
                memory.reg_write(register, value)
            UnifiedBoundaryProbe.on_instruction(memory, memory.cpu, 0x400, 4, None)
            self.assertEqual(memory.mem_read(target, 16), expected + b'Z' * (16 - count))
            self.assertEqual(memory.reg_read(ARGUMENT_REGISTERS[0]), target)
        memory.reg_write(ARGUMENT_REGISTERS[2], 16385)
        with self.assertRaisesRegex(RuntimeError, '有界模型'):
            UnifiedBoundaryProbe.on_instruction(memory, memory.cpu, 0x400, 4, None)


if __name__ == '__main__':
    unittest.main()
