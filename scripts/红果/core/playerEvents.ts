export interface PlayerEventHandlers {
  onReady: () => void
  onStatus: (status: TimeControlStatus) => void
  onError: (message: string) => void
  onEnded: () => void
}

/** 将系统播放器事件推迟到下一轮脚本任务，避免回调内再次同步调用原生播放器。 */
export function bindPlayerEvents(player: AVPlayer, handlers: PlayerEventHandlers): () => void {
  const timers = new Set<ReturnType<typeof setTimeout>>()
  let disposed = false

  /** 跟踪排队的事件，使页面关闭后不再执行播放、切集或界面更新。 */
  function enqueue(action: () => void): void {
    if (disposed) return
    const timer = setTimeout(() => {
      timers.delete(timer)
      if (!disposed) action()
    }, 0)
    timers.add(timer)
  }

  player.onReadyToPlay = () => enqueue(handlers.onReady)
  player.onTimeControlStatusChanged = status => enqueue(() => handlers.onStatus(status))
  player.onError = message => enqueue(() => handlers.onError(message))
  player.onEnded = () => enqueue(handlers.onEnded)

  // 先注销事件并取消任务，再由调用者释放播放器。
  return () => {
    disposed = true
    player.onReadyToPlay = undefined
    player.onTimeControlStatusChanged = undefined
    player.onError = undefined
    player.onEnded = undefined
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
  }
}
