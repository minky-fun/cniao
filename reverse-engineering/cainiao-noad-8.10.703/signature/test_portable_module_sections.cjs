/** Public parser tests for exact field widths, partial rejection, aliasing and bounded inputs. */
const assert = require('node:assert/strict')
const {moduleSections} = require(require('node:path').resolve(process.argv[2]))
let behavior = 0, rejected = 0

class Memory {
  /** Map synthetic source and destination regions without inventing unmapped bytes. */
  constructor(descriptors = []) {
    this.source = new Uint8Array(65536)
    this.output = new Uint8Array(280).fill(0xa5)
    this.regions = [[0x1000n, this.source], [0x20000n, this.output]]
    this.writes = 0
    this.put(0x1008n, 65536n, 4)
    this.put(0x1034n, 112n, 4)
    this.put(0x1038n, BigInt(descriptors.length), 4)
    this.put(0x20030n, 0x2000n)
    this.put(0x20038n, 0n, 4)
    for (let index = 0; index < descriptors.length; index++) {
      this.put(0x1070n + BigInt(index * 8), BigInt(descriptors[index][0]), 4)
      this.put(0x1074n + BigInt(index * 8), BigInt(descriptors[index][1]), 4)
    }
    this.writes = 0
  }
  /** Return a shared view so parser alias handling is tested directly. */
  read(address, width) {
    for (const [base, bytes] of this.regions) if (address >= base && address + BigInt(width) <= base + BigInt(bytes.length)) return bytes.subarray(Number(address - base), Number(address - base) + width)
    throw new Error('Unmapped public section read')
  }
  /** Apply exact writes and retain their native ordering. */
  write(address, bytes) { this.read(address, bytes.length).set(bytes); this.writes++ }
  /** Set a public native-width field. */
  put(address, value, width = 8) {
    const view = new DataView(this.read(address, width).buffer, this.read(address, width).byteOffset, width)
    if (width === 8) view.setBigUint64(0, value, true)
    else view.setUint32(0, Number(value), true)
  }
  /** Read a public native-width field. */
  get(address, width = 8) {
    const bytes = this.read(address, width)
    const view = new DataView(bytes.buffer, bytes.byteOffset, width)
    return width === 8 ? view.getBigUint64(0, true) : BigInt(view.getUint32(0, true))
  }
}
{
  const memory = new Memory([[1, 512], [2, 0xffffffff], [1, 768]])
  assert.equal(moduleSections(0x1000n, 0x20000n, memory), 0n)
  assert.equal(memory.get(0x20010n), 0x1300n)
  assert.equal(memory.get(0x20018n, 4), 0xffffffffn)
  assert.equal(memory.get(0x2001cn, 4), 0xa5a5a5a5n)
  assert.equal(memory.get(0x2005cn, 4), 0n)
  behavior++
}
{
  const memory = new Memory([[1, 512], [23, 1], [2, 17]])
  assert.equal(moduleSections(0x1000n, 0x20000n, memory), 1n)
  assert.equal(memory.get(0x20010n), 0x1200n)
  assert.equal(memory.get(0x20018n, 4), 0xa5a5a5a5n)
  assert.equal(memory.get(0x2005cn, 4), 0xa5a5a5a5n)
  behavior++
}
{
  const memory = new Memory([[11, 4096], [12, 2]])
  memory.put(0x2004n, 0xffffffffn, 4)
  memory.put(0x200cn, 2n, 4)
  assert.equal(moduleSections(0x1000n, 0x20000n, memory), 0n)
  assert.equal(memory.get(0x2005cn, 4), 1n)
  behavior++
}
{
  const memory = new Memory([[1, 512], [2, 3]])
  assert.equal(moduleSections(0x1000n, 0x1068n, memory), 1n)
  assert.equal(memory.get(0x1078n), 0x1200n)
  behavior++
}
for (const [source, target] of [[0n, 0x20000n], [0x1000n, 0n]]) {
  const memory = new Memory()
  assert.equal(moduleSections(source, target, memory), 7n)
  assert.equal(memory.writes, 0)
  behavior++
}
{
  const memory = new Memory([[1, 512]])
  memory.put(0x1008n, 119n, 4)
  assert.equal(moduleSections(0x1000n, 0x20000n, memory), 1n)
  assert.equal(memory.writes, 0)
  behavior++
}
{
  const memory = new Memory()
  memory.put(0x1008n, 0x100000n, 4)
  memory.put(0x1038n, 65537n, 4)
  assert.throws(() => moduleSections(0x1000n, 0x20000n, memory), /count exceeds/)
  rejected++
}
{
  const memory = new Memory()
  memory.put(0x20038n, 65537n, 4)
  assert.throws(() => moduleSections(0x1000n, 0x20000n, memory), /aggregate count exceeds/)
  rejected++
}
{
  const memory = {
    /** Return a deliberately truncated public field. */
    read() { return new Uint8Array(3) },
    /** Reject any attempted write after a truncated field. */
    write() { assert.fail('Truncated reads cannot write') },
  }
  assert.throws(() => moduleSections(0x1000n, 0x20000n, memory), /truncated/)
  rejected++
}
console.log(JSON.stringify({section_behavior_cases: behavior, section_rejection_cases: rejected}))
