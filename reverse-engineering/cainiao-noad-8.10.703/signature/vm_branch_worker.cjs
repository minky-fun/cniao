/** Pipe-only branch comparison; operands, displacement and program addresses are never logged. */
const readline = require('node:readline')
const {vmBranch} = require(require('node:path').resolve(process.argv[2]))

/** Return exact branch state solely through the parent process pipe. */
function respond(line) {
  try {
    if (line.length > 260) throw new Error('bound')
    const [opcode, left, right, instruction, displacement] = JSON.parse(line)
    const pointer = BigInt(instruction)
    const result = vmBranch(opcode, BigInt(left), BigInt(right), pointer,
      /** Accept only this branch's following displacement record. */
      address => {
        if (address !== BigInt.asUintN(64, pointer + 24n)) throw new Error('address')
        return BigInt(displacement)
      })
    process.stdout.write(JSON.stringify({...result, next: result.next.toString()}) + '\n')
  } catch {
    process.stdout.write('{"error":"VM branch request rejected"}\n')
  }
}
readline.createInterface({input: process.stdin, crlfDelay: Infinity}).on('line', respond)
