import {
  HStack,
  Image,
  TabView,
  Text,
  VStack,
  useEffect,
  useMemo,
  useState,
} from "scripting"
import { listCachedVideoIds, onCacheChanged } from "../core/mediaCache"
import { CONTENT_WIDTH, FILL_LEADING, THEME_COLOR } from "./Common"

const EPISODE_COLUMN_COUNT = 5
const EPISODE_GRID_SPACING = 8

const EPISODE_BUTTON_HEIGHT = 34

const EPISODE_VISIBLE_ROWS = 3

const EPISODE_PAGE_SIZE = EPISODE_COLUMN_COUNT * EPISODE_VISIBLE_ROWS

const MAX_PAGE_DOTS = 12

export function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

function filterCachedIds(vids: string[]): Set<string> {
  const cached = listCachedVideoIds()
  const relevant = new Set<string>()
  for (const vid of vids) {
    if (cached.has(vid)) relevant.add(vid)
  }
  return relevant
}

export function EpisodeGrid({
  vids,
  onSelect,
  currentVid,
}: {
  vids: string[]
  onSelect: (vid: string, index: number) => void
  currentVid?: string
}) {

  const pages = useMemo(() => chunk(vids, EPISODE_PAGE_SIZE), [vids])
  const hasPaging = pages.length > 1

  const initialPage = (() => {
    if (!currentVid) return 0
    const idx = vids.indexOf(currentVid)
    return idx >= 0 ? Math.floor(idx / EPISODE_PAGE_SIZE) : 0
  })()

  const [pageIndex, setPageIndex] = useState(initialPage)

  const [cachedVidSet, setCachedVidSet] = useState<Set<string>>(() => filterCachedIds(vids))

  useEffect(() => {
    setCachedVidSet(filterCachedIds(vids))
  }, [vids])

  useEffect(() => {
    return onCacheChanged((videoId, action) => {
      setCachedVidSet(prev => {
        const next = new Set(prev)
        if (action === "added") {
          next.add(videoId)
        } else if (action === "removed") {
          next.delete(videoId)
        } else if (action === "cleared") {
          next.clear()
        }
        return next
      })
    })
  }, [])

  useEffect(() => {
    if (!currentVid) return
    const idx = vids.indexOf(currentVid)
    if (idx >= 0) {
      const targetPage = Math.floor(idx / EPISODE_PAGE_SIZE)
      if (targetPage !== pageIndex) setPageIndex(targetPage)
    }
  }, [currentVid])

  const gridWidth = CONTENT_WIDTH

  const buttonWidth = Math.floor(
    (gridWidth - EPISODE_GRID_SPACING * (EPISODE_COLUMN_COUNT - 1)) / EPISODE_COLUMN_COUNT
  )

  const pageHeight =
    EPISODE_VISIBLE_ROWS * EPISODE_BUTTON_HEIGHT + (EPISODE_VISIBLE_ROWS - 1) * EPISODE_GRID_SPACING

  return (
    <VStack alignment="leading" spacing={8} frame={FILL_LEADING}>
      {hasPaging ? (
        <TabView
          tabIndex={pageIndex}
          onTabIndexChanged={setPageIndex}
          tabViewStyle="pageNeverDisplayIndex"
          frame={{ width: gridWidth, height: pageHeight }}
        >
          {pages.map((page, pageIndexValue) => (
            <VStack
              key={pageIndexValue}
              tag={pageIndexValue}
              alignment="leading"
              spacing={EPISODE_GRID_SPACING}
              frame={{ width: gridWidth, height: pageHeight, alignment: "topLeading" }}
            >
              {chunk(page, EPISODE_COLUMN_COUNT).map((row, rowIndex) => (
                <HStack
                  key={rowIndex}
                  spacing={EPISODE_GRID_SPACING}
                  alignment="center"
                  frame={{ width: gridWidth, height: EPISODE_BUTTON_HEIGHT }}
                >
                  {row.map((vid, columnIndex) => {
                    const episodeIndex =
                      pageIndexValue * EPISODE_PAGE_SIZE +
                      rowIndex * EPISODE_COLUMN_COUNT +
                      columnIndex
                    const isCached = cachedVidSet.has(vid)
                    const needsPrepare = !isCached
                    return (
                      <EpisodeButton
                        key={vid}
                        episodeIndex={episodeIndex}
                        isCurrent={vid === currentVid}
                        needsPrepare={needsPrepare}
                        width={buttonWidth}
                        onSelect={() => onSelect(vid, episodeIndex)}
                      />
                    )
                  })}
                </HStack>
              ))}
            </VStack>
          ))}
        </TabView>
      ) : (
        <VStack
          alignment="leading"
          spacing={EPISODE_GRID_SPACING}
          frame={{ width: gridWidth, alignment: "topLeading" }}
        >
          {chunk(pages[0] ?? [], EPISODE_COLUMN_COUNT).map((row, rowIndex) => (
            <HStack
              key={rowIndex}
              spacing={EPISODE_GRID_SPACING}
              alignment="center"
              frame={{ width: gridWidth, height: EPISODE_BUTTON_HEIGHT }}
            >
              {row.map((vid, columnIndex) => {
                const episodeIndex = rowIndex * EPISODE_COLUMN_COUNT + columnIndex
                const isCached = cachedVidSet.has(vid)
                const needsPrepare = !isCached
                return (
                  <EpisodeButton
                    key={vid}
                    episodeIndex={episodeIndex}
                    isCurrent={vid === currentVid}
                    needsPrepare={needsPrepare}
                    width={buttonWidth}
                    onSelect={() => onSelect(vid, episodeIndex)}
                  />
                )
              })}
            </HStack>
          ))}
        </VStack>
      )}

      {hasPaging ? <PageIndicator pageIndex={pageIndex} totalPages={pages.length} /> : null}
    </VStack>
  )
}

/** 展示单集与缓存状态，当前播放集使用主题色背景。 */
function EpisodeButton({
  episodeIndex,
  isCurrent,
  needsPrepare,
  width,
  onSelect,
}: {
  episodeIndex: number
  isCurrent: boolean
  needsPrepare: boolean
  width: number
  onSelect: () => void
}) {
  return (
    <HStack
      spacing={2}
      alignment="center"
      frame={{ width, height: EPISODE_BUTTON_HEIGHT }}
      background={{
        style: isCurrent ? THEME_COLOR : "secondarySystemBackground",
        shape: { type: "rect", cornerRadius: 7 },
      }}
      onTapGesture={onSelect}
    >
      <Text
        font="footnote"
        foregroundStyle={isCurrent ? "white" : needsPrepare ? "secondaryLabel" : "label"}
        lineLimit={1}
      >
        {String(episodeIndex + 1)}
      </Text>
      {needsPrepare ? (
        <Image
          systemName="arrow.down.circle"
          font="caption2"
          foregroundStyle={isCurrent ? "white" : "tertiaryLabel"}
        />
      ) : null}
    </HStack>
  )
}

/** 展示选集页码，并用主题色标记当前分页。 */
function PageIndicator({ pageIndex, totalPages }: { pageIndex: number; totalPages: number }) {
  return (
    <HStack spacing={8} alignment="center" frame={FILL_LEADING}>
      <Text font="caption2" foregroundStyle="secondaryLabel" lineLimit={1}>
        {`第 ${pageIndex + 1}/${totalPages} 页`}
      </Text>
      {totalPages <= MAX_PAGE_DOTS ? (
        <HStack spacing={4} alignment="center">
          {Array.from({ length: totalPages }, (_, index) => (
            <VStack
              key={index}
              frame={{ width: index === pageIndex ? 14 : 6, height: 6 }}
              background={index === pageIndex ? THEME_COLOR : "tertiaryLabel"}
              clipShape={{ type: "rect", cornerRadius: 3 }}
            />
          ))}
        </HStack>
      ) : null}
    </HStack>
  )
}
