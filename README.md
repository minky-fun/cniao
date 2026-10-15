# Minky Scripting

这是一个基于 [Scripting](https://scriptingapp.github.io/) 的个人脚本仓库，当前包含菜鸟随行小组件（目录 `cniao`） 和 Codex 重置记录小组件 `codex-reset`。

## Codex Reset

`scripts/codex-reset` 按小号、中号和大号三种桌面组件展示最近一次 Codex 用量重置、累计次数、平均间隔、最长间隔与最近 26 周记录。

数据来自 [Codex Resets](https://codex-resets.com/) 的公开只读 API，不需要账号或密钥。小组件默认每 15 分钟请求一次新数据，点击组件会打开数据来源网页。

运行脚本入口后，可以分别预览三种组件尺寸；将脚本添加为系统桌面小组件即可持续查看。

## 菜鸟随行

小组件通过 BoxJS 读取菜鸟登录请求头，展示待取件、派送中和运输中的包裹信息，并支持 small、medium、large 三种尺寸与组件内刷新。

使用前请先在 Loon 中导入 [CainiaoHeaders.plugin](https://www.nsloon.com/openloon/import?plugin=https://raw.githubusercontent.com/minky-fun/loon-scripts/main/plugins/CainiaoHeaders.plugin) 插件，用于抓取菜鸟请求头并写入 BoxJS。

随后在「菜鸟随行」设置页确认 BoxJS 地址；默认地址为：

```text
http://boxjs.com
```
