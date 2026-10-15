/** Verified memory subset for this sample's expanded VM; addresses remain uint64. */
export interface VmMemory {
  /** Return exactly the requested bytes or fail for an inaccessible range. */
  read(address: bigint, width: number): Uint8Array
  /** Write all bytes or fail for an inaccessible or read-only range. */
  write(address: bigint, bytes: Uint8Array): void
}

/** Only opcodes observed at verified native entry points are enabled. */
export const memoryOperations: Readonly<Record<number, {width: number; store: boolean; signed: boolean}>> = {
  60: {width: 1, store: false, signed: false},
  62: {width: 4, store: false, signed: false},
  63: {width: 8, store: false, signed: false},
  67: {width: 4, store: false, signed: true},
  68: {width: 1, store: false, signed: false},
  70: {width: 4, store: false, signed: false},
  71: {width: 8, store: false, signed: false},
  73: {width: 1, store: false, signed: true},
  75: {width: 4, store: false, signed: true},
  76: {width: 1, store: true, signed: false},
  78: {width: 4, store: true, signed: false},
  79: {width: 8, store: true, signed: false},
  81: {width: 1, store: true, signed: false},
  82: {width: 2, store: true, signed: false},
  83: {width: 4, store: true, signed: false},
  84: {width: 8, store: true, signed: false},
}

/** Perform little-endian access and return native x1, including its exact extension/masking. */
export function vmMemory(opcode: number, base: bigint, offset: bigint, value: bigint, memory: VmMemory): bigint {
  const operation = Object.prototype.hasOwnProperty.call(memoryOperations, opcode) ? memoryOperations[opcode] : undefined
  if (operation === undefined) throw new Error('Unsupported VM memory opcode')
  for (const operand of [base, offset, value]) {
    if (operand < 0n || operand > 0xffffffffffffffffn) throw new Error('VM memory operand is outside uint64')
  }
  const address = BigInt.asUintN(64, base + offset)
  if (operation.store) {
    const bytes = new Uint8Array(operation.width)
    for (let index = 0; index < bytes.length; index++) bytes[index] = Number((value >> BigInt(index * 8)) & 255n)
    memory.write(address, bytes)
    // Byte/halfword stores explicitly mask x1; STR W1 only truncates the written bytes.
    return operation.width < 4 ? BigInt.asUintN(operation.width * 8, value) : value
  }
  const bytes = memory.read(address, operation.width)
  if (bytes.length !== operation.width) throw new Error('VM memory read width mismatch')
  let result = 0n
  for (let index = bytes.length - 1; index >= 0; index--) result = (result << 8n) | BigInt(bytes[index])
  return operation.signed ? BigInt.asUintN(64, BigInt.asIntN(operation.width * 8, result)) : result
}
