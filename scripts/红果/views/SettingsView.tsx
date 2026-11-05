import { Button, HStack, Link, List, Picker, Script, Section, Spacer, Text } from "scripting"

export type ThemeMode = "system" | "light" | "dark"

/** 管理全局主题，提供缓存与历史入口，并展示当前安装脚本的信息。 */
export function SettingsView({
  theme,
  themeError,
  onThemeChange,
  onOpenCache,
  onOpenHistory,
}: {
  theme: ThemeMode
  themeError: string
  onThemeChange: (theme: ThemeMode) => void
  onOpenCache: () => void
  onOpenHistory: () => void
}) {
  const { version, author, contributors } = Script.metadata

  return (
    <List navigationTitle="设置" navigationBarTitleDisplayMode="inline" listStyle="insetGroup">
      <Section
        header={<Text>外观</Text>}
        footer={
          <Text foregroundStyle={themeError ? "red" : "secondaryLabel"}>
            {themeError || "主题立即应用到所有页面，并在下次启动时保留。"}
          </Text>
        }
      >
        <Picker
          title="显示主题"
          systemImage="circle.lefthalf.filled"
          value={theme}
          onChanged={(value: string) => onThemeChange(value as ThemeMode)}
          pickerStyle="menu"
        >
          <Text tag="system">跟随系统</Text>
          <Text tag="light">浅色</Text>
          <Text tag="dark">深色</Text>
        </Picker>
      </Section>

      <Section header={<Text>数据管理</Text>}>
        <Button title="缓存管理" systemImage="internaldrive" action={onOpenCache} />
        <Button title="历史记录" systemImage="clock.arrow.circlepath" action={onOpenHistory} />
      </Section>

      <Section header={<Text>关于红果</Text>}>
        <HStack>
          <Text>版本号</Text>
          <Spacer />
          <Text foregroundStyle="secondaryLabel">{version}</Text>
        </HStack>
        {author ? (
          <HStack>
            <Text>作者</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel">{author.name}</Text>
          </HStack>
        ) : null}
        {author?.homepage ? <Link url={author.homepage}>作者主页</Link> : null}
        {contributors?.length ? (
          <HStack>
            <Text>贡献者</Text>
            <Spacer />
            <Text foregroundStyle="secondaryLabel">{contributors.map(person => person.name).join("、")}</Text>
          </HStack>
        ) : null}
      </Section>
    </List>
  )
}
