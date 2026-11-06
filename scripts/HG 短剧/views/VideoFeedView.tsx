import {
  AbortController, AppEvents, AVPlayerView, Button, GeometryReader, HStack, Image, LazyVStack,
  PIPStatus, ProgressView, ScrollView, Spacer, Text, VStack, ZStack,
  gradient, useEffect, useObservable, useRef, useState,
} from "scripting"
import { fetchRecommendationPage, type FeedCursor, type Recommendation } from "../core/recommendations"
import { prepareFeedPlayback, type FeedPlaybackSource } from "../core/feedPlayback"
import { getAutoCacheEnabled, preloadOfflineVideo } from "../core/mediaCache"
import { savePlayHistoryItem } from "../core/history"
import { isPipPlaybackActive, releaseRetainedPlayer } from "../core/playbackState"
import { attachSleepPlayer, canAutoPlay, detachSleepPlayer, resumeAfterSleep } from "../core/sleepTimer"
import { PAGE_FRAME, THEME_COLOR } from "./Common"

const VIDEO_SHADE = gradient("linear", {
  stops: [
    { color: "rgba(0,0,0,0)", location: 0 },
    { color: "rgba(0,0,0,0.1)", location: 0.45 },
    { color: "rgba(0,0,0,0.85)", location: 1 },
  ],
  startPoint: "top", endPoint: "bottom",
})

/** 用原生纵向分页展示服务端推荐，一次只为当前视频绑定播放器。 */
export function VideoFeedView({ active, onPlaySeries, onOpenHistory, onSearch }: {
  active: boolean
  onPlaySeries: (seriesId: string, vid: string) => void
  onOpenHistory: () => void
  onSearch: () => void
}) {
  const [items, setItems] = useState<Recommendation[]>([])
  const [visibleId, setVisibleId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [pageError, setPageError] = useState("")
  const cursor = useRef<FeedCursor>({ offset: 0, sessionId: "" })
  const pagePending = useRef(false)
  const seenSeries = useRef(new Set<string>())
  const alive = useRef(true)
  const [foreground, setForeground] = useState(true)
  const [appeared, setAppeared] = useState(true)
  const [player] = useState(() => new AVPlayer())
  const pipStatus = useObservable<PIPStatus>(null)
  const [ready, setReady] = useState(false)
  const [loadedVid, setLoadedVid] = useState("")
  const [playing, setPlaying] = useState(false)
  const [prepareLabel, setPrepareLabel] = useState("")
  const [playError, setPlayError] = useState("")
  const [retry, setRetry] = useState(0)
  const [pipBlocked, setPipBlocked] = useState(false)
  const wantsPlay = useRef(false)
  const cacheTask = useRef<Promise<void>>(Promise.resolve())
  const cacheAttempts = useRef(new Set<string>())
  const cacheProtection = useRef<string[]>([])
  const current = items.find(item => item.detail.series_id === visibleId) ?? items[0]
  const index = current ? items.indexOf(current) : -1
  const enabled = active && foreground && appeared
  // 下载结束后才执行容量淘汰，保持数组引用以保护滑动后的当前播放集。
  cacheProtection.current.length = current ? 1 : 0
  if (current) cacheProtection.current[0] = current.vid

  /** 合并服务端下一页并按剧集去重；请求未完成时阻止重复触底请求。 */
  const loadMore = async () => {
    if (pagePending.current || !hasMore || !alive.current) return
    pagePending.current = true
    setLoading(true)
    setPageError("")
    try {
      const page = await fetchRecommendationPage(cursor.current)
      if (!alive.current) return
      cursor.current = page.cursor
      setHasMore(page.hasMore)
      const additions = page.items.filter(item => !seenSeries.current.has(item.detail.series_id))
      for (const item of additions) seenSeries.current.add(item.detail.series_id)
      setItems(previous => [...previous, ...additions])
      if (!additions.length && page.hasMore) setPageError("这一批暂无新推荐，可继续加载下一批")
    } catch (error) {
      if (alive.current) setPageError(error instanceof Error ? error.message : "推荐加载失败，请重试")
    } finally {
      pagePending.current = false
      if (alive.current) setLoading(false)
    }
  }

  /** 用户主动换一轮时重置服务端会话和去重集合，由加载效果发起首批请求。 */
  const refreshFeed = () => {
    if (pagePending.current) return
    cursor.current = { offset: 0, sessionId: "" }
    seenSeries.current.clear()
    cacheAttempts.current.clear()
    setVisibleId(null)
    setItems([])
    setHasMore(true)
    setPageError("")
  }

  /** 由原生可见目标选择播放页；滑动过渡中的空集合和非当前推荐均不触发切换。 */
  const changeVisiblePage = (ids: string[] | number[]) => {
    if (ids.length !== 1) return
    const id = ids[0]
    if (typeof id === "string" && items.some(item => item.detail.series_id === id)) setVisibleId(id)
  }

  // 接近列表尾部时续取推荐，失败后等待用户重试，避免自动请求循环。
  useEffect(() => {
    if (enabled && hasMore && !pageError && index >= items.length - 3) void loadMore()
  }, [enabled, index, items.length, hasMore, pageError])

  // 应用离开前台时立即暂停，恢复后仅当前可见首页允许重新装载。
  useEffect(() => {
    /** 先暂停原生播放器，再更新界面生命周期状态。 */
    const onScenePhase = (phase: "active" | "inactive" | "background") => {
      if (phase !== "active") { wantsPlay.current = false; player.pause() }
      setForeground(phase === "active")
    }
    AppEvents.scenePhase.addListener(onScenePhase)
    return () => AppEvents.scenePhase.removeListener(onScenePhase)
  }, [player])

  // 当前页使用按需解密源，切换立即取消旧任务，迟到结果不能绑定播放器。
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    let source: FeedPlaybackSource | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let loaded = false
    let historySaved = false
    player.pause()
    wantsPlay.current = false
    setReady(false)
    setLoadedVid("")
    setPlaying(false)
    setPlayError("")
    setPrepareLabel("")
    const blocked = isPipPlaybackActive()
    setPipBlocked(blocked)
    if (!enabled || !current || blocked) return
    const item = current
    wantsPlay.current = true
    if (canAutoPlay()) attachSleepPlayer(player)

    /** 每次原生回调都复核目标、手动暂停和睡眠定时，拒绝迟到自动播放。 */
    const play = () => {
      if (cancelled || !loaded || !wantsPlay.current || !canAutoPlay()) return
      if (player.play() && !historySaved) {
        historySaved = true
        savePlayHistoryItem({
          seriesId: item.detail.series_id, title: item.detail.series_name,
          cover: item.detail.series_cover, totalEpisodes: item.detail.episode_cnt,
          lastEpisodeIndex: item.episodeIndex, lastVid: item.vid,
        })
      }
    }
    player.onReadyToPlay = play
    player.onTimeControlStatusChanged = () => {
      if (!cancelled) setPlaying(player.rate > 0)
    }
    player.onError = message => {
      // 旧媒体仍可能在新来源准备期间报告连接关闭，尚未绑定新来源时忽略这些错误。
      if (!cancelled && loaded) {
        source?.dispose()
        loaded = false
        wantsPlay.current = false
        player.pause()
        setReady(false)
        const detail = message.replace(/https?:\/\/\S+/gi, "[播放地址]")
        console.error("[HG刷剧] 原生播放器错误：", detail)
        setPlayError(`视频播放失败：${detail}`)
      }
    }

    /** 只为当前目标读取索引，之后交给原生播放器按需请求视频片段。 */
    const prepare = async () => {
      if (cancelled) return
      try {
        setPrepareLabel("正在获取播放信息")
        source = await prepareFeedPlayback(item.detail.series_id, item.detail, item.vid, controller.signal)
        if (cancelled) { source.dispose(); return }
        await SharedAudioSession.setCategory("playback", [])
        if (cancelled) return
        await SharedAudioSession.setActive(true)
        if (cancelled) return
        player.numberOfLoops = -1
        if (!player.setSource(source.url)) throw new Error("播放器未能载入视频，请重试")
        loaded = true
        setReady(true)
        setLoadedVid(item.vid)
        setPrepareLabel("")
        timer = setTimeout(play, 120)
      } catch (error) {
        source?.dispose()
        if (!cancelled) {
          loaded = false
          wantsPlay.current = false
          player.pause()
          setReady(false)
          setPlayError(error instanceof Error ? error.message : "视频准备失败，请重试")
        }
      }
    }
    void prepare()
    return () => {
      cancelled = true
      controller.abort()
      source?.dispose()
      wantsPlay.current = false
      if (timer !== undefined) clearTimeout(timer)
      player.onReadyToPlay = undefined
      player.onTimeControlStatusChanged = undefined
      player.onError = undefined
      player.pause()
      detachSleepPlayer(player)
    }
  }, [player, enabled, current, retry])

  // 整页推荐集进入同一后台队列，追加分页或恢复前台时接续未开始的下载。
  useEffect(() => {
    if (!enabled || !items.length || pipBlocked) return
    let cancelled = false
    const previous = cacheTask.current

    /** 串行保存每个推荐播放集及元数据；等待旧任务收尾，避免分页和返回时并行下载。 */
    const cachePage = async () => {
      await previous
      for (const item of items) {
        if (cancelled || !getAutoCacheEnabled() || isPipPlaybackActive()) return
        if (cacheAttempts.current.has(item.vid)) continue
        cacheAttempts.current.add(item.vid)
        await preloadOfflineVideo(item.vid, {
          label: `${item.detail.series_name} 第 ${item.episodeIndex + 1} 集`,
          cover: item.detail.series_cover,
          seriesId: item.detail.series_id,
          seriesTitle: item.detail.series_name,
          protectedVideoIds: cacheProtection.current,
        })
      }
    }
    cacheTask.current = cachePage().catch(() => {
      console.warn("[HG刷剧] 推荐页缓存任务中断，下次进入推荐页时继续")
    })

    /** 离开页面后不再追加下载，当前在途任务交由已有缓存模块完成并保存。 */
    return () => { cancelled = true }
  }, [enabled, items, pipBlocked])

  // 首页模式销毁后取消所有异步界面更新并释放播放器，不影响详情页的音频会话。
  useEffect(() => () => {
    alive.current = false
    player.dispose()
  }, [player])

  /** 手动播放允许解除已到期的定时停止，暂停期间迟到 ready 回调不会恢复声音。 */
  const togglePlayback = () => {
    if (!enabled || !ready) return
    if (wantsPlay.current && player.rate > 0) {
      wantsPlay.current = false
      player.pause()
      setPlaying(false)
    } else {
      resumeAfterSleep()
      attachSleepPlayer(player)
      wantsPlay.current = true
      player.onReadyToPlay?.()
    }
  }

  /** 用户明确接管时结束保留的画中画，再由首页绑定自己的播放器。 */
  const takeOverPlayback = () => {
    releaseRetainedPlayer()
    setRetry(value => value + 1)
  }

  /** 打开已有选集播放器前立即暂停首页，导航返回后再恢复首页播放。 */
  const openSeries = (item: Recommendation) => {
    wantsPlay.current = false
    player.pause()
    onPlaySeries(item.detail.series_id, item.vid)
  }

  return (
    <VStack spacing={0} frame={PAGE_FRAME} foregroundStyle="white"
      background={<VStack frame={PAGE_FRAME} background="black" ignoresSafeArea={{ regions: "container" }} />}
      toolbarBackground={{ style: { light: "#FFFFFF", dark: "#131414" }, bars: ["tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["tabBar"] }}
      onAppear={() => setAppeared(true)}
      onDisappear={() => { wantsPlay.current = false; player.pause(); setAppeared(false) }}
    >
      <HStack spacing={20} padding={{ horizontal: 20 }} frame={{ height: 48 }}>
        <Text font={19} fontWeight="bold">推荐</Text>
        <Text font={12} foregroundStyle="rgba(255,255,255,0.5)">上滑发现下一部</Text>
        <Spacer />
        <Button title="播放历史" systemImage="clock.arrow.circlepath" action={onOpenHistory} labelStyle="iconOnly" buttonStyle="plain" />
        <Button title="搜索" systemImage="magnifyingglass" action={onSearch} labelStyle="iconOnly" buttonStyle="plain" />
      </HStack>
      <GeometryReader>{geometry => (
        <ZStack frame={{ width: geometry.size.width, height: geometry.size.height }} clipped>
          {items.length ? (
            <ScrollView axes="vertical" scrollIndicator="hidden" scrollTargetBehavior="paging"
              frame={{ width: geometry.size.width, height: geometry.size.height }} clipped scrollClipDisabled={false}
              onScrollTargetVisibilityChange={{ idType: "string", threshold: 0.6, onChanged: changeVisiblePage }}
            >
              <LazyVStack spacing={0} scrollTargetLayout>
                {items.map((item, itemIndex) => (
                  <ZStack key={item.detail.series_id} frame={{ width: geometry.size.width, height: geometry.size.height }} clipped background="black">
                    {item !== current || !enabled || !ready || loadedVid !== item.vid ? <Image imageUrl={item.detail.series_cover} resizable scaleToFit
                      frame={{ width: geometry.size.width, height: geometry.size.height }} opacity={0.5} /> : null}
                    {item === current && enabled && ready && loadedVid === item.vid ? <AVPlayerView player={player} pipStatus={pipStatus}
                      renderingMode="layer" videoGravity="resizeAspect" allowsPictureInPicturePlayback={false}
                      frame={{ width: geometry.size.width, height: geometry.size.height }} /> : null}
                    {item === current && !pipBlocked ? (
                      <VStack spacing={14}>
                        {playError ? <Text font={14} multilineTextAlignment="center">{playError}</Text>
                          : prepareLabel ? <><ProgressView tint="white" /><Text font={13}>{prepareLabel}</Text></> : null}
                        {playError ? <Button title="重试播放" action={() => setRetry(value => value + 1)} buttonStyle="bordered" />
                          : ready && !playing ? <Button title="播放" systemImage="play.fill" action={togglePlayback} labelStyle="iconOnly" font={42} buttonStyle="plain" /> : null}
                      </VStack>
                    ) : null}
                    {item === current && pipBlocked ? <Button title="结束画中画并播放推荐" action={takeOverPlayback} buttonStyle="bordered" /> : null}
                    <VStack spacing={0} frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
                      <Spacer />
                      <VStack alignment="leading" spacing={12} padding={{ horizontal: 20, top: 80, bottom: 20 }}
                        frame={{ maxWidth: "infinity", alignment: "leading" }} background={VIDEO_SHADE}>
                        {item.reason ? <Text font={12} foregroundStyle="#FFD7AE" lineLimit={1}>{item.reason}</Text> : null}
                        <HStack alignment="bottom" spacing={16}>
                          <VStack alignment="leading" spacing={6} frame={{ maxWidth: "infinity", alignment: "leading" }}>
                            <Text font={22} fontWeight="bold" lineLimit={2}>{item.detail.series_name}</Text>
                            <Text font={13} foregroundStyle="rgba(255,255,255,0.7)">{`第 ${item.episodeIndex + 1} 集 · 共 ${item.detail.episode_cnt} 集`}</Text>
                          </VStack>
                          {item === current && ready ? <Button title={playing ? "暂停" : "播放"} systemImage={playing ? "pause.fill" : "play.fill"}
                            action={togglePlayback} labelStyle="iconOnly" buttonStyle="plain" font={24} /> : null}
                        </HStack>
                        {item.detail.series_intro ? <Text font={13} foregroundStyle="rgba(255,255,255,0.75)" lineLimit={2}>{item.detail.series_intro}</Text> : null}
                        <Button action={() => openSeries(item)} buttonStyle="plain">
                          <HStack spacing={8} padding={12} background={{ style: "rgba(255,255,255,0.13)", shape: { type: "rect", cornerRadius: 10 } }}>
                            <Image systemName="rectangle.stack.fill" foregroundStyle={THEME_COLOR} />
                            <Text font={14} fontWeight="medium">选集 · 继续观看</Text><Spacer /><Image systemName="chevron.right" font={12} />
                          </HStack>
                        </Button>
                        {itemIndex === items.length - 1 ? <HStack spacing={8}>
                          {loading ? <ProgressView tint="white" /> : null}
                          <Text font={12} foregroundStyle="rgba(255,255,255,0.6)">{loading ? "正在加载下一批" : pageError || (hasMore ? "上滑切换推荐" : "本轮推荐已看完")}</Text>
                          {pageError ? <Button title="重试加载" action={loadMore} buttonStyle="plain" font={12} /> : null}
                          {!hasMore ? <Button title="换一批" action={refreshFeed} buttonStyle="plain" font={12} /> : null}
                        </HStack> : null}
                      </VStack>
                    </VStack>
                  </ZStack>
                ))}
              </LazyVStack>
            </ScrollView>
          ) : <VStack spacing={16} padding={24}>
            {loading ? <><ProgressView tint="white" /><Text font={14}>正在加载推荐</Text></>
              : <><Text font={14} multilineTextAlignment="center">{pageError || "暂时没有可播放推荐"}</Text><Button title="重新加载" action={hasMore ? loadMore : refreshFeed} buttonStyle="bordered" /></>}
          </VStack>}
        </ZStack>
      )}</GeometryReader>
    </VStack>
  )
}
