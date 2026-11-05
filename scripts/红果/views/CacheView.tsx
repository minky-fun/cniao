import {
  Button,
  GeometryReader,
  HStack,
  Image,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useObservable,
  useState,
} from "scripting"
import { PLAYBACK_CACHE_MAX_BYTES } from "../core/config"
import { formatBytes } from "../core/format"
import {
  clearOfflineCache,
  getPlaybackCacheMaxEntries,
  listOfflineCacheAsync,
  setPlaybackCacheMaxEntries,
  type CacheEntry,
} from "../core/mediaCache"
import { ErrorView, FILL_LEADING, LoadingView, PAGE_FRAME } from "./Common"

const CACHE_SURFACE = { light: "#F6F6F6", dark: "#131414" } as const
const CARD_SURFACE = { light: "#FFFFFF", dark: "#1D1E1E" } as const
const TRACK_SURFACE = { light: "#EFEFEF", dark: "#343535" } as const
const ACCENT_COLOR = { light: "#B55200", dark: "#FA7705" } as const

/** 展示实际剧集缓存与缓存额度，并在容量右侧提供紧凑的一键清理按钮。 */
function UsageSummary({ usedBytes, count, onClear }: { usedBytes: number; count: number; onClear: () => void }) {
  const ratio = Math.min(usedBytes / PLAYBACK_CACHE_MAX_BYTES, 1)

  return (
    <VStack
      alignment="leading"
      spacing={12}
      padding={20}
      frame={FILL_LEADING}
      background={{ style: CARD_SURFACE, shape: { type: "rect", cornerRadius: 16 } }}
    >
      <GeometryReader frame={{ height: 16 }}>
        {({ size }) => (
          <HStack
            spacing={0}
            frame={{ width: size.width, height: 16, alignment: "leading" }}
            background={TRACK_SURFACE}
            clipShape={{ type: "rect", cornerRadius: 4 }}
          >
            <VStack frame={{ width: size.width * ratio, height: 16 }} background="#FA7705" />
            <VStack frame={{ width: size.width * (1 - ratio), height: 16 }} background={TRACK_SURFACE} />
          </HStack>
        )}
      </GeometryReader>
      <HStack spacing={8} frame={FILL_LEADING}>
        <HStack spacing={6}>
          <VStack frame={{ width: 7, height: 7 }} background="#FA7705" clipShape="circle" />
          <Text font={12} foregroundStyle="secondaryLabel">剧集缓存</Text>
        </HStack>
        <Spacer />
        <HStack spacing={6}>
          <VStack frame={{ width: 7, height: 7 }} background={TRACK_SURFACE} clipShape="circle" />
          <Text font={12} foregroundStyle="secondaryLabel">剩余缓存额度</Text>
        </HStack>
      </HStack>
      <HStack spacing={12} padding={{ top: 12 }} frame={FILL_LEADING}>
        <Text font={32} fontWeight="semibold" lineLimit={1} minScaleFactor={0.7} frame={FILL_LEADING}>
          {formatBytes(usedBytes)}
        </Text>
        {/* 缩小橙色外观，外层仍保留 44 点触控高度。 */}
        <Button action={onClear} buttonStyle="plain" role="destructive" disabled={count === 0} frame={{ height: 44 }}>
          <Text
            font={12}
            fontWeight="medium"
            foregroundStyle={count > 0 ? "white" : "secondaryLabel"}
            frame={{ width: 72, height: 28 }}
            background={{
              style: count > 0 ? "#FA7705" : TRACK_SURFACE,
              shape: { type: "rect", cornerRadius: 8 },
            }}
          >
            一键清理
          </Text>
        </Button>
      </HStack>
      <Text font={14} frame={FILL_LEADING}>
        {`已缓存 ${count} 集，上限 ${formatBytes(PLAYBACK_CACHE_MAX_BYTES)}`}
      </Text>
    </VStack>
  )
}

/** 以贯穿安全区的主题背景展示缓存页，异步读取容量并保留清理和管理入口。 */
export function CacheView({ onOpenManager }: { onOpenManager: () => void }) {
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [maxEntries, setMaxEntries] = useState(getPlaybackCacheMaxEntries)
  const [isLoading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const refreshRequest = useObservable(0)
  const usedBytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0)

  /** 页面出现后异步读取容量，仅接受最新一次刷新，失败时保留重试入口。 */
  const refresh = async () => {
    const requestId = refreshRequest.value + 1
    refreshRequest.setValue(requestId)
    setLoading(true)
    setLoadError("")
    try {
      const currentEntries = await listOfflineCacheAsync()
      if (requestId !== refreshRequest.value) return
      setEntries(currentEntries)
      setMaxEntries(getPlaybackCacheMaxEntries())
    } catch (error) {
      if (requestId === refreshRequest.value) setLoadError(error instanceof Error ? error.message : String(error))
    } finally {
      if (requestId === refreshRequest.value) setLoading(false)
    }
  }

  /** 离开页面后使未完成的读取失效，避免返回时被旧结果覆盖。 */
  const stopRefresh = () => {
    refreshRequest.setValue(refreshRequest.value + 1)
  }

  /** 输入不小于两集的整数并保存，后续自动清理使用新配置，取消时不修改。 */
  const changeMaxEntries = async () => {
    try {
      const input = await Dialog.prompt({
        title: "最多保留几集",
        message: "至少保留 2 集，请输入不小于 2 的整数。保存后，后续写入缓存和下次启动时按新上限自动清理。",
        defaultValue: String(maxEntries),
        keyboardType: "numberPad",
        selectAll: true,
        confirmLabel: "保存",
        cancelLabel: "取消",
      })
      if (input == null) return
      const value = Number(input.trim())
      setPlaybackCacheMaxEntries(value)
      setMaxEntries(value)
    } catch (error) {
      await Dialog.alert({
        title: "未能保存保留集数",
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /** 展示将释放的空间，仅在确认后清空缓存。 */
  const handleClear = async () => {
    if (isLoading || loadError || entries.length === 0) return

    const confirmed = await Dialog.confirm({
      title: "清理缓存",
      message: `将删除全部 ${entries.length} 集缓存，释放 ${formatBytes(usedBytes)}。再次播放时需要重新下载，播放历史和主题设置会保留。`,
      confirmLabel: "清理",
      cancelLabel: "取消",
    })
    if (!confirmed) return

    clearOfflineCache()
    await refresh()
  }

  return (
    <VStack
      alignment="leading"
      spacing={0}
      frame={PAGE_FRAME}
      background={
        <VStack
          frame={PAGE_FRAME}
          background={CACHE_SURFACE}
          ignoresSafeArea={{ regions: "container" }}
        />
      }
      foregroundStyle="label"
      navigationTitle="清理缓存"
      navigationBarTitleDisplayMode="inline"
      navigationBarVisibility="visible"
      toolbarBackground={{ style: CACHE_SURFACE, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar", "tabBar"] }}
      onAppear={refresh}
      onDisappear={stopRefresh}
    >
      <ScrollView scrollIndicator="hidden">
        {isLoading ? <LoadingView text="正在读取缓存…" /> : loadError ? <ErrorView message={loadError} onRetry={refresh} /> : (
          <VStack alignment="leading" spacing={16} padding={{ horizontal: 16, top: 20, bottom: 32 }} frame={FILL_LEADING}>
            <UsageSummary usedBytes={usedBytes} count={entries.length} onClear={handleClear} />

            <VStack
              alignment="leading"
              spacing={0}
              padding={20}
              frame={FILL_LEADING}
              background={{ style: CARD_SURFACE, shape: { type: "rect", cornerRadius: 16 } }}
            >
              <Text font={30} fontWeight="semibold" lineLimit={1} minScaleFactor={0.6} frame={FILL_LEADING}>
                {formatBytes(usedBytes)}
              </Text>
              <Text font={16} padding={{ top: 8 }}>可清理的缓存</Text>
              <Text font={13} foregroundStyle="secondaryLabel" padding={{ top: 14, bottom: 20 }} frame={FILL_LEADING}>
                播放时保存的剧集文件，清理后再次播放需重新下载。播放历史和主题设置会保留。
              </Text>
              <VStack frame={{ maxWidth: "infinity", height: 0.5 }} background="separator" />
              <HStack spacing={12} padding={{ top: 8 }} frame={FILL_LEADING}>
                <Text font={13} foregroundStyle="secondaryLabel">{`共 ${entries.length} 集`}</Text>
                <Spacer />
                <Button action={refresh} buttonStyle="plain">
                  <Text font={13} foregroundStyle="secondaryLabel" frame={{ minHeight: 44 }}>刷新</Text>
                </Button>
                <Button action={onOpenManager} buttonStyle="plain" frame={{ height: 44 }}>
                  <Text
                    font={12}
                    fontWeight="medium"
                    foregroundStyle="label"
                    frame={{ width: 72, height: 28 }}
                    background={{ style: TRACK_SURFACE, shape: { type: "rect", cornerRadius: 8 } }}
                  >
                    前往管理
                  </Text>
                </Button>
              </HStack>
            </VStack>
            <VStack
              padding={{ horizontal: 20, vertical: 8 }}
              frame={FILL_LEADING}
              background={{ style: CARD_SURFACE, shape: { type: "rect", cornerRadius: 16 } }}
            >
              <Button action={changeMaxEntries} buttonStyle="plain">
                <HStack spacing={8} frame={{ maxWidth: "infinity", minHeight: 44 }}>
                  <Text font={14}>最多保留</Text>
                  <Spacer />
                  <Text font={14} foregroundStyle={ACCENT_COLOR}>{`${maxEntries} 集`}</Text>
                  <Image systemName="chevron.right" font={11} foregroundStyle="secondaryLabel" />
                </HStack>
              </Button>
            </VStack>
            <Text font={12} foregroundStyle="secondaryLabel" padding={{ horizontal: 4 }} frame={FILL_LEADING}>
              {`最多保留 ${maxEntries} 集，容量上限 ${formatBytes(PLAYBACK_CACHE_MAX_BYTES)}。后续写入缓存和下次启动时，自动清理最久未观看的剧集。`}
            </Text>
          </VStack>
        )}
      </ScrollView>
    </VStack>
  )
}
