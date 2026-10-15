/** Remaining verified register/jump operations, without native call or frame handling. */
export const registerOpcodes = [5, 9, 14, 15, 24, 25, 26, 32, 33, 37, 44, 45, 47, 54, 55, 56, 57, 58, 86, 92, 93, 121, 131, 161] as const
export interface RegisterState {pc: bigint; compareLeft: bigint; compareRight: bigint; context: bigint}
export interface RegisterStep {
  next: bigint
  registers: Record<string, bigint>
  slots: {index: number; value: bigint}[]
  writes: {address: bigint; bytes: Uint8Array}[]
  nzcv?: number
}

/** Execute one verified 16-byte record; read only slots used by its actual path. */
export function vmRegister(record: Uint8Array, readSlot: (index: number) => bigint, state: RegisterState): RegisterStep {
  if (record.length !== 16) throw new Error('VM register instruction width mismatch')
  const view = new DataView(record.buffer, record.byteOffset, record.byteLength)
  const opcode = view.getUint32(0, true)
  if (!(registerOpcodes as readonly number[]).includes(opcode)) throw new Error('Unsupported VM register opcode')
  const immediate = view.getBigUint64(8, true)
  for (const operand of Object.values(state)) {
    if (operand < 0n || operand > 0xffffffffffffffffn) throw new Error('VM register state is outside uint64')
  }
  const result: RegisterStep = {next: BigInt.asUintN(64, state.pc + 16n), registers: {}, slots: [], writes: []}
  if (opcode === 5 || opcode === 9 || opcode === 25) {
    result.registers = {x0: BigInt(record[5]), x1: immediate}
    result.slots.push({index: record[5], value: immediate})
  } else if (opcode === 14 || opcode === 24) {
    result.registers.x0 = BigInt(record[4])
    result.registers.x12 = readSlot(record[4])
    result.registers.x13 = opcode === 14 ? immediate : readSlot(record[5])
    if (opcode === 24) result.registers.x1 = BigInt(record[5])
  } else if (opcode === 15 || opcode === 26) {
    result.next = BigInt.asUintN(64, state.pc + (immediate << 4n))
    result.registers.x0 = immediate
    if (opcode === 15) {
      result.registers.x2 = 0n
      result.slots.push({index: 15, value: state.pc})
      result.writes.push({address: BigInt.asUintN(64, state.context + 16n), bytes: new Uint8Array(8)}, {address: BigInt.asUintN(64, state.context + 4n), bytes: new Uint8Array(8)})
    }
  } else if (opcode === 121 || opcode === 131 || opcode === 161) {
    const bits = opcode === 161 ? 64 : 32
    const left = BigInt.asUintN(bits, state.compareLeft)
    const right = BigInt.asUintN(bits, state.compareRight)
    const difference = BigInt.asUintN(bits, left - right)
    const sign = 1n << BigInt(bits - 1)
    result.nzcv = ((difference & sign) !== 0n ? 8 : 0) | (difference === 0n ? 4 : 0) | (left >= right ? 2 : 0) | (((left ^ right) & (left ^ difference) & sign) !== 0n ? 1 : 0)
    if (left === right) {
      const value = opcode === 131 ? immediate : readSlot(record[5])
      result.slots.push({index: record[6], value})
      result.registers = {x0: BigInt(record[6]), x1: value}
    }
  } else {
    const left = readSlot(record[5])
    const right = opcode === 32 || opcode === 33 || opcode === 37 || opcode === 93 ? readSlot(record[6]) : immediate
    if (left < 0n || left > 0xffffffffffffffffn || right < 0n || right > 0xffffffffffffffffn) throw new Error('VM register operand is outside uint64')
    let value: bigint
    switch (opcode) {
      case 32: value = BigInt.asUintN(64, left + right); break
      case 33: value = BigInt.asUintN(64, left - right); break
      case 37: value = left & right; break
      case 44:
      case 45: value = left | right; break
      case 47: value = left ^ right; break
      case 54: value = BigInt.asUintN(32, left << (right & 31n)); break
      case 55: value = BigInt.asUintN(64, left << (right & 63n)); break
      case 56: value = BigInt.asUintN(32, left) >> (right & 31n); break
      case 57: value = left >> (right & 63n); break
      case 58: value = BigInt.asUintN(64, BigInt.asIntN(32, left) >> (right & 31n)); break
      case 86:
      case 93: value = BigInt.asUintN(64, left * right); break
      case 92: value = right === 0n ? 0n : BigInt.asUintN(64, BigInt.asIntN(64, left) / BigInt.asIntN(64, right)); break
      default: throw new Error('Unsupported VM register arithmetic')
    }
    result.slots.push({index: record[7], value})
    result.registers = {x0: BigInt(record[7]), x1: value, x2: right}
  }
  // Slot and register values from the host are checked even for direct-copy instructions.
  for (const value of [...Object.values(result.registers), ...result.slots.map(slot => slot.value)]) {
    if (value < 0n || value > 0xffffffffffffffffn) throw new Error('VM register result is outside uint64')
  }
  return result
}
