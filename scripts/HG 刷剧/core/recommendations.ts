import { fetch } from "scripting"
import { APP_COMMON_QUERY } from "./config"
import { HttpError } from "./http"
import { getPlaybackIdentity, PLAYBACK_USER_AGENT } from "./playbackIdentity"
import { signPlayback } from "./playbackSign"
import type { SeriesDetail } from "./types"

export interface FeedCursor {
  offset: number
  sessionId: string
}

export interface Recommendation {
  detail: SeriesDetail
  vid: string
  episodeIndex: number
  reason: string
}

export interface RecommendationPage {
  items: Recommendation[]
  cursor: FeedCursor
  hasMore: boolean
}

interface FeedEpisode {
  vid: string
  vid_index: number
  disable_play: boolean
}

interface FeedVideo {
  vid: string
  disable_play: boolean
  rec_tags?: { content: string }[]
  video_detail: {
    series_id_str: string
    series_title: string
    series_intro: string
    series_cover: string
    episode_cnt: number
    video_list: FeedEpisode[]
  }
}

const FEED_PATH = "/reading/bookapi/bookmall/cell/change/v"
const FEED_BASES = [
  "https://api5-normal-lq.fqnovel.com",
  "https://api5-normal-sinfonlinec.fqnovel.com",
]

/** 按桌面端已验证的 cell_view 结构解析推荐，保持服务端顺序和字符串剧集标识。 */
function parsePage(text: string, previous: FeedCursor): RecommendationPage {
  let json: { code: number; data: {
    cell_view: { cell_data: { video_data?: FeedVideo[] | null }[] }
    has_more: boolean; next_offset: number; session_id: string
  } }
  try { json = JSON.parse(text) } catch { throw new Error("推荐接口返回了非 JSON 内容") }
  if (json?.code !== 0) throw new Error(`推荐接口错误（code ${json?.code}）`)
  const data = json.data
  if (!Array.isArray(data?.cell_view?.cell_data) || typeof data.has_more !== "boolean"
    || !Number.isSafeInteger(data.next_offset) || data.next_offset < 0
    || typeof data.session_id !== "string"
    || (data.has_more && (data.next_offset <= previous.offset || !data.session_id))) {
    throw new Error("推荐接口缺少有效列表或分页信息")
  }

  const items: Recommendation[] = []
  const ids = new Set<string>()
  for (const cell of data.cell_view.cell_data) {
    // 实际响应混有不带 video_data 的非视频单元，桌面模型将其视为空切片。
    if (cell?.video_data == null) continue
    if (!Array.isArray(cell?.video_data)) throw new Error("推荐列表格式异常")
    for (const video of cell.video_data) {
      if (video?.disable_play) continue
      const series = video?.video_detail
      if (!series || typeof series.series_id_str !== "string" || !/^[0-9]{8,24}$/.test(series.series_id_str)
        || typeof series.series_title !== "string" || !series.series_title
        || typeof series.series_intro !== "string" || typeof series.series_cover !== "string"
        || !Number.isSafeInteger(series.episode_cnt) || series.episode_cnt < 1
        || !Array.isArray(series.video_list)) throw new Error("推荐剧集缺少有效详情")
      if (!series.video_list.length) continue
      if (series.video_list.some(episode => typeof episode?.vid !== "string"
        || !/^[0-9]{8,24}$/.test(episode.vid) || !Number.isSafeInteger(episode.vid_index) || episode.vid_index < 1)) {
        throw new Error("推荐剧集缺少有效分集信息")
      }
      // 桌面端先按推荐 vid 匹配，未命中则播放第一集；group_id 不作播放标识。
      const episode = series.video_list.find(entry => entry.vid === video.vid) ?? series.video_list[0]
      if (episode.disable_play || ids.has(series.series_id_str)) continue
      ids.add(series.series_id_str)
      items.push({
        detail: {
          series_id: series.series_id_str,
          series_name: series.series_title,
          series_intro: series.series_intro,
          series_cover: series.series_cover,
          episode_cnt: series.episode_cnt,
          vid_list: series.video_list.map(entry => entry.vid),
          tags: [], celebrities: [],
        },
        vid: episode.vid,
        episodeIndex: episode.vid_index - 1,
        reason: video.rec_tags?.find(tag => typeof tag?.content === "string" && tag.content)?.content ?? "",
      })
    }
  }
  return { items, cursor: { offset: data.next_offset, sessionId: data.session_id }, hasMore: data.has_more }
}

/** 使用旧版桌面分析的签名 GET 推荐接口，空响应仅更新一次游客身份并有限切换节点。 */
export async function fetchRecommendationPage(cursor: FeedCursor = { offset: 0, sessionId: "" }): Promise<RecommendationPage> {
  let identity = await getPlaybackIdentity()
  let lastError: Error = new Error("推荐接口返回空响应，请稍后重试")
  for (let round = 0; round < 2; round++) {
    let receivedEmpty = false
    for (const base of FEED_BASES) {
      const signed = signPlayback({
        ...APP_COMMON_QUERY, device_id: identity.deviceId, iid: identity.installId,
        bottom_tab_type: "7", client_req_type: "2", client_template: "7", change_type: "0",
        category_id: "0", cell_sub_id: "0", limit: "0", need_personal_recommend: "1",
        video_type_preferences_str: "[]", cell_id: "7294257141911650341", plan_id: "7294257258253254693",
        tab_type: "16", offset: String(cursor.offset), session_id: cursor.sessionId,
      }, "")
      let text: string
      try {
        const response = await fetch(`${base}${FEED_PATH}?${signed.query}`, {
          method: "GET", timeout: 12,
          headers: { ...signed.headers, "User-Agent": PLAYBACK_USER_AGENT,
            Accept: "application/json", "X-Ss-Dp": "8662", "X-Tt-Dt": identity.deviceToken,
            Cookie: Object.entries(identity.cookies).map(([key, value]) => `${key}=${value}`).join("; "),
          },
        })
        if (!response.ok) throw new HttpError(`推荐接口返回 HTTP ${response.status}`, response.status)
        text = await response.text()
      } catch (error) {
        lastError = error instanceof HttpError ? error : new Error("推荐加载失败，请检查网络后重试")
        if (error instanceof HttpError && error.status >= 400 && error.status < 500
          && error.status !== 408 && error.status !== 429) throw error
        continue
      }
      if (!text.trim()) { receivedEmpty = true; continue }
      return parsePage(text, cursor)
    }
    if (round === 0 && receivedEmpty) identity = await getPlaybackIdentity(identity)
    else break
  }
  throw lastError
}
