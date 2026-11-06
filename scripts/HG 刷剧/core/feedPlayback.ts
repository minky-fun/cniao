import { AbortController, fetch, type AbortSignal } from "scripting"
import { fetchEncryptedStreams } from "./appApi"
import { readUint32, utf8String } from "./bytes"
import { isOfflineVideoCached } from "./mediaCache"
import { resolvePlaybackSource } from "./playbackSource"
import { decryptMovieRange, prepareRangeMovie } from "./mp4Range"
import type { SeriesDetail } from "./types"
import { startVideoRangeServer } from "./rangeServer"

export interface FeedPlaybackSource { url: string; dispose: () => void }
const MAX_HEADER_BYTES = 8 * 1024 * 1024

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
  let server: FeedPlaybackSource | undefined, closed = false, total = 0, preferredUrl = 0
  let cached: { start: number; bytes: Uint8Array } | undefined
  /** 切页、退出或后台时释放监听和在途片段，不保存未完整下载的视频。 */
  const dispose = () => {
    if (closed) return
    closed = true
    signal.removeEventListener("abort", dispose)
    controller.abort()
    server?.dispose()
    cached = undefined
  }
  signal.addEventListener("abort", dispose)
  const urls = [...new Set([stream.url, ...stream.backupUrls])]
  /** 校验上游确实返回请求的字节范围，主节点故障后有限切换同清晰度备用节点。 */
  const readRange = async (start: number, end: number, requestSignal = controller.signal): Promise<Uint8Array> => {
    requestSignal.throwIfAborted()
    for (let attempt = 0; attempt < urls.length; attempt++) {
      const candidate = (preferredUrl + attempt) % urls.length
      try {
        const response = await fetch(urls[candidate], {
          headers: { Range: `bytes=${start}-${end}`, "Accept-Encoding": "identity" },
          signal: requestSignal, timeout: 12,
        })
        const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") ?? "")
        if (response.status !== 206 || !range) throw new Error("视频节点未返回分段内容")
        const size = Number(range[3]), last = Math.min(end, size - 1)
        if (!Number.isSafeInteger(size) || size <= 0 || (total && size !== total)
            || Number(range[1]) !== start || Number(range[2]) !== last) throw new Error("视频节点分段范围异常")
        const bytes = new Uint8Array(await response.arrayBuffer())
        requestSignal.throwIfAborted()
        if (bytes.length !== last - start + 1) throw new Error("视频片段不完整")
        total = size
        preferredUrl = candidate
        return bytes
      } catch {
        requestSignal.throwIfAborted()
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
    server = await startVideoRangeServer(total, controller.signal, async (start, end, requestSignal) => {
      if (cached && start >= cached.start && end < cached.start + cached.bytes.length) {
        return cached.bytes.slice(start - cached.start, end - cached.start + 1)
      }
      if (start >= prepared.offset && end < prepared.offset + prepared.header.length) {
        return prepared.header.slice(start - prepared.offset, end - prepared.offset + 1)
      }
      const encrypted = start === 0 && end < first.length ? first.slice(start, end + 1) : await readRange(start, end, requestSignal)
      const bytes = await decryptMovieRange(prepared, stream.contentKey, start, encrypted)
      requestSignal.throwIfAborted()
      if (!closed) cached = { start, bytes }
      return bytes
    })
    controller.signal.throwIfAborted()
    return { url: server.url, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
