"""定位样本中 ADRP 附近的分发指针写入候选，不模拟执行或生成签名。"""
from pathlib import Path
import argparse
import hashlib
import json
import struct

EXPECTED_SHA256 = 'd305a955a56094e30bc693249e455fdae9fd8ba04cc2ec66e573ca02bb0e5b61'
TARGETS = {0x1068f6788, 0x1068fbe50}


def signed(value, bits):
    """将固定宽度立即数解释为有符号整数。"""
    return value - (1 << bits) if value & (1 << (bits - 1)) else value


def trace(binary):
    """核对样本后扫描 ARM64 text 中的邻近 ADRP/STR，返回待反汇编复核的候选。"""
    data = Path(binary).read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if digest != EXPECTED_SHA256:
        raise ValueError('样本 SHA-256 不匹配，不使用本报告的固定地址')
    sections = []
    offset = 32
    for _ in range(struct.unpack_from('<I', data, 16)[0]):
        command, size = struct.unpack_from('<II', data, offset)
        if command == 25:
            for index in range(struct.unpack_from('<I', data, offset + 64)[0]):
                start = offset + 72 + index * 80
                if data[start:start + 16].split(b'\0')[0] == b'__text':
                    sections.append(struct.unpack_from('<QQI', data, start + 32))
        offset += size
    candidates = []
    for base, size, file_offset in sections:
        for position in range(0, size - 28, 4):
            word = struct.unpack_from('<I', data, file_offset + position)[0]
            if word & 0x9f000000 != 0x90000000:
                continue
            immediate = signed((((word >> 5) & 0x7ffff) << 2) | ((word >> 29) & 3), 21)
            page = ((base + position) & ~4095) + (immediate << 12)
            if page not in {target & ~4095 for target in TARGETS}:
                continue
            register = word & 31
            for distance in range(1, 8):
                address = base + position + distance * 4
                store = struct.unpack_from('<I', data, file_offset + position + distance * 4)[0]
                if store & 0xffc00000 != 0xf9000000 or (store >> 5) & 31 != register:
                    continue
                target = page + ((store >> 10) & 4095) * 8
                if target in TARGETS:
                    candidates.append({'adrp': hex(base + position), 'store': hex(address),
                                       'target': hex(target), 'source_register': 'x' + str(store & 31)})
    return {'binary_sha256': digest, 'scan': 'nearby ADRP/64-bit STR candidates; manual disassembly required',
            'candidates': candidates}


def main():
    """从明确指定的主程序输出候选 JSON，不读取账号或请求数据。"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('binary')
    args = parser.parse_args()
    print(json.dumps(trace(args.binary), indent=2))


if __name__ == '__main__':
    main()
