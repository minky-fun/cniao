const ROUTER_DATA_MARKER = "_ROUTER_DATA"

const MAX_HTML_LENGTH = 4 * 1024 * 1024

export interface RouterDataRoot {
  loaderData: Record<string, unknown>
  errors?: unknown
}

export class RouterDataError extends Error {
  /** 保留详情页路由解析错误的类型和提示信息。 */
  constructor(message: string) {
    super(message)
    this.name = "RouterDataError"
  }
}

/** 跳过字符串转义，定位嵌入 JSON 对象的结束边界。 */
function findObjectEnd(source: string, startIndex: number): number {
  let depth = 0
  let isInString = false
  let isEscaped = false

  for (let i = startIndex; i < source.length; i++) {
    const char = source[i]

    if (isInString) {
      if (isEscaped) {
        isEscaped = false
      } else if (char === "\\") {
        isEscaped = true
      } else if (char === '"') {
        isInString = false
      }
      continue
    }

    if (char === '"') {
      isInString = true
    } else if (char === "{") {
      depth++
    } else if (char === "}") {
      depth--
      if (depth === 0) return i + 1
    }
  }

  return -1
}

/** 从公开详情页中提取服务端路由数据。 */
export function extractRouterData(html: string): RouterDataRoot {
  if (!html) throw new RouterDataError("页面内容为空")
  if (html.length > MAX_HTML_LENGTH) {
    throw new RouterDataError(`页面体积异常（${html.length} 字节）`)
  }

  let searchFrom = 0
  let lastError = ""

  while (searchFrom < html.length) {
    const markerIndex = html.indexOf(ROUTER_DATA_MARKER, searchFrom)
    if (markerIndex < 0) break
    searchFrom = markerIndex + ROUTER_DATA_MARKER.length

    const objectStart = html.indexOf("{", searchFrom)
    if (objectStart < 0) break

    const objectEnd = findObjectEnd(html, objectStart)
    if (objectEnd < 0) {
      lastError = "JSON 结构未配平"
      continue
    }

    try {
      const parsed = JSON.parse(html.slice(objectStart, objectEnd))
      if (parsed && typeof parsed === "object" && "loaderData" in parsed) {
        return parsed as RouterDataRoot
      }
      lastError = "缺少 loaderData 字段"
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    searchFrom = objectEnd
  }

  throw new RouterDataError(
    lastError ? `解析 _ROUTER_DATA 失败：${lastError}` : "页面中未找到 _ROUTER_DATA"
  )
}

/** 按已知节点前缀读取路由加载结果。 */
export function readLoaderEntry<T>(root: RouterDataRoot, keyPrefix: string): T {
  const entries = root.loaderData ?? {}

  for (const key of Object.keys(entries)) {
    if (!key.startsWith(keyPrefix)) continue

    const value = entries[key]
    if (value === null || value === undefined) continue

    return value as T
  }

  throw new RouterDataError(`页面数据缺少 ${keyPrefix} 节点`)
}
