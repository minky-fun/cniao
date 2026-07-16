// widget2.tsx — 包裹查询 + autologin 自动换 sid
import {
  VStack, HStack, ZStack, Image, Text, Button, Widget,
  WidgetReloadPolicy, DynamicShapeStyle, Spacer, fetch,
} from "scripting"
import { RefreshCainiaoIntent, ShowNextCainiaoItemIntent } from "./app_intents"

// ========== 类型 ==========

type PickupItem = {
  status: string; relation: string; name: string; code: string
  pic: string; stationName: string; postBrandName: string
}
type Theme = {
  bg: DynamicShapeStyle; panelBg: DynamicShapeStyle; pillBg: DynamicShapeStyle
  softBg: DynamicShapeStyle; title: DynamicShapeStyle; secondary: DynamicShapeStyle
  tertiary: DynamicShapeStyle; code: DynamicShapeStyle; icon: DynamicShapeStyle
  badgeBg: DynamicShapeStyle; badgeText: DynamicShapeStyle
}
type CainiaoSettings = { boxJsUrl: string; refreshInterval: number }
type PackageResult = { items: PickupItem[] | null; errorMessage?: string }

// ========== 常量 ==========

const SETTINGS_KEY = "cniaoSettings"
const API_NAME = "mtop.cainiao.lpc.packageservice.querypdspackagedatalist.cn"
const API_URL = `https://caps-mtop.cainiao.com/gw/${API_NAME}/1.0`
const REFRESH_API = "mtop.cainiao.cnmember.customer.autologin"
const REFRESH_URL = `https://cn-acs.m.cainiao.com/gw/${REFRESH_API}/1.0`

const DEFAULT_SETTINGS: CainiaoSettings = { boxJsUrl: "http://boxjs.com", refreshInterval: 15 }

const theme: Theme = {
  bg: { light: "rgba(234, 243, 255, 0.92)", dark: "rgba(12, 24, 43, 0.92)" },
  panelBg: { light: "rgba(255, 255, 255, 0.84)", dark: "rgba(19, 37, 63, 0.90)" },
  pillBg: { light: "rgba(255, 255, 255, 0.78)", dark: "rgba(24, 45, 75, 0.94)" },
  softBg: { light: "rgba(43, 108, 255, 0.10)", dark: "rgba(106, 166, 255, 0.16)" },
  title: { light: "rgba(17, 24, 39, 0.92)", dark: "rgba(243, 244, 246, 0.92)" },
  secondary: { light: "rgba(107, 114, 128, 0.95)", dark: "rgba(156, 163, 175, 0.95)" },
  tertiary: { light: "rgba(148, 163, 184, 0.95)", dark: "rgba(100, 116, 139, 0.95)" },
  code: { light: "rgba(43, 108, 255, 0.98)", dark: "rgba(106, 166, 255, 0.98)" },
  icon: { light: "rgba(43, 108, 255, 0.85)", dark: "rgba(106, 166, 255, 0.90)" },
  badgeBg: { light: "rgba(43, 108, 255, 0.14)", dark: "rgba(106, 166, 255, 0.18)" },
  badgeText: { light: "rgba(35, 86, 209, 0.98)", dark: "rgba(160, 205, 255, 0.98)" },
}

const mockItems: PickupItem[] = []

// ========== 工具函数 ==========

function getSettings(): CainiaoSettings {
  const saved = Storage.get<Partial<CainiaoSettings>>(SETTINGS_KEY) ?? {}
  return {
    boxJsUrl: saved.boxJsUrl?.trim() || DEFAULT_SETTINGS.boxJsUrl,
    refreshInterval: typeof saved.refreshInterval === "number" && saved.refreshInterval > 0
      ? saved.refreshInterval : DEFAULT_SETTINGS.refreshInterval,
  }
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

function generateRnd(): string {
  const alphabet = "0123456789ABCDEF"
  let r = ""
  for (let i = 0; i < 32; i++) r += alphabet[Math.floor(Math.random() * alphabet.length)]
  return r
}

// ========== BoxJS 读取 ==========

async function fetchBoxJs(key: string): Promise<string | null> {
  const s = getSettings()
  try {
    const resp = await fetch(`${s.boxJsUrl.replace(/\/$/, "")}/query/data/${key}`, {
      headers: { Accept: "application/json" },
    })
    if (!resp.ok) { console.log(`BoxJS ${key}:`, resp.status); return null }
    const json = await resp.json()
    const val = json?.val
    return typeof val === "string" && val.trim() ? val.trim() : null
  } catch (e) { console.log(`BoxJS ${key} 异常:`, e); return null }
}

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

function buildRequestData() {
  return {
    currentPage: 1, pageSize: 40, needTemporality: false,
    needDynInfo: "{'needFindTemporality':true,'needAppointment':true}",
  }
}

function preparePackageHeaders(boxJsHeaders: Record<string, string>): Record<string, string> {
  const h = { ...boxJsHeaders }
  delete h["Content-Length"]; delete h["Connection"]
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

function validateHeaders(headers: Record<string, string>): string | null {
  for (const n of ["x-t", "x-sid", "x-sign", "x-mini-wua", "Cookie"])
    if (!getHeaderCI(headers, n).trim()) return `缺少请求头: ${n}`
  return null
}

function isSessionExpired(json: any): boolean {
  const ret = json?.ret
  return Array.isArray(ret) && ret.some((r: string) => r.includes("SESSION_EXPIRED") || r.includes("Session过期"))
}

// ========== autologin 换 sid（已验证） ==========

async function refreshSessionId(): Promise<string | null> {
  const raw = await fetchBoxJs("cainiao_autologin_headers_json")
  if (!raw) { console.log("无 autologin headers"); return null }
  const boxJs = parseHeaders(raw)
  if (!boxJs) { console.log("autologin headers 解析失败"); return null }

  const appData = await fetchBoxJs("cainiao_autologin_data")
  if (!appData) { console.log("无 autologin data"); return null }

  const h = { ...boxJs }
  delete h["Content-Length"]; delete h["Connection"]
  setHeaderCI(h, "Host", "cn-acs.m.cainiao.com")
  h["x-cniao-skip-capture"] = "1"
  h["api"] = REFRESH_API; h["v"] = "1.0"

  const url = `${REFRESH_URL}?rnd=${encodeURIComponent(generateRnd())}&data=${encodeURIComponent(appData)}`
  try {
    const resp = await fetch(url, { method: "GET", headers: h })
    const json = await resp.json()
    const ret = (json as any)?.ret?.[0] || ""
    console.log("autologin:", ret)
    if (resp.ok && ret.includes("SUCCESS")) {
      const sid = (json as any)?.data?.data?.sessionId
      if (sid) { console.log("新 sid:", sid.substring(0, 12) + "..."); return sid }
    }
    return null
  } catch (e) { console.log("autologin 异常:", e); return null }
}

// ========== 包裹查询 ==========

async function getPackages(): Promise<PackageResult> {
  const raw = await fetchBoxJs("cainiao_pcs_headers_json")
  if (!raw) return { items: null, errorMessage: "未读取到 cainiao_pcs_headers_json" }
  const boxJs = parseHeaders(raw)
  if (!boxJs) return { items: null, errorMessage: "headers JSON 解析失败" }

  const dataStr = JSON.stringify(buildRequestData())
  const headers = preparePackageHeaders(boxJs)
  const missing = validateHeaders(headers)
  if (missing) return { items: null, errorMessage: `${missing}，token 可能已失效` }

  try {
    const url = `${API_URL}?rnd=${encodeURIComponent(generateRnd())}&data=${encodeURIComponent(dataStr)}`
    const resp = await fetch(url, { method: "GET", headers })
    const json = await resp.json()

    if (resp.ok && !isSessionExpired(json)) {
      const items = extractPackages(json)
      if (items) return { items }
      return { items: null, errorMessage: (json as any)?.ret?.[0] || "返回数据格式不符合预期" }
    }

    // Session 过期 → autologin 换 sid → 重试
    const msg = (json as any)?.ret?.[0] || `请求出错: ${resp.status}`
    console.log("包裹查询失败:", msg)

    if (resp.status === 401 || resp.status === 403 || isSessionExpired(json)) {
      console.log("会话过期，autologin 换 sid...")
      const newSid = await refreshSessionId()
      if (newSid) {
        setHeaderCI(headers, "x-sid", newSid)
        const r2 = await fetch(url, { method: "GET", headers })
        const j2 = await r2.json()
        if (r2.ok && !isSessionExpired(j2)) {
          const items = extractPackages(j2)
          if (items) return { items }
        }
      }
      // 回退 BoxJS
      console.log("回退 BoxJS 重试...")
      const fbRaw = await fetchBoxJs("cainiao_pcs_headers_json")
      if (fbRaw) {
        const fbBoxJs = parseHeaders(fbRaw)
        if (fbBoxJs) {
          const fbH = preparePackageHeaders(fbBoxJs)
          const fbResp = await fetch(url, { method: "GET", headers: fbH })
          const fbJson = await fbResp.json()
          if (fbResp.ok) { const items = extractPackages(fbJson); if (items) return { items } }
        }
      }
    }
    return { items: null, errorMessage: msg }
  } catch (e) { console.log("请求异常:", e); return { items: null, errorMessage: "请求出错，请稍后重试" } }
}

// ========== 响应解析 ==========

function extractPackages(json: unknown): PickupItem[] | null {
  const pkgs = (json as { data?: { packages?: unknown } })?.data?.packages
  return Array.isArray(pkgs) ? filterPackages(pkgs) : null
}

function filterPackages(packages: unknown[]): PickupItem[] {
  const allow = ["派送中", "待取件", "运输中"]
  const sm: Record<string, string> = { 派送中: "派送中", 待取件: "待取件", 运输中: "运输中", 已揽件: "运输中", 已揽收: "运输中", 已发货: "运输中", 揽收: "运输中", 揽件: "运输中" }
  const result: PickupItem[] = []
  for (const pkg of packages) {
    if (!pkg || typeof pkg !== "object") continue
    const p = pkg as Record<string, unknown>
    let feat: Record<string, unknown> = {}
    if (typeof p.feature === "string" && p.feature) { try { feat = JSON.parse(p.feature) ?? {} } catch { /* */ } }
    const fo = (typeof p.featureObj === "object" ? p.featureObj : {}) as Record<string, unknown>
    const ps = (typeof p.packageStation === "object" ? p.packageStation : {}) as Record<string, unknown>
    let rs = String(p.logisticsStatusDesc ?? "")
    if (!rs) rs = String(feat.packageStatusDesc ?? feat.packageStatusInfoDesc ?? "")
    const show = sm[rs] ?? rs; if (!allow.includes(show)) continue
    let rel = String(p.phoneRelation ?? "")
    if (!rel) rel = String(fo.phoneRelation ?? "")
    if (!rel) rel = String(fo.bindingUserRemark ?? fo.bindingRemark ?? "")
    let pbn = String(ps.postBrandName ?? "")
    if (!pbn) pbn = String(fo.postBrandName ?? "")
    let sn = String(ps.stationName ?? "")
    if (!sn) sn = String(fo.postName ?? fo.daishouName ?? "")
    let pc = String(p.stationOrderPickUpCode ?? "")
    if (!pc) pc = String(fo.stationOrderPickUpCode ?? "")
    let title = ""
    const pi = Array.isArray(p.packageItem) ? p.packageItem : []
    if (pi[0] && typeof pi[0] === "object") title = String((pi[0] as Record<string, unknown>).itemTitle ?? "")
    if (!title) title = String(feat.recommendPackageTitle ?? "")
    if (!title) title = String(fo.recommendAbbPackageTitle ?? "")
    result.push({ status: show, relation: rel, postBrandName: pbn, stationName: sn, pic: String(feat.recommendPackagePic ?? ""), code: pc, name: title })
  }
  return result
}

// ========== 排序 ==========

function getItemPriority(item: PickupItem): number {
  if (item.code.trim()) return 0
  if (item.status === "运输中") return 2
  return 1
}
function sortPickupItems(items: PickupItem[]): PickupItem[] {
  return [...items].sort((a, b) => {
    const d = getItemPriority(a) - getItemPriority(b)
    if (d !== 0) return d
    if (a.status === "派送中" && b.status !== "派送中") return -1
    if (b.status === "派送中" && a.status !== "派送中") return 1
    return 0
  })
}
function getItemMeta(item: PickupItem): string { return item.stationName || item.postBrandName || item.relation || item.status }
function getPrimaryCode(item: PickupItem): string { return item.code || item.status }
function getSmallPageIndex(total: number): number {
  if (total <= 0) return 0
  const i = Storage.get<number>("cniaoSmallPageIndex") ?? 0
  return i < 0 ? 0 : i % total
}
function fmtHHmm(d: Date) { return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }

// ========== UI ==========

function WidgetHeader({ countText, trailingText }: { countText?: string; trailingText?: string }) {
  return (
    <HStack alignment="center" spacing={8} frame={{ minWidth: 0, maxWidth: Infinity }}>
      <HStack alignment="center" spacing={6}>
        <Image systemName="shippingbox.fill" font={14} fontWeight="semibold" foregroundStyle={theme.icon} />
        <Text font={13} fontWeight="bold" foregroundStyle={theme.title} lineLimit={1}>菜鸟取件</Text>
      </HStack>
      <HStack frame={{ minWidth: 0, maxWidth: Infinity }} />
      {countText ? <Text font={11} fontWeight="semibold" foregroundStyle={theme.badgeText} padding={{ top: 4, leading: 8, bottom: 4, trailing: 8 }} widgetBackground={{ style: theme.badgeBg, shape: { type: "capsule", style: "continuous" } }}>{countText}</Text> : null}
      {trailingText ? <Text font={10} fontWeight="medium" foregroundStyle={theme.tertiary} lineLimit={1}>{trailingText}</Text> : null}
      <Button intent={RefreshCainiaoIntent({})}>
        <Image systemName="arrow.clockwise" font={11} fontWeight="bold" foregroundStyle={theme.badgeText} /></Button>
    </HStack>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <VStack alignment="center" spacing={8} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} padding={{ top: 16, leading: 12, bottom: 16, trailing: 12 }}>
      <ZStack frame={{ width: 42, height: 42 }} widgetBackground={{ style: theme.softBg, shape: { type: "rect", cornerRadius: 14, style: "continuous" } }}>
        <Image systemName="shippingbox" font={20} fontWeight="semibold" foregroundStyle={theme.icon} /></ZStack>
      <Text font={13} fontWeight="semibold" foregroundStyle={theme.title}>{message}</Text>
    </VStack>
  )
}

function PillRow({ item, compact }: { item: PickupItem; compact?: boolean }) {
  const is = compact ? 13 : 15; const nf = compact ? 11 : 12; const sf = compact ? 9 : 10
  const cf = compact ? 13 : 15; const py = compact ? 7 : 9; const ps = compact ? 24 : 28
  return (
    <HStack alignment="center" spacing={10} padding={{ top: py, leading: 10, bottom: py, trailing: 10 }} frame={{ minWidth: 0, maxWidth: Infinity }} widgetBackground={{ style: theme.pillBg, shape: { type: "rect", cornerRadius: 14, style: "continuous" } }}>
      <HStack alignment="center" spacing={8} frame={{ minWidth: 0, maxWidth: Infinity }}>
        {item.pic ? <Image imageUrl={item.pic} resizable frame={{ width: ps, height: ps }} /> : <Image systemName="shippingbox.fill" font={is} fontWeight="semibold" foregroundStyle={theme.icon} />}
        <VStack alignment="leading" spacing={2} frame={{ minWidth: 0, maxWidth: Infinity }}>
          <Text font={nf} fontWeight="semibold" foregroundStyle={theme.title} lineLimit={1} frame={{ minWidth: 0, maxWidth: Infinity }}>{item.name}</Text>
          <Text font={sf} fontWeight="medium" foregroundStyle={theme.secondary} lineLimit={1} frame={{ minWidth: 0, maxWidth: Infinity }}>{getItemMeta(item)}</Text>
        </VStack>
      </HStack>
      {compact ? <Text font={cf} fontWeight="bold" foregroundStyle={theme.code} lineLimit={1} minScaleFactor={0.72}>{getPrimaryCode(item)}</Text>
        : <VStack alignment="trailing" spacing={2} padding={{ top: 4, leading: 8, bottom: 4, trailing: 8 }} widgetBackground={{ style: theme.softBg, shape: { type: "rect", cornerRadius: 12, style: "continuous" } }}>
          <Text font={9} fontWeight="medium" foregroundStyle={theme.tertiary}>{item.code ? "取件码" : "状态"}</Text>
          <Text font={cf} fontWeight="bold" foregroundStyle={theme.code} lineLimit={1} minScaleFactor={0.72}>{getPrimaryCode(item)}</Text>
        </VStack>}
    </HStack>
  )
}

function CompactMediumRow({ item }: { item: PickupItem }) {
  return (
    <HStack alignment="center" spacing={8} padding={{ top: 7, leading: 9, bottom: 7, trailing: 9 }} frame={{ minWidth: 0, maxWidth: Infinity }} widgetBackground={{ style: theme.pillBg, shape: { type: "rect", cornerRadius: 12, style: "continuous" } }}>
      <Image systemName="shippingbox.fill" font={12} fontWeight="semibold" foregroundStyle={theme.icon} />
      <Text font={11} fontWeight="semibold" foregroundStyle={theme.title} lineLimit={1} minScaleFactor={0.82} frame={{ minWidth: 0, maxWidth: Infinity }}>{item.name || getItemMeta(item)}</Text>
      <Text font={13} fontWeight="bold" foregroundStyle={theme.code} lineLimit={1} minScaleFactor={0.72}>{getPrimaryCode(item)}</Text>
    </HStack>
  )
}

function SmallView({ items }: { items: PickupItem[] }) {
  const t = items.length; const idx = getSmallPageIndex(t); const cur = items[idx]
  if (!cur) return (<ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 18, style: "continuous" } }}><EmptyState message="暂无待取" /></ZStack>)
  return (
    <VStack alignment="leading" spacing={10} padding={{ top: 12, leading: 12, bottom: 12, trailing: 12 }} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 18, style: "continuous" } }}>
      <HStack alignment="center" spacing={8} frame={{ minWidth: 0, maxWidth: Infinity }}>
        <Button intent={ShowNextCainiaoItemIntent({})}><Image systemName="chevron.right" font={11} fontWeight="bold" foregroundStyle={theme.badgeText} /></Button>
        <HStack frame={{ minWidth: 0, maxWidth: Infinity }} />
        <Button intent={RefreshCainiaoIntent({})}><Image systemName="arrow.clockwise" font={11} fontWeight="bold" foregroundStyle={theme.badgeText} /></Button>
      </HStack>
      <VStack alignment="leading" spacing={8} padding={{ top: 12, leading: 12, bottom: 12, trailing: 12 }} frame={{ minWidth: 0, maxWidth: Infinity }} widgetBackground={{ style: theme.panelBg, shape: { type: "rect", cornerRadius: 16, style: "continuous" } }}>
        <Text font={13} fontWeight="semibold" foregroundStyle={theme.title} lineLimit={2}>{cur.name}</Text>
        <Text font={10} fontWeight="medium" foregroundStyle={theme.secondary} lineLimit={1}>{getItemMeta(cur)}</Text>
        <HStack alignment="center" spacing={8}>
          <Text font={24} fontWeight="bold" foregroundStyle={theme.code} lineLimit={1} minScaleFactor={0.55} frame={{ minWidth: 0, maxWidth: Infinity }}>{getPrimaryCode(cur)}</Text>
          <Text font={10} fontWeight="semibold" foregroundStyle={theme.badgeText} padding={{ top: 4, leading: 8, bottom: 4, trailing: 8 }} widgetBackground={{ style: theme.badgeBg, shape: { type: "capsule", style: "continuous" } }}>{idx + 1} / {t}</Text>
        </HStack>
      </VStack>
    </VStack>
  )
}

function MediumView({ items }: { items: PickupItem[] }) {
  const list = items.slice(0, 3)
  return (
    <ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 18, style: "continuous" } }}>
      <VStack padding={{ top: 10, leading: 10, bottom: 10, trailing: 10 }} spacing={7}>
        <WidgetHeader countText={`${items.length} 件`} trailingText={fmtHHmm(new Date())} />
        {list.length === 0 ? <EmptyState message="暂无待取" /> : list.map((it) => <CompactMediumRow item={it} key={`${it.name}-${it.code}`} />)}
        <Spacer />
      </VStack>
    </ZStack>
  )
}

function LargeView({ items }: { items: PickupItem[] }) {
  const now = new Date(); const list = items.slice(0, 6)
  if (list.length === 0) return (<ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 20, style: "continuous" } }}><EmptyState message="暂无待取" /></ZStack>)
  return (
    <ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 20, style: "continuous" } }}>
      <VStack alignment="leading" padding={{ top: 12, leading: 12, bottom: 12, trailing: 12 }} spacing={10} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }}>
        <WidgetHeader countText={`${items.length} 件`} trailingText={`更新 ${fmtHHmm(now)}`} />
        {list.map((it) => <PillRow item={it} compact key={`${it.name}-${it.code}`} />)}
        <VStack frame={{ minHeight: 0, maxHeight: Infinity }} />
      </VStack>
    </ZStack>
  )
}

function WidgetView({ items }: { items: PickupItem[] }) {
  const f = (Widget as any).family ?? "systemSmall"
  if (f === "systemLarge") return <LargeView items={items} />
  if (f === "systemMedium") return <MediumView items={items} />
  return <SmallView items={items} />
}

function ErrorView({ message }: { message: string }) {
  return (
    <ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 18, style: "continuous" } }}>
      <VStack alignment="center" spacing={10} padding={{ top: 16, leading: 16, bottom: 16, trailing: 16 }} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }}>
        <ZStack frame={{ width: 42, height: 42 }} widgetBackground={{ style: theme.softBg, shape: { type: "rect", cornerRadius: 14, style: "continuous" } }}>
          <Image systemName="exclamationmark.triangle.fill" font={20} fontWeight="semibold" foregroundStyle={theme.icon} /></ZStack>
        <Text font={13} fontWeight="semibold" foregroundStyle={theme.title}>菜鸟连接异常</Text>
        <Text font={11} fontWeight="medium" foregroundStyle={theme.secondary} lineLimit={3}>{message}</Text>
      </VStack>
    </ZStack>
  )
}

// ========== 入口 ==========

async function showWidget() {
  const s = getSettings()
  const policy: WidgetReloadPolicy = { policy: "after", date: new Date(Date.now() + s.refreshInterval * 60 * 1000) }
  const result = await getPackages()
  if (result.items === null) { Widget.present(<ErrorView message={result.errorMessage ?? "请求失败"} />, policy); return }
  const items = result.items.length > 0 ? result.items : mockItems
  Widget.present(<WidgetView items={sortPickupItems(items)} />, policy)
}

showWidget()
