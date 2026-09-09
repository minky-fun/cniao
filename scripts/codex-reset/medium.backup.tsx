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

import { formatRelativeDays, formatLocalDate } from "./data"
import type { ResetDashboard } from "./data"

const WEBSITE_URL = "https://codex-resets.com/"
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
  return (
    <GeometryReader widgetURL={WEBSITE_URL}>
      {/** 按实际容器高度分配中号各行，避免弹性布局累积空白或挤压内容。 */}
      {(proxy) => {
        const scale = proxy.size.height / 169
        const inset = 14 * scale
        const width = proxy.size.width - inset * 2
        const iconSize = 82 * scale
        const textWidth = width - iconSize - 8 * scale
        return (
          <ZStack frame={{ width: proxy.size.width, height: proxy.size.height }}>
            <VStack alignment="leading" spacing={0} frame={{ width: textWidth, height: 96 * scale, alignment: "topLeading" }} position={{ x: inset + textWidth / 2, y: 60 * scale }}>
              <Text font={19 * scale} fontWeight="heavy" fontDesign="rounded" foregroundStyle={INK} lineLimit={1} minScaleFactor={0.7} frame={{ width: textWidth, height: 23 * scale, alignment: "leading" }}>CODEX 重置</Text>
              <Text font={11 * scale} fontWeight="bold" foregroundStyle="#111111" lineLimit={1} frame={{ width: 76 * scale, height: 19 * scale }} background={{ style: YELLOW, shape: { type: "capsule", style: "continuous" } }}>最近重置</Text>
              <Text font={36 * scale} fontWeight="heavy" fontDesign="rounded" monospacedDigit foregroundStyle={INK} lineLimit={1} minScaleFactor={0.6} frame={{ width: textWidth, height: 39 * scale, alignment: "leading" }}>{formatRelativeDays(dashboard.daysSinceLast)}</Text>
              <Text font={11 * scale} fontWeight="semibold" foregroundStyle={INK} lineLimit={1} minScaleFactor={0.7} frame={{ width: textWidth, height: 15 * scale, alignment: "leading" }}>{formatLocalDate(dashboard.latest.announced_at)}</Text>
            </VStack>
            <Canvas draw={drawResetIcon} opaque={false} frame={{ width: iconSize, height: iconSize }} position={{ x: proxy.size.width - inset - iconSize / 2, y: 58 * scale }} />
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
