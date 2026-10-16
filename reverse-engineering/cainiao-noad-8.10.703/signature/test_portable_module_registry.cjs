/** Public checks for lock injection, list resizing, failure behavior and exact table ownership. */
const assert = require('node:assert/strict')
const {registryCall, registryEntries: entries} = require(require('node:path').resolve(process.argv[2]))
let behavior = 0, rejected = 0

class Memory {
  /** Supply a bounded public arena and an explicit allocator with failure injection. */
  constructor() {
    this.bytes = new Uint8Array(0x80000).fill(0xa5)
    this.next = 0x1000
    this.allocations = new Map()
    this.frees = []
    this.attempts = 0
    this.failAt = -1
    this.events = []
    this.active = undefined
  }
  /** Return shared mapped bytes and reject every out-of-range access. */
  read(address, width) {
    if (address < 0n || address + BigInt(width) > BigInt(this.bytes.length)) throw new Error('Public registry read outside arena')
    return this.bytes.subarray(Number(address), Number(address) + width)
  }
  /** Mutate exactly the requested public memory range. */
  write(address, bytes) { this.read(address, bytes.length).set(bytes) }
  /** Allocate padded distinct blocks, preserving observable allocation failures. */
  allocate(size) {
    this.attempts++
    if (this.attempts === this.failAt) return 0n
    const pointer = BigInt(this.next)
    this.next += Math.max(16, (size + 15) & ~15)
    if (this.next >= this.bytes.length) throw new Error('Public registry heap exhausted')
    this.allocations.set(pointer, size)
    return pointer
  }
  /** Copy only valid old bytes when moving a public allocation. */
  reallocate(pointer, size) {
    const replacement = this.allocate(size)
    if (replacement && pointer) this.write(replacement, this.read(pointer, Math.min(size, this.allocations.get(pointer))))
    return replacement
  }
  /** Record frees in native order without recycling storage. */
  free(pointer) { this.frees.push(pointer); return 0n }
  /** Require lock acquisition before any matching release. */
  lock(address, mode) {
    assert.equal(this.active, undefined)
    this.active = address
    this.events.push([address, mode])
  }
  /** Check that the exact acquired lock is released after each operation. */
  unlock(address) {
    assert.equal(this.active, address)
    this.active = undefined
    this.events.push([address, 'unlock'])
  }
  /** Store public native-width metadata. */
  put(address, value, width = 8) {
    const bytes = this.read(address, width)
    const view = new DataView(bytes.buffer, bytes.byteOffset, width)
    if (width === 8) view.setBigUint64(0, value, true)
    else view.setUint32(0, Number(value), true)
  }
  /** Inspect public native-width metadata. */
  get(address, width = 8) {
    const bytes = this.read(address, width)
    const view = new DataView(bytes.buffer, bytes.byteOffset, width)
    return width === 8 ? view.getBigUint64(0, true) : BigInt(view.getUint32(0, true))
  }
}

/** Invoke registry operations with an explicit, observable synchronization provider. */
function call(memory, entry, args) { return registryCall(entry, args, memory, memory, memory) }

/** Prepare one public list with independent logical capacity and mapped backing size. */
function list(memory, capacity, values) {
  const pointer = memory.allocate(128)
  memory.put(0x100n, pointer)
  memory.put(0x108n, BigInt(capacity), 4)
  memory.put(0x10cn, BigInt(values.length), 4)
  for (let index = 0; index < values.length; index++) memory.put(pointer + BigInt(index * 8), BigInt(values[index]))
  return pointer
}
{
  const memory = new Memory()
  memory.write(0x100n, new Uint8Array(32))
  assert.equal(call(memory, entries.createTable, [0x100n, 0x108n, 0x110n]), 0n)
  const index = memory.get(0x100n), records = memory.get(0x108n)
  assert.deepEqual(memory.read(index, 0x1fdc), new Uint8Array(0x1fdc).fill(255))
  assert.deepEqual(memory.read(records, 0xbf28), new Uint8Array(0xbf28))
  const before = memory.attempts
  assert.equal(call(memory, entries.createTable, [0x100n, 0x108n, 0x110n]), 0n)
  assert.equal(memory.attempts, before)
  const first = memory.allocate(16), second = memory.allocate(16)
  memory.put(records, first); memory.put(records + 24n, second); memory.put(0x110n, 2n, 4)
  assert.equal(call(memory, entries.destroyTable, [0x100n, 0x108n, 0x110n]), 0n)
  assert.deepEqual(memory.frees, [first, second, records, index])
  assert.equal(memory.get(0x100n), 0n)
  assert.equal(memory.get(0x108n), 0n)
  assert.equal(memory.get(0x110n, 4), 0n)
  assert.deepEqual(memory.events, [])
  behavior++
}
for (const failure of [1, 2]) {
  const memory = new Memory()
  memory.write(0x100n, new Uint8Array(32))
  memory.failAt = failure
  assert.equal(call(memory, entries.createTable, [0x100n, 0x108n, 0x110n]), 5n)
  assert.equal(memory.attempts, 2)
  assert.equal(memory.frees.length, 2)
  assert.equal(memory.get(0x100n), 0n)
  assert.equal(memory.get(0x108n), 0n)
  behavior++
}
for (const failure of [false, true]) {
  const memory = new Memory()
  const original = list(memory, 4, [101, 102, 103, 104])
  if (failure) memory.failAt = memory.attempts + 1
  assert.equal(call(memory, entries.append, [0x100n, 105n]), 4n)
  assert.equal(memory.get(0x10cn, 4), 5n)
  assert.equal(memory.get(0x108n, 4), failure ? 4n : 8n)
  assert.equal(memory.get(memory.get(0x100n) + 32n), 105n)
  assert.equal(memory.get(0x100n) === original, failure)
  assert.deepEqual(memory.events, [[0x110n, 'write'], [0x110n, 'unlock']])
  behavior++
}
{
  const memory = new Memory()
  list(memory, 8, [101, 102, 103])
  assert.equal(call(memory, entries.remove, [0x100n, 102n]), 1n)
  const pointer = memory.get(0x100n)
  assert.equal(memory.get(0x108n, 4), 4n)
  assert.equal(memory.get(0x10cn, 4), 2n)
  assert.equal(memory.get(pointer), 101n)
  assert.equal(memory.get(pointer + 8n), 103n)
  assert.equal(memory.get(pointer + 16n), 0n)
  assert.equal(call(memory, entries.get, [0x100n, 0x100000001n]), 103n)
  assert.equal(call(memory, entries.get, [0x100n, 0xffffffffn]), 0n)
  assert.equal(call(memory, entries.remove, [0x100n, 999n]), 0xffffffffn)
  assert.deepEqual(memory.events, [[0x110n, 'write'], [0x110n, 'unlock'], [0x110n, 'read'], [0x110n, 'unlock'], [0x110n, 'read'], [0x110n, 'unlock'], [0x110n, 'write'], [0x110n, 'unlock']])
  behavior++
}
{
  const memory = new Memory()
  for (const [entry, args] of [[1n, [0n]], [entries.append, []], [entries.append, [0x100n, -1n]], [entries.append, [0x100n, 1n << 64n]], [entries.append, [0n, 0n]]]) {
    assert.throws(() => call(memory, entry, args)); rejected++
  }
  assert.deepEqual(memory.events, [])
  memory.put(0x10cn, 65537n, 4)
  assert.throws(() => call(memory, entries.get, [0x100n, 0n]), /count exceeds/)
  assert.deepEqual(memory.events, [[0x110n, 'read'], [0x110n, 'unlock']])
  rejected++
}
console.log(JSON.stringify({registry_behavior_cases: behavior, registry_rejection_cases: rejected}))
