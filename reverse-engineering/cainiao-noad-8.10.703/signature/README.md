# 8.10.703 签名调用链与参考实现

## 当前结论

已还原 MTOP 输入构造，并让真实 `lvm_sig` 类型 19 路径在离线环境返回 **50 字节签名候选字符串**。现在解释循环、全部 **73 类已观察操作码**、调用控制、简单/复杂整数 ABI、公共函数/命令桥接以及 17 次 AES 已迁移至 TypeScript。两组输入分别执行 321,675 / 321,855 条 TS VM 指令，逐操作码次数与原生一致；TS 对照中原生 VM 入口以下的处理器与派发循环执行次数为 **0**，候选结果与相同输入/熵下的原生结果一致。

最新端到端评估：非零时间下的六组真实格式 MTOP 合成输入对照通过；统一安全模块缺少 `lvm_minilibc` 的加载错误已解决。探针已越过 `One +play:` 并执行其原生分发，现停在未完整初始化的错误报告分发器。详细边界和复现见文末。

**仍未完成可脱离原生运行时的完整签名器和服务端验证**：实际宿主计算与对象操作、模块装载/初始化/展开、SDS/SDK 状态及平台依赖尚未全部迁移。候选不能宣称为可替代客户端的 `x-sign`，也未完成 `x-mini-wua`、`wua` 或 `x-sgext`。本目录离线探针未接入小组件。下文保留历次边界，最新进展见文末。

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

以上两个指针所在节均为 `__bss`、`S_ZEROFILL`，静态文件不直接保存其运行值；但这不代表不能从初始化代码追踪目标。继续分析后，已定位下面两个写入位置，修正此前只停留在零填充节的分析边界。`dispatch-boundaries.json` 保存最新状态。

### 新定位的初始化与分发路径

- `SecurityGuardOpenInitialize privateInitialize:withCustomBundlePath:`（入口 `0x102abb5f4`）在 `0x102abb860` 通过 `ADR` 取到 `0x102ae03ac`，在 `0x102abb868` 写入 `0x1068f6788`，见 `dispatcher-install.asm`。这条路径的分发器目标已经可以静态确定，尚未在目标进程验证其执行状态。
- `MiddleTierPlugin initializePlugin:`（`0x102b6d0b0`）在 `0x102b6d14c` 将调用方参数寄存器 `x2` 写入 `0x1068fbe50`；`nativeEntry`（`0x102b6d160`）返回 `0x102b3bb28`。见 `plugin-dispatcher-install.asm`。尚未完成调用方参数来源与该 nativeEntry 的完整计算追踪。
- `0x102ae03ac` 对正命令号进行拆分，然后跳到 `0x102aa973c`；对已确认命令 `10701`，对应的三个分发编号为 `1 / 7 / 1`。见 `core-command-dispatch.asm`。这些是分发编号，不是签名算法或密钥。
- `0x102aa973c` 既可能进入 `0x102abfaec` 路径，也可能从 `0x1068f7ea0` / `0x1068f7ea8` 的运行时注册表查找处理函数：查找过程在 `0x102aa937c`，返回的处理指针在 `0x102aa9898` 间接调用。`handler-lookup.asm` 可见注册项与上下文值之间的 XOR 指针编码；`handler-registration.asm` 对应注册入口。本轮已继续定位 `10701` 的公开处理函数注册，详见下节；完整签名计算仍未还原。

`trace_dispatchers.py` 在核对样本 SHA-256 后扫描相邻 ADRP/STR 指令候选，输出 `dispatcher-stores.json`。该扫描不是控制流或寄存器活跃性分析，候选须由上述定点反汇编复核，不能声称覆盖所有指针写入形式。

### 已复核的处理项注册与请求类型转换

本轮加入 `probe_native.py`，用 Unicorn 隔离执行固定样本的有限路由和解码片段。`native-routing-evidence.json` 可直接从归档 IPA 重建。它使用合成函数表回调收集编号和地址，回调返回 0；不执行签名处理函数，不模拟签名成功。所有地址均在主程序摘要匹配后使用，片段有时间、指令数和结束地址限制。

1. 核心表 `0x1068f5e40` 由 `0x102aa9a30` 分配。表的四项依次是注册 `0x102aa9658`、调用包装 `0x102aa98d4`、分发 `0x102aa973c`、另一包装 `0x102aa9940`。见 `core-table-install.asm`。
2. 注册函数 `0x102ae0930` 实际提交 20 项。调用点 `0x102ae0ab4` 将 `(1,7,1,flag=1)` 绑定至 `0x102ae051c`，对应公开命令 `10701`。见 `open-command-registration.asm`。
3. `0x102ae051c` 不进行签名计算，而是将原始输入和错误指针转发给 `(1,4,1,flag=0)`。模拟执行核对了两个指针原样保留。见 `signature-forward.asm`。这与公开注册项 `(1,4,1,flag=1) → 0x102a87d54` **不同**：flag 0 和 1 使用独立注册根，不能把后者当成已定位的内部签名器。
4. MiddleTier 传入的 requestType 常量在 `0x1048297c8`，值为 7。`transferOpenSignType:`（`0x102ab58c4`）调用真实解码器后，0 至 11 的映射为 `[2,12,2,1,0,17,18,19,20,16,21,22]`，超出范围返回 23。因此 **MTOP 类型 7 转换为内部类型 19**。见 `sign-type-transfer.asm`。此前可见的类型 5/6/7 分支不是这条 MTOP 路径的直接计算证据。
5. 编码表的导入桩 `0x10442ddd0` 可解析到本样本中的 `_CMa03Q0IM8B3Ic`，真实地址 `0x102a653a4`。其逐字节逻辑是 `((source[i] - constant) & 255) XOR key[i % keyLength]`；此处是常量混淆解码，不能当作签名算法。见 `native-decoder.asm`。
6. MiddleTier 的字符串区 `0x1068fd856` 也已通过原生解码片段恢复为字段名 `data`；它并非未恢复的密钥或签名核心。对应初始化指令已包含在 `middle-tier.asm`。
7. Unified 注册前缀在 `0x102b3d750`：调用点 `0x102b3d834` 注册 `(7,34,2,flag=1) → 0x102b3d39c`。该处理函数在 `0x102b3d528` 继续调用 `(7,1,2,flag=0)`。见 `unified-command-registration.asm` 和 `unified-command-handler.asm`。这里只证明注册与转发，尚未完成 `0x1068fbe50` 调用方参数的来源验证或安全因子计算。

### 内部动态处理路径

核心分发器在查找普通注册表前调用 `0x102abfaec`。它通过 `0x1068f8708` 中的另一套动态处理项查找模块和索引；匹配成功时，将上下文、参数、数量 2 和目标索引装入结构，再调用 `(1,36,2)`。见 `dynamic-handler-execute.asm`。对 `(1,4,1)` 构造的查找编号为 `66010401`；这只是查找编号，不能由它推出签名结果。

动态条目的注册入口 `0x102abf804` 接收编号、模块上下文和目标索引。其调用方在 `0x102a67314`，从元数据读取 `isPublic`、`destIndex`、`index`，以及 `metainfo`、`stacksize` 等字段。字段名由真实解码代码复核，见 `metadata-handler-registration.asm` 和探针输出。`(1,36,2)` 的注册候选指向 `0x102a7362c`；该函数在 `0x102a738a8` 按模块表的 `+0x38` 项间接调用并传入索引、参数和输出指针，见 `module-execute.asm`。这说明仍需恢复实际加载的模块及该索引的实现，不能只移植外层字符串拼接。

归档 IPA 内还确认存在 `yw_1222.jpg`（133573 字节，SHA-256 `add1c126c9e52bdc4b16335ecfee0f463b0d97d82b98ce150754dd2a359c23dd`）和 `yw_1222_mwua.jpg`（86152 字节，SHA-256 `24ee8bcb38f40568da8547969d1506259fe4a6a92b27f0eb8af8cb884174e57a`）。尚未证实它们分别提供哪些签名数据，不能仅凭资源名称将其称为已恢复密钥。

本轮继续恢复了这两个内部命令的模块元数据映射，以及 `lvm_sig` 的真实宿主绑定和加载过程，见下节。完整计算与所需安全数据仍未还原，也没有签名输入输出对照。尚未生成 `x-sign` 或 `x-mini-wua`，没有完成用户要求的本地签名接入。主程序已解密并不等于这些计算已经还原。

### 已提取签名模块并复核 VM 加载

`probe_vm.py` 用真实 ARM64 加载器和解释器继续复核，结果保存在 `module-vm-evidence.json`。它接受归档 IPA 或主程序，先核对 SHA-256，再在隔离内存中运行；不启动 iOS 程序、不读取账号资料、不访问网络、不输出字节码常量或安全数据。

1. `0x102a885ac` 解码名称 `lvm_sig`，将描述符 `0x105530118` 交给 `(1,34,13,flag=0)`。描述符回调 `0x102abfdf4` 返回数据地址 `0x106682a00`、长度 **17608**。见 `signature-module-install.asm` 和 `signature-module-source.asm`。
2. 容器前四字节声明代码压缩流长 **17424**，其后依次为代码与 JSON 元数据两个独立 zlib 流。代码解压后 **34236** 字节；尾部元数据压缩流 **180** 字节。`module_container.py` 严格校验两个流的边界、结束标志、输出上限及字节码头，避免普通 `zlib.decompress` 忽略尾随数据造成漏读。
3. 元数据明确绑定 `66010401 → index 3`、`66011903 → index 4`、`66011904 → index 5`，均 `isPublic=0`。前者对应已追到的内部 `(1,4,1,flag=0)`。
4. `0x102a8f424` 的名称解码前缀对应静态宿主表 `0x1055302d8`，**165 项，每项 24 字节**。`(1,36,6)` 处理器 `0x102a73a88` 最终调用 `0x102a5475c` 注册。表中已核对 28 个 `AlgorithmHelper*` 和 10 个 `*LVMBridge`，包括 AES、MD5、HMAC-SHA1、Base64 和桥接函数。见 `host-bindings-install.asm`。这些是真实函数地址，不能把名字直接当作类型 19 的算法流程。
5. 使用真实表注册后，VM 构造器 `0x102a52988` 与模块加载器 `0x102a516ac` 完成加载，后者返回 **0**。真实导出分发表 `0x102a518ec` 通过导出数组将索引 3 转成代码区偏移 **0x5770**；代码区起于字节码 **0x214**，所以该入口在字节码 **0x5984**。见 `vm-export-dispatch.asm`。
6. 同一原生加载过程执行字符串区解码，逐字节规则为 `byte XOR ((initialKey + i*0x53) & 255)`，见 `vm-string-decode.asm`。这是字节码区段的混淆解码，并非签名计算。
7. 对空请求执行导出项 3，VM 返回值为 0，但业务错误被设置为 **1**。这直接说明“VM 返回 0”仅代表解释器完成调用，不能解释为签名成功。以公开合成 `INPUT`、appkey 和内部类型 **19** 执行时，观察到 16 次 `getCommonFunctionPtrLVMBridge`，然后经 `invokeFuncBridgeLVMBridge` 请求 **`(1,6,36,flag=0)`**。探针在这项未初始化的业务调用前抛出异常，绝不为它补一个成功返回值。

相关内嵌模块也已由同一容器解析器复核：

| 模块 | 原始容器地址 / 长度 | 已核对的元数据绑定 | 验证范围 |
| --- | --- | --- | --- |
| `lvm_sig` | `0x106682a00` / 17608 | `66010401 → 3` | 描述符、真实宿主表、VM 加载和合成参数执行边界 |
| `lvm_sds` | `0x1066871e0` / 26314 | `66010636 → 34` | 元数据匹配首个依赖命令；默认探针进入前停止，`--with-sds` 可继续执行真实导出项 |
| `lvm_unifiedsec` | `0x10669a7c8` / 34317 | `66070102 → 1` | 元数据匹配 Unified 的内部 `(7,1,2)`；调用方分发器来源和模块执行尚未验证 |

`--with-sds` 模式会另建真实 SDS 引擎，并按已核对的动态包装 ABI 将 `(1,6,36,0)` 转交导出项 34。本轮纠正了此前合成请求中 **appKey 与 authCode 放反** 的错误。先前“错误 1 后进入 `(1,14,5,0)`”实际来自空 appKey 分支，不能代表正确字段顺序下的签名主路径；对应负例现单独保存在 `module-sds-empty-appkey-evidence.json`。正确顺序的结果已重建为 `module-sds-evidence.json`，详见下节。

宿主加密函数仍会继续转发到 SecurityGuard 核心，例如 `AlgorithmHelperMd5`（`0x102aa3900`）构造请求后调用 `(1,2,1,flag=0)`，见 `algorithm-helper-md5.asm`。因此 165 项表的恢复解决了模块装载依赖，尚未恢复全部业务状态、加密处理和设备安全数据。

隔离依赖有明确限制：内存由有界单调分配器提供，释放延后；锁按单线程实现，TLS 与线程号为合成状态；时间固定为零；系统符号解析只映射固定样本中确实存在的导入桩。所有加密函数使用样本自身地址；未解析的导入或核心命令会中断。该环境不能代表 iPhone 进程，更不能作为服务端验证。

下一步需要继续恢复下述初始化依赖，取得 SDS 实际读取的安全数据和类型 19 的完整计算，再建立签名输入输出对照。**本地签名生成与小组件接入仍未完成**。

### 修正原生请求布局并定位 SDS 初始化缺口

此前 `probe_vm.py` 的合成请求错误地将第二、第三个指针当作 authCode、appKey。本轮按 Objective-C 调用寄存器和最终栈结构重新核对并修正；这也是前一轮错误 1 的直接原因。`signature-request-layout.asm` 与既有 `open-secure-signature-annotated.asm` 保留依据：

| 原生请求偏移 | 实际来源 | 指令证据 |
| --- | --- | --- |
| `+0x00` | 参数 HashMap | `0x102ab566c` |
| `+0x08` | appKey 的 UTF-8 C 字符串 | 参数 x3 在 `0x102ab546c` 保存为 x19，`0x102ab5698` 写入 |
| `+0x10` | authCode 的 UTF-8 C 字符串 | 上层 `signRequest:authCode:` 的 x3 在 `0x102ab44d4` 保存，经过 `objc_retain` 后由 `0x102ab4a58` 放入 x5；`0x102ab5464` 保存，`0x102ab56b0` 写入 |
| `+0x18` | 转换后的内部签名类型 19 | `0x102ab56b4` 写入低 32 位 |
| `+0x1c` | 零值槽 | 同一条指令写入高 32 位；不猜测用途 |

现在有三条独立复核路径，均先清零错误槽，避免将前一个空请求的错误当成新调用结果：

1. 非空合成 appKey、空 authCode，在 SDS 之前停止：命令为 `(1,6,36,0)`，见 `module-vm-evidence.json`。
2. 空 appKey、空 authCode，实际执行 SDS 导出项 34：VM 返回 0、业务错误 1、无输出，随后进入 `(1,14,5,0)`，见 `module-sds-empty-appkey-evidence.json`。这是参数拒绝路径，不是签名成功。
3. 非空合成 appKey、空 authCode，实际执行 SDS：越过上述拒绝分支，读取 SDS 模块相对偏移 **`0xabe8`** 的资源目录缓冲区槽；该槽为零。代码区 **`0x38d4`** 随后读取该对象的 `+0x48` 成员，实际 ARM64 指令 `0x102a2ba18` 访问未映射地址 `0x48`，解释器未返回。见 `module-sds-evidence.json`。此时错误槽的 99 是中间值，不能当成最终业务错误。

探针同时核对当前 VM 指令位置、资源目录槽的实际重定位地址和零值。它只将这一个已核对的空缓冲区读记录为已知停止点，其他内存错误继续抛出；不映射空页、不返回伪造输出。

对应初始化链也已定位：

- 原生 `0x102ab5a28` 装载 SDS 描述符后，在 `0x102ab5c6c` 将 SDK 上下文送给 **`(1,6,40,flag=0)`**，见 `sds-module-initialization.asm`。容器元数据明确将 **`66010640 → 导出项 38`**；真实导出表地址偏移为 **`0x8340`**。
- 导出项 38 的代码区 **`0x847c`** 将资源目录缓冲区保存至上述全局槽；该缓冲区与传入的 SDK 配置对象不是同一对象。`probe_sds.py` 通过真实加载器展开的指令验证槽地址和 store 操作，不输出原始字节码或数据常量。
- SDK 上下文由 `0x102a71164` 分配 **240 字节**。主初始化器在 `0x102aeb30c` 调用构造器，经 `0x102ae9d14` 存入全局 `0x1068f9e78`，之后在 `0x102aea5e0` 传给 SDS 初始化器。见 `sdk-context-constructor.asm`。
- 上下文 `+0x60/+0x68/+0x70/+0x78` 分别保存真实回调 `0x102a71530/0x102a7154c/0x102a71568/0x102a71584`，分别读取对象成员 `+0x10/+0x18/+0x20/+0x28` 并继续解码。见 `sdk-context-callbacks.asm`。尚未确认这些成员的业务名称，不把它们猜成某个设备标识或密钥。
- **纠正此前的对象混淆**：SDK 配置对象的 `+0x48` 确实为标志回调 `0x102a71500`，读取 bit 2，七组合成标志已核对。但 SDS 签名路径从 `0xabe8` 取到的是另一种 **104 字节资源目录缓冲区**，由 `0x102abf544` 创建，其 `+0x48` 为复制回调 **`0x102abf384`**。切片执行核对缓冲区内容等于 SDK 构造器的合成参数 2。此前将这里解释为 SDK bit-2 回调是错误的，现以原生代码及执行结果更正；见 `sds-resource-buffer.asm` 与 `sds-slice-evidence.json`。

`probe_sds.py` 目前可以执行真实 SDK 构造器，并核对以上回调地址。其输入为零标志、一个公开合成字符串和其余零参数，**不是 iPhone 的完整 SDK 配置**。构造时 `(1,1,3,0)` 按真实注册转发至 `0x102aed18c`，该处理器从样本状态读取字节；不人工填充返回值。

随后实际执行 SDS 导出项 38，经 `(1,37,1,flag=1)` 进入真实处理器 `0x102aa11fc`，在 `0x102aa17fc` 调用 Foundation 的 **`NSClassFromString`** 时停止。该探针没有实现 Objective-C 运行时；不返回猜测的类或消息结果。`sds-initialization-evidence.json` 明确记录初始化未返回、上下文槽尚未保存、未生成签名。这一停止点不能解释为“必须换一台设备”或“算法无法继续还原”，后续仍可继续分析相应原生路径及初始化输入来源。

`sds-runtime-gate.asm` 进一步保留了该检查的控制流：`0x102aa13f8` 调用检查器，把低字节保存到全局 `0x1068f7a48`；检查器先按字符串查找类和选择子，再发送 `instancesRespondToSelector:`。若此消息结果为零，`0x102aa1828` 跳过后续实例消息。处理器在 `0x102aa1438` 再按保存的低字节跳过后续区段，最终从 `0x102aa16ec` 返回 0。这里描述两条静态分支。进一步解析主程序类表后，已确认查询的 `asdu2399asd` 类真实存在，目标选择子 `adsf2332sdd` 实现为 `0x102be7b7c`；不能将类查询随意替换成 nil。该类还定义 APM、前后台监听及报告相关方法。完整运行时消息与副作用尚未模拟。


### 独立资源切片及解压进展

`probe_sds_slice.py` 必须显式传入 `--omit-monitoring`：仅省略 `(1,37,1,1)` 监控调用的副作用，使用已核对的正常返回常量 0，**不等价于完成真实 SDK 初始化**。签名、加解密和资源解压均未用伪造输出替代。配置仍为合成目录、零标志与其他零参数；签名请求仍为合成 INPUT/appKey 和空 authCode。

该条件下实际执行导出项 38，得到 VM 状态 0、业务错误 0，并核对资源目录缓冲区。签名导出项 3 随后复制目录并完整读取 IPA 的 `yw_1222.jpg`（133573 字节，摘要由探针验证）。`(1,9,2,0)` 经原生处理器 `0x102aaf54c` 查询环境索引 0，最终进入 `0x102a791f4`。其查询的 `OpenSecurityGuardManager` 也真实定义于主程序；这里只建模对应的 `NSBundle bundleForClass:`、`bundleIdentifier` 及必要字符串转换，包标识直接读取 IPA 的 `Info.plist`：`com.cainiao.cnwireless`。未知类、消息、路径、编码仍中止。见 `sds-bundle-environment.asm`。

`(1,2,1,0)` 的真实处理器 `0x102abc330` 已执行，按参数 `+4` 的 u32 分发加密类型；类型 22 的路径包括原生 MD5。默认切片停在 `_inflateInit_`，证据为 `sds-slice-evidence.json`。

增加 `--with-zlib` 后，`guest_zlib.py` 使用系统 libz 并有界复制 guest 输入输出、指针和计数。iPhoneOS arm64 的 `z_stream`（112 字节、全部字段偏移）经 `verify_ios_zlib.c` 编译断言核对。拒绝自定义分配器；流状态由宿主库维护，宿主地址不写入 guest；`arc4random` 使用宿主系统熵，仅记录调用次数。两段流均真实到达 `Z_STREAM_END` 并关闭，解压长度分别为 **306065 / 86480 字节**，不保存或展示解码内容。见 `sds-zlib-evidence.json`。

随后停在解释器原生指令 **`0x102a2b7e4`**：`ldr x1, [x1, x2]` 读取空地址 0 的 8 字节，见 `vm-null-read.asm`。当前仅定位了故障指令及所在分配块，尚未证明空操作数的上游业务来源，不能据此断言缺少某个设备字段或密钥。签名解释器没有返回；错误槽此刻为 0 也不是签名成功。下一步需追踪该操作数来源，恢复后续配置、计算与真实签名对照。

纯原生计算区间 `0x102a6c000–0x102a6f000` 可关闭 Python 逐指令跟踪以加速，**所有 guest 指令照常执行**，导入和业务入口继续拦截；`--full-trace` 可保留全部跟踪用于对照。两种切片模式的加速与完整跟踪输出 JSON 均已实际对比一致。严格初始化探针的 IPA 与主程序输入也输出一致。所有执行仍有时间和指令上限。

## 代码与验证

- `sign_input.py`：两个入口的输入拼接与显式传入密钥的普通 HMAC 分支，仅用 Python 标准库，不读账号配置、不输出密钥、不发送请求。
- `test_sign_input.py`：字段顺序、位置顺序、extdata 分支和空槽位、缺失条件，以及 RFC 2202 公开 HMAC-SHA1 向量。合成字段测试不能证明真实 SecurityGuard 签名可用。
- `legacy-sign-draft.ts.txt`：从组件目录移出的历史草稿，原文件声称基于 Java SDK。其 extdata 条件、追加字段顺序和手写 UTF-8/HMAC 处理未按 iOS 实现验证，不能作为已还原签名器使用。
- `module_container.py` / `test_module_container.py`：双流容器的有界解析及损坏输入测试，仅使用标准库。
- `probe_vm.py` / `module-vm-evidence.json` / `module-sds-evidence.json` / `module-sds-empty-appkey-evidence.json`：真实签名模块、宿主表和三种合成参数执行边界；依赖 macOS 的 `otool`、`nm` 和 `unicorn==2.1.4`，不需要 Capstone。
- `probe_sds.py` / `sds-initialization-evidence.json`：真实 SDK 上下文构造和 SDS 初始化前缀，遇到缺失的 Objective-C 导入即中止。
- `probe_sds_slice.py` / `sds-slice-evidence.json` / `sds-zlib-evidence.json`：明确省略监控副作用的资源切片，两种模式分别停在解压导入和后续空操作数读取；只接受归档 IPA。
- `guest_zlib.py` / `test_guest_zlib.py` / `verify_ios_zlib.c` / `verify_ios_stat.c`：有界真实 libz 适配、公开合成流式测试及 iPhoneOS ABI 编译断言。
- `probe_native.py` / `native-routing-evidence.json`：有限原生片段复核及明确标注合成回调的输出；仅额外依赖 `unicorn==2.1.4`。
- `methods.json`：从 Objective-C 元数据提取的相关方法入口。
- `*.asm` / `*-annotated.asm`：定点指令与辅助注释。注释器仅识别已知形式的字符串和 selector，不是完整反编译器；以原始指令为准。注释中的厂商构建路径缩为 `MtopSDK/`。

运行公开向量与字段规则测试：

```sh
python3 -B -m unittest discover -s reverse-engineering/cainiao-noad-8.10.703/signature -p 'test_*.py'
```

隔离复核原生路由（在独立虚拟环境安装 Unicorn 后）：

```sh
python3 -m venv work/cniao-re-env
work/cniao-re-env/bin/python -m pip install unicorn==2.1.4
work/cniao-re-env/bin/python reverse-engineering/cainiao-noad-8.10.703/signature/probe_native.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
```

继续复核模块（使用同一个虚拟环境）：

```sh
work/cniao-re-env/bin/python reverse-engineering/cainiao-noad-8.10.703/signature/probe_vm.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
```

按正确字段顺序进入真实 SDS 导出项（在缺失上下文读处中止）：

```sh
work/cniao-re-env/bin/python reverse-engineering/cainiao-noad-8.10.703/signature/probe_vm.py --with-sds \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
```

复核空 appKey 负例及 SDS 初始化前缀：

```sh
work/cniao-re-env/bin/python reverse-engineering/cainiao-noad-8.10.703/signature/probe_vm.py --with-sds --empty-appkey \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
work/cniao-re-env/bin/python reverse-engineering/cainiao-noad-8.10.703/signature/probe_sds.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
```

除需要 IPA 资源的 `probe_sds_slice.py` 外，所有探针都接受已解出的主程序路径；两种输入的 JSON 输出应一致。输出中的 `return_address` 是实际寄存器值，尾调用时可能是合成停止地址，不应当作原始调用点。

显式运行独立切片：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/probe_sds_slice.py --omit-monitoring \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/probe_sds_slice.py --omit-monitoring --with-zlib \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
xcrun --sdk iphoneos clang -target arm64-apple-ios12.0 -c \
  reverse-engineering/cainiao-noad-8.10.703/signature/verify_ios_zlib.c -o work/signature-analysis/verify-ios-zlib.o
```

如需重新补充注释，从归档 IPA 提取主程序为本目录的 `Cainiao4iPhone`，核对摘要后运行 `python3 -B annotate_sign.py`。原始反汇编可用系统 `objdump -d --start-address=... --stop-address=... Cainiao4iPhone` 按证据文件首末地址重新生成，不应对整份转储中的混淆数据盲目解释为可达代码。

## 对组件的影响

组件仍沿用已验证的抓取头与 GET 查询/续期流程，没有用普通 HMAC 分支替换 SecurityGuard，也没有引入签名服务。静态证据表明签名输入包含时间、sid 和 data；因此组件更新时间、轮换 token 或 sid 后重放旧签名不能获得永久有效保证。是否在某条线上接口成功，仍需真实设备和服务端验证。

### 定位空操作数来源并继续状态目录路径

新增 `--with-sdk-directory`（必须同时启用 `--with-zlib`）后，切片越过上述空地址故障，得到真实 SDS 返回：**导出项 34 的 VM 状态 0、业务错误 11、无输出**。这不是签名成功；外层签名 VM 仍停在后续错误报告的 Objective-C 依赖。结果见 `sds-state-directory-evidence.json`，完整跟踪与加速跟踪输出一致。

原故障来自探针将 SDK 构造器的 **x5 置零**，并非已证明真实手机缺少设备字段。原生 `0x102a71568` 回调读取 SDK `+0x20`，为空时返回 0；上游 VM 随后读取这个返回对象的首成员而故障。回调的非空返回是字符串对象，首成员才是 C 字符串指针。目录非空时，切片实际调用同一回调并核对对象内容，未替换其返回值。

`SDK x5` 的业务来源已沿上游指令定位为 `getSgRootPath`：

- Objective-C 初始化器 `0x102abb9e4` 读取该 selector，结果保存到 x26，经 UTF-8 转换写入初始化结构 `+0x28`；公开命令为 10501。
- 注册处理器 `0x102ae93a8` 从结构 `+0x28` 解引用，保存至栈 `+0x158`；`0x102aeb304` 加载到 x5，`0x102aeb30c` 调用 SDK 构造器。
- `getSgRootPath` 实现 `0x102abaa04` 调用 `NSSearchPathForDirectoriesInDomains(9,1,1)`，追加公开组件 `SGDocuments`。枚举 **9 是 Documents，不是 Library**。`verify_root_component` 实际运行常量解码前缀，只核对该组件。`verify_ios_state.m` 用 iPhoneOS arm64 头文件编译断言目录、访问模式、系统调用和 errno 常量。选取指令见 `sdk-state-directory.asm`。

新切片只提供 `/synthetic/Documents/SGDocuments` 这个合成空目录，**不代表真实 iPhone 的完整 SDK 状态**。程序检查其子项时直接执行 `svc #0`，x16=33、模式 0，即 Darwin `access(F_OK)`。`guest_empty_state.py` 对明确位于该目录内的子项返回 ENOENT=2 并设置 carry；未知路径、穿越路径、系统调用和模式均停止。它不读写宿主状态文件，也不打印子项名。

错误跳板解析 `cerror`。其 LP64 ABI 来自 Apple XNU 固定版本源码：

`https://github.com/apple-oss-distributions/xnu/blob/f6217f891ac0bb64f3d375211650a4c1ff8ca1ea/libsyscall/custom/errno.c`

源码 SHA-256：`49d3e1f7f46875b559bfcc2d932ca28923bac8bdceaabc7728b5377034c0c044`。实现写入 errno，128 位返回值为 -1，因此 x0/x1 均设为全一；探针共用已有 `___error` 槽。限制是未取消的单线程，不模拟 pthread cancellation。`calloc` 对乘积做上限检查并实际清零内存。

SDS 返回错误 11 后，外层 VM 调用 `(1,14,5,0)`。按注册点 `0x102a925b4/0x102a925cc` 将它接到真实处理器 `0x102af24c4`，随后停在 `_objc_msgSend` 的 `stringWithFormat:`（返回地址 `0x102a69b0c`）。没有为报告函数补假成功返回。**尚未证明错误 11 的业务含义，也没有证明缺失子项就是其直接原因**；请求仍使用合成 INPUT/appKey 和空 authCode，其他初始化参数也不完整。

复现：

```sh
python3 -B signature/probe_sds_slice.py --omit-monitoring --with-zlib --with-sdk-directory Cainiao_8.10.703_NoAd.ipa
```

16 项离线测试通过，其中新增 Darwin carry/errno、双寄存器返回、拒绝越界路径，以及 calloc 清零和乘积上限测试。组件及安装包未改动；真实签名生成、服务端验证和本地签名接入仍未完成。下一步应追踪 SDS 错误 11 的设置分支及真实配置输入，而不是把后续错误报告的运行完成当作签名完成。


### 样本 appKey 路径已返回签名候选结果

最新模式 `--with-sample-appkey`（同时要求 `--with-zlib --with-sdk-directory --omit-monitoring`）已越过此前错误 11，执行真实外层 `lvm_sig` 导出 3 并返回：VM 状态 0、非空字符串对象、50 字节 ASCII、NUL 结尾、无非法内存访问。完整跟踪与加速跟踪的脱敏证据完全一致。结果见 `sds-sample-appkey-evidence.json`。该路径包含真实 ARM64、VM、SDS 和加密处理器执行，没有以固定输出替代签名计算。

**占位 appKey 是此前拒绝路径的输入问题。** `trace_sds_rejection.py` 使用原先的 `synthetic-appkey`，观察 SDS 遍历 26 条记录、执行 24 次长度比较，其中 2 次长度相同，但内容都不匹配。真实指令随后先写错误 6，再转换为 11，见 `sds-rejection-evidence.json`。写入点都是 `0x102a2b924`，展开指令分配相对偏移分别为 `0x15858` 与 `0x2d228`；这些不是原始压缩字节码偏移。这个结果不证明手机缺 token，也不证明合成空目录里的缺失文件直接导致错误 11。

`sample_appkey.py` 没有猜测 appKey：

- 执行样本 `AppConfiguration.currentAppKeyIndex`（`0x1021aeeb0`），索引为 0。
- 沿公开 `getAppKey:authCode:`、命令 10902、转发 `(1,6,43,0)`，核对真实 SDS 元数据 `66010643 → 导出 41`，再执行该导出。
- 按原生请求布局传入 u32 索引、填充和空 authCode 指针，读取实际返回的公开数字标识。只导出来源、类型和长度，不导出标识值。
- 后续 `(1,6,cmd,0)` 只在真实容器有对应精确绑定时执行其导出，不为未知命令补成功返回。另一个真实处理器 `(1,35,1,0) → 0x102a72740` 的注册点为 `0x102a729f8`。

**返回错误槽 99 不应当作失败码。** 原生签名包装器 `0x102ab56b8..0x102ab56bc` 先把槽置为 99；`0x102ab5714` 仅按输出是否为空分支。输出非空时，`0x102ab571c` 读取对象首成员，再在 `0x102ab5730..0x102ab5740` 按 UTF-8 C 字符串转换，不检查该槽。getAppKey 的包装也按非空结果分支。本探针保留实际 99，未改成假 0。选取指令见 `sample-appkey-output-contract.asm`。返回内容仅符合该包装器契约，不能凭长度、字符集或未清零的错误槽声称服务端签名有效；字符属于 Base64 字母表也不代表已验证其编码格式。

继续执行还实际遇到：

- `_snprintf("%03u")`：按 Apple arm64 栈上可变参数读取 u32，并实现截断、NUL 和未截断返回长度。测试对照宿主真实 libc，覆盖边界值和长度。
- `_srandom` / `_random`：使用 Darwin libc 真算法，以独立 128 字节状态隔离 guest；初始种子 1，u32 截断，调用结束恢复宿主状态。不输出随机值。此模式为单线程，不能并发干预宿主 libc random。
- SDS `(1,6,23,0)` 实际传 NULL 错误指针；回调现记录 `null`（没有错误槽），不读空地址，也不伪造错误 0。
- 真实 zlib 完成三个流，输出长度仅记录为 `[306065,86480,1230]`，不保存解码内容；BSD random 调用为 5 次 srandom、75 次 random。

Darwin 随机状态初值的来源固定为 Apple libc 源码：
`https://raw.githubusercontent.com/apple-oss-distributions/Libc/71bbe350ab79eef58113991d817ccc6165061a64/stdlib/FreeBSD/random.c`
源码 SHA-256：`2cb19b8025e9981b757b130e7e36e85a905f9edd10be91b988804863d348ba20`。128 字节默认状态、TYPE_3 和种子 1 来自其状态表及初始化定义。

`verify_signature_candidate.py` 进行了三个独立初始化的受控运行：首次记录真实系统熵到内存；第二次使用相同 INPUT 与相同熵；第三次只改为另一组明确的合成 INPUT。相同输入结果一致、改变输入结果不同，三次候选长度均为 50。记录及重放各消耗 816 次 arc4random 依赖；熵只保留于进程内，运行后丢弃，不导出值或结果摘要哈希。该熵重放只用于对照实验，正常探针继续使用系统熵。结论见 `signature-input-comparison.json`。

复现最新路径与对照：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/probe_sds_slice.py \
  --omit-monitoring --with-zlib --with-sdk-directory --with-sample-appkey \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/trace_sds_rejection.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_signature_candidate.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
```

20 项离线测试通过。原先无 zlib、只有 zlib、加状态目录的三种边界仍复现；新路径的完整跟踪/加速跟踪一致。限制仍包括：时间返回零、合成 INPUT、空 authCode、合成空状态目录、省略监控、副作用与生命周期模型不完整。没有账号或线上请求验证。**目前是 macOS Python + Unicorn 执行样本原生算法，不是可在 Scripting 中运行的 TypeScript 签名器**。下一阶段应提取计算依赖并建立可移植实现，再接入真实请求验证。小组件与安装包仍为 1.1.5，本轮未修改。


### 纯 TypeScript AES 已替代原生计算并保持外层结果一致

新增 `portable_aes.ts`，仅使用 `Uint8Array` 和标准 JavaScript 运算实现 AES-128/192/256 的 ECB/CBC 与 PKCS#7，不导入 Node crypto、CommonCrypto 或 Scripting 原生 AES。实现依据公开 FIPS 197 运算与密钥扩展规则；不嵌入样本密钥、安全资源或候选签名。它是研究模块，不提供账号请求或完整签名接口。

本轮独立复算了真实路径到达的全部 29 次标准操作：

| 原生类型（请求 +4 的 u32） | 已确认操作 | 次数 |
| --- | --- | ---: |
| 16 | AES-128，ECB/CBC，PKCS#7 | 11 |
| 17 | AES-192-CBC，PKCS#7 | 4 |
| 18 | AES-256-CBC，PKCS#7 | 2 |
| 20 | zlib 解压 | 2 |
| 21 | Base64 编码 | 1 |
| 22 | MD5，16 字节原始摘要 | 7 |
| 23 | HMAC-SHA1，20 字节原始摘要 | 2 |

`verify_crypto_operations.py` 保留真实处理器执行，在返回点将原生输出与独立标准实现逐字节比较。AES 使用 CommonCrypto 或指定的纯 TypeScript 模块；其余操作使用 Python 标准库。两个后端的 29 项事件完全一致，且全都匹配。见 `commoncrypto-evidence.json` 与 `portable-crypto-evidence.json`。CommonCrypto 枚举、LP64 长度及函数签名经实际 macOS SDK 编译断言核对，源码为 `verify_macos_commoncrypto.c`。

AES 请求布局由 `0x102abc480..0x102abc498` 与 `0x102aee414..0x102aee4cc` 核对：请求 +0 的 u32 为 1（加密）或 2（解密），+8 的 u32 为 1（ECB）或 2（CBC）；+0x10 是 IV 对象，+0x18 是 key 对象，+0x20 是输入对象。密钥只取类型要求的前 16/24/32 字节；CBC 取显式 IV 的前 16 字节，缺少时失败。以上角色只适用于已验证的 AES 路径，不将其他操作的同偏移字段猜成相同含义。选取指令见 `crypto-operation-contract.asm`。

**实际替换对照也已通过，不只有旁路相等性检查。** `verify_portable_aes_pipeline.py` 在原生加密分派入口拦截这 17 次 AES，用纯 TS 计算，再调用样本自己的 `0x102abf544` 构造完整缓冲对象。该构造器分配 104 字节对象，+0 为数据指针、+8 为逻辑长度、+12 为容量，并设置原生成员回调。替换模式保留真实构造器与原生成功返回契约；不手工猜造对象成员。原生 AES 加解密包装器 `0x102aeddd4` / `0x102aee0dc` 被计数并禁止执行。

同一组真实系统熵在四个独立初始化运行中仅通过内存重放：

1. 原始合成 INPUT，原生 AES。
2. 原始合成 INPUT，17 次 AES 全部替换为纯 TS。
3. 改变合成 INPUT，原生 AES。
4. 改变合成 INPUT，17 次 AES 全部替换为纯 TS。

两组 INPUT 下，替换前后的 50 字节外层候选结果都完全相等，改变 INPUT 仍使结果改变。每次运行消耗 816 次 arc4random，两个替换运行的原生 AES 包装器执行数均为 0。见 `portable-aes-pipeline-evidence.json`。结果、密钥、IV、资源内容和熵值均不导出；Node 子进程只通过父子进程管道进行计算，不能将其原始管道内容接到日志。

纯 TS AES 另通过 FIPS 197（2001）附录 C 的三种密钥长度公开向量、SP 800-38A F.2.1 的 CBC 公开向量，以及 Node crypto 独立对照，共 64 组有效案例；包含空明文、块边界与长缓冲。7 类无效输入检查涵盖 key、IV、密文长度和错误 padding。实现严格检查所有 padding 字节；尚未声称与原生实现的所有畸形输入行为一致。该表查找 JS 参考实现不提供常量时间保证。

复现（需要可用的 TypeScript 编译器、Node 与原有 Python 环境）：

```sh
npx --package typescript tsc --strict --noUnusedLocals --noUnusedParameters \
  --target ES2020 --module commonjs --outDir work/signature-analysis/portable-build \
  reverse-engineering/cainiao-noad-8.10.703/signature/portable_aes.ts
node reverse-engineering/cainiao-noad-8.10.703/signature/test_portable_aes.cjs \
  work/signature-analysis/portable-build/portable_aes.js
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_crypto_operations.py \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_aes_pipeline.py \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
xcrun --sdk macosx clang -Werror -c \
  reverse-engineering/cainiao-noad-8.10.703/signature/verify_macos_commoncrypto.c \
  -o work/signature-analysis/verify-macos-commoncrypto.o
```

已按 Scripting 技能读取当前官方 `llms.txt`、完整 `Crypto` / `Data` 页面及本地 `dts/global.d.ts` 声明。`Crypto.md5`、`Crypto.hmacSHA1` 和 Data 字节/Base64 转换有明确接口；文档中的原生 AES 是 **GCM**，不能拿来代替本路径的 CBC/ECB。此次纯 TS AES 不调用这些 API。`Data.decompressed(CompressionAlgorithm.zlib)` 的存在不等于已验证它接受样本的具体流格式，尚未在 iPhone 上执行。

**仍未完成完整 TypeScript 签名器。** 原生 VM、SDS 资源选择与配置处理、非 AES 处理器及既有合成运行环境仍然存在，候选结果也未获服务端验证。下一步需要继续拆解 VM/SDS 计算和结果封装；不能把通用 AES 实现或这次替换对照当成已接入小组件。本轮不修改组件、安装包、线上请求或版本。


## VM 标量迁移：六种操作码

`profile_vm_dispatch.py` 在样本解释器的 `str x27,[x28,#8]` 下一指令派发点，记录到 73 种操作码。该统计只覆盖这一种派发形式，不包含初始派发，不能解读为整个解释器只有 72 种指令；证据见 `vm-dispatch-profile.json`。不输出扩展指令操作数、槽位或资源内容。

第一批 `portable_vm_scalar.ts` 实现以下确切语义，均用 `bigint` 保存 uint64，避免 Number 精度损失：

| 操作码 | 原生入口 | 运算 |
|---|---|---|
| 34 | `0x102a2b1e8` | 槽位 + 扩展指令立即数，64 位回绕 |
| 38 | `0x102a2b3b8` | 两槽位按位 OR，64 位 |
| 39 | `0x102a2b3e4` | 两槽位按位 OR，64 位；按汇编保留与 38 相同的行为 |
| 40 | `0x102a2b410` | 两槽位 XOR 后只保留低 32 位 |
| 42 | `0x102a2b580` | 槽位 AND 立即数后只保留低 32 位 |
| 43 | `0x102a2b5ac` | 槽位 AND 立即数，64 位 |

汇编见 `vm-scalar-contract.asm`。`verify_portable_vm_scalar.py` 用 7 个公开边界数值的全组合，分别核对目标槽位独立、覆盖左输入、覆盖右输入，共 **882 次实际 ARM64 处理器执行**。另外 6 个固定边界案例、10 个无效输入案例通过；未实现的操作码必须失败。

真实离线流程中，原始合成 INPUT 替换 **109,279** 次，改变后的 INPUT 替换 **109,280** 次。两组输入都与各自原生运行的 50 字节候选完全相等，改变输入仍改变结果，熵消耗均为 816 次。标量实现真实由 TS 子进程通过内存管道计算，不以 Python 复刻运算冒充 TS。已核对的 x0/x1/x2 副作用保留，计算完成后跳到原生下一指令派发；原生 VM 派发、其他操作码、SDS 和加密仍在执行。证据见 `portable-vm-scalar-evidence.json`。

复现：

```sh
npx --package typescript tsc --strict --noUnusedLocals --noUnusedParameters \
  --target ES2020 --module commonjs --outDir work/signature-analysis/portable-build \
  reverse-engineering/cainiao-noad-8.10.703/signature/portable_vm_scalar.ts
node reverse-engineering/cainiao-noad-8.10.703/signature/test_portable_vm_scalar.cjs \
  work/signature-analysis/portable-build/portable_vm_scalar.js
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_vm_scalar.py \
  --portable-scalar work/signature-analysis/portable-build/portable_vm_scalar.js \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
```

联合替换也已通过：增加 `--portable-aes work/signature-analysis/portable-build/portable_aes.js` 后，每次同时替换 17 次 AES 和上述 VM 标量运算；两组候选仍与原生完全一致，原生 AES 包装器执行数为 0。证据见 `portable-vm-aes-combined-evidence.json`。以上过程不读取账号、不请求服务端、不修改小组件，仍不能证明签名服务端有效或 token 能持续自动续期。


## VM 内存与条件分支迁移

新增 `portable_vm_memory.ts` 与 `portable_vm_branch.ts`，在之前六种标量和 AES 实现上联合验证。只支持从实际入口核对的操作码；未知指令明确失败，不猜测相邻指令编号含义。公开的 `VmMemory` 接口要求宿主校验可访问范围和写权限；目前离线适配器仍通过 Unicorn 的已映射 guest 内存提供字节，这不是独立运行的完整 VM。

内存子集覆盖 16 种操作码：60、62、63、67、68、70、71、73、75、76、78、79、81、82、83、84。包含无符号 1/4/8 字节读、有符号 1/4 字节读，以及 1/2/4/8 字节写，保留寄存器/立即数两类寻址。地址按 uint64 回绕，数据为小端；STR W1 写入低 32 位但保留完整 x1，字节/半字写则按实际汇编掩码 x1。宿主适配器只读取实际使用的槽位，检查目标范围和读写权限。源码与 `vm-memory-contract.asm` 相互对应。

`verify_portable_vm_memory.py` 以 **952 组实际 ARM64 执行**核对数据、相邻字节及 x0/x1/x2/x3 暂存状态，覆盖非对齐、负偏移和读结果覆盖输入槽位。纯 TS 另外验证 18 个内存案例和 16 个无效输入/非法内存案例，包括高于 Number 精确整数范围的地址、只读、越界、回绕、错误读长度和未知指令。

分支子集覆盖 22 种实际出现的操作码，见 `branchOperations` 和 `vm-branch-contract.asm`。保留 32/64 位 CMP 的 N/Z/C/V 标志和有符号溢出语义。这里条件满足时会跳过下一条位移记录，即下一地址为当前扩展指令 +32；条件不满足时才读取当前 +24 的位移，下一地址为当前 +16+位移×16，均按 uint64 回绕。不能套用普通的单记录分支规则。纯 TS 核心只在实际需要时调用位移读取回调；离线 Python 适配器为管道请求预读两条扩展记录，尚未代替模块边界验证器。

`verify_portable_vm_branch.py` 通过 **8,910 组实际 ARM64 执行**比较目标地址、NZCV 与 x0/x1/x2/x3；包括 32 位截断、有符号边界、溢出、正负位移和落回当前指令。另有 8 个固定分支案例和 14 个无效输入案例，验证跳过位移时不读取回调。

两阶段都做了两组合成 INPUT、相同熵的四次独立初始化：

| 联合替换阶段 | 原始/改变 INPUT 的 TS 指令次数 | TS AES | 外层候选对照 |
|---|---|---|---|
| 内存 + 标量 | 137,946 / 137,948 次内存，109,279 / 109,280 次标量 | 每次 17 次 | 两组都与原生相等 |
| 分支 + 内存 + 标量 | 每次 38,030 次分支，内存与标量次数同上 | 每次 17 次 | 两组都与原生相等 |

候选都是 50 字节；改变 INPUT 仍改变候选；各运行使用相同的 816 次熵调用，替换运行的原生 AES 包装器执行数为 0。数据、地址状态、资源、熵和候选值只通过进程内存/父子管道比较，不写入证据。证据分别在 `portable-vm-memory-evidence.json`、`portable-vm-branch-evidence.json`，检查摘要见 `portable-vm-memory-branch-validation.json`。

已观察的操作码数重新按证据统计为 **73**，更正此前文字中的 72。当前实现其中 **44** 种，仍有 **29** 种已观察指令依赖原生处理器，清单见 `remaining-vm-opcodes.json`；这不代表签名器完成比例，未观察的输入分支仍可能有更多指令。原生派发、调用栈、模块展开、SDS 资源选择及部分宿主计算仍存在。未接入小组件，未进行 iPhone 或服务端签名验证。

复现本轮联合验证：

```sh
npx --package typescript tsc --strict --noUnusedLocals --noUnusedParameters \
  --target ES2020 --module commonjs --outDir work/signature-analysis/portable-build \
  reverse-engineering/cainiao-noad-8.10.703/signature/portable_aes.ts \
  reverse-engineering/cainiao-noad-8.10.703/signature/portable_vm_scalar.ts \
  reverse-engineering/cainiao-noad-8.10.703/signature/portable_vm_memory.ts \
  reverse-engineering/cainiao-noad-8.10.703/signature/portable_vm_branch.ts
node reverse-engineering/cainiao-noad-8.10.703/signature/test_portable_vm_memory.cjs \
  work/signature-analysis/portable-build/portable_vm_memory.js
node reverse-engineering/cainiao-noad-8.10.703/signature/test_portable_vm_branch.cjs \
  work/signature-analysis/portable-build/portable_vm_branch.js
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_vm_branch.py \
  --portable-branch work/signature-analysis/portable-build/portable_vm_branch.js \
  --portable-memory work/signature-analysis/portable-build/portable_vm_memory.js \
  --portable-scalar work/signature-analysis/portable-build/portable_vm_scalar.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
```


## 寄存器、栈帧迁移与剩余调用画像（2026-10-15）

新增 `portable_vm_register.ts` 的 24 种操作码，以及 `portable_vm_frame.ts` 的入栈 31、返回 0。累计迁移 70/73 种已观察操作码；此范围不代表所有模块、所有输入的指令覆盖率。

- 寄存器运算通过 8,499 组原生 ARM64 对照，检查槽位、上下文写入、临时寄存器、NZCV 和下一指令；条件操作 121/131/161 确认为条件赋值，不能视为原生调用。
- 栈帧通过 135 组原生对照，包含 frame 与槽位区重叠场景；按原生 LDP/STP 顺序访存，不能用整块快照替代。
- 联合替换执行 319,164 / 319,344 条 TypeScript VM 指令以及各 17 次 AES。两组输入分别与原生候选一致，逐操作码计数也一致；输入变化会改变候选。候选内容和熵数据未导出。
- Node 检查包括 12 组寄存器正常、18 组异常、1 组栈帧往返和 14 组异常；严格 TypeScript 检查与 20 项 Python 回归通过。证据见 `portable-vm-register-frame-validation.json` 及两份 pipeline evidence。

当前仍由原生处理：操作码 3（2,191 次描述符调用）、4（244 次间接调用）和 18（76 次退出），合计 2,511 次。描述符调用的 36 个位置全部走 kind 1。`profile_vm_calls.py` 进一步观察调用助手本身的全部入口：2,434 次、42 个目标，包含 `getCommonFunctionPtrLVMBridge`、`invokeFuncBridgeLVMBridge`、随机数、内存、文件、压缩及加密函数。这一统计包含操作码 3 之外的调用，不能与 2,191 直接等同。

在 `0x102a4dcf8` 助手中，已核实描述符 +8 为目标地址，+17 决定是否以 engine/context 形式直接调用。+17 为零时，+36 选择参数/结果处理：观察到 selector 1 调用后不保存结果、2 将 x0 存至 context+0x78；静态 selector 3 保存 s0、4/5 保存 d0 至 context+0x138；selector 0 进入更复杂的参数封送路径，尚未迁移。实际 selector 分布和公开目标计数见 `vm-call-profile.json`；定点汇编见 `vm-host-call-contract.asm`。不推断尚未核实的完整描述符格式。

完整签名器仍依赖原生分发、模块展开、SDS 和宿主桥接。没有服务端验签、没有 iPhone 执行验证，也未接入小组件；小组件及 1.1.5 安装包未改动。下一步需还原桥接目标、selector 0 参数封送和退出协议，再构建独立解释器并验证安全因子。


## 宿主 ABI 与两类 LVM 桥接迁移（2026-10-15，后续）

新增 `portable_vm_host.ts`，不依赖 Scripting API：

- `vmHostPlan` 核对 engine/context/descriptor 的空值及原生 root/target 条件；支持描述符标志 +17 的双参数调用，以及 selector 1..5 的六参数调用。整数返回按八字节、s0 按四字节、d0 按八字节原始位模式写入，保留 NaN 和符号位。未知 selector 返回原生错误 22；selector 0 明确返回 `marshal` 边界，不猜测参数。
- `vmSetCallDescriptor` 对应 `0x102a53b74`，只有 root+24 为零且 context+0x78 非空时才更新 context+16。
- `vmCommonFunction` 对应 `getCommonFunctionPtrLVMBridge`（`0x102a8ea08`），实际为 `0x105531300 + uint32(index)*8` 查表；表数据来自现有运行时初始化，不导出表内容，不推测索引枚举。
- `vmDispatchBridge` 对应 `invokeFuncBridgeLVMBridge`（`0x102a8e9a0` → `0x102a9271c`）。请求指针为空或前三个编号的低 32 位任一符号位为一时，返回零并在非空错误槽写入 1；有效时保留三个完整八字节编号，第四参数只取四字节，并与 payload/error 一同尾调用 `[[0x1068f5e40]+16]`。后续分发目标仍由原生执行，不伪造签名或业务结果。

`verify_portable_vm_host.py` 使用有界 continuation 连接真实宿主函数，不在指令钩子里递归启动模拟器。在两组输入中，各替换 2,426 次简单 ABI、335 次描述符设置、949 次公共函数查询和 93 次命令桥接。此前 70 种操作码与 17 次 AES 同时继续用 TypeScript 执行。外层候选结果与逐操作码执行次数分别与原生一致；这些桥接数量互有包含，不能相加后当作独立 VM 指令数。

独立原生对照共 1,053 组：ABI 165、待调用描述符 72、公共函数查询 128、命令桥接 688。覆盖原始浮点返回位、错误码写入、高 32 位保留/丢弃规则和空指针。Node 13 组边界行为与 25 组异常输入、严格 TypeScript 以及现有 20 项 Python 回归通过。独立 ABI 验证比较调用参数、返回值和受影响内存，不宣称所有 caller-saved 寄存器逐位一致。首次简单助手联合尝试触及既有 20 秒执行时限；后续及最终桥接联合对照完成，未放宽执行上限。

剩余 8 次 selector 0 的调用已明确：`snprintf` 7 次，以及 `0x102a54b64` 1 次。后者静态可见把七个参数重排后转至 `0x102a2f3e4`，但其通用封送路径尚未移植。详见更新后的 `vm-call-profile.json`、`portable-vm-host-bridge-evidence.json` 和 `portable-vm-host-bridge-validation.json`。

仍未完成整个独立解释器：操作码 3/4/18 的入口、复杂 ABI、实际宿主计算、内存分配、随机数、模块展开及初始化/SDS 仍有原生依赖。没有服务端或 iPhone 验证，未接入小组件。本轮未改查询、自动续期或安装包。下一步优先还原 selector 0 的参数类型解析与栈参数布置，再去除调用入口对原生运行时的依赖。


## 复杂整数 ABI 封送迁移（2026-10-15，后续）

`portable_vm_abi.ts` 已替换上轮保留的 8 次 selector 0 路径：7 次 `snprintf`（固定前三参、其余参数放栈）和 1 次七参数转发。实际宿主函数仍原生执行；这里替换的是类型描述解析、VM 参数源定位、ABI 参数布置和返回扩展，不是伪造这些函数的结果。

- 两张原生静态表确定了数字/ASCII 类型别名；新增 `vm-integer-abi-type-map.json` 保存公开类型编号、宽度、对齐和表地址，不含运行时参数。支持已核实的 1/2/4/8 字节有符号/无符号整数和指针。
- 原生类型语法先读取单个返回类型，随后要求 `|` 或编号 23 分隔；参数段的原生终止符已核对。不支持的结构体、浮点和类型格式明确报错，不猜测参数。
- VM 参数前六项来自 context+0x78 的八字节槽；其余项从 context+0xa8 指向的扩展区域按原生偏移读取。第七项实际读取扩展区域+0xb0，不能直接读 context 中的第七槽。
- 整数/指针使用最多八个通用寄存器；栈参数按原生宽度/对齐布置，可变参数部分按八字节对齐。窄整数寄存器参数和返回值执行已核实的符号/零扩展；复杂整数返回最终写入 context+0x78 的八字节槽。
- `void` 复杂返回的原生实现会把未初始化的临时栈槽写回 VM 槽，因此当前明确拒绝，不伪造零值或未写入行为。原生可变参数准备函数的窄类型限制也保留为明确的支持边界。

独立 ARM64 对照 **1,323 组通过**，比较实际回调收到的通用寄存器、每项有效栈字节以及整个 VM context 的最终内容。覆盖 22 个类型别名、普通/可变参数、多个公开整数位模式、窄返回和扩展参数源。Node 8 组行为、22 组异常及严格 TypeScript 检查通过；20 项 Python 回归通过。

联合执行同时保留此前 70 种 TS 操作码、17 次 TS AES，以及简单 ABI/两类桥接替换。两组输入的 8 次复杂封送均改由 TS 执行，原生复杂封送入口的保留次数为零；候选结果与逐操作码次数分别与原生一致，输入变化仍会改变候选。证据见 `portable-vm-integer-abi-evidence.json`、`portable-vm-integer-abi-validation.json` 和更新的 `vm-call-profile.json`。

首次按 20 秒时限执行的联合替换未完成。验证探针改用显式 40 秒时限以容纳进程间逐字段核对；原生对照仍为 20 秒，双方均保留原有每次 1,000 万条原生指令上限。该改动通过 `ModuleProbe.execution_timeout_us` 类属性声明，默认仍为 20 秒，不影响其他探针默认行为。

当前没有把“8 次原生复杂封送清零”当作完整签名器完成：调用/退出操作码入口、真正宿主目标、内存与随机数、模块初始化/展开及 SDS 仍有原生依赖。尚无服务端验签、iPhone 验证或小组件接入，现有查询/续期和安装包未改。下一步继续移除操作码 3/4/18 对原生调用入口与运行时状态的依赖。


## 独立 TypeScript VM 循环与调用控制（2026-10-15，后续）

新增 `portable_vm_call.ts` 和 `portable_vm_runtime.ts`。剩余操作码 3/4/18 已实现，当前观察到的操作码从 70 类增至全部 73 类。`vmRun` 自行读取 16 字节记录、更新 context 的当前指令、选择处理器、维护槽位/比较值/栈帧并退出；它不读取原生 handler 跳转表，也不依赖原生解释器的入口保存、派发和退出还原。遇到未支持操作码或超出指令上限立即失败。

调用控制还迁移了以下实际原生逻辑：

- `0x102a4d454/0x102a4d750`：根模块及两组子模块范围查找，保留符号/代码模式的位判断、32 位长度运算、子模块顺序与带符号计数。
- `0x102a4dc60`：符号地址到 VM 记录的转换；仅对尚未展开的模块显式提出展开请求，不伪造展开字节。
- `0x102a4da04/0x102a4ea64`：四种描述符分派、暂存类型覆盖、间接 VM/宿主目标选择，以及 23/50 等错误状态与错误目标写回。特定导出宿主在 context+0x2c 写入的原生值是 1，已经由独立原生对照核实。
- 调用前先写返回槽，再读间接参数；宿主返回 0 时重新读取返回槽而非使用旧副本。宿主可改写返回位置，源参数也可能与返回槽重叠，均保持原生顺序。

宿主调用通过可重入 generator continuation 提出，真实目标仍由原生验证适配器执行。`vm_call_worker.cjs` 的 4 KiB 页缓存只存在于进程内；每次宿主让出和完成前写回精确修改字节并清空缓存，返回后重新读取，避免宿主写入或嵌套 VM 调用被旧缓存遮盖。父进程验证每次写入位于可写映射内。每段最多缓存 4,096 页、最多 128 层待恢复续点；每次 VM 调用有 100 万条 TS 指令上限。

验证结果：

- 432 组独立原生调用控制对照（模块范围 168、模块搜索 168、符号解析 22、调用 handler 24、描述符/间接 helper 50），核对实际目标、消费的描述字段与最终内存。50 组 helper 覆盖宿主错误、暂存覆盖、展开续点及间接回退。
- 5 组完整原生解释器程序对照，核对槽位、分支、返回整数和 context 指令位置。Node 10 组完整程序/宿主行为与 9 组异常、严格 TypeScript 及 20 项 Python 回归通过。
- 两组真实离线路径分别完成 76 次 TS VM 调用、执行 321,675 / 321,855 条 VM 指令，各覆盖 73 类操作码。TS 运行禁止执行原生解释器入口以下的指令；原生处理器入口次数为 0，候选与逐操作码次数均与原生一致。
- 每组 2,434 次宿主让出仍保留真实目标。此前已移植的 2,426 次简单 ABI、8 次复杂 ABI、17 次 AES、335 次待调用描述符设置、949 次公共函数查询及 93 次命令桥接继续同时生效。这些计数存在调用层级，不可相加当作剩余原生次数。

证据见 `portable-vm-runtime-evidence.json`、`portable-vm-call-vector-evidence.json`、`portable-vm-runtime-validation.json`；关键原生指令见 `vm-call-runtime-contract.asm`。原生对照仍为 20 秒、TS 验证适配器为 40 秒；每次外层 ARM64 运行上限仍为 1,000 万条指令。原始候选、熵、SDS 内容与运行内存不写入报告或证据。

### 复现独立解释循环对照

先用 TypeScript 5.9.3 编译 `portable_vm_runtime.ts`、`portable_vm_abi.ts`、`portable_vm_host.ts` 和 `portable_aes.ts`（共同依赖一并生成），目标 ES2020、CommonJS，并开启 strict、noUnusedLocals、noUnusedParameters。然后运行：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_vm_runtime.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa \
  --portable-runtime work/signature-analysis/portable-build/portable_vm_runtime.js \
  --portable-call work/signature-analysis/portable-build/portable_vm_call.js \
  --portable-abi work/signature-analysis/portable-build/portable_vm_abi.js \
  --portable-host work/signature-analysis/portable-build/portable_vm_host.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js
```

当前目标边界已经从“VM 操作码未移植”转到“实际宿主计算与模块运行时未全部移植”。未进行认证接口请求、服务端验签或 iPhone 桌面测试；小组件的查询、自动续期及 1.1.5 安装包未改动。


## 缓冲区与字符串对象迁移（2026-10-15，后续）

`portable_buffer.ts` 新增 14 个缓冲区函数和 6 个字符串对象函数。已移植构造、按字节/数据追加、扩容、取值/设值/查找、克隆、C 字符串转换、按来源构造、清空和释放。保留原生 104 字节缓冲对象、56 字节字符串对象的字段和方法表；两类对象的容量规则分别实现，没有把字符串当作普通缓冲区处理。字符串方法表的最后一项是清空而非释放，已由原生指令核实。

关键行为按原生保留：缓冲区 append 返回复制目的地址；appendByte 在未扩容时返回对象、成功扩容时返回零；错误返回是零扩展的 `0xffffffff`。索引使用有符号 32 位比较，find 的目标比较使用完整 W 寄存器而非截断为字节。字符串追加会先检查来源的 C 字符串长度，因此含零字节的不足长度来源被拒绝，追加零字节也不会增加长度。字符串扩容按原生 128 字节规则计算。

独立 ARM64 对照 **440 组通过**，逐项比较返回位、全部已分配区域、分配顺序和释放顺序。覆盖空指针、负数/越界索引、零长度、边界扩容、窄值截断，以及头部/数据分配和 realloc 失败。缓冲区 realloc 失败保留旧对象；字符串原生实现没有检查 realloc 失败，写入空数据指针后在 bzero 中失败，TS 同样明确失败并保留该状态，不假装返回成功。Node 10 组行为、11 组异常、严格 TypeScript 和 20 项 Python 回归通过。

`verify_portable_buffer.py` 联合独立 TS VM、整数 ABI、宿主桥和 TS AES，在两组输入上再次与完整原生执行对照。每组 **1,196 次对象入口调用**均交给 TS：缓冲区 1,181 次，字符串 15 次。包括 AES 使用的缓冲构造器。被替换原生函数体设有禁止执行检查，入口转交后原生函数体执行次数为零。两组仍各完成 76 次 TS VM 调用，分别执行 321,675 / 321,855 条 VM 指令；候选及逐操作码次数均与原生一致，改变输入仍改变候选。此处统计的是实际被拦截入口，TS 内部调用构造/追加/扩容不重复计入。

对象内存与堆依赖通过 `VmMemory` / `BufferHeap` 显式提供，`buffer_worker.cjs` 只承担有界私有管道。验证仍沿用已有堆适配器：realloc 移动并复制有效旧字节，free 返回零且不复用块；这并非操作系统分配器的实现。未知对象方法、printf 追加、编码追加，以及超出明确边界的长度均拒绝，不猜测行为。数据、候选、密钥、随机熵与安全资源只留在进程及内存管道中。

证据：`portable-buffer-evidence.json`、`portable-buffer-validation.json`、`buffer-runtime-contract.asm`。完整本地签名器仍未完成：其他宿主算法、对象解码、模块初始化/展开和 SDS/设备状态仍有依赖。未联网验签，未做 iPhone 桌面验证；小组件查询、自动续期与 1.1.5 安装包未变。

### 复现对象联合对照

在上一节的严格编译命令中加入 `portable_buffer.ts`，然后运行：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_buffer.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa \
  --portable-buffer work/signature-analysis/portable-build/portable_buffer.js \
  --portable-runtime work/signature-analysis/portable-build/portable_vm_runtime.js \
  --portable-call work/signature-analysis/portable-build/portable_vm_call.js \
  --portable-abi work/signature-analysis/portable-build/portable_vm_abi.js \
  --portable-host work/signature-analysis/portable-build/portable_vm_host.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js
```

使用 `--vectors-only` 可只运行 440 组独立原生对象对照。Node 行为与异常检查为 `node signature/test_portable_buffer.cjs <compiled portable_buffer.js>`。


## 标准摘要、Base64 与 SGCrc32 迁移（2026-10-15，后续）

新增 `portable_digest.ts`，纯 TypeScript 实现 MD5、SHA-1、HMAC-SHA1、Base64 编码和原始 CRC-32。计算模块不导入 Node crypto、WebCrypto、CommonCrypto 或其他原生算法。`portable_crypto_host.ts` 则实现固定样本的 5 个原生入口契约，保留参数检查、输出写入、临时缓冲区及返回位模式。原生对象包装器和外层 SDK 分派暂时保留，没有把核心算法替换等同于整个宿主层移植。

已核对的特殊行为包括：MD5 的零长度参数改用 C 字符串长度，原生 void 函数留下的 x0 仍按最终 memcpy 目的地址返回；SHA-1 原生入口拒绝空数据或不足 20 字节的输出容量；原生 Base64 拒绝空输入，裸编码函数不补终止符。HMAC 描述符保留长密钥先做 SHA-1、已有 scratch 的容量选择、新分配的最小长度、原生 scratch 中间/最终字节与释放顺序。Base64 输入/输出重叠、输出覆盖字母表，以及 HMAC scratch 覆盖自身描述符明确拒绝，不猜测未支持的别名行为。

宿主表还确认 `SGCrc32` 绑定为 `0x102adefb8`。它使用反射多项式 `0xedb88320`、初值零且无末尾异或，不能直接使用 zlib 默认 CRC 约定。原生表有 256 个八字节槽，所有表项均与该多项式的 32 位结果一致。已初始化的 CRC/Base64 表仍从 guest 内存读取，独立对照包含改写的公开表数据，避免忽略原生可变状态。首次联合 CRC 替换未完成；改为每次调用一次读取 2 KiB 表并在 TS 中查表，移除逐字节跨进程读取，并新增 65,537 字节原生向量覆盖该路径。

验证结果：

- **254 组原生标准算法/ABI 对照通过**：MD5 25、SHA-1 31、Base64 38、CRC 31、HMAC 129；比较返回位、全部堆字节、scratch、分配/释放顺序和全局查表状态。覆盖分块/填充边界、长密钥、空指针、容量不足、分配失败、scratch 与来源/密钥/输出别名，以及已有自定义表。
- Node 独立标准算法对照 **338 组通过**（MD5/SHA-1 56、HMAC 224、Base64 28、CRC 30），另有 11 组异常；原生接口行为 5 组、异常 12 组通过。CRC 公开模式的期望值独立由 Python zlib 按正确初值/末尾异或换算。
- 原有 440 组对象对照、5 组完整 VM 程序、1,053 组宿主 ABI/桥接对照重新通过；对象和桥接 Node 检查通过，严格 TypeScript 与 **21 项 Python 回归**通过。共享宿主错误报告也修复了对旧 `opcode_trace` 字段的依赖，避免独立 TS VM 的真正失败被额外 AttributeError 掩盖，新增回归同时确认原始异常内容不进入报告。
- 两组输入的完整离线对照分别完成 76 次 TS VM 调用、321,675 / 321,855 条 VM 指令。每组新增 **11 次 TS 核心算法调用**：7 次 MD5、2 次 HMAC、1 次 Base64、1 次 CRC；此前 17 次 AES、1,196 次对象入口及全部 73 种 VM 操作码继续同时替换。被替换原生算法体/核心设有禁止执行检查，进入次数为零；候选与逐操作码次数仍分别与原生一致，改变输入仍改变候选。SHA-1 在 HMAC 的 TS 实现内部执行，不额外计为一次原生入口拦截。

证据：`portable-digest-evidence.json`、`portable-digest-validation.json`、`standard-crypto-runtime-contract.asm`。原始候选、输入、密钥、随机熵、安全资源和运行内存均不导出。完整本地签名器仍未完成：zlib、其他宿主/对象解码、模块初始化/展开和 SDS/设备状态仍有依赖。未联网验签或 iPhone 桌面验证；小组件查询、自动续期及 1.1.5 安装包未改。下一步继续移植压缩/解码与模块初始化依赖。

### 复现标准算法联合对照

严格编译时加入 `portable_crypto_host.ts`（自动编译 `portable_digest.ts` 依赖），然后运行：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_digest.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa \
  --portable-standard work/signature-analysis/portable-build/portable_crypto_host.js \
  --portable-buffer work/signature-analysis/portable-build/portable_buffer.js \
  --portable-runtime work/signature-analysis/portable-build/portable_vm_runtime.js \
  --portable-call work/signature-analysis/portable-build/portable_vm_call.js \
  --portable-abi work/signature-analysis/portable-build/portable_vm_abi.js \
  --portable-host work/signature-analysis/portable-build/portable_vm_host.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js
```

附加 `--vectors-only` 只运行 254 组标准算法原生向量；独立算法与接口检查分别用 `test_portable_digest.cjs <compiled portable_digest.js>`、`test_portable_crypto_host.cjs <compiled portable_crypto_host.js>`。


## 流式 zlib 解压迁移（2026-10-16）

新增 `portable_inflate.ts`，用纯 TypeScript 实现签名路径实际使用的 RFC 1950/1951 解压，不依赖 Node zlib、系统 libz 或 Web 原生解压接口。支持 stored、固定 Huffman、动态 Huffman、重复码、长度/距离扩展位和重叠回溯，保留 32 KiB 历史窗口，逐步计算 Adler-32。输入不足和输出窗口用完可以续接，不以一次性解压替代流式状态。

`portable_zlib_host.ts` 实现已核实的 Darwin LP64 112 字节 `z_stream` 适配器，入口分别为 `0x104431184`（inflateInit_）、`0x104431160`（inflate）、`0x10443116c`（inflateEnd）。保留输入输出指针、剩余容量、累计计数、data_type、adler、状态 token 和公开错误消息分配。原生包装器按 16 KiB 输入/输出窗口调用这些入口，仍由原生执行。TS 内部状态通过显式内存/堆接口访问 guest；实际流数据只存在于进程和有界管道。

验证结果：

- Node 独立公开输入 **987 组流式解压**通过，包含不同压缩等级、三种块类型、1 字节输入/输出窗口、258 字节匹配边界、跨 16/32 KiB 边界和 306,065 字节输出。另有 4 组损坏流、6 组边界/不支持条件测试；宿主 ABI 行为 2 组、拒绝条件 16 组通过。
- 与系统 libz **178 组、43,284 次逐调用对照**通过：168 组合法流、5 组损坏流、5 组截断流。比较每次返回、全部 112 字节流结构、输入/输出字节、状态及消息分配。对照发现并修正了重复码需等待扩展位、TYPE/TYPEDO 在输入耗尽时 data_type 不同这两个状态细节。
- 两组完整签名路径均完成 **3 次流初始化、31 次 inflate、3 次结束**；压缩/解压长度依次为 47,308→306,065、85,368→86,480、656→1,230 字节。每次返回与累计输入/输出事件序列分别与原生一致。TS 轮次禁止建立旧 GuestZlib 运行时适配器；系统/Python zlib 仅用于原生基线、公开向量和独立复算 oracle。
- 独立 TS VM、对象、AES、摘要与解压同时替换后，仍各完成 76 次 TS VM 调用，执行 321,675 / 321,855 条指令，覆盖全部 73 种已观察操作码。候选及逐操作码次数仍与原生一致，改变输入仍改变候选。原有 440 组对象、254 组标准算法、5 组完整 VM 程序随联合对照重新通过；严格 TypeScript、21 项 Python 回归通过。

支持范围是当前路径的标准 zlib 包装流、Z_NO_FLUSH、零自定义分配器、精确版本元数据和单活动流。预置字典、gzip/raw deflate、其他 flush 模式、自定义分配器及超出 16 MiB 请求/累计输出上限均不作为已支持功能。没有实现压缩端。畸形流的对照覆盖上述测试，不宣称替代 libz 的所有错误边界。

证据：`portable-inflate-evidence.json`、`portable-inflate-validation.json`、`zlib-runtime-contract.asm`。未导出原始候选、密钥、随机熵、安全资源或内存。完整本地签名器尚未完成：原生算法/对象包装器、模块加载/初始化/展开、SDS 与 SDK/设备状态仍需移植。未联网验签、未做 iPhone 桌面验证；小组件和 1.1.5 安装包未改。

### 复现流式解压联合对照

严格编译时加入 `portable_zlib_host.ts`（自动编译 `portable_inflate.ts` 和摘要依赖），保留此前 VM、ABI、host、AES 模块。然后运行：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_inflate.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa \
  --portable-inflate work/signature-analysis/portable-build/portable_zlib_host.js \
  --portable-standard work/signature-analysis/portable-build/portable_crypto_host.js \
  --portable-buffer work/signature-analysis/portable-build/portable_buffer.js \
  --portable-runtime work/signature-analysis/portable-build/portable_vm_runtime.js \
  --portable-call work/signature-analysis/portable-build/portable_vm_call.js \
  --portable-abi work/signature-analysis/portable-build/portable_vm_abi.js \
  --portable-host work/signature-analysis/portable-build/portable_vm_host.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js
```

附加 `--vectors-only` 可只运行 178 组 ABI 对照。Node 检查使用 `test_portable_inflate.cjs <compiled portable_inflate.js>`、`test_portable_zlib_host.cjs <compiled portable_zlib_host.js>`。协议和状态机行为参考 RFC 1950/1951 及 [zlib 1.2.11 inflate.c](https://github.com/madler/zlib/blob/v1.2.11/inflate.c)，实际 ABI 另由原生调用与公开向量确认。

## 模块准备函数迁移（2026-10-16）

新增 `portable_vm_module.ts`，移植六个已核实入口：默认配置、配置名称、引擎构造、缓存分配、缓存释放及模块字符串解码。引擎保留 144 字节对象、232 字节上下文和 16 个方法指针的原生布局；默认配置中四字节填充以及 engine+8 的未写字节保持不变。缓存失败时仍尝试两次分配并按原顺序释放，释放时保留原生空数组指针与非零计数的特殊行为。字符串描述符步长为 44 字节，按顺序执行逐字节异或及密钥递增，支持数据字符串之间重叠。

构造器明确依赖已经完成的进程级初始化：全局标志未设置时直接拒绝，未将该标志伪造为初始化实现。时间由调用方通过 `EngineClock` 注入；`module_validation_host.ts` 仅在研究验证中沿用原离线探针的零时间模型，独立行为测试另验证非零秒数、微秒和截断写入。模块方法地址及默认配置元数据仍指向样本 guest 内存，此模块尚不能独立运行签名流程。

验证结果：

- **230 组原生 ABI 对照通过**：配置名称 1、默认配置 2、缓存分配 14、缓存释放 22、引擎构造 6、字符串解码 185。比较返回位、全部已分配内存、分配尝试和顺序、释放顺序及全局时钟字段；覆盖自定义/默认配置、两处分配失败、空表、空串、多个描述符及重叠数据。
- 两组完整路径均将 2 次引擎构造、2 次缓存分配、2 次字符串解码交给 TS。六个入口后的原生函数体设有禁止执行检查，进入次数为零；缓存释放和独立配置入口只在公开 ABI 向量中覆盖，未声称完整路径实际调用过它们。
- 联合此前 TS VM、对象、AES、摘要及流式解压后，两组仍各完成 76 次 VM 调用，执行 321,675 / 321,855 条指令，覆盖 73 种已观察操作码。候选及逐操作码次数与原生一致，改变输入仍改变候选。440 组对象、254 组摘要 ABI、178 组 zlib ABI（43,284 次调用）及 5 组完整 VM 程序在联合对照中重新通过。另有 2 组模块行为、8 组拒绝条件、严格 TypeScript 和 21 项 Python 回归通过。

字符串输出覆盖描述符表或计数字段时明确拒绝，因为原生会重新读取这些字段；描述符/缓存记录数上限为 65,536，单字符串上限为 16 MiB。不将这些受限行为表述为所有原生边界均已支持。

证据：`portable-module-evidence.json`、`portable-module-validation.json`、`module-preparation-contract.asm`。没有导出候选原文、密钥、随机熵、解码字符串、安全资源或内存。完整本地签名器仍未完成：模块加载、打包指令展开、进程级初始化、其他原生算法/对象包装器、SDS 与 SDK/设备状态仍需移植。未联网验签或 iPhone 桌面验证；小组件查询、自动续期及 1.1.5 安装包未改。

### 复现模块准备联合对照

严格编译时加入 `module_validation_host.ts`，保留此前 VM、ABI、host、AES 模块。运行：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_module.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa \
  --portable-module work/signature-analysis/portable-build/module_validation_host.js \
  --portable-inflate work/signature-analysis/portable-build/portable_zlib_host.js \
  --portable-standard work/signature-analysis/portable-build/portable_crypto_host.js \
  --portable-buffer work/signature-analysis/portable-build/portable_buffer.js \
  --portable-runtime work/signature-analysis/portable-build/portable_vm_runtime.js \
  --portable-call work/signature-analysis/portable-build/portable_vm_call.js \
  --portable-abi work/signature-analysis/portable-build/portable_vm_abi.js \
  --portable-host work/signature-analysis/portable-build/portable_vm_host.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js
```

附加 `--vectors-only` 只运行 230 组模块 ABI 对照。Node 检查使用 `test_portable_vm_module.cjs <compiled portable_vm_module.js>`。

## 打包指令展开的 TS 迁移（2026-10-16）

新增 `portable_packed_expand.ts`，替换固定样本的 `0x102a5a97c` 指令展开入口。原函数使用混淆跳转、整数位域提取及相邻指令合并；本次没有猜测人工操作码映射，而是将已核实的 **2,188 个指令位置**生成纯 TS 整数运算和控制流，保留 32/64 位截断、有符号扩展、比较条件及读写宽度。31 处固定控制常量只包含跳转偏移和混淆控制数值，已随函数代码移入 TS；执行展开函数时不再从原生函数体或原生控制表读取这些值。

这是固定样本的受限指令转译，不是通用 ARM 模拟器，也不是已精简的人工语义实现。`generate_packed_expand.py` 从 `packed-expand-contract.asm` 和 `packed-expand-control.json` 重建 TS 前，会校验 IPA 主程序摘要、每条指令及控制数值；`--check` 核对生成结果与仓库源码一致。遇到未收录路径、未核实控制表访问或超出边界的输入时直接拒绝，不回退原生展开。

验证结果：

- **2,418 组独立原生对照通过**：空/单字流 2、主操作码与子字段 1,024、位边界 128、相邻主操作码组合 1,024、多指令混合流 240。比较返回位、完整模块元数据、全部展开输出及未写填充字节、来源不变性和堆操作。原生栈及输出填充在测试中变化，TS 使用私有 scratch。
- 首次扩大合成对照和首次接回实际离线路径时，分别发现未收录分支；实现均拒绝执行。补入核实的代码位置和对应控制常量后，全部对照通过，没有以伪成功或原生回退掩盖缺失路径。
- 两组完整离线签名路径各将 **2 次模块展开交给 TS**。原生基线的展开缓冲区只在同一验证进程内短暂保留，逐字节核对 TS 的完整展开结果；两次模块均一致，原生展开函数体进入次数为零。未导出这些缓冲区或其摘要。
- 联合此前 TS VM、对象、AES、摘要、解压和模块准备替换后，两组仍各完成 76 次 VM 调用，执行 321,675 / 321,855 条指令，覆盖 73 种已观察操作码。候选及逐操作码次数与原生一致，改变输入仍改变候选。230 组模块准备、440 组对象、254 组标准算法、178 组 zlib ABI（43,284 次调用）及 5 组完整 VM 程序在本次联合对照中重新通过。另有 7 组 Node 行为、17 组拒绝条件、严格 TypeScript、生成源码一致性和 21 项 Python 回归通过。

内存契约是 336 字节模块元数据、`count * 4` 字节输入、`count * 16` 字节输出及私有 528 字节 scratch；输入计数上限为 65,536。原生合并处理可能读取计数边界后的一个字，TS 只接受调用方实际映射的 4 字节，不补零。模块、输入、输出重叠或与私有 scratch 地址冲突均拒绝。计算阶段失败时不提交缓冲的输出，不声称保留原生故障发生前的部分写入行为。为兼容返回共享视图的内存适配器，元数据、来源与输出均先复制到私有缓冲区；新增共享视图用例先复现失败前改写输出的问题，修复后通过。写回阶段的底层内存故障不属于事务回滚保证。

继续核对 `0x102a514ec` 后确认：进程级初始化还涉及锁、TLS/析构回调、全局分配、可选回调及三项初始化辅助函数。现有构造器仍要求已初始化状态，不能把设置标志位视为这些步骤的实现。模块加载、其余原生算法/对象包装器、SDS 与 SDK/设备状态仍有依赖，**完整本地签名器尚未完成**。未联网验签或 iPhone 桌面验证；小组件查询、自动续期及 1.1.5 安装包未改。

证据：`portable-expand-evidence.json`、`portable-expand-validation.json`。没有导出候选原文、密钥、随机熵、解码字符串、安全资源或运行内存。

### 复现展开函数联合对照

先校验生成源码：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/generate_packed_expand.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa --check
```

严格编译时加入 `expand_validation_host.ts`，保留此前 VM、ABI、host、AES 模块。运行：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_expand.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa \
  --portable-expand work/signature-analysis/portable-build/expand_validation_host.js \
  --portable-module work/signature-analysis/portable-build/module_validation_host.js \
  --portable-inflate work/signature-analysis/portable-build/portable_zlib_host.js \
  --portable-standard work/signature-analysis/portable-build/portable_crypto_host.js \
  --portable-buffer work/signature-analysis/portable-build/portable_buffer.js \
  --portable-runtime work/signature-analysis/portable-build/portable_vm_runtime.js \
  --portable-call work/signature-analysis/portable-build/portable_vm_call.js \
  --portable-abi work/signature-analysis/portable-build/portable_vm_abi.js \
  --portable-host work/signature-analysis/portable-build/portable_vm_host.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js
```

附加 `--vectors-only` 只运行 2,418 组公开展开函数向量。Node 检查使用 `test_portable_packed_expand.cjs <compiled portable_packed_expand.js>`。

## 模块区段解析与注册表数据迁移（2026-10-16）

新增 `portable_module_sections.ts`，移植加载器中的区段解析入口 `0x102a5ed74`。33 个有效区段编号与目标字段、4/8 字节写入宽度均由公开合成输入的原生实际写入确认；编号 23、32、33 以及范围外编号返回 1。描述符步长为 8 字节，指针字段加上来源基址，计数字段保留原始 uint32。解析顺序、重复编号覆盖、非法编号前已完成的部分写入及输入/输出重叠均保留。末尾按目标元数据 `+0x30/+0x38` 指定的记录表累加第二个 uint32，按 32 位回绕写入 `+0x5c`，不替换成其他求和或猜测字段。

新增 `portable_module_registry.ts`，移植初始化及模块登记实际使用的五个入口：索引/记录表创建与释放（`0x102a54168` / `0x102a54228`），模块列表追加、读取、移除（`0x102a56414` / `0x102a56494` / `0x102a564f4`）。表分配保留 48,936 字节记录块与 8,156 字节索引块，先尝试两次分配再处理失败；释放记录按 24 字节步长进行。列表保留八字节元素、容量/计数原生布局、扩容、四分之一容量时的缩容、移位与尾部清零。移除未找到时返回 `0x00000000ffffffff`，没有误作 64 位全一。

`RegistryLock` 明确要求调用方提供读锁、写锁与解锁边界。`registry_validation_host.ts` 只沿用现有原生离线探针的单线程/空锁模型；Node 检查另外注入可观察的锁实现，确认地址、模式和配对释放。这不等于实现 pthread 或证明真实多线程行为。追加在 realloc 失败后仍增加计数、写入旧数组，这是原生实际行为；TS 不补造容量，实际存储能否访问由显式内存适配器检查。

验证结果：

- **321 组区段解析原生对照通过**：所有编号与边界值、重复编号、多描述符、区段表越界、非法编号导致的部分写入、聚合溢出及别名。比较返回位和全部已分配内存，包括未写填充字节。
- **797 组注册表原生对照通过**：表创建 18、表释放 23、追加 84、读取 336、移除 336；比较全部堆字节、分配尝试、分配/释放顺序、realloc 复制、增长/缩小失败、低 32 位索引及返回位。总计新增 **1,118 组原生对照**。
- 两组完整离线路径各由 TS 完成 **2 次区段解析、1 次表创建、3 次列表追加、1 次读取**；这些入口后的原生函数体设有禁止执行检查，进入次数为零。表释放和列表移除仅在独立 ABI 对照中覆盖，未声称完整路径调用过它们。
- 联合此前所有替换后，仍各完成 76 次 TS VM 调用、321,675 / 321,855 条指令，覆盖 73 种已观察操作码；候选及逐操作码次数与原生一致，改变输入仍改变候选，两个模块的展开字节仍与原生一致。原有 230 组模块准备、2,418 组展开、440 组对象、254 组标准算法、178 组 zlib ABI（43,284 次调用）及 5 组完整 VM 程序在联合对照中重新通过。Node 区段行为/拒绝条件 7/3 组、注册表行为/拒绝条件 6/6 组、严格 TypeScript 和 21 项 Python 回归通过。

区段描述符、聚合记录、表记录及列表计数/容量上限均为 65,536，列表扩容结果也受此限制；超限直接拒绝。未映射、截断或不满足明确依赖的内存不被填零。原生区段解析发生未知编号时的部分写入仍保留，与上一节展开器的私有缓冲策略不同。

证据：`portable-module-loading-evidence.json`、`portable-module-loading-validation.json`、`module-sections-contract.asm`、`module-registry-contract.asm`。所有运行数据、候选、密钥、随机熵及解码资源仍只在私有进程和有界管道内。本次进一步移除了加载/初始化中的数据操作依赖，**尚未完成整个模块加载器或完整本地签名器**：模块校验、分配、复用和依赖绑定的控制流程、进程级初始化/TLS/宿主注册、其他原生对象包装器，以及 SDS/SDK/设备状态仍需移植。未联网验签或 iPhone 桌面验证；现有小组件查询、自动续期及 1.1.5 安装包未改。

### 复现区段与注册表联合对照

严格编译时加入 `registry_validation_host.ts`，保留此前 VM、ABI、host、AES 模块，然后运行：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_registry.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa \
  --portable-registry work/signature-analysis/portable-build/registry_validation_host.js \
  --portable-sections work/signature-analysis/portable-build/sections_validation_host.js \
  --portable-expand work/signature-analysis/portable-build/expand_validation_host.js \
  --portable-module work/signature-analysis/portable-build/module_validation_host.js \
  --portable-inflate work/signature-analysis/portable-build/portable_zlib_host.js \
  --portable-standard work/signature-analysis/portable-build/portable_crypto_host.js \
  --portable-buffer work/signature-analysis/portable-build/portable_buffer.js \
  --portable-runtime work/signature-analysis/portable-build/portable_vm_runtime.js \
  --portable-call work/signature-analysis/portable-build/portable_vm_call.js \
  --portable-abi work/signature-analysis/portable-build/portable_vm_abi.js \
  --portable-host work/signature-analysis/portable-build/portable_vm_host.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js
```

附加 `--vectors-only` 只运行 797 组注册表向量。区段向量使用 `verify_portable_sections.py` 和上述除 `--portable-registry` 外的参数，再附加 `--vectors-only`。Node 检查分别为 `test_portable_module_sections.cjs <compiled portable_module_sections.js>` 和 `test_portable_module_registry.cjs <compiled portable_module_registry.js>`。

## 模块校验、容器选择与加载计划迁移（2026-10-16）

新增 `portable_module_header.ts`，移植 `0x102a631e4` 的模块校验控制，不执行其后端。`planModuleLoad` 返回明确的错误状态，或包含目标、上下文、来源、长度和输出参数的 `ModuleLoadPlan`。只有版本 `0x10001` / `0x10002` 分别选择 `0x102a5e240` / `0x102a626f0`；两个后端的分配、复用和绑定主体仍由原生执行。旧格式还保留入口原有的 `+0x48 == 7` 识别分支。不是给整个加载器套上成功返回，也没有把返回计划等同于完成加载。

打包容器保留 `+8` 标识 `0xba137616`、标志位筛选及最多 63 个八字节选择记录。记录高 6 位决定类型；选择首个类型零的记录，以其偏移定位子模块，低 29 位作为子模块长度。无匹配项或容器标志不符合时，继续原生的普通模块识别分支。普通输入的长度判定只使用低 32 位，实际后端参数保留原始 64 位长度；打包子模块则使用选择记录中的长度。没有额外添加原生未要求的字段或猜测入口。

模块校验和与此前的 `SGCrc32` 不同：这里使用 MSB-first 多项式 `0x04c11db7`、初值 `0xffffffff`、无末尾异或，对 `source+20` 至声明总长度计算。原生只读表 `0x10481f388` 的全部 256 项均与该规则一致；TS 生成自己的表，并按最多 4 KiB 块续算，不读取原生表。独立期望由反转输入字节位及最终结果位的 Python/Node zlib 计算得到。未误用此前初值零、反射多项式的原始 CRC 实现。

初始参数合法后，保留原生先清上下文 `+0x60` 的一字节和 `+0x58` 的八字节，再做内容校验的顺序；错误时不伪造事务回滚。版本选择成功后，仅写四字节 `context+0x18`，保留邻接填充。保留 1、2、7、`0x25`、`0x26`、`0x27`、`0x3e` 的错误区别。CRC 标志打开但声明长度不足 20 时，原生减法会回绕；TS 明确拒绝该不支持的范围，不猜测错误码。校验和总长度上限为 16 MiB；未映射或截断的实际来源不被补零。

验证结果：

- **137 组原生校验/分派对照通过**：空参数、低/高长度位、版本与旧格式标识、魔数、声明长度、CRC、容器标志、首项/末项/无匹配选择、子模块长度/版本/魔数/CRC，以及上下文与来源重叠。比较全部已分配内存、状态码、版本标志和后端参数。公开向量在后端入口停止并捕获寄存器，不假称运行了后端。
- Node 独立 CRC 及分块续算 **81 组**通过；加载计划行为 **11 组**、不支持条件 **10 组**通过，覆盖邻接填充、错误前的清理写入、容器子模块和完整 64 位长度。新增 **6 项计划协议回归**，拒绝普通整数请求接收计划、伪装成标量成功、未知后端、改变调用方参数、额外/缺失字段以及无效寄存器编码。Python 回归共 **27 项**通过，严格 TypeScript 通过。
- 两组完整离线路径各有 **2 次原生校验入口改由 TS 执行**，实际选择的均为旧格式后端 `0x102a5e240`。原生校验函数体设有禁止执行检查，进入次数为零；新格式后端仅确认了校验与调用计划，未声称完整路径覆盖其执行。
- 联合此前替换后，两组仍各完成 76 次 TS VM 调用，执行 321,675 / 321,855 条指令，覆盖 73 种已观察操作码；候选及逐操作码次数与原生一致，改变输入仍改变候选，两模块展开字节仍与原生一致。原有 797 组注册表、321 组区段、230 组模块准备、2,418 组展开、440 组对象、254 组标准算法、178 组 zlib ABI（43,284 次调用）及 5 组完整 VM 程序在联合对照中重新通过。

研究用 `buffer_worker.cjs` / `BufferWorker` 增加显式 `planLoad` 消息；普通整数返回协议保持独立。只有确定的入口和两个后端可用，参数必须是 uint64，调用方上下文与输出参数必须保持原值。计划不能报告尚未执行的后端已经成功。真实模块、候选、密钥、随机熵、安全资源及运行内存不导出。

证据：`portable-module-header-evidence.json`、`portable-module-header-validation.json`、`module-header-contract.asm`。**完整本地签名器仍未完成**：两个加载后端主体、依赖解析/绑定、进程级初始化/TLS/宿主注册、其他原生对象包装器，以及 SDS/SDK/设备状态仍有依赖。未联网验签或 iPhone 桌面验证；小组件查询、自动续期及 1.1.5 安装包未改。

### 复现模块校验联合对照

严格编译时加入 `header_validation_host.ts`，保留此前 VM、ABI、host、AES 模块，然后运行：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/verify_portable_header.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa \
  --portable-header work/signature-analysis/portable-build/header_validation_host.js \
  --portable-registry work/signature-analysis/portable-build/registry_validation_host.js \
  --portable-sections work/signature-analysis/portable-build/sections_validation_host.js \
  --portable-expand work/signature-analysis/portable-build/expand_validation_host.js \
  --portable-module work/signature-analysis/portable-build/module_validation_host.js \
  --portable-inflate work/signature-analysis/portable-build/portable_zlib_host.js \
  --portable-standard work/signature-analysis/portable-build/portable_crypto_host.js \
  --portable-buffer work/signature-analysis/portable-build/portable_buffer.js \
  --portable-runtime work/signature-analysis/portable-build/portable_vm_runtime.js \
  --portable-call work/signature-analysis/portable-build/portable_vm_call.js \
  --portable-abi work/signature-analysis/portable-build/portable_vm_abi.js \
  --portable-host work/signature-analysis/portable-build/portable_vm_host.js \
  --portable-aes work/signature-analysis/portable-build/portable_aes.js
```

附加 `--vectors-only` 只运行 137 组公开原生校验向量。Node 检查为 `test_portable_module_header.cjs <compiled portable_module_header.js>`；Python 回归仍使用 `python -B -m unittest discover -s reverse-engineering/cainiao-noad-8.10.703/signature -p 'test_*.py'`。


## 真实格式输入与统一安全因子依赖评估（2026-10-16）

本轮改为检查最小端到端路径。`probe_signing_boundary.py` 沿用真实原生加载器、SDS 和类型 19 导出入口，把合成 INPUT 换成已还原的 **21 个 MTOP 槽位**，显式使用非零时间（秒 1800000000、微秒 123456），仍只处理公开测试文字。六组冷启动运行均返回 50 字节候选，全部消耗相同的 816 次系统熵：

| 对照 | 与基线候选的关系 |
| --- | --- |
| 相同输入、相同时钟、相同熵 | 相等 |
| 仅系统时钟增加一秒，INPUT 不变 | 相等 |
| 仅 x-sid 改变 | 不等 |
| 仅 INPUT 内的 x-t 改变 | 不等 |
| 仅 data JSON 改变、重新计算其 MD5 | 不等 |

这些是**原生离线候选对照**，未把本轮所有新输入再与 TS 联合对照，也没有证明服务端接受候选。仅改变系统时钟时相等，结论限于这两组时钟及相同熵；不能推广为时钟始终无关。`guest_clock.py` 的 Darwin time/timeval 布局另由 iPhoneOS 18.4 SDK、arm64 编译断言和公开内存测试核对；timeval 尾部四字节 padding 保留。

`probe_unified_boundary.py` 进一步执行真实 `lvm_unifiedsec` 原生加载。缺库时返回 **42**，上下文诊断为 `(42,2)`，名称为 `lvm_minilibc`。已从同一 IPA 定位库容器 **0x106672500 / 65119 字节**，代码解压后 **139708 字节**，其业务 metainfo 确实为 `[]`。容器解析器增加显式 `allow_empty_bindings=True` 库模式，原有默认拒绝空绑定的行为保留。先加载该库后，库和统一安全模块的原生加载都返回 **0**。

加载模型还明确要求四个 `UVM_LD_LIBRARY_*` 变量为空，不读取宿主环境。`fchmod` 和 `socketpair` 只提供隔离链接槽；执行这些槽会中断。本轮两个槽均未执行，没有把它们当成已实现的系统调用。

Unified 原始 ABI 探针使用已核对包装器偏移的 **216 字节请求、6 个输出槽、22 槽 INPUT**，useWua 为 0，可选内容显式为空；**未验证完整 Objective-C 包装器与该合成结构的等价性**。首次执行请求 `(2,23,1,0)`。独立执行注册片段核对了注册点 **0x102ba9980 → 处理器 0x102ba9304**；本轮再运行同一注册函数到 `0x102ba9bc4`，核对其 15 个 `(2,23,*,0)` 处理器及它对 `0x1068fdff0` 的分发指针安装。注册回调表仍是隔离合成对象，不能等同于完整 SDK 初始化。

主程序类表中的 `One` 类地址为 **0x10643ecf8**，元类 `+play:` 实现为 **0x102b8632c**。该方法通过静态指针 `0x1066a3300 → 0x102b878e4` 分发；有界 Objective-C 模型仅处理已核对的 `NSString stringWithUTF8String:`、`NSClassFromString("One")`、`NSSelectorFromString("play:")`、`respondsToSelector:`、`methodForSelector:` 和这些合成对象的 ARC 调用。实际执行已进入 `One +play:`，并调用注册项 `(2,23,18,0) → 0x102ba96b0`。该处理器读取 `0x1069c15b8` 的单字节标志；离线切片中为 **0**。静态写入点位于同一初始化函数的 `0x102ba9de8`，在当前探针停止注册的地址之后。不能通过把标志硬置 1 来宣称初始化完成。

上述零标志令 `One +play:` 返回失败，随后真实错误路径在 `0x102b9bb6c` 从尚为 0 的 `0x1068fe200` 读取 `+8`，触发对地址 `0x8` 的未映射读取。六个输出槽仍为空，错误槽 0 只是中间状态，**不是安全因子生成成功**。监控副作用仍按既有切片明确省略，锁/TLS、空状态目录与有限对象模型仍是研究环境；单次执行上限 40 秒、5000 万条指令。下一步需复原标志写入之前的实际初始化调用及第二分发器，不能仅补一个返回值。

证据：`signing-boundary-evidence.json`、`unified-boundary-evidence.json`、`unified-boundary-no-route-evidence.json`、`signing-boundary-validation.json`、`unified-dependency-contract.asm`、`one-runtime-dispatch.asm`。未导出输入、appKey、候选、随机熵或解码安全资源；未发送网络请求。

**完整本地签名器仍未完成。** 普通签名离线一致性与 `One +play:` 的真实调用已取得进展，但还需恢复完整 SDK 初始化、核对 Unified 包装器参数、完成原生剩余依赖移植，最后验证安全因子和服务端验签。小组件查询、自动续期与 **1.1.5 安装包保持不变**，没有把研究探针接入生产请求。

### Unified 路由表的写入来源

继续核对同一摘要的主程序，确认 `0x102ba7ab8` 通过 `ADR` 返回 `0x102b9803c` 的函数地址，可解释为何没有直接 `BL` 调用点。该函数将调用方 `x0` 保存到 `x19`。当该指针非零且 `0x1068fe200` 尚为空时，`0x102b98164` 把它写入全局槽，随即调用 `0x102b97dd8`；后者从该槽取回表，并通过表首项注册 `(2,19,2,1)` 等处理项。`0x102ba98f8` 和当前错误路径 `0x102b9bb68` 均读取同一槽。定点指令见 `unified-router-source.asm`。

当前探针从 `0x102ba9958` 开始执行局部注册，绕过了上述表安装及前置注册，因此 `0x1068fe200` 为零有明确的缺失调用链来源。这个静态证据**没有**证明调用方 `x0` 的构造方式、完整初始化已成功，也没有解除 `0x102ba9de8` 之前的 SDS 和其他回调依赖。下一步应追踪返回该函数地址后的间接调用方和表的两个回调协议，执行前置初始化并核对返回状态，再重跑 Unified 探针；不能仅给全局槽写入合成指针或把错误路径走通视为签名成功。本轮未运行完整初始化、未联网验签、未修改小组件或安装包。

### 路由表前置初始化的离线边界

`probe_unified_router_init.py` 在同一 IPA 的隔离进程内先准备已有的原生签名/SDS 样本路径，再以合成回调表作为 `x0` 执行 `0x102b9803c`。这次确实经 `0x102b98164` 安装 `0x1068fe200`，沿 `0x102b97dd8` 观察到 **12 项**原生处理器注册：`(2,19,*)` 七项、`(2,4,1,1)` 一项、`(2,29,*)` 四项。每项处理器地址由原生 `ADR` 传入；探针只截取这些注册回调并返回其合成状态 0，没有执行处理器或把注册视为业务成功。地址与编号见 `unified-router-init-evidence.json`。

下一次回调是 `(2,1,1,0)`，返回地址 `0x102b9207c`、处理器 `0x102b90660`。对应 `0x102b92060` 至 `0x102b92078` 明确是另一段注册代码；当前探针没有建模这段注册，因此停下，**不能把它称为未注册的业务命令或签名失败码**。全程门控标志 `0x1069c15b8` 仍为零，没有到达安全因子输出。下一步需沿 `0x102b91e74` 核对后续注册和表回调协议，然后再检查初始化完成条件。没有服务端验签，也没有接入小组件。

### 第二段注册与核心模块依赖

把 `0x102b9207c` 至 `0x102b9219c` 的回调限定为原生代码明确传入处理器地址的注册后，离线执行累计观察到 **22 项**注册：前 12 项加上 `(2,1,1/8/9/10/13/17/18/19/20/25,0)` 十项。探针使用括号限定 `address == callback`，避免仅凭返回地址把普通指令误当成注册。完整编号和处理器地址记录于重新生成的 `unified-router-init-evidence.json`。

下一停止点为 `0x102b9233c` 提交的 `(1,34,13,0)`。描述符来自只读地址 `0x105535618`，运行时解码出的模块名为 `lvm_llc_core`，回调地址 `0x102bac1d8`；现有隔离探针尚未提供这个模块注册服务。这里的停止属于**模块加载依赖**，不代表 22 项注册失败，也没有得到安全因子。后续需核对 `lvm_llc_core` 描述符回调、资源来源和注册结果，再继续初始化至门控标志与 Unified 输出；不能为 `(1,34,13,0)` 直接返回合成成功。未修改小组件请求或安装包，未联网验签。

复现（macOS、已配置的研究 Python 环境）：

```sh
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/probe_signing_boundary.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
work/cniao-re-env/bin/python -B reverse-engineering/cainiao-noad-8.10.703/signature/probe_unified_boundary.py \
  reverse-engineering/cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa
```

第二条附加 `--without-native-route` 可复现尚未提供 `(2,23,1,0)` 的负例。时间 ABI 编译检查为 `xcrun --sdk iphoneos clang -target arm64-apple-ios16.0 -fsyntax-only signature/verify_ios_time.c`，从归档根目录执行。未完成任何 iPhone 或服务端验证。
