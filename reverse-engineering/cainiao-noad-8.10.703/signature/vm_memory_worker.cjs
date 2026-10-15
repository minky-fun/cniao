/** Pipe-only memory bridge; never persist or log request/response data. */
const readline = require('node:readline')
const {vmMemory} = require(require('node:path').resolve(process.argv[2]))

/** Validate a single bounded host-memory access and return only to the parent pipe. */
function respond(line) {
  try {
    if (line.length > 400) throw new Error('bound')
    const request = JSON.parse(line)
    const address = BigInt(request.address)
    let readCount = 0
    let written = null
    const memory = {
      /** Supply exactly the host-validated range to the TypeScript instruction. */
      read(target, width) {
        if (target !== address || readCount++ !== 0 || request.input === null) throw new Error('read')
        const bytes = new Uint8Array(Buffer.from(request.input, 'base64'))
        if (bytes.length !== width || width > 8) throw new Error('width')
        return bytes
      },
      /** Capture exactly one write at the host-validated address. */
      write(target, bytes) {
        if (target !== address || written !== null || request.input !== null || bytes.length > 8) throw new Error('write')
        written = Buffer.from(bytes).toString('base64')
      },
    }
    const result = vmMemory(request.opcode, BigInt(request.base), BigInt(request.offset), BigInt(request.value), memory)
    if ((readCount === 1) === (written !== null)) throw new Error('access')
    process.stdout.write(JSON.stringify({result: result.toString(), written}) + '\n')
  } catch {
    process.stdout.write('{"error":"VM memory request rejected"}\n')
  }
}
readline.createInterface({input: process.stdin, crlfDelay: Infinity}).on('line', respond)
