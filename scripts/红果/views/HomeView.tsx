import {
  GeometryReader,
  HStack,
  Image,
  ScrollView,
  Spacer,
  TabView,
  Text,
  VStack,
  ZStack,
  gradient,
  useEffect,
  useObservable,
  useState,
} from "scripting"
import { fetchHome } from "../core/api"
import { loadCachedHome, saveCachedHome } from "../core/feedCache"
import type { HomeBanner, HomeData, HomeSection, SeriesCard } from "../core/types"
import { BRAND_COLOR, CoverImage, EmptyView, ErrorView, FILL_LEADING, RankBadge, SkeletonHome } from "./Common"

const CARD_WIDTH = 112
const CARD_COVER_HEIGHT = Math.round((CARD_WIDTH * 3) / 2)
// 推荐分区向上覆盖海报底部，不改变图片尺寸。
const BANNER_CONTENT_OVERLAP = 72
const BANNER_BLEND_HEIGHT = 96

const HOME_BACKGROUND = "systemBackground"
const BANNER_SHADE = gradient("linear", {
  stops: [
    { color: "rgba(16,16,17,0.6)", location: 0 },
    { color: "rgba(16,16,17,0.05)", location: 0.3 },
    { color: "rgba(16,16,17,0.6)", location: 0.55 },
    { color: "rgba(16,16,17,0.8)", location: 1 },
  ],
  startPoint: "top",
  endPoint: "bottom",
})

/** 展示首页推荐海报，复用榜单前三角标并保留单行剧名与选剧入口。 */
function LandscapeCard({
  series,
  onSelect,
}: {
  series: SeriesCard
  onSelect: (series: SeriesCard) => void
}) {
  return (
    <VStack
      alignment="leading"
      spacing={6}
      frame={{ width: CARD_WIDTH }}
      onTapGesture={() => onSelect(series)}
    >
      <ZStack alignment="topLeading" frame={{ width: CARD_WIDTH, height: CARD_COVER_HEIGHT }}>
        <CoverImage url={series.series_cover} width={CARD_WIDTH} height={CARD_COVER_HEIGHT} />

        {series.rank !== undefined && series.rank >= 1 && series.rank <= 3 ? (
          <RankBadge rank={series.rank} />
        ) : null}

        <VStack spacing={0} frame={{ width: CARD_WIDTH, height: CARD_COVER_HEIGHT }}>
          <Spacer />
          <HStack
            alignment="center"
            frame={{ width: CARD_WIDTH }}
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

      <Text font="caption" foregroundStyle="label" lineLimit={1} frame={FILL_LEADING}>
        {series.series_title}
      </Text>
    </VStack>
  )
}

/** 保留海报尺寸，让文案与渐隐随推荐区覆盖高度上移，点击进入剧集详情。 */
function BannerView({
  banner,
  width,
  height,
  imageHeight,
  onSelect,
}: {
  banner: HomeBanner
  width: number
  height: number
  imageHeight: number
  onSelect: (seriesId: string) => void
}) {
  const cover = banner.background_cover ?? banner.series_cover ?? ""
  // 渐隐带以推荐区起点为中心，随覆盖高度移动，文案末行附近保留暗底。
  const blendTop = height - BANNER_CONTENT_OVERLAP - BANNER_BLEND_HEIGHT / 2
  const artworkMask = gradient("linear", {
    stops: [
      { color: "black", location: 0 },
      { color: "rgba(0,0,0,0.92)", location: 1 / 3 },
      { color: "rgba(0,0,0,0.4)", location: 0.5 },
      { color: "rgba(0,0,0,0.06)", location: 0.7 },
      { color: "clear", location: 0.86 },
      { color: "clear", location: 1 },
    ],
    startPoint: { x: 0.5, y: blendTop / height },
    endPoint: { x: 0.5, y: (blendTop + BANNER_BLEND_HEIGHT) / height },
  })

  return (
    <ZStack
      alignment="top"
      frame={{ width, height, alignment: "top" }}
      clipped
      onTapGesture={() => onSelect(banner.series_id)}
    >
      <ZStack
        alignment="top"
        frame={{ width, height, alignment: "top" }}
        clipped
        mask={<VStack frame={{ width, height }} background={artworkMask} />}
      >
        {cover ? (
          <Image
            imageUrl={cover}
            resizable
            scaleToFill
            frame={{ width, height: imageHeight }}
            clipped
          />
        ) : null}
        <VStack frame={{ width, height }} background={BANNER_SHADE} />
      </ZStack>
      <VStack spacing={0} frame={{ width, height }}>
        <Spacer />
        <VStack
          alignment="leading"
          spacing={12}
          frame={{ width: width - 48 }}
          padding={{ bottom: BANNER_CONTENT_OVERLAP + 16 }}
        >
          <HStack spacing={7}>
            <Image systemName="sparkles" foregroundStyle={BRAND_COLOR} font="caption" />
            <Text font="caption" bold foregroundStyle="rgba(255,255,255,0.85)">
              精选推荐
            </Text>
          </HStack>
          <Text font={30} bold foregroundStyle="white" lineLimit={1} minScaleFactor={0.65}>
            {banner.series_name}
          </Text>
          {banner.tags?.length ? (
            <Text font="caption" foregroundStyle="rgba(255,255,255,0.75)" lineLimit={1}>
              {banner.tags.slice(0, 3).join(" · ")}
            </Text>
          ) : null}
          {banner.series_intro ? (
            <Text font="footnote" foregroundStyle="rgba(255,255,255,0.75)" lineLimit={2}>
              {banner.series_intro}
            </Text>
          ) : null}
        </VStack>
      </VStack>
    </ZStack>
  )
}

/** 使用原生分页轮播，支持滑动和自动切换；离开首页后清除切换计时。 */
function HeroCarousel({
  banners,
  width,
  onSelect,
}: {
  banners: HomeBanner[]
  width: number
  onSelect: (seriesId: string) => void
}) {
  const selection = useObservable(0)
  const [visible, setVisible] = useState(false)
  // 只收起轮播布局，保留海报原尺寸，文案另设底部间距。
  const imageHeight = Math.min(560, Math.max(440, width * 1.35))
  const height = imageHeight - 92
  const index = selection.value

  useEffect(() => {
    if (!visible || banners.length < 2) return
    const timer = setTimeout(() => selection.setValue((index + 1) % banners.length), 8000)
    return () => clearTimeout(timer)
  }, [visible, index, banners.length])

  return (
    <ZStack
      frame={{ width, height }}
      background={HOME_BACKGROUND}
      clipped
      onAppear={() => setVisible(true)}
      onDisappear={() => setVisible(false)}
    >
      <TabView selection={selection} tabViewStyle="pageNeverDisplayIndex" frame={{ width, height }}>
        {banners.map((banner, page) => (
          <BannerView
            key={banner.series_id}
            tag={page}
            banner={banner}
            width={width}
            height={height}
            imageHeight={imageHeight}
            onSelect={onSelect}
          />
        ))}
      </TabView>
    </ZStack>
  )
}

/** 按系统外观展示横向推荐分区，隐藏横向滚动指示条。 */
function SectionRow({
  section,
  onSelect,
}: {
  section: HomeSection
  onSelect: (series: SeriesCard) => void
}) {
  return (
    <VStack alignment="leading" spacing={10} frame={FILL_LEADING}>
      <Text font="title3" bold foregroundStyle="label" padding={{ horizontal: 16 }}>
        {section.tab_name}
      </Text>

      <ScrollView axes="horizontal" scrollIndicator="hidden">
        <HStack spacing={12} alignment="top" padding={{ horizontal: 16 }}>
          {section.video_list.map(series => (
            <LandscapeCard key={series.series_id} series={series} onSelect={onSelect} />
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  )
}

/** 按系统外观加载首页，让推荐分区融入海报底部并保留离线快照与重试。 */
export function HomeView({
  onSelectSeries,
}: {
  onSelectSeries: (seriesId: string) => void
}) {

  const [cachedHome] = useState(loadCachedHome)
  const [sections, setSections] = useState<HomeSection[]>(cachedHome?.homeSections ?? [])
  const [banners, setBanners] = useState<HomeBanner[]>(cachedHome?.bannerList ?? [])
  const [isLoading, setIsLoading] = useState(!cachedHome)
  const [errorMessage, setErrorMessage] = useState("")
  const hasContent = sections.length > 0 || banners.length > 0

  /** 更新首页列表，并保存现有离线快照。 */
  const applyHome = (data: HomeData) => {
    setSections(data.homeSections)
    setBanners(data.bannerList)
    saveCachedHome(data)
  }

  /** 刷新原有首页数据，网络异常时继续显示已缓存内容。 */
  const load = () => {
    if (!hasContent) setIsLoading(true)
    setErrorMessage("")

    fetchHome()
      .then(applyHome)
      .catch(error => {
        setErrorMessage(error instanceof Error ? error.message : String(error))
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  if (isLoading && !hasContent) {
    return <ScrollView><SkeletonHome /></ScrollView>
  }
  if (errorMessage && !hasContent) return <ErrorView message={errorMessage} onRetry={load} />
  if (!hasContent) return <EmptyView text="暂无内容" />

  const featured = banners.slice(0, 5)

  // 保留导航栏和标签栏安全区，使滚动到底部时最后一排内容完整可见。
  return (
    <GeometryReader
      background={HOME_BACKGROUND}
      foregroundStyle="label"
      toolbarBackground={{ style: HOME_BACKGROUND, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{
        visibility: "visible",
        bars: ["navigationBar", "tabBar"],
      }}
    >
      {({ size }) => (
        <ScrollView
          scrollIndicator="hidden"
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          background={HOME_BACKGROUND}
        >
          <VStack
            alignment="leading"
            spacing={featured.length > 0 ? -BANNER_CONTENT_OVERLAP : 0}
            frame={{ width: size.width }}
            padding={{ bottom: 28 }}
          >
            {featured.length > 0 ? (
              <HeroCarousel
                key={featured.map(banner => banner.series_id).join(":")}
                banners={featured}
                width={size.width}
                onSelect={onSelectSeries}
              />
            ) : null}
            <VStack
              alignment="leading"
              spacing={26}
              frame={{ width: size.width }}
              padding={{ top: 8 }}
            >
              {errorMessage ? (
                <Text
                  font="caption"
                  foregroundStyle="systemOrange"
                  padding={{ horizontal: 16 }}
                  frame={FILL_LEADING}
                  onTapGesture={load}
                >
                  网络不可用，正在显示上次内容，点此重试
                </Text>
              ) : null}
              {sections.map(section => (
                <SectionRow
                  key={section.tab_type}
                  section={section}
                  onSelect={series => onSelectSeries(series.series_id)}
                />
              ))}
            </VStack>
          </VStack>
        </ScrollView>
      )}
    </GeometryReader>
  )
}
