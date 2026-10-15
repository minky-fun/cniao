"""有界的 Darwin arm64 z_stream 适配器；使用宿主 libz，不输出任何资源内容。"""
import ctypes as c
import struct


class ZStream(c.Structure):
    """按 iPhoneOS 编译断言验证的 LP64 z_stream 声明字段。"""
    _fields_ = [('next_in', c.c_void_p), ('avail_in', c.c_uint), ('total_in', c.c_ulong),
                ('next_out', c.c_void_p), ('avail_out', c.c_uint), ('total_out', c.c_ulong),
                ('msg', c.c_void_p), ('state', c.c_void_p), ('zalloc', c.c_void_p),
                ('zfree', c.c_void_p), ('opaque', c.c_void_p), ('data_type', c.c_int),
                ('adler', c.c_ulong), ('reserved', c.c_ulong)]


class GuestZlib:
    """仅支持零自定义分配器、单一有界流和 inflate 三个真实库调用。"""

    def __init__(self, probe):
        """载入系统 libz，并拒绝与已验证 guest ABI 不同的宿主布局。"""
        self.probe = probe
        self.streams = {}
        self.events = []
        self.lib = c.CDLL('/usr/lib/libz.dylib')
        if c.sizeof(ZStream) != 112 or [getattr(ZStream, name).offset for name, _ in ZStream._fields_] != [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104]:
            raise RuntimeError('宿主 z_stream ABI 不符')
        self.lib.inflateInit_.argtypes = [c.POINTER(ZStream), c.c_char_p, c.c_int]
        self.lib.inflate.argtypes = [c.POINTER(ZStream), c.c_int]
        self.lib.inflateEnd.argtypes = [c.POINTER(ZStream)]
        for name in ('inflateInit_', 'inflate', 'inflateEnd'):
            getattr(self.lib, name).restype = c.c_int

    def call(self, name, pointer, second=0, third=0):
        """复制有界输入输出及公开计数；host 状态指针永不写入 guest 或证据。"""
        raw = bytearray(self.probe.cpu.mem_read(pointer, 112))
        if name == '_inflateInit_':
            if self.streams or third != 112 or struct.unpack_from('<QQQ', raw, 64) != (0, 0, 0):
                raise RuntimeError('不支持的 zlib 初始化配置')
            version = self.probe.cstring(second)
            if version != b'1.2.11':
                raise RuntimeError('样本 zlib 版本参数不符')
            stream = ZStream()
            result = self.lib.inflateInit_(c.byref(stream), version, third)
            if result != 0:
                raise RuntimeError('宿主 libz 初始化失败')
            token = self.probe.allocate(8)
            self.streams[pointer] = (stream, token)
            struct.pack_into('<Q', raw, 56, token)
        else:
            if pointer not in self.streams:
                raise RuntimeError('未知的 zlib 流')
            stream, token = self.streams[pointer]
            if (struct.unpack_from('<Q', raw, 16)[0], struct.unpack_from('<Q', raw, 40)[0]) != (stream.total_in, stream.total_out):
                raise RuntimeError('guest zlib 计数被修改')
            if struct.unpack_from('<Q', raw, 56)[0] != token:
                raise RuntimeError('guest zlib 状态被替换')
            if name == '_inflate':
                source, available = struct.unpack_from('<QI', raw, 0)
                target, capacity = struct.unpack_from('<QI', raw, 24)
                if available > 0x1000000 or capacity > 0x1000000 or stream.total_out + capacity > 0x1000000:
                    raise RuntimeError('zlib 输入输出超过离线探针上限')
                input_buffer = c.create_string_buffer(bytes(self.probe.cpu.mem_read(source, available)) if available else b'')
                output_buffer = c.create_string_buffer(max(1, capacity))
                stream.next_in, stream.avail_in = c.addressof(input_buffer), available
                stream.next_out, stream.avail_out = c.addressof(output_buffer), capacity
                result = self.lib.inflate(c.byref(stream), second)
                consumed, produced = available - stream.avail_in, capacity - stream.avail_out
                if produced:
                    self.probe.cpu.mem_write(target, output_buffer.raw[:produced])
                struct.pack_into('<QI', raw, 0, source + consumed, stream.avail_in)
                struct.pack_into('<QI', raw, 24, target + produced, stream.avail_out)
                # 数据已复制回 guest；立即清空局部 host 指针，下一次调用重新绑定。
                stream.next_in = stream.next_out = None
            elif name == '_inflateEnd':
                result = self.lib.inflateEnd(c.byref(stream))
                del self.streams[pointer]
                struct.pack_into('<Q', raw, 56, 0)
            else:
                raise RuntimeError('不支持的 zlib 操作')
        struct.pack_into('<Q', raw, 16, stream.total_in)
        struct.pack_into('<Q', raw, 40, stream.total_out)
        struct.pack_into('<Q', raw, 48, self.probe.write_string(c.string_at(stream.msg).decode('ascii')) if stream.msg else 0)
        struct.pack_into('<i', raw, 88, stream.data_type)
        struct.pack_into('<QQ', raw, 96, stream.adler, stream.reserved)
        self.probe.cpu.mem_write(pointer, bytes(raw))
        self.events.append({'operation': name, 'return_code': result, 'total_in': stream.total_in, 'total_out': stream.total_out})
        return result & 0xffffffff
