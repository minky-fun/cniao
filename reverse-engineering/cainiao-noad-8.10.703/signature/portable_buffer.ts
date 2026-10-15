import type {VmMemory} from './portable_vm_memory'

/** Explicit allocator boundary; a null allocation is a real failure, never substituted. */
export interface BufferHeap {
  /** Allocate exactly size bytes or return zero without changing existing objects. */
  allocate(size: number): bigint
  /** Preserve the allocator's copy/reuse/failure semantics for an existing data block. */
  reallocate(address: bigint, size: number): bigint
  /** Release a block and return the adapter's actual integer result. */
  free(address: bigint): bigint
}

/** Fixed-sample entry addresses are also the exact method pointers stored in objects. */
export const bufferEntries = {
  append: 0x102abf138n, grow: 0x102abf1b8n, get: 0x102abf260n,
  find: 0x102abf294n, clear: 0x102abf2d8n, cstring: 0x102abf318n,
  clone: 0x102abf384n, byte: 0x102abf3d8n, set: 0x102abf434n,
  appendBuffer: 0x102abf454n, create: 0x102abf544n,
  fromCString: 0x102abf64cn, fromBytes: 0x102abf6acn, destroy: 0x102abf70cn,
} as const
const methods = [bufferEntries.append, bufferEntries.byte, bufferEntries.grow, bufferEntries.get,
  bufferEntries.find, bufferEntries.clear, bufferEntries.cstring, bufferEntries.clone,
  bufferEntries.set, bufferEntries.appendBuffer, 0x102abf47cn]
const failed = 0xffffffffn

/** Read an exact unsigned little-endian field without narrowing a pointer to Number. */
function read(memory: VmMemory, address: bigint, width: number): bigint {
  const bytes = memory.read(address, width)
  if (bytes.length !== width) throw new Error('Buffer field read truncated')
  let value = 0n
  for (let index = width - 1; index >= 0; index--) value = (value << 8n) | BigInt(bytes[index])
  return value
}

/** Store the low field-width bits, matching STR W and STR X. */
function write(memory: VmMemory, address: bigint, value: bigint, width: number): void {
  const bytes = new Uint8Array(width)
  for (let index = 0; index < width; index++) bytes[index] = Number((value >> BigInt(index * 8)) & 255n)
  memory.write(address, bytes)
}

/** Apply signed W-register arithmetic and retain explicit host allocation limits. */
function size(value: bigint): number {
  if (value < 0n || value > 0x1000000n) throw new Error('Buffer size outside supported heap boundary')
  return Number(value)
}

/** Read a bounded, explicitly terminated C string, excluding its terminator. */
function cstringLength(memory: VmMemory, address: bigint): number {
  for (let index = 0; index < 8192; index++) {
    if (read(memory, address + BigInt(index), 1) === 0n) return index
  }
  throw new Error('Buffer C string exceeds explicit 8192-byte boundary')
}

/** Execute verified buffer helpers; printf append and foreign methods are not emulated. */
export function bufferCall(entry: bigint, args: readonly bigint[], memory: VmMemory, heap: BufferHeap): bigint {
  const required = entry === bufferEntries.create || entry === bufferEntries.fromCString ||
    entry === bufferEntries.clear || entry === bufferEntries.cstring || entry === bufferEntries.clone ||
    entry === bufferEntries.destroy ? 1 : entry === bufferEntries.append || entry === bufferEntries.get ||
    entry === bufferEntries.find || entry === bufferEntries.set ? 3 : 2
  if (!Object.values(bufferEntries).includes(entry as typeof bufferEntries[keyof typeof bufferEntries])) throw new Error('Unsupported buffer entry')
  if (args.length < required || args.some(value => value < 0n || value > 0xffffffffffffffffn)) throw new Error('Invalid buffer ABI arguments')
  const object = args[0]
  if (entry === bufferEntries.create) {
    const capacity = BigInt.asIntN(32, object)
    if (capacity < 1n) return 0n
    const count = size(capacity)
    const header = heap.allocate(104)
    if (!header) return 0n
    memory.write(header, new Uint8Array(104))
    write(memory, header + 12n, capacity, 4)
    const data = heap.allocate(count)
    if (!data) { heap.free(header); return 0n }
    memory.write(data, new Uint8Array(count))
    write(memory, header, data, 8)
    for (let index = 0; index < methods.length; index++) write(memory, header + 16n + BigInt(index * 8), methods[index], 8)
    return header
  }
  if (entry === bufferEntries.grow) {
    if (!object) return failed
    const extra = BigInt.asIntN(32, args[1])
    const data = read(memory, object, 8)
    if (data) {
      const increment = BigInt.asIntN(32, extra + 100n)
      const old = BigInt.asIntN(32, read(memory, object + 12n, 4))
      const capacity = BigInt.asIntN(32, old + increment)
      const count = size(capacity)
      size(old); size(increment)
      const next = heap.reallocate(data, count)
      if (!next) return failed
      write(memory, object, next, 8)
      memory.write(next + old, new Uint8Array(size(increment)))
      write(memory, object + 12n, capacity, 4)
    } else {
      const capacity = extra > 100n ? extra : 100n
      const next = heap.allocate(size(capacity))
      if (!next) { write(memory, object, 0n, 8); return failed }
      memory.write(next, new Uint8Array(size(capacity)))
      write(memory, object, next, 8)
      write(memory, object + 8n, 0n, 4)
      write(memory, object + 12n, capacity, 4)
    }
    return 0n
  }
  if (entry === bufferEntries.append || entry === bufferEntries.byte) {
    if (!object) return 0n
    const single = entry === bufferEntries.byte
    const count = single ? 1n : BigInt.asIntN(32, args[2])
    if (!single && (!args[1] || count < 1n)) return object
    let length = BigInt.asIntN(32, read(memory, object + 8n, 4))
    const capacity = BigInt.asIntN(32, read(memory, object + 12n, 4))
    const grow = single ? length >= BigInt.asIntN(32, capacity - 1n) : BigInt.asIntN(32, length + count) >= capacity
    if (grow) {
      const result = bufferCall(bufferEntries.grow, [object, BigInt.asUintN(32, count)], memory, heap)
      if (BigInt.asIntN(32, result) < 0n) return result
      length = BigInt.asIntN(32, read(memory, object + 8n, 4))
    }
    const destination = read(memory, object, 8) + length
    size(length)
    if (single) write(memory, destination, args[1], 1)
    else memory.write(destination, memory.read(args[1], size(count)))
    write(memory, object + 8n, read(memory, object + 8n, 4) + count, 4)
    return single ? (grow ? 0n : object) : destination
  }
  if (entry === bufferEntries.get || entry === bufferEntries.set || entry === bufferEntries.find) {
    const index = BigInt.asIntN(32, args[1])
    const length = object ? BigInt.asIntN(32, read(memory, object + 8n, 4)) : 0n
    if (!object || index < 0n || index >= length) {
      if (entry === bufferEntries.get) {
        if (args[2]) write(memory, args[2], failed, 4)
        return 255n
      }
      return entry === bufferEntries.find ? failed : object
    }
    const data = read(memory, object, 8)
    if (entry === bufferEntries.get) return read(memory, data + index, 1)
    if (entry === bufferEntries.set) { write(memory, data + index, args[2], 1); return object }
    size(length)
    for (let current = index; current < length; current++) {
      if (read(memory, data + current, 1) === BigInt.asUintN(32, args[2])) return current
    }
    return failed
  }
  if (entry === bufferEntries.clear) {
    if (!object) return failed
    const data = read(memory, object, 8)
    if (!data) return failed
    memory.write(data, new Uint8Array(size(BigInt.asIntN(32, read(memory, object + 12n, 4)))))
    write(memory, object + 8n, 0n, 4)
    return 0n
  }
  if (entry === bufferEntries.cstring) {
    if (!object) return 0n
    const length = BigInt.asIntN(32, read(memory, object + 8n, 4))
    size(length)
    const output = heap.allocate(size(length + 1n))
    if (!output) return 0n
    memory.write(output, new Uint8Array(size(length + 1n)))
    memory.write(output, memory.read(read(memory, object, 8), size(length)))
    return output
  }
  if (entry === bufferEntries.clone || entry === bufferEntries.fromBytes || entry === bufferEntries.fromCString) {
    if (!object) return 0n
    const length = entry === bufferEntries.clone ? read(memory, object + 8n, 4) :
      entry === bufferEntries.fromCString ? BigInt(cstringLength(memory, object)) : BigInt.asUintN(32, args[1])
    if (entry === bufferEntries.fromBytes && BigInt.asIntN(32, length) < 1n) return 0n
    const output = bufferCall(bufferEntries.create, [BigInt.asUintN(32, length + 1n)], memory, heap)
    if (!output) return 0n
    if (read(memory, output + 16n, 8) !== bufferEntries.append) throw new Error('Unsupported buffer append method')
    bufferCall(bufferEntries.append, [output, entry === bufferEntries.clone ? read(memory, object, 8) : object, length], memory, heap)
    return output
  }
  if (entry === bufferEntries.appendBuffer) {
    if (!object || !args[1]) return object
    const source = read(memory, args[1], 8)
    const length = read(memory, args[1] + 8n, 4)
    if (!source || BigInt.asIntN(32, length) < 1n) return object
    return bufferCall(bufferEntries.append, [object, source, length], memory, heap)
  }
  if (entry === bufferEntries.destroy) {
    if (!object) return 0n
    const data = read(memory, object, 8)
    if (data) heap.free(data)
    return heap.free(object)
  }
  throw new Error('Unreachable buffer dispatch')
}

/** The separate 56-byte string object has different growth and input validation rules. */
export const stringEntries = {
  append: 0x102a7249cn, cstring: 0x102a72570n, byte: 0x102a725b0n,
  create: 0x102a725dcn, clear: 0x102a726ccn, destroy: 0x102a7270cn,
} as const

/** Execute verified string object methods; encoded append remains an explicit external dependency. */
export function stringCall(entry: bigint, args: readonly bigint[], memory: VmMemory, heap: BufferHeap): bigint {
  if (!Object.values(stringEntries).includes(entry as typeof stringEntries[keyof typeof stringEntries])) throw new Error('Unsupported string entry')
  const required = entry === stringEntries.create ? 0 : entry === stringEntries.append ? 3 :
    entry === stringEntries.cstring || entry === stringEntries.byte ? 2 : 1
  if (args.length < required || args.some(value => value < 0n || value > 0xffffffffffffffffn)) throw new Error('Invalid string ABI arguments')
  if (entry === stringEntries.create) {
    const header = heap.allocate(56)
    if (!header) return 0n
    memory.write(header, new Uint8Array(56))
    const data = heap.allocate(128)
    if (!data) { heap.free(header); return 0n }
    memory.write(data, new Uint8Array(128))
    write(memory, header, data, 8)
    write(memory, header + 12n, 128n, 4)
    const pointers = [stringEntries.cstring, stringEntries.byte, stringEntries.append, 0x102a72688n, stringEntries.clear]
    for (let index = 0; index < pointers.length; index++) write(memory, header + 16n + BigInt(index * 8), pointers[index], 8)
    return header
  }
  const object = args[0]
  if (entry === stringEntries.clear) return bufferCall(bufferEntries.clear, [object], memory, heap)
  if (entry === stringEntries.destroy) return bufferCall(bufferEntries.destroy, [object], memory, heap)
  // The C-string wrapper calls strlen even when the destination object is null.
  const wrappedLength = entry === stringEntries.cstring ? (args[1] ? cstringLength(memory, args[1]) : 0) : undefined
  const count = wrappedLength !== undefined ? BigInt(wrappedLength) : entry === stringEntries.byte ? 1n : BigInt.asIntN(32, args[2])
  if (!object || (entry !== stringEntries.byte && !args[1]) || count < 1n) return object
  let data = read(memory, object, 8)
  if (!data) return object
  // A zero byte produces an empty temporary C string and is therefore not appended.
  const sourceLength = entry === stringEntries.byte ? (Number(args[1] & 255n) ? 1 : 0) :
    wrappedLength !== undefined ? wrappedLength : cstringLength(memory, args[1])
  if (BigInt(sourceLength) < count) return object
  let length = BigInt.asIntN(32, read(memory, object + 8n, 4))
  const capacity = BigInt.asIntN(32, read(memory, object + 12n, 4))
  const total = BigInt.asIntN(32, length + count)
  if (total >= capacity) {
    const incremented = BigInt.asIntN(32, total + 1n)
    const rounded = BigInt.asUintN(32, incremented < 0n ? total + 128n : total + 1n) & 0xffffff80n
    const nextCapacity = BigInt.asIntN(32, rounded + 128n)
    const allocated = size(nextCapacity)
    size(capacity); size(nextCapacity - capacity)
    data = heap.reallocate(data, allocated)
    write(memory, object, data, 8)
    // Native code stores NULL then faults through bzero on realloc failure; never report success.
    if (!data) throw new Error('Native string realloc failure has no successful continuation')
    memory.write(data + capacity, new Uint8Array(size(nextCapacity - capacity)))
    write(memory, object + 12n, nextCapacity, 4)
    length = BigInt.asIntN(32, read(memory, object + 8n, 4))
  }
  size(length)
  if (entry === stringEntries.byte) write(memory, data + length, args[1], 1)
  else memory.write(data + length, memory.read(args[1], size(count)))
  write(memory, object + 8n, total, 4)
  return object
}
