import {
  Button,
  GeometryReader,
  Group,
  HStack,
  Image,
  LazyVGrid,
  ScrollView,
  Spacer,
  Text,
  VStack,
  ZStack,
  useObservable,
  useState,
} from "scripting"
import {
  clearPlayHistory,
  removePlayHistoryItem,
  type HistoryRecord,
} from "../core/history"
import { addFavorite, loadFavorites, removeFavorites, type FavoriteRecord } from "../core/favorites"
import { CoverImage, EmptyView, ErrorView, FILL_LEADING, LoadingView, PAGE_FRAME } from "./Common"

const HISTORY_SURFACE = { light: "#FFFFFF", dark: "#131414" } as const
const FILTER_SURFACE = { light: "#F6F6F6", dark: "#202121" } as const
const ACCENT_COLOR = { light: "#B55200", dark: "#FA7705" } as const
const HISTORY_FILTERS = [
  { value: "all", title: "全部" },
  { value: "ongoing", title: "未看完" },
  { value: "last", title: "已看完" },
] as const
type LibraryRecord = Pick<FavoriteRecord, "seriesId" | "title" | "cover" | "totalEpisodes"> & { history?: HistoryRecord; saved: boolean }
type LibraryTab = "history" | "favorites"

type HistoryFilter = typeof HISTORY_FILTERS[number]["value"]

/** 三列卡片显示真实观看进度和收藏标记，长按操作对应当前列表。 */
function HistoryCard({ record, width, isEditing, selected, tab, onSelect, onRemove, onToggleFavorite }: {
  record: LibraryRecord
  width: number
  isEditing: boolean
  selected: boolean
  tab: LibraryTab
  onSelect: (record: LibraryRecord) => void
  onRemove: (record: LibraryRecord) => void
  onToggleFavorite: (record: LibraryRecord) => void
}) {
  const coverHeight = Math.round(width * 159 / 114)
  const currentEpisode = record.history ? record.history.lastEpisodeIndex + 1 : 0

  return (
    <Button
      action={() => onSelect(record)}
      buttonStyle="plain"
      contextMenu={{
        menuItems: (
          <Group>
            {tab === "history" ? (
              <Button title={record.saved ? "取消收藏" : "加入收藏"} systemImage={record.saved ? "star.slash" : "star"} action={() => onToggleFavorite(record)} />
            ) : null}
            <Button title={tab === "favorites" ? "取消收藏" : "删除历史"} systemImage="trash" role="destructive" action={() => onRemove(record)} />
          </Group>
        ),
      }}
    >
      <VStack alignment="leading" spacing={0} frame={{ width }}>
        <ZStack alignment="topTrailing" frame={{ width, height: coverHeight }}>
          <CoverImage url={record.cover} width={width} height={coverHeight} cornerRadius={12} />
          {isEditing ? (
            <Image
              systemName={selected ? "checkmark.circle.fill" : "circle"}
              font={22}
              foregroundStyle={selected ? "#FA7705" : "white"}
              padding={7}
              background={{ style: "rgba(0,0,0,0.35)", shape: { type: "rect", cornerRadius: 12 } }}
            />
          ) : null}
        </ZStack>
        <Text
          font={14}
          fontWeight="medium"
          foregroundStyle="label"
          lineLimit={1}
          frame={{ width, alignment: "leading" }}
          padding={{ top: 8, bottom: 5 }}
        >
          {record.title}
        </Text>
        <HStack spacing={4}>
          {record.saved ? <Image systemName="star.fill" font={10} foregroundStyle={ACCENT_COLOR} /> : null}
          <Text font={12} foregroundStyle="secondaryLabel" lineLimit={1}>
            {!record.history ? "尚未观看" : record.totalEpisodes > 0 ? `${currentEpisode}集/${record.totalEpisodes}集` : `看到第${currentEpisode}集`}
          </Text>
        </HStack>
      </VStack>
    </Button>
  )
}

/** 在同一三列网格中切换历史与收藏，按剧集关联观看进度并保持两类数据独立。 */
export function HistoryView({ onPlaySeries, onOpenSeries }: {
  onOpenSeries: (seriesId: string) => void
  onPlaySeries: (seriesId: string, vid?: string) => void
}) {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [isLoading, setLoading] = useState(true)
  const [historyError, setHistoryError] = useState("")
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([])
  const [favoriteError, setFavoriteError] = useState("")
  const [tab, setTab] = useState<LibraryTab>("history")
  const loadError = tab === "history" ? historyError : favoriteError
  const refreshRequest = useObservable(0)
  const [filter, setFilter] = useState<HistoryFilter>("all")
  const [isEditing, setEditing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const historyById = new Map(records.map(record => [record.seriesId, record]))
  const savedIds = new Set(favorites.map(record => record.seriesId))
  const libraryRecords: LibraryRecord[] = tab === "history"
    ? records.map(record => ({ ...record, history: record, saved: savedIds.has(record.seriesId) }))
    : favorites.map(record => {
      const history = historyById.get(record.seriesId)
      return { ...record, history, totalEpisodes: history ? history.totalEpisodes : record.totalEpisodes, saved: true }
    })
  // 收藏保留所有剧集；只有历史按已知总集数筛选。
  const visibleRecords = libraryRecords.filter(record => {
    if (tab === "favorites" || filter === "all") return true
    if (!record.history || record.totalEpisodes <= 0) return false
    const reachedLast = record.history.lastEpisodeIndex + 1 >= record.totalEpisodes
    return filter === "last" ? reachedLast : !reachedLast
  })

  /** 分别读取收藏与历史，单侧损坏不阻止另一列表显示，历史只接受最新一次刷新。 */
  const refresh = async () => {
    const requestId = refreshRequest.value + 1
    refreshRequest.setValue(requestId)
    setLoading(true)
    setHistoryError("")
    setFavoriteError("")
    try {
      setFavorites(loadFavorites())
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : String(error))
    }
    setSelectedIds([])
    try {
      const path = `${FileManager.appGroupDocumentsDirectory}/hongguo-history.json`
      const list: HistoryRecord[] = await FileManager.exists(path) ? JSON.parse(await FileManager.readAsString(path)) : []
      if (!Array.isArray(list)) throw new Error("播放历史格式异常，请重试")
      list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      if (requestId === refreshRequest.value) setRecords(list)
    } catch (error) {
      if (requestId === refreshRequest.value) setHistoryError(error instanceof Error ? error.message : String(error))
    } finally {
      if (requestId === refreshRequest.value) setLoading(false)
    }
  }

  /** 离开页面后忽略未完成的读取，避免旧历史覆盖重新进入后的结果。 */
  const stopRefresh = () => {
    refreshRequest.setValue(refreshRequest.value + 1)
  }

  /** 切换列表时结束编辑并清空勾选，避免跨列表删除。 */
  const switchTab = (value: LibraryTab) => {
    setTab(value)
    setEditing(false)
    setSelectedIds([])
  }

  /** 切换集数筛选时清空勾选，防止删除已隐藏的记录。 */
  const switchFilter = (value: HistoryFilter) => {
    setFilter(value)
    setSelectedIds([])
  }

  /** 进入或退出编辑模式时清空勾选，正常点击保留原有续播行为。 */
  const toggleEditing = () => {
    setEditing(!isEditing)
    setSelectedIds([])
  }

  /** 编辑时切换勾选，浏览时续播已有进度，未观看的收藏打开详情。 */
  const handleSelect = (record: LibraryRecord) => {
    if (!isEditing) {
      if (record.history?.lastVid) onPlaySeries(record.seriesId, record.history.lastVid)
      else onOpenSeries(record.seriesId)
      return
    }
    setSelectedIds(previous => previous.includes(record.seriesId)
      ? previous.filter(id => id !== record.seriesId)
      : [...previous, record.seriesId])
  }

  /** 仅全选当前筛选结果，再次点击取消当前勾选。 */
  const toggleAll = () => {
    setSelectedIds(selectedIds.length === visibleRecords.length
      ? []
      : visibleRecords.map(record => record.seriesId))
  }

  /** 从历史长按菜单加入或取消收藏；操作失败保留原列表并提示。 */
  const toggleFavorite = async (record: LibraryRecord) => {
    try {
      const exists = loadFavorites().some(item => item.seriesId === record.seriesId)
      if (exists) removeFavorites([record.seriesId])
      else addFavorite({ seriesId: record.seriesId, title: record.title, cover: record.cover, totalEpisodes: record.totalEpisodes })
      await refresh()
    } catch (error) {
      await Dialog.alert({ title: "未能修改收藏", message: error instanceof Error ? error.message : String(error) })
    }
  }

  /** 确认后只操作发起时的列表，删除历史和取消收藏互不影响。 */
  const handleRemove = async (record: LibraryRecord) => {
    const fromFavorites = tab === "favorites"
    const confirmed = await Dialog.confirm({
      title: fromFavorites ? "取消收藏" : "删除历史",
      message: fromFavorites ? `确定取消收藏「${record.title}」？观看记录仍会保留。` : `确定删除「${record.title}」的播放历史？收藏仍会保留。`,
      confirmLabel: fromFavorites ? "取消收藏" : "删除",
      cancelLabel: "保留",
    })
    if (!confirmed) return
    try {
      if (fromFavorites) removeFavorites([record.seriesId])
      else removePlayHistoryItem(record.seriesId)
      await refresh()
    } catch (error) {
      await Dialog.alert({ title: "操作失败", message: error instanceof Error ? error.message : String(error) })
    }
  }

  /** 对确认前勾选的可见记录批量操作，不跨列表或筛选条件删除。 */
  const handleRemoveSelected = async () => {
    const selected = visibleRecords.filter(record => selectedIds.includes(record.seriesId))
    if (selected.length === 0) return
    const fromFavorites = tab === "favorites"
    const confirmed = await Dialog.confirm({
      title: fromFavorites ? "取消所选收藏" : "删除所选历史",
      message: fromFavorites ? `确定取消 ${selected.length} 部短剧的收藏？观看记录仍会保留。` : `确定删除 ${selected.length} 条播放历史？收藏仍会保留。`,
      confirmLabel: fromFavorites ? "取消收藏" : "删除",
      cancelLabel: "保留",
    })
    if (!confirmed) return
    try {
      if (fromFavorites) removeFavorites(selected.map(record => record.seriesId))
      else for (const record of selected) removePlayHistoryItem(record.seriesId)
      await refresh()
    } catch (error) {
      await Dialog.alert({ title: "操作失败", message: error instanceof Error ? error.message : String(error) })
    }
  }

  /** 确认清空的记录总数后删除全部历史。 */
  const handleClear = async () => {
    if (isLoading || loadError || records.length === 0) return
    const confirmed = await Dialog.confirm({
      title: "清空历史",
      message: `确定清空全部 ${records.length} 条播放历史记录？收藏仍会保留。`,
      confirmLabel: "清空",
      cancelLabel: "取消",
    })
    if (!confirmed) return
    clearPlayHistory()
    await refresh()
  }

  return (
    <GeometryReader
      background={HISTORY_SURFACE}
      foregroundStyle="label"
      navigationTitle="我的追剧"
      navigationBarTitleDisplayMode="inline"
      toolbarBackground={{ style: HISTORY_SURFACE, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar", "tabBar"] }}
      onAppear={refresh}
      onDisappear={stopRefresh}
    >
      {({ size }) => {
        const cardWidth = (size.width - 32 - 16) / 3
        return (
          <VStack alignment="leading" spacing={0} frame={PAGE_FRAME}>
            <HStack spacing={8} padding={{ horizontal: 16, top: 12, bottom: 4 }} frame={FILL_LEADING}>
              {([{ value: "history", title: "最近观看" }, { value: "favorites", title: "我的收藏" }] as const).map(item => (
                <Button key={item.value} action={() => switchTab(item.value)} buttonStyle="plain" frame={FILL_LEADING}>
                  <Text font={16} fontWeight="semibold" frame={{ maxWidth: "infinity", minHeight: 44 }}
                    foregroundStyle={tab === item.value ? ACCENT_COLOR : "secondaryLabel"}
                    background={{ style: tab === item.value ? "rgba(250,119,5,0.1)" : FILTER_SURFACE, shape: { type: "rect", cornerRadius: 8 } }}>
                    {item.title}
                  </Text>
                </Button>
              ))}
            </HStack>
            <HStack spacing={12} padding={{ horizontal: 16, top: 8 }} frame={FILL_LEADING}>
              <ScrollView axes="horizontal" scrollIndicator="hidden" frame={{ maxWidth: "infinity", height: 44 }}>
                <HStack spacing={8}>
                  {tab === "history" ? HISTORY_FILTERS.map(item => (
                    <Button key={item.value} action={() => switchFilter(item.value)} buttonStyle="plain">
                      <Text
                        font={14}
                        fontWeight="medium"
                        foregroundStyle={filter === item.value ? ACCENT_COLOR : "secondaryLabel"}
                        padding={{ horizontal: 12, vertical: 8 }}
                        background={{
                          style: filter === item.value ? "rgba(250,119,5,0.1)" : FILTER_SURFACE,
                          shape: { type: "rect", cornerRadius: 6 },
                        }}
                      >
                        {item.title}
                      </Text>
                    </Button>
                  )) : <Text font={12} foregroundStyle="secondaryLabel">按收藏时间排序</Text>}
                </HStack>
              </ScrollView>
              <Button action={toggleEditing} buttonStyle="plain" disabled={isLoading || !!loadError || (libraryRecords.length === 0 && !isEditing)}>
                <Text font={14} foregroundStyle={isEditing ? ACCENT_COLOR : "label"} frame={{ width: 44, height: 44 }}>
                  {isEditing ? "完成" : "编辑"}
                </Text>
              </Button>
            </HStack>

            <HStack spacing={12} padding={{ horizontal: 16, vertical: 4 }} frame={FILL_LEADING}>
              {isEditing ? (
                <Button action={toggleAll} buttonStyle="plain" disabled={visibleRecords.length === 0}>
                  <Text font={12} foregroundStyle={ACCENT_COLOR} frame={{ minHeight: 44 }}>
                    {selectedIds.length > 0 && selectedIds.length === visibleRecords.length ? "取消全选" : "全选"}
                  </Text>
                </Button>
              ) : null}
              <Text font={12} foregroundStyle="secondaryLabel">
                {isEditing ? `已选 ${selectedIds.length} 部` : `共 ${visibleRecords.length} 部短剧`}
              </Text>
              <Spacer />
              {tab === "history" || isEditing ? <Button
                action={isEditing ? handleRemoveSelected : handleClear}
                buttonStyle="plain"
                role="destructive"
                disabled={isLoading || !!loadError || (isEditing ? selectedIds.length === 0 : records.length === 0)}
              >
                <Text font={12} foregroundStyle={isEditing ? "systemRed" : "secondaryLabel"} frame={{ minHeight: 44 }}>
                  {isEditing ? tab === "favorites" ? "取消所选收藏" : "删除所选" : "清空历史"}
                </Text>
              </Button> : null}
            </HStack>

            <ScrollView scrollIndicator="hidden" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
              {isLoading ? <LoadingView text="正在读取追剧记录…" /> : loadError ? <ErrorView message={loadError} onRetry={refresh} /> : visibleRecords.length === 0 ? (
                <EmptyView text={tab === "favorites" ? "暂无收藏，在详情或播放页点击收藏即可加入" : records.length === 0 ? "暂无播放历史，去看看短剧吧" : "暂无符合筛选条件的记录"} />
              ) : (
                <LazyVGrid
                  columns={[
                    { size: cardWidth, spacing: 8, alignment: "topLeading" },
                    { size: cardWidth, spacing: 8, alignment: "topLeading" },
                    { size: cardWidth, alignment: "topLeading" },
                  ]}
                  alignment="leading"
                  spacing={20}
                  padding={{ horizontal: 16, bottom: 32 }}
                >
                  {visibleRecords.map(record => (
                    <HistoryCard
                      key={record.seriesId}
                      record={record}
                      width={cardWidth}
                      isEditing={isEditing}
                      selected={selectedIds.includes(record.seriesId)}
                      tab={tab}
                      onSelect={handleSelect}
                      onToggleFavorite={toggleFavorite}
                      onRemove={handleRemove}
                    />
                  ))}
                </LazyVGrid>
              )}
            </ScrollView>
          </VStack>
        )
      }}
    </GeometryReader>
  )
}
