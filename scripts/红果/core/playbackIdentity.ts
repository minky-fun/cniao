import { fetch } from "scripting"
import { Buffer } from "node:buffer"
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto"
import { gzipSync, gunzipSync } from "node:zlib"
import { HttpError } from "./http"
import { signGorgon } from "./playbackSign"

export const PLAYBACK_USER_AGENT = "com.phoenix.read/71332 (Linux; U; Android 16; zh_CN; 25053RT47C; Build/BP2A.250605.031.A3; Cronet/TTNetVersion:04657795 2026-01-23 QuicVersion:c67e9834 2025-09-08)"
export const PLAYBACK_QUERY: Record<string, string> = {
  ac: "wifi", aid: "8662", app_name: "novelread", channel: "update_64", device_brand: "Redmi",
  device_platform: "android", device_type: "25053RT47C", dpi: "520", language: "zh",
  manifest_version_code: "71332", os: "android", os_api: "36", os_version: "16",
  resolution: "1280*2772", ssmix: "a", update_version_code: "71332", version_code: "71332", version_name: "7.1.3.32",
}

export interface PlaybackIdentity {
  deviceId: string
  installId: string
  deviceToken: string
  cookies: Record<string, string>
}

const STORAGE_KEY = "hongguo-registered-player-device-v1"
const PREFIX = Uint8Array.from([0x74, 0x63, 5, 0x10, 0, 0])
const DEVICE_SALT = Buffer.from("4dd4c2e6b83162090e52b3c7a6733ba41cb2462b829ab58a196b39db57177524f49baf7f08e8d68d26a72e37c1a95a2f1f05a51892aef2949732b62a38aadd58", "hex")
let current: PlaybackIdentity | undefined
let pending: Promise<PlaybackIdentity> | undefined

/** Derive the anonymous-registration AES key and IV from the public protocol seed. */
function deviceKey(seed: Uint8Array): Uint8Array {
  const first = createHash("sha512").update(seed).digest()
  const input = new Uint8Array(first.length + DEVICE_SALT.length)
  input.set(first); input.set(DEVICE_SALT, first.length)
  return Uint8Array.from(createHash("sha512").update(input).digest())
}

/** Encode TTEncrypt v5 using gzip, SHA-512 and AES-CBC with native PKCS7 padding. */
export function encryptRegistration(plain: string, seed = Uint8Array.from(randomBytes(32))): Uint8Array {
  if (seed.length !== 32) throw new Error("设备注册种子长度错误")
  const zipped = Uint8Array.from(gzipSync(plain, { level: 9 }))
  zipped.set([0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 0])
  const digest = createHash("sha512").update(zipped).digest(), input = new Uint8Array(64 + zipped.length)
  input.set(digest); input.set(zipped, 64)
  const key = deviceKey(seed), cipher = createCipheriv("aes-128-cbc", key.slice(0, 16), key.slice(16, 32))
  const first = cipher.update(input) as Buffer, last = cipher.final()
  const output = new Uint8Array(38 + first.length + last.length)
  output.set(PREFIX); output.set(seed, 6); output.set(first, 38); output.set(last, 38 + first.length)
  return output
}

/** Decode and authenticate encrypted registration replies; plain JSON is also official behavior. */
export function decodeRegistration(input: Uint8Array): string {
  if (!PREFIX.every((byte, i) => input[i] === byte)) return Buffer.from(input).toString("utf8")
  if (input.length < 118 || (input.length - 38) % 16) throw new Error("设备注册响应长度错误")
  const key = deviceKey(input.slice(6, 38)), cipher = createDecipheriv("aes-128-cbc", key.slice(0, 16), key.slice(16, 32))
  const first = cipher.update(input.slice(38)) as Buffer, last = cipher.final()
  const plain = new Uint8Array(first.length + last.length)
  plain.set(first); plain.set(last, first.length)
  const digest = createHash("sha512").update(plain.slice(64)).digest()
  if (plain.length < 64 || !digest.every((byte, i) => plain[i] === byte)) throw new Error("设备注册响应校验失败")
  return gunzipSync(plain.slice(64)).toString("utf8")
}

/** Register a real anonymous device instead of synthesizing unregistered device numbers. */
async function registerIdentity(): Promise<PlaybackIdentity> {
  const stamp = Date.now(), seconds = Math.floor(stamp / 1000)
  const cdid = randomUUID(), clientudid = randomUUID(), openudid = randomBytes(8).toString("hex")
  const plain = JSON.stringify({ magic_tag: "ss_app_log", header: {
    aid: 8662, access: "wifi", app_version: "7.1.3.32", app_version_minor: "", channel: "update_64",
    device_brand: "Redmi", device_manufacturer: "Redmi", device_model: "25053RT47C", device_category: "phone",
    device_platform: "android", os: "Android", os_api: 36, os_version: "16", density_dpi: 520,
    display_density: "xxxhdpi", resolution: "2772x1280", language: "zh", timezone: 8,
    tz_name: "Asia/Shanghai", tz_offset: 28800, region: "CN", package: "com.phoenix.read",
    version_code: 71332, manifest_version_code: 71332, update_version_code: 71332,
    apk_first_install_time: stamp, cdid, clientudid, openudid, cpu_abi: "arm64-v8a", display_name: "红果短剧",
    sdk_version: "3.7.2", sdk_target_version: 29, sdk_flavor: "china", guest_mode: 0, is_system_app: 0,
    not_request_sender: 0, oaid_may_support: true, ipv6_list: [], sim_serial_number: [],
    custom: { is_android_fold: 0, filter_warn: 0, web_ua: "", is_android_pad: 0, client_ipv4: "" },
  }, _gen_time: stamp })
  const bytes = encryptRegistration(plain)
  const values: Record<string, string> = { ...PLAYBACK_QUERY, cdid, openudid,
    tt_data: "a", ts: String(seconds), _rticket: String(stamp), package: "com.phoenix.read" }
  const query = Object.keys(values).sort().map(key => `${encodeURIComponent(key)}=${encodeURIComponent(values[key])}`).join("&")
  const time = Buffer.alloc(4)
  time.writeUInt32LE(seconds, 0)
  let response: Awaited<ReturnType<typeof fetch>>
  try {
    response = await fetch(`https://log.snssdk.com/service/2/device_register/?${query}`, {
      method: "POST", timeout: 12, body: bytes.buffer as ArrayBuffer,
      headers: {
        "User-Agent": PLAYBACK_USER_AGENT, Accept: "application/json; charset=utf-8,application/x-protobuf",
        "Content-Type": "application/octet-stream;tt-data=a", "Content-Encoding": "gzip",
        "X-Tt-Request-Tag": "t=0;n=1", "Log-Encode-Type": "gzip", Lc: "102", "Sdk-Version": "2",
        "Passport-Sdk-Version": "60755", "Passport-Sdk-Settings": "device_transfer_s_0,device_transfer_ab_1",
        "X-Ss-Dp": "8662", "X-Vc-Bdturing-Sdk-Version": "4.0.3.cn", "X-Tt-Store-Region": "cn",
        "X-Tt-Store-Region-Src": "did", "X-Khronos": String(seconds), "X-Argus": time.toString("base64"),
        "X-Ss-Req-Ticket": String(stamp), "X-Ss-Stub": createHash("md5").update(bytes).digest("hex"),
        "X-Gorgon": signGorgon(query, bytes, seconds),
      },
    })
  } catch {
    throw new HttpError("游客设备注册连接失败，请检查网络后重试", 0)
  }
  if (!response.ok) throw new HttpError(`游客设备注册失败（HTTP ${response.status}）`, response.status)
  let payload: { device_id_str?: string; install_id_str?: string; device_token?: string }
  try {
    payload = JSON.parse(decodeRegistration(new Uint8Array(await response.arrayBuffer())))
  } catch {
    throw new HttpError("游客设备注册响应无效，请稍后重试", 0)
  }
  if (!payload || typeof payload.device_id_str !== "string" || !/^[1-9]\d{0,19}$/.test(payload.device_id_str)
      || typeof payload.install_id_str !== "string" || !/^[1-9]\d{0,19}$/.test(payload.install_id_str)
      || (payload.device_token !== undefined && typeof payload.device_token !== "string")) {
    throw new HttpError("游客设备注册未返回完整身份，请稍后重试", 0)
  }
  const cookies: Record<string, string> = {}
  for (const cookie of response.cookies) cookies[cookie.name] = cookie.value
  cookies.install_id = payload.install_id_str
  // Desktop also accepts registration replies without a device token and keeps the anonymous cookies.
  const identity = { deviceId: payload.device_id_str, installId: payload.install_id_str,
    deviceToken: payload.device_token ?? "", cookies }
  if (!Storage.set(STORAGE_KEY, identity)) throw new HttpError("游客设备身份保存失败，请检查脚本存储", 0)
  current = identity
  return identity
}

/** Share registration across playback/cache callers and retain anonymous credentials only in local storage. */
export async function getPlaybackIdentity(failed?: PlaybackIdentity): Promise<PlaybackIdentity> {
  if (pending) return pending
  if (!current && Storage.contains(STORAGE_KEY)) {
    const saved = Storage.get<PlaybackIdentity>(STORAGE_KEY)
    if (!saved || typeof saved.deviceId !== "string" || !/^[1-9]\d{0,19}$/.test(saved.deviceId)
        || typeof saved.installId !== "string" || !/^[1-9]\d{0,19}$/.test(saved.installId)
        || typeof saved.deviceToken !== "string"
        || !saved.cookies || typeof saved.cookies !== "object" || Array.isArray(saved.cookies)
        || Object.values(saved.cookies).some(value => typeof value !== "string")) {
      throw new HttpError("已保存的游客身份损坏，请检查 hongguo-registered-player-device-v1", 0)
    }
    current = saved
  }
  if (current && (!failed || failed !== current)) return current
  pending = registerIdentity()
  try { return await pending } finally { pending = undefined }
}
