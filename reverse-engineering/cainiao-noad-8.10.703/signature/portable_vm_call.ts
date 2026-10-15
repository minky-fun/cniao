import type {VmMemory} from './portable_vm_memory'

export type VmCallRequest =
  | {kind: 'expand'; module: bigint}
  | {kind: 'host'; engine: bigint; context: bigint; descriptor: Uint8Array}
export interface VmCallEntry {helper: 'descriptor' | 'indirect'; operand: bigint}

/** Read an exact native load width and apply address arithmetic modulo uint64. */
function load(memory: VmMemory, address: bigint, width: 1 | 4 | 8): bigint {
  const bytes = memory.read(BigInt.asUintN(64, address), width)
  if (bytes.length !== width) throw new Error('VM call read width mismatch')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return width === 8 ? view.getBigUint64(0, true) : BigInt(width === 4 ? view.getUint32(0, true) : view.getUint8(0))
}

/** Write only the native field width, preserving adjacent VM state. */
function store(memory: VmMemory, address: bigint, value: bigint, width: 4 | 8): void {
  const bytes = new Uint8Array(width)
  const view = new DataView(bytes.buffer)
  if (width === 8) view.setBigUint64(0, BigInt.asUintN(64, value), true)
  else view.setUint32(0, Number(BigInt.asUintN(32, value)), true)
  memory.write(BigInt.asUintN(64, address), bytes)
}

/** Match a child module with the exact bit tests and 32-bit span arithmetic of 0x102a4d454. */
export function vmModuleContains(module: bigint, flags: number, pointer: bigint, memory: VmMemory): boolean {
  if (module === 0n) return false
  let base: bigint
  let span: bigint
  if ((flags & 1) !== 0) {
    base = BigInt.asUintN(64, load(memory, module + 0x128n, 8) + 4n)
    span = BigInt.asUintN(32, load(memory, module + 0x124n, 4) << 2n)
  } else if ((flags & 2) !== 0) {
    base = load(memory, module + 0x30n, 8)
    span = BigInt.asUintN(32, load(memory, module + 0x124n, 4) << 4n)
  } else return false
  return pointer >= base && pointer < BigInt.asUintN(64, base + span)
}

/** Search the root and its two native child arrays, retaining native ordering and signed counts. */
export function vmFindModule(root: bigint, flags: number, pointer: bigint, memory: VmMemory): bigint {
  if (root === 0n) return 0n
  const code = (flags & 2) !== 0
  const base = code ? load(memory, root + 0x30n, 8) : BigInt.asUintN(64, load(memory, root + 0x128n, 8) + 4n)
  if (pointer >= base) {
    const span = BigInt.asUintN(32, load(memory, root + 0x124n, 4) * (code ? 16n : 4n))
    if (pointer < BigInt.asUintN(64, base + span)) return root
  }
  for (const [countOffset, arrayOffset] of [[0x104n, 0xf8n], [0x114n, 0x108n]]) {
    const count = Number(BigInt.asIntN(32, load(memory, root + countOffset, 4)))
    if (count > 65536) throw new Error('VM module array exceeds supported boundary')
    if (count < 1) continue
    const array = load(memory, root + arrayOffset, 8)
    for (let index = 0; index < count; index++) {
      const module = load(memory, array + BigInt(index * 8), 8)
      if (vmModuleContains(module, flags, pointer, memory)) return module
    }
  }
  return 0n
}

/** Resolve a symbol to its VM record, yielding real expansion instead of inventing decoded module contents. */
export function* vmResolveCode(root: bigint, context: bigint, pointer: bigint, memory: VmMemory): Generator<VmCallRequest, {target: bigint; status: number}, number> {
  const module = vmFindModule(root, 1, pointer, memory)
  if (module === 0n) return {target: 0n, status: 23}
  if (load(memory, module + 16n, 1) === 0n) yield {kind: 'expand', module}
  store(memory, context + 4n, 0n, 4)
  const code = load(memory, module + 0x30n, 8)
  const symbols = load(memory, module + 0x128n, 8)
  const offset = BigInt.asUintN(64, ((pointer - symbols) << 2n) - 16n) & 0xfffffffffffffff0n
  return {target: BigInt.asUintN(64, code + offset), status: 0}
}

/** Save the return record before reading call operands, including operands that alias return slot 15. */
export function vmCallBegin(record: Uint8Array, slots: bigint, instruction: bigint, memory: VmMemory): VmCallEntry | {helper: 'exit'} {
  if (record.length !== 16) throw new Error('VM call record width mismatch')
  const view = new DataView(record.buffer, record.byteOffset, record.byteLength)
  const opcode = view.getUint32(0, true)
  if (opcode === 18) return {helper: 'exit'}
  if (opcode !== 3 && opcode !== 4) throw new Error('Unsupported VM call opcode')
  store(memory, slots + 0x78n, instruction, 8)
  if (opcode === 3) return {helper: 'descriptor', operand: view.getBigUint64(8, true)}
  const left = load(memory, slots + BigInt(record[4] * 8), 8)
  const right = load(memory, slots + BigInt(record[5] * 8), 8)
  return {helper: 'indirect', operand: BigInt.asUintN(64, left + right)}
}

/** Select a nonzero helper target or re-read the potentially host-modified return record before advancing. */
export function vmCallResume(slots: bigint, result: bigint, memory: VmMemory): bigint {
  return result !== 0n ? result : BigInt.asUintN(64, load(memory, slots + 0x78n, 8) + 16n)
}

/** Execute native descriptor/indirect control flow; host functions and unexpanded modules remain explicit yields. */
export function* vmCall(helper: VmCallEntry['helper'], engine: bigint, context: bigint, operand: bigint, errorTarget: bigint, specialTargets: readonly bigint[], memory: VmMemory): Generator<VmCallRequest, bigint, number> {
  if (engine === 0n) return 0n
  let root = load(memory, engine, 8)
  if (root === 0n || load(memory, root + 24n, 4) !== 0n) return 0n
  if (context === 0n) throw new Error('Missing VM call context')
  let status = 0
  let target = 0n
  if (helper === 'descriptor') {
    const instruction = load(memory, context + 8n, 8)
    const module = vmFindModule(load(memory, root, 8), 2, instruction, memory)
    if (module === 0n) status = 23
    else {
      const table = load(memory, module + 0x98n, 8)
      const entry = BigInt.asUintN(64, table + BigInt.asUintN(32, operand) * 16n)
      const kind = Number(load(memory, entry, 4))
      if (kind > 3) return 0n
      let descriptor = load(memory, entry + 8n, 8)
      if (kind === 1) {
        const pending = load(memory, context + 16n, 8)
        let raw: Uint8Array
        if (pending !== 0n) {
          raw = new Uint8Array(40)
          const prefix = memory.read(descriptor, 24)
          if (prefix.length !== 24) throw new Error('VM call descriptor width mismatch')
          raw.set(prefix)
          const view = new DataView(raw.buffer)
          view.setUint32(32, 1, true)
          view.setUint32(36, Number(load(memory, pending + 1n, 1)), true)
          view.setUint8(18, Number(load(memory, pending + 2n, 1)))
          view.setBigUint64(24, BigInt.asUintN(64, pending + 4n), true)
          store(memory, context + 16n, 0n, 8)
        } else raw = memory.read(descriptor, 40)
        if (raw.length !== 40) throw new Error('VM call descriptor width mismatch')
        status = yield {kind: 'host', engine, context, descriptor: raw}
      } else {
        const missing = kind === 3 && descriptor === 0n
        if (kind === 3) {
          store(memory, context + 16n, 0n, 8)
          descriptor = descriptor === 0n ? 0n : load(memory, descriptor + 8n, 8)
        }
        if (missing) status = 23
        else {
          const result = yield* vmResolveCode(module, context, descriptor, memory)
          target = result.target
          status = result.status
          if (kind === 0 || kind === 2) store(memory, context + 16n, 0n, 8)
        }
      }
    }
  } else if (helper === 'indirect') {
    root = load(memory, engine, 8)
    const result = yield* vmResolveCode(load(memory, root, 8), context, operand, memory)
    target = result.target
    status = result.status
    if (status === 0) store(memory, context + 16n, 0n, 8)
    else {
      const pending = load(memory, context + 16n, 8)
      if (pending === 0n) status = 50
      else {
        const raw = new Uint8Array(40)
        const view = new DataView(raw.buffer)
        view.setBigUint64(8, operand, true)
        view.setUint32(32, 1, true)
        view.setUint32(36, Number(load(memory, pending + 1n, 1)), true)
        view.setUint8(18, Number(load(memory, pending + 2n, 1)))
        view.setBigUint64(24, BigInt.asUintN(64, pending + 4n), true)
        store(memory, context + 16n, 0n, 8)
        if (specialTargets.includes(operand)) store(memory, context + 0x2cn, 1n, 4)
        status = yield {kind: 'host', engine, context, descriptor: raw}
      }
    }
  } else throw new Error('Unsupported VM call helper')
  if (status !== 0) {
    store(memory, context + 0x238n, BigInt(status), 4)
    store(memory, context + 0xb0n, errorTarget, 8)
    return errorTarget
  }
  return target
}
