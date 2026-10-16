import {ZlibInflate} from './portable_inflate'
import {standardCall as cryptoCall, standardEntries as cryptoEntries} from './portable_crypto_host'
import type {VmMemory} from './portable_vm_memory'
import type {BufferHeap} from './portable_buffer'

export const zlibEntries = {initialize: 0x104431184n, inflate: 0x104431160n, end: 0x10443116cn} as const
export const standardEntries = {...cryptoEntries, ...zlibEntries} as const
const streams = new Map<bigint, {engine: ZlibInflate; token: bigint}>()

/** Implement the verified Darwin LP64 import ABI, rejecting unsupported allocation and flush modes. */
export function standardCall(entry: bigint, args: readonly bigint[], stack: bigint, memory: VmMemory, heap: BufferHeap): bigint {
  if (!Object.values(zlibEntries).includes(entry as typeof zlibEntries[keyof typeof zlibEntries])) return cryptoCall(entry, args, stack, memory, heap)
  const pointer = args[0]
  const raw = memory.read(pointer, 112)
  if (raw.length !== 112) throw new Error('Zlib stream read truncated')
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
  if (entry === zlibEntries.initialize) {
    if (streams.size || args[2] !== 112n || view.getBigUint64(64, true) || view.getBigUint64(72, true) || view.getBigUint64(80, true)) throw new Error('Unsupported zlib initialization configuration')
    const version = memory.read(args[1], 7)
    if (version.length !== 7 || version.some((byte, index) => byte !== [49, 46, 50, 46, 49, 49, 0][index])) throw new Error('Unsupported zlib version metadata')
    const token = heap.allocate(8)
    if (!token) throw new Error('Zlib state allocation failed')
    streams.set(pointer, {engine: new ZlibInflate(), token})
    view.setBigUint64(56, token, true)
  }
  const session = streams.get(pointer)
  if (!session) throw new Error('Unknown zlib stream')
  const engine = session.engine
  if (entry !== zlibEntries.initialize && (view.getBigUint64(56, true) !== session.token || view.getBigUint64(16, true) !== BigInt(engine.totalIn) || view.getBigUint64(40, true) !== BigInt(engine.totalOut))) throw new Error('Zlib stream state was replaced')
  let status = 0
  if (entry === zlibEntries.inflate) {
    if (args[1] !== 0n) throw new Error('Unsupported zlib flush mode')
    const source = view.getBigUint64(0, true)
    const available = view.getUint32(8, true)
    const target = view.getBigUint64(24, true)
    const capacity = view.getUint32(32, true)
    if (available > 0x1000000 || capacity > 0x1000000 || engine.totalOut + capacity > 0x1000000) throw new Error('Zlib input/output boundary exceeded')
    const input = available ? memory.read(source, available) : new Uint8Array()
    if (input.length !== available) throw new Error('Zlib source read truncated')
    const result = engine.inflate(input, capacity)
    if (result.bytes.length) memory.write(target, result.bytes)
    view.setBigUint64(0, source + BigInt(result.consumed), true)
    view.setUint32(8, available - result.consumed, true)
    view.setBigUint64(24, target + BigInt(result.bytes.length), true)
    view.setUint32(32, capacity - result.bytes.length, true)
    status = result.code
  } else if (entry === zlibEntries.end) {
    streams.delete(pointer)
    view.setBigUint64(56, 0n, true)
  }
  view.setBigUint64(16, BigInt(engine.totalIn), true)
  view.setBigUint64(40, BigInt(engine.totalOut), true)
  let message = 0n
  if (engine.message) {
    const bytes = Uint8Array.from([...engine.message].map(character => character.charCodeAt(0)).concat(0))
    message = heap.allocate(bytes.length)
    if (!message) throw new Error('Zlib message allocation failed')
    memory.write(message, bytes)
  }
  view.setBigUint64(48, message, true)
  view.setInt32(88, engine.dataType, true)
  view.setBigUint64(96, BigInt(engine.adler), true)
  view.setBigUint64(104, 0n, true)
  memory.write(pointer, raw)
  return BigInt.asUintN(32, BigInt(status))
}
