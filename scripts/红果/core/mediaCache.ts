import { fetchEncryptedStreams, downloadStream, type EncryptedStream } from "./appApi"
import { decryptToPlayableAsync } from "./mp4"
import { PLAYBACK_CACHE_DIR, PLAYBACK_CACHE_MAX_BYTES, PLAYBACK_CACHE_MAX_ENTRIES } from "./config"
import { HttpError } from "./http"

const CACHE_FILE_EXTENSION = ".mp4"

const INDEX_FILE_NAME = "cache-index.json"

const INDEX_VERSION = 1

const MAX_ENTRIES_STORAGE_KEY = "hongguo-cache-max-entries"

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

  cover?: string

  seriesId?: string

  seriesTitle?: string

  lastUsedAt: number

  duration?: number

  width?: number

  height?: number
}

export interface CacheEntry {
  videoId: string
  label: string
  cover?: string
  seriesId?: string
  seriesTitle?: string
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

/** 读取实际缓存文件及索引中的剧集信息，兼容缺少元数据的旧索引。 */
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
      cover: record?.cover,
      seriesId: record?.seriesId,
      seriesTitle: record?.seriesTitle,
      sizeBytes: stat.size,

      lastUsedAt: record?.lastUsedAt ?? stat.modificationDate,
    })
  }

  return entries
}

/** 为页面异步读取索引与文件大小，避免同步逐文件扫描阻塞导航动画。 */
export async function listOfflineCacheAsync(): Promise<CacheEntry[]> {
  const directory = cacheDirectory()
  if (!await FileManager.exists(directory)) return []

  const names = await FileManager.readDirectory(directory)
  let index: CacheIndex = {}
  const indexPath = indexFilePath()
  if (await FileManager.exists(indexPath)) {
    const raw = await FileManager.readAsString(indexPath)
    try {
      const parsed = JSON.parse(raw) as { version?: number; entries?: CacheIndex }
      if (parsed?.version === INDEX_VERSION && parsed.entries) index = parsed.entries
    } catch (error) {
      console.warn("[cache] 索引解析失败，已忽略元数据", error)
    }
  }

  const entries = await Promise.all(names.filter(name => name.endsWith(CACHE_FILE_EXTENSION)).map(async name => {
    let stat: FileStat
    try {
      stat = await FileManager.stat(`${directory}/${name}`)
    } catch (error) {
      console.warn(`[cache] 跳过无法读取的条目 ${name}`, error)
      return null
    }
    if (stat.type === "notFound") return null
    const videoId = name.slice(0, -CACHE_FILE_EXTENSION.length)
    const record = index[videoId]
    return {
      videoId,
      label: record?.label ?? "",
      cover: record?.cover,
      seriesId: record?.seriesId,
      seriesTitle: record?.seriesTitle,
      sizeBytes: stat.size,
      lastUsedAt: record?.lastUsedAt ?? stat.modificationDate,
    }
  }))
  return entries.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}

export function offlineCacheSize(): number {
  return listOfflineCache().reduce((sum, entry) => sum + entry.sizeBytes, 0)
}

/** 更新使用时间、剧集信息和视频参数，保留未重新提供的元数据。 */
function markUsed(
  videoId: string,
  label?: string,
  meta?: { cover?: string; seriesId?: string; seriesTitle?: string; duration?: number; width?: number; height?: number }
): void {
  const index = readIndex()
  const existing = index[videoId]
  index[videoId] = {
    label: label ?? existing?.label ?? "",
    cover: meta?.cover ?? existing?.cover,
    seriesId: meta?.seriesId ?? existing?.seriesId,
    seriesTitle: meta?.seriesTitle ?? existing?.seriesTitle,
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

/** 读取用户设置的保留集数，尚未设置或旧数据无效时使用原有默认值。 */
export function getPlaybackCacheMaxEntries(): number {
  const value = Storage.get<number>(MAX_ENTRIES_STORAGE_KEY)
  return value !== null && Number.isSafeInteger(value) && value >= 2
    ? value
    : PLAYBACK_CACHE_MAX_ENTRIES
}

/** 校验并持久保存保留集数，保存失败时保留现有配置并报告原因。 */
export function setPlaybackCacheMaxEntries(value: number): void {
  if (!Number.isSafeInteger(value) || value < 2) {
    throw new Error("请输入不小于 2 的整数集数")
  }
  if (!Storage.set(MAX_ENTRIES_STORAGE_KEY, value)) {
    throw new Error("保留集数保存失败，请重试")
  }
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

/** 每次清理读取最新保留集数，按最久未观看顺序清理并保护指定剧集。 */
export function enforceCacheLimit(
  protectedVideoIds: string[] = [],
  limits: CacheLimits = {
    maxBytes: PLAYBACK_CACHE_MAX_BYTES,
    maxEntries: getPlaybackCacheMaxEntries(),
  }
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

  stage: "fetching" | "downloading" | "decrypting" | "done"

  progress: number
}

export interface PrepareOptions {

  label?: string

  cover?: string

  seriesId?: string

  seriesTitle?: string

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

const inflightPrepares = new Map<string, Promise<string>>()

/** 准备可播放缓存，并在下载、复用和并发等待完成时保存已知剧集信息。 */
export async function prepareOfflineVideo(
  videoId: string,
  options: PrepareOptions = {}
): Promise<string> {
  const { label, cover, seriesId, seriesTitle, onProgress, protectedVideoIds } = options
  ensureCacheDirectory()

  const target = cachePath(videoId)

  if (FileManager.existsSync(target)) {
    markUsed(videoId, label, { cover, seriesId, seriesTitle })
    onProgress?.({ stage: "done", progress: 1 })
    return target
  }

  const existingTask = inflightPrepares.get(videoId)
  if (existingTask) {
    const result = await existingTask
    markUsed(videoId, label, { cover, seriesId, seriesTitle })
    onProgress?.({ stage: "done", progress: 1 })
    return result
  }

  const task = (async () => {
    try {
      onProgress?.({ stage: "fetching", progress: 0 })

      const streams = await fetchEncryptedStreams(videoId)
      if (streams.length === 0) {
        throw new HttpError("该集暂无可用清晰度，或均为设备不支持的编码", 404)
      }

      const stream: EncryptedStream = streams[0]

      onProgress?.({ stage: "downloading", progress: 0 })
      const encrypted = await downloadStream(stream.url)
      onProgress?.({ stage: "downloading", progress: 1 })

      onProgress?.({ stage: "decrypting", progress: 0 })
      const playable = await decryptToPlayableAsync(encrypted, stream.contentKey, ratio => {
        onProgress?.({ stage: "decrypting", progress: ratio })
      })

      FileManager.writeAsBytesSync(target, playable)

      markUsed(videoId, label, {
        cover,
        seriesId,
        seriesTitle,
        duration: stream.duration,
        width: stream.width,
        height: stream.height,
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

/** 预加载剧集并传递真实剧集信息，失败时保留现有静默跳过行为。 */
export async function preloadOfflineVideo(
  videoId: string,
  options: { label?: string; cover?: string; seriesId?: string; seriesTitle?: string; protectedVideoIds?: string[] } = {}
): Promise<boolean> {
  if (!videoId) return false
  if (isOfflineVideoCached(videoId)) return true

  try {
    await prepareOfflineVideo(videoId, {
      label: options.label,
      cover: options.cover,
      seriesId: options.seriesId,
      seriesTitle: options.seriesTitle,
      protectedVideoIds: options.protectedVideoIds,
    })
    return true
  } catch (error) {
    console.log(`[preload] 预加载集数 ${videoId} 失败（已静默跳过）:`, error)
    return false
  }
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
