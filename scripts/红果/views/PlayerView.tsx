import {
  Button,
  HStack,
  Image,
  ProgressView,
  ScrollView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "scripting"
import { fetchDetail } from "../core/api"
import {
  isOfflineVideoCached,
  type PrepareProgress,
} from "../core/mediaCache"
import { savePlayHistoryItem } from "../core/history"
import { formatDuration, formatEpisodeLabel } from "../core/format"
import {
  applyOfflineSource,
  durationSeconds,
  loadOfflinePlayerData,
  resolvePlaybackSource,
} from "../core/playbackSource"
import type { PlayerData } from "../core/types"
import { BRAND_COLOR, ErrorView, FILL_LEADING, LoadingView, PAGE_FRAME, TagChip } from "./Common"
import { EpisodeGrid } from "./EpisodeGrid"
import type { WebPlayerEvent } from "../core/webPlayer"
import { XgPlayerView } from "./XgPlayerView"

const PLAYER_HEIGHT = 220

const PLAYER_READY_TIMEOUT_MS = 15000

const PREPARE_PROGRESS_STEP = 0.05

const STAGE_LABEL: Record<PrepareProgress["stage"], string> = {
  fetching: "正在获取播放信息",
  downloading: "正在下载",
  decrypting: "正在本地解密",
  validating: "正在检查缓存视频",
  done: "准备完成",
}

/** 管理缓存与选集，通过西瓜播放器播放本地视频并响应网页全屏事件。 */
export function PlayerView({
  seriesId,
  initialVid,
  onOpenCache,
  onOpenHistory,
  onClose,
}: {
  seriesId: string
  initialVid?: string
  onOpenCache?: () => void
  onOpenHistory?: () => void
  onClose?: () => void
}) {
  const [data, setData] = useState<PlayerData | null>(null)
  const [currentVid, setCurrentVid] = useState(initialVid ?? "")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const instanceId = useRef(Date.now()).current
  const aliveRef = useRef(true)
  const controller = useMemo(() => new WebViewController(), [])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playHint, setPlayHint] = useState("")

  const requestSeqRef = useRef(0)

  const prepareShownRef = useRef({ label: "", percent: 0 })

  const [switchLabel, setSwitchLabel] = useState("")

  const [source, setSource] = useState("")

  const [prepareLabel, setPrepareLabel] = useState("")
  const [preparePercent, setPreparePercent] = useState(0)

  const [isAudioReady, setIsAudioReady] = useState(false)
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false)
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false)
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState(false)
  const playerReadyRef = useRef(false)

  const [activeDuration, setActiveDuration] = useState<number>(0)
  /** 清除缓存准备进度，避免重复提交未变化的界面状态。 */
  const clearPrepareProgress = useCallback(() => {
    const shown = prepareShownRef.current
    if (!shown.label && shown.percent === 0) return
    prepareShownRef.current = { label: "", percent: 0 }
    setPrepareLabel("")
    setPreparePercent(0)
  }, [])

  /** 页面存活时更新下载和验证进度，忽略退出后的后台通知。 */
  const updatePrepareProgress = useCallback(
    ({ stage, progress }: PrepareProgress) => {
      if (!aliveRef.current) return
      if (stage === "done") {
        clearPrepareProgress()
        return
      }

      const label = STAGE_LABEL[stage]

      const percent = Math.round(progress / PREPARE_PROGRESS_STEP) * PREPARE_PROGRESS_STEP
      const shown = prepareShownRef.current
      if (shown.label === label && shown.percent === percent) return
      prepareShownRef.current = { label, percent }
      setPrepareLabel(label)
      setPreparePercent(percent)
    },
    [clearPrepareProgress]
  )

  /** 切换集数时只应用当前页面的最新请求，退出后丢弃后台结果。 */
  const switchEpisode = useCallback((vid: string) => {
    if (!data || vid === currentVid) return

    const seq = requestSeqRef.current + 1
    requestSeqRef.current = seq

    if (playerReadyRef.current) {
      controller.evaluateJavaScript("return window.hongguoPlayer.pause()").catch(console.error)
    }
    setHasPlaybackStarted(false)
    clearPrepareProgress()
    setErrorMessage("")
    setSwitchLabel("正在切换")

    /** 判断异步结果是否仍属于当前页面和请求。 */
    const isStale = () => !aliveRef.current || requestSeqRef.current !== seq

    resolvePlaybackSource(seriesId, data.seriesDetail, vid, {
      onProgress: updatePrepareProgress,
      protectedVideoIds: [currentVid, vid],
    })
      .then(({ url, meta }) => {

        if (isStale()) return

        const durSec = meta?.duration ?? 0
        setData(prev => (prev ? applyOfflineSource(prev, vid, url, meta) : prev))
        setActiveDuration(durSec > 0 ? durSec : 0)

        setCurrentVid(vid)
        setSource(url)
      })
      .catch(error => {
        if (isStale()) return

        clearPrepareProgress()
        setErrorMessage(error instanceof Error ? error.message : String(error))

        if (playerReadyRef.current) {
          controller.evaluateJavaScript("return window.hongguoPlayer.play()").catch(console.error)
        }
      })
      .finally(() => {
        if (!isStale()) setSwitchLabel("")
      })
    },
    [data, currentVid, seriesId, controller, clearPrepareProgress, updatePrepareProgress]
  )

  /** 忽略页面退出或后续请求覆盖后的异步结果，防止访问已释放的播放器。 */
  const load = (vid: string) => {
    setIsLoading(true)
    setErrorMessage("")

    requestSeqRef.current += 1
    setSwitchLabel("")

    const seq = requestSeqRef.current
    /** 判断异步结果是否仍属于当前页面和请求。 */
    const isStale = () => !aliveRef.current || requestSeqRef.current !== seq

    /** 缓存准备完成前先展示剧集信息与选集。 */
    const showDetailEarly = (detail: PlayerData) => {
      if (isStale()) return
      setData(detail)
      setCurrentVid(vid)
    }

    console.log(`[player#${instanceId}] 开始加载剧集 ${vid}`)
    loadOfflinePlayerData(seriesId, vid, {
      onDetail: showDetailEarly,
      onProgress: updatePrepareProgress,
    })
      .then(({ data: offlineData, meta }) => {
        if (isStale()) {
          console.log(`[player#${instanceId}] 忽略已失效的加载结果`)
          return
        }
        console.log(`[player#${instanceId}] 剧集缓存已准备好`)
        setData(offlineData)
        setCurrentVid(vid)
        setSource(offlineData.playerInfo.main_url)
        setActiveDuration(durationSeconds(meta?.duration))
      })
      .catch(error => {
        if (isStale()) return
        clearPrepareProgress()
        setErrorMessage(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        if (!isStale()) setIsLoading(false)
      })
  }

  useEffect(() => {
    if (initialVid) {
      load(initialVid)
      return
    }

    fetchDetail(seriesId)
      .then(result => {
        if (!aliveRef.current) return
        const firstVid = result.detail.vid_list[0]
        if (!firstVid) {
          setErrorMessage("该剧集暂无可播放内容")
          setIsLoading(false)
          return
        }
        load(firstVid)
      })
      .catch(error => {
        if (!aliveRef.current) return
        setErrorMessage(error instanceof Error ? error.message : String(error))
        setIsLoading(false)
      })
  }, [seriesId, initialVid])

  useEffect(() => {
    let cancelled = false
    SharedAudioSession.setCategory("playback", [])
      .then(() => {
        if (!cancelled) return SharedAudioSession.setActive(true)
      })
      .then(() => {
        if (!cancelled) setIsAudioReady(true)
      })
      .catch(() => {

        if (!cancelled) setIsAudioReady(true)
      })

    return () => {
      cancelled = true
      SharedAudioSession.setActive(false).catch(console.error)
    }
  }, [])

  const switchEpisodeRef = useRef(switchEpisode)
  switchEpisodeRef.current = switchEpisode
  const currentVidRef = useRef(currentVid)
  currentVidRef.current = currentVid
  const dataRef = useRef(data)
  dataRef.current = data

  /** 只处理当前集数的网页事件，迟到通知不能切集或覆盖当前播放状态。 */
  const handleWebPlayerEvent = useCallback((event: WebPlayerEvent) => {
    if (!aliveRef.current || event.type === "bridgeReady" || event.videoId !== currentVidRef.current) return
    console.log(`[player#${instanceId}] 西瓜播放器事件：${event.type}`)
    if (event.type === "canplay" || event.type === "playing" || event.type === "autoplayBlocked") {
      playerReadyRef.current = true
      setIsWaitingForPlayer(false)
      setIsPlayerLoaded(true)
      setPlayHint(event.type === "autoplayBlocked" ? "点按视频开始播放" : "")
      if (event.type === "playing") setHasPlaybackStarted(true)
    } else if (event.type === "fullscreen") {
      setIsFullscreen(event.active)
    } else if (event.type === "error") {
      playerReadyRef.current = false
      setIsWaitingForPlayer(false)
      setIsPlayerLoaded(false)
      setPlayHint("")
      setErrorMessage(event.message)
    } else if (event.type === "ended") {
      const currentData = dataRef.current
      if (!currentData) return
      const vids = currentData.seriesDetail.vid_list
      const index = vids.indexOf(currentVidRef.current)
      if (index >= 0 && index < vids.length - 1) switchEpisodeRef.current(vids[index + 1])
    }
  }, [])

  // 网页视图始终挂载；装载媒体和切集不会重建 WebView，也不会覆盖它的控制条。
  useEffect(() => {
    if (!source || !isAudioReady) return
    playerReadyRef.current = false
    setHasPlaybackStarted(false)
    setIsPlayerLoaded(false)
    setIsWaitingForPlayer(true)
    setPlayHint("")
  }, [source, isAudioReady])

  // 媒体已就绪或报错就停止计时，避免超时提示覆盖真实播放错误。
  useEffect(() => {
    if (!isWaitingForPlayer) return
    const timer = setTimeout(() => {
      if (!aliveRef.current || playerReadyRef.current) return
      setIsWaitingForPlayer(false)
      setErrorMessage("西瓜播放器在 15 秒内未能就绪，缓存已保留")
    }, PLAYER_READY_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [source, isWaitingForPlayer])

  useEffect(() => {
    const detail = data?.seriesDetail
    if (!detail || !currentVid) return
    const epIndex = detail.vid_list.indexOf(currentVid)
    if (epIndex < 0) return

    savePlayHistoryItem({
      seriesId: detail.series_id || seriesId,
      title: detail.series_name,
      cover: detail.series_cover,
      totalEpisodes: detail.vid_list.length,
      lastEpisodeIndex: epIndex,
      lastVid: currentVid,
    })
  }, [data?.seriesDetail, currentVid, seriesId])

  useEffect(() => {
    const detail = data?.seriesDetail
    if (!detail || !currentVid || !isPlayerLoaded || !hasPlaybackStarted) return

    const currentIndex = detail.vid_list.indexOf(currentVid)
    if (currentIndex < 0) return

    let cancelled = false

    const timer = setTimeout(async () => {
      if (cancelled) return

      for (let offset = 1; offset <= 2; offset++) {
        if (cancelled) break
        const targetIndex = currentIndex + offset
        if (targetIndex >= detail.vid_list.length) break

        const targetVid = detail.vid_list[targetIndex]
        if (isOfflineVideoCached(targetVid)) continue

        const label = formatEpisodeLabel(detail.series_name, targetIndex)
        try {
          await resolvePlaybackSource(seriesId, detail, targetVid, {
            label,
            protectedVideoIds: [currentVid],
          })
        } catch (error) {
          console.log(`[preload] 预加载集数 ${targetVid} 失败：`, error)
          break
        }

        if (cancelled) break
      }
    }, 1500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [data?.seriesDetail, currentVid, isPlayerLoaded, hasPlaybackStarted, seriesId])

  // 网页组件负责释放 WebView，此处仅取消业务请求对页面的更新。
  useEffect(() => {
    console.log(`[player#${instanceId}] 西瓜播放器实例已建立`)
    return () => {
      aliveRef.current = false
      requestSeqRef.current += 1
      console.log(`[player#${instanceId}] 页面清理`)
    }
  }, [])

  const isPlayerBusy = isLoading || isWaitingForPlayer || prepareLabel !== "" || switchLabel !== ""

  return (
    <VStack
      alignment="leading"
      spacing={0}
      frame={PAGE_FRAME}
      navigationTitle="红果剧场"
      navigationBarTitleDisplayMode="inline"
      navigationBarVisibility={isFullscreen ? "hidden" : "automatic"}
      tabBarVisibility={isFullscreen ? "hidden" : "automatic"}
      ignoresSafeArea={isFullscreen}
      background={isFullscreen ? "black" : "systemBackground"}
      toolbar={{
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
          ...(onClose ? [<Button title="关闭" action={onClose} />] : []),
        ],
      }}
    >

      <ZStack
        frame={isFullscreen
          ? { maxWidth: "infinity", maxHeight: "infinity" }
          : { maxWidth: "infinity", height: PLAYER_HEIGHT }}
        background="black"
      >
        <XgPlayerView
          controller={controller}
          source={isAudioReady ? source : ""}
          videoId={currentVid}
          instanceId={instanceId}
          onEvent={handleWebPlayerEvent}
        />
      </ZStack>

      {isPlayerBusy || playHint || (isFullscreen && errorMessage) ? (
        <HStack spacing={8} padding={8} frame={FILL_LEADING}>
          {isPlayerBusy ? <ProgressView controlSize="small" /> : null}
          <Text font="caption" foregroundStyle={isFullscreen ? "white" : "secondaryLabel"}>
            {isPlayerBusy
              ? (prepareLabel ? `${prepareLabel} ${Math.round(preparePercent * 100)}%`
                : switchLabel || (isWaitingForPlayer ? "正在启动西瓜播放器" : "加载中…"))
              : playHint || errorMessage}
          </Text>
        </HStack>
      ) : null}

      {!isFullscreen ? <ScrollView>
        {data ? (
          <EpisodeInfoPanel
            data={data}
            currentVid={currentVid}
            activeDuration={activeDuration}
            errorMessage={errorMessage}
            onSwitch={switchEpisode}
          />
        ) : errorMessage ? (
          <ErrorView message={errorMessage} onRetry={() => load(currentVid)} />
        ) : (
          <LoadingView />
        )}
      </ScrollView> : null}
    </VStack>
  )
}

/** 展示剧集信息、公开播放与缓存说明，以及选集操作。 */
function EpisodeInfoPanel({
  data,
  currentVid,
  activeDuration,
  errorMessage,
  onSwitch,
}: {
  data: PlayerData
  currentVid: string
  activeDuration?: number
  errorMessage: string
  onSwitch: (vid: string) => void
}) {
  const detail = data.seriesDetail
  const currentIndex = detail.vid_list.indexOf(currentVid)
  const episodeLabel = currentIndex >= 0 ? `第 ${currentIndex + 1} 集` : ""

  const displayDuration =
    activeDuration && activeDuration > 0
      ? activeDuration
      : data.playerInfo.duration

  const isSpecReady = Boolean(data.playerInfo.main_url)

  return (
    <VStack alignment="leading" spacing={16} padding={{ bottom: 24 }} frame={FILL_LEADING}>

      <VStack alignment="leading" spacing={6} padding={{ horizontal: 16, top: 12 }} frame={FILL_LEADING}>
        <Text font="title3" bold lineLimit={2} frame={FILL_LEADING}>
          {detail.series_name}
        </Text>

        <HStack spacing={10} alignment="center">
          {episodeLabel ? (
            <Text font="caption" foregroundStyle={BRAND_COLOR}>
              {episodeLabel}
            </Text>
          ) : null}
          <Text font="caption" foregroundStyle="secondaryLabel">
            {isSpecReady ? formatDuration(displayDuration) : "--:--"}
          </Text>
          <Text font="caption" foregroundStyle="secondaryLabel">
            {isSpecReady ? `${data.playerInfo.width}×${data.playerInfo.height}` : "--"}
          </Text>
        </HStack>

        {errorMessage ? (
          <Text font="caption" foregroundStyle="systemOrange">
            {errorMessage}
          </Text>
        ) : null}
      </VStack>

      {detail.tags.length > 0 ? (
        <HStack spacing={4} alignment="center" padding={{ horizontal: 16 }}>
          {detail.tags.slice(0, 5).map(tag => (
            <TagChip key={tag} text={tag} />
          ))}
        </HStack>
      ) : null}

      <VStack alignment="leading" spacing={10} padding={{ horizontal: 16 }} frame={FILL_LEADING}>
        <HStack spacing={8} alignment="center" frame={FILL_LEADING}>
          <Text font="headline" bold>
            选集
          </Text>
          <Text font="caption" foregroundStyle="tertiaryLabel">
            {`共 ${detail.vid_list.length} 集`}
          </Text>
        </HStack>
        <Text font="caption2" foregroundStyle="secondaryLabel" frame={FILL_LEADING}>
          公开集数直接下载缓存，其余集数下载并解密；↓ 表示尚未缓存
        </Text>

        <EpisodeGrid
          vids={detail.vid_list}
          currentVid={currentVid}
          onSelect={onSwitch}
        />
      </VStack>

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
    </VStack>
  )
}
