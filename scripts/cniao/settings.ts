// 设置页与小组件共享配置定义；保留原有存储键以兼容已安装版本。
export type CainiaoSettings = { boxJsUrl: string; refreshInterval: number }
export const SETTINGS_KEY = "cniaoSettings"
export const VERSION = "1.1.4"
export const DEFAULT_SETTINGS: CainiaoSettings = { boxJsUrl: "http://boxjs.com", refreshInterval: 15 }

/** 读取已有配置并检查刷新间隔是否为有限正数。 */
export function getSettings(): CainiaoSettings {
  const saved = Storage.get<Partial<CainiaoSettings>>(SETTINGS_KEY) ?? {}
  return {
    boxJsUrl: saved.boxJsUrl?.trim() || DEFAULT_SETTINGS.boxJsUrl,
    refreshInterval: typeof saved.refreshInterval === "number" && Number.isFinite(saved.refreshInterval) && saved.refreshInterval > 0
      ? saved.refreshInterval : DEFAULT_SETTINGS.refreshInterval,
  }
}

