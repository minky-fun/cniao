# 桌面版推荐流与手机刷剧首页

分析与验证日期：2026-11-06。

## 证据来源

沿用已保存的桌面版 1.2.21 arm64 样本，未重新分析其他版本应用。样本来源与 REA 检查边界见 [播放协议报告](hongguo-download-1.2.21.md)。

- 样本：本地忽略目录 `work/hongguo-download-analysis/hgplayer-arm64`。
- SHA-256：`da3584d9b8e3842b33dad6dadb8ef651fc6a3a912832884d67375e43e647545c`。
- 读取 Go 符号、arm64 指令、运行时类型及内嵌 Vue 前端；本地工作证据在忽略目录 `work/hongguo-feed-analysis/`。
- 不提交二进制副本、原始接口响应、签名链接、会话值或游客凭据。

## 静态结果

| 地址 | 符号或描述符 | 观察 |
| --- | --- | --- |
| `0x10040a500` | `RecommendTab` | 推荐分类为 `tab_type=16`，沿服务端推荐顺序取内容。 |
| `0x10040b280` | `recommendPage` | 默认推荐进入 cell/change 分页。 |
| `0x10040b3a0` | `cellChangePage` | 构造 GET 查询，读取列表与分页状态。 |
| `0x10040c040` | `cellChangePages` | 聚合推荐分页。 |
| `0x10040afa0` | `rawFeedVideo.feedItem` | 优先匹配推荐 vid，未匹配时取分集列表第一项。 |
| `0x10040e050` | `feedTabsRaw` | 获取推荐分类信息。 |
| `0x1017373a0` | `feed` | `GET /reading/bookapi/bookmall/tab/v`。 |
| `0x101737480` | `feed_change` | `GET /reading/bookapi/bookmall/cell/change/v`。 |

内嵌前端通过 `App.RecommendTab(tab, cursor)` 请求推荐，按剧集 ID 去重追加，接近尾部时继续加载。滚轮切换的是当前推荐视频，不是把本地列表随机打乱。

默认推荐使用固定的公开业务参数：

```text
bottom_tab_type=7
client_req_type=2
client_template=7
change_type=0
category_id=0
cell_sub_id=0
limit=0
need_personal_recommend=1
video_type_preferences_str=[]
cell_id=7294257141911650341
plan_id=7294257258253254693
tab_type=16
offset=<上次 next_offset，首次 0>
session_id=<上次 session_id，首次空字符串>
```

另带现有 APP_COMMON_QUERY 与本地游客身份，以现有签名器对空请求体签名。推荐 GET 与播放模型 POST 为两个独立协议，不改动既有播放构造。

### 响应映射

- 推荐内容在 `data.cell_view.cell_data[].video_data[]`；实测存在没有 `video_data` 的单元，按旧桌面模型跳过，不猜测其他字段替代。
- 翻页依据 `data.has_more`、`data.next_offset`、`data.session_id`；实际 `cell_view` 没有这些分页字段。
- 剧集 ID 使用 `video_detail.series_id_str`；同响应的数值 `series_id` 可能超出 JavaScript 安全整数范围。
- 标题、封面、简介、总集数分别使用 `series_title`、`series_cover`、`series_intro`、`episode_cnt`。
- 分集来自 `video_detail.video_list`，位置使用 `vid_index`，禁播项不展示为可播放推荐。
- 推荐顶层 `vid` 为空时按桌面逻辑取第一集，不把 `recommend_group_id` 猜成播放 ID。

本轮手机端接入默认推荐分类，使用服务端 offset/session 翻页与客户端剧集去重。未实现桌面端其他推荐分类、关注接口及 seen/filter 扩展参数，不声称这些行为已完整复刻。

## 手机端实现

- 设置新增“首页模式”：默认保留推荐模式；刷剧模式切换成原生纵向整页滑动的视频列表，选择持久保存。
- 旧源码目录 `scripts/红果` 与当前调试目录 `scripts/HG 短剧` 同步新增功能；后者保留已存在的原生搜索和收藏入口。
- 当前视频使用同一个 AVPlayer，按媒体原比例显示，底部叠加标题、分集、简介及进入现有选集播放器的入口。
- 媒体仍由现有签名、游客身份、下载解密和磁盘缓存提供。仅准备当前目标，不为推荐列表批量预下载视频。
- 切换标签、进入后续页面、离开前台或销毁首页时暂停；准备任务串行，跳过排队旧目标，迟到结果不能绑定当前播放器。
- 复用播放历史与定时停止；已有画中画播放时等待用户明确接管。
- 临近尾部自动取下一批；失败保留当前内容并提供重试，重复内容不会无限自动请求。推荐耗尽后可手动换一轮。

## 验证与边界

使用生产编译后的推荐模块与播放模块，HTTP 传输适配为 Node HTTPS，游客身份只在内存保存。一次验证完成游客注册、两页推荐和首个推荐分集的播放模型请求：

- 两页推荐均为成功业务响应；该次解析到 5 部、5 部可播放剧集。
- 第二页游标推进，包含 5 部新剧集。
- 推荐分集能够进入既有播放模型协议，得到 1 个支持的加密流及有效长度的内容密钥；未输出或保存密钥及媒体链接。
- 该次共 4 个 HTTP 请求，包括 1 次游客注册；推荐结果会随服务端变化。

静态检查与回归入口：

```sh
npm exec --yes --package=typescript -- tsc -p tools/tsconfig.hongguo.json
npm exec --yes --package=typescript -- tsc -p tools/tsconfig.hongguo-preview.json
node --test tools/test-hongguo-recommendations.cjs tools/test-hongguo-playback-protocol.cjs tools/test-hongguo-sleep-timer.cjs tools/test-hongguo-fullscreen.cjs tools/test-hongguo-auto-cache.cjs tools/test-hongguo-favorites.cjs
HONGGUO_BUILD_DIR=../work/hongguo-preview-build node --test tools/test-hongguo-recommendations.cjs
```

模拟测试覆盖根页面模式切换、保存失败、精确请求参数、字符串 ID、禁播及非视频单元、分页去重与重试、快速滑动、标签/导航离开、后台暂停、播放器拒绝源、定时到期和画中画接管。主回归共 55 项通过，当前调试目录另通过 15 项同套推荐回归。

接口实测与模拟测试不等于 iPhone 端到端验证。调试期间 iPhone 恢复连接，已通过 `scripts inspect` 核对 App 中四个本次改动模块与本地 SHA-256 一致；自动运行截图被 `busy: A manual preview or script is already running.` 拒绝，未停止用户手动运行。需要重新运行手机脚本，切到刷剧模式检查原生分页、声音、选集返回和深浅主题。
