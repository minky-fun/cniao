import type {VmMemory} from './portable_vm_memory'

interface IntegerType {width: 1 | 2 | 4 | 8; signed: boolean}
export interface IntegerAbiPlan {
  target: bigint
  arguments: bigint[]
  stack: {offset: number; bytes: Uint8Array}[]
  result: {address: bigint; width: 1 | 2 | 4 | 8; signed: boolean}
}

/** Read the exact little-endian width required by the verified native type or descriptor field. */
function read(memory: VmMemory, address: bigint, width: 1 | 2 | 4 | 8): bigint {
  const bytes = memory.read(BigInt.asUintN(64, address), width)
  if (bytes.length !== width) throw new Error('VM ABI read width mismatch')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (width === 8) return view.getBigUint64(0, true)
  return BigInt(width === 4 ? view.getUint32(0, true) : width === 2 ? view.getUint16(0, true) : view.getUint8(0))
}

/** Decode only native primitive integer/pointer tokens confirmed by the parser's two static tables. */
function integerType(code: number): IntegerType | 'void' {
  switch (code) {
    case 13: case 118: return 'void'
    case 1: case 99: return {width: 1, signed: true}
    case 2: case 67: return {width: 1, signed: false}
    case 3: case 115: return {width: 2, signed: true}
    case 4: case 83: return {width: 2, signed: false}
    case 5: case 105: return {width: 4, signed: true}
    case 6: case 73: return {width: 4, signed: false}
    case 7: case 9: case 108: case 120: return {width: 8, signed: true}
    case 8: case 10: case 76: case 88: case 14: case 112: return {width: 8, signed: false}
    default: throw new Error('Unsupported VM ABI type token')
  }
}

/** Plan the observed integer ABI path, including six VM slots, overflow sources and Darwin variadic stack slots. */
export function vmIntegerAbiPlan(context: bigint, descriptor: bigint, memory: VmMemory): IntegerAbiPlan {
  for (const value of [context, descriptor]) {
    if (value <= 0n || value > 0xffffffffffffffffn) throw new Error('VM ABI pointer outside nonzero uint64')
  }
  const abi = read(memory, descriptor + 32n, 4)
  if (abi !== 1n && abi !== 2n) throw new Error('Unsupported VM ABI convention')
  const fixed = Number(read(memory, descriptor + 18n, 1))
  if (fixed > 127) throw new Error('Unsupported VM ABI fixed argument count')
  let cursor = read(memory, descriptor + 24n, 8)
  if (cursor === 0n) throw new Error('Missing VM ABI type description')
  const resultType = integerType(Number(read(memory, cursor++, 1)))
  if (resultType === 'void') throw new Error('Unsupported void VM ABI result')
  const separator = Number(read(memory, cursor++, 1))
  if (separator !== 23 && separator !== 124) throw new Error('Unsupported VM ABI type separator')
  const types: IntegerType[] = []
  for (;;) {
    const code = Number(read(memory, cursor++, 1))
    if (code === 0 || code === 22 || code === 23 || code === 46 || code === 124) break
    if (types.length === 256) throw new Error('VM ABI argument count exceeds supported boundary')
    const type = integerType(code)
    if (type === 'void') throw new Error('Unsupported void VM ABI argument')
    types.push(type)
  }
  if (fixed > types.length) throw new Error('VM ABI fixed argument count exceeds total')
  if (fixed !== 0 && types.slice(1).some(type => type.width < 4)) throw new Error('Unsupported unpromoted VM ABI variadic type')
  const arguments_: bigint[] = []
  const stack: IntegerAbiPlan['stack'] = []
  let stackLength = 0
  for (let index = 0; index < types.length; index++) {
    const type = types[index]
    const address = index < 6
      ? context + 0x78n + BigInt(index * 8)
      : read(memory, context + 0xa8n, 8) + BigInt(0x80 + index * 8)
    const value = read(memory, address, type.width)
    if (index < 8 && (fixed === 0 || index < fixed)) {
      arguments_.push(type.signed ? BigInt.asUintN(64, BigInt.asIntN(type.width * 8, value)) : value)
    } else {
      const alignment = fixed !== 0 && index >= fixed ? 8 : type.width
      stackLength = Math.ceil(stackLength / alignment) * alignment
      const bytes = new Uint8Array(type.width)
      const view = new DataView(bytes.buffer)
      if (type.width === 8) view.setBigUint64(0, value, true)
      else if (type.width === 4) view.setUint32(0, Number(value), true)
      else if (type.width === 2) view.setUint16(0, Number(value), true)
      else view.setUint8(0, Number(value))
      stack.push({offset: stackLength, bytes})
      stackLength += type.width
    }
  }
  return {target: read(memory, descriptor + 8n, 8), arguments: arguments_, stack, result: {address: BigInt.asUintN(64, context + 0x78n), ...resultType}}
}

/** Extend the selected native integer return width and store the helper's eight-byte result slot. */
export function vmIntegerAbiFinish(plan: IntegerAbiPlan, integer: bigint, memory: VmMemory): number {
  if (integer < 0n || integer > 0xffffffffffffffffn) throw new Error('VM ABI return bits outside uint64')
  const bits = plan.result.width * 8
  const value = plan.result.signed ? BigInt.asUintN(64, BigInt.asIntN(bits, integer)) : BigInt.asUintN(bits, integer)
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setBigUint64(0, value, true)
  memory.write(plan.result.address, bytes)
  return 0
}
