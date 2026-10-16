import type {VmMemory} from './portable_vm_memory'

export const moduleHeaderEntry = 0x102a631e4n
export type ModuleLoadPlan = {kind: 'return'; status: bigint} | {
  kind: 'tailCall'; target: bigint; context: bigint; source: bigint; length: bigint; output: bigint
}
const checksumTable = new Uint32Array(256)
for (let index = 0; index < 256; index++) {
  let value = index << 24
  for (let bit = 0; bit < 8; bit++) value = value & 0x80000000 ? (value << 1) ^ 0x04c11db7 : value << 1
  checksumTable[index] = value >>> 0
}

/** Compute the native module's MSB-first CRC with initial all-ones and no final XOR; allow exact chunk continuation. */
export function moduleChecksum(bytes: Uint8Array, state = 0xffffffff): number {
  if (!Number.isInteger(state) || state < 0 || state > 0xffffffff) throw new Error('Invalid module checksum state')
  for (const byte of bytes) state = ((state << 8) ^ checksumTable[(state >>> 24) ^ byte]) >>> 0
  return state
}

/** Validate the verified module header and return its exact backend tail-call plan; backend execution remains explicit. */
export function planModuleLoad(args: readonly bigint[], memory: VmMemory): ModuleLoadPlan {
  if (args.length < 5 || args.some(value => value < 0n || value > 0xffffffffffffffffn)) throw new Error('Invalid module header ABI arguments')
  const context = args[0], output = args[4]
  let source = args[1], length = args[2]
  /** Read exact native-width fields using uint64 guest-address arithmetic. */
  function read(address: bigint, width: 1 | 4 | 8): bigint {
    const bytes = memory.read(BigInt.asUintN(64, address), width)
    if (bytes.length !== width) throw new Error('Module header field read truncated')
    if (width === 1) return BigInt(bytes[0])
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return width === 8 ? view.getBigUint64(0, true) : BigInt(view.getUint32(0, true))
  }
  /** Store the exact reset or version flag without modifying adjacent padding. */
  function write(address: bigint, value: bigint, width: 1 | 4 | 8): void {
    const bytes = new Uint8Array(width)
    const view = new DataView(bytes.buffer)
    if (width === 8) view.setBigUint64(0, value, true)
    else if (width === 4) view.setUint32(0, Number(value), true)
    else bytes[0] = Number(value)
    memory.write(BigInt.asUintN(64, address), bytes)
  }
  if (!context || !source || BigInt.asUintN(32, length) < 113n) return {kind: 'return', status: 7n}
  write(context + 0x60n, 0n, 1)
  write(context + 0x58n, 0n, 8)
  let selected = false
  if (read(source + 8n, 4) === 0xba137616n) {
    const flags = read(source + 12n, 4)
    const count = flags >> 26n
    if ((flags & 0x3fc0000n) === 0x40000n && count) {
      for (let index = 0n; index < count; index++) {
        const record = read(source + 16n + index * 8n, 8)
        if (record >> 58n) continue
        source = BigInt.asUintN(64, source + (record >> 29n))
        length = record & 0x1fffffffn
        selected = true
        break
      }
    }
  }
  if (!selected) {
    if (read(source, 4) !== 0xb225081an) return {kind: 'return', status: 1n}
    if (read(source + 0x14n, 4) !== 0x10002n && read(source + 0x48n, 4) !== 7n) return {kind: 'return', status: 2n}
  }
  if (!source || BigInt.asUintN(32, length) < 113n) return {kind: 'return', status: 7n}
  if (read(source, 4) !== 0xb225081an) return {kind: 'return', status: 0x27n}
  const total = read(source + 8n, 4)
  if (total > BigInt.asUintN(32, length)) return {kind: 'return', status: 0x26n}
  if (read(source + 12n, 1) & 0x40n) {
    // Native subtraction wraps below 20 bytes; reject that unsafe unsupported CRC range rather than guessing a status.
    if (total < 20n || total > 0x1000000n) throw new Error('Module checksum range exceeds supported boundary')
    let checksum = 0xffffffff
    for (let offset = 20n; offset < total;) {
      const size = Number(total - offset > 4096n ? 4096n : total - offset)
      const chunk = memory.read(BigInt.asUintN(64, source + offset), size)
      if (chunk.length !== size) throw new Error('Module checksum read truncated')
      checksum = moduleChecksum(chunk, checksum)
      offset += BigInt(size)
    }
    if (read(source + 16n, 4) !== BigInt(checksum)) return {kind: 'return', status: 0x25n}
  }
  const version = read(source + 0x14n, 4)
  if (version !== 0x10001n && version !== 0x10002n) return {kind: 'return', status: 0x3en}
  write(context + 0x18n, version === 0x10002n ? 1n : 0n, 4)
  return {kind: 'tailCall', target: version === 0x10002n ? 0x102a626f0n : 0x102a5e240n, context, source, length, output}
}
