import { Button, HStack, Image, Link, Menu, Script, ScrollView, Spacer, Text, VStack } from "scripting"
import { FILL_LEADING, PAGE_FRAME } from "./Common"

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

/** 按参考图展示圆角设置卡片，保留主题、缓存、历史和真实脚本信息。 */
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

  return (
    <VStack spacing={0} frame={PAGE_FRAME} background={SETTINGS_SURFACE} foregroundStyle="label">
      <Text font={18} fontWeight="semibold" frame={{ maxWidth: "infinity", height: 52 }}>设置</Text>
      <ScrollView scrollIndicator="hidden" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <VStack spacing={10} padding={{ horizontal: 16, top: 12, bottom: 28 }} frame={FILL_LEADING}>
          <VStack spacing={0} frame={FILL_LEADING} background={CARD_BACKGROUND}>
            <Button action={onOpenCache} buttonStyle="plain" frame={FILL_LEADING}>
              <SettingsRow title="清理缓存" disclosure />
            </Button>
          </VStack>

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
              <SettingsRow title="历史记录" disclosure />
            </Button>
          </VStack>

          <VStack alignment="leading" spacing={0} frame={FILL_LEADING} background={CARD_BACKGROUND}>
            <Text font={14} fontWeight="medium" padding={{ horizontal: 20, top: 18, bottom: 6 }} frame={FILL_LEADING}>
              关于红果
            </Text>
            <SettingsRow title="版本号" value={version} />
            {author ? <SettingsRow title="作者" value={author.name} /> : null}
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
