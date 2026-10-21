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
  let plays = 0
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
      play() { plays++; return true }
      /** 模拟错误处理中的暂停。 */
      pause() {}
      /** 记录页面清理是否释放播放器。 */
      dispose() { disposed++ }
    },
  })
  return {
    sources,
    /** 读取页面根布局以验证全屏导航栏状态。 */
    root: () => tree,
    /** 查找全屏操作，模拟用户点击同一按钮进入和退出全屏。 */
    fullscreenButton: () => tree.children.find(node => node?.type === 'HStack' && node.children.some(child => child?.type === 'Button'))?.children.find(node => node?.type === 'Button'),
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
        if (container ? node.type === 'VStack' && node.props?.onAppear : node.type === 'VideoPlayer') return node
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
    /** 读取固定状态行，检查启动提示不会盖在视频上。 */
    statusRow() { return tree.children.find(node => node?.type === 'HStack' && node.props?.frame?.height === 32) },
    /** 模拟系统媒体就绪通知。 */
    ready() { events.onReady() },
    /** 模拟系统播放状态事件。 */
    status(value) { events.onStatus(value) },
    /** 读取启动播放调用次数。 */
    plays() { return plays },
    /** 检查错误后不会残留覆盖真实错误的启动超时任务。 */
    pendingTimeouts() { return [...timers.values()].filter(task => task.delay === 15000).length },
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
test('VideoPlayer 在装载媒体前挂载，错误后保持同一播放器', async () => {
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


/** 就绪事件须先撤销启动提示，后续任务才能调用 play，且原生节点保持同一对象。 */
test('媒体就绪先提交界面再播放，进度不会覆盖 VideoPlayer', async () => {
  const run = playerRuntime()
  await run.flush()
  const surface = run.view()
  const container = run.view(true)
  assert.equal(container.children.length, 1, '原生视频容器内不能放置遮罩或进度视图')
  assert.equal(container.props.frame.height, 220)
  container.props.onAppear()
  run.tick()
  await run.flush()
  assert.equal(run.statusRow().children[0].props.hidden, false)
  assert.equal(run.statusRow().children[1].children[0], '正在启动系统播放器')
  assert.equal(run.pendingTimeouts(), 1)
  run.ready()
  assert.equal(run.plays(), 0, '就绪回调中不能同步启动播放')
  await run.flush()
  assert.equal(run.statusRow().children[0].props.hidden, true)
  assert.equal(run.statusRow().children[1].children[0], '')
  assert.equal(run.pendingTimeouts(), 0)
  assert.equal(run.plays(), 0, '启动必须放在提交后的下一轮任务')
  assert.equal(run.view(), surface, '更新进度时不能重新创建原生视图节点')
  run.tick()
  await run.flush()
  assert.equal(run.plays(), 1)
  run.status(2)
  await run.flush()
  assert.equal(run.view(), surface)
  assert.equal(run.statusRow().children[0].props.hidden, true)
  run.dispose()
})

/** 页面关闭或媒体报错后，尚未执行的自动播放必须取消。 */
test('就绪后的待播放任务在退出或出错时取消', async () => {
  for (const action of ['dispose', 'error']) {
    const run = playerRuntime()
    await run.flush()
    run.view(true).props.onAppear()
    run.tick()
    await run.flush()
    run.ready()
    await run.flush()
    run[action]()
    if (action === 'error') await run.flush()
    run.tick()
    await run.flush()
    assert.equal(run.plays(), 0)
    assert.equal(run.pendingTimeouts(), 0)
    assert.equal(run.staleUpdates(), 0)
    if (action !== 'dispose') run.dispose()
  }
})

/** 错误回调到达后应停止等待计时，避免稍后被通用超时提示替换。 */
test('系统播放错误取消等待超时，保持原生视频节点', async () => {
  const run = playerRuntime()
  await run.flush()
  const surface = run.view()
  run.view(true).props.onAppear()
  run.tick()
  await run.flush()
  assert.equal(run.pendingTimeouts(), 1)
  run.error()
  await run.flush()
  assert.equal(run.pendingTimeouts(), 0)
  assert.equal(run.statusRow().children[0].props.hidden, true)
  assert.equal(run.view(), surface)
  run.dispose()
})

/** 全屏在原容器内伸展，不重建播放器、不换源且可随时退出。 */
test('VideoPlayer 全屏和退出保持实例、媒体源与播放进度', async () => {
  const run = playerRuntime()
  await run.flush()
  const surface = run.view()
  assert.equal(Object.hasOwn(surface.props, 'pipStatus'), false)
  assert.equal(Object.hasOwn(surface.props, 'renderingMode'), false)
  run.view(true).props.onAppear()
  run.tick()
  await run.flush()
  run.ready()
  await run.flush()
  run.tick()
  await run.flush()
  assert.equal(run.fullscreenButton().props.disabled, false)
  run.fullscreenButton().props.action()
  await run.flush()
  assert.equal(run.root().props.navigationBarVisibility, 'hidden')
  assert.equal(run.root().props.tabBarVisibility, 'hidden')
  assert.equal(run.view(true).props.frame.maxHeight, 'infinity')
  assert.equal(run.view(), surface)
  assert.equal(run.sources.length, 1)
  assert.equal(run.created(), 1)
  assert.equal(run.fullscreenButton().props.title, '退出全屏')
  run.error()
  await run.flush()
  assert.equal(run.fullscreenButton().props.disabled, false, '全屏播放报错仍须允许退出')
  run.fullscreenButton().props.action()
  await run.flush()
  assert.equal(run.root().props.navigationBarVisibility, 'visible')
  assert.equal(run.root().props.tabBarVisibility, 'automatic')
  assert.equal(run.view(true).props.frame.height, 220)
  assert.equal(run.view(), surface)
  assert.equal(run.sources.length, 1)
  run.dispose()
  assert.equal(run.disposed(), 1)
})
