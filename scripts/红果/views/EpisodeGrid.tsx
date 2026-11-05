import {
  Button, HStack, Image, ScrollView, ScrollViewReader, TabView, Text, VStack,
  ZStack, useEffect, useMemo, useRef, useState, type ScrollViewProxy,
} from "scripting"
import { listCachedVideoIds, onCacheChanged } from "../core/mediaCache"
import { CONTENT_WIDTH, FILL_LEADING, THEME_COLOR } from "./Common"

const EPISODE_COLUMN_COUNT = 6
const EPISODE_GRID_SPACING = 8
const EPISODE_VISIBLE_ROWS = 3
const EPISODE_PAGE_SIZE = 15

/** 按指定数量分组，供选集分页和行布局使用。 */
export function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

/** 读取当前剧集列表中已经缓存的视频。 */
function filterCachedIds(vids: string[]): Set<string> {
  const cached = listCachedVideoIds()
  return new Set(vids.filter(vid => cached.has(vid)))
}

/** 每十五集分段，以六列方块展示选集并同步缓存和当前播放状态。 */
export function EpisodeGrid({ vids, onSelect, currentVid }: {
  vids: string[]
  onSelect: (vid: string, index: number) => void
  currentVid?: string
}) {
  const pages = useMemo(() => chunk(vids, EPISODE_PAGE_SIZE), [vids])
  const currentIndex = currentVid ? vids.indexOf(currentVid) : -1
  const [pageIndex, setPageIndex] = useState(currentIndex >= 0 ? Math.floor(currentIndex / EPISODE_PAGE_SIZE) : 0)
  const [cachedVidSet, setCachedVidSet] = useState<Set<string>>(() => filterCachedIds(vids))
  const rangeProxy = useRef<ScrollViewProxy>()

  useEffect(() => {
    setCachedVidSet(filterCachedIds(vids))
  }, [vids])

  useEffect(() => {
    return onCacheChanged((videoId, action) => {
      setCachedVidSet(prev => {
        const next = new Set(prev)
        if (action === "added") next.add(videoId)
        else if (action === "removed") next.delete(videoId)
        else if (action === "cleared") next.clear()
        return next
      })
    })
  }, [])

  useEffect(() => {
    setPageIndex(currentIndex >= 0 ? Math.floor(currentIndex / EPISODE_PAGE_SIZE) : 0)
  }, [currentVid, vids])

  useEffect(() => {
    rangeProxy.current?.scrollTo(`range-${pageIndex}`, "center")
  }, [pageIndex])

  const buttonWidth = Math.floor(
    (CONTENT_WIDTH - EPISODE_GRID_SPACING * (EPISODE_COLUMN_COUNT - 1)) / EPISODE_COLUMN_COUNT
  )
  const pageHeight = EPISODE_VISIBLE_ROWS * buttonWidth + (EPISODE_VISIBLE_ROWS - 1) * EPISODE_GRID_SPACING
  const pageViews = pages.map((page, index) => (
    <VStack
      key={index} tag={index} alignment="leading" spacing={EPISODE_GRID_SPACING}
      frame={{ width: CONTENT_WIDTH, height: pageHeight, alignment: "topLeading" }}
    >
      {chunk(page, EPISODE_COLUMN_COUNT).map((row, rowIndex) => (
        <HStack
          key={rowIndex} spacing={EPISODE_GRID_SPACING}
          frame={{ width: CONTENT_WIDTH, height: buttonWidth, alignment: "leading" }}
        >
          {row.map((vid, columnIndex) => {
            const episodeIndex = index * EPISODE_PAGE_SIZE + rowIndex * EPISODE_COLUMN_COUNT + columnIndex
            return (
              <EpisodeButton
                key={vid} episodeIndex={episodeIndex} isCurrent={vid === currentVid}
                isCached={cachedVidSet.has(vid)} width={buttonWidth}
                onSelect={() => onSelect(vid, episodeIndex)}
              />
            )
          })}
        </HStack>
      ))}
    </VStack>
  ))

  return (
    <VStack alignment="leading" spacing={18} frame={FILL_LEADING}>
      <ScrollViewReader>
        {proxy => {
          rangeProxy.current = proxy
          return (
            <ScrollView axes="horizontal" scrollIndicator="hidden">
              <HStack spacing={32}>
                {pages.map((_, index) => (
                  <Button
                    key={`range-${index}`}
                    title={`${index * EPISODE_PAGE_SIZE + 1}–${Math.min((index + 1) * EPISODE_PAGE_SIZE, vids.length)}`}
                    action={() => setPageIndex(index)} buttonStyle="plain" font={14}
                    foregroundStyle={index === pageIndex ? THEME_COLOR : "secondaryLabel"}
                  />
                ))}
              </HStack>
            </ScrollView>
          )
        }}
      </ScrollViewReader>
      {pages.length > 1 ? (
        <TabView
          tabIndex={pageIndex} onTabIndexChanged={setPageIndex}
          tabViewStyle="pageNeverDisplayIndex"
          frame={{ width: CONTENT_WIDTH, height: pageHeight }}
        >
          {pageViews}
        </TabView>
      ) : pageViews[0]}
    </VStack>
  )
}

/** 展示方形集数按钮，左上角为缓存状态，右上角标记当前播放。 */
function EpisodeButton({ episodeIndex, isCurrent, isCached, width, onSelect }: {
  episodeIndex: number
  isCurrent: boolean
  isCached: boolean
  width: number
  onSelect: () => void
}) {
  return (
    <ZStack
      alignment="topLeading" frame={{ width, height: width }}
      background={{
        style: isCurrent ? "rgba(250,119,5,0.14)" : "secondarySystemBackground",
        shape: { type: "rect", cornerRadius: 8 },
      }}
      onTapGesture={onSelect}
    >
      <Text
        font={14} foregroundStyle={isCurrent ? THEME_COLOR : "label"}
        frame={{ width, height: width, alignment: "center" }} lineLimit={1}
      >
        {String(episodeIndex + 1)}
      </Text>
      <Image
        systemName={isCached ? "checkmark.circle.fill" : "arrow.down.circle"} font={9}
        foregroundStyle={isCached ? THEME_COLOR : "tertiaryLabel"} padding={4}
      />
      {isCurrent ? (
        <ZStack alignment="topTrailing" frame={{ width, height: width }}>
          <Image systemName="waveform" font={10} foregroundStyle={THEME_COLOR} padding={5} />
        </ZStack>
      ) : null}
    </ZStack>
  )
}
