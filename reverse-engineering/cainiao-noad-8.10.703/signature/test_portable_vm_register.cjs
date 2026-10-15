/** Check public register boundary cases and rejection without sample records or values. */
const assert = require('node:assert/strict')
const {vmRegister, registerOpcodes} = require(require('node:path').resolve(process.argv[2]))
const state = {pc: 0x1000n, compareLeft: 0n, compareRight: 0n, context: 0x2000n}
let valid = 0
let invalid = 0

/** Construct only a synthetic expanded instruction with public operands. */
function record(opcode, immediate = 0n) {
  const result = new Uint8Array(16)
  const view = new DataView(result.buffer)
  view.setUint32(0, opcode, true)
  result.set([0, 1, 2, 3], 4)
  view.setBigUint64(8, immediate, true)
  return result
}

/** Read public slots and fail on any unexpected access. */
function readSlot(index) {
  if (index === 1) return 0x8000000000000000n
  if (index === 2) return 0xffffffffffffffffn
  throw new Error('unexpected slot')
}

/** Fail when a non-executed path attempts a slot read. */
function noSlot() { throw new Error('unexpected slot') }
assert.equal(registerOpcodes.length, 24)
for (const [opcode, immediate, expected] of [[54, 32n, 0n], [55, 64n, 0x8000000000000000n], [56, 32n, 0n], [57, 63n, 1n], [58, 0n, 0n], [92, 0n, 0n], [92, 0xffffffffffffffffn, 0x8000000000000000n]]) {
  assert.equal(vmRegister(record(opcode, immediate), readSlot, state).slots[0].value, expected)
  valid++
}
const noCopy = vmRegister(record(121), noSlot, {...state, compareRight: 1n})
assert.deepEqual(noCopy.slots, [])
assert.deepEqual(noCopy.registers, {})
valid++
const copied = vmRegister(record(121), readSlot, {...state, compareLeft: 0x100000001n, compareRight: 1n})
assert.equal(copied.slots[0].value, 0x8000000000000000n)
assert.equal(copied.nzcv, 6)
valid++
const wideNoCopy = vmRegister(record(161), noSlot, {...state, compareLeft: 0x100000001n, compareRight: 1n})
assert.deepEqual(wideNoCopy.slots, [])
valid++
assert.equal(vmRegister(record(26, 0xffffffffffffffffn), noSlot, state).next, 0xff0n)
const call = vmRegister(record(15, 1n), noSlot, state)
assert.deepEqual(call.writes.map(write => [write.address, write.bytes.length]), [[0x2010n, 8], [0x2004n, 8]])
assert.deepEqual(call.slots, [{index: 15, value: 0x1000n}])
valid += 2
for (const opcode of [0, 3, 4, 18, 31, 94]) {
  assert.throws(() => vmRegister(record(opcode), noSlot, state), /Unsupported/)
  invalid++
}
for (const key of Object.keys(state)) {
  assert.throws(() => vmRegister(record(25), noSlot, {...state, [key]: -1n}), /outside uint64/)
  assert.throws(() => vmRegister(record(25), noSlot, {...state, [key]: 1n << 64n}), /outside uint64/)
  invalid += 2
}
for (const length of [0, 15, 17]) {
  assert.throws(() => vmRegister(new Uint8Array(length), noSlot, state), /width mismatch/)
  invalid++
}
assert.throws(() => vmRegister(record(54), () => -1n, state), /outside uint64/)
invalid++
process.stdout.write(JSON.stringify({fixed_register_cases: valid, invalid_input_cases: invalid}) + '\n')
