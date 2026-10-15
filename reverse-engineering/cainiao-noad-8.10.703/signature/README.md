# 8.10.703 签名调用链与参考实现

## 当前结论

已还原 MTOP 层签名输入的字段顺序、两种入口的差异，以及关闭 SecurityGuard 时的 HMAC-SHA1 分支。**SecurityGuard 的完整签名计算尚未还原**；没有真实账号签名测试向量，也没有生成可替代客户端的 `x-sign`、`x-mini-wua`、`wua` 或 `x-sgext`。本目录的参考实现不接入小组件。

样本为本目录上级归档的 8.10.703 去广告 IPA，主程序 SHA-256：`d305a955a56094e30bc693249e455fdae9fd8ba04cc2ec66e573ca02bb0e5b61`。地址均为该 Mach-O 的未滑移虚拟地址。本次分析未访问账号、未发送认证请求。

## 签名输入

`TBSDkSignUtility` 的普通入口位于 `0x10281e250`，安全因子入口位于 `0x10281f11c`。前者的字段读取、数组构造和拼接见 `mtop-sign-annotated.asm`，后者见 `security-factors-annotated.asm`。

基础数组的顺序如下，以 `&` 连接，原生 nil 字典项转为空串：

```text
readUtdid()
headers[x-uid]
headers[x-reqbiz-ext]
appKey
lowercaseHex(MD5(UTF8(dataJson)))
protocol[x-t]
api
version
protocol[x-sid]
protocol[x-ttid]
protocol[x-devid]
protocol[x-location].split(",")[1]
protocol[x-location].split(",")[0]
```

位置字段仅在恰好拆成两段时取值，否则保留两个空槽位；这里使用原始索引，不把它们猜成经度或纬度。业务参数先经过 `toJsonString:`，参考实现要求调用方提供该阶段的原始 JSON 字符串，不尝试重建其字典排序或猜测序列化规则。

接下来加入 `x-extdata` 的规则因入口而异：

| 入口 | extdata 槽位 |
| --- | --- |
| `getMtopSign...` | 只有 `headers[x-exttype]` 为 `isv_open_api` 或 `inner_open_api` 时加入，即使 extdata 为空也保留槽位；证据 `0x10281e780` 至 `0x10281e7f4` |
| `getSecurityFactors...` | 始终加入 `headers[x-extdata]`，空值也占槽位；证据 `0x10281f610` 至 `0x10281f62c` |

之后两者依次追加：`headers[x-features]`、`headers[x-router-id]`、`headers[x-place-id]`、`protocol[x-open-biz]`、`protocol[x-mini-appkey]`、`protocol[x-req-appkey]`、`protocol[x-act]`、`protocol[x-open-biz-data]`。普通入口为 21 个基础及追加字段，命中 open API 类型后为 22 个；安全因子入口固定 22 个。字段值自身可能包含 `&`，这些计数描述数组槽位，不代表可对最终字符串盲目拆分。

## 计算分支与追踪边界

| 分支 | 已确认行为 | 地址 |
| --- | --- | --- |
| `useSecurityGuard=false` | 对拼接输入和 `appSecret` 的 UTF-8 字节执行 `CCHmac`，算法常量 0（SHA-1），20 字节按 `%02x` 输出 40 字符小写 hex | 分支 `0x10281ea08`；`TBSDKSecurity hmacsha1:key:` 为 `0x102813c04`，调用点 `0x102813cb4` |
| MiddleTier | `TBSDKSecurity sign:input:` 传入 `appkey`、UTF-8 `data` 和环境 `env`，调用 `getSign:error:` 并读取返回 `x-sign` | `0x102813564`；`SecurityGuardOpenMiddleTierGeneric getSign:error:` 为 `0x102b71508` |
| 旧 SecurityGuard | 创建参数上下文，传入 input、appKey、requestType 和 authCode，再调用 `signRequest:authCode:` | `TBSDkSignUtility sign:input:` 为 `0x10281ec64` |
| Unified | 将输入、appkey、env、api、useWua 和 extendParas 交给 `getSecurityFactors:error:`，返回安全因子字典 | `TBSDKSecurity factorSign...` 为 `0x1028138fc`；`SecurityGuardOpenUnifiedSecurity getSecurityFactors:error:` 为 `0x102b593cc` |

MiddleTier 的 `getSign:error:` 继续构建上下文并调用 `signRequest:authCode:`（`0x102b71a84` 至 `0x102b71a90`）。开放签名包装器的核心调用位于 `0x102ab5710`，命令值 `10701`，通过地址 `0x1068f6788` 中的函数指针执行；Unified 核心调用位于 `0x102b5a08c`，命令值由两条指令组成 `0x11eba`，通过 `0x1068fbe50` 中的函数指针执行。

以上两个指针所在节均为 `__bss`、`S_ZEROFILL`，静态文件不包含运行时填充的指针值。MiddleTier 部分 CFString 的后备字符串也指向此类区域。附近还存在混淆跳转和运行时初始化调用。`dispatch-boundaries.json` 保存这些边界；当前没有还原其初始化与分发实现，不能将看到包装器或算法名称等同于还原了安全核心。

后续需要继续追踪这些运行时初始化函数、核心分发器及安全存储依赖，或在可读取目标进程的研究环境中取得对应运行值和合成输入的输出对照。主程序已解密只解决代码可读性，不会自动解除这些依赖。目前没有这类运行环境，也没有足以验证完整签名的输入输出对。

## 代码与验证

- `sign_input.py`：两个入口的输入拼接与显式传入密钥的普通 HMAC 分支，仅用 Python 标准库，不读账号配置、不输出密钥、不发送请求。
- `test_sign_input.py`：字段顺序、位置顺序、extdata 分支和空槽位、缺失条件，以及 RFC 2202 公开 HMAC-SHA1 向量。合成字段测试不能证明真实 SecurityGuard 签名可用。
- `legacy-sign-draft.ts.txt`：从组件目录移出的历史草稿，原文件声称基于 Java SDK。其 extdata 条件、追加字段顺序和手写 UTF-8/HMAC 处理未按 iOS 实现验证，不能作为已还原签名器使用。
- `methods.json`：从 Objective-C 元数据提取的相关方法入口。
- `*.asm` / `*-annotated.asm`：定点指令与辅助注释。注释器仅识别已知形式的字符串和 selector，不是完整反编译器；以原始指令为准。注释中的厂商构建路径缩为 `MtopSDK/`。

运行公开向量与字段规则测试：

```sh
python3 -B -m unittest discover -s reverse-engineering/cainiao-noad-8.10.703/signature -p 'test_*.py'
```

如需重新补充注释，从归档 IPA 提取主程序为本目录的 `Cainiao4iPhone`，核对摘要后运行 `python3 -B annotate_sign.py`。原始反汇编可用系统 `objdump -d --start-address=... --stop-address=... Cainiao4iPhone` 按证据文件首末地址重新生成，不应对整份转储中的混淆数据盲目解释为可达代码。

## 对组件的影响

组件仍沿用已验证的抓取头与 GET 查询/续期流程，没有用普通 HMAC 分支替换 SecurityGuard，也没有引入签名服务。静态证据表明签名输入包含时间、sid 和 data；因此组件更新时间、轮换 token 或 sid 后重放旧签名不能获得永久有效保证。是否在某条线上接口成功，仍需真实设备和服务端验证。
