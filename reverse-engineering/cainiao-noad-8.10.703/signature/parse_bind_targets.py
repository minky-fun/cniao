"""解析 dyld bind 区，查找 0x1053bc078 / 0x1053bb838 的绑定符号；只读分析。"""
import struct
from probe_native import read_binary

BINARY = 'work/signature-analysis/Cainiao4iPhone'
TARGETS = {0x1053bc078, 0x1053bb838}


def uleb(data, p, end):
    """读取 dyld bind 流中的无符号 LEB128 整数。"""
    result = shift = 0
    while p < end:
        b = data[p]; p += 1
        result |= (b & 0x7f) << shift
        if not b & 0x80:
            return result, p
        shift += 7
    raise ValueError('uleb overflow')


def main():
    """扫描固定主程序的 bind 流并报告两个默认 cJSON 钩子。"""
    data = read_binary(BINARY)
    ncmds = struct.unpack_from('<I', data, 16)[0]
    offset, segments = 32, []
    dyld_info = None
    for _ in range(ncmds):
        command, size = struct.unpack_from('<II', data, offset)
        if command == 25:
            vm, vm_size, file_off, file_size = struct.unpack_from('<QQQQ', data, offset + 24)
            segments.append((vm, vm_size, file_off, file_size))
        elif command == 0x80000022:
            dyld_info = struct.unpack_from('<10I', data, offset + 8)
        offset += size
    bind_off, bind_size = dyld_info[2], dyld_info[3]
    p = bind_off
    end = bind_off + bind_size
    seg_index = 0
    seg_offset = 0
    symbol = None
    ordinal = 0
    found = {}
    seg2_count = 0
    while p < end:
        opcode = data[p] & 0xf0
        imm = data[p] & 0x0f
        p += 1
        if opcode == 0x00:
            break
        elif opcode == 0x10:
            ordinal = imm
        elif opcode == 0x20:
            ordinal, p = uleb(data, p, end)
        elif opcode == 0x30:
            ordinal = (imm | 0xf0) if imm == 0 else imm
        elif opcode == 0x40:
            end0 = data.index(b'\0', p)
            symbol = data[p:end0].decode('ascii', 'replace')
            p = end0 + 1
        elif opcode == 0x50:
            pass
        elif opcode == 0x60:
            while p < end:
                b = data[p]
                p += 1
                if not b & 0x80:
                    break
        elif opcode == 0x70:
            seg_index = imm
            seg_offset, p = uleb(data, p, end)
        elif opcode == 0x80:
            v, p = uleb(data, p, end)
            seg_offset += v
        elif opcode == 0x90:
            vm, _, _, _ = segments[seg_index]
            vm_addr = vm + seg_offset
            if seg_index == 2:
                seg2_count += 1
                if vm_addr in TARGETS:
                    found[vm_addr] = symbol
            seg_offset += 8
        elif opcode == 0xa0:
            vm, _, _, _ = segments[seg_index]
            vm_addr = vm + seg_offset
            if seg_index == 2:
                seg2_count += 1
                if vm_addr in TARGETS:
                    found[vm_addr] = symbol
            v, p = uleb(data, p, end)
            seg_offset += v + 8
        elif opcode == 0xb0:
            vm, _, _, _ = segments[seg_index]
            vm_addr = vm + seg_offset
            if seg_index == 2:
                seg2_count += 1
                if vm_addr in TARGETS:
                    found[vm_addr] = symbol
            seg_offset += imm * 8 + 8
        elif opcode == 0xc0:
            count, p = uleb(data, p, end)
            skip, p = uleb(data, p, end)
            vm, _, _, _ = segments[seg_index]
            for _ in range(count):
                vm_addr = vm + seg_offset
                if seg_index == 2:
                    seg2_count += 1
                    if vm_addr in TARGETS:
                        found[vm_addr] = symbol
                seg_offset += skip + 8
        else:
            raise ValueError(f'unknown opcode {opcode:#x} at {p-1:#x}')
    if found != {0x1053bc078: '_malloc', 0x1053bb838: '_free'}:
        raise RuntimeError('默认 cJSON 钩子的 bind 目标与固定样本不符')
    print('seg2 bind count:', seg2_count)
    print('found:', {hex(address): symbol for address, symbol in found.items()})


if __name__ == '__main__':
    main()
