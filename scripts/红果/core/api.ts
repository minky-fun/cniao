import { fetchLoaderEntry, fetchSuggestJson, HttpError } from "./http"
import {
  WEB_BASE,
  SUGGEST_APP_ID,
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
  query?: string
  searchList?: SearchResultItem[]
  totalCount?: string | number
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

function isSearchRelevant(query: string, items: SearchResultItem[]): boolean {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0 || items.length === 0) return false

  return items.some(item => {
    const haystack = `${item.video_data?.series_title ?? ""}${item.name ?? ""}`.toLowerCase()
    return haystack.includes(needle)
  })
}

export async function fetchSearch(keyword: string): Promise<SearchData> {
  const entry = await fetchLoaderEntry<SearchEntry | null>(
    `/search/${encodeURIComponent(keyword)}`,
    "search_(keyword)/page"
  )

  const results = asArray(entry?.searchList)
    .filter((item): item is SearchResultItem => Boolean(item?.video_data?.series_id))
    .map(item => ({
      ...item,
      video_data: item.video_data ? normalizeCard(item.video_data) : null,
    }))
  const query = entry?.query ?? keyword

  return {
    query,
    searchList: results,
    totalCount: Number(entry?.totalCount ?? results.length),
    isRelevant: isSearchRelevant(query, results),
  }
}

export async function fetchSuggest(keyword: string): Promise<SuggestWord[]> {
  const url =
    `${WEB_BASE}/incent_resource/suggestion` +
    `?app_id=${SUGGEST_APP_ID}&query=${encodeURIComponent(keyword)}&count=10`

  const payload = await fetchSuggestJson(url)
  const items = (payload as { suggest_list?: SuggestWord[] } | null)?.suggest_list
  return asArray(items)
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
