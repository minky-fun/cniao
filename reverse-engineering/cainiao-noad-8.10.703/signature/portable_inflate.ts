/** Bounded RFC 1950/1951 streaming inflater; no native compression or platform dependencies. */
export interface InflateResult {
  consumed: number
  bytes: Uint8Array
  code: number
  dataType: number
  adler: number
  message: string | undefined
}

interface Huffman { codes: Map<number, number>; maximum: number }
// RFC 1951 code-length permutation has exactly 19 entries.
const codeOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
const lengths = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258]
const lengthExtra = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
const distances = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577]
const distanceExtra = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]

/** Build canonical, bit-reversed codes, rejecting overfull and unsupported incomplete trees. */
function tree(values: readonly number[], kind: 'codes' | 'literal' | 'distance'): Huffman | undefined {
  const counts = new Array<number>(16).fill(0)
  for (const length of values) {
    if (!Number.isInteger(length) || length < 0 || length > 15) throw new Error('Invalid internal Huffman length')
    counts[length]++
  }
  let maximum = 15
  while (maximum && !counts[maximum]) maximum--
  if (!maximum) return {codes: new Map(), maximum: 1}
  let left = 1
  for (let width = 1; width <= 15; width++) {
    left = left * 2 - counts[width]
    if (left < 0) return undefined
  }
  if (left && (kind === 'codes' || maximum !== 1)) return undefined
  const next = new Array<number>(16).fill(0)
  let code = 0
  for (let width = 1; width <= 15; width++) {
    code = (code + (width === 1 ? 0 : counts[width - 1])) * 2
    next[width] = code
  }
  const codes = new Map<number, number>()
  for (let symbol = 0; symbol < values.length; symbol++) {
    const width = values[symbol]
    if (!width) continue
    let forward = next[width]++
    let reverse = 0
    for (let bit = 0; bit < width; bit++) { reverse = reverse * 2 + (forward & 1); forward >>>= 1 }
    codes.set(2 ** width + reverse, symbol)
  }
  return {codes, maximum}
}

const fixedLiterals = tree(Array.from({length: 288}, (_, index) => index < 144 ? 8 : index < 256 ? 9 : index < 280 ? 7 : 8), 'literal')!
const fixedDistances = tree(new Array<number>(32).fill(5), 'distance')!
type Mode = 'head' | 'type' | 'typedo' | 'stored' | 'copy' | 'table' | 'lens' | 'codes' | 'repeat' | 'len' | 'lenextra' | 'dist' | 'distextra' | 'match' | 'lit' | 'check' | 'done' | 'bad'

export class ZlibInflate {
  totalIn = 0
  totalOut = 0
  adler = 1
  dataType = 0
  message: string | undefined
  private mode: Mode = 'head'
  private hold = 0
  private bits = 0
  private last = false
  private window = new Uint8Array(32768)
  private windowLimit = 32768
  private checkA = 1
  private checkB = 0
  private literals = fixedLiterals
  private distanceTree = fixedDistances
  private codeTree: Huffman | undefined
  private nlen = 0
  private ndist = 0
  private ncode = 0
  private codeLengths: number[] = []
  private alphabet: number[] = []
  private repeat = 0
  private value = 0
  private length = 0
  private extra = 0
  private distance = 0

  /** Resume a zlib stream with Z_NO_FLUSH, retaining a bounded 32 KiB back-reference window. */
  inflate(input: Uint8Array, capacity: number): InflateResult {
    if (input.length > 0x1000000 || !Number.isInteger(capacity) || capacity < 0 || capacity > 0x1000000 || this.totalOut + capacity > 0x1000000) throw new Error('Inflate boundary exceeded')
    if (this.mode === 'type') this.mode = 'typedo'
    const output = new Uint8Array(capacity)
    let position = 0
    let produced = 0
    /** Fill only the bits needed by the current transition, preserving unread input. */
    const need = (width: number): boolean => {
      while (this.bits < width && position < input.length) {
        this.hold += input[position++] * 2 ** this.bits
        this.bits += 8
      }
      return this.bits >= width
    }
    /** Consume exact little-endian bit fields, including 32-bit stored-block headers. */
    const take = (width: number): number => {
      const value = this.hold % 2 ** width
      this.hold = Math.floor(this.hold / 2 ** width)
      this.bits -= width
      return value
    }
    let symbolWidth = 0
    /** Decode one canonical symbol; -1 means input exhaustion, -2 invalid code. */
    const symbol = (codes: Huffman, consume = true): number => {
      for (let width = 1; width <= codes.maximum; width++) {
        if (!need(width)) return -1
        const value = codes.codes.get(2 ** width + this.hold % 2 ** width)
        if (value !== undefined) { symbolWidth = width; if (consume) take(width); return value }
      }
      return -2
    }
    /** Store one output byte, overlapping matches and Adler-32 in native byte order. */
    const emit = (byte: number): void => {
      output[produced++] = byte
      this.window[this.totalOut++ & 32767] = byte
      this.checkA += byte
      if (this.checkA >= 65521) this.checkA -= 65521
      this.checkB += this.checkA
      if (this.checkB >= 65521) this.checkB -= 65521
    }
    /** Preserve the public libz data error message without including any input bytes. */
    const bad = (message: string): void => { this.mode = 'bad'; this.message = message }
    run: for (;;) {
      switch (this.mode) {
        case 'head': {
          if (!need(16)) break run
          const header = this.hold % 65536
          if (((header & 255) * 256 + (header >>> 8)) % 31) { bad('incorrect header check'); break }
          if ((header & 15) !== 8) { bad('unknown compression method'); break }
          const width = (header >>> 4 & 15) + 8
          if (width > 15) { take(4); bad('invalid window size'); break }
          this.windowLimit = 2 ** width
          take(16)
          if (header & 0x2000) throw new Error('Preset zlib dictionaries are unsupported')
          this.mode = 'type'
          break
        }
        case 'done': case 'bad': break run
        case 'type': case 'typedo': {
          if (this.last) {
            take(this.bits % 8)
            this.mode = 'check'
            break
          }
          if (!need(3)) break run
          this.last = take(1) !== 0
          const kind = take(2)
          if (kind === 0) { take(this.bits % 8); this.mode = 'stored' }
          else if (kind === 1) { this.literals = fixedLiterals; this.distanceTree = fixedDistances; this.mode = 'len' }
          else if (kind === 2) this.mode = 'table'
          else bad('invalid block type')
          break
        }
        case 'stored': {
          if (!need(32)) break run
          const count = this.hold % 65536
          if (count !== ((Math.floor(this.hold / 65536) ^ 65535) & 65535)) { bad('invalid stored block lengths'); break }
          take(32)
          this.length = count
          this.mode = 'copy'
          break
        }
        case 'copy': {
          if (!this.length) { this.mode = 'type'; break }
          const count = Math.min(this.length, input.length - position, capacity - produced)
          if (!count) break run
          for (let index = 0; index < count; index++) emit(input[position++])
          this.length -= count
          break
        }
        case 'table': {
          if (!need(14)) break run
          this.nlen = take(5) + 257
          this.ndist = take(5) + 1
          this.ncode = take(4) + 4
          if (this.nlen > 286 || this.ndist > 30) { bad('too many length or distance symbols'); break }
          this.codeLengths = []
          this.alphabet = new Array<number>(19).fill(0)
          this.mode = 'lens'
          break
        }
        case 'lens': {
          while (this.codeLengths.length < this.ncode) {
            if (!need(3)) break run
            const value = take(3)
            this.alphabet[codeOrder[this.codeLengths.length]] = value
            this.codeLengths.push(value)
          }
          this.codeTree = tree(this.alphabet, 'codes')
          if (!this.codeTree) { bad('invalid code lengths set'); break }
          this.codeLengths = []
          this.mode = 'codes'
          break
        }
        case 'codes': {
          if (this.codeLengths.length === this.nlen + this.ndist) {
            if (!this.codeLengths[256]) { bad('invalid code -- missing end-of-block'); break }
            const literalTree = tree(this.codeLengths.slice(0, this.nlen), 'literal')
            const distanceTree = tree(this.codeLengths.slice(this.nlen), 'distance')
            if (!literalTree) { bad('invalid literal/lengths set'); break }
            if (!distanceTree) { bad('invalid distances set'); break }
            this.literals = literalTree
            this.distanceTree = distanceTree
            this.mode = 'len'
            break
          }
          const decoded = symbol(this.codeTree!, false)
          if (decoded === -1) break run
          if (decoded === -2) { bad('invalid code lengths set'); break }
          if (decoded < 16) { take(symbolWidth); this.codeLengths.push(decoded) }
          else {
            // libz consumes a repeat symbol only once all of its extra bits are available.
            if (!need(symbolWidth + (decoded === 16 ? 2 : decoded === 17 ? 3 : 7))) break run
            take(symbolWidth)
            this.repeat = decoded
            this.mode = 'repeat'
          }
          break
        }
        case 'repeat': {
          const extra = this.repeat === 16 ? 2 : this.repeat === 17 ? 3 : 7
          if (!need(extra)) break run
          const count = take(extra) + (this.repeat === 16 ? 3 : this.repeat === 17 ? 3 : 11)
          if ((this.repeat === 16 && !this.codeLengths.length) || this.codeLengths.length + count > this.nlen + this.ndist) { bad('invalid bit length repeat'); break }
          const value = this.repeat === 16 ? this.codeLengths[this.codeLengths.length - 1] : 0
          for (let index = 0; index < count; index++) this.codeLengths.push(value)
          this.mode = 'codes'
          break
        }
        case 'len': {
          const decoded = symbol(this.literals)
          if (decoded === -1) break run
          if (decoded === -2 || decoded > 285) { bad('invalid literal/length code'); break }
          if (decoded < 256) { this.value = decoded; this.mode = 'lit' }
          else if (decoded === 256) this.mode = 'type'
          else { this.length = lengths[decoded - 257]; this.extra = lengthExtra[decoded - 257]; this.mode = 'lenextra' }
          break
        }
        case 'lenextra': {
          if (!need(this.extra)) break run
          this.length += take(this.extra)
          this.mode = 'dist'
          break
        }
        case 'dist': {
          const decoded = symbol(this.distanceTree)
          if (decoded === -1) break run
          if (decoded === -2 || decoded > 29) { bad('invalid distance code'); break }
          this.distance = distances[decoded]
          this.extra = distanceExtra[decoded]
          this.mode = 'distextra'
          break
        }
        case 'distextra': {
          if (!need(this.extra)) break run
          this.distance += take(this.extra)
          if (this.distance > this.windowLimit || this.distance > this.totalOut) { bad('invalid distance too far back'); break }
          this.mode = 'match'
          break
        }
        case 'match': {
          while (this.length && produced < capacity) { emit(this.window[(this.totalOut - this.distance) & 32767]); this.length-- }
          if (this.length) break run
          this.mode = 'len'
          break
        }
        case 'lit': {
          if (produced === capacity) break run
          emit(this.value)
          this.mode = 'len'
          break
        }
        case 'check': {
          if (!need(32)) break run
          const raw = this.hold
          const expected = ((raw & 255) * 0x1000000 + (raw >>> 8 & 255) * 65536 + (raw >>> 16 & 255) * 256 + (raw >>> 24)) >>> 0
          if (expected !== ((this.checkB * 65536 + this.checkA) >>> 0)) { bad('incorrect data check'); break }
          take(32)
          this.mode = 'done'
          break
        }
      }
    }
    this.totalIn += position
    this.adler = (this.checkB * 65536 + this.checkA) >>> 0
    this.dataType = this.bits + (this.last ? 64 : 0) + (this.mode === 'type' ? 128 : 0)
    const code = this.mode === 'done' ? 1 : this.mode === 'bad' ? -3 : !position && !produced ? -5 : 0
    return {consumed: position, bytes: output.subarray(0, produced), code, dataType: this.dataType, adler: this.adler, message: this.message}
  }
}
