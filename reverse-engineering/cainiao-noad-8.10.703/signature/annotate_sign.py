"""对该样本的定点反汇编补充字符串、selector 与方法入口注释。"""
from pathlib import Path
import json
import re
import struct

ROOT = Path(__file__).parent
BINARY = ROOT / 'Cainiao4iPhone'
data = BINARY.read_bytes()
segments = []
sections = []
offset = 32
for _ in range(struct.unpack_from('<I', data, 16)[0]):
    command, size = struct.unpack_from('<II', data, offset)
    if command == 25:
        segments.append(struct.unpack_from('<QQQQ', data, offset + 24))
        for index in range(struct.unpack_from('<I', data, offset + 64)[0]):
            start = offset + 72 + index * 80
            name = data[start:start + 16].split(b'\0')[0].decode()
            address, length = struct.unpack_from('<QQ', data, start + 32)
            sections.append((address, address + length, name))
    offset += size


def position(address):
    """只映射位于文件实际内容范围内的虚拟地址。"""
    for vm, size, file_offset, file_size in segments:
        if vm <= address < vm + file_size:
            return file_offset + address - vm
    raise ValueError('Address outside file-backed segments')


def cstring(address):
    """读取以空字符结束的 UTF-8 字符串，不猜测其他编码。"""
    start = position(address)
    return data[start:data.index(b'\0', start)].decode('utf8')


def describe(address):
    """仅解释已知字符串节、CFString 和 selector 引用。"""
    section = next((name for start, end, name in sections if start <= address < end), '')
    if section in ['__cstring', '__objc_methname', '__objc_classname']:
        return cstring(address)
    if section == '__cfstring':
        pointer = struct.unpack_from('<Q', data, position(address) + 16)[0]
        return cstring(pointer)
    if section == '__objc_selrefs':
        pointer = struct.unpack_from('<Q', data, position(address))[0]
        return 'selector: ' + cstring(pointer)
    return ''


def selector_stub(address):
    """识别 ADRP x1/LDR x1 形式的 Objective-C 消息桩。"""
    word, load = struct.unpack_from('<II', data, position(address))
    if word & 0x9f00001f != 0x90000001 or load & 0xffc003ff != 0xf9400021:
        return ''
    immediate = (((word >> 5) & 0x7ffff) << 2) | ((word >> 29) & 3)
    if immediate & (1 << 20):
        immediate -= 1 << 21
    reference = (address & ~4095) + (immediate << 12) + ((load >> 10) & 4095) * 8
    return describe(reference)


methods = {int(item['imp'], 16): item['class'] + ' ' + item['method'] for item in json.loads((ROOT / 'methods.json').read_text())}
for source in sorted(ROOT.glob('*.asm')):
    if source.name.endswith('-annotated.asm'):
        continue
    registers = {}
    lines = []
    for line in source.read_text().splitlines():
        if str(BINARY) in line:
            line = 'Cainiao4iPhone: file format mach-o arm64'
        match = re.match(r'([0-9a-f]+):\s+[0-9a-f]+\s+(\w+)\s*(.*)', line)
        if match:
            address = int(match[1], 16)
            op, operands = match.group(2, 3)
            if address in methods:
                lines.append('; ' + methods[address])
            note = ''
            page = re.match(r'(x\d+), (0x[0-9a-f]+)', operands)
            add = re.match(r'(x\d+), (x\d+), #(0x[0-9a-f]+|\d+)$', operands)
            load = re.match(r'(x\d+), \[(x\d+)(?:, #(0x[0-9a-f]+|\d+))?\]', operands)
            branch = re.match(r'(0x[0-9a-f]+)', operands)
            try:
                if op == 'adrp' and page:
                    registers[page[1]] = int(page[2], 16)
                elif op == 'add' and add and add[2] in registers:
                    target = registers[add[2]] + int(add[3], 0)
                    registers[add[1]] = target
                    note = describe(target)
                elif op == 'ldr' and load and load[2] in registers:
                    target = registers[load[2]] + int(load[3] or '0', 0)
                    note = describe(target)
                    registers.pop(load[1], None)
                elif op == 'bl' and branch:
                    note = selector_stub(int(branch[1], 16))
            except (ValueError, struct.error, UnicodeDecodeError):
                pass
            if op in ['bl', 'blr']:
                registers = {key: value for key, value in registers.items() if int(key[1:]) >= 19}
            elif op not in ['adrp', 'add', 'ldr'] and re.match(r'x\d+,', operands):
                registers.pop(operands.split(',')[0], None)
            if note:
                line += ' ; ' + note.replace('\n', '\\n')
        lines.append(line)
    source.with_name(source.stem + '-annotated.asm').write_text('\n'.join(lines) + '\n')
