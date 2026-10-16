import type {VmMemory} from './portable_vm_memory'
import type {BufferHeap} from './portable_buffer'
import {expandPacked, packedExpandEntry} from './portable_packed_expand'
import {standardCall as moduleCall, standardEntries as moduleEntries} from './module_validation_host'

export const standardEntries = {...moduleEntries, expandPacked: packedExpandEntry} as const

/** Compose the bounded expander with previously verified research replacements. */
export function standardCall(entry: bigint, args: readonly bigint[], stack: bigint, memory: VmMemory, heap: BufferHeap): bigint {
  if (entry === packedExpandEntry) return expandPacked(args[0], memory)
  return moduleCall(entry, args, stack, memory, heap)
}
