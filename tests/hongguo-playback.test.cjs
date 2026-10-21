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

/** 构造带视频样本入口的 MP4 结构样本，仅用于容器校验而非解码测试。 */
function cachedMp4(entry = 'hvc1') {
  return new Uint8Array(Buffer.concat([
    box('ftyp', Buffer.from('isom'), words(0), Buffer.from('isom')),
    box('moov', box('trak', box('mdia', box('minf', box('stbl',
      box('stsd', words(0, 1), box(entry, Buffer.alloc(78))),
    ))))),
    box('mdat', Buffer.alloc(16)),
  ]))
}

/** 构造本地缓存宿主，禁止原生媒体探测并保留文件读取错误。 */
function cachedRuntime(bytes) {
  let nativeProbes = 0
  const progress = []
  const api = loadModule('mediaCache', {
    FileManager: {
      appGroupDocumentsDirectory: '/test',
      existsSync: file => !file.endsWith('cache-index.json'),
      writeAsStringSync: () => {},
      readAsBytes: async () => {
        if (bytes instanceof Error) throw bytes
        return bytes
      },
    },
    AVAsset: class {
      /** 缓存校验不得创建可能阻塞的原生媒体对象。 */
      constructor() { nativeProbes++; throw new Error('禁止创建 AVAsset') }
    },
  }, { './appApi': {}, scripting: {} })
  return { api, progress, nativeProbes: () => nativeProbes }
}

/** 文件存在但 MP4 数据不完整时，不能返回成功状态。 */
test('已存在的坏缓存不再被直接当作播放成功', async () => {
  const run = cachedRuntime(cachedMp4().subarray(0, -1))
  await assert.rejects(run.api.prepareOfflineVideo('123', {
    onProgress: value => run.progress.push(value.stage),
  }), /MP4 数据不完整/)
  assert.deepEqual(run.progress, ['validating'])
  assert.equal(run.nativeProbes(), 0)
})

/** 有效容器检查完成后报告准备完成，全程不创建系统媒体探测对象。 */
test('有效缓存完成结构检查后复用，不创建 AVAsset', async () => {
  const run = cachedRuntime(cachedMp4())
  assert.match(await run.api.prepareOfflineVideo('123', {
    onProgress: value => run.progress.push(value.stage),
  }), /123\.mp4$/)
  assert.deepEqual(run.progress, ['validating', 'done'])
  assert.equal(run.nativeProbes(), 0)
})

/** 文件读取失败应原样传递，不能伪装成有效缓存或转为原生探测。 */
test('缓存读取异常不被吞掉', async () => {
  const run = cachedRuntime(new Error('read failed'))
  await assert.rejects(run.api.prepareOfflineVideo('123'), /read failed/)
  assert.equal(run.nativeProbes(), 0)
})

/** 结构检查拒绝未解密、非视频、无媒体数据和残缺的 MP4。 */
test('缓存结构检查拒绝加密轨道、ByteVC2、缺失媒体数据及非 MP4', async () => {
  for (const [bytes, message] of [
    [cachedMp4('encv'), /仍含加密轨道/],
    [cachedMp4('bv2C'), /缺少支持的视频轨道/],
    [new Uint8Array(box('moov')), /缺少 MP4 轨道或媒体数据/],
    [new Uint8Array([1, 2, 3, 4]), /MP4 数据不完整/],
  ]) {
    const run = cachedRuntime(bytes)
    await assert.rejects(run.api.prepareOfflineVideo('123'), message)
    assert.equal(run.nativeProbes(), 0)
  }
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


/** 模拟文件系统并禁止原生媒体探测，验证公开 MP4 的完整缓存流程。 */
function publicCacheRuntime(bytes = cachedMp4()) {
  const files = new Map()
  let downloads = 0
  let appCalls = 0
  let reads = 0
  const api = loadModule('mediaCache', {
    FileManager: {
      appGroupDocumentsDirectory: '/test',
      existsSync: file => files.has(file),
      createDirectorySync: file => files.set(file, null),
      writeAsBytesSync: (file, value) => files.set(file, value),
      writeAsStringSync: (file, value) => files.set(file, value),
      readAsStringSync: file => files.get(file),
      readAsBytes: async file => { reads++; return files.get(file) },
      removeSync: file => files.delete(file),
      readDirectorySync: directory => [...files.keys()]
        .filter(file => file.startsWith(directory + '/')).map(file => file.slice(directory.length + 1)),
      statSync: file => ({ size: files.get(file).length, modificationDate: 0 }),
    },
    AVAsset: class {
      /** 下载及缓存重播均不得创建原生媒体探测对象。 */
      constructor() { throw new Error('禁止创建 AVAsset') }
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
    './mp4': {
      ...loadModule('mp4', {}),
      decryptToPlayableAsync: async () => { throw new Error('公开 MP4 不应解密') },
    },
    scripting: {},
  })
  return { api, files, bytes, downloads: () => downloads, appCalls: () => appCalls, reads: () => reads }
}

/** 公开源下载后原样缓存，写入元数据并通知选集；重播无需联网。 */
test('公开 MP4 写入缓存并复用，不请求 App、不解密', async () => {
  const run = publicCacheRuntime()
  const stages = []
  const events = []
  run.api.onCacheChanged((vid, action) => events.push([vid, action]))
  const source = { main_url: 'https://public/video.mp4', duration: '79.534', width: 360, height: 640 }
  const target = await run.api.prepareOfflineVideo('123', {
    label: '第一集', onProgress: value => stages.push(value.stage),
  }, source)
  assert.equal(run.files.get(target), run.bytes)
  assert.equal(run.reads(), 0, '新下载的视频直接检查已有字节，不重复读取大文件')
  assert.deepEqual(stages, ['fetching', 'downloading', 'downloading', 'validating', 'done'])
  assert.equal(run.api.getCachedVideoMeta('123').duration, 79.534)
  assert.equal(run.api.getCachedVideoMeta('123').width, 360)
  assert.deepEqual(events, [['123', 'added']])
  assert.equal(await run.api.prepareOfflineVideo('123'), target)
  assert.equal(run.reads(), 1, '重播已有缓存时异步读取并检查结构')
  assert.equal(run.downloads(), 1)
  assert.equal(run.appCalls(), 0)
})

/** 公开源下载成功但结构验证失败时删除文件，不能留下“已缓存”的假状态。 */
test('公开 MP4 验证失败不保留缓存文件或索引', async () => {
  const run = publicCacheRuntime(new Uint8Array([1, 2, 3, 4]))
  await assert.rejects(run.api.prepareOfflineVideo('123', {}, {
    main_url: 'https://public/video.mp4', duration: '79.534', width: 360, height: 640,
  }), /MP4 数据不完整/)
  assert.equal(run.api.isOfflineVideoCached('123'), false)
  assert.equal(run.api.getCachedVideoMeta('123'), null)
})
