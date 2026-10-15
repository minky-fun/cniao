import type {VmMemory} from './portable_vm_memory'

/** Reproduce the exact ordered paired reads/writes of the two observed frame handlers. */
export function vmFrame(opcode: number, slots: bigint, instruction: bigint, immediate: bigint, x22: bigint, x23: bigint, memory: VmMemory): {next: bigint; registers: Record<string, bigint>} {
  if (opcode !== 0 && opcode !== 31) throw new Error('Unsupported VM frame opcode')
  for (const operand of [slots, instruction, immediate, x22, x23]) {
    if (operand < 0n || operand > 0xffffffffffffffffn) throw new Error('VM frame operand is outside uint64')
  }
  /** Read one native LDR/LDP group before its corresponding write, preserving alias behavior. */
  function read(address: bigint, count: number): bigint[] {
    const bytes = memory.read(BigInt.asUintN(64, address), count * 8)
    if (bytes.length !== count * 8) throw new Error('VM frame read width mismatch')
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const result: bigint[] = []
    for (let index = 0; index < count; index++) result.push(view.getBigUint64(index * 8, true))
    return result
  }
  /** Write the same ordered group width as native STR/STP using explicit little endian. */
  function write(address: bigint, values: bigint[]): void {
    const bytes = new Uint8Array(values.length * 8)
    const view = new DataView(bytes.buffer)
    for (let index = 0; index < values.length; index++) view.setBigUint64(index * 8, values[index], true)
    memory.write(BigInt.asUintN(64, address), bytes)
  }
  let pair: bigint[]
  if (opcode === 31) {
    const frame = read(slots + 0x70n, 1)[0]
    write(slots + 0x70n, [BigInt.asUintN(64, frame + immediate)])
    for (let offset = 0; offset < 0x80; offset += 16) write(frame + BigInt(offset), read(slots + 0x80n + BigInt(offset), 2))
    write(frame + 0x80n, read(slots + 0x30n, 2))
    for (let offset = 0; offset < 0x30; offset += 16) {
      pair = read(slots + 0x40n + BigInt(offset), 2)
      write(slots + 0xc0n + BigInt(offset), pair)
    }
    write(slots + 0xf0n, [frame])
    const returnAddress = read(slots + 0x78n, 1)[0]
    write(slots + 0xf8n, [returnAddress])
    return {next: BigInt.asUintN(64, instruction + 16n), registers: {x0: immediate, x9: returnAddress, x10: pair![1], x11: frame, x22: x23}}
  }
  const frame = read(slots + 0xf0n, 1)[0]
  for (let offset = 0; offset < 0x30; offset += 16) write(slots + 0x40n + BigInt(offset), read(slots + 0xc0n + BigInt(offset), 2))
  write(slots + 0x78n, read(slots + 0xf8n, 1))
  for (let offset = 0; offset < 0x80; offset += 16) write(slots + 0x80n + BigInt(offset), read(frame + BigInt(offset), 2))
  pair = read(frame + 0x80n, 2)
  write(slots + 0x30n, pair)
  const restoredX22 = read(frame + 0x78n, 1)[0]
  write(slots + 0x70n, [frame])
  const returnAddress = read(slots + 0x78n, 1)[0]
  return {next: BigInt.asUintN(64, returnAddress + 16n), registers: {x9: returnAddress, x10: pair[1], x11: frame, x22: restoredX22, x23: x22}}
}
