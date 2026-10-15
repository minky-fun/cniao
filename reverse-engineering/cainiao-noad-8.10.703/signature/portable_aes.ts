/** FIPS 197 AES reference for the observed valid CBC/ECB + PKCS#7 operations.
 * Research only: no sample keys, SDK state, request signing or Scripting APIs.
 * This table-based implementation does not provide constant-time guarantees.
 */

/** Multiply bytes in GF(2^8) using the AES reduction polynomial. */
function multiply(a: number, b: number): number {
  let result = 0
  for (let bit = 0; bit < 8; bit++) {
    if (b & 1) result ^= a
    a = ((a << 1) ^ (a & 128 ? 0x11b : 0)) & 255
    b >>>= 1
  }
  return result
}

const sbox = new Uint8Array(256)
const inverseSbox = new Uint8Array(256)
const products = Array.from({ length: 15 }, () => new Uint8Array(256))
for (let value = 0; value < 256; value++) {
  let inverse = 1
  let power = value
  for (let exponent = 254; exponent; exponent >>>= 1) {
    if (exponent & 1) inverse = multiply(inverse, power)
    power = multiply(power, power)
  }
  let substituted = inverse ^ 0x63
  for (let shift = 1; shift <= 4; shift++) {
    substituted ^= ((inverse << shift) | (inverse >>> (8 - shift))) & 255
  }
  sbox[value] = substituted
  inverseSbox[substituted] = value
  for (const factor of [2, 3, 9, 11, 13, 14]) products[factor][value] = multiply(value, factor)
}

/** Expand an explicit 128/192/256-bit key into byte-oriented round keys. */
function expandKey(key: Uint8Array): Uint8Array {
  const expanded = new Uint8Array(16 * (key.length / 4 + 7))
  expanded.set(key)
  let rcon = 1
  for (let offset = key.length; offset < expanded.length; offset += 4) {
    const word = expanded.slice(offset - 4, offset)
    if (offset % key.length === 0) {
      const first = word[0]
      word[0] = sbox[word[1]] ^ rcon
      word[1] = sbox[word[2]]
      word[2] = sbox[word[3]]
      word[3] = sbox[first]
      rcon = multiply(rcon, 2)
    } else if (key.length === 32 && offset % key.length === 16) {
      for (let i = 0; i < 4; i++) word[i] = sbox[word[i]]
    }
    for (let i = 0; i < 4; i++) expanded[offset + i] = expanded[offset + i - key.length] ^ word[i]
  }
  return expanded
}

/** XOR one round key into the column-major AES state. */
function addRoundKey(state: Uint8Array, expanded: Uint8Array, round: number): void {
  for (let i = 0; i < 16; i++) state[i] ^= expanded[round * 16 + i]
}

/** Apply the forward or inverse row permutation without changing column order. */
function shiftRows(state: Uint8Array, inverse: boolean): void {
  const before = state.slice()
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 4; column++) {
      state[row + 4 * column] = before[row + 4 * ((column + (inverse ? 4 - row : row)) % 4)]
    }
  }
}

/** Apply the standard forward or inverse AES MixColumns matrix. */
function mixColumns(state: Uint8Array, inverse: boolean): void {
  const factors = inverse ? [14, 11, 13, 9] : [2, 3, 1, 1]
  for (let column = 0; column < 16; column += 4) {
    const before = state.slice(column, column + 4)
    for (let row = 0; row < 4; row++) {
      let value = 0
      for (let i = 0; i < 4; i++) {
        const factor = factors[(i - row + 4) % 4]
        value ^= factor === 1 ? before[i] : products[factor][before[i]]
      }
      state[column + row] = value
    }
  }
}

/** Encrypt or decrypt a single block with an already expanded key. */
function transformBlock(block: Uint8Array, expanded: Uint8Array, decrypt: boolean): Uint8Array {
  const state = block.slice()
  const rounds = expanded.length / 16 - 1
  addRoundKey(state, expanded, decrypt ? rounds : 0)
  for (let step = 1; step <= rounds; step++) {
    if (decrypt) shiftRows(state, true)
    for (let i = 0; i < 16; i++) state[i] = (decrypt ? inverseSbox : sbox)[state[i]]
    if (!decrypt) shiftRows(state, false)
    if (!decrypt && step !== rounds) mixColumns(state, false)
    addRoundKey(state, expanded, decrypt ? rounds - step : step)
    if (decrypt && step !== rounds) mixColumns(state, true)
  }
  return state
}

/** Transform explicit ECB/CBC data with PKCS#7; reject missing IVs and malformed padding. */
export function aesPkcs7(
  input: Uint8Array,
  key: Uint8Array,
  direction: "encrypt" | "decrypt",
  mode: "ecb" | "cbc",
  iv: Uint8Array | null,
): Uint8Array {
  if (![16, 24, 32].includes(key.length)) throw new Error("AES key must contain 16, 24 or 32 bytes")
  if (direction !== "encrypt" && direction !== "decrypt") throw new Error("Unknown AES direction")
  if (mode !== "ecb" && mode !== "cbc") throw new Error("Unknown AES mode")
  if (mode === "cbc" ? iv?.length !== 16 : iv !== null) throw new Error("AES IV does not match explicit mode")
  const decrypt = direction === "decrypt"
  if (decrypt && (!input.length || input.length % 16)) throw new Error("AES ciphertext must contain complete blocks")
  const padding = 16 - input.length % 16
  const source = decrypt ? input : new Uint8Array(input.length + padding)
  if (!decrypt) {
    source.set(input)
    source.fill(padding, input.length)
  }
  const result = new Uint8Array(source.length)
  const expanded = expandKey(key)
  let previous = iv
  for (let offset = 0; offset < source.length; offset += 16) {
    let block: Uint8Array = source.slice(offset, offset + 16)
    if (!decrypt && mode === "cbc") {
      for (let i = 0; i < 16; i++) block[i] ^= previous![i]
    }
    block = transformBlock(block, expanded, decrypt)
    if (decrypt && mode === "cbc") {
      for (let i = 0; i < 16; i++) block[i] ^= previous![i]
    }
    result.set(block, offset)
    previous = decrypt ? source.slice(offset, offset + 16) : block
  }
  expanded.fill(0)
  if (!decrypt) return result
  const count = result[result.length - 1]
  if (count < 1 || count > 16) throw new Error("Invalid PKCS#7 padding")
  for (let i = result.length - count; i < result.length; i++) {
    if (result[i] !== count) throw new Error("Invalid PKCS#7 padding")
  }
  return result.slice(0, result.length - count)
}
