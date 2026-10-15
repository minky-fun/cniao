/** Execute verified call control with resumable host yields; private bytes travel only through parent pipes. */
const fs = require('node:fs')
const api = require(require('node:path').resolve(process.argv[2]))
const runtime = process.argv[3] ? require(require('node:path').resolve(process.argv[3])) : undefined
const pages = new Map()
const dirty = new Map()
let pending = ''
let nextId = 1
const calls = new Map()

/** Read a bounded protocol line without asynchronous competing readers. */
function receive() {
  for (;;) {
    const index = pending.indexOf('\n')
    if (index >= 0) {
      const line = pending.slice(0, index)
      pending = pending.slice(index + 1)
      return JSON.parse(line)
    }
    if (pending.length > 65536) throw new Error('protocol bound')
    const bytes = Buffer.alloc(4096)
    const count = fs.readSync(0, bytes, 0, bytes.length, null)
    if (count === 0) return undefined
    pending += bytes.toString('utf8', 0, count)
  }
}

/** Encode exact integer bits solely for the parent's pipe. */
function encode(_key, value) { return typeof value === 'bigint' ? value.toString() : value }

/** Request exact native loads and stores, preserving aliases across suspended calls. */
const remote = {
  /** Require the parent to supply every byte instead of guessing missing state. */
  read(address, width) {
    if (![1, 2, 4, 8, 16, 24, 40, 4096].includes(width)) throw new Error('read width')
    process.stdout.write(JSON.stringify({event: 'read', address, width}, encode) + '\n')
    const response = receive()
    if (!response || typeof response.bytes !== 'string') throw new Error('read rejected')
    const bytes = Buffer.from(response.bytes, 'base64')
    if (bytes.length !== width) throw new Error('truncated read')
    return bytes
  },
  /** Apply ordered native stores immediately so later reads see their effects. */
  write(address, bytes) {
    if (bytes.length < 1 || bytes.length > 4096) throw new Error('write width')
    process.stdout.write(JSON.stringify({event: 'write', address, bytes: Buffer.from(bytes).toString('base64')}, encode) + '\n')
    if (receive()?.accepted !== true) throw new Error('write rejected')
  },
}

/** Fetch one mapped page in transient memory; the parent remains the authority on mapping permissions. */
function page(address) {
  const base = address & ~4095n
  if (!pages.has(base)) {
    if (pages.size === 4096) throw new Error('VM segment page limit exceeded')
    pages.set(base, remote.read(base, 4096))
  }
  return [base, pages.get(base)]
}

/** Cache only within a synchronous VM segment; every host yield flushes and invalidates all pages. */
const cached = {
  /** Read across mapped page boundaries without treating absent bytes as zero. */
  read(address, width) {
    const bytes = new Uint8Array(width)
    for (let index = 0; index < width; index++) {
      const current = BigInt.asUintN(64, address + BigInt(index))
      const [base, data] = page(current)
      bytes[index] = data[Number(current - base)]
    }
    return bytes
  },
  /** Record exact modified bytes so a flush never overwrites unrelated host storage. */
  write(address, bytes) {
    for (let index = 0; index < bytes.length; index++) {
      const current = BigInt.asUintN(64, address + BigInt(index))
      const [base, data] = page(current)
      const offset = Number(current - base)
      data[offset] = bytes[index]
      if (!dirty.has(base)) dirty.set(base, new Set())
      dirty.get(base).add(offset)
    }
  },
}
const memory = runtime ? cached : remote

/** Commit consecutive dirty bytes, then invalidate before any native function may mutate guest memory. */
function flush() {
  for (const [base, offsets] of dirty) {
    const sorted = [...offsets].sort((a, b) => a - b)
    let first = 0
    while (first < sorted.length) {
      let end = first + 1
      while (end < sorted.length && sorted[end] === sorted[end - 1] + 1) end++
      const start = sorted[first]
      remote.write(base + BigInt(start), pages.get(base).slice(start, sorted[end - 1] + 1))
      first = end
    }
  }
  dirty.clear()
  pages.clear()
}

/** Advance a selected generator once and retain only the continuation needed by its real host yield. */
function advance(id, generator, status) {
  const result = generator.next(status)
  if (result.done) {
    calls.delete(id)
    return {done: true, value: result.value}
  }
  if (!calls.has(id) && calls.size === 128) throw new Error('VM continuation limit exceeded')
  calls.set(id, generator)
  const request = result.value
  return {done: false, id, request: request.kind === 'host' ? {...request, descriptor: Buffer.from(request.descriptor).toString('base64')} : request}
}

/** Dispatch only documented integer control operations and explicit suspended generator identifiers. */
function execute(request) {
  switch (request.operation) {
    case 'run': {
      if (!runtime) throw new Error('runtime module required')
      const input = {...request.input}
      for (const key of ['engine', 'context', 'code', 'index', 'slots', 'compareLeft', 'compareRight', 'integer', 'errorTarget']) input[key] = BigInt(input[key])
      input.specialTargets = input.specialTargets.map(BigInt)
      return advance(nextId++, runtime.vmRun(input, memory))
    }
    case 'contains': return {value: api.vmModuleContains(BigInt(request.module), request.flags, BigInt(request.pointer), memory)}
    case 'find': return {value: api.vmFindModule(BigInt(request.root), request.flags, BigInt(request.pointer), memory)}
    case 'begin': return api.vmCallBegin(Buffer.from(request.record, 'base64'), BigInt(request.slots), BigInt(request.instruction), memory)
    case 'finish': return {value: api.vmCallResume(BigInt(request.slots), BigInt(request.result), memory)}
    case 'resolve': return advance(nextId++, api.vmResolveCode(BigInt(request.root), BigInt(request.context), BigInt(request.pointer), memory))
    case 'call': return advance(nextId++, api.vmCall(request.helper, BigInt(request.engine), BigInt(request.context), BigInt(request.operand), BigInt(request.errorTarget), request.specialTargets.map(BigInt), memory))
    case 'resume': {
      if (!calls.has(request.id) || !Number.isInteger(request.status)) throw new Error('invalid continuation')
      return advance(request.id, calls.get(request.id), request.status)
    }
    default: throw new Error('unsupported operation')
  }
}

for (;;) {
  const request = receive()
  if (request === undefined) break
  try {
    const result = execute(request)
    flush()
    process.stdout.write(JSON.stringify({event: 'result', ...result}, encode) + '\n')
  } catch {
    calls.clear()
    pages.clear()
    dirty.clear()
    process.stdout.write('{"event":"error","message":"VM call request rejected"}\n')
  }
}
