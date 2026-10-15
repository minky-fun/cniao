const fs = require('node:fs')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { test } = require('node:test')
const source = fs.readFileSync('work/cniao-build/cainiao.js', 'utf8') + '\nexports.query=getPackages;exports.authData=getAutologinData;'
const settingsSource = fs.readFileSync('work/cniao-build/settings.js', 'utf8')
const headers = { 'x-t': '1', 'x-sid': 'old-session', 'x-sign': 'fixture-sign', 'x-mini-wua': 'fixture-wua', Cookie: 'fixture-cookie' }
const success = { ret: ['SUCCESS::ok'], data: { packages: [] } }
const expired = { ret: ['FAIL_SYS_SESSION_EXPIRED::expired'] }

/** 构造原生封装或已有扁平格式，全部使用虚构凭据。 */
function fixtures(nested = true) {
  const request = { refreshToken: 'token-1', accountId: 'account-1', keep: 'unchanged' }
  return { cainiao_pcs_headers_json: JSON.stringify(headers), cainiao_autologin_headers_json: JSON.stringify(headers), cainiao_autologin_data: JSON.stringify(nested ? { autoLoginRequest: JSON.stringify(request), outer: 'unchanged' } : request) }
}

/** 以独立运行时模拟小组件重启，共享存储以验证跨轮续期。 */
function runtime(store, box, gateway) {
  const exports = {}, calls = [], logs = []
  const storage = { get: key => store.get(key), set: (key, value) => { store.set(key, value); return true } }
  const settings = {}
  vm.runInNewContext(settingsSource, { exports: settings, Storage: storage })
  vm.runInNewContext(source, {
    exports, Storage: storage,
    require: name => name === './settings' ? settings : ({ fetch: async (url, init) => {
      calls.push({ url, init: JSON.parse(JSON.stringify(init)) })
      const result = url.includes('/query/data/') ? { json: { val: box[url.split('/').pop()] || '' } } : await gateway(url, init)
      const status = result.status || 200
      return { ok: status >= 200 && status < 300, status, json: async () => { if (result.nonJson) throw new Error('PRIVATE_RESPONSE'); return result.json } }
    } }), console: { log: (...args) => logs.push(args.join(' ')) },
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [1700000000000])) } static now() { return 1700000000000 } },
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
  })
  return { api: exports, calls, logs }
}

/** 读取实际提交的业务参数，并展开原生字符串封装。 */
function authRequest(url) {
  const payload = JSON.parse(decodeURIComponent(url.split('&data=')[1]))
  return payload.autoLoginRequest ? JSON.parse(payload.autoLoginRequest) : payload
}

for (const nested of [true, false]) {
  test(`${nested ? '原生嵌套' : '已有扁平'}格式连续两次过期使用轮换 token，跨刷新复用 sid`, async () => {
    const store = new Map(), box = fixtures(nested), tokens = []
    let authCount = 0, phase = 1
    /** 模拟真实状态依赖：新 token 才能签发下一轮 sid。 */
    async function gateway(url, init) {
      if (url.includes('autologin')) {
        const request = authRequest(url)
        assert.equal(request.refreshToken, 'token-' + (authCount + 1))
        assert.equal(request.keep, 'unchanged')
        tokens.push(request.refreshToken)
        authCount++
        return { json: { ret: ['SUCCESS::ok'], data: { data: { sessionId: 'sid-' + authCount, refreshToken: 'token-' + (authCount + 1) } } } }
      }
      return { json: init.headers['x-sid'] === 'sid-' + phase ? success : expired }
    }
    assert.equal((await runtime(store, box, gateway).api.query()).items.length, 0)
    assert.equal((await runtime(store, box, gateway).api.query()).items.length, 0)
    assert.equal(authCount, 1)
    phase = 2
    assert.equal((await runtime(store, box, gateway).api.query()).items.length, 0)
    assert.deepEqual(tokens, ['token-1', 'token-2'])
    const saved = JSON.parse(store.get('cniao_autologin_data'))
    if (nested) { assert.equal(saved.outer, 'unchanged'); assert.equal('refreshToken' in saved, false) }
  })
}

for (const status of [401, 403]) {
  test(`非 JSON HTTP ${status} 仍自动续期并重试`, async () => {
    const run = runtime(new Map(), fixtures(), async (url, init) => url.includes('autologin')
      ? { json: { ret: ['SUCCESS::ok'], data: { data: { sessionId: 'new-sid', refreshToken: 'token-2' } } } }
      : init.headers['x-sid'] === 'new-sid' ? { json: success } : { status, nonJson: true })
    assert.equal((await run.api.query()).items.length, 0)
    assert.equal(run.calls.filter(call => call.url.includes('/gw/')).length, 3)
  })
}

test('业务重试失败也保存轮换 token，但不保存未验证 sid', async () => {
  const store = new Map(), box = fixtures()
  const run = runtime(store, box, url => ({ json: url.includes('autologin') ? { ret: ['SUCCESS::ok'], data: { data: { sessionId: 'rejected-sid', refreshToken: 'token-2' } } } : expired }))
  assert.equal((await run.api.query()).items, null)
  assert.equal(store.has('cniao_package_session'), false)
  assert.equal(JSON.parse(JSON.parse(store.get('cniao_autologin_data')).autoLoginRequest).refreshToken, 'token-2')
  const restarted = runtime(store, box, () => ({ json: success }))
  assert.equal(JSON.parse(JSON.parse(await restarted.api.authData()).autoLoginRequest).refreshToken, 'token-2')
})

test('自动迁移旧版误加在外层的新 token，保留内层业务字段', async () => {
  const box = fixtures(), store = new Map([['cniao_autologin_source', box.cainiao_autologin_data], ['cniao_autologin_data', JSON.stringify({ ...JSON.parse(box.cainiao_autologin_data), refreshToken: 'already-rotated', accountId: 'account-1' })]])
  const run = runtime(store, box, () => ({ json: success }))
  const migrated = JSON.parse(await run.api.authData())
  assert.equal(JSON.parse(migrated.autoLoginRequest).refreshToken, 'already-rotated')
  assert.equal(JSON.parse(migrated.autoLoginRequest).keep, 'unchanged')
  assert.equal('refreshToken' in migrated, false)
  assert.equal('accountId' in migrated, false)
})

test('新 App 抓取覆盖旧本地凭据，账号变化不复用旧 sid', async () => {
  const box = fixtures(), store = new Map([['cniao_autologin_source', box.cainiao_autologin_data], ['cniao_autologin_data', 'old-data'], ['cniao_package_session', { sourceHeaders: box.cainiao_pcs_headers_json, sid: 'old-account-sid' }]])
  box.cainiao_pcs_headers_json = JSON.stringify({ ...headers, 'x-sid': 'new-account-sid' })
  box.cainiao_autologin_data = JSON.stringify({ autoLoginRequest: JSON.stringify({ refreshToken: 'new-app-token', accountId: 'account-2' }) })
  const run = runtime(store, box, () => ({ json: success }))
  assert.equal(await run.api.authData(), box.cainiao_autologin_data)
  await run.api.query()
  assert.equal(run.calls.find(call => call.url.includes('/gw/')).init.headers['x-sid'], 'new-account-sid')
})

test('续期被拒绝时不清空有效凭据、不输出凭据或服务端描述', async () => {
  const store = new Map(), box = fixtures()
  const run = runtime(store, box, url => ({ json: url.includes('autologin') ? { ret: ['FAIL_SYS_ILLEGAL_ACCESS::PRIVATE_TOKEN'] } : expired }))
  const result = await run.api.query()
  assert.match(result.errorMessage, /自动续期被拒绝：FAIL_SYS_ILLEGAL_ACCESS/)
  assert.equal(store.get('cniao_autologin_data'), box.cainiao_autologin_data)
  assert(!JSON.stringify([result, run.logs]).includes('PRIVATE_TOKEN'))
  assert(!run.logs.join('\n').includes('token-1'))
})

test('非真正 SUCCESS 的续期结果不保存 sid 或 token', async () => {
  const store = new Map()
  const run = runtime(store, fixtures(), url => ({ json: url.includes('autologin') ? { ret: ['NOT_SUCCESS::error'], data: { data: { sessionId: 'bad-sid', refreshToken: 'bad-token' } } } : expired }))
  assert.equal((await run.api.query()).items, null)
  assert.equal(store.has('cniao_package_session'), false)
  assert(!store.get('cniao_autologin_data').includes('bad-token'))
})

test('缺少续期数据明确提示，不向 autologin 发送猜测参数', async () => {
  const box = fixtures(); box.cainiao_autologin_data = '{"autoLoginRequest":"{}"}'
  const run = runtime(new Map(), box, () => ({ json: expired }))
  assert.match((await run.api.query()).errorMessage, /缺少 refreshToken/)
  assert.equal(run.calls.filter(call => call.url.includes('/gw/') && call.url.includes('autologin')).length, 0)
})

test('正常包裹请求保持已验证的 GET URL、业务参数和请求头', async () => {
  const run = runtime(new Map(), fixtures(), () => ({ json: success }))
  assert.equal((await run.api.query()).items.length, 0)
  const request = run.calls.find(call => call.url.includes('/gw/'))
  const data = JSON.stringify({ currentPage: 1, pageSize: 40, needTemporality: false, needDynInfo: "{'needFindTemporality':true,'needAppointment':true}" })
  assert.equal(request.url, 'https://caps-mtop.cainiao.com/gw/mtop.cainiao.lpc.packageservice.querypdspackagedatalist.cn/1.0?rnd=' + '8'.repeat(32) + '&data=' + encodeURIComponent(data))
  assert.equal(request.init.method, 'GET')
  assert.deepEqual(request.init.headers, { ...headers, 'x-t': '1700000000', Host: 'caps-mtop.cainiao.com', Accept: 'application/json', 'Accept-Encoding': 'gzip' })
})

test('错误响应即使包含 packages 也不当作查询成功', async () => {
  const run = runtime(new Map(), fixtures(), () => ({ json: { ret: ['FAIL_SYS_ILLEGAL_ACCESS::error'], data: { packages: [] } } }))
  assert.equal((await run.api.query()).items, null)
})
