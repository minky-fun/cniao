const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { test } = require('node:test')

/** 执行真实组件的 hooks，记录卸载后的更新以及异步桥接任务。 */
function componentRuntime(moduleName, dependencies, globals, props) {
  const hooks = [], effects = [], timers = new Map()
  let cursor = 0, dirty = true, nextTimer = 0, tree, disposed = false, staleUpdates = 0
  const scripting = new Proxy({
    /** 按渲染位置保存状态并记录退出后的更新。 */
    useState(initial) {
      const index = cursor++
      if (!hooks[index]) hooks[index] = { value: initial }
      return [hooks[index].value, value => {
        if (disposed) staleUpdates++
        const previous = hooks[index].value
        hooks[index].value = typeof value === 'function' ? value(previous) : value
        if (!Object.is(previous, hooks[index].value)) dirty = true
      }]
    },
    /** 在重渲染之间保存同一个引用对象。 */
    useRef(value) {
      const index = cursor++
      if (!hooks[index]) hooks[index] = { current: value }
      return hooks[index]
    },
    /** 只在初次渲染时创建稳定的播放器控制器。 */
    useMemo(factory) {
      const index = cursor++
      if (!hooks[index]) hooks[index] = { value: factory() }
      return hooks[index].value
    },
    /** 使用最新回调模拟组件闭包。 */
    useCallback(callback) { cursor++; return callback },
    /** 仅在依赖发生变化时安排清理和重新执行。 */
    useEffect(effect, dependencies) {
      const index = cursor++, previous = hooks[index]
      if (previous && dependencies.every((item, i) => Object.is(item, previous.dependencies[i]))) return
      hooks[index] = { dependencies, cleanup: previous?.cleanup }
      effects.push(() => { hooks[index].cleanup?.(); hooks[index].cleanup = effect() })
    },
  }, { get: (target, key) => target[key] ?? key })
  const exports = {}
  vm.runInNewContext(fs.readFileSync(path.resolve('work/hongguo-build/views', moduleName + '.js'), 'utf8'), {
    exports, require: name => {
      if (name === 'scripting') return scripting
      assert.ok(Object.hasOwn(dependencies, name), `意外依赖 ${name}`)
      return dependencies[name]
    },
    console: { log() {}, error() {} },
    createElement: (type, props, ...children) => ({ type, props, children }),
    setTimeout: (callback, delay) => { const id = ++nextTimer; timers.set(id, { callback, delay }); return id },
    clearTimeout: id => timers.delete(id), ...globals,
  })
  return {
    /** 推进组件更新及真实 Promise，避免人为触发播放超时。 */
    async flush() {
      for (let round = 0; round < 30; round++) {
        if (dirty && !disposed) {
          dirty = false; cursor = 0
          tree = exports[moduleName](props)
          for (const effect of effects.splice(0)) effect()
        }
        await Promise.resolve()
      }
    },
    /** 按类型读取返回树中的实际节点。 */
    view(type) {
      /** 遍历组件树但不运行它的子组件。 */
      function find(node) {
        if (!node || typeof node !== 'object') return
        if (node.type === type) return node
        for (const child of node.children ?? []) { const found = find(child); if (found) return found }
      }
      return find(tree)
    },
    /** 在下一次更新使用新的子组件参数。 */
    update(next) { props = { ...props, ...next }; dirty = true },
    /** 执行下一轮零延迟任务，模拟原生回调已返回。 */
    tick() {
      for (const [id, task] of [...timers]) if (task.delay === 0) { timers.delete(id); task.callback() }
    },
    /** 调用全部卸载清理并记录迟到的状态提交。 */
    dispose() { for (const hook of hooks) hook?.cleanup?.(); disposed = true },
    staleUpdates: () => staleUpdates,
    tree: () => tree,
  }
}

/** 运行播放器业务页面，缓存请求可延迟返回以复现退出时的竞争。 */
function playerRuntime({ deferred = false } = {}) {
  let finishLoad, constructed = 0
  const switched = []
  const data = { vid: '123', seriesId: 'series', playerInfo: { main_url: '/cache/123.mp4' },
    seriesDetail: { series_id: 'series', series_name: '剧', vid_list: ['123', '456', '789'] } }
  return Object.assign(componentRuntime('PlayerView', {
    '../core/api': {}, '../core/mediaCache': {}, '../core/history': { savePlayHistoryItem() {} }, '../core/format': {},
    '../core/playbackSource': {
      /** 在需要时延迟真实缓存业务的返回。 */
      async loadOfflinePlayerData() {
        if (deferred) await new Promise(resolve => { finishLoad = resolve })
        return { data, meta: { duration: 80 } }
      },
      durationSeconds: Number,
      /** 记录自动连播请求并返回对应的缓存路径。 */
      async resolvePlaybackSource(_series, _detail, vid) { switched.push(vid); return { url: `/cache/${vid}.mp4` } },
      applyOfflineSource: (previous, vid, url) => ({ ...previous, vid, playerInfo: { main_url: url } }),
    },
    './Common': {}, './EpisodeGrid': {}, './XgPlayerView': { XgPlayerView: 'XgPlayerView' },
  }, {
    SharedAudioSession: { async setCategory() {}, async setActive() {} },
    WebViewController: class {
      /** 检查错误和全屏切换不会重复构造 WebView。 */
      constructor() { constructed++ }
      /** 模拟暂停或恢复的网页指令。 */
      async evaluateJavaScript() { return true }
    },
  }, { seriesId: 'series', initialVid: '123' }), { completeLoad: () => finishLoad(), created: () => constructed, switched })
}

/** 全屏、错误、切集都必须复用控制器；上一集迟到的结束通知不能再切集。 */
test('西瓜播放器全屏与连播保留同一控制器，忽略旧集数事件', async () => {
  const run = playerRuntime()
  await run.flush()
  const initial = run.view('XgPlayerView').props
  assert.equal(initial.source, '/cache/123.mp4')
  initial.onEvent({ type: 'fullscreen', videoId: '123', active: true })
  await run.flush()
  assert.equal(run.tree().props.navigationBarVisibility, 'hidden')
  assert.equal(run.view('ScrollView'), undefined)
  assert.equal(run.view('XgPlayerView').props.controller, initial.controller)
  initial.onEvent({ type: 'error', videoId: '123', message: '解码失败' })
  await run.flush()
  assert.equal(run.view('XgPlayerView').props.controller, initial.controller)
  initial.onEvent({ type: 'ended', videoId: '123' })
  await run.flush()
  assert.deepEqual(run.switched, ['456'])
  assert.equal(run.view('XgPlayerView').props.source, '/cache/456.mp4')
  run.view('XgPlayerView').props.onEvent({ type: 'ended', videoId: '123' })
  await run.flush()
  assert.deepEqual(run.switched, ['456'])
  run.view('XgPlayerView').props.onEvent({ type: 'fullscreen', videoId: '456', active: false })
  await run.flush()
  assert.ok(run.view('ScrollView'))
  assert.equal(run.created(), 1)
  run.dispose()
})

/** 退出后迟到的缓存和网页事件不能提交状态或启动下一集。 */
test('播放器退出后忽略迟到的缓存加载及网页事件', async () => {
  const run = playerRuntime({ deferred: true })
  await run.flush()
  const event = run.view('XgPlayerView').props.onEvent
  run.dispose()
  run.completeLoad()
  event({ type: 'playing', videoId: '123' })
  event({ type: 'ended', videoId: '123' })
  await run.flush()
  assert.equal(run.staleUpdates(), 0)
  assert.deepEqual(run.switched, [])
})

/** 运行网页组件，记录桥接初始化、源切换和释放。 */
function webRuntime({ deferred = false } = {}) {
  let receive, completePrepare, disposed = 0
  const commands = [], events = [], files = new Set(), pages = []
  const controller = {
    /** 保存从真实网页回传消息时使用的回调。 */
    async addScriptMessageHandler(name, callback) { assert.equal(name, 'hongguoPlayer'); receive = callback },
    /** 记录最小目录读取授权。 */
    async loadFile(page, directory) { pages.push([page, directory]); return true },
    /** 记录实际 JavaScript 装载指令。 */
    async evaluateJavaScript(code) { commands.push(code); return true },
    /** 记录宿主资源释放次数。 */
    dispose() { disposed++ },
  }
  const run = componentRuntime('XgPlayerView', {
    '../core/webPlayer': {
      /** 延迟资源准备，验证卸载期间初始化结束的情况。 */
      async prepareWebPlayerPage() {
        if (deferred) await new Promise(resolve => { completePrepare = resolve })
        files.add('/cache/player-1.html')
        return { path: '/cache/player-1.html', directory: '/cache' }
      },
      webPlayerSource: (_source, id) => id + '.mp4',
    },
  }, { FileManager: { existsSync: name => files.has(name), removeSync: name => files.delete(name) } },
  { controller, source: '/cache/123.mp4', videoId: '123', instanceId: 1, onEvent: event => events.push(event) })
  return Object.assign(run, { commands, events, files, pages, receive: event => receive(event),
    completePrepare: () => completePrepare(), disposed: () => disposed })
}

/** 页面就绪后才设置源，原生消息返回后才更新宿主；卸载取消排队事件。 */
test('网页桥接按顺序装载本地缓存，并在释放时取消事件', async () => {
  const run = webRuntime()
  await run.flush()
  assert.deepEqual(run.commands, [])
  assert.deepEqual(run.pages, [['/cache/player-1.html', '/cache']])
  run.receive({ type: 'bridgeReady' })
  await run.flush()
  assert.deepEqual(run.commands, [])
  run.tick()
  await run.flush()
  assert.match(run.commands[0], /return window.hongguoPlayer.load\(.*"url":"123.mp4"/)
  run.update({ videoId: '456', source: '/cache/456.mp4' })
  await run.flush()
  assert.match(run.commands[1], /"url":"456.mp4"/)
  run.receive({ type: 'playing', videoId: '456' })
  assert.deepEqual(run.events, [])
  run.tick()
  assert.equal(run.events[0].type, 'playing')
  run.receive({ type: 'ended', videoId: '456' })
  run.dispose()
  run.tick()
  await run.flush()
  assert.equal(run.events.length, 1)
  assert.equal(run.disposed(), 1)
  assert.equal(run.files.size, 0)
  assert.equal(run.staleUpdates(), 0)
})

/** 退出期间资源准备才结束，不能在已释放控制器上加载页面。 */
test('退出时尚未完成的网页准备不会复活 WebView', async () => {
  const run = webRuntime({ deferred: true })
  await run.flush()
  run.dispose()
  run.completePrepare()
  await run.flush()
  assert.deepEqual(run.pages, [])
  assert.equal(run.files.size, 0)
  assert.equal(run.staleUpdates(), 0)
})

/** 读取真实路径校验和资源准备代码，确保授权范围不扩大到其他用户文件。 */
test('播放器只接受当前集数缓存路径，部署资源保持版本一致', async () => {
  const files = new Map(), exports = {}, read = []
  vm.runInNewContext(fs.readFileSync('work/hongguo-build/core/webPlayer.js', 'utf8'), {
    exports, FileManager: { appGroupDocumentsDirectory: '/group', existsSync: name => files.has(name),
      async createDirectory() {}, async writeAsString(name, value) { files.set(name, value) },
      async readAsString(name) { read.push(name); return name } },
    require: name => name === 'scripting' ? { Script: { directory: '/script' } } : { PLAYBACK_CACHE_DIR: 'cache' },
  })
  assert.equal(exports.webPlayerSource('/group/cache/123.mp4', '123'), '123.mp4')
  for (const source of ['https://example.com/123.mp4', '/other/123.mp4', '/group/cache/../123.mp4']) {
    assert.throws(() => exports.webPlayerSource(source, '123'), /本地缓存/)
  }
  assert.throws(() => exports.webPlayerSource('/group/cache/../123.mp4', '../123'), /本地缓存/)
  const first = await exports.prepareWebPlayerPage(1)
  assert.equal(first.path, '/group/cache/player-1.html')
  assert.equal(first.directory, '/group/cache')
  const reads = read.length
  await exports.prepareWebPlayerPage(2)
  assert.equal(read.length - reads, 2, '重用固定版本厂商资源，只更新自有 JS 和 HTML')
  assert.ok(files.has('/group/cache/hongguo-player.js'))
})

/** 运行实际网页桥接脚本，验证事件来源、全屏保留和自动播放受阻通知。 */
test('网页切集保留 CSS 全屏，事件始终携带所属集数', () => {
  const instances = [], events = []
  const window = { webkit: { messageHandlers: { hongguoPlayer: { postMessage: event => { events.push(event); return Promise.resolve(true) } } } } }
  class Player {
    /** 保存创建参数和每个播放器的独立事件监听。 */
    constructor(options) { this.options = options; this.events = {}; instances.push(this) }
    /** 绑定播放器事件。 */
    on(name, listener) { this.events[name] = listener }
    /** 记录切集释放。 */
    destroy() { this.destroyed = true }
    /** 模拟 CSS 全屏变更事件。 */
    getCssFullscreen() { this.cssfullscreen = true; this.events.cssFullscreen_change(true) }
    /** 模拟退出全屏。 */
    exitCssFullscreen() { this.cssfullscreen = false; this.events.cssFullscreen_change(false) }
  }
  vm.runInNewContext(fs.readFileSync('scripts/红果/web/player.js', 'utf8'), { window, Player, console })
  const bridge = window.hongguoPlayer
  assert.equal(events[0].type, 'bridgeReady')
  assert.throws(() => bridge.load({ videoId: '123', url: 'https://example.com' }), /不合法/)
  bridge.load({ videoId: '123', url: '123.mp4' })
  assert.equal(instances[0].options.fullscreen.useCssFullscreen, true)
  assert.equal(instances[0].options.pip, false)
  instances[0].getCssFullscreen()
  bridge.load({ videoId: '456', url: '456.mp4' })
  assert.equal(instances[0].destroyed, true)
  assert.equal(instances[1].cssfullscreen, true)
  instances[0].events.ended()
  instances[1].events.autoplay_was_prevented()
  assert.equal(events.at(-2).videoId, '123')
  assert.equal(events.at(-1).videoId, '456')
  assert.equal(events.at(-1).type, 'autoplayBlocked')
  bridge.exitFullscreen()
  assert.equal(events.at(-1).active, false)
})
