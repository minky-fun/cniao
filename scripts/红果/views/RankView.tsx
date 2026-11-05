import { HStack, ScrollView, SVG, Text, VStack, ZStack, useEffect, useState } from "scripting"
import { fetchRank } from "../core/api"
import { RANK_BOARDS } from "../core/config"
import { loadCachedRank, saveCachedRank } from "../core/feedCache"
import type { RankData, RankItem } from "../core/types"
import { BRAND_COLOR, CoverImage, EmptyView, ErrorView, FILL_CENTER, FILL_LEADING, PAGE_FRAME, SkeletonRankList } from "./Common"

const COVER_WIDTH = 72
const COVER_HEIGHT = 100
// 使用网页版角标的金、银、铜渐变色。
const RANK_BADGE_COLORS = [
  ["#FFD25F", "#F3970B"],
  ["#D4DBEC", "#7F86A6"],
  ["#FFCFAA", "#D66A1E"],
] as const

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

/** 将排名角标覆盖在封面左上角，整行仍可点击播放。 */
function RankRow({
  item,
  onSelect,
}: {
  item: RankItem
  onSelect: (item: RankItem) => void
}) {
  return (
    <HStack
      spacing={12}
      alignment="top"
      padding={{ horizontal: 16, vertical: 10 }}
      frame={FILL_LEADING}
      onTapGesture={() => onSelect(item)}
    >
      <ZStack alignment="topLeading" frame={{ width: COVER_WIDTH, height: COVER_HEIGHT }}>
        <CoverImage url={item.cover} width={COVER_WIDTH} height={COVER_HEIGHT} />
        <RankBadge rank={item.rank} />
      </ZStack>

      <VStack alignment="leading" spacing={6} frame={FILL_LEADING}>
        <Text font="subheadline" bold lineLimit={1} frame={FILL_LEADING}>
          {item.title}
        </Text>

        <Text font="caption" foregroundStyle="secondaryLabel" lineLimit={2} frame={FILL_LEADING}>
          {item.description}
        </Text>

        <HStack spacing={10} alignment="center">
          {item.heatText ? (
            <HStack spacing={3} alignment="center">
              <Text font="caption2" foregroundStyle={BRAND_COLOR}>
                {item.heatText}
              </Text>
            </HStack>
          ) : null}
          {item.scoreText ? (
            <Text font="caption2" foregroundStyle="secondaryLabel">
              {item.scoreText}
            </Text>
          ) : null}
        </HStack>

        {item.tags.length > 0 ? (
          <Text font="caption2" foregroundStyle="tertiaryLabel" lineLimit={1} frame={FILL_LEADING}>
            {item.tags.slice(0, 4).join(" · ")}
          </Text>
        ) : null}
      </VStack>
    </HStack>
  )
}

/** 展示榜单分类和分页列表，保留已有请求及离线快照行为。 */
export function RankView({
  onSelectSeries,
}: {
  onSelectSeries: (seriesId: string, vid?: string) => void
}) {
  const [boardIndex, setBoardIndex] = useState(0)
  const [page, setPage] = useState(1)

  const [initialCache] = useState(() => loadCachedRank(RANK_BOARDS[0].board, 1))
  const [data, setData] = useState<RankData | null>(initialCache)
  const [isLoading, setIsLoading] = useState(!initialCache)
  const [errorMessage, setErrorMessage] = useState("")

  const board = RANK_BOARDS[boardIndex]

  /** 优先展示指定榜单的快照，再刷新当前页数据。 */
  const load = (targetBoardIndex: number, targetPage: number) => {
    const targetBoard = RANK_BOARDS[targetBoardIndex].board
    const cached = loadCachedRank(targetBoard, targetPage)
    setData(cached)
    if (!cached) setIsLoading(true)
    setErrorMessage("")

    fetchRank(targetBoard, targetPage)
      .then(next => {
        setData(next)
        saveCachedRank(targetBoard, targetPage, next)
      })
      .catch(error => {
        setErrorMessage(error instanceof Error ? error.message : String(error))
        if (!cached) setData(null)
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load(boardIndex, page)
  }, [boardIndex, page])

  /** 切换榜单时从第一页开始浏览。 */
  const switchBoard = (index: number) => {
    if (index === boardIndex) return
    setBoardIndex(index)
    setPage(1)
  }

  const totalPages = data?.pagination.totalPages ?? 1

  return (
    <VStack alignment="leading" spacing={0} frame={PAGE_FRAME}>
      <ScrollView axes="horizontal" scrollIndicator="hidden">
        <HStack spacing={8} alignment="center" padding={{ horizontal: 16, vertical: 10 }}>
          {RANK_BOARDS.map((item, index) => {

            const labelWidth = item.label.length * 15 + 24

            return (
              <Text
                key={item.board}
                font="footnote"
                foregroundStyle={index === boardIndex ? "white" : "label"}
                lineLimit={1}
                frame={{ width: labelWidth, height: 30 }}
                multilineTextAlignment="center"
                background={{
                  style: index === boardIndex ? BRAND_COLOR : "secondarySystemBackground",
                  shape: { type: "rect", cornerRadius: 14 },
                }}
                onTapGesture={() => switchBoard(index)}
              >
                {item.label}
              </Text>
            )
          })}
        </HStack>
      </ScrollView>

      {isLoading && !data ? (
        <ScrollView>
          <SkeletonRankList />
        </ScrollView>
      ) : null}
      {!isLoading && errorMessage && !data ? <ErrorView message={errorMessage} onRetry={() => load(boardIndex, page)} /> : null}
      {!isLoading && !errorMessage && data && data.rankList.length === 0 ? <EmptyView text="榜单暂无数据" /> : null}

      {data && (data.rankList.length > 0 || errorMessage) ? (
        <ScrollView>
          <VStack alignment="leading" spacing={0} frame={FILL_LEADING} padding={{ bottom: 20 }}>
            {errorMessage ? (
              <Text
                font="caption"
                foregroundStyle="systemOrange"
                padding={{ horizontal: 16, bottom: 8 }}
                frame={FILL_LEADING}
                onTapGesture={() => load(boardIndex, page)}
              >
                {"网络不可用，正在显示上次内容，点此重试"}
              </Text>
            ) : null}
            {data.updatedText ? (
              <Text font="caption2" foregroundStyle="tertiaryLabel" padding={{ horizontal: 16, bottom: 6 }} frame={FILL_LEADING}>
                {data.updatedText}
              </Text>
            ) : null}

            {data.rankList.map(item => (
              <RankRow
                key={item.seriesId}
                item={item}
                onSelect={selected => {

                  const firstVid = selected.episodeVids?.[0]
                  onSelectSeries(selected.seriesId, firstVid)
                }}
              />
            ))}

          <HStack spacing={10} alignment="center" padding={{ vertical: 16 }} frame={FILL_CENTER}>
              <Text
                font="footnote"
                foregroundStyle={page > 1 ? BRAND_COLOR : "tertiaryLabel"}
                padding={{ horizontal: 14, vertical: 7 }}
                background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 8 } }}
                onTapGesture={() => {
                  if (page > 1) setPage(page - 1)
                }}
              >
                上一页
              </Text>

              <Text font="caption" foregroundStyle="secondaryLabel">
                {`${page} / ${totalPages}`}
              </Text>

              <Text
                font="footnote"
                foregroundStyle={page < totalPages ? BRAND_COLOR : "tertiaryLabel"}
                padding={{ horizontal: 14, vertical: 7 }}
                background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 8 } }}
                onTapGesture={() => {
                  if (page < totalPages) setPage(page + 1)
                }}
              >
                下一页
              </Text>
            </HStack>
          </VStack>
        </ScrollView>
      ) : null}
    </VStack>
  )
}
