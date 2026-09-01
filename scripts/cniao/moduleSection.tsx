// moduleSection.tsx - Loon 插件安装组件
import { Section, Text, Button, useState, useEffect } from "scripting"

declare const Safari: any

type ModuleAction = {
  title: string
  action: () => void | Promise<void>
  systemImage?: string
  foregroundStyle?: any
}

type ModuleSectionProps = {
  headerTitle?: string
  footerLines?: string[]
  collapseStorageKey?: string
  actions: ModuleAction[]
}

export function ModuleSection(props: ModuleSectionProps) {
  const {
    headerTitle = "组件模块",
    footerLines = [],
    collapseStorageKey = "cniaoModuleSectionCollapsed",
    actions,
  } = props

  const footerText = footerLines.filter(Boolean).join("\n")

  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = async () => {
    setExpanded(!expanded)
  }

  return (
    <Section
      header={
        <Text font="body" fontWeight="semibold">
          {headerTitle}
        </Text>
      }
      footer={
        footerText ? (
          <Text font="caption2" foregroundStyle="secondaryLabel">
            {footerText}
          </Text>
        ) : undefined
      }
    >
      <Button
        title={expanded ? "收起组件模块" : "展开组件模块"}
        systemImage={expanded ? "chevron.down" : "chevron.right"}
        foregroundStyle="secondaryLabel"
        action={toggleExpanded}
      />

      {expanded
        ? actions.map((item, idx) => (
          <Button
            key={`${idx}-${item.title}`}
            title={item.title}
            systemImage={item.systemImage}
            foregroundStyle={item.foregroundStyle}
            action={item.action}
          />
        ))
        : undefined}
    </Section>
  )
}

// --- 菜鸟取件模块链接 ---
const MODULE_LINKS = {
  loonBoxJs: "https://kelee.one/Tool/Loon/Lpx/BoxJs.lpx",
  cainiaoHeaders: "https://raw.githubusercontent.com/minky-fun/loon-scripts/main/plugins/CainiaoHeaders.plugin",
}

function enc(u: string) {
  return encodeURIComponent(u)
}

function open(url: string) {
  return Safari.openURL(url)
}

// --- BoxJS 环境检测 ---
async function isBoxJsAvailable(): Promise<boolean> {
  try {
    // 用小组件实际用的 key 做探测，能读到就说明 BoxJS 在工作
    const resp = await Promise.race([
      fetch("http://boxjs.com/query/data/cainiao_pcs_headers_json", {
        headers: { Accept: "application/json" },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ])
    if (!resp.ok) return false
    const json = await resp.json()
    // val 存在（即使是空字符串）即视为 BoxJS 可用
    return json !== null && typeof json === "object" && "val" in json
  } catch {
    return false
  }
}

export function createModuleActions(boxJsAvailable: boolean): ModuleAction[] {
  const items: ModuleAction[] = []

  if (!boxJsAvailable) {
    items.push({
      title: "安装 Loon BoxJS 插件",
      systemImage: "shippingbox",
      action: async () => {
        await open(`loon://import?plugin=${enc(MODULE_LINKS.loonBoxJs)}`)
      },
    })
  }

  items.push({
    title: "安装 Loon CainiaoHeaders 插件",
    systemImage: "puzzlepiece.extension",
    action: async () => {
      await open(`loon://import?plugin=${enc(MODULE_LINKS.cainiaoHeaders)}`)
    },
  })

  return items
}
