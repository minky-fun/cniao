// Run after: tsc -p tools/tsconfig.hongguo-preview.json
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.join(__dirname, "../work/hongguo-preview-build")
const historyPath = "/app/hongguo-history.json"
const favoritesPath = "/app/hongguo-favorites.json"

/** Load compiled production modules with explicit native dependencies. */
function load(file, dependencies, globals) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file), "utf8"), {
    module, exports: module.exports, console, ...globals,
    /** Reject undeclared dependencies instead of loading a real host API. */
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), name)
      return dependencies[name]
    },
  }, { filename: file })
  return module.exports
}

/** Supply an isolated file store and controllable write failures. */
function fixture() {
  const files = new Map()
  const native = {
    appGroupDocumentsDirectory: "/app",
    existsSync: file => files.has(file),
    readAsStringSync: file => files.get(file),
    writeAsStringSync: (file, text) => { files.set(file, text) },
    removeSync: file => { files.delete(file) },
    exists: async file => files.has(file),
    readAsString: async file => files.get(file),
  }
  const globals = { FileManager: native }
  return {
    files, native,
    favorites: load("core/favorites.js", {}, globals),
    history: load("core/history.js", {}, globals),
  }
}

/** Build nonprivate metadata using the exact persistence schema. */
function series(seriesId) {
  return { seriesId, title: `Drama ${seriesId}`, cover: "", totalEpisodes: 20 }
}

/** Render real page handlers with deterministic state and geometry. */
function view(fx, component = "history") {
  const slots = [], played = [], opened = [], alerts = []
  let cursor = 0, tree
  const scripting = Object.fromEntries([
    "Button", "GeometryReader", "Group", "HStack", "Image", "LazyVGrid", "ScrollView", "Spacer", "Text", "VStack", "ZStack",
  ].map(name => [name, name]))
  scripting.useState = initial => {
    const index = cursor++
    if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial }
    return [slots[index].value, value => {
      slots[index].value = typeof value === "function" ? value(slots[index].value) : value
    }]
  }
  scripting.useObservable = initial => {
    const index = cursor++
    if (!slots[index]) slots[index] = {
      value: initial,
      /** Mutate the same observable instance between page renders. */
      setValue(value) { this.value = value },
    }
    return slots[index]
  }
  const dialog = {
    confirm: async () => true,
    alert: async options => { alerts.push(options) },
  }
  const common = Object.fromEntries(["CoverImage", "EmptyView", "ErrorView", "LoadingView"].map(name => [name, name]))
  const globals = {
    FileManager: fx.native, Dialog: dialog,
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    Fragment: "Fragment",
  }
  const exports = load(component === "history" ? "views/HistoryView.js" : "views/FavoriteButton.js", {
    scripting, "../core/favorites": fx.favorites, "../core/history": fx.history,
    "./Common": { ...common, FILL_LEADING: {}, PAGE_FRAME: {} },
  }, globals)

  /** Reevaluate the component without recreating its state. */
  function render() {
    cursor = 0
    tree = component === "history"
      ? exports.HistoryView({ onPlaySeries: (...args) => played.push(args), onOpenSeries: id => opened.push(id) })
      : exports.FavoriteButton({ record: series("a") })
  }

  /** Expand geometry only, preserving card props for interaction tests. */
  function nodes(node = tree) {
    if (Array.isArray(node)) return node.flatMap(child => nodes(child))
    if (typeof node === "function") return nodes(node({ size: { width: 390 } }))
    if (!node || typeof node !== "object") return []
    return [node, ...nodes(node.children)]
  }

  /** Read text descendants to find the visible action a user can tap. */
  function label(node) {
    if (typeof node === "string") return node
    if (Array.isArray(node)) return node.map(label).join("")
    return node?.props?.title || label(node?.children || [])
  }

  /** Find a button by its visible label and invoke the real handler. */
  async function tap(title) {
    const button = nodes().find(node => node.type === "Button" && label(node) === title)
    assert.ok(button, `Missing button: ${title}`)
    assert.ok(!button.props.disabled, `Disabled button: ${title}`)
    await button.props.action()
    render()
  }

  /** Refresh through the production appearance callback. */
  async function appear() { await tree.props.onAppear(); render() }

  render()
  return {
    render, tap, appear, nodes, played, opened, alerts, dialog,
    cards: () => nodes().filter(node => node.type?.name === "HistoryCard"),
    root: () => tree,
  }
}

/** Favorites survive history limits and duplicate additions. */
test("favorites persist independently of history eviction and clearing", () => {
  const fx = fixture()
  fx.favorites.addFavorite(series("a"))
  fx.favorites.addFavorite(series("a"))
  assert.equal(fx.favorites.loadFavorites().length, 1)
  for (let i = 0; i < 120; i++) fx.history.savePlayHistoryItem({ ...series(String(i)), lastVid: "v1", lastEpisodeIndex: 0 })
  assert.equal(fx.history.loadPlayHistory().length, 100)
  assert.equal(fx.favorites.loadFavorites()[0].seriesId, "a")
  fx.history.clearPlayHistory()
  assert.equal(fx.favorites.loadFavorites().length, 1)
  fx.history.savePlayHistoryItem({ ...series("a"), lastVid: "v4", lastEpisodeIndex: 3 })
  const before = fx.files.get(historyPath)
  fx.favorites.removeFavorites(["a"])
  assert.equal(fx.files.get(historyPath), before)
})

/** Corrupt or unreadable favorites must never be silently overwritten. */
test("invalid favorites reject mutations and preserve the original bytes", () => {
  const fx = fixture()
  for (const raw of ["broken JSON", JSON.stringify([{}]), JSON.stringify({})]) {
    fx.files.set(favoritesPath, raw)
    assert.throws(() => fx.favorites.addFavorite(series("a")))
    assert.throws(() => fx.favorites.removeFavorites(["a"]))
    assert.equal(fx.files.get(favoritesPath), raw)
  }
})

/** A saved show resumes only with a real history record; otherwise it opens details. */
test("library defaults to history and joins favorites to real progress", async () => {
  const fx = fixture()
  fx.favorites.addFavorite(series("a"))
  fx.favorites.addFavorite(series("b"))
  fx.history.savePlayHistoryItem({ ...series("a"), lastVid: "v4", lastEpisodeIndex: 3 })
  const page = view(fx)
  await page.appear()
  assert.equal(page.cards().length, 1)
  await page.tap("我的收藏")
  assert.equal(page.cards().length, 2)
  const watched = page.cards().find(card => card.props.record.seriesId === "a")
  const unwatched = page.cards().find(card => card.props.record.seriesId === "b")
  watched.props.onSelect(watched.props.record)
  unwatched.props.onSelect(unwatched.props.record)
  assert.deepEqual(page.played, [["a", "v4"]])
  assert.deepEqual(page.opened, ["b"])
  assert.equal(watched.props.record.history.lastEpisodeIndex, 3)
  assert.equal(unwatched.props.record.history, undefined)
  await page.tap("最近观看")
  await page.tap("清空历史")
  await page.tap("我的收藏")
  assert.equal(page.cards().length, 2)
  assert.ok(page.cards().every(card => !card.props.record.history))
})

/** Long-press collection actions preserve the real watching record. */
test("history card can add and cancel a favorite without deleting history", async () => {
  const fx = fixture()
  fx.history.savePlayHistoryItem({ ...series("a"), lastVid: "v4", lastEpisodeIndex: 3 })
  const page = view(fx)
  await page.appear()
  let card = page.cards()[0]
  await card.props.onToggleFavorite(card.props.record)
  page.render()
  assert.equal(page.cards()[0].props.record.saved, true)
  card = page.cards()[0]
  await card.props.onToggleFavorite(card.props.record)
  page.render()
  assert.equal(page.cards()[0].props.record.saved, false)
  assert.equal(fx.history.loadPlayHistory()[0].lastVid, "v4")
})

/** Changing lists clears editing selections and keeps batch operations scoped. */
test("batch cancellation affects favorites only and switching tabs clears selection", async () => {
  const fx = fixture()
  fx.favorites.addFavorite(series("a"))
  fx.favorites.addFavorite(series("b"))
  fx.history.savePlayHistoryItem({ ...series("a"), lastVid: "v4", lastEpisodeIndex: 3 })
  const page = view(fx)
  await page.appear()
  await page.tap("编辑")
  page.cards()[0].props.onSelect(page.cards()[0].props.record)
  page.render()
  await page.tap("我的收藏")
  assert.ok(page.cards().every(card => !card.props.isEditing && !card.props.selected))
  await page.tap("编辑")
  await page.tap("全选")
  await page.tap("取消所选收藏")
  assert.equal(fx.favorites.loadFavorites().length, 0)
  assert.equal(fx.history.loadPlayHistory().length, 1)
})

/** Dialogs retain the original operation even if the active list changes. */
test("cancelled confirmations do nothing and pending confirmations retain their target", async () => {
  const fx = fixture()
  fx.favorites.addFavorite(series("a"))
  fx.history.savePlayHistoryItem({ ...series("a"), lastVid: "v4", lastEpisodeIndex: 3 })
  const page = view(fx)
  await page.appear()
  page.dialog.confirm = async () => false
  await page.cards()[0].props.onRemove(page.cards()[0].props.record)
  assert.equal(fx.history.loadPlayHistory().length, 1)
  let resolve
  page.dialog.confirm = () => new Promise(done => { resolve = done })
  const pending = page.cards()[0].props.onRemove(page.cards()[0].props.record)
  await page.tap("我的收藏")
  resolve(true)
  await pending
  assert.equal(fx.history.loadPlayHistory().length, 0)
  assert.equal(fx.favorites.loadFavorites().length, 1)
})

/** Native write failures must not produce an optimistic saved state. */
test("glass favorite button reports failed writes and refreshes external changes", async () => {
  const fx = fixture()
  const button = view(fx, "button")
  await button.appear()
  fx.native.writeAsStringSync = () => { throw new Error("Disk full") }
  await button.tap("收藏")
  assert.equal(button.root().props.title, "收藏")
  assert.equal(button.alerts.length, 1)
  fx.native.writeAsStringSync = (file, text) => { fx.files.set(file, text) }
  fx.favorites.addFavorite(series("a"))
  await button.appear()
  assert.equal(button.root().props.title, "已收藏")
  await button.tap("已收藏")
  assert.equal(fx.favorites.loadFavorites().length, 0)
})

/** A damaged collection must not prevent the history list from opening. */
test("favorite errors remain isolated from history", async () => {
  const fx = fixture()
  fx.files.set(favoritesPath, "broken JSON")
  fx.history.savePlayHistoryItem({ ...series("a"), lastVid: "v1", lastEpisodeIndex: 0 })
  const page = view(fx)
  await page.appear()
  assert.equal(page.cards().length, 1)
  await page.tap("我的收藏")
  assert.ok(page.nodes().some(node => node.type === "ErrorView"))
})
