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
const VIDEO_TAB_PATH = "/reading/bookapi/video_tab/multi_video_model/v1/"

/** 生成并持久使用播放请求所需的 UUID 形式 cdid。 */
function createCdid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, char => {
    const value = Math.floor(Math.random() * 16)
    return (char === "x" ? value : (value & 3) | 8).toString(16)
  })
}

/** 保存播放设备标识，并为旧版已保存的身份补充 video_tab 所需的 cdid。 */
function loadDeviceIdentity(): { device_id: string; iid: string; cdid: string } {
  if (!Storage.contains(DEVICE_STORAGE_KEY)) {
    const identity = { device_id: "", iid: "", cdid: "" }
    for (const key of ["device_id", "iid"] as const) {
      let digits = String(1 + Math.floor(Math.random() * 8))
      for (let index = 0; index < 18; index++) digits += String(Math.floor(Math.random() * 10))
      identity[key] = digits
    }
    identity.cdid = createCdid()
    if (!Storage.set(DEVICE_STORAGE_KEY, identity)) {
      throw new HttpError("游客设备配置保存失败，请检查脚本存储", 0)
    }
  }
  const identity = Storage.get<Record<string, unknown>>(DEVICE_STORAGE_KEY)
  if (!identity || typeof identity !== "object" || Array.isArray(identity)
      || typeof identity.device_id !== "string" || !/^[0-9]{19}$/.test(identity.device_id)
      || typeof identity.iid !== "string" || !/^[0-9]{19}$/.test(identity.iid)
      || Object.keys(identity).some(key => !["device_id", "iid", "cdid"].includes(key))
      || (identity.cdid !== undefined && (typeof identity.cdid !== "string"
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(identity.cdid)))) {
    throw new HttpError("游客设备配置损坏，请检查脚本存储中的 hongguo-public-player-device", 0)
  }
  if (!identity.cdid) {
    identity.cdid = createCdid()
    if (!Storage.set(DEVICE_STORAGE_KEY, identity)) {
      throw new HttpError("游客设备配置保存失败，请检查脚本存储", 0)
    }
  }
  return { device_id: identity.device_id, iid: identity.iid, cdid: identity.cdid as string }
}

/** 按桌面版优先使用的 video_tab GET 协议读取指定集的播放模型。 */
async function fetchVideoModel(videoId: string): Promise<VideoModelEntry> {
  const identity = loadDeviceIdentity()
  const params: Record<string, string> = {
    ...APP_COMMON_QUERY,
    ...identity,
    _rticket: String(Date.now()),
    video_id: videoId,
    video_id_type: "0",
    device_level: "1",
    need_all_video_definition: "1",
    need_mp4_align: "0",
    use_os_player: "0",
    video_platform: "1024",
    source: "0",
    from_video_id: "",
  }
  const rawQuery = Object.keys(params).sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&")

  let text: string
  try {
    const response = await fetch(`${APP_BASE}${VIDEO_TAB_PATH}?${rawQuery}`, {
      method: "GET",
      headers: {
        Accept: "application/json; charset=utf-8",
        "User-Agent": APP_USER_AGENT,
      },
      timeout: REQUEST_TIMEOUT_SECONDS,
    })
    if (!response.ok) throw new HttpError(`视频接口返回 HTTP ${response.status}`, response.status)
    text = await response.text()
  } catch (error) {
    if (error instanceof HttpError) throw error
    const message = error instanceof Error ? error.message : String(error)
    throw new HttpError(`视频接口请求失败：${message}`, 0)
  }
  if (!text.trim()) throw new HttpError("视频接口返回空响应，请稍后重试", 0)

  let json: { code?: number; message?: string; data?: { video_model_data?: Record<string, VideoModelEntry> } }
  try {
    json = JSON.parse(text) as typeof json
  } catch {
    throw new HttpError("视频接口返回了非 JSON 内容", 0)
  }

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new HttpError("视频接口返回格式异常", 0)
  }

  if (json.code !== 0) {
    throw new HttpError(json.message ?? `视频接口错误（code ${json.code}）`, 0)
  }

  if (!json.data || typeof json.data !== "object" || Array.isArray(json.data)) {
    throw new HttpError("视频接口未返回有效的视频数据", 0)
  }

  const entry = json.data.video_model_data?.[videoId]
  if (!entry) throw new HttpError("该集暂无可播放内容", 404)
  return entry
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

/** 从 video_tab 模型中筛除 bytevc2，并优先选择最高分辨率。 */
export async function fetchEncryptedStreams(videoId: string): Promise<EncryptedStream[]> {
  if (!/^[0-9]{8,24}$/.test(videoId)) throw new HttpError("视频 ID 不合法", 0)
  const embedded = (await fetchVideoModel(videoId)).video_model
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
