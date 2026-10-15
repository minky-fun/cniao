# 仓库开发约定

## Scripting 技能

- 开发、修改或排查本仓库的 Scripting 脚本和小组件时，必须使用 `scripting-app-development` skill。
- 本机技能入口：`/Users/minkyyang/.agents/skills/scripting-app-development/SKILL.md`。先读取技能，再按任务读取相关 references；若路径变化，查找当前安装位置。
- 修改前阅读项目 `script.json`、入口文件及直接依赖，保留现有脚本标识、用户配置和已验证的业务行为。
- 使用或修改 Scripting API 前，核对官方文档 `https://scriptingapp.github.io/llms.txt` 对应完整页面及本地 `dts` 声明，不凭其他框架经验猜测 API。
- Widget 布局按尺寸适配；交互通过 `app_intents.tsx` 注册的 Intent 实现。`Widget.present()` 后执行上下文立即销毁，所需数据必须提前准备好。
- 一次性设置页使用 `await Navigation.present(...)`，关闭后调用 `Script.exit()`。
- 修改后运行适用的 TypeScript 检查；请求或续期逻辑变化时运行相关回归测试。编译和模拟测试不能表述为已通过 iPhone 桌面验证，未验证的尺寸和交互应明确说明。

## 代码要求

1. 所有新写或修改的方法都需要注释，注释不使用 emoji。
2. 减少非必要的 `normalize` 命名函数和字段。
3. 禁止非必要的字段猜测和兜底；缺少必要信息时询问用户。
4. 尽量减少非必要的函数封装，避免无关重构。
5. 不在源码、日志、测试样本或安装包中暴露 Cookie、token、sid 等私密凭据。
6. 菜鸟当前查询与自动续期流程已有验证，界面改动不得顺带修改请求构造或强制要求完整签名请求抓取。

## 打包与版本

- 安装包统一放在仓库根目录 `bao/`，使用固定英文文件名，不在文件名中加入版本号；软件显示名称仍使用中文。
- 菜鸟随行固定为 `bao/Cainiao.scripting`，后续更新覆盖该文件，保留 `script.json` 中的 `name: "cniao"`。
- 发布更新时同步包内 `script.json` 版本和设置页显示版本。
- `.scripting` 包为 ZIP，入口文件位于包根目录。菜鸟包只包含 `script.json`、`index.tsx`、`widget.tsx`、`app_intents.tsx`、`moduleSection.tsx`，不包含调试文件、测试、凭据或未使用模块。
- 打包后验证 ZIP 完整性、包内版本、依赖和源码一致性。

## Git 提交与推送

- 每次完成用户要求的修改并通过适用检查后，自动提交本次相关文件；不夹带其他未完成或无关改动。
- 用户要求推送时，检查目标远程分支，正常推送，不强制覆盖。提交与推送状态应明确区分。
- 菜鸟固定下载地址对应 `https://github.com/minky-fun/cniao` 的 `main` 分支，不能仅凭本机 `origin` 名称认定发布目标。
- 推送安装包后，核对远程包的实际版本再告知用户下载地址已更新。
