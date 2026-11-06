export function toHex(bytes: Uint8Array): string {
  let result = ""
  for (const byte of bytes) result += byte.toString(16).padStart(2, "0")
  return result
}

export function utf8String(bytes: Uint8Array): string {
  let result = ""
  for (const byte of bytes) result += String.fromCharCode(byte)
  return result
}

export function asciiBytes(text: string): Uint8Array {
  const output = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i++) output[i] = text.charCodeAt(i) & 0xff
  return output
}

export function base64Decode(value: string): Uint8Array {
  const normalized = value.trim().replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const output = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) output[i] = binary.charCodeAt(i)
  return output
}

export function popCount(value: number): number {
  let count = 0
  let remaining = value & 0xff
  while (remaining) {
    count += remaining & 1
    remaining >>>= 1
  }
  return count
}

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }
  return output
}

export function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0)
}

export function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  new DataView(bytes.buffer, bytes.byteOffset + offset, 4).setUint32(0, value)
}
