import { fetchDetail, fetchPublicVideo } from "./api"
import { formatEpisodeLabel } from "./format"
import { getCachedVideoMeta, isOfflineVideoCached, prepareOfflineVideo, type PrepareOptions } from "./mediaCache"
import type { PlayerData, SeriesDetail, SeriesSocialInfo, VideoPlayerInfo } from "./types"

export interface CachedVideoMeta {
  duration?: number
  width?: number
  height?: number
}

export interface OfflineLoadOptions extends PrepareOptions {

  onDetail?: (data: PlayerData) => void
}

export interface ResolvedPlaybackSource {
  url: string

  meta?: CachedVideoMeta
}

/** 优先复用缓存，否则检查官网公开源，未开放时才请求 App 视频。 */
export async function resolvePlaybackSource(
  seriesId: string,
  detail: SeriesDetail,
  vid: string,
  options: PrepareOptions = {}
): Promise<ResolvedPlaybackSource> {
  const episodeIndex = detail.vid_list.indexOf(vid)
  const label = options.label ?? formatEpisodeLabel(detail.series_name, episodeIndex)
  if (!isOfflineVideoCached(vid)) {
    const publicVideo = await fetchPublicVideo(seriesId, vid)
    if (publicVideo) {
      console.log("[player] 使用官网公开视频源")
      return resolveOfflineSource(vid, { ...options, label }, publicVideo)
    }
  }
  return resolveOfflineSource(vid, { ...options, label })
}

/** 加载剧集详情，并为初次进入播放器选择缓存、公开或 App 视频源。 */
export async function loadOfflinePlayerData(
  seriesId: string,
  vid: string,
  options: OfflineLoadOptions = {}
): Promise<{ data: PlayerData; meta?: CachedVideoMeta }> {
  const { onDetail, ...prepareOptions } = options
  const result = await fetchDetail(seriesId)
  const episodeIndex = result.detail.vid_list.indexOf(vid)
  const label =
    prepareOptions.label ?? formatEpisodeLabel(result.detail.series_name, episodeIndex)

  onDetail?.(buildOfflinePlayerData(seriesId, vid, result.detail, result.social, "", undefined))

  const { url, meta } = await resolvePlaybackSource(seriesId, result.detail, vid, { ...prepareOptions, label })

  return {
    data: buildOfflinePlayerData(seriesId, vid, result.detail, result.social, url, meta),
    meta,
  }
}

/** 使用同一缓存流程保存公开视频或解密后的 App 视频，并返回缓存媒体信息。 */
async function resolveOfflineSource(
  vid: string,
  options: PrepareOptions,
  publicVideo?: VideoPlayerInfo
): Promise<ResolvedPlaybackSource> {
  const url = await prepareOfflineVideo(vid, options, publicVideo)
  const meta = getCachedVideoMeta(vid) ?? undefined
  return { url, meta }
}

export function buildOfflinePlayerData(
  seriesId: string,
  vid: string,
  detail: SeriesDetail,
  social: SeriesSocialInfo | null,
  url: string,
  meta?: CachedVideoMeta
): PlayerData {
  const playerInfo: VideoPlayerInfo = {
    duration: String(Math.round(meta?.duration ?? 0)),
    width: meta?.width || 1920,
    height: meta?.height || 1080,
    poster_url: detail.series_cover,
    main_url: url,
  }

  return {
    seriesId,
    vid,
    playerInfo,
    seriesDetail: detail,
    social,
    recommendList: [],
  }
}

export function applyOfflineSource(
  current: PlayerData,
  vid: string,
  url: string,
  meta?: CachedVideoMeta
): PlayerData {
  const duration = meta?.duration ?? 0
  return {
    ...current,
    vid,
    playerInfo: {
      ...current.playerInfo,
      main_url: url,
      duration: String(Math.round(duration)),
      width: meta?.width || current.playerInfo.width,
      height: meta?.height || current.playerInfo.height,
    },
  }
}

export function durationSeconds(value: string | number | undefined): number {
  const seconds = Number(value)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
}
