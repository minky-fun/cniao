const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const crypto = require("node:crypto")
const { test } = require("node:test")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-build")
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

/** Load the actual local proxy with an explicit host and synthetic CDN. */
function host({ tail = false, rejectPrimary = false, badRange = false, cached = false, startError = false, large = false } = {}) {
  const f = fixture({ tail, large }), requests = [], servers = []
  let holdRequest
  let offlineCalls = 0
  class HttpServer {
    /** Preserve route and bind options for checks without opening a real port. */
    constructor() { this.port = 12345; this.stops = 0; servers.push(this) }
    /** Capture the production async route handler. */
    registerAsyncHandler(route, handler) { this.route = route; this.handler = handler }
    /** Model synchronous bind success or error. */
    start(options) { this.options = options; return startError ? "in use" : null }
    /** Count releases so double disposal is detectable. */
    stop() { this.stops++ }
  }
  const module = { exports: {} }
  const streams = [{ url: "https://example.invalid/primary", backupUrls: ["https://example.invalid/backup"], width: 720, height: 1280, contentKey: f.key }]
  const dependencies = {
    scripting: { AbortController,
      /** Respond to exact byte ranges and independently advertise file size. */
      async fetch(url, options) {
        options.signal.throwIfAborted()
        requests.push({ url, options })
        if (holdRequest) await holdRequest(options.signal)
        if (rejectPrimary && url.endsWith("primary")) throw Error("synthetic CDN failure")
        const [, from, to] = /^bytes=(\d+)-(\d+)$/.exec(options.headers.Range)
        const start = Number(from), end = Math.min(Number(to), f.bytes.length - 1)
        return { status: 206, headers: { get: () => `bytes ${badRange ? start + 1 : start}-${end}/${f.bytes.length}` },
          arrayBuffer: async () => Uint8Array.from(f.bytes.subarray(start, end + 1)).buffer }
      },
    },
    "node:crypto": crypto, "./appApi": { fetchEncryptedStreams: async () => streams },
    "./bytes": require(path.join(build, "core/bytes.js")), "./mp4Range": mp4,
    "./mediaCache": { isOfflineVideoCached: () => cached },
    "./playbackSource": { resolvePlaybackSource: async () => { offlineCalls++; return { url: "/cached.mp4" } } },
  }
  vm.runInNewContext(readFileSync(path.join(build, "core/feedPlayback.js"), "utf8"), {
    module, exports: module.exports, console, Uint8Array, DataView, Error, Set, Object,
    HttpServer, HttpResponse: { raw: (status, phrase, options = {}) => ({ status, phrase, ...options }) },
    Data: { fromUint8Array: bytes => Buffer.from(bytes) },
    require(name) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name] },
  })
  return { ...module.exports, f, requests, servers, get offlineCalls() { return offlineCalls },
    /** Hold a CDN range until the production cancellation signal aborts it. */
    holdUntilAbort() { holdRequest = signal => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason))) },
  }
}

test("bounded HTTP ranges cover open, suffix, invalid and oversized requests", () => {
  const h = host(), total = 5000000
  assert.equal(h.feedByteRange("bytes=0-", total).end, 1048575)
  assert.equal(h.feedByteRange("bytes=-16", total).start, total - 16)
  assert.equal(h.feedByteRange("bytes=4-99999999", total).end, 1048579)
  for (const range of ["", "bytes=-", "bytes=-0", "bytes=7-6", "bytes=5000000-", "bytes=0-1,3-4", "bytes=9007199254740993-"]) assert.equal(h.feedByteRange(range, total), null)
})

for (const tail of [false, true]) test(`proxy HEAD/GET returns independently decrypted media and preserves offsets, tail=${tail}`, async () => {
  const h = host({ tail }), controller = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", controller.signal)
  const server = h.servers[0]
  assert.equal(server.listenAddressIPv4, "127.0.0.1")
  assert.equal(server.options.forceIPv4, true)
  assert.ok(source.url.startsWith("http://127.0.0.1:12345/"))
  const head = await server.handler({ method: "HEAD", headers: {} })
  assert.equal(head.status, 200); assert.equal(head.headers["Content-Length"], String(h.f.bytes.length))
  const reply = await server.handler({ method: "GET", headers: { rAnGe: "bytes=0-" } })
  assert.equal(reply.status, 206)
  assert.deepEqual(reply.body, h.f.expected)
  const reads = h.requests.length
  const partial = await server.handler({ method: "GET", headers: { Range: "bytes=13-31" } })
  assert.deepEqual(partial.body, h.f.expected.subarray(13, 32))
  assert.equal(h.requests.length, reads)
  assert.equal((await server.handler({ method: "GET", headers: { Range: "bytes=99999-" } })).status, 416)
  assert.equal((await server.handler({ method: "POST", headers: {} })).status, 405)
  controller.abort(); source.dispose()
  assert.equal(server.stops, 1)
  assert.equal((await server.handler({ method: "GET", headers: { Range: "bytes=0-1" } })).status, 410)
})

test("proxy switches to a real backup, rejects bad ranges and cleans startup failures", async () => {
  const h = host({ rejectPrimary: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  assert.equal(h.requests.length, 2); assert.ok(h.requests[1].url.endsWith("backup")); source.dispose()
  const invalid = host({ badRange: true })
  await assert.rejects(invalid.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal), /片段加载失败/)
  assert.equal(invalid.servers.length, 0)
  const busy = host({ startError: true })
  await assert.rejects(busy.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal), /启动失败/)
  assert.equal(busy.servers[0].stops, 1)
})

test("a cached episode skips media requests and cancellation prevents preparation", async () => {
  const h = host({ cached: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  assert.equal(source.url, "/cached.mp4"); assert.equal(h.offlineCalls, 1); assert.equal(h.requests.length, 0)
  c.abort()
  await assert.rejects(h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal), { name: "AbortError" })
})

test("open-ended requests advance in bounded chunks and decrypt a sample crossing the chunk boundary", async () => {
  const h = host({ large: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  const first = await h.servers[0].handler({ method: "GET", headers: { Range: "bytes=0-" } })
  assert.equal(first.body.length, 1048576)
  assert.deepEqual(first.body, h.f.expected.subarray(0, 1048576))
  const second = await h.servers[0].handler({ method: "GET", headers: { Range: "bytes=1048576-" } })
  assert.equal(second.status, 206)
  assert.deepEqual(second.body, h.f.expected.subarray(1048576))
  source.dispose()
})

test("leaving during an upstream range aborts the request and returns no late video body", async () => {
  const h = host({ large: true }), c = new AbortController()
  const source = await h.prepareFeedPlayback("synthetic", {}, "synthetic", c.signal)
  h.holdUntilAbort()
  const pending = h.servers[0].handler({ method: "GET", headers: { Range: "bytes=80000-" } })
  c.abort()
  assert.equal((await pending).status, 410)
  assert.equal(h.requests.at(-1).options.signal.aborted, true)
  assert.equal(h.servers[0].stops, 1)
  source.dispose()
})
