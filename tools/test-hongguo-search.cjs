// Run after: npm exec --yes --package=typescript -- tsc -p tools/tsconfig.hongguo.json
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const build = path.join(__dirname, "../work/hongguo-build")

/** Load compiled production code with explicit replacements for host dependencies. */
function loadModule(file, dependencies, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(readFileSync(path.join(build, file), "utf8"), {
    module, exports: module.exports, console, Error,
    /** Resolve only the dependencies explicitly supplied by the test. */
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
    ...globals,
  }, { filename: file })
  return module.exports
}

/** Build public search records without account information. */
function resultPage(query, pageNum, ids, hasMore = true) {
  return {
    query, pageNum, totalPages: hasMore ? pageNum + 1 : pageNum,
    totalCount: 30, hasMore, isRelevant: ids.length > 0,
    searchList: ids.map(id => ({
      doc_type: 1, name: id, keyword: id,
      video_data: { series_id: id, series_title: id },
    })),
  }
}

/** Render the real component with deterministic hooks and deferred network replies. */
function createView() {
  const slots = [], pendingEffects = [], calls = [], timers = new Map()
  let cursor = 0, timerId = 0, tree
  const scripting = Object.fromEntries([
    "Button", "HStack", "Image", "LazyVStack", "ProgressView", "ScrollView", "Text", "TextField", "VStack",
  ].map(name => [name, name]))
  scripting.useState = initial => {
    const index = cursor++
    if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial }
    return [slots[index].value, value => {
      slots[index].value = typeof value === "function" ? value(slots[index].value) : value
    }]
  }
  scripting.useRef = value => {
    const index = cursor++
    if (!slots[index]) slots[index] = { current: value }
    return slots[index]
  }
  scripting.useEffect = (setup, deps) => {
    const index = cursor++
    const previous = slots[index]
    if (!previous || deps.some((value, i) => value !== previous.deps[i])) {
      pendingEffects.push(() => {
        previous?.cleanup?.()
        slots[index] = { deps, cleanup: setup() }
      })
    }
  }
  const common = Object.fromEntries([
    "EmptyView", "ErrorView", "SeriesGrid", "SkeletonGrid",
  ].map(name => [name, name]))
  const { SearchView } = loadModule("views/SearchView.js", {
    scripting,
    "./Common": { ...common, FILL_CENTER: {}, FILL_LEADING: {}, PAGE_FRAME: {}, BRAND_COLOR: "#EE5C62" },
    "../core/api": {
      /** Keep each search pending until its test supplies a response. */
      fetchSearch(query, page) {
        return new Promise((resolve, reject) => calls.push({ query, page, resolve, reject }))
      },
      fetchSuggest: async () => [{ name: "Suggested drama", keyword: "suggestion" }],
    },
  }, {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    Fragment: "Fragment",
    setTimeout: callback => { timers.set(++timerId, callback); return timerId },
    clearTimeout: id => timers.delete(id),
  })

  /** Walk only rendered children, leaving native view props untouched. */
  function nodes(node = tree) {
    if (Array.isArray(node)) return node.flatMap(child => nodes(child))
    if (!node || typeof node !== "object") return []
    return [node, ...nodes(node.children)]
  }

  /** Apply queued effects after a render, matching the component lifecycle. */
  function render() {
    cursor = 0
    tree = SearchView({
      /** Search tests do not navigate to a series detail page. */
      onSelectSeries() {},
    })
    for (const effect of pendingEffects.splice(0)) effect()
  }

  /** Find one rendered control by type and optional prop constraint. */
  function find(type, predicate = () => true) {
    return nodes().find(node => node.type === type && predicate(node.props))
  }

  /** Enter and submit through the production text field handlers. */
  function submit(query) {
    find("TextField").props.onChanged(query)
    render()
    void find("TextField").props.onSubmit()
    render()
  }

  /** Resolve a network turn and render the resulting state. */
  async function settle() {
    await new Promise(resolve => setImmediate(resolve))
    render()
  }

  render()
  return {
    calls, render, nodes, find, submit, settle,
    footer: () => find("VStack", props => Boolean(props.onScrollVisibilityChange)),
    ids: () => Array.from(find("SeriesGrid")?.props.seriesList || [], item => item.series_id),
    /** Run suggestion debounce callbacks without waiting on the clock. */
    flushTimers() { for (const callback of [...timers.values()]) callback(); timers.clear() },
    /** Execute effect cleanups to simulate leaving the search page. */
    unmount() { for (const slot of slots) slot?.cleanup?.() },
  }
}

test("API uses the verified page parameter and preserves pagination metadata", async () => {
  const urls = []
  const payload = resultPage("A & B", 2, ["b"])
  payload.totalCount = "30"
  const api = loadModule("core/api.js", {
    "./http": { HttpError: Error, getJson: async url => { urls.push(url); return payload } },
    "./config": { WEB_BASE: "https://hongguoduanju.com" },
  })
  const result = await api.fetchSearch("A & B", 2)
  assert.equal(urls[0], "https://hongguoduanju.com/api/search/result?query=A%20%26%20B&page=2")
  assert.equal(result.pageNum, 2)
  assert.equal(result.hasMore, true)
  assert.equal(result.totalCount, 30)
  await assert.rejects(api.fetchSearch("A", 0), /页码无效/)
  assert.equal(urls.length, 1)
})

test("API rejects missing pagination, wrong pages and empty nonterminal results", async () => {
  let payload = resultPage("A", 1, ["a"])
  const api = loadModule("core/api.js", {
    "./http": { HttpError: Error, getJson: async () => payload },
    "./config": { WEB_BASE: "https://hongguoduanju.com" },
  })
  delete payload.hasMore
  await assert.rejects(api.fetchSearch("A"), /分页格式异常/)
  payload = resultPage("A", 1, ["a"])
  await assert.rejects(api.fetchSearch("A", 2), /分页格式异常/)
  payload = resultPage("A", 1, [])
  await assert.rejects(api.fetchSearch("A"), /分页返回空结果/)
  payload = { ...resultPage("A", 1, [], false), totalCount: "0", totalPages: 0 }
  assert.equal((await api.fetchSearch("A")).hasMore, false)
})

test("repeated footer events request one next page, append uniquely and stop at the end", async () => {
  const view = createView()
  view.submit("A")
  view.calls[0].resolve(resultPage("A", 1, ["a", "b"]))
  await view.settle()
  const footer = view.footer()
  footer.props.onScrollVisibilityChange.onChanged(false)
  assert.equal(view.calls.length, 1)
  footer.props.onScrollVisibilityChange.onChanged(true)
  footer.props.onScrollVisibilityChange.onChanged(true)
  assert.equal(view.calls.length, 2)
  assert.equal(view.calls[1].page, 2)
  assert.deepEqual(view.ids(), ["a", "b"])
  view.calls[1].resolve(resultPage("A", 2, ["b", "c"], false))
  await view.settle()
  assert.deepEqual(view.ids(), ["a", "b", "c"])
  view.footer().props.onScrollVisibilityChange.onChanged(true)
  assert.equal(view.calls.length, 2)
})

test("failed pagination keeps results and retries the same page only after a tap", async () => {
  const view = createView()
  view.submit("A")
  view.calls[0].resolve(resultPage("A", 1, ["a"]))
  await view.settle()
  const oldFooter = view.footer()
  oldFooter.props.onScrollVisibilityChange.onChanged(true)
  view.calls[1].reject(new Error("offline"))
  await view.settle()
  oldFooter.props.onScrollVisibilityChange.onChanged(true)
  view.footer().props.onScrollVisibilityChange.onChanged(true)
  assert.equal(view.calls.length, 2)
  assert.deepEqual(view.ids(), ["a"])
  view.find("Button", props => props.title?.includes("offline")).props.action()
  assert.equal(view.calls[2].page, 2)
  view.calls[2].resolve(resultPage("A", 2, ["b"], false))
  await view.settle()
  assert.deepEqual(view.ids(), ["a", "b"])
})

test("a new keyword ignores an old page reply and stale footer handlers", async () => {
  const view = createView()
  view.submit("A")
  view.calls[0].resolve(resultPage("A", 1, ["a"]))
  await view.settle()
  const oldFooter = view.footer()
  oldFooter.props.onScrollVisibilityChange.onChanged(true)
  view.submit("B")
  view.calls[2].resolve(resultPage("B", 1, ["new"]))
  await view.settle()
  view.calls[1].resolve(resultPage("A", 2, ["old"], false))
  await view.settle()
  oldFooter.props.onScrollVisibilityChange.onChanged(true)
  assert.deepEqual(view.ids(), ["new"])
  assert.equal(view.calls.length, 3)
})

test("clearing and unmounting invalidate in-flight results", async () => {
  const view = createView()
  view.submit("A")
  view.find("Image", props => props.systemName === "xmark.circle.fill").props.onTapGesture()
  view.calls[0].resolve(resultPage("A", 1, ["old"]))
  await view.settle()
  assert.deepEqual(view.ids(), [])
  assert.equal(view.find("TextField").props.value, "")
  view.submit("B")
  view.unmount()
  view.calls[1].resolve(resultPage("B", 1, ["closed"]))
  await view.settle()
  assert.deepEqual(view.ids(), [])
})

test("suggestion rows submit through a full-width native button", async () => {
  const view = createView()
  view.find("TextField").props.onChanged("Sug")
  view.render()
  view.flushTimers()
  await view.settle()
  const row = view.find("Button", props => props.key === "suggestion-0")
  assert.ok(row)
  assert.equal(row.children[0].props.contentShape, "rect")
  row.props.action()
  assert.equal(view.calls[0].query, "Suggested drama")
  assert.equal(view.calls[0].page, 1)
})
