"""将观察到的 %03u 格式与宿主 C snprintf 做有界交叉验证。"""
from collections import Counter
import ctypes
import struct
import unittest
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_SP, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS
from probe_vm import ModuleProbe
from test_guest_empty_state import StateMemory


class NativePrintfTests(unittest.TestCase):
    """覆盖 unsigned int、前导零、截断、NUL 和返回值。"""

    def test_unsigned_minimum_width(self):
        """以真实 libc 为参照，核对 Apple arm64 栈变参读取及 snprintf 语义。"""
        library = ctypes.CDLL('/usr/lib/libSystem.B.dylib')
        library.snprintf.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_char_p]
        library.snprintf.restype = ctypes.c_int
        for value in (0, 7, 999, 1000, 0xffffffff):
            for capacity in (0, 1, 3, 4, 12):
                with self.subTest(value=value, capacity=capacity):
                    memory = StateMemory()
                    probe = ModuleProbe.__new__(ModuleProbe)
                    probe.cpu, probe.callback = memory, memory.callback
                    probe.imports, probe.host_targets = {0x400: '_snprintf'}, {}
                    probe.used = Counter()
                    memory.reg_write(UC_ARM64_REG_SP, 0x800)
                    memory.mem_write(0x800, struct.pack('<Q', value))
                    memory.mem_write(0x900, b'!' * 12)
                    for register, argument in zip(ARGUMENT_REGISTERS, (0x900, capacity, memory.write_string('%03u'))):
                        memory.reg_write(register, argument)
                    memory.reg_write(UC_ARM64_REG_X30, 0x700)
                    expected = ctypes.create_string_buffer(b'!' * 12)
                    count = library.snprintf(expected, capacity, b'%03u', ctypes.c_uint(value))
                    probe.on_instruction(memory, 0x400, 4, None)
                    self.assertEqual(memory.mem_read(0x900, 12), expected.raw[:12])
                    self.assertEqual(memory.reg_read(ARGUMENT_REGISTERS[0]), count)
                    self.assertEqual(memory.reg_read(UC_ARM64_REG_PC), 0x700)


if __name__ == '__main__':
    unittest.main()
