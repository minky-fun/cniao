/** Portable standard primitives; no Node, WebCrypto, native library or Scripting imports. */
const md5Constants = new Uint32Array(64)
for (let index = 0; index < 64; index++) md5Constants[index] = Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000)
const md5Rotations = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21]
export const base64Alphabet = Uint8Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', value => value.charCodeAt(0))

/** Rotate one uint32 while preserving JavaScript's exact bitwise truncation. */
function rotate(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0
}

/** Append the standard 0x80 bit and uint64 bit length for one-shot digest processing. */
function padded(source: Uint8Array, littleEndian: boolean): Uint8Array {
  if (!(source instanceof Uint8Array) || source.length > 0x1000000) throw new Error('Digest input exceeds explicit boundary')
  const output = new Uint8Array(Math.ceil((source.length + 9) / 64) * 64)
  output.set(source)
  output[source.length] = 0x80
  const view = new DataView(output.buffer)
  const bits = BigInt(source.length) * 8n
  view.setBigUint64(output.length - 8, bits, littleEndian)
  return output
}

/** Compute RFC 1321 MD5 bytes, including zero-length and arbitrary binary input. */
export function md5(source: Uint8Array): Uint8Array {
  const input = padded(source, true)
  const view = new DataView(input.buffer)
  const state = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476])
  for (let block = 0; block < input.length; block += 64) {
    let [a, b, c, d] = state
    for (let index = 0; index < 64; index++) {
      const round = index >>> 4
      const word = round === 0 ? index : round === 1 ? (5 * index + 1) % 16 : round === 2 ? (3 * index + 5) % 16 : (7 * index) % 16
      const mixed = round === 0 ? (b & c) | (~b & d) : round === 1 ? (b & d) | (c & ~d) : round === 2 ? b ^ c ^ d : c ^ (b | ~d)
      const next = (b + rotate((a + mixed + md5Constants[index] + view.getUint32(block + word * 4, true)) >>> 0, md5Rotations[round * 4 + index % 4])) >>> 0
      a = d; d = c; c = b; b = next
    }
    state[0] += a; state[1] += b; state[2] += c; state[3] += d
  }
  const output = new Uint8Array(16)
  const result = new DataView(output.buffer)
  for (let index = 0; index < state.length; index++) result.setUint32(index * 4, state[index], true)
  return output
}

/** Compute FIPS 180 SHA-1 bytes without treating binary input as a string. */
export function sha1(source: Uint8Array): Uint8Array {
  const input = padded(source, false)
  const view = new DataView(input.buffer)
  const state = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0])
  const words = new Uint32Array(80)
  for (let block = 0; block < input.length; block += 64) {
    for (let index = 0; index < 16; index++) words[index] = view.getUint32(block + index * 4, false)
    for (let index = 16; index < 80; index++) words[index] = rotate(words[index - 3] ^ words[index - 8] ^ words[index - 14] ^ words[index - 16], 1)
    let [a, b, c, d, e] = state
    for (let index = 0; index < 80; index++) {
      const mixed = index < 20 ? (b & c) | (~b & d) : index < 40 || index >= 60 ? b ^ c ^ d : (b & c) | (b & d) | (c & d)
      const constant = index < 20 ? 0x5a827999 : index < 40 ? 0x6ed9eba1 : index < 60 ? 0x8f1bbcdc : 0xca62c1d6
      const next = (rotate(a, 5) + mixed + e + constant + words[index]) >>> 0
      e = d; d = c; c = rotate(b, 30); b = a; a = next
    }
    state[0] += a; state[1] += b; state[2] += c; state[3] += d; state[4] += e
  }
  const output = new Uint8Array(20)
  const result = new DataView(output.buffer)
  for (let index = 0; index < state.length; index++) result.setUint32(index * 4, state[index], false)
  return output
}

/** Compute RFC 2104 HMAC-SHA1, hashing keys longer than the 64-byte block first. */
export function hmacSha1(source: Uint8Array, key: Uint8Array): Uint8Array {
  if (!(source instanceof Uint8Array) || !(key instanceof Uint8Array) || source.length > 0x1000000 - 64 || key.length > 0x1000000) throw new Error('HMAC input exceeds explicit boundary')
  const block = key.length > 64 ? sha1(key) : key
  const inner = new Uint8Array(64 + source.length)
  const outer = new Uint8Array(84)
  for (let index = 0; index < 64; index++) {
    const value = index < block.length ? block[index] : 0
    inner[index] = value ^ 0x36
    outer[index] = value ^ 0x5c
  }
  inner.set(source, 64)
  outer.set(sha1(inner), 64)
  return sha1(outer)
}

/** Encode bytes with a supplied 64-byte alphabet and standard '=' padding. */
export function base64Encode(source: Uint8Array, alphabet: Uint8Array = base64Alphabet): Uint8Array {
  if (!(source instanceof Uint8Array) || source.length > 0x1000000 || !(alphabet instanceof Uint8Array) || alphabet.length !== 64) throw new Error('Base64 input or alphabet rejected')
  const output = new Uint8Array(Math.ceil(source.length / 3) * 4)
  for (let input = 0, out = 0; input < source.length; input += 3, out += 4) {
    const first = source[input]
    const second = input + 1 < source.length ? source[input + 1] : 0
    const third = input + 2 < source.length ? source[input + 2] : 0
    output[out] = alphabet[first >>> 2]
    output[out + 1] = alphabet[((first & 3) << 4) | (second >>> 4)]
    output[out + 2] = input + 1 < source.length ? alphabet[((second & 15) << 2) | (third >>> 6)] : 61
    output[out + 3] = input + 2 < source.length ? alphabet[third & 63] : 61
  }
  return output
}

/** Verified reflected IEEE CRC-32 polynomial, with a uint64-sized native table slot. */
export const crc32Table = new Uint32Array(256)
for (let index = 0; index < crc32Table.length; index++) {
  let value = index
  for (let bit = 0; bit < 8; bit++) value = ((value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0)) >>> 0
  crc32Table[index] = value
}

/** Match SGCrc32's zero initial state and absent final XOR, rather than zlib's default convention. */
export function crc32Raw(source: Uint8Array): number {
  if (!(source instanceof Uint8Array) || source.length > 0x1000000) throw new Error('CRC input exceeds explicit boundary')
  let value = 0
  for (const byte of source) value = (crc32Table[(value ^ byte) & 255] ^ (value >>> 8)) >>> 0
  return value
}
