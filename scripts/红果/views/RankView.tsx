import { GeometryReader, HStack, Image, ScrollView, SVG, Text, VStack, ZStack, useEffect, useRef, useState } from "scripting"
import { fetchRank } from "../core/api"
import { RANK_BOARDS } from "../core/config"
import { loadCachedRank, saveCachedRank } from "../core/feedCache"
import type { RankData, RankItem } from "../core/types"
import { CoverImage, EmptyView, ErrorView, FILL_CENTER, FILL_LEADING, PAGE_FRAME, SkeletonRankList } from "./Common"

// 官网榜单的热度与评分图标，使用模板渲染适配主题色。
const HEAT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><path d="M5.2932 1.5332C6.42786 2.28346 7.43112 4.07188 6.99492 5.88646C7.44857 5.61602 7.99818 4.80469 8.09395 4.25997C8.93149 4.82698 9.35039 5.78731 9.35039 7.14071C9.35039 9.17068 7.56565 10.4665 6.09884 10.4665C4.63177 10.4665 2.96171 9.59816 2.69149 7.78076C2.42154 5.96361 3.54115 5.11521 4.30382 3.93154C4.81262 3.14252 5.14215 2.34298 5.2932 1.5332Z" fill="black"></path></svg>'
const SCORE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path d="M10 1.15504C11.2376 0.440508 12.7624 0.440508 14 1.15504L20.3926 4.84645C21.6297 5.56102 22.3925 6.88061 22.3926 8.30934V15.6902C22.3926 17.1192 21.6301 18.4405 20.3926 19.155L14 22.8464C12.7626 23.5607 11.2374 23.5607 10 22.8464L3.60742 19.155C2.3699 18.4405 1.60742 17.1192 1.60742 15.6902V8.30934C1.60751 6.88061 2.37026 5.56102 3.60742 4.84645L10 1.15504ZM12.3438 4.1941C12.1895 3.92919 11.8066 3.92919 11.6523 4.1941L9.48438 7.91676C9.42785 8.0138 9.33241 8.08244 9.22266 8.10621L5.01172 9.01832C4.71219 9.08318 4.59289 9.44791 4.79688 9.67652L7.66797 12.8894C7.74258 12.9729 7.78054 13.0846 7.76953 13.1961L7.33398 17.4851C7.30348 17.7899 7.61414 18.0149 7.89453 17.8914L11.8379 16.1531C11.9406 16.108 12.0575 16.1079 12.1602 16.1531L16.1035 17.8914C16.3839 18.0149 16.6927 17.79 16.6621 17.4851L16.2285 13.1961C16.2175 13.0846 16.2535 12.9729 16.3281 12.8894L19.1992 9.67652C19.4035 9.44792 19.2859 9.0832 18.9863 9.01832L14.7754 8.10621C14.6656 8.08244 14.5702 8.0138 14.5137 7.91676L12.3438 4.1941Z" fill="black"></path></svg>'

const COVER_WIDTH = 72
const COVER_HEIGHT = 102
const RANK_SURFACE = { light: "#FFFFFF", dark: "#0E0E0E" } as const
const HEAT_COLOR = { light: "#C34A16", dark: "#FA6725" } as const
const METRIC_STYLES = {
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
// 使用网页版角标的金、银、铜渐变色。
const RANK_BADGE_COLORS = [
  ["#FFD25F", "#F3970B"],
  ["#D4DBEC", "#7F86A6"],
  ["#FFCFAA", "#D66A1E"],
] as const

interface RankViewState {
  boardIndex: number
  page: number
  data: RankData | null
  isLoading: boolean
  errorMessage: string
}

/** 复用网页版斜边角标轮廓与配色，第四名起使用半透明黑底。 */
function RankBadge({ rank }: { rank: number }) {
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

/** 按官网手机版排列剧名、热度、题材、简介和互动标签，整行可点击播放。 */
function RankRow({
  item,
  width,
  onSelect,
}: {
  item: RankItem
  width: number
  onSelect: (item: RankItem) => void
}) {
  const contentWidth = width - 24 - COVER_WIDTH - 12
  const metrics: { kind: keyof typeof METRIC_STYLES; text: string }[] = []
  // 旧版本快照没有 statusTags，等待本次请求补充官网的新剧标签。
  for (const text of item.statusTags ?? []) metrics.push({ kind: "status", text })
  if (item.scoreText) metrics.push({ kind: "score", text: item.scoreText })
  if (item.favoriteText) metrics.push({ kind: "engagement", text: item.favoriteText })
  if (item.likeText) metrics.push({ kind: "engagement", text: item.likeText })

  return (
    <HStack
      spacing={12}
      alignment="top"
      padding={{ horizontal: 12 }}
      frame={FILL_LEADING}
      onTapGesture={() => onSelect(item)}
    >
      <ZStack alignment="topLeading" frame={{ width: COVER_WIDTH, height: COVER_HEIGHT }}>
        <CoverImage url={item.cover} width={COVER_WIDTH} height={COVER_HEIGHT} />
        <RankBadge rank={item.rank} />
      </ZStack>

      <VStack alignment="leading" spacing={0} frame={{ width: contentWidth }} padding={{ top: 6 }}>
        <HStack spacing={4} alignment="center" frame={{ width: contentWidth, height: 20 }}>
          <Text font={14} fontWeight="medium" foregroundStyle="label" lineLimit={1} frame={FILL_LEADING}>
            {item.title}
          </Text>
          {item.heatText ? (
            <HStack spacing={2} alignment="center" foregroundStyle={HEAT_COLOR} fixedSize={{ horizontal: true, vertical: false }}>
              <SVG code={HEAT_ICON} renderingMode="template" foregroundStyle={HEAT_COLOR} frame={{ width: 12, height: 12 }} />
              <Text font={12} fontWeight="medium" lineLimit={1}>
                {item.heatText}
              </Text>
            </HStack>
          ) : null}
        </HStack>

        <Text font={12} foregroundStyle="secondaryLabel" lineLimit={1} frame={{ width: contentWidth, height: 16, alignment: "leading" }} padding={{ top: 6 }}>
          {item.tags.join("·")}
        </Text>
        <Text font={12} foregroundStyle="secondaryLabel" lineLimit={1} frame={{ width: contentWidth, height: 16, alignment: "leading" }} padding={{ top: 2 }}>
          {item.description}
        </Text>

        <HStack spacing={4} alignment="center" frame={{ width: contentWidth, height: 18, alignment: "leading" }} padding={{ top: 6 }} clipped>
          {metrics.map((metric, index) => (
            <HStack
              key={`${metric.kind}:${index}`}
              spacing={3}
              foregroundStyle={METRIC_STYLES[metric.kind].foreground}
              padding={{ horizontal: 4, vertical: 1 }}
              background={{ style: METRIC_STYLES[metric.kind].background, shape: { type: "rect", cornerRadius: 4 } }}
              fixedSize={{ horizontal: true, vertical: false }}
            >
              {metric.kind === "score" ? (
                <SVG code={SCORE_ICON} renderingMode="template" foregroundStyle={METRIC_STYLES.score.foreground} frame={{ width: 12, height: 12 }} />
              ) : null}
              <Text font={12} lineLimit={1} frame={{ height: 16 }}>{metric.text}</Text>
            </HStack>
          ))}
        </HStack>
      </VStack>
    </HStack>
  )
}

/** 同步切换榜单与列表，保留离线快照并隔离过时请求。 */
export function RankView({
  onSelectSeries,
}: {
  onSelectSeries: (seriesId: string, vid?: string) => void
}) {
  const [view, setView] = useState<RankViewState>(() => {
    const cached = loadCachedRank(RANK_BOARDS[0].board, 1)
    return { boardIndex: 0, page: 1, data: cached, isLoading: !cached, errorMessage: "" }
  })
  const requestId = useRef(0)
  const { boardIndex, page, data, isLoading, errorMessage } = view

  /** 一次更新分类、页码及快照，只让最新请求更新当前列表。 */
  const load = (targetBoardIndex: number, targetPage: number) => {
    const currentRequest = ++requestId.current
    const targetBoard = RANK_BOARDS[targetBoardIndex].board
    const cached = loadCachedRank(targetBoard, targetPage)
    setView({
      boardIndex: targetBoardIndex,
      page: targetPage,
      data: cached,
      isLoading: !cached,
      errorMessage: "",
    })

    fetchRank(targetBoard, targetPage)
      .then(next => {
        saveCachedRank(targetBoard, targetPage, next)
        if (currentRequest !== requestId.current) return
        setView(previous => ({ ...previous, data: next, isLoading: false, errorMessage: "" }))
      })
      .catch(error => {
        if (currentRequest !== requestId.current) return
        setView(previous => ({
          ...previous,
          isLoading: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        }))
      })
  }

  useEffect(() => {
    load(0, 1)
    // 页面退出后，未结束的请求只写快照，不再更新界面。
    return () => { requestId.current += 1 }
  }, [])

  /** 切换榜单时从第一页开始浏览。 */
  const switchBoard = (index: number) => {
    if (index === boardIndex) return
    load(index, 1)
  }

  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <GeometryReader background={RANK_SURFACE} foregroundStyle="label">
      {({ size }) => (
        <VStack alignment="leading" spacing={0} frame={PAGE_FRAME}>
          <ScrollView axes="horizontal" scrollIndicator="hidden">
            <HStack spacing={20} alignment="center" padding={{ horizontal: 16, vertical: 16 }}>
              {RANK_BOARDS.map((item, index) => (
                <Text
                  key={item.board}
                  font={16}
                  fontWeight={index === boardIndex ? "medium" : "regular"}
                  foregroundStyle={index === boardIndex ? "label" : "secondaryLabel"}
                  lineLimit={1}
                  frame={{ height: 22 }}
                  fixedSize={{ horizontal: true, vertical: false }}
                  onTapGesture={() => switchBoard(index)}
                >
                  {item.label}
                </Text>
              ))}
            </HStack>
          </ScrollView>

          <ScrollView scrollIndicator="hidden">
            <VStack alignment="leading" spacing={0} frame={FILL_LEADING} padding={{ bottom: 28 }}>
              {isLoading && !data ? <SkeletonRankList width={size.width} /> : null}
              {!isLoading && errorMessage && !data ? <ErrorView message={errorMessage} onRetry={() => load(boardIndex, page)} /> : null}
              {!isLoading && !errorMessage && data && data.rankList.length === 0 ? <EmptyView text="榜单暂无数据" /> : null}

              {data && (data.rankList.length > 0 || errorMessage) ? (
                <VStack alignment="leading" spacing={24} frame={FILL_LEADING}>
                  {errorMessage ? (
                    <Text
                      font="caption"
                      foregroundStyle="systemOrange"
                      padding={{ horizontal: 12 }}
                      frame={FILL_LEADING}
                      onTapGesture={() => load(boardIndex, page)}
                    >
                      网络不可用，正在显示上次内容，点此重试
                    </Text>
                  ) : null}

                  {data.rankList.map(item => (
                    <RankRow
                      key={item.seriesId}
                      item={item}
                      width={size.width}
                      onSelect={selected => onSelectSeries(selected.seriesId, selected.episodeVids?.[0])}
                    />
                  ))}

                  <HStack spacing={8} alignment="center" padding={{ top: 16, bottom: 4 }} frame={FILL_CENTER}>
                    <Image
                      systemName="chevron.left"
                      font={12}
                      accessibilityLabel="上一页"
                      foregroundStyle={page > 1 ? "secondaryLabel" : "tertiaryLabel"}
                      frame={{ width: 32, height: 32 }}
                      background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 8 } }}
                      onTapGesture={() => { if (page > 1) load(boardIndex, page - 1) }}
                    />
                    {Array.from({ length: totalPages }, (_, index) => (
                      <Text
                        key={index + 1}
                        font={14}
                        foregroundStyle={page === index + 1 ? HEAT_COLOR : "secondaryLabel"}
                        frame={{ width: 32, height: 32 }}
                        multilineTextAlignment="center"
                        onTapGesture={() => { if (page !== index + 1) load(boardIndex, index + 1) }}
                      >
                        {String(index + 1)}
                      </Text>
                    ))}
                    <Image
                      systemName="chevron.right"
                      font={12}
                      accessibilityLabel="下一页"
                      foregroundStyle={page < totalPages ? "secondaryLabel" : "tertiaryLabel"}
                      frame={{ width: 32, height: 32 }}
                      background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 8 } }}
                      onTapGesture={() => { if (page < totalPages) load(boardIndex, page + 1) }}
                    />
                  </HStack>
                </VStack>
              ) : null}
            </VStack>
          </ScrollView>
        </VStack>
      )}
    </GeometryReader>
  )
}
