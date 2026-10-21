(function () {
  'use strict'
  let player = null

  /** 通过唯一的脚本消息通道通知宿主，不访问网络或传输视频内容。 */
  function notify(event) {
    window.webkit.messageHandlers.hongguoPlayer.postMessage(event).catch(function (error) {
      console.error('播放器消息通道已关闭', error)
    })
  }

  /** 在同一个 WebView 中播放选定的本地缓存，事件携带所属集数以隔离迟到通知。 */
  function load(options) {
    if (!/^[0-9]{1,25}$/.test(options.videoId) || options.url !== options.videoId + '.mp4') {
      throw new Error('缓存视频路径不合法')
    }
    const fullscreen = player ? player.cssfullscreen : false
    if (player) player.destroy()
    const next = new Player({
      id: 'video',
      url: options.url,
      width: '100%',
      height: '100%',
      lang: 'zh-cn',
      autoplay: true,
      autoplayMuted: false,
      volume: 1,
      playsinline: true,
      pip: false,
      cssFullscreen: false,
      fullscreen: { useCssFullscreen: true, needBackIcon: true },
      playbackRate: [0.75, 1, 1.25, 1.5, 2],
      videoAttributes: { 'webkit-playsinline': 'true', playsinline: 'true', disablePictureInPicture: true },
    })
    player = next
    next.on('canplay', function () {
      notify({ type: 'canplay', videoId: options.videoId })
    })
    next.on('playing', function () {
      notify({ type: 'playing', videoId: options.videoId })
    })
    next.on('ended', function () {
      notify({ type: 'ended', videoId: options.videoId })
    })
    next.on('autoplay_was_prevented', function () {
      notify({ type: 'autoplayBlocked', videoId: options.videoId })
    })
    next.on('cssFullscreen_change', function (active) {
      notify({ type: 'fullscreen', videoId: options.videoId, active: active })
    })
    next.on('error', function (error) {
      notify({ type: 'error', videoId: options.videoId,
        message: '西瓜播放器错误：' + (error.message || ('代码 ' + error.errorCode)) })
    })
    if (fullscreen) next.getCssFullscreen()
    return true
  }

  /** 切集前暂停当前网页播放器。 */
  function pause() {
    if (player) player.pause()
    return true
  }

  /** 切集失败时恢复当前视频，自动播放被系统阻止时保留手动播放入口。 */
  function play() {
    if (player) player.play()
    return true
  }

  /** 返回内嵌模式，使用 CSS 全屏避免重新进入 AVKit 的系统全屏控制器。 */
  function exitFullscreen() {
    if (player && player.cssfullscreen) player.exitCssFullscreen()
    return true
  }

  window.hongguoPlayer = { load: load, pause: pause, play: play, exitFullscreen: exitFullscreen }
  notify({ type: 'bridgeReady' })
})()
