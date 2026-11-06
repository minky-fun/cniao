import { fetch } from "scripting"
import {
  MEDIA_USER_AGENT,
  MEDIA_REFERER,
} from "./config"
import { base64Decode, popCount, utf8String } from "./bytes"
import { HttpError } from "./http"
import { getPlaybackIdentity, PLAYBACK_QUERY, PLAYBACK_USER_AGENT } from "./playbackIdentity"
import { signPlayback } from "./playbackSign"

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

const VIDEO_MODEL_PATH = "/novel/player/multi_video_model/v1/"
// These official hosts and the signed POST envelope are verified against desktop 1.2.21.
const VIDEO_API_BASES = [
  "https://api5-normal-sinfonlinec.fqnovel.com",
  "https://api5-normal-lq.fqnovel.com",
  "https://api5-normal-hl.fqnovel.com",
]
let preferredVideoApiBase = VIDEO_API_BASES[0]

/** Use desktop's signed playback request, refreshing a rejected anonymous identity once. */
async function fetchVideoModel(videoId: string): Promise<VideoModelEntry> {
  let identity = await getPlaybackIdentity()
  let lastError = new HttpError("视频接口返回空响应，已尝试备用节点和更新游客身份，请稍后重试", 0)
  for (let round = 0; round < 2; round++) {
    const bases = [preferredVideoApiBase, ...VIDEO_API_BASES.filter(base => base !== preferredVideoApiBase)]
    let idType = "1004"
    let receivedEmpty = false
    for (let index = 0; index < bases.length; index++) {
      const base = bases[index]
      const body = JSON.stringify({
        biz_param: { detail_page_version: 0, device_level: 3, disable_digg_stat: false,
          need_all_video_definition: true, need_mp4_align: false, use_os_player: false,
          use_server_dns: false, video_platform: 1024 },
        mixed_video_id_map: { [idType]: [videoId] },
      })
      const signed = signPlayback({ ...PLAYBACK_QUERY, device_id: identity.deviceId, iid: identity.installId }, body)
      let text: string
      try {
        const response = await fetch(`${base}${VIDEO_MODEL_PATH}?${signed.query}`, {
          method: "POST", body, timeout: 8,
          headers: { ...signed.headers, "User-Agent": PLAYBACK_USER_AGENT,
            Accept: "application/json; charset=utf-8,application/x-protobuf",
            "Content-Type": "application/json; charset=utf-8",
            "X-Xs-From-Web": "0", "Sdk-Version": "2", "X-Vc-Bdturing-Sdk-Version": "4.0.3.cn",
            "Passport-Sdk-Version": "5051452", Lc: "101", "X-Ss-Dp": "8662",
            "X-Tt-Store-Region": "cn", "X-Tt-Store-Region-Src": "did", "X-Tt-Dt": identity.deviceToken,
            Cookie: Object.entries(identity.cookies).map(([key, value]) => `${key}=${value}`).join("; "),
          },
        })
        if (!response.ok) throw new HttpError(`视频接口返回 HTTP ${response.status}`, response.status)
        text = await response.text()
      } catch (error) {
        lastError = error instanceof HttpError ? error
          : new HttpError("视频接口请求失败：网络连接中断或超时，请检查网络后重试", 0)
        if (lastError.status !== 0 && lastError.status !== 408 && lastError.status !== 429
            && lastError.status < 500) throw lastError
        continue
      }
      if (!text.trim()) {
        receivedEmpty = true
        lastError = new HttpError("视频接口返回空响应，已尝试备用节点和更新游客身份，请稍后重试", 0)
        continue
      }
      let json: { code?: number; data?: Record<string, VideoModelEntry> }
      try { json = JSON.parse(text) as typeof json } catch {
        throw new HttpError("视频接口返回了非 JSON 内容", 0)
      }
      if (!json || typeof json !== "object" || Array.isArray(json)) throw new HttpError("视频接口返回格式异常", 0)
      if (json.code === 100100 && idType === "1004") {
        idType = "1001"
        index--
        continue
      }
      if (json.code !== 0) throw new HttpError(`视频接口错误（code ${json.code}）`, 0)
      if (!json.data || typeof json.data !== "object" || Array.isArray(json.data)) {
        throw new HttpError("视频接口未返回有效的视频数据", 0)
      }
      const entry = json.data[videoId]
      if (!entry) throw new HttpError("该集暂无可播放内容", 404)
      if (typeof entry.video_model !== "string" || !entry.video_model.trim()) {
        throw new HttpError("该集未返回有效的视频模型", 0)
      }
      preferredVideoApiBase = base
      return entry
    }
    if (round === 0 && receivedEmpty) identity = await getPlaybackIdentity(identity)
    else break
  }
  throw lastError
}

/** Decode the media content key carried by the verified playback model. */
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

  backupUrls: string[]

  codec: string
  width: number
  height: number

  duration: number

  size: number

  contentKey: Uint8Array

  kid: string
}

/** 解析接口提供的明文或 Base64 媒体地址。 */
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

/** 保留同一清晰度的主备地址及对应密钥，供下载失败后切换节点。 */
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

  const urls = [...new Set([
    definition.main_url,
    definition.backup_url,
    ...(definition.url_list ?? []),
  ].map(resolveUrl).filter(url => url !== ""))]
  if (urls.length === 0) return null

  const durationMs = definition.video_meta?.duration

  return {
    url: urls[0],
    backupUrls: urls.slice(1),
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

/** 有限重试临时下载故障，优先切换同清晰度备用地址，并拒绝空文件或不完整响应。 */
export async function downloadStream(url: string, backupUrls: string[] = []): Promise<Uint8Array> {
  const pendingUrls = [...new Set([url, ...backupUrls])]
  const maxAttempts = Math.max(3, pendingUrls.length)
  let lastError = new HttpError("媒体下载失败，请稍后重试", 0)

  for (let attempt = 0; attempt < maxAttempts && pendingUrls.length > 0; attempt++) {
    if (attempt > 0) await new Promise<void>(resolve => setTimeout(resolve, attempt * 1000))
    const currentUrl = pendingUrls.shift()!
    try {
      const response = await fetch(currentUrl, {
        headers: {
          "User-Agent": MEDIA_USER_AGENT,
          Referer: MEDIA_REFERER,
        },
        timeout: 120,
      })
      if (!response.ok) {
        throw new HttpError(`媒体下载返回 HTTP ${response.status}`, response.status)
      }
      if (response.status !== 200) {
        throw new HttpError("媒体下载未返回完整文件，请稍后重试", 0)
      }

      const bytes = new Uint8Array(await response.arrayBuffer())
      const expectedLength = response.expectedContentLength
      if (bytes.length === 0 || (expectedLength !== undefined && expectedLength > 0
          && bytes.length !== expectedLength)) {
        throw new HttpError("媒体下载文件不完整，请稍后重试", 0)
      }
      return bytes
    } catch (error) {
      lastError = error instanceof HttpError
        ? error
        : new HttpError("媒体下载失败：网络连接中断或超时，请检查网络后重试", 0)
      const status = lastError.status
      if (status === 0 || status === 408 || status === 429 || status >= 500) {
        pendingUrls.push(currentUrl)
      }
    }
  }

  throw lastError
}
