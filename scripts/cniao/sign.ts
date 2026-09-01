// mtop x-sign 生成 — 基于 mtopsdk/security/b.java & c.java & util/a.java

// ========== 配置 ==========
let APP_SECRET = "" // TODO: 填入 appSecret

export function setAppSecret(secret: string): void {
  APP_SECRET = secret
}

// ========== MD5 ==========
function md5(str: string): string {
  function rotateLeft(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s))
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return add(rotateLeft(add(add(a, q), add(x, t)), s), b)
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & ~d), a, b, x, s, t)
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }

  function add(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }

  function str2binl(str: string): number[] {
    const bin: number[] = []
    const mask = (1 << 8) - 1
    for (let i = 0; i < str.length * 8; i += 8) {
      bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (i % 32)
    }
    return bin
  }

  function core(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << (len % 32)
    x[(((len + 64) >>> 9) << 4) + 14] = len

    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878

    for (let i = 0; i < x.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d
      a = ff(a, b, c, d, x[i], 7, -680876936)
      d = ff(d, a, b, c, x[i + 1], 12, -389564586)
      c = ff(c, d, a, b, x[i + 2], 17, 606105819)
      b = ff(b, c, d, a, x[i + 3], 22, -1044525330)
      a = ff(a, b, c, d, x[i + 4], 7, -176418897)
      d = ff(d, a, b, c, x[i + 5], 12, 1200080426)
      c = ff(c, d, a, b, x[i + 6], 17, -1473231341)
      b = ff(b, c, d, a, x[i + 7], 22, -45705983)
      a = ff(a, b, c, d, x[i + 8], 7, 1770035416)
      d = ff(d, a, b, c, x[i + 9], 12, -1958414417)
      c = ff(c, d, a, b, x[i + 10], 17, -42063)
      b = ff(b, c, d, a, x[i + 11], 22, -1990404162)
      a = ff(a, b, c, d, x[i + 12], 7, 1804603682)
      d = ff(d, a, b, c, x[i + 13], 12, -40341101)
      c = ff(c, d, a, b, x[i + 14], 17, -1502002290)
      b = ff(b, c, d, a, x[i + 15], 22, 1236535329)
      a = gg(a, b, c, d, x[i + 1], 5, -165796510)
      d = gg(d, a, b, c, x[i + 6], 9, -1069501632)
      c = gg(c, d, a, b, x[i + 11], 14, 643717713)
      b = gg(b, c, d, a, x[i], 20, -373897302)
      a = gg(a, b, c, d, x[i + 5], 5, -701558691)
      d = gg(d, a, b, c, x[i + 10], 9, 38016083)
      c = gg(c, d, a, b, x[i + 15], 14, -660478335)
      b = gg(b, c, d, a, x[i + 4], 20, -405537848)
      a = gg(a, b, c, d, x[i + 9], 5, 568446438)
      d = gg(d, a, b, c, x[i + 14], 9, -1019803690)
      c = gg(c, d, a, b, x[i + 3], 14, -187363961)
      b = gg(b, c, d, a, x[i + 8], 20, 1163531501)
      a = gg(a, b, c, d, x[i + 13], 5, -1444681467)
      d = gg(d, a, b, c, x[i + 2], 9, -51403784)
      c = gg(c, d, a, b, x[i + 7], 14, 1735328473)
      b = gg(b, c, d, a, x[i + 12], 20, -1926607734)
      a = hh(a, b, c, d, x[i + 5], 4, -378558)
      d = hh(d, a, b, c, x[i + 8], 11, -2022574463)
      c = hh(c, d, a, b, x[i + 11], 16, 1839030562)
      b = hh(b, c, d, a, x[i + 14], 23, -35309556)
      a = hh(a, b, c, d, x[i + 1], 4, -1530992060)
      d = hh(d, a, b, c, x[i + 7], 11, 1272893353)
      c = hh(c, d, a, b, x[i + 10], 16, -155497632)
      b = hh(b, c, d, a, x[i + 13], 23, -1094730640)
      a = hh(a, b, c, d, x[i], 4, 681279174)
      d = hh(d, a, b, c, x[i + 3], 11, -358537222)
      c = hh(c, d, a, b, x[i + 6], 16, -722521979)
      b = hh(b, c, d, a, x[i + 9], 23, 76029189)
      a = hh(a, b, c, d, x[i + 12], 4, -640364487)
      d = hh(d, a, b, c, x[i + 15], 11, -421815835)
      c = hh(c, d, a, b, x[i + 2], 16, 530742520)
      b = hh(b, c, d, a, x[i + 4], 23, -995338651)
      a = ii(a, b, c, d, x[i], 6, -198630844)
      d = ii(d, a, b, c, x[i + 7], 10, 1126891415)
      c = ii(c, d, a, b, x[i + 14], 15, -1416354905)
      b = ii(b, c, d, a, x[i + 5], 21, -57434055)
      a = ii(a, b, c, d, x[i + 12], 6, 1700485571)
      d = ii(d, a, b, c, x[i + 3], 10, -1894986606)
      c = ii(c, d, a, b, x[i + 10], 15, -1051523)
      b = ii(b, c, d, a, x[i + 1], 21, -2054922799)
      a = ii(a, b, c, d, x[i + 8], 6, 1873313359)
      d = ii(d, a, b, c, x[i + 15], 10, -30611744)
      c = ii(c, d, a, b, x[i + 6], 15, -1560198380)
      b = ii(b, c, d, a, x[i + 13], 21, 1309151649)
      a = ii(a, b, c, d, x[i + 4], 6, -145523070)
      d = ii(d, a, b, c, x[i + 11], 10, -1120210379)
      c = ii(c, d, a, b, x[i + 2], 15, 718787259)
      b = ii(b, c, d, a, x[i + 9], 21, -343485551)
      a = add(a, olda)
      b = add(b, oldb)
      c = add(c, oldc)
      d = add(d, oldd)
    }
    return [a, b, c, d]
  }

  function binl2hex(binarray: number[]): string {
    const hex = "0123456789abcdef"
    let str = ""
    for (let i = 0; i < binarray.length * 4; i++) {
      str += hex.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf)
        + hex.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf)
    }
    return str
  }

  const bin = str2binl(str)
  return binl2hex(core(bin, str.length * 8))
}

// ========== HMAC-SHA1 ==========
function hmacSha1(data: string, key: string): string {
  function sha1(str: string): number[] {
    const utf8 = unescape(encodeURIComponent(str))
    const words: number[] = []
    let n = utf8.length, i = 0
    while (i < n) {
      words[i >> 2] |= utf8.charCodeAt(i) << (24 - (i % 4) * 8)
      i++
    }
    return coreSha1(words, n * 8)
  }

  function coreSha1(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << (24 - (len % 32))
    x[((len + 64 >> 9) << 4) + 15] = len

    const w: number[] = new Array(80)
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, e = -1009589776

    for (let i = 0; i < x.length; i += 16) {
      const oa = a, ob = b, oc = c, od = d, oe = e
      for (let j = 0; j < 80; j++) {
        if (j < 16) w[j] = x[i + j] || 0
        else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1)
        const t = add32(add32(rol(a, 5), sha1Ft(j, b, c, d)), add32(add32(e, w[j]), sha1Kt(j)))
        e = d; d = c; c = rol(b, 30); b = a; a = t
      }
      a = add32(a, oa); b = add32(b, ob); c = add32(c, oc); d = add32(d, od); e = add32(e, oe)
    }
    return [a, b, c, d, e]
  }

  function sha1Ft(t: number, b: number, c: number, d: number): number {
    if (t < 20) return (b & c) | (~b & d)
    if (t < 40) return b ^ c ^ d
    if (t < 60) return (b & c) | (b & d) | (c & d)
    return b ^ c ^ d
  }

  function sha1Kt(t: number): number {
    if (t < 20) return 1518500249
    if (t < 40) return 1859775393
    if (t < 60) return -1894007588
    return -899497514
  }

  function add32(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff)
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16)
    return (msw << 16) | (lsw & 0xffff)
  }

  function rol(n: number, c: number): number {
    return (n << c) | (n >>> (32 - c))
  }

  function binb2hex(binarray: number[]): string {
    let str = ""
    for (let i = 0; i < binarray.length; i++) {
      const s = (binarray[i] >>> 0).toString(16)
      str += "00000000".slice(s.length) + s
    }
    return str
  }

  const blockSize = 64
  let oKeyPad = "", iKeyPad = ""
  const utf8Key = unescape(encodeURIComponent(key))

  if (utf8Key.length > blockSize) {
    const hashed = binb2hex(sha1(key))
    for (let i = 0; i < blockSize; i++) {
      oKeyPad += String.fromCharCode((parseInt(hashed.substr(i * 2, 2), 16) ^ 0x5c))
      iKeyPad += String.fromCharCode((parseInt(hashed.substr(i * 2, 2), 16) ^ 0x36))
    }
  } else {
    for (let i = 0; i < utf8Key.length; i++) {
      oKeyPad += String.fromCharCode(utf8Key.charCodeAt(i) ^ 0x5c)
      iKeyPad += String.fromCharCode(utf8Key.charCodeAt(i) ^ 0x36)
    }
    for (let i = utf8Key.length; i < blockSize; i++) {
      oKeyPad += String.fromCharCode(0x5c)
      iKeyPad += String.fromCharCode(0x36)
    }
  }

  const inner = binb2hex(sha1(iKeyPad + data))
  return binb2hex(sha1(oKeyPad + unescape(encodeURIComponent(
    Array.from({ length: 20 }, (_, i) =>
      String.fromCharCode(parseInt(inner.substr(i * 2, 2), 16))
    ).join("")
  ))))
}

// ========== 签名串构建 ==========
function nullToEmpty(s: string | undefined | null): string {
  return s ?? ""
}

interface SignParams {
  data: string   // MTOP 请求 data（原始 JSON，会被 MD5）
  api: string    // API 名称
  v: string      // 版本
  t: string      // 时间戳（秒）
  appKey: string // MTOP appKey
  /** 以下可空 */
  utdid?: string
  uid?: string
  reqBizExt?: string
  sid?: string
  ttid?: string
  deviceId?: string
  lat?: string
  lng?: string
  extdata?: string
  xFeatures?: string
  routerId?: string
  placeId?: string
  openBiz?: string
  miniAppkey?: string
  reqAppkey?: string
  accessToken?: string
  openBizData?: string
}

export function buildSignString(p: SignParams): string {
  const parts = [
    nullToEmpty(p.utdid),
    nullToEmpty(p.uid),
    nullToEmpty(p.reqBizExt),
    p.appKey,
    md5(p.data),
    p.t,
    p.api,
    p.v,
    nullToEmpty(p.sid),
    nullToEmpty(p.ttid),
    nullToEmpty(p.deviceId),
    nullToEmpty(p.lat),
    nullToEmpty(p.lng),
  ]

  // extdata: 空则跳过尾部 &，非空则原样拼接
  if (p.extdata) {
    parts.push(p.extdata)
  }

  parts.push(
    nullToEmpty(p.xFeatures),
    nullToEmpty(p.routerId),
    nullToEmpty(p.placeId),
    nullToEmpty(p.openBiz),
    nullToEmpty(p.miniAppkey),
    nullToEmpty(p.reqAppkey),
    nullToEmpty(p.accessToken),
    nullToEmpty(p.openBizData),
  )

  return parts.join("&")
}

export function generateXSign(p: SignParams): string {
  if (!APP_SECRET) throw new Error("APP_SECRET 未设置，请先调用 setAppSecret()")
  const signStr = buildSignString(p)
  return hmacSha1(signStr, APP_SECRET)
}

export function trySecret(p: SignParams, expectedSign: string, candidate: string): boolean {
  const old = APP_SECRET
  APP_SECRET = candidate
  const result = generateXSign(p)
  APP_SECRET = old
  return result === expectedSign
}

// url-decode 你的 x-sign
function urlDecode(s: string): string {
  try { return decodeURIComponent(s) } catch { return s }
}

// 从 boxJs headers + data 验证 appSecret
export function verifyAppSecret(
  params: SignParams,
  capturedXSign: string,   // 直接 copy curl 里的 x-sign
  candidates: string[],     // 候选 appSecret 列表
): string | null {
  const expected = urlDecode(capturedXSign)
  for (const c of candidates) {
    if (trySecret(params, expected, c)) return c
  }
  return null
}
