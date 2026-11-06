let pipPlaybackActive = false
let retainedPlayer: VideoPlaybackController | null = null

/** 更新画中画状态，结束后释放离开播放页时保留的控制器。 */
export function setPipPlaybackActive(active: boolean): void {
  pipPlaybackActive = active
  if (!active && retainedPlayer) {
    try {
      void retainedPlayer.dispose().catch(error => console.warn("[播放器] 释放失败:", error))
    } catch {}
    retainedPlayer = null
  }
}

/** 供根页面判断关闭时是否应最小化脚本。 */
export function isPipPlaybackActive(): boolean {
  return pipPlaybackActive
}

/** 暂存仍在画中画播放的控制器，避免提前销毁媒体。 */
export function retainPipPlayer(player: VideoPlaybackController): void {
  if (retainedPlayer && retainedPlayer !== player) {
    try {
      void retainedPlayer.dispose().catch(error => console.warn("[播放器] 释放失败:", error))
    } catch {}
  }
  retainedPlayer = player
}

/** 显式结束保留的画中画会话并清理引用。 */
export function releaseRetainedPlayer(): void {
  if (retainedPlayer) {
    try {
      void retainedPlayer.dispose().catch(error => console.warn("[播放器] 释放失败:", error))
    } catch {}
    retainedPlayer = null
  }
  pipPlaybackActive = false
}
