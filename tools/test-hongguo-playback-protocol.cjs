const assert = require("node:assert/strict")
const { test } = require("node:test")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const crypto = require("node:crypto")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-build", "core")
const vectors = require("./fixtures/hongguo-playback-vectors.json")
const supportedCrypto = {
  createHash: crypto.createHash, randomBytes: crypto.randomBytes,
  createCipheriv: crypto.createCipheriv, createDecipheriv: crypto.createDecipheriv,
}
const fixedCrypto = { ...supportedCrypto, randomBytes: size => Buffer.alloc(size) }

/** Load real protocol code with explicit host dependencies and optional deterministic randomness. */
function load(name, dependencies = {}, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, name + ".js"), "utf8"), {
    module, exports: module.exports, Uint8Array, DataView, ArrayBuffer, Buffer, Error, BigInt,
    /** Resolve only declared host adapters and documented Node built-ins. */
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name]
      assert.ok(name.startsWith("node:"), `Unexpected dependency: ${name}`)
      if (name === "node:crypto") return supportedCrypto
      return require(name)
    },
    ...globals,
  }, { filename: name })
  return module.exports
}

test("SM3 matches standard vectors across empty, short and multiple-block inputs", () => {
  const { sm3 } = load("playbackSign")
  for (const input of ["", "abc", "abcd".repeat(16), "x".repeat(1000)]) {
    assert.equal(sm3(Buffer.from(input)).toString("hex"), crypto.createHash("sm3").update(input).digest("hex"))
  }
})

test("Medusa and Helios match independently verified synthetic vectors for all timestamp cipher branches", () => {
  const { signPlayback } = load("playbackSign", { "node:crypto": fixedCrypto })
  for (const vector of vectors.vectors) {
    const signed = signPlayback(vectors.params, vectors.body, vector.stamp)
    assert.equal(signed.query, vector.query)
    assert.equal(crypto.createHash("sha256").update(signed.headers["X-Medusa"]).digest("hex"), vector.medusa)
    assert.equal(signed.headers["X-Helios"], vector.helios)
  }
})

test("retry signatures use fresh nonces and bind the body, device and exact transmitted timestamps", () => {
  const { signPlayback } = load("playbackSign")
  const stamp = 1730000000999, a = signPlayback(vectors.params, vectors.body, stamp)
  const b = signPlayback(vectors.params, vectors.body, stamp)
  assert.notEqual(a.headers["X-Medusa"], b.headers["X-Medusa"])
  assert.notEqual(a.headers["X-Helios"], b.headers["X-Helios"])
  assert.notEqual(a.headers["X-Tt-Trace-Id"], b.headers["X-Tt-Trace-Id"])
  const query = new URLSearchParams(a.query), seconds = Number(a.headers["X-Khronos"])
  assert.equal(Math.floor(Number(query.get("_rticket")) / 1000), seconds)
  assert.equal(query.get("ts"), String(seconds))
  assert.equal(query.get("_rticket"), a.headers["X-Ss-Req-Ticket"])
  assert.equal(Buffer.from(a.headers["X-Argus"], "base64").readUInt32LE(0), seconds)
  assert.equal(a.headers["X-Ss-Stub"], crypto.createHash("md5").update(vectors.body).digest("hex").toUpperCase())
  const changed = signPlayback(vectors.params, vectors.body + " ", stamp)
  assert.notEqual(changed.headers["X-Ss-Stub"], a.headers["X-Ss-Stub"])
})

/** Create a fake Scripting store and registration transport without real credentials. */
function identityHost(replies) {
  const store = new Map(), calls = []
  const protocol = load("playbackSign")
  const { HttpError } = load("http", { scripting: {}, "./config": {}, "./routerData": {} })
  const api = load("playbackIdentity", {
    "./http": { HttpError }, "./playbackSign": protocol,
    scripting: {
      /** Consume one anonymous registration response per actual production request. */
      async fetch(url, options) {
        calls.push({ url, options })
        assert.ok(replies.length, "Unexpected registration")
        const next = replies.shift()
        if (next instanceof Error) throw next
        return next
      },
    },
  }, { Storage: {
    contains: key => store.has(key), get: key => store.get(key),
    set: (key, value) => { store.set(key, value); return true },
  } })
  return { api, store, calls }
}

/** Return a registration envelope containing only clearly synthetic identifiers. */
function registrationReply(device = "1000000000000000001", install = "1000000000000000002", token = "synthetic-token") {
  return { ok: true, status: 200, cookies: [{ name: "ttreq", value: "synthetic-cookie" }],
    arrayBuffer: async () => Uint8Array.from(Buffer.from(JSON.stringify({
      device_id_str: device, install_id_str: install, device_token: token,
    }))).buffer }
}

test("TTEncrypt round trip validates encrypted replies and detects corruption", () => {
  const { api } = identityHost([])
  const message = '{"device_id_str":"1000000000000000001"}'
  const encrypted = api.encryptRegistration(message, new Uint8Array(32))
  assert.equal(api.decodeRegistration(encrypted), message)
  encrypted[50] ^= 1
  assert.throws(() => api.decodeRegistration(encrypted))
  assert.equal(api.decodeRegistration(Buffer.from(message)), message)
})

test("concurrent playback callers share registration and late failures reuse the replacement", async () => {
  const { api, calls, store } = identityHost([registrationReply(), registrationReply("1000000000000000003", "1000000000000000004")])
  const [a, b] = await Promise.all([api.getPlaybackIdentity(), api.getPlaybackIdentity()])
  assert.equal(a, b)
  assert.equal(calls.length, 1)
  assert.equal(a.cookies.install_id, a.installId)
  assert.equal(a.cookies.ttreq, "synthetic-cookie")
  const [next, shared] = await Promise.all([api.getPlaybackIdentity(a), api.getPlaybackIdentity(a)])
  assert.equal(next, shared)
  assert.notEqual(next.deviceId, a.deviceId)
  assert.equal(await api.getPlaybackIdentity(a), next)
  assert.equal(calls.length, 2)
  assert.equal(store.size, 1)
  const plain = JSON.parse(api.decodeRegistration(new Uint8Array(calls[0].options.body)))
  assert.equal(plain.header.aid, 8662)
  assert.equal(plain.header.version_code, 71332)
})

test("anonymous registration supports an absent token and rejects missing or rounded numeric IDs", async () => {
  assert.equal((await identityHost([registrationReply("100000000000001", "100000000000002")]).api.getPlaybackIdentity()).deviceId, "100000000000001")
  const noToken = registrationReply()
  noToken.arrayBuffer = async () => Uint8Array.from(Buffer.from('{"device_id_str":"1000000000000000001","install_id_str":"1000000000000000002"}')).buffer
  assert.equal((await identityHost([noToken]).api.getPlaybackIdentity()).deviceToken, "")
  const invalid = registrationReply()
  invalid.arrayBuffer = async () => Uint8Array.from(Buffer.from('{"device_id":1000000000000000001,"install_id":1000000000000000002}')).buffer
  const host = identityHost([invalid, registrationReply()])
  await assert.rejects(host.api.getPlaybackIdentity(), /完整身份/)
  assert.equal(host.store.size, 0)
  assert.ok(await host.api.getPlaybackIdentity())
})

/** Exercise real registration with the reduced crypto adapter that has no randomUUID export. */
test("registration generates distinct v4 device UUIDs without a randomUUID API", async () => {
  assert.equal(supportedCrypto.randomUUID, undefined)
  const { api, calls } = identityHost([registrationReply(), registrationReply("1000000000000000003", "1000000000000000004")])
  const first = await api.getPlaybackIdentity()
  await api.getPlaybackIdentity(first)
  const uuids = calls.flatMap(call => {
    const { header } = JSON.parse(api.decodeRegistration(new Uint8Array(call.options.body)))
    assert.equal(new URL(call.url).searchParams.get("cdid"), header.cdid)
    return [header.cdid, header.clientudid]
  })
  for (const uuid of uuids) {
    assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  }
  assert.equal(new Set(uuids).size, 4)
})
