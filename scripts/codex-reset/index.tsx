import {
  Button,
  Link,
  List,
  Navigation,
  NavigationStack,
  Script,
  Section,
  Text,
  Widget,
} from "scripting"
import type { WidgetFamily } from "scripting"

/** Opens a preview for the selected home-screen widget family. */
async function previewWidget(family: WidgetFamily): Promise<void> {
  await Widget.preview({ family })
}

/** Opens the small widget preview. */
function previewSmallWidget(): Promise<void> {
  return previewWidget("systemSmall")
}

/** Opens the medium widget preview. */
function previewMediumWidget(): Promise<void> {
  return previewWidget("systemMedium")
}

/** Opens the large widget preview. */
function previewLargeWidget(): Promise<void> {
  return previewWidget("systemLarge")
}

/** Renders the script's preview and data-source page. */
function MainView() {
  return (
    <NavigationStack>
      <List navigationTitle="Codex Reset">
        <Section
          header={<Text>小组件预览</Text>}
          footer={<Text font="caption2" foregroundStyle="secondaryLabel">添加桌面小组件后，数据每 15 分钟从 Codex Resets 公共 API 更新。</Text>}
        >
          <Button title="预览小号组件" action={previewSmallWidget} />
          <Button title="预览中号组件" action={previewMediumWidget} />
          <Button title="预览大号组件" action={previewLargeWidget} />
        </Section>
        <Section header={<Text>数据来源</Text>}>
          <Link url="https://codex-resets.com/">打开 Codex Resets</Link>
          <Link url="https://codex-resets.com/api/docs">查看公共 API 文档</Link>
        </Section>
      </List>
    </NavigationStack>
  )
}

/** Presents the tool page and releases script resources after dismissal. */
async function run(): Promise<void> {
  await Navigation.present({ element: <MainView /> })
  Script.exit()
}

run()
