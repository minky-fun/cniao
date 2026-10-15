/** Verify native crypto ABI side effects and explicit unsupported boundaries on public inputs. */
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const {standardCall, standardEntries: e} = require(require('node:path').resolve(process.argv[2]))
const blocks = new Map([[0n, new Uint8Array(0x10000)], [0x1068f9000n, new Uint8Array(8192)]])
let cursor = 0x10000n
let fail = false
const freed = []
const memory = {
  /** Return exactly one synthetic range, rejecting missing mappings and truncated reads. */
  read(address, width) {
    if (!width) return new Uint8Array(0)
    for (const [base, bytes] of blocks) {
      if (base <= address && address + BigInt(width) <= base + BigInt(bytes.length)) return bytes.slice(Number(address - base), Number(address - base) + width)
    }
    throw new Error('Synthetic read outside mapping')
  },
  /** Apply writes immediately to make descriptor, scratch and alphabet changes observable. */
  write(address, source) {
    for (const [base, bytes] of blocks) {
      if (base <= address && address + BigInt(source.length) <= base + BigInt(bytes.length)) {
        bytes.set(source, Number(address - base))
        return
      }
    }
    throw new Error('Synthetic write outside mapping')
  },
}
const heap = {
  /** Allocate poisoned test blocks or inject a real null allocation. */
  allocate(size) {
    if (fail) return 0n
    const address = cursor
    cursor += BigInt((size + 15) & ~15)
    blocks.set(address, new Uint8Array(size).fill(0xa5))
    return address
  },
  /** None of these primitive entry points is allowed to call realloc. */
  reallocate() { throw new Error('Unexpected crypto realloc') },
  /** Save only synthetic release addresses and expose a nonzero ignored free result. */
  free(address) { freed.push(address); return 0x55n },
}
const stack = 0x700001000n
const source = 0x1000n, output = 0x2000n, descriptor = 0x3000n, key = 0x5000n
let behaviors = 0, invalid = 0
memory.write(source, Uint8Array.from([97, 98, 99, 0, 100]))
assert.equal(standardCall(e.md5, [source, 0n, output], stack, memory, heap), stack - 0x88n)
assert.deepEqual(Buffer.from(memory.read(output, 16)), crypto.createHash('md5').update('abc').digest())
behaviors++
memory.write(output, new Uint8Array(128).fill(0xa5))
assert.equal(standardCall(e.sha1, [source, 3n, output, 19n], stack, memory, heap), 0n)
assert.deepEqual([...memory.read(output, 20)], new Array(20).fill(0xa5))
behaviors++
assert.equal(standardCall(e.base64, [0n, 0n, 0n, 0n], stack, memory, heap), 0xffffffffn)
assert.equal(memory.read(0x1068f9da5n, 1)[0], 1)
assert.equal(Buffer.from(memory.read(0x1068f9d65n, 64)).toString('ascii'), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')
assert.equal(standardCall(e.base64, [source, 3n, output, 4n], stack, memory, heap), 4n)
assert.equal(Buffer.from(memory.read(output, 5)).toString('hex'), '59574a6aa5')
behaviors++
assert.equal(standardCall(e.crc, [0n, 0n], stack, memory, heap), 0n)
assert.equal(memory.read(0x1068f91f1n, 1)[0], 1)
memory.write(source, Buffer.from('123456789'))
assert.equal(standardCall(e.crc, [source, 9n], stack, memory, heap), 0x2dfd2d88n)
behaviors++
const raw = new Uint8Array(64)
const view = new DataView(raw.buffer)
view.setBigUint64(0, key, true)
view.setUint32(8, 3, true)
view.setBigUint64(16, source, true)
view.setUint32(24, 9, true)
view.setBigUint64(32, output, true)
view.setUint32(40, 20, true)
memory.write(descriptor, raw)
memory.write(key, Buffer.from('key'))
fail = true
assert.equal(standardCall(e.hmac, [descriptor], stack, memory, heap), 0n)
assert.equal(freed.length, 0)
fail = false
assert.equal(standardCall(e.hmac, [descriptor], stack, memory, heap), 20n)
assert.deepEqual(Buffer.from(memory.read(output, 20)), crypto.createHmac('sha1', 'key').update('123456789').digest())
assert.equal(freed.length, 1)
assert.equal(memory.read(freed[0] + 84n, 1)[0], 0xa5)
behaviors++
for (const [entry, args, sp] of [
  [1n, [source], stack], [e.hmac, [], stack], [e.sha1, [source, 1n, output], stack],
  [e.md5, [source, 3n, output], 0n], [e.md5, [source, 3n, output], stack + 1n],
  [e.md5, [source, 0x1000001n, output], stack], [e.sha1, [-1n, 1n, output, 20n], stack],
  [e.crc, [source, 0x1000001n], stack],
  [e.base64, [source, 3n, source + 1n, 4n], stack],
  [e.base64, [source, 3n, 0x1068f9d65n, 4n], stack],
]) {
  assert.throws(() => standardCall(entry, args, sp, memory, heap))
  invalid++
}
view.setBigUint64(48, descriptor, true)
view.setUint32(56, 4096, true)
memory.write(descriptor, raw)
assert.throws(() => standardCall(e.hmac, [descriptor], stack, memory, heap))
invalid++
assert.throws(() => standardCall(e.hmac, [descriptor], stack, {
  /** Deliberately return a truncated descriptor field to verify strict memory contracts. */
  read() { return new Uint8Array(0) },
  /** A truncated descriptor read must never reach a write. */
  write() { throw new Error('Unexpected write') },
}, heap))
invalid++
console.log(JSON.stringify({crypto_host_behavior_cases: behaviors, crypto_host_invalid_cases: invalid}))
