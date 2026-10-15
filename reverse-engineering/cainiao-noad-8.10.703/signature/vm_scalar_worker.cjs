/** Pipe-only scalar bridge; input operands and output values must never be logged. */
const readline = require('node:readline')
const { vmScalar } = require(require('node:path').resolve(process.argv[2]))

/** Process bounded scalar calls without including raw data in error diagnostics. */
function respond(line) {
  try {
    if (line.length > 160) throw new Error('bound')
    const [opcode, left, right] = JSON.parse(line)
    const result = vmScalar(opcode, BigInt(left), BigInt(right))
    process.stdout.write(JSON.stringify({result: result.toString()}) + '\n')
  } catch {
    process.stdout.write('{"error":"VM scalar request rejected"}\n')
  }
}
readline.createInterface({input: process.stdin, crlfDelay: Infinity}).on('line', respond)
