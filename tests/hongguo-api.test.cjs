const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { test } = require('node:test')

const VID = '7694655231191174169'

/** 用全零测试密钥构造合成 spade_a，不包含真实视频地址或密钥。 */
function definition(height, codec = 'bytevc1') {
  const decoded = Buffer.from('0' + '0'.repeat(32))
  const raw = Buffer.alloc(35)
  const previous = [250, 85]
  for (let index = 0; index < decoded.length; index++) {
    const count = index.toString(2).replace(/0/g, '').length
    raw[index + 1] = previous[index % 2] ^ ((decoded[index] + 21 + count) & 255)
    previous[index % 2] = raw[index + 1]
  }
  raw[0] = 49 ^ raw[1] ^ raw[2]
  return {
    main_url: 'https://example.invalid/video.mp4',
    video_meta: { codec_type: codec, vheight: height, vwidth: 360, duration: 80000, size: 100 },
    encrypt_info: { spade_a: raw.toString('base64'), kid: 'fixture' },
  }
}

/** 模拟 Scripting 网络与私有存储，加载真实编译后的模块。 */
function runtime(store = new Map(), reply = { code: 0, data: { [VID]: { video_model: '{"video_list":[]}' } } }, save = true) {
  const calls = [], retryDelays = [], modules = new Map()
  const storage = {
    contains: key => store.has(key),
    get: key => store.has(key) ? store.get(key) : null,
    set: (key, value) => { if (save) store.set(key, value); return save },
  }
  /** 仅加载本地编译依赖，以替身代替 Scripting 的 fetch。 */
  function load(file) {
    if (modules.has(file)) return modules.get(file)
    const exports = {}
    modules.set(file, exports)
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      exports, Storage: storage, atob, btoa, Uint8Array,
      setTimeout: (callback, delay) => { retryDelays.push(delay); queueMicrotask(callback) },
      require: name => name === 'scripting' ? { fetch: async (url, init) => {
        calls.push({ url, init })
        const value = typeof reply === 'function' ? reply(calls.length) : reply
        if (value instanceof Error) throw value
        return { ok: true, status: 200, text: async () => typeof value === 'string' ? value : JSON.stringify(value) }
      } } : load(path.resolve(path.dirname(file), name + '.js')),
    }, { filename: file })
    return exports
  }
  return { api: load(path.resolve('work/hongguo-build/core/appApi.js')), calls, retryDelays }
}

/** 验证新请求协议、数组和对象视频列表，以及现有解密输入契约。 */
for (const objectList of [false, true]) {
  test(`多集接口使用公开游客 JSON 和持久身份，解析${objectList ? '对象' : '数组'}视频列表`, async () => {
    const list = [definition(640), definition(1920), definition(1280, 'bytevc2')]
    const store = new Map()
    const reply = { code: 0, data: { [VID]: { video_model: JSON.stringify({ video_list: objectList ? { low: list[0], high: list[1], unsupported: list[2] } : list }) } } }
    const run = runtime(store, reply)
    const streams = await run.api.fetchEncryptedStreams('7694655231191174169')
    assert.deepEqual(Array.from(streams, stream => stream.height), [1920, 640])
    assert.equal(streams[0].duration, 80)
    assert.deepEqual(Array.from(streams[0].contentKey), Array(16).fill(0))
    const { url, init } = run.calls[0]
    const parsed = new URL(url)
    assert.equal(parsed.origin, 'https://api5-normal-sinfonlineb.fqnovel.com')
    assert.equal(parsed.pathname, '/novel/player/multi_video_model/v1/')
    assert.equal(init.method, 'POST')
    assert.equal(typeof init.body, 'string')
    assert.deepEqual(JSON.parse(init.body), {
      mixed_video_id_map: { '1': [VID] },
      biz_param: {
        detail_page_version: 0, device_level: 3,
        disable_digg_stat: false, disable_video_relate_book: false,
        need_all_video_definition: true, need_mp4_align: false,
        use_os_player: false, use_server_dns: false, video_platform: 1024,
      },
    })
    assert.equal(init.headers['Content-Type'], 'application/json; charset=utf-8')
    assert.equal(Object.keys(init.headers).some(key => /gorgon|khronos|stub|req-ticket|content-encoding/i.test(key)), false)
    assert.match(parsed.searchParams.get('_rticket'), /^[0-9]{13}$/)
    assert.equal(parsed.searchParams.get('channel'), 'update_64')
    assert.equal(parsed.searchParams.get('version_name'), '7.3.5.32')
    const identity = store.get('hongguo-public-player-device')
    assert.match(identity.device_id, /^[0-9]{19}$/)
    assert.match(identity.iid, /^[0-9]{19}$/)
    const restarted = runtime(store, reply)
    await restarted.api.fetchEncryptedStreams(VID)
    const second = new URL(restarted.calls[0].url)
    assert.equal(second.searchParams.get('device_id'), identity.device_id)
    assert.equal(second.searchParams.get('iid'), identity.iid)
  })
}

/** 上游异常应可读，并且不删除或轮换持久身份。 */
for (const [reply, error] of [
  ['', /空响应/], [' \n', /空响应/], ['<html>error</html>', /非 JSON/],
  ['null', /格式异常/], [{ code: 1, message: '接口不可用' }, /接口不可用/],
  [{ code: 0 }, /有效的视频数据/],
  [{ code: 0, data: {} }, /暂无可播放内容/],
  [{ code: 0, data: { [VID]: { video_model: 'invalid' } } }, /播放信息解析失败/],
  [{ code: 0, data: { [VID]: { video_model: 'null' } } }, /视频列表/],
  [new Error('network unavailable'), /请求失败/],
]) {
  test(`失败路径：${error.source}`, async () => {
    const identity = { device_id: '1111111111111111111', iid: '2222222222222222222' }
    const store = new Map([['hongguo-public-player-device', identity]])
    const run = runtime(store, reply)
    await assert.rejects(run.api.fetchEncryptedStreams('7694655231191174169'), error)
    assert.equal(run.calls.length, typeof reply === 'string' && !reply.trim() ? 3 : 1)
    assert.equal(store.get('hongguo-public-player-device'), identity)
  })
}

/** 非法输入和损坏的身份配置必须在发出网络请求前停止。 */
test('视频 ID 或设备配置无效时不请求、不覆盖存储', async () => {
  for (const vid of ['../invalid', '1234567', '1'.repeat(25)]) {
    const invalid = runtime()
    await assert.rejects(invalid.api.fetchEncryptedStreams(vid), /视频 ID 不合法/)
    assert.equal(invalid.calls.length, 0)
  }
  for (const value of [null, {}, { device_id: '123', iid: '456' }]) {
    const store = new Map([['hongguo-public-player-device', value]])
    const run = runtime(store)
    await assert.rejects(run.api.fetchEncryptedStreams('7694655231191174169'), /配置损坏/)
    assert.equal(run.calls.length, 0)
    assert.equal(store.get('hongguo-public-player-device'), value)
  }
})

/** 无法持久保存时拒绝发送临时身份。 */
test('存储保存失败时不请求', async () => {
  const run = runtime(new Map(), undefined, false)
  await assert.rejects(run.api.fetchEncryptedStreams('7694655231191174169'), /保存失败/)
  assert.equal(run.calls.length, 0)
})

/** 空响应重试维持同一身份和请求体，成功后立即停止。 */
test('空 200 有界延迟重试，成功后停止且不切换身份', async () => {
  const reply = { code: 0, data: { [VID]: { video_model: JSON.stringify({ video_list: [definition(1920)] }) } } }
  const run = runtime(new Map(), attempt => attempt < 3 ? '' : reply)
  const streams = await run.api.fetchEncryptedStreams(VID)
  assert.equal(streams.length, 1)
  assert.equal(run.calls.length, 3)
  assert.deepEqual(run.retryDelays, [500, 1000])
  const first = new URL(run.calls[0].url)
  for (const call of run.calls) {
    const url = new URL(call.url)
    assert.equal(url.pathname, '/novel/player/multi_video_model/v1/')
    assert.equal(url.searchParams.get('device_id'), first.searchParams.get('device_id'))
    assert.equal(url.searchParams.get('iid'), first.searchParams.get('iid'))
    assert.match(url.searchParams.get('_rticket'), /^[0-9]{13}$/)
    assert.equal(call.init.body, run.calls[0].init.body)
  }
})

/** 多集结果只能读取目标集，不能把另一集误当作本集缓存。 */
test('多集结果缺少目标集时拒绝使用其他集', async () => {
  const run = runtime(new Map(), { code: 0, data: { other: { video_model: JSON.stringify({ video_list: [definition(1920)] }) } } })
  await assert.rejects(run.api.fetchEncryptedStreams(VID), /暂无可播放内容/)
  assert.equal(run.calls.length, 1)
})
