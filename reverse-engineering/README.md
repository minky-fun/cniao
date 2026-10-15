# 菜鸟原生认证逆向资料

本目录仅归档用户提供的去广告版 **8.10.703** 的静态分析资料，与 `scripts/cniao` 运行代码分开。

## 阅读顺序

1. [原生认证分析](cainiao-noad-8.10.703/原生认证分析.md)：样本摘要、解密状态、autologin 和 CNLoginSDK 两条认证路径、响应与持久化证据及限制。
2. [自动续期修复说明](cainiao-noad-8.10.703/自动续期修复说明.md)：内嵌 `autoLoginRequest` 的 token 轮换、sid 保存时机、错误处理和模拟测试结果。
3. [原生认证反汇编](cainiao-noad-8.10.703/原生认证反汇编.txt)与 [autologin 初始化证据](cainiao-noad-8.10.703/autologin初始化证据.txt)：定点 ARM64 指令和 selector 注释。
4. [evidence](cainiao-noad-8.10.703/evidence/)：选取的认证类、字符串、分段反汇编与注释辅助脚本。

## 归档范围与使用

- 分析日期：2026-10-15。Bundle ID：`com.cainiao.cnwireless`，版本 `8.10.703`，构建 `47277341`。主程序 SHA-256 见原生认证分析。
- 本次原生分析使用本地 Mach-O、Objective-C 元数据和反汇编工具，未调用 REA 服务；不将此前其他版本的 REA 结果混入此目录。
- [Cainiao_8.10.703_NoAd.ipa](cainiao-noad-8.10.703/Cainiao_8.10.703_NoAd.ipa) 为用户提供的分析样本，包含去广告注入库；未安装或运行验证，不代表已审计该注入库。IPA 的大小与 SHA-256 记录在 `manifest.json` 中。
- 未单独存放主程序或注入库，也未包含完整元数据转储、其他版本资料或真实账号抓包数据。
- `小组件自动续期修复.patch` 是历史修复快照，供阅读对照，不应直接应用到当前源码。
- `evidence/annotate.py` 是本样本的定点注释工具，依赖 ARM64 Objective-C stub 的已观察形式。从上述 IPA 手动提取 `Payload/Cainiao4iPhone.app/Cainiao4iPhone`，核对摘要后放到该脚本同目录，运行 `python3 annotate.py`，读取同目录 `*selected.asm`，生成 `auth-annotated.asm`。脚本不自动下载或解包样本。
- 相比原始归档，修复说明去除了本机绝对路径及过时的“未提交”状态，辅助脚本的方法注释改为中文；其余证据保留原内容。`manifest.json` 记录归档证据文件的字节数与 SHA-256。
- 这些材料证明对应样本中的静态实现，不证明当前服务端接受请求，也不保证旧签名或 refreshToken 可以永久续期。当前组件实现以 `scripts/cniao` 为准。
