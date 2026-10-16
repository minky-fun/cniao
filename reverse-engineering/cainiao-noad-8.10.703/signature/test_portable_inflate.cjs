/** Independent public-vector oracle using Node zlib; the portable module never imports it. */
const assert = require('node:assert/strict')
const zlib = require('node:zlib')
const {ZlibInflate} = require(require('node:path').resolve(process.argv[2]))
let cases = 0

/** Feed independently sized input/output windows, including every-byte input and match continuation. */
function check(plain, compressed, inputSize, outputSize) {
  const engine = new ZlibInflate()
  const restored = []
  let offset = 0
  let finished = false
  for (let iteration = 0; iteration < plain.length * 2 + compressed.length * 2 + 100; iteration++) {
    const result = engine.inflate(compressed.subarray(offset, offset + inputSize), outputSize)
    offset += result.consumed
    restored.push(Buffer.from(result.bytes))
    if (result.code === 1) { finished = true; break }
    assert.equal(result.code, 0, 'Public inflate failed in case ' + cases)
  }
  assert.equal(finished, true)
  assert.deepEqual(Buffer.concat(restored), plain)
  assert.equal(engine.totalOut, plain.length)
  assert.equal(engine.totalIn, compressed.length)
  assert.equal(engine.dataType, 64)
  assert.equal(engine.adler, compressed.readUInt32BE(compressed.length - 4))
  cases++
}

for (const size of [0, 1, 2, 3, 257, 258, 259, 1024, 16383, 16384, 16385, 65537, 306065]) {
  const random = Buffer.alloc(size)
  let seed = 0x12345678
  for (let index = 0; index < size; index++) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; random[index] = seed & 255 }
  for (const plain of [random, Buffer.alloc(size, 65), Buffer.from(Array.from({length: size}, (_, index) => index * 31 + (index >>> 8) & 255))]) {
    for (const options of [{level: 0}, {level: 1}, {level: 6}, {level: 9}, {strategy: zlib.constants.Z_FIXED}, {strategy: zlib.constants.Z_HUFFMAN_ONLY}, {strategy: zlib.constants.Z_RLE}]) {
      const compressed = zlib.deflateSync(plain, options)
      for (const [input, output] of [[compressed.length, Math.max(1, size + 1)], [17, 19], [16384, 16384]]) check(plain, compressed, input, output)
      if (size <= 1024) check(plain, compressed, 1, 1)
    }
  }
}

/** Check public corruption messages and enforce output limits without leaking arbitrary inputs. */
function error(compressed, expected) {
  const result = new ZlibInflate().inflate(compressed, 8192)
  assert.equal(result.code, -3)
  assert.equal(result.message, expected)
}
error(Buffer.from([0, 1]), 'incorrect header check')
const compressed = zlib.deflateSync(Buffer.from('Public Adler checksum fixture.'))
compressed[compressed.length - 1] ^= 1
error(compressed, 'incorrect data check')
error(Buffer.from([0x78, 0x9c, 7]), 'invalid block type')
error(Buffer.from([0x78, 0x01, 1, 1, 0, 1, 0]), 'invalid stored block lengths')
assert.throws(() => new ZlibInflate().inflate(new Uint8Array(), -1))
assert.throws(() => new ZlibInflate().inflate(new Uint8Array(), 0x1000001))
assert.throws(() => new ZlibInflate().inflate(new Uint8Array(), 1.5))
assert.equal(new ZlibInflate().inflate(new Uint8Array(), 0).code, -5)
assert.throws(() => new ZlibInflate().inflate(zlib.deflateSync(Buffer.from('Public dictionary fixture.'), {dictionary: Buffer.from('Public dictionary')}), 8192), /dictionaries are unsupported/)
const limit = new ZlibInflate()
limit.totalOut = 0x1000000
assert.throws(() => limit.inflate(new Uint8Array(), 1), /boundary exceeded/)
console.log(JSON.stringify({public_stream_cases: cases, corruption_cases: 4, boundary_cases: 6}))
