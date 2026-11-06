const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")

/** Run the production component with state, effect cleanup and native substitutes. */
function mount({ meta = { width: 1920, height: 1080 }, isiPhone = true } = {}) {
  const calls = { sources: 0, plays: 0, pauses: 0, orientations: [], fullscreen: [] }
  const original = ["portrait", "landscapeLeft"]
  let orientations = [...original], dirty = false, tree, stateIndex, refIndex, effectIndex
  const player = {
    duration: 0, rate: 0,
    /** Count media loading to detect accidental reloads during layout changes. */
    setSource() { calls.sources++; return true },
    /** Count playback starts independently of layout updates. */
    play() { calls.plays++ },
    /** Count playback pauses independently of layout updates. */
    pause() { calls.pauses++ },
    /** Replace native disposal without creating device resources. */
    dispose() {},
  }
  const states = [null, "a", false, "", player, "", "url", "", 0, 0, true, true, 0, false]
  const refs = [], effects = [], pending = [], pip = { value: null }
  const scripting = {
    /** Apply real setter semantics and schedule another render only when changed. */
    useState() {
      const i = stateIndex++
      return [states[i], value => {
        const next = typeof value === "function" ? value(states[i]) : value
        if (!Object.is(states[i], next)) { states[i] = next; dirty = true }
      }]
    },
    useRef: current => refs[refIndex++] ?? (refs[refIndex - 1] = { current }),
    useObservable: () => pip,
    useCallback: callback => callback,
    /** Schedule changed effects with their previous cleanup, as the host does. */
    useEffect(setup, deps) {
      const i = effectIndex++, previous = effects[i]
      if (!previous || deps.some((value, index) => !Object.is(value, previous.deps[index]))) {
        pending.push(() => {
          previous?.cleanup?.()
          effects[i] = { deps, cleanup: setup() }
        })
      }
    },
  }
  for (const name of ["AVPlayerView", "Button", "HStack", "Image", "ProgressView", "ScrollView", "Spacer", "Text", "VStack", "ZStack"]) scripting[name] = name
  const dependencies = {
    scripting,
    "../core/api": { fetchDetail: () => new Promise(() => {}) },
    "../core/mediaCache": { getCachedVideoMeta: () => meta },
    "../core/history": {}, "../core/format": {}, "./Common": {}, "./EpisodeGrid": {},
    "../core/playbackSource": {},
    "../core/playbackState": {
      /** Isolate PiP bookkeeping from the host runtime. */
      setPipPlaybackActive() {},
      /** Keep the simulated native player local to the test. */
      retainPipPlayer() {},
    },
    "../core/sleepTimer": {
      /** Avoid registering a real sleep timer during layout tests. */
      attachSleepPlayer() {},
      /** Avoid changing real sleep timer state during cleanup. */
      detachSleepPlayer() {},
    },
  }
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(__dirname, "../work/hongguo-build/views/PlayerView.js"), "utf8"), {
    module, exports: module.exports, console,
    /** Reject unexpected imports instead of reaching network or native services. */
    require(name) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name] },
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    Device: {
      isiPhone,
      /** Expose the currently allowed device directions. */
      get supportedInterfaceOrientations() { return orientations },
      /** Capture requests sent to the native orientation API. */
      set supportedInterfaceOrientations(value) { orientations = Array.from(value); calls.orientations.push(orientations) },
    },
    SharedAudioSession: { setCategory: () => Promise.resolve(), setActive: () => Promise.resolve() },
    setTimeout: () => 1,
    /** No real timers are scheduled by this harness. */
    clearTimeout() {},
  })
  const props = { seriesId: "series", onFullscreenChange: value => calls.fullscreen.push(value) }
  /** Flush state updates and effect cleanup until the component settles. */
  function render() {
    let passes = 0
    do {
      assert.ok(++passes < 10, "Component must settle")
      dirty = false; stateIndex = 0; refIndex = 0; effectIndex = 0
      tree = module.exports.PlayerView(props)
      for (const run of pending.splice(0)) run()
    } while (dirty)
    return tree
  }
  /** Read the stable video container and its script-owned button. */
  function surface() { return tree.children[0] }
  render()
  return {
    calls, original, player, surface, render,
    orientations: () => orientations,
    /** Activate the same button the user taps in the player overlay. */
    toggle() { surface().props.overlay.content.props.action(); render() },
    /** Model a source change while fullscreen without involving the network. */
    changeEpisode(nextMeta) { meta = nextMeta; states[1] = "b"; states[6] = "next-url"; render() },
    /** Deliver the native PiP transition and flush its state changes. */
    startPip() { pip.value = "willStart"; render() },
    /** Run all active effect cleanups when the page leaves navigation. */
    unmount() { for (const effect of effects) effect?.cleanup?.() },
  }
}

test("script fullscreen preserves native player identity, source and playback state", () => {
  const p = mount()
  const before = p.surface().children[0]
  const counts = [p.calls.sources, p.calls.plays, p.calls.pauses]
  p.toggle()
  const after = p.surface().children[0]
  assert.equal(after.type, "AVPlayerView")
  assert.equal(after.props.player, before.props.player)
  assert.equal(after.props.key, before.props.key)
  assert.deepEqual([p.calls.sources, p.calls.plays, p.calls.pauses], counts)
  assert.deepEqual(p.orientations(), ["landscape"])
  assert.equal(p.surface().props.overlay.content.props.title, "退出全屏")
  assert.equal(p.calls.fullscreen.at(-1), true)
  p.toggle()
  assert.deepEqual(p.orientations(), p.original)
  assert.equal(p.calls.fullscreen.at(-1), false)
})

test("portrait videos request portrait while missing, invalid and square dimensions preserve orientation", () => {
  const portrait = mount({ meta: { width: 720, height: 1280 } })
  portrait.toggle()
  assert.deepEqual(portrait.orientations(), ["portrait"])
  for (const meta of [null, {}, { width: 0, height: 1080 }, { width: NaN, height: 1 }, { width: 800, height: 800 }]) {
    const p = mount({ meta })
    p.toggle()
    assert.deepEqual(p.orientations(), p.original)
    assert.equal(p.calls.orientations.length, 0)
  }
})

test("episode changes reclassify dimensions and leaving the page restores original orientations", () => {
  const p = mount()
  p.toggle()
  p.changeEpisode({ width: 720, height: 1280 })
  assert.deepEqual(p.orientations(), ["portrait"])
  p.unmount()
  assert.deepEqual(p.orientations(), p.original)
  assert.equal(p.calls.fullscreen.at(-1), false)
})

test("starting PiP exits script fullscreen and restores original orientations", () => {
  const p = mount()
  p.toggle()
  p.startPip()
  assert.deepEqual(p.orientations(), p.original)
  assert.equal(p.calls.fullscreen.at(-1), false)
  assert.equal(p.surface().props.overlay.content.props.disabled, true)
})

test("iPad fullscreen does not write iPhone-only orientation configuration", () => {
  const p = mount({ isiPhone: false })
  p.toggle()
  assert.equal(p.calls.orientations.length, 0)
  p.toggle()
  assert.equal(p.calls.orientations.length, 0)
})
