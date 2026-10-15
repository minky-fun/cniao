/** Exercise scalar rejection and fixed unsigned boundary examples without sample material. */
const assert = require('node:assert/strict')
const {vmScalar, scalarOpcodes} = require(require('node:path').resolve(process.argv[2]))
assert.deepEqual(scalarOpcodes, [34, 38, 39, 40, 42, 43])
assert.equal(vmScalar(34, 0xffffffffffffffffn, 1n), 0n)
assert.equal(vmScalar(38, 0x100000000n, 1n), 0x100000001n)
assert.equal(vmScalar(39, 0x8000000000000000n, 1n), 0x8000000000000001n)
assert.equal(vmScalar(40, 0xffffffffffffffffn, 0n), 0xffffffffn)
assert.equal(vmScalar(42, 0xffffffffffffffffn, 0xffffffffffffffffn), 0xffffffffn)
assert.equal(vmScalar(43, 0xffffffffffffffffn, 0xffffffffffffffffn), 0xffffffffffffffffn)
for (const opcode of [-1, 0, 35, 159, 999, NaN]) {
  assert.throws(() => vmScalar(opcode, 0n, 0n), /Unsupported/)
}
for (const [left, right] of [[-1n, 0n], [0n, -1n], [1n << 64n, 0n], [0n, 1n << 64n]]) {
  assert.throws(() => vmScalar(34, left, right), /outside uint64/)
}
process.stdout.write(JSON.stringify({fixed_boundary_cases: 6, invalid_input_cases: 10}) + '\n')
