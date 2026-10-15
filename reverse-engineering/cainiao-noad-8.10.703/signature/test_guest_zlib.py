"""以公开压缩字符串验证跨 ABI 流式解压、计数、状态和上限检查。"""
import struct
import unittest
import zlib
from guest_zlib import GuestZlib


class PublicMemory:
    """无需 Unicorn 的有界测试内存，不加载 IPA 或安全资源。"""

    def __init__(self):
        """分配只存放公开测试文字的内存。"""
        self.cpu = self
        self.memory = bytearray(0x10000)
        self.next_address = 0x100

    def allocate(self, size):
        """按测试需要分配互不重叠的小块内存。"""
        address = self.next_address
        self.next_address += max(size, 16)
        if self.next_address > len(self.memory):
            raise ValueError('测试内存上限')
        return address

    def mem_read(self, pointer, size):
        """返回指定测试区域。"""
        return self.memory[pointer:pointer + size]

    def mem_write(self, pointer, raw):
        """写入指定测试区域。"""
        self.memory[pointer:pointer + len(raw)] = raw

    def cstring(self, pointer):
        """读取只包含公开文字的测试字符串。"""
        return bytes(self.memory[pointer:self.memory.index(0, pointer)])

    def write_string(self, text):
        """保存测试版本字符串或 libz 的公开错误文字。"""
        raw = text.encode('ascii') + b'\0'
        address = self.allocate(len(raw))
        self.mem_write(address, raw)
        return address


class GuestZlibTests(unittest.TestCase):
    """用宿主 libz 真实解压，核对 guest 状态能逐步续接且拒绝越界。"""

    def test_streaming_and_limits(self):
        """小输出窗口必须正确续接、更新指针和总量，并完整释放流。"""
        memory = PublicMemory()
        adapter = GuestZlib(memory)
        stream = memory.allocate(112)
        version = memory.write_string('1.2.11')
        self.assertEqual(adapter.call('_inflateInit_', stream, version, 112), 0)
        plain = b'Public fixture for bounded zlib adapter.' * 30
        compressed = zlib.compress(plain)
        source = memory.allocate(len(compressed))
        memory.mem_write(source, compressed)
        target = memory.allocate(17)
        raw = bytearray(memory.mem_read(stream, 112))
        struct.pack_into('<QI', raw, 0, source, len(compressed))
        memory.mem_write(stream, raw)
        restored = bytearray()
        for _ in range(100):
            raw = bytearray(memory.mem_read(stream, 112))
            struct.pack_into('<QI', raw, 24, target, 17)
            memory.mem_write(stream, raw)
            result = adapter.call('_inflate', stream, 0)
            raw = memory.mem_read(stream, 112)
            remaining = struct.unpack_from('<I', raw, 32)[0]
            restored.extend(memory.mem_read(target, 17 - remaining))
            if result == 1:
                break
            self.assertEqual(result, 0)
        else:
            self.fail('未到达 Z_STREAM_END')
        self.assertEqual(restored, plain)
        self.assertEqual(struct.unpack_from('<Q', raw, 16)[0], len(compressed))
        self.assertEqual(struct.unpack_from('<Q', raw, 40)[0], len(plain))
        self.assertEqual(struct.unpack_from('<Q', raw, 0)[0], source + len(compressed))
        raw = bytearray(raw)
        struct.pack_into('<I', raw, 32, 0x1000001)
        memory.mem_write(stream, raw)
        with self.assertRaisesRegex(RuntimeError, '上限'):
            adapter.call('_inflate', stream, 0)
        self.assertEqual(adapter.call('_inflateEnd', stream), 0)
        self.assertFalse(adapter.streams)
        self.assertEqual(struct.unpack_from('<Q', memory.mem_read(stream, 112), 56)[0], 0)

    def test_reject_custom_allocator(self):
        """拒绝未实现的 guest 分配器，避免悄悄改变自定义内存语义。"""
        memory = PublicMemory()
        adapter = GuestZlib(memory)
        stream = memory.allocate(112)
        memory.mem_write(stream + 64, struct.pack('<Q', 123))
        with self.assertRaisesRegex(RuntimeError, '配置'):
            adapter.call('_inflateInit_', stream, memory.write_string('1.2.11'), 112)


if __name__ == '__main__':
    unittest.main()
