import { fetchEncryptedStreams, downloadStream, type EncryptedStream } from "./appApi"
import { decryptToPlayableAsync } from "./mp4"
import { PLAYBACK_CACHE_DIR, PLAYBACK_CACHE_MAX_BYTES, PLAYBACK_CACHE_MAX_ENTRIES } from "./config"
import { HttpError } from "./http"
import type { VideoPlayerInfo } from "./types"

const CACHE_FILE_EXTENSION = ".mp4"

const INDEX_FILE_NAME = "cache-index.json"

const INDEX_VERSION = 1

function cacheDirectory(): string {
  return `${FileManager.appGroupDocumentsDirectory}/${PLAYBACK_CACHE_DIR}`
}

function ensureCacheDirectory(): void {
  const directory = cacheDirectory()
  if (!FileManager.existsSync(directory)) {
    FileManager.createDirectorySync(directory, true)
  }
}

function cachePath(videoId: string): string {
  return `${cacheDirectory()}/${videoId}${CACHE_FILE_EXTENSION}`
}

function indexFilePath(): string {
  return `${cacheDirectory()}/${INDEX_FILE_NAME}`
}

interface IndexRecord {

  label: string

  lastUsedAt: number

  duration?: number

  width?: number

  height?: number
}

export interface CacheEntry {
  videoId: string
  label: string
  sizeBytes: number
  lastUsedAt: number
}

type CacheIndex = Record<string, IndexRecord>

function readIndex(): CacheIndex {
  const path = indexFilePath()
  if (!FileManager.existsSync(path)) return {}

  try {
    const parsed = JSON.parse(FileManager.readAsStringSync(path)) as {
      version?: number
      entries?: CacheIndex
    }
    if (parsed?.version !== INDEX_VERSION || !parsed.entries) return {}
    return parsed.entries
  } catch (error) {

    console.warn("[cache] 索引解析失败，已重建", error)
    return {}
  }
}

function writeIndex(index: CacheIndex): void {
  try {
    FileManager.writeAsStringSync(
      indexFilePath(),
      JSON.stringify({ version: INDEX_VERSION, entries: index })
    )
  } catch (error) {

    console.warn("[cache] 索引写入失败", error)
  }
}

export function listOfflineCache(): CacheEntry[] {
  const directory = cacheDirectory()
  if (!FileManager.existsSync(directory)) return []

  const index = readIndex()
  const entries: CacheEntry[] = []

  for (const name of FileManager.readDirectorySync(directory)) {
    if (!name.endsWith(CACHE_FILE_EXTENSION)) continue

    const path = `${directory}/${name}`
    let stat: FileStat
    try {
      stat = FileManager.statSync(path)
    } catch (error) {
      console.warn(`[cache] 跳过无法读取的条目 ${name}`, error)
      continue
    }

    const videoId = name.slice(0, -CACHE_FILE_EXTENSION.length)
    const record = index[videoId]

    entries.push({
      videoId,
      label: record?.label ?? "",
      sizeBytes: stat.size,

      lastUsedAt: record?.lastUsedAt ?? stat.modificationDate,
    })
  }

  return entries
}

export function offlineCacheSize(): number {
  return listOfflineCache().reduce((sum, entry) => sum + entry.sizeBytes, 0)
}

function markUsed(
  videoId: string,
  label?: string,
  meta?: { duration?: number; width?: number; height?: number }
): void {
  const index = readIndex()
  const existing = index[videoId]
  index[videoId] = {
    label: label ?? existing?.label ?? "",
    lastUsedAt: Date.now(),
    duration: meta?.duration ?? existing?.duration,
    width: meta?.width ?? existing?.width,
    height: meta?.height ?? existing?.height,
  }
  writeIndex(index)
}

export function getCachedVideoMeta(videoId: string): {
  duration?: number
  width?: number
  height?: number
} | null {
  const index = readIndex()
  const record = index[videoId]
  if (!record) return null
  return {
    duration: record.duration,
    width: record.width,
    height: record.height,
  }
}

function forget(videoId: string, index: CacheIndex): void {
  delete index[videoId]
}

export interface CacheLimits {

  maxBytes: number

  maxEntries: number
}

const DEFAULT_LIMITS: CacheLimits = {
  maxBytes: PLAYBACK_CACHE_MAX_BYTES,
  maxEntries: PLAYBACK_CACHE_MAX_ENTRIES,
}

export function selectEvictions(
  entries: CacheEntry[],
  limits: CacheLimits,
  protectedVideoIds: string[] = []
): CacheEntry[] {
  const protectedSet = new Set(protectedVideoIds)

  const removable = entries
    .filter(entry => !protectedSet.has(entry.videoId))
    .sort((a, b) => a.lastUsedAt - b.lastUsedAt)

  let totalBytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0)
  let totalCount = entries.length
  const evicted: CacheEntry[] = []

  for (const candidate of removable) {
    const isOverBytes = totalBytes > limits.maxBytes
    const isOverEntries = totalCount > limits.maxEntries
    if (!isOverBytes && !isOverEntries) break

    totalBytes -= candidate.sizeBytes
    totalCount -= 1
    evicted.push(candidate)
  }

  return evicted
}

export function enforceCacheLimit(
  protectedVideoIds: string[] = [],
  limits: CacheLimits = DEFAULT_LIMITS
): number {
  const entries = listOfflineCache()
  if (entries.length === 0) return 0

  const victims = selectEvictions(entries, limits, protectedVideoIds)
  if (victims.length === 0) return 0

  const index = readIndex()
  let removedCount = 0

  for (const victim of victims) {
    try {
      FileManager.removeSync(cachePath(victim.videoId))
    } catch (error) {
      console.warn(`[cache] 淘汰失败 ${victim.videoId}`, error)
      continue
    }

    forget(victim.videoId, index)
    removedCount += 1
  }

  if (removedCount > 0) {
    writeIndex(index)
    const remainingBytes = entries
      .filter(entry => !victims.some(victim => victim.videoId === entry.videoId))
      .reduce((sum, entry) => sum + entry.sizeBytes, 0)
    console.log(`[cache] 已淘汰 ${removedCount} 集，当前占用 ${remainingBytes} 字节`)
  }

  return removedCount
}

export function pruneOfflineCache(): number {
  const directory = cacheDirectory()
  if (!FileManager.existsSync(directory)) return 0
  return enforceCacheLimit()
}

export interface PrepareProgress {

  stage: "fetching" | "downloading" | "decrypting" | "validating" | "done"

  progress: number
}

export interface PrepareOptions {

  label?: string

  onProgress?: (progress: PrepareProgress) => void

  protectedVideoIds?: string[]
}

export function isOfflineVideoCached(videoId: string): boolean {
  if (!videoId) return false
  const target = cachePath(videoId)
  return FileManager.existsSync(target)
}

export function listCachedVideoIds(): Set<string> {
  const ids = new Set<string>()
  const directory = cacheDirectory()
  if (!FileManager.existsSync(directory)) return ids

  for (const name of FileManager.readDirectorySync(directory)) {
    if (!name.endsWith(CACHE_FILE_EXTENSION)) continue
    ids.add(name.slice(0, -CACHE_FILE_EXTENSION.length))
  }
  return ids
}

type CacheChangeListener = (videoId: string, action: "added" | "removed" | "cleared") => void
const cacheChangeListeners = new Set<CacheChangeListener>()

export function onCacheChanged(listener: CacheChangeListener): () => void {
  cacheChangeListeners.add(listener)
  return () => {
    cacheChangeListeners.delete(listener)
  }
}

function notifyCacheChanged(videoId: string, action: "added" | "removed" | "cleared"): void {
  for (const listener of cacheChangeListeners) {
    try {
      listener(videoId, action)
    } catch {}
  }
}

/** 在标记准备完成前由系统检查本地媒体，验证失败不继续交给播放器。 */
async function validateCachedVideo(path: string): Promise<void> {
  const asset = new AVAsset(path)
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const playable = await Promise.race([
      asset.loadIsPlayable(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("缓存视频检查超时，请在缓存页删除该集后重试")), 15000)
      }),
    ])
    if (!playable) throw new Error("缓存视频无法被 iPhone 播放，请在缓存页删除该集后重试")
  } finally {
    if (timer !== undefined) clearTimeout(timer)
    asset.dispose()
  }
}

const inflightPrepares = new Map<string, Promise<string>>()

/** 复用缓存或下载公开、加密视频，系统确认可播放后才写入缓存索引。 */
export async function prepareOfflineVideo(
  videoId: string,
  options: PrepareOptions = {},
  publicVideo?: VideoPlayerInfo
): Promise<string> {
  const { label, onProgress, protectedVideoIds } = options
  ensureCacheDirectory()

  const target = cachePath(videoId)

  if (FileManager.existsSync(target)) {
    onProgress?.({ stage: "validating", progress: 0 })
    await validateCachedVideo(target)
    markUsed(videoId, label)
    onProgress?.({ stage: "done", progress: 1 })
    return target
  }

  const existingTask = inflightPrepares.get(videoId)
  if (existingTask) {
    const result = await existingTask
    onProgress?.({ stage: "done", progress: 1 })
    return result
  }

  const task = (async () => {
    try {
      onProgress?.({ stage: "fetching", progress: 0 })

      let stream: EncryptedStream | undefined
      if (!publicVideo) {
        const streams = await fetchEncryptedStreams(videoId)
        if (streams.length === 0) {
          throw new HttpError("该集暂无可用清晰度，或均为设备不支持的编码", 404)
        }
        stream = streams[0]
      }

      onProgress?.({ stage: "downloading", progress: 0 })
      const downloaded = await downloadStream(publicVideo ? publicVideo.main_url : stream!.url)
      onProgress?.({ stage: "downloading", progress: 1 })

      let playable = downloaded
      if (stream) {
        onProgress?.({ stage: "decrypting", progress: 0 })
        playable = await decryptToPlayableAsync(downloaded, stream.contentKey, ratio => {
          onProgress?.({ stage: "decrypting", progress: ratio })
        })
      }

      FileManager.writeAsBytesSync(target, playable)
      onProgress?.({ stage: "validating", progress: 0 })
      try {
        await validateCachedVideo(target)
      } catch (error) {
        FileManager.removeSync(target)
        throw error
      }

      markUsed(videoId, label, {
        duration: publicVideo ? Number(publicVideo.duration) : stream!.duration,
        width: publicVideo ? publicVideo.width : stream!.width,
        height: publicVideo ? publicVideo.height : stream!.height,
      })

      const protectList = [videoId, ...(protectedVideoIds ?? [])]
      enforceCacheLimit(protectList)

      onProgress?.({ stage: "done", progress: 1 })
      notifyCacheChanged(videoId, "added")

      return target
    } finally {
      inflightPrepares.delete(videoId)
    }
  })()

  inflightPrepares.set(videoId, task)
  return task
}

export async function preloadOfflineVideo(
  videoId: string,
  options: { label?: string; protectedVideoIds?: string[] } = {}
): Promise<boolean> {
  if (!videoId) return false
  if (isOfflineVideoCached(videoId)) return true

  try {
    await prepareOfflineVideo(videoId, {
      label: options.label,
      protectedVideoIds: options.protectedVideoIds,
    })
    return true
  } catch (error) {
    console.log(`[preload] 预加载集数 ${videoId} 失败（已静默跳过）:`, error)
    return false
  }
}

/** 将现有缓存原样复制到用户选择的文件夹，不加载或解码媒体。 */
export async function exportOfflineVideo(videoId: string): Promise<void> {
  if (!/^[0-9]{1,25}$/.test(videoId)) throw new Error("视频 ID 不合法")
  const source = cachePath(videoId)
  if (!FileManager.existsSync(source)) throw new Error("该集缓存文件不存在")
  const directory = await DocumentPicker.pickDirectory()
  if (!directory) return
  const destination = `${directory}/hongguo-${videoId}.mp4`
  if (FileManager.existsSync(destination)) throw new Error("所选文件夹中已有同名视频，请选择其他文件夹")
  await FileManager.copyFile(source, destination)
}

export function removeOfflineVideo(videoId: string): void {
  const target = cachePath(videoId)
  if (FileManager.existsSync(target)) FileManager.removeSync(target)

  const index = readIndex()
  forget(videoId, index)
  writeIndex(index)
  notifyCacheChanged(videoId, "removed")
}

export function clearOfflineCache(): void {
  const directory = cacheDirectory()
  if (FileManager.existsSync(directory)) FileManager.removeSync(directory)
  notifyCacheChanged("", "cleared")
}
