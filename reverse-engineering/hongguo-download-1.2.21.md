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

桌面版还存在协议模式选择、设备会话选择及兼容播放逻辑，不能把其稳定性全部归因于某一种机制。其当前 `multiVideoModels` 路径引用的描述符位于 `0x101737720`，定义的是 `POST /novel/player/multi_video_model/v1/`。本次没有未经验证地切换到该协议，而是保留仓库已使用的 `video_tab` GET 参数和响应格式，只采用有直接证据支持的官方节点切换。

## 修复与边界

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
