/** Validate memory boundaries and exact access behavior with public synthetic data only. */
const assert = require('node:assert/strict')
const {vmMemory, memoryOperations} = require(require('node:path').resolve(process.argv[2]))
let valid = 0
let invalid = 0

/** Return an isolated range whose access checks reject unmapped, crossing and read-only writes. */
function arena(base, bytes, writable = true) {
  return {
    /** Resolve an exact range using bigint before converting the bounded offset to Number. */
    position(address, width) {
      const relative = address - base
      if (relative < 0n || relative + BigInt(width) > BigInt(bytes.length)) throw new Error('range')
      return Number(relative)
    },
    /** Supply a copy so a read cannot mutate mapped memory. */
    read(address, width) {
      const position = this.position(address, width)
      return bytes.slice(position, position + width)
    },
    /** Reject writes to read-only ranges and preserve bytes outside the exact width. */
    write(address, input) {
      if (!writable) throw new Error('read-only')
      bytes.set(input, this.position(address, input.length))
    },
  }
}

const expectedOpcodes = [60, 62, 63, 67, 68, 70, 71, 73, 75, 76, 78, 79, 81, 82, 83, 84]
assert.deepEqual(Object.keys(memoryOperations).map(Number), expectedOpcodes)
const high = 0x20000000000001n
for (const opcode of expectedOpcodes) {
  const operation = memoryOperations[opcode]
  const bytes = new Uint8Array(16).fill(0xff)
  const memory = arena(high, bytes)
  if (operation.store) {
    const value = 0x8877665544332211n
    const result = vmMemory(opcode, high, 1n, value, memory)
    assert.equal(result, operation.width < 4 ? BigInt.asUintN(operation.width * 8, value) : value)
    assert.equal(bytes[0], 255)
    assert.equal(bytes[operation.width + 1], 255)
    assert.deepEqual(Array.from(bytes.slice(1, 1 + operation.width)), [17, 34, 51, 68, 85, 102, 119, 136].slice(0, operation.width))
  } else {
    const result = vmMemory(opcode, high, 1n, 0n, memory)
    assert.equal(result, operation.signed ? 0xffffffffffffffffn : (1n << BigInt(operation.width * 8)) - 1n)
    assert.ok(bytes.every(value => value === 255))
  }
  valid++
}
assert.equal(vmMemory(60, 0xffffffffffffffffn, 1n, 0n, arena(0n, Uint8Array.of(123))), 123n)
assert.equal(vmMemory(60, high + 1n, 0xffffffffffffffffn, 0n, arena(high, Uint8Array.of(123))), 123n)
valid += 2
for (const opcode of [0, 61, 80, 85, -1, NaN]) {
  assert.throws(() => vmMemory(opcode, high, 0n, 0n, arena(high, new Uint8Array(8))), /Unsupported/)
  invalid++
}
for (const operands of [[-1n, 0n, 0n], [0n, -1n, 0n], [0n, 0n, -1n], [1n << 64n, 0n, 0n], [0n, 1n << 64n, 0n], [0n, 0n, 1n << 64n]]) {
  assert.throws(() => vmMemory(60, ...operands, arena(0n, new Uint8Array(8))), /outside uint64/)
  invalid++
}
assert.throws(() => vmMemory(63, high, 1n, 0n, arena(high, new Uint8Array(8))), /range/)
assert.throws(() => vmMemory(84, high, 1n, 0n, arena(high, new Uint8Array(8))), /range/)
assert.throws(() => vmMemory(84, high, 0n, 0n, arena(high, new Uint8Array(8), false)), /read-only/)
const shortMemory = {
  /** Deliberately violate the memory contract to verify width rejection. */
  read() { return new Uint8Array(1) },
  /** Reject any unexpected write during the invalid-read test. */
  write() { throw new Error('unexpected') },
}
assert.throws(() => vmMemory(63, high, 0n, 0n, shortMemory), /width mismatch/)
invalid += 4
process.stdout.write(JSON.stringify({synthetic_memory_cases: valid, invalid_input_and_memory_cases: invalid}) + '\n')
