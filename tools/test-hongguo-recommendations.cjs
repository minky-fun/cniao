const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.resolve(__dirname, process.env.HONGGUO_BUILD_DIR ?? "../work/hongguo-build")

/** Load compiled production modules with explicit host adapters. */
function load(file, dependencies, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file + ".js"), "utf8"), {
    module, exports: module.exports, console, Error, Set, Promise,
    /** Reject undeclared dependencies so a regression cannot reach a real host. */
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    ...globals,
  }, { filename: file })
  return module.exports
}

/** Return clearly synthetic API data including an unsafe numeric ID beside the correct string ID. */
function rawVideo(number = 1) {
  const vid = `1000000000000000${number}1`
  return { vid: "", disable_play: false, rec_tags: [{ content: "推荐测试" }], video_detail: {
    series_id: 9007199254740992, series_id_str: `10000000000000000${number}`,
    series_title: `测试剧 ${number}`, series_intro: "合成数据", series_cover: "https://example.invalid/cover.jpg",
    episode_cnt: 2, video_list: [
      { vid, vid_index: 1, disable_play: false },
      { vid: `1000000000000000${number}2`, vid_index: 2, disable_play: false },
    ],
  } }
}

/** Build the observed top-level pagination envelope, including a non-video cell. */
function envelope(videos = [rawVideo()], offset = 6, hasMore = true) {
  return { code: 0, data: { has_more: hasMore, next_offset: offset, session_id: "synthetic-session",
    cell_view: { cell_data: [{ video_data: videos }, { show_type: 407 }] },
  } }
}

/** Provide synthetic transport, identity and storage without real account data. */
function apiHost(replies = []) {
  const calls = [], signs = [], registrations = [], store = new Map()
  let saveAllowed = true
  class HttpError extends Error {
    /** Carry an HTTP status for the production retry policy. */
    constructor(message, status) { super(message); this.status = status }
  }
  const api = load("core/recommendations", {
    scripting: {
      /** Consume only the declared HTTP replies. */
      async fetch(url, options) {
        calls.push({ url, options })
        assert.ok(replies.length, "Unexpected HTTP request")
        const reply = replies.shift()
        if (reply instanceof Error) throw reply
        return { ok: (reply.status ?? 200) === 200, status: reply.status ?? 200,
          text: async () => typeof reply === "string" ? reply : JSON.stringify(reply.body ?? reply) }
      },
    },
    "./http": { HttpError },
    "./config": { APP_COMMON_QUERY: { aid: "8662", device_platform: "android" } },
    "./playbackIdentity": { PLAYBACK_USER_AGENT: "synthetic-agent",
      /** Record whether production refreshes an already rejected anonymous identity. */
      async getPlaybackIdentity(previous) {
        registrations.push(previous)
        return { deviceId: "synthetic-device", installId: "synthetic-install", deviceToken: "synthetic-token", cookies: {} }
      },
    },
    "./playbackSign": {
      /** Capture the exact signed parameters without using live credentials. */
      signPlayback(params, body) { signs.push({ params, body }); return { query: "synthetic-query", headers: {} } },
    },
  }, { Storage: { get: key => store.get(key), set: (key, value) => {
    if (!saveAllowed) return false
    store.set(key, value); return true
  } } })
  return { api, calls, signs, registrations, store, rejectSaves: () => { saveAllowed = false } }
}

/** Render the real root with native containers replaced, keeping actual mode storage behavior. */
function mountApp(host) {
  const slots = []
  let index = 0, tree
  /** Preserve root state between simulated settings and navigation actions. */
  function useState(initial) {
    const position = index++
    if (!(position in slots)) slots[position] = typeof initial === "function" ? initial() : initial
    return [slots[position], value => { slots[position] = typeof value === "function" ? value(slots[position]) : value }]
  }
  const dependencies = {
    scripting: { useState, useEffect() {}, Navigation: { useDismiss: () => () => {} },
      useObservable: initial => useState(() => ({ value: initial, setValue(value) { this.value = value } }))[0] },
    "../core/recommendations": host.api,
    "../core/mediaCache": { pruneOfflineCache: () => 0 },
    "../core/playbackState": { isPipPlaybackActive: () => false },
    "./Common": { THEME_COLOR: "#fa7705" },
  }
  for (const name of ["CacheView", "CacheManagerView", "CategoryView", "DetailView", "HistoryView", "HomeView", "PlayerView", "RankView", "SearchView", "SettingsView", "VideoFeedView"]) dependencies["./" + name] = { [name]: name }
  const { App } = load("views/App", dependencies, {
    Storage: { get: key => host.store.get(key) },
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
  })
  /** Rerender the actual root after a simulated user action. */
  function render() { index = 0; tree = App() }
  /** Expand only the root's page render callbacks to inspect the intended screens. */
  function nodes(node = tree) {
    if (!node || typeof node !== "object") return []
    return [node, ...(node.children ?? []).flatMap(child => nodes(child)),
      ...(node.props.render ? nodes(node.props.render(node.props.push)) : [])]
  }
  render()
  return { render, nodes, select: value => { slots[0].setValue(value); render() } }
}

test("home mode defaults to the original homepage and writes only on successful storage", () => {
  const h = apiHost()
  assert.equal(h.api.getHomeMode(), "recommend")
  h.api.setHomeMode("video")
  assert.equal(h.api.getHomeMode(), "video")
  h.rejectSaves()
  assert.throws(() => h.api.setHomeMode("recommend"), /保存失败/)
  assert.equal(h.api.getHomeMode(), "video")
})

test("settings switches the real homepage immediately and root tab/path state gates playback", () => {
  const host = apiHost(), app = mountApp(host)
  assert.ok(app.nodes().some(node => node.type === "HomeView"))
  app.nodes().find(node => node.type === "SettingsView").props.onHomeModeChange("video")
  app.render()
  let feed = app.nodes().find(node => node.type === "VideoFeedView")
  assert.equal(feed.props.active, true)
  app.select(4)
  assert.equal(app.nodes().find(node => node.type === "VideoFeedView").props.active, false)
  app.select(0)
  feed = app.nodes().find(node => node.type === "VideoFeedView")
  feed.props.onSearch(); app.render()
  assert.equal(app.nodes().find(node => node.type === "VideoFeedView").props.active, false)
  host.rejectSaves()
  app.nodes().find(node => node.type === "SettingsView").props.onHomeModeChange("recommend")
  app.render()
  const settings = app.nodes().find(node => node.type === "SettingsView").props
  assert.equal(settings.homeMode, "video")
  assert.match(settings.homeModeError, /保存失败/)
})

test("recommendations sign the exact desktop GET and follow top-level offset/session", async () => {
  const first = rawVideo(), second = rawVideo(2)
  second.vid = second.video_detail.video_list[1].vid
  const h = apiHost([envelope([first]), envelope([second], 12)])
  const a = await h.api.fetchRecommendationPage()
  const b = await h.api.fetchRecommendationPage(a.cursor)
  assert.equal(a.items[0].detail.series_id, first.video_detail.series_id_str)
  assert.equal(a.items[0].vid, first.video_detail.video_list[0].vid)
  assert.equal(b.items[0].vid, second.vid)
  assert.equal(b.items[0].episodeIndex, 1)
  assert.equal(h.calls[0].options.method, "GET")
  assert.ok(h.calls[0].url.includes("/reading/bookapi/bookmall/cell/change/v?"))
  assert.equal(h.calls[0].options.body, undefined)
  assert.equal(h.signs[0].body, "")
  const p = h.signs[0].params
  for (const [key, value] of Object.entries({ bottom_tab_type: "7", client_req_type: "2", client_template: "7",
    change_type: "0", category_id: "0", cell_sub_id: "0", limit: "0", need_personal_recommend: "1",
    video_type_preferences_str: "[]", cell_id: "7294257141911650341", plan_id: "7294257258253254693",
    tab_type: "16", offset: "0", session_id: "" })) assert.equal(p[key], value, key)
  assert.equal(h.signs[1].params.offset, "6")
  assert.equal(h.signs[1].params.session_id, "synthetic-session")
})

test("non-video cells, duplicate series and disabled episodes do not become playable cards", async () => {
  const disabled = rawVideo(2)
  disabled.video_detail.video_list[0].disable_play = true
  const h = apiHost([envelope([rawVideo(), rawVideo(), disabled])])
  const page = await h.api.fetchRecommendationPage()
  assert.equal(page.items.length, 1)
})

test("malformed required IDs and stuck pagination fail explicitly without speculative fallback", async () => {
  const bad = rawVideo()
  delete bad.video_detail.series_id_str
  await assert.rejects(apiHost([envelope([bad])]).api.fetchRecommendationPage(), /有效详情/)
  const stuck = apiHost([envelope([rawVideo()], 6)])
  await assert.rejects(stuck.api.fetchRecommendationPage({ offset: 6, sessionId: "synthetic-session" }), /分页信息/)
  const malformed = envelope(); malformed.data.cell_view.cell_data[0].video_data = {}
  await assert.rejects(apiHost([malformed]).api.fetchRecommendationPage(), /列表格式/)
})

test("empty responses rotate hosts and refresh identity once, while HTTP 403 stops immediately", async () => {
  const h = apiHost(["", " ", "", ""])
  await assert.rejects(h.api.fetchRecommendationPage(), /空响应/)
  assert.equal(h.calls.length, 4)
  assert.equal(h.registrations.length, 2)
  assert.ok(h.registrations[1])
  const denied = apiHost([{ status: 403 }])
  await assert.rejects(denied.api.fetchRecommendationPage(), /HTTP 403/)
  assert.equal(denied.calls.length, 1)
})

/** Defer a native or network continuation until the test advances it. */
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

/** Convert the same raw synthetic data into the production view's model. */
function item(number) {
  const raw = rawVideo(number), series = raw.video_detail
  return { detail: { series_id: series.series_id_str, series_name: series.series_title,
    series_cover: series.series_cover, series_intro: series.series_intro,
    episode_cnt: 2, vid_list: series.video_list.map(episode => episode.vid), tags: [], celebrities: [] },
    vid: series.video_list[0].vid, episodeIndex: 0, reason: "推荐测试" }
}

/** Simulate hooks and native lifecycle while running the actual compiled feed component. */
function mountFeed({ autoCache = true } = {}) {
  const slots = [], effects = [], timers = new Map(), listeners = new Set()
  const pages = [], sources = [], history = []
  const cache = { enabled: autoCache, requests: [], saved: new Set() }
  let hook = 0, dirty = false, tree, props = { active: true, onPlaySeries() {}, onOpenHistory() {}, onSearch() {} }
  let now = 1000, timerId = 0, pip = false
  const globals = {
    Date: { now: () => now },
    setTimeout: (fn, ms) => { timers.set(++timerId, { fn, at: now + ms }); return timerId },
    clearTimeout: id => timers.delete(id),
  }
  const sleep = load("core/sleepTimer", {}, globals)
  const player = { rate: 0, plays: 0, pauses: 0, disposed: 0, bound: [], acceptSource: true,
    /** Track playback only after a real production source bind. */
    play() { this.plays++; this.rate = 1; this.onTimeControlStatusChanged?.(); return true },
    /** Reflect a native pause back to the component. */
    pause() { this.pauses++; this.rate = 0; this.onTimeControlStatusChanged?.() },
    /** Keep callbacks controlled so tests can deliver late native notifications. */
    setSource(url) { this.bound.push(url); return this.acceptSource },
    dispose() { this.disposed++ },
  }
  /** Preserve each state slot and request a deterministic rerender on changes. */
  function useState(initial) {
    const position = hook++
    if (!(position in slots)) slots[position] = typeof initial === "function" ? initial() : initial
    return [slots[position], value => {
      const next = typeof value === "function" ? value(slots[position]) : value
      if (!Object.is(next, slots[position])) { slots[position] = next; dirty = true }
    }]
  }
  const scripting = { useState, AbortController,
    useRef: value => useState(() => ({ current: value }))[0],
    useObservable: value => useState(() => ({ value }))[0],
    /** Schedule effects only when their actual dependencies change. */
    useEffect(setup, deps) {
      const position = hook++, previous = effects[position]
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        effects[position] = { setup, deps, cleanup: previous?.cleanup, pending: true }
      }
    },
    AppEvents: { scenePhase: { addListener: listener => listeners.add(listener), removeListener: listener => listeners.delete(listener) } },
    gradient: () => "gradient",
  }
  for (const type of ["AVPlayerView", "Button", "GeometryReader", "HStack", "Image", "LazyVStack", "ProgressView", "ScrollView", "Spacer", "Text", "VStack", "ZStack"]) scripting[type] = type
  const { VideoFeedView } = load("views/VideoFeedView", {
    scripting,
    "../core/recommendations": {
      /** Hold page requests for testing duplicate triggers, errors and retry cursors. */
      fetchRecommendationPage(cursor) { const task = deferred(); pages.push({ ...task, cursor }); return task.promise },
    },
    "../core/feedPlayback": {
      /** Hold media preparation while scroll/tab/scene changes invalidate it. */
      prepareFeedPlayback(seriesId, detail, vid, signal) { const task = deferred(); sources.push({ ...task, seriesId, detail, vid, signal }); return task.promise.then(source => ({ dispose() {}, ...source })) },
    },
    "../core/mediaCache": {
      getAutoCacheEnabled: () => cache.enabled,
      isOfflineVideoCached: vid => cache.saved.has(vid),
      /** Hold complete video downloads independently of current-page streaming. */
      preloadOfflineVideo(vid, options) {
        if (cache.saved.has(vid)) return Promise.resolve(true)
        const task = deferred()
        cache.requests.push({ ...task, vid, options })
        return task.promise.then(success => { if (success) cache.saved.add(vid); return success })
      },
    },
    "../core/history": { savePlayHistoryItem: record => history.push(record) },
    "../core/sleepTimer": sleep,
    "../core/playbackState": { isPipPlaybackActive: () => pip, releaseRetainedPlayer: () => { pip = false } },
    "./Common": { PAGE_FRAME: {}, THEME_COLOR: "#fa7705" },
  }, {
    ...globals,
    AVPlayer: function () { return player },
    SharedAudioSession: { setCategory: async () => {}, setActive: async () => {} },
    createElement: (type, attributes, ...children) => ({ type, props: attributes ?? {}, children: children.flat(Infinity) }),
    Fragment: "Fragment",
  })
  /** Apply hook effects with cleanup before setup to mirror component commits. */
  function render() {
    hook = 0; dirty = false; tree = VideoFeedView(props)
    const pending = effects.filter(effect => effect.pending)
    for (const effect of pending) effect.cleanup?.()
    for (const effect of pending) { effect.pending = false; effect.cleanup = effect.setup() }
  }
  /** Settle microtasks and state updates without delivering delayed playback timers. */
  async function flush() {
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setImmediate(resolve))
      if (dirty) render()
    }
  }
  /** Read real view handlers including geometry-dependent paging content. */
  function nodes(node = tree) {
    if (!node || typeof node !== "object") return []
    const children = node.type === "GeometryReader"
      ? [node.children[0]({ size: { width: 390, height: 700 } })] : node.children
    return [node, ...children.flatMap(child => nodes(child))]
  }
  render()
  return { player, pages, sources, sleep, history, cache, flush, nodes,
    update: next => { props = { ...props, ...next }; render() },
    /** Deliver the native visible-target set rather than forcing a position binding. */
    visible(ids) { nodes().find(node => node.type === "ScrollView").props.onScrollTargetVisibilityChange.onChanged(ids); render() },
    /** Settle a swipe on a single fully visible recommendation. */
    select(number) { this.visible([item(number).detail.series_id]) },
    scene: phase => { for (const listener of listeners) listener(phase) },
    advance: ms => { now += ms; for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn() } },
    setPip: value => { pip = value },
    /** Resolve a page using sequential synthetic recommendation IDs. */
    replyPage(index, numbers, offset = 6, hasMore = true) {
      pages[index].resolve({ items: numbers.map(item), cursor: { offset, sessionId: "synthetic-session" }, hasMore })
    },
    unmount: () => { for (const effect of effects) effect?.cleanup?.() },
  }
}

test("finishing the feed episode opens the next episode once and disables looping", async () => {
  const h = mountFeed(), opened = []
  h.update({ onPlaySeries: (...args) => opened.push(args) })
  h.replyPage(0, [1], 1, false); await h.flush()
  h.sources[0].resolve({ url: "synthetic-first" }); await h.flush()
  h.player.onReadyToPlay()
  assert.equal(h.player.numberOfLoops, 0)
  h.player.onEnded()
  h.player.onEnded()
  h.player.onReadyToPlay()
  assert.deepEqual(opened, [[item(1).detail.series_id, item(1).detail.vid_list[1]]])
  assert.equal(h.player.rate, 0)
  h.unmount()
  assert.equal(h.player.onEnded, undefined)
})

test("paused, background, departed, sleeping and stale feed callbacks never navigate", async () => {
  for (const reason of ["paused", "background", "departed", "sleeping", "swiped", "unmounted"]) {
    const h = mountFeed(), opened = []
    h.update({ onPlaySeries: (...args) => opened.push(args) })
    h.replyPage(0, [1, 2], 2, false); await h.flush()
    h.sources[0].resolve({ url: "synthetic-first" }); await h.flush()
    h.player.onReadyToPlay()
    await h.flush()
    const ended = h.player.onEnded
    if (reason === "paused") h.nodes().find(node => node.props.title === "暂停").props.action()
    if (reason === "background") h.scene("background")
    if (reason === "departed") h.update({ active: false })
    if (reason === "sleeping") { h.sleep.setSleepTimer(1); h.advance(60000) }
    if (reason === "swiped") h.select(2)
    if (reason === "unmounted") h.unmount()
    ended()
    assert.deepEqual(opened, [], reason)
    if (reason !== "unmounted") h.unmount()
  }
})

test("a final or unknown feed episode finishes without inventing a next episode", async () => {
  for (const known of [true, false]) {
    const h = mountFeed(), opened = [], recommendation = item(1)
    recommendation.vid = known ? recommendation.detail.vid_list[1] : "unknown-synthetic-vid"
    h.update({ onPlaySeries: (...args) => opened.push(args) })
    h.pages[0].resolve({ items: [recommendation], cursor: { offset: 1, sessionId: "synthetic-session" }, hasMore: false })
    await h.flush()
    h.sources[0].resolve({ url: "synthetic-last" }); await h.flush()
    h.player.onReadyToPlay()
    h.player.onEnded()
    assert.deepEqual(opened, [])
    assert.equal(h.player.rate, 0)
    h.unmount()
  }
})

test("a recommendation page caches every returned playback episode without waiting for swipes", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  for (let index = 0; index < 6; index++) {
    assert.equal(h.cache.requests.length, index + 1, "only one whole-video download runs at a time")
    const request = h.cache.requests[index], recommendation = item(index + 1)
    assert.equal(request.vid, recommendation.vid)
    assert.equal(request.options.label, `${recommendation.detail.series_name} 第 1 集`)
    assert.equal(request.options.cover, recommendation.detail.series_cover)
    assert.equal(request.options.seriesId, recommendation.detail.series_id)
    assert.equal(request.options.seriesTitle, recommendation.detail.series_name)
    request.resolve(true); await h.flush()
  }
  assert.equal(h.cache.saved.size, 6)
  assert.equal(h.sources.length, 1, "background caching does not bind or prepare offscreen players")
  assert.equal(h.player.bound.length, 0)
  h.select(2); await h.flush()
  assert.equal(h.cache.saved.has(h.sources[1].vid), true)
  assert.equal(h.cache.requests.length, 6, "a swipe must not redownload the page")
  h.unmount()
})

test("a new page joins the existing cache queue and duplicate or evicted episodes are not downloaded again", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.select(4); await h.flush()
  h.replyPage(1, [5, 6, 7, 8, 9, 10], 12); await h.flush()
  assert.equal(h.cache.requests.length, 1, "pagination must await the in-flight download")
  for (let index = 0; index < 10; index++) {
    assert.equal(h.cache.requests.length, index + 1)
    assert.equal(h.cache.requests[index].vid, item(index + 1).vid)
    h.cache.requests[index].resolve(true); await h.flush()
  }
  h.cache.saved.clear() // Simulate capacity eviction, which must not create an endless refill loop.
  h.select(8); await h.flush()
  h.replyPage(2, [11, 12, 13, 14, 15, 16], 18); await h.flush()
  assert.equal(h.cache.requests.length, 11)
  assert.equal(h.cache.requests[10].vid, item(11).vid)
  h.unmount()
})

test("cache capacity protection follows the current video while a background download is pending", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  const protection = h.cache.requests[0].options.protectedVideoIds
  assert.deepEqual(Array.from(protection), [item(1).vid])
  h.select(2); await h.flush()
  assert.deepEqual(Array.from(protection), [item(2).vid])
  h.cache.requests[0].resolve(true); await h.flush()
  assert.equal(h.cache.requests[1].options.protectedVideoIds, protection)
  h.unmount()
})

test("disabled caching starts no downloads and disabling it mid-page stops the remaining queue", async () => {
  const disabled = mountFeed({ autoCache: false })
  disabled.replyPage(0, [1, 2, 3, 4, 5, 6]); await disabled.flush()
  assert.equal(disabled.cache.requests.length, 0)
  disabled.unmount()
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.cache.enabled = false
  h.cache.requests[0].resolve(true); await h.flush()
  assert.equal(h.cache.requests.length, 1)
  h.update({ active: false }); h.cache.enabled = true; h.update({ active: true }); await h.flush()
  assert.equal(h.cache.requests.length, 2)
  assert.equal(h.cache.requests[1].vid, item(2).vid)
  h.unmount()
})

test("leaving or backgrounding stops queued downloads, and a quick return still runs one download at a time", async () => {
  for (const departure of ["tab", "background", "unmount"]) {
    const h = mountFeed()
    h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
    if (departure === "tab") h.update({ active: false })
    else if (departure === "background") { h.scene("background"); await h.flush() }
    else h.unmount()
    h.cache.requests[0].resolve(true); await h.flush()
    assert.equal(h.cache.requests.length, 1)
    if (departure !== "unmount") h.unmount()
  }
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.update({ active: false }); h.update({ active: true }); await h.flush()
  assert.equal(h.cache.requests.length, 1)
  h.cache.requests[0].resolve(true); await h.flush()
  assert.equal(h.cache.requests.length, 2)
  assert.equal(h.cache.requests[1].vid, item(2).vid)
  h.unmount()
})

test("one failed cache download does not block the other recommendations or loop on that failure", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  for (let index = 0; index < 6; index++) {
    h.cache.requests[index].resolve(index !== 1); await h.flush()
  }
  assert.equal(h.cache.saved.size, 5)
  assert.equal(h.cache.requests.length, 6)
  h.update({ active: false }); h.update({ active: true }); await h.flush()
  assert.equal(h.cache.requests.length, 6)
  h.unmount()
})

test("native visibility drives consecutive autoplay and reverse swipes without a position callback", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  const scroll = h.nodes().find(node => node.type === "ScrollView")
  assert.equal(scroll.props.onScrollTargetVisibilityChange.idType, "string")
  assert.equal(scroll.props.onScrollTargetVisibilityChange.threshold, 0.6)
  let released = 0
  for (const [index, number] of [1, 2, 3, 2].entries()) {
    if (index) { h.select(number); await h.flush() }
    assert.equal(released, 0, "ready sources stay alive across swipes")
    if (index < 3) {
      assert.equal(h.sources[index].vid, item(number).vid)
      h.sources[index].resolve({ url: `synthetic-${index}`, dispose() { released++ } }); await h.flush()
    } else {
      assert.equal(h.sources.length, 3, "reverse swipe reuses the prepared second video")
      assert.equal(h.player.bound.at(-1), "synthetic-1")
    }
    h.player.onReadyToPlay(); await h.flush()
    assert.equal(h.player.rate, 1)
    assert.equal(h.history[index].seriesId, item(number).detail.series_id)
    const views = h.nodes().filter(node => node.type === "AVPlayerView")
    assert.equal(views.length, 1)
    assert.equal(views[0].props.player, h.player)
    for (const source of h.sources) assert.equal(source.signal.aborted, false)
  }
  assert.equal(h.player.plays, 4)
  h.unmount()
  assert.equal(released, 3)
  for (const source of h.sources) assert.equal(source.signal.aborted, true)
})

test("returning to an incompletely downloaded video reuses its source without fetching playback information", async () => {
  const h = mountFeed({ autoCache: false })
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.sources[0].resolve({ url: "synthetic-first" }); await h.flush()
  h.player.onReadyToPlay()
  h.select(2); await h.flush()
  h.sources[1].resolve({ url: "synthetic-second" }); await h.flush()
  h.player.onReadyToPlay()
  h.select(1); await h.flush()
  assert.equal(h.sources.length, 2)
  assert.deepEqual(h.player.bound, ["synthetic-first", "synthetic-second", "synthetic-first"])
  assert.ok(!h.nodes().some(node => node.children.includes("正在获取播放信息")))
  h.player.onReadyToPlay()
  assert.equal(h.player.rate, 1)
  h.unmount()
})

test("a completed offline file replaces the retained network source and never shows a network-fetch label", async () => {
  const h = mountFeed({ autoCache: false })
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  let released = 0
  h.sources[0].resolve({ url: "synthetic-stream", dispose() { released++ } }); await h.flush()
  h.select(2); await h.flush()
  h.cache.saved.add(item(1).vid)
  h.select(1); await h.flush()
  assert.equal(released, 1)
  assert.equal(h.sources[0].signal.aborted, true)
  assert.equal(h.sources[2].vid, item(1).vid)
  assert.ok(!h.nodes().some(node => node.children.includes("正在获取播放信息")))
  h.sources[2].resolve({ url: "/synthetic/cached-first.mp4" }); await h.flush()
  assert.equal(h.player.bound.at(-1), "/synthetic/cached-first.mp4")
  h.select(2); await h.flush()
  h.select(1); await h.flush()
  assert.equal(h.sources.length, 4, "the ready local source is reused after another swipe")
  assert.equal(h.player.bound.at(-1), "/synthetic/cached-first.mp4")
  h.cache.saved.delete(item(1).vid)
  h.select(2); await h.flush()
  h.select(1); await h.flush()
  assert.equal(h.sources.at(-1).vid, item(1).vid)
  assert.equal(h.sources.length, 6, "a deleted local file must be prepared again")
  assert.ok(h.nodes().some(node => node.children.includes("正在获取播放信息")))
  h.unmount()
})

test("recent sources are bounded, revisit updates retention order and departure releases all remaining sources", async () => {
  const h = mountFeed({ autoCache: false })
  h.replyPage(0, [1, 2, 3, 4, 5, 6, 7, 8], 8, false); await h.flush()
  const released = []
  for (let number = 1; number <= 6; number++) {
    if (number > 1) { h.select(number); await h.flush() }
    h.sources[number - 1].resolve({ url: `synthetic-${number}`, dispose() { released.push(number) } }); await h.flush()
  }
  h.select(1); await h.flush() // Keep the first entry recent so the second becomes the eviction victim.
  h.select(7); await h.flush()
  h.sources[6].resolve({ url: "synthetic-7", dispose() { released.push(7) } }); await h.flush()
  assert.deepEqual(released, [2])
  assert.equal(h.sources[1].signal.aborted, true)
  assert.equal(h.sources[0].signal.aborted, false)
  h.select(1); await h.flush()
  assert.equal(h.sources.length, 7)
  h.update({ active: false })
  assert.deepEqual([...released].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7])
  for (const source of h.sources) assert.equal(source.signal.aborted, true)
  h.unmount()
  assert.equal(released.length, 7, "sources must not be disposed twice on unmount")
})

test("a failed retained source is invalidated for retry without discarding other ready videos", async () => {
  const h = mountFeed({ autoCache: false })
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  let released = 0
  h.sources[0].resolve({ url: "synthetic-first", dispose() { released++ } }); await h.flush()
  h.select(2); await h.flush()
  h.sources[1].resolve({ url: "synthetic-second" }); await h.flush()
  h.select(1); await h.flush()
  h.player.onError("synthetic expired media"); await h.flush()
  assert.equal(released, 1)
  h.nodes().find(node => node.props.title === "重试播放").props.action(); await h.flush()
  assert.equal(h.sources.length, 3)
  assert.equal(h.sources[2].vid, item(1).vid)
  h.sources[2].resolve({ url: "synthetic-renewed" }); await h.flush()
  h.select(2); await h.flush()
  assert.equal(h.sources.length, 3)
  assert.equal(h.player.bound.at(-1), "synthetic-second")
  h.unmount()
})

test("empty, ambiguous and unknown visible targets do not restart or select another video", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  for (const ids of [[], [item(1).detail.series_id, item(2).detail.series_id], ["missing"], [2], [item(1).detail.series_id]]) {
    h.visible(ids); await h.flush()
    assert.equal(h.sources.length, 1)
    assert.equal(h.sources[0].signal.aborted, false)
  }
  h.select(2); await h.flush()
  h.visible([item(2).detail.series_id]); await h.flush()
  assert.equal(h.sources.length, 2)
  h.unmount()
})

test("an old native item error during next-source preparation cannot disable the next autoplay", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.sources[0].resolve({ url: "synthetic-first" }); await h.flush()
  h.player.onReadyToPlay()
  const lateReady = h.player.onReadyToPlay, lateError = h.player.onError
  h.select(2); await h.flush()
  lateReady(); lateError("synthetic disposed source")
  h.player.onError("synthetic old connection closed"); await h.flush()
  assert.ok(!h.nodes().some(node => node.props.title === "重试播放"))
  h.sources[1].resolve({ url: "synthetic-second" }); await h.flush()
  h.player.onReadyToPlay(); await h.flush()
  assert.equal(h.player.rate, 1)
  assert.equal(h.history.length, 2)
  h.player.onError("synthetic current source failure"); await h.flush()
  assert.equal(h.player.rate, 0)
  assert.ok(h.nodes().some(node => node.props.title === "重试播放"))
  h.unmount()
})

test("rapid swipes cancel old loads without waiting and never bind late media to the wrong card", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  assert.equal(h.sources.length, 1)
  h.select(2); await h.flush()
  h.select(3); await h.flush()
  assert.equal(h.sources.length, 3)
  assert.equal(h.sources[0].signal.aborted, true)
  assert.equal(h.sources[1].signal.aborted, true)
  let disposed = 0
  h.sources[0].resolve({ url: "synthetic-old", dispose() { disposed++ } }); await h.flush()
  h.sources[1].resolve({ url: "synthetic-skipped", dispose() { disposed++ } }); await h.flush()
  assert.equal(disposed, 2)
  assert.equal(h.sources[2].vid, item(3).vid)
  assert.equal(h.player.bound.length, 0)
  h.sources[2].resolve({ url: "synthetic-current" }); await h.flush()
  assert.deepEqual(h.player.bound, ["synthetic-current"])
  h.player.onReadyToPlay()
  assert.equal(h.player.plays, 1)
  assert.equal(h.history[0].seriesId, item(3).detail.series_id)
  h.unmount()
})

test("the paging viewport is framed and clipped before the tab bar safe area", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  const scroll = h.nodes().find(node => node.type === "ScrollView")
  assert.deepEqual({ ...scroll.props.frame }, { width: 390, height: 700 })
  assert.equal(scroll.props.clipped, true)
  assert.equal(scroll.props.scrollClipDisabled, false)
  h.unmount()
})

test("a bound streaming source is disposed when navigating away and cannot resume late", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  let releases = 0
  h.sources[0].resolve({ url: "synthetic-local-stream", dispose() { releases++ } }); await h.flush()
  const lateReady = h.player.onReadyToPlay
  h.update({ active: false })
  assert.equal(releases, 1)
  assert.equal(h.sources[0].signal.aborted, true)
  lateReady(); h.advance(1000)
  assert.equal(h.player.plays, 0)
  h.unmount()
})

test("pagination deduplicates series and retries failures with the unconsumed cursor", async () => {
  const h = mountFeed()
  assert.equal(h.pages.length, 1)
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.select(4); await h.flush()
  assert.equal(h.pages.length, 2)
  h.pages[1].reject(new Error("synthetic failure")); await h.flush()
  assert.equal(h.pages.length, 2)
  const retry = h.nodes().find(node => node.type === "Button" && node.props.title === "重试加载")
  retry.props.action(); retry.props.action(); await h.flush()
  assert.equal(h.pages.length, 3)
  assert.equal(h.pages[2].cursor.offset, 6)
  h.replyPage(2, [5, 6, 7, 8, 9, 10], 12); await h.flush()
  assert.equal(h.nodes().filter(node => node.type === "ZStack" && node.props.key).length, 10)
  h.unmount()
})

test("a duplicate-only page waits for explicit retry instead of looping automatically", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.select(6); await h.flush()
  h.replyPage(1, [1, 2, 3, 4, 5, 6], 12); await h.flush()
  assert.equal(h.pages.length, 2)
  assert.ok(h.nodes().some(node => node.props.title === "重试加载"))
  h.unmount()
})

test("an empty exhausted feed can start a new recommendation session explicitly", async () => {
  const h = mountFeed()
  h.replyPage(0, [], 0, false); await h.flush()
  assert.equal(h.pages.length, 1)
  h.nodes().find(node => node.props.title === "重新加载").props.action()
  await h.flush()
  assert.equal(h.pages.length, 2)
  assert.equal(h.pages[1].cursor.offset, 0)
  assert.equal(h.pages[1].cursor.sessionId, "")
  h.unmount()
})

test("tab and navigation departure invalidate downloads and late ready callbacks", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  const lateReady = h.player.onReadyToPlay
  h.update({ active: false })
  h.sources[0].resolve({ url: "synthetic-late" }); await h.flush()
  lateReady(); h.advance(1000)
  assert.equal(h.player.bound.length, 0)
  assert.equal(h.player.plays, 0)
  h.unmount()
  assert.equal(h.player.disposed, 1)
})

test("foreground loss pauses immediately and does not auto-play a late readiness callback", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.sources[0].resolve({ url: "synthetic-source" }); await h.flush()
  const lateReady = h.player.onReadyToPlay
  lateReady()
  assert.equal(h.player.rate, 1)
  h.scene("background")
  assert.equal(h.player.rate, 0)
  lateReady()
  assert.equal(h.player.plays, 1)
  await h.flush(); h.unmount()
})

test("a rejected native source cannot replay the previous source through a late ready callback", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.player.acceptSource = false
  h.sources[0].resolve({ url: "synthetic-rejected" }); await h.flush()
  h.player.onReadyToPlay(); h.advance(1000)
  assert.equal(h.player.plays, 0)
  assert.ok(h.nodes().some(node => node.props.title === "重试播放"))
  h.unmount()
})

test("sleep expiry blocks ready and fallback autoplay, while explicit play resumes once and saves history", async () => {
  const h = mountFeed()
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  h.sources[0].resolve({ url: "synthetic-source" }); await h.flush()
  h.sleep.setSleepTimer(1); h.advance(60001)
  h.player.onReadyToPlay()
  assert.equal(h.player.plays, 0)
  const play = h.nodes().find(node => node.type === "Button" && node.props.title === "播放")
  play.props.action()
  assert.equal(h.player.plays, 1)
  assert.equal(h.history.length, 1)
  h.player.onReadyToPlay()
  assert.equal(h.history.length, 1)
  await h.flush()
  h.nodes().find(node => node.props.title === "暂停").props.action()
  const plays = h.player.plays
  h.player.onReadyToPlay()
  assert.equal(h.player.plays, plays)
  h.unmount()
})

test("existing PiP owns playback until the user explicitly takes over", async () => {
  const h = mountFeed()
  h.setPip(true)
  h.replyPage(0, [1, 2, 3, 4, 5, 6]); await h.flush()
  assert.equal(h.sources.length, 0)
  h.nodes().find(node => node.props.title === "结束画中画并播放推荐").props.action()
  await h.flush()
  assert.equal(h.sources.length, 1)
  h.unmount()
})
