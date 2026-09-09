import {
  Canvas,
  Image,
  Text,
  VStack,
  Widget,
  ZStack,
} from "scripting"
import type {
  CanvasRenderingContext,
  CanvasSize,
  DynamicShapeStyle,
  WidgetReloadPolicy,
} from "scripting"

import { fetchDashboard } from "./data"
import type { ResetDashboard } from "./data"
import { SmallWidget } from "./small"
import { MediumWidget } from "./medium"
import { LargeWidget } from "./large"

const WEBSITE_URL = "https://codex-resets.com/"
const REFRESH_INTERVAL_MINUTES = 15
const PAPER: DynamicShapeStyle = {
  light: { colors: ["#FFF9E9", "#FFF3D7"], startPoint: "topLeading", endPoint: "bottomTrailing" },
  dark: { colors: ["#282117", "#18130F"], startPoint: "topLeading", endPoint: "bottomTrailing" },
}
const INK: DynamicShapeStyle = { light: "#111111", dark: "#FFF8EA" }
const MUTED_INK: DynamicShapeStyle = { light: "#5E5547", dark: "#CABFAE" }
const DOT_COLOR = "rgba(121, 93, 48, 0.20)"
const CORAL = "#FF5B3D"


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

/** Selects the layout matching the current WidgetKit family. */
function DashboardWidget({ dashboard }: { dashboard: ResetDashboard }) {
  if (Widget.family === "systemLarge") return <LargeWidget dashboard={dashboard} />
  if (Widget.family === "systemMedium") return <MediumWidget dashboard={dashboard} />
  return <SmallWidget dashboard={dashboard} />
}

/** Renders a clear API error state without inventing missing data. */
function ErrorWidget({ message }: { message: string }) {
  return (
    <VStack alignment="center" spacing={10} padding={16} frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }} widgetURL={WEBSITE_URL}>
      <Image systemName="arrow.clockwise.circle.fill" font={34} fontWeight="bold" foregroundStyle={CORAL} />
      <Text font={16} fontWeight="heavy" fontDesign="rounded" foregroundStyle={INK}>数据获取失败</Text>
      <Text font={11} fontWeight="medium" foregroundStyle={MUTED_INK} lineLimit={3} multilineTextAlignment="center">{message}</Text>
    </VStack>
  )
}

/** Presents the widget and schedules the next public-API refresh. */
async function showWidget(): Promise<void> {
  const reloadPolicy: WidgetReloadPolicy = {
    policy: "after",
    date: new Date(Date.now() + REFRESH_INTERVAL_MINUTES * 60 * 1000),
  }

  try {
    const dashboard = await fetchDashboard()
    Widget.present(
      <DashboardWidget dashboard={dashboard} />,
      reloadPolicy,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    Widget.present(
      <ZStack frame={{ minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity }}>
        <PaperBackground />
        <ErrorWidget message={message} />
      </ZStack>,
      reloadPolicy,
    )
  }
}

showWidget()
