import { fetch } from "scripting"

export type ResetType = "regular" | "banked"

export type ResetRecord = {
  id: string
  reset_type: ResetType
  announced_at: string
  text: string
  source: {
    type: "x_post" | "observed"
    author?: "thsottiaux"
    url?: string
  }
}

type ResetStatusResponse = {
  data: {
    latest_reset: ResetRecord | null
    scheduled_reset: object | null
    active_watch: object | null
    stats: {
      total: number
      last_reset_at: string | null
      days_since_last: number | null
      avg_interval_days: number | null
    }
  }
  meta: {
    api_version: "v1"
    generated_at: string
  }
}

type ResetListResponse = {
  data: ResetRecord[]
  pagination: {
    has_more: boolean
    next_cursor: string | null
  }
  meta: {
    api_version: "v1"
    generated_at: string
  }
}

export type ResetDashboard = {
  latest: ResetRecord
  total: number
  daysSinceLast: number
  averageDays: number
  longestDays: number
  history: ResetRecord[]
  generatedAt: Date
}


const API_BASE_URL = "https://codex-resets.com/api/v1"
const DAY_IN_MS = 86400000

/** Formats the elapsed reset time into the compact Chinese label used by the design. */
export function formatRelativeDays(days: number): string {
  if (days < 1) return "今天"
  return `${Math.floor(days)}天前`
}

/** 按 Codex Resets 网页的时间单位和四舍五入规则生成中文相对时间。 */
export function formatRelativeTime(value: string, now = Date.now()): string {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) throw new Error("重置时间格式无效")

  const deltaSeconds = Math.round((timestamp - now) / 1000)
  const absoluteSeconds = Math.abs(deltaSeconds)
  if (absoluteSeconds < 45) return "刚刚"

  const units = [
    { seconds: 31536000, label: "年" },
    { seconds: 2592000, label: "个月" },
    { seconds: 604800, label: "周" },
    { seconds: 86400, label: "天" },
    { seconds: 3600, label: "小时" },
  ]

  for (const unit of units) {
    if (absoluteSeconds >= unit.seconds) {
      const amount = Math.abs(Math.round(deltaSeconds / unit.seconds))
      return `${amount}${unit.label}${deltaSeconds < 0 ? "前" : "后"}`
    }
  }

  const minutes = Math.abs(Math.round(deltaSeconds / 60))
  return `${minutes}分钟${deltaSeconds < 0 ? "前" : "后"}`
}

/** Formats an API timestamp in the device's local date and time. */
export function formatLocalDate(value: string): string {
  const date = new Date(value)
  const dateText = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date)
  const timeText = new Intl.DateTimeFormat("zh-CN", { hour: "numeric", minute: "2-digit", hour12: true }).format(date)
  return `${dateText} · ${timeText}`
}

/** Formats the API generation timestamp as a short freshness label. */
export function formatUpdatedAt(date: Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes === 0) return "刚刚更新"
  if (minutes < 60) return `${minutes}分钟前更新`
  return `${Math.floor(minutes / 60)}小时前更新`
}

/** Calculates the longest interval between adjacent reset records. */
export function calculateLongestInterval(records: ResetRecord[]): number {
  const timestamps = records
    .map((record) => new Date(record.announced_at).getTime())
    .sort((left, right) => left - right)
  let longest = 0
  for (let index = 1; index < timestamps.length; index += 1) {
    longest = Math.max(longest, (timestamps[index] - timestamps[index - 1]) / DAY_IN_MS)
  }
  return longest
}

/** Loads all reset history pages so aggregate statistics remain exact. */
export async function fetchAllResets(): Promise<ResetRecord[]> {
  const records: ResetRecord[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const query = cursor ? `?limit=100&order=asc&cursor=${encodeURIComponent(cursor)}` : "?limit=100&order=asc"
    const response = await fetch(`${API_BASE_URL}/resets${query}`, { headers: { Accept: "application/json" } })
    if (!response.ok) throw new Error(`历史接口返回 ${response.status}`)
    const page = await response.json() as ResetListResponse
    records.push(...page.data)
    hasMore = page.pagination.has_more
    cursor = page.pagination.next_cursor
    if (hasMore && cursor === null) throw new Error("历史接口缺少下一页游标")
  }

  return records
}

/** Loads current status and history from the public Codex Resets API. */
export async function fetchDashboard(): Promise<ResetDashboard> {
  const [statusResponse, history] = await Promise.all([
    fetch(`${API_BASE_URL}/status`, { headers: { Accept: "application/json" } }),
    fetchAllResets(),
  ])
  if (!statusResponse.ok) throw new Error(`状态接口返回 ${statusResponse.status}`)

  const response = await statusResponse.json() as ResetStatusResponse
  const latest = response.data.latest_reset
  const stats = response.data.stats
  if (latest === null) throw new Error("状态接口没有最新重置记录")
  if (stats.days_since_last === null) throw new Error("状态接口没有距上次重置天数")
  if (stats.avg_interval_days === null) throw new Error("状态接口没有平均间隔")

  return {
    latest,
    total: stats.total,
    daysSinceLast: stats.days_since_last,
    averageDays: stats.avg_interval_days,
    longestDays: calculateLongestInterval(history),
    history,
    generatedAt: new Date(response.meta.generated_at),
  }
}
