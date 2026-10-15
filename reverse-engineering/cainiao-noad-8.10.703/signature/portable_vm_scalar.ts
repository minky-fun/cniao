/** Verified scalar subset of this sample's expanded VM; not a complete interpreter. */
export const scalarOpcodes = [34, 38, 39, 40, 42, 43] as const

/** Execute exact unsigned ARM64 operations, preserving 64-bit slots and explicit 32-bit masks. */
export function vmScalar(opcode: number, left: bigint, right: bigint): bigint {
  if (left < 0n || left > 0xffffffffffffffffn || right < 0n || right > 0xffffffffffffffffn) {
    throw new Error('VM scalar operand is outside uint64')
  }
  switch (opcode) {
    case 34: return BigInt.asUintN(64, left + right)
    case 38:
    case 39: return left | right
    case 40: return (left ^ right) & 0xffffffffn
    case 42: return (left & right) & 0xffffffffn
    case 43: return left & right
    default: throw new Error('Unsupported VM scalar opcode')
  }
}
