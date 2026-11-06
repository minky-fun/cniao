/** 按真实剧名和集序生成缓存标签。 */
export function formatEpisodeLabel(seriesName: string, episodeIndex: number): string {
  const name = seriesName || "未知剧集"
  return episodeIndex >= 0 ? `${name} 第 ${episodeIndex + 1} 集` : name
}
