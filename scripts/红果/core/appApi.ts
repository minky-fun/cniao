import { fetch } from "scripting"
import {
  APP_BASE,
  APP_COMMON_QUERY,
  APP_USER_AGENT,
  MEDIA_USER_AGENT,
  MEDIA_REFERER,
  REQUEST_TIMEOUT_SECONDS,
} from "./config"
import { base64Decode, popCount, utf8String } from "./bytes"
import { HttpError } from "./http"

interface VideoDefinition {

  quality_type?: number
  video_meta?: {

    codec_type?: string
    vwidth?: number
    vheight?: number

    bitrate?: number
    size?: number

    duration?: number
  }

  main_url?: string
  backup_url?: string
  url_list?: string[]

  encrypt_info?: {

    spade_a?: string

    kid?: string
  }
}

interface VideoModelPayload {
  video_duration?: number
  video_list?: VideoDefinition[] | Record<string, VideoDefinition>
}

interface VideoModelEntry {
  video_model?: string
}

const DEVICE_STORAGE_KEY = "hongguo-public-player-device"
const EMPTY_RESPONSE_ATTEMPTS = 3

/** 首次生成游客设备标识并持久保存，配置损坏或请求失败时不更换身份。 */
function loadDeviceIdentity(): { device_id: string; iid: string } {
  if (!Storage.contains(DEVICE_STORAGE_KEY)) {
    const identity = { device_id: "", iid: "" }
    for (const key of ["device_id", "iid"] as const) {
      let digits = String(1 + Math.floor(Math.random() * 8))
      for (let index = 0; index < 18; index++) digits += String(Math.floor(Math.random() * 10))
      identity[key] = digits
    }
    if (!Storage.set(DEVICE_STORAGE_KEY, identity)) {
      throw new HttpError("游客设备配置保存失败，请检查脚本存储", 0)
    }
  }
  const identity = Storage.get<Record<string, unknown>>(DEVICE_STORAGE_KEY)
  if (!identity || typeof identity !== "object" || Array.isArray(identity)
      || Object.keys(identity).length !== 2
      || typeof identity.device_id !== "string" || !/^[0-9]{19}$/.test(identity.device_id)
      || typeof identity.iid !== "string" || !/^[0-9]{19}$/.test(identity.iid)) {
    throw new HttpError("游客设备配置损坏，请检查脚本存储中的 hongguo-public-player-device", 0)
  }
  return { device_id: identity.device_id, iid: identity.iid }
}

/** 使用公开游客身份请求多集模型，仅对空的 HTTP 200 响应进行最多三次重试。 */
async function appPost<T>(path: string, payload: unknown): Promise<T> {
  const body = JSON.stringify(payload)
  const identity = loadDeviceIdentity()
  let text = ""

  for (let attempt = 0; attempt < EMPTY_RESPONSE_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise<void>(resolve => setTimeout(resolve, attempt * 500))
    const params: Record<string, string> = {
      ...APP_COMMON_QUERY,
      ...identity,
      _rticket: String(Date.now()),
    }
    const rawQuery = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&")

    let response: Awaited<ReturnType<typeof fetch>>
    try {
      response = await fetch(`${APP_BASE}${path}?${rawQuery}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
          "User-Agent": APP_USER_AGENT,
          "X-XS-From-Web": "0",
          "Sdk-Version": "2",
        },
        body,
        timeout: REQUEST_TIMEOUT_SECONDS,
      })
      if (!response.ok) {
        throw new HttpError(`App 接口返回 HTTP ${response.status}`, response.status)
      }
      text = await response.text()
    } catch (error) {
      if (error instanceof HttpError) throw error
      const message = error instanceof Error ? error.message : String(error)
      throw new HttpError(`App 接口请求失败：${message}`, 0)
    }

    if (text.trim()) break
    if (response.status !== 200 || attempt === EMPTY_RESPONSE_ATTEMPTS - 1) {
      throw new HttpError(`App 视频接口返回空响应（HTTP ${response.status}），请稍后重试`, 0)
    }
  }

  let json: { code?: number; message?: string; data?: unknown }
  try {
    json = JSON.parse(text) as { code?: number; message?: string; data?: unknown }
  } catch {
    throw new HttpError(`App 接口返回了非 JSON 内容（${path}）`, 0)
  }

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new HttpError("App 接口返回格式异常", 0)
  }

  if (json.code !== 0) {
    throw new HttpError(json.message ?? `App 接口错误（code ${json.code}）`, 0)
  }

  if (!json.data || typeof json.data !== "object" || Array.isArray(json.data)) {
    throw new HttpError("App 接口未返回有效的视频数据", 0)
  }

  return json.data as T
}

export function deriveContentKey(spadeA: string): Uint8Array | null {
  if (!spadeA) return null

  const raw = base64Decode(spadeA)
  if (raw.length < 4) return null

  const tagLength = (raw[0] ^ raw[1] ^ raw[2]) - 48
  const contentLength = raw.length - tagLength - 1
  if (tagLength < 1 || contentLength < 33 || contentLength >= raw.length) return null

  const decoded = new Uint8Array(contentLength)
  let evenPrev = 250
  let oddPrev = 85

  for (let i = 0; i < contentLength; i++) {
    const current = raw[1 + i]
    let previous: number
    if (i % 2 === 0) {
      previous = evenPrev
      evenPrev = current
    } else {
      previous = oddPrev
      oddPrev = current
    }
    decoded[i] = (previous ^ current) - 21 - popCount(i)
  }

  const padding = parseInt(String.fromCharCode(decoded[0]), 36)
  if (Number.isNaN(padding) || contentLength - padding - 1 !== 32) return null

  const keyChars = decoded.slice(1, 33)
  const key = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    key[i] = parseInt(utf8String(keyChars.slice(i * 2, i * 2 + 2)), 16)
  }
  return key
}

export interface EncryptedStream {

  url: string

  codec: string
  width: number
  height: number

  duration: number

  size: number

  contentKey: Uint8Array

  kid: string
}

function resolveUrl(value: string | undefined): string {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return ""
  if (/^https?:/i.test(trimmed)) return trimmed

  try {
    const decoded = utf8String(base64Decode(trimmed))
    return /^https?:/i.test(decoded) ? decoded : ""
  } catch {
    return ""
  }
}

function toEncryptedStream(
  definition: VideoDefinition,
  fallbackDuration: number
): EncryptedStream | null {
  const codec = definition.video_meta?.codec_type ?? ""

  if (codec !== "bytevc1") return null

  const spadeA = definition.encrypt_info?.spade_a
  if (!spadeA) return null
  const contentKey = deriveContentKey(spadeA)
  if (!contentKey) return null

  const url =
    resolveUrl(definition.main_url) ||
    resolveUrl(definition.backup_url) ||
    resolveUrl(definition.url_list?.[0])
  if (!url) return null

  const durationMs = definition.video_meta?.duration

  return {
    url,
    codec,
    width: definition.video_meta?.vwidth ?? 0,
    height: definition.video_meta?.vheight ?? 0,
    duration: durationMs ? durationMs / 1000 : fallbackDuration,
    size: definition.video_meta?.size ?? 0,
    contentKey,
    kid: definition.encrypt_info?.kid ?? "",
  }
}

/** 通过公开游客多集接口读取指定集数，筛除 bytevc2 并优先选择最高分辨率。 */
export async function fetchEncryptedStreams(videoId: string): Promise<EncryptedStream[]> {
  if (!/^[0-9]{8,24}$/.test(videoId)) throw new HttpError("视频 ID 不合法", 0)
  const data = await appPost<Record<string, VideoModelEntry>>(
    "/novel/player/multi_video_model/v1/",
    {
      mixed_video_id_map: { "1": [videoId] },
      biz_param: {
        detail_page_version: 0,
        device_level: 3,
        disable_digg_stat: false,
        disable_video_relate_book: false,
        need_all_video_definition: true,
        need_mp4_align: false,
        use_os_player: false,
        use_server_dns: false,
        video_platform: 1024,
      },
    }
  )

  const embedded = data[videoId]?.video_model
  if (!embedded) throw new HttpError("该集暂无可播放内容", 404)
  if (typeof embedded !== "string") throw new HttpError("播放信息格式异常", 0)

  let payload: VideoModelPayload
  try {
    payload = JSON.parse(embedded) as VideoModelPayload
  } catch {
    throw new HttpError("播放信息解析失败", 0)
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)
      || !payload.video_list || typeof payload.video_list !== "object") {
    throw new HttpError("播放信息缺少有效的视频列表", 0)
  }
  const definitions = Object.values(payload.video_list)
  const streams = definitions
    .map(definition => toEncryptedStream(definition, payload.video_duration ?? 0))
    .filter((stream): stream is EncryptedStream => stream !== null)

  return streams.sort((a, b) => b.height - a.height)
}

export async function downloadStream(url: string): Promise<Uint8Array> {
  let response: Awaited<ReturnType<typeof fetch>>
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": MEDIA_USER_AGENT,
        Referer: MEDIA_REFERER,
      },
      timeout: 120,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new HttpError(`媒体下载失败：${message}`, 0)
  }

  if (!response.ok) {
    throw new HttpError(`媒体下载返回 HTTP ${response.status}`, response.status)
  }

  return new Uint8Array(await response.arrayBuffer())
}
