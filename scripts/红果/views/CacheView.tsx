import {
  Button,
  GeometryReader,
  HStack,
  Image,
  LazyVStack,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useState,
} from "scripting"
import { PLAYBACK_CACHE_MAX_BYTES, PLAYBACK_CACHE_MAX_ENTRIES } from "../core/config"
import { formatBytes, formatRelativeTime } from "../core/format"
import { loadPlayHistory } from "../core/history"
import {
  clearOfflineCache,
  listOfflineCache,
  removeOfflineVideo,
  type CacheEntry,
} from "../core/mediaCache"
import { CoverImage, FILL_LEADING, PAGE_FRAME } from "./Common"

const CACHE_SURFACE = { light: "#F6F6F6", dark: "#131414" } as const
const CARD_SURFACE = { light: "#FFFFFF", dark: "#1D1E1E" } as const
const TRACK_SURFACE = { light: "#EFEFEF", dark: "#343535" } as const
const ACCENT_COLOR = { light: "#B55200", dark: "#FA7705" } as const

/** 使用缓存标签作为标题，未命名缓存保留现有的视频标识。 */
function entryTitle(entry: CacheEntry): string {
  return entry.label || entry.videoId
}

/** 按参考图展示实际剧集缓存与缓存额度，不将缓存上限当作设备存储容量。 */
function UsageSummary({ usedBytes, count }: { usedBytes: number; count: number }) {
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
      <Text font={32} fontWeight="semibold" lineLimit={1} minScaleFactor={0.7} padding={{ top: 12 }}>
        {formatBytes(usedBytes)}
      </Text>
      <Text font={14} frame={FILL_LEADING}>
        {`已缓存 ${count} 集，上限 ${formatBytes(PLAYBACK_CACHE_MAX_BYTES)}`}
      </Text>
    </VStack>
  )
}

/** 以真实剧集封面展示缓存标题、体积和使用时间，删除按钮独立响应。 */
function CacheRow({
  entry,
  cover,
  onRemove,
}: {
  entry: CacheEntry
  cover: string
  onRemove: (entry: CacheEntry) => void
}) {
  return (
    <VStack alignment="leading" spacing={0} frame={FILL_LEADING}>
      <HStack spacing={12} alignment="center" padding={{ vertical: 14 }} frame={FILL_LEADING}>
        <CoverImage url={cover} width={48} height={67} cornerRadius={6} />
        <VStack alignment="leading" spacing={8} frame={FILL_LEADING}>
          <Text font={14} fontWeight="medium" foregroundStyle="label" lineLimit={2} frame={FILL_LEADING}>
            {entryTitle(entry)}
          </Text>
          <HStack spacing={8} alignment="center">
            <Text
              font={11}
              foregroundStyle={ACCENT_COLOR}
              padding={{ horizontal: 5, vertical: 2 }}
              background={{ style: "rgba(250,119,5,0.1)", shape: { type: "rect", cornerRadius: 4 } }}
            >
              {formatBytes(entry.sizeBytes)}
            </Text>
            <Text font={11} foregroundStyle="secondaryLabel" lineLimit={1}>
              {formatRelativeTime(Math.floor(entry.lastUsedAt / 1000))}
            </Text>
          </HStack>
        </VStack>
        <Button action={() => onRemove(entry)} buttonStyle="plain" role="destructive">
          <Image systemName="trash" font={16} foregroundStyle="secondaryLabel" frame={{ width: 44, height: 44 }} />
        </Button>
      </HStack>
      <VStack frame={{ maxWidth: "infinity", height: 0.5 }} background="separator" />
    </VStack>
  )
}

/** 展示缓存概览和一键清理，默认显示带封面的逐集明细并保留删除确认。 */
export function CacheView() {
  const [entries, setEntries] = useState<CacheEntry[]>(() => listOfflineCache())
  const [history, setHistory] = useState(loadPlayHistory)
  const [showDetails, setShowDetails] = useState(true)
  const usedBytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0)

  /** 重新读取现有缓存，清空后收起明细，不触发下载或修改缓存策略。 */
  const refresh = () => {
    const currentEntries = listOfflineCache()
    setEntries(currentEntries)
    setHistory(loadPlayHistory())
    if (currentEntries.length === 0) setShowDetails(false)
  }

  /** 展开或收起真实缓存明细，不改变缓存文件。 */
  const toggleDetails = () => setShowDetails(!showDetails)

  /** 确认后删除指定缓存，并更新容量与列表。 */
  const handleRemove = async (entry: CacheEntry) => {
    const confirmed = await Dialog.confirm({
      title: "删除缓存",
      message: `确定删除「${entryTitle(entry)}」的离线缓存？删除后再次播放需要重新下载解密。`,
      confirmLabel: "删除",
      cancelLabel: "取消",
    })
    if (!confirmed) return

    removeOfflineVideo(entry.videoId)
    refresh()
  }

  /** 展示将释放的空间，仅在确认后清空缓存。 */
  const handleClear = async () => {
    if (entries.length === 0) return

    const confirmed = await Dialog.confirm({
      title: "清理缓存",
      message: `将删除全部 ${entries.length} 集缓存，释放 ${formatBytes(usedBytes)}。再次播放时需要重新下载，播放历史和主题设置会保留。`,
      confirmLabel: "清理",
      cancelLabel: "取消",
    })
    if (!confirmed) return

    clearOfflineCache()
    refresh()
  }

  return (
    <VStack
      alignment="leading"
      spacing={0}
      frame={PAGE_FRAME}
      background={CACHE_SURFACE}
      foregroundStyle="label"
      navigationTitle="清理缓存"
      navigationBarTitleDisplayMode="inline"
      toolbarBackground={{ style: CACHE_SURFACE, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar", "tabBar"] }}
      onAppear={refresh}
    >
      <ScrollView scrollIndicator="hidden">
        <VStack alignment="leading" spacing={16} padding={{ horizontal: 16, top: 20, bottom: 32 }} frame={FILL_LEADING}>
          <UsageSummary usedBytes={usedBytes} count={entries.length} />

          <VStack
            alignment="leading"
            spacing={0}
            padding={20}
            frame={FILL_LEADING}
            background={{ style: CARD_SURFACE, shape: { type: "rect", cornerRadius: 16 } }}
          >
            <HStack spacing={12} alignment="center" frame={FILL_LEADING}>
              <Text font={30} fontWeight="semibold" lineLimit={1} minScaleFactor={0.6} frame={FILL_LEADING}>
                {formatBytes(usedBytes)}
              </Text>
              <Button action={handleClear} buttonStyle="plain" role="destructive" disabled={entries.length === 0}>
                <Text
                  font={14}
                  fontWeight="medium"
                  foregroundStyle={entries.length > 0 ? "white" : "secondaryLabel"}
                  frame={{ minHeight: 44 }}
                  padding={{ horizontal: 12 }}
                  background={{
                    style: entries.length > 0 ? "#FA7705" : TRACK_SURFACE,
                    shape: { type: "rect", cornerRadius: 9 },
                  }}
                >
                  一键清理
                </Text>
              </Button>
            </HStack>
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
              <Button action={toggleDetails} buttonStyle="plain" disabled={entries.length === 0}>
                <Text font={13} foregroundStyle={ACCENT_COLOR} frame={{ minHeight: 44 }}>
                  {showDetails ? "收起明细" : "查看明细"}
                </Text>
              </Button>
            </HStack>
            {showDetails && entries.length > 0 ? (
              <LazyVStack alignment="leading" spacing={0} frame={FILL_LEADING}>
                {entries.map(entry => (
                  <CacheRow
                    key={entry.videoId}
                    entry={entry}
                    // 旧缓存未保存封面时，只使用视频 ID 完全匹配的本地历史。
                    cover={entry.cover || history.find(record => record.lastVid === entry.videoId)?.cover || ""}
                    onRemove={handleRemove}
                  />
                ))}
              </LazyVStack>
            ) : null}
          </VStack>
          <Text font={12} foregroundStyle="secondaryLabel" padding={{ horizontal: 4 }} frame={FILL_LEADING}>
            {`最多保留 ${PLAYBACK_CACHE_MAX_ENTRIES} 集，超出上限时自动清理最久未观看的剧集。`}
          </Text>
        </VStack>
      </ScrollView>
    </VStack>
  )
}
