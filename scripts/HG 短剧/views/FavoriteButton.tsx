import { Button, useState } from "scripting"
import { addFavorite, loadFavorites, removeFavorites, type FavoriteRecord } from "../core/favorites"

/** 两页底部共用胶囊玻璃收藏按钮，出现时同步状态，写入成功后更新显示。 */
export function FavoriteButton({ record }: { record: Omit<FavoriteRecord, "savedAt"> }) {
  const [saved, setSaved] = useState(false)

  /** 返回页面时同步收藏状态，读取失败时保留数据并提示原因。 */
  const refresh = async () => {
    try {
      setSaved(loadFavorites().some(item => item.seriesId === record.seriesId))
    } catch (error) {
      await Dialog.alert({ title: "无法读取收藏", message: error instanceof Error ? error.message : String(error) })
    }
  }

  /** 基于磁盘上的最新状态切换收藏，避免其他页面修改后发生反向操作。 */
  const toggle = async () => {
    try {
      const exists = loadFavorites().some(item => item.seriesId === record.seriesId)
      if (exists) removeFavorites([record.seriesId])
      else addFavorite(record)
      setSaved(!exists)
    } catch (error) {
      await Dialog.alert({ title: "未能修改收藏", message: error instanceof Error ? error.message : String(error) })
    }
  }

  return <Button
    title={saved ? "已收藏" : "收藏"}
    systemImage={saved ? "star.fill" : "star"}
    action={toggle}
    onAppear={refresh}
    buttonStyle="glass"
    buttonBorderShape="capsule"
    controlSize="large"
    tint={saved ? "#FA7705" : undefined}
    padding={{ horizontal: 20, vertical: 10 }}
  />
}
