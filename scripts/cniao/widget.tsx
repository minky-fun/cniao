// 菜鸟随行小组件展示与刷新调度；请求和续期由 cainiao.ts 负责。
import {
  VStack, HStack, ZStack, Image, Text, Button, Link, Widget,
  WidgetReloadPolicy, DynamicShapeStyle, Spacer,
} from "scripting"
import { RefreshCainiaoIntent, ShowNextCainiaoItemIntent } from "./app_intents"
import { getPackages } from "./cainiao"
import type { PickupItem } from "./cainiao"
import { getSettings } from "./settings"

type Theme = {
  bg: DynamicShapeStyle; panelBg: DynamicShapeStyle; pillBg: DynamicShapeStyle
  softBg: DynamicShapeStyle; title: DynamicShapeStyle; secondary: DynamicShapeStyle
  tertiary: DynamicShapeStyle; code: DynamicShapeStyle; icon: DynamicShapeStyle
  badgeBg: DynamicShapeStyle; badgeText: DynamicShapeStyle
}

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

// ========== 排序 ==========

/** 确定取件状态的展示优先级。 */
function getItemPriority(item: PickupItem): number {
  if (item.code.trim()) return 0
  if (item.status === "运输中") return 2
  return 1
}
/** 按取件优先级和已确认的包裹信息稳定排序。 */
function sortPickupItems(items: PickupItem[]): PickupItem[] {
  return [...items].sort((a, b) => {
    const d = getItemPriority(a) - getItemPriority(b)
    if (d !== 0) return d
    if (a.status === "派送中" && b.status !== "派送中") return -1
    if (b.status === "派送中" && a.status !== "派送中") return 1
    return 0
  })
}
/** 按当前展示顺序选取地点、承运商、关系或状态。 */
function getItemMeta(item: PickupItem): string { return item.stationName || item.postBrandName || item.relation || item.status }
/** 有取件码时优先显示取件码，否则展示物流状态。 */
function getPrimaryCode(item: PickupItem): string { return item.code || item.status }
/** 读取小号分页索引，并限制到当前包裹数量范围。 */
function getSmallPageIndex(total: number): number {
  if (total <= 0) return 0
  const i = Storage.get<number>("cniaoSmallPageIndex") ?? 0
  return Number.isSafeInteger(i) && i >= 0 ? i % total : 0
}
/** 将本次刷新时间格式化为本地小时和分钟。 */
function fmtHHmm(d: Date) { return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }

// ========== UI ==========

/** 展示组件标题、数量、更新时间和可重复触发的刷新入口。 */
function WidgetHeader({ countText, trailingText }: { countText?: string; trailingText?: string }) {
  return (
    <HStack alignment="center" spacing={8} frame={{ minWidth: 0, maxWidth: Infinity }}>
      <HStack alignment="center" spacing={6}>
        <Image systemName="shippingbox.fill" font={14} fontWeight="semibold" foregroundStyle={theme.icon} />
        <Text font={13} fontWeight="bold" foregroundStyle={theme.title} lineLimit={1}>菜鸟随行</Text>
      </HStack>
      <Spacer />
      {countText ? <Text font={11} fontWeight="semibold" foregroundStyle={theme.badgeText} padding={{ top: 4, leading: 8, bottom: 4, trailing: 8 }} widgetBackground={{ style: theme.badgeBg, shape: { type: "capsule", style: "continuous" } }}>{countText}</Text> : null}
      {trailingText ? <Text font={10} fontWeight="medium" foregroundStyle={theme.tertiary} lineLimit={1}>{trailingText}</Text> : null}
      <Button intent={RefreshCainiaoIntent({})} buttonStyle="plain" accessibilityLabel="刷新包裹">
        <Image systemName="arrow.clockwise" font={11} fontWeight="bold" foregroundStyle={theme.badgeText} frame={{ width: 26, height: 26 }} /></Button>
    </HStack>
  )
}

/** 无进行中包裹时显示紧凑说明，刷新入口由外层标题保留。 */
function EmptyState({ message }: { message: string }) {
  return (
    <VStack alignment="center" spacing={8} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} padding={8}>
      <ZStack frame={{ width: 32, height: 32 }} widgetBackground={{ style: theme.softBg, shape: { type: "rect", cornerRadius: 14, style: "continuous" } }}>
        <Image systemName="shippingbox" font={20} fontWeight="semibold" foregroundStyle={theme.icon} /></ZStack>
      <Text font={13} fontWeight="semibold" foregroundStyle={theme.title}>{message}</Text>
    </VStack>
  )
}

/** 大号列表展示包裹标题、取件地点和取件码。 */
function PillRow({ item, compact }: { item: PickupItem; compact?: boolean }) {
  const is = compact ? 13 : 15; const nf = compact ? 11 : 12; const sf = compact ? 9 : 10
  const cf = compact ? 13 : 15; const py = compact ? 7 : 9; const ps = compact ? 24 : 28
  return (
    <HStack alignment="center" spacing={10} padding={{ top: py, leading: 10, bottom: py, trailing: 10 }} frame={{ minWidth: 0, maxWidth: Infinity }} widgetBackground={{ style: theme.pillBg, shape: { type: "rect", cornerRadius: 14, style: "continuous" } }}>
      <HStack alignment="center" spacing={8} frame={{ minWidth: 0, maxWidth: Infinity }}>
        {item.pic ? <Image imageUrl={item.pic} resizable frame={{ width: ps, height: ps }} /> : <Image systemName="shippingbox.fill" font={is} fontWeight="semibold" foregroundStyle={theme.icon} />}
        <VStack alignment="leading" spacing={2} frame={{ minWidth: 0, maxWidth: Infinity }}>
          <Text font={nf} fontWeight="semibold" foregroundStyle={theme.title} lineLimit={1} frame={{ minWidth: 0, maxWidth: Infinity }}>{item.name || getItemMeta(item)}</Text>
          <Text font={sf} fontWeight="medium" foregroundStyle={theme.secondary} lineLimit={1} frame={{ minWidth: 0, maxWidth: Infinity }}>{getItemMeta(item)}</Text>
        </VStack>
      </HStack>
      {compact ? <Text widgetAccentable font={cf} fontWeight="bold" foregroundStyle={theme.code} lineLimit={1} minScaleFactor={0.72}>{getPrimaryCode(item)}</Text>
        : <VStack alignment="trailing" spacing={2} padding={{ top: 4, leading: 8, bottom: 4, trailing: 8 }} widgetBackground={{ style: theme.softBg, shape: { type: "rect", cornerRadius: 12, style: "continuous" } }}>
          <Text font={9} fontWeight="medium" foregroundStyle={theme.tertiary}>{item.code ? "取件码" : "状态"}</Text>
          <Text widgetAccentable font={cf} fontWeight="bold" foregroundStyle={theme.code} lineLimit={1} minScaleFactor={0.72}>{getPrimaryCode(item)}</Text>
        </VStack>}
    </HStack>
  )
}

/** 中号展示商品缩略图、标题和取件地点，固定行高便于计算容量。 */
function CompactMediumRow({ item }: { item: PickupItem }) {
  return (
    <HStack alignment="center" spacing={8} padding={{ top: 5, leading: 9, bottom: 5, trailing: 9 }} frame={{ minWidth: 0, maxWidth: Infinity, height: 40 }} widgetBackground={{ style: theme.pillBg, shape: { type: "rect", cornerRadius: 12, style: "continuous" } }}>
      {item.pic ? <Image imageUrl={item.pic} resizable scaleToFit frame={{ width: 28, height: 28 }} />
        : <Image systemName="shippingbox.fill" font={12} fontWeight="semibold" foregroundStyle={theme.icon} frame={{ width: 28, height: 28 }} />}
      <VStack alignment="leading" spacing={2} frame={{ minWidth: 0, maxWidth: Infinity }}>
        <Text font={11} fontWeight="semibold" foregroundStyle={theme.title} lineLimit={1}>{item.name || getItemMeta(item)}</Text>
        <Text font={9} foregroundStyle={theme.secondary} lineLimit={1}>{getItemMeta(item)}</Text>
      </VStack>
      <Text widgetAccentable font={13} fontWeight="bold" foregroundStyle={theme.code} lineLimit={1} minScaleFactor={0.65}>{getPrimaryCode(item)}</Text>
    </HStack>
  )
}

/** 小号并排展示商品图和标题，按实际高度收紧间距并保留刷新入口。 */
function SmallView({ items }: { items: PickupItem[] }) {
  const total = items.length
  const index = getSmallPageIndex(total)
  const item = items[index]
  const compact = Widget.displaySize.height < 170
  return (
    <VStack alignment="leading" spacing={compact ? 5 : 8} padding={10} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 18, style: "continuous" } }}>
      <HStack alignment="center" spacing={4}>
        <Text font={11} fontWeight="bold" foregroundStyle={theme.title} lineLimit={1}>菜鸟随行</Text>
        <Spacer />
        {total > 1 ? <Button intent={ShowNextCainiaoItemIntent({})} buttonStyle="plain" accessibilityLabel={`下一件包裹，当前第 ${index + 1} 件，共 ${total} 件`}>
          <Image systemName="chevron.right" font={11} fontWeight="bold" foregroundStyle={theme.badgeText} frame={{ width: 26, height: 26 }} />
        </Button> : null}
        <Button intent={RefreshCainiaoIntent({})} buttonStyle="plain" accessibilityLabel="刷新包裹">
          <Image systemName="arrow.clockwise" font={11} fontWeight="bold" foregroundStyle={theme.badgeText} frame={{ width: 26, height: 26 }} />
        </Button>
      </HStack>
      {item ? <VStack alignment="leading" spacing={compact ? 4 : 6} padding={10} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.panelBg, shape: { type: "rect", cornerRadius: 14, style: "continuous" } }}>
        <HStack alignment="center" spacing={6}>
          {item.pic ? <Image imageUrl={item.pic} resizable scaleToFit frame={{ width: compact ? 28 : 34, height: compact ? 28 : 34 }} /> : null}
          <VStack alignment="leading" spacing={3} frame={{ minWidth: 0, maxWidth: Infinity }}>
            <Text font={12} fontWeight="semibold" foregroundStyle={theme.title} lineLimit={compact ? 1 : 2}>{item.name || getItemMeta(item)}</Text>
            <Text font={10} foregroundStyle={theme.secondary} lineLimit={1}>{getItemMeta(item)}</Text>
          </VStack>
        </HStack>
        <Spacer />
        <Text font={9} foregroundStyle={theme.tertiary}>{item.code ? "取件码" : "物流状态"}</Text>
        <HStack spacing={4}>
          <Text widgetAccentable font={compact ? 22 : 26} fontWeight="bold" foregroundStyle={theme.code} lineLimit={1} minScaleFactor={0.5} frame={{ minWidth: 0, maxWidth: Infinity }}>{getPrimaryCode(item)}</Text>
          <Text font={9} foregroundStyle={theme.secondary}>{index + 1}/{total}</Text>
        </HStack>
      </VStack> : <EmptyState message="暂无进行中包裹" />}
    </VStack>
  )
}

/** 根据中号可用高度安排列表，剩余数量提供明确的 App 查看入口。 */
function MediumView({ items }: { items: PickupItem[] }) {
  const capacity = Math.max(1, Math.min(3, Math.floor((Widget.displaySize.height - 66) / 46)))
  const list = items.slice(0, capacity)
  const remaining = items.length - list.length
  return (
    <VStack alignment="leading" padding={10} spacing={6} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 18, style: "continuous" } }}>
      <WidgetHeader countText={`${items.length} 件`} trailingText={fmtHHmm(new Date())} />
      {list.length === 0 ? <EmptyState message="暂无进行中包裹" /> : list.map((item, index) => <CompactMediumRow item={item} key={index} />)}
      <Spacer />
      {remaining > 0 ? <Link url="cainiao://"><Text font={9} foregroundStyle={theme.secondary}>另有 {remaining} 件，打开菜鸟查看</Text></Link> : null}
    </VStack>
  )
}

/** 根据大号实际高度限制行数，避免固定六行挤出组件边界。 */
function LargeView({ items }: { items: PickupItem[] }) {
  const capacity = Math.max(1, Math.min(6, Math.floor((Widget.displaySize.height - 76) / 48)))
  const list = items.slice(0, capacity)
  const remaining = items.length - list.length
  return (
    <VStack alignment="leading" padding={12} spacing={6} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 20, style: "continuous" } }}>
      <WidgetHeader countText={`${items.length} 件`} trailingText={`更新 ${fmtHHmm(new Date())}`} />
      {list.length === 0 ? <EmptyState message="暂无进行中包裹" /> : list.map((item, index) => <PillRow item={item} compact key={index} />)}
      <Spacer />
      {remaining > 0 ? <Link url="cainiao://"><Text font={10} foregroundStyle={theme.secondary}>另有 {remaining} 件，打开菜鸟查看</Text></Link> : null}
    </VStack>
  )
}

/** 使用官方 Widget.family 分配尺寸布局。 */
function WidgetView({ items }: { items: PickupItem[] }) {
  if (Widget.family === "systemLarge" || Widget.family === "systemExtraLarge") return <LargeView items={items} />
  if (Widget.family === "systemMedium") return <MediumView items={items} />
  return <SmallView items={items} />
}

/** 失败时保留打开 App 和手动重试入口，小号采用更紧凑的布局。 */
function ErrorView({ message }: { message: string }) {
  const isSmall = Widget.family === "systemSmall"

  return (
    <ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: theme.bg, shape: { type: "rect", cornerRadius: 18, style: "continuous" } }}>
      <VStack alignment="center" spacing={isSmall ? 5 : 10} padding={isSmall ? 10 : 16} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }}>
        <ZStack frame={{ width: 32, height: 32 }} widgetBackground={{ style: theme.softBg, shape: { type: "rect", cornerRadius: 14, style: "continuous" } }}>
          <Image systemName="exclamationmark.triangle.fill" font={20} fontWeight="semibold" foregroundStyle={theme.icon} /></ZStack>
        <Text font={13} fontWeight="semibold" foregroundStyle={theme.title}>菜鸟连接异常</Text>
        <Text font={isSmall ? 10 : 11} fontWeight="medium" foregroundStyle={theme.secondary} lineLimit={isSmall ? 2 : 3}>{message}</Text>
        <HStack alignment="center" spacing={8}>
          <Link url="cainiao://">
            <HStack alignment="center" spacing={6} padding={{ top: 6, leading: isSmall ? 8 : 14, bottom: 6, trailing: isSmall ? 8 : 14 }} widgetBackground={{ style: theme.badgeBg, shape: { type: "capsule", style: "continuous" } }}>
              <Image systemName="arrow.up.forward.app.fill" font={11} fontWeight="semibold" foregroundStyle={theme.badgeText} />
              <Text font={12} fontWeight="semibold" foregroundStyle={theme.badgeText}>{isSmall ? "打开" : "打开菜鸟"}</Text>
            </HStack>
          </Link>
          <Button intent={RefreshCainiaoIntent({})} buttonStyle="borderless">
              <HStack alignment="center" spacing={6} padding={{ top: 6, leading: isSmall ? 8 : 14, bottom: 6, trailing: isSmall ? 8 : 14 }} widgetBackground={{ style: theme.badgeBg, shape: { type: "capsule", style: "continuous" } }}>
                <Image systemName="arrow.clockwise" font={11} fontWeight="semibold" foregroundStyle={theme.badgeText} />
                <Text font={12} fontWeight="semibold" foregroundStyle={theme.badgeText}>刷新</Text>
              </HStack>
          </Button>
        </HStack>
      </VStack>
    </ZStack>
  )
}

// ========== 入口 ==========

/** 查询并展示当前包裹，按用户配置安排下一次刷新。 */
async function showWidget() {
  const s = getSettings()
  const result = await getPackages()
  const policy: WidgetReloadPolicy = { policy: "after", date: new Date(Date.now() + s.refreshInterval * 60 * 1000) }
  if (result.items === null) { Widget.present(<ErrorView message={result.errorMessage ?? "请求失败"} />, policy); return }
  const items = result.items
  Widget.present(<WidgetView items={sortPickupItems(items)} />, policy)
}

showWidget()
