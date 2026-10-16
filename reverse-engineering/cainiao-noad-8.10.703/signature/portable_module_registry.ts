import type {VmMemory} from './portable_vm_memory'
import type {BufferHeap} from './portable_buffer'

/** Synchronization remains an explicit platform boundary, separate from registry data operations. */
export interface RegistryLock {
  /** Acquire the verified native read or write lock address. */
  lock(address: bigint, mode: 'read' | 'write'): void
  /** Release the same lock even when the portable adapter rejects an unsupported state. */
  unlock(address: bigint): void
}

export const registryEntries = {
  createTable: 0x102a54168n, destroyTable: 0x102a54228n,
  append: 0x102a56414n, get: 0x102a56494n, remove: 0x102a564f4n,
} as const

/** Execute verified table allocation and module-list operations without replacing platform locking. */
export function registryCall(entry: bigint, args: readonly bigint[], memory: VmMemory, heap: BufferHeap, locks: RegistryLock): bigint {
  if (!Object.values(registryEntries).includes(entry as typeof registryEntries[keyof typeof registryEntries])) throw new Error('Unsupported registry entry')
  const required = entry === registryEntries.createTable || entry === registryEntries.destroyTable ? 3 : 2
  if (args.length < required || args.some(value => value < 0n || value > 0xffffffffffffffffn)) throw new Error('Invalid registry ABI arguments')
  /** Read only exact native-width fields. */
  function read(address: bigint, width: 4 | 8): bigint {
    const bytes = memory.read(address, width)
    if (bytes.length !== width) throw new Error('Registry field read truncated')
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return width === 4 ? BigInt(view.getUint32(0, true)) : view.getBigUint64(0, true)
  }
  /** Store exact low bits and preserve all surrounding state. */
  function write(address: bigint, value: bigint, width: 4 | 8): void {
    const bytes = new Uint8Array(width)
    const view = new DataView(bytes.buffer)
    if (width === 4) view.setUint32(0, Number(BigInt.asUintN(32, value)), true)
    else view.setBigUint64(0, BigInt.asUintN(64, value), true)
    memory.write(address, bytes)
  }
  const object = args[0]
  if (entry === registryEntries.createTable || entry === registryEntries.destroyTable) {
    const recordsField = args[1], countField = args[2]
    if (!object || !recordsField || !countField) return 7n
    if (entry === registryEntries.createTable) {
      if (read(recordsField, 8) && read(object, 8)) return 0n
      const records = heap.allocate(0xbf28)
      const index = heap.allocate(0x1fdc)
      if (!records || !index) { heap.free(records); heap.free(index); return 5n }
      memory.write(records, new Uint8Array(0xbf28))
      memory.write(index, new Uint8Array(0x1fdc).fill(255))
      write(recordsField, records, 8)
      write(object, index, 8)
      write(countField, 0n, 4)
      return 0n
    }
    const records = read(recordsField, 8), index = read(object, 8)
    if (records) {
      let cursor = 0n
      for (;;) {
        const count = read(countField, 4)
        if (count > 65536n) throw new Error('Registry record count exceeds boundary')
        if (cursor >= count) break
        heap.free(read(records + cursor * 24n, 8))
        cursor++
      }
      heap.free(records)
    }
    heap.free(index)
    write(object, 0n, 8)
    write(recordsField, 0n, 8)
    write(countField, 0n, 4)
    return 0n
  }
  if (!object) throw new Error('Registry list address is absent')
  const lock = object + 16n
  locks.lock(lock, entry === registryEntries.get ? 'read' : 'write')
  try {
    if (entry === registryEntries.get) {
      const index = BigInt.asUintN(32, args[1])
      if (index & 0x80000000n) return 0n
      const count = read(object + 12n, 4)
      if (count > 65536n) throw new Error('Registry list count exceeds boundary')
      if (index >= count) return 0n
      return read(read(object, 8) + index * 8n, 8)
    }
    const count = read(object + 12n, 4)
    if (count > 65536n) throw new Error('Registry list count exceeds boundary')
    if (entry === registryEntries.append) {
      const capacity = read(object + 8n, 4)
      if (capacity > 65536n) throw new Error('Registry list capacity exceeds boundary')
      if (count === 65536n) throw new Error('Registry list append exceeds boundary')
      if (capacity === count) {
        if (count * 2n > 65536n) throw new Error('Registry list growth exceeds boundary')
        const replacement = heap.reallocate(read(object, 8), Number(count * 16n))
        if (replacement) {
          write(object, replacement, 8)
          write(object + 8n, count * 2n, 4)
        }
      }
      write(object + 12n, count + 1n, 4)
      // Native still writes the old backing array if realloc fails; the memory provider must enforce its bounds.
      write(read(object, 8) + count * 8n, args[1], 8)
      return count
    }
    for (let index = 0n; index < count; index++) {
      const array = read(object, 8)
      if (read(array + index * 8n, 8) !== args[1]) continue
      write(array + index * 8n, 0n, 8)
      const remaining = count - 1n
      for (let cursor = index; cursor < remaining; cursor++) {
        const current = read(object, 8)
        write(current + cursor * 8n, read(current + (cursor + 1n) * 8n, 8), 8)
        write(read(object, 8) + (cursor + 1n) * 8n, 0n, 8)
      }
      write(object + 12n, remaining, 4)
      const capacity = count > 1n ? read(object + 8n, 4) : 0n
      if (capacity > 65536n) throw new Error('Registry list capacity exceeds boundary')
      if (count > 1n && remaining === capacity / 4n) {
        const replacement = heap.reallocate(read(object, 8), Number((capacity / 2n) * 8n))
        if (replacement) {
          write(object, replacement, 8)
          write(object + 8n, capacity / 2n, 4)
        }
      }
      return index
    }
    return 0xffffffffn
  } finally {
    locks.unlock(lock)
  }
}
