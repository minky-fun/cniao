import { Buffer } from "node:buffer"
import { createServer, type Socket } from "node:net"
import { randomBytes } from "node:crypto"
import { AbortController, type AbortSignal } from "scripting"

const TRANSFER_BYTES = 256 * 1024

/** 保留客户端请求的完整字节区间，分块大小仅影响传输，不改变响应范围。 */
export function parseVideoRange(value: string, total: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value)
  if (!match || (!match[1] && !match[2])) return null
  let start: number, end: number
  if (!match[1]) {
    const suffix = Number(match[2])
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null
    start = Math.max(0, total - suffix)
    end = total - 1
  } else {
    start = Number(match[1])
    end = match[2] ? Number(match[2]) : total - 1
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= total || end < start) return null
  return { start, end: Math.min(end, total - 1) }
}

/** 等待实际写入完成再发送下一块，限制本机套接字队列并处理连接中途取消。 */
function writeVideoBytes(socket: Socket, data: string | Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.destroyed) { reject(new Error("播放连接已关闭")); return }
    /** 连接提前关闭时结束等待，避免遗留未完成的传输任务。 */
    const onClose = () => reject(new Error("播放连接已关闭"))
    socket.once("close", onClose)
    socket.write(data, error => {
      socket.removeListener("close", onClose)
      if (error) reject(error)
      else resolve()
    })
  })
}

/** 为 AVPlayer 提供完整 HTTP 响应，同时以固定大小分块读取和发送视频内容。 */
export async function startVideoRangeServer(
  total: number, signal: AbortSignal,
  read: (start: number, end: number, signal: AbortSignal) => Promise<Uint8Array>,
): Promise<{ url: string; dispose: () => void }> {
  signal.throwIfAborted()
  const route = `/${randomBytes(16).toString("hex")}.mp4`, peers = new Set<Socket>()
  let closed = false
  const server = createServer({ allowHalfOpen: true, noDelay: true }, socket => {
    peers.add(socket)
    const requestController = new AbortController()
    let pending = Buffer.alloc(0), handled = false
    socket.on("close", () => { peers.delete(socket); requestController.abort() })
    socket.on("error", () => { requestController.abort(); socket.destroy() })
    socket.setTimeout(30000, () => socket.destroy())

    /** 发送无正文状态并关闭连接，避免 HTTP 持久连接留下未解析的请求。 */
    const status = (code: number, phrase: string, headers = "") => {
      socket.end(`HTTP/1.1 ${code} ${phrase}\r\n${headers}Content-Length: 0\r\nConnection: close\r\n\r\n`)
    }

    /** 校验单个媒体请求，再逐块发送承诺的完整 Content-Length。 */
    const respond = async (header: string) => {
      const lines = header.split("\r\n"), first = /^(\S+) (\S+) HTTP\/1\.[01]$/.exec(lines.shift() ?? "")
      if (!first) { status(400, "Bad Request"); return }
      if (first[2] !== route) { status(404, "Not Found"); return }
      const method = first[1]
      if (method !== "GET" && method !== "HEAD") { status(405, "Method Not Allowed", "Allow: GET, HEAD\r\n"); return }
      let rangeHeader: string | undefined
      for (const line of lines) {
        if (!line) continue
        const colon = line.indexOf(":")
        if (colon <= 0) { status(400, "Bad Request"); return }
        if (line.slice(0, colon).toLowerCase() === "range") {
          if (rangeHeader !== undefined) { status(400, "Bad Request"); return }
          rangeHeader = line.slice(colon + 1).trim()
        }
      }
      const range = rangeHeader !== undefined && method === "GET" ? parseVideoRange(rangeHeader, total) : { start: 0, end: total - 1 }
      if (!range) { status(416, "Range Not Satisfiable", `Content-Range: bytes */${total}\r\n`); return }
      const partial = rangeHeader !== undefined && method === "GET"
      const headers = `HTTP/1.1 ${partial ? "206 Partial Content" : "200 OK"}\r\nContent-Type: video/mp4\r\nAccept-Ranges: bytes\r\nCache-Control: no-store\r\nConnection: close\r\n`
        + (partial ? `Content-Range: bytes ${range.start}-${range.end}/${total}\r\n` : "")
        + `Content-Length: ${range.end - range.start + 1}\r\n\r\n`
      await writeVideoBytes(socket, headers)
      if (method === "GET") {
        for (let start = range.start; start <= range.end; start += TRANSFER_BYTES) {
          requestController.signal.throwIfAborted()
          const end = Math.min(start + TRANSFER_BYTES - 1, range.end)
          const bytes = await read(start, end, requestController.signal)
          requestController.signal.throwIfAborted()
          if (bytes.length !== end - start + 1) throw new Error("视频分块长度不符")
          await writeVideoBytes(socket, bytes)
        }
      }
      socket.end()
    }

    socket.on("data", data => {
      if (handled) return
      pending = Buffer.concat([new Uint8Array(pending), typeof data === "string" ? new Uint8Array(Buffer.from(data)) : new Uint8Array(data)])
      if (pending.length > 16384) { handled = true; status(431, "Request Header Fields Too Large"); return }
      const end = pending.indexOf("\r\n\r\n")
      if (end === -1) return
      handled = true
      socket.pause()
      void respond(pending.subarray(0, end).toString("latin1")).catch(error => {
        if (!requestController.signal.aborted && !closed) console.error("[HG刷剧] 分段传输失败：", error instanceof Error ? error.message.replace(/https?:\/\/\S+/gi, "[播放地址]") : "未知错误")
        socket.destroy()
      })
    })
  })
  server.maxConnections = 6

  /** 关闭监听及所有已接受连接，同时取消各连接未完成的网络读取。 */
  const dispose = () => {
    if (closed) return
    closed = true
    signal.removeEventListener("abort", dispose)
    for (const peer of peers) peer.destroy()
    if (server.listening) server.close()
  }
  signal.addEventListener("abort", dispose)
  server.on("error", () => dispose())
  try {
    await new Promise<void>((resolve, reject) => {
      /** 将异步监听失败或启动期间取消交还给当前播放准备任务。 */
      const fail = () => { cleanup(); reject(new Error("本地播放服务启动失败或已取消")) }
      /** 启动结束后移除一次性监听器，保留服务生命周期错误处理。 */
      const cleanup = () => { server.removeListener("error", fail); signal.removeEventListener("abort", fail) }
      server.once("error", fail)
      signal.addEventListener("abort", fail)
      server.listen({ port: 0, host: "127.0.0.1" }, () => {
        cleanup()
        if (closed) { if (server.listening) server.close(); reject(new Error("播放准备已取消")); return }
        resolve()
      })
    })
    signal.throwIfAborted()
    const endpoint = server.address()
    if (!endpoint) throw new Error("本地播放服务未开始监听")
    return { url: `http://127.0.0.1:${endpoint.port}${route}`, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
