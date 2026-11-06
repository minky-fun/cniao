import { fetchLoaderEntry, HttpError } from "./http"
import type { SeriesDetail, SeriesSocialInfo } from "./types"

export interface SeriesDetailResult {
  detail: SeriesDetail
  social: SeriesSocialInfo | null
}

interface DetailEntry {
  seriesDetail?: SeriesDetail
  seriesSocialInfo?: SeriesSocialInfo
}

const DETAIL_CACHE_TTL_MS = 60 * 1000
const DETAIL_CACHE_MAX_ENTRIES = 32

interface DetailCacheEntry {
  at: number
  result: SeriesDetailResult
}

const detailCache = new Map<string, DetailCacheEntry>()
const detailInflight = new Map<string, Promise<SeriesDetailResult>>()

/** 复用一分钟内的详情和并发请求，及时释放过期记录并限制驻留数量。 */
export async function fetchDetail(seriesId: string): Promise<SeriesDetailResult> {
  const now = Date.now()
  for (const [id, entry] of detailCache) {
    if (now - entry.at >= DETAIL_CACHE_TTL_MS) detailCache.delete(id)
  }
  const cached = detailCache.get(seriesId)
  if (cached) return cached.result

  const inflight = detailInflight.get(seriesId)
  if (inflight) return inflight

  const task = fetchDetailFromWeb(seriesId)
    .then(result => {
      detailCache.set(seriesId, { at: Date.now(), result })
      if (detailCache.size > DETAIL_CACHE_MAX_ENTRIES) {
        detailCache.delete(detailCache.keys().next().value!)
      }
      return result
    })
    .finally(() => {
      detailInflight.delete(seriesId)
    })

  detailInflight.set(seriesId, task)
  return task
}

/** 读取选集页需要的真实详情和互动信息。 */
async function fetchDetailFromWeb(seriesId: string): Promise<SeriesDetailResult> {
  const entry = await fetchLoaderEntry<DetailEntry | null>(
    `/detail?series_id=${encodeURIComponent(seriesId)}`,
    "detail_page"
  )
  const detail = entry?.seriesDetail
  if (!detail) throw new HttpError("该剧集不存在或已下架", 404)

  return {
    detail: {
      ...detail,
      vid_list: Array.isArray(detail.vid_list) ? detail.vid_list : [],
      celebrities: Array.isArray(detail.celebrities) ? detail.celebrities : [],
      tags: Array.isArray(detail.tags) ? detail.tags : [],
    },
    social: entry?.seriesSocialInfo ?? null,
  }
}
