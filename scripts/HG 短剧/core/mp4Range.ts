import { createDecipheriv } from "node:crypto"
import { asciiBytes, readUint32, utf8String } from "./bytes"
import { findBox, readBoxes, type Mp4Box } from "./mp4"

interface SampleSpan { offset: number; size: number; iv: Uint8Array }
export interface RangeMovie { header: Uint8Array; offset: number; samples: SampleSpan[] }

/** 校验表内读取边界，拒绝截断或与声明数量不符的媒体索引。 */
function tableWord(bytes: Uint8Array, box: Mp4Box, offset: number): number {
  if (offset < box.start + box.headerSize || offset + 4 > box.start + box.size) {
    throw new Error("视频索引不完整")
  }
  return readUint32(bytes, offset)
}

/** 从独立 moov 提取绝对采样位置，保留盒子长度以支持随机字节播放。 */
export function prepareRangeMovie(header: Uint8Array, offset: number, total: number): RangeMovie {
  const moov = readBoxes(header, 0, header.length)[0]
  if (!moov || moov.type !== "moov" || moov.size !== header.length) throw new Error("视频缺少完整索引")
  const samples: SampleSpan[] = []
  for (const track of moov.children.filter(box => box.type === "trak")) {
    const stbl = findBox([track], "stbl")
    if (!stbl) throw new Error("视频缺少采样表")
    const senc = findBox([stbl], "senc")
    if (!senc) {
      if (findBox([stbl], "encv") || findBox([stbl], "enca")) throw new Error("视频缺少加密采样索引")
      continue
    }
    const stsz = findBox([stbl], "stsz"), stco = findBox([stbl], "stco"), stsc = findBox([stbl], "stsc")
    if (!stsz || !stco || !stsc) throw new Error("暂不支持该视频采样索引")
    const sz = stsz.start + stsz.headerSize, co = stco.start + stco.headerSize
    const sc = stsc.start + stsc.headerSize, se = senc.start + senc.headerSize
    if (tableWord(header, senc, se) !== 0) throw new Error("暂不支持该视频的分段加密方式")
    const count = tableWord(header, stsz, sz + 8)
    if (!count || count > 1000000 || tableWord(header, senc, se + 4) !== count) throw new Error("视频采样数量异常")
    const ivSize = (senc.start + senc.size - se - 8) / count
    if (ivSize !== 8 && ivSize !== 16) throw new Error("视频采样密钥索引异常")
    const uniform = tableWord(header, stsz, sz + 4)
    const chunks = tableWord(header, stco, co + 4), mappings = tableWord(header, stsc, sc + 4)
    if (!chunks || chunks > count || !mappings || mappings > chunks) throw new Error("视频分块索引异常")
    const entries: { first: number; count: number }[] = []
    for (let i = 0; i < mappings; i++) {
      const first = tableWord(header, stsc, sc + 8 + i * 12)
      const perChunk = tableWord(header, stsc, sc + 12 + i * 12)
      const description = tableWord(header, stsc, sc + 16 + i * 12)
      if (first < 1 || first > chunks || !perChunk || description !== 1
          || (i === 0 ? first !== 1 : first <= entries[i - 1].first)) throw new Error("视频分块映射异常")
      entries.push({ first, count: perChunk })
    }
    let index = 0, mapping = 0
    for (let chunk = 1; chunk <= chunks; chunk++) {
      while (mapping + 1 < entries.length && entries[mapping + 1].first <= chunk) mapping++
      let position = tableWord(header, stco, co + 4 + chunk * 4)
      for (let k = 0; k < entries[mapping].count; k++) {
        if (index >= count) throw new Error("视频分块采样数量异常")
        const size = uniform || tableWord(header, stsz, sz + 12 + index * 4)
        if (!size || position < 0 || position + size > total) throw new Error("视频采样超出文件范围")
        samples.push({ offset: position, size, iv: header.slice(se + 8 + index * ivSize, se + 8 + (index + 1) * ivSize) })
        position += size
        index++
      }
    }
    if (index !== count) throw new Error("视频分块采样数量不匹配")
  }
  if (!samples.length) throw new Error("视频没有可解密采样")
  samples.sort((a, b) => a.offset - b.offset)
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1].offset + samples[i - 1].size > samples[i].offset) throw new Error("视频采样范围重叠")
  }
  const patched = new Uint8Array(header)
  /** 将加密声明改成等长 free，使用 frma 中真实编码而不移动任何媒体字节。 */
  function rewrite(box: Mp4Box): void {
    if (box.type === "encv" || box.type === "enca") {
      const frma = findBox([box], "frma")
      if (!frma || frma.size < frma.headerSize + 4) throw new Error("视频缺少原始编码声明")
      const codec = utf8String(header.slice(frma.start + frma.headerSize, frma.start + frma.headerSize + 4))
      if (codec !== "hvc1" && codec !== "hev1" && codec !== "avc1" && codec !== "mp4a") throw new Error("暂不支持该视频编码")
      patched.set(asciiBytes(codec), box.start + 4)
    }
    if (["sinf", "senc", "saiz", "saio"].includes(box.type)) {
      patched.set(asciiBytes("free"), box.start + 4)
      return
    }
    box.children.forEach(rewrite)
  }
  rewrite(moov)
  return { header: patched, offset, samples }
}

/** 按采样内偏移推进 CTR 计数器，支持播放器从任意字节开始请求。 */
export async function decryptMovieRange(movie: RangeMovie, key: Uint8Array, start: number, input: Uint8Array): Promise<Uint8Array> {
  if (key.length !== 16) throw new Error("视频解密密钥长度异常")
  const output = new Uint8Array(input), end = start + input.length
  let low = 0, high = movie.samples.length
  while (low < high) {
    const mid = (low + high) >>> 1, sample = movie.samples[mid]
    if (sample.offset + sample.size <= start) low = mid + 1
    else high = mid
  }
  let sliceStarted = Date.now()
  for (let i = low; i < movie.samples.length && movie.samples[i].offset < end; i++) {
    const sample = movie.samples[i], from = Math.max(start, sample.offset), to = Math.min(end, sample.offset + sample.size)
    const relative = from - sample.offset, skip = relative % 16
    const counter = new Uint8Array(16)
    counter.set(sample.iv)
    let carry = Math.floor(relative / 16)
    for (let j = 15; j >= 0 && carry > 0; j--) {
      const value = counter[j] + carry
      counter[j] = value & 255
      carry = Math.floor(value / 256)
    }
    const cipher = createDecipheriv("aes-128-ctr", key, counter)
    if (skip) cipher.update(new Uint8Array(skip))
    const decoded: Uint8Array = cipher.update(input.subarray(from - start, to - start))
    if (decoded.length !== to - from || cipher.final().length) throw new Error("视频片段解密长度异常")
    output.set(decoded, from - start)
    if (Date.now() - sliceStarted >= 12) {
      await new Promise<void>(resolve => setTimeout(resolve, 0))
      sliceStarted = Date.now()
    }
  }
  const from = Math.max(start, movie.offset), to = Math.min(end, movie.offset + movie.header.length)
  if (to > from) output.set(movie.header.subarray(from - movie.offset, to - movie.offset), from - start)
  return output
}
