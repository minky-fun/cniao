import {
  Button,
  FlowLayout,
  HStack,
  Image,
  NavigationLink,
  ScrollView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useEffect,
  useState,
} from "scripting"
import { fetchDetail } from "../core/api"
import { FavoriteButton } from "./FavoriteButton"
import { formatCount } from "../core/format"
import { listCachedVideoIds, onCacheChanged } from "../core/mediaCache"
import type { Review, SeriesDetail, SeriesSocialInfo } from "../core/types"
import {
  CoverImage,
  ErrorView,
  FILL_LEADING,
  PAGE_FRAME,
  SERIES_SURFACE,
  SkeletonDetail,
  THEME_COLOR,
} from "./Common"

const COVER_WIDTH = 98
const COVER_HEIGHT = 140
const EPISODE_RANGE_SIZE = 30

/** 展示详情、独立收藏操作和选集入口，保留原有主题适配。 */
export function DetailView({
  seriesId,
  onPlayEpisode,
  onOpenCache,
  onOpenHistory,
}: {
  seriesId: string
  onPlayEpisode: (seriesId: string, vid: string) => void
  onOpenCache?: () => void
  onOpenHistory?: () => void
}) {
  const [detail, setDetail] = useState<SeriesDetail | null>(null)
  const [social, setSocial] = useState<SeriesSocialInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [introExpanded, setIntroExpanded] = useState(false)

  /** 读取当前剧集详情和互动数据，失败时展示重试入口。 */
  const load = () => {
    setIsLoading(true)
    setErrorMessage("")

    fetchDetail(seriesId)
      .then(result => {
        setDetail(result.detail)
        setSocial(result.social)
      })
      .catch(error => {
        setErrorMessage(error instanceof Error ? error.message : String(error))
        setDetail(null)
        setSocial(null)
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    setIntroExpanded(false)
    load()
  }, [seriesId])

  if (isLoading) {
    return (
      <ScrollView
        navigationTitle="HG 短剧"
        navigationBarTitleDisplayMode="inline"
        background={<VStack frame={PAGE_FRAME} background={SERIES_SURFACE} ignoresSafeArea={{ regions: "container" }} />}
        foregroundStyle="label"
        toolbarBackground={{ style: SERIES_SURFACE, bars: ["navigationBar"] }}
        toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar"] }}
      >
        <SkeletonDetail />
      </ScrollView>
    )
  }
  if (errorMessage) return <ErrorView message={errorMessage} onRetry={load} />
  if (!detail) return null

  const episodeCount = detail.vid_list.length

  return (
    <ScrollView
      navigationTitle="HG 短剧"
      navigationBarTitleDisplayMode="inline"
      background={<VStack frame={PAGE_FRAME} background={SERIES_SURFACE} ignoresSafeArea={{ regions: "container" }} />}
      foregroundStyle="label"
      toolbarBackground={{ style: SERIES_SURFACE, bars: ["navigationBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar"] }}
      safeAreaInset={{
        bottom: {
          alignment: "center",
          spacing: 0,
          content: <FavoriteButton key={detail.series_id} record={{
            seriesId: detail.series_id,
            title: detail.series_name,
            cover: detail.series_cover,
            totalEpisodes: detail.vid_list.length,
          }} />,
        },
      }}
      toolbar={
        onOpenCache || onOpenHistory
          ? {
              topBarTrailing: [
                ...(onOpenHistory
                  ? [
                      <Button
                        title=""
                        systemImage="clock.arrow.circlepath"
                        action={onOpenHistory}
                      />,
                    ]
                  : []),
                ...(onOpenCache ? [<Button title="缓存" action={onOpenCache} />] : []),
              ],
            }
          : undefined
      }
    >
      <VStack alignment="leading" spacing={28} padding={{ top: 16, bottom: 28 }} frame={FILL_LEADING}>

        <HStack spacing={16} alignment="top" padding={{ horizontal: 16 }} frame={FILL_LEADING}>
          <CoverImage url={detail.series_cover} width={COVER_WIDTH} height={COVER_HEIGHT} cornerRadius={8} />

          <VStack alignment="leading" spacing={14} frame={FILL_LEADING} padding={{ top: 2 }}>
            <Text font={20} fontWeight="medium" lineLimit={3} frame={FILL_LEADING}>
              {detail.series_name}
            </Text>

            <SocialStats social={social} />

            {social?.rank_label || detail.tags.length > 0 ? (
              <FlowLayout spacing={6} frame={FILL_LEADING}>
                {social?.rank_label ? (
                  <HStack
                    spacing={4}
                    foregroundStyle="secondaryLabel"
                    padding={{ horizontal: 7 }}
                    frame={{ height: 24 }}
                    background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 6 } }}
                  >
                    <Image systemName="trophy.fill" font={11} />
                    <Text font={12} lineLimit={1}>{social.rank_label.replace(/^热播短剧榜第(\d+)名$/, "短剧热播榜 No.$1")}</Text>
                  </HStack>
                ) : null}
                {detail.tags.slice(0, 1).map(tag => (
                  <Text
                    key={tag}
                    font={12}
                    lineLimit={1}
                    foregroundStyle="secondaryLabel"
                    padding={{ horizontal: 7 }}
                    frame={{ height: 24 }}
                    background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 6 } }}
                  >
                    {tag}
                  </Text>
                ))}
              </FlowLayout>
            ) : null}
          </VStack>
        </HStack>

        {detail.series_intro || detail.celebrities.length > 0 ? (
          <VStack alignment="leading" spacing={18} frame={FILL_LEADING}>
            <Text font={16} fontWeight="medium" padding={{ horizontal: 16 }}>
              基本信息
            </Text>
            {detail.series_intro ? (
              <HStack alignment="lastTextBaseline" spacing={4} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
                <Text
                  font={14}
                  foregroundStyle="secondaryLabel"
                  lineLimit={introExpanded ? undefined : 2}
                  fixedSize={{ horizontal: false, vertical: true }}
                  frame={FILL_LEADING}
                >
                  {detail.series_intro}
                </Text>
                <Button
                  title={introExpanded ? "收起" : "展开"}
                  action={() => setIntroExpanded(value => !value)}
                  buttonStyle="plain"
                  font={14}
                  fixedSize={{ horizontal: true, vertical: true }}
                  foregroundStyle={THEME_COLOR}
                />
              </HStack>
            ) : null}
            {detail.celebrities.length > 0 ? (
              <ScrollView axes="horizontal" scrollIndicator="hidden">
                <HStack spacing={14} alignment="top" padding={{ horizontal: 16 }}>
                  {detail.celebrities.map(celebrity => (
                    <VStack key={celebrity.celebrity_id} alignment="center" spacing={4} frame={{ width: 64 }}>
                      <Image
                        imageUrl={celebrity.avatar}
                        frame={{ width: 56, height: 56 }}
                        clipShape="circle"
                        resizable={true}
                        scaleToFill={true}
                      />
                      <Text font={13} lineLimit={1} frame={{ width: 64, alignment: "center" }}>
                        {celebrity.nickname}
                      </Text>
                      <Text font={12} foregroundStyle="tertiaryLabel" lineLimit={1} frame={{ width: 64, alignment: "center" }}>
                        {celebrity.sub_title}
                      </Text>
                    </VStack>
                  ))}
                </HStack>
              </ScrollView>
            ) : null}
          </VStack>
        ) : null}

        <VStack alignment="leading" spacing={18} frame={FILL_LEADING}>
          <HStack spacing={8} alignment="center" padding={{ horizontal: 16 }} frame={FILL_LEADING}>
            <Text font={16} fontWeight="medium">
              剧集
            </Text>
            <Spacer />
            <Text font="caption" foregroundStyle="tertiaryLabel">
              {`共${episodeCount}集`}
            </Text>
          </HStack>

          <DetailEpisodes
            key={detail.series_id}
            vids={detail.vid_list}
            onSelect={vid => onPlayEpisode(detail.series_id, vid)}
          />
        </VStack>

        <ReviewList
          reviews={social?.reviews?.reviews ?? []}
          totalCount={social?.reviews?.total_count}
          rating={social?.rating}
          ratingCount={social?.rating_count}
        />
      </VStack>
    </ScrollView>
  )
}

/** 按官网移动版只展示收藏与点赞，不混入桌面版热度。 */
function SocialStats({ social }: { social: SeriesSocialInfo | null }) {
  if (!social) return null

  const parts: string[] = []
  if (social.series_favorite_count) parts.push(`${formatCount(social.series_favorite_count)}收藏`)
  if (social.series_like_count) parts.push(`${formatCount(social.series_like_count)}次点赞`)
  if (parts.length === 0) return null

  return (
    <Text font={13} foregroundStyle="tertiaryLabel" frame={FILL_LEADING}>
      {parts.join(" · ")}
    </Text>
  )
}

/** 每 30 集分段，以正方形选集展示播放入口和实时缓存角标。 */
function DetailEpisodes({ vids, onSelect }: { vids: string[]; onSelect: (vid: string) => void }) {
  const [rangeIndex, setRangeIndex] = useState(0)
  const [cachedVidSet, setCachedVidSet] = useState<Set<string>>(() => listCachedVideoIds())

  // 订阅缓存增删与清空事件，组件卸载时取消监听。
  useEffect(() => {
    return onCacheChanged((videoId, action) => {
      setCachedVidSet(previous => {
        const next = new Set(previous)
        if (action === "added") next.add(videoId)
        else if (action === "removed") next.delete(videoId)
        else if (action === "cleared") next.clear()
        return next
      })
    })
  }, [])

  const start = rangeIndex * EPISODE_RANGE_SIZE

  return (
    <VStack alignment="leading" spacing={16} frame={FILL_LEADING}>
      <ScrollView axes="horizontal" scrollIndicator="hidden">
        <HStack spacing={32} padding={{ horizontal: 16 }}>
          {Array.from({ length: Math.ceil(vids.length / EPISODE_RANGE_SIZE) }, (_, index) => (
            <Button
              key={index}
              title={`${index * EPISODE_RANGE_SIZE + 1}–${Math.min((index + 1) * EPISODE_RANGE_SIZE, vids.length)}`}
              action={() => setRangeIndex(index)}
              buttonStyle="plain"
              font={14}
              foregroundStyle={index === rangeIndex ? THEME_COLOR : "tertiaryLabel"}
            />
          ))}
        </HStack>
      </ScrollView>
      <ScrollView key={rangeIndex} axes="horizontal" scrollIndicator="hidden">
        <HStack spacing={8} padding={{ horizontal: 16 }}>
          {vids.slice(start, start + EPISODE_RANGE_SIZE).map((vid, index) => (
            <Button key={vid} action={() => onSelect(vid)} buttonStyle="plain">
              <ZStack alignment="topLeading">
                <Text
                  font={16}
                  foregroundStyle="label"
                  frame={{ width: 52, height: 52 }}
                  background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 8 } }}
                >
                  {String(start + index + 1)}
                </Text>
                <Image
                  systemName={cachedVidSet.has(vid) ? "checkmark.circle.fill" : "arrow.down.circle"}
                  font={10}
                  foregroundStyle={cachedVidSet.has(vid) ? THEME_COLOR : "tertiaryLabel"}
                  padding={4}
                />
              </ZStack>
            </Button>
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  )
}

/** 参照官网展示日期、两行正文及底部用户、星级与点赞数。 */
function ReviewCard({ review, expanded = false }: { review: Review; expanded?: boolean }) {
  const date = new Date(Number(review.create_time) * 1000)
  const rating = review.rating
  const publishedAt = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

  return (
    <VStack
      alignment="leading"
      spacing={6}
      padding={{ horizontal: 16, top: 14, bottom: 12 }}
      frame={expanded ? FILL_LEADING : { width: 320, height: 128, alignment: "topLeading" }}
      background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 12 } }}
    >
      <Text font={12} foregroundStyle="tertiaryLabel">{publishedAt}</Text>
      <Text
        font={16}
        lineLimit={expanded ? undefined : 2}
        frame={expanded ? FILL_LEADING : { height: 52, alignment: "topLeading" }}
      >
        {review.content}
      </Text>
      <HStack spacing={6} frame={FILL_LEADING}>
        <Image imageUrl={review.user_avatar} frame={{ width: 16, height: 16 }} clipShape="circle" resizable scaleToFill />
        <Text font={12} foregroundStyle="tertiaryLabel" lineLimit={1}>{review.user_name}</Text>
        {typeof rating === "number" ? (
          <HStack spacing={2}>
            {[0, 1, 2, 3, 4].map(index => (
              <Image
                key={index}
                systemName={rating >= (index + 1) * 2 ? "star.fill" : rating > index * 2 ? "star.leadinghalf.filled" : "star"}
                font={10}
                foregroundStyle={THEME_COLOR}
              />
            ))}
          </HStack>
        ) : null}
        <Spacer minLength={4} />
        <Image systemName="heart" font={14} />
        <Text font={12}>{formatCount(review.digg_count)}</Text>
      </HStack>
    </VStack>
  )
}

/** 展示实际剧集评分、主题色星级和横向剧评卡片。 */
export function ReviewList({
  reviews,
  totalCount,
  rating,
  ratingCount,
}: {
  reviews: Review[]
  totalCount?: string | number
  rating?: number
  ratingCount?: string | number
}) {
  const hasRating = typeof rating === "number" && rating > 0
  if (reviews.length === 0 && !hasRating) return null

  return (
    <VStack alignment="leading" spacing={18} frame={FILL_LEADING}>
      <HStack padding={{ horizontal: 16 }} frame={FILL_LEADING}>
        <Text font={16} fontWeight="medium">
          {totalCount !== undefined ? `剧评 · ${totalCount}` : "剧评"}
        </Text>
        <Spacer />
        {reviews.length > 0 ? (
          <NavigationLink buttonStyle="plain" destination={
            <ScrollView
              navigationTitle="剧评"
              navigationBarTitleDisplayMode="inline"
              background={SERIES_SURFACE}
            >
              <VStack spacing={16} padding={16} frame={FILL_LEADING}>
                {reviews.map((review, index) => <ReviewCard key={index} review={review} expanded />)}
              </VStack>
            </ScrollView>
          }>
            <HStack spacing={4} foregroundStyle="tertiaryLabel">
              <Text font={12}>全部</Text>
              <Image systemName="chevron.right" font={10} />
            </HStack>
          </NavigationLink>
        ) : null}
      </HStack>

      {hasRating ? (
        <HStack
          spacing={18}
          frame={FILL_LEADING}
          background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 12 } }}
          padding={{ horizontal: 16 }}
        >
          <VStack alignment="leading" spacing={4} padding={{ leading: 18, vertical: 12 }}>
            <HStack spacing={2} alignment="firstTextBaseline">
              <Text font={26} bold>{String(rating)}</Text>
              <Text font={12}>分</Text>
            </HStack>
            {ratingCount !== undefined ? (
              <Text font={12} foregroundStyle="tertiaryLabel">{`${formatCount(ratingCount)}人评分`}</Text>
            ) : null}
          </VStack>
          <VStack frame={{ width: 1, height: 32 }} background="separator" />
          <HStack spacing={10} frame={{ maxWidth: "infinity", alignment: "center" }}>
            {[0, 1, 2, 3, 4].map(index => (
              <Image
                key={index}
                systemName={rating >= (index + 1) * 2 ? "star.fill" : rating > index * 2 ? "star.leadinghalf.filled" : "star"}
                font={22}
                foregroundStyle={rating > index * 2 ? THEME_COLOR : "tertiaryLabel"}
              />
            ))}
          </HStack>
        </HStack>
      ) : null}

      <ScrollView axes="horizontal" scrollIndicator="hidden" scrollTargetBehavior="viewAligned">
        <HStack spacing={16} padding={{ horizontal: 16 }} scrollTargetLayout>
          {reviews.map((review, index) => (
            <NavigationLink key={index} destination={
              <ScrollView navigationTitle="剧评" navigationBarTitleDisplayMode="inline" background={SERIES_SURFACE}>
                <VStack padding={16}><ReviewCard review={review} expanded /></VStack>
              </ScrollView>
            } buttonStyle="plain">
              <ReviewCard review={review} />
            </NavigationLink>
          ))}
        </HStack>
      </ScrollView>
    </VStack>
  )
}
