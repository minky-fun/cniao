"""验证 LLC 注册探针的桥接与日志副作用模型不会把未初始化状态当成成功。"""
from collections import Counter
import ctypes
import struct
import unittest

from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS
from probe_llc_registration import BRIDGE_SITES, HANDLER_PATH_OBJECT, IMPL1_SELECTOR, LLCInitProbe
from probe_vm import MissingCommand
from test_guest_empty_state import StateMemory


class BridgeMemory(LLCInitProbe, StateMemory):
    """为桥接拦截准备导入表、命令记录与隔离堆；不执行探针构造。"""

    def __init__(self):
        """建立只含公开字符串的寄存器和桥接状态。"""
        StateMemory.__init__(self)
        self.imports = {
            0x1044317d8: '_objc_getClass',
            0x104431f94: '_sel_registerName',
            0x104430380: '_class_getClassMethod',
            0x104431844: '_objc_msgSend',
        }
        self.callback = 0x100000
        self.bridge_sites = {}
        self.bridge_get_class_returns = {site[3]: site[1] for site in BRIDGE_SITES}
        self.bridge_sel_returns = {site[4]: site[1] for site in BRIDGE_SITES}
        self.bridge_method_returns = {site[5]: site[1] for site in BRIDGE_SITES}
        self.observed_commands = []
        self.llc_handler_entered = False
        self.llc_handler_returned = False
        self.omitted_monitor_calls = 0
        # 父类拦截链所需的最小状态；全部为空/关闭，不执行宿主函数。
        self.registration_mode = False
        self.registration_records = []
        self.one_play = None
        self.native_stages = Counter()
        self.linked = {}
        self.linked_execution = None
        self.empty_state = None
        self.sample_sds_bindings = {}
        self.with_sample_appkey = False
        self.with_zlib = False
        self.bsd_random = None
        self.zlib_adapter = None
        self.random_calls = 0
        self.module_routes = {}
        self.native_routes = {(1, 1, 8, 0): HANDLER_PATH_OBJECT}
        self.missing_command = None
        self.host_targets = {}
        self.host_calls = []
        self.route_frames = []
        self.capture_dispatcher = False
        self.records = []
        self.loader_environment_queries = []
        self.extra_imports = Counter()
        self.host_libc = ctypes.CDLL(None)
        self.runtime_objects = set()
        self.one_class = None
        self.one_selector = None
        self.runtime_calls = Counter()
        self.used = Counter()
        self.tls = {}
        self.resolved_system_names = []
        self.clock_calls = Counter()
        self.appkey = None
        self.input_bytes = None
        self.candidate = None
        self.signing_engine = None
        self.allocations = {}
        self.allocation_origins = {}

        class NoClock:
            def handle(self, probe, address):
                """本单元测试不执行时钟路径。"""
                return False

        self.clock = NoClock()


class LLCBridgeTests(unittest.TestCase):
    """只使用公开合成字符串与寄存器，不装载 IPA。"""

    def create_probe(self):
        """建立每项测试独立的桥接内存。"""
        probe = BridgeMemory()
        for name, class_addr, implementation, _, _, _ in BRIDGE_SITES:
            probe.bridge_sites[class_addr] = {'name': name, 'implementation': implementation}
        return probe

    def test_path_object_handler_is_not_omitted(self):
        """(1,1,8,0) 必须进入真实处理函数，不能伪造空对象。"""
        probe = self.create_probe()
        probe.reg_write(ARGUMENT_REGISTERS[0], 1)
        probe.reg_write(ARGUMENT_REGISTERS[1], 1)
        probe.reg_write(ARGUMENT_REGISTERS[2], 8)
        probe.reg_write(ARGUMENT_REGISTERS[3], 0)
        probe.reg_write(UC_ARM64_REG_X30, 0x800)
        LLCInitProbe.on_instruction(probe, probe.cpu, probe.callback + 8, 4, None)
        self.assertEqual(probe.observed_commands, [[1, 1, 8, 0]])
        self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), HANDLER_PATH_OBJECT)

    def test_other_command_rejected(self):
        """未知命令仍必须交给父类边界，不得被日志分支吞掉。"""
        probe = self.create_probe()
        probe.reg_write(UC_ARM64_REG_X30, 0x800)
        with self.assertRaises(MissingCommand):
            LLCInitProbe.on_instruction(probe, probe.cpu, probe.callback + 8, 4, None)
        self.assertEqual(probe.missing_command, [0, 0, 0, 0])

    def test_bridge_get_class(self):
        """objc_getClass 只在已核对调用点按类名返回类地址。"""
        probe = self.create_probe()
        for site in BRIDGE_SITES:
            class_addr = site[1]
            probe.reg_write(ARGUMENT_REGISTERS[0], probe.write_string(site[0].decode('ascii')))
            probe.reg_write(UC_ARM64_REG_X30, site[3])
            LLCInitProbe.on_instruction(probe, probe.cpu, 0x1044317d8, 4, None)
            self.assertEqual(probe.reg_read(ARGUMENT_REGISTERS[0]), class_addr)
            self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), site[3])

    def test_bridge_get_class_wrong_name_rejected(self):
        """未核对类名必须拒绝，不能返回任意类。"""
        probe = self.create_probe()
        probe.reg_write(ARGUMENT_REGISTERS[0], probe.write_string('NotABridgeClass'))
        probe.reg_write(UC_ARM64_REG_X30, BRIDGE_SITES[0][3])
        with self.assertRaisesRegex(RuntimeError, '类名'):
            LLCInitProbe.on_instruction(probe, probe.cpu, 0x1044317d8, 4, None)

    def test_bridge_selector(self):
        """sel_registerName 只在已核对调用点返回固定选择子。"""
        probe = self.create_probe()
        for site in BRIDGE_SITES:
            probe.reg_write(ARGUMENT_REGISTERS[0], probe.write_string('ksdjk23dskm:'))
            probe.reg_write(UC_ARM64_REG_X30, site[4])
            LLCInitProbe.on_instruction(probe, probe.cpu, 0x104431f94, 4, None)
            self.assertEqual(probe.reg_read(ARGUMENT_REGISTERS[0]), IMPL1_SELECTOR)
            self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), site[4])

    def test_bridge_class_method(self):
        """class_getClassMethod 返回非零方法对象供存在性检查。"""
        probe = self.create_probe()
        for site in BRIDGE_SITES:
            class_addr = site[1]
            probe.reg_write(ARGUMENT_REGISTERS[0], class_addr)
            probe.reg_write(ARGUMENT_REGISTERS[1], IMPL1_SELECTOR)
            probe.reg_write(UC_ARM64_REG_X30, site[5])
            LLCInitProbe.on_instruction(probe, probe.cpu, 0x104430380, 4, None)
            self.assertNotEqual(probe.reg_read(ARGUMENT_REGISTERS[0]), 0)
            self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), site[5])

    def test_bridge_msg_send_jumps_to_implementation(self):
        """objc_msgSend 必须跳转到对应类的真实实现，保留返回地址。"""
        probe = self.create_probe()
        for name, class_addr, implementation, _, _, _ in BRIDGE_SITES:
            probe.reg_write(ARGUMENT_REGISTERS[0], class_addr)
            probe.reg_write(ARGUMENT_REGISTERS[1], IMPL1_SELECTOR)
            probe.reg_write(UC_ARM64_REG_X30, 0x800)
            LLCInitProbe.on_instruction(probe, probe.cpu, 0x104431844, 4, None)
            self.assertEqual(probe.reg_read(UC_ARM64_REG_PC), implementation)
            self.assertEqual(probe.reg_read(UC_ARM64_REG_X30), 0x800)


if __name__ == '__main__':
    unittest.main()
