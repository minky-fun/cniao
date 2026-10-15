"""解析样本中的双 zlib 模块容器，不导出模块常量或执行签名。"""
import json
import struct
import zlib

MAX_MODULE_BYTES = 1024 * 1024


def inflate_exact(data):
    """只接受完整单流并限制输出大小，拒绝截断、尾随数据和解压炸弹。"""
    stream = zlib.decompressobj()
    try:
        result = stream.decompress(data, MAX_MODULE_BYTES + 1)
    except zlib.error as error:
        raise ValueError('模块 zlib 数据损坏') from error
    if len(result) > MAX_MODULE_BYTES or stream.unconsumed_tail:
        raise ValueError('模块解压数据超出限制')
    if not stream.eof or stream.unused_data:
        raise ValueError('模块流截断或存在尾随数据')
    return result


def parse_container(data):
    """按原生容器长度拆分代码与元数据流，并校验元数据的命令绑定。"""
    if len(data) < 4 or len(data) > MAX_MODULE_BYTES:
        raise ValueError('模块容器长度无效')
    code_size = struct.unpack_from('<I', data)[0]
    boundary = 4 + code_size
    if not code_size or boundary >= len(data):
        raise ValueError('模块代码流边界无效')
    code = inflate_exact(data[4:boundary])
    try:
        metadata = json.loads(inflate_exact(data[boundary:]))
        bindings = json.loads(metadata['metainfo'])
        bizid = metadata['basic']['bizid']
    except (ValueError, KeyError, TypeError, UnicodeDecodeError) as error:
        raise ValueError('模块元数据无效') from error
    if not isinstance(bizid, str) or not isinstance(bindings, list) or not bindings:
        raise ValueError('模块标识或绑定列表无效')
    for binding in bindings:
        if not isinstance(binding, dict) or any(type(binding.get(key)) is not int for key in ('index', 'destIndex')):
            raise ValueError('模块命令绑定无效')
    if len(code) < 112:
        raise ValueError('模块字节码头截断')
    magic, _, total = struct.unpack_from('<III', code)
    if magic != 0xb225081a or total != len(code):
        raise ValueError('模块字节码头无效')
    return code, metadata, bindings
