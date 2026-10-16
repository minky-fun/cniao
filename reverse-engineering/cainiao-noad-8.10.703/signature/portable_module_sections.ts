import type {VmMemory} from './portable_vm_memory'

export const moduleSectionsEntry = 0x102a5ed74n

/** Verified tag-to-field mapping; widths distinguish source-relative pointers from uint32 values. */
export const sectionFields: Readonly<Record<number, readonly [number, 4 | 8]>> = {
  1: [0x10, 8], 2: [0x18, 4], 3: [0x20, 8], 4: [0x28, 4],
  5: [0xa0, 8], 6: [0xa8, 4], 7: [0xb0, 8], 8: [0xb8, 4],
  9: [0x50, 8], 10: [0x58, 4], 11: [0x30, 8], 12: [0x38, 4],
  13: [0x40, 8], 14: [0x48, 4], 15: [0x90, 8], 16: [0x98, 4],
  17: [0x80, 8], 18: [0x88, 4], 19: [0x60, 8], 20: [0x68, 4],
  21: [0x70, 8], 22: [0x78, 4], 24: [0xd8, 8], 25: [0xe0, 4],
  26: [0xe8, 8], 27: [0xf0, 4], 28: [0xc0, 8], 29: [0xd0, 4],
  30: [0xc8, 8], 31: [0xd4, 4], 34: [0x108, 8], 35: [0x110, 4], 36: [0xf8, 8],
}

/** Decode verified section descriptors in native write order, including partial writes on rejected tags. */
export function moduleSections(source: bigint, destination: bigint, memory: VmMemory): bigint {
  if (!source || !destination) return 7n
  /** Read one exact native field without guessing missing bytes. */
  function read(address: bigint, width: 4 | 8): bigint {
    const bytes = memory.read(address, width)
    if (bytes.length !== width) throw new Error('Module section field read truncated')
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return width === 4 ? BigInt(view.getUint32(0, true)) : view.getBigUint64(0, true)
  }
  /** Apply only the confirmed field width and preserve adjacent padding. */
  function write(address: bigint, value: bigint, width: 4 | 8): void {
    const bytes = new Uint8Array(width)
    const view = new DataView(bytes.buffer)
    if (width === 4) view.setUint32(0, Number(BigInt.asUintN(32, value)), true)
    else view.setBigUint64(0, BigInt.asUintN(64, value), true)
    memory.write(address, bytes)
  }
  const offset = read(source + 0x34n, 4)
  const total = read(source + 8n, 4)
  if (offset >= total) return 1n
  const count = read(source + 0x38n, 4)
  if (offset + count * 8n > total) return 1n
  if (count > 65536n) throw new Error('Module section count exceeds boundary')
  // The native descriptor array and output can alias. Each field is read immediately before its write.
  for (let index = 0n; index < count; index++) {
    const descriptor = source + offset + index * 8n
    const tag = Number(read(descriptor, 4))
    const field = sectionFields[tag]
    if (field === undefined) return 1n
    const value = read(descriptor + 4n, 4)
    write(destination + BigInt(field[0]), field[1] === 8 ? source + value : value, field[1])
  }
  let sum = 0n
  const records = read(destination + 0x38n, 4)
  if (records > 65536n) throw new Error('Module section aggregate count exceeds boundary')
  if (records) {
    const table = read(destination + 0x30n, 8)
    for (let index = 0n; index < records; index++) sum = BigInt.asUintN(32, sum + read(table + 4n + index * 8n, 4))
  }
  write(destination + 0x5cn, sum, 4)
  return 0n
}
