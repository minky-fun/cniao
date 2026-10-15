// Loon 插件安装入口和 BoxJS 环境检测。
import { Section, Text, Button, useState, fetch } from "scripting"

type ModuleAction = {
  title: string
  action: () => Promise<boolean>
  systemImage: string
}

type ModuleSectionProps = {
  headerTitle?: string
  footerLines?: string[]
  actions: ModuleAction[]
}

/** 展示插件安装入口，链接打开失败时在当前页面提示。 */
export function ModuleSection({ headerTitle = "组件模块", footerLines = [], actions }: ModuleSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)
  const footerText = [...footerLines, ...(openError ? [openError] : [])].join("\n")

  return (
    <Section
      header={<Text font="body" fontWeight="semibold">{headerTitle}</Text>}
      footer={footerText ? <Text font="caption2" foregroundStyle="secondaryLabel">{footerText}</Text> : undefined}
    >
      <Button
        title={expanded ? "收起组件模块" : "展开组件模块"}
        systemImage={expanded ? "chevron.down" : "chevron.right"}
        foregroundStyle="secondaryLabel"
        action={/** 切换安装入口的展开状态。 */ () => setExpanded(!expanded)}
      />
      {expanded ? actions.map(item => (
        <Button
          key={item.title}
          title={item.title}
          systemImage={item.systemImage}
          action={/** 通过系统 URL 处理器打开 Loon，并处理失败结果。 */ async () => {
            setOpenError(null)
            try {
              if (!await item.action()) setOpenError("未能打开 Loon，请确认已安装后重试。")
            } catch {
              setOpenError("插件链接未能打开，请稍后重试。")
            }
          }}
        />
      )) : null}
    </Section>
  )
}

const MODULE_LINKS = {
  loonBoxJs: "https://kelee.one/Tool/Loon/Lpx/BoxJs.lpx",
  cainiaoHeaders: "https://raw.githubusercontent.com/minky-fun/loon-scripts/main/plugins/CainiaoHeaders.plugin",
}

/** 检查原有 BoxJS 请求头存储接口是否可访问，不记录返回的凭据。 */
export async function isBoxJsAvailable(boxJsUrl: string = "http://boxjs.com"): Promise<boolean> {
  try {
    const resp = await fetch(`${boxJsUrl.trim().replace(/\/$/, "")}/query/data/cainiao_pcs_headers_json`, {
      headers: { Accept: "application/json" }, timeout: 3,
    })
    if (!resp.ok) return false
    const json = await resp.json()
    return json !== null && typeof json === "object" && "val" in json
  } catch {
    return false
  }
}

/** 使用已配置的插件地址构建安装操作；Safari 为官方全局命名空间。 */
export function createModuleActions(boxJsAvailable: boolean): ModuleAction[] {
  const items: ModuleAction[] = []
  if (!boxJsAvailable) {
    items.push({
      title: "安装 Loon BoxJS 插件",
      systemImage: "shippingbox",
      /** 交由 Loon 导入 BoxJS 插件。 */
      action: () => Safari.openURL(`loon://import?plugin=${encodeURIComponent(MODULE_LINKS.loonBoxJs)}`),
    })
  }
  items.push({
    title: "安装 Loon CainiaoHeaders 插件",
    systemImage: "puzzlepiece.extension",
    /** 交由 Loon 导入现有菜鸟抓取插件。 */
    action: () => Safari.openURL(`loon://import?plugin=${encodeURIComponent(MODULE_LINKS.cainiaoHeaders)}`),
  })
  return items
}
