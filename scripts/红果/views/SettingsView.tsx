import { Button, HStack, Image, Link, Menu, Script, ScrollView, Spacer, Text, Toggle, VStack, useEffect, useState } from "scripting"
import { getSleepDeadline, setSleepTimer } from "../core/sleepTimer"
import { FILL_LEADING, PAGE_FRAME } from "./Common"
import {
  getAutoCacheEnabled,
  getAutoCacheEpisodeCount,
  setAutoCacheEnabled,
  setAutoCacheEpisodeCount,
} from "../core/mediaCache"

export type ThemeMode = "system" | "light" | "dark"

const SETTINGS_SURFACE = { light: "#F6F6F6", dark: "#131414" } as const
const CARD_BACKGROUND = {
  style: { light: "#FFFFFF", dark: "#1D1E1E" },
  shape: { type: "rect", cornerRadius: 12 },
} as const
const THEME_LABELS: Record<ThemeMode, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
}

/** 统一设置行样式，并让整行矩形区域参与点击检测，包含文字与箭头之间的空白。 */
function SettingsRow({ title, value, disclosure = false }: {
  title: string
  value?: string
  disclosure?: boolean
}) {
  return (
    <HStack
      spacing={8}
      padding={{ horizontal: 20 }}
      frame={{ maxWidth: "infinity", minHeight: 52 }}
      contentShape="rect"
    >
      <Text font={14} foregroundStyle="label">{title}</Text>
      <Spacer />
      {value ? <Text font={14} foregroundStyle="secondaryLabel" lineLimit={2} multilineTextAlignment="trailing">{value}</Text> : null}
      {disclosure ? <Image systemName="chevron.right" font={12} foregroundStyle="tertiaryLabel" /> : null}
    </HStack>
  )
}

/** 展示圆角设置卡片，并保存自动缓存开关及集数的用户选择。 */
export function SettingsView({
  theme,
  themeError,
  onThemeChange,
  onOpenCache,
  onOpenHistory,
  onExit,
}: {
  theme: ThemeMode
  themeError: string
  onThemeChange: (theme: ThemeMode) => void
  onOpenCache: () => void
  onOpenHistory: () => void
  onExit: () => void
}) {
  const { version, author, contributors } = Script.metadata
  const [autoCache, setAutoCache] = useState(getAutoCacheEnabled)
  const [autoCacheCount, setAutoCacheCount] = useState(getAutoCacheEpisodeCount)
  const [autoCacheError, setAutoCacheError] = useState("")
  const [sleepRemaining, setSleepRemaining] = useState(0)

  /** 按绝对截止时间更新剩余分钟，切换页面不会重置倒计时。 */
  const refreshSleepRemaining = () => {
    setSleepRemaining(Math.max(0, Math.ceil((getSleepDeadline() - Date.now()) / 60000)))
  }

  // 设置页重新出现时读取当前截止时间，并清理界面专用刷新计时器。
  useEffect(() => {
    refreshSleepRemaining()
    const timer = setInterval(refreshSleepRemaining, 1000)
    return () => clearInterval(timer)
  }, [])

  /** 应用预设时长或取消本次定时停止。 */
  const changeSleepTimer = (minutes: number) => {
    setSleepTimer(minutes)
    refreshSleepRemaining()
  }

  /** 输入自定义分钟数；取消或输入无效时保留当前倒计时。 */
  const customizeSleepTimer = async () => {
    const input = await Dialog.prompt({
      title: "定时关闭",
      message: "多少分钟后停止播放？请输入 1 至 1440 之间的整数。",
      keyboardType: "numberPad",
      confirmLabel: "开始计时",
      cancelLabel: "取消",
    })
    if (input == null) return
    try {
      const minutes = Number(input.trim())
      if (minutes === 0) throw new Error("请输入 1 至 1440 之间的整数分钟")
      changeSleepTimer(minutes)
    } catch (error) {
      await Dialog.alert({ title: "未能设置定时关闭", message: error instanceof Error ? error.message : String(error) })
    }
  }

  /** 保存自动缓存偏好，保存失败时保持原开关状态并提示原因。 */
  const changeAutoCache = (enabled: boolean) => {
    try {
      setAutoCacheEnabled(enabled)
      setAutoCache(enabled)
      setAutoCacheError("")
    } catch (error) {
      setAutoCacheError(error instanceof Error ? error.message : String(error))
    }
  }

  /** 输入并保存后续自动缓存集数，取消或保存失败时保留原值。 */
  const changeAutoCacheCount = async () => {
    try {
      const input = await Dialog.prompt({
        title: "自动缓存集数",
        message: "请输入不小于 1 的整数。建议设置 3-5 集，适量即可；过多会增加流量和存储占用，实际缓存仍受缓存上限限制。",
        defaultValue: String(autoCacheCount),
        keyboardType: "numberPad",
        selectAll: true,
        confirmLabel: "保存",
        cancelLabel: "取消",
      })
      if (input == null) return
      const value = Number(input.trim())
      setAutoCacheEpisodeCount(value)
      setAutoCacheCount(value)
    } catch (error) {
      await Dialog.alert({
        title: "未能保存自动缓存集数",
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return (
    <VStack
      spacing={0}
      frame={PAGE_FRAME}
      background={
        <VStack
          frame={PAGE_FRAME}
          background={SETTINGS_SURFACE}
          ignoresSafeArea={{ regions: "container" }}
        />
      }
      foregroundStyle="label"
      toolbarBackground={{ style: SETTINGS_SURFACE, bars: ["navigationBar", "tabBar"] }}
      toolbarBackgroundVisibility={{ visibility: "visible", bars: ["navigationBar", "tabBar"] }}
    >
      <Text font={18} fontWeight="semibold" frame={{ maxWidth: "infinity", height: 52 }}>设置</Text>
      <ScrollView scrollIndicator="hidden" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <VStack spacing={10} padding={{ horizontal: 16, top: 12, bottom: 28 }} frame={FILL_LEADING}>
          <VStack spacing={0} frame={FILL_LEADING} background={CARD_BACKGROUND}>
            <Menu label={<SettingsRow title="显示主题" value={THEME_LABELS[theme]} disclosure />} buttonStyle="plain" frame={FILL_LEADING}>
              <Button title="跟随系统" systemImage={theme === "system" ? "checkmark" : undefined} action={() => onThemeChange("system")} />
              <Button title="浅色" systemImage={theme === "light" ? "checkmark" : undefined} action={() => onThemeChange("light")} />
              <Button title="深色" systemImage={theme === "dark" ? "checkmark" : undefined} action={() => onThemeChange("dark")} />
            </Menu>
            {themeError ? (
              <Text font={12} foregroundStyle="red" padding={{ horizontal: 20, bottom: 12 }} frame={FILL_LEADING}>
                {themeError}
              </Text>
            ) : null}
            <Button action={onOpenHistory} buttonStyle="plain" frame={FILL_LEADING}>
              <SettingsRow title="播放历史" disclosure />
            </Button>
            <Menu label={<SettingsRow title="定时关闭" value={sleepRemaining > 0 ? `剩余 ${sleepRemaining} 分钟` : "未开启"} disclosure />} buttonStyle="plain" frame={FILL_LEADING}>
              {[15, 30, 45, 60, 90].map(minutes => (
                <Button key={minutes} title={`${minutes} 分钟后停止播放`} action={() => changeSleepTimer(minutes)} />
              ))}
              <Button title="自定义时长" action={customizeSleepTimer} />
              <Button title="取消定时关闭" action={() => changeSleepTimer(0)} />
            </Menu>
            <Text font={12} foregroundStyle="secondaryLabel" padding={{ horizontal: 20, bottom: 12 }} frame={FILL_LEADING}>
              设置后立即计时，到时暂停播放并保留页面；仅本次运行有效。
            </Text>
          </VStack>

          <VStack spacing={0} frame={FILL_LEADING} background={CARD_BACKGROUND}>
            <Toggle
              value={autoCache}
              onChanged={changeAutoCache}
              toggleStyle="switch"
              padding={{ horizontal: 20 }}
              frame={{ maxWidth: "infinity", minHeight: 52 }}
            >
              <Text font={14} foregroundStyle="label">自动缓存</Text>
            </Toggle>
            <Button action={changeAutoCacheCount} buttonStyle="plain" frame={FILL_LEADING}>
              <SettingsRow title="自动缓存集数" value={`${autoCacheCount} 集`} disclosure />
            </Button>
            <Text font={12} foregroundStyle="secondaryLabel" padding={{ horizontal: 20, bottom: 12 }} frame={FILL_LEADING}>
              {`开启后自动缓存后续 ${autoCacheCount} 集，受缓存上限限制；关闭后仅加载当前播放集。建议设置 3-5 集，适量即可，不宜过多。`}
            </Text>
            {autoCacheError ? (
              <Text font={12} foregroundStyle="red" padding={{ horizontal: 20, bottom: 12 }} frame={FILL_LEADING}>
                {autoCacheError}
              </Text>
            ) : null}
            <Button action={onOpenCache} buttonStyle="plain" frame={FILL_LEADING}>
              <SettingsRow title="清理缓存" disclosure />
            </Button>
          </VStack>

          <VStack alignment="leading" spacing={0} frame={FILL_LEADING} background={CARD_BACKGROUND}>
            <Text font={14} fontWeight="medium" padding={{ horizontal: 20, top: 18, bottom: 6 }} frame={FILL_LEADING}>
              关于HG 短剧
            </Text>
            <SettingsRow title="版本号" value={version} />
            {author?.homepage ? (
              <Link url={author.homepage} buttonStyle="plain" frame={FILL_LEADING}>
                <SettingsRow title="作者主页" disclosure />
              </Link>
            ) : null}
            {contributors?.length ? (
              <SettingsRow title="贡献者" value={contributors.map(person => person.name).join("、")} />
            ) : null}
          </VStack>
          <Button action={onExit} buttonStyle="plain" role="destructive" frame={FILL_LEADING}>
            <Text
              font={14}
              foregroundStyle="systemRed"
              frame={{ maxWidth: "infinity", minHeight: 52 }}
              background={CARD_BACKGROUND}
            >
              关闭并退出
            </Text>
          </Button>
        </VStack>
      </ScrollView>
    </VStack>
  )
}
