let pipPlaybackActive = false
let retainedPlayer: AVPlayer | null = null

/** 记录画中画状态，并在停止后释放保留的播放器。 */
export function setPipPlaybackActive(active: boolean): void {
  pipPlaybackActive = active
  if (!active && retainedPlayer) {
    try {
      retainedPlayer.dispose()
    } catch {}
    retainedPlayer = null
  }
}

/** 供根页面判断关闭时是否应最小化脚本。 */
export function isPipPlaybackActive(): boolean {
  return pipPlaybackActive
}

/** 保留离开播放页时仍在画中画中播放的实例。 */
export function retainPipPlayer(player: AVPlayer): void {
  if (retainedPlayer && retainedPlayer !== player) {
    try {
      retainedPlayer.dispose()
    } catch {}
  }
  retainedPlayer = player
}

/** 显式释放保留的播放器并清除画中画标记。 */
export function releaseRetainedPlayer(): void {
  if (retainedPlayer) {
    try {
      retainedPlayer.dispose()
    } catch {}
    retainedPlayer = null
  }
  pipPlaybackActive = false
}
