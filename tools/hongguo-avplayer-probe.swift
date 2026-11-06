import Foundation
import AVFoundation
import CoreVideo

guard CommandLine.arguments.count == 2,
      let url = URL(string: CommandLine.arguments[1]), url.host == "127.0.0.1" else {
    print("Usage: hongguo-avplayer-probe <loopback media URL>")
    exit(2)
}

let item = AVPlayerItem(url: url)
let output = AVPlayerItemVideoOutput(pixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
])
item.add(output)
let player = AVPlayer(playerItem: item)
player.volume = 0
var seeking = false
var checked = false
var frameBeforeSeek = false
var frameAfterSeek = false
var frameWidth = 0
var frameHeight = 0
let started = Date()

// Print only playback status and error domains/codes, without media URLs.
func report(_ value: [String: Any], status: Int32) {
    let data = try! JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
    print(String(data: data, encoding: .utf8)!)
    player.pause()
    exit(status)
}

let observer = item.observe(\.status, options: [.initial, .new]) { item, _ in
    if item.status == .failed {
        var errors: [[String: Any]] = []
        var error = item.error as NSError?
        while let current = error, errors.count < 6 {
            errors.append(["domain": current.domain, "code": current.code])
            error = current.userInfo[NSUnderlyingErrorKey] as? NSError
        }
        report(["status": "failed", "errors": errors], status: 1)
    }
    if item.status == .readyToPlay { player.play() }
}

let timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
    let current = player.currentTime(), time = current.seconds
    if let frame = output.copyPixelBuffer(forItemTime: current, itemTimeForDisplay: nil) {
        frameWidth = CVPixelBufferGetWidth(frame)
        frameHeight = CVPixelBufferGetHeight(frame)
        if !seeking { frameBeforeSeek = true }
        else if checked && time >= 20 { frameAfterSeek = true }
    }
    if time >= 0.5 && frameBeforeSeek && !seeking {
        seeking = true
        player.seek(to: CMTime(seconds: 20, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero) { finished in
            checked = finished
            player.play()
        }
    }
    if checked && time >= 20.5 && frameAfterSeek {
        report([
            "status": "playing", "time": time, "duration": item.duration.seconds,
            "frameBeforeSeek": frameBeforeSeek, "frameAfterSeek": frameAfterSeek,
            "frameWidth": frameWidth, "frameHeight": frameHeight,
            "elapsedSeconds": Date().timeIntervalSince(started),
        ], status: 0)
    }
    if Date().timeIntervalSince(started) >= 25 {
        report(["status": "timeout", "itemStatus": item.status.rawValue, "time": time], status: 2)
    }
}
RunLoop.main.run()
