/** Execute the integer ABI subset using bounded, synchronous memory requests over parent pipes. */
const fs = require('node:fs')
const {vmIntegerAbiPlan, vmIntegerAbiFinish} = require(require('node:path').resolve(process.argv[2]))
let pending = ''

/** Read one bounded JSON line without competing asynchronous stdin readers. */
function receive() {
  for (;;) {
    const newline = pending.indexOf('\n')
    if (newline >= 0) {
      const line = pending.slice(0, newline)
      pending = pending.slice(newline + 1)
      return JSON.parse(line)
    }
    if (pending.length > 65536) throw new Error('Oversized ABI response')
    const buffer = Buffer.alloc(4096)
    const count = fs.readSync(0, buffer, 0, buffer.length, null)
    if (count === 0) return undefined
    pending += buffer.toString('utf8', 0, count)
  }
}

/** Serialize only pipe traffic; no state or diagnostics are persisted. */
function encode(_key, value) { return typeof value === 'bigint' ? value.toString() : value }

/** Request exact primitive widths from the parent and return only the completed call plan. */
function execute(request) {
  let operations = 0
  const memory = {
    /** Fetch one primitive field, rejecting missing or truncated parent responses. */
    read(address, width) {
      if (++operations > 4096 || ![1, 2, 4, 8].includes(width)) throw new Error('ABI memory boundary exceeded')
      process.stdout.write(JSON.stringify({event: 'read', address, width}, encode) + '\n')
      const response = receive()
      if (!response || typeof response.bytes !== 'string') throw new Error('ABI read rejected')
      const bytes = Buffer.from(response.bytes, 'base64')
      if (bytes.length !== width) throw new Error('ABI read width mismatch')
      return bytes
    },
    /** Ask the parent to apply one exact eight-byte result write. */
    write(address, bytes) {
      if (++operations > 4096 || bytes.length !== 8) throw new Error('ABI write boundary exceeded')
      process.stdout.write(JSON.stringify({event: 'write', address, bytes: Buffer.from(bytes).toString('base64')}, encode) + '\n')
      const response = receive()
      if (!response || response.accepted !== true) throw new Error('ABI write rejected')
    },
  }
  if (request.operation === 'plan') {
    const plan = vmIntegerAbiPlan(BigInt(request.context), BigInt(request.descriptor), memory)
    return {plan: {...plan, stack: plan.stack.map(item => ({offset: item.offset, bytes: Buffer.from(item.bytes).toString('base64')}))}}
  }
  if (request.operation === 'finish') {
    const plan = request.plan
    plan.result.address = BigInt(plan.result.address)
    return {status: vmIntegerAbiFinish(plan, BigInt(request.integer), memory)}
  }
  throw new Error('Unsupported ABI operation')
}

for (;;) {
  const request = receive()
  if (request === undefined) break
  try {
    process.stdout.write(JSON.stringify({event: 'result', ...execute(request)}, encode) + '\n')
  } catch {
    process.stdout.write('{"event":"error","message":"VM integer ABI request rejected"}\n')
  }
}
