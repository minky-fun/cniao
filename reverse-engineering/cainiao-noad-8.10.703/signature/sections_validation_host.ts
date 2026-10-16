import type {VmMemory} from './portable_vm_memory'
import type {BufferHeap} from './portable_buffer'
import {moduleSections, moduleSectionsEntry} from './portable_module_sections'
import {standardCall as previousCall, standardEntries as previousEntries} from './expand_validation_host'

export const standardEntries = {...previousEntries, moduleSections: moduleSectionsEntry} as const

/** Add section parsing to the research composition without changing existing module calls. */
export function standardCall(entry: bigint, args: readonly bigint[], stack: bigint, memory: VmMemory, heap: BufferHeap): bigint {
  if (entry === moduleSectionsEntry) return moduleSections(args[0], args[1], memory)
  return previousCall(entry, args, stack, memory, heap)
}
