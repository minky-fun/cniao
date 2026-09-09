import {
  Canvas,
  HStack,
  Rectangle,
  Spacer,
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

import { formatRelativeDays, formatLocalDate, formatUpdatedAt } from "./data"
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
const MUTED_INK: DynamicShapeStyle = { light: "#5E5547", dark: "#CABFAE" }
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

/** Draws the coral reset symbol with a bold black outline. */
function drawResetIcon(context: CanvasRenderingContext, size: CanvasSize): void {
  const centerX = size.width * 0.48
  const centerY = size.height * 0.56
  const radius = Math.min(size.width, size.height) * 0.28
  const startAngle = -0.35
  const endAngle = Math.PI * 1.72

  context.lineCap = "round"
  context.lineJoin = "round"
  context.strokeStyle = "#111111"
  context.lineWidth = Math.max(9, radius * 0.34)
  context.beginPath()
  context.arc(centerX, centerY, radius, startAngle, endAngle)
  context.stroke()

  context.strokeStyle = CORAL
  context.lineWidth = Math.max(5, radius * 0.20)
  context.beginPath()
  context.arc(centerX, centerY, radius, startAngle, endAngle)
  context.stroke()

  const tipX = centerX + radius * Math.cos(startAngle)
  const tipY = centerY + radius * Math.sin(startAngle)
  context.fillStyle = "#111111"
  context.beginPath()
  context.moveTo(tipX + radius * 0.34, tipY - radius * 0.03)
  context.lineTo(tipX - radius * 0.13, tipY - radius * 0.42)
  context.lineTo(tipX - radius * 0.16, tipY + radius * 0.33)
  context.closePath()
  context.fill()

  context.fillStyle = CORAL
  context.beginPath()
  context.moveTo(tipX + radius * 0.20, tipY - radius * 0.03)
  context.lineTo(tipX - radius * 0.08, tipY - radius * 0.27)
  context.lineTo(tipX - radius * 0.10, tipY + radius * 0.21)
  context.closePath()
  context.fill()

  context.strokeStyle = "#111111"
  context.lineWidth = Math.max(5, radius * 0.12)
  context.beginPath()
  context.moveTo(size.width * 0.78, size.height * 0.19)
  context.lineTo(size.width * 0.88, size.height * 0.10)
  context.moveTo(size.width * 0.70, size.height * 0.14)
  context.lineTo(size.width * 0.74, size.height * 0.02)
  context.stroke()
}

/** Renders the shared cream paper surface and dot texture. */
function PaperBackground() {
  return (
    <VStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetBackground={{ style: PAPER, shape: { type: "rect", cornerRadius: 24, style: "continuous" } }}>
      <Canvas draw={drawDotPattern} opaque={false} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} />
    </VStack>
  )
}

/** 渲染大号组件底部的单项彩色统计。 */
function LargeStatTile({ label, value, color }: { label: string; value: string; color: ShapeStyle }) {
  return (
    <VStack alignment="leading" spacing={3} frame={{ minWidth: 0, maxWidth: Infinity, alignment: "leading" }}>
      <Text font={11} fontWeight="semibold" foregroundStyle={INK}>{label}</Text>
      <Text font={20} fontWeight="heavy" fontDesign="rounded" monospacedDigit foregroundStyle="#111111" lineLimit={1} minScaleFactor={0.65} frame={{ minWidth: 0, maxWidth: Infinity, alignment: "center" }} padding={{ top: 3, leading: 5, bottom: 3, trailing: 5 }} widgetBackground={{ style: color, shape: { type: "rect", cornerRadius: 9, style: "continuous" } }}>
        {value}
      </Text>
    </VStack>
  )
}

/** 渲染大号组件底部的三项统计。 */
function LargeStatsRow({ dashboard }: { dashboard: ResetDashboard }) {
  return (
    <HStack alignment="bottom" spacing={9} frame={{ minWidth: 0, maxWidth: Infinity, alignment: "leading" }}>
      <LargeStatTile label="重置" value={`${dashboard.total}次`} color={SKY} />
      <Rectangle fill={INK} frame={{ width: 1.5, height: 50 }} />
      <LargeStatTile label="平均" value={`${dashboard.averageDays.toFixed(1)}天`} color={PINK} />
      <Rectangle fill={INK} frame={{ width: 1.5, height: 50 }} />
      <LargeStatTile label="最长" value={`${dashboard.longestDays.toFixed(1)}天`} color={YELLOW} />
    </HStack>
  )
}

/** Converts a date to the UTC day key used by the public history API. */
function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Builds a Monday-first 26-week calendar ending in the current UTC week. */
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

/** Creates the Canvas renderer for the compact 26-week heatmap. */
function createHeatmapDrawer(days: HeatmapDay[]): (context: CanvasRenderingContext, size: CanvasSize) => void {
  /** Paints week columns and weekday rows into the available widget width. */
  return function drawHeatmap(context: CanvasRenderingContext, size: CanvasSize): void {
    const gap = 2
    const cellWidth = (size.width - gap * 25) / 26
    const cellHeight = (size.height - gap * 6) / 7
    for (let week = 0; week < 26; week += 1) {
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const day = days[week * 7 + weekday]
        context.fillStyle = day.isFuture ? "rgba(0, 0, 0, 0)" : day.resetType === "banked" ? PINK : day.resetType === "regular" ? CORAL : EMPTY_CELL
        drawRoundedCell(context, week * (cellWidth + gap), weekday * (cellHeight + gap), cellWidth, cellHeight, 2.4)
      }
    }
  }
}

/** Draws one rounded heatmap cell with the context's current fill color. */
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

/** 使用 DeepSeek 式纵向看板布局渲染大号内容。 */
function LargeWidgetContent({ dashboard }: { dashboard: ResetDashboard }) {
  const heatmapDays = buildHeatmapDays(dashboard.history)
  return (
    <VStack alignment="leading" spacing={7} padding={14} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetURL={WEBSITE_URL}>
      <HStack frame={{ minWidth: 0, maxWidth: Infinity }}>
        <Text font={21} fontWeight="heavy" fontDesign="rounded" foregroundStyle={INK} lineLimit={1}>CODEX 重置</Text>
        <Spacer />
        <Text font={10} fontWeight="semibold" foregroundStyle={MUTED_INK} lineLimit={1}>{formatUpdatedAt(dashboard.generatedAt)}</Text>
      </HStack>

      <HStack alignment="center" spacing={16} frame={{ minWidth: 0, maxWidth: Infinity }}>
        <VStack alignment="leading" spacing={3} frame={{ minWidth: 0, maxWidth: Infinity }}>
          <Text font={12} fontWeight="bold" foregroundStyle="#111111" lineLimit={1} padding={{ top: 3, leading: 12, bottom: 3, trailing: 12 }} widgetBackground={{ style: YELLOW, shape: { type: "capsule", style: "continuous" } }}>最近重置</Text>
          <Text font={43} fontWeight="heavy" fontDesign="rounded" monospacedDigit foregroundStyle={INK} lineLimit={1} minScaleFactor={0.6}>{formatRelativeDays(dashboard.daysSinceLast)}</Text>
          <Text font={13} fontWeight="semibold" foregroundStyle={MUTED_INK} lineLimit={1}>{formatLocalDate(dashboard.latest.announced_at)}</Text>
        </VStack>
        <Canvas draw={drawResetIcon} opaque={false} frame={{ width: 104, height: 104 }} />
      </HStack>

      <Rectangle fill={INK} frame={{ minWidth: 0, maxWidth: Infinity, height: 1.5 }} />
      <HStack frame={{ minWidth: 0, maxWidth: Infinity }}>
        <Text font={16} fontWeight="heavy" fontDesign="rounded" foregroundStyle={INK}>26 周记录</Text>
        <Spacer />
        <HStack spacing={5}>
          <Rectangle fill={CORAL} frame={{ width: 8, height: 8 }} />
          <Text font={9} fontWeight="semibold" foregroundStyle={MUTED_INK}>常规</Text>
          <Rectangle fill={PINK} frame={{ width: 8, height: 8 }} />
          <Text font={9} fontWeight="semibold" foregroundStyle={MUTED_INK}>Banked</Text>
        </HStack>
      </HStack>
      <Canvas draw={createHeatmapDrawer(heatmapDays)} opaque={false} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 82, maxHeight: Infinity }} />
      <Rectangle fill={INK} frame={{ minWidth: 0, maxWidth: Infinity, height: 1.5 }} />
      <LargeStatsRow dashboard={dashboard} />
    </VStack>
  )
}

/** 为大号组件提供独立背景，避免尺寸之间共享可变样式。 */
export function LargeWidget({ dashboard }: { dashboard: ResetDashboard }) {
  return (
    <ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }}>
      <PaperBackground />
      <LargeWidgetContent dashboard={dashboard} />
    </ZStack>
  )
}
