"""逐项对照缓冲对象的原生语义，再联合替换完整 TS VM 路径；不导出运行数据。"""
import argparse
import base64
from collections import Counter
import json
from pathlib import Path
import select
import struct
import subprocess
from unittest.mock import patch

from unicorn import UcError
from unicorn.arm64_const import UC_ARM64_REG_PC, UC_ARM64_REG_SP, UC_ARM64_REG_X30
from probe_native import ARGUMENT_REGISTERS, read_binary
from probe_vm import ModuleProbe
import verify_portable_vm_runtime as runtime_probe

ENTRIES = dict(append=0x102abf138, grow=0x102abf1b8, get=0x102abf260,
               find=0x102abf294, clear=0x102abf2d8, cstring=0x102abf318,
               clone=0x102abf384, byte=0x102abf3d8, set=0x102abf434,
               appendBuffer=0x102abf454, create=0x102abf544,
               fromCString=0x102abf64c, fromBytes=0x102abf6ac, destroy=0x102abf70c,
               stringAppend=0x102a7249c, stringCString=0x102a72570, stringByte=0x102a725b0,
               stringCreate=0x102a725dc, stringClear=0x102a726cc, stringDestroy=0x102a7270c)
IMPORTS = {0x1044313a0: '_malloc', 0x104430920: '_free', 0x1044302b4: '_bzero',
           0x104431448: '_memcpy', 0x104431e80: '_realloc', 0x10443218c: '_strlen'}
MASK64 = (1 << 64) - 1


class BufferWorker:
    """对 TS 仅暴露明确堆适配器与有界 guest 访存，协议只通过内存管道传递。"""

    def __init__(self, compiled, node, standard=None):
        """加载明确本地模块，不继承可打印私密参数的 stderr。"""
        self.process = subprocess.Popen([node, str(Path(__file__).with_name('buffer_worker.cjs')),
                                         str(Path(compiled).resolve(strict=True)),
                                         *([str(Path(standard).resolve(strict=True))] if standard else [])],
                                        stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def send(self, message):
        """向子进程发送一条协议消息，不写入日志或临时文件。"""
        self.process.stdin.write(json.dumps(message) + '\n')
        self.process.stdin.flush()

    def calculate(self, probe, entry, arguments):
        """执行有界内存和堆请求；分配失败、未知指针及越界均不替换成成功。"""
        self.send({'entry': str(entry), 'arguments': [str(value) for value in arguments], 'stack': str(probe.cpu.reg_read(UC_ARM64_REG_SP))})
        for _ in range(65538):
            if not select.select([self.process.stdout], [], [], 15)[0]:
                raise RuntimeError('TS 缓冲区计算超时')
            response = json.loads(self.process.stdout.readline(16384))
            event = response.get('event')
            if event in ('read', 'write'):
                address = int(response['address'])
                if event == 'read':
                    width = response['width']
                    if type(width) is not int or not 1 <= width <= 4096:
                        raise RuntimeError('TS 缓冲区读取宽度无效')
                else:
                    raw = base64.b64decode(response['bytes'], validate=True)
                    width = len(raw)
                    if not 1 <= width <= 4096:
                        raise RuntimeError('TS 缓冲区写入宽度无效')
                permission = 1 if event == 'read' else 2
                if not 0 <= address <= MASK64 - width + 1 or not any(start <= address and address + width - 1 <= end and permissions & permission for start, end, permissions in probe.cpu.mem_regions()):
                    raise RuntimeError('TS 缓冲区访问超出明确映射')
                if event == 'read':
                    reply = {'bytes': base64.b64encode(bytes(probe.cpu.mem_read(address, width))).decode('ascii')}
                else:
                    probe.cpu.mem_write(address, raw)
                    reply = {}
            elif event in ('allocate', 'reallocate'):
                count = response['size']
                if type(count) is not int or not 0 <= count <= 0x1000000:
                    raise RuntimeError('TS 缓冲区分配长度无效')
                if event == 'allocate':
                    pointer = probe.allocate(count)
                else:
                    previous = int(response['address'])
                    if previous and previous not in probe.allocations:
                        raise RuntimeError('TS realloc 来源不是明确分配')
                    pointer = probe.allocate(count)
                    if pointer and previous and count:
                        probe.cpu.mem_write(pointer, bytes(probe.cpu.mem_read(previous, min(count, probe.allocations[previous]))))
                reply = {'pointer': str(pointer)}
            elif event == 'free':
                address = int(response['address'])
                if address and address not in probe.allocations:
                    raise RuntimeError('TS free 来源不是明确分配')
                # The existing native validation adapter's _free returns zero without reusing blocks.
                if isinstance(probe, BufferOracle):
                    probe.frees.append(address)
                reply = {'integer': '0'}
            elif event == 'result':
                integer = int(response['integer'])
                if not 0 <= integer <= MASK64:
                    raise RuntimeError('TS 缓冲区返回值超出 uint64')
                return integer
            else:
                raise RuntimeError('TS 缓冲区操作未完成')
            self.send(dict(accepted=True, **reply))
        raise RuntimeError('TS 缓冲区交互次数超限')

    def close(self):
        """有界关闭私有管道和进程，避免遗留待处理数据。"""
        self.process.stdin.close()
        try:
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait()
        self.process.stdout.close()


class BufferOracle(ModuleProbe):
    """使用真实原生对象方法及可注入失败、填充非零字节的独立测试堆。"""

    def __init__(self, data):
        """建立固定样本和已核实的六项 C 导入适配器。"""
        self.allocations = {}
        self.frees = []
        self.attempts = 0
        self.fail_at = None
        super().__init__(data, IMPORTS, {})

    def allocate(self, size):
        """注入指定次序的 malloc/realloc 失败，成功区域先填充公开非零模式。"""
        self.attempts += 1
        if self.attempts == self.fail_at:
            return 0
        pointer = super().allocate(size)
        self.allocations[pointer] = size
        if size:
            self.cpu.mem_write(pointer, b'\xa5' * size)
        return pointer

    def on_instruction(self, cpu, address, size, context):
        """仅替换原生依赖的 realloc/free；全部缓冲对象方法实际执行 ARM64。"""
        name = self.imports.get(address)
        if name not in ('_realloc', '_free'):
            return super().on_instruction(cpu, address, size, context)
        previous, count = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS[:2]]
        if previous and previous not in self.allocations:
            raise RuntimeError('原生堆方法接收到未知指针')
        if name == '_free':
            self.frees.append(previous)
            result = 0
        else:
            result = self.allocate(count)
            if result and previous and count:
                cpu.mem_write(result, bytes(cpu.mem_read(previous, min(count, self.allocations[previous]))))
        cpu.reg_write(ARGUMENT_REGISTERS[0], result)
        cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))


def verify_vectors(data, worker):
    """比较公开向量的返回位、全部堆字节、分配顺序和释放顺序，涵盖失败分支。"""
    native, portable = BufferOracle(data), BufferOracle(data)
    cases = Counter()
    method_order = ('append', 'byte', 'grow', 'get', 'find', 'clear', 'cstring', 'clone', 'set', 'appendBuffer')

    def prepare(probe, length, capacity, empty=False):
        """构造公开缓冲对象和两个来源块；方法表使用反汇编确认的地址。"""
        header, data, source, error, other = [probe.allocate(count) for count in (104, capacity, 512, 4, 104)]
        raw = struct.pack('<QII', 0 if empty else data, length, capacity)
        raw += struct.pack('<11Q', *[ENTRIES[name] for name in method_order], 0x102abf47c)
        probe.cpu.mem_write(header, raw)
        probe.cpu.mem_write(data, bytes(index % 251 + 1 for index in range(capacity)))
        probe.cpu.mem_write(source, bytes(index % 251 + 1 for index in range(511)) + b'\0')
        probe.cpu.mem_write(other, struct.pack('<QII', source, 5, 512) + bytes(88))
        return header, source, error, other

    def check(name, values, length=3, capacity=8, empty=False, failure=None):
        """独立重置两边堆后运行一项明确输入，不在失败时打印对象内容。"""
        pointers = []
        for probe in (native, portable):
            probe.next_address = 0x210000000
            probe.allocations.clear()
            probe.frees.clear()
            probe.attempts = 0
            probe.fail_at = None
            pointers.append(prepare(probe, length, capacity, empty))
            probe.fail_at = probe.attempts + failure if failure else None
        # Symbolic indices refer only to explicitly created synthetic allocations.
        arguments = [tuple(pointers[index][{'object': 0, 'source': 1, 'error': 2, 'other': 3}[value]] if isinstance(value, str) else value for value in values) for index in range(2)]
        expected = native.run(ENTRIES[name], arguments[0])
        actual = worker.calculate(portable, ENTRIES[name], arguments[1])
        if expected != actual or native.allocations != portable.allocations or native.attempts != portable.attempts or native.frees != portable.frees:
            raise RuntimeError('缓冲对象 ABI 或堆操作不符，公开用例 ' + str(sum(cases.values())))
        for pointer, count in native.allocations.items():
            if bytes(native.cpu.mem_read(pointer, count)) != bytes(portable.cpu.mem_read(pointer, count)):
                raise RuntimeError('缓冲对象内存不符，公开用例 ' + str(sum(cases.values())))
        cases[name] += 1

    for capacity in (0, 1, 2, 100, 257, 0x80000000, 0xffffffff, 0x100000001):
        check('create', (capacity,))
    for failure in (1, 2):
        check('create', (8,), failure=failure)
    for name in ('clear', 'cstring', 'clone', 'fromCString', 'destroy'):
        check(name, (0,))
        check(name, ('object' if name != 'fromCString' else 'source',))
    for name in ('cstring', 'clone', 'fromCString'):
        for failure in (1, 2) if name != 'cstring' else (1,):
            check(name, ('source' if name == 'fromCString' else 'object',), failure=failure)
    check('clear', ('object',), empty=True)
    check('destroy', ('object',), empty=True)
    for extra in (0, 1, 100, 101, 0xffffffff):
        for empty in (False, True):
            check('grow', ('object', extra), empty=empty)
            check('grow', ('object', extra), empty=empty, failure=1)
    check('grow', (0, 1))
    for count in (0, 1, 4, 5, 8, 128, 0xffffffff):
        check('append', ('object', 'source', count))
        check('fromBytes', ('source', count))
    for name, values in (('append', (0, 'source', 5)), ('append', ('object', 0, 5)),
                         ('fromBytes', (0, 5)), ('append', ('object', 'source', 8)),
                         ('fromBytes', ('source', 5)), ('byte', ('object', 511))):
        check(name, values, length=7, failure=1)
    for length in (0, 3, 7, 8):
        for value in (0, 255, 256, MASK64):
            check('byte', ('object', value), length=length)
    check('byte', (0, 1))
    for name in ('get', 'set', 'find'):
        for obj in (0, 'object'):
            for index in (0, 1, 2, 3, 0x80000000, MASK64):
                for value in ('error', 0) if name == 'get' else (1, 2, 255, 256, MASK64):
                    check(name, (obj, index, value))
    for obj, source in ((0, 'other'), ('object', 0), ('object', 'other'), ('object', 'object')):
        check('appendBuffer', (obj, source))
    check('appendBuffer', ('object', 'other'), failure=1)
    check('fromBytes', ('source', 5), failure=2)
    for failure in (None, 1, 2):
        check('stringCreate', (), failure=failure)
    for name in ('stringClear', 'stringDestroy'):
        for obj in (0, 'object'):
            for empty in (False, True):
                check(name, (obj,), empty=empty)
    for length in (0, 3, 7, 8, 127, 128, 255):
        for count in (0, 1, 5, 128, 511, 512, 0xffffffff):
            for obj, source in (('object', 'source'), (0, 'source'), ('object', 0)):
                check('stringAppend', (obj, source, count), length=length, capacity=256)
        check('stringCString', ('object', 'source'), length=length, capacity=256)
        for byte in (0, 1, 255, 256, MASK64):
            check('stringByte', ('object', byte), length=length, capacity=256)
    check('stringAppend', ('object', 'source', 5), empty=True)
    check('stringCString', ('object', 0))
    check('stringCString', (0, 'source'))
    check('stringByte', (0, 1))
    # Native string append does not check realloc's NULL before bzero; both paths must fail.
    failed_pointers = []
    for probe in (native, portable):
        probe.next_address = 0x210000000
        probe.allocations.clear()
        probe.frees.clear()
        probe.attempts = 0
        probe.fail_at = None
        failed_pointers.append(prepare(probe, 7, 8))
        probe.fail_at = probe.attempts + 1
    for probe, pointers, execute in ((native, failed_pointers[0], True), (portable, failed_pointers[1], False)):
        arguments = (pointers[0], pointers[1], 5)
        try:
            if execute:
                probe.run(ENTRIES['stringAppend'], arguments)
            else:
                worker.calculate(probe, ENTRIES['stringAppend'], arguments)
        except (UcError, RuntimeError):
            pass
        else:
            raise RuntimeError('字符串 realloc 失败被错误报告为成功')
        if struct.unpack('<QII', probe.cpu.mem_read(pointers[0], 16)) != (0, 7, 8):
            raise RuntimeError('字符串 realloc 失败时的原生对象状态不符')
    if native.allocations != portable.allocations or native.attempts != portable.attempts:
        raise RuntimeError('字符串 realloc 失败时的堆状态不符')
    cases['stringAppendReallocFailure'] += 1
    return dict(cases)


class BufferReplacement(runtime_probe.RuntimeReplacement):
    """在完整 TS VM 对照中跳过真实缓冲函数体，保留其精确内存布局和返回 ABI。"""

    buffer_worker = None
    completed_buffers = []

    def __init__(self, *args, **kwargs):
        """只保留脱敏函数次数，不记录来源数据或对象内容。"""
        super().__init__(*args, **kwargs)
        self.buffer_counts = Counter()

    def on_instruction(self, cpu, address, size, context):
        """缓冲入口全部转交 TS；任何被替换函数体的原生执行立即失败。"""
        if address in ENTRIES.values():
            self.buffer_counts[next(name for name, target in ENTRIES.items() if target == address)] += 1
            values = [cpu.reg_read(register) for register in ARGUMENT_REGISTERS]
            result = self.buffer_worker.calculate(self, address, values)
            cpu.reg_write(ARGUMENT_REGISTERS[0], result)
            cpu.reg_write(UC_ARM64_REG_PC, cpu.reg_read(UC_ARM64_REG_X30))
            return
        if 0x102abf138 <= address < 0x102abf47c or 0x102abf544 <= address < 0x102abf740 or 0x102a7249c <= address < 0x102a72688 or 0x102a726cc <= address < 0x102a72740:
            raise RuntimeError('缓冲替换模式意外执行原生函数体')
        return super().on_instruction(cpu, address, size, context)

    def run(self, entry, arguments=(), stop=None):
        """完整候选完成后仅保存方法次数，供原生/TS 四轮对照报告使用。"""
        result = super().run(entry, arguments, stop)
        if entry == 0x102a518ec and len(arguments) == 5 and arguments[1] == 3 and result == 0:
            self.completed_buffers.append(dict(self.buffer_counts))
        return result


def compare(args):
    """先完成边界对照，再在独立 TS VM 中同时替换对象方法和 AES 构造器依赖。"""
    worker = BufferWorker(args.portable_buffer, args.node)
    BufferReplacement.completed_buffers = []
    try:
        vectors = verify_vectors(read_binary(args.sample), worker)
        with patch.object(BufferReplacement, 'buffer_worker', worker), patch.object(runtime_probe, 'RuntimeReplacement', BufferReplacement):
            result = runtime_probe.compare(args)
        if len(BufferReplacement.completed_buffers) != 2:
            raise RuntimeError('缓冲对象完整替换次数错误')
        for report, counts in zip((item for item in result['runs'] if item['mode'] != 'native'), BufferReplacement.completed_buffers):
            if not all(counts.get(name, 0) for name in ('create', 'append', 'byte', 'clone', 'appendBuffer', 'destroy', 'stringCreate', 'stringAppend', 'stringCString')):
                raise RuntimeError('缓冲对象真实路径覆盖不足')
            report.update(mode='TS-runtime-and-buffers', buffer_calls=counts, native_replaced_buffer_body_entries=0)
        result.update(scope='independent TS VM plus verified native buffer helpers; actual remaining host computations, initialization, expansion and SDS still retained', native_buffer_vector_cases=vectors, native_replaced_buffer_body_entries_in_ts_runs=0)
        return result
    finally:
        worker.close()
        BufferReplacement.completed_buffers.clear()


def main():
    """仅接受固定样本和明确本地模块，输出不含候选或内存的统计证据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sample')
    for name in ('buffer', 'runtime', 'call', 'abi', 'host', 'aes'):
        parser.add_argument('--portable-' + name, required=True)
    parser.add_argument('--node', default='node')
    parser.add_argument('--vectors-only', action='store_true')
    args = parser.parse_args()
    if args.vectors_only:
        worker = BufferWorker(args.portable_buffer, args.node)
        try:
            result = {'native_buffer_vector_cases': verify_vectors(read_binary(args.sample), worker)}
        finally:
            worker.close()
    else:
        result = compare(args)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
