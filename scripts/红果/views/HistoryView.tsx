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
  useState,
} from "scripting"
import {
  clearPlayHistory,
  loadPlayHistory,
  removePlayHistoryItem,
  type HistoryRecord,
} from "../core/history"
import { CoverImage, EmptyView, FILL_LEADING, PAGE_FRAME } from "./Common"

const HISTORY_SURFACE = { light: "#FFFFFF", dark: "#131414" } as const
const FILTER_SURFACE = { light: "#F6F6F6", dark: "#202121" } as const
const ACCENT_COLOR = { light: "#B55200", dark: "#FA7705" } as const
const HISTORY_FILTERS = [
  { value: "all", title: "全部" },
  { value: "ongoing", title: "未看完" },
  { value: "last", title: "已看完" },
] as const
type HistoryFilter = typeof HISTORY_FILTERS[number]["value"]

/** 按参考图展示三列封面和观看集数，编辑时显示勾选状态，长按保留单条删除。 */
function HistoryCard({ record, width, isEditing, selected, onSelect, onRemove }: {
  record: HistoryRecord
  width: number
  isEditing: boolean
  selected: boolean
  onSelect: (record: HistoryRecord) => void
  onRemove: (record: HistoryRecord) => void
}) {
  const coverHeight = Math.round(width * 159 / 114)
  const currentEpisode = record.lastEpisodeIndex + 1

  return (
    <Button
      action={() => onSelect(record)}
      buttonStyle="plain"
      contextMenu={{
        menuItems: (
          <Group>
            <Button title="删除记录" systemImage="trash" role="destructive" action={() => onRemove(record)} />
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
        <Text font={12} foregroundStyle="secondaryLabel" lineLimit={1} frame={{ width, alignment: "leading" }}>
          {record.totalEpisodes > 0 ? `${currentEpisode}集/${record.totalEpisodes}集` : `看到第${currentEpisode}集`}
        </Text>
      </VStack>
    </Button>
  )
}

/** 以三列网格展示本地历史，支持按已记录集数筛选、续播及确认后删除。 */
export function HistoryView({ onPlaySeries }: {
  onPlaySeries: (seriesId: string, vid?: string) => void
}) {
  const [records, setRecords] = useState<HistoryRecord[]>(() => loadPlayHistory())
  const [filter, setFilter] = useState<HistoryFilter>("all")
  const [isEditing, setEditing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // 总集数未知的记录仅出现在“全部”，不推断是否已看到末集。
  const visibleRecords = records.filter(record => {
    if (filter === "all") return true
    if (record.totalEpisodes <= 0) return false
    const reachedLast = record.lastEpisodeIndex + 1 >= record.totalEpisodes
    return filter === "last" ? reachedLast : !reachedLast
  })

  /** 重新读取历史并清空旧勾选，避免删除或返回页面后保留过期选择。 */
  const refresh = () => {
    setRecords(loadPlayHistory())
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

  /** 编辑时切换勾选，浏览时从记录中的上次剧集继续播放。 */
  const handleSelect = (record: HistoryRecord) => {
    if (!isEditing) {
      onPlaySeries(record.seriesId, record.lastVid)
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

  /** 经过二次确认后删除单条历史，并同步刷新网格与勾选状态。 */
  const handleRemove = async (record: HistoryRecord) => {
    const confirmed = await Dialog.confirm({
      title: "删除历史",
      message: `确定从播放历史中移除「${record.title}」？`,
      confirmLabel: "删除",
      cancelLabel: "取消",
    })
    if (!confirmed) return
    removePlayHistoryItem(record.seriesId)
    refresh()
  }

  /** 仅删除当前已勾选的记录，确认前保留全部播放历史。 */
  const handleRemoveSelected = async () => {
    const selectedRecords = records.filter(record => selectedIds.includes(record.seriesId))
    if (selectedRecords.length === 0) return
    const confirmed = await Dialog.confirm({
      title: "删除所选历史",
      message: `确定删除选中的 ${selectedRecords.length} 条播放历史记录？`,
      confirmLabel: "删除",
      cancelLabel: "取消",
    })
    if (!confirmed) return
    for (const record of selectedRecords) removePlayHistoryItem(record.seriesId)
    refresh()
  }

  /** 确认清空的记录总数后删除全部历史。 */
  const handleClear = async () => {
    if (records.length === 0) return
    const confirmed = await Dialog.confirm({
      title: "清空历史",
      message: `确定清空全部 ${records.length} 条播放历史记录？`,
      confirmLabel: "清空",
      cancelLabel: "取消",
    })
    if (!confirmed) return
    clearPlayHistory()
    refresh()
  }

  return (
    <GeometryReader
      background={HISTORY_SURFACE}
      foregroundStyle="label"
      navigationTitle="播放历史"
      navigationBarTitleDisplayMode="inline"
      toolbarBackground={{ style: HISTORY_SURFACE, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar", "tabBar"] }}
      onAppear={refresh}
    >
      {({ size }) => {
        const cardWidth = (size.width - 32 - 16) / 3
        return (
          <VStack alignment="leading" spacing={0} frame={PAGE_FRAME}>
            <HStack spacing={12} padding={{ horizontal: 16, top: 8 }} frame={FILL_LEADING}>
              <ScrollView axes="horizontal" scrollIndicator="hidden" frame={{ maxWidth: "infinity", height: 44 }}>
                <HStack spacing={8}>
                  {HISTORY_FILTERS.map(item => (
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
                  ))}
                </HStack>
              </ScrollView>
              <Button action={toggleEditing} buttonStyle="plain" disabled={records.length === 0 && !isEditing}>
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
              <Button
                action={isEditing ? handleRemoveSelected : handleClear}
                buttonStyle="plain"
                role="destructive"
                disabled={isEditing ? selectedIds.length === 0 : records.length === 0}
              >
                <Text font={12} foregroundStyle={isEditing ? "systemRed" : "secondaryLabel"} frame={{ minHeight: 44 }}>
                  {isEditing ? "删除所选" : "清空历史"}
                </Text>
              </Button>
            </HStack>

            <ScrollView scrollIndicator="hidden" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
              {visibleRecords.length === 0 ? (
                <EmptyView text={records.length === 0 ? "暂无播放历史，去看看短剧吧" : "暂无符合筛选条件的记录"} />
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
                      onSelect={handleSelect}
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
