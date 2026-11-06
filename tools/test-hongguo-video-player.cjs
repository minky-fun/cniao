const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.join(__dirname, "../work/hongguo-preview-build")

/** Provide explicitly controlled asynchronous native completions. */
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

/** Load compiled production code without device or network dependencies. */
function load(file, dependencies, globals) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file), "utf8"), {
    module, exports: module.exports, console,
    /** Disallow undeclared native services. */
    require(name) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name] },
    ...globals,
  }, { filename: file })
  return module.exports
}

/** Simulate state/effects and controller events while retaining production timer logic. */
function scenario() {
  let now = 1000, nextTimer = 0, cursor, dirty, tree, orientations = ["portrait", "landscapeLeft"]
  const timers = new Map(), hooks = [], pending = [], listeners = new Map()
  const opens = [], sources = [], calls = { plays: 0, pauses: 0, disposes: 0, audio: [], fullscreen: [] }
  let delayedPlay = null
  const globals = {
    Date: { now: () => now },
    /** Queue callbacks against the controlled wall clock. */
    setTimeout(callback, delay) { timers.set(++nextTimer, { callback, at: now + delay }); return nextTimer },
    clearTimeout: id => timers.delete(id),
  }
  const sleep = load("core/sleepTimer.js", {}, globals)
  const playbackState = load("core/playbackState.js", {}, globals)
  /** Deliver a native event to currently active listeners. */
  function emit(event, value) { for (const callback of [...(listeners.get(event) ?? [])]) callback(value) }
  const controller = {
    /** Keep opens pending until the test chooses which source finishes first. */
    open(source) { const task = deferred(); opens.push({ source, ...task }); return task.promise },
    /** Model both immediate and delayed starts. */
    play() {
      calls.plays++
      if (delayedPlay) return delayedPlay.promise
      emit("state", { state: "playing" })
      return Promise.resolve()
    },
    /** Emit the same state transition as native pause. */
    pause() { calls.pauses++; emit("state", { state: "paused" }) },
    /** Track native resource release. */
    dispose() { calls.disposes++; return Promise.resolve() },
    /** Return explicit listener cleanup handles. */
    on(event, callback) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event).add(callback)
      return () => listeners.get(event).delete(callback)
    },
  }
  const scripting = {
    /** Use actual lazy initializers and React-style updater functions. */
    useState(initial) {
      const index = cursor++
      if (!hooks[index]) hooks[index] = { value: typeof initial === "function" ? initial() : initial }
      return [hooks[index].value, value => {
        const next = typeof value === "function" ? value(hooks[index].value) : value
        if (!Object.is(next, hooks[index].value)) { hooks[index].value = next; dirty = true }
      }]
    },
    /** Retain object identity across component renders. */
    useRef(initial) { const index = cursor++; return hooks[index] ?? (hooks[index] = { current: initial }) },
    /** Retain callback identity until its dependencies change. */
    useCallback(callback, deps) {
      const index = cursor++, old = hooks[index]
      if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) hooks[index] = { callback, deps }
      return hooks[index].callback
    },
    /** Run changed effects with cleanup before replacement. */
    useEffect(setup, deps) {
      const index = cursor++, old = hooks[index]
      if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) {
        pending.push(() => { old?.cleanup?.(); hooks[index] = { deps, cleanup: setup() } })
      }
    },
  }
  for (const name of ["VideoPlaybackPlayer", "Button", "HStack", "Image", "ProgressView", "ScrollView", "Spacer", "Text", "VStack", "ZStack"]) scripting[name] = name
  const detail = { series_id: "series", series_name: "Example", vid_list: ["a", "b", "c"] }
  const { PlayerView } = load("views/PlayerView.js", {
    scripting,
    "../core/api": {},
    "../core/mediaCache": { getAutoCacheEnabled: () => false, getCachedVideoMeta: () => ({ width: 1920, height: 1080 }) },
    "../core/history": {
      /** Keep history writes inside the simulated script. */
      savePlayHistoryItem() {},
    },
    "../core/format": {}, "./Common": {}, "./EpisodeGrid": {},
    "../core/sleepTimer": sleep, "../core/playbackState": playbackState,
    "../core/playbackSource": {
      /** Reuse a local decrypted file, without downloading new content. */
      loadOfflinePlayerData(series, vid) {
        return Promise.resolve({ data: { seriesDetail: detail, playerInfo: { main_url: `file:///cache/${vid}.mp4` } } })
      },
      /** Track episode requests independently of native open completion. */
      resolvePlaybackSource(series, info, vid) { sources.push(vid); return Promise.resolve({ url: `file:///cache/${vid}.mp4` }) },
      applyOfflineSource: (data, vid, url) => ({ ...data, vid, playerInfo: { main_url: url } }),
    },
  }, {
    ...globals,
    /** Construct the device substitute exactly once through the lazy state initializer. */
    VideoPlaybackController: function () { return controller },
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    Device: {
      isiPhone: true,
      /** Expose the original orientation policy for cleanup assertions. */
      get supportedInterfaceOrientations() { return orientations },
      /** Capture orientation policy changes. */
      set supportedInterfaceOrientations(value) { orientations = Array.from(value) },
    },
    SharedAudioSession: {
      setCategory: () => Promise.resolve(),
      /** Record audio-session lifetime while PiP is active. */
      setActive(value) { calls.audio.push(value); return Promise.resolve() },
    },
  })
  const props = { seriesId: "series", initialVid: "a", onFullscreenChange: value => calls.fullscreen.push(value) }
  /** Flush synchronous state and effects to a stable tree. */
  function render() {
    let passes = 0
    do {
      assert.ok(++passes < 20, "Render must settle")
      dirty = false; cursor = 0
      tree = PlayerView(props)
      for (const run of pending.splice(0)) run()
    } while (dirty)
  }
  /** Flush promise continuations and their resulting component renders. */
  async function flush() {
    for (let i = 0; i < 10; i++) { await Promise.resolve(); if (dirty) render() }
  }
  /** Search rendered elements without running unrelated UI components. */
  function find(type, node = tree) {
    if (!node || typeof node !== "object") return null
    if (node.type === type || node.type?.name === type) return node
    for (const child of (node.children ?? []).flat(Infinity)) { const result = find(type, child); if (result) return result }
    return null
  }
  render()
  return {
    sleep, calls, opens, sources, emit, flush, find, controller, playbackState,
    orientations: () => orientations,
    /** Deliver all callbacks whose wall-clock deadlines have passed. */
    advance(ms) { now += ms; for (const [id, task] of [...timers]) if (task.at <= now) { timers.delete(id); task.callback() } },
    /** Complete the selected native open operation. */
    async ready(index = opens.length - 1) { opens[index].resolve({}); await flush() },
    /** Trigger the existing episode grid callback. */
    async select(vid) { find("EpisodeInfoPanel").props.onSwitch(vid); await flush() },
    /** Hold a native playback request across timer expiry. */
    delayPlay() { delayedPlay = deferred() },
    /** Deliver a late native playing state before resolving its request. */
    async finishPlay() { emit("state", { state: "playing" }); delayedPlay.resolve(); await flush() },
    /** Simulate navigation cleanup of all subscribed effects. */
    unmount() { for (const hook of hooks) hook?.cleanup?.() },
  }
}

test("new player opens the existing local cache and starts only after native open completes", async () => {
  const p = scenario(); await p.flush()
  assert.equal(p.opens[0].source, "file:///cache/a.mp4")
  assert.equal(p.calls.plays, 0)
  assert.equal(p.find("VideoPlaybackPlayer").props.controller, p.controller)
  assert.equal(p.find("VideoPlaybackPlayer").props.showFullscreenButton, false)
  assert.equal(p.find("VideoPlaybackPlayer").props.bottomTrailing.props.title, "全屏")
  await p.ready()
  assert.equal(p.calls.plays, 1)
})

test("open completing after sleep expiry cannot start playback or advance episodes", async () => {
  const p = scenario(); await p.flush()
  p.sleep.setSleepTimer(1); p.advance(60001)
  await p.ready()
  p.emit("ended", {}); await p.flush()
  assert.equal(p.calls.plays, 0)
  assert.equal(p.sources.length, 0)
})

test("a pending asynchronous play cannot override timer expiry", async () => {
  const p = scenario(); await p.flush()
  p.delayPlay(); await p.ready()
  p.sleep.setSleepTimer(1); p.advance(60001)
  await p.finishPlay()
  assert.equal(p.sleep.canAutoPlay(), false)
  assert.ok(p.calls.pauses >= 2)
})

test("continuous playback uses existing episode resolution and rejects stale open continuations", async () => {
  const p = scenario(); await p.flush(); await p.ready()
  p.emit("ended", {}); await p.flush()
  assert.deepEqual(p.sources, ["b"])
  await p.select("c")
  assert.equal(p.opens.length, 3)
  const starts = p.calls.plays
  await p.ready(1)
  assert.equal(p.calls.plays, starts)
  await p.ready(2)
  assert.equal(p.calls.plays, starts + 1)
})

test("fullscreen callback changes layout without replacing controller and restores orientation", async () => {
  const p = scenario(); await p.flush(); await p.ready()
  const player = p.find("VideoPlaybackPlayer")
  player.props.bottomTrailing.props.action(); await p.flush()
  assert.deepEqual(p.orientations(), ["landscape"])
  assert.equal(p.calls.fullscreen.at(-1), true)
  assert.equal(p.find("ScrollView"), null)
  assert.equal(p.find("VideoPlaybackPlayer").props.controller, player.props.controller)
  assert.equal(p.find("VideoPlaybackPlayer").props.bottomTrailing.props.title, "退出全屏")
  const background = p.find("VStack").props.background
  assert.equal(background.props.background, "black")
  assert.equal(background.props.ignoresSafeArea, true)
  assert.equal(p.find("VideoPlaybackPlayer").props.ignoresSafeArea, undefined)
  p.find("VideoPlaybackPlayer").props.bottomTrailing.props.action(); await p.flush()
  assert.deepEqual(p.orientations(), ["portrait", "landscapeLeft"])
  assert.ok(p.find("ScrollView"))
  assert.equal(p.find("VideoPlaybackPlayer").props.bottomTrailing.props.title, "全屏")
  assert.equal(p.opens.length, 1)
})

test("leaving during open prevents late playback and releases the controller", async () => {
  const p = scenario(); await p.flush(); p.unmount(); await p.ready()
  assert.equal(p.calls.plays, 0)
  assert.equal(p.calls.disposes, 1)
})

test("PiP retains its audio session and controller until the floating window closes", async () => {
  const p = scenario(); await p.flush(); await p.ready()
  p.emit("pictureInPicture", { active: true }); await p.flush(); p.unmount()
  assert.equal(p.calls.disposes, 0)
  assert.equal(p.calls.audio.at(-1), true)
  p.sleep.setSleepTimer(1); p.advance(60001)
  assert.ok(p.calls.pauses >= 1)
  p.emit("pictureInPicture", { active: false }); await p.flush()
  assert.equal(p.calls.disposes, 1)
  assert.equal(p.calls.audio.at(-1), false)
})

test("open errors stop the busy overlay and remain visible in the existing error area", async () => {
  const p = scenario(); await p.flush()
  p.opens[0].reject(new Error("Unsupported media")); await p.flush()
  assert.match(p.find("EpisodeInfoPanel").props.errorMessage, /Unsupported media/)
  assert.equal(p.find("ProgressView"), null)
  assert.equal(p.calls.plays, 0)
  await p.select("a")
  assert.equal(p.opens.length, 2)
  await p.ready()
  assert.equal(p.calls.plays, 1)
})
