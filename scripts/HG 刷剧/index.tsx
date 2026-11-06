import { Navigation, Script } from "scripting"
import { App } from "./views/App"

/** 独立呈现刷剧页面，关闭后结束脚本，最小化时保留播放会话。 */
async function run() {
  if (Script.supportsMinimization()) Script.enableMinimize()
  await Navigation.present({ element: <App />, modalPresentationStyle: "fullScreen" })
  Script.exit()
}

/** 启动失败时记录错误并释放脚本运行上下文。 */
run().catch(error => {
  console.error("HG 刷剧启动失败:", error)
  Script.exit()
})
