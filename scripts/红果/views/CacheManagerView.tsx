import {
  Button,
  HStack,
  Image,
  LazyVStack,
  ScrollView,
  Spacer,
  Text,
  VStack,
  useState,
} from "scripting"
import { formatBytes } from "../core/format"
import { loadPlayHistory } from "../core/history"
import { listOfflineCache, removeOfflineVideo, type CacheEntry } from "../core/mediaCache"
import { CoverImage, EmptyView, FILL_LEADING, PAGE_FRAME } from "./Common"

const MANAGEMENT_SURFACE = { light: "#FFFFFF", dark: "#131414" } as const
const DELETE_COLOR = { light: "#E65D53", dark: "#FF8075" } as const
const DISABLED_DELETE_COLOR = { light: "#F1C5BF", dark: "#76504D" } as const

interface CachedSeries {
  key: string
  title: string
  cover: string
  entries: CacheEntry[]
}

/** 显示一部剧的真实缓存集数、容量及选择状态，整行均可勾选。 */
function CachedSeriesRow({ group, selected, disabled, onSelect }: {
  group: CachedSeries
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  const bytes = group.entries.reduce((sum, entry) => sum + entry.sizeBytes, 0)

  return (
    <Button action={onSelect} buttonStyle="plain" disabled={disabled}>
      <HStack spacing={12} padding={{ horizontal: 20, vertical: 12 }} frame={FILL_LEADING}>
        <CoverImage url={group.cover} width={56} height={79} cornerRadius={8} />
        <VStack alignment="leading" spacing={12} frame={FILL_LEADING}>
          <Text font={16} fontWeight="semibold" lineLimit={2} frame={FILL_LEADING}>
            {group.title}
          </Text>
          <Text font={12} foregroundStyle="secondaryLabel" lineLimit={1}>
            {`已缓存${group.entries.length}集 · ${formatBytes(bytes)}`}
          </Text>
        </VStack>
        <Image
          systemName={selected ? "checkmark.circle.fill" : "circle"}
          font={22}
          foregroundStyle={selected ? "#FA7705" : "tertiaryLabel"}
          frame={{ width: 32, height: 44 }}
        />
      </HStack>
    </Button>
  )
}

/** 使用原生导航返回管理缓存，保留主题背景、全选和确认删除。 */
export function CacheManagerView() {
  const [entries, setEntries] = useState(listOfflineCache)
  const [history, setHistory] = useState(loadPlayHistory)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const groupsByKey = new Map<string, CachedSeries>()

  for (const entry of entries) {
    // 旧索引只通过历史中的确切视频 ID 补充归属，不从标题或封面推断。
    const record = history.find(item => item.lastVid === entry.videoId)
    const seriesId = entry.seriesId || record?.seriesId
    const key = seriesId ? `series:${seriesId}` : `video:${entry.videoId}`
    const group = groupsByKey.get(key)
    const cover = entry.cover || record?.cover || ""
    const title = entry.seriesTitle || record?.title
    if (group) {
      group.entries.push(entry)
      if (!group.cover && cover) group.cover = cover
      if (title) group.title = title
    } else {
      groupsByKey.set(key, { key, title: title || entry.label || entry.videoId, cover, entries: [entry] })
    }
  }

  const groups = Array.from(groupsByKey.values())
  const selectedGroups = groups.filter(group => selectedKeys.includes(group.key))
  const allSelected = groups.length > 0 && selectedGroups.length === groups.length

  /** 返回页面或删除完成后重新读取实际缓存，清除已失效的选择。 */
  const refresh = () => {
    setEntries(listOfflineCache())
    setHistory(loadPlayHistory())
    setSelectedKeys([])
  }

  /** 切换一部剧的选择状态，不修改缓存文件。 */
  const toggleSelection = (key: string) => {
    setSelectedKeys(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key])
  }

  /** 在当前全部缓存剧集与空选择之间切换。 */
  const toggleAll = () => {
    setSelectedKeys(allSelected ? [] : groups.map(group => group.key))
  }

  /** 确认后仅删除所选剧集的缓存；失败时刷新实际结果并显示原因。 */
  const deleteSelected = async () => {
    if (deleting || selectedGroups.length === 0) return
    const selectedEntries = selectedGroups.flatMap(group => group.entries)
    const bytes = selectedEntries.reduce((sum, entry) => sum + entry.sizeBytes, 0)
    setDeleting(true)
    let attempted = false
    try {
      const confirmed = await Dialog.confirm({
        title: "删除缓存",
        message: `将删除所选 ${selectedGroups.length} 部剧的 ${selectedEntries.length} 集缓存，释放 ${formatBytes(bytes)}。播放历史会保留，再次播放时需要重新下载。`,
        confirmLabel: "删除",
        cancelLabel: "取消",
      })
      if (!confirmed) return
      attempted = true
      for (const entry of selectedEntries) removeOfflineVideo(entry.videoId)
    } catch (error) {
      await Dialog.alert({
        title: "未能完成删除",
        message: error instanceof Error ? error.message : String(error),
      })
    } finally {
      if (attempted) refresh()
      setDeleting(false)
    }
  }

  return (
    <VStack
      spacing={0}
      frame={PAGE_FRAME}
      background={
        <VStack
          frame={PAGE_FRAME}
          background={MANAGEMENT_SURFACE}
          ignoresSafeArea={{ regions: "container" }}
        />
      }
      foregroundStyle="label"
      toolbarBackground={{ style: MANAGEMENT_SURFACE, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar", "tabBar"] }}
      navigationTitle="缓存管理"
      navigationBarTitleDisplayMode="inline"
      navigationBarVisibility="visible"
      tabBarVisibility="hidden"
      onAppear={refresh}
    >
      <HStack spacing={12} padding={{ horizontal: 20, top: 8, bottom: 12 }} frame={FILL_LEADING}>
        <Button action={toggleAll} buttonStyle="plain" disabled={deleting || groups.length === 0}>
          <Text font={16} frame={{ minHeight: 44 }}>{allSelected ? "取消全选" : "全选"}</Text>
        </Button>
        <Spacer />
      </HStack>
      <ScrollView scrollIndicator="hidden" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        {groups.length === 0 ? <EmptyView text="暂无缓存" /> : (
          <LazyVStack spacing={0} padding={{ bottom: 24 }} frame={FILL_LEADING}>
            {groups.map(group => (
              <CachedSeriesRow
                key={group.key}
                group={group}
                selected={selectedKeys.includes(group.key)}
                disabled={deleting}
                onSelect={() => toggleSelection(group.key)}
              />
            ))}
          </LazyVStack>
        )}
      </ScrollView>
      <Button
        action={deleteSelected}
        buttonStyle="plain"
        role="destructive"
        disabled={deleting || selectedGroups.length === 0}
      >
        <HStack
          spacing={6}
          padding={{ vertical: 10 }}
          frame={{ maxWidth: "infinity", minHeight: 56 }}
          foregroundStyle={selectedGroups.length === 0 || deleting ? DISABLED_DELETE_COLOR : DELETE_COLOR}
        >
          <Image systemName="trash" font={19} />
          <Text font={16}>{deleting ? "正在删除" : "删除"}</Text>
        </HStack>
      </Button>
    </VStack>
  )
}
