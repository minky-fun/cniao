"""使用公开合成容器验证模块流边界和损坏输入，不包含业务安全数据。"""
import json
import struct
import unittest
import zlib

from module_container import MAX_MODULE_BYTES, inflate_exact, parse_container


def sample_container(metadata=None):
    """构造只含头部和公开合成绑定的最小测试容器。"""
    code = struct.pack('<III', 0xb225081a, 0x40000, 112) + bytes(100)
    if metadata is None:
        metadata = {'basic': {'bizid': 'synthetic'}, 'metainfo': '[{"index":3,"destIndex":66010401}]'}
    stream = zlib.compress(code)
    return struct.pack('<I', len(stream)) + stream + zlib.compress(json.dumps(metadata).encode())


class ModuleContainerTests(unittest.TestCase):
    """确保提取器不会把相邻压缩流、损坏元数据或超限数据当成代码。"""

    def test_exact_split(self):
        """核对两个压缩流分别返回字节码和绑定，不吞掉尾部元数据。"""
        code, metadata, bindings = parse_container(sample_container())
        self.assertEqual(len(code), 112)
        self.assertEqual(metadata['basic']['bizid'], 'synthetic')
        self.assertEqual(bindings, [{'index': 3, 'destIndex': 66010401}])

    def test_truncation_and_tail(self):
        """拒绝截断流和后接第二流或任意尾随数据。"""
        stream = zlib.compress(b'public')
        for data in (stream[:-1], stream + b'garbage', stream + stream):
            with self.subTest(length=len(data)), self.assertRaises(ValueError):
                inflate_exact(data)

    def test_size_limit(self):
        """拒绝超过解压上限的有效压缩数据。"""
        with self.assertRaises(ValueError):
            inflate_exact(zlib.compress(bytes(MAX_MODULE_BYTES + 1)))

    def test_bad_code_boundaries(self):
        """拒绝长度前缀越界、零长度和不足四字节的容器。"""
        sample = sample_container()
        for data in (b'abc', bytes(4) + sample[4:], struct.pack('<I', len(sample)) + sample[4:]):
            with self.subTest(length=len(data)), self.assertRaises(ValueError):
                parse_container(data)

    def test_invalid_metadata(self):
        """拒绝缺少命令字段、布尔索引及错误的绑定类型。"""
        for metainfo in ('{}', '[]', '[{"index":true,"destIndex":1}]', '[{"index":1}]'):
            metadata = {'basic': {'bizid': 'synthetic'}, 'metainfo': metainfo}
            with self.subTest(metainfo=metainfo), self.assertRaises(ValueError):
                parse_container(sample_container(metadata))

    def test_invalid_header(self):
        """拒绝解压成功但魔数或声明长度错误的字节码。"""
        original = sample_container()
        size = struct.unpack_from('<I', original)[0]
        for offset in (0, 8):
            code = bytearray(inflate_exact(original[4:4 + size]))
            code[offset] ^= 1
            stream = zlib.compress(code)
            data = struct.pack('<I', len(stream)) + stream + original[4 + size:]
            with self.subTest(offset=offset), self.assertRaises(ValueError):
                parse_container(data)


if __name__ == '__main__':
    unittest.main()
