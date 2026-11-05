// Compile with tools/tsconfig.hongguo.json before running this regression suite.
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.join(__dirname, "../work/hongguo-build")

/** Load production code with explicit replacements for native dependencies. */
function load(file, dependencies, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file), "utf8"), {
    module, exports: module.exports, console, Error,
    /** Reject unexpected host dependencies during the simulation. */
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    ...globals,
  }, { filename: file })
  return module.exports
}

test("auto-cache defaults on, persists off and keeps its value if saving fails", async () => {
  const values = new Map()
  let saveSucceeds = true
  const cache = load("core/mediaCache.js", { "./appApi": {}, "./mp4": {}, "./config": {}, "./http": {} }, {
    Storage: {
      get: key => values.get(key) ?? null,
      /** Simulate a failed store without mutating the saved preference. */
      set(key, value) {
        if (!saveSucceeds) return false
        values.set(key, value)
        return true
      },
    },
  })
  assert.equal(cache.getAutoCacheEnabled(), true)
  cache.setAutoCacheEnabled(false)
  assert.equal(cache.getAutoCacheEnabled(), false)
  // No FileManager or network implementation is supplied: disabled preload must do no work.
  assert.equal(await cache.preloadOfflineVideo("unwatched-episode"), false)
  saveSucceeds = false
  assert.throws(() => cache.setAutoCacheEnabled(true), /自动缓存设置保存失败/)
  assert.equal(cache.getAutoCacheEnabled(), false)
})

/** Mount the production prefetch effect with an already-loaded player and controlled timers. */
function prefetchScenario({ enabled = true, maxEntries = 50, current = 0, afterDownload } = {}) {
  const config = load("core/config.js", {})
  const detail = { series_id: "series", series_name: "Test", series_cover: "", vid_list: Array.from({ length: 8 }, (_, i) => String(i)) }
  const currentVid = detail.vid_list[current]
  const data = { seriesDetail: detail }
  const states = [data, currentVid, false, "", {}, "", "", "", 0, 0, true, true, 0]
  const effects = [], timers = new Map(), calls = []
  const preference = { enabled }
  let stateIndex = 0, timerId = 0
  const scripting = {
    useState: () => [states[stateIndex++], () => {}],
    useRef: value => ({ current: value }),
    useObservable: value => ({ value }),
    useCallback: callback => callback,
    useEffect: (setup, deps) => effects.push({ setup, deps }),
    VStack: "VStack", ZStack: "ZStack", HStack: "HStack", ScrollView: "ScrollView",
    AVPlayerView: "AVPlayerView", Text: "Text", Button: "Button", ProgressView: "ProgressView",
  }
  const { PlayerView } = load("views/PlayerView.js", {
    scripting,
    "../core/config": config,
    "../core/mediaCache": {
      getAutoCacheEnabled: () => preference.enabled,
      getPlaybackCacheMaxEntries: () => maxEntries,
      isOfflineVideoCached: () => false,
      /** Record completed background tasks and allow preference changes between episodes. */
      async preloadOfflineVideo(vid) {
        calls.push(vid)
        afterDownload?.(preference)
        return true
      },
    },
    "../core/api": {}, "../core/history": {}, "../core/playbackSource": {}, "../core/playbackState": {},
    "../core/format": { formatEpisodeLabel: () => "Test episode" },
    "./Common": {}, "./EpisodeGrid": {},
  }, {
    createElement: (type, props, ...children) => ({ type, props, children }),
    /** Retain scheduled callbacks so tests can change settings before they start. */
    setTimeout(callback) { timers.set(++timerId, callback); return timerId },
    clearTimeout: id => timers.delete(id),
  })
  PlayerView({ seriesId: "series", initialVid: currentVid })
  const effect = effects.find(item => item.deps?.length === 3 && item.deps[0] === detail
    && item.deps[1] === currentVid && item.deps[2] === true)
  assert.ok(effect, "Player must register its background prefetch effect")
  const cleanup = effect.setup()
  return {
    calls, preference, cleanup,
    /** Run pending background work to completion without real downloads or delays. */
    async flush() { for (const callback of timers.values()) await callback(); timers.clear() },
  }
}

test("a loaded player prefetches the next five episodes by default", async () => {
  const scenario = prefetchScenario()
  await scenario.flush()
  assert.deepEqual(scenario.calls, ["1", "2", "3", "4", "5"])
})

test("disabled auto-cache starts no downloads, including when disabled during the delay", async () => {
  for (const initiallyEnabled of [false, true]) {
    const scenario = prefetchScenario({ enabled: initiallyEnabled })
    scenario.preference.enabled = false
    await scenario.flush()
    assert.deepEqual(scenario.calls, [])
  }
})

test("switching auto-cache off prevents the remaining queued episodes from starting", async () => {
  const scenario = prefetchScenario({ afterDownload: preference => { preference.enabled = false } })
  await scenario.flush()
  assert.deepEqual(scenario.calls, ["1"])
})

test("prefetch respects cache retention, series end and leaving the player", async () => {
  const limited = prefetchScenario({ maxEntries: 2 })
  await limited.flush()
  assert.deepEqual(limited.calls, ["1"])
  const finalEpisodes = prefetchScenario({ current: 6 })
  await finalEpisodes.flush()
  assert.deepEqual(finalEpisodes.calls, ["7"])
  const dismissed = prefetchScenario()
  dismissed.cleanup()
  await dismissed.flush()
  assert.deepEqual(dismissed.calls, [])
})
