let deadline = 0
let expired = false
let timer: ReturnType<typeof setTimeout> | undefined
let activePlayer: AVPlayer | null = null

/** 返回本次运行的定时停止时间；重新启动脚本不会恢复旧倒计时。 */
export function getSleepDeadline(): number {
  return deadline
}

/** 到期后先阻止后续自动播放，再暂停当前播放器（包括保留的画中画播放器）。 */
function expireSleepTimer(): void {
  if (!deadline || Date.now() < deadline) return
  deadline = 0
  expired = true
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
  if (activePlayer) {
    try {
      activePlayer.pause()
    } catch (error) {
      console.warn("[定时关闭] 暂停播放器失败:", error)
    }
  }
}

/** 设置或取消倒计时，重新选择时从当前时间开始计时。 */
export function setSleepTimer(minutes: number): void {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
    throw new Error("请输入 1 至 1440 之间的整数分钟")
  }
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
  expired = false
  deadline = minutes === 0 ? 0 : Date.now() + minutes * 60000
  if (deadline) timer = setTimeout(expireSleepTimer, minutes * 60000)
}

/** 记录当前播放器；保留画中画时继续让倒计时控制该实例。 */
export function attachSleepPlayer(player: AVPlayer): void {
  activePlayer = player
  expired = false
  expireSleepTimer()
}

/** 普通退出播放页时解除已销毁播放器的引用。 */
export function detachSleepPlayer(player: AVPlayer): void {
  if (activePlayer === player) activePlayer = null
}

/** 在每个异步自动播放入口复核截止时间，避免加载或切集跨越到期时刻。 */
export function canAutoPlay(): boolean {
  expireSleepTimer()
  return !expired
}

/** 用户主动选集时允许继续观看，但保留尚未到期的倒计时。 */
export function resumeAfterSleep(): void {
  expireSleepTimer()
  expired = false
}
