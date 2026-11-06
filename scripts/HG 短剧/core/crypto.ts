const SBOX = (() => {
  const box = new Uint8Array(256)
  let p = 1
  let q = 1
  do {
    p = (p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0)) & 0xff
    q ^= q << 1
    q ^= q << 2
    q ^= q << 4
    q &= 0xff
    if (q & 0x80) q ^= 0x09
    const x = q ^ ((q << 1) | (q >>> 7)) ^ ((q << 2) | (q >>> 6)) ^ ((q << 3) | (q >>> 5)) ^ ((q << 4) | (q >>> 4))
    box[p] = (x ^ 0x63) & 0xff
  } while (p !== 1)
  box[0] = 0x63
  return box
})()

const xtime = (a: number): number => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff

const TE0 = new Uint32Array(256)
const TE1 = new Uint32Array(256)
const TE2 = new Uint32Array(256)
const TE3 = new Uint32Array(256)
;(() => {
  for (let i = 0; i < 256; i++) {
    const s = SBOX[i]
    const s2 = xtime(s)
    const s3 = s2 ^ s
    TE0[i] = ((s2 << 24) | (s << 16) | (s << 8) | s3) >>> 0
    TE1[i] = ((s3 << 24) | (s2 << 16) | (s << 8) | s) >>> 0
    TE2[i] = ((s << 24) | (s3 << 16) | (s2 << 8) | s) >>> 0
    TE3[i] = ((s << 24) | (s << 16) | (s3 << 8) | s2) >>> 0
  }
})()

export function expandKeyWords(key: Uint8Array): Uint32Array {
  const words = new Uint32Array(44)
  for (let i = 0; i < 4; i++) {
    words[i] =
      ((key[i * 4] << 24) | (key[i * 4 + 1] << 16) | (key[i * 4 + 2] << 8) | key[i * 4 + 3]) >>> 0
  }

  const rcon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]
  for (let i = 4; i < 44; i++) {
    let temp = words[i - 1]
    if (i % 4 === 0) {

      temp =
        ((SBOX[(temp >>> 16) & 0xff] << 24) |
          (SBOX[(temp >>> 8) & 0xff] << 16) |
          (SBOX[temp & 0xff] << 8) |
          SBOX[temp >>> 24]) ^
        (rcon[(i >> 2) - 1] << 24)
    }
    words[i] = (words[i - 4] ^ temp) >>> 0
  }

  return words
}

const KEYSTREAM_WORDS = new Uint32Array(4)

function computeKeystream(
  c0: number,
  c1: number,
  c2: number,
  c3: number,
  roundKeys: Uint32Array,
  out: Uint32Array
): void {
  let s0 = c0 ^ roundKeys[0]
  let s1 = c1 ^ roundKeys[1]
  let s2 = c2 ^ roundKeys[2]
  let s3 = c3 ^ roundKeys[3]

  for (let round = 1; round < 10; round++) {
    const k = round * 4
    const t0 = TE0[s0 >>> 24] ^ TE1[(s1 >>> 16) & 0xff] ^ TE2[(s2 >>> 8) & 0xff] ^ TE3[s3 & 0xff] ^ roundKeys[k]
    const t1 = TE0[s1 >>> 24] ^ TE1[(s2 >>> 16) & 0xff] ^ TE2[(s3 >>> 8) & 0xff] ^ TE3[s0 & 0xff] ^ roundKeys[k + 1]
    const t2 = TE0[s2 >>> 24] ^ TE1[(s3 >>> 16) & 0xff] ^ TE2[(s0 >>> 8) & 0xff] ^ TE3[s1 & 0xff] ^ roundKeys[k + 2]
    const t3 = TE0[s3 >>> 24] ^ TE1[(s0 >>> 16) & 0xff] ^ TE2[(s1 >>> 8) & 0xff] ^ TE3[s2 & 0xff] ^ roundKeys[k + 3]
    s0 = t0 >>> 0
    s1 = t1 >>> 0
    s2 = t2 >>> 0
    s3 = t3 >>> 0
  }

  out[0] = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ roundKeys[40]
  out[1] = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ roundKeys[41]
  out[2] = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ roundKeys[42]
  out[3] = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ roundKeys[43]
}

export function aesCtrDecryptInPlace(
  data: Uint8Array,
  offset: number,
  length: number,
  roundKeys: Uint32Array,
  iv: Uint8Array
): void {

  let c0 = ((iv[0] << 24) | (iv[1] << 16) | (iv[2] << 8) | iv[3]) >>> 0
  let c1 = ((iv[4] << 24) | (iv[5] << 16) | (iv[6] << 8) | iv[7]) >>> 0
  let c2 = iv.length >= 16 ? (((iv[8] << 24) | (iv[9] << 16) | (iv[10] << 8) | iv[11]) >>> 0) : 0
  let c3 = iv.length >= 16 ? (((iv[12] << 24) | (iv[13] << 16) | (iv[14] << 8) | iv[15]) >>> 0) : 0

  const ks = KEYSTREAM_WORDS
  const view = new DataView(data.buffer, data.byteOffset)
  const end = offset + length
  const blockEnd = end - ((end - offset) % 16)
  let position = offset

  const t0Table = TE0
  const t1Table = TE1
  const t2Table = TE2
  const t3Table = TE3
  const sbox = SBOX

  while (position < blockEnd) {
    let s0 = c0 ^ roundKeys[0]
    let s1 = c1 ^ roundKeys[1]
    let s2 = c2 ^ roundKeys[2]
    let s3 = c3 ^ roundKeys[3]

    for (let round = 1; round < 10; round++) {
      const k = round * 4
      const t0 = t0Table[s0 >>> 24] ^ t1Table[(s1 >>> 16) & 0xff] ^ t2Table[(s2 >>> 8) & 0xff] ^ t3Table[s3 & 0xff] ^ roundKeys[k]
      const t1 = t0Table[s1 >>> 24] ^ t1Table[(s2 >>> 16) & 0xff] ^ t2Table[(s3 >>> 8) & 0xff] ^ t3Table[s0 & 0xff] ^ roundKeys[k + 1]
      const t2 = t0Table[s2 >>> 24] ^ t1Table[(s3 >>> 16) & 0xff] ^ t2Table[(s0 >>> 8) & 0xff] ^ t3Table[s1 & 0xff] ^ roundKeys[k + 2]
      const t3 = t0Table[s3 >>> 24] ^ t1Table[(s0 >>> 16) & 0xff] ^ t2Table[(s1 >>> 8) & 0xff] ^ t3Table[s2 & 0xff] ^ roundKeys[k + 3]
      s0 = t0 >>> 0
      s1 = t1 >>> 0
      s2 = t2 >>> 0
      s3 = t3 >>> 0
    }

    const k0 = ((sbox[s0 >>> 24] << 24) | (sbox[(s1 >>> 16) & 0xff] << 16) | (sbox[(s2 >>> 8) & 0xff] << 8) | sbox[s3 & 0xff]) ^ roundKeys[40]
    const k1 = ((sbox[s1 >>> 24] << 24) | (sbox[(s2 >>> 16) & 0xff] << 16) | (sbox[(s3 >>> 8) & 0xff] << 8) | sbox[s0 & 0xff]) ^ roundKeys[41]
    const k2 = ((sbox[s2 >>> 24] << 24) | (sbox[(s3 >>> 16) & 0xff] << 16) | (sbox[(s0 >>> 8) & 0xff] << 8) | sbox[s1 & 0xff]) ^ roundKeys[42]
    const k3 = ((sbox[s3 >>> 24] << 24) | (sbox[(s0 >>> 16) & 0xff] << 16) | (sbox[(s1 >>> 8) & 0xff] << 8) | sbox[s2 & 0xff]) ^ roundKeys[43]

    view.setUint32(position, (view.getUint32(position) ^ k0) >>> 0)
    view.setUint32(position + 4, (view.getUint32(position + 4) ^ k1) >>> 0)
    view.setUint32(position + 8, (view.getUint32(position + 8) ^ k2) >>> 0)
    view.setUint32(position + 12, (view.getUint32(position + 12) ^ k3) >>> 0)

    c3 = (c3 + 1) >>> 0
    if (c3 === 0) {
      c2 = (c2 + 1) >>> 0
      if (c2 === 0) {
        c1 = (c1 + 1) >>> 0
        if (c1 === 0) c0 = (c0 + 1) >>> 0
      }
    }

    position += 16
  }

  if (position < end) {
    computeKeystream(c0, c1, c2, c3, roundKeys, ks)
    for (let i = 0; position + i < end; i++) {
      data[position + i] ^= (ks[i >> 2] >>> (24 - (i & 3) * 8)) & 0xff
    }
  }
}
