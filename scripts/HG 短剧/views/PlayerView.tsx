import {
  VideoPlaybackPlayer,
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
  useRef,
  useState,
} from "scripting"
import { fetchDetail } from "../core/api"
import {
  getAutoCacheEnabled,
  getAutoCacheEpisodeCount,
  getCachedVideoMeta,
  isOfflineVideoCached,
  preloadOfflineVideo,
  type PrepareProgress,
} from "../core/mediaCache"
import { savePlayHistoryItem } from "../core/history"
import { formatEpisodeLabel } from "../core/format"
import {
  applyOfflineSource,
  loadOfflinePlayerData,
  resolvePlaybackSource,
} from "../core/playbackSource"
import type { PlayerData } from "../core/types"
import { retainPipPlayer, setPipPlaybackActive } from "../core/playbackState"
import { CoverImage, ErrorView, FILL_LEADING, LoadingView, PAGE_FRAME, SERIES_SURFACE } from "./Common"
import { EpisodeGrid } from "./EpisodeGrid"
import { attachSleepPlayer, canAutoPlay, detachSleepPlayer, getSleepDeadline, resumeAfterSleep } from "../core/sleepTimer"

const PLAYER_HEIGHT = 220

const PREPARE_PROGRESS_STEP = 0.05

const STAGE_LABEL: Record<PrepareProgress["stage"], string> = {
  fetching: "正在获取播放信息",
  downloading: "正在下载",
  decrypting: "正在本地解密",
  done: "准备完成",
}

/** 展示剧集播放页，按自动缓存开关及用户配置集数预加载并保存真实剧集信息。 */
export function PlayerView({
  seriesId,
  initialVid,
  onOpenCache,
  onOpenHistory,
  onClose,
  onFullscreenChange,
}: {
  seriesId: string
  initialVid?: string
  onOpenCache?: () => void
  onOpenHistory?: () => void
  onClose?: () => void
  onFullscreenChange?: (fullscreen: boolean) => void
}) {
  const [data, setData] = useState<PlayerData | null>(null)
  const [currentVid, setCurrentVid] = useState(initialVid ?? "")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const [player] = useState(() => new VideoPlaybackController())
  const [isPipActive, setIsPipActive] = useState(false)
  const [isFullscreen, setFullscreen] = useState(false)
  const [sourceRevision, setSourceRevision] = useState(0)
  const pendingPlayRef = useRef(0)
  const openSeqRef = useRef(0)

  const loadedSourceRef = useRef("")

  const requestSeqRef = useRef(0)

  const prepareShownRef = useRef({ label: "", percent: 0 })

  const [switchLabel, setSwitchLabel] = useState("")

  const [source, setSource] = useState("")

  const [prepareLabel, setPrepareLabel] = useState("")
  const [preparePercent, setPreparePercent] = useState(0)

  const [isAudioReady, setIsAudioReady] = useState(false)

  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false)

  const isPipActiveRef = useRef(false)
  isPipActiveRef.current = isPipActive
  const fullscreen = isFullscreen && !isPipActive

  // 根导航负责隐藏状态栏；离开页面时恢复系统覆盖层。
  useEffect(() => {
    onFullscreenChange?.(fullscreen)
    return () => onFullscreenChange?.(false)
  }, [fullscreen, onFullscreenChange])

  // 只使用真实缓存尺寸判断方向，退出或切集时恢复原方向设置。
  useEffect(() => {
    if (!fullscreen || !Device.isiPhone) return
    const previous = [...Device.supportedInterfaceOrientations]
    const meta = getCachedVideoMeta(currentVid)
    if (meta?.width !== undefined && meta.height !== undefined
      && Number.isFinite(meta.width) && Number.isFinite(meta.height)
      && meta.width > 0 && meta.height > 0 && meta.width !== meta.height) {
      Device.supportedInterfaceOrientations = meta.width > meta.height ? ["landscape"] : ["portrait"]
    }
    return () => { Device.supportedInterfaceOrientations = previous }
  }, [fullscreen, currentVid, source])

  /** 自动播放前后都检查倒计时，防止异步播放跨越到期时刻。 */
  const playAutomatically = useCallback(async () => {
    if (!canAutoPlay()) return
    pendingPlayRef.current++
    try {
      await player.play()
      if (!canAutoPlay()) player.pause()
    } finally {
      pendingPlayRef.current--
    }
  }, [player])

  /** 清除上次下载或解密的进度提示。 */
  const clearPrepareProgress = useCallback(() => {
    const shown = prepareShownRef.current
    if (!shown.label && shown.percent === 0) return
    prepareShownRef.current = { label: "", percent: 0 }
    setPrepareLabel("")
    setPreparePercent(0)
  }, [])

  /** 按固定步长更新准备进度，减少页面刷新。 */
  const updatePrepareProgress = useCallback(
    ({ stage, progress }: PrepareProgress) => {
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

  /** 主动选集或重试失败集时恢复观看；异步切集完成后复核定时停止状态。 */
  const switchEpisode = useCallback((vid: string) => {
    if (!data || (vid === currentVid && !errorMessage)) return
    resumeAfterSleep()

    const seq = requestSeqRef.current + 1
    requestSeqRef.current = seq

    openSeqRef.current++
    player.pause()
    clearPrepareProgress()
    setErrorMessage("")
    setSwitchLabel("正在切换")

    // 后完成的旧请求不能覆盖用户最近选择的剧集。
    resolvePlaybackSource(seriesId, data.seriesDetail, vid, {
      onProgress: updatePrepareProgress,
      protectedVideoIds: [currentVid, vid],
    })
      .then(({ url, meta }) => {
        if (requestSeqRef.current !== seq) return
        setData(prev => (prev ? applyOfflineSource(prev, vid, url, meta) : prev))
        setCurrentVid(vid)
        setSource(url)
        setSourceRevision(value => value + 1)
      })
      .catch(async error => {
        if (requestSeqRef.current !== seq) return
        clearPrepareProgress()
        setSwitchLabel("")
        setErrorMessage(error instanceof Error ? error.message : String(error))
        if (loadedSourceRef.current) {
          try { await playAutomatically() }
          catch (playError) { setErrorMessage(String(playError)) }
        }
      })
    },
    [data, currentVid, errorMessage, seriesId, player, clearPrepareProgress, updatePrepareProgress, playAutomatically]
  )

  /** 加载现有解密缓存，完成后交给异步播放器装载。 */
  const load = (vid: string) => {
    setIsLoading(true)
    setErrorMessage("")
    openSeqRef.current++
    const seq = ++requestSeqRef.current
    setSwitchLabel("")

    loadOfflinePlayerData(seriesId, vid, {
      onProgress: updatePrepareProgress,
      onDetail: detail => {
        if (requestSeqRef.current !== seq) return
        setData(detail)
        setCurrentVid(vid)
      },
    }).then(({ data: offlineData }) => {
      if (requestSeqRef.current !== seq) return
      setData(offlineData)
      setCurrentVid(vid)
      setSource(offlineData.playerInfo.main_url)
      setSourceRevision(value => value + 1)
    }).catch(error => {
      if (requestSeqRef.current !== seq) return
      clearPrepareProgress()
      setErrorMessage(error instanceof Error ? error.message : String(error))
      setIsLoading(false)
    })
  }

  useEffect(() => {
    if (initialVid) {
      load(initialVid)
      return
    }

    fetchDetail(seriesId)
      .then(result => {
        const firstVid = result.detail.vid_list[0]
        if (!firstVid) {
          setErrorMessage("该剧集暂无可播放内容")
          setIsLoading(false)
          return
        }
        load(firstVid)
      })
      .catch(error => {
        setErrorMessage(error instanceof Error ? error.message : String(error))
        setIsLoading(false)
      })
  }, [seriesId, initialVid])

  useEffect(() => {
    let cancelled = false
    SharedAudioSession.setCategory("playback", [])
      .then(() => SharedAudioSession.setActive(true))
      .then(() => {
        if (!cancelled) setIsAudioReady(true)
      })
      .catch(() => {

        if (!cancelled) setIsAudioReady(true)
      })

    return () => {
      cancelled = true
      if (!isPipActiveRef.current) {
        void SharedAudioSession.setActive(false).catch(error => console.warn("[播放器] 关闭音频会话失败:", error))
      }
    }
  }, [])

  // open 完成后才自动播放；清理和序号检查阻止旧媒体请求的续播。
  useEffect(() => {
    if (!source || !isAudioReady) return
    let cancelled = false
    const seq = ++openSeqRef.current
    const request = requestSeqRef.current
    player.open(source).then(async () => {
      if (cancelled || seq !== openSeqRef.current || request !== requestSeqRef.current) return
      loadedSourceRef.current = source
      setIsPlayerLoaded(true)
      clearPrepareProgress()
      setIsLoading(false)
      setSwitchLabel("")
      await playAutomatically()
    }).catch(error => {
      if (cancelled || seq !== openSeqRef.current || request !== requestSeqRef.current) return
      clearPrepareProgress()
      setIsLoading(false)
      setSwitchLabel("")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    })
    return () => { cancelled = true }
  }, [player, source, sourceRevision, isAudioReady, playAutomatically, clearPrepareProgress])

  // 控件主动播放可以解除已到期状态，脚本自动播放由独立的到期检查保护。
  useEffect(() => player.on("state", snapshot => {
    if (snapshot.state === "playing" && pendingPlayRef.current === 0 && getSleepDeadline() === 0) {
      resumeAfterSleep()
    }
  }), [player])

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

  // 每次切集重新补齐后续缓存，失败集在当前播放期间最多尝试三轮。
  useEffect(() => {
    const detail = data?.seriesDetail
    if (!detail || !currentVid || !isPlayerLoaded) return

    const currentIndex = detail.vid_list.indexOf(currentVid)
    if (currentIndex < 0) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const attempts = new Map<string, number>()

    /** 跳过已有缓存，补下载缺失剧集；单集失败不阻断队列，稍后有限重试。 */
    const replenish = async () => {
      if (cancelled || !getAutoCacheEnabled()) return
      let needsRetry = false

      // 按用户设置补齐后续集数，容量限制由缓存模块统一处理。
      for (let offset = 1; offset <= getAutoCacheEpisodeCount(); offset++) {
        if (cancelled || !getAutoCacheEnabled()) break
        const targetIndex = currentIndex + offset
        if (targetIndex >= detail.vid_list.length) break

        const targetVid = detail.vid_list[targetIndex]
        if (isOfflineVideoCached(targetVid)) continue
        const attempt = attempts.get(targetVid) ?? 0
        if (attempt >= 3) continue
        attempts.set(targetVid, attempt + 1)

        const label = formatEpisodeLabel(detail.series_name, targetIndex)
        const success = await preloadOfflineVideo(targetVid, {
          label,
          cover: detail.series_cover,
          seriesId,
          seriesTitle: detail.series_name,
          protectedVideoIds: [currentVid],
        })

        if (cancelled) return
        if (!success && attempt + 1 < 3) needsRetry = true
      }
      if (needsRetry && !cancelled && getAutoCacheEnabled()) {
        timer = setTimeout(replenish, 15000)
      }
    }

    timer = setTimeout(replenish, 1500)

    /** 切集或退出后停止旧窗口的补下载及重试，不再追加旧任务。 */
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [data?.seriesDetail, currentVid, isPlayerLoaded])

  // 进入画中画后保留控制器；窗口关闭后解除倒计时引用并释放资源。
  useEffect(() => {
    let mounted = true
    attachSleepPlayer(player)
    const offPip = player.on("pictureInPicture", state => {
      isPipActiveRef.current = state.active
      if (mounted) setIsPipActive(state.active)
      setPipPlaybackActive(state.active)
      if (!mounted && !state.active) {
        detachSleepPlayer(player)
        offPip()
        void SharedAudioSession.setActive(false).catch(error => console.warn("[播放器] 关闭音频会话失败:", error))
      }
    })
    return () => {
      mounted = false
      requestSeqRef.current++
      openSeqRef.current++
      if (isPipActiveRef.current) {
        retainPipPlayer(player)
      } else {
        offPip()
        detachSleepPlayer(player)
        setPipPlaybackActive(false)
        void player.dispose().catch(error => console.warn("[播放器] 释放失败:", error))
      }
    }
  }, [player])

  const switchEpisodeRef = useRef(switchEpisode)
  switchEpisodeRef.current = switchEpisode

  const currentVidRef = useRef(currentVid)
  currentVidRef.current = currentVid
  const dataRef = useRef(data)
  dataRef.current = data

  // 定时停止后不再自动切集；保留现有的剧集顺序。
  useEffect(() => player.on("ended", () => {
    if (!canAutoPlay()) return
    const currentData = dataRef.current
    const current = currentVidRef.current
    if (!currentData || !current) return
    const vidList = currentData.seriesDetail.vid_list
    const index = vidList.indexOf(current)
    if (index >= 0 && index < vidList.length - 1) switchEpisodeRef.current(vidList[index + 1])
  }), [player])

  // 播放器控件及原生事件的异步错误统一显示在现有错误区域。
  useEffect(() => player.on("error", error => setErrorMessage(error.message)), [player])

  /** 显示控件操作失败的信息，不隐式切换回旧播放器。 */
  const showPlaybackError = useCallback((error: unknown) => {
    setErrorMessage(error instanceof Error ? error.message : String(error))
  }, [])

  const isPlayerBusy = isLoading || prepareLabel !== "" || switchLabel !== ""

  return (
    <VStack
      alignment="leading"
      spacing={0}
      frame={PAGE_FRAME}
      background={fullscreen ? "black" : SERIES_SURFACE}
      navigationTitle="HG 短剧"
      navigationBarTitleDisplayMode="inline"
      navigationBarVisibility={fullscreen ? "hidden" : "visible"}
      tabBarVisibility="hidden"
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
        frame={{ maxWidth: "infinity", minHeight: fullscreen ? 0 : PLAYER_HEIGHT, maxHeight: fullscreen ? "infinity" : PLAYER_HEIGHT }}
        background="black"
      >
        <VideoPlaybackPlayer
          controller={player}
          language="zh"
          title={data?.seriesDetail.series_name}
          gestures={true}
          showFullscreenButton={true}
          onFullscreenChange={setFullscreen}
          onError={showPlaybackError}
          videoGravity="resizeAspect"
          frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
        />

        {isPlayerBusy ? (
          <VStack
            spacing={12}
            alignment="center"
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
            background="black"
          >
            {prepareLabel ? (
              <ProgressView
                value={preparePercent}
                total={1.0}
                progressViewStyle="circular"
                tint="white"
                controlSize="regular"
              />
            ) : (
              <ProgressView
                progressViewStyle="circular"
                tint="white"
                controlSize="regular"
              />
            )}
            <Text font="footnote" foregroundStyle="white">
              {prepareLabel || switchLabel || "加载中…"}
            </Text>
          </VStack>
        ) : null}
      </ZStack>

      {fullscreen && errorMessage ? <Text foregroundStyle="systemOrange" padding={12}>{errorMessage}</Text> : null}

      {!fullscreen ? <ScrollView>
        {data ? (
          <EpisodeInfoPanel
            data={data}
            currentVid={currentVid}
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

/** 按封面简介、分段选集的顺序展示视频下方信息。 */
function EpisodeInfoPanel({
  data,
  currentVid,
  errorMessage,
  onSwitch,
}: {
  data: PlayerData
  currentVid: string
  errorMessage: string
  onSwitch: (vid: string) => void
}) {
  const detail = data.seriesDetail

  return (
    <VStack alignment="leading" spacing={40} padding={{ horizontal: 16, top: 16, bottom: 24 }} frame={FILL_LEADING}>
      <VStack alignment="leading" spacing={12} frame={FILL_LEADING}>
        <HStack alignment="top" spacing={12} frame={FILL_LEADING}>
          <CoverImage url={detail.series_cover} width={56} height={76} cornerRadius={6} />
          <VStack alignment="leading" spacing={4} frame={FILL_LEADING}>
            <Text font={16} fontWeight="semibold" lineLimit={2} frame={FILL_LEADING}>
              {detail.series_name}
            </Text>
            <Text font={14} foregroundStyle="secondaryLabel" lineLimit={2} frame={FILL_LEADING}>
              {detail.series_intro}
            </Text>
          </VStack>
        </HStack>
        {errorMessage ? (
          <Text font="caption" foregroundStyle="systemOrange">
            {errorMessage}
          </Text>
        ) : null}
      </VStack>

      <VStack alignment="leading" spacing={18} frame={FILL_LEADING}>
        <Text font={16} fontWeight="semibold">选集</Text>
        <EpisodeGrid vids={detail.vid_list} currentVid={currentVid} onSelect={onSwitch} />
      </VStack>
    </VStack>
  )
}
