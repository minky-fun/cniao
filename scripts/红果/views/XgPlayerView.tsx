import { WebView, useEffect, useRef, useState } from "scripting"
import { prepareWebPlayerPage, webPlayerSource, type WebPlayerEvent } from "../core/webPlayer"

/** 在隔离的网页界面播放缓存，通过带集数标识的消息连接选集与自动连播。 */
export function XgPlayerView({ controller, source, videoId, instanceId, onEvent }: {
  controller: WebViewController
  source: string
  videoId: string
  instanceId: number
  onEvent: (event: WebPlayerEvent) => void
}) {
  const [bridgeReady, setBridgeReady] = useState(false)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent
  const videoIdRef = useRef(videoId)
  videoIdRef.current = videoId

  useEffect(() => {
    let cancelled = false
    let pagePath = ""
    const tasks = new Set<ReturnType<typeof setTimeout>>()

    /** 不在 WebKit 消息回调内同步操作播放器或宿主布局。 */
    const receive = (event?: WebPlayerEvent) => {
      if (!event || cancelled) return
      const task = setTimeout(() => {
        tasks.delete(task)
        if (cancelled) return
        if (event.type === "bridgeReady") {
          console.log("[player] 西瓜播放器页面已就绪")
          setBridgeReady(true)
        } else onEventRef.current(event)
      }, 0)
      tasks.add(task)
    }

    /** 注册消息通道后载入本地 HTML，资源与媒体都限定在缓存目录。 */
    async function initialize() {
      const page = await prepareWebPlayerPage(instanceId)
      pagePath = page.path
      if (cancelled) {
        if (FileManager.existsSync(pagePath)) FileManager.removeSync(pagePath)
        return
      }
      await controller.addScriptMessageHandler<WebPlayerEvent>("hongguoPlayer", receive)
      if (cancelled) return
      if (!await controller.loadFile(page.path, page.directory)) {
        throw new Error("西瓜播放器页面加载失败")
      }
    }
    initialize().catch(error => {
      if (!cancelled) onEventRef.current({ type: "error", videoId: videoIdRef.current,
        message: error instanceof Error ? error.message : String(error) })
    })

    return () => {
      cancelled = true
      for (const task of tasks) clearTimeout(task)
      tasks.clear()
      controller.dispose()
      if (pagePath && FileManager.existsSync(pagePath)) FileManager.removeSync(pagePath)
    }
  }, [controller, instanceId])

  useEffect(() => {
    if (!bridgeReady || !source || !videoId) return
    let cancelled = false
    /** 将精确的本地媒体文件名传给西瓜播放器，不重新读取整集视频到脚本内存。 */
    async function load() {
      const url = webPlayerSource(source, videoId)
      const accepted = await controller.evaluateJavaScript<boolean>(
        `return window.hongguoPlayer.load(${JSON.stringify({ url, videoId })})`
      )
      if (!accepted) throw new Error("西瓜播放器未接受视频源")
      if (!cancelled) console.log(`[player] 西瓜播放器已接收缓存 ${videoId}`)
    }
    load().catch(error => {
      if (!cancelled) onEventRef.current({ type: "error", videoId,
        message: error instanceof Error ? error.message : String(error) })
    })
    return () => { cancelled = true }
  }, [bridgeReady, controller, source, videoId])

  return <WebView controller={controller} frame={{ maxWidth: "infinity", maxHeight: "infinity" }} />
}
