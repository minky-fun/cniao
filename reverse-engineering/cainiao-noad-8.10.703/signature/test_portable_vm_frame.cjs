/** Exercise frame round-trip and explicit failure with synthetic public memory. */
const assert = require('node:assert/strict')
const {vmFrame} = require(require('node:path').resolve(process.argv[2]))
const bytes = new Uint8Array(1024)
const view = new DataView(bytes.buffer)
const memory = {
  /** Expose only the synthetic range and return a copy for native paired access. */
  read(address, width) {
    if (address < 0n || address + BigInt(width) > 1024n) throw new Error('unmapped')
    return bytes.slice(Number(address), Number(address) + width)
  },
  /** Apply exact paired writes within the synthetic range. */
  write(address, input) {
    if (address < 0n || address + BigInt(input.length) > 1024n) throw new Error('unmapped')
    bytes.set(input, Number(address))
  },
}
for (let index = 0; index < 32; index++) view.setBigUint64(index * 8, BigInt(index + 100), true)
view.setBigUint64(14 * 8, 512n, true)
view.setBigUint64(15 * 8, 4096n, true)
const before = bytes.slice(0, 256)
const entered = vmFrame(31, 0n, 8192n, 144n, 9n, 10n, memory)
assert.equal(entered.next, 8208n)
assert.equal(view.getBigUint64(14 * 8, true), 656n)
const returned = vmFrame(0, 0n, 8208n, 0n, 10n, 11n, memory)
assert.equal(returned.next, 4112n)
assert.deepEqual(bytes.slice(0, 256), before)
let invalid = 0
for (const opcode of [-1, 1, 18]) {
  assert.throws(() => vmFrame(opcode, 0n, 0n, 0n, 0n, 0n, memory), /Unsupported/)
  invalid++
}
for (let index = 0; index < 5; index++) {
  for (const value of [-1n, 1n << 64n]) {
    const operands = [0n, 0n, 0n, 0n, 0n]
    operands[index] = value
    assert.throws(() => vmFrame(31, ...operands, memory), /outside uint64/)
    invalid++
  }
}
assert.throws(() => vmFrame(31, 2048n, 0n, 0n, 0n, 0n, memory), /unmapped/)
invalid++
process.stdout.write(JSON.stringify({frame_round_trip_cases: 1, invalid_input_and_memory_cases: invalid}) + '\n')
