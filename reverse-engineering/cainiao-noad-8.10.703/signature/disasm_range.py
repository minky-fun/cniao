"""反汇编指定地址区间并解析符号；只读分析。用法: disasm_range.py <binary> <start> <end>"""
import subprocess
import sys
import re
import struct

from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
from capstone.arm64_const import ARM64_OP_IMM


def main():
    """按 Mach-O 段映射读取指定范围，并输出本地反汇编。"""
    binary, start, end = sys.argv[1], int(sys.argv[2], 16), int(sys.argv[3], 16)
    data = open(binary, 'rb').read()
    ncmds = struct.unpack_from('<I', data, 16)[0]
    offset, segments = 32, []
    for _ in range(ncmds):
        command, size = struct.unpack_from('<II', data, offset)
        if command == 25:
            vm, vm_size, file_off, file_size = struct.unpack_from('<QQQQ', data, offset + 24)
            segments.append((vm, vm_size, file_off, file_size))
        offset += size

    def read_mem(address, size):
        """只从包含目标地址的文件映射段读取字节。"""
        for vm, vm_size, file_off, file_size in segments:
            if vm <= address < vm + vm_size and file_size:
                return data[file_off + address - vm: file_off + address - vm + size]
        raise KeyError(hex(address))

    text = subprocess.check_output(['nm', '-n', binary], text=True)
    by_addr = {int(a, 16): n for a, n in re.findall(r'^([0-9a-f]{16}) [tT] (\S+)', text, re.M)}
    md = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
    md.detail = True
    md.skipdata = True
    for insn in md.disasm(read_mem(start, end - start), start):
        extra = ''
        if insn.mnemonic in ('bl', 'b') and insn.operands:
            for op in insn.operands:
                if op.type == ARM64_OP_IMM:
                    n = by_addr.get(op.imm)
                    if n:
                        extra = f'   ; {n}'
        print(f'{insn.address:#x}: {insn.mnemonic}\t{insn.op_str}{extra}')


if __name__ == '__main__':
    main()
