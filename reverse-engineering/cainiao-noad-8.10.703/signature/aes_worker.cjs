/** Pipe-only bridge for in-memory native/TypeScript comparison; never run with log teeing. */
const readline = require('node:readline')
const { aesPkcs7 } = require(require('node:path').resolve(process.argv[2]))

/** Process one bounded comparison request without copying keys or data to stderr/files. */
function respond(line) {
  try {
    const request = JSON.parse(line)
    if (typeof request.input !== 'string' || request.input.length > 1500000) throw new Error('bound')
    const result = aesPkcs7(
      new Uint8Array(Buffer.from(request.input, 'base64')),
      new Uint8Array(Buffer.from(request.key, 'base64')),
      request.direction, request.mode,
      request.iv === null ? null : new Uint8Array(Buffer.from(request.iv, 'base64')),
    )
    process.stdout.write(JSON.stringify({ result: Buffer.from(result).toString('base64') }) + '\n')
  } catch {
    // Do not include parser messages, request strings, key material or output in diagnostics.
    process.stdout.write('{"error":"AES comparison worker rejected request"}\n')
  }
}

readline.createInterface({ input: process.stdin, crlfDelay: Infinity }).on('line', respond)
