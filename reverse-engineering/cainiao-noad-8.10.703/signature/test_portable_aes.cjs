/** Public FIPS/NIST vectors and independent Node crypto checks; no sample data. */
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { aesPkcs7 } = require(require('node:path').resolve(process.argv[2]))
let cases = 0

/** Decode a public hexadecimal test vector. */
function hex(text) { return new Uint8Array(Buffer.from(text, 'hex')) }

// FIPS 197 Appendix C: the first ciphertext block is independent of PKCS#7.
for (const [key, ciphertext] of [
  ['000102030405060708090a0b0c0d0e0f', '69c4e0d86a7b0430d8cdb78070b4c55a'],
  ['000102030405060708090a0b0c0d0e0f1011121314151617', 'dda97ca4864cdfe06eaf70a0ec0d7191'],
  ['000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f', '8ea2b7ca516745bfeafc49904b496089'],
]) {
  const input = hex('00112233445566778899aabbccddeeff')
  const result = aesPkcs7(input, hex(key), 'encrypt', 'ecb', null)
  assert.deepEqual(result.slice(0, 16), hex(ciphertext))
  assert.deepEqual(aesPkcs7(result, hex(key), 'decrypt', 'ecb', null), input)
  cases++
}
// SP 800-38A F.2.1, first AES-128-CBC block.
assert.deepEqual(aesPkcs7(
  hex('6bc1bee22e409f96e93d7e117393172a'), hex('2b7e151628aed2a6abf7158809cf4f3c'),
  'encrypt', 'cbc', hex('000102030405060708090a0b0c0d0e0f'),
).slice(0, 16), hex('7649abac8119b246cee98e9b12e9197d'))
cases++

for (const keyLength of [16, 24, 32]) {
  for (const mode of ['ecb', 'cbc']) {
    for (const length of [0, 1, 15, 16, 17, 31, 32, 33, 300, 47344]) {
      const key = Uint8Array.from({ length: keyLength }, (_, i) => i * 7 & 255)
      const iv = mode === 'cbc' ? Uint8Array.from({ length: 16 }, (_, i) => 255 - i) : null
      const input = Uint8Array.from({ length }, (_, i) => i * 13 & 255)
      const oracle = crypto.createCipheriv(`aes-${keyLength * 8}-${mode}`, key, iv)
      const expected = Buffer.concat([oracle.update(input), oracle.final()])
      const actual = aesPkcs7(input, key, 'encrypt', mode, iv)
      assert.deepEqual(Buffer.from(actual), expected)
      assert.deepEqual(aesPkcs7(actual, key, 'decrypt', mode, iv), input)
      cases++
    }
  }
}

const key = new Uint8Array(16)
assert.throws(() => aesPkcs7(key, new Uint8Array(15), 'encrypt', 'ecb', null))
assert.throws(() => aesPkcs7(key, key, 'encrypt', 'cbc', null))
assert.throws(() => aesPkcs7(key, key, 'encrypt', 'ecb', key))
assert.throws(() => aesPkcs7(new Uint8Array(0), key, 'decrypt', 'ecb', null))
assert.throws(() => aesPkcs7(new Uint8Array(15), key, 'decrypt', 'ecb', null))
const noPadding = crypto.createCipheriv('aes-128-ecb', key, null).setAutoPadding(false)
const invalid = Buffer.concat([noPadding.update(new Uint8Array(16)), noPadding.final()])
assert.throws(() => aesPkcs7(invalid, key, 'decrypt', 'ecb', null), /padding/)
const badSuffix = new Uint8Array(16)
badSuffix[15] = 2
const noPaddingSuffix = crypto.createCipheriv('aes-128-ecb', key, null).setAutoPadding(false)
const inconsistent = Buffer.concat([noPaddingSuffix.update(badSuffix), noPaddingSuffix.final()])
assert.throws(() => aesPkcs7(inconsistent, key, 'decrypt', 'ecb', null), /padding/)
console.log(JSON.stringify({ public_vector_and_oracle_cases: cases, invalid_input_cases: 7, passed: true }))
