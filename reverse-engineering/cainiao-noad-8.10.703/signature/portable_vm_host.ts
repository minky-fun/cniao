import type {VmMemory} from './portable_vm_memory'

export type VmHostPlan =
  | {kind: 'return'; status: number}
  | {kind: 'marshal'; descriptor: bigint}
  | {kind: 'call'; target: bigint; arguments: bigint[]; result?: {address: bigint; width: 4 | 8; source: 'integer' | 'floating'}}

/** Read only the width explicitly loaded by the verified ARM64 helper. */
function load(memory: VmMemory, address: bigint, width: 1 | 4 | 8): bigint {
  const bytes = memory.read(BigInt.asUintN(64, address), width)
  if (bytes.length !== width) throw new Error('VM host read width mismatch')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return width === 8 ? view.getBigUint64(0, true) : BigInt(width === 4 ? view.getUint32(0, true) : view.getUint8(0))
}

/** Reproduce validated descriptor guards and simple ABI plans; expose complex marshalling explicitly. */
export function vmHostPlan(engine: bigint, context: bigint, descriptor: bigint, memory: VmMemory): VmHostPlan {
  for (const value of [engine, context, descriptor]) {
    if (value < 0n || value > 0xffffffffffffffffn) throw new Error('VM host pointer outside uint64')
  }
  if (engine === 0n || descriptor === 0n || context === 0n) return {kind: 'return', status: 7}
  if (load(memory, engine, 8) === 0n) return {kind: 'return', status: 7}
  const target = load(memory, descriptor + 8n, 8)
  if (target === 0n) return {kind: 'return', status: 7}
  if (load(memory, descriptor + 17n, 1) !== 0n) return {kind: 'call', target, arguments: [engine, context]}
  const selector = Number(load(memory, descriptor + 36n, 4))
  if (selector > 5) return {kind: 'return', status: 22}
  if (selector === 0) return {kind: 'marshal', descriptor}
  const arguments_ = []
  for (let index = 0; index < 6; index++) arguments_.push(load(memory, context + 0x78n + BigInt(index * 8), 8))
  if (selector === 1) return {kind: 'call', target, arguments: arguments_}
  return {
    kind: 'call', target, arguments: arguments_,
    result: {address: BigInt.asUintN(64, context + (selector === 2 ? 0x78n : 0x138n)), width: selector === 3 ? 4 : 8, source: selector === 2 ? 'integer' : 'floating'},
  }
}

/** Commit only the selected native return register bits; host target execution remains external. */
export function vmHostFinish(plan: Extract<VmHostPlan, {kind: 'call'}>, integer: bigint, floating: bigint, memory: VmMemory): number {
  if (plan.result) {
    const value = plan.result.source === 'integer' ? integer : floating
    if (value < 0n || value > 0xffffffffffffffffn) throw new Error('VM host return bits outside uint64')
    const bytes = new Uint8Array(plan.result.width)
    const view = new DataView(bytes.buffer)
    if (plan.result.width === 8) view.setBigUint64(0, value, true)
    else view.setUint32(0, Number(value & 0xffffffffn), true)
    memory.write(plan.result.address, bytes)
  }
  return 0
}

/** Port native 0x102a53b74: retain the pending call descriptor only when its exact guards allow it. */
export function vmSetCallDescriptor(engine: bigint, context: bigint, memory: VmMemory): void {
  for (const value of [engine, context]) {
    if (value < 0n || value > 0xffffffffffffffffn) throw new Error('VM descriptor pointer outside uint64')
  }
  if (engine === 0n || context === 0n) return
  const root = load(memory, engine, 8)
  if (root === 0n || load(memory, root + 24n, 4) !== 0n) return
  const descriptor = load(memory, context + 0x78n, 8)
  if (descriptor === 0n) return
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, descriptor, true)
  memory.write(BigInt.asUintN(64, context + 16n), bytes)
}

/** Port the bridge's UXTW table lookup; an unmapped index fails through the memory provider. */
export function vmCommonFunction(index: bigint, table: bigint, memory: VmMemory): bigint {
  for (const value of [index, table]) {
    if (value < 0n || value > 0xffffffffffffffffn) throw new Error('VM common function operand outside uint64')
  }
  return load(memory, table + (index & 0xffffffffn) * 8n, 8)
}

export type VmDispatchPlan = {kind: 'return'; value: bigint} | {kind: 'call'; target: bigint; arguments: bigint[]}

/** Port the command bridge guards and exact six-argument tail call; retain the real dispatcher externally. */
export function vmDispatchBridge(request: bigint, error: bigint, dispatchStorage: bigint, memory: VmMemory): VmDispatchPlan {
  for (const value of [request, error, dispatchStorage]) {
    if (value < 0n || value > 0xffffffffffffffffn) throw new Error('VM dispatch pointer outside uint64')
  }
  const ids: bigint[] = []
  if (request !== 0n) {
    for (let index = 0; index < 3; index++) ids.push(load(memory, request + BigInt(index * 8), 8))
  }
  if (request === 0n || ((ids[0] | ids[1] | ids[2]) & 0x80000000n) !== 0n) {
    if (error !== 0n) {
      const bytes = new Uint8Array(4)
      new DataView(bytes.buffer).setUint32(0, 1, true)
      memory.write(error, bytes)
    }
    return {kind: 'return', value: 0n}
  }
  const payload = load(memory, request + 32n, 8)
  const fourth = load(memory, request + 24n, 4)
  const root = load(memory, dispatchStorage, 8)
  return {kind: 'call', target: load(memory, root + 16n, 8), arguments: [...ids, fourth, payload, error]}
}
