import { fetch } from "scripting"
import {
  APP_BASE,
  APP_COMMON_QUERY,
  APP_USER_AGENT,
  MEDIA_USER_AGENT,
  MEDIA_REFERER,
  REQUEST_TIMEOUT_SECONDS,
} from "./config"
import { base64Decode, gzipEncode, popCount, utf8Bytes, utf8String } from "./bytes"
import { buildRawQuery, signRequest } from "./appSign"
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
  video_list?: VideoDefinition[]
}

interface MultiVideoModelEntry {

  video_model?: string
  video_width?: number
  video_height?: number
  expire_time?: number
}

async function appPost<T>(path: string, payload: unknown): Promise<T> {
  const body = gzipEncode(utf8Bytes(JSON.stringify(payload)))

  const nowSeconds = Math.floor(Date.now() / 1000)
  const params: Record<string, string> = {
    ...APP_COMMON_QUERY,
    _rticket: String(Date.now()),
  }
  const rawQuery = buildRawQuery(params)
  const signature = signRequest(rawQuery, body, nowSeconds)

  let response: Awaited<ReturnType<typeof fetch>>
  try {
    response = await fetch(`${APP_BASE}${path}?${rawQuery}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
        Accept: "application/json",
        "User-Agent": APP_USER_AGENT,
        "X-XS-From-Web": "0",
        "Sdk-Version": "2",
        "X-Khronos": signature.khronos,
        "X-Gorgon": signature.gorgon,
        "X-SS-STUB": signature.stub,
        "X-SS-Req-Ticket": signature.reqTicket,
      },
      body,
      timeout: REQUEST_TIMEOUT_SECONDS,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new HttpError(`App 接口请求失败：${message}`, 0)
  }

  if (!response.ok) {
    throw new HttpError(`App 接口返回 HTTP ${response.status}`, response.status)
  }

  const text = await response.text()
  if (!text) {

    throw new HttpError(`App 接口返回空响应（${path}）`, 0)
  }

  let json: { code?: number; message?: string; data?: unknown }
  try {
    json = JSON.parse(text) as { code?: number; message?: string; data?: unknown }
  } catch {
    throw new HttpError(`App 接口返回了非 JSON 内容（${path}）`, 0)
  }

  if (json.code !== 0) {
    throw new HttpError(json.message ?? `App 接口错误（code ${json.code}）`, 0)
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

export async function fetchEncryptedStreams(videoId: string): Promise<EncryptedStream[]> {
  const data = await appPost<Record<string, MultiVideoModelEntry>>(
    "/novel/player/multi_video_model/preload/v1",
    {
      biz_param: { need_all_video_definition: true, video_platform: 1024 },
      dr_scene: "preload",

      mixed_video_id_map: { "1004": [videoId] },
    }
  )

  const embedded = data?.[videoId]?.video_model
  if (!embedded) throw new HttpError("该集暂无可播放内容", 404)

  let payload: VideoModelPayload
  try {
    payload = JSON.parse(embedded) as VideoModelPayload
  } catch {
    throw new HttpError("播放信息解析失败", 0)
  }

  const definitions = payload.video_list ?? []
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
