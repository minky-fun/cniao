import {
  Navigation,
  NavigationStack,
  List,
  Section,
  Text,
  TextField,
  Picker,
  Button,
  useState,
  useEffect,
  Script,
  ZStack,
  Rectangle,
} from "scripting"
import type { Color, DynamicShapeStyle, KeywordPoint } from "scripting"
import { ModuleSection, createModuleActions, isBoxJsAvailable } from "./moduleSection"

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

// ─── 液态玻璃背景 ───

/** 按小时切换渐变色，模拟一天中的光线变化 */
function getGlassBackground(): DynamicShapeStyle {
  const h = new Date().getHours()

  // 清晨 (5-7) 、白天 (7-17)、黄昏 (17-19)、夜间 (19-5)
  const isMorning = h >= 5 && h < 7
  const isDay = h >= 7 && h < 17
  const isDusk = h >= 17 && h < 19

  const gradients: Record<string, { light: Color[]; dark: Color[]; startPoint: KeywordPoint; endPoint: KeywordPoint }> = {
    morning: {
      light: ["#fdf2e0", "#e8e2f0", "#dce8f2"],
      dark: ["#1a1225", "#1c1e38", "#162540"],
      startPoint: "topLeading",
      endPoint: "bottomTrailing",
    },
    day: {
      light: ["#e8edf0", "#dbe5e3", "#ece3d8"],
      dark: ["#080914", "#11172a", "#20162d"],
      startPoint: "topLeading",
      endPoint: "bottomTrailing",
    },
    dusk: {
      light: ["#ecdcca", "#e0d9d2", "#d7e0e8"],
      dark: ["#171321", "#33213a", "#4a2b30"],
      startPoint: "topLeading",
      endPoint: "bottomTrailing",
    },
    night: {
      light: ["#e8ecee", "#dbe3e2", "#eee0d3"],
      dark: ["#141727", "#1f2940", "#342532"],
      startPoint: "topLeading",
      endPoint: "bottomTrailing",
    },
  }

  const key = isMorning ? "morning" : isDay ? "day" : isDusk ? "dusk" : "night"
  const g = gradients[key]

  return {
    light: { colors: g.light, startPoint: g.startPoint, endPoint: g.endPoint },
    dark: { colors: g.dark, startPoint: g.startPoint, endPoint: g.endPoint },
  }
}

function GlassBackground() {
  return (
    <Rectangle
      fill={getGlassBackground()}
      ignoresSafeArea={true}
      allowsHitTesting={false}
    />
  )
}

// ─── 设置逻辑 ───

function getInitialSettings(): CainiaoSettings {
  const saved = Storage.get<Partial<CainiaoSettings>>(SETTINGS_KEY) ?? {}
  return {
    boxJsUrl: saved.boxJsUrl?.trim() || DEFAULT_SETTINGS.boxJsUrl,
    refreshInterval: typeof saved.refreshInterval === "number" && saved.refreshInterval > 0
      ? saved.refreshInterval : DEFAULT_SETTINGS.refreshInterval,
  }
}

function SettingsView() {
  const init = getInitialSettings()

  const [boxJsUrl, setBoxJsUrl] = useState(init.boxJsUrl)
  const [refreshInterval, setRefreshInterval] = useState(init.refreshInterval)

  // 自动检测 BoxJS 环境是否已安装
  const [boxJsDetected, setBoxJsDetected] = useState<boolean | null>(null)
  useEffect(() => {
    isBoxJsAvailable().then(setBoxJsDetected)
  }, [])

  const handleSave = () => {
    const newSettings: CainiaoSettings = {
      boxJsUrl: boxJsUrl.trim() || DEFAULT_SETTINGS.boxJsUrl,
      refreshInterval: refreshInterval,
    }
    Storage.set(SETTINGS_KEY, newSettings)
    Script.exit()
  }

  const handleReset = () => {
    setBoxJsUrl(DEFAULT_SETTINGS.boxJsUrl)
    setRefreshInterval(DEFAULT_SETTINGS.refreshInterval)
    Storage.set(SETTINGS_KEY, DEFAULT_SETTINGS)
    Script.exit()
  }

  return (
    <NavigationStack>
      <ZStack alignment="bottom" frame={{ maxWidth: "infinity", maxHeight: "infinity" }}>
        <GlassBackground />
        <List
          navigationTitle="菜鸟取件配置"
          navigationBarTitleDisplayMode="inline"
          scrollContentBackground="hidden"
          toolbar={{
            topBarLeading: [
              <Button title="关闭" action={() => Script.exit()} />
            ],
            topBarTrailing: [
              <Button title="保存" fontWeight="bold" action={handleSave} />
            ]
          }}
        >
          <ModuleSection
            headerTitle="组件模块"
            footerLines={[
              "使用前请完成以下步骤：",
              boxJsDetected ? "1）已检测到 BoxJS 环境 ✓" : "1）安装 Loon BoxJS 插件（BoxJS 运行环境）",
              "2）安装 Loon CainiaoHeaders 插件（抓取请求头）",
              "3）打开菜鸟 App 触发数据抓取",
            ]}
            actions={createModuleActions(boxJsDetected ?? false)}
          />

          <Section
            header={<Text>⚠️ 重要说明</Text>}
            footer={
              <Text font="caption2" foregroundStyle="secondaryLabel">
                菜鸟 App 的会话令牌（sid）经过加密处理，具有时效性，无法永久有效。当小组件显示"连接异常"时，请打开菜鸟 App 刷新登录态，然后点击小组件上的刷新按钮即可恢复。
              </Text>
            }
          />

          <Section
            header={<Text>BoxJS 配置</Text>}
            footer={
              <Text font="caption2" foregroundStyle="secondaryLabel">
                用于读取会话令牌（x-sid、Cookie、x-mini-wua 等），默认 http://boxjs.com
              </Text>
            }
          >
            <TextField
              title="BoxJS 地址"
              value={boxJsUrl}
              prompt="http://boxjs.com"
              onChanged={setBoxJsUrl}
            />
          </Section>

          <Section
            header={<Text>刷新设置</Text>}
            footer={
              <Text font="caption2" foregroundStyle="secondaryLabel">
                小组件自动刷新包裹数据的时间间隔，推荐 15-30 分钟
              </Text>
            }
          >
            <Picker
              title="自动刷新间隔"
              value={refreshInterval}
              onChanged={(v: number) => setRefreshInterval(v)}
              pickerStyle="menu"
            >
              <Text tag={15}>15 分钟（推荐）</Text>
              <Text tag={30}>30 分钟</Text>
              <Text tag={60}>1 小时</Text>
              <Text tag={180}>3 小时</Text>
            </Picker>
          </Section>

          <Section header={<Text>关于</Text>}>
            <Button
              title="恢复默认设置"
              role="destructive"
              action={handleReset}
              frame={{ maxWidth: "infinity", alignment: "center" }}
            />
          </Section>
        </List>
        <Text
          font="caption2"
          foregroundStyle="secondaryLabel"
          frame={{ maxWidth: "infinity", alignment: "center" }}
          padding={{ bottom: 16 }}
        >
          cniao 菜鸟取件 · Version {VERSION}
        </Text>
      </ZStack>
    </NavigationStack>
  )
}

if (Script.env === "index") {
  Navigation.present({
    element: <SettingsView />,
    modalPresentationStyle: "overFullScreen",
  })
}
