import type {VmMemory} from './portable_vm_memory'
import type {BufferHeap} from './portable_buffer'
import {registryCall, registryEntries} from './portable_module_registry'
import {standardCall as previousCall, standardEntries as previousEntries} from './sections_validation_host'

export const standardEntries = {...previousEntries, ...registryEntries} as const

/** Preserve the existing offline probe's single-thread synchronization model, without claiming native locks. */
function lock(_address: bigint, _mode: 'read' | 'write'): void {}

/** Complete only the explicit serial validation boundary. */
function unlock(_address: bigint): void {}

/** Compose registry data operations with the earlier portable research layers. */
export function standardCall(entry: bigint, args: readonly bigint[], stack: bigint, memory: VmMemory, heap: BufferHeap): bigint {
  if (Object.values(registryEntries).includes(entry as typeof registryEntries[keyof typeof registryEntries])) return registryCall(entry, args, memory, heap, {lock, unlock})
  return previousCall(entry, args, stack, memory, heap)
}
