# Minky Scripting

这是一个基于 [Scripting](https://scriptingapp.github.io/) 的个人脚本仓库，当前包含菜鸟包裹小组件 `cniao`。

小组件通过 BoxJS 读取菜鸟登录请求头，展示待取件、派送中和运输中的包裹信息，并支持 small、medium、large 三种尺寸与组件内刷新。

使用前请先在 Loon 中导入 [CainiaoHeaders.plugin](https://www.nsloon.com/openloon/import?plugin=https://raw.githubusercontent.com/minky-fun/loon-scripts/main/plugins/CainiaoHeaders.plugin) 插件，用于抓取菜鸟请求头并写入 BoxJS。

随后在 `cniao` 设置页确认 BoxJS 地址；默认地址为：

```text
http://boxjs.com
```
