"""使用 Darwin libc 的真实 BSD random 算法，并隔离 guest 与宿主状态。"""
import ctypes


class GuestBSDRandom:
    """仅适用于未并发调用 libc random 的单线程离线探针。"""

    def __init__(self):
        """按 Darwin 默认的 128 字节、初始种子 1 建立独立状态。"""
        self.library = ctypes.CDLL('/usr/lib/libSystem.B.dylib')
        self.library.initstate.argtypes = [ctypes.c_uint, ctypes.c_void_p, ctypes.c_size_t]
        self.library.initstate.restype = ctypes.c_void_p
        self.library.setstate.argtypes = [ctypes.c_void_p]
        self.library.setstate.restype = ctypes.c_void_p
        self.library.srandom.argtypes = [ctypes.c_uint]
        self.library.srandom.restype = None
        self.library.random.argtypes = []
        self.library.random.restype = ctypes.c_long
        self.state = ctypes.create_string_buffer(128)
        self.calls = {'_srandom': 0, '_random': 0}
        previous = self.library.initstate(1, self.state, 128)
        if not previous:
            raise RuntimeError('Darwin initstate 失败')
        if not self.library.setstate(previous):
            raise RuntimeError('Darwin random 宿主状态恢复失败')

    def call(self, name, argument=0):
        """切换到 guest 状态执行真实库函数，结束后恢复宿主状态；不记录随机值。"""
        if name not in self.calls:
            raise RuntimeError('未知 BSD random 调用')
        previous = self.library.setstate(self.state)
        if not previous:
            raise RuntimeError('Darwin guest random 状态切换失败')
        try:
            self.calls[name] += 1
            if name == '_srandom':
                self.library.srandom(argument & 0xffffffff)
                return 0  # srandom 为 void；guest 调用方不读取返回值。
            return self.library.random()
        finally:
            if not self.library.setstate(previous):
                raise RuntimeError('Darwin random 宿主状态恢复失败')
