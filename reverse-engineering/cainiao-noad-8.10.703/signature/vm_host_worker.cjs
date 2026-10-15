/** Execute only verified host ABI operations; all guest bytes stay inside parent/child pipes. */
const readline = require('node:readline')
const {vmHostPlan, vmHostFinish, vmSetCallDescriptor, vmCommonFunction, vmDispatchBridge} = require(require('node:path').resolve(process.argv[2]))

/** Convert BigInt fields without interpreting code or writing guest data to disk. */
function encode(_key, value) { return typeof value === 'bigint' ? value.toString() : value }

/** Run one bounded request against byte-addressed memory, preserving overlapping regions. */
function execute(request) {
  const bytes = new Map()
  const writes = []
  if (request.ranges.length > 8) throw new Error('Too many regions')
  for (const range of request.ranges) {
    const start = BigInt(range.address)
    const raw = Buffer.from(range.bytes, 'base64')
    if (start < 0n || start + BigInt(raw.length) > 1n << 64n || raw.length > 4096) throw new Error('Invalid region')
    for (let index = 0; index < raw.length; index++) {
      const address = start + BigInt(index)
      if (bytes.has(address) && bytes.get(address) !== raw[index]) throw new Error('Conflicting regions')
      bytes.set(address, raw[index])
    }
  }
  const memory = {
    /** Require each loaded byte to be included in the explicit request. */
    read(address, width) {
      const output = new Uint8Array(width)
      for (let index = 0; index < width; index++) {
        const value = bytes.get(address + BigInt(index))
        if (value === undefined) throw new Error('Unmapped read')
        output[index] = value
      }
      return output
    },
    /** Keep write order and require all destination bytes to have been mapped. */
    write(address, input) {
      for (let index = 0; index < input.length; index++) {
        const location = address + BigInt(index)
        if (!bytes.has(location)) throw new Error('Unmapped write')
        bytes.set(location, input[index])
      }
      writes.push({address, bytes: Buffer.from(input).toString('base64')})
    },
  }
  if (request.operation === 'plan') {
    return {plan: vmHostPlan(BigInt(request.engine), BigInt(request.context), BigInt(request.descriptor), memory), writes}
  }
  if (request.operation === 'thunk') {
    vmSetCallDescriptor(BigInt(request.engine), BigInt(request.context), memory)
    return {writes}
  }
  if (request.operation === 'common') {
    return {value: vmCommonFunction(BigInt(request.index), BigInt(request.table), memory), writes}
  }
  if (request.operation === 'dispatch') {
    return {plan: vmDispatchBridge(BigInt(request.request), BigInt(request.error), BigInt(request.storage), memory), writes}
  }
  if (request.operation === 'finish') {
    const plan = request.plan
    plan.target = BigInt(plan.target)
    plan.arguments = plan.arguments.map(BigInt)
    if (plan.result) plan.result.address = BigInt(plan.result.address)
    return {status: vmHostFinish(plan, BigInt(request.integer), BigInt(request.floating), memory), writes}
  }
  throw new Error('Unsupported host operation')
}

/** Process one line without exporting errors that could contain guest values. */
function receive(line) {
  try {
    if (line.length > 65536) throw new Error('Oversized request')
    process.stdout.write(JSON.stringify(execute(JSON.parse(line)), encode) + '\n')
  } catch {
    process.stdout.write('{"error":"VM host request rejected"}\n')
  }
}
readline.createInterface({input: process.stdin}).on('line', receive)
