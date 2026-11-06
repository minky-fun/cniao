const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const crypto = require("node:crypto")
const { test } = require("node:test")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-preview-build")
const mp4 = require(path.join(build, "core/mp4Range.js"))

/** Create an ISO box with exact lengths for independent synthetic fixtures. */
function box(type, ...body) {
  const data = Buffer.concat(body), head = Buffer.alloc(8)
  head.writeUInt32BE(8 + data.length); head.write(type, 4)
  return Buffer.concat([head, data])
}

/** Encode unsigned table entries in network byte order. */
function words(...values) {
  const bytes = Buffer.alloc(values.length * 4)
  values.forEach((value, i) => bytes.writeUInt32BE(value, i * 4))
  return bytes
}

/** Encrypt known independent samples, with metadata at either end of the MP4. */
function fixture({ tail = false, ivSize = 8, large = false } = {}) {
  const key = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex")
  const samples = [35, 83, large ? 1048783 : 207].map((length, i) => Buffer.from(Array.from({ length }, (_, j) => (j * 31 + i) % 256)))
  const ivs = samples.map((_, i) => { const b = Buffer.alloc(ivSize, 255); b[0] = i + 1; return b })
  const encrypted = samples.map((sample, i) => {
    const iv = Buffer.alloc(16); ivs[i].copy(iv)
    const cipher = crypto.createCipheriv("aes-128-ctr", key, iv)
    return Buffer.concat([cipher.update(sample), cipher.final()])
  })
  const ftyp = box("ftyp", Buffer.from("isom0000")), mdat = box("mdat", ...encrypted)
  /** Construct a track with one sample per chunk and observed full-sample CENC tables. */
  function moov(offset) {
    const offsets = samples.map((_, i) => offset + samples.slice(0, i).reduce((a, b) => a + b.length, 0))
    const stsd = box("stsd", words(0, 1), box("encv", Buffer.alloc(78), box("sinf", box("frma", Buffer.from("hvc1")))))
    return box("moov", box("trak", box("mdia", box("minf", box("stbl", stsd,
      box("stsz", words(0, 0, samples.length, ...samples.map(x => x.length))),
      box("stco", words(0, offsets.length, ...offsets)), box("stsc", words(0, 1, 1, 1, 1)),
      box("senc", words(0, samples.length), ...ivs), box("saiz", Buffer.from([0, 0, 0, 0, ivSize]), words(samples.length)),
    )))))
  }
  const dummy = moov(0), mediaOffset = ftyp.length + (tail ? 0 : dummy.length) + 8
  const header = moov(mediaOffset), headerOffset = tail ? ftyp.length + mdat.length : ftyp.length
  const bytes = tail ? Buffer.concat([ftyp, mdat, header]) : Buffer.concat([ftyp, header, mdat])
  const expected = Buffer.from(bytes)
  Buffer.concat(samples).copy(expected, mediaOffset)
  // Only the declarations change; all box sizes and sample offsets stay fixed.
  for (const type of ["sinf", "senc", "saiz"]) expected.write("free", expected.indexOf(type, headerOffset))
  expected.write("hvc1", expected.indexOf("encv", headerOffset))
  return { key, bytes, header, headerOffset, mediaOffset, expected }
}

for (const ivSize of [8, 16]) for (const tail of [false, true]) {
  test(`random, unaligned CENC byte ranges match independent AES CTR, IV=${ivSize}, tail=${tail}`, async () => {
    const f = fixture({ ivSize, tail }), movie = mp4.prepareRangeMovie(f.header, f.headerOffset, f.bytes.length)
    assert.deepEqual(Buffer.from(await mp4.decryptMovieRange(movie, f.key, 0, f.bytes)), f.expected)
    for (let start = 0; start < f.bytes.length; start += 13) {
      const end = Math.min(start + 97, f.bytes.length)
      const result = await mp4.decryptMovieRange(movie, f.key, start, f.bytes.subarray(start, end))
      assert.deepEqual(Buffer.from(result), f.expected.subarray(start, end), `range ${start}-${end}`)
    }
  })
}

test("unsupported subsample encryption, missing codec and truncated tables fail explicitly", () => {
  const f = fixture()
  const flags = Buffer.from(f.header); flags[flags.indexOf("senc") + 7] = 2
  assert.throws(() => mp4.prepareRangeMovie(flags, f.headerOffset, f.bytes.length), /分段加密/)
  const missing = Buffer.from(f.header); missing.write("xxxx", missing.indexOf("frma"))
  assert.throws(() => mp4.prepareRangeMovie(missing, f.headerOffset, f.bytes.length), /原始编码/)
  const count = Buffer.from(f.header); count.writeUInt32BE(1000001, count.indexOf("stsz") + 12)
  assert.throws(() => mp4.prepareRangeMovie(count, f.headerOffset, f.bytes.length), /采样数量/)
})

/** Load the actual TCP response implementation, adapting only the Scripting abort class. */
function rangeServer(nativeNet = require("node:net")) {
  const module = { exports: {} }, dependencies = {
    "node:net": nativeNet, "node:buffer": require("node:buffer"), "node:crypto": crypto, scripting: { AbortController },
  }
  vm.runInNewContext(readFileSync(path.join(build, "core/rangeServer.js"), "utf8"), {
    module, exports: module.exports, console, Uint8Array, Error, Set,
    require(name) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name] },
  })
  return module.exports
}

/** Load the production source with a synthetic CDN and real loopback TCP sockets. */
function host({ tail = false, rejectPrimary = false, badRange = false, cached = false, startError = false, large = false } = {}) {
  const f = fixture({ tail, large }), requests = [], servers = []
  let holdRequest, offlineCalls = 0, onHeld
  const native = require("node:net")
  const net = {
    /** Track each real listener, optionally injecting only a bind failure. */
    createServer(...args) {
      const server = native.createServer(...args); servers.push(server)
      if (startError) server.listen = () => { server.emit("error", new Error("synthetic bind failure")); return server }
      return server
    },
  }
  const proxy = rangeServer(net), module = { exports: {} }
  const streams = [{ url: "https://example.invalid/primary", backupUrls: ["https://example.invalid/backup"], width: 720, height: 1280, contentKey: f.key }]
  const dependencies = {
    scripting: { AbortController,
      /** Respond to exact byte ranges and independently advertise file size. */
      async fetch(url, options) {
        options.signal.throwIfAborted()
        requests.push({ url, options })
        if (holdRequest) { onHeld?.(); await holdRequest(options.signal) }
        if (rejectPrimary && url.endsWith("primary")) throw Error("synthetic CDN failure")
        const [, from, to] = /^bytes=(\d+)-(\d+)$/.exec(options.headers.Range)
        const start = Number(from), end = Math.min(Number(to), f.bytes.length - 1)
        return { status: 206, headers: { get: () => `bytes ${badRange ? start + 1 : start}-${end}/${f.bytes.length}` },
          arrayBuffer: async () => Uint8Array.from(f.bytes.subarray(start, end + 1)).buffer }
      },
    },
    "./appApi": { fetchEncryptedStreams: async () => streams }, "./rangeServer": proxy,
    "./bytes": require(path.join(build, "core/bytes.js")), "./mp4Range": mp4,
    "./mediaCache": { isOfflineVideoCached: () => cached },
    "./playbackSource": { resolvePlaybackSource: async () => { offlineCalls++; return { url: "/cached.mp4" } } },
  }
  vm.runInNewContext(readFileSync(path.join(build, "core/feedPlayback.js"), "utf8"), {
    module, exports: module.exports, console, Uint8Array, DataView, Error, Set, Object,
    require(name) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name] },
  })
  return { ...module.exports, f, requests, servers, get offlineCalls() { return offlineCalls },
    /** Hold the next CDN range until the client or source cancels it. */
    holdUntilAbort() {
      holdRequest = signal => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)))
      return new Promise(resolve => { onHeld = resolve })
    },
  }
}

/** Read a real HTTP response, including strict body length checking by Node's HTTP parser. */
function request(url, { method = "GET", range, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = require("node:http").request(url, { method, headers: { ...headers, ...(range === undefined ? {} : { Range: range }) } }, res => {
      const chunks = []
      res.on("data", bytes => chunks.push(bytes))
      res.on("error", reject)
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
    })
    req.on("error", reject); req.end()
  })
}

test("HTTP range parsing preserves complete open, suffix and explicit ranges", () => {
  const { parseVideoRange } = rangeServer(), total = 5000000
  assert.equal(parseVideoRange("bytes=0-", total).end, total - 1)
  assert.equal(parseVideoRange("bytes=-16", total).start, total - 16)
  assert.equal(parseVideoRange("bytes=4-99999999", total).end, total - 1)
  for (const range of ["", "bytes=-", "bytes=-0", "bytes=7-6", "bytes=5000000-", "bytes=0-1,3-4", "bytes=9007199254740993-"]) assert.equal(parseVideoRange(range, total), null)
})

for (const tail of [false, true]) test(`real TCP HEAD/GET preserves complete lengths and media offsets, tail=${tail}`, async () => {
  const h = host({ tail }), controller = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", controller.signal)
  try {
    assert.equal(new URL(source.url).hostname, "127.0.0.1")
    const head = await request(source.url, { method: "HEAD" })
    assert.equal(head.status, 200); assert.equal(head.headers["content-length"], String(h.f.bytes.length))
    assert.equal(head.body.length, 0)
    const probe = await request(source.url, { range: "bytes=0-1" })
    assert.equal(probe.status, 206); assert.equal(probe.headers["content-length"], "2")
    assert.deepEqual(probe.body, h.f.expected.subarray(0, 2))
    const reply = await request(source.url, { range: "bytes=0-" })
    assert.equal(reply.status, 206); assert.deepEqual(reply.body, h.f.expected)
    assert.equal(reply.headers["content-range"], `bytes 0-${h.f.bytes.length - 1}/${h.f.bytes.length}`)
    const reads = h.requests.length
    const partial = await request(source.url, { range: "bytes=13-31" })
    assert.deepEqual(partial.body, h.f.expected.subarray(13, 32)); assert.equal(h.requests.length, reads)
    assert.equal((await request(source.url, { range: "bytes=99999-" })).status, 416)
    assert.equal((await request(source.url, { method: "POST" })).status, 405)
    assert.equal((await request(source.url + "unknown")).status, 404)
    const complete = await request(source.url)
    assert.equal(complete.status, 200); assert.deepEqual(complete.body, h.f.expected)
  } finally { controller.abort(); source.dispose() }
  assert.equal(h.servers[0].listening, false)
})

test("proxy switches to a real backup, rejects bad ranges and cleans startup failures", async () => {
  const h = host({ rejectPrimary: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  try { assert.equal(h.requests.length, 2); assert.ok(h.requests[1].url.endsWith("backup")) } finally { source.dispose() }
  const invalid = host({ badRange: true })
  await assert.rejects(invalid.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal), /片段加载失败/)
  assert.equal(invalid.servers.length, 0)
  const busy = host({ startError: true })
  await assert.rejects(busy.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal), /启动失败/)
  assert.equal(busy.servers[0].listening, false)
})

test("a cached episode skips media requests and cancellation prevents preparation", async () => {
  const h = host({ cached: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  assert.equal(source.url, "/cached.mp4"); assert.equal(h.offlineCalls, 1); assert.equal(h.requests.length, 0)
  c.abort()
  await assert.rejects(h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal), { name: "AbortError" })
})

test("one large requested range receives its complete body while upstream reads stay bounded", async () => {
  const h = host({ large: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  try {
    const reply = await request(source.url, { range: "bytes=0-" })
    assert.equal(reply.status, 206); assert.equal(reply.body.length, h.f.bytes.length)
    assert.equal(Number(reply.headers["content-length"]), h.f.bytes.length)
    assert.deepEqual(reply.body, h.f.expected)
    assert.ok(h.requests.slice(1).every(({ options }) => {
      const [, start, end] = /^bytes=(\d+)-(\d+)$/.exec(options.headers.Range)
      return Number(end) - Number(start) + 1 <= 262144
    }))
    const suffix = await request(source.url, { range: "bytes=-81" })
    assert.deepEqual(suffix.body, h.f.expected.subarray(-81))
  } finally { source.dispose() }
})

test("leaving during an upstream range aborts the request and closes the HTTP connection", async () => {
  const h = host({ large: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  const held = h.holdUntilAbort()
  const pending = assert.rejects(request(source.url, { range: "bytes=80000-" }), /aborted|reset|hang up/i)
  await held
  c.abort()
  await pending
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(h.requests.at(-1).options.signal.aborted, true)
  assert.equal(h.servers[0].listening, false)
  source.dispose()
})

test("client cancellation aborts its own CDN read without stopping other video connections", async () => {
  const h = host({ large: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  const held = h.holdUntilAbort()
  const req = require("node:http").get(source.url, { headers: { Range: "bytes=80000-" } })
  req.on("error", () => {})
  req.on("response", response => response.on("error", () => {}))
  await held
  req.destroy()
  for (let i = 0; i < 20 && !h.requests.at(-1).options.signal.aborted; i++) await new Promise(resolve => setImmediate(resolve))
  try {
    assert.equal(h.requests.at(-1).options.signal.aborted, true)
    assert.equal((await request(source.url, { method: "HEAD" })).status, 200)
  } finally { source.dispose() }
})

test("abort during asynchronous bind closes the late listener", async () => {
  const { startVideoRangeServer } = rangeServer(), c = new AbortController()
  const pending = startVideoRangeServer(100, c.signal, async () => new Uint8Array())
  c.abort()
  await assert.rejects(pending, /取消/)
  await new Promise(resolve => setImmediate(resolve))
})

test("fragmented HTTP headers and a slow reader still receive the complete requested range", async () => {
  const { startVideoRangeServer } = rangeServer(), c = new AbortController()
  const expected = Buffer.alloc(700000, 73), reads = []
  const source = await startVideoRangeServer(expected.length, c.signal, async (start, end) => {
    reads.push(end - start + 1)
    return new Uint8Array(expected.subarray(start, end + 1))
  })
  try {
    const url = new URL(source.url)
    const wire = await new Promise((resolve, reject) => {
      const data = [], socket = require("node:net").createConnection({ host: url.hostname, port: Number(url.port) })
      socket.on("connect", () => {
        socket.write(`GET ${url.pathname} HTTP/1.1\r\nHost: 127.0.0.1\r\nRan`)
        setTimeout(() => socket.write("ge: bytes=0-699999\r\n\r\n"), 5)
      })
      socket.on("data", chunk => { data.push(chunk); socket.pause(); setTimeout(() => socket.resume(), 1) })
      socket.on("error", reject)
      socket.on("end", () => resolve(Buffer.concat(data)))
    })
    const end = wire.indexOf("\r\n\r\n")
    assert.ok(wire.subarray(0, end).toString().includes("Content-Length: 700000"))
    assert.ok(wire.subarray(0, end).toString().includes("Content-Range: bytes 0-699999/700000"))
    assert.deepEqual(wire.subarray(end + 4), expected)
    assert.ok(reads.every(length => length <= 262144))
  } finally { source.dispose() }
})
