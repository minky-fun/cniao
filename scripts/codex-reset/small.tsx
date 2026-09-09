import {
  Canvas,
  HStack,
  Spacer,
  Text,
  VStack,
  ZStack,
} from "scripting"
import type {
  CanvasRenderingContext,
  CanvasSize,
  DynamicShapeStyle,
} from "scripting"

import { formatLocalDate, formatRelativeDays } from "./data"
import type { ResetDashboard } from "./data"

const WEBSITE_URL = "https://codex-resets.com/"
const PAPER: DynamicShapeStyle = {
  light: { colors: ["#FFF9E9", "#FFF3D7"], startPoint: "topLeading", endPoint: "bottomTrailing" },
  dark: { colors: ["#282117", "#18130F"], startPoint: "topLeading", endPoint: "bottomTrailing" },
}
const INK: DynamicShapeStyle = { light: "#111111", dark: "#FFF8EA" }
const MUTED_INK: DynamicShapeStyle = { light: "#625746", dark: "#CBBEAA" }
const DOT_COLOR = "rgba(121, 93, 48, 0.20)"
const CORAL = "#FF5B3D"
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

/** Renders the hand-drawn reset mark at the requested size. */
function ResetIcon({ size }: { size: number }) {
  return <Canvas draw={drawResetIcon} opaque={false} frame={{ width: size, height: size }} />
}

/** Renders the yellow section label shown above the primary figure. */
function LatestBadge({ compact }: { compact?: boolean }) {
  return (
    <Text font={compact ? 10 : 12} fontWeight="bold" foregroundStyle="#111111" lineLimit={1} padding={{ top: compact ? 2 : 3, leading: compact ? 9 : 12, bottom: compact ? 2 : 3, trailing: compact ? 9 : 12 }} widgetBackground={{ style: YELLOW, shape: { type: "capsule", style: "continuous" } }}>
      最近重置
    </Text>
  )
}

/** 使用 DeepSeek 式流动布局渲染小号内容。 */
function SmallWidgetContent({ dashboard }: { dashboard: ResetDashboard }) {
  return (
    <VStack alignment="leading" spacing={0} padding={12} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetURL={WEBSITE_URL}>
      <HStack frame={{ minWidth: 0, maxWidth: Infinity }}>
        <Text font={17} fontWeight="heavy" fontDesign="rounded" foregroundStyle={INK} lineLimit={1} minScaleFactor={0.82}>CODEX 重置</Text>
        <Spacer />
      </HStack>
      <Spacer />
      <HStack alignment="center" spacing={5} frame={{ minWidth: 0, maxWidth: Infinity }}>
        <VStack alignment="leading" spacing={2}>
          <LatestBadge compact />
          <Text font={34} fontWeight="heavy" fontDesign="rounded" monospacedDigit foregroundStyle={INK} lineLimit={1} minScaleFactor={0.65}>{formatRelativeDays(dashboard.daysSinceLast)}</Text>
          <Text font={9} fontWeight="semibold" foregroundStyle={MUTED_INK} lineLimit={1} minScaleFactor={0.72}>{formatLocalDate(dashboard.latest.announced_at)}</Text>
        </VStack>
        <Spacer />
        <ResetIcon size={58} />
      </HStack>
      <Spacer />
    </VStack>
  )
}

/** 为小号组件提供独立背景，避免尺寸之间共享可变样式。 */
export function SmallWidget({ dashboard }: { dashboard: ResetDashboard }) {
  return (
    <ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }}>
      <PaperBackground />
      <SmallWidgetContent dashboard={dashboard} />
    </ZStack>
  )
}
