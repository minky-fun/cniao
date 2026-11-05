import {
  Button,
  Navigation,
  NavigationDestination,
  NavigationStack,
  Script,
  Tab,
  TabView,
  VStack,
  ZStack,
  useEffect,
  useObservable,
  useState,
} from "scripting"
import { CacheView } from "./CacheView"
import { CategoryView } from "./CategoryView"
import { DetailView } from "./DetailView"
import { HistoryView } from "./HistoryView"
import { HomeView } from "./HomeView"
import { PlayerView } from "./PlayerView"
import { RankView } from "./RankView"
import { SearchView } from "./SearchView"
import { SettingsView, type ThemeMode } from "./SettingsView"
import { pruneOfflineCache } from "../core/mediaCache"
import { isPipPlaybackActive } from "../core/playbackState"

/** 生成剧集详情的导航路径。 */
function routeDetail(seriesId: string): string {
  return `detail:${seriesId}`
}

/** 生成包含可选续播集数的播放路径。 */
function routePlayer(seriesId: string, vid?: string): string {
  return `player:${seriesId}:${vid ?? ""}`
}

const CACHE_ROUTE = "cache"
const HISTORY_ROUTE = "history"
const SEARCH_ROUTE = "search"
const THEME_STORAGE_KEY = "hongguo-theme"

type Route =
  | { kind: "detail"; seriesId: string }
  | { kind: "player"; seriesId: string; vid?: string }
  | { kind: "cache" }
  | { kind: "history" }
  | { kind: "search" }

/** 将导航路径解析为现有页面参数。 */
export function decodeRoute(raw: string): Route | null {
  if (!raw) return null

  if (raw === CACHE_ROUTE) return { kind: "cache" }
  if (raw === HISTORY_ROUTE) return { kind: "history" }
  if (raw === SEARCH_ROUTE) return { kind: "search" }

  const [kind, seriesId, vid] = raw.split(":")
  if (!seriesId) return null

  if (kind === "detail") return { kind: "detail", seriesId }
  if (kind === "player") return { kind: "player", seriesId, vid: vid || undefined }

  return null
}

/** 按路径构建搜索、详情、播放和数据管理页面。 */
function buildRoute(route: Route | null, push: (raw: string) => void, onClose: () => void) {
  if (!route) return <VStack />

  if (route.kind === "search") {
    return <SearchView onSelectSeries={seriesId => push(routeDetail(seriesId))} />
  }
  if (route.kind === "cache") return <CacheView />
  if (route.kind === "history") {
    return <HistoryView onPlaySeries={(seriesId, vid) => push(routePlayer(seriesId, vid))} />
  }

  /** 从当前页面打开指定剧集。 */
  const goPlayer = (seriesId: string, vid?: string) => push(routePlayer(seriesId, vid))
  /** 打开已有的缓存管理页面。 */
  const goCache = () => push(CACHE_ROUTE)
  /** 打开已有的播放历史页面。 */
  const goHistory = () => push(HISTORY_ROUTE)

  if (route.kind === "detail") {
    return (
      <DetailView
        seriesId={route.seriesId}
        onPlayEpisode={goPlayer}
        onOpenCache={goCache}
        onOpenHistory={goHistory}
      />
    )
  }

  return (
    <PlayerView
      seriesId={route.seriesId}
      initialVid={route.vid}
      onOpenCache={goCache}
      onOpenHistory={goHistory}
      onClose={onClose}
    />
  )
}

/** 为每个标签维护独立的导航栈。 */
function TabStack({
  title,
  render,
  onClose,
}: {
  title: string
  render: (push: (raw: string) => void) => JSX.Element
  onClose: () => void
}) {
  const path = useObservable<string[]>([])
  /** 在当前标签内追加导航路径。 */
  const push = (raw: string) => path.setValue([...path.value, raw])

  return (
    <NavigationStack path={path}>

      <ZStack
        navigationTitle={title}
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          cancellationAction: <Button title="关闭" action={onClose} />,
          topBarTrailing: [
            <Button
              title=""
              systemImage="clock.arrow.circlepath"
              action={() => push(HISTORY_ROUTE)}
            />,
            <Button title="缓存" action={() => push(CACHE_ROUTE)} />,
            <Button title="搜索" systemImage="magnifyingglass" action={() => push(SEARCH_ROUTE)} />,
          ],
        }}
        navigationDestination={
          <NavigationDestination>{raw => buildRoute(decodeRoute(raw), push, onClose)}</NavigationDestination>
        }
      >
        {render(push)}
      </ZStack>
    </NavigationStack>
  )
}

/** 展示主标签页，并在整个脚本界面应用已保存的主题。 */
export function App() {
  const selection = useObservable(0)
  const dismiss = Navigation.useDismiss()
  // 首次使用跟随系统，重新启动时恢复用户选择。
  const [theme, setTheme] = useState<ThemeMode>(() => Storage.get<ThemeMode>(THEME_STORAGE_KEY) ?? "system")
  const [themeError, setThemeError] = useState("")

  /** 保存主题后更新界面；保存失败时保留当前选择并提示原因。 */
  const changeTheme = (value: ThemeMode) => {
    try {
      if (!Storage.set(THEME_STORAGE_KEY, value)) throw new Error("主题设置保存失败，请重试")
      setTheme(value)
      setThemeError("")
    } catch (error) {
      setThemeError(error instanceof Error ? error.message : String(error))
    }
  }

  useEffect(() => {
    const removed = pruneOfflineCache()
    if (removed > 0) console.log(`[cache] 启动清理淘汰 ${removed} 集`)
  }, [])

  /** 画中画播放时优先最小化，否则关闭并结束脚本。 */
  const close = async () => {
    if (isPipPlaybackActive() && Script.supportsMinimization()) {
      try {
        const minimized = await Script.minimize()
        if (minimized) return
      } catch (error) {
        console.warn("[App] Script.minimize 失败，回退到普通关闭:", error)
      }
    }

    dismiss()
    setTimeout(() => Script.exit(), 800)
  }

  return (
    <TabView selection={selection} preferredColorScheme={theme === "system" ? undefined : theme}>
      <Tab title="首页" systemImage="house.fill" value={0}>
        <TabStack
          title="红果剧场"
          onClose={close}
          render={push => <HomeView onSelectSeries={seriesId => push(routeDetail(seriesId))} />}
        />
      </Tab>

      <Tab title="榜单" systemImage="chart.bar.fill" value={1}>
        <TabStack
          title="排行榜"
          onClose={close}
          render={push => (
            <RankView onSelectSeries={(seriesId, vid) => push(routePlayer(seriesId, vid))} />
          )}
        />
      </Tab>

      <Tab title="分类" systemImage="square.grid.2x2.fill" value={2}>
        <TabStack
          title="分类"
          onClose={close}
          render={push => <CategoryView onSelectSeries={seriesId => push(routeDetail(seriesId))} />}
        />
      </Tab>

      <Tab title="设置" systemImage="gearshape.fill" value={4}>
        <TabStack
          title="设置"
          onClose={close}
          render={push => (
            <SettingsView
              theme={theme}
              themeError={themeError}
              onThemeChange={changeTheme}
              onOpenCache={() => push(CACHE_ROUTE)}
              onOpenHistory={() => push(HISTORY_ROUTE)}
            />
          )}
        />
      </Tab>
    </TabView>
  )
}
