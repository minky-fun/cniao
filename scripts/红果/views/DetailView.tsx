import {
  Button,
  FlowLayout,
  HStack,
  Image,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useEffect,
  useState,
} from "scripting"
import { fetchDetail } from "../core/api"
import { formatCount, formatRelativeTime } from "../core/format"
import type { Review, SeriesDetail, SeriesSocialInfo } from "../core/types"
import {
  CoverImage,
  ErrorView,
  FILL_LEADING,
  PAGE_FRAME,
  SERIES_SURFACE,
  SkeletonDetail,
  TagChip,
  THEME_COLOR,
} from "./Common"
import { EpisodeGrid } from "./EpisodeGrid"

const COVER_WIDTH = 98
const COVER_HEIGHT = 140
const EPISODE_PAGE_SIZE = 15

/** 参照官网中间内容区展示详情，保留主题适配和原有选集播放入口。 */
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
        navigationTitle="红果剧场"
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

  const remaining = episodeCount - EPISODE_PAGE_SIZE

  return (
    <ScrollView
      navigationTitle="红果剧场"
      navigationBarTitleDisplayMode="inline"
      background={<VStack frame={PAGE_FRAME} background={SERIES_SURFACE} ignoresSafeArea={{ regions: "container" }} />}
      foregroundStyle="label"
      toolbarBackground={{ style: SERIES_SURFACE, bars: ["navigationBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar"] }}
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
                    padding={{ horizontal: 7, vertical: 4 }}
                    background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 6 } }}
                  >
                    <Image systemName="trophy.fill" font={11} />
                    <Text font={12}>{social.rank_label}</Text>
                  </HStack>
                ) : null}
                {detail.tags.map(tag => <TagChip key={tag} text={tag} />)}
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
              <VStack alignment="trailing" spacing={4} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
                <Text font={14} foregroundStyle="secondaryLabel" lineLimit={introExpanded ? undefined : 2} frame={FILL_LEADING}>
                  {detail.series_intro}
                </Text>
                <Button
                  title={introExpanded ? "收起" : "展开"}
                  action={() => setIntroExpanded(value => !value)}
                  buttonStyle="plain"
                  font={12}
                  foregroundStyle={THEME_COLOR}
                />
              </VStack>
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

        <VStack alignment="leading" spacing={10} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
          <HStack spacing={8} alignment="center" frame={FILL_LEADING}>
            <Text font={16} fontWeight="medium">
              剧集
            </Text>
            <Spacer />
            <Text font="caption" foregroundStyle="tertiaryLabel">
              {`共 ${episodeCount} 集`}
            </Text>
          </HStack>

          <EpisodeGrid
            vids={detail.vid_list}
            onSelect={vid => onPlayEpisode(detail.series_id, vid)}
          />

          {remaining > 0 ? (
            <Text font="caption2" foregroundStyle="tertiaryLabel" frame={FILL_LEADING}>
              {`左右滑动翻页查看全部 ${episodeCount} 集`}
            </Text>
          ) : null}
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

/** 参照官网在剧名下以灰色文字展示真实收藏、点赞和热度数据。 */
function SocialStats({ social }: { social: SeriesSocialInfo | null }) {
  if (!social) return null

  const parts: string[] = []
  if (social.series_favorite_count) parts.push(`${formatCount(social.series_favorite_count)}收藏`)
  if (social.series_like_count) parts.push(`${formatCount(social.series_like_count)}次点赞`)
  if (social.hot_score_data?.text) parts.push(social.hot_score_data.text)
  if (parts.length === 0) return null

  return (
    <Text font={13} foregroundStyle="tertiaryLabel" frame={FILL_LEADING}>
      {parts.join(" · ")}
    </Text>
  )
}

/** 按官网剧评区排列评分汇总和评论，只展示接口实际返回的评分与人数。 */
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
    <VStack alignment="leading" spacing={18} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
      <Text font={16} fontWeight="medium" frame={FILL_LEADING}>
        {totalCount !== undefined ? `剧评 · ${formatCount(totalCount)}` : "剧评"}
      </Text>

      {hasRating ? (
        <HStack
          spacing={16}
          padding={{ horizontal: 18, vertical: 16 }}
          frame={FILL_LEADING}
          background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 12 } }}
        >
          <VStack alignment="leading" spacing={4}>
            <HStack spacing={2} alignment="firstTextBaseline">
              <Text font={26} bold>{String(rating)}</Text>
              <Text font={12}>分</Text>
            </HStack>
            {ratingCount !== undefined ? (
              <Text font={12} foregroundStyle="tertiaryLabel">{`${formatCount(ratingCount)}人评分`}</Text>
            ) : null}
          </VStack>
          <Spacer />
          <HStack spacing={8}>
            {[0, 1, 2, 3, 4].map(index => (
              <Image
                key={index}
                systemName={rating >= (index + 1) * 2 ? "star.fill" : rating > index * 2 ? "star.leadinghalf.filled" : "star"}
                font={20}
                foregroundStyle={THEME_COLOR}
              />
            ))}
          </HStack>
        </HStack>
      ) : null}

      {reviews.map((review, index) => (
        <HStack key={`${review.user_name}-${index}`} spacing={10} alignment="top" frame={FILL_LEADING}>
          <Image
            imageUrl={review.user_avatar}
            frame={{ width: 32, height: 32 }}
            clipShape="circle"
            resizable={true}
            scaleToFill={true}
          />

          <VStack alignment="leading" spacing={4} frame={FILL_LEADING}>
            <HStack spacing={8} alignment="center">
              <Text font="caption" foregroundStyle="secondaryLabel">
                {review.user_name}
              </Text>
              <Text font="caption2" foregroundStyle="tertiaryLabel">
                {formatRelativeTime(review.create_time)}
              </Text>
            </HStack>

            <Text font="footnote" frame={FILL_LEADING}>
              {review.content}
            </Text>

            {review.digg_count ? (
              <Text font="caption2" foregroundStyle="tertiaryLabel">
                {`${formatCount(review.digg_count)} 赞`}
              </Text>
            ) : null}
          </VStack>
        </HStack>
      ))}
    </VStack>
  )
}
