const fs = require('node:fs')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { test } = require('node:test')

/** 在隔离环境执行真实入口和依赖，仅替换原生视图、存储和网络边界。 */
function runtime(family, height, packages) {
  const store = new Map([['cniaoSettings', { boxJsUrl: 'http://boxjs.test', refreshInterval: 30 }]])
  const modules = new Map(), intents = new Map(), presented = [], calls = []
  let reloads = 0
  const storage = {
    get: key => store.get(key),
    set: (key, value) => { store.set(key, value); return true },
  }
  const scripting = {
    Widget: {
      family, displaySize: { width: 340, height },
      present: (tree, policy) => presented.push({ tree, policy }),
      reloadUserWidgets: () => { reloads++ },
    },
    AppIntentProtocol: { AppIntent: 'AppIntent' },
    AppIntentManager: { register: intent => {
      intents.set(intent.name, intent)
      return params => ({ name: intent.name, params })
    } },
    fetch: async (url, init) => {
      calls.push({ url, init })
      const json = url.startsWith('http://boxjs.test/query/data/')
        ? { val: packages === null ? '' : JSON.stringify({ 'x-t': '1', 'x-sid': 'fixture-session', 'x-sign': 'fixture-sign', 'x-mini-wua': 'fixture-wua', Cookie: 'fixture-cookie' }) }
        : { ret: ['SUCCESS::ok'], data: { packages } }
      return { ok: true, status: 200, json: async () => json }
    },
  }
  for (const name of ['VStack', 'HStack', 'ZStack', 'Image', 'Text', 'Button', 'Link', 'Spacer']) scripting[name] = name

  /** 展开实际 TSX 函数组件，保留原生视图节点供断言；不模拟像素布局。 */
  function createElement(type, props, ...children) {
    assert.ok(type, '视图类型必须存在')
    const attributes = { ...props, children: children.flat(Infinity).filter(child => child !== null && child !== undefined) }
    return typeof type === 'function' ? type(attributes) : { type, ...attributes }
  }

  /** 只加载包内真实模块，未知依赖直接失败，避免模拟环境掩盖漏打包。 */
  function load(name) {
    if (name === 'scripting') return scripting
    assert.match(name, /^\.\/(widget|cainiao|settings|app_intents)$/)
    if (modules.has(name)) return modules.get(name)
    const exports = {}
    modules.set(name, exports)
    const source = fs.readFileSync(`work/cniao-build/${name.slice(2)}.js`, 'utf8')
      .replace(/\nshowWidget\(\);\s*$/, '\nexports.completed = showWidget();')
    vm.runInNewContext(source, { exports, require: load, Storage: storage, createElement, console: { log() {} } })
    return exports
  }
  return { completed: load('./widget').completed, presented, calls, intents, store, reloads: () => reloads }
}

/** 遍历展开的视图树，收集指定原生视图节点。 */
function nodes(tree, type) {
  if (!tree || typeof tree !== 'object') return []
  return [...(tree.type === type ? [tree] : []), ...(tree.children ?? []).flatMap(child => nodes(child, type))]
}

const packages = Array.from({ length: 8 }, (_, index) => ({
  logisticsStatusDesc: '待取件', stationOrderPickUpCode: `TEST-${index}`,
  packageStation: { stationName: '测试取件点' },
  packageItem: [{ itemTitle: `测试商品 ${index}` }],
  feature: JSON.stringify({ recommendPackagePic: `https://example.test/product-${index}.png` }),
}))

for (const [family, height] of [['systemSmall', 158], ['systemSmall', 180], ['systemMedium', 158], ['systemLarge', 360]]) {
  test(`${family}/${height} 从 BoxJS 经查询、解析到视图和刷新策略执行完成`, async () => {
    const run = runtime(family, height, packages)
    await run.completed
    assert.equal(run.presented.length, 1)
    const { tree, policy } = run.presented[0]
    assert.equal(policy.policy, 'after')
    assert.ok(Math.abs(policy.date.getTime() - Date.now() - 30 * 60 * 1000) < 3000)
    assert.ok(nodes(tree, 'Text').some(node => node.children.includes('TEST-0')))
    assert.ok(nodes(tree, 'Image').some(node => node.imageUrl === 'https://example.test/product-0.png'))
    assert.ok(nodes(tree, 'Button').some(node => node.intent?.name === 'RefreshCainiaoIntent'))
    assert.equal(run.calls.filter(call => call.url.startsWith('https://caps-mtop.cainiao.com/')).length, 1)
  })
}

for (const family of ['systemSmall', 'systemMedium', 'systemLarge']) {
  test(`${family} 空列表和缺少凭据均展示说明并保留刷新入口`, async () => {
    for (const data of [[], null]) {
      const run = runtime(family, 170, data)
      await run.completed
      const tree = run.presented[0].tree
      assert.ok(nodes(tree, 'Text').some(node => node.children.includes(data === null ? '菜鸟连接异常' : '暂无进行中包裹')))
      assert.ok(nodes(tree, 'Button').some(node => node.intent?.name === 'RefreshCainiaoIntent'))
      if (data === null) assert.equal(run.calls.length, 1)
    }
  })
}

test('真实刷新和下一件 Intent 更新存储并请求时间线刷新', async () => {
  const run = runtime('systemSmall', 158, packages)
  await run.completed
  await run.intents.get('RefreshCainiaoIntent').perform()
  await run.intents.get('ShowNextCainiaoItemIntent').perform()
  await run.intents.get('ShowNextCainiaoItemIntent').perform()
  assert.equal(run.store.get('cniaoSmallPageIndex'), 2)
  assert.equal(run.reloads(), 3)
})
