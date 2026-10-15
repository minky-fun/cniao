import { AppIntentManager, AppIntentProtocol, Widget } from "scripting"

const SMALL_PAGE_INDEX_KEY = "cniaoSmallPageIndex"

// 注册刷新意图，供 widget 内的刷新按钮直接触发重新拉取时间线。
export const RefreshCainiaoIntent = AppIntentManager.register({
  name: "RefreshCainiaoIntent",
  protocol: AppIntentProtocol.AppIntent,
  /** 执行组件按钮操作后重新请求时间线。 */
  perform: async (): Promise<void> => {
    Widget.reloadUserWidgets()
  },
})

// 切换到下一条 small 卡片，并触发 widget 刷新。
export const ShowNextCainiaoItemIntent = AppIntentManager.register({
  name: "ShowNextCainiaoItemIntent",
  protocol: AppIntentProtocol.AppIntent,
  /** 执行组件按钮操作后重新请求时间线。 */
  perform: async (): Promise<void> => {
    const savedIndex = Storage.get<number>(SMALL_PAGE_INDEX_KEY) ?? 0
    const currentIndex = Number.isSafeInteger(savedIndex) && savedIndex >= 0 && savedIndex < Number.MAX_SAFE_INTEGER ? savedIndex : 0
    Storage.set(SMALL_PAGE_INDEX_KEY, currentIndex + 1)
    Widget.reloadUserWidgets()
  },
})
