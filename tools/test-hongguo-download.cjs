// Compile with tools/tsconfig.hongguo.json before running this regression suite.
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-build")
const videoId = "1234567890123456789"
const primary = "https://api5-normal-sinfonlinec.fqnovel.com"
const spare = "https://api5-normal-lq.fqnovel.com"

/** Load production modules while replacing only explicit host dependencies. */
function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file), "utf8"), {
    module, exports: module.exports, console, Error, Uint8Array, atob,
    /** Reject dependencies the test did not explicitly supply. */
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    ...globals,
  }, { filename: file })
  return module.exports
}

const config = load("core/config.js")
const bytes = load("core/bytes.js")
const signer = require(path.join(build, "core/playbackSign.js"))
const http = load("core/http.js", { scripting: {}, "./config": config, "./routerData": {} })

/** Provide an isolated identity store and deterministic queued network results. */
function createApi(replies) {
  const calls = [], delays = [], storage = new Map(), identities = []
  let identity = { deviceId: "1000000000000000001", installId: "1000000000000000002", deviceToken: "synthetic-device", cookies: { install_id: "1000000000000000002" } }
  const api = load("core/appApi.js", {
    scripting: {
      /** Consume exactly one queued reply for each real production request. */
      async fetch(url, options) {
        calls.push({ url, options })
        assert.ok(replies.length > 0, "Unexpected extra request")
        const next = replies.shift()
        if (next instanceof Error) throw next
        return next
      },
    },
    "./config": config, "./bytes": bytes, "./http": http,
    "./playbackSign": signer,
    "./playbackIdentity": {
      PLAYBACK_QUERY: { aid: "8662", version_name: "7.1.3.32" }, PLAYBACK_USER_AGENT: "synthetic-agent",
      /** Model a single registered identity replacement after all hosts reject it. */
      async getPlaybackIdentity(failed) {
        if (failed) identity = { ...identity, deviceId: "1000000000000000003", installId: "1000000000000000004" }
        identities.push(identity)
        return identity
      },
    },
  }, {
    Storage: {
      contains: key => storage.has(key),
      get: key => storage.get(key),
      set: (key, value) => { storage.set(key, value); return true },
    },
    /** Record retry backoff without slowing the test suite. */
    setTimeout(callback, milliseconds) { delays.push(milliseconds); callback() },
  })
  return { api, calls, delays, storage, identities }
}

/** Build an API reply containing only synthetic public video metadata. */
function modelReply(definitions = []) {
  return {
    ok: true, status: 200,
    text: async () => JSON.stringify({ code: 0, data: {
      [videoId]: { video_model: JSON.stringify({ video_list: definitions }) },
    } }),
  }
}

/** Build a media response with independent advertised and actual byte lengths. */
function mediaReply(length = 4, expectedContentLength = length) {
  return { ok: true, status: 200, expectedContentLength,
    arrayBuffer: async () => new Uint8Array(length).buffer }
}

/** Encode a zero content key solely to exercise production playback-model parsing. */
function syntheticSpade() {
  const raw = new Uint8Array(41)
  const previous = [250, 85]
  for (let i = 0; i < 33; i++) {
    raw[i + 1] = previous[i % 2] ^ (48 + 21 + bytes.popCount(i))
    previous[i % 2] = raw[i + 1]
  }
  raw[0] = 55 ^ raw[1] ^ raw[2]
  return Buffer.from(raw).toString("base64")
}

test("empty video response switches host, preserves identity and remembers success", async () => {
  const { api, calls } = createApi([
    { ok: true, status: 200, text: async () => " \n" }, modelReply(), modelReply(),
  ])
  await api.fetchEncryptedStreams(videoId)
  assert.equal(new URL(calls[0].url).origin, primary)
  assert.equal(new URL(calls[1].url).origin, spare)
  const first = new URL(calls[0].url), second = new URL(calls[1].url)
  for (const field of ["device_id", "iid"]) {
    assert.equal(first.searchParams.get(field), second.searchParams.get(field))
  }
  assert.equal(first.pathname, "/novel/player/multi_video_model/v1/")
  assert.equal(calls[1].options.method, "POST")
  assert.deepEqual(JSON.parse(calls[1].options.body).mixed_video_id_map, { "1004": [videoId] })
  assert.ok(calls[1].options.headers["X-Medusa"])
  assert.ok(calls[1].options.headers["X-Helios"])
  assert.notEqual(calls[0].options.headers["X-Medusa"], calls[1].options.headers["X-Medusa"])
  await api.fetchEncryptedStreams(videoId)
  assert.equal(new URL(calls[2].url).origin, spare)
})

test("all empty replies refresh identity once and stop after six attempts", async () => {
  const { api, calls } = createApi(Array.from({ length: 6 }, () => ({
    ok: true, status: 200, text: async () => "",
  })))
  await assert.rejects(api.fetchEncryptedStreams(videoId), /空响应，已尝试备用节点/)
  assert.equal(calls.length, 6)
  assert.equal(new Set(calls.map(call => new URL(call.url).origin)).size, 3)
  assert.notEqual(new URL(calls[0].url).searchParams.get("device_id"), new URL(calls[3].url).searchParams.get("device_id"))
})

test("a replacement anonymous identity restores playback after all original hosts return empty", async () => {
  const { api, calls, identities } = createApi([
    ...Array.from({ length: 3 }, () => ({ ok: true, status: 200, text: async () => "" })), modelReply(),
  ])
  await api.fetchEncryptedStreams(videoId)
  assert.equal(calls.length, 4)
  assert.equal(identities.length, 2)
  assert.notEqual(identities[0].deviceId, identities[1].deviceId)
})

test("only business 100100 retries the desktop's 1001 video ID type", async () => {
  const { api, calls } = createApi([
    { ok: true, status: 200, text: async () => JSON.stringify({ code: 100100 }) }, modelReply(),
  ])
  await api.fetchEncryptedStreams(videoId)
  assert.deepEqual(JSON.parse(calls[0].options.body).mixed_video_id_map, { "1004": [videoId] })
  assert.deepEqual(JSON.parse(calls[1].options.body).mixed_video_id_map, { "1001": [videoId] })
  assert.equal(new URL(calls[0].url).origin, new URL(calls[1].url).origin)
  assert.notEqual(calls[0].options.headers["X-Ss-Stub"], calls[1].options.headers["X-Ss-Stub"])
})

test("network failures alone stop after host retries without replacing the anonymous device", async () => {
  const { api, calls, identities } = createApi(Array.from({ length: 3 }, () => new Error("timeout")))
  await assert.rejects(api.fetchEncryptedStreams(videoId), /网络连接中断或超时/)
  assert.equal(calls.length, 3)
  assert.equal(identities.length, 1)
})

test("network, body-read, throttling and server failures switch video API hosts", async () => {
  for (const failed of [new Error("timeout"),
    { ok: true, status: 200, text: async () => { throw new Error("body interrupted") } },
    ...[408, 429, 503].map(status => ({ ok: false, status })),
  ]) {
    const { api, calls } = createApi([failed, modelReply()])
    await api.fetchEncryptedStreams(videoId)
    assert.equal(calls.length, 2)
  }
})

test("HTTP rejection, malformed JSON, business errors and missing episodes do not fan out", async () => {
  for (const failed of [{ ok: false, status: 403 },
    { ok: true, status: 200, text: async () => "not json" },
    { ok: true, status: 200, text: async () => JSON.stringify({ code: 1, message: "unavailable" }) },
    { ok: true, status: 200, text: async () => JSON.stringify({ code: 0, data: {} }) },
  ]) {
    const { api, calls } = createApi([failed])
    await assert.rejects(api.fetchEncryptedStreams(videoId))
    assert.equal(calls.length, 1)
  }
})

test("playback parser keeps distinct same-quality media URLs with their content key", async () => {
  const definition = { video_meta: { codec_type: "bytevc1", vheight: 1080 },
    main_url: Buffer.from("https://media.example/main").toString("base64"),
    backup_url: "https://media.example/backup",
    url_list: ["https://media.example/main", "https://media.example/third"],
    encrypt_info: { spade_a: syntheticSpade() } }
  const { api } = createApi([modelReply([definition])])
  const streams = await api.fetchEncryptedStreams(videoId)
  assert.equal(streams.length, 1)
  assert.equal(streams[0].url, "https://media.example/main")
  assert.deepEqual(Array.from(streams[0].backupUrls), ["https://media.example/backup", "https://media.example/third"])
  assert.deepEqual(Array.from(streams[0].contentKey), Array(16).fill(0))
})

test("media retry switches backup before repeating the failing URL", async () => {
  const { api, calls, delays } = createApi([new Error("timeout"), mediaReply()])
  assert.equal((await api.downloadStream("https://media.example/main", ["https://media.example/backup"])).length, 4)
  assert.deepEqual(calls.map(call => call.url), ["https://media.example/main", "https://media.example/backup"])
  assert.deepEqual(delays, [1000])
})

test("media body errors, empty or truncated files, partial status and HTTP 503 retry", async () => {
  for (const failed of [
    { ...mediaReply(), arrayBuffer: async () => { throw new Error("read interrupted") } },
    mediaReply(0), mediaReply(2, 4), { ...mediaReply(), status: 206 }, { ok: false, status: 503 },
  ]) {
    const { api, calls } = createApi([failed, mediaReply()])
    assert.equal((await api.downloadStream("https://media.example/main")).length, 4)
    assert.equal(calls.length, 2)
  }
})

test("persistent media failure is bounded and transport errors do not reveal signed URLs", async () => {
  const { api, calls, delays } = createApi(Array.from({ length: 3 }, () => new Error("private URL omitted")))
  await assert.rejects(api.downloadStream("https://media.example/main"), error => {
    assert.ok(error instanceof http.HttpError)
    assert.match(error.message, /网络连接中断或超时/)
    assert.ok(!error.message.includes("private"))
    return true
  })
  assert.equal(calls.length, 3)
  assert.deepEqual(delays, [1000, 2000])
})

test("permanent media rejection tries a distinct backup once and does not repeat it", async () => {
  const { api, calls } = createApi([{ ok: false, status: 403 }, { ok: false, status: 404 }])
  await assert.rejects(api.downloadStream("https://media.example/main", [
    "https://media.example/main", "https://media.example/backup",
  ]), error => error.status === 404)
  assert.equal(calls.length, 2)
})
