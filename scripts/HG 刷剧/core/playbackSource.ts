import { fetchDetail } from "./api"
import { formatEpisodeLabel } from "./format"
import { getCachedVideoMeta, prepareOfflineVideo, type PrepareOptions } from "./mediaCache"
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

/** 切集时保存真实剧集标识、标题与封面，复用现有播放缓存。 */
export async function resolvePlaybackSource(
  seriesId: string,
  detail: SeriesDetail,
  vid: string,
  options: PrepareOptions = {}
): Promise<ResolvedPlaybackSource> {
  const episodeIndex = detail.vid_list.indexOf(vid)
  const label = options.label ?? formatEpisodeLabel(detail.series_name, episodeIndex)
  return resolveOfflineSource(vid, {
    ...options,
    label,
    cover: detail.series_cover,
    seriesId,
    seriesTitle: detail.series_name,
  })
}

/** 首次加载详情后，将真实剧集标识、标题及封面保存到缓存索引。 */
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

  const { url, meta } = await resolveOfflineSource(vid, {
    ...prepareOptions,
    label,
    cover: result.detail.series_cover,
    seriesId,
    seriesTitle: result.detail.series_name,
  })

  return {
    data: buildOfflinePlayerData(seriesId, vid, result.detail, result.social, url, meta),
    meta,
  }
}

/** 准备完整缓存并读取已保存的视频参数。 */
async function resolveOfflineSource(
  vid: string,
  options: PrepareOptions
): Promise<ResolvedPlaybackSource> {
  const url = await prepareOfflineVideo(vid, options)
  const meta = getCachedVideoMeta(vid) ?? undefined
  return { url, meta }
}

/** 使用真实剧集信息和本地来源构建播放器数据。 */
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

/** 切集时更新来源与已知媒体参数。 */
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
