# Minky Scripting

这是一个基于 [Scripting](https://scriptingapp.github.io/) 的个人脚本仓库，当前包含菜鸟随行小组件（目录 `cniao`） 和 Codex 重置记录小组件 `codex-reset`。

## 安装包与更新约定

所有安装包放在 `bao/` 下，使用固定英文文件名，不附加版本号；软件在 Scripting 中的显示名称仍使用中文。后续发布覆盖同名文件，版本号维护在包内 `script.json` 中，并保留原有脚本标识 `name`。

菜鸟随行的固定安装包为 [Cainiao.scripting](bao/Cainiao.scripting)。更新时始终使用此路径。

## 逆向分析资料

[reverse-engineering/](reverse-engineering/README.md) 归档去广告版菜鸟 8.10.703 的原生认证分析、自动续期修复说明和反汇编证据，与小组件运行代码分开。

## Codex Reset

`scripts/codex-reset` 按小号、中号和大号三种桌面组件展示最近一次 Codex 用量重置、累计次数、平均间隔、最长间隔与最近 26 周记录。

数据来自 [Codex Resets](https://codex-resets.com/) 的公开只读 API，不需要账号或密钥。小组件默认每 15 分钟请求一次新数据，点击组件会打开数据来源网页。

运行脚本入口后，可以分别预览三种组件尺寸；将脚本添加为系统桌面小组件即可持续查看。

## 菜鸟随行

小组件通过 BoxJS 读取菜鸟登录请求头，展示待取件、派送中和运输中的包裹信息，并支持 small、medium、large 三种尺寸与组件内刷新。

组件代码按职责组织：`widget.tsx` 展示包裹，`cainiao.ts` 负责查询、响应解析与会话续期，`settings.ts` 共享配置和版本，`index.tsx` 展示设置，`moduleSection.tsx` 提供插件安装入口，`app_intents.tsx` 注册交互动作。现有配置和凭据存储键保持兼容。

签名研究资料放在 `reverse-engineering/`，不打入安装包。当前组件沿用已验证的抓取请求，未使用本地 HMAC 代替 SecurityGuard；自动续期仍受服务端凭据和签名有效性限制。

使用前请先在 Loon 中导入 [CainiaoHeaders.plugin](https://www.nsloon.com/openloon/import?plugin=https://raw.githubusercontent.com/minky-fun/loon-scripts/main/plugins/CainiaoHeaders.plugin) 插件，用于抓取菜鸟请求头并写入 BoxJS。

随后在「菜鸟随行」设置页确认 BoxJS 地址；默认地址为：

```text
http://boxjs.com
```

## 菜鸟组件检查与打包

使用已安装的 TypeScript 编译器执行 `tsc -p tools/tsconfig.cniao.json`，生成测试所需的临时 JavaScript 后运行：

```sh
node --test tests/cniao-renewal.test.cjs
python3 -B tools/package-cainiao.py
```

打包工具会核对 `settings.ts` 与 `script.json` 的版本，按入口的实际本地依赖生成 `bao/Cainiao.scripting`，验证 ZIP 完整性及文件内容。测试使用合成凭据和模拟网关，不读取真实账号、不发送认证请求。通过这些检查后仍需在 iPhone 上预览三种尺寸，并验证桌面刷新、分页及实际会话续期。
