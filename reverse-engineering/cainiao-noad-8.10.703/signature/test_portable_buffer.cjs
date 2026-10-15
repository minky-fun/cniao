/** Independent buffer contracts and explicit unsupported-path checks. */
const assert = require('node:assert/strict')
const {bufferCall, bufferEntries: e, stringCall, stringEntries: s} = require(require('node:path').resolve(process.argv[2]))
const bytes = new Uint8Array(0x20000)
let cursor = 0x1000
let allocations = 0
let failAt = 0
let released = []
const memory = {
  /** Return a copied exact range and reject inaccessible native addresses. */
  read(address, width) {
    const offset = Number(address)
    assert.ok(Number.isSafeInteger(offset) && offset >= 0 && offset + width <= bytes.length)
    return bytes.slice(offset, offset + width)
  },
  /** Apply aliased changes immediately as guest writes would. */
  write(address, source) {
    const offset = Number(address)
    assert.ok(Number.isSafeInteger(offset) && offset >= 0 && offset + source.length <= bytes.length)
    bytes.set(source, offset)
  },
}
const blocks = new Map()
const heap = {
  /** Poison fresh allocations to make required clearing observable. */
  allocate(size) {
    if (++allocations === failAt) return 0n
    const result = BigInt(cursor)
    cursor += Math.max(16, (size + 15) & ~15)
    assert.ok(cursor < bytes.length)
    bytes.fill(0xa5, Number(result), Number(result) + size)
    blocks.set(result, size)
    return result
  },
  /** Move data with the same explicit copy length as the validation adapter. */
  reallocate(address, size) {
    const result = this.allocate(size)
    if (result) memory.write(result, memory.read(address, Math.min(size, blocks.get(address))))
    return result
  },
  /** Preserve a visible nonzero free result for destructor ABI coverage. */
  free(address) { released.push(address); return 0x1234n },
}

/** Invoke exactly one supported entry with the explicit synthetic heap. */
function call(name, ...args) { return bufferCall(e[name], args, memory, heap) }

let behaviors = 0
let invalid = 0
const object = call('create', 4n)
const view = new DataView(bytes.buffer)
assert.equal(view.getUint32(Number(object) + 8, true), 0)
assert.equal(view.getUint32(Number(object) + 12, true), 4)
assert.equal(view.getBigUint64(Number(object) + 16, true), e.append)
behaviors++
assert.equal(call('byte', object, 0x1ffn), object)
assert.equal(call('get', object, 0n, 0n), 255n)
assert.equal(call('byte', object, 1n), object)
assert.equal(call('byte', object, 2n), object)
assert.equal(call('byte', object, 3n), 0n)
assert.equal(view.getUint32(Number(object) + 12, true), 105)
behaviors++
const data = view.getBigUint64(Number(object), true)
assert.deepEqual([...memory.read(data, 5)], [255, 1, 2, 3, 0])
assert.equal(call('find', object, 0n, 511n), 0xffffffffn)
assert.equal(call('find', object, 0n, 255n), 0n)
behaviors++
failAt = allocations + 1
const before = memory.read(object, 104)
assert.equal(call('grow', object, 10n), 0xffffffffn)
assert.deepEqual(memory.read(object, 104), before)
behaviors++
failAt = allocations + 2
released = []
assert.equal(call('create', 8n), 0n)
assert.equal(released.length, 1)
behaviors++
assert.equal(call('destroy', object), 0x1234n)
assert.deepEqual(released.slice(-2), [data, object])
behaviors++

for (const [entry, args] of [
  [0x102abf47cn, [object, 0n]], [1n, [0n]], [e.append, [object]],
  [e.byte, [-1n, 1n]], [e.byte, [1n << 64n, 1n]],
  [e.create, [0x1000001n]],
]) {
  assert.throws(() => bufferCall(entry, args, memory, heap))
  invalid++
}
assert.throws(() => bufferCall(e.get, [object, 0n, 0n], {
  /** Deliberately truncate a field so the runtime must reject the memory adapter. */
  read() { return new Uint8Array(0) },
  /** Any write in this malformed read test is an error. */
  write() { throw new Error('Unexpected write') },
}, heap))
invalid++
const source = 0x100n
bytes.fill(1, Number(source), Number(source) + 8192)
assert.throws(() => call('fromCString', source))
invalid++
let strings = 0
const text = stringCall(s.create, [], memory, heap)
assert.equal(view.getUint32(Number(text) + 12, true), 128)
assert.equal(view.getBigUint64(Number(text) + 48, true), s.clear)
assert.equal(stringCall(s.byte, [text, 0n], memory, heap), text)
assert.equal(view.getUint32(Number(text) + 8, true), 0)
strings++
bytes.set([65, 0, 66, 0], 0x100)
stringCall(s.append, [text, 0x100n, 3n], memory, heap)
assert.equal(view.getUint32(Number(text) + 8, true), 0)
stringCall(s.cstring, [text, 0x100n], memory, heap)
assert.equal(view.getUint32(Number(text) + 8, true), 1)
strings++
bytes.fill(65, 0x100, 0x100 + 127)
bytes[0x100 + 127] = 0
stringCall(s.append, [text, 0x100n, 127n], memory, heap)
assert.equal(view.getUint32(Number(text) + 12, true), 256)
assert.equal(view.getUint32(Number(text) + 8, true), 128)
strings++
failAt = allocations + 1
view.setUint32(Number(text) + 8, 255, true)
assert.throws(() => stringCall(s.byte, [text, 65n], memory, heap))
assert.equal(view.getBigUint64(Number(text), true), 0n)
assert.equal(view.getUint32(Number(text) + 8, true), 255)
strings++
for (const [entry, args] of [[0x102a72688n, [text, 0n]], [s.append, [text]], [s.byte, [-1n, 1n]]]) {
  assert.throws(() => stringCall(entry, args, memory, heap))
  invalid++
}
console.log(JSON.stringify({buffer_behavior_cases: behaviors, string_behavior_cases: strings, object_invalid_cases: invalid}))
