import {vmScalar, scalarOpcodes} from './portable_vm_scalar'
import {vmMemory, memoryOperations, type VmMemory} from './portable_vm_memory'
import {vmBranch, branchOperations} from './portable_vm_branch'
import {vmRegister, registerOpcodes} from './portable_vm_register'
import {vmFrame} from './portable_vm_frame'
import {vmCall, vmCallBegin, vmCallResume, type VmCallRequest} from './portable_vm_call'

export interface VmRunInput {
  engine: bigint
  context: bigint
  code: bigint
  index: bigint
  slots: bigint
  compareLeft: bigint
  compareRight: bigint
  integer: bigint
  errorTarget: bigint
  specialTargets: readonly bigint[]
  maxInstructions: number
}
export interface VmRunResult {integer: bigint; counts: Record<string, number>; instructions: number}

/** Run the 73 verified opcode forms without an ARM64 handler table, retaining explicit real-host yields. */
export function* vmRun(input: VmRunInput, memory: VmMemory): Generator<VmCallRequest, VmRunResult, number> {
  if (!Number.isSafeInteger(input.maxInstructions) || input.maxInstructions < 1) throw new Error('Invalid VM instruction limit')
  for (const value of [input.engine, input.context, input.code, input.index, input.slots, input.compareLeft, input.compareRight, input.integer, input.errorTarget, ...input.specialTargets]) {
    if (value < 0n || value > 0xffffffffffffffffn) throw new Error('VM runtime operand outside uint64')
  }
  /** Read the exact native primitive width using modulo uint64 addressing. */
  function load(address: bigint, width: 4 | 8): bigint {
    const bytes = memory.read(BigInt.asUintN(64, address), width)
    if (bytes.length !== width) throw new Error('VM runtime read width mismatch')
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return width === 8 ? view.getBigUint64(0, true) : BigInt(view.getUint32(0, true))
  }
  /** Store a native eight-byte slot without converting integer bits through Number. */
  function store(address: bigint, value: bigint): void {
    const bytes = new Uint8Array(8)
    new DataView(bytes.buffer).setBigUint64(0, BigInt.asUintN(64, value), true)
    memory.write(BigInt.asUintN(64, address), bytes)
  }
  /** Read only an instruction-selected slot; inaccessible storage fails through the provider. */
  function slot(index: number): bigint { return load(input.slots + BigInt(index * 8), 8) }
  let pc = BigInt.asUintN(64, input.code + (input.index << 4n))
  let left = input.compareLeft
  let right = input.compareRight
  let integer = input.integer
  let x22 = 0n
  let x23 = input.code
  const counts: Record<string, number> = {}
  for (let instructions = 1; instructions <= input.maxInstructions; instructions++) {
    const record = memory.read(pc, 16)
    if (record.length !== 16) throw new Error('VM runtime record width mismatch')
    const view = new DataView(record.buffer, record.byteOffset, record.byteLength)
    const opcode = view.getUint32(0, true)
    const immediate = view.getBigUint64(8, true)
    counts[opcode] = (counts[opcode] ?? 0) + 1
    store(input.context + 8n, pc)
    if (opcode === 3 || opcode === 4 || opcode === 18) {
      const plan = vmCallBegin(record, input.slots, pc, memory)
      if (plan.helper === 'exit') return {integer, counts, instructions}
      integer = yield* vmCall(plan.helper, input.engine, input.context, plan.operand, input.errorTarget, input.specialTargets, memory)
      pc = vmCallResume(input.slots, integer, memory)
      continue
    }
    if (opcode === 0 || opcode === 31) {
      const result = vmFrame(opcode, input.slots, pc, immediate, x22, x23, memory)
      x22 = result.registers.x22
      x23 = result.registers.x23 ?? x23
      if ('x0' in result.registers) integer = result.registers.x0
      pc = result.next
      continue
    }
    if ((registerOpcodes as readonly number[]).includes(opcode)) {
      const result = vmRegister(record, slot, {pc, compareLeft: left, compareRight: right, context: input.context})
      for (const item of result.writes) memory.write(item.address, item.bytes)
      for (const item of result.slots) store(input.slots + BigInt(item.index * 8), item.value)
      if ('x0' in result.registers) integer = result.registers.x0
      if ('x12' in result.registers) left = result.registers.x12
      if ('x13' in result.registers) right = result.registers.x13
      pc = result.next
      continue
    }
    if ((scalarOpcodes as readonly number[]).includes(opcode)) {
      const a = slot(record[5])
      const b = opcode === 34 || opcode === 42 || opcode === 43 ? immediate : slot(record[6])
      store(input.slots + BigInt(record[7] * 8), vmScalar(opcode, a, b))
      integer = BigInt(record[7])
    } else if (Object.prototype.hasOwnProperty.call(memoryOperations, opcode)) {
      const operation = memoryOperations[opcode]
      let base: bigint
      let offset: bigint
      let value: bigint
      if (!operation.store) {
        base = opcode < 68 ? slot(record[5]) : immediate
        offset = slot(record[6])
        value = 0n
      } else {
        base = slot(record[opcode < 81 ? 6 : 7])
        offset = opcode < 81 ? slot(record[7]) : immediate
        value = slot(record[5])
      }
      const result = vmMemory(opcode, base, offset, value, memory)
      if (!operation.store) store(input.slots + BigInt(record[7] * 8), result)
      integer = BigInt(record[operation.store ? 5 : 7])
    } else if (Object.prototype.hasOwnProperty.call(branchOperations, opcode)) {
      const a = slot(record[4])
      const useImmediate = (opcode >= 110 && opcode < 140) || opcode >= 150
      const b = useImmediate ? immediate : slot(record[5])
      const result = vmBranch(opcode, a, b, pc,
        /** Fetch a displacement only on the native path that consumes it. */
        address => load(address, 8))
      if (useImmediate) integer = BigInt(record[4])
      pc = result.next
      continue
    } else throw new Error('Unsupported VM runtime opcode')
    pc = BigInt.asUintN(64, pc + 16n)
  }
  throw new Error('VM runtime instruction limit exceeded')
}
