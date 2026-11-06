import { Button, HStack, Image, LazyVStack, ProgressView, ScrollView, Text, VStack, useEffect, useRef, useState } from "scripting"
import { fetchSearch, fetchSuggest } from "../core/api"
import type { SearchData, SuggestWord } from "../core/types"
import {
  EmptyView,
  ErrorView,
  FILL_CENTER,
  FILL_LEADING,
  PAGE_FRAME,
  SeriesGrid,
  SkeletonGrid,
} from "./Common"

const SUGGEST_DEBOUNCE_MS = 300

/** 通过原生搜索栏展示联想词与分页结果，并隔离不同关键词的请求。 */
export function SearchView({
  onSelectSeries,
}: {
  onSelectSeries: (seriesId: string) => void
}) {
  const [keyword, setKeyword] = useState("")
  const [submittedKeyword, setSubmittedKeyword] = useState("")
  const [suggestions, setSuggestions] = useState<SuggestWord[]>([])
  const [result, setResult] = useState<SearchData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState("")
  // 同步锁阻止一帧内重复触底，页码和关键词用于拒绝旧底部回调。
  const request = useRef({ id: 0, query: "", page: 0, loading: false, failed: false })

  useEffect(() => () => {
    request.current.id += 1
    request.current.loading = true
  }, [])

  useEffect(() => {
    const trimmed = keyword.trim()
    if (trimmed.length === 0) {
      setSuggestions([])
      return
    }

    let active = true
    const timer = setTimeout(() => {
      fetchSuggest(trimmed)
        .then(items => {
          if (active) setSuggestions(items)
        })
        .catch(() => {
          if (active) setSuggestions([])
        })
    }, SUGGEST_DEBOUNCE_MS)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [keyword])

  /** 首次搜索重置列表，后续分页去重追加；只有当前请求可以修改状态。 */
  const search = async (text: string, page = 1) => {
    const trimmed = text.trim()
    if (trimmed.length === 0) return
    const append = page > 1
    if (append && (request.current.loading || request.current.query !== trimmed || request.current.page !== page - 1)) return
    const requestId = ++request.current.id
    request.current.loading = true
    request.current.failed = false

    if (append) {
      setIsLoadingMore(true)
      setLoadMoreError("")
    } else {
      request.current.query = trimmed
      request.current.page = 0
      setKeyword(trimmed)
      setSubmittedKeyword(trimmed)
      setSuggestions([])
      setResult(null)
      setIsLoading(true)
      setErrorMessage("")
      setIsLoadingMore(false)
      setLoadMoreError("")
    }

    try {
      const data = await fetchSearch(trimmed, page)
      if (request.current.id !== requestId) return
      request.current.page = data.pageNum
      setResult(previous => {
        const searchList = append && previous ? [...previous.searchList] : []
        const seen = new Set(searchList.map(item => item.video_data!.series_id))
        for (const item of data.searchList) {
          const seriesId = item.video_data!.series_id
          if (seen.has(seriesId)) continue
          seen.add(seriesId)
          searchList.push(item)
        }
        return { ...data, searchList, isRelevant: searchList.length > 0 }
      })
    } catch (error) {
      if (request.current.id !== requestId) return
      const message = error instanceof Error ? error.message : String(error)
      request.current.failed = true
      if (append) setLoadMoreError(message)
      else setErrorMessage(message)
    } finally {
      if (request.current.id === requestId) {
        request.current.loading = false
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }

  const showSuggestions = suggestions.length > 0 && keyword.trim() !== submittedKeyword

  /** 仅为已提交的关键词加载下一页，分页失败后暂停自动请求并允许显式重试。 */
  const loadMore = (retry = false) => {
    if (!result || !result.hasMore || result.pageNum >= result.totalPages || isLoading || isLoadingMore ||
        keyword.trim() !== submittedKeyword || (!retry && (loadMoreError || request.current.failed))) return
    void search(submittedKeyword, result.pageNum + 1)
  }

  /** 清空搜索并使正在进行的首屏或分页请求失效。 */
  const clearSearch = () => {
    request.current.id += 1
    request.current.query = ""
    request.current.page = 0
    request.current.loading = false
    request.current.failed = false
    setKeyword("")
    setResult(null)
    setSubmittedKeyword("")
    setSuggestions([])
    setErrorMessage("")
    setIsLoading(false)
    setIsLoadingMore(false)
    setLoadMoreError("")
  }

  /** 原生搜索栏清空时同时重置结果，使旧请求失效。 */
  const changeKeyword = (value: string) => {
    if (value.length === 0) clearSearch()
    else setKeyword(value)
  }

  /** 使用原生搜索键提交当前关键词。 */
  const submitSearch = () => { void search(keyword) }

  return (
    <VStack
      alignment="leading"
      spacing={0}
      frame={PAGE_FRAME}
      navigationTitle="搜索"
      navigationBarTitleDisplayMode="inline"
      navigationBarVisibility="visible"
      searchable={{
        value: keyword,
        onChanged: changeKeyword,
        prompt: "搜索短剧或演员",
      }}
      onSubmit={{ triggers: "search", action: submitSearch }}
    >
      <ScrollView key={`search-list:${submittedKeyword}`}>
        <LazyVStack alignment="leading" spacing={0} frame={FILL_LEADING}>
          {showSuggestions ? (
            <VStack alignment="leading" spacing={0} frame={FILL_LEADING}>
              {suggestions.map((word, index) => (
                <Button
                  key={`${word.keyword}-${index}`}
                  action={() => { void search(word.name) }}
                  buttonStyle="plain"
                  frame={FILL_LEADING}
                >
                  <HStack
                    spacing={8}
                    alignment="center"
                    padding={{ horizontal: 16, vertical: 11 }}
                    frame={FILL_LEADING}
                    contentShape="rect"
                  >
                    <Image systemName="magnifyingglass" font="caption" foregroundStyle="tertiaryLabel" />
                    <Text font="subheadline" foregroundStyle="label" lineLimit={1} frame={FILL_LEADING}>
                      {word.name}
                    </Text>
                    <Image systemName="arrow.up.left" font="caption" foregroundStyle="tertiaryLabel" />
                  </HStack>
                </Button>
              ))}
            </VStack>
          ) : null}

          {!showSuggestions ? (
            <>
              {isLoading ? (
                <SkeletonGrid />
              ) : null}

              {!isLoading && errorMessage && !result ? (
                <ErrorView message={errorMessage} onRetry={() => search(submittedKeyword)} />
              ) : null}
              {!isLoading && !errorMessage && result && !result.isRelevant ? (
                <EmptyView text={`没有找到与「${result.query}」相关的短剧`} />
              ) : null}

              {!isLoading && !errorMessage && result && result.isRelevant ? (
                <VStack alignment="leading" spacing={12} frame={FILL_LEADING} padding={{ bottom: 20 }}>
                  <Text
                    font="caption2"
                    foregroundStyle="tertiaryLabel"
                    padding={{ horizontal: 16 }}
                    frame={FILL_LEADING}
                  >
                    {`「${result.query}」相关短剧 · 已加载 ${result.searchList.length} 条，共命中 ${result.totalCount} 条`}
                  </Text>

                  <SeriesGrid
                    seriesList={result.searchList.map(item => item.video_data!).filter(Boolean)}
                    onSelect={series => onSelectSeries(series.series_id)}
                  />
                </VStack>
              ) : null}

              {!isLoading && result?.isRelevant ? (
                <VStack
                  key={`search-footer:${result.query}:${result.pageNum}`}
                  spacing={8}
                  frame={FILL_CENTER}
                  padding={{ top: 8, bottom: 28, horizontal: 16 }}
                  onScrollVisibilityChange={{
                    threshold: 0.1,
                    onChanged: visible => { if (visible) loadMore() },
                  }}
                >
                  {loadMoreError ? (
                    <Button
                      title={`${loadMoreError}，点此重试`}
                      action={() => loadMore(true)}
                      buttonStyle="plain"
                      font="caption"
                      foregroundStyle="systemOrange"
                    />
                  ) : isLoadingMore || result.hasMore ? (
                    <HStack spacing={8}>
                      <ProgressView />
                      <Text font="caption" foregroundStyle="secondaryLabel">正在加载更多…</Text>
                    </HStack>
                  ) : (
                    <Text font="caption" foregroundStyle="secondaryLabel">已全部加载</Text>
                  )}
                </VStack>
              ) : null}

              {!isLoading && !errorMessage && !result ? (
                <EmptyView text="输入关键词，搜索你想看的短剧" />
              ) : null}
            </>
          ) : null}
        </LazyVStack>
      </ScrollView>
    </VStack>
  )
}
