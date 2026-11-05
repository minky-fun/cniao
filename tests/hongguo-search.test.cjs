const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { test } = require('node:test')

/** 用合成响应运行编译后的搜索模块，记录实际请求地址。 */
function runtime(reply) {
  const calls = []
  const modules = new Map()

  /** 加载本地模块，并将 Scripting 网络请求替换为合成响应。 */
  function load(file) {
    if (modules.has(file)) return modules.get(file)
    const exports = {}
    modules.set(file, exports)
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      exports,
      require: name => name === 'scripting'
        ? { fetch: async url => {
          calls.push(url)
          const value = reply(new URL(url))
          return { ok: true, status: 200, text: async () => JSON.stringify(value) }
        } }
        : load(path.resolve(path.dirname(file), name + '.js')),
    }, { filename: file })
    return exports
  }

  return { api: load(path.resolve('work/hongguo-build/core/api.js')), calls }
}

/** 演员搜索可展示服务端返回的剧集，即使剧名不包含演员名。 */
test('搜索使用当前结果接口并展示演员相关短剧', async () => {
  const run = runtime(() => ({
    searchList: [
      { doc_type: 46, name: '演员', video_data: null },
      {
        doc_type: 23,
        name: '短剧',
        keyword: '演员',
        video_data: { series_id: 'series-1', series_title: '短剧', series_cover: '', episode_cnt: 10 },
      },
    ],
    totalCount: 2,
  }))

  const result = await run.api.fetchSearch('演员')
  const url = new URL(run.calls[0])
  assert.equal(url.pathname, '/api/search/result')
  assert.equal(url.searchParams.get('query'), '演员')
  assert.equal(result.query, '演员')
  assert.equal(result.totalCount, 2)
  assert.equal(result.isRelevant, true)
  assert.equal(result.searchList.length, 1)
  assert.equal(result.searchList[0].video_data.series_id, 'series-1')
})

/** 空结果与损坏响应应分别显示为空状态和错误，不伪造数据。 */
test('搜索区分空结果和响应格式异常', async () => {
  const empty = runtime(() => ({ searchList: [], totalCount: 0 }))
  const result = await empty.api.fetchSearch('不存在')
  assert.equal(result.isRelevant, false)
  assert.equal(result.searchList.length, 0)

  const invalid = runtime(() => ({ totalCount: 1 }))
  await assert.rejects(invalid.api.fetchSearch('测试'), /搜索结果格式异常/)
})

/** 真实接口的数字字符串应转换为数字，损坏总数不能当作空结果。 */
test('搜索接受数字字符串总数并拒绝无效总数', async () => {
  for (const totalCount of ['92', '0', 92, 0]) {
    const run = runtime(() => ({ searchList: [], totalCount }))
    const result = await run.api.fetchSearch('长征')
    assert.equal(result.totalCount, Number(totalCount))
  }

  for (const totalCount of [null, undefined, true, '', ' ', 'abc', '-1', '1.5', '1e2', -1, 1.5, '9007199254740992']) {
    const run = runtime(() => ({ searchList: [], totalCount }))
    await assert.rejects(run.api.fetchSearch('测试'), /搜索结果格式异常/)
  }
})

/** 联想词使用当前 JSON 接口和实际返回字段。 */
test('搜索联想使用当前接口', async () => {
  const run = runtime(() => ({
    suggestionList: [{ name: '长征路上', keyword: 'series-2', display_words: ['长征路上'], word_type: 'series' }],
  }))
  const words = await run.api.fetchSuggest('长征')
  const url = new URL(run.calls[0])
  assert.equal(url.pathname, '/api/search/suggestion')
  assert.equal(url.searchParams.get('query'), '长征')
  assert.equal(words.length, 1)
  assert.equal(words[0].name, '长征路上')
})
