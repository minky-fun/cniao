import { HStack, Image, ScrollView, Text, TextField, VStack, useEffect, useObservable, useState } from "scripting"
import { fetchSearch, fetchSuggest } from "../core/api"
import type { SearchData, SuggestWord } from "../core/types"
import {
  BRAND_COLOR,
  EmptyView,
  ErrorView,
  FILL_LEADING,
  PAGE_FRAME,
  SeriesGrid,
  SkeletonGrid,
} from "./Common"

const SUGGEST_DEBOUNCE_MS = 300

/** 展示搜索输入、联想词和网站返回的短剧结果。 */
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
  const searchRequest = useObservable(0)

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

  /** 提交关键词，只接受最近一次搜索的响应。 */
  const search = (text: string) => {
    const trimmed = text.trim()
    if (trimmed.length === 0) return
    const requestId = searchRequest.value + 1
    searchRequest.setValue(requestId)

    setKeyword(trimmed)
    setSubmittedKeyword(trimmed)
    setSuggestions([])
    setResult(null)
    setIsLoading(true)
    setErrorMessage("")

    fetchSearch(trimmed)
      .then(data => {
        if (searchRequest.value === requestId) setResult(data)
      })
      .catch(error => {
        if (searchRequest.value === requestId) {
          setErrorMessage(error instanceof Error ? error.message : String(error))
        }
      })
      .finally(() => {
        if (searchRequest.value === requestId) setIsLoading(false)
      })
  }

  const showSuggestions = suggestions.length > 0 && keyword.trim() !== submittedKeyword

  return (
    <VStack alignment="leading" spacing={0} frame={PAGE_FRAME}>

      <HStack spacing={8} alignment="center" padding={{ horizontal: 16, vertical: 10 }}>
        <HStack
          spacing={6}
          alignment="center"
          padding={{ horizontal: 10, vertical: 7 }}
          frame={{ maxWidth: "infinity" }}
          background={{ style: "secondarySystemBackground", shape: { type: "rect", cornerRadius: 10 } }}
        >
          <Image systemName="magnifyingglass" font="footnote" foregroundStyle="tertiaryLabel" />
          <TextField
            title=""
            value={keyword}
            onChanged={setKeyword}
            prompt="搜索短剧或演员"
            submitLabel="search"
            onSubmit={() => search(keyword)}
            frame={{ maxWidth: "infinity" }}
          />
          {keyword.length > 0 ? (
            <Image
              systemName="xmark.circle.fill"
              font="footnote"
              foregroundStyle="tertiaryLabel"
              onTapGesture={() => {
                searchRequest.setValue(searchRequest.value + 1)
                setKeyword("")
                setResult(null)
                setSubmittedKeyword("")
                setSuggestions([])
                setErrorMessage("")
                setIsLoading(false)
              }}
            />
          ) : null}
        </HStack>

        <Text font="footnote" foregroundStyle={BRAND_COLOR} onTapGesture={() => search(keyword)}>
          搜索
        </Text>
      </HStack>

      <ScrollView>

        {showSuggestions ? (
          <VStack alignment="leading" spacing={0} frame={FILL_LEADING}>
            {suggestions.map((word, index) => (
              <HStack
                key={`${word.keyword}-${index}`}
                spacing={8}
                alignment="center"
                padding={{ horizontal: 16, vertical: 11 }}
                frame={FILL_LEADING}
                onTapGesture={() => search(word.name)}
              >
                <Image systemName="magnifyingglass" font="caption" foregroundStyle="tertiaryLabel" />
                <Text font="subheadline" lineLimit={1} frame={FILL_LEADING}>
                  {word.name}
                </Text>
                <Image systemName="arrow.up.left" font="caption" foregroundStyle="tertiaryLabel" />
              </HStack>
            ))}
          </VStack>
        ) : null}

        {!showSuggestions ? (
          <VStack alignment="leading" spacing={0} frame={FILL_LEADING}>
            {isLoading ? (
              <ScrollView>
                <VStack alignment="leading" spacing={12} frame={FILL_LEADING}>
                  <SkeletonGrid />
                </VStack>
              </ScrollView>
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
                  {`「${result.query}」相关短剧 · 服务端仅返回前 ${result.searchList.length} 条，共命中 ${result.totalCount} 条`}
                </Text>

                <SeriesGrid
                  seriesList={result.searchList.map(item => item.video_data!).filter(Boolean)}
                  onSelect={series => onSelectSeries(series.series_id)}
                />
              </VStack>
            ) : null}

            {!isLoading && !errorMessage && !result ? (
              <EmptyView text="输入关键词，搜索你想看的短剧" />
            ) : null}
          </VStack>
        ) : null}
      </ScrollView>
    </VStack>
  )
}
