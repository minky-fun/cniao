const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { test } = require('node:test')

/** 使用标准 MP4 box 结构生成不含真实视频数据的回归样本。 */
function box(type, ...parts) {
  const body = Buffer.concat(parts)
  const header = Buffer.alloc(8)
  header.writeUInt32BE(body.length + 8)
  header.write(type, 4)
  return Buffer.concat([header, body])
}

/** 将整数写入测试样本的 big-endian 表格。 */
function words(...values) {
  const bytes = Buffer.alloc(values.length * 4)
  values.forEach((value, index) => bytes.writeUInt32BE(value, index * 4))
  return bytes
}

/** 加载真实编译模块，只替换宿主对象和必要的外部依赖。 */
function loadModule(name, globals, overrides = {}, modules = new Map()) {
  const file = path.resolve('work/hongguo-build/core', name + '.js')
  if (modules.has(file)) return modules.get(file)
  const exports = {}
  modules.set(file, exports)
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    exports, console, Uint8Array, DataView, setTimeout, clearTimeout, ...globals,
    require: dependency => Object.hasOwn(overrides, dependency)
      ? overrides[dependency]
      : loadModule(dependency.replace('./', ''), globals, overrides, modules),
  }, { filename: file })
  return exports
}

/** 单个 chunk 包含多帧时，也应在解密中途让出线程，且不破坏样本数据。 */
test('大 chunk 内逐帧让出线程，AES 输出仍与标准实现一致', async () => {
  const count = 12
  const size = 32
  const key = Buffer.alloc(16)
  const ivs = Array.from({ length: count }, (_, index) => {
    const iv = Buffer.alloc(8)
    iv.writeUInt32BE(index + 1, 4)
    return iv
  })
  const plain = Array.from({ length: count }, (_, index) => Buffer.alloc(size, index + 1))
  const encrypted = plain.map((bytes, index) => {
    const cipher = crypto.createCipheriv('aes-128-ctr', key, Buffer.concat([ivs[index], Buffer.alloc(8)]))
    return Buffer.concat([cipher.update(bytes), cipher.final()])
  })
  /** 根据 mdat 的最终位置构造只有一个 chunk 的样本表。 */
  function moov(offset) {
    return box('moov', box('trak', box('mdia', box('minf', box('stbl',
      box('stsz', words(0, size, count)),
      box('stco', words(0, 1, offset)),
      box('stsc', words(0, 1, 1, count, 1)),
      box('senc', words(0, count), ...ivs),
    )))))
  }
  const header = moov(0)
  const offset = header.length + 8
  const bytes = new Uint8Array(Buffer.concat([moov(offset), box('mdat', ...encrypted)]))
  let now = 0
  const progressAtYield = []
  let progress = 0
  const api = loadModule('mp4', {
    Date: { now: () => (now += 9) },
    setTimeout: callback => {
      progressAtYield.push(progress)
      return setTimeout(callback, 0)
    },
  })
  assert.equal(await api.decryptSamplesAsync(bytes, key, value => { progress = value }), count)
  assert.ok(progressAtYield.some(value => value > 0 && value < 1), '必须在整集完成前让出线程')
  assert.deepEqual(Buffer.from(bytes.subarray(offset)), Buffer.concat(plain))
})

/** 构造本地缓存宿主，记录系统媒体验证和持久化操作。 */
function cachedRuntime(playable) {
  let disposed = false
  const progress = []
  const api = loadModule('mediaCache', {
    FileManager: {
      appGroupDocumentsDirectory: '/test',
      existsSync: file => !file.endsWith('cache-index.json'),
      writeAsStringSync: () => {},
    },
    AVAsset: class {
      /** 测试中记录检查结束时资源是否已释放。 */
      dispose() { disposed = true }
      /** 返回系统可播放性检查结果，不解析真实媒体。 */
      async loadIsPlayable() {
        if (playable instanceof Error) throw playable
        return playable
      }
    },
  }, { './appApi': {}, './mp4': {}, scripting: {} })
  return { api, progress, isDisposed: () => disposed }
}

/** 文件存在但系统判定不可播放时，不能返回成功状态。 */
test('已存在的坏缓存不再被直接当作播放成功', async () => {
  const run = cachedRuntime(false)
  await assert.rejects(run.api.prepareOfflineVideo('123', {
    onProgress: value => run.progress.push(value.stage),
  }), /无法被 iPhone 播放/)
  assert.deepEqual(run.progress, ['validating'])
  assert.equal(run.isDisposed(), true)
})

/** 可播放缓存完成验证后才报告准备完成。 */
test('有效缓存完成系统检查后复用，并释放检查资源', async () => {
  const run = cachedRuntime(true)
  assert.match(await run.api.prepareOfflineVideo('123', {
    onProgress: value => run.progress.push(value.stage),
  }), /123\.mp4$/)
  assert.deepEqual(run.progress, ['validating', 'done'])
  assert.equal(run.isDisposed(), true)
})

/** 系统解析失败应传递错误，并始终释放媒体检查资源。 */
test('缓存解析异常不被吞掉', async () => {
  const run = cachedRuntime(new Error('unsupported media'))
  await assert.rejects(run.api.prepareOfflineVideo('123'), /unsupported media/)
  assert.equal(run.isDisposed(), true)
})

/** 原生通知执行期间禁止回调重入播放器，队列任务可以在通知返回后操作它。 */
test('播放器四类事件均在原生通知返回后处理', async () => {
  const { bindPlayerEvents } = loadModule('playerEvents', {})
  let insideNativeNotification = false
  const events = []
  const player = {}
  /** 模拟不允许在原生通知中同步回调的播放器桥接。 */
  function nativeOperation(label) {
    assert.equal(insideNativeNotification, false, '不能重入原生播放器通知')
    events.push(label)
  }
  const dispose = bindPlayerEvents(player, {
    onReady: () => nativeOperation('play'),
    onStatus: status => nativeOperation(`status:${status}`),
    onError: message => nativeOperation(`error:${message}`),
    onEnded: () => nativeOperation('next'),
  })
  insideNativeNotification = true
  player.onReadyToPlay()
  player.onTimeControlStatusChanged(2)
  player.onError('decode failed')
  player.onEnded()
  assert.deepEqual(events, [])
  insideNativeNotification = false
  await new Promise(resolve => setTimeout(resolve, 10))
  assert.deepEqual(events, ['play', 'status:2', 'error:decode failed', 'next'])
  dispose()
  assert.equal(player.onReadyToPlay, undefined)
  assert.equal(player.onTimeControlStatusChanged, undefined)
  assert.equal(player.onError, undefined)
  assert.equal(player.onEnded, undefined)
})

/** 页面关闭后取消已排队的事件，避免继续播放或访问已释放的播放器。 */
test('播放器事件解绑后取消待执行通知', async () => {
  const { bindPlayerEvents } = loadModule('playerEvents', {})
  const player = {}
  let count = 0
  const dispose = bindPlayerEvents(player, {
    onReady: () => { count++ },
    onStatus: () => { count++ },
    onError: () => { count++ },
    onEnded: () => { count++ },
  })
  const lateNotification = player.onReadyToPlay
  player.onReadyToPlay()
  player.onTimeControlStatusChanged(2)
  player.onError('decode failed')
  player.onEnded()
  dispose()
  lateNotification()
  await new Promise(resolve => setTimeout(resolve, 10))
  assert.equal(count, 0)
})

/** 公开源只接受官网明确开放、标识匹配的数据，保留真实错误。 */
test('官网公开视频严格校验标识，只有不可用或 404 返回空', async () => {
  class HttpError extends Error {
    /** 保存测试响应状态。 */
    constructor(message, status) { super(message); this.status = status }
  }
  let value = { publicVideoSeo: {
    available: true, seriesId: 'series', itemId: 'vid',
    durationSeconds: 79.534, width: 360, height: 640, posterUrl: 'poster',
  } }
  const api = loadModule('api', {}, {
    './http': { HttpError, fetchLoaderEntry: async () => {
      if (value instanceof Error) throw value
      return value
    } },
  })
  const video = await api.fetchPublicVideo('series', 'vid')
  assert.equal(video.main_url, 'https://hongguoduanju.com/video/public/vid/360p.mp4')
  assert.equal(video.duration, '79.534')
  await assert.rejects(api.fetchPublicVideo('series', 'other'), /标识不匹配/)
  value.publicVideoSeo.width = 0
  await assert.rejects(api.fetchPublicVideo('series', 'vid'), /有效媒体信息/)
  value = { publicVideoSeo: { available: false } }
  assert.equal(await api.fetchPublicVideo('series', 'vid'), null)
  value = new HttpError('not found', 404)
  assert.equal(await api.fetchPublicVideo('series', 'vid'), null)
  value = new HttpError('network', 0)
  await assert.rejects(api.fetchPublicVideo('series', 'vid'), /network/)
})

/** 初次加载和切集共同使用公开源，已有缓存不发网络请求。 */
test('公开播放绕过 App 接口，初次加载与切集一致，缓存仍优先', async () => {
  let cached = false
  let publicCalls = 0
  let appCalls = 0
  let publicVideo = { main_url: 'https://public/video.mp4', duration: '79.534', width: 360, height: 640 }
  const detail = { vid_list: ['vid'], series_name: '剧', series_cover: 'cover' }
  const api = loadModule('playbackSource', {}, {
    './api': {
      fetchDetail: async () => ({ detail, social: null }),
      fetchPublicVideo: async () => { publicCalls++; return publicVideo },
    },
    './mediaCache': {
      isOfflineVideoCached: () => cached,
      prepareOfflineVideo: async (_vid, _options, publicSource) => {
        if (!publicSource) appCalls++
        return '/cache/vid.mp4'
      },
      getCachedVideoMeta: () => ({ duration: 79.534 }),
    },
  })
  const initial = await api.loadOfflinePlayerData('series', 'vid')
  assert.equal(initial.data.playerInfo.main_url, '/cache/vid.mp4')
  assert.equal(initial.meta.duration, 79.534)
  assert.equal((await api.resolvePlaybackSource('series', detail, 'vid')).url, '/cache/vid.mp4')
  assert.equal(appCalls, 0)
  cached = true
  assert.equal((await api.resolvePlaybackSource('series', detail, 'vid')).url, '/cache/vid.mp4')
  assert.equal(publicCalls, 2)
  cached = false
  publicVideo = null
  assert.equal((await api.resolvePlaybackSource('series', detail, 'vid')).url, '/cache/vid.mp4')
  assert.equal(appCalls, 2)
})


/** 模拟文件系统及系统可播放性检查，验证公开 MP4 的完整缓存流程。 */
function publicCacheRuntime(playable) {
  const files = new Map()
  let downloads = 0
  let appCalls = 0
  const bytes = new Uint8Array([1, 2, 3, 4])
  const api = loadModule('mediaCache', {
    FileManager: {
      appGroupDocumentsDirectory: '/test',
      existsSync: file => files.has(file),
      createDirectorySync: file => files.set(file, null),
      writeAsBytesSync: (file, value) => files.set(file, value),
      writeAsStringSync: (file, value) => files.set(file, value),
      readAsStringSync: file => files.get(file),
      removeSync: file => files.delete(file),
      readDirectorySync: directory => [...files.keys()]
        .filter(file => file.startsWith(directory + '/')).map(file => file.slice(directory.length + 1)),
      statSync: file => ({ size: files.get(file).length, modificationDate: 0 }),
    },
    AVAsset: class {
      /** 返回测试指定的系统检查结果。 */
      async loadIsPlayable() { return playable }
      /** 测试宿主无需释放真实媒体。 */
      dispose() {}
    },
  }, {
    './appApi': {
      fetchEncryptedStreams: async () => { appCalls++; throw new Error('不应请求 App') },
      downloadStream: async url => {
        assert.equal(url, 'https://public/video.mp4')
        downloads++
        return bytes
      },
    },
    './mp4': { decryptToPlayableAsync: async () => { throw new Error('公开 MP4 不应解密') } },
    scripting: {},
  })
  return { api, files, bytes, downloads: () => downloads, appCalls: () => appCalls }
}

/** 公开源下载后原样缓存，写入元数据并通知选集；重播无需联网。 */
test('公开 MP4 写入缓存并复用，不请求 App、不解密', async () => {
  const run = publicCacheRuntime(true)
  const stages = []
  const events = []
  run.api.onCacheChanged((vid, action) => events.push([vid, action]))
  const source = { main_url: 'https://public/video.mp4', duration: '79.534', width: 360, height: 640 }
  const target = await run.api.prepareOfflineVideo('123', {
    label: '第一集', onProgress: value => stages.push(value.stage),
  }, source)
  assert.equal(run.files.get(target), run.bytes)
  assert.deepEqual(stages, ['fetching', 'downloading', 'downloading', 'validating', 'done'])
  assert.equal(run.api.getCachedVideoMeta('123').duration, 79.534)
  assert.equal(run.api.getCachedVideoMeta('123').width, 360)
  assert.deepEqual(events, [['123', 'added']])
  assert.equal(await run.api.prepareOfflineVideo('123'), target)
  assert.equal(run.downloads(), 1)
  assert.equal(run.appCalls(), 0)
})

/** 公开源下载成功但系统验证失败时删除文件，不能留下“已缓存”的假状态。 */
test('公开 MP4 验证失败不保留缓存文件或索引', async () => {
  const run = publicCacheRuntime(false)
  await assert.rejects(run.api.prepareOfflineVideo('123', {}, {
    main_url: 'https://public/video.mp4', duration: '79.534', width: 360, height: 640,
  }), /无法被 iPhone 播放/)
  assert.equal(run.api.isOfflineVideoCached('123'), false)
  assert.equal(run.api.getCachedVideoMeta('123'), null)
})
