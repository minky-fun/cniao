import type {VmMemory} from './portable_vm_memory'
import type {BufferHeap} from './portable_buffer'
import {moduleCall, moduleEntries} from './portable_vm_module'
import {standardCall as previousCall, standardEntries as previousEntries} from './portable_zlib_host'

export const standardEntries = {...previousEntries, ...moduleEntries} as const

/** Retain the pre-existing offline probe's explicit zero clock, separate from portable module logic. */
function getTime(memory: VmMemory, timeval: bigint, timezone: bigint): void {
  memory.write(timeval, new Uint8Array(16))
  memory.write(timezone, new Uint8Array(8))
}

/** Compose research replacements only; no production clock or process initialization is inferred. */
export function standardCall(entry: bigint, args: readonly bigint[], stack: bigint, memory: VmMemory, heap: BufferHeap): bigint {
  if (Object.values(moduleEntries).includes(entry as typeof moduleEntries[keyof typeof moduleEntries])) return moduleCall(entry, args, stack, memory, heap, {getTime})
  return previousCall(entry, args, stack, memory, heap)
}
