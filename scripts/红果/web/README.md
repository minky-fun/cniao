西瓜播放器资源固定为 xgplayer 3.0.26，JS/CSS 原样来自 npm 官方包 `xgplayer@3.0.26` 的 `dist/index.min.js`、`dist/index.min.css`，许可证见 `LICENSE.xgplayer`。

源码项目：https://github.com/bytedance/xgplayer

`player.html` 与 `player.js` 为红果本地播放器入口。资源部署到视频缓存目录，由 WebView 仅授权读取该目录，播放器不使用 CDN，也不把 MP4 转成 Base64 或整集读入脚本内存。

全屏按钮使用 CSS 全屏并通知宿主扩展现有 WebView；关闭画中画，不创建 Scripting 的 AVPlayer/AVPlayerView。缓存下载、解密与视频接口继续使用原有业务模块。
