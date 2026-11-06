export interface CategoryTag {
  category_id: string | number
  name: string
}

export interface HotScore {
  score?: number
  text?: string
}

export interface Celebrity {
  nickname: string
  avatar: string
  sub_title: string
  celebrity_id: string
}

export interface SeriesCard {
  series_id: string

  series_title: string
  series_cover: string
  series_intro?: string
  episode_cnt: number
  episode_right_text?: string

  vid_list?: string[]
  hot_score_data?: HotScore
  category_list?: CategoryTag[]
  celebrities?: Celebrity[]
  tags?: string[]
  rank?: number
  create_time?: string | number
  series_status?: number
  pay_type?: number
  genre?: string
}

export interface SeriesDetail {
  series_id: string
  series_name: string
  series_cover: string
  series_intro: string
  episode_cnt: number

  accessible_episode_cnt?: number
  pay_type?: number
  tags: string[]
  episode_right_text?: string
  celebrities: Celebrity[]

  vid_list: string[]
  first_visible_time?: number
  series_episode_info?: {
    episode_cnt: number
    episode_total_cnt: number
    series_status: number
  }
}

export interface Review {
  create_time: string
  digg_count: string
  rating?: number
  user_name: string
  user_avatar: string
  content: string
}

export interface SeriesSocialInfo {
  rating?: number
  rating_count?: string | number
  series_like_count?: string
  series_favorite_count?: string
  rank_label?: string
  hot_score_data?: HotScore
  reviews?: {
    total_count: string
    reviews: Review[]
  }
}

export interface HomeBanner {
  series_id: string
  series_name: string
  series_intro: string

  background_cover?: string
  series_cover?: string
  title_link?: string
  tags?: string[]
}

export interface HomeSection {
  tab_type: string
  tab_name: string
  video_list: SeriesCard[]
}

export interface HomeData {
  bannerList: HomeBanner[]
  mBannerList: HomeBanner[]
  homeSections: HomeSection[]
}

export interface SearchResultItem {
  doc_type: number
  name: string
  keyword: string
  video_data: SeriesCard | null
}

export interface SearchData {
  query: string
  searchList: SearchResultItem[]
  totalCount: number
  pageNum: number
  totalPages: number
  hasMore: boolean

  isRelevant: boolean
}

export interface SuggestWord {
  name: string
  keyword: string
  display_words: string[]

  word_type: string
  video_data?: SeriesCard | null
}

export interface RankItem {
  id: string
  seriesId: string
  rank: number
  title: string
  cover: string
  heatText: string
  // 官网榜单返回的新剧等状态标签；旧版离线快照可能缺少此字段。
  statusTags?: string[]
  scoreText: string
  favoriteText: string
  likeText: string
  tags: string[]
  description: string

  episodeVids: string[]
}

export interface RankPagination {
  pageNum: number
  totalPages: number
  nextUrl?: string
  previousUrl?: string
}

export interface RankData {
  rankKey: string
  updatedText: string
  pageNum: number
  rankList: RankItem[]
  pagination: RankPagination
}

export interface SelectorItem {
  selector_item_id: string
  show_name: string
  category_json_ids: string[]
}

export interface CategoryPagination {
  total: number
  pageNum: number
  pageSize: number
  totalPages: number
}

export interface CategoryData {
  route: string
  routeLabel: string
  selectorList: SelectorItem[]
  recommendList: SeriesCard[]
  pagination: CategoryPagination
}

export interface VideoPlayerInfo {

  duration: string
  width: number
  height: number
  poster_url: string

  main_url: string
}

export interface PlayerData {
  seriesId: string
  vid: string
  playerInfo: VideoPlayerInfo
  seriesDetail: SeriesDetail

  social: SeriesSocialInfo | null

  recommendList: SeriesCard[]
}
