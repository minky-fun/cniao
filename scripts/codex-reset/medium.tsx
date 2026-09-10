import {
  Canvas,
  GeometryReader,
  HStack,
  Rectangle,
  Text,
  VStack,
  ZStack,
} from "scripting"
import type {
  CanvasRenderingContext,
  CanvasSize,
  DynamicShapeStyle,
  ShapeStyle,
} from "scripting"

import { formatRelativeTime, formatLocalDate } from "./data"
import type { ResetDashboard, ResetRecord, ResetType } from "./data"

type HeatmapDay = {
  resetType: ResetType | null
  isFuture: boolean
}

const WEBSITE_URL = "https://codex-resets.com/"
const DAY_IN_MS = 24 * 60 * 60 * 1000
const PAPER: DynamicShapeStyle = {
  light: { colors: ["#FFF9E9", "#FFF3D7"], startPoint: "topLeading", endPoint: "bottomTrailing" },
  dark: { colors: ["#282117", "#18130F"], startPoint: "topLeading", endPoint: "bottomTrailing" },
}
const INK: DynamicShapeStyle = { light: "#111111", dark: "#FFF8EA" }
const DOT_COLOR = "rgba(121, 93, 48, 0.20)"
const CORAL = "#FF5B3D"
const PINK = "#F28DB8"
const SKY = "#86D9FA"
const YELLOW = "#FFD447"
const EMPTY_CELL = "rgba(174, 142, 88, 0.13)"


/** Draws the subtle paper dot grid used behind every widget size. */
function drawDotPattern(context: CanvasRenderingContext, size: CanvasSize): void {
  context.fillStyle = DOT_COLOR
  for (let y = 8; y < size.height; y += 12) {
    for (let x = 8; x < size.width; x += 12) {
      context.beginPath()
      context.arc(x, y, 0.75, 0, Math.PI * 2)
      context.fill()
    }
  }
}

/** Renders the shared cream paper surface and dot texture. */
function PaperBackground() {
  return (
    <VStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: PAPER, shape: { type: "rect", cornerRadius: 24, style: "continuous" } }}>
      <Canvas draw={drawDotPattern} opaque={false} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} />
    </VStack>
  )
}

/** Converts a date to the UTC day key used by the public history API. */
function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Builds the same Monday-first 26-week calendar used by the large widget. */
function buildHeatmapDays(records: ResetRecord[]): HeatmapDay[] {
  const today = new Date()
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const mondayOffset = (utcToday.getUTCDay() + 6) % 7
  const currentMonday = new Date(utcToday.getTime() - mondayOffset * DAY_IN_MS)
  const firstMonday = new Date(currentMonday.getTime() - 25 * 7 * DAY_IN_MS)
  const resetsByDate = new Map<string, ResetType>()

  for (const record of records) resetsByDate.set(record.announced_at.slice(0, 10), record.reset_type)

  const days: HeatmapDay[] = []
  for (let week = 0; week < 26; week += 1) {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = new Date(firstMonday.getTime() + (week * 7 + weekday) * DAY_IN_MS)
      const dateKey = toUtcDateKey(date)
      days.push({ resetType: resetsByDate.get(dateKey) ?? null, isFuture: date.getTime() > utcToday.getTime() })
    }
  }
  return days
}

/** Creates the medium widget renderer for the 26-week heatmap. */
function createHeatmapDrawer(days: HeatmapDay[]): (context: CanvasRenderingContext, size: CanvasSize) => void {
  /** Paints week columns and weekday rows inside the medium widget. */
  return function drawHeatmap(context: CanvasRenderingContext, size: CanvasSize): void {
    const gap = 1
    const cellWidth = (size.width - gap * 25) / 26
    const cellHeight = (size.height - gap * 6) / 7
    for (let week = 0; week < 26; week += 1) {
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const day = days[week * 7 + weekday]
        context.fillStyle = day.isFuture ? "rgba(0, 0, 0, 0)" : day.resetType === "banked" ? PINK : day.resetType === "regular" ? CORAL : EMPTY_CELL
        drawRoundedCell(context, week * (cellWidth + gap), weekday * (cellHeight + gap), cellWidth, cellHeight, 1.5)
      }
    }
  }
}

/** Draws one rounded heatmap cell with the current fill color. */
function drawRoundedCell(context: CanvasRenderingContext, x: number, y: number, width: number, height: number, radius: number): void {
  const right = x + width
  const bottom = y + height
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(right - radius, y)
  context.quadraticCurveTo(right, y, right, y + radius)
  context.lineTo(right, bottom - radius)
  context.quadraticCurveTo(right, bottom, right - radius, bottom)
  context.lineTo(x + radius, bottom)
  context.quadraticCurveTo(x, bottom, x, bottom - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
  context.fill()
}

/** Renders a single colored aggregate-statistic tile. */
function StatTile({ label, value, color, compact }: { label: string; value: string; color: ShapeStyle; compact?: boolean }) {
  return (
    <VStack alignment="leading" spacing={compact ? 1 : 3} frame={{ minWidth: 0, maxWidth: Infinity, alignment: "leading" }}>
      <Text font={compact ? 9 : 11} fontWeight="semibold" foregroundStyle={INK}>{label}</Text>
      <Text font={compact ? 15 : 20} fontWeight="heavy" fontDesign="rounded" monospacedDigit foregroundStyle="#111111" lineLimit={1} minScaleFactor={0.65} frame={{ minWidth: 0, maxWidth: Infinity, alignment: "center" }} padding={{ top: compact ? 2 : 3, leading: 5, bottom: compact ? 2 : 3, trailing: 5 }} widgetBackground={{ style: color, shape: { type: "rect", cornerRadius: compact ? 7 : 9, style: "continuous" } }}>
        {value}
      </Text>
    </VStack>
  )
}

/** Renders the three statistics with structural dividers. */
function StatsRow({ dashboard, compact }: { dashboard: ResetDashboard; compact?: boolean }) {
  return (
    <HStack alignment="bottom" spacing={compact ? 7 : 9} frame={{ minWidth: 0, maxWidth: Infinity, alignment: "leading" }}>
      <StatTile label="重置" value={`${dashboard.total}次`} color={SKY} compact={compact} />
      <Rectangle fill={INK} frame={{ width: 1.5, height: compact ? 34 : 50 }} />
      <StatTile label="平均" value={`${dashboard.averageDays.toFixed(1)}天`} color={PINK} compact={compact} />
      <Rectangle fill={INK} frame={{ width: 1.5, height: compact ? 34 : 50 }} />
      <StatTile label="最长" value={`${dashboard.longestDays.toFixed(1)}天`} color={YELLOW} compact={compact} />
    </HStack>
  )
}

/** Renders the horizontal widget with latest-reset details and statistics. */
function MediumWidgetContent({ dashboard }: { dashboard: ResetDashboard }) {
  const heatmapDays = buildHeatmapDays(dashboard.history)
  return (
    <GeometryReader widgetURL={WEBSITE_URL}>
      {/** 按实际容器高度分配中号各行，避免弹性布局累积空白或挤压内容。 */}
      {(proxy) => {
        const scale = proxy.size.height / 169
        const inset = 14 * scale
        const width = proxy.size.width - inset * 2
        const heatmapWidth = 184 * scale
        const heatmapHeight = 76 * scale
        const textWidth = width - heatmapWidth - 10 * scale
        return (
          <ZStack frame={{ width: proxy.size.width, height: proxy.size.height }}>
            <VStack alignment="leading" spacing={0} frame={{ width: textWidth, height: 96 * scale, alignment: "topLeading" }} position={{ x: inset + textWidth / 2, y: 60 * scale }}>
              <Text font={19 * scale} fontWeight="heavy" fontDesign="rounded" foregroundStyle={INK} lineLimit={1} minScaleFactor={0.7} frame={{ width: textWidth, height: 23 * scale, alignment: "leading" }}>CODEX 重置</Text>
              <Text font={11 * scale} fontWeight="bold" foregroundStyle="#111111" lineLimit={1} frame={{ width: 76 * scale, height: 19 * scale }} background={{ style: YELLOW, shape: { type: "capsule", style: "continuous" } }}>最近重置</Text>
              <Text font={36 * scale} fontWeight="heavy" fontDesign="rounded" monospacedDigit foregroundStyle={INK} lineLimit={1} minScaleFactor={0.6} frame={{ width: textWidth, height: 39 * scale, alignment: "leading" }}>{formatRelativeTime(dashboard.latest.announced_at)}</Text>
              <Text font={11 * scale} fontWeight="semibold" foregroundStyle={INK} lineLimit={1} minScaleFactor={0.7} frame={{ width: textWidth, height: 15 * scale, alignment: "leading" }}>{formatLocalDate(dashboard.latest.announced_at)}</Text>
            </VStack>
            <VStack alignment="leading" spacing={3 * scale} frame={{ width: heatmapWidth, height: 96 * scale }} position={{ x: proxy.size.width - inset - heatmapWidth / 2, y: 60 * scale }}>
              <Text font={11 * scale} fontWeight="heavy" fontDesign="rounded" foregroundStyle={INK} frame={{ width: heatmapWidth, alignment: "trailing" }}>26 周记录</Text>
              <Canvas draw={createHeatmapDrawer(heatmapDays)} opaque={false} frame={{ width: heatmapWidth, height: heatmapHeight }} />
            </VStack>
            <Rectangle fill={INK} frame={{ width, height: 1.5 * scale }} position={{ x: proxy.size.width / 2, y: 113 * scale }} />
            <VStack spacing={0} frame={{ width, height: 38 * scale }} position={{ x: proxy.size.width / 2, y: 139 * scale }}>
              <StatsRow dashboard={dashboard} compact />
            </VStack>
          </ZStack>
        )
      }}
    </GeometryReader>
  )
}

/** 为中号组件提供独立背景，避免尺寸之间共享可变样式。 */
export function MediumWidget({ dashboard }: { dashboard: ResetDashboard }) {
  return (
    <ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }}>
      <PaperBackground />
      <MediumWidgetContent dashboard={dashboard} />
    </ZStack>
  )
}
