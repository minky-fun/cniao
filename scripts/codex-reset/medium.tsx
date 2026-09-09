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
const MUTED_INK: DynamicShapeStyle = { light: "#625746", dark: "#CBBEAA" }
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

/** 渲染中号右栏中的单项彩色统计。 */
function MediumStatLine({ label, value, color }: { label: string; value: string; color: ShapeStyle }) {
  return (
    <HStack spacing={6} frame={{ minWidth: 0, maxWidth: Infinity }}>
      <Text font={10} fontWeight="semibold" foregroundStyle={MUTED_INK}>{label}</Text>
      <Spacer />
      <Text font={13} fontWeight="heavy" fontDesign="rounded" monospacedDigit foregroundStyle="#111111" lineLimit={1} minScaleFactor={0.72} padding={{ top: 2, leading: 8, bottom: 2, trailing: 8 }} widgetBackground={{ style: color, shape: { type: "capsule", style: "continuous" } }}>
        {value}
      </Text>
    </HStack>
  )
}

/** 使用 DeepSeek 式左右双栏布局渲染中号内容。 */
function MediumWidgetContent({ dashboard }: { dashboard: ResetDashboard }) {
  return (
    <HStack alignment="top" spacing={12} padding={12} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetURL={WEBSITE_URL}>
      <VStack alignment="leading" spacing={3} frame={{ width: 130, minHeight: 0, maxHeight: Infinity }}>
        <Text font={19} fontWeight="heavy" fontDesign="rounded" foregroundStyle={INK} lineLimit={1} minScaleFactor={0.74}>CODEX 重置</Text>
        <Text font={10} fontWeight="bold" foregroundStyle="#111111" lineLimit={1} padding={{ top: 2, leading: 9, bottom: 2, trailing: 9 }} widgetBackground={{ style: YELLOW, shape: { type: "capsule", style: "continuous" } }}>最近重置</Text>
        <Text font={35} fontWeight="heavy" fontDesign="rounded" monospacedDigit foregroundStyle={INK} lineLimit={1} minScaleFactor={0.58}>{formatRelativeDays(dashboard.daysSinceLast)}</Text>
        <Text font={10} fontWeight="semibold" foregroundStyle={MUTED_INK} lineLimit={1} minScaleFactor={0.72}>{formatLocalDate(dashboard.latest.announced_at)}</Text>
      </VStack>

      <VStack alignment="leading" spacing={3} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }}>
        <HStack frame={{ minWidth: 0, maxWidth: Infinity }}>
          <Spacer />
          <Canvas draw={drawResetIcon} opaque={false} frame={{ width: 66, height: 66 }} />
          <Spacer />
        </HStack>
        <Spacer />
        <MediumStatLine label="累计重置" value={`${dashboard.total}次`} color={SKY} />
        <MediumStatLine label="平均间隔" value={`${dashboard.averageDays.toFixed(1)}天`} color={PINK} />
        <MediumStatLine label="最长间隔" value={`${dashboard.longestDays.toFixed(1)}天`} color={YELLOW} />
      </VStack>
    </HStack>
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
