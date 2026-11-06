import { Image, ProgressView, Text, VStack } from "scripting"

const BRAND_COLOR = "#EE5C62"
export const THEME_COLOR = "#FA7705"
export const SERIES_SURFACE = { light: "#FFFFFF", dark: "#0E0E0E" } as const
export const FILL_LEADING = { maxWidth: "infinity", alignment: "leading" } as const
const FILL_CENTER = { maxWidth: "infinity", alignment: "center" } as const
export const PAGE_FRAME = { maxWidth: "infinity", maxHeight: "infinity", alignment: "topLeading" } as const
export const CONTENT_WIDTH = Device.screen.width - 32

/** 按现有尺寸绘制封面，缺少图片时展示占位。 */
export function CoverImage({
  url,
  width,
  height,
  cornerRadius = 8,
}: {
  url: string
  width: number
  height: number
  cornerRadius?: number
}) {
  const placeholder = (
    <VStack
      alignment="center"
      frame={{ width, height }}
      background="secondarySystemBackground"
    >
      <Image systemName="film" foregroundStyle="tertiaryLabel" />
    </VStack>
  )

  if (!url) {
    return (
      <VStack
        frame={{ width, height }}
        clipShape={{ type: "rect", cornerRadius }}
      >
        {placeholder}
      </VStack>
    )
  }

  return (
    <Image
      imageUrl={url}
      frame={{ width, height }}
      clipShape={{ type: "rect", cornerRadius }}
      resizable={true}
      scaleToFill={true}
      placeholder={placeholder}
    />
  )
}

/** 展示选集加载进度。 */
export function LoadingView({ text = "加载中…" }: { text?: string }) {
  return (
    <VStack alignment="center" spacing={10} padding={{ vertical: 40 }} frame={FILL_CENTER}>
      <ProgressView />
      <Text font="footnote" foregroundStyle="secondaryLabel">
        {text}
      </Text>
    </VStack>
  )
}

/** 展示播放错误和重试入口。 */
export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <VStack alignment="center" spacing={12} padding={{ vertical: 40, horizontal: 24 }} frame={FILL_CENTER}>
      <Image systemName="exclamationmark.triangle" font="title2" foregroundStyle="systemOrange" />
      <Text font="footnote" foregroundStyle="secondaryLabel" multilineTextAlignment="center">
        {message}
      </Text>
      <Text
        font="footnote"
        foregroundStyle="white"
        padding={{ horizontal: 16, vertical: 7 }}
        background={{ style: BRAND_COLOR, shape: { type: "rect", cornerRadius: 8 } }}
        onTapGesture={onRetry}
      >
        重试
      </Text>
    </VStack>
  )
}
