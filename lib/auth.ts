const encoder = new TextEncoder()

export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ])
}

export async function createAuthToken(secret: string, expiresAt: number): Promise<string> {
  const payload = String(expiresAt)
  const key = await getSigningKey(secret)
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))

  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`
}

export async function isValidAuthToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token || !secret) return false

  const [payload, encodedSignature, ...extra] = token.split(".")
  if (!payload || !encodedSignature || extra.length > 0 || !/^[A-Za-z0-9_-]+$/.test(encodedSignature)) {
    return false
  }

  const expiresAt = Number(payload)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false

  const base64Signature = encodedSignature.replace(/-/g, "+").replace(/_/g, "/")
  let signature: Uint8Array
  try {
    const binary = atob(base64Signature)
    signature = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    return false
  }

  const signatureBuffer = new ArrayBuffer(signature.byteLength)
  new Uint8Array(signatureBuffer).set(signature)
  const key = await getSigningKey(secret)
  return crypto.subtle.verify("HMAC", key, signatureBuffer, encoder.encode(payload))
}
