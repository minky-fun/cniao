const FAVORITES_FILE_NAME = "hongguo-favorites.json"

export interface FavoriteRecord {
  seriesId: string
  title: string
  cover: string
  totalEpisodes: number
  savedAt: number
}

/** 读取独立收藏文件；损坏时直接报错，避免后续写入覆盖原收藏。 */
export function loadFavorites(): FavoriteRecord[] {
  const path = `${FileManager.appGroupDocumentsDirectory}/${FAVORITES_FILE_NAME}`
  if (!FileManager.existsSync(path)) return []
  const list: unknown = JSON.parse(FileManager.readAsStringSync(path))
  if (!Array.isArray(list) || list.some(item => !item ||
    typeof item.seriesId !== "string" || !item.seriesId ||
    typeof item.title !== "string" || typeof item.cover !== "string" ||
    !Number.isInteger(item.totalEpisodes) || item.totalEpisodes < 0 ||
    typeof item.savedAt !== "number" || !Number.isFinite(item.savedAt))) {
    throw new Error("收藏数据格式异常，未修改原有收藏")
  }
  return list.sort((a, b) => b.savedAt - a.savedAt)
}

/** 按剧集去重保存收藏，重复收藏保留最初时间，不受历史条数上限影响。 */
export function addFavorite(record: Omit<FavoriteRecord, "savedAt">): void {
  const list = loadFavorites()
  const existing = list.find(item => item.seriesId === record.seriesId)
  const saved = { ...record, savedAt: existing ? existing.savedAt : Date.now() }
  FileManager.writeAsStringSync(
    `${FileManager.appGroupDocumentsDirectory}/${FAVORITES_FILE_NAME}`,
    JSON.stringify([saved, ...list.filter(item => item.seriesId !== record.seriesId)]),
  )
}

/** 仅取消指定剧集的收藏，不读写观看进度或其他收藏。 */
export function removeFavorites(seriesIds: string[]): void {
  const list = loadFavorites().filter(item => !seriesIds.includes(item.seriesId))
  FileManager.writeAsStringSync(
    `${FileManager.appGroupDocumentsDirectory}/${FAVORITES_FILE_NAME}`,
    JSON.stringify(list),
  )
}
