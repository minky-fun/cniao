import { Script } from "scripting"
import { PLAYBACK_CACHE_DIR } from "./config"

export type WebPlayerEvent =
  | { type: "bridgeReady" }
  | { type: "canplay" | "playing" | "ended" | "autoplayBlocked"; videoId: string }
  | { type: "fullscreen"; videoId: string; active: boolean }
  | { type: "error"; videoId: string; message: string }

/** 将随脚本分发的播放器资源放入缓存目录，只授权 WebView 读取该目录。 */
export async function prepareWebPlayerPage(instanceId: number): Promise<{ path: string; directory: string }> {
  const directory = `${FileManager.appGroupDocumentsDirectory}/${PLAYBACK_CACHE_DIR}`
  await FileManager.createDirectory(directory, true)
  for (const [source, destination] of [
    ["xgplayer-3.0.26.min.js", "xgplayer-3.0.26.min.js"],
    ["xgplayer-3.0.26.min.css", "xgplayer-3.0.26.min.css"],
    ["player.js", "hongguo-player.js"],
  ]) {
    const target = `${directory}/${destination}`
    if (source.startsWith("xgplayer-") && FileManager.existsSync(target)) continue
    const content = await FileManager.readAsString(`${Script.directory}/web/${source}`)
    await FileManager.writeAsString(target, content)
  }
  const path = `${directory}/player-${instanceId}.html`
  await FileManager.writeAsString(path, await FileManager.readAsString(`${Script.directory}/web/player.html`))
  return { path, directory }
}

/** 仅允许网页播放器读取与集数 ID 完全一致的缓存文件，拒绝外部 URL 和越界路径。 */
export function webPlayerSource(source: string, videoId: string): string {
  const directory = `${FileManager.appGroupDocumentsDirectory}/${PLAYBACK_CACHE_DIR}`
  if (!/^[0-9]{1,25}$/.test(videoId) || source !== `${directory}/${videoId}.mp4`) {
    throw new Error("西瓜播放器只能加载当前剧集的本地缓存")
  }
  return videoId + ".mp4"
}
