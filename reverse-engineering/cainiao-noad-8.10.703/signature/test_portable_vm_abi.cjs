/** Check public integer ABI boundaries and explicit unsupported formats without native dependencies. */
const assert = require('node:assert/strict')
const {vmIntegerAbiPlan, vmIntegerAbiFinish} = require(require('node:path').resolve(process.argv[2]))
const bytes = new Uint8Array(8192)
const view = new DataView(bytes.buffer)
const context = 256n
const descriptor = 1024n
const signature = 2048n
const overflow = 4096n
const writes = []
const memory = {
  /** Require all synthetic reads to stay within the explicitly allocated public buffer. */
  read(address, width) {
    if (address < 0n || address + BigInt(width) > BigInt(bytes.length)) throw new Error('unmapped')
    return bytes.slice(Number(address), Number(address) + width)
  },
  /** Apply only the requested bytes and record the result width for assertions. */
  write(address, input) {
    if (address < 0n || address + BigInt(input.length) > BigInt(bytes.length)) throw new Error('unmapped')
    writes.push([address, input.length])
    bytes.set(input, Number(address))
  },
}

/** Set an exact public descriptor and type grammar for each independent case. */
function fixture(format, fixed = 0, abi = 1) {
  bytes.fill(0)
  writes.length = 0
  view.setBigUint64(Number(descriptor) + 8, 0x12345678n, true)
  view.setUint8(Number(descriptor) + 18, fixed)
  view.setBigUint64(Number(descriptor) + 24, signature, true)
  view.setUint32(Number(descriptor) + 32, abi, true)
  view.setBigUint64(Number(context) + 0xa8, overflow, true)
  bytes.set(Buffer.from(format + '\0', 'binary'), Number(signature))
}

let cases = 0
fixture('i|pxpii', 3)
for (let index = 0; index < 5; index++) view.setBigUint64(Number(context) + 0x78 + index * 8, BigInt(index + 1), true)
let plan = vmIntegerAbiPlan(context, descriptor, memory)
assert.deepEqual(plan.arguments, [1n, 2n, 3n])
assert.deepEqual(plan.stack.map(item => [item.offset, [...item.bytes]]), [[0, [4, 0, 0, 0]], [8, [5, 0, 0, 0]]])
assert.equal(vmIntegerAbiFinish(plan, 0x80000000n, memory), 0)
assert.equal(view.getBigUint64(Number(context) + 0x78, true), 0xffffffff80000000n)
assert.deepEqual(writes, [[context + 0x78n, 8]])
cases++
fixture('x|ixxxxxx')
view.setBigUint64(Number(context) + 0x78, 0x80000000n, true)
view.setBigUint64(Number(overflow) + 0xb0, 0xabcdef0123456789n, true)
plan = vmIntegerAbiPlan(context, descriptor, memory)
assert.equal(plan.arguments.length, 7)
assert.equal(plan.arguments[0], 0xffffffff80000000n)
assert.equal(plan.arguments[6], 0xabcdef0123456789n)
assert.deepEqual(plan.stack, [])
cases++
for (const terminator of ['\0', '\x16', '\x17', '.', '|']) {
  fixture('i\x17p' + terminator + '{unsupported-after-terminator')
  plan = vmIntegerAbiPlan(context, descriptor, memory)
  assert.equal(plan.arguments.length, 1)
  assert.equal(plan.result.width, 4)
  assert.equal(vmIntegerAbiFinish(plan, 1n, memory), 0)
  assert.deepEqual(writes, [[context + 0x78n, 8]])
  cases++
}
fixture('i|', 0, 2)
plan = vmIntegerAbiPlan(context, descriptor, memory)
assert.deepEqual(plan.arguments, [])
cases++
let invalid = 0
for (const format of ['f|p', 'v|p', 'i|d', 'i|{8ii}', 'i|v', 'i:p', 'i|z', 'i|' + 'p'.repeat(257)]) {
  fixture(format)
  assert.throws(() => vmIntegerAbiPlan(context, descriptor, memory), /Unsupported|exceeds/)
  invalid++
}
for (const [format, fixed, abi] of [['i|p', 2, 1], ['i|p', 255, 1], ['i|p', 0, 3], ['i|pc', 1, 1]]) {
  fixture(format, fixed, abi)
  assert.throws(() => vmIntegerAbiPlan(context, descriptor, memory), /Unsupported|exceeds/)
  invalid++
}
fixture('i|p')
view.setBigUint64(Number(descriptor) + 24, 0n, true)
assert.throws(() => vmIntegerAbiPlan(context, descriptor, memory), /Missing/)
invalid++
for (let index = 0; index < 2; index++) {
  for (const bad of [-1n, 0n, 1n << 64n]) {
    const pointers = [context, descriptor]
    pointers[index] = bad
    assert.throws(() => vmIntegerAbiPlan(...pointers, memory), /outside nonzero uint64/)
    invalid++
  }
}
for (const bad of [-1n, 1n << 64n]) {
  assert.throws(() => vmIntegerAbiFinish(plan, bad, memory), /outside uint64/)
  invalid++
}
fixture('i|p')
assert.throws(() => vmIntegerAbiPlan(context, descriptor, {
  /** Deliberately return a truncated field to verify width rejection. */
  read() { return new Uint8Array(0) },
  write: memory.write,
}), /width mismatch/)
invalid++
process.stdout.write(JSON.stringify({abi_behavior_cases: cases, invalid_cases: invalid}) + '\n')
