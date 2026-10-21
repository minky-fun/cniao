import {
  VideoPlayer,
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
  type OfflineLoadOptions,
} from "../core/playbackSource"
import type { PlayerData } from "../core/types"
import { BRAND_COLOR, ErrorView, FILL_LEADING, LoadingView, PAGE_FRAME, TagChip } from "./Common"
import { EpisodeGrid } from "./EpisodeGrid"
import { bindPlayerEvents } from "../core/playerEvents"

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

/** 管理集数加载与系统播放器生命周期，并显示本地播放错误。 */
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
  // 全屏仅改变布局，保持同一播放器和播放源，避免切换时重新装载媒体。
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const player = useMemo(() => new AVPlayer(), [])

  const loadedSourceRef = useRef("")

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
  const clearPrepareProgress = useCallback(() => {
    const shown = prepareShownRef.current
    if (!shown.label && shown.percent === 0) return
    prepareShownRef.current = { label: "", percent: 0 }
    setPrepareLabel("")
    setPreparePercent(0)
  }, [])

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

  const switchEpisode = useCallback((vid: string) => {
    if (!data || vid === currentVid) return

    const seq = requestSeqRef.current + 1
    requestSeqRef.current = seq

    player.pause()
    setHasPlaybackStarted(false)
    clearPrepareProgress()
    setErrorMessage("")
    setSwitchLabel("正在切换")

    const isStale = () => requestSeqRef.current !== seq

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

        if (playerReadyRef.current) player.play()
      })
      .finally(() => {
        if (!isStale()) setSwitchLabel("")
      })
    },
    [data, currentVid, seriesId, player, clearPrepareProgress, updatePrepareProgress]
  )

  const applyOfflineLoad = async (vid: string, options: OfflineLoadOptions = {}) => {
    const { data: offlineData, meta } = await loadOfflinePlayerData(seriesId, vid, {
      ...options,
      onProgress: updatePrepareProgress,
    })
    setData(offlineData)
    setCurrentVid(vid)
    setSource(offlineData.playerInfo.main_url)
    const seconds = durationSeconds(meta?.duration)
    if (seconds > 0) setActiveDuration(seconds)
  }

  const load = (vid: string) => {
    setIsLoading(true)
    setErrorMessage("")

    requestSeqRef.current += 1
    setSwitchLabel("")

    const seq = requestSeqRef.current
    const isStale = () => requestSeqRef.current !== seq

    const showDetailEarly = (detail: PlayerData) => {
      if (isStale()) return
      setData(detail)
      setCurrentVid(vid)
    }

    applyOfflineLoad(vid, { onDetail: showDetailEarly })
      .catch(error => {
        clearPrepareProgress()

        setErrorMessage(error instanceof Error ? error.message : String(error))
      })
      .finally(() => setIsLoading(false))
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
      SharedAudioSession.setActive(false).catch(() => {})
    }
  }, [])

  const switchEpisodeRef = useRef(switchEpisode)
  switchEpisodeRef.current = switchEpisode
  const currentVidRef = useRef(currentVid)
  currentVidRef.current = currentVid
  const dataRef = useRef(data)
  dataRef.current = data

  // 原生事件仅排队；读取 duration、调用 play/pause 和切集都在回调返回后执行。
  useEffect(() => {
    return bindPlayerEvents(player, {
      /** 媒体就绪后启动播放，时长直接使用缓存元数据，避免同步回读原生属性。 */
      onReady: () => {
        playerReadyRef.current = true
        setIsWaitingForPlayer(false)
        console.log("[player] 媒体已就绪，开始播放")
        player.play()
      },
      /** 使用系统提供的事件参数更新播放状态，避免在事件内回读 rate。 */
      onStatus: status => {
        if (status === TimeControlStatus.playing) setHasPlaybackStarted(true)
      },
      /** 展示原生播放错误，停止等待并保留缓存用于进一步排查。 */
      onError: message => {
        playerReadyRef.current = false
        player.pause()
        setIsWaitingForPlayer(false)
        setIsPlayerLoaded(false)
        clearPrepareProgress()
        setSwitchLabel("")
        console.error(`[player] 播放失败：${message}`)
        setErrorMessage(`视频播放失败：${message}`)
      },
      /** 播完后根据当前集数安排下一集，切源不会在原生结束通知内执行。 */
      onEnded: () => {
        const currentData = dataRef.current
        const current = currentVidRef.current
        if (!currentData || !current) return
        const vids = currentData.seriesDetail.vid_list
        const index = vids.indexOf(current)
        if (index >= 0 && index < vids.length - 1) switchEpisodeRef.current(vids[index + 1])
      },
    })
  }, [player, clearPrepareProgress])

  // 完成事件订阅和音频会话配置后才设置本地源，等待系统就绪事件开始播放。
  useEffect(() => {
    if (!source || !isAudioReady || loadedSourceRef.current === source) return
    playerReadyRef.current = false
    setHasPlaybackStarted(false)
    setIsWaitingForPlayer(true)
    console.log("[player] 开始装载媒体")
    if (player.setSource(source)) {
      loadedSourceRef.current = source
      setIsPlayerLoaded(true)
      console.log("[player] 播放源已设置，等待系统就绪")
    } else {
      setIsWaitingForPlayer(false)
      setIsPlayerLoaded(false)
      setErrorMessage("无法装载视频")
      return
    }
    const timer = setTimeout(() => {
      if (playerReadyRef.current) return
      setIsWaitingForPlayer(false)
      setErrorMessage("系统播放器在 15 秒内未能就绪，缓存已保留")
      console.error("[player] 等待系统就绪超时")
    }, PLAYER_READY_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [player, source, isAudioReady])

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

  // 基础播放器由当前页面持有，关闭页面后释放，不保留画中画控制器。
  useEffect(() => {
    return () => player.dispose()
  }, [player])

  const isPlayerBusy = isLoading || isWaitingForPlayer || prepareLabel !== "" || switchLabel !== ""

  return (
    <VStack
      alignment="leading"
      spacing={0}
      frame={PAGE_FRAME}
      navigationTitle="红果剧场"
      navigationBarTitleDisplayMode="inline"
      navigationBarVisibility={isFullScreen ? "hidden" : "visible"}
      tabBarVisibility={isFullScreen ? "hidden" : "automatic"}
      background={isFullScreen ? "black" : undefined}
      ignoresSafeArea={isFullScreen}
      toolbar={{
        topBarTrailing: [
          <Button title="全屏" systemImage="arrow.up.left.and.arrow.down.right"
            disabled={!isPlayerLoaded || isPlayerBusy}
            action={() => setIsFullScreen(true)} />,
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
        frame={isFullScreen
          ? { maxWidth: "infinity", maxHeight: "infinity" }
          : { maxWidth: "infinity", minHeight: PLAYER_HEIGHT, maxHeight: PLAYER_HEIGHT }}
        background="black"
      >
        {isPlayerLoaded ? (
          <VideoPlayer
            player={player}
            frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
          />
        ) : null}

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
              {prepareLabel || switchLabel || (isWaitingForPlayer ? "正在启动系统播放器" : "加载中…")}
            </Text>
          </VStack>
        ) : null}
      </ZStack>

      {isFullScreen ? (
        <HStack padding={{ horizontal: 16, top: 8, bottom: 32 }} foregroundStyle="white">
          <Spacer />
          <Button title="退出全屏" systemImage="arrow.down.right.and.arrow.up.left"
            action={() => setIsFullScreen(false)} />
        </HStack>
      ) : null}

      {!isFullScreen ? <ScrollView>
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
