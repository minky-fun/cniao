import { md5 } from "./md5"
import { hmac_sha1 } from "./sha1"

// MTOP sign input builders — replicate InnerSignImpl / LocalInnerSignImpl sign-input format
// Legacy format (LocalInnerSignImpl / old protocol):
//   utdid & uid & reqBizExt & appKey & MD5(data) & t & api & v & sid & ttid & deviceId & lat & lng & extdata & x-features

function emptyIfNull(v: string | undefined): string {
  return v ?? ""
}

function md5IfPresent(v: string | undefined): string {
  if (!v) return v ?? ""
  return md5(v)
}

/**
 * Build the sign-input string that MTOP signs with HMAC-SHA1.
 * Mirrors `InnerSignImpl.b()` and `LocalInnerSignImpl.es()`.
 */
function buildSignInput(headers: Record<string, string>, appKey: string): string {
  const dataRaw = headers["data"] ?? ""
  const parts = [
    emptyIfNull(headers["utdid"]),
    emptyIfNull(headers["uid"]),
    emptyIfNull(headers["x-reqbiz-ext"]),
    appKey,
    md5IfPresent(dataRaw),
    headers["t"] ?? "",
    headers["api"] ?? "",
    headers["v"] ?? "",
    emptyIfNull(headers["sid"]),
    emptyIfNull(headers["ttid"]),
    emptyIfNull(headers["deviceId"]),
    emptyIfNull(headers["lat"]),
    emptyIfNull(headers["lng"]),
    emptyIfNull(headers["extdata"]),
    headers["x-features"] ?? "",
  ]
  return parts.join("&")
}

/**
 * Generate MTOP x-sign locally using HMAC-SHA1.
 * Requires appKey and appSecret — extract appKey from BoxJS headers (x-appkey or appKey).
 */
export function generateMtopSign(
  signParams: Record<string, string>,
  appKey: string,
  appSecret: string,
): string {
  const input = buildSignInput(signParams, appKey)
  console.log("[sign] input:", input)
  return hmac_sha1(appSecret, input)
}

/**
 * Extract appKey value from raw BoxJS headers JSON.
 */
export function extractAppKey(headers: Record<string, string>): string {
  return headers["x-appkey"] ?? headers["appKey"] ?? ""
}
