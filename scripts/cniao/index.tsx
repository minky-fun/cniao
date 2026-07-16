import {
  Navigation,
  Form,
  Section,
  TextField,
  Button,
  useState,
  Text,
  VStack,
  Spacer,
  Script,
} from "scripting"

type CainiaoSettings = {
  boxJsUrl: string
  refreshInterval: number
}

const SETTINGS_KEY = "cniaoSettings"
const VERSION = "1.1.0"
const DEFAULT_SETTINGS: CainiaoSettings = {
  boxJsUrl: "http://boxjs.com",
  refreshInterval: 15,
}

function getInitialSettings(): CainiaoSettings {
  const saved = Storage.get<Partial<CainiaoSettings>>(SETTINGS_KEY) ?? {}
  return {
    boxJsUrl: saved.boxJsUrl?.trim() || DEFAULT_SETTINGS.boxJsUrl,
    refreshInterval: typeof saved.refreshInterval === "number" && saved.refreshInterval > 0
      ? saved.refreshInterval : DEFAULT_SETTINGS.refreshInterval,
  }
}

function parseRefreshInterval(value: string, fallback: number): number {
  const v = parseInt(value, 10)
  return Number.isNaN(v) || v <= 0 ? fallback : v
}

function SettingsPage() {
  const dismiss = Navigation.useDismiss()
  const init = getInitialSettings()
  const [boxJsUrl, setBoxJsUrl] = useState(init.boxJsUrl)
  const [refreshInterval, setRefreshInterval] = useState(String(init.refreshInterval))

  function handleSave(): void {
    Storage.set(SETTINGS_KEY, {
      boxJsUrl: boxJsUrl.trim() || DEFAULT_SETTINGS.boxJsUrl,
      refreshInterval: parseRefreshInterval(refreshInterval, DEFAULT_SETTINGS.refreshInterval),
    })
    dismiss()
  }

  return (
    <VStack>
      <Form>
        <Section
          title="BoxJs 配置"
          footer={<Text>用于读取会话令牌（x-sid, Cookie, x-mini-wua）。默认 http://boxjs.com</Text>}
        >
          <TextField title="BoxJs 地址" value={boxJsUrl} prompt="请输入 BoxJs 地址" onChanged={setBoxJsUrl} />
        </Section>

        <Section
          title="刷新设置"
          footer={<Text>小组件自动刷新间隔，单位分钟。</Text>}
        >
          <TextField title="刷新间隔" value={refreshInterval} prompt="请输入分钟数" onChanged={setRefreshInterval} />
        </Section>

        <Button title="保存设置" action={handleSave} />
      </Form>
      <Spacer />
      <VStack alignment="center" spacing={4} padding={{ bottom: 10 }}>
        <Text font="caption2" foregroundStyle="secondaryLabel">cniao 设置</Text>
        <Text font="caption2" foregroundStyle="secondaryLabel">Version {VERSION}</Text>
      </VStack>
    </VStack>
  )
}

function presentSettingsPage(): void {
  Navigation.present({ element: <SettingsPage /> }).then(() => Script.exit())
}

Script.onResume(() => presentSettingsPage())
presentSettingsPage()
