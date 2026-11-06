// Compile with tools/tsconfig.hongguo.json before running this regression suite.
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-build")

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

test("episode count defaults to five, persists valid choices and rejects invalid or failed writes", () => {
  const config = load("core/config.js", {})
  const values = new Map()
  let saveSucceeds = true
  const cache = load("core/mediaCache.js", { "./appApi": {}, "./mp4": {}, "./config": config, "./http": {} }, {
    Storage: {
      get: key => values.get(key) ?? null,
      /** Leave the saved count untouched when simulating a failed write. */
      set(key, value) {
        if (!saveSucceeds) return false
        values.set(key, value)
        return true
      },
    },
  })
  assert.equal(cache.getAutoCacheEpisodeCount(), 5)
  cache.setAutoCacheEpisodeCount(3)
  assert.equal(cache.getAutoCacheEpisodeCount(), 3)
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => cache.setAutoCacheEpisodeCount(value), /不小于 1 的整数/)
    assert.equal(cache.getAutoCacheEpisodeCount(), 3)
  }
  saveSucceeds = false
  assert.throws(() => cache.setAutoCacheEpisodeCount(6), /自动缓存集数保存失败/)
  assert.equal(cache.getAutoCacheEpisodeCount(), 3)
})

/** Mount the production prefetch effect with configurable preferences and controlled timers. */
function prefetchScenario({ enabled = true, count, current = 0, total = 8,
  cached = new Set(), failures = new Map(), afterDownload } = {}) {
  const config = load("core/config.js", {})
  const detail = { series_id: "series", series_name: "Test", series_cover: "", vid_list: Array.from({ length: total }, (_, i) => String(i)) }
  const currentVid = detail.vid_list[current]
  const data = { seriesDetail: detail }
  const states = [data, currentVid, false, "", {}, "", "", "", 0, 0, true, true, 0]
  const effects = [], timers = new Map(), calls = [], delays = [], refs = []
  const preference = { enabled, count: count ?? config.AUTO_CACHE_EPISODE_COUNT }
  let stateIndex = 0, refIndex = 0, timerId = 0
  const scripting = {
    useState: () => [states[stateIndex++], () => {}],
    useRef: value => refs[refIndex++] ?? (refs[refIndex - 1] = { current: value }),
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
      getAutoCacheEpisodeCount: () => preference.count,
      isOfflineVideoCached: vid => cached.has(vid),
      /** Record completed background tasks and allow preference changes between episodes. */
      async preloadOfflineVideo(vid) {
        calls.push(vid)
        afterDownload?.(preference)
        if ((failures.get(vid) ?? 0) > 0) {
          failures.set(vid, failures.get(vid) - 1)
          return false
        }
        cached.add(vid)
        return true
      },
    },
    "../core/api": {}, "../core/history": {}, "../core/playbackSource": {}, "../core/playbackState": {},
    "../core/sleepTimer": {},
    "../core/format": { formatEpisodeLabel: () => "Test episode" },
    "./Common": {}, "./EpisodeGrid": {}, "./FavoriteButton": { FavoriteButton: "FavoriteButton" },
  }, {
    createElement: (type, props, ...children) => ({ type, props, children }),
    /** Retain scheduled callbacks so tests can change settings before they start. */
    setTimeout(callback, delay) { delays.push(delay); timers.set(++timerId, callback); return timerId },
    clearTimeout: id => timers.delete(id),
  })
  let cleanup
  /** Re-render the same player after a successful episode switch and replace its prefetch effect. */
  function advance(index) {
    cleanup?.()
    states[1] = detail.vid_list[index]
    stateIndex = 0
    refIndex = 0
    effects.length = 0
    PlayerView({ seriesId: "series", initialVid: currentVid })
    const effect = effects.find(item => item.deps?.length === 3 && item.deps[0] === detail
      && item.deps[1] === states[1] && item.deps[2] === true)
    assert.ok(effect, "Player must register its background prefetch effect")
    cleanup = effect.setup()
  }
  advance(current)
  return {
    calls, preference, cached, delays, advance,
    /** Dispose the currently mounted prefetch effect. */
    cleanup() { cleanup() },
    /** Run pending background work to completion without real downloads or delays. */
    async flush() {
      for (let round = 0; timers.size; round++) {
        assert.ok(round < 10, "Background retries must be bounded")
        const callbacks = [...timers.values()]
        timers.clear()
        for (const callback of callbacks) await callback()
      }
    },
  }
}

test("a loaded player prefetches the next five episodes by default", async () => {
  const scenario = prefetchScenario()
  await scenario.flush()
  assert.deepEqual(scenario.calls, ["1", "2", "3", "4", "5"])
})

test("prefetch follows configured counts and stops after a count is reduced", async () => {
  for (const count of [1, 3, 6]) {
    const scenario = prefetchScenario({ count })
    await scenario.flush()
    assert.deepEqual(scenario.calls, Array.from({ length: count }, (_, i) => String(i + 1)))
  }
  const reduced = prefetchScenario({ count: 6, afterDownload: preference => { preference.count = 1 } })
  await reduced.flush()
  assert.deepEqual(reduced.calls, ["1"])
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

test("prefetch follows configured counts beyond fifty, series end and leaving the player", async () => {
  const largeWindow = prefetchScenario({ count: 60, total: 70 })
  await largeWindow.flush()
  assert.equal(largeWindow.calls.length, 60)
  assert.equal(largeWindow.calls.at(-1), "60")
  const finalEpisodes = prefetchScenario({ current: 6 })
  await finalEpisodes.flush()
  assert.deepEqual(finalEpisodes.calls, ["7"])
  const dismissed = prefetchScenario()
  dismissed.cleanup()
  await dismissed.flush()
  assert.deepEqual(dismissed.calls, [])
})

test("a ten-episode window replenishes one episode after every episode switch", async () => {
  const cached = new Set(Array.from({ length: 10 }, (_, index) => String(96 + index)))
  const scenario = prefetchScenario({ current: 95, total: 120, count: 10, cached })
  await scenario.flush()
  assert.deepEqual(scenario.calls, [])
  for (let current = 96; current <= 99; current++) {
    scenario.advance(current)
    await scenario.flush()
    assert.equal(scenario.calls.at(-1), String(current + 10))
    assert.equal(scenario.calls.length, current - 95)
    for (let offset = 1; offset <= 10; offset++) assert.ok(cached.has(String(current + offset)))
  }
})

test("episode 97 failing does not stop later episodes and is retried during episode 96", async () => {
  const scenario = prefetchScenario({ current: 95, total: 120, count: 10,
    failures: new Map([["96", 1]]) })
  await scenario.flush()
  assert.deepEqual(scenario.calls, [...Array.from({ length: 10 }, (_, i) => String(96 + i)), "96"])
  assert.deepEqual(scenario.delays, [1500, 15000])
  for (let index = 96; index <= 105; index++) assert.ok(scenario.cached.has(String(index)))
})

test("persistent prefetch failure is bounded and does not block the remaining window", async () => {
  const scenario = prefetchScenario({ failures: new Map([["1", Infinity]]) })
  await scenario.flush()
  assert.deepEqual(scenario.calls, ["1", "2", "3", "4", "5", "1", "1"])
  assert.equal(scenario.cached.has("1"), false)
})

test("disabling auto-cache or leaving the player cancels delayed failure retries", async () => {
  for (const action of ["disable", "leave"]) {
    let scenario
    scenario = prefetchScenario({ failures: new Map([["1", Infinity]]), afterDownload: () => {
      if (action === "disable") scenario.preference.enabled = false
      else scenario.cleanup()
    } })
    await scenario.flush()
    assert.deepEqual(scenario.calls, ["1"])
    assert.deepEqual(scenario.delays, [1500])
  }
})

test("switching episodes while prefetch awaits stops the old window and fills the new one", async () => {
  let scenario
  let switched = false
  scenario = prefetchScenario({ total: 20, count: 10, afterDownload: () => {
    if (!switched) { switched = true; scenario.advance(1) }
  } })
  await scenario.flush()
  assert.deepEqual(scenario.calls, Array.from({ length: 11 }, (_, i) => String(i + 1)))
})
