// test_refresh.tsx — 直接调 refresh API，打印完整请求响应
import { fetch } from "scripting"

const BOXJS_URL = "http://boxjs.com"
const REFRESH_API = "mtop.cainiao.cnmember.customer.autologin"
const REFRESH_URL = `https://cn-acs.m.cainiao.com/gw/${REFRESH_API}/1.0`

function generateRnd(): string {
  const alphabet = "0123456789ABCDEF"
  let result = ""
  for (let i = 0; i < 32; i++) result += alphabet[Math.floor(Math.random() * alphabet.length)]
  return result
}

function getHeaderCI(headers: Record<string, string>, name: string): string {
  const t = name.toLowerCase()
  for (const [k, v] of Object.entries(headers)) if (k.toLowerCase() === t) return v
  return ""
}

function setHeaderCI(headers: Record<string, string>, name: string, value: string): void {
  const t = name.toLowerCase()
  for (const k of Object.keys(headers)) if (k.toLowerCase() === t) { headers[k] = value; return }
  headers[name] = value
}

async function fetchBoxJs(key: string): Promise<string | null> {
  const resp = await fetch(`${BOXJS_URL.replace(/\/$/, "")}/query/data/${key}`, {
    headers: { Accept: "application/json" },
  })
  if (!resp.ok) { console.log(`${key} 拉取失败:`, resp.status); return null }
  const json = await resp.json()
  const val = json?.val
  if (typeof val === "string" && val.trim()) return val.trim()
  console.log(`${key} 为空:`, json)
  return null
}

function parseHeaders(raw: string): Record<string, string> | null {
  for (const c of [raw, (() => { try { return decodeURIComponent(raw) } catch { return null } })()]) {
    if (!c) continue
    try {
      const parsed = JSON.parse(c) as Record<string, unknown>
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(parsed)) {
        if (!k.trim() || v == null) continue
        out[k.trim()] = typeof v === "object" ? JSON.stringify(v) : String(v)
      }
      return out
    } catch { /* ignore */ }
  }
  return null
}

async function test() {
  // ==== 从 BoxJS 拿 autologin 的 headers + data ====
  const headersRaw = await fetchBoxJs("cainiao_autologin_headers_json")
  if (!headersRaw) { console.log("FAIL: cainiao_autologin_headers_json 为空"); return }
  const boxJsHeaders = parseHeaders(headersRaw)
  if (!boxJsHeaders) { console.log("FAIL: headers 解析失败"); return }

  const appData = await fetchBoxJs("cainiao_autologin_data")
  if (!appData) { console.log("FAIL: cainiao_autologin_data 为空"); return }
  console.log("autologin data:", appData)

  const headers = { ...boxJsHeaders }
  delete headers["Content-Length"]
  delete headers["Connection"]
  // 不改 x-t，保留原始时间戳
  setHeaderCI(headers, "Host", "cn-acs.m.cainiao.com")
  headers["x-cniao-skip-capture"] = "1"
  headers["api"] = REFRESH_API
  headers["v"] = "1.0"

  const rnd = generateRnd()
  const url = `${REFRESH_URL}?rnd=${encodeURIComponent(rnd)}&data=${encodeURIComponent(appData)}`

  console.log("sid:", getHeaderCI(boxJsHeaders, "x-sid")?.substring(0, 16) + "...")
  console.log("x-t:", getHeaderCI(headers, "x-t"))
  console.log("url:", url)

  const resp = await fetch(url, { method: "GET", headers })
  console.log("status:", resp.status)
  const json = await resp.json()
  console.log("response:", JSON.stringify(json, null, 2))

  if (resp.ok) {
    // autologin 响应: { data: { data: { sessionId, refreshToken } } }
    const inner = (json as any)?.data?.data
    if (inner) {
      console.log("new sid:", inner.sessionId)
      console.log("new refreshToken:", inner.refreshToken?.substring(0, 16) + "...")
    } else {
      console.log("data 格式未知:", JSON.stringify(json?.data))
    }
  }
}

test()
