import { AbortController, fetch, type AbortSignal } from "scripting"
import { randomBytes } from "node:crypto"
import { fetchEncryptedStreams } from "./appApi"
import { readUint32, utf8String } from "./bytes"
import { isOfflineVideoCached } from "./mediaCache"
import { resolvePlaybackSource } from "./playbackSource"
import { decryptMovieRange, prepareRangeMovie } from "./mp4Range"
import type { SeriesDetail } from "./types"

export interface FeedPlaybackSource { url: string; dispose: () => void }
const CHUNK_BYTES = 1024 * 1024
const MAX_HEADER_BYTES = 8 * 1024 * 1024

/** 解析播放器单区间请求，并限制单次缓冲大小，避免开放区间触发整集等待。 */
export function feedByteRange(value: string, total: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value)
  if (!match || (!match[1] && !match[2])) return null
  let start: number, end: number
  if (!match[1]) {
    const suffix = Number(match[2])
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null
    start = Math.max(0, total - suffix)
    end = total - 1
  } else {
    start = Number(match[1])
    end = match[2] ? Number(match[2]) : total - 1
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= total || end < start) return null
  return { start, end: Math.min(end, total - 1, start + CHUNK_BYTES - 1) }
}

/** 为刷剧建立仅监听本机的分段解密源，已有完整离线缓存则直接复用。 */
export async function prepareFeedPlayback(
  seriesId: string, detail: SeriesDetail, vid: string, signal: AbortSignal,
): Promise<FeedPlaybackSource> {
  signal.throwIfAborted()
  if (isOfflineVideoCached(vid)) {
    const source = await resolvePlaybackSource(seriesId, detail, vid)
    signal.throwIfAborted()
    return { url: source.url, dispose: () => {} }
  }
  const streams = await fetchEncryptedStreams(vid)
  signal.throwIfAborted()
  // 刷剧优先不超过 720p 的已知清晰度；服务端仅提供一个清晰度时使用该项。
  const stream = streams.find(item => Math.min(item.width, item.height) > 0 && Math.min(item.width, item.height) <= 720) ?? streams[0]
  if (!stream) throw new Error("该集暂无可用清晰度")
  const controller = new AbortController()
  let server: HttpServer | undefined, closed = false, total = 0, preferredUrl = 0
  let cached: { start: number; bytes: Uint8Array } | undefined
  /** 切页、退出或后台时释放监听和在途片段，不保存未完整下载的视频。 */
  const dispose = () => {
    if (closed) return
    closed = true
    signal.removeEventListener("abort", dispose)
    controller.abort()
    server?.stop()
    cached = undefined
  }
  signal.addEventListener("abort", dispose)
  const urls = [...new Set([stream.url, ...stream.backupUrls])]
  /** 校验上游确实返回请求的字节范围，主节点故障后有限切换同清晰度备用节点。 */
  const readRange = async (start: number, end: number): Promise<Uint8Array> => {
    controller.signal.throwIfAborted()
    for (let attempt = 0; attempt < urls.length; attempt++) {
      const candidate = (preferredUrl + attempt) % urls.length
      try {
        const response = await fetch(urls[candidate], {
          headers: { Range: `bytes=${start}-${end}`, "Accept-Encoding": "identity" },
          signal: controller.signal, timeout: 12,
        })
        const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") ?? "")
        if (response.status !== 206 || !range) throw new Error("视频节点未返回分段内容")
        const size = Number(range[3]), last = Math.min(end, size - 1)
        if (!Number.isSafeInteger(size) || size <= 0 || (total && size !== total)
            || Number(range[1]) !== start || Number(range[2]) !== last) throw new Error("视频节点分段范围异常")
        const bytes = new Uint8Array(await response.arrayBuffer())
        controller.signal.throwIfAborted()
        if (bytes.length !== last - start + 1) throw new Error("视频片段不完整")
        total = size
        preferredUrl = candidate
        return bytes
      } catch {
        controller.signal.throwIfAborted()
      }
    }
    throw new Error("视频片段加载失败，请重试或切换网络")
  }
  try {
    const first = await readRange(0, 65535)
    let position = 0, movie: ReturnType<typeof prepareRangeMovie> | undefined
    for (let box = 0; box < 64 && position + 8 <= total; box++) {
      const head = position + 16 <= first.length ? first.subarray(position, position + 16) : await readRange(position, position + 15)
      const shortSize = readUint32(head, 0), type = utf8String(head.subarray(4, 8))
      const size = shortSize === 1 ? Number(new DataView(head.buffer, head.byteOffset + 8, 8).getBigUint64(0))
        : shortSize === 0 ? total - position : shortSize
      if (!Number.isSafeInteger(size) || size < (shortSize === 1 ? 16 : 8) || position + size > total) throw new Error("视频容器结构异常")
      if (type === "moov") {
        if (size > MAX_HEADER_BYTES) throw new Error("视频索引过大")
        const header = position + size <= first.length ? first.slice(position, position + size) : await readRange(position, position + size - 1)
        movie = prepareRangeMovie(header, position, total)
        break
      }
      position += size
    }
    if (!movie) throw new Error("视频缺少可用的播放索引")
    const prepared = movie
    controller.signal.throwIfAborted()
    server = new HttpServer()
    server.listenAddressIPv4 = "127.0.0.1"
    const route = `/${randomBytes(16).toString("hex")}.mp4`
    server.registerAsyncHandler(route, async request => {
      const headers: Record<string, string> = { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Cache-Control": "no-store" }
      if (closed) return HttpResponse.raw(410, "Gone")
      if (request.method === "HEAD") return HttpResponse.raw(200, "OK", { headers: { ...headers, "Content-Length": String(total) } })
      if (request.method !== "GET") return HttpResponse.raw(405, "Method Not Allowed", { headers: { Allow: "GET, HEAD" } })
      const value = Object.entries(request.headers).find(([name]) => name.toLowerCase() === "range")?.[1]
      const range = value ? feedByteRange(value, total) : null
      if (!range) return HttpResponse.raw(416, "Range Not Satisfiable", { headers: { ...headers, "Content-Range": `bytes */${total}` } })
      try {
        const { start, end } = range
        let bytes: Uint8Array
        if (cached && start >= cached.start && end < cached.start + cached.bytes.length) {
          bytes = cached.bytes.slice(start - cached.start, end - cached.start + 1)
        } else if (start >= prepared.offset && end < prepared.offset + prepared.header.length) {
          bytes = prepared.header.slice(start - prepared.offset, end - prepared.offset + 1)
        } else {
          const encrypted = start === 0 && end < first.length ? first.slice(start, end + 1) : await readRange(start, end)
          bytes = await decryptMovieRange(prepared, stream.contentKey, start, encrypted)
          if (!closed) cached = { start, bytes }
        }
        if (closed) return HttpResponse.raw(410, "Gone")
        const body = Data.fromUint8Array(bytes)
        if (!body) throw new Error("视频片段无法转换")
        return HttpResponse.raw(206, "Partial Content", { headers: { ...headers,
          "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(bytes.length),
        }, body })
      } catch {
        return HttpResponse.raw(closed ? 410 : 502, closed ? "Gone" : "Bad Gateway")
      }
    })
    const error = server.start({ port: 0, forceIPv4: true })
    if (error || !server.port) throw new Error("本地播放服务启动失败，请重新打开脚本")
    controller.signal.throwIfAborted()
    return { url: `http://127.0.0.1:${server.port}${route}`, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
