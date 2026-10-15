import type {VmMemory} from './portable_vm_memory'
import type {BufferHeap} from './portable_buffer'
import {md5, sha1, base64Encode, base64Alphabet, crc32Table} from './portable_digest'

/** Fixed sample primitive entries, distinct from object wrappers and the outer SDK dispatcher. */
export const standardEntries = {md5: 0x102ad4370n, sha1: 0x102ac4458n, hmac: 0x102acc6a0n, base64: 0x102ae5320n, crc: 0x102adefb8n} as const
const alphabetAddress = 0x1068f9d65n
const alphabetFlag = 0x1068f9da5n

/** Read an exact unsigned native field without losing pointer precision. */
function read(memory: VmMemory, address: bigint, width: number): bigint {
  const bytes = memory.read(address, width)
  if (bytes.length !== width) throw new Error('Crypto field read truncated')
  let value = 0n
  for (let index = width - 1; index >= 0; index--) value = (value << 8n) | BigInt(bytes[index])
  return value
}

/** Enforce the explicit 16 MiB adapter boundary before accessing input or scratch memory. */
function size(value: bigint): number {
  if (value < 0n || value > 0x1000000n) throw new Error('Crypto input exceeds explicit boundary')
  return Number(value)
}

/** Execute exact primitive ABI and HMAC descriptor semantics; unsupported overlaps fail explicitly. */
export function standardCall(entry: bigint, args: readonly bigint[], stack: bigint, memory: VmMemory, heap: BufferHeap): bigint {
  if (!Object.values(standardEntries).includes(entry as typeof standardEntries[keyof typeof standardEntries])) throw new Error('Unsupported crypto entry')
  const required = entry === standardEntries.crc ? 2 : entry === standardEntries.hmac ? 1 : entry === standardEntries.md5 ? 3 : 4
  if (args.length < required || args.some(value => value < 0n || value > 0xffffffffffffffffn)) throw new Error('Invalid crypto ABI arguments')
  if (entry === standardEntries.md5) {
    const [source, count, output] = args
    if (!source || !output) return source
    let length = count
    if (!length) {
      let index = 0
      for (; index < 8192; index++) if (read(memory, source + BigInt(index), 1) === 0n) break
      if (index === 8192) throw new Error('MD5 C string exceeds explicit boundary')
      length = BigInt(index)
    }
    if (stack < 0xa0n || stack > 0xffffffffffffffffn || (stack & 15n)) throw new Error('Invalid MD5 native stack metadata')
    memory.write(output, md5(memory.read(source, size(length))))
    // The native void helper leaves x0 at its final zero-byte memcpy destination.
    return stack - 0xa0n + 0x18n
  }
  if (entry === standardEntries.sha1) {
    const [source, rawCount, output, rawCapacity] = args
    const count = BigInt.asUintN(32, rawCount)
    if (BigInt.asUintN(32, rawCapacity) < 20n || !source || !count || !output) return 0n
    memory.write(output, sha1(memory.read(source, size(count))))
    return 20n
  }
  if (entry === standardEntries.base64) {
    if ((read(memory, alphabetFlag, 1) & 1n) === 0n) {
      // The native decoder's fixed 64-byte result is independently verified against this public alphabet.
      memory.write(alphabetAddress, base64Alphabet)
      memory.write(alphabetFlag, Uint8Array.of(1))
    }
    const [source, rawCount, output, rawCapacity] = args
    const count = BigInt.asUintN(32, rawCount)
    const capacity = BigInt.asUintN(32, rawCapacity)
    const expected = BigInt(Math.ceil(size(count) / 3) * 4)
    if (!expected || expected > capacity) return 0xffffffffn
    if (source < output + expected && output < source + count) throw new Error('Overlapping native Base64 ranges are unsupported')
    if (output < alphabetAddress + 64n && alphabetAddress < output + expected) throw new Error('Base64 destination overlaps native alphabet')
    const result = base64Encode(memory.read(source, size(count)), memory.read(alphabetAddress, 64))
    memory.write(output, result)
    return expected
  }
  if (entry === standardEntries.crc) {
    const table = 0x1068f91f8n
    const flag = 0x1068f91f1n
    if (read(memory, flag, 1) === 0n) {
      const bytes = new Uint8Array(2048)
      const view = new DataView(bytes.buffer)
      for (let index = 0; index < crc32Table.length; index++) view.setBigUint64(index * 8, BigInt(crc32Table[index]), true)
      memory.write(table, bytes)
      memory.write(flag, Uint8Array.of(1))
    }
    const input = memory.read(args[0], size(BigInt.asUintN(32, args[1])))
    if (!input.length) return 0n
    const tableBytes = memory.read(table, 2048)
    if (tableBytes.length !== 2048) throw new Error('CRC table read truncated')
    const view = new DataView(tableBytes.buffer, tableBytes.byteOffset, tableBytes.byteLength)
    let value = 0n
    for (const byte of input) value = view.getBigUint64(Number((value & 255n) ^ BigInt(byte)) * 8, true) ^ (value >> 8n)
    return value
  }
  const descriptor = args[0]
  if (!descriptor) return 0n
  const source = read(memory, descriptor + 16n, 8)
  if (!source) return 0n
  const count = read(memory, descriptor + 24n, 4)
  if (!count) return 0n
  const key = read(memory, descriptor, 8)
  if (!key) return 0n
  const keyLength = read(memory, descriptor + 8n, 4)
  if (!keyLength || read(memory, descriptor + 40n, 4) < 20n) return 0n
  const keyBytes = memory.read(key, size(keyLength))
  const block = keyLength > 64n ? sha1(keyBytes) : keyBytes
  const innerPad = new Uint8Array(64)
  const outerPad = new Uint8Array(64)
  for (let index = 0; index < 64; index++) {
    const value = index < block.length ? block[index] : 0
    innerPad[index] = value ^ 0x36
    outerPad[index] = value ^ 0x5c
  }
  const requiredScratch = count > 20n ? BigInt.asUintN(32, count + 65n) : 85n
  const allocationSize = size(BigInt.asIntN(32, requiredScratch))
  size(count + 64n)
  let scratch = read(memory, descriptor + 48n, 8)
  const allocated = !scratch || read(memory, descriptor + 56n, 4) < requiredScratch
  if (allocated) scratch = heap.allocate(allocationSize)
  if (!scratch) return 0n
  if (scratch < descriptor + 64n && descriptor < scratch + requiredScratch) throw new Error('HMAC scratch overlaps its descriptor')
  memory.write(scratch, innerPad)
  memory.write(scratch + 64n, memory.read(source, size(count)))
  const inner = sha1(memory.read(scratch, size(count + 64n)))
  memory.write(scratch, outerPad)
  memory.write(scratch + 64n, inner)
  const output = read(memory, descriptor + 32n, 8)
  const capacity = read(memory, descriptor + 40n, 4)
  let result = 0n
  if (output && capacity >= 20n) {
    memory.write(output, sha1(memory.read(scratch, 84)))
    result = 20n
  }
  if (allocated) heap.free(scratch)
  return result
}
