import { GeometryReader, HStack, LazyVStack, ProgressView, ScrollView, SVG, Text, VStack, ZStack, useEffect, useRef, useState } from "scripting"
import { fetchRank } from "../core/api"
import { RANK_BOARDS } from "../core/config"
import { loadCachedRank, saveCachedRank } from "../core/feedCache"
import type { RankData, RankItem } from "../core/types"
import { CoverImage, EmptyView, ErrorView, FILL_CENTER, FILL_LEADING, HEAT_COLOR, HEAT_ICON, METRIC_STYLES, PAGE_FRAME, RankBadge, SCORE_ICON, SERIES_SURFACE, SkeletonRankList } from "./Common"

const COVER_WIDTH = 72
const COVER_HEIGHT = 102

interface RankViewState {
  boardIndex: number
  page: number
  data: RankData | null
  isLoading: boolean
  errorMessage: string
  isLoadingMore: boolean
  loadMoreError: string
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

/** 以贯穿安全区的主题背景展示榜单，保留分类切换、分页、离线快照及请求隔离。 */
export function RankView({
  onSelectSeries,
}: {
  onSelectSeries: (seriesId: string, vid?: string) => void
}) {
  const [view, setView] = useState<RankViewState>(() => {
    const cached = loadCachedRank(RANK_BOARDS[0].board, 1)
    return { boardIndex: 0, page: 1, data: cached, isLoading: true, errorMessage: "", isLoadingMore: false, loadMoreError: "" }
  })
  // 同步记录请求锁与已加载页码，阻止同一帧内重复触底及旧底部回调。
  const request = useRef({ id: 0, boardIndex: 0, page: 1, loading: true, failed: false })
  const { boardIndex, page, data, isLoading, errorMessage, isLoadingMore, loadMoreError } = view

  /** 首屏展示快照，后续页按单页缓存追加；只有当前请求可修改列表。 */
  const load = async (targetBoardIndex: number, targetPage = 1) => {
    const append = targetPage > 1
    if (append && (request.current.loading || request.current.boardIndex !== targetBoardIndex || request.current.page !== targetPage - 1)) return
    const currentRequest = ++request.current.id
    request.current.loading = true
    request.current.failed = false
    const targetBoard = RANK_BOARDS[targetBoardIndex].board
    const cached = loadCachedRank(targetBoard, targetPage)

    if (append) {
      setView(previous => ({ ...previous, isLoadingMore: true, loadMoreError: "" }))
    } else {
      request.current.boardIndex = targetBoardIndex
      request.current.page = 1
      setView({
        boardIndex: targetBoardIndex,
        page: 1,
        data: cached,
        isLoading: true,
        errorMessage: "",
        isLoadingMore: false,
        loadMoreError: "",
      })
    }

    let next: RankData
    let offlineMessage = ""
    try {
      next = await fetchRank(targetBoard, targetPage)
      saveCachedRank(targetBoard, targetPage, next)
    } catch (error) {
      if (currentRequest !== request.current.id) return
      const message = error instanceof Error ? error.message : String(error)
      if (!append || !cached) {
        request.current.loading = false
        request.current.failed = append
        setView(previous => ({
          ...previous,
          isLoading: false,
          isLoadingMore: false,
          errorMessage: append ? previous.errorMessage : message,
          loadMoreError: append ? message : "",
        }))
        return
      }
      next = cached
      offlineMessage = message
    }
    if (currentRequest !== request.current.id) return

    request.current.page = targetPage
    request.current.loading = false
    setView(previous => {
      const rankList = append && previous.data ? [...previous.data.rankList] : []
      const seen = new Set(rankList.map(item => item.seriesId))
      for (const item of next.rankList) {
        if (seen.has(item.seriesId)) continue
        rankList.push(item)
        seen.add(item.seriesId)
      }
      return {
        ...previous,
        page: targetPage,
        data: { ...next, rankList },
        isLoading: false,
        isLoadingMore: false,
        errorMessage: offlineMessage || (append ? previous.errorMessage : ""),
        loadMoreError: "",
      }
    })
  }

  useEffect(() => {
    void load(0)
    // 页面退出后，未结束的请求只写快照，不再更新界面。
    return () => {
      request.current.id += 1
      request.current.loading = true
    }
  }, [])

  /** 切换榜单时从第一页开始浏览。 */
  const switchBoard = (index: number) => {
    if (index === boardIndex) return
    void load(index)
  }

  const totalPages = data?.pagination.totalPages ?? 1

  /** 底部进入可视范围时串行加载下一页；失败后只响应显式重试。 */
  const loadMore = (retry = false) => {
    if (!data || isLoading || isLoadingMore || (!retry && (loadMoreError || request.current.failed)) || page >= totalPages) return
    void load(boardIndex, page + 1)
  }

  return (
    <GeometryReader
      background={
        <VStack
          frame={PAGE_FRAME}
          background={SERIES_SURFACE}
          ignoresSafeArea={{ regions: "container" }}
        />
      }
      foregroundStyle="label"
      toolbarBackground={{ style: SERIES_SURFACE, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar", "tabBar"] }}
    >
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

          <ScrollView key={`rank-list:${boardIndex}`} scrollIndicator="hidden">
            <LazyVStack alignment="leading" spacing={24} frame={FILL_LEADING} padding={{ bottom: 28 }}>
              {isLoading && !data ? <SkeletonRankList width={size.width} /> : null}
              {!isLoading && errorMessage && !data ? <ErrorView message={errorMessage} onRetry={() => { void load(boardIndex) }} /> : null}
              {!isLoading && !errorMessage && data && data.rankList.length === 0 ? <EmptyView text="榜单暂无数据" /> : null}

              {data && errorMessage ? (
                <Text
                  font="caption"
                  foregroundStyle="systemOrange"
                  padding={{ horizontal: 12 }}
                  frame={FILL_LEADING}
                  onTapGesture={() => { void load(boardIndex) }}
                >
                  网络不可用，正在显示上次内容，点此重试
                </Text>
              ) : null}

              {data?.rankList.map(item => (
                <RankRow
                  key={item.seriesId}
                  item={item}
                  width={size.width}
                  onSelect={selected => onSelectSeries(selected.seriesId, selected.episodeVids?.[0])}
                />
              ))}

              {data && data.rankList.length > 0 ? (
                <VStack
                  key={`rank-footer:${boardIndex}:${page}:${isLoading ? "refresh" : "ready"}`}
                  spacing={8}
                  frame={FILL_CENTER}
                  padding={{ vertical: 12 }}
                  onAppear={() => loadMore()}
                >
                  {loadMoreError ? (
                    <Text font="caption" foregroundStyle="systemOrange" onTapGesture={() => loadMore(true)}>
                      {`${loadMoreError}，点此重试`}
                    </Text>
                  ) : isLoading || isLoadingMore || page < totalPages ? (
                    <HStack spacing={8}>
                      <ProgressView />
                      <Text font="caption" foregroundStyle="secondaryLabel">
                        {isLoading ? "正在更新榜单…" : "正在加载更多…"}
                      </Text>
                    </HStack>
                  ) : (
                    <Text font="caption" foregroundStyle="secondaryLabel">已全部加载</Text>
                  )}
                </VStack>
              ) : null}
            </LazyVStack>
          </ScrollView>
        </VStack>
      )}
    </GeometryReader>
  )
}
