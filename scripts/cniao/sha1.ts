// Pure JS SHA1 implementation for HMAC

function sha1_core(x: number[], len: number): number[] {
  x[len >> 5] |= 0x80 << (24 - (len % 32))
  x[(((len + 64) >> 9) << 4) + 15] = len

  const w: number[] = new Array(80)
  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878
  let e = -1009589776

  for (let i = 0; i < x.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d, olde = e
    for (let j = 0; j < 80; j++) {
      if (j < 16) {
        w[j] = x[i + j]
      } else {
        w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1)
      }
      const t = add32(add32(rol(a, 5), sha1_ft(j, b, c, d)), add32(add32(e, w[j]), sha1_kt(j)))
      e = d; d = c; c = rol(b, 30); b = a; a = t
    }
    a = add32(a, olda); b = add32(b, oldb); c = add32(c, oldc)
    d = add32(d, oldd); e = add32(e, olde)
  }
  return [a, b, c, d, e]
}

function sha1_ft(t: number, b: number, c: number, d: number): number {
  if (t < 20) return (b & c) | ((~b) & d)
  if (t < 40) return b ^ c ^ d
  if (t < 60) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

function sha1_kt(t: number): number {
  if (t < 20) return 1518500249
  if (t < 40) return 1859775393
  if (t < 60) return -1894007588
  return -899497514
}

function add32(a: number, b: number): number {
  const lsw = (a & 0xffff) + (b & 0xffff)
  const msw = (a >> 16) + (b >> 16) + (lsw >> 16)
  return (msw << 16) | (lsw & 0xffff)
}

function rol(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt))
}

function str2binb(str: string): number[] {
  const bin: number[] = []
  const mask = (1 << 8) - 1
  for (let i = 0; i < str.length * 8; i += 8) {
    bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << (24 - (i % 32))
  }
  return bin
}

function binb2hex(binarray: number[]): string {
  const hex = "0123456789abcdef"
  let str = ""
  for (let i = 0; i < binarray.length * 4; i++) {
    str += hex.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8 + 4)) & 0xf)
      + hex.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xf)
  }
  return str
}

export function sha1(s: string): string {
  return binb2hex(sha1_core(str2binb(s), s.length * 8))
}

export function hmac_sha1(key: string, data: string): string {
  let bkey = str2binb(key)
  if (bkey.length > 16) {
    bkey = sha1_core(bkey, key.length * 8)
  }
  const ipad: number[] = new Array(16), opad: number[] = new Array(16)
  for (let i = 0; i < 16; i++) {
    ipad[i] = (bkey[i] || 0) ^ 0x36363636
    opad[i] = (bkey[i] || 0) ^ 0x5c5c5c5c
  }
  const hash = sha1_core(ipad.concat(str2binb(data)), 512 + data.length * 8)
  return binb2hex(sha1_core(opad.concat(hash), 512 + 160))
}
