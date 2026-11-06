const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-build")

/** Load compiled production modules with explicit native substitutes. */
function load(file, dependencies = {}, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file), "utf8"), {
    module, exports: module.exports, console,
    /** Fail immediately if a test unexpectedly reaches a native dependency. */
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    ...globals,
  }, { filename: file })
  return module.exports
}

/** Control the clock independently of timer delivery to model suspended callbacks. */
function scenario() {
  let now = 1000, nextId = 0
  const timers = new Map()
  const globals = {
    Date: { now: () => now },
    /** Keep timeout callbacks pending until the test delivers them. */
    setTimeout(callback, delay) { timers.set(++nextId, { callback, at: now + delay }); return nextId },
    clearTimeout: id => timers.delete(id),
  }
  const api = load("core/sleepTimer.js", {}, globals)
  return {
    api, globals, timers,
    /** Advance wall time while optionally leaving queued callbacks suspended. */
    advance(ms, deliver = true) {
      now += ms
      if (deliver) {
        for (const [id, task] of [...timers]) {
          if (task.at <= now) { timers.delete(id); task.callback() }
        }
      }
    },
  }
}

test("expiry pauses the attached PiP-capable player once and blocks autoplay", () => {
  const s = scenario()
  let pauses = 0
  s.api.attachSleepPlayer({ pause: () => pauses++ })
  s.api.setSleepTimer(1)
  s.advance(59999)
  assert.equal(pauses, 0)
  s.advance(1)
  assert.equal(pauses, 1)
  assert.equal(s.api.getSleepDeadline(), 0)
  assert.equal(s.api.canAutoPlay(), false)
  assert.equal(s.api.canAutoPlay(), false)
  assert.equal(pauses, 1)
})

test("autoplay checks enforce expiry even when the timer callback is delayed", () => {
  const s = scenario()
  let pauses = 0
  s.api.attachSleepPlayer({ pause: () => pauses++ })
  s.api.setSleepTimer(1)
  s.advance(60001, false)
  assert.equal(s.api.canAutoPlay(), false)
  assert.equal(pauses, 1)
  assert.equal(s.timers.size, 0)
})

test("replacing and cancelling a timer clears the old scheduled callback", () => {
  const s = scenario()
  s.api.setSleepTimer(1)
  s.advance(30000)
  s.api.setSleepTimer(2)
  assert.equal(s.timers.size, 1)
  s.advance(60000)
  assert.equal(s.api.canAutoPlay(), true)
  s.api.setSleepTimer(0)
  assert.equal(s.timers.size, 0)
  s.advance(120000)
  assert.equal(s.api.canAutoPlay(), true)
  assert.equal(s.api.getSleepDeadline(), 0)
})

test("invalid durations preserve an existing timer", () => {
  const s = scenario()
  s.api.setSleepTimer(30)
  const deadline = s.api.getSleepDeadline()
  for (const value of [-1, 1.5, NaN, Infinity, 1441]) {
    assert.throws(() => s.api.setSleepTimer(value), /1 至 1440/)
    assert.equal(s.api.getSleepDeadline(), deadline)
    assert.equal(s.timers.size, 1)
  }
})

test("detached players are untouched, and manual selection preserves a live deadline", () => {
  const s = scenario()
  const player = { pause: () => assert.fail("Detached player must not be paused") }
  s.api.attachSleepPlayer(player)
  s.api.setSleepTimer(1)
  s.api.resumeAfterSleep()
  assert.equal(s.api.getSleepDeadline(), 61000)
  s.api.detachSleepPlayer(player)
  s.advance(60000)
  assert.equal(s.api.canAutoPlay(), false)
  s.api.resumeAfterSleep()
  assert.equal(s.api.canAutoPlay(), true)
})

/** Mount only the real player's playback callbacks without media or network access. */
function mountPlayer(s) {
  let plays = 0, switches = 0, completeSwitch
  const player = {
    play: () => { plays++; return true },
    /** The native status reports paused until the test explicitly resumes playback. */
    pause() {},
    setSource: () => true,
    duration: 0,
    rate: 0,
  }
  const data = { seriesDetail: { vid_list: ["a", "b"] } }
  const states = [data, "a", false, "", player, "", "url", "", 0, 0, true, true, 0]
  let index = 0
  const effects = []
  const { PlayerView } = load("views/PlayerView.js", {
    scripting: {
      useState: () => [states[index++], () => {}],
      useRef: current => ({ current }),
      useObservable: value => ({ value }),
      useCallback: callback => callback,
      useEffect: (setup, deps) => effects.push({ setup, deps }),
    },
    "../core/sleepTimer": s.api,
    "../core/api": {}, "../core/mediaCache": {}, "../core/history": {},
    "../core/format": {}, "../core/playbackState": {}, "./Common": {}, "./EpisodeGrid": {},
    "../core/playbackSource": {
      /** Suspend a real switch continuation until after timer expiry. */
      resolvePlaybackSource() {
        switches++
        return new Promise(resolve => { completeSwitch = resolve })
      },
      applyOfflineSource: value => value,
    },
  }, { ...s.globals, createElement: () => ({}) })
  PlayerView({ seriesId: "series", initialVid: "a" })
  for (const effect of effects) {
    if (effect.deps[0] === player) effect.setup()
  }
  return { player, plays: () => plays, switches: () => switches,
    completeSwitch: () => completeSwitch({ url: "next", meta: null }) }
}

test("late ready, delayed mount and ended callbacks cannot restart an expired player", () => {
  const s = scenario()
  const p = mountPlayer(s)
  s.api.setSleepTimer(1)
  s.advance(60000)
  p.player.onReadyToPlay()
  p.player.onEnded()
  assert.equal(p.plays(), 0)
  assert.equal(p.switches(), 0)
})

test("an episode switch already in flight cannot restart playback after expiry", async () => {
  const s = scenario()
  const p = mountPlayer(s)
  s.api.setSleepTimer(1)
  p.player.onEnded()
  assert.equal(p.switches(), 1)
  s.advance(60000)
  p.completeSwitch()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(p.plays(), 0)
})

test("native manual playback after expiry restores continuous playback", () => {
  const s = scenario()
  const p = mountPlayer(s)
  s.api.setSleepTimer(1)
  s.advance(60000)
  p.player.onTimeControlStatusChanged()
  assert.equal(s.api.canAutoPlay(), false)
  p.player.rate = 1
  p.player.onTimeControlStatusChanged()
  assert.equal(s.api.canAutoPlay(), true)
  p.player.onEnded()
  assert.equal(p.switches(), 1)
})
