export const WEB_BASE = "https://hongguoduanju.com"

export const WEB_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

export const CRAWLER_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

export const SUGGEST_APP_ID = 8662

export const REQUEST_TIMEOUT_SECONDS = 30

export const CATEGORY_PAGE_SIZE = 24

export const SEARCH_PAGE_SIZE = 10

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

export const APP_BASE = "https://api5-normal-sinfonlineb.fqnovel.com"

export const APP_USER_AGENT =
  "com.phoenix.read/71532 (Linux; U; Android 9; SM-N9860; Build/PQ3A.190705.10241111;tt-ok/3.12.13.20)"

export const APP_COMMON_QUERY: Record<string, string> = {
  aid: "8662",
  app_name: "novelread",
  version_code: "71332",
  version_name: "7.1.3.32",
  manifest_version_code: "71332",
  update_version_code: "71332",
  channel: "update_64",
  device_platform: "android",
  os: "android",
  ssmix: "a",
  device_type: "25053RT47C",
  device_brand: "Redmi",
  language: "zh",
  os_api: "36",
  os_version: "16",
  resolution: "1280*2772",
  dpi: "520",
  ac: "wifi",
  compliance_status: "0",
  dragon_device_type: "phone",
  host_abi: "arm64-v8a",
  is_android_pad_screen: "0",
  need_personal_recommend: "1",
  player_so_load: "1",
  pv_player: "71332",
}

export const MEDIA_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"

export const MEDIA_REFERER = "https://novel.snssdk.com/"

export const PLAYBACK_CACHE_DIR = "hongguo-cache"

export const PLAYBACK_CACHE_MAX_BYTES = 500 * 1024 * 1024

export const AUTO_CACHE_EPISODE_COUNT = 5
