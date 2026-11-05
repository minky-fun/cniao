import {
  Button,
  HStack,
  Image,
  LazyVStack,
  ProgressView,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useState,
} from "scripting"
import { PLAYBACK_CACHE_MAX_BYTES, PLAYBACK_CACHE_MAX_ENTRIES } from "../core/config"
import { formatBytes, formatRelativeTime } from "../core/format"
import {
  clearOfflineCache,
  listOfflineCache,
  removeOfflineVideo,
  type CacheEntry,
} from "../core/mediaCache"
import { EmptyView, FILL_LEADING, PAGE_FRAME } from "./Common"

const CACHE_SURFACE = { light: "#FFFFFF", dark: "#131414" } as const
const SUMMARY_SURFACE = { light: "#F6F6F6", dark: "#1D1E1E" } as const
const ACCENT_COLOR = { light: "#B55200", dark: "#FA7705" } as const

/** 使用缓存标签作为标题，未命名缓存保留现有的视频标识。 */
function entryTitle(entry: CacheEntry): string {
  return entry.label || entry.videoId
}

/** 以官网橙色展示容量与集数，进度条随容器宽度布局并适配深浅主题。 */
function UsageSummary({ entries }: { entries: CacheEntry[] }) {
  const usedBytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0)

  return (
    <VStack
      alignment="leading"
      spacing={14}
      padding={18}
      frame={FILL_LEADING}
      background={{ style: SUMMARY_SURFACE, shape: { type: "rect", cornerRadius: 12 } }}
    >
      <Text font={13} foregroundStyle="secondaryLabel">已用缓存空间</Text>
      <HStack spacing={8} alignment="firstTextBaseline" frame={FILL_LEADING}>
        <Text font={32} fontWeight="semibold" foregroundStyle={ACCENT_COLOR} lineLimit={1} minScaleFactor={0.7}>
          {formatBytes(usedBytes)}
        </Text>
        <Text font={12} foregroundStyle="secondaryLabel">
          {`/ ${formatBytes(PLAYBACK_CACHE_MAX_BYTES)}`}
        </Text>
      </HStack>

      <ProgressView
        value={Math.min(usedBytes, PLAYBACK_CACHE_MAX_BYTES)}
        total={PLAYBACK_CACHE_MAX_BYTES}
        progressViewStyle="linear"
        tint="#FA7705"
        frame={FILL_LEADING}
      />

      <HStack spacing={8} frame={FILL_LEADING}>
        <Text font={12} foregroundStyle="secondaryLabel">{`已缓存 ${entries.length} 集`}</Text>
        <Spacer />
        <Text font={12} foregroundStyle="secondaryLabel">{`最多 ${PLAYBACK_CACHE_MAX_ENTRIES} 集`}</Text>
      </HStack>
      <Text font={12} foregroundStyle="secondaryLabel" frame={FILL_LEADING}>
        超出上限时，自动清理最久未观看的剧集。
      </Text>
    </VStack>
  )
}

/** 以紧凑列表展示真实缓存标题、体积和使用时间，删除按钮独立响应。 */
function CacheRow({
  entry,
  onRemove,
}: {
  entry: CacheEntry
  onRemove: (entry: CacheEntry) => void
}) {
  return (
    <VStack alignment="leading" spacing={0} frame={FILL_LEADING}>
      <HStack spacing={12} alignment="center" padding={{ vertical: 14 }} frame={FILL_LEADING}>
        <Image
          systemName="play.rectangle.fill"
          font={21}
          foregroundStyle={ACCENT_COLOR}
          frame={{ width: 44, height: 54 }}
          background={{ style: "rgba(250,119,5,0.1)", shape: { type: "rect", cornerRadius: 10 } }}
        />
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

/** 展示主题自适应的缓存概览与列表，保留刷新和删除前确认。 */
export function CacheView() {
  const [entries, setEntries] = useState<CacheEntry[]>(() => listOfflineCache())

  /** 重新读取现有缓存，不触发下载或修改缓存策略。 */
  const refresh = () => setEntries(listOfflineCache())

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

    const usedBytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0)
    const confirmed = await Dialog.confirm({
      title: "清空缓存",
      message: `将删除全部 ${entries.length} 集离线缓存，释放 ${formatBytes(usedBytes)}。`,
      confirmLabel: "清空",
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
      navigationTitle="缓存管理"
      navigationBarTitleDisplayMode="inline"
      toolbarBackground={{ style: CACHE_SURFACE, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar", "tabBar"] }}
      onAppear={refresh}
    >
      <ScrollView scrollIndicator="hidden">
        <VStack alignment="leading" spacing={22} padding={{ horizontal: 16, top: 16, bottom: 32 }} frame={FILL_LEADING}>
          <UsageSummary entries={entries} />

          <HStack spacing={16} alignment="center" frame={FILL_LEADING}>
            <Text font={18} fontWeight="medium">离线剧集</Text>
            <Spacer />
            <Button action={refresh} buttonStyle="plain">
              <HStack spacing={4} frame={{ minHeight: 44 }} foregroundStyle={ACCENT_COLOR}>
                <Image systemName="arrow.clockwise" font={12} />
                <Text font={13}>刷新</Text>
              </HStack>
            </Button>
            <Button action={handleClear} buttonStyle="plain" role="destructive" disabled={entries.length === 0}>
              <Text font={13} foregroundStyle="secondaryLabel" frame={{ minHeight: 44 }}>清空</Text>
            </Button>
          </HStack>

          {entries.length === 0 ? (
            <EmptyView text="暂无离线缓存" />
          ) : (
            <LazyVStack alignment="leading" spacing={0} frame={FILL_LEADING}>
              {entries.map(entry => (
                <CacheRow key={entry.videoId} entry={entry} onRemove={handleRemove} />
              ))}
            </LazyVStack>
          )}
        </VStack>
      </ScrollView>
    </VStack>
  )
}
