from pathlib import Path
import struct,re
p=Path(__file__).parent
b=(p/'Cainiao4iPhone').read_bytes()
segments=[]
off=32
for _ in range(struct.unpack_from('<I',b,16)[0]):
    command,size=struct.unpack_from('<II',b,off)
    if command==25:segments.append(struct.unpack_from('<QQQQ',b,off+24))
    off+=size

def position(address):
    """将虚拟地址映射到有文件内容的 Mach-O 段偏移。"""
    for vm,size,file_offset,file_size in segments:
        if vm<=address<vm+file_size:return file_offset+address-vm
    raise ValueError(hex(address))

def selector(address):
    """解析当前样本 Objective-C 消息桩中的 ADRP/LDR selector 引用。"""
    word,load=struct.unpack_from('<II',b,position(address))
    if word&0x9f00001f!=0x90000001:raise ValueError('Not a selector stub')
    immediate=(((word>>5)&0x7ffff)<<2)|((word>>29)&3)
    if immediate&(1<<20):immediate-=1<<21
    page=(address&~4095)+(immediate<<12)
    pointer=struct.unpack_from('<Q',b,position(page+((load>>10)&4095)*8))[0]
    offset=position(pointer)
    return b[offset:b.index(b'\0',offset)].decode('utf8',errors='replace')

lines=[]
for source in sorted(p.glob('*selected.asm')):
    lines.append('// '+source.name)
    for line in source.read_text(errors='replace').splitlines():
        match=re.search(r'\b(?:bl|b)\s+(0x104[4-6][a-f0-9]+)',line)
        if match:
            try:line+=' ; selector: '+selector(int(match[1],16))
            except (ValueError,struct.error):pass
        lines.append(line)
(p/'auth-annotated.asm').write_text('\n'.join(lines)+'\n')
