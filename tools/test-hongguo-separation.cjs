const assert = require("node:assert/strict")
const { readFileSync, readdirSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const root = path.resolve(__dirname, "..")
const original = path.join(root, "work/hongguo-preview-build")
const standalone = path.join(root, "work/hongguo-feed-build")

/** Execute compiled modules with explicit local substitutes and no device access. */
function load(build, file, dependencies = {}, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file + ".js"), "utf8"), {
    module, exports: module.exports, console, ...globals,
    /** Reject undeclared dependencies, including accidental links to the other project. */
    require(name) { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name] },
  })
  return module.exports
}

/** Preserve hook state while rendering only the root's native container tree. */
function mount(build, screens, dependencies = {}, globals = {}) {
  const slots = [], reads = []
  let cursor = 0, tree, dismissals = 0
  const scripting = {
    /** Preserve functional state updates without running native UI. */
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value }]
    },
    /** Skip mount effects so root tests cannot scan user cache files. */
    useEffect() {},
    Navigation: { useDismiss: () => () => { dismissals++ } },
  }
  scripting.useObservable = initial => scripting.useState(() => ({ value: initial, setValue(value) { this.value = value } }))[0]
  for (const name of ["NavigationDestination", "NavigationStack", "VStack", "Tab", "TabView", "Button", "ZStack"]) scripting[name] = name
  const imports = {
    scripting,
    "../core/mediaCache": { pruneOfflineCache: () => 0 },
    "../core/playbackState": { isPipPlaybackActive: () => false },
    "./Common": { PAGE_FRAME: {}, THEME_COLOR: "#fa7705" },
    ...dependencies,
  }
  for (const name of screens) imports["./" + name] = { [name]: name }
  const { App } = load(build, "views/App", imports, {
    Storage: {
      /** Simulate an HG installation whose obsolete saved mode still says video. */
      get(key) { reads.push(key); return key === "hongguo-home-mode" ? "video" : null },
    },
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
    ...globals,
  })
  /** Recompute the root after navigation or settings changes. */
  function render() { cursor = 0; tree = App() }
  /** Expand HG tab content to inspect the actual selected view types. */
  function nodes(node = tree) {
    if (!node || typeof node !== "object") return []
    return [node, ...node.children.flatMap(child => nodes(child)),
      ...(node.props.render ? nodes(node.props.render(node.props.push)) : [])]
  }
  render()
  return { slots, reads, render, nodes, dismissals: () => dismissals }
}

test("HG always opens its poster homepage and settings no longer receive a feed mode", () => {
  const page = mount(original, ["CacheView", "CacheManagerView", "CategoryView", "DetailView", "HistoryView", "HomeView", "PlayerView", "RankView", "SearchView", "SettingsView"])
  assert.ok(page.nodes().some(node => node.type === "HomeView"))
  assert.ok(!page.nodes().some(node => node.type === "VideoFeedView"))
  assert.ok(!page.reads.includes("hongguo-home-mode"))
  const settings = page.nodes().find(node => node.type === "SettingsView").props
  for (const key of ["homeMode", "homeModeError", "onHomeModeChange"]) assert.ok(!(key in settings))
})

test("standalone has only feed and episode navigation, and returning resumes the feed", async () => {
  const page = mount(standalone, ["VideoFeedView", "PlayerView"])
  const feed = () => page.nodes().find(node => node.type === "VideoFeedView")
  assert.equal(feed().props.active, true)
  assert.equal(page.nodes().filter(node => node.type === "TabView").length, 0)
  assert.ok(!("onSearch" in feed().props))
  assert.ok(!("onOpenHistory" in feed().props))
  feed().props.onPlaySeries("1234567890", "2345678901")
  page.render()
  assert.equal(feed().props.active, false)
  const destination = page.nodes().find(node => node.props.navigationDestination).props.navigationDestination
  const player = destination.children[0](page.slots[0].value[0])
  assert.equal(player.type, "PlayerView")
  assert.equal(player.props.seriesId, "1234567890")
  assert.equal(player.props.initialVid, "2345678901")
  page.slots[0].setValue([])
  page.render()
  assert.equal(feed().props.active, true)
  await feed().props.onClose()
  assert.equal(page.dismissals(), 1)
})

test("standalone preferences and cache paths do not reuse HG data", () => {
  const values = new Map([["hongguo-auto-cache", false], ["hongguo-cache-max-bytes", 1024 ** 3]])
  const cachePaths = []
  const globals = { Storage: { get: key => values.get(key), set: (key, value) => { values.set(key, value); return true } },
    FileManager: { appGroupDocumentsDirectory: "/test", existsSync: file => { cachePaths.push(file); return false } } }
  const caches = [original, standalone].map(build => load(build, "core/mediaCache", {
    "./appApi": {}, "./mp4": {}, "./config": load(build, "core/config"), "./http": {},
  }, globals))
  assert.equal(caches[0].getAutoCacheEnabled(), false)
  assert.equal(caches[1].getAutoCacheEnabled(), true)
  assert.equal(caches[1].getPlaybackCacheMaxBytes(), 500 * 1024 ** 2)
  caches[1].setPlaybackCacheMaxBytes(128 * 1024 ** 2)
  assert.equal(caches[0].getPlaybackCacheMaxBytes(), 1024 ** 3)
  caches.forEach(cache => cache.isOfflineVideoCached("1234567890"))
  assert.notEqual(cachePaths[0], cachePaths[1])
})

test("standalone source is self-contained and has its own metadata and identity key", () => {
  const source = path.join(root, "scripts/HG 刷剧")
  const metadata = JSON.parse(readFileSync(path.join(source, "script.json"), "utf8"))
  assert.equal(metadata.name, "HG 刷剧")
  assert.equal(metadata.entry, "index.tsx")
  assert.ok(!metadata.remoteResource)
  for (const entry of readdirSync(source, { recursive: true })) {
    if (!/\.tsx?$/.test(entry)) continue
    const text = readFileSync(path.join(source, entry), "utf8")
    for (const [, spec] of text.matchAll(/\bfrom\s+["']([^"']+)["']/g)) {
      if (!spec.startsWith(".")) continue
      const target = path.resolve(source, path.dirname(entry), spec)
      assert.ok(target.startsWith(source + path.sep), `${entry}: ${spec}`)
    }
  }
  const identity = readFileSync(path.join(source, "core/playbackIdentity.ts"), "utf8")
  assert.ok(identity.includes('const STORAGE_KEY = "hongguo-feed-registered-player-device-v1"'))
})
