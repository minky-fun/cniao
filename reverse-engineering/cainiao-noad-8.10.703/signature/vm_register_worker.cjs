/** Pipe-only register bridge; never record raw operands, records or register state. */
const readline = require('node:readline')
const {vmRegister} = require(require('node:path').resolve(process.argv[2]))

/** Execute a bounded record with an explicit sparse slot snapshot. */
function respond(line) {
  try {
    if (line.length > 4096) throw new Error('bound')
    const request = JSON.parse(line)
    const state = Object.fromEntries(Object.entries(request.state).map(([key, value]) => [key, BigInt(value)]))
    const result = vmRegister(new Uint8Array(Buffer.from(request.record, 'base64')),
      /** Fail if the instruction reads any slot the host did not explicitly supply. */
      index => {
        if (!Object.prototype.hasOwnProperty.call(request.slots, index)) throw new Error('slot')
        return BigInt(request.slots[index])
      }, state)
    process.stdout.write(JSON.stringify({...result, writes: result.writes.map(write => ({address: write.address, bytes: Buffer.from(write.bytes).toString('base64')}))},
      /** Preserve integer precision throughout the pipe protocol. */
      (_, value) => typeof value === 'bigint' ? value.toString() : value) + '\n')
  } catch {
    process.stdout.write('{"error":"VM register request rejected"}\n')
  }
}
readline.createInterface({input: process.stdin, crlfDelay: Infinity}).on('line', respond)
