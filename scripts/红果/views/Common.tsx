import {
  HStack,
  Image,
  LazyVGrid,
  ProgressView,
  RoundedRectangle,
  ScrollView,
  Spacer,
  SVG,
  Text,
  VStack,
  ZStack,
  gradient,
  useEffect,
  useState,
} from "scripting"
import type { SeriesCard } from "../core/types"

export const BRAND_COLOR = "#EE5C62"

export const FILL_LEADING = { maxWidth: "infinity", alignment: "leading" } as const

export const FILL_CENTER = { maxWidth: "infinity", alignment: "center" } as const

export const PAGE_FRAME = {
  maxWidth: "infinity",
  maxHeight: "infinity",
  alignment: "topLeading",
} as const

export function CoverImage({
  url,
  width,
  height,
  cornerRadius = 8,
}: {
  url: string
  width: number
  height: number
  cornerRadius?: number
}) {
  const placeholder = (
    <VStack
      alignment="center"
      frame={{ width, height }}
      background="secondarySystemBackground"
    >
      <Image systemName="film" foregroundStyle="tertiaryLabel" />
    </VStack>
  )

  if (!url) {
    return (
      <VStack
        frame={{ width, height }}
        clipShape={{ type: "rect", cornerRadius }}
      >
        {placeholder}
      </VStack>
    )
  }

  return (
    <Image
      imageUrl={url}
      frame={{ width, height }}
      clipShape={{ type: "rect", cornerRadius }}
      resizable={true}
      scaleToFill={true}
      placeholder={placeholder}
    />
  )
}

// 使用网页版角标的金、银、铜渐变色。
const RANK_BADGE_COLORS = [
  ["#FFD25F", "#F3970B"],
  ["#D4DBEC", "#7F86A6"],
  ["#FFCFAA", "#D66A1E"],
] as const

/** 复用网页版斜边角标轮廓与配色，第四名起使用半透明黑底。 */
export function RankBadge({ rank }: { rank: number }) {
  const colors = RANK_BADGE_COLORS[rank - 1]
  const path = rank === 1
    ? "M0 8a8 8 0 0 1 8-8h14l-1.631 12.996A8 8 0 0 1 12.431 20H0z"
    : "M0 8a8 8 0 0 1 8-8h14l-1.555 12.954A8 8 0 0 1 12.502 20H0z"
  const background = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20">
    ${colors ? `<defs><linearGradient id="rank" gradientUnits="userSpaceOnUse" ${rank === 1
      ? 'x1="11.366" x2="9.027" y1="0" y2="19.194"'
      : 'x1="21.267" x2="9.167" y1="-0.526" y2="23.826"'}>
      <stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/>
    </linearGradient></defs>` : ""}
    <path d="${path}" fill="${colors ? "url(#rank)" : "black"}" fill-opacity="${colors ? 1 : 0.4}"/>
  </svg>`

  return (
    <ZStack frame={{ width: 22, height: 20 }}>
      <SVG code={background} frame={{ width: 22, height: 20 }} />
      <Text font={12} bold foregroundStyle="white" multilineTextAlignment="center">
        {String(rank)}
      </Text>
    </ZStack>
  )
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

export function MetaChip({ icon, text }: { icon: string; text: string }) {
  if (!text) return null

  return (
    <HStack spacing={3} alignment="center">
      <Image
        systemName={icon}
        font="caption2"
        foregroundStyle={BRAND_COLOR}
      />
      <Text font="caption2" foregroundStyle="secondaryLabel" lineLimit={1}>
        {text}
      </Text>
    </HStack>
  )
}

export function TagChip({ text }: { text: string }) {
  return (
    <Text
      font="caption2"
      foregroundStyle="secondaryLabel"
      padding={{ horizontal: 7, vertical: 3 }}
      background={{
        style: "secondarySystemBackground",
        shape: { type: "rect", cornerRadius: 6 },
      }}
    >
      {text}
    </Text>
  )
}

function resolveCardMeta(series: SeriesCard): { kind: "heat" | "tag"; text: string } | null {
  const heatText = series.hot_score_data?.text
  if (heatText) return { kind: "heat", text: heatText }

  const categoryName = (series.category_list ?? [])[0]?.name
  if (categoryName) return { kind: "tag", text: categoryName }

  const tagName = (series.tags ?? [])[0]
  if (tagName) return { kind: "tag", text: tagName }

  return null
}

export function SeriesCardView({
  series,
  width,
  onSelect,
}: {
  series: SeriesCard
  width: number
  onSelect: (series: SeriesCard) => void
}) {
  const coverHeight = Math.round((width * 3) / 2)
  const meta = resolveCardMeta(series)

  return (
    <VStack
      alignment="leading"
      spacing={6}
      frame={{ width }}
      onTapGesture={() => onSelect(series)}
    >
      <ZStack frame={{ width, height: coverHeight }}>
        <CoverImage url={series.series_cover} width={width} height={coverHeight} />

        <VStack spacing={0} frame={{ width, height: coverHeight }}>
          <Spacer />
          <HStack
            alignment="center"
            frame={{ width }}
            padding={{ horizontal: 6, vertical: 4 }}
          >
            <Text
              font="caption2"
              foregroundStyle="white"
              padding={{ horizontal: 5, vertical: 2 }}
              background={{ style: "rgba(0,0,0,0.6)", shape: { type: "rect", cornerRadius: 4 } }}
            >
              {series.episode_right_text ?? `全${series.episode_cnt}集`}
            </Text>
            <Spacer />
          </HStack>
        </VStack>
      </ZStack>

      <Text
        font="footnote"
        lineLimit={2}
        frame={FILL_LEADING}
        multilineTextAlignment="leading"
      >
        {series.series_title}
      </Text>

      {meta ? (
        <HStack spacing={4} alignment="center" frame={{ width, height: 18, alignment: "leading" }}>
          {meta.kind === "heat" ? <MetaChip icon="flame.fill" text={meta.text} /> : <TagChip text={meta.text} />}
        </HStack>
      ) : null}
    </VStack>
  )
}

export const PAGE_H_PADDING = 16

export const CONTENT_WIDTH = Device.screen.width - PAGE_H_PADDING * 2

const GRID_COLUMN_COUNT = 3
const GRID_SPACING = 10

export const GRID_CARD_WIDTH = Math.floor(
  (CONTENT_WIDTH - GRID_SPACING * (GRID_COLUMN_COUNT - 1)) / GRID_COLUMN_COUNT
)

const SKELETON_BASE = { light: "#E6E6EE", dark: "#242426" } as const
const SKELETON_SHINE = "rgba(255,255,255,0.45)"

const SHIMMER_DURATION = 1.6

const SHIMMER_GRADIENT = {
  light: gradient("linear", {
    colors: ["rgba(255,255,255,0)", SKELETON_SHINE, "rgba(255,255,255,0)"],
    startPoint: "leading",
    endPoint: "trailing",
  }),
  dark: gradient("linear", {
    colors: ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0)"],
    startPoint: "leading",
    endPoint: "trailing",
  }),
}

/** 绘制随深浅主题变化的骨架块，并保留现有扫光动画。 */
export function SkeletonBlock({
  width,
  height,
  cornerRadius = 6,
  phase,
}: {
  width: number
  height: number
  cornerRadius?: number
  phase: number
}) {

  const shineHeight = height * 2.6

  const shineWidth = width > 180 ? 46 : Math.min(width * 0.5, 90)

  const travelStart = -shineWidth
  const travelEnd = width + shineWidth

  return (
    <ZStack
      frame={{ width, height, alignment: "leading" }}
      background={SKELETON_BASE}
      clipShape={{ type: "rect", cornerRadius }}
      alignment="leading"
    >
      <VStack
        frame={{ width: shineWidth, height: shineHeight }}
        offset={{ x: travelStart + phase * (travelEnd - travelStart), y: 0 }}
        animation={{ animation: Animation.linear(SHIMMER_DURATION).repeatForever(false), value: phase }}
      >
        <VStack
          frame={{ width: shineWidth, height: shineHeight }}
          background={SHIMMER_GRADIENT}
          rotationEffect={-25}
        />
      </VStack>
    </ZStack>
  )
}

function useShimmerPhase(): number {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    setPhase(1)
  }, [])
  return phase
}

export function LoadingView({ text = "加载中…" }: { text?: string }) {
  return (
    <VStack alignment="center" spacing={10} padding={{ vertical: 40 }} frame={FILL_CENTER}>
      <ProgressView />
      <Text font="footnote" foregroundStyle="secondaryLabel">
        {text}
      </Text>
    </VStack>
  )
}

export function SkeletonCardRow({ count = 4, cardWidth = 112 }: { count?: number; cardWidth?: number }) {
  const phase = useShimmerPhase()
  const coverHeight = Math.round((cardWidth * 3) / 2)

  return (
    <VStack alignment="leading" spacing={10} frame={FILL_LEADING}>
      <VStack alignment="leading" padding={{ horizontal: PAGE_H_PADDING }} frame={FILL_LEADING}>
        <SkeletonBlock width={80} height={18} phase={phase} />
      </VStack>

      <ScrollView axes="horizontal" scrollIndicator="hidden">
        <HStack spacing={12} alignment="top" padding={{ horizontal: PAGE_H_PADDING }}>
          {Array.from({ length: count }, (_, index) => (
            <VStack key={index} alignment="leading" spacing={6} frame={{ width: cardWidth }}>
              <SkeletonBlock width={cardWidth} height={coverHeight} cornerRadius={8} phase={phase} />
              <SkeletonBlock width={cardWidth} height={12} phase={phase} />
              <SkeletonBlock width={Math.round(cardWidth * 0.6)} height={12} phase={phase} />
            </VStack>
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  )
}

export function SkeletonGrid({
  count = 12,
  columns = GRID_COLUMN_COUNT,
}: {
  count?: number
  columns?: number
}) {
  const phase = useShimmerPhase()
  const coverHeight = Math.round((GRID_CARD_WIDTH * 3) / 2)
  const rows = Math.ceil(count / columns)

  return (
    <VStack alignment="leading" spacing={16} frame={FILL_LEADING} padding={{ horizontal: PAGE_H_PADDING }}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <HStack key={rowIndex} spacing={GRID_SPACING} alignment="top" frame={FILL_LEADING}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <VStack key={columnIndex} alignment="leading" spacing={6} frame={{ width: GRID_CARD_WIDTH }}>
              <SkeletonBlock
                width={GRID_CARD_WIDTH}
                height={coverHeight}
                cornerRadius={8}
                phase={phase}
              />
              <SkeletonBlock width={GRID_CARD_WIDTH} height={12} phase={phase} />
            </VStack>
          ))}
        </HStack>
      ))}
    </VStack>
  )
}

/** 按榜单容器宽度匹配官网封面、标题热度行和互动标签的占位布局。 */
export function SkeletonRankList({ width, count = 5 }: { width: number; count?: number }) {
  const phase = useShimmerPhase()

  const textWidth = width - 24 - 72 - 12

  return (
    <VStack alignment="leading" spacing={24} frame={FILL_LEADING}>
      {Array.from({ length: count }, (_, index) => (
        <HStack
          key={index}
          spacing={12}
          alignment="top"
          padding={{ horizontal: 12 }}
          frame={FILL_LEADING}
        >
          <ZStack alignment="topLeading" frame={{ width: 72, height: 102 }}>
            <SkeletonBlock width={72} height={102} cornerRadius={8} phase={phase} />
            <SVG
              code={'<svg xmlns="http://www.w3.org/2000/svg" width="22" height="20" viewBox="0 0 22 20"><path d="M0 8a8 8 0 0 1 8-8h14l-1.555 12.954A8 8 0 0 1 12.502 20H0z" fill="black" fill-opacity="0.15"/></svg>'}
              frame={{ width: 22, height: 20 }}
            />
          </ZStack>

          <VStack alignment="leading" spacing={0} frame={{ width: textWidth }} padding={{ top: 6 }}>
            <HStack spacing={4} frame={{ width: textWidth, height: 20 }}>
              <SkeletonBlock width={textWidth * 0.65 - 4} height={20} phase={phase} />
              <SkeletonBlock width={textWidth * 0.35} height={16} phase={phase} />
            </HStack>
            <VStack padding={{ top: 6 }} frame={FILL_LEADING}>
              <SkeletonBlock width={textWidth * 0.6} height={16} phase={phase} />
            </VStack>
            <VStack padding={{ top: 2 }}>
              <SkeletonBlock width={textWidth} height={16} phase={phase} />
            </VStack>
            <HStack spacing={4} padding={{ top: 6 }}>
              <SkeletonBlock width={textWidth * 0.28} height={18} cornerRadius={4} phase={phase} />
              <SkeletonBlock width={textWidth * 0.28} height={18} cornerRadius={4} phase={phase} />
              <SkeletonBlock width={textWidth * 0.28} height={18} cornerRadius={4} phase={phase} />
            </HStack>
          </VStack>
        </HStack>
      ))}
    </VStack>
  )
}

export function SkeletonHome({ sections = 2 }: { sections?: number }) {
  const phase = useShimmerPhase()

  return (
    <VStack alignment="leading" spacing={22} padding={{ bottom: 24 }} frame={FILL_LEADING}>
      <VStack alignment="leading" padding={{ horizontal: PAGE_H_PADDING }} frame={FILL_LEADING}>
        <SkeletonBlock width={CONTENT_WIDTH} height={180} cornerRadius={12} phase={phase} />
      </VStack>

      {Array.from({ length: sections }, (_, index) => (
        <SkeletonCardRow key={index} />
      ))}
    </VStack>
  )
}

export function SkeletonDetail() {
  const phase = useShimmerPhase()

  const headTextWidth = CONTENT_WIDTH - 108 - 14

  const episodeSpacing = 8
  const episodeCols = 5
  const episodeBtnWidth = Math.floor(
    (CONTENT_WIDTH - episodeSpacing * (episodeCols - 1)) / episodeCols
  )

  return (
    <VStack alignment="leading" spacing={18} padding={{ bottom: 24 }} frame={FILL_LEADING}>

      <HStack spacing={14} alignment="top" padding={{ horizontal: PAGE_H_PADDING, top: 12 }} frame={FILL_LEADING}>
        <SkeletonBlock width={108} height={162} cornerRadius={10} phase={phase} />
        <VStack alignment="leading" spacing={10} frame={{ width: headTextWidth }}>
          <SkeletonBlock width={headTextWidth} height={22} phase={phase} />
          <SkeletonBlock width={Math.round(headTextWidth * 0.45)} height={14} phase={phase} />
          <SkeletonBlock width={Math.round(headTextWidth * 0.75)} height={14} phase={phase} />
        </VStack>
      </HStack>

      <VStack alignment="leading" spacing={8} padding={{ horizontal: PAGE_H_PADDING }} frame={FILL_LEADING}>
        <SkeletonBlock width={70} height={18} phase={phase} />
        <SkeletonBlock width={CONTENT_WIDTH} height={14} phase={phase} />
        <SkeletonBlock width={CONTENT_WIDTH} height={14} phase={phase} />
        <SkeletonBlock width={Math.round(CONTENT_WIDTH * 0.6)} height={14} phase={phase} />
      </VStack>

      <VStack alignment="leading" spacing={10} padding={{ horizontal: PAGE_H_PADDING }} frame={FILL_LEADING}>
        <SkeletonBlock width={60} height={18} phase={phase} />
        <VStack alignment="leading" spacing={episodeSpacing} frame={FILL_LEADING}>
          {Array.from({ length: 3 }, (_, rowIndex) => (
            <HStack key={rowIndex} spacing={episodeSpacing} alignment="center" frame={FILL_LEADING}>
              {Array.from({ length: episodeCols }, (_, colIndex) => (
                <SkeletonBlock
                  key={colIndex}
                  width={episodeBtnWidth}
                  height={34}
                  cornerRadius={6}
                  phase={phase}
                />
              ))}
            </HStack>
          ))}
        </VStack>
      </VStack>
    </VStack>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <VStack alignment="center" spacing={12} padding={{ vertical: 40, horizontal: 24 }} frame={FILL_CENTER}>
      <Image systemName="exclamationmark.triangle" font="title2" foregroundStyle="systemOrange" />
      <Text font="footnote" foregroundStyle="secondaryLabel" multilineTextAlignment="center">
        {message}
      </Text>
      <Text
        font="footnote"
        foregroundStyle="white"
        padding={{ horizontal: 16, vertical: 7 }}
        background={{ style: BRAND_COLOR, shape: { type: "rect", cornerRadius: 8 } }}
        onTapGesture={onRetry}
      >
        重试
      </Text>
    </VStack>
  )
}

export function EmptyView({ text }: { text: string }) {
  return (
    <VStack alignment="center" spacing={10} padding={{ vertical: 50 }} frame={FILL_CENTER}>
      <Image systemName="tray" font="title2" foregroundStyle="tertiaryLabel" />
      <Text font="footnote" foregroundStyle="secondaryLabel">
        {text}
      </Text>
    </VStack>
  )
}

export function SeriesGrid({
  seriesList,
  onSelect,
}: {
  seriesList: SeriesCard[]
  onSelect: (series: SeriesCard) => void
}) {
  const rows = chunk(seriesList, GRID_COLUMN_COUNT)

  return (
    <VStack
      alignment="leading"
      spacing={16}
      padding={{ horizontal: PAGE_H_PADDING }}
      frame={FILL_LEADING}
    >
      {rows.map((row, rowIndex) => (
        <HStack key={rowIndex} spacing={GRID_SPACING} alignment="top" frame={FILL_LEADING}>
          {row.map(series => (
            <SeriesCardView
              key={series.series_id}
              series={series}
              width={GRID_CARD_WIDTH}
              onSelect={onSelect}
            />
          ))}

          {row.length < GRID_COLUMN_COUNT
            ? Array.from({ length: GRID_COLUMN_COUNT - row.length }).map((_, i) => (
                <VStack key={`fill-${i}`} frame={{ width: GRID_CARD_WIDTH }} />
              ))
            : null}
        </HStack>
      ))}
    </VStack>
  )
}

export function HorizontalSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: any
}) {
  return (
    <VStack alignment="leading" spacing={10} frame={FILL_LEADING}>
      <VStack alignment="leading" spacing={2} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
        <Text font="headline" bold>
          {title}
        </Text>
        {subtitle ? (
          <Text font="caption" foregroundStyle="secondaryLabel">
            {subtitle}
          </Text>
        ) : null}
      </VStack>
      {children}
    </VStack>
  )
}

export { Spacer, RoundedRectangle }
