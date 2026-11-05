import {
  Button,
  FlowLayout,
  HStack,
  Image,
  ScrollView,
  SVG,
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
  HEAT_COLOR,
  HEAT_ICON,
  METRIC_STYLES,
  PAGE_FRAME,
  SCORE_ICON,
  SERIES_SURFACE,
  SkeletonDetail,
} from "./Common"
import { EpisodeGrid } from "./EpisodeGrid"

const COVER_WIDTH = 108
const COVER_HEIGHT = 162
const EPISODE_PAGE_SIZE = 15

/** 按当前主题展示剧集详情，沿用榜单的互动标签并通过选集进入播放。 */
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

  const [tipMessage, setTipMessage] = useState("")
  const [tipVisible, setTipVisible] = useState(false)

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
      toast={{
        message: tipMessage,
        isPresented: tipVisible,
        onChanged: setTipVisible,
        position: "center",
        duration: 1.8,
      }}
    >
      <VStack alignment="leading" spacing={18} padding={{ bottom: 24 }} frame={FILL_LEADING}>

        <HStack spacing={14} alignment="top" padding={{ horizontal: 16, top: 12 }} frame={FILL_LEADING}>
          <CoverImage url={detail.series_cover} width={COVER_WIDTH} height={COVER_HEIGHT} cornerRadius={10} />

          <VStack alignment="leading" spacing={8} frame={FILL_LEADING}>
            <Text font="title3" bold lineLimit={2} frame={FILL_LEADING}>
              {detail.series_name}
            </Text>

            <Text font={12} foregroundStyle="secondaryLabel">
              {detail.episode_right_text ?? `全${detail.episode_cnt}集`}
            </Text>

            <SocialStats social={social} />

            {detail.tags.length > 0 ? (
              <Text font={12} foregroundStyle="secondaryLabel" frame={FILL_LEADING}>
                {detail.tags.slice(0, 4).join("·")}
              </Text>
            ) : null}
          </VStack>
        </HStack>

        {detail.series_intro ? (
          <VStack alignment="leading" spacing={6} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
            <Text font="headline" bold>
              剧情简介
            </Text>
            <Text font="footnote" foregroundStyle="secondaryLabel" frame={FILL_LEADING}>
              {detail.series_intro}
            </Text>
          </VStack>
        ) : null}

        {detail.celebrities.length > 0 ? (
          <VStack alignment="leading" spacing={8} frame={FILL_LEADING}>
            <Text font="headline" bold padding={{ horizontal: 16 }}>
              演职人员
            </Text>
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
                    <Text font="caption2" lineLimit={1} frame={FILL_LEADING}>
                      {celebrity.nickname}
                    </Text>
                    <Text font="caption2" foregroundStyle="tertiaryLabel" lineLimit={1} frame={FILL_LEADING}>
                      {celebrity.sub_title}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            </ScrollView>
          </VStack>
        ) : null}

        <VStack alignment="leading" spacing={10} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
          <HStack spacing={8} alignment="center" frame={FILL_LEADING}>
            <Text font="headline" bold>
              选集
            </Text>
            <Text font="caption" foregroundStyle="tertiaryLabel">
              {`共 ${episodeCount} 集`}
            </Text>
          </HStack>

          <Text font="caption2" foregroundStyle="secondaryLabel" frame={FILL_LEADING}>
            剧集首次播放均需下载并解密，带 ↓ 标记的表示尚未缓存
          </Text>

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
        />
      </VStack>
    </ScrollView>
  )
}

/** 复用榜单的热度图标与评分、收藏、点赞标签，空间不足时自动换行。 */
function SocialStats({ social }: { social: SeriesSocialInfo | null }) {
  if (!social) return null

  const metrics: { kind: keyof typeof METRIC_STYLES; text: string }[] = []
  if (typeof social.rating === "number" && social.rating > 0) metrics.push({ kind: "score", text: `评分 ${social.rating}` })
  if (social.series_favorite_count) metrics.push({ kind: "engagement", text: `${formatCount(social.series_favorite_count)} 收藏` })
  if (social.series_like_count) metrics.push({ kind: "engagement", text: `${formatCount(social.series_like_count)} 点赞` })
  if (social.rank_label) metrics.push({ kind: "status", text: social.rank_label })

  if (metrics.length === 0 && !social.hot_score_data?.text) return null

  return (
    <VStack alignment="leading" spacing={6} frame={FILL_LEADING}>
      {social.hot_score_data?.text ? (
        <HStack spacing={2} alignment="center" foregroundStyle={HEAT_COLOR}>
          <SVG code={HEAT_ICON} renderingMode="template" foregroundStyle={HEAT_COLOR} frame={{ width: 12, height: 12 }} />
          <Text font={12} fontWeight="medium">{social.hot_score_data.text}</Text>
        </HStack>
      ) : null}
      {metrics.length > 0 ? (
        <FlowLayout spacing={4} frame={FILL_LEADING}>
          {metrics.map((metric, index) => (
            <HStack
              key={`${metric.kind}:${index}`}
              spacing={3}
              foregroundStyle={METRIC_STYLES[metric.kind].foreground}
              padding={{ horizontal: 4, vertical: 1 }}
              background={{ style: METRIC_STYLES[metric.kind].background, shape: { type: "rect", cornerRadius: 4 } }}
            >
              {metric.kind === "score" ? (
                <SVG code={SCORE_ICON} renderingMode="template" foregroundStyle={METRIC_STYLES.score.foreground} frame={{ width: 12, height: 12 }} />
              ) : null}
              <Text font={12}>{metric.text}</Text>
            </HStack>
          ))}
        </FlowLayout>
      ) : null}
    </VStack>
  )
}

/** 展示已有热门评论及其作者、时间和点赞数。 */
export function ReviewList({
  reviews,
  totalCount,
}: {
  reviews: Review[]
  totalCount?: string | number
}) {
  if (reviews.length === 0) return null

  return (
    <VStack alignment="leading" spacing={12} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
      <HStack spacing={8} alignment="center" frame={FILL_LEADING}>
        <Text font="headline" bold>
          热门评论
        </Text>
        {totalCount !== undefined ? (
          <Text font="caption" foregroundStyle="tertiaryLabel">
            {`共 ${formatCount(totalCount)} 条`}
          </Text>
        ) : null}
      </HStack>

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
