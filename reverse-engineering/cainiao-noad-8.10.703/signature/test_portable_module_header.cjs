/** Public checks for module-specific CRC, raw and packed plans, partial resets and unsupported ranges. */
const assert = require('node:assert/strict')
const zlib = require('node:zlib')
const {moduleChecksum, planModuleLoad} = require(require('node:path').resolve(process.argv[2]))
let checksums = 0, behavior = 0, rejected = 0

/** Reverse a public fixed-width integer to derive an independent reflected-zlib oracle. */
function reverse(value, bits) {
  let result = 0
  for (let index = 0; index < bits; index++) { result = (result << 1) | (value & 1); value >>>= 1 }
  return result >>> 0
}
for (const size of [0, 1, 2, 3, 19, 20, 21, 55, 56, 57, 127, 128, 255, 256, 257, 4095, 4096, 4097, 16385, 32769]) {
  const bytes = Uint8Array.from({length: size}, (_, index) => (index * 31 + 7) & 255)
  const reversed = Uint8Array.from(bytes, byte => reverse(byte, 8))
  const expected = reverse((zlib.crc32(reversed) ^ 0xffffffff) >>> 0, 32)
  assert.equal(moduleChecksum(bytes), expected)
  checksums++
  for (const width of [1, 7, 4096]) {
    let state = 0xffffffff
    for (let offset = 0; offset < bytes.length; offset += width) state = moduleChecksum(bytes.subarray(offset, offset + width), state)
    assert.equal(state, expected)
    checksums++
  }
}
assert.equal(moduleChecksum(new TextEncoder().encode('123456789')), 0x0376e6e7)
checksums++

class Memory {
  /** Map only a synthetic arena and initialize a raw public module header. */
  constructor(version = 0x10001, flags = 0) {
    this.bytes = new Uint8Array(0x10000).fill(0xa5)
    this.writes = []
    this.header(0x1000n, version, flags)
  }
  /** Return views of the actual arena and reject unmapped ranges. */
  read(address, size) {
    if (address < 0n || address + BigInt(size) > BigInt(this.bytes.length)) throw new Error('Public header read outside arena')
    return this.bytes.subarray(Number(address), Number(address) + size)
  }
  /** Apply exact native writes and record their width/order. */
  write(address, bytes) { this.read(address, bytes.length).set(bytes); this.writes.push([address, bytes.length]) }
  /** Set one public native-width integer. */
  put(address, value, width = 4) {
    const bytes = this.read(address, width)
    const view = new DataView(bytes.buffer, bytes.byteOffset, width)
    if (width === 8) view.setBigUint64(0, BigInt(value), true)
    else view.setUint32(0, Number(value), true)
  }
  /** Build a public header with the actual declared format fields. */
  header(address, version, flags) {
    this.read(address, 128).fill(0)
    this.put(address, 0xb225081a)
    this.put(address + 8n, 128)
    this.put(address + 12n, flags)
    this.put(address + 20n, version)
    this.put(address + 72n, 7)
    if (flags & 0x40) this.put(address + 16n, moduleChecksum(this.read(address + 20n, 108)))
  }
}
for (const version of [0x10001, 0x10002]) {
  const memory = new Memory(version, 0x40)
  const plan = planModuleLoad([0x200n, 0x1000n, 0x100000080n, 0x55n, 0x900n], memory)
  assert.deepEqual(plan, {kind: 'tailCall', target: version === 0x10001 ? 0x102a5e240n : 0x102a626f0n, context: 0x200n, source: 0x1000n, length: 0x100000080n, output: 0x900n})
  assert.deepEqual(memory.writes, [[0x260n, 1], [0x258n, 8], [0x218n, 4]])
  assert.equal(new DataView(memory.bytes.buffer).getUint32(0x218, true), version === 0x10002 ? 1 : 0)
  behavior++
}
{
  const memory = new Memory()
  memory.put(0x1000n, 0)
  const before = memory.read(0x218n, 4).slice()
  assert.deepEqual(planModuleLoad([0x200n, 0x1000n, 128n, 0n, 0n], memory), {kind: 'return', status: 1n})
  assert.deepEqual(memory.read(0x218n, 4), before)
  assert.deepEqual(memory.writes, [[0x260n, 1], [0x258n, 8]])
  behavior++
}
{
  const memory = new Memory()
  memory.header(0x1800n, 0x10002, 0)
  memory.put(0x1008n, 0xba137616)
  memory.put(0x100cn, (2 << 26) | 0x40000)
  memory.put(0x1010n, (1n << 58n) | (0x400n << 29n) | 128n, 8)
  memory.put(0x1018n, (0x800n << 29n) | 128n, 8)
  assert.deepEqual(planModuleLoad([0x200n, 0x1000n, 128n, 0n, 0n], memory), {kind: 'tailCall', target: 0x102a626f0n, context: 0x200n, source: 0x1800n, length: 128n, output: 0n})
  behavior++
}
for (const [field, value, expected] of [[8n, 129, 0x26n], [20n, 0x10003, 0x3en], [72n, 0, 2n]]) {
  const memory = new Memory()
  memory.put(0x1000n + field, value)
  assert.deepEqual(planModuleLoad([0x200n, 0x1000n, 128n, 0n, 0n], memory), {kind: 'return', status: expected})
  behavior++
}
{
  const memory = new Memory(0x10001, 0x40)
  memory.put(0x1010n, 0)
  assert.deepEqual(planModuleLoad([0x200n, 0x1000n, 128n, 0n, 0n], memory), {kind: 'return', status: 0x25n})
  behavior++
}
for (const args of [[0n, 0x1000n, 128n, 0n, 0n], [0x200n, 0n, 128n, 0n, 0n], [0x200n, 0x1000n, 112n, 0n, 0n]]) {
  const memory = new Memory()
  assert.deepEqual(planModuleLoad(args, memory), {kind: 'return', status: 7n})
  assert.deepEqual(memory.writes, [])
  behavior++
}
for (const state of [-1, 0x100000000, 1.5, NaN]) {
  assert.throws(() => moduleChecksum(new Uint8Array(), state), /checksum state/)
  rejected++
}
for (const args of [[], [0x200n, -1n, 128n, 0n, 0n], [0x200n, 0x1000n, 1n << 64n, 0n, 0n]]) {
  assert.throws(() => planModuleLoad(args, new Memory()), /ABI arguments/)
  rejected++
}
for (const total of [19, 0x1000001]) {
  const memory = new Memory(0x10001, 0x40)
  memory.put(0x1008n, total)
  assert.throws(() => planModuleLoad([0x200n, 0x1000n, 0xffffffffn, 0n, 0n], memory), /checksum range/)
  rejected++
}
{
  const memory = {
    /** Deliberately truncate a field after the two native reset writes. */
    read() { return new Uint8Array(0) },
    /** Accept only the native reset writes needed before that field read. */
    write() {},
  }
  assert.throws(() => planModuleLoad([0x200n, 0x1000n, 128n, 0n, 0n], memory), /truncated/)
  rejected++
}
console.log(JSON.stringify({module_checksum_cases: checksums, module_header_behavior_cases: behavior, module_header_rejection_cases: rejected}))
