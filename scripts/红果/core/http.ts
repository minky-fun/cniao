import { fetch } from "scripting"
import {
  WEB_BASE,
  WEB_USER_AGENT,
  CRAWLER_USER_AGENT,
  REQUEST_TIMEOUT_SECONDS,
} from "./config"
import { extractRouterData, readLoaderEntry, RouterDataError, RouterDataRoot } from "./routerData"

export class HttpError extends Error {
  readonly status: number

  /** 保留 HTTP 状态供页面区分请求失败原因。 */
  constructor(message: string, status: number) {
    super(message)
    this.name = "HttpError"
    this.status = status
  }
}

interface RequestOptions {

  asCrawler?: boolean
}

/** 使用网页请求头读取公开页面或接口文本。 */
export async function getText(url: string, options: RequestOptions = {}): Promise<string> {
  const userAgent = options.asCrawler ? CRAWLER_USER_AGENT : WEB_USER_AGENT

  let response: Awaited<ReturnType<typeof fetch>>
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Referer: `${WEB_BASE}/`,
      },
      timeout: REQUEST_TIMEOUT_SECONDS,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new HttpError(`网络请求失败：${message}`, 0)
  }

  if (!response.ok) {
    throw new HttpError(`请求失败（HTTP ${response.status}）`, response.status)
  }

  return await response.text()
}

/** 从服务端渲染页面提取指定路由的加载数据。 */
export async function fetchLoaderEntry<T>(
  path: string,
  keyPrefix: string,
  options: RequestOptions = {}
): Promise<T> {
  const html = await getText(`${WEB_BASE}${path}`, options)

  let root: RouterDataRoot
  try {
    root = extractRouterData(html)
  } catch (error) {
    if (error instanceof RouterDataError) {
      throw new HttpError(`页面数据解析失败：${error.message}`, 0)
    }
    throw error
  }

  const entry = readLoaderEntry<T | null>(root, keyPrefix)
  if (entry === null || entry === undefined) {
    throw new HttpError("该内容不存在或已下架", 404)
  }

  return entry
}

/** 读取公开接口的 JSON 响应，并将格式错误转换为可读提示。 */
export async function getJson(url: string): Promise<unknown> {
  const text = await getText(url)
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError("接口返回了非 JSON 内容", 0)
  }
}
