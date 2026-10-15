/** Compare portable standard primitives against independent Node implementations on public data. */
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const {md5, sha1, hmacSha1, base64Encode, crc32Raw} = require(require('node:path').resolve(process.argv[2]))
let digestCases = 0
let hmacCases = 0
let base64Cases = 0
let invalidCases = 0
// Public pattern CRCs independently calculated with Python zlib and adjusted initial/final XOR.
const crcVectors = {"0": 0, "1": 1996959894, "2": 2120184540, "3": 2754578815, "4": 1301484455, "15": 2285992897, "16": 1910949349, "20": 864875996, "31": 3490643214, "32": 2538978968, "55": 995755837, "56": 898318543, "57": 2884864256, "63": 3112810094, "64": 2286257114, "65": 97642999, "119": 3366696595, "120": 2793925977, "127": 2053554778, "128": 648355424, "129": 1859519782, "255": 403667631, "256": 2434845640, "257": 1218314528, "1024": 1450620747, "8192": 977201926, "65537": 3725255513, "1048576": 1360765892}
let crcCases = 0
for (const length of [0, 1, 2, 3, 4, 15, 16, 20, 31, 32, 55, 56, 57, 63, 64, 65, 119, 120, 127, 128, 129, 255, 256, 257, 1024, 8192, 65537, 1048576]) {
  const source = Uint8Array.from({length}, (_value, index) => (index * 31 + length) & 255)
  assert.equal(crc32Raw(source), crcVectors[length])
  crcCases++
  for (const [name, operation] of [['md5', md5], ['sha1', sha1]]) {
    assert.deepEqual(Buffer.from(operation(source)), crypto.createHash(name).update(source).digest())
    digestCases++
  }
  assert.deepEqual(Buffer.from(base64Encode(source)), Buffer.from(Buffer.from(source).toString('base64'), 'ascii'))
  base64Cases++
  for (const keyLength of [0, 1, 20, 63, 64, 65, 128, 257]) {
    const key = Uint8Array.from({length: keyLength}, (_value, index) => (index * 17 + keyLength) & 255)
    assert.deepEqual(Buffer.from(hmacSha1(source, key)), crypto.createHmac('sha1', key).update(source).digest())
    hmacCases++
  }
}
for (const operation of [md5, sha1, base64Encode, crc32Raw]) {
  assert.throws(() => operation('abc'))
  invalidCases++
  assert.throws(() => operation(new Uint8Array(0x1000001)))
  invalidCases++
}
assert.throws(() => hmacSha1(new Uint8Array(0x1000000), new Uint8Array(1)))
invalidCases++
assert.throws(() => hmacSha1(new Uint8Array(1), 'key'))
invalidCases++
assert.throws(() => base64Encode(new Uint8Array(1), new Uint8Array(63)))
invalidCases++
assert.equal(crc32Raw(new Uint8Array(0)), 0)
assert.equal(crc32Raw(Buffer.from('123456789', 'ascii')), 0x2dfd2d88)
crcCases += 2
console.log(JSON.stringify({crc_cases: crcCases, digest_cases: digestCases, hmac_cases: hmacCases, base64_cases: base64Cases, invalid_cases: invalidCases}))
