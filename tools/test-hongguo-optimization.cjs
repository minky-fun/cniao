const assert = require("node:assert/strict")
const { createCipheriv } = require("node:crypto")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-preview-build")

/** Load compiled HG modules with explicit substitutes and no device or network access. */
function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file), "utf8"), {
    module, exports: module.exports, console, Uint8Array, ...globals,
    /** Reject dependencies that the test did not explicitly provide. */
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), name)
      return dependencies[name]
    },
  }, { filename: file })
  return module.exports
}

test("retained AES-CTR matches native encryption for short IVs, counter carry and partial blocks", () => {
  const { expandKeyWords, aesCtrDecryptInPlace } = load("core/crypto.js")
  const key = Buffer.from("2b7e151628aed2a6abf7158809cf4f3c", "hex")
  for (const hex of ["0001020304050607", "000102030405060708090a0bfffffffe"]) {
    const iv = Buffer.from(hex, "hex"), nativeIv = Buffer.alloc(16)
    iv.copy(nativeIv)
    for (const length of [0, 1, 15, 16, 17, 33, 65, 1025]) {
      const plain = Buffer.from(Array.from({ length }, (_, i) => i % 251))
      const cipher = createCipheriv("aes-128-ctr", key, nativeIv)
      const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
      const allocation = Buffer.alloc(length + 15, 0xab)
      const region = allocation.subarray(3, length + 12)
      region.set(encrypted, 4)
      aesCtrDecryptInPlace(region, 4, length, expandKeyWords(key), iv)
      assert.deepEqual(region.subarray(4, 4 + length), plain)
      assert.ok(allocation.subarray(0, 7).every(value => value === 0xab))
      assert.ok(allocation.subarray(7 + length).every(value => value === 0xab))
    }
  }
})

test("batch history deletion reads and writes once, preserves other progress and skips empty selection", () => {
  let reads = 0, writes = 0
  let stored = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({
    seriesId: String(i), updatedAt: i, lastVid: `v${i}`, lastEpisodeIndex: i,
  })))
  const history = load("core/history.js", {}, { FileManager: {
    appGroupDocumentsDirectory: "/test",
    existsSync: () => true,
    /** Count reads without accessing real viewing history. */
    readAsStringSync() { reads++; return stored },
    /** Capture exactly the persisted batch result. */
    writeAsStringSync(_file, value) { writes++; stored = value },
  } })
  history.removePlayHistoryItems([])
  assert.deepEqual([reads, writes], [0, 0])
  history.removePlayHistoryItems(Array.from({ length: 80 }, (_, i) => String(i)))
  assert.deepEqual([reads, writes], [1, 1])
  const remaining = JSON.parse(stored)
  assert.equal(remaining.length, 20)
  assert.deepEqual(remaining.map(item => item.seriesId), Array.from({ length: 20 }, (_, i) => String(99 - i)))
  assert.equal(remaining[0].lastVid, "v99")
})

/** Create a controllable detail loader to observe caching, expiry and concurrent failures. */
function details() {
  let now = 1000
  const requests = []
  const api = load("core/api.js", {
    "./config": {},
    "./http": {
      /** Defer the exact upstream request so concurrency and retries remain observable. */
      fetchLoaderEntry(url) {
        return new Promise((resolve, reject) => requests.push({ url, resolve, reject }))
      },
    },
  }, { Date: { now: () => now } })
  return {
    api, requests,
    /** Advance the production cache clock without waiting for real time. */
    advance(milliseconds) { now += milliseconds },
    /** Resolve a request using only the known detail schema. */
    reply(index, id) {
      requests[index].resolve({ seriesDetail: { series_id: id, vid_list: [], celebrities: [], tags: [] } })
    },
  }
}

test("detail requests share pending work and cached data, while failed requests can retry", async () => {
  const s = details()
  const first = s.api.fetchDetail("a"), second = s.api.fetchDetail("a")
  assert.equal(s.requests.length, 1)
  s.reply(0, "a")
  assert.equal(await first, await second)
  assert.equal(await s.api.fetchDetail("a"), await first)
  const failure = s.api.fetchDetail("b")
  s.requests[1].reject(new Error("synthetic failure"))
  await assert.rejects(failure, /synthetic failure/)
  const retry = s.api.fetchDetail("b")
  assert.equal(s.requests.length, 3)
  s.reply(2, "b")
  assert.equal((await retry).detail.series_id, "b")
})

test("detail retention is bounded and expired records are fetched again", async () => {
  const s = details()
  for (let id = 0; id < 33; id++) {
    const pending = s.api.fetchDetail(String(id))
    s.reply(id, String(id))
    await pending
  }
  await s.api.fetchDetail("32")
  assert.equal(s.requests.length, 33)
  const evicted = s.api.fetchDetail("0")
  assert.equal(s.requests.length, 34)
  s.reply(33, "0")
  await evicted
  s.advance(60000)
  const expired = s.api.fetchDetail("32")
  assert.equal(s.requests.length, 35)
  s.reply(34, "32")
  await expired
})

test("cache eviction skips sorting under the limit and accounts only for successful removals", () => {
  const logs = [], files = new Map([["a.mp4", 10], ["b.mp4", 20], ["c.mp4", 30]])
  let index = { version: 1, entries: { a: {}, b: {}, c: {} } }
  const cache = load("core/mediaCache.js", { "./appApi": {}, "./mp4": {}, "./config": { PLAYBACK_CACHE_DIR: "cache" }, "./http": {} }, {
    console: { log: message => logs.push(message), warn() {} },
    FileManager: {
      appGroupDocumentsDirectory: "/test",
      existsSync: () => true,
      readDirectorySync: () => [...files.keys()],
      readAsStringSync: () => JSON.stringify(index),
      statSync: file => ({ size: files.get(path.basename(file)), modificationDate: file.endsWith("a.mp4") ? 0 : 1 }),
      /** Simulate a locked oldest file without deleting it. */
      removeSync(file) {
        if (file.endsWith("a.mp4")) throw new Error("synthetic file lock")
        files.delete(path.basename(file))
      },
      /** Capture the updated index without writing device files. */
      writeAsStringSync(_file, text) { index = JSON.parse(text) },
    },
  })
  const entries = Array.from({ length: 3 }, (_, i) => ({
    videoId: String(i), sizeBytes: 10,
    /** Fail if an under-limit cache unnecessarily inspects eviction order. */
    get lastUsedAt() { assert.fail("No sorting needed") },
  }))
  assert.equal(cache.selectEvictions(entries, { maxBytes: 30 }).length, 0)
  assert.equal(cache.enforceCacheLimit([], { maxBytes: 30 }), 1)
  assert.deepEqual([...files.keys()], ["a.mp4", "c.mp4"])
  assert.deepEqual(Object.keys(index.entries), ["a", "c"])
  assert.ok(logs[0].includes("40 字节"))
})
