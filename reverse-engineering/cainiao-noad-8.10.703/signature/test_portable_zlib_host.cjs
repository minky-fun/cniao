/** Public memory-only checks for the explicit z_stream ABI and rejection boundaries. */
const assert = require('node:assert/strict')
const zlib = require('node:zlib')
const {standardCall, zlibEntries: entries} = require(require('node:path').resolve(process.argv[2]))
let cases = 0
let rejected = 0

class Memory {
  /** Initialize a fixed public arena with explicit allocation failure injection. */
  constructor() { this.bytes = new Uint8Array(0x10000); this.next = 0x1000; this.failure = false }
  /** Read independent bytes and enforce the test arena boundary. */
  read(address, width) {
    const start = Number(address)
    if (start < 0 || start + width > this.bytes.length) throw new Error('Public memory boundary')
    return this.bytes.slice(start, start + width)
  }
  /** Write exact byte ranges inside the test arena. */
  write(address, bytes) {
    const start = Number(address)
    if (start < 0 || start + bytes.length > this.bytes.length) throw new Error('Public memory boundary')
    this.bytes.set(bytes, start)
  }
  /** Allocate a nonoverlapping block, or return the explicitly injected failure. */
  allocate(size) {
    if (this.failure) return 0n
    const pointer = this.next
    this.next += Math.max(16, size)
    if (this.next > this.bytes.length) throw new Error('Public heap boundary')
    return BigInt(pointer)
  }
  /** No replacement crypto operation in this test is allowed to use realloc. */
  reallocate() { throw new Error('Unexpected public realloc') }
  /** No stream token is freed by the verified guest adapter. */
  free() { throw new Error('Unexpected public free') }
}

/** Prepare only a public version string and zero-filled Darwin LP64 descriptor. */
function prepare() {
  const memory = new Memory()
  memory.write(256n, Buffer.from('1.2.11\0'))
  return memory
}

/** Call one explicit import with no native fallback, using the same memory/heap arena. */
function call(memory, entry, args) { return standardCall(entry, args, 0x10000n, memory, memory) }

/** Count an intended rejection, without retaining its input in any error output. */
function reject(action) { assert.throws(action); rejected++ }

for (const configure of [
  /** Reject the wrong ABI size. */
  memory => { memory.abi = 111n },
  /** Reject a custom allocator. */
  memory => { new DataView(memory.bytes.buffer).setBigUint64(64, 1n, true) },
  /** Reject a custom free callback. */
  memory => { new DataView(memory.bytes.buffer).setBigUint64(72, 1n, true) },
  /** Reject an opaque allocator context. */
  memory => { new DataView(memory.bytes.buffer).setBigUint64(80, 1n, true) },
  /** Reject an unverified version string. */
  memory => { memory.write(256n, Buffer.from('1.2.12\0')) },
  /** Preserve explicit allocation failure. */
  memory => { memory.failure = true },
]) {
  const memory = prepare()
  memory.abi = 112n
  configure(memory)
  reject(() => call(memory, entries.initialize, [0n, 256n, memory.abi]))
}
{
  const memory = prepare()
  reject(() => call(memory, entries.inflate, [0n, 0n]))
  reject(() => call(memory, entries.end, [0n]))
  assert.equal(call(memory, entries.initialize, [0n, 256n, 112n]), 0n)
  const view = new DataView(memory.bytes.buffer)
  const token = view.getBigUint64(56, true)
  assert.notEqual(token, 0n)
  reject(() => call(memory, entries.initialize, [0n, 256n, 112n]))
  reject(() => call(memory, entries.inflate, [0n, 4n]))
  view.setBigUint64(16, 1n, true)
  reject(() => call(memory, entries.inflate, [0n, 0n]))
  view.setBigUint64(16, 0n, true)
  view.setBigUint64(40, 1n, true)
  reject(() => call(memory, entries.inflate, [0n, 0n]))
  view.setBigUint64(40, 0n, true)
  view.setBigUint64(56, token + 1n, true)
  reject(() => call(memory, entries.inflate, [0n, 0n]))
  view.setBigUint64(56, token, true)
  for (const offset of [8, 32]) {
    view.setUint32(offset, 0x1000001, true)
    reject(() => call(memory, entries.inflate, [0n, 0n]))
    view.setUint32(offset, 0, true)
  }
  assert.equal(call(memory, entries.inflate, [0n, 0n]), 0xfffffffbn)
  assert.equal(call(memory, entries.end, [0n]), 0n)
  assert.equal(view.getBigUint64(56, true), 0n)
  reject(() => call(memory, entries.end, [0n]))
  cases++
}
{
  const memory = prepare()
  const plain = Buffer.from('Public streaming native ABI fixture.'.repeat(100))
  const compressed = zlib.deflateSync(plain)
  memory.write(512n, compressed)
  const view = new DataView(memory.bytes.buffer)
  call(memory, entries.initialize, [0n, 256n, 112n])
  view.setBigUint64(0, 512n, true)
  view.setUint32(8, compressed.length, true)
  const restored = []
  for (let step = 0; step < 1000; step++) {
    view.setBigUint64(24, 0x800n, true)
    view.setUint32(32, 17, true)
    const code = call(memory, entries.inflate, [0n, 0n])
    restored.push(Buffer.from(memory.read(0x800n, 17 - view.getUint32(32, true))))
    if (code === 1n) break
    assert.equal(code, 0n)
  }
  assert.deepEqual(Buffer.concat(restored), plain)
  assert.equal(view.getBigUint64(16, true), BigInt(compressed.length))
  assert.equal(view.getBigUint64(40, true), BigInt(plain.length))
  assert.equal(view.getUint32(88, true), 64)
  assert.equal(view.getBigUint64(96, true), BigInt(compressed.readUInt32BE(compressed.length - 4)))
  call(memory, entries.end, [0n])
  cases++
}
console.log(JSON.stringify({host_behavior_cases: cases, host_rejection_cases: rejected}))
