/** Execute verified buffer operations using private, synchronous parent memory/heap pipes. */
const fs = require('node:fs')
const {bufferCall, stringCall, stringEntries} = require(require('node:path').resolve(process.argv[2]))
let pending = ''

/** Read one bounded message; parent EOF terminates the worker without saving state. */
function receive() {
  for (;;) {
    const newline = pending.indexOf('\n')
    if (newline >= 0) {
      const line = pending.slice(0, newline)
      pending = pending.slice(newline + 1)
      return JSON.parse(line)
    }
    if (pending.length > 65536) throw new Error('Buffer response exceeds boundary')
    const bytes = Buffer.alloc(4096)
    const count = fs.readSync(0, bytes, 0, bytes.length, null)
    if (!count) return undefined
    pending += bytes.toString('utf8', 0, count)
  }
}

/** Encode bigint pointers losslessly in the memory pipe only. */
function encode(_key, value) { return typeof value === 'bigint' ? value.toString() : value }

/** Apply bounded primitive memory and heap requests, preserving allocator failures. */
function execute(request) {
  let operations = 0
  /** Request exactly one acknowledged operation; reject unknown protocol responses. */
  function exchange(event) {
    if (++operations > 65536) throw new Error('Buffer operation budget exceeded')
    process.stdout.write(JSON.stringify(event, encode) + '\n')
    const response = receive()
    if (!response || response.accepted !== true) throw new Error('Buffer parent rejected operation')
    return response
  }
  const memory = {
    /** Fetch exact byte chunks without exporting memory to files or diagnostic output. */
    read(address, width) {
      if (!Number.isSafeInteger(width) || width < 0 || width > 0x1000000) throw new Error('Buffer read boundary exceeded')
      const bytes = new Uint8Array(width)
      for (let offset = 0; offset < width; offset += 4096) {
        const count = Math.min(4096, width - offset)
        const response = exchange({event: 'read', address: address + BigInt(offset), width: count})
        const part = Buffer.from(response.bytes, 'base64')
        if (part.length !== count) throw new Error('Buffer read truncated')
        bytes.set(part, offset)
      }
      return bytes
    },
    /** Write exact chunks immediately so subsequent aliased reads see native ordering. */
    write(address, bytes) {
      if (bytes.length > 0x1000000) throw new Error('Buffer write boundary exceeded')
      for (let offset = 0; offset < bytes.length; offset += 4096) {
        exchange({event: 'write', address: address + BigInt(offset), bytes: Buffer.from(bytes.subarray(offset, offset + 4096)).toString('base64')})
      }
    },
  }
  const heap = {
    /** Return the exact pointer or allocation failure supplied by the explicit host. */
    allocate(size) { return BigInt(exchange({event: 'allocate', size}).pointer) },
    /** Retain the host allocator's copying, in-place reuse and failure behavior. */
    reallocate(address, size) { return BigInt(exchange({event: 'reallocate', address, size}).pointer) },
    /** Preserve free's observable integer result in the native validation adapter. */
    free(address) { return BigInt(exchange({event: 'free', address}).integer) },
  }
  const entry = BigInt(request.entry)
  const operation = Object.values(stringEntries).includes(entry) ? stringCall : bufferCall
  return operation(entry, request.arguments.map(BigInt), memory, heap)
}

for (;;) {
  const request = receive()
  if (request === undefined) break
  try {
    process.stdout.write(JSON.stringify({event: 'result', integer: execute(request)}, encode) + '\n')
  } catch {
    process.stdout.write('{"event":"error","message":"Buffer request rejected"}\n')
  }
}
