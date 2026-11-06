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
- 媒体仍使用现有签名、游客身份和播放模型；刷剧页改为读取 MP4 索引后按 HTTP Range 解密，已有完整磁盘缓存则直接复用。不为推荐列表批量预下载视频，选集页原有离线流程保持原样。
- 切换标签、进入后续页面、离开前台或销毁首页时暂停并释放本地代理；滑动立即取消旧片段请求，新目标不再排队等待整集下载，迟到结果不能绑定当前播放器。
- 滚动视口使用 GeometryReader 的确切尺寸，并同时裁切视口及外层容器，阻止相邻页绘制到标签栏底部安全区。
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

模拟测试覆盖根页面模式切换、保存失败、精确请求参数、字符串 ID、禁播及非视频单元、分页去重与重试、快速滑动、标签/导航离开、后台暂停、播放器拒绝源、定时到期和画中画接管。

接口实测与模拟测试不等于 iPhone 端到端验证。调试期间 iPhone 恢复连接，已通过 `scripts inspect` 核对 App 中四个本次改动模块与本地 SHA-256 一致；自动运行截图被 `busy: A manual preview or script is already running.` 拒绝，未停止用户手动运行。需要重新运行手机脚本，切到刷剧模式检查原生分页、声音、选集返回和深浅主题。

## 分段播放修复

继续读取同一个旧桌面样本的 Go 符号，得到以下流式处理线索；符号本身不代表手机端已经完整复刻所有缓存策略。

| 地址 | 符号 | 用途线索 |
| --- | --- | --- |
| `0x1003e21a0` | `cenc.RewriteHeader` | 重写加密声明。 |
| `0x1003e25b0` | `cenc.ParseHeader` | 解析媒体头。 |
| `0x1003e2b20` | `(*Prepared).DecryptRange` | 按区间解密媒体。 |
| `0x1005368a0` | `(*Proxy).serveDecrypted` | 向播放器提供解密流。 |
| `0x100537b20` | `(*Proxy).readHeader` | 单独读取媒体索引。 |
| `0x100538650` | `(*Proxy).doRange` | 请求上游字节区间。 |

手机端对应实现为 `core/feedPlayback.ts` 与 `core/mp4Range.ts`：

- 仅监听 `127.0.0.1`，路径随机生成，播放地址、内容密钥和媒体片段只在当前播放源内存中使用。
- 扫描顶层盒子定位 moov，允许索引位于媒体数据前后，最多读取 8 MB 索引；无需下载整集 mdat。
- 根据 stsz、stco、stsc、senc 定位全采样 CENC 区间，使用 frma 中的真实编码替换 encv/enca，将 DRM 声明改为等长 free，保持绝对字节偏移。
- 支持 8/16 字节 IV、非块对齐区间、跨采样和跨 HTTP 分块的 CTR 解密。缺失必要表、分段采样加密或不支持的索引明确报错，不猜测替代字段。
- 初版将本地响应范围限制为 1 MB；后续原生播放器验证确认，这种缩短请求范围的做法会触发 AVPlayer 错误，已由下文的 TCP 分块传输修复替代。仅保留最近一个已解密片段，复用重复读取。
- 对上游 206 范围、长度和文件总大小进行校验；同清晰度主备节点有限切换。退出时取消在途网络并停止监听，不写入不完整的离线缓存。
- 刷剧优先使用服务端已有、短边不超过 720 的清晰度；仅提供一个更高清晰度时直接使用该项，不进行本地转码。

### 新增验证

真实生产模块通过 Node HTTPS 和本地 HTTP 服务适配器运行，独立 ffprobe/ffmpeg 消费分段播放源：

- 一次测试的视频总大小为 21,343,601 字节，HEVC 1924×1080、AAC，时长约 161.94 秒。
- 建立播放源只请求 338,236 字节，耗时 321 ms；首批画面再请求 1,048,576 字节，前三帧解码完成时累计 516 ms。计时包含桌面 FFmpeg 启动和解码，不代表 iPhone 首帧时间。
- 随后验证媒体元信息及第 20 秒跳转，再解码三帧；总共 4 次上游分段请求、2,435,388 字节，无整集下载和临时明文文件。
- 合成测试使用独立 Node AES-CTR 生成媒体，对完整和非对齐随机区间逐字节比较；覆盖前后置索引、两种 IV 长度、跨 1 MB 边界、无效表、主备切换、取消、释放、离线复用和视口裁切。
- 两个项目均通过 TypeScript。原目录相关回归 73 项通过；当前 HG 调试目录分段播放、推荐与收藏回归 37 项通过。

新增检查入口：

```sh
node --test tools/test-hongguo-feed-playback.cjs tools/test-hongguo-recommendations.cjs
HONGGUO_BUILD_DIR=../work/hongguo-preview-build node --test tools/test-hongguo-feed-playback.cjs tools/test-hongguo-recommendations.cjs tools/test-hongguo-favorites.cjs
```

本轮中途 CLI 曾报告无兼容设备连接；结束前 iPhone 恢复连接，`scripts inspect` 已确认 `feedPlayback.ts`、`mp4Range.ts`、`VideoFeedView.tsx` 的 App 端 SHA-256 与本地一致。设备为 `busy: true`，有手动脚本正在运行，未中断该运行，也未取得新版原生 HttpServer/AVPlayer 的运行结果或修复后截图。仍需手机重新运行 HG 短剧，检查刷剧首播、连续上滑、后台恢复、选集返回、标签栏底部裁切。桌面媒体验证与模拟测试不构成手机端流畅播放结论。

## AVPlayer 区间响应兼容修复

用户报告“视频播放失败，请重试或上滑切换”后，继续对实际媒体验证。本次产品代码只修改 `scripts/HG 短剧`，不再同步旧的 `scripts/红果` 目录。

### 复现与修复

初版代理把客户端请求的完整区间缩短为前 1 MB，然后结束该 HTTP 响应。FFmpeg 可以容忍这种行为，但 macOS 原生 AVPlayer 对实际视频复现失败，错误链为 `NSURLErrorDomain -1`、`CoreMediaErrorDomain -12939`。上一轮 FFmpeg 测试不足以证明 AVPlayer 兼容性。

- 将 HTTP 传输从缓冲式 HttpServer 响应改为文档支持的 `node:net` 本地 TCP 服务。
- 客户端请求哪个区间，就返回该完整区间及对应 Content-Range、Content-Length；传输每块最多 256 KB，逐块读取、解密、写入，不再缩短响应范围。
- 每次等待套接字写入回调再发送下一块，控制排队内存，保持边加载边播放。普通无 Range 的 GET 也支持流式 200 响应。
- 继续仅监听 `127.0.0.1`，随机路径，最多 6 个连接；支持 HEAD、开放区间、后缀区间、无效请求及超长请求头限制。
- 客户端取消会中止该连接的在途上游请求；切页/后台/退出关闭整个源及所有连接；监听启动期间取消也会清理迟到的监听器。
- 播放失败时保留原生错误文字，先遮盖 URL，再显示并输出日志，避免只有通用提示无法排查。

### 验证结果

使用与产品相同的编译模块和真实 Node TCP 服务器，上游 HTTPS 与 Storage 适配为桌面环境，游客身份及签名链接仍仅在进程内存中使用。

- 同一集媒体在旧代理下原生 AVPlayer 报 `-12939`，新 TCP 服务下可播放并准确跳转第 20 秒后继续播放。
- 增加原生检查程序 `tools/hongguo-avplayer-probe.swift`，静音播放，通过 AVPlayerItemVideoOutput 检查跳转前后的实际像素帧；只输出状态及错误域/代码，不输出播放链接。
- 带像素帧验证的一次运行确认跳转前后均获得 1080×1920 图像，播放位置超过 20.5 秒；索引准备请求 349,342 字节，媒体完整大小为 13,282,827 字节。总运行计时约 1.60 秒，包含测试主动跳转，不等同于首帧耗时。
- `tools/tsconfig.hongguo-preview.json` TypeScript 检查通过；HG 目录分段播放、推荐、收藏相关回归 40 项通过。
- 回归使用真实 TCP/HTTP 传输，检查大于 1 MB 的单个响应完整接收、严格长度、分块上游读取、慢速读取、分段到达的请求头、客户端取消、播放源取消及监听启动取消。

原生检查程序的编译方式（参数仅接受已有本机播放服务的 URL）：

```sh
xcrun swiftc tools/hongguo-avplayer-probe.swift -o /tmp/hongguo-avplayer-probe
```

手机 CLI 的运行请求仍被 `busy: A manual preview or script is already running.` 拒绝。macOS 的真实 AVPlayer 及像素帧验证比 FFmpeg 更直接地覆盖此次错误，但仍不能替代 iPhone 中 Scripting 网络、播放器与页面生命周期的最终验证。

## 滑动后的自动播放切换

用户继续反馈滑动下一部不播放。本轮只修改 HG 短剧的推荐视图，核对连接设备 3.3.0.46 的 ScrollView、AVPlayerView 官方完整文档与声明后，调整当前播放页的选择与切页错误处理。

- 使用 iOS 18+ 的 `onScrollTargetVisibilityChange` 接收原生可见目标集合。保持剧集字符串 key 和 `scrollTargetLayout`，只有一个目标达到 60% 可见时才切换播放源；空集合、多目标和未知 ID 不触发切换。
- 移除播放目标与 `scrollPosition` 的双向绑定，分页仍由原生 `paging` 完成。可见页变化沿用原有的取消、释放、准备播放源和自动播放流程。
- 旧播放源被释放后，原生旧媒体可能在新来源尚未绑定时报告连接关闭。错误处理现在要求当前来源已绑定，避免旧错误关闭下一部自动播放；新来源绑定后的实际错误仍显示重试。
- AVPlayerView 文档明确说明视图消失不会停止或销毁调用方持有的 AVPlayer，因此本轮保留单播放器，不根据未经验证的视图销毁推断重建播放器。

TypeScript 检查及 HG 相关 43 项回归通过，新增测试通过实际注册的可见目标回调验证连续切到第二、第三部、滑回上一部、过渡集合不重复加载，以及旧媒体错误不会阻止下一部自动播放。测试使用模拟原生回调，不能证明手机实际滚动会产生预期事件。

`scripts inspect` 已确认修改后的 VideoFeedView 与 iPhone 上文件 SHA-256 一致。随后发起原生运行请求时设备断开，返回 `disconnected`；未取得此次修复后的 iPhone 播放或滑动结果。仍需重新运行 HG 短剧，在视频推荐模式连续切换几部并滑回检查。

## 同页推荐视频缓存

刷剧首页此前只为当前可见视频准备分段播放源，其余推荐尚未完整下载。本轮将每页返回的所有推荐播放集加入后台缓存队列，继续使用已有 `preloadOfflineVideo` 保存完整解密视频及标题、集数、封面、剧集标识。缓存完成后切到该集，原有 `prepareFeedPlayback` 会直接复用本地文件。

- 整页加入队列，单次仅下载一个完整视频，当前视频仍可以立即分段播放，不等待整页缓存。
- 翻页追加的新推荐接续队列；同一推荐轮次每个视频只尝试一次完整缓存，已有缓存由原缓存模块复用。容量淘汰后的旧页不会因为追加新页而反复下载。
- 单集完整下载失败不阻断后面的推荐，当前集仍沿用按需播放与重试入口。主动换一轮会重置本轮缓存尝试记录。
- 遵守自动缓存开关与用户保存的容量上限。刷剧按返回页缓存，选集播放器保留原来的后续集数配置，设置说明已同步。
- 容量淘汰前的保护列表随当前可见集更新；缓存受容量限制，不能保证容量不足时整页文件同时保留。
- 离开首页、进入后台、其他画中画占用或退出后不再追加下载。已有完整视频下载不支持主动取消，允许当前在途任务完成并保存；恢复时等待它结束后再接续队列，避免重叠下载。

HG TypeScript 检查通过，分段播放、推荐、收藏、自动缓存及容量管理共 65 项回归通过。新增测试覆盖整页无需滑动即缓存、视频元数据、分页去重、淘汰后不反复回填、当前视频容量保护、开关切换、离开/后台/退出、快速返回及单集失败。自动缓存和容量测试现支持指定构建目录，并为 HG 选集页已有收藏按钮补齐测试依赖。

本轮 CLI 返回 `device_unavailable`，没有兼容设备连接，尚未确认本轮文件同步或 iPhone 上的后台下载和切页耗时。
