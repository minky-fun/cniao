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
