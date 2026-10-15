/** Pipe-only frame bridge; all slot/frame bytes remain in transient process memory. */
const readline = require('node:readline')
const {vmFrame} = require(require('node:path').resolve(process.argv[2]))

/** Build one bounded byte-addressed guest view so overlapping frame/slot ranges stay coherent. */
function respond(line) {
  try {
    if (line.length > 4096) throw new Error('bound')
    const request = JSON.parse(line)
    if (!Array.isArray(request.ranges) || request.ranges.length !== 2) throw new Error('ranges')
    const bytes = new Map()
    for (const range of request.ranges) {
      const base = BigInt(range.address)
      const input = Buffer.from(range.bytes, 'base64')
      if (input.length > 256) throw new Error('bound')
      for (let index = 0; index < input.length; index++) {
        const address = BigInt.asUintN(64, base + BigInt(index))
        if (bytes.has(address) && bytes.get(address) !== input[index]) throw new Error('alias')
        bytes.set(address, input[index])
      }
    }
    const writes = []
    const memory = {
      /** Return only a wholly mapped native LDR/LDP group. */
      read(address, width) {
        if (width !== 8 && width !== 16) throw new Error('width')
        const result = new Uint8Array(width)
        for (let index = 0; index < width; index++) {
          const key = BigInt.asUintN(64, address + BigInt(index))
          if (!bytes.has(key)) throw new Error('unmapped')
          result[index] = bytes.get(key)
        }
        return result
      },
      /** Apply each native STR/STP in order, including effects visible through aliases. */
      write(address, input) {
        if (input.length !== 8 && input.length !== 16) throw new Error('width')
        for (let index = 0; index < input.length; index++) {
          const key = BigInt.asUintN(64, address + BigInt(index))
          if (!bytes.has(key)) throw new Error('unmapped')
          bytes.set(key, input[index])
        }
        writes.push({address, bytes: Buffer.from(input).toString('base64')})
      },
    }
    const result = vmFrame(request.opcode, BigInt(request.slots), BigInt(request.instruction), BigInt(request.immediate), BigInt(request.x22), BigInt(request.x23), memory)
    process.stdout.write(JSON.stringify({...result, writes},
      /** Preserve exact integer values solely in the parent pipe. */
      (_, value) => typeof value === 'bigint' ? value.toString() : value) + '\n')
  } catch {
    process.stdout.write('{"error":"VM frame request rejected"}\n')
  }
}
readline.createInterface({input: process.stdin, crlfDelay: Infinity}).on('line', respond)
