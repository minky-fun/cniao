/** Test fixed branch flags, lazy displacement access and uint64 boundaries with public inputs. */
const assert = require('node:assert/strict')
const {vmBranch, branchOperations} = require(require('node:path').resolve(process.argv[2]))
let valid = 0
let invalid = 0

/** Fail if a branch that skips the displacement tries to read it. */
function noDisplacement() { throw new Error('unexpected displacement access') }

/** Return a fixed public displacement after checking the requested record address. */
function displacementAt(address, value) {
  /** Verify the core requests only the next expanded instruction's immediate. */
  return target => {
    assert.equal(target, address)
    return value
  }
}

assert.equal(Object.keys(branchOperations).length, 22)
assert.deepEqual(vmBranch(100, 1n, 1n, 0x1000n, noDisplacement), {next: 0x1020n, nzcv: 6, usedDisplacement: false})
assert.deepEqual(vmBranch(100, 0x100000001n, 1n, 0x1000n, noDisplacement), {next: 0x1020n, nzcv: 6, usedDisplacement: false})
assert.deepEqual(vmBranch(145, 0x7fffffffffffffffn, 0xffffffffffffffffn, 0x1000n, noDisplacement), {next: 0x1020n, nzcv: 9, usedDisplacement: false})
assert.deepEqual(vmBranch(145, 0x8000000000000000n, 1n, 0x1000n, displacementAt(0x1018n, 3n)), {next: 0x1040n, nzcv: 3, usedDisplacement: true})
assert.deepEqual(vmBranch(100, 0n, 1n, 0x1000n, displacementAt(0x1018n, 0xffffffffffffffffn)), {next: 0x1000n, nzcv: 8, usedDisplacement: true})
assert.deepEqual(vmBranch(100, 0n, 1n, 0x1000n, displacementAt(0x1018n, 0n)), {next: 0x1010n, nzcv: 8, usedDisplacement: true})
assert.deepEqual(vmBranch(140, 0n, 0n, 0xfffffffffffffff0n, noDisplacement), {next: 0x10n, nzcv: 6, usedDisplacement: false})
assert.deepEqual(vmBranch(140, 0n, 1n, 0xfffffffffffffff0n, displacementAt(8n, 0xffffffffffffffffn)), {next: 0xfffffffffffffff0n, nzcv: 8, usedDisplacement: true})
valid += 8
for (const opcode of [0, 104, 106, 149, -1, NaN]) {
  assert.throws(() => vmBranch(opcode, 0n, 0n, 0n, noDisplacement), /Unsupported/)
  invalid++
}
for (const operands of [[-1n, 0n, 0n], [0n, -1n, 0n], [0n, 0n, -1n], [1n << 64n, 0n, 0n], [0n, 1n << 64n, 0n], [0n, 0n, 1n << 64n]]) {
  assert.throws(() => vmBranch(100, ...operands, noDisplacement), /outside uint64/)
  invalid++
}
for (const displacement of [-1n, 1n << 64n]) {
  assert.throws(() => vmBranch(100, 0n, 1n, 0n, displacementAt(24n, displacement)), /displacement is outside/)
  invalid++
}
process.stdout.write(JSON.stringify({fixed_branch_cases: valid, invalid_input_cases: invalid}) + '\n')
