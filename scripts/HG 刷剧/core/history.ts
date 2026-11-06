const MAX_HISTORY_ITEMS = 100

const HISTORY_FILE_NAME = "hongguo-feed-history.json"

export interface HistoryRecord {

  seriesId: string

  title: string

  cover: string

  totalEpisodes: number

  lastEpisodeIndex: number

  lastVid: string

  updatedAt: number
}

/** 返回与现有安装兼容的播放历史文件路径。 */
function getHistoryFilePath(): string {
  return `${FileManager.appGroupDocumentsDirectory}/${HISTORY_FILE_NAME}`
}

/** 从共享目录读取历史并按最近观看时间排序。 */
export function loadPlayHistory(): HistoryRecord[] {
  const filePath = getHistoryFilePath()
  if (!FileManager.existsSync(filePath)) {
    return []
  }

  try {
    const raw = FileManager.readAsStringSync(filePath)
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  } catch (error) {
    console.error("[history] 读取播放历史失败:", error)
    return []
  }
}

/** 将当前剧集移至历史首位，去重后最多保留一百条。 */
export function savePlayHistoryItem(record: Omit<HistoryRecord, "updatedAt">): void {
  const current = loadPlayHistory()

  const newRecord: HistoryRecord = {
    ...record,
    updatedAt: Date.now(),
  }

  const updatedList = [newRecord, ...current.filter(item => item.seriesId !== record.seriesId)]
    .slice(0, MAX_HISTORY_ITEMS)

  try {
    FileManager.writeAsStringSync(getHistoryFilePath(), JSON.stringify(updatedList))
  } catch (error) {
    console.error("[history] 写入播放历史失败:", error)
  }
}
