# 红果播放接口空响应排查

分析日期：2026-11-05。

## 样本与工具

- 用户提供的本地程序：`/Users/minkyyang/Downloads/红果短剧 .app/`。
- `Info.plist` 显示版本 `1.2.21`，标识 `com.wails.hgplayer`。
- 原始通用二进制 SHA-256：`97a98e73871dc631bae855caea8e76a0d3ff036f9dce7cd39e7e18574c8e87cf`。
- 提取的 arm64 切片 SHA-256：`da3584d9b8e3842b33dad6dadb8ef651fc6a3a912832884d67375e43e647545c`。
- 使用已安装的 REA 6.5.0 的 `inspect-go-binary` 和 `inspect-macho` 检查样本。
- REA 报告 Go 1.25.0、入口模块 `hg-go/cmd/hgplayer`。本机没有配置 REA 的 Hopper、Ghidra 或 IDA 引擎，因此未将结果表述为 REA 完整反编译。
- 使用 Go 的 `debug/macho`、`debug/gosym` 和本机已缓存的 `arm64asm`，从 `__gopclntab` 恢复函数边界，读取对应指令和静态数据。
- 本地原始证据保留在忽略目录 `work/hongguo-download-analysis/`；不提交程序副本和大体积反汇编。

## 与空响应直接相关的证据

| arm64 地址 | 函数或数据 | 观察 |
| --- | --- | --- |
| `0x1003f1b30` | `hgapi.isEmptyResponse` | 识别错误中的“响应不是 JSON (0 字节)”文本。 |
| `0x1003f27c0` | `(*Client).callPlayHosts` | 遍历节点，调用 `Session.CallJSON`，判断是否可以切换。 |
| `0x1003f2950` | 对 `isEmptyResponse` 的调用 | 节点选择路径显式处理空响应，并调用 `hostPicker.markBad`。 |
| `0x1003f29bc` | 对 `hostPicker.markGood` 的调用 | 成功后记录可用节点。 |
| `0x1003f10f0` | `(*hostPicker).order` | 调整候选节点顺序，包含成功节点和失败记录。 |
| `0x10171d480` | Go 节点列表切片 | 指向 `0x1017379c0`，包含 15 个 `fqnovel.com` 官方域名。 |

列表前四项依次为：

1. `api5-normal-lq.fqnovel.com`
2. `api5-normal-sinfonlinea.fqnovel.com`
3. `api5-normal-sinfonlinec.fqnovel.com`
4. `api5-normal-sinfonlineb.fqnovel.com`

桌面版还存在协议模式选择、设备会话选择及兼容播放逻辑，不能把其稳定性全部归因于某一种机制。其当前 `multiVideoModels` 路径引用的描述符位于 `0x101737720`，定义的是 `POST /novel/player/multi_video_model/v1/`。初次修复时尚未验证该 POST 协议，因此保留当时已使用的 GET 参数和响应格式，只采用有直接证据支持的节点切换；后续完整验证与协议替换见本文 1.0.2 部分。

## 初次修复与边界（旧 GET 路径，已由下文替换）

- 获取播放模型遇到空响应、传输或读响应中断、HTTP 408/429/5xx 时，最多尝试三个不同的已确认官方节点。
- 保留原有节点 `sinfonlineb`，增加列表内的 `lq` 和 `sinfonlinea`。在当前脚本运行期间，完整模型请求成功后优先使用该节点。
- 切换节点不重建游客身份，不修改用户存储；每次请求更新 `_rticket`。
- HTTP 权限错误、有效业务错误、无效 JSON 和缺少剧集不触发无限重试。
- 媒体文件阶段保留同清晰度、同密钥的实际主备地址，有限重试传输错误、临时 HTTP 错误、空文件和长度不完整的文件。
- 传输错误提示不回显原始网络异常，避免签名媒体地址进入界面或现有错误日志。

## 验证

2026-11-05，使用公开搜索结果中的一集和临时生成的游客身份，向三个节点发送相同 `video_tab` GET 请求。只记录状态、响应长度、业务码和有无模型，未保存或输出身份、请求完整 URL、媒体地址或密钥。

| 节点 | HTTP | 响应字节数 | 业务码 | 播放模型 |
| --- | --- | --- | --- | --- |
| `api5-normal-sinfonlineb.fqnovel.com` | 200 | 21850 | 0 | 有 |
| `api5-normal-lq.fqnovel.com` | 200 | 21914 | 0 | 有 |
| `api5-normal-sinfonlinea.fqnovel.com` | 200 | 0 | 无 | 无 |

这证明同一请求在不同节点可能得到有效模型或零字节响应，支持节点切换修复；不证明所有剧集、所有身份或所有网络下都不会失败。

静态检查与模拟回归：

```sh
node /path/to/typescript/bin/tsc -p tools/tsconfig.hongguo.json
node --test tools/test-hongguo-download.cjs tools/test-hongguo-search.cjs
```

TypeScript 检查通过，16 项测试通过。新增测试覆盖空响应切换、成功节点复用、身份保持、所有节点失败的次数上限、响应读取中断、业务错误不扩散、媒体备用地址、空文件及不完整文件、错误信息去除原始异常等行为。

尚未在 iPhone 的 Scripting 中验证：原先失败的剧集重试、连续切集和预加载期间的网络切换。这些检查不能由桌面接口实测或模拟测试代替。

## 2026-11-05：截图剧集复现与完整协议修复（1.0.2）

用户确认桌面端能播放《十八岁太奶奶驾到，重整家族荣耀第五部》第 1 集。
本次在桌面端实际打开该剧播放，并使用 LLDB 只读观察 Go HTTP 请求和签名调用。
调试结束后已 detach；未修改桌面程序、未导出桌面凭据。

### 已核对的协议

- 当前旧 GET 路径在三个节点都可能返回 HTTP 200、零字节；单独换节点不足以覆盖这次故障。
- 桌面主路径为 `POST /novel/player/multi_video_model/v1/`，使用 `biz_param` 和
  `mixed_video_id_map: { "1004": [videoId] }`；响应模型在 `data[videoId].video_model`。
- 业务码 `100100` 才会切换到 `1001` ID 类型；其他业务错误不尝试猜测字段或协议。
- 播放配置为版本 `71332`、Android 16、`25053RT47C`。查询参数排序后追加 `ts`，
  请求体原文、毫秒时间、秒级时间与签名必须对应。
- 游客身份由 `https://log.snssdk.com/service/2/device_register/` 注册，使用 TTEncrypt v5；
  精确保留 `device_id_str`、`install_id_str`、匿名 Cookie 和可选 `device_token`。
  实际响应包含 15 位和 16 位 ID，不再生成或要求固定 19 位号码，也不把 JSON 数字转成失真的长 ID。
- Scripting 不自动保存或发送 Cookie，因此使用其已核对的 `Response.cookies` 手动维护匿名身份。
  仅保存于脚本私有 Storage，不使用桌面端身份，不需要账号登录。

| arm64 地址 | 函数 | 验证 |
| --- | --- | --- |
| `0x100257920` | `net/http.(*Client).do` | 只读确认实际 POST、请求头、JSON 请求体和目标节点。 |
| `0x1003aa760` | `sign.(*Signer).Sign` | 确认签名模式与动态请求头。 |
| `0x1003a65c0` | `crypto.BuildMedusaFor` | 核对查询哈希、F13、protobuf 与随机输入。 |
| `0x1003a7224` | protobuf 返回处 | 核对字段、桌面模板 manufacturer 的 Xiaomi 值及环境随机字段范围。 |
| `0x1003a75a4` | 自定义加密返回处 | native 输出与独立实现逐字节一致，单次比较 735 字节、差异 0。 |
| `0x1003ab720` | `sign.NewTraceID` | 确认毫秒时间前缀、随机十六进制和 span 格式。 |

通过内存内替换头的请求验证，Medusa、Helios、Argus 不能按原来的简单请求省略。
部分完整请求仍会返回空内容；补签名并不能保证一个游客身份永久可用。
本次因此采用每次重签、三个已确认节点切换、一次游客身份更新；并发调用共享注册，
旧身份的迟到失败复用已经生成的新身份。只有确认收到空响应才更新身份，单纯断网或 HTTP 故障不触发注册。
每个身份最多尝试三个节点，每次调用最多更新一次身份；100100 的类型切换额外重试一次当前节点。

### 算法来源与交叉验证

公开项目 `aston314/hongguo-tv` 的协议说明及 signer 用于独立对照，检查的 tree revision 为
`772951cda325f25aecf2d5a47fe5c3a90b54698c`。没有把其未声明授权的源码直接放入安装包。
生产 TypeScript 按本地二进制中确认的协议字段、公开算法和常量重新实现；常量表来自程序只读数据，
不是用户设备凭据。测试固定向量全部使用人造设备 ID、固定时间和零随机输入，
记录独立参考实现的 Medusa 哈希与 Helios 输出，并覆盖四个时间分支。

### 正式源码实测

在 macOS Node 环境加载编译后的正式模块，仅将 Scripting 的 HTTP 和 Storage 替换为真实 HTTPS 适配器与内存存储：

- 新注册匿名身份，连续取得上述剧集前 6 集，每集解析到 5 个可用流。
- 实测遇到身份空响应，有限重试并更新身份后恢复，没有复制桌面端 Cookie、token 或签名。
- 第 1 集下载 5,738,736 字节，使用正式 MP4 解密代码生成 5,673,598 字节播放文件。
- FFprobe 识别出 HEVC 360×640 视频和 AAC 音频；FFmpeg 实际解码前三帧无错误。
- 请求/身份仅在内存中使用，输出限状态、数量、字节数和媒体格式；临时媒体校验文件用后移除。

这证明 macOS 真实接口、下载和解密链路已工作；不等同于 iPhone 上 Scripting 的原生播放验证。

### 检查与打包

```sh
node /path/to/typescript/bin/tsc -p tools/tsconfig.hongguo.json
node --test tools/test-hongguo-auto-cache.cjs tools/test-hongguo-download.cjs tools/test-hongguo-search.cjs tools/test-hongguo-playback-protocol.cjs
python3 tools/package-hongguo.py
```

使用官方 `llms.txt` 对应完整页面核对 `fetch`、`Response.cookies/arrayBuffer`、私有 `Storage`、
Node 兼容模块 `node:buffer`、`node:crypto`、`node:zlib` 及本地 dts。
安装包仅引用这些已确认的内置模块，不依赖 npm 包或外部解析服务。
最终 TypeScript 检查及 37 项回归测试通过，ZIP 完整性、包内版本与依赖源码一致性检查通过。
仍需在 iPhone 安装 1.0.2 后验证该剧第 1 集播放、连续切集，以及配置 10 集后逐集补齐缓存。
