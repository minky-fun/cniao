"""验证独立 TS VM 没有旧 opcode_trace 字段时，宿主异常仍可脱敏报告。"""
from collections import Counter
import json
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from verify_portable_vm_host import HostReplacement, frame_probe


class HostDiagnosticsTests(unittest.TestCase):
    """覆盖本轮联合验证实际触发的异常路径，不创建或读取 VM 私密数据。"""

    def test_runtime_without_legacy_opcode_trace(self):
        """父类失败时保留公共计数，避免额外 AttributeError 掩盖真正中断。"""
        for pc in (0x102ad4370, 0x210001000):
            probe = HostReplacement.__new__(HostReplacement)
            probe.host_counts = Counter(simple_abi=3)
            probe.host_frames = []
            probe.cpu = SimpleNamespace(reg_read=lambda _register: pc)
            with self.subTest(image=pc < 0x200000000), patch.object(frame_probe.FrameReplacement, 'run', side_effect=RuntimeError('synthetic private detail')):
                with self.assertRaises(RuntimeError) as caught:
                    probe.run(0, ())
                message = str(caught.exception)
                self.assertNotIn('synthetic private detail', message)
                result = json.loads(message.split('：', 1)[1])
                self.assertEqual(result['counts'], {'simple_abi': 3})
                self.assertEqual(result['pending_frames'], 0)
                self.assertEqual(result['code'], hex(pc) if pc < 0x200000000 else 'outside-image')


if __name__ == '__main__':
    unittest.main()
