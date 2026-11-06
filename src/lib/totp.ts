// CAPYBER — TOTP (RFC 6238) sem dependências externas: só node:crypto.
// Compatível com Google Authenticator, Authy, Aegis, Microsoft Authenticator.

import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

export function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const ch of clean) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(ch)
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20))
}

function hotp(secretBuf: Buffer, counter: number): string {
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter % 0x100000000, 4)
  const hmac = createHmac('sha1', secretBuf).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 1_000_000).padStart(6, '0')
}

export function totpCode(secretB32: string, forTime = Date.now()): string {
  return hotp(base32Decode(secretB32), Math.floor(forTime / 30_000))
}

/** Verifica o código com janela de tolerância de ±1 passo (30s). */
export function verifyTotp(secretB32: string, code: string, forTime = Date.now()): boolean {
  const clean = (code || '').replace(/\D/g, '')
  if (clean.length !== 6) return false
  const counter = Math.floor(forTime / 30_000)
  const secretBuf = base32Decode(secretB32)
  for (let drift = -1; drift <= 1; drift++) {
    const expected = hotp(secretBuf, counter + drift)
    const a = Buffer.from(expected)
    const b = Buffer.from(clean)
    if (a.length === b.length && timingSafeEqual(a, b)) return true
  }
  return false
}

export function otpauthUri(email: string, secretB32: string): string {
  return `otpauth://totp/${encodeURIComponent(`CAPYBER:${email}`)}?secret=${secretB32}&issuer=CAPYBER&algorithm=SHA1&digits=6&period=30`
}
