import {
  AVPlayerView,
  Button,
  HStack,
  Image,
  PIPStatus,
  ProgressView,
  ScrollView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useEffect,
  useCallback,
  useObservable,
  useRef,
  useState,
} from "scripting"
import { fetchDetail } from "../core/api"
import {
  isOfflineVideoCached,
  preloadOfflineVideo,
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
import { retainPipPlayer, setPipPlaybackActive } from "../core/playbackState"
import { BRAND_COLOR, ErrorView, FILL_LEADING, LoadingView, PAGE_FRAME, TagChip } from "./Common"
import { EpisodeGrid } from "./EpisodeGrid"

const PLAYER_HEIGHT = 220

const PLAY_AFTER_MOUNT_MS = 120

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
  const [errorMessage, setErrorMessage] = useState("")

  const [player] = useState(() => new AVPlayer())
  const pipStatus = useObservable<PIPStatus>(null)

  const loadedSourceRef = useRef("")

  const requestSeqRef = useRef(0)

  const prepareShownRef = useRef({ label: "", percent: 0 })

  const [switchLabel, setSwitchLabel] = useState("")

  const [source, setSource] = useState("")

  const [prepareLabel, setPrepareLabel] = useState("")
  const [preparePercent, setPreparePercent] = useState(0)

  const [surfaceKey, setSurfaceKey] = useState(0)

  const [isAudioReady, setIsAudioReady] = useState(false)

  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false)
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false)

  const [activeDuration, setActiveDuration] = useState<number>(0)
  const pipValue = pipStatus.value

  const isPipActive = pipValue === "willStart" || pipValue === "didStart"
  const isPipActiveRef = useRef(false)
  isPipActiveRef.current = isPipActive

  useEffect(() => {
    if (pipValue === "willStart" || pipValue === "didStart") {
      setPipPlaybackActive(true)
    } else if (pipValue === "willStop" || pipValue === "didStop") {
      setPipPlaybackActive(false)
    }
  }, [pipValue])

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

        if (!player.setSource(url)) {
          throw new Error(`无法装载第 ${data.seriesDetail.vid_list.indexOf(vid) + 1} 集`)
        }
        loadedSourceRef.current = url
        setIsPlayerLoaded(true)

        const durSec = meta?.duration ?? 0
        setData(prev => (prev ? applyOfflineSource(prev, vid, url, meta) : prev))
        setActiveDuration(durSec > 0 ? durSec : 0)

        setCurrentVid(vid)
        setSource(url)
        player.play()
      })
      .catch(error => {
        if (isStale()) return

        clearPrepareProgress()
        setErrorMessage(error instanceof Error ? error.message : String(error))

        const fallback = loadedSourceRef.current
        if (fallback && player.setSource(fallback)) player.play()
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

  // 先订阅加载失败事件，避免本地媒体解析失败时只留下黑屏。
  useEffect(() => {
    player.onError = message => {
      player.pause()
      setIsPlayerLoaded(false)
      loadedSourceRef.current = ""
      clearPrepareProgress()
      setSwitchLabel("")
      setErrorMessage(`本地视频播放失败：${message}。请在缓存页删除该集后重试`)
    }
    return () => { player.onError = undefined }
  }, [player, clearPrepareProgress])

  useEffect(() => {
    if (!source || !isAudioReady) return
    if (loadedSourceRef.current === source) return

    if (player.setSource(source)) {
      loadedSourceRef.current = source
      setIsPlayerLoaded(true)
    } else {
      setIsPlayerLoaded(false)
      setErrorMessage("无法装载本地视频，请在缓存页删除该集后重试")
    }
  }, [player, source, isAudioReady])

  const syncPlayerDuration = () => {
    const d = player.duration
    if (d > 0) {
      setActiveDuration(prev => {
        if (Math.abs(prev - d) >= 0.5) return d
        return prev
      })
    }
  }

  useEffect(() => {
    if (!isPlayerLoaded) return

    player.onReadyToPlay = () => {
      syncPlayerDuration()
      player.play()
    }
    const timer = setTimeout(() => {
      syncPlayerDuration()
      player.play()
    }, PLAY_AFTER_MOUNT_MS)

    return () => clearTimeout(timer)
  }, [player, isPlayerLoaded, surfaceKey])

  useEffect(() => {
    player.onTimeControlStatusChanged = () => {
      if (player.rate > 0) setHasPlaybackStarted(true)
      syncPlayerDuration()
    }
    return () => {
      player.onTimeControlStatusChanged = undefined
    }
  }, [player])

  useEffect(() => {
    if (!source) return
    const timers = [120, 300, 600, 1200].map(delay =>
      setTimeout(syncPlayerDuration, delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [source])

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
        const success = await preloadOfflineVideo(targetVid, {
          label,
          protectedVideoIds: [currentVid],
        })

        if (!success || cancelled) break
      }
    }, 1500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [data?.seriesDetail, currentVid, isPlayerLoaded, hasPlaybackStarted])

  useEffect(() => {
    if (pipValue === "didStop") setSurfaceKey(key => key + 1)
  }, [pipValue])

  useEffect(() => {
    return () => {
      if (isPipActiveRef.current) {
        retainPipPlayer(player)
      } else {
        setPipPlaybackActive(false)
        player.dispose()
      }
    }
  }, [player])

  const switchEpisodeRef = useRef(switchEpisode)
  switchEpisodeRef.current = switchEpisode

  const currentVidRef = useRef(currentVid)
  currentVidRef.current = currentVid
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    player.onEnded = () => {
      const currentData = dataRef.current
      const current = currentVidRef.current
      if (!currentData || !current) return

      const vidList = currentData.seriesDetail.vid_list
      const currentIndex = vidList.indexOf(current)
      if (currentIndex >= 0 && currentIndex < vidList.length - 1) {
        const nextVid = vidList[currentIndex + 1]
        switchEpisodeRef.current(nextVid)
      }
    }

    return () => {
      player.onEnded = undefined
    }
  }, [player])

  const isPlayerBusy = isLoading || prepareLabel !== "" || switchLabel !== ""

  return (
    <VStack
      alignment="leading"
      spacing={0}
      frame={PAGE_FRAME}
      navigationTitle="红果剧场"
      navigationBarTitleDisplayMode="inline"
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
        frame={{ maxWidth: "infinity", minHeight: PLAYER_HEIGHT, maxHeight: PLAYER_HEIGHT }}
        background="black"
      >
        {isPlayerLoaded ? (
          <AVPlayerView
            key={surfaceKey}
            player={player}
            pipStatus={pipStatus}
            allowsPictureInPicturePlayback={true}
            canStartPictureInPictureAutomaticallyFromInline={false}
            videoGravity="resizeAspect"
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
              {prepareLabel || switchLabel || "加载中…"}
            </Text>
          </VStack>
        ) : null}
      </ZStack>

      <ScrollView>
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
      </ScrollView>
    </VStack>
  )
}

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
          剧集首次播放均需下载并解密，带 ↓ 标记的表示尚未缓存
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
