export const WEB_BASE = "https://hongguoduanju.com"

export const WEB_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

export const CRAWLER_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

export const REQUEST_TIMEOUT_SECONDS = 30

export const CATEGORY_PAGE_SIZE = 24

export const RANK_TOTAL_PAGES = 5

export const CATEGORY_ROUTES = [
  { route: "real-drama", label: "真人剧" },
  { route: "comic-drama", label: "漫剧" },
  { route: "ai-drama", label: "AI 剧" },
] as const

export const RANK_BOARDS = [
  { board: "hot-drama", label: "热播榜" },
  { board: "hot-real-drama", label: "真人剧热播榜" },
  { board: "hot-ai-drama", label: "AI剧热播榜" },
  { board: "hot-comic-drama", label: "漫剧热播榜" },
] as const

export const MEDIA_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"

export const MEDIA_REFERER = "https://novel.snssdk.com/"

export const PLAYBACK_CACHE_DIR = "hongguo-cache"

export const PLAYBACK_CACHE_MAX_BYTES = 500 * 1024 * 1024

export const AUTO_CACHE_EPISODE_COUNT = 5
