import { fetchLoaderEntry, getJson, HttpError } from "./http"
import {
  WEB_BASE,
  CATEGORY_PAGE_SIZE,
  RANK_TOTAL_PAGES,
} from "./config"
import type {
  CategoryData,
  Celebrity,
  HomeBanner,
  HomeData,
  HomeSection,
  PlayerData,
  RankData,
  RankItem,
  SearchData,
  SearchResultItem,
  SelectorItem,
  SeriesCard,
  SeriesDetail,
  SeriesSocialInfo,
  SuggestWord,
  VideoPlayerInfo,
} from "./types"

interface HomeEntry {
  bannerList?: HomeBanner[]
  mBannerList?: HomeBanner[]
  homeSections?: (Omit<HomeSection, "video_list"> & { video_list?: SeriesCardRaw[] })[]
}

export interface SeriesDetailResult {
  detail: SeriesDetail
  social: SeriesSocialInfo | null
}

interface DetailEntry {
  seriesDetail?: SeriesDetail
  seriesSocialInfo?: SeriesSocialInfo
  videoList?: SeriesCardRaw[]
}

interface PlayerEntry {
  series_id?: string
  vid?: string
  video_player_info?: VideoPlayerInfo
  seriesDetail?: SeriesDetail
  seriesSocialInfo?: SeriesSocialInfo
  videoList?: SeriesCardRaw[]
}

interface SearchEntry {
  searchList: SearchResultItem[]
  totalCount: number | string
  pageNum: number
  totalPages: number
  hasMore: boolean
}

interface CategoryEntry {
  categoryRoute?: {
    canonicalPath?: string
    displayName?: string

    slug?: string
  }
  selectorList?: { items?: SelectorItem[] }[]
  recommendList?: SeriesCardRaw[]
  pagination?: CategoryData["pagination"]
}

interface RankEntry {
  rankKey?: string
  updatedText?: string
  pageNum?: number
  content?: { rankList?: RankItem[]; pagination?: RankData["pagination"] }
}

type SeriesCardRaw = Partial<SeriesCard> & { series_name?: string }

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

function normalizeCard(card: SeriesCardRaw): SeriesCard {
  const normalized = { ...card } as SeriesCard
  normalized.series_title = card.series_title || card.series_name || ""
  delete (normalized as SeriesCardRaw).series_name
  return normalized
}

function normalizeCards(cards: SeriesCardRaw[] | undefined | null): SeriesCard[] {
  return asArray(cards).map(normalizeCard)
}

function normalizeDetail(detail: SeriesDetail): SeriesDetail {
  return {
    ...detail,
    vid_list: asArray(detail.vid_list),
    celebrities: asArray<Celebrity>(detail.celebrities),
    tags: asArray<string>(detail.tags),
  }
}

export async function fetchHome(): Promise<HomeData> {
  const entry = await fetchLoaderEntry<HomeEntry>("", "page")
  const mBanners = asArray(entry.mBannerList)

  return {
    bannerList: mBanners.length > 0 ? mBanners : asArray(entry.bannerList),
    mBannerList: mBanners,
    homeSections: asArray(entry.homeSections)
      .map(section => ({ ...section, video_list: normalizeCards(section.video_list) }))
      .filter(section => section.video_list.length > 0),
  }
}

const DETAIL_CACHE_TTL_MS = 60 * 1000

interface DetailCacheEntry {
  at: number
  result: SeriesDetailResult
}

const detailCache = new Map<string, DetailCacheEntry>()
const detailInflight = new Map<string, Promise<SeriesDetailResult>>()

export async function fetchDetail(seriesId: string): Promise<SeriesDetailResult> {
  const cached = detailCache.get(seriesId)
  if (cached && Date.now() - cached.at < DETAIL_CACHE_TTL_MS) return cached.result

  const inflight = detailInflight.get(seriesId)
  if (inflight) return inflight

  const task = fetchDetailFromWeb(seriesId)
    .then(result => {
      detailCache.set(seriesId, { at: Date.now(), result })
      return result
    })
    .finally(() => {
      detailInflight.delete(seriesId)
    })

  detailInflight.set(seriesId, task)
  return task
}

async function fetchDetailFromWeb(seriesId: string): Promise<SeriesDetailResult> {
  const entry = await fetchLoaderEntry<DetailEntry | null>(
    `/detail?series_id=${encodeURIComponent(seriesId)}`,
    "detail_page"
  )
  const detail = entry?.seriesDetail
  if (!detail) throw new HttpError("该剧集不存在或已下架", 404)

  return {
    detail: normalizeDetail(detail),
    social: entry?.seriesSocialInfo ?? null,
  }
}

export const DEFAULT_FREE_EPISODE_COUNT = 3

export function getFreeEpisodeCount(detail: SeriesDetail): number {
  const declared = detail.accessible_episode_cnt
  const value =
    typeof declared === "number" && declared > 0 ? declared : DEFAULT_FREE_EPISODE_COUNT

  return Math.min(value, detail.vid_list.length)
}

export async function fetchPlayer(seriesId: string, vid: string): Promise<PlayerData> {
  const entry = await fetchLoaderEntry<PlayerEntry | null>(
    `/player/${encodeURIComponent(seriesId)}/${encodeURIComponent(vid)}`,
    "player_(series_id)/(vid)/page"
  )
  const detail = entry?.seriesDetail
  const playerInfo = entry?.video_player_info

  if (!detail || !playerInfo?.main_url) {
    throw new HttpError("该剧集暂无可播放内容", 404)
  }

  return {
    seriesId: entry.series_id ?? seriesId,
    vid: entry.vid ?? vid,
    playerInfo,
    seriesDetail: normalizeDetail(detail),
    social: entry.seriesSocialInfo ?? null,
    recommendList: normalizeCards(entry.videoList),
  }
}

/** 按官网的 page 参数读取搜索分页，校验页码并保留服务端剧集排序。 */
export async function fetchSearch(keyword: string, page = 1): Promise<SearchData> {
  if (!Number.isSafeInteger(page) || page < 1) throw new HttpError("搜索页码无效", 0)
  const suffix = page > 1 ? `&page=${page}` : ""
  const url = `${WEB_BASE}/api/search/result?query=${encodeURIComponent(keyword)}${suffix}`
  const entry = await getJson(url) as SearchEntry
  if (!entry || !Array.isArray(entry.searchList)) {
    throw new HttpError("搜索结果格式异常", 0)
  }
  // 接口会将命中总数返回为十进制字符串，页面内部统一使用数字。
  const totalCount = typeof entry.totalCount === "string" && /^\d+$/.test(entry.totalCount)
    ? Number(entry.totalCount)
    : entry.totalCount
  if (typeof totalCount !== "number" || !Number.isSafeInteger(totalCount) || totalCount < 0) {
    throw new HttpError("搜索结果格式异常", 0)
  }
  if (entry.pageNum !== page || !Number.isSafeInteger(entry.totalPages) || entry.totalPages < 0 ||
      typeof entry.hasMore !== "boolean" || (entry.hasMore && entry.pageNum >= entry.totalPages)) {
    throw new HttpError("搜索分页格式异常", 0)
  }

  const results = entry.searchList
    .filter((item): item is SearchResultItem => Boolean(item?.video_data?.series_id))
    .map(item => ({
      ...item,
      video_data: item.video_data ? normalizeCard(item.video_data) : null,
    }))
  if (entry.hasMore && results.length === 0) throw new HttpError("搜索分页返回空结果，请重试", 0)

  return {
    query: keyword,
    searchList: results,
    totalCount,
    pageNum: entry.pageNum,
    totalPages: entry.totalPages,
    hasMore: entry.hasMore,
    isRelevant: results.length > 0,
  }
}

/** 获取网站当前搜索接口返回的联想词。 */
export async function fetchSuggest(keyword: string): Promise<SuggestWord[]> {
  const url = `${WEB_BASE}/api/search/suggestion?query=${encodeURIComponent(keyword)}`

  const payload = await getJson(url) as { suggestionList: SuggestWord[] }
  if (!payload || !Array.isArray(payload.suggestionList)) {
    throw new HttpError("搜索联想格式异常", 0)
  }
  return payload.suggestionList
}

export async function fetchCategory(
  route: string,
  page = 1,
  tagSlug = ""
): Promise<CategoryData> {
  const path = tagSlug
    ? `/category/${route}/${encodeURIComponent(tagSlug)}`
    : `/category/${route}`
  const suffix = page > 1 ? `?page=${page}` : ""
  const entry = await fetchLoaderEntry<CategoryEntry | null>(`${path}${suffix}`, "category_$")

  const recommendList = normalizeCards(entry?.recommendList)
  const selectorRow = asArray(entry?.selectorList)[0]

  return {
    route,
    routeLabel: entry?.categoryRoute?.displayName ?? "全部",
    selectorList: asArray(selectorRow?.items),
    recommendList,
    pagination: entry?.pagination ?? {
      total: recommendList.length,
      pageNum: page,
      pageSize: CATEGORY_PAGE_SIZE,
      totalPages: 1,
    },
  }
}

export async function fetchRank(board: string, page = 1): Promise<RankData> {

  const suffix = page > 1 ? `?page=${page}` : ""

  const entry = await fetchLoaderEntry<RankEntry | null>(`/rank/${board}${suffix}`, "rank_", {
    asCrawler: true,
  })

  const rankList = asArray(entry?.content?.rankList)

  if (rankList.length === 0) {
    throw new HttpError("榜单数据为空，请稍后重试", 0)
  }

  return {
    rankKey: entry?.rankKey ?? board,
    updatedText: entry?.updatedText ?? "",
    pageNum: entry?.pageNum ?? page,
    rankList,
    pagination: entry?.content?.pagination ?? {
      pageNum: page,
      totalPages: RANK_TOTAL_PAGES,
    },
  }
}

export { HttpError, WEB_BASE, CATEGORY_PAGE_SIZE }
