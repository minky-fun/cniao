/** Synthetic public checks for packed expansion, preserved padding and explicit rejection boundaries. */
const assert = require('node:assert/strict')
const {expandPacked} = require(require('node:path').resolve(process.argv[2]))
let cases = 0
let rejections = 0

class Memory {
  /** Map only synthetic module, input words and nonzero output padding. */
  constructor(count = 2, word = 0) {
    this.module = new Uint8Array(336)
    this.input = new Uint8Array(Math.max(12, count * 4 + 8))
    this.output = new Uint8Array(Math.max(16, count * 16)).fill(0xa5)
    this.regions = [[0x1000n, this.module], [0x2000n, this.input], [0x4000n, this.output]]
    const view = new DataView(this.module.buffer)
    view.setBigUint64(0x30, 0x4000n, true)
    view.setUint32(0x124, count, true)
    view.setBigUint64(0x128, 0x2000n, true)
    new DataView(this.input.buffer).setUint32(4, word, true)
    this.writes = 0
  }
  /** Reject every read outside an actually mapped region. */
  read(address, width) {
    for (const [base, bytes] of this.regions) if (address >= base && address + BigInt(width) <= base + BigInt(bytes.length)) return bytes.slice(Number(address - base), Number(address - base) + width)
    throw new Error('Unmapped public expander read')
  }
  /** Require exact mapped writes and retain their count for failure atomicity checks. */
  write(address, bytes) {
    for (const [base, target] of this.regions) if (address >= base && address + BigInt(bytes.length) <= base + BigInt(target.length)) {
      target.set(bytes, Number(address - base)); this.writes++; return
    }
    throw new Error('Unmapped public expander write')
  }
}

/** Count explicit rejections and ensure a failed expansion never commits partial output. */
function reject(memory, action = () => expandPacked(0x1000n, memory)) {
  const before = memory.output.slice()
  const metadata = memory.module.slice()
  assert.throws(action)
  assert.equal(memory.writes, 0)
  assert.deepEqual(memory.output, before)
  assert.deepEqual(memory.module, metadata)
  rejections++
}

// These complete output records were independently compared with the native function on public words.
for (const [word, expected] of [
  [0, '2000000000000000a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5'],
  [0xffffffff, '0a010000a5a53f3fa5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5'],
  [0x80000000, '2000000000000000a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5'],
  [0x12345678, '58010000a52b28a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5'],
]) {
  const memory = new Memory(2, word)
  const before = memory.module.slice()
  const input = memory.input.slice()
  assert.equal(expandPacked(0x1000n, memory), 0n)
  assert.equal(Buffer.from(memory.output).toString('hex'), expected)
  before[16] = 1
  assert.deepEqual(memory.module, before)
  assert.deepEqual(memory.input, input)
  assert.equal(expandPacked(0x1000n, memory), 0n)
  assert.equal(Buffer.from(memory.output).toString('hex'), expected)
  cases++
}
for (const count of [0, 1]) {
  const memory = new Memory(count)
  memory.regions = memory.regions.slice(0, 1)
  assert.equal(expandPacked(0x1000n, memory), 0n)
  assert.equal(memory.module[16], 1)
  assert.equal(memory.writes, 1)
  cases++
}
{
  const memory = new Memory()
  reject(memory, () => expandPacked(0n, memory))
  reject(memory, () => expandPacked(-1n, memory))
  reject(memory, () => expandPacked(0xffff000000000000n, memory))
}
for (const [field, pointer] of [[0x30, 0n], [0x128, 0n], [0x30, 0x2000n], [0x30, 0x1000n], [0x128, 0x1000n], [0x128, 0xffff000000000000n], [0x128, 0xfffefffffffffff8n], [0x30, 0xffff000000000000n]]) {
  const memory = new Memory()
  new DataView(memory.module.buffer).setBigUint64(field, pointer, true)
  reject(memory)
}
{
  const memory = new Memory()
  new DataView(memory.module.buffer).setUint32(0x124, 65537, true)
  reject(memory)
}
for (const region of [0, 1, 2]) {
  const memory = new Memory()
  const [base, bytes] = memory.regions[region]
  memory.regions[region] = [base, bytes.slice(0, region === 0 ? 335 : region === 1 ? 7 : 31)]
  reject(memory)
}
{
  const memory = new Memory(2, 8)
  memory.regions[1] = [0x2000n, memory.input.slice(0, 8)]
  reject(memory)
}
class ViewMemory extends Memory {
  /** Return mapped views to verify that the portable implementation owns its scratch copies. */
  read(address, width) {
    for (const [base, bytes] of this.regions) if (address >= base && address + BigInt(width) <= base + BigInt(bytes.length)) return bytes.subarray(Number(address - base), Number(address - base) + width)
    throw new Error('Unmapped public expander view')
  }
}
{
  const memory = new ViewMemory(2, 8)
  memory.regions[1] = [0x2000n, memory.input.subarray(0, 8)]
  reject(memory)
}
{
  const memory = new ViewMemory(2, 0)
  assert.equal(expandPacked(0x1000n, memory), 0n)
  assert.equal(memory.module[16], 1)
  assert.equal(new DataView(memory.output.buffer).getUint32(0, true), 32)
  cases++
}

console.log(JSON.stringify({public_expander_behavior_cases: cases, public_expander_rejection_cases: rejections}))
