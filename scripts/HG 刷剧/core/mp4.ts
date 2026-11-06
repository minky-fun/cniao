import { aesCtrDecryptInPlace, expandKeyWords } from "./crypto"
import { asciiBytes, concatBytes, readUint32, utf8String, writeUint32 } from "./bytes"

export interface Mp4Box {
  type: string

  start: number

  size: number

  headerSize: number
  children: Mp4Box[]
}

const CONTAINER_TYPES = new Set([
  "moov", "trak", "mdia", "minf", "stbl", "dinf", "mvex", "moof", "traf",
  "udta", "schi", "sinf", "edts", "stsd",
])

const VISUAL_SAMPLE_ENTRIES = new Set([
  "encv", "avc1", "avc3", "hvc1", "hev1", "bv2C", "bv1c", "vp09",
])

const AUDIO_SAMPLE_ENTRIES = new Set(["enca", "mp4a"])

/** 在边界和深度限制内解析 MP4 盒子树。 */
export function readBoxes(bytes: Uint8Array, start: number, limit: number, depth = 0): Mp4Box[] {
  const boxes: Mp4Box[] = []
  let position = start

  while (position + 8 <= limit) {
    let size = readUint32(bytes, position)
    const type = utf8String(bytes.slice(position + 4, position + 8))
    let headerSize = 8

    if (size === 1) {

      if (position + 16 > limit) break
      size = Number(new DataView(bytes.buffer, bytes.byteOffset + position + 8, 8).getBigUint64(0))
      headerSize = 16
    } else if (size === 0) {

      size = limit - position
    }

    if (size < headerSize || position + size > limit) break

    const box: Mp4Box = { type, start: position, size, headerSize, children: [] }

    const isContainer = CONTAINER_TYPES.has(type)
    const isVisual = VISUAL_SAMPLE_ENTRIES.has(type)
    const isAudio = AUDIO_SAMPLE_ENTRIES.has(type)

    if ((isContainer || isVisual || isAudio) && depth < 8) {
      let childStart = position + headerSize
      if (type === "stsd") childStart += 8
      else if (isVisual) childStart += 78
      else if (isAudio) childStart += 28

      if (childStart < position + size) {
        box.children = readBoxes(bytes, childStart, position + size, depth + 1)
      }
    }

    boxes.push(box)
    position += size
  }

  return boxes
}

/** 递归查找指定类型的首个媒体盒子。 */
export function findBox(boxes: Mp4Box[], type: string): Mp4Box | null {
  for (const box of boxes) {
    if (box.type === type) return box
    const found = findBox(box.children, type)
    if (found) return found
  }
  return null
}

/** 读取轨道内的采样表。 */
export function findStbl(trak: Mp4Box): Mp4Box | null {
  return findBox([trak], "stbl")
}

/** 计算媒体盒子有效载荷的起始位置。 */
function payloadStart(box: Mp4Box): number {
  return box.start + box.headerSize
}

interface TrackSamples {

  sizes: number[]

  chunkOffsets: number[]

  chunkCount: number

  samplesPerChunk: number[]

  ivs: Uint8Array[]

  count: number
}

/** 解析完整视频解密需要的采样大小、位置和初始化向量。 */
function readTrackSamples(bytes: Uint8Array, stbl: Mp4Box): TrackSamples | null {
  const stsz = findBox([stbl], "stsz")
  const stco = findBox([stbl], "stco")
  const stsc = findBox([stbl], "stsc")
  const senc = findBox([stbl], "senc")
  const saiz = findBox([stbl], "saiz")

  if (!stsz || !stco || !stsc || !senc) return null

  const uniformSize = readUint32(bytes, payloadStart(stsz) + 4)
  const count = readUint32(bytes, payloadStart(stsz) + 8)
  const sizes: number[] = []
  for (let i = 0; i < count; i++) {
    sizes.push(uniformSize !== 0 ? uniformSize : readUint32(bytes, payloadStart(stsz) + 12 + i * 4))
  }

  const chunkCount = readUint32(bytes, payloadStart(stco) + 4)
  const chunkOffsets: number[] = []
  for (let i = 0; i < chunkCount; i++) {
    chunkOffsets.push(readUint32(bytes, payloadStart(stco) + 8 + i * 4))
  }

  const stscStart = payloadStart(stsc)
  const stscCount = readUint32(bytes, stscStart + 4)
  const entries: { firstChunk: number; perChunk: number }[] = []
  for (let i = 0; i < stscCount; i++) {
    entries.push({
      firstChunk: readUint32(bytes, stscStart + 8 + i * 12),
      perChunk: readUint32(bytes, stscStart + 8 + i * 12 + 4),
    })
  }
  if (entries.length === 0) return null

  const samplesPerChunk: number[] = []
  for (let chunk = 0; chunk < chunkCount; chunk++) {
    let perChunk = entries[0].perChunk
    for (const entry of entries) {
      if (chunk + 1 >= entry.firstChunk) perChunk = entry.perChunk
    }
    samplesPerChunk.push(perChunk)
  }

  const sencStart = payloadStart(senc)
  const sencCount = readUint32(bytes, sencStart + 4)
  const ivSize = saiz ? bytes[payloadStart(saiz) + 4] : 8

  const ivs: Uint8Array[] = []
  for (let i = 0; i < sencCount; i++) {
    const from = sencStart + 8 + i * ivSize
    ivs.push(bytes.slice(from, from + ivSize))
  }

  return {
    sizes,
    chunkOffsets,
    chunkCount,
    samplesPerChunk,
    ivs,
    count,
  }
}

const DECRYPT_TIME_SLICE_MS = 60

/** 解密期间让出执行机会，避免长任务阻塞界面。 */
function yieldToMainThread(): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

/** 按轨道采样解密媒体内容并报告进度。 */
export async function decryptSamplesAsync(
  bytes: Uint8Array,
  contentKey: Uint8Array,
  onProgress?: (ratio: number) => void
): Promise<number> {
  const top = readBoxes(bytes, 0, bytes.length)
  const moov = findBox(top, "moov")
  if (!moov) throw new Error("不是有效的 MP4：缺少 moov")

  const roundKeys = expandKeyWords(contentKey)
  const tracks = moov.children.filter(box => box.type === "trak")

  const plans: TrackSamples[] = []
  let totalSamples = 0
  for (const trak of tracks) {
    const stbl = findStbl(trak)
    if (!stbl) continue
    const samples = readTrackSamples(bytes, stbl)

    if (!samples) continue
    plans.push(samples)
    totalSamples += samples.count
  }

  let processed = 0
  let sliceStart = Date.now()

  for (const samples of plans) {
    let index = 0

    for (let chunk = 0; chunk < samples.chunkCount && index < samples.count; chunk++) {
      let offset = samples.chunkOffsets[chunk]
      const perChunk = samples.samplesPerChunk[chunk]

      for (let k = 0; k < perChunk && index < samples.count; k++) {
        const size = samples.sizes[index]
        const iv = samples.ivs[index]
        if (iv && size > 0) {
          aesCtrDecryptInPlace(bytes, offset, size, roundKeys, iv)
        }
        offset += size
        index++
        processed++
      }

      if (Date.now() - sliceStart >= DECRYPT_TIME_SLICE_MS) {
        onProgress?.(totalSamples > 0 ? processed / totalSamples : 1)
        await yieldToMainThread()
        sliceStart = Date.now()
      }
    }
  }

  onProgress?.(1)
  return processed
}

const DRM_BOXES = new Set(["sinf", "senc", "saio", "saiz"])

const SAMPLE_ENTRY_TYPES: Record<string, string> = { encv: "hvc1", enca: "mp4a" }

/** 重建媒体盒子并移除不再需要的加密声明。 */
function rebuildBox(bytes: Uint8Array, box: Mp4Box): Uint8Array {
  if (box.children.length === 0) {

    return bytes.subarray(box.start, box.start + box.size)
  }

  const parts: Uint8Array[] = []

  if (box.type === "stsd") {
    parts.push(bytes.slice(box.start + box.headerSize, box.start + box.headerSize + 8))
  } else if (VISUAL_SAMPLE_ENTRIES.has(box.type)) {
    parts.push(bytes.slice(box.start + box.headerSize, box.start + box.headerSize + 78))
  } else if (AUDIO_SAMPLE_ENTRIES.has(box.type)) {
    parts.push(bytes.slice(box.start + box.headerSize, box.start + box.headerSize + 28))
  }

  for (const child of box.children) {
    if (DRM_BOXES.has(child.type)) continue
    parts.push(rebuildBox(bytes, child))
  }

  const newType = SAMPLE_ENTRY_TYPES[box.type] ?? box.type
  const payloadLength = parts.reduce((sum, part) => sum + part.length, 0)
  const result = new Uint8Array(8 + payloadLength)
  writeUint32(result, 0, result.length)
  result.set(asciiBytes(newType), 4)

  let offset = 8
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

/** 移除解密后失效的保护信息并修正块偏移。 */
export function stripDrm(bytes: Uint8Array): Uint8Array {
  const originalTop = readBoxes(bytes, 0, bytes.length)
  const originalMdat = findBox(originalTop, "mdat")
  if (!originalMdat) throw new Error("不是有效的 MP4：缺少 mdat")
  const originalMdatPayload = originalMdat.start + originalMdat.headerSize

  const rebuilt = concatBytes(originalTop.map(box => rebuildBox(bytes, box)))

  const newTop = readBoxes(rebuilt, 0, rebuilt.length)
  const newMdat = findBox(newTop, "mdat")
  if (!newMdat) throw new Error("容器重写后丢失 mdat")
  const newMdatPayload = newMdat.start + newMdat.headerSize

  const delta = originalMdatPayload - newMdatPayload
  if (delta === 0) return rebuilt

  const moov = findBox(newTop, "moov")
  if (!moov) return rebuilt

  for (const trak of moov.children.filter(box => box.type === "trak")) {
    const stbl = findStbl(trak)
    if (!stbl) continue
    const stco = findBox([stbl], "stco")
    if (!stco) continue

    const count = readUint32(rebuilt, stco.start + stco.headerSize + 4)
    const tableStart = stco.start + stco.headerSize + 8
    for (let i = 0; i < count; i++) {
      const offset = tableStart + i * 4
      writeUint32(rebuilt, offset, readUint32(rebuilt, offset) - delta)
    }
  }

  return rebuilt
}

/** 解密完整媒体并生成可直接播放的 MP4 字节。 */
export async function decryptToPlayableAsync(
  encrypted: Uint8Array,
  contentKey: Uint8Array,
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {

  const working = encrypted

  await decryptSamplesAsync(working, contentKey, ratio => onProgress?.(ratio * 0.85))
  onProgress?.(0.9)

  const playable = stripDrm(working)
  onProgress?.(1)

  return playable
}
