/** Verified comparison/branch subset; instruction addresses refer to 16-byte expanded records. */
export const branchOperations: Readonly<Record<number, {bits: 32 | 64; condition: string}>> = {
  100: {bits: 32, condition: 'eq'}, 101: {bits: 32, condition: 'ne'},
  102: {bits: 32, condition: 'le'}, 103: {bits: 32, condition: 'gt'},
  105: {bits: 32, condition: 'ge'}, 107: {bits: 32, condition: 'hi'},
  108: {bits: 32, condition: 'lo'}, 109: {bits: 32, condition: 'hs'},
  110: {bits: 32, condition: 'eq'}, 111: {bits: 32, condition: 'ne'},
  112: {bits: 32, condition: 'le'}, 115: {bits: 32, condition: 'ge'},
  116: {bits: 32, condition: 'ls'}, 119: {bits: 32, condition: 'hs'},
  140: {bits: 64, condition: 'eq'}, 145: {bits: 64, condition: 'ge'},
  148: {bits: 64, condition: 'lo'}, 150: {bits: 64, condition: 'eq'},
  151: {bits: 64, condition: 'ne'}, 152: {bits: 64, condition: 'le'},
  156: {bits: 64, condition: 'ls'}, 159: {bits: 64, condition: 'hs'},
}

/** Reproduce CMP flags and exact two-record branch semantics, reading displacement only if used. */
export function vmBranch(opcode: number, left: bigint, right: bigint, instruction: bigint, readDisplacement: (address: bigint) => bigint): {next: bigint; nzcv: number; usedDisplacement: boolean} {
  const operation = Object.prototype.hasOwnProperty.call(branchOperations, opcode) ? branchOperations[opcode] : undefined
  if (operation === undefined) throw new Error('Unsupported VM branch opcode')
  for (const operand of [left, right, instruction]) {
    if (operand < 0n || operand > 0xffffffffffffffffn) throw new Error('VM branch operand is outside uint64')
  }
  const a = BigInt.asUintN(operation.bits, left)
  const b = BigInt.asUintN(operation.bits, right)
  const difference = BigInt.asUintN(operation.bits, a - b)
  const sign = 1n << BigInt(operation.bits - 1)
  const n = (difference & sign) !== 0n
  const z = difference === 0n
  const c = a >= b
  const v = ((a ^ b) & (a ^ difference) & sign) !== 0n
  let skip: boolean
  switch (operation.condition) {
    case 'eq': skip = z; break
    case 'ne': skip = !z; break
    case 'le': skip = z || n !== v; break
    case 'gt': skip = !z && n === v; break
    case 'ge': skip = n === v; break
    case 'hi': skip = c && !z; break
    case 'lo': skip = !c; break
    case 'hs': skip = c; break
    case 'ls': skip = !c || z; break
    default: throw new Error('Unsupported VM branch condition')
  }
  const nzcv = (n ? 8 : 0) | (z ? 4 : 0) | (c ? 2 : 0) | (v ? 1 : 0)
  if (skip) return {next: BigInt.asUintN(64, instruction + 32n), nzcv, usedDisplacement: false}
  const displacement = readDisplacement(BigInt.asUintN(64, instruction + 24n))
  if (displacement < 0n || displacement > 0xffffffffffffffffn) throw new Error('VM branch displacement is outside uint64')
  return {next: BigInt.asUintN(64, instruction + 16n + (displacement << 4n)), nzcv, usedDisplacement: true}
}
