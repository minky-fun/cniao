/** Exercise complete public programs, host continuations and failure boundaries without native code. */
const assert = require('node:assert/strict')
const {vmRun} = require(require('node:path').resolve(process.argv[2]))
const bytes = new Uint8Array(65536)
const view = new DataView(bytes.buffer)
const code = 4096n
const context = 8192n
const slots = 12288n
const engine = 16384n
const root = 20480n
const moduleAddress = 24576n
const table = 28672n
const descriptor = 32768n
const memory = {
  /** Reject partial or unmapped reads instead of creating zero-filled VM memory. */
  read(address, width) {
    if (address < 0n || address + BigInt(width) > BigInt(bytes.length)) throw new Error('unmapped')
    return bytes.slice(Number(address), Number(address) + width)
  },
  /** Apply exact program writes, including those visible to a resumed caller. */
  write(address, input) {
    if (address < 0n || address + BigInt(input.length) > BigInt(bytes.length)) throw new Error('unmapped')
    bytes.set(input, Number(address))
  },
}

/** Encode an explicitly selected expanded instruction for a synthetic public program. */
function record(opcode, a = 0, b = 0, c = 0, d = 0, immediate = 0n) {
  const output = new Uint8Array(16)
  const data = new DataView(output.buffer)
  data.setUint32(0, opcode, true)
  output.set([a, b, c, d], 4)
  data.setBigUint64(8, BigInt.asUintN(64, immediate), true)
  return output
}

/** Reset public memory and place only the supplied instructions into the code region. */
function fixture(program) {
  bytes.fill(0)
  program.forEach((item, index) => bytes.set(item, Number(code) + index * 16))
  return {engine, context, code, index: 0n, slots, compareLeft: 0n, compareRight: 0n, integer: engine, errorTarget: 61440n, specialTargets: [], maxInstructions: 64}
}

/** Prepare one real descriptor route; the yielded host must still be supplied by the caller. */
function hostRoute() {
  view.setBigUint64(Number(engine), root, true)
  view.setBigUint64(Number(root), moduleAddress, true)
  view.setBigUint64(Number(moduleAddress) + 0x30, code, true)
  view.setUint32(Number(moduleAddress) + 0x124, 64, true)
  view.setBigUint64(Number(moduleAddress) + 0x128, 49152n, true)
  view.setBigUint64(Number(moduleAddress) + 0x98, table, true)
  view.setUint32(Number(table), 1, true)
  view.setBigUint64(Number(table) + 8, descriptor, true)
  view.setBigUint64(Number(descriptor) + 8, 0x12345678n, true)
  bytes[Number(descriptor) + 17] = 1
}

let cases = 0
for (const opcode of [100, 110, 140, 150]) {
  for (const equal of [false, true]) {
    const immediate = opcode === 110 || opcode === 150
    const state = fixture([
      record(5, 0, 1, 0, 0, equal ? 1n : 2n), record(5, 0, 2, 0, 0, 1n),
      record(opcode, 1, 2, 0, 0, immediate ? 1n : 0n), record(26, 0, 0, 0, 0, 2n),
      record(5, 0, 3, 0, 0, 77n), record(18),
    ])
    const result = vmRun(state, memory).next()
    assert.equal(result.done, true)
    assert.equal(view.getBigUint64(Number(slots) + 24, true), equal ? 77n : 0n)
    assert.equal(view.getBigUint64(Number(context) + 8, true), code + 80n)
    cases++
  }
}
let state = fixture([record(3), record(5, 0, 1, 0, 0, 111n), record(5, 0, 1, 0, 0, 222n), record(18)])
hostRoute()
let execution = vmRun(state, memory)
let step = execution.next()
assert.equal(step.done, false)
assert.equal(step.value.kind, 'host')
assert.equal(view.getBigUint64(Number(slots) + 0x78, true), code)
// The host changes the return record; the resumed VM must read the changed slot.
view.setBigUint64(Number(slots) + 0x78, code + 16n, true)
step = execution.next(0)
assert.equal(step.done, true)
assert.equal(view.getBigUint64(Number(slots) + 8, true), 222n)
assert.equal(step.value.counts[5], 1)
cases++
state = fixture([record(3), record(18)])
hostRoute()
bytes.set(record(18), Number(state.errorTarget))
execution = vmRun(state, memory)
assert.equal(execution.next().done, false)
step = execution.next(22)
assert.equal(step.done, true)
assert.equal(view.getUint32(Number(context) + 0x238, true), 22)
assert.equal(view.getBigUint64(Number(context) + 0xb0, true), state.errorTarget)
assert.equal(view.getBigUint64(Number(context) + 8, true), state.errorTarget)
cases++
let invalid = 0
state = fixture([record(999)])
assert.throws(() => vmRun(state, memory).next(), /Unsupported/)
invalid++
state = fixture([record(26)])
state.maxInstructions = 3
assert.throws(() => vmRun(state, memory).next(), /instruction limit exceeded/)
invalid++
for (const limit of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => vmRun({...state, maxInstructions: limit}, memory).next(), /Invalid/)
  invalid++
}
for (const operand of [-1n, 1n << 64n]) {
  assert.throws(() => vmRun({...state, code: operand}, memory).next(), /outside uint64/)
  invalid++
}
state = fixture([record(18)])
assert.throws(() => vmRun({...state, code: 65536n}, memory).next(), /unmapped/)
invalid++
process.stdout.write(JSON.stringify({runtime_behavior_cases: cases, invalid_cases: invalid}) + '\n')
