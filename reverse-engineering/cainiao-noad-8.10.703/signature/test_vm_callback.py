"""验证实际 SDS 调用允许的空错误指针不会被探针解引用。"""
import struct
import unittest
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS
from probe_vm import ModuleProbe
from test_guest_empty_state import StateMemory


class ModuleCallbackTests(unittest.TestCase):
    """区分错误槽缺失与真实非零业务状态，保留原生返回指针。"""

    def test_nullable_error_pointer(self):
        """有无错误槽都必须恢复原调用地址；缺失状态用 None 表达而不是伪造 0。"""
        for error_pointer, expected in ((0, None), (0x900, 99)):
            with self.subTest(error_pointer=error_pointer):
                memory = StateMemory()
                probe = ModuleProbe.__new__(ModuleProbe)
                probe.cpu, probe.callback = memory, memory.callback
                probe.route_frames = [{'module': 'lvm_sds', 'export_index': 21, 'output': 0x800, 'error_pointer': error_pointer, 'return_address': 0x700}]
                probe.completed_module_calls = []
                memory.mem_write(0x800, struct.pack('<Q', 0xa00))
                if error_pointer:
                    memory.mem_write(error_pointer, struct.pack('<I', 99))
                probe.on_instruction(memory, probe.callback + 0x200, 4, None)
                self.assertEqual(probe.route_frames, [])
                self.assertEqual(probe.completed_module_calls, [{'module': 'lvm_sds', 'export_index': 21, 'vm_status': 0, 'business_error': expected, 'output_present': True}])
                self.assertEqual(memory.reg_read(ARGUMENT_REGISTERS[0]), 0xa00)
                self.assertEqual(memory.reg_read(UC_ARM64_REG_PC), 0x700)
                self.assertEqual(memory.reg_read(UC_ARM64_REG_X30), 0x700)


if __name__ == '__main__':
    unittest.main()
