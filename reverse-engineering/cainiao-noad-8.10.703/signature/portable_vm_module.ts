import type {VmMemory} from './portable_vm_memory'
import type {BufferHeap} from './portable_buffer'

/** The verified engine constructor calls this explicit platform time boundary. */
export interface EngineClock {
  /** Populate the Darwin timeval and timezone at the supplied guest addresses. */
  getTime(memory: VmMemory, timeval: bigint, timezone: bigint): void
}

export const moduleEntries = {
  prepareCache: 0x102a527f0n, releaseCache: 0x102a528a4n,
  defaultConfig: 0x102a52940n, configName: 0x102a5297cn,
  createEngine: 0x102a52988n, decodeStrings: 0x102a5da7cn,
} as const
const methods = [0x102a516acn, 0x102a516b8n, 0x102a51758n, 0x102a5179cn,
  0x102a51844n, 0x102a518ecn, 0x102a5193cn, 0x102a51980n,
  0x102a51a3cn, 0x102a51aa8n, 0x102a51afcn, 0x102a51bccn,
  0x102a51c6cn, 0x102a51edcn, 0x102a51f20n, 0x102a51f84n]

/** Load only the verified native field width and reject truncated memory responses. */
function read(memory: VmMemory, address: bigint, width: 1 | 4 | 8): bigint {
  const raw = memory.read(address, width)
  if (raw.length !== width) throw new Error('Module field read truncated')
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
  return width === 8 ? view.getBigUint64(0, true) : BigInt(width === 4 ? view.getUint32(0, true) : raw[0])
}

/** Store exact low register bits without modifying native padding or adjacent fields. */
function write(memory: VmMemory, address: bigint, value: bigint, width: 4 | 8): void {
  const raw = new Uint8Array(width)
  const view = new DataView(raw.buffer)
  if (width === 8) view.setBigUint64(0, BigInt.asUintN(64, value), true)
  else view.setUint32(0, Number(BigInt.asUintN(32, value)), true)
  memory.write(address, raw)
}

/** Port the six confirmed module preparation functions; process-wide initialization remains explicit. */
export function moduleCall(entry: bigint, args: readonly bigint[], stack: bigint, memory: VmMemory, heap: BufferHeap, clock: EngineClock): bigint {
  if (!Object.values(moduleEntries).includes(entry as typeof moduleEntries[keyof typeof moduleEntries])) throw new Error('Unsupported module entry')
  const object = args[0]
  if (entry === moduleEntries.configName) return 0x104b42138n
  if (entry === moduleEntries.defaultConfig) {
    if (!object) return 7n
    write(memory, object, 0x104b42138n, 8)
    write(memory, object + 24n, 0n, 8)
    memory.write(object + 8n, memory.read(0x104820c18n, 8))
    write(memory, object + 16n, 0x200000n, 4)
    return 0n
  }
  if (entry === moduleEntries.createEngine) {
    if (stack < 0x60n || stack > 0xffffffffffffffffn || (stack & 15n)) throw new Error('Invalid engine stack metadata')
    let config = object
    if (!config) {
      config = stack - 0x60n + 0x20n
      // Default configuration deliberately leaves its four padding bytes untouched.
      moduleCall(moduleEntries.defaultConfig, [config], stack, memory, heap, clock)
    }
    if (!read(memory, 0x1068f1664n, 4)) throw new Error('Engine global initialization has not been supplied')
    const engine = heap.allocate(144)
    if (!engine) return 0n
    for (let index = 0; index < methods.length; index++) write(memory, engine + 16n + BigInt(index * 8), methods[index], 8)
    const context = heap.allocate(232)
    if (!context) { heap.free(engine); return 0n }
    memory.write(context, new Uint8Array(232))
    const configuration = memory.read(config, 32)
    if (configuration.length !== 32) throw new Error('Engine configuration read truncated')
    memory.write(context + 16n, configuration)
    write(memory, engine, context, 8)
    write(memory, context + 80n, engine, 8)
    const timeval = stack - 0x60n + 0x10n
    clock.getTime(memory, timeval, stack - 0x60n + 8n)
    write(memory, 0x1069c1260n, read(memory, timeval, 8), 4)
    write(memory, 0x1069c1264n, read(memory, timeval + 8n, 4), 4)
    return engine
  }
  if (entry === moduleEntries.prepareCache) {
    if (!object) return 7n
    if (read(memory, object + 64n, 8) && read(memory, object + 80n, 8)) return 0n
    const index = heap.allocate(0x1fdc)
    const records = heap.allocate(0x13e98)
    if (!index || !records) { heap.free(index); heap.free(records); return 5n }
    memory.write(records, new Uint8Array(0x13e98))
    memory.write(index, new Uint8Array(0x1fdc).fill(255))
    write(memory, object + 72n, 0n, 4)
    write(memory, object + 80n, index, 8)
    write(memory, object + 64n, records, 8)
    return 0n
  }
  if (entry === moduleEntries.releaseCache) {
    if (!object || !read(memory, object + 72n, 4)) return 7n
    let records = read(memory, object + 64n, 8)
    if (records) {
      heap.free(read(memory, records, 8))
      let index = 1n
      for (;;) {
        const count = read(memory, object + 72n, 4)
        if (count > 65536n) throw new Error('Module cache record count exceeds boundary')
        if (index >= count) break
        records = read(memory, object + 64n, 8)
        heap.free(read(memory, records + index * 40n, 8))
        index++
      }
      heap.free(read(memory, object + 64n, 8))
      write(memory, object + 64n, 0n, 8)
      write(memory, object + 72n, 0n, 4)
    }
    heap.free(read(memory, object + 80n, 8))
    write(memory, object + 80n, 0n, 8)
    return 0n
  }
  const module = args[1]
  let descriptor = read(memory, module + 0x108n, 8)
  if (!descriptor) return object
  let count = read(memory, module + 0x110n, 4)
  if (!count) return object
  if (count > 65536n) throw new Error('Module string descriptor count exceeds boundary')
  const table = descriptor
  const end = table + count * 44n
  const base = read(memory, read(memory, object, 8) + 24n, 8)
  for (let index = 0n; index < count; index++) {
    const length = read(memory, descriptor + 8n, 4)
    if (length) {
      if (length > 0x1000000n) throw new Error('Module string length exceeds boundary')
      const target = base + read(memory, descriptor + 4n, 4)
      const limit = target + length
      // Metadata aliases require bytewise native re-reads; the current sample never needs them.
      if ((target < end && table < limit) || (target < module + 0x114n && module + 0x110n < limit)) throw new Error('Module string output aliases decoder metadata')
      let key = Number(read(memory, descriptor + 12n, 1))
      const bytes = memory.read(target, Number(length))
      if (bytes.length !== Number(length)) throw new Error('Module string source read truncated')
      for (let offset = 0; offset < bytes.length; offset++) { bytes[offset] ^= key; key = (key + 0x53) & 255 }
      memory.write(target, bytes)
      count = read(memory, module + 0x110n, 4)
    }
    descriptor += 44n
  }
  return object
}
