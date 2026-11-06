import { Navigation, NavigationDestination, NavigationStack, Script, VStack, useEffect, useObservable } from "scripting"
import { pruneOfflineCache } from "../core/mediaCache"
import { isPipPlaybackActive } from "../core/playbackState"
import { PAGE_FRAME, THEME_COLOR } from "./Common"
import { PlayerView } from "./PlayerView"
import { VideoFeedView } from "./VideoFeedView"

/** 仅承载刷剧与选集播放，导航离开首页时暂停推荐视频。 */
export function App() {
  const path = useObservable<string[]>([])
  const dismiss = Navigation.useDismiss()

  /** 清理本项目超出容量上限的缓存。 */
  useEffect(() => { pruneOfflineCache() }, [])

  /** 保留正在进行的画中画会话，普通关闭交由入口结束脚本。 */
  const close = async () => {
    if (isPipPlaybackActive() && Script.supportsMinimization()) {
      try {
        if (await Script.minimize()) return
      } catch (error) {
        console.warn("HG 刷剧最小化失败:", error)
      }
    }
    dismiss()
  }

  /** 使用推荐接口提供的真实剧集和视频标识打开选集播放页。 */
  const openPlayer = (seriesId: string, vid: string) => {
    path.setValue([`${seriesId}:${vid}`])
  }

  /** 解析内部导航路径，选集播放不接入 HG 的搜索、榜单或设置页面。 */
  const renderPlayer = (route: string) => {
    const [seriesId, vid] = route.split(":")
    return <PlayerView key={route} seriesId={seriesId} initialVid={vid} onClose={close} />
  }

  return (
    <NavigationStack path={path} tint={THEME_COLOR}>
      <VStack spacing={0} frame={PAGE_FRAME}
        navigationBarVisibility={path.value.length ? "visible" : "hidden"}
        navigationDestination={<NavigationDestination>{renderPlayer}</NavigationDestination>}
      >
        <VideoFeedView active={path.value.length === 0} onPlaySeries={openPlayer} onClose={close} />
      </VStack>
    </NavigationStack>
  )
}
