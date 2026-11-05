import { FlowLayout, GeometryReader, HStack, LazyVStack, ProgressView, ScrollView, Text, VStack, ZStack, gradient, useEffect, useRef, useState } from "scripting"
import { fetchCategory } from "../core/api"
import { CATEGORY_ROUTES } from "../core/config"
import type { CategoryData, SelectorItem, SeriesCard } from "../core/types"
import { CoverImage, EmptyView, ErrorView, FILL_CENTER, FILL_LEADING, PAGE_FRAME, SkeletonBlock } from "./Common"

const CATEGORY_SURFACE = { light: "#FFFFFF", dark: "#131414" } as const
const SELECTED_COLOR = { light: "#B55200", dark: "#FA7705" } as const
const TAG_BACKGROUND = { light: "rgba(0,0,0,0.05)", dark: "rgba(224,224,224,0.06)" } as const
const COVER_SHADE = gradient("linear", {
  colors: ["rgba(0,0,0,0)", "rgba(0,0,0,0.3)"],
  startPoint: "top",
  endPoint: "bottom",
})

interface CategoryViewState {
  routeIndex: number
  tagSlug: string
  page: number
  data: CategoryData | null
  selectorList: SelectorItem[]
  isLoading: boolean
  errorMessage: string
  isLoadingMore: boolean
  loadMoreError: string
}

/** 按官网三列卡片显示封面、右下角集数、单行剧名和题材标签。 */
function CategoryCard({ series, width, onSelect }: {
  series: SeriesCard
  width: number
  onSelect: (seriesId: string) => void
}) {
  // 官网手机版的单卡宽 114、封面高 159，随当前容器宽度等比调整。
  const coverHeight = Math.round(width * 159 / 114)

  return (
    <VStack alignment="leading" spacing={0} frame={{ width }} onTapGesture={() => onSelect(series.series_id)}>
      <ZStack alignment="bottomTrailing" frame={{ width, height: coverHeight }} clipShape={{ type: "rect", cornerRadius: 12 }}>
        <CoverImage url={series.series_cover} width={width} height={coverHeight} cornerRadius={12} />
        <VStack frame={{ width, height: 37 }} background={COVER_SHADE} />
        <Text font={12} fontWeight="semibold" foregroundStyle="white" lineLimit={1} padding={{ trailing: 8, bottom: 6 }}>
          {series.episode_right_text ?? `全${series.episode_cnt}集`}
        </Text>
      </ZStack>

      <Text font={14} fontWeight="semibold" foregroundStyle="label" lineLimit={1} frame={{ width, height: 20, alignment: "leading" }} padding={{ top: 8, bottom: 4 }}>
        {series.series_title}
      </Text>
      <FlowLayout horizontalSpacing={6} verticalSpacing={20} frame={{ width, height: 22, alignment: "topLeading" }} clipped>
        {series.tags?.map((tag, index) => (
          <Text
            key={`${index}:${tag}`}
            font={12}
            foregroundStyle="secondaryLabel"
            lineLimit={1}
            fixedSize={{ horizontal: true, vertical: false }}
            frame={{ height: 22 }}
            padding={{ horizontal: 4 }}
            background={{ style: TAG_BACKGROUND, shape: { type: "rect", cornerRadius: 6 } }}
          >
            {tag}
          </Text>
        ))}
      </FlowLayout>
    </VStack>
  )
}

/** 骨架与真实网格使用相同封面比例、行距和文字占位，避免加载后布局跳动。 */
function SkeletonCategoryGrid({ cardWidth }: { cardWidth: number }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => { setPhase(1) }, [])
  const coverHeight = Math.round(cardWidth * 159 / 114)

  return (
    <VStack alignment="leading" spacing={16} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
      {Array.from({ length: 4 }, (_, row) => (
        <HStack key={row} alignment="top" spacing={8}>
          {Array.from({ length: 3 }, (_, column) => (
            <VStack key={column} alignment="leading" spacing={0} frame={{ width: cardWidth }}>
              <SkeletonBlock width={cardWidth} height={coverHeight} cornerRadius={12} phase={phase} />
              <VStack padding={{ top: 8, bottom: 4 }}>
                <SkeletonBlock width={cardWidth} height={20} phase={phase} />
              </VStack>
              <HStack spacing={6}>
                <SkeletonBlock width={cardWidth * 0.3} height={22} phase={phase} />
                <SkeletonBlock width={cardWidth * 0.5} height={22} phase={phase} />
              </HStack>
            </VStack>
          ))}
        </HStack>
      ))}
    </VStack>
  )
}

/** 仅呈现官网中段分类筛选与三列网格，触底追加下一页并隔离过时请求。 */
export function CategoryView({ onSelectSeries }: { onSelectSeries: (seriesId: string) => void }) {
  const [view, setView] = useState<CategoryViewState>({
    routeIndex: 0, tagSlug: "", page: 1, data: null, selectorList: [],
    isLoading: true, errorMessage: "", isLoadingMore: false, loadMoreError: "",
  })
  const request = useRef({ id: 0, routeIndex: 0, tagSlug: "", page: 1, loading: true, failed: false })
  const { routeIndex, tagSlug, page, data, selectorList, isLoading, errorMessage, isLoadingMore, loadMoreError } = view

  /** 原子切换筛选条件，串行追加分页；仅当前请求能够修改页面状态。 */
  const load = async (targetRouteIndex: number, targetTagSlug: string, targetPage = 1) => {
    const append = targetPage > 1
    if (append && (request.current.loading || request.current.routeIndex !== targetRouteIndex || request.current.tagSlug !== targetTagSlug || request.current.page !== targetPage - 1)) return
    const currentRequest = ++request.current.id
    request.current.loading = true
    request.current.failed = false
    request.current.routeIndex = targetRouteIndex
    request.current.tagSlug = targetTagSlug

    if (append) {
      setView(previous => ({ ...previous, isLoadingMore: true, loadMoreError: "" }))
    } else {
      request.current.page = 1
      setView(previous => ({
        routeIndex: targetRouteIndex, tagSlug: targetTagSlug, page: 1, data: null,
        selectorList: previous.routeIndex === targetRouteIndex ? previous.selectorList : [],
        isLoading: true, errorMessage: "", isLoadingMore: false, loadMoreError: "",
      }))
    }

    try {
      const next = await fetchCategory(CATEGORY_ROUTES[targetRouteIndex].route, targetPage, targetTagSlug)
      if (currentRequest !== request.current.id) return
      request.current.page = targetPage
      request.current.loading = false
      setView(previous => {
        const recommendList = append && previous.data ? [...previous.data.recommendList] : []
        const seen = new Set(recommendList.map(item => item.series_id))
        for (const item of next.recommendList) {
          if (seen.has(item.series_id)) continue
          recommendList.push(item)
          seen.add(item.series_id)
        }
        return {
          ...previous, page: targetPage, data: { ...next, recommendList }, selectorList: next.selectorList,
          isLoading: false, isLoadingMore: false, errorMessage: "", loadMoreError: "",
        }
      })
    } catch (error) {
      if (currentRequest !== request.current.id) return
      request.current.loading = false
      request.current.failed = append
      const message = error instanceof Error ? error.message : String(error)
      setView(previous => ({
        ...previous, isLoading: false, isLoadingMore: false,
        errorMessage: append ? "" : message, loadMoreError: append ? message : "",
      }))
    }
  }

  useEffect(() => {
    void load(0, "")
    // 页面退出后，丢弃未结束请求及旧底部回调。
    return () => {
      request.current.id += 1
      request.current.loading = true
    }
  }, [])

  /** 切换内容分类并重置题材与页码。 */
  const switchRoute = (index: number) => {
    if (index === request.current.routeIndex) return
    void load(index, "")
  }

  /** 切换题材时保留同分类的筛选条，从第一页重新加载。 */
  const switchTag = (slug: string) => {
    if (routeIndex !== request.current.routeIndex || slug === request.current.tagSlug) return
    void load(routeIndex, slug)
  }

  const totalPages = data?.pagination.totalPages ?? 1

  /** 底部出现时加载下一页，失败后暂停自动请求并允许点击重试。 */
  const loadMore = (retry = false) => {
    if (!data || isLoading || isLoadingMore || (!retry && (loadMoreError || request.current.failed)) || page >= totalPages) return
    void load(routeIndex, tagSlug, page + 1)
  }

  return (
    <GeometryReader background={CATEGORY_SURFACE} foregroundStyle="label">
      {({ size }) => {
        const cardWidth = (size.width - 32 - 16) / 3
        return (
          <VStack alignment="leading" spacing={0} frame={PAGE_FRAME}>
            <ScrollView axes="horizontal" scrollIndicator="hidden">
              <HStack spacing={26} alignment="center" padding={{ horizontal: 16, top: 11, bottom: 14 }}>
                {CATEGORY_ROUTES.map((item, index) => (
                  <Text
                    key={item.route}
                    font={18}
                    fontWeight="medium"
                    foregroundStyle={index === routeIndex ? "label" : "secondaryLabel"}
                    lineLimit={1}
                    frame={{ height: 32 }}
                    fixedSize={{ horizontal: true, vertical: false }}
                    onTapGesture={() => switchRoute(index)}
                  >
                    {item.label}
                  </Text>
                ))}
              </HStack>
            </ScrollView>
            {isLoading && selectorList.length === 0 ? (
              <ScrollView axes="horizontal" scrollIndicator="hidden" padding={{ bottom: 16 }}>
                <HStack spacing={20} padding={{ horizontal: 12 }}>
                  {Array.from({ length: 8 }, (_, index) => (
                    <SkeletonBlock key={index} width={index === 0 ? 52 : 28} height={30} phase={0} />
                  ))}
                </HStack>
              </ScrollView>
            ) : <TagStrip tags={selectorList} activeSlug={tagSlug} onSelect={switchTag} />}

            <ScrollView key={`category-list:${routeIndex}:${tagSlug}`} scrollIndicator="hidden">
              <LazyVStack alignment="leading" spacing={16} padding={{ bottom: 28 }} frame={FILL_LEADING}>
                {isLoading ? <SkeletonCategoryGrid cardWidth={cardWidth} /> : null}
                {!isLoading && errorMessage ? <ErrorView message={errorMessage} onRetry={() => { void load(routeIndex, tagSlug) }} /> : null}
                {!isLoading && !errorMessage && data && data.recommendList.length === 0 ? <EmptyView text={tagSlug ? "该标签下暂无内容" : "该分类暂无内容"} /> : null}

                {data ? Array.from({ length: Math.ceil(data.recommendList.length / 3) }, (_, row) => (
                  <HStack key={`category-row:${row}`} spacing={8} alignment="top" padding={{ horizontal: 16 }} frame={FILL_LEADING}>
                    {data.recommendList.slice(row * 3, row * 3 + 3).map(series => (
                      <CategoryCard key={series.series_id} series={series} width={cardWidth} onSelect={onSelectSeries} />
                    ))}
                  </HStack>
                )) : null}

                {data && data.recommendList.length > 0 ? (
                  <VStack key={`category-footer:${routeIndex}:${tagSlug}:${page}`} spacing={8} padding={{ vertical: 12 }} frame={FILL_CENTER} onAppear={() => loadMore()}>
                    {loadMoreError ? (
                      <Text font="caption" foregroundStyle="systemOrange" onTapGesture={() => loadMore(true)}>{`${loadMoreError}，点此重试`}</Text>
                    ) : isLoadingMore || page < totalPages ? (
                      <HStack spacing={8}>
                        <ProgressView />
                        <Text font="caption" foregroundStyle="secondaryLabel">正在加载更多…</Text>
                      </HStack>
                    ) : (
                      <Text font="caption" foregroundStyle="secondaryLabel">已全部加载</Text>
                    )}
                  </VStack>
                ) : null}
              </LazyVStack>
            </ScrollView>
          </VStack>
        )
      }}
    </GeometryReader>
  )
}

/** 复用官网横向题材筛选样式，以全部入口替代额外的清除筛选提示。 */
export function TagStrip({ tags, activeSlug, onSelect }: {
  tags: SelectorItem[]
  activeSlug: string
  onSelect: (slug: string) => void
}) {
  if (tags.length === 0) return null

  return (
    <ScrollView axes="horizontal" scrollIndicator="hidden" padding={{ bottom: 16 }}>
      <HStack spacing={20} alignment="center" padding={{ horizontal: 12 }}>
        {[{ selector_item_id: "", show_name: "全部" }, ...tags].map(tag => {
          const isActive = tag.selector_item_id === activeSlug
          return (
            <Text
              key={tag.selector_item_id}
              font={14}
              fontWeight={isActive ? "medium" : "regular"}
              foregroundStyle={isActive ? SELECTED_COLOR : "label"}
              lineLimit={1}
              fixedSize={{ horizontal: true, vertical: false }}
              frame={{ height: 30 }}
              padding={{ horizontal: isActive ? 12 : 0 }}
              background={{ style: isActive ? "rgba(250,119,5,0.1)" : "clear", shape: { type: "rect", cornerRadius: 6 } }}
              onTapGesture={() => onSelect(tag.selector_item_id)}
            >
              {tag.show_name}
            </Text>
          )
        })}
      </HStack>
    </ScrollView>
  )
}
