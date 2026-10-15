/** Check unsupported boundaries, short reads, raw FP bits and exact guard read order. */
const assert = require('node:assert/strict')
const {vmHostPlan, vmHostFinish, vmSetCallDescriptor, vmCommonFunction, vmDispatchBridge} = require(require('node:path').resolve(process.argv[2]))
const bytes = new Uint8Array(1024)
const view = new DataView(bytes.buffer)
const reads = []
const writes = []
const memory = {
  /** Reject unmapped access and record only public synthetic reads. */
  read(address, width) {
    if (address < 0n || address + BigInt(width) > 1024n) throw new Error('unmapped')
    reads.push([address, width])
    return bytes.slice(Number(address), Number(address) + width)
  },
  /** Apply exact public memory writes and keep their widths for assertions. */
  write(address, input) {
    if (address < 0n || address + BigInt(input.length) > 1024n) throw new Error('unmapped')
    writes.push([address, input.length])
    bytes.set(input, Number(address))
  },
}
let cases = 0
for (const pointers of [[0n, 1n, 2n], [1n, 0n, 2n], [1n, 2n, 0n]]) {
  assert.deepEqual(vmHostPlan(...pointers, memory), {kind: 'return', status: 7})
  assert.deepEqual(reads, [])
  cases++
}
view.setBigUint64(8, 128n, true)
view.setBigUint64(256 + 8, 999n, true)
view.setUint32(256 + 36, 0, true)
assert.deepEqual(vmHostPlan(8n, 512n, 256n, memory), {kind: 'marshal', descriptor: 256n})
cases++
for (const selector of [6, 0xffffffff]) {
  view.setUint32(256 + 36, selector, true)
  reads.length = 0
  assert.deepEqual(vmHostPlan(8n, 512n, 256n, memory), {kind: 'return', status: 22})
  assert.equal(reads.length, 4)
  cases++
}
bytes[256 + 17] = 255
assert.deepEqual(vmHostPlan(8n, 512n, 256n, memory), {kind: 'call', target: 999n, arguments: [8n, 512n]})
cases++
bytes[256 + 17] = 0
view.setUint32(256 + 36, 3, true)
bytes.fill(0xa5, 512 + 0x138, 512 + 0x140)
const plan = vmHostPlan(8n, 512n, 256n, memory)
assert.equal(plan.result.source, 'floating')
assert.equal(vmHostFinish(plan, 0n, 0x7ff80000ffc01234n, memory), 0)
assert.equal(view.getUint32(512 + 0x138, true), 0xffc01234)
assert.equal(view.getUint32(512 + 0x13c, true), 0xa5a5a5a5)
cases++
view.setBigUint64(512 + 0x78, 888n, true)
view.setUint32(128 + 24, 0, true)
vmSetCallDescriptor(8n, 512n, memory)
assert.equal(view.getBigUint64(512 + 16, true), 888n)
cases++
view.setBigUint64(40, 0x123456789abcdef0n, true)
assert.equal(vmCommonFunction(0xffffffff00000003n, 16n, memory), 0x123456789abcdef0n)
cases++
reads.length = 0
assert.deepEqual(vmDispatchBridge(0n, 0n, 900n, memory), {kind: 'return', value: 0n})
assert.deepEqual(reads, [])
cases++
assert.deepEqual(vmDispatchBridge(0n, 64n, 900n, memory), {kind: 'return', value: 0n})
assert.equal(view.getUint32(64, true), 1)
cases++
view.setBigUint64(400, 0x8000000000000000n, true)
view.setBigUint64(408, 1n, true)
view.setBigUint64(416, 2n, true)
view.setBigUint64(424, 0xaabbccdd00000003n, true)
view.setBigUint64(432, 4n, true)
view.setBigUint64(128 + 16, 777n, true)
assert.deepEqual(vmDispatchBridge(400n, 64n, 8n, memory), {kind: 'call', target: 777n, arguments: [0x8000000000000000n, 1n, 2n, 3n, 4n, 64n]})
cases++
let invalid = 0
for (let index = 0; index < 3; index++) {
  for (const bad of [-1n, 1n << 64n]) {
    const pointers = [8n, 512n, 256n]
    pointers[index] = bad
    assert.throws(() => vmHostPlan(...pointers, memory), /outside uint64/)
    invalid++
  }
}
for (let index = 0; index < 2; index++) {
  for (const bad of [-1n, 1n << 64n]) {
    const pointers = [8n, 512n]
    pointers[index] = bad
    assert.throws(() => vmSetCallDescriptor(...pointers, memory), /outside uint64/)
    invalid++
  }
}
for (const bad of [-1n, 1n << 64n]) {
  assert.throws(() => vmHostFinish(plan, 0n, bad, memory), /outside uint64/)
  invalid++
}
assert.throws(() => vmHostPlan(8n, 512n, 256n, {read: () => new Uint8Array(0), write: memory.write}), /width mismatch/)
invalid++
assert.throws(() => vmHostPlan(2048n, 512n, 256n, memory), /unmapped/)
invalid++
for (let index = 0; index < 2; index++) {
  for (const bad of [-1n, 1n << 64n]) {
    const operands = [0n, 16n]
    operands[index] = bad
    assert.throws(() => vmCommonFunction(...operands, memory), /outside uint64/)
    invalid++
  }
}
assert.throws(() => vmCommonFunction(0xffffffffn, 16n, memory), /unmapped/)
invalid++
for (let index = 0; index < 3; index++) {
  for (const bad of [-1n, 1n << 64n]) {
    const operands = [0n, 0n, 8n]
    operands[index] = bad
    assert.throws(() => vmDispatchBridge(...operands, memory), /outside uint64/)
    invalid++
  }
}
process.stdout.write(JSON.stringify({host_boundary_cases: cases, invalid_cases: invalid}) + '\n')
