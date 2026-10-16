/** Public checks for explicit clock injection, padding, cache state and unsupported aliases. */
const assert = require('node:assert/strict')
const {moduleCall, moduleEntries: entries} = require(require('node:path').resolve(process.argv[2]))
let cases = 0
let rejected = 0

class Memory {
  /** Map only public synthetic memory and the three fixed metadata ranges used by this module. */
  constructor() {
    this.bytes = new Uint8Array(0x40000).fill(0x5a)
    this.regions = new Map([[0n, this.bytes], [0x104820c18n, Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8)], [0x1068f1664n, Uint8Array.of(1, 0, 0, 0)], [0x1069c1260n, new Uint8Array(8)]])
    this.next = 0x1000
    this.frees = []
  }
  /** Return only an exact mapped range without inventing zero-filled metadata. */
  read(address, width) {
    for (const [base, bytes] of this.regions) if (address >= base && address + BigInt(width) <= base + BigInt(bytes.length)) return bytes.slice(Number(address - base), Number(address - base) + width)
    throw new Error('Unmapped public read')
  }
  /** Mutate exactly one mapped region. */
  write(address, data) {
    for (const [base, bytes] of this.regions) if (address >= base && address + BigInt(data.length) <= base + BigInt(bytes.length)) { bytes.set(data, Number(address - base)); return }
    throw new Error('Unmapped public write')
  }
  /** Allocate distinct public blocks without recycling freed storage. */
  allocate(size) { const address = BigInt(this.next); this.next += Math.max(16, size); if (this.next >= 0x20000) throw new Error('Public allocation boundary'); return address }
  /** Preserve the public adapter's observable free result and ordering. */
  free(address) { this.frees.push(address); return 0n }
  /** These module operations do not call realloc. */
  reallocate() { throw new Error('Unexpected public realloc') }
}

/** Write one public little-endian field. */
function put(memory, address, value, width = 8) {
  const bytes = new Uint8Array(width)
  const view = new DataView(bytes.buffer)
  if (width === 8) view.setBigUint64(0, value, true)
  else view.setUint32(0, Number(value), true)
  memory.write(address, bytes)
}

/** Read an exact public 64-bit field. */
function get(memory, address) { return new DataView(memory.read(address, 8).buffer).getBigUint64(0, true) }

const clock = {
  /** Supply explicit nonzero platform results; the portable constructor must not replace them with zero. */
  getTime(memory, timeval, timezone) {
    put(memory, timeval, 0x1122334455667788n)
    put(memory, timeval + 8n, 876543n)
    memory.write(timezone, new Uint8Array(8))
  },
}

/** Execute one module operation against an explicit public environment. */
function call(memory, entry, args, stack = 0x30000n) { return moduleCall(entry, args, stack, memory, memory, clock) }

/** Count only intentional unsupported cases. */
function reject(action) { assert.throws(action); rejected++ }

{
  const memory = new Memory()
  const engine = call(memory, entries.createEngine, [0n])
  const context = get(memory, engine)
  assert.equal(get(memory, context + 80n), engine)
  assert.equal(get(memory, context + 16n), 0x104b42138n)
  assert.deepEqual(memory.read(context + 36n, 4), new Uint8Array(4).fill(0x5a))
  assert.equal(get(memory, engine + 8n), 0x5a5a5a5a5a5a5a5an)
  assert.deepEqual(memory.read(0x1069c1260n, 8), Uint8Array.of(0x88, 0x77, 0x66, 0x55, 0xff, 0x5f, 0x0d, 0))
  cases++
}
{
  const memory = new Memory()
  memory.write(0x200n, new Uint8Array(336))
  assert.equal(call(memory, entries.prepareCache, [0x200n]), 0n)
  const records = get(memory, 0x240n)
  const lookup = get(memory, 0x250n)
  assert.deepEqual(memory.read(records, 0x13e98), new Uint8Array(0x13e98))
  assert.deepEqual(memory.read(lookup, 0x1fdc), new Uint8Array(0x1fdc).fill(255))
  const before = memory.next
  assert.equal(call(memory, entries.prepareCache, [0x200n]), 0n)
  assert.equal(memory.next, before)
  assert.equal(call(memory, entries.releaseCache, [0x200n]), 7n)
  put(memory, 0x248n, 1n, 4)
  assert.equal(call(memory, entries.releaseCache, [0x200n]), 0n)
  assert.deepEqual(memory.frees, [0n, records, lookup])
  assert.equal(get(memory, 0x240n), 0n)
  assert.equal(get(memory, 0x250n), 0n)
  cases++
}
{
  const memory = new Memory()
  reject(() => call(memory, 1n, [0n]))
  reject(() => call(memory, entries.createEngine, [0n], 17n))
  reject(() => call(memory, entries.createEngine, [0n], 0n))
  put(memory, 0x1068f1664n, 0n, 4)
  reject(() => call(memory, entries.createEngine, [0n]))
  memory.write(0x200n, new Uint8Array(336))
  put(memory, 0x308n, 0x400n)
  put(memory, 0x310n, 65537n, 4)
  reject(() => call(memory, entries.decodeStrings, [0x100n, 0x200n]))
  put(memory, 0x310n, 1n, 4)
  put(memory, 0x100n, 0x200n)
  put(memory, 0x218n, 0x400n)
  memory.write(0x400n, new Uint8Array(44))
  put(memory, 0x408n, 0x1000001n, 4)
  reject(() => call(memory, entries.decodeStrings, [0x100n, 0x200n]))
  put(memory, 0x408n, 1n, 4)
  reject(() => call(memory, entries.decodeStrings, [0x100n, 0x200n]))
  put(memory, 0x218n, 0x310n)
  reject(() => call(memory, entries.decodeStrings, [0x100n, 0x200n]))
}
console.log(JSON.stringify({module_behavior_cases: cases, module_rejection_cases: rejected}))
