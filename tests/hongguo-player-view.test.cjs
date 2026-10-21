const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { test } = require('node:test')

/** 运行真实 PlayerView，替换 Scripting 宿主并记录渲染、定时任务和播放器调用。 */
function playerRuntime({ deferred = false } = {}) {
  const hooks = []
  const pendingEffects = []
  const timers = new Map()
  let cursor = 0
  let dirty = true
  let nextTimer = 0
  let tree
  let events
  let constructed = 0
  let disposed = 0
  let hostDisposed = false
  let updatesAfterDispose = 0
  let finishLoad
  const sources = []
  const scripting = new Proxy({
    useState: initial => {
      const index = cursor++
      if (!hooks[index]) hooks[index] = { value: initial }
      return [hooks[index].value, value => {
        if (hostDisposed) updatesAfterDispose++
        const previous = hooks[index].value
        hooks[index].value = typeof value === 'function' ? value(previous) : value
        if (!Object.is(previous, hooks[index].value)) dirty = true
      }]
    },
    useRef: value => {
      const index = cursor++
      if (!hooks[index]) hooks[index] = { current: value }
      return hooks[index]
    },
    useMemo: factory => {
      const index = cursor++
      if (!hooks[index]) hooks[index] = { value: factory() }
      return hooks[index].value
    },
    useObservable: initial => scripting.useMemo(() => ({ value: initial })),
    useCallback: callback => { cursor++; return callback },
    useEffect: (effect, dependencies) => {
      const index = cursor++
      const previous = hooks[index]
      if (previous && dependencies.every((item, i) => Object.is(item, previous.dependencies[i]))) return
      hooks[index] = { dependencies, cleanup: previous?.cleanup }
      pendingEffects.push(() => {
        hooks[index].cleanup?.()
        hooks[index].cleanup = effect()
      })
    },
  }, { get: (target, key) => target[key] ?? key })
  const data = {
    vid: 'vid', seriesId: 'series', playerInfo: { main_url: '/cache/vid.mp4' },
    seriesDetail: { series_id: 'series', series_name: '剧', vid_list: ['vid'] },
  }
  const dependencies = {
    scripting,
    '../core/api': {},
    '../core/mediaCache': {},
    '../core/history': { savePlayHistoryItem: () => {} },
    '../core/format': {},
    '../core/playbackSource': {
      loadOfflinePlayerData: async () => {
        if (deferred) await new Promise(resolve => { finishLoad = resolve })
        return { data, meta: { duration: 80 } }
      },
      durationSeconds: Number,
    },
    '../core/playerEvents': { bindPlayerEvents: (_player, handlers) => {
      events = handlers
      return () => { events = undefined }
    } },
    '../core/playbackState': { setPipPlaybackActive: () => {}, retainPipPlayer: () => {} },
    './Common': {},
    './EpisodeGrid': {},
  }
  const exports = {}
  vm.runInNewContext(fs.readFileSync(path.resolve('work/hongguo-build/views/PlayerView.js'), 'utf8'), {
    exports, require: name => {
      assert.ok(Object.hasOwn(dependencies, name), `意外依赖 ${name}`)
      return dependencies[name]
    },
    console: { log: () => {}, error: () => {} },
    createElement: (type, props, ...children) => ({ type, props, children }),
    setTimeout: (callback, delay) => {
      const id = ++nextTimer
      timers.set(id, { callback, delay })
      return id
    },
    clearTimeout: id => timers.delete(id),
    SharedAudioSession: { setCategory: async () => {}, setActive: async () => {} },
    TimeControlStatus: { playing: 2 },
    AVPlayer: class {
      /** 记录原生播放器创建次数。 */
      constructor() { constructed++ }
      /** 记录装载媒体源的时机。 */
      setSource(source) { sources.push(source); return true }
      /** 模拟播放请求被原生端接受。 */
      play() { return true }
      /** 模拟错误处理中的暂停。 */
      pause() {}
      /** 记录页面清理是否释放播放器。 */
      dispose() { disposed++ }
    },
  })
  return {
    sources,
    completeLoad: () => finishLoad(),
    staleUpdates: () => updatesAfterDispose,
    /** 推进 Promise 和组件更新，执行实际依赖变化触发的 effects。 */
    async flush() {
      for (let round = 0; round < 20; round++) {
        if (dirty) {
          dirty = false; cursor = 0
          tree = exports.PlayerView({ seriesId: 'series', initialVid: 'vid' })
          for (const effect of pendingEffects.splice(0)) effect()
        }
        await Promise.resolve()
      }
    },
    /** 在实际返回树中查找原生播放器或挂载它的布局容器。 */
    view(container = false) {
      /** 遍历节点而不执行额外的子组件。 */
      function find(node) {
        if (!node || typeof node !== 'object') return
        if (container ? node.type === 'ZStack' && node.props?.onAppear : node.type === 'AVPlayerView') return node
        for (const child of node.children ?? []) {
          const found = find(child)
          if (found) return found
        }
      }
      return find(tree)
    },
    /** 仅执行下一轮零延迟任务，避免人为触发媒体超时。 */
    tick() {
      for (const [id, task] of [...timers]) {
        if (task.delay !== 0) continue
        timers.delete(id)
        task.callback()
      }
    },
    /** 模拟原生错误通知到达事件处理层。 */
    error() { events.onError('测试媒体错误') },
    /** 执行组件清理，检测播放器释放次数。 */
    dispose() {
      for (const hook of hooks) hook?.cleanup?.()
      hostDisposed = true
    },
    created: () => constructed,
    disposed: () => disposed,
  }
}

/** 原生视图先出现、回调返回后才设置媒体，播放错误不会卸载或重建它。 */
test('AVPlayerView 在装载媒体前挂载，错误后保持同一播放器', async () => {
  const run = playerRuntime()
  await run.flush()
  const initial = run.view()
  assert.ok(initial, '媒体未设置时必须已经渲染原生视图')
  assert.deepEqual(run.sources, [])
  run.view(true).props.onAppear()
  assert.deepEqual(run.sources, [], '出现回调内部禁止同步设置媒体')
  run.tick()
  await run.flush()
  assert.deepEqual(run.sources, ['/cache/vid.mp4'])
  assert.equal(run.view().props.player, initial.props.player)
  run.error()
  await run.flush()
  assert.equal(run.view().props.player, initial.props.player, '错误不能拆除原生播放视图')
  assert.equal(run.created(), 1)
  assert.equal(run.sources.length, 1)
  run.dispose()
  assert.equal(run.disposed(), 1)
})


/** 退出页面后即使缓存准备才返回，也不能更新组件或重新设置播放源。 */
test('播放器退出后忽略迟到的缓存加载结果', async () => {
  const run = playerRuntime({ deferred: true })
  await run.flush()
  run.view(true).props.onAppear()
  run.tick()
  await run.flush()
  run.dispose()
  run.completeLoad()
  await run.flush()
  assert.deepEqual(run.sources, [])
  assert.equal(run.staleUpdates(), 0)
  assert.equal(run.disposed(), 1)
})

/** 页面在容器出现回调排队后立即关闭时，应取消装载任务。 */
test('播放器退出时取消容器回调中的待执行任务', async () => {
  const run = playerRuntime()
  await run.flush()
  run.view(true).props.onAppear()
  run.dispose()
  run.tick()
  await run.flush()
  assert.deepEqual(run.sources, [])
  assert.equal(run.staleUpdates(), 0)
})
