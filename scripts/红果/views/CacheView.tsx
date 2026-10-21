import {
  Button,
  HStack,
  Image,
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
  exportOfflineVideo,
  listOfflineCache,
  removeOfflineVideo,
  type CacheEntry,
} from "../core/mediaCache"
import { BRAND_COLOR, CONTENT_WIDTH, EmptyView, FILL_LEADING, PAGE_FRAME } from "./Common"

const BAR_HEIGHT = 6

const ROW_ACTION_WIDTH = 40

function entryTitle(entry: CacheEntry): string {
  return entry.label || entry.videoId
}

function UsageBar({ usedBytes }: { usedBytes: number }) {
  const ratio = Math.min(usedBytes / PLAYBACK_CACHE_MAX_BYTES, 1)

  const filledWidth = Math.max(Math.round(CONTENT_WIDTH * ratio), ratio > 0 ? 2 : 0)

  return (

    <VStack
      alignment="leading"
      frame={{ maxWidth: "infinity", minHeight: BAR_HEIGHT, maxHeight: BAR_HEIGHT, alignment: "leading" }}
      background="secondarySystemBackground"
      clipShape={{ type: "rect", cornerRadius: BAR_HEIGHT / 2 }}
    >
      {filledWidth > 0 ? (
        <VStack
          frame={{ width: filledWidth, height: BAR_HEIGHT }}
          background={BRAND_COLOR}
        />
      ) : null}
    </VStack>
  )
}

function UsageSummary({ entries }: { entries: CacheEntry[] }) {
  const usedBytes = entries.reduce((sum, entry) => sum + entry.sizeBytes, 0)

  return (
    <VStack alignment="leading" spacing={10} padding={{ horizontal: 16, top: 12, bottom: 4 }} frame={FILL_LEADING}>
      <HStack spacing={8} alignment="firstTextBaseline" frame={FILL_LEADING}>
        <Text font="title2" bold>
          {formatBytes(usedBytes)}
        </Text>
        <Text font="caption" foregroundStyle="secondaryLabel">
          {`/ ${formatBytes(PLAYBACK_CACHE_MAX_BYTES)}`}
        </Text>
        <Spacer />
        <Text font="caption" foregroundStyle="secondaryLabel">
          {`${entries.length} 集`}
        </Text>
      </HStack>

      <UsageBar usedBytes={usedBytes} />

      <Text font="caption2" foregroundStyle="tertiaryLabel" frame={FILL_LEADING}>
        {`超出上限时自动淘汰最久未观看的剧集，最多保留 ${PLAYBACK_CACHE_MAX_ENTRIES} 集`}
      </Text>
    </VStack>
  )
}

/** 展示缓存文件信息，并允许原样导出或删除单集缓存。 */
function CacheRow({
  entry,
  onRemove,
  onExport,
}: {
  entry: CacheEntry
  onRemove: (entry: CacheEntry) => void
  onExport: (entry: CacheEntry) => void
}) {
  return (
    <HStack
      spacing={12}
      alignment="center"
      padding={{ horizontal: 16, vertical: 10 }}
      frame={FILL_LEADING}
    >
      <VStack alignment="leading" spacing={4} frame={FILL_LEADING}>
        <Text font="subheadline" lineLimit={1} frame={FILL_LEADING}>
          {entryTitle(entry)}
        </Text>

        <HStack spacing={6} alignment="center">
          <Text font="caption2" foregroundStyle="secondaryLabel">
            {formatBytes(entry.sizeBytes)}
          </Text>
          <Text font="caption2" foregroundStyle="tertiaryLabel">
            {`· ${formatRelativeTime(Math.floor(entry.lastUsedAt / 1000))}`}
          </Text>
        </HStack>
      </VStack>

      <Button
        title="导出"
        action={() => onExport(entry)}
        buttonStyle="borderless"
      />
      <Button
        action={() => onRemove(entry)}
        buttonStyle="borderless"
        frame={{ width: ROW_ACTION_WIDTH }}
      >
        <Image systemName="trash" font="body" foregroundStyle="systemRed" />
      </Button>
    </HStack>
  )
}

/** 在不进入播放器的情况下管理和导出缓存，便于检查导致闪退的文件。 */
export function CacheView() {
  const [entries, setEntries] = useState<CacheEntry[]>(() => listOfflineCache())

  const refresh = () => setEntries(listOfflineCache())

  /** 导出已有文件并显示错误，不触发请求、解密或播放器初始化。 */
  const handleExport = async (entry: CacheEntry) => {
    try {
      await exportOfflineVideo(entry.videoId)
    } catch (error) {
      await Dialog.alert({ message: error instanceof Error ? error.message : String(error) })
    }
  }

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
      navigationTitle="缓存管理"
      navigationBarTitleDisplayMode="inline"
      onAppear={() => setEntries(listOfflineCache())}
    >
      <ScrollView>
        <VStack alignment="leading" spacing={14} padding={{ bottom: 24 }} frame={FILL_LEADING}>
          <UsageSummary entries={entries} />

          <HStack spacing={8} alignment="center" padding={{ horizontal: 16, top: 8 }} frame={FILL_LEADING}>
            <Button title="清空缓存" action={handleClear} buttonStyle="bordered" />
            <Button title="刷新" action={refresh} buttonStyle="bordered" />
          </HStack>

          {entries.length === 0 ? (
            <EmptyView text="暂无离线缓存" />
          ) : (
            <VStack alignment="leading" spacing={0} frame={FILL_LEADING}>
              {entries.map(entry => (
                <CacheRow key={entry.videoId} entry={entry} onRemove={handleRemove} onExport={handleExport} />
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </VStack>
  )
}
