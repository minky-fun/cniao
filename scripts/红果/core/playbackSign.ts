import { Buffer } from "node:buffer"
import { createHash, randomBytes } from "node:crypto"

// Protocol constants recovered from desktop 1.2.21; these are not device credentials.
const SBOX = Buffer.from(
  "fa7d086b9c59b34b045f39d0384a91990067a6209ff54d827326eedf18668333800319fbd9feaeaaa9b052c60bf379254e78b436ac5d1a279e88dbbd3c63ec49" +
  "15c1301fdcb856d46ccdca0943c835a3ef1ef496d2fc0e727b9484d1ea455a62023fd31281342bdd7ee628f2a54613013b21f66137292a0ded8cafbf9d5cbb24" +
  "760f75e45389e1988db19a65704f544c58ab6e6f8b23c407110cbacfa0a48ed8053d14b2da74c3d7e7bed67fde48163e8590a155b7774222c986502e17f96431" +
  "2c9bf16d1c4468e3e9a89397cb3257ebe5716aadc0ccc7c5fd601da22d47a7e251695e7ace0a41b6958ff7b987e03a06108ab5f85bd5f0bc92ff7c2fc2e81b40" +
  "ec1bdabdba98910cb22b83413467fb0ad876b546055961237590872ae350154cacb179ebaee595470468f0863d518b0fca8ee4b94ef21282bc0ed5f7ef2825cf" +
  "5b5de96a5502e133be93e7f5ad9d3e3924a8e2fa1757d07a0d0830d6b8a38dfd079ac41e6e226497d21db0bf45663f6cdddb2780a711dca6c552f8c0b6c85c00" +
  "73607ba01913aac935484bd3a4cd9f99f3104440547e29f4061fa2aba12f3cf6af856236217f5edf201ab3b4e6ff72848f6526945a77ea4378c74acc2c146bc6" +
  "e87453fcd41cce317003188c96383289f13a5fd7f9a969b7633758c23bc371cb9e92018a0b4d889bbb4f6d6fe0fea549de561609ed9cc12dee817dd97cd12e42" +
  "5b4dc1a65dea44fd454e1ba13fd189e17d2faadbabad59cbb1ce9a28c9e0f670394ad7ff30f5ddbc573b118db2ee00b6e61a5a7cf9dec4cd2e80bbb94ca59f84" +
  "08c66f426cf027e78b3a9c51fb6721754131a7ca20432ab7bfd97af2b5f88c2c23834f8f60a004133714e301c563665c7481df58bd68903dd2b334f419933229" +
  "d649ae0d4bd8079eac1e2d0b40b872ba761071a8e4561d48fee5c24791da87269d1f886bc098be25099733a385165e7fdc6e54e9f7a9c8e8c377d0822bec0262" +
  "8a920e3eb00f05f3f19678388636183c24cf0ab453cc6165a4c794d5157e6def792235126a8e5206557b46645095e20cedd31703a29b99eb1cfcafd47369fa5f" +
  "f72c1ebfc8e1f39f76807148aa94ad64fb89c660c332b34dd2e044dd5fa8b1c7682334c96d127fb7eb15bea9d17893a00c92a4d747e38ac270ab26419a79a7d8" +
  "14858fc06f56d08c11b92e3ce29dcf0ede035d463ecd38430f335ad91a656c223bfc30a688ea37a2b48d8e519cd640eef9f884f4ae97e9ca0a456757042f835c" +
  "d5c5c482b6a391981f4aac96816ecb1b0908af1895497d54edfa16313adab866f5a5f1fe10010674cc63df7c2825f6ceb24f8be5bc8769bb8621070036e70b50" +
  "599b1ce862581961f2bd275eba1de699423d0d2ab5dc5b29f02d4c537b6a734e3f75ff4ba1351755723920d3b0fdef02ec777ee42bdb90c1059e7ad4526b2413", "hex"
)

const ORDERS = Buffer.from(
  "0f0704000908030a060b050d0e010c020f05080c0009020103070e060b0a0d04060500070c000a04080f010b0d09020e060b02050403080101070a000d0c090e" +
  "0d070e0f0b0208030c0509010004060a0d0902060f0b0a040807000c0503010e0c090f07060f030e020d0405010b0a000c050a090e0802040407030f01060b00" +
  "0b0f0408020a0700090d06010e03050c0b060a0508020c03070f0e090d0001040906080f050800040a0b030d01020c0e090d0c0604070a03030f00080105020e" +
  "01000d0f090a0b0e0402080703060c0501080a0c0f0905060b000304020e070d04080f000c0f0e0d0a01060207090503040205080d0b0a0606000e0f070c0903" +
  "0a08040f000b01060d0c0709030e05020a070b050f00020e0108030d0c0609040d070f08050f06040b0a0e0c090002030d0c020704010b0e0e08060f09050003", "hex"
)

const MD5C = [
  0xa7aefe20, 0x7149f1d6, 0x47e4ca07, 0xe9b58f67, 0x93b924de, 0xc614d0f5, 0x38afe0ef, 0xb2bbad73,
  0xe24444c3, 0x9d3aec9b, 0xdf7b37e4, 0xd8b16d40, 0xf8ac31b8, 0x76b9a90b, 0x31d833ee, 0x953fce64,
  0x353595a4, 0x4609c13b, 0x36925008, 0x8c6d0925, 0x5df5c177, 0x1cfbf52b, 0x8a4fa7f0, 0x114ca35e,
  0x8193f984, 0x7a7a8733, 0x316ab4d5, 0x3c20cfc9, 0xa6d84453, 0x3a18500c, 0x798ec47a, 0x97a76b28,
  0x66c4ff96, 0x51716443, 0x0dd2fc3b, 0xb5696da7, 0xbbeb3ac5, 0x5c53d204, 0xd32608ce, 0x7279b9ec,
  0xf4188ecf, 0xf7d793db, 0x332cc491, 0xab76ae15, 0x9bebe727, 0x18a01384, 0x5be9f8a7, 0x5f90a754,
  0x39b663c0, 0x36673c83, 0x7c92f514, 0x9d7d94d7, 0xe2e8d9aa, 0x5f7e9ea9, 0x7abd4551, 0x569e05da,
  0x40a25632, 0x3df5a9a5, 0xbab37d80, 0x454286dc, 0x3f5d4e78, 0x03d7b75d, 0xb1fe4af7, 0xa5ab26a3,
]

const SIGN_KEY = Buffer.from("8ebdfa3806ecc5cee79423e6029ed82540bc2218bb7eaef71cb691f7aa8aa2f5", "hex")
const MAGIC = Buffer.from("f7e85ffad7d7dc3bd62ac87057cf6118", "hex")

/** Join protocol buffers using byte views supported by Scripting's Buffer declarations. */
function join(chunks: Buffer[]): Buffer {
  const output = Buffer.alloc(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length }
  return output
}

/** Write a big-endian word through the standard DataView interface. */
function writeBig(bytes: Buffer, value: number, offset: number): void {
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(offset, value)
}

/** Rotate a protocol word, including negative right rotations. */
function rotate(word: number, bits: number): number {
  bits &= 31
  return ((word << bits) | (word >>> ((32 - bits) & 31))) >>> 0
}

/** Encode a little-endian protocol word. */
function little(word: number): Buffer {
  const result = Buffer.alloc(4)
  result.writeUInt32LE(word >>> 0, 0)
  return result
}

/** Compute SM3 for the query hash and Medusa key schedule. */
export function sm3(input: ArrayLike<number>): Buffer {
  const padded = Buffer.alloc(Math.ceil((input.length + 9) / 64) * 64)
  padded.set(input)
  padded[input.length] = 0x80
  writeBig(padded, Math.floor(input.length / 0x20000000), padded.length - 8)
  writeBig(padded, (input.length * 8) >>> 0, padded.length - 4)
  const state = [0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600,
    0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e]
  const words = new Uint32Array(68)
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let j = 0; j < 16; j++) words[j] = padded.readUInt32BE(offset + j * 4)
    for (let j = 16; j < 68; j++) {
      const x = words[j - 16] ^ words[j - 9] ^ rotate(words[j - 3], 15)
      words[j] = x ^ rotate(x, 15) ^ rotate(x, 23) ^ rotate(words[j - 13], 7) ^ words[j - 6]
    }
    let [a, b, c, d, e, f, g, h] = state
    for (let j = 0; j < 64; j++) {
      const first = j < 16 ? a ^ b ^ c : (a & b) | (a & c) | (b & c)
      const second = j < 16 ? e ^ f ^ g : (e & f) | (~e & g)
      const s1 = rotate((rotate(a, 12) + e + rotate(j < 16 ? 0x79cc4519 : 0x7a879d8a, j)) >>> 0, 7)
      const t1 = (first + d + (s1 ^ rotate(a, 12)) + (words[j] ^ words[j + 4])) >>> 0
      const t2 = (second + h + s1 + words[j]) >>> 0
      d = c; c = rotate(b, 9); b = a; a = t1
      h = g; g = rotate(f, 19); f = e
      e = (t2 ^ rotate(t2, 9) ^ rotate(t2, 17)) >>> 0
    }
    for (const [j, value] of [a, b, c, d, e, f, g, h].entries()) state[j] = (state[j] ^ value) >>> 0
  }
  const output = Buffer.alloc(32)
  for (let j = 0; j < 8; j++) writeBig(output, state[j], j * 4)
  return output
}

/** Select the desktop F13 branch from the exact transmitted query, body and time. */
function signatureBranch(queryHash: Buffer, bodyHash: Buffer, seconds: number): number {
  let result = 0x20230928
  for (const bytes of [queryHash, bodyHash, little(seconds)]) {
    for (let i = 0; i < bytes.length; i++) {
      result = (i & 1 ? ~((result >>> 7) ^ result ^ (bytes[i] | (result << 12)))
        : (result >>> 4) ^ result ^ (result << 6) ^ bytes[i]) >>> 0
    }
  }
  return result
}

/** Bind the branch-2 F13 checksum to this query and JSON body. */
function field13(branch: number, seconds: number, queryHash: Buffer, bodyHash: Buffer): Buffer {
  const group = ((branch & 15) - 2) / 3
  const counter = ([0x8980f29b, 0xeb549c7f, 0xb08726db, 0xd40cb5e6, 0xe8f559e4][group] + seconds) >>> 0
  const salt = Buffer.from("8496779dd4150bf8", "hex")
  for (let i = 0; i < salt.length; i++) salt[i] = (salt[i] * 257) >>> ((counter + 5) & 7)
  const message = join([queryHash, bodyHash, little(seconds), salt, Buffer.from([160, 1, 0, 0])])
  const initial = [0x79e0f2fb, 0xc8b52570, 0xebc2f8cd, 0x7c104d93].map(x => rotate(x, -counter))
  const final = [0x19be4866, 0xe85986b4, 0xe19b326e, 0x71d1d7d4].map(x => rotate(x, -(counter + 6)))
  const shifts = [[7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]]
  let [a, b, c, d] = initial
  for (let i = 0; i < 64; i++) {
    const round = i >>> 4
    const f = round === 0 ? (b & c) | (~b & d) : round === 1 ? (b & d) | (c & ~d)
      : round === 2 ? b ^ c ^ d : c ^ (b | ~d)
    const word = message.readUInt32LE(ORDERS[group * 64 + i] * 4)
    const next = (b + rotate((a + f + word + rotate(MD5C[i], -(counter + 1))) >>> 0, shifts[round][i & 3])) >>> 0
    a = d; d = c; c = b; b = next
  }
  const output = Buffer.alloc(20)
  for (const [i, word] of [a, b, c, d].entries()) output.writeUInt32LE(((initial[i] + word) ^ final[i]) >>> 0, i * 4)
  let check = 0x20220420
  for (let i = 0; i < 12; i++) {
    check = (i & 1 ? (check >>> 5) ^ check ^ ~(output[i] | (check << 11))
      : (check >>> 3) ^ check ^ output[i] ^ (check << 7)) >>> 0
  }
  output.writeUInt32LE(((check | 4) ^ 0x1000000) >>> 0, 16)
  return output
}

/** Append a protobuf varint without truncating millisecond values to 32 bits. */
function varint(output: number[], value: number): void {
  while (value > 127) {
    output.push((value & 127) | 128)
    value = Math.floor(value / 128)
  }
  output.push(value)
}

/** Encode the signed integer fields used by the desktop's protobuf schema. */
function integer(output: number[], field: number, value: number): void {
  varint(output, field * 8)
  varint(output, value < 0 ? -value * 2 - 1 : value * 2)
}

/** Encode a protobuf byte or UTF-8 string field. */
function blob(output: number[], field: number, value: Buffer | Uint8Array | string): void {
  const bytes = typeof value === "string" ? Buffer.from(value) : value
  if (!bytes.length) return
  varint(output, field * 8 + 2)
  varint(output, bytes.length)
  output.push(...bytes)
}

/** Serialize the verified desktop device/environment profile for an anonymous identity. */
function protocol(query: string, seconds: number, nonce: number, deviceId: string,
  queryHash: Buffer, bodyHash: Buffer, f13: Buffer): Buffer {
  const device: number[] = [], report: number[] = [], environment: number[] = [], count: number[] = [], root: number[] = []
  integer(device, 1, 1); integer(device, 2, 2)
  blob(device, 3, "8662"); blob(device, 4, deviceId)
  blob(device, 5, "Ai6svO3PyrwDOUSmO6ZcResxu"); blob(device, 6, "!noperm!")
  integer(device, 7, -888888); integer(device, 8, -888888)
  integer(device, 9, 3); integer(device, 10, -888888); blob(device, 11, "!notset!"); blob(device, 12, "Asia/Shanghai,8")
  blob(device, 13, "zh_CN"); integer(device, 14, 4)
  for (const [i, value] of [255.24993896484375, 35.58599090576172, 3.467449188232422,
    3.467449188232422, 255.1754913330078, 42.17544174194336].entries()) {
    varint(device, (16 + i) * 8 + 5)
    const bytes = Buffer.alloc(4)
    bytes.writeFloatLE(value, 0)
    device.push(...bytes)
  }
  blob(device, 22, "16"); integer(device, 23, 41); integer(device, 24, 36)
  for (let i = 25; i <= 28; i++) integer(device, i, 1728388016635 + (i === 28 ? 2 : 0))
  integer(device, 29, -1)
  for (const [i, text] of ["25053RT47C", "Redmi", "25053RT47C", "25053RT47C", "Xiaomi", "Redmi", "Redmi"].entries()) blob(device, 30 + i, text)
  integer(device, 38, 31)
  integer(report, 1, seconds); integer(report, 2, -2); integer(report, 4, 200)
  integer(environment, 1, 100 + randomBytes(2).readUInt16LE(0) % 21)
  integer(environment, 2, 146331399); integer(environment, 3, 146331396); integer(environment, 5, 7)
  blob(environment, 6, "v04.06.04.03-bugfix")
  integer(environment, 7, 10001 + randomBytes(2).readUInt16LE(0) % 2000)
  blob(environment, 12, Buffer.from(device)); blob(environment, 13, Buffer.from(report)); blob(environment, 14, "7.1.3.32")
  integer(count, 1, 111); integer(count, 2, 10); integer(count, 3, 694367); integer(count, 5, 586952199)
  blob(root, 1, MAGIC); integer(root, 2, 3); integer(root, 3, nonce)
  blob(root, 4, "8662"); blob(root, 5, deviceId); blob(root, 6, "1588093228"); blob(root, 7, "7.1.3.32")
  blob(root, 8, "v04.06.04-ml-android"); integer(root, 9, 67503104)
  blob(root, 10, Buffer.from("4001000000000000", "hex")); integer(root, 12, seconds)
  blob(root, 13, f13); blob(root, 14, queryHash.subarray(0, 6)); blob(root, 15, Buffer.from(count))
  blob(root, 16, "AXYQOS6n2m60x1fVZHIrH3iol"); integer(root, 17, seconds)
  blob(root, 19, sm3(join([Buffer.from(query), bodyHash, Buffer.from("none")])))
  blob(root, 20, "none"); integer(root, 21, 312); blob(root, 23, Buffer.from(environment))
  blob(root, 24, '{"cmr":16777216,"cmr2":16777216,"un_h":1879194040,"vpn":0,"kd":0,"fkd":3672518972,"pd":-1872573247,"dyn":"","do":0,"tk":true}')
  return Buffer.from(root)
}

/** Rotate an eight-bit protocol byte. */
function rotateByte(byte: number, bits: number): number {
  return ((byte << bits) | (byte >>> (8 - bits))) & 255
}

/** Apply the Medusa reverse/XOR diffusion before the custom block transform. */
function diffuse(input: Buffer, key: Buffer): Buffer {
  const output = Buffer.alloc(input.length)
  for (let i = 0; i < input.length; i++) {
    const index = (i * 4) & 28, a = key[index], b = key[index + 1]
    const first = (~(rotateByte(input[i], 4) + a) ^ b) & 255
    output[input.length - 1 - i] = ~(((rotateByte(first, 3) + b) & 255) ^ a) & 255
  }
  const flag = output[output.length - 1] ^ output[output.length - 2], old = output[0]
  output[0] += ~flag
  output[1] += output[0] ^ output[output.length - 1] ^ 254
  output[2] += (flag - old) ^ rotateByte(output[1], 3) ^ 2
  for (let i = 3; i < output.length - 1; i++) output[i] += ~(rotateByte(output[i - 1], 3) ^ output[i - 2] ^ i)
  output[output.length - 1] ^= output[output.length - 2]
  let sum = 0
  for (let i = 1; i < output.length; i++) sum += output[i]
  output[0] = (output[0] ^ output[1]) + sum
  return output
}

/** Perform the desktop's timestamp-selected two-round block transform. */
function transform(input: Buffer, seconds: number): Buffer {
  const branch = seconds & 3
  const box = SBOX.subarray(branch * 256, branch * 256 + 256)
  const columns = [[1, 0, 2, 3], [2, 0, 3, 1], [0, 1, 3, 2], [1, 0, 2, 3]][branch]
  const order = [[0, 9, 14, 11, 4, 13, 2, 7, 8, 1, 6, 15, 12, 5, 10, 3],
    [0, 9, 14, 15, 4, 13, 2, 7, 8, 1, 6, 3, 12, 5, 10, 11],
    [0, 9, 14, 7, 4, 13, 2, 11, 8, 1, 6, 3, 12, 5, 10, 15],
    [0, 9, 14, 11, 4, 13, 2, 7, 8, 1, 6, 15, 12, 5, 10, 3]][branch]
  const initial = [0xca025ddc, 0x823dc546, 0xc9420583, 0xc298225f][branch]
  const expanded = Buffer.alloc(48), key = Buffer.from("f1593376766ea98d34f31b057a9d5be4", "hex")
  for (let i = 0; i < 16; i++) expanded[i] = key[i] ^ (initial >>> ((i & 3) * 8))
  for (let word = 4; word < 12; word++) {
    let previous = Buffer.from(expanded.subarray(word * 4 - 4, word * 4))
    if (word % 4 === 0) previous = Buffer.from([
      ((initial >>> ((8 + (word - 4) * 2) & 24)) & 255) ^ box[previous[1]],
      box[previous[2]], box[previous[3]], box[previous[0]],
    ])
    for (let i = 0; i < 4; i++) expanded[word * 4 + i] = previous[i] ^ expanded[word * 4 + i - 16]
  }
  /** Encrypt one block with the protocol's nonstandard substitution/permutation. */
  function block(source: Buffer): Buffer {
    const output = Buffer.from(source)
    for (let round = 0; round < 3; round++) {
      if (round > 0) {
        const previous = Buffer.from(output)
        for (let i = 0; i < 16; i++) output[i] = box[previous[columns[order[i] >>> 2] * 4 + (order[i] & 3)]]
        if (round === 1) {
          const copy = Buffer.from(output)
          for (let i = 0; i < 16; i++) output[i] = copy[(i & ~3) + columns[i & 3]]
          for (let column = 0; column < 4; column++) {
            const values = [output[column], output[4 + column], output[8 + column], output[12 + column]]
            const total = values[0] ^ values[1] ^ values[2] ^ values[3]
            for (let row = 0; row < 4; row++) {
              const x = values[row] ^ values[(row + 1) & 3]
              output[row * 4 + column] ^= total ^ ((x << 1) ^ (x & 128 ? 0x1b : 0))
            }
          }
        }
      }
      for (let i = 0; i < 16; i++) output[i] ^= expanded[round * 16 + (i & ~3) + columns[i & 3]]
    }
    for (let i = 0; i < 16; i++) output[i] ^= expanded[16 + i]
    return output
  }
  const selected = Buffer.alloc(32)
  for (let i = 0; i < 31; i++) {
    const at = i * 8
    selected[i] = ((input[at] >>> 4) & 2) | (input[at + 1] & 64) | ((input[at + 2] >>> 2) & 1)
      | ((input[at + 3] << 3) & 128) | ((input[at + 4] >>> 1) & 4) | ((input[at + 5] << 3) & 16)
      | ((input[at + 6] << 5) & 32) | ((input[at + 7] >>> 4) & 8)
  }
  selected[31] = 1
  let previous = Buffer.from("1fe109a4125283f418de9e051a969e12", "hex")
  const encrypted = Buffer.alloc(32)
  for (let at = 0; at < 32; at += 16) {
    for (let i = 0; i < 16; i++) selected[at + i] ^= previous[i]
    previous = block(selected.subarray(at, at + 16))
    encrypted.set(previous, at)
  }
  const output = join([Buffer.from([encrypted[31]]), input])
  const positions = [5, 6, 2, 4, 3, 1, 0, 7], sourceBits = [1, 6, 0, 7, 2, 4, 5, 3]
  for (let i = 0; i < 31; i++) {
    for (let j = 0; j < 8; j++) {
      const offset = 1 + i * 8 + j, mask = 1 << positions[j]
      output[offset] = (output[offset] & ~mask) | (((encrypted[i] >>> sourceBits[j]) & 1) << positions[j])
    }
  }
  return output
}

/** Build a fresh Medusa signature using the verified protobuf and cipher pipeline. */
function medusa(query: string, seconds: number, deviceId: string, branch: number,
  queryHash: Buffer, bodyHash: Buffer): string {
  const random = randomBytes(12), nonce = random.readUInt32LE(0), hashRandom = random.readUInt32LE(4)
  const f13 = field13(branch, seconds, queryHash, bodyHash)
  const key = sm3(join([SIGN_KEY, little(hashRandom), SIGN_KEY]))
  const profile = protocol(query, seconds, nonce, deviceId, queryHash, bodyHash, f13)
  const mixed = join([Buffer.from("4001000000000000", "hex"), diffuse(profile, key)]).reverse()
  const byte = (hashRandom >>> 16) & 255
  const seed = little(~(((byte << 11) | (hashRandom >>> 24)) ^ (byte >>> 5) ^ byte))
  for (let i = 0; i < mixed.length; i++) mixed[i] ^= seed[(~i) & 3]
  const check = (0x18000001 | ((queryHash[0] & 63) << 14) | ((f13[0] & 63) << 8)) >>> 0
  const raw = join([Buffer.from([0x35]), random.subarray(8, 12), little(check), mixed, random.subarray(6, 8)])
  const header = join([little(3), MAGIC])
  for (let i = 0; i < header.length; i += 4) header.writeUInt32LE((header.readUInt32LE(i) ^ seconds) >>> 0, i)
  return join([header, random.subarray(4, 6), Buffer.from([0, 1]), transform(raw, seconds)]).toString("base64")
}

/** Encrypt the Helios time payload with the desktop's 34-round Speck schedule. */
function helios(seconds: number): string {
  const nonce = randomBytes(4)
  const key = Buffer.from(createHash("md5").update(Uint8Array.from(join([nonce, Buffer.from("8662")]))).digest("hex"))
  const mask = (1n << 64n) - 1n
  /** Rotate a 64-bit Speck word without signed JavaScript bitwise conversion. */
  function rotate64(value: bigint, count: bigint): bigint {
    return ((value << count) | (value >> (64n - count))) & mask
  }
  /** Read an unsigned little-endian 64-bit word using the documented Buffer subset. */
  function read64(bytes: Buffer, offset: number): bigint {
    return BigInt(bytes.readUInt32LE(offset)) | (BigInt(bytes.readUInt32LE(offset + 4)) << 32n)
  }
  const pending = [read64(key, 8), read64(key, 16), read64(key, 24)], rounds = [read64(key, 0)]
  for (let i = 0; i < 33; i++) {
    const word = ((rotate64(pending.shift()!, 56n) + rounds[i]) & mask) ^ BigInt(i)
    pending.push(word)
    rounds.push(word ^ rotate64(rounds[i], 3n))
  }
  const text = Buffer.from(`${seconds}-1588093228-8662`), pad = 16 - text.length % 16
  const plain = join([text, Buffer.alloc(pad, pad)]), output = Buffer.alloc(4 + plain.length)
  output.set(nonce)
  for (let at = 0; at < plain.length; at += 16) {
    let a = read64(plain, at), b = read64(plain, at + 8)
    for (const round of rounds) {
      b = round ^ ((a + rotate64(b, 56n)) & mask)
      a = b ^ rotate64(a, 3n)
    }
    for (const [i, value] of [a, b].entries()) {
      output.writeUInt32LE(Number(value & 0xffffffffn), 4 + at + i * 8)
      output.writeUInt32LE(Number(value >> 32n), 8 + at + i * 8)
    }
  }
  return output.toString("base64")
}

/** Sign the standard Gorgon RC4 request used by desktop anonymous registration. */
export function signGorgon(query: string, body: Buffer | Uint8Array, seconds: number): string {
  const nonce = randomBytes(2), data = Buffer.alloc(20)
  data.set(createHash("md5").update(query).digest().subarray(0, 4))
  if (body.length) data.set(createHash("md5").update(Uint8Array.from(body)).digest().subarray(0, 4), 4)
  data.writeUInt32LE(67503104, 12); writeBig(data, seconds >>> 0, 16)
  const key = [0x4a, 0x40, 0x16, nonce[1], 0x47, 0x6c, 1, nonce[0]]
  const state = Uint8Array.from({ length: 256 }, (_, i) => i)
  let j = 0
  for (let i = 0; i < 256; i++) {
    j = (j + state[i] + key[i & 7]) & 255
    const old = state[i]; state[i] = state[j]; state[j] = old
  }
  j = 0
  for (let i = 0; i < data.length; i++) {
    const at = i + 1
    j = (j + state[at]) & 255
    const old = state[at]; state[at] = state[j]; state[j] = old
    data[i] ^= state[(state[at] + state[j]) & 255]
  }
  for (let i = 0; i < data.length; i++) {
    data[i] = rotateByte(data[i], 4)
    const value = data[i] ^ data[(i + 1) % data.length]
    let reversed = 0
    for (let bit = 0; bit < 8; bit++) reversed |= ((value >>> bit) & 1) << (7 - bit)
    data[i] = ~(reversed ^ 20) & 255
  }
  return join([Buffer.from([0x84, 4, nonce[0], nonce[1], 0x40, 1]), data]).toString("hex")
}

/** Sign each retry independently, keeping query timestamps and body hashes consistent. */
export function signPlayback(params: Record<string, string>, body: string, stamp = Date.now()): {
  query: string; headers: Record<string, string>
} {
  const bytes = Buffer.from(body), bodyHash = createHash("md5").update(Uint8Array.from(bytes)).digest()
  for (let attempt = 0; attempt < 256; attempt++) {
    const ticket = stamp + attempt, seconds = Math.floor(ticket / 1000)
    const values: Record<string, string> = { ...params, _rticket: String(ticket) }
    const query = Object.keys(values).sort().map(key =>
      `${encodeURIComponent(key)}=${encodeURIComponent(values[key]).replace(/\*/g, "%2A")}`
    ).join("&") + `&ts=${seconds}`
    const queryHash = sm3(Buffer.from(query)), branch = signatureBranch(queryHash, bodyHash, seconds)
    if ((branch & 15) % 3 !== 2) continue
    const big = Buffer.alloc(4)
    writeBig(big, seconds, 0)
    const trace = (ticket >>> 0).toString(16).padStart(8, "0") + "10" + randomBytes(8).toString("hex")
    return { query, headers: {
      "X-Khronos": String(seconds), "X-Ss-Req-Ticket": String(ticket),
      "X-Ss-Stub": bodyHash.toString("hex").toUpperCase(),
      "X-Argus": little(seconds).toString("base64"), "X-Ladon": big.toString("base64"),
      "X-Helios": helios(seconds), "X-Medusa": medusa(query, seconds, params.device_id, branch, queryHash, bodyHash),
      "X-Gorgon": signGorgon(query, bytes, seconds),
      "X-Tt-Trace-Id": `00-${trace}-${trace.slice(0, 16)}-01`,
    } }
  }
  throw new Error("视频请求签名生成失败")
}
