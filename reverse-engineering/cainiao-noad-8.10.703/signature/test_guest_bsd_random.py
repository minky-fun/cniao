"""验证真实 BSD 随机库的种子宽度、状态隔离和宿主恢复。"""
import ctypes
import unittest
from guest_bsd_random import GuestBSDRandom


class GuestBSDRandomTests(unittest.TestCase):
    """只使用公开测试种子，不加载 IPA 或处理安全资源。"""

    def test_independent_sequences_and_seed_width(self):
        """两个 guest 交错调用不得污染彼此；srandom 输入必须按 unsigned int 截断。"""
        first, second = GuestBSDRandom(), GuestBSDRandom()
        first.call('_srandom', 7)
        expected = [first.call('_random') for _ in range(4)]
        first.call('_srandom', 0x100000007)
        second.call('_srandom', 19)
        actual = []
        for _ in range(4):
            second.call('_random')
            actual.append(first.call('_random'))
        self.assertEqual(actual, expected)
        self.assertEqual(first.calls, {'_srandom': 2, '_random': 8})
        with self.assertRaisesRegex(RuntimeError, '未知'):
            first.call('_arc4random')

    def test_host_sequence_preserved(self):
        """guest 构造、设种子和取数均不得推进当前宿主序列。"""
        adapter = GuestBSDRandom()
        library = adapter.library
        host = ctypes.create_string_buffer(128)
        previous = library.initstate(123, host, 128)
        self.assertTrue(previous)
        try:
            expected = [library.random() for _ in range(3)]
            library.srandom(123)
            other = GuestBSDRandom()
            actual = [library.random()]
            other.call('_srandom', 57)
            other.call('_random')
            actual.append(library.random())
            adapter.call('_random')
            actual.append(library.random())
            self.assertEqual(actual, expected)
        finally:
            library.setstate(previous)


if __name__ == '__main__':
    unittest.main()
