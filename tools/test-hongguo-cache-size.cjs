const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-build")
const MB = 1024 ** 2

/** Load compiled production modules with explicit substitutes for native dependencies. */
function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file), "utf8"), {
    module, exports: module.exports, console,
    /** Reject unexpected native dependencies rather than contacting real services. */
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    ...globals,
  }, { filename: file })
  return module.exports
}

/** Create an isolated capacity setting without access to real files or network requests. */
function scenario(globals = {}) {
  const values = new Map([["hongguo-cache-max-entries", 2]])
  const config = load("core/config.js")
  const storage = {
    get: key => values.get(key) ?? null,
    /** Save test preferences without persisting user data. */
    set(key, value) { values.set(key, value); return true },
  }
  const cache = load("core/mediaCache.js", {
    "./appApi": {}, "./mp4": {}, "./config": config, "./http": {},
  }, { Storage: storage, ...globals })
  return { cache, storage, values }
}

test("capacity defaults to 500 MB and persists independently of the old episode limit", () => {
  const { cache } = scenario()
  assert.equal(cache.getPlaybackCacheMaxBytes(), 500 * MB)
  cache.setPlaybackCacheMaxBytes(2048 * MB)
  assert.equal(cache.getPlaybackCacheMaxBytes(), 2048 * MB)
  // Saving has no FileManager available: it must not delete or scan any cache.
  cache.setPlaybackCacheMaxBytes(MB)
  assert.equal(cache.getPlaybackCacheMaxBytes(), MB)
})

test("invalid and failed capacity writes preserve the previous setting", () => {
  const { cache, storage } = scenario()
  cache.setPlaybackCacheMaxBytes(1024 * MB)
  for (const value of [0, -MB, 0.5 * MB, 1.5 * MB, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => cache.setPlaybackCacheMaxBytes(value), /整数容量/)
    assert.equal(cache.getPlaybackCacheMaxBytes(), 1024 * MB)
  }
  storage.set = () => false
  assert.throws(() => cache.setPlaybackCacheMaxBytes(2048 * MB), /保存失败/)
  assert.equal(cache.getPlaybackCacheMaxBytes(), 1024 * MB)
})

test("more than fifty episodes are retained under the byte limit, with protected playback preserved", () => {
  const { cache } = scenario()
  const entries = Array.from({ length: 70 }, (_, index) => ({
    videoId: String(index), label: "", sizeBytes: 10 * MB, lastUsedAt: index,
  }))
  assert.equal(cache.selectEvictions(entries, { maxBytes: 1024 * MB }).length, 0)
  const victims = cache.selectEvictions(entries, { maxBytes: 650 * MB }, ["0"])
  assert.deepEqual(Array.from(victims, entry => entry.videoId), ["1", "2", "3", "4", "5"])
})

test("cleanup reads the latest persisted byte limit on each invocation", () => {
  const files = new Map(Array.from({ length: 3 }, (_, index) => [`${index}.mp4`, 200 * MB]))
  const removed = []
  const { cache } = scenario({ FileManager: {
    appGroupDocumentsDirectory: "/test",
    existsSync: () => true,
    readDirectorySync: () => [...files.keys()],
    readAsStringSync: () => JSON.stringify({ version: 1, entries: {} }),
    statSync: file => ({ size: files.get(path.basename(file)), modificationDate: Number(path.basename(file)[0]) }),
    /** Delete only simulated cache entries selected by the real eviction code. */
    removeSync(file) { removed.push(path.basename(file)); files.delete(path.basename(file)) },
    /** Keep index writes inside the simulation. */
    writeAsStringSync() {},
  } })
  cache.setPlaybackCacheMaxBytes(1024 * MB)
  assert.equal(cache.pruneOfflineCache(), 0)
  cache.setPlaybackCacheMaxBytes(500 * MB)
  assert.equal(cache.pruneOfflineCache(), 1)
  assert.deepEqual(removed, ["0.mp4"])
  cache.setPlaybackCacheMaxBytes(200 * MB)
  assert.equal(cache.enforceCacheLimit(["2"]), 1)
  assert.deepEqual(removed, ["0.mp4", "1.mp4"])
})
