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
// 导航与播放相关高亮统一使用当前主题色。
export const THEME_COLOR = "#FA7705"

// 官网榜单的热度与评分图标，使用模板渲染适配主题色。
export const HEAT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path d="M5.2932 1.5332C6.42786 2.28346 7.43112 4.07188 6.99492 5.88646C7.44857 5.61602 7.99818 4.80469 8.09395 4.25997C8.93149 4.82698 9.35039 5.78731 9.35039 7.14071C9.35039 9.17068 7.56565 10.4665 6.09884 10.4665C4.63177 10.4665 2.96171 9.59816 2.69149 7.78076C2.42154 5.96361 3.54115 5.11521 4.30382 3.93154C4.81262 3.14252 5.14215 2.34298 5.2932 1.5332Z" fill="black"></path></svg>'
export const SCORE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path d="M10 1.15504C11.2376 0.440508 12.7624 0.440508 14 1.15504L20.3926 4.84645C21.6297 5.56102 22.3925 6.88061 22.3926 8.30934V15.6902C22.3926 17.1192 21.6301 18.4405 20.3926 19.155L14 22.8464C12.7626 23.5607 11.2374 23.5607 10 22.8464L3.60742 19.155C2.3699 18.4405 1.60742 17.1192 1.60742 15.6902V8.30934C1.60751 6.88061 2.37026 5.56102 3.60742 4.84645L10 1.15504ZM12.3438 4.1941C12.1895 3.92919 11.8066 3.92919 11.6523 4.1941L9.48438 7.91676C9.42785 8.0138 9.33241 8.08244 9.22266 8.10621L5.01172 9.01832C4.71219 9.08318 4.59289 9.44791 4.79688 9.67652L7.66797 12.8894C7.74258 12.9729 7.78054 13.0846 7.76953 13.1961L7.33398 17.4851C7.30348 17.7899 7.61414 18.0149 7.89453 17.8914L11.8379 16.1531C11.9406 16.108 12.0575 16.1079 12.1602 16.1531L16.1035 17.8914C16.3839 18.0149 16.6927 17.79 16.6621 17.4851L16.2285 13.1961C16.2175 13.0846 16.2535 12.9729 16.3281 12.8894L19.1992 9.67652C19.4035 9.44792 19.2859 9.0832 18.9863 9.01832L14.7754 8.10621C14.6656 8.08244 14.5702 8.0138 14.5137 7.91676L12.3438 4.1941Z" fill="black"></path></svg>'
// 详情与榜单共用背景、热度和互动标签配色，适配浅色与深色主题。
export const SERIES_SURFACE = { light: "#FFFFFF", dark: "#0E0E0E" } as const
export const HEAT_COLOR = { light: "#C34A16", dark: "#FA6725" } as const
export const METRIC_STYLES = {
  status: {
    foreground: { light: "#007D63", dark: "#00D0A0" },
    background: "rgba(0,208,160,0.1)",
  },
  score: {
    foreground: { light: "#A64A00", dark: "#FA7705" },
    background: "rgba(250,119,5,0.1)",
  },
  engagement: {
    foreground: { light: "#88602B", dark: "#D7A461" },
    background: "rgba(215,164,97,0.1)",
  },
} as const

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

/** 按官网中间详情区的封面尺寸与分区间距展示加载占位。 */
export function SkeletonDetail() {
  const phase = useShimmerPhase()

  const headTextWidth = CONTENT_WIDTH - 98 - 16

  return (
    <VStack alignment="leading" spacing={28} padding={{ top: 16, bottom: 28 }} frame={FILL_LEADING}>

      <HStack spacing={16} alignment="top" padding={{ horizontal: PAGE_H_PADDING }} frame={FILL_LEADING}>
        <SkeletonBlock width={98} height={140} cornerRadius={8} phase={phase} />
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
        <HStack spacing={24}>
          {[0, 1, 2, 3].map(index => <SkeletonBlock key={index} width={44} height={14} phase={phase} />)}
        </HStack>
        <ScrollView axes="horizontal" scrollIndicator="hidden">
          <HStack spacing={8}>
            {[0, 1, 2, 3, 4, 5].map(index => (
              <SkeletonBlock key={index} width={52} height={70} cornerRadius={8} phase={phase} />
            ))}
          </HStack>
        </ScrollView>
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
