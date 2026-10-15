// 菜鸟包裹请求、响应解析与 autologin 续期；不在此生成本地签名。
import { fetch } from "scripting"
import { getSettings } from "./settings"

export type PickupItem = {
  status: string; relation: string; name: string; code: string
  pic: string; stationName: string; postBrandName: string
}
export type PackageResult = { items: PickupItem[] | null; errorMessage?: string }

const API_NAME = "mtop.cainiao.lpc.packageservice.querypdspackagedatalist.cn"
const API_URL = `https://caps-mtop.cainiao.com/gw/${API_NAME}/1.0`
const REFRESH_API = "mtop.cainiao.cnmember.customer.autologin"
const REFRESH_URL = `https://cn-acs.m.cainiao.com/gw/${REFRESH_API}/1.0`

/** 不区分大小写读取已抓取的请求头。 */
function getHeaderCI(headers: Record<string, string>, name: string): string {
  const t = name.toLowerCase()
  for (const [k, v] of Object.entries(headers)) if (k.toLowerCase() === t) return v
  return ""
}

/** 更新已有请求头，保留原来的字段大小写。 */
function setHeaderCI(headers: Record<string, string>, name: string, value: string): void {
  const t = name.toLowerCase()
  for (const k of Object.keys(headers)) if (k.toLowerCase() === t) { headers[k] = value; return }
  headers[name] = value
}

/** 生成沿用当前请求格式的随机查询标识。 */
function generateRnd(): string {
  const alphabet = "0123456789ABCDEF"
  let r = ""
  for (let i = 0; i < 32; i++) r += alphabet[Math.floor(Math.random() * alphabet.length)]
  return r
}

// ========== BoxJS 读取 ==========

/** 从原有 BoxJS 键读取抓取结果，超时或失败时不输出原始异常。 */
async function fetchBoxJs(key: string): Promise<string | null> {
  const s = getSettings()
  try {
    const resp = await fetch(`${s.boxJsUrl.replace(/\/$/, "")}/query/data/${key}`, {
      headers: { Accept: "application/json" }, timeout: 8,
    })
    if (!resp.ok) { console.log(`BoxJS ${key}:`, resp.status); return null }
    const json = await resp.json()
    const val = json?.val
    return typeof val === "string" && val.trim() ? val.trim() : null
  } catch (e) { console.log(`BoxJS ${key} 读取失败，请检查代理和 BoxJS 地址`); return null }
}

/** 解析现有 BoxJS 明文或 URL 编码的请求头 JSON。 */
function parseHeaders(raw: string): Record<string, string> | null {
  const candidates = [raw]
  try { const d = decodeURIComponent(raw); if (d !== raw) candidates.push(d) } catch { /* */ }
  for (const c of candidates) {
    try {
      const p = JSON.parse(c) as Record<string, unknown>
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(p)) {
        if (!k.trim() || v == null) continue
        out[k.trim()] = typeof v === "object" ? JSON.stringify(v) : String(v)
      }
      return out
    } catch { /* */ }
  }
  return null
}

// ========== 包裹查询请求构建 ==========

/** 保留已验证包裹查询的业务参数及序列化顺序。 */
function buildRequestData() {
  return {
    currentPage: 1, pageSize: 40, needTemporality: false,
    needDynInfo: "{'needFindTemporality':true,'needAppointment':true}",
  }
}

/** 沿用已验证的包裹请求头，移除传输层字段并更新时间。 */
function preparePackageHeaders(boxJsHeaders: Record<string, string>): Record<string, string> {
  const h = { ...boxJsHeaders }
  for (const key of Object.keys(h)) {
    if (["content-length", "connection"].includes(key.toLowerCase())) delete h[key]
  }
  setHeaderCI(h, "x-t", String(Math.floor(Date.now() / 1000)))
  const li = getHeaderCI(h, "c-launch-info")
  if (li) {
    const parts = li.split(",")
    if (parts.length >= 3) { parts[2] = String(Date.now()); setHeaderCI(h, "c-launch-info", parts.join(",")) }
  }
  setHeaderCI(h, "Host", "caps-mtop.cainiao.com")
  setHeaderCI(h, "Accept", "application/json")
  setHeaderCI(h, "Accept-Encoding", "gzip")
  return h
}

/** 检查当前抓取协议要求的请求头，缺失时返回具体字段。 */
function validateHeaders(headers: Record<string, string>): string | null {
  for (const n of ["x-t", "x-sid", "x-sign", "x-mini-wua", "Cookie"])
    if (!getHeaderCI(headers, n).trim()) return `缺少请求头: ${n}`
  return null
}

/** 识别已有协议中的会话过期提示，忽略非字符串返回项。 */
function isSessionExpired(json: any): boolean {
  const ret = json?.ret
  return Array.isArray(ret) && ret.some((r: unknown) => typeof r === "string" && (r.includes("SESSION_EXPIRED") || r.includes("Session过期")))
}

/** 只展示 MTOP 错误码或 HTTP 状态，不把返回描述中的账号数据带入界面或日志。 */
function getRequestError(json: any, status: number): string {
  const ret = json?.ret
  if (Array.isArray(ret)) {
    for (const value of ret) {
      if (typeof value !== "string") continue
      const code = value.split("::")[0]
      if (code !== "SUCCESS" && /^[A-Z][A-Z0-9_]{0,79}$/.test(code)) return code
    }
  }
  return `HTTP ${status}`
}

// ========== autologin 换 sid ==========

const AUTOLOGIN_DATA_KEY = "cniao_autologin_data"
const AUTOLOGIN_SOURCE_KEY = "cniao_autologin_source"
const SESSION_KEY = "cniao_package_session"

type PackageSession = { sourceHeaders: string; sid: string }
type SessionRefreshResult = { sid: string } | { errorMessage: string }

/** 更新原生 autoLoginRequest 内的 token，兼容原先抓取的扁平 data；不增加猜测字段。 */
function rotateAutologinData(raw: string, refreshToken: string, accountId: unknown): string {
  const payload = JSON.parse(raw)
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("autologin data 格式错误")
  const nested = typeof payload.autoLoginRequest === "string"
  const request = nested ? JSON.parse(payload.autoLoginRequest) : payload
  if (!request || typeof request !== "object" || Array.isArray(request) || typeof request.refreshToken !== "string" || !request.refreshToken.trim()) {
    throw new Error("autologin 缺少 refreshToken")
  }
  request.refreshToken = refreshToken
  if ("accountId" in request && (typeof accountId === "string" || typeof accountId === "number")) request.accountId = accountId
  if (nested) payload.autoLoginRequest = JSON.stringify(request)
  return JSON.stringify(payload)
}

/** 同一抓取来源使用已轮换的 token，并迁移旧版误写到外层的轮换结果。 */
async function getAutologinData(): Promise<string | null> {
  let cached = Storage.get<string>(AUTOLOGIN_DATA_KEY)
  const source = Storage.get<string>(AUTOLOGIN_SOURCE_KEY)
  if (cached && source) {
    try {
      const saved = JSON.parse(cached)
      const captured = JSON.parse(source)
      // 旧版只向外层添加 refreshToken；仅迁移原抓取没有这些字段的原生封装。
      if (typeof saved?.autoLoginRequest === "string" && typeof saved.refreshToken === "string" && saved.refreshToken.trim()
        && typeof captured?.autoLoginRequest === "string" && !("refreshToken" in captured)) {
        const migrated = JSON.parse(rotateAutologinData(cached, saved.refreshToken, saved.accountId))
        delete migrated.refreshToken
        if (!("accountId" in captured)) delete migrated.accountId
        cached = JSON.stringify(migrated)
        if (!Storage.set(AUTOLOGIN_DATA_KEY, cached)) return null
        console.log("已迁移旧版续期凭据")
      }
    } catch { console.log("续期凭据迁移失败，保留原始数据") }
  }
  const fromBox = await fetchBoxJs("cainiao_autologin_data")
  if (!fromBox) return cached || null
  if (source === fromBox && cached) return cached
  Storage.set(AUTOLOGIN_DATA_KEY, fromBox)
  Storage.set(AUTOLOGIN_SOURCE_KEY, fromBox)
  return fromBox
}

/** 沿用原有 autologin 请求续期会话，仅记录执行状态。 */
async function refreshSessionId(): Promise<SessionRefreshResult> {
  const raw = await fetchBoxJs("cainiao_autologin_headers_json")
  if (!raw) return { errorMessage: "缺少续期请求头，请打开菜鸟触发 autologin 抓取" }
  const boxJs = parseHeaders(raw)
  if (!boxJs) return { errorMessage: "续期请求头格式错误，请重新抓取" }

  const appData = await getAutologinData()
  if (!appData) return { errorMessage: "缺少续期 data，请打开菜鸟触发 autologin 抓取" }
  try {
    // 先校验真实请求结构，避免将缺失或错误的数据发送给登录接口。
    const payload = JSON.parse(appData)
    const request = typeof payload?.autoLoginRequest === "string" ? JSON.parse(payload.autoLoginRequest) : payload
    if (!request || typeof request.refreshToken !== "string" || !request.refreshToken.trim()) {
      return { errorMessage: "续期 data 缺少 refreshToken，请重新抓取" }
    }
  } catch { return { errorMessage: "续期 data 格式错误，请重新抓取" } }

  const h = { ...boxJs }
  for (const key of Object.keys(h)) {
    if (["content-length", "connection"].includes(key.toLowerCase())) delete h[key]
  }
  setHeaderCI(h, "x-t", String(Math.floor(Date.now() / 1000)))
  setHeaderCI(h, "Host", "cn-acs.m.cainiao.com")
  h["x-cniao-skip-capture"] = "1"
  h["api"] = REFRESH_API; h["v"] = "1.0"

  const url = `${REFRESH_URL}?rnd=${encodeURIComponent(generateRnd())}&data=${encodeURIComponent(appData)}`
  try {
    const resp = await fetch(url, { method: "GET", headers: h, timeout: 12 })
    const json = await resp.json().catch(() => null)
    const ret = json?.ret
    console.log("autologin 响应已收到")
    if (resp.ok && Array.isArray(ret) && ret.length > 0 && ret.every((value: unknown) => typeof value === "string" && value.split("::")[0] === "SUCCESS")) {
      const sessionData = (json as any)?.data?.data
      const sid: string | undefined = sessionData?.sessionId
      if (typeof sid !== "string" || !sid.trim()) return { errorMessage: "续期响应缺少 sessionId" }

      const newRefreshToken: string | undefined = sessionData?.refreshToken
      if (typeof newRefreshToken === "string" && newRefreshToken.trim()) {
        try {
          // token 可能在服务端立即轮换，先保存；包裹查询失败也不能回滚成旧 token。
          const updated = rotateAutologinData(appData, newRefreshToken, sessionData?.cnAccountId)
          if (!Storage.set(AUTOLOGIN_DATA_KEY, updated)) return { errorMessage: "新续期凭据保存失败，请重试" }
        } catch { return { errorMessage: "新续期凭据更新失败，请重新抓取" } }
      }
      console.log("会话续期成功")
      return { sid }
    }
    return { errorMessage: `自动续期被拒绝：${getRequestError(json, resp.status)}；请打开菜鸟更新登录态` }
  } catch (e) { console.log("autologin 请求失败"); return { errorMessage: "自动续期网络失败，下次刷新将重试" } }
}

// ========== 包裹查询 ==========

/** 沿用原有包裹查询、会话续期与 BoxJS 重试顺序。 */
export async function getPackages(): Promise<PackageResult> {
  const raw = await fetchBoxJs("cainiao_pcs_headers_json")
  if (!raw) return { items: null, errorMessage: "未读取到 cainiao_pcs_headers_json" }
  const boxJs = parseHeaders(raw)
  if (!boxJs) return { items: null, errorMessage: "headers JSON 解析失败" }

  const dataStr = JSON.stringify(buildRequestData())
  const headers = preparePackageHeaders(boxJs)
  // sid 只绑定产生它的原始抓取头；App 重新抓取或切换账号后自动停用。
  const session = Storage.get<PackageSession>(SESSION_KEY)
  if (session?.sourceHeaders === raw && typeof session.sid === "string" && session.sid) {
    setHeaderCI(headers, "x-sid", session.sid)
  }
  const missing = validateHeaders(headers)
  if (missing) return { items: null, errorMessage: `${missing}，token 可能已失效` }

  try {
    const url = `${API_URL}?rnd=${encodeURIComponent(generateRnd())}&data=${encodeURIComponent(dataStr)}`
    const resp = await fetch(url, { method: "GET", headers, timeout: 12 })
    // HTTP 401/403 即使返回 HTML 或空响应，也必须进入续期分支。
    const json = await resp.json().catch(() => null)

    if (resp.ok && !isSessionExpired(json)) {
      const items = extractPackages(json)
      if (items) return { items }
      return { items: null, errorMessage: json ? getRequestError(json, resp.status) : "包裹响应不是 JSON" }
    }

    // Session 过期 → autologin 换 sid → 重试
    let msg = getRequestError(json, resp.status)
    console.log("包裹查询失败，HTTP 状态:", resp.status)

    if (resp.status === 401 || resp.status === 403 || isSessionExpired(json)) {
      console.log("会话过期，autologin 换 sid...")
      const renewal = await refreshSessionId()
      if ("sid" in renewal) {
        setHeaderCI(headers, "x-sid", renewal.sid)
        const r2 = await fetch(url, { method: "GET", headers, timeout: 12 })
        const j2 = await r2.json().catch(() => null)
        if (r2.ok && !isSessionExpired(j2)) {
          const items = extractPackages(j2)
          if (items) {
            // 只有业务查询成功，才持久化新 sid，供下一轮组件刷新复用。
            Storage.set<PackageSession>(SESSION_KEY, { sourceHeaders: raw, sid: renewal.sid })
            return { items }
          }
        }
        msg = `续期后包裹查询失败：${getRequestError(j2, r2.status)}`
      } else msg = renewal.errorMessage
      // 回退 BoxJS
      console.log("回退 BoxJS 重试...")
      const fbRaw = await fetchBoxJs("cainiao_pcs_headers_json")
      if (fbRaw) {
        const fbBoxJs = parseHeaders(fbRaw)
        if (fbBoxJs) {
          const fbH = preparePackageHeaders(fbBoxJs)
          const fbResp = await fetch(url, { method: "GET", headers: fbH, timeout: 12 })
          const fbJson = await fbResp.json().catch(() => null)
          if (fbResp.ok && !isSessionExpired(fbJson)) {
            const items = extractPackages(fbJson)
            if (items) {
              // 原始抓取恢复可用后，用成功的 sid 替换旧续期结果。
              Storage.set<PackageSession>(SESSION_KEY, { sourceHeaders: fbRaw, sid: getHeaderCI(fbH, "x-sid") })
              return { items }
            }
          }
        }
      }
    }
    return { items: null, errorMessage: msg }
  } catch (e) { console.log("包裹请求或解析失败"); return { items: null, errorMessage: "请求出错，请稍后重试" } }
}

// ========== 响应解析 ==========

/** 只接受包裹数组；存在 MTOP 返回码时必须全部成功。 */
function extractPackages(json: unknown): PickupItem[] | null {
  const ret = (json as { ret?: unknown })?.ret
  if (ret !== undefined && (!Array.isArray(ret) || ret.length === 0 || !ret.every(value => typeof value === "string" && value.split("::")[0] === "SUCCESS"))) return null
  const pkgs = (json as { data?: { packages?: unknown } })?.data?.packages
  return Array.isArray(pkgs) ? filterPackages(pkgs) : null
}

/** 按现有状态筛选包裹，补充资源代码确认的 feature、取件码和承运商字段。 */
function filterPackages(packages: unknown[]): PickupItem[] {
  const allow = ["派送中", "待取件", "运输中"]
  const sm: Record<string, string> = { 派送中: "派送中", 待取件: "待取件", 运输中: "运输中", 已揽件: "运输中", 已揽收: "运输中", 已发货: "运输中", 揽收: "运输中", 揽件: "运输中" }
  const result: PickupItem[] = []
  for (const pkg of packages) {
    if (!pkg || typeof pkg !== "object") continue
    const p = pkg as Record<string, unknown>
    let feat: Record<string, unknown> = {}
    // 保留已用的字符串格式，同时接收资源模型中直接访问的对象格式。
    let feature = p.feature
    if (typeof feature === "string" && feature) {
      try { feature = JSON.parse(feature) } catch { feature = undefined }
    }
    if (feature && typeof feature === "object" && !Array.isArray(feature)) feat = feature as Record<string, unknown>
    const fo = (p.featureObj && typeof p.featureObj === "object" && !Array.isArray(p.featureObj) ? p.featureObj : {}) as Record<string, unknown>
    const ps = (p.packageStation && typeof p.packageStation === "object" && !Array.isArray(p.packageStation) ? p.packageStation : {}) as Record<string, unknown>
    let rs = String(p.logisticsStatusDesc ?? "")
    if (!rs) rs = String(feat.packageStatusDesc ?? feat.packageStatusInfoDesc ?? "")
    const show = sm[rs] ?? rs; if (!allow.includes(show)) continue
    let rel = String(p.phoneRelation ?? "")
    if (!rel) rel = String(fo.phoneRelation ?? "")
    if (!rel) rel = String(fo.bindingUserRemark ?? fo.bindingRemark ?? "")
    let pbn = String(ps.postBrandName ?? "")
    if (!pbn) pbn = String(fo.postBrandName ?? "")
    if (!pbn && typeof p.partnerName === "string") pbn = p.partnerName
    let sn = String(ps.stationName ?? "")
    if (!sn) sn = String(fo.postName ?? fo.daishouName ?? "")
    let pc = String(p.stationOrderPickUpCode ?? "")
    if (!pc) pc = String(fo.stationOrderPickUpCode ?? "")
    // 新增站点码遵守资源中的展示开关，不覆盖原有可用取件码。
    if (!pc && ps.showAuthCode === true && typeof ps.authCode === "string") pc = ps.authCode
    let title = ""
    const pi = Array.isArray(p.packageItem) ? p.packageItem : []
    if (pi[0] && typeof pi[0] === "object") title = String((pi[0] as Record<string, unknown>).itemTitle ?? "")
    if (!title) title = String(feat.recommendPackageTitle ?? "")
    if (!title) title = String(fo.recommendAbbPackageTitle ?? "")
    result.push({ status: show, relation: rel, postBrandName: pbn, stationName: sn, pic: String(feat.recommendPackagePic ?? ""), code: pc, name: title })
  }
  return result
}

