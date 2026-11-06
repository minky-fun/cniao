export function formatCount(value: number | string | undefined): string {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num) || num <= 0) return "0"

  if (num >= 100_000_000) return `${trimZero(num / 100_000_000)}亿`
  if (num >= 10_000) return `${trimZero(num / 10_000)}万`
  return String(Math.floor(num))
}

function trimZero(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function formatEpisodeLabel(seriesName: string, episodeIndex: number): string {
  const name = seriesName || "未知剧集"
  return episodeIndex >= 0 ? `${name} 第 ${episodeIndex + 1} 集` : name
}

export function formatBytes(bytes: number | undefined): string {
  const value = Number(bytes ?? 0)
  if (!Number.isFinite(value) || value <= 0) return "0 B"

  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`
  if (value >= 1024) return `${Math.round(value / 1024)} KB`
  return `${Math.round(value)} B`
}
