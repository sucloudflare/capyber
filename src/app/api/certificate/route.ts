// CAPYBER — emissão de certificados de conquistas (livro concluído, CTF vencido,
// jogo stealth). POST /api/certificate → { ok, id, serial, verifyCode, ... }.
// O PDF é gerado por GET /api/certificate/[id] com pdf-lib.

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { clientIp, rateLimit } from '@/lib/auth'
import { createAwardCertificate } from '@/lib/award-certificate'

export const runtime = 'nodejs'

/* Salt server-side do código de verificação. Vem de CERT_SALT (≥16 chars); sem ele, usa um
 * salt aleatório por processo — o código é gravado no banco e nunca recalculado, então nada
 * quebra, e o repositório público não expõe um salt fixo. */
const CERT_SALT =
  process.env.CERT_SALT && process.env.CERT_SALT.length >= 16
    ? process.env.CERT_SALT
    : randomBytes(32).toString('hex')

const TYPES = ['livro', 'ctf', 'stealth'] as const

const SERIAL_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // sem chars ambíguos

function randomSerial(year: number): string {
  const raw = randomBytes(6)
  let s = ''
  for (let i = 0; i < 6; i++) s += SERIAL_ALPHABET[raw[i] % SERIAL_ALPHABET.length]
  return `CAPY-CERT-${year}-${s}`
}

function verifyCodeFor(type: string, serial: string, name: string): string {
  return createHash('sha256').update(`${type}|${serial}|${name}|${CERT_SALT}`).digest('hex').slice(0, 16)
}

/** Sanitiza meta: máx. 8 entradas, chave ≤ 40, valor ≤ 200, só string→string. */
function sanitizeMeta(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 8)) {
    if (typeof v !== 'string') continue
    const key = k.trim().slice(0, 40)
    const val = v.trim().slice(0, 200)
    if (key && val) out[key] = val
  }
  return Object.keys(out).length > 0 ? out : null
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`award-cert:${clientIp(req)}`, 10, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: `Muitas emissões seguidas. Tente de novo em ${rl.retryInSec}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryInSec) } },
      )
    }

    const body = (await req.json().catch(() => null)) as {
      type?: unknown
      name?: unknown
      meta?: unknown
    } | null

    const type = typeof body?.type === 'string' ? body.type : ''
    if (!(TYPES as readonly string[]).includes(type)) {
      return NextResponse.json(
        { ok: false, error: 'Tipo de certificado inválido (livro, ctf ou stealth).' },
        { status: 400 },
      )
    }

    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (name.length < 3 || name.length > 80) {
      return NextResponse.json(
        { ok: false, error: 'Informe um nome entre 3 e 80 caracteres.' },
        { status: 400 },
      )
    }

    const meta = sanitizeMeta(body?.meta)
    const metaJson = meta ? JSON.stringify(meta) : null
    const year = new Date().getFullYear()

    // tenta criar até 5x (colisão improvável de serial/verifyCode)
    let cert = null
    for (let attempt = 0; attempt < 5 && !cert; attempt++) {
      const serial = randomSerial(year)
      const verifyCode = verifyCodeFor(type, serial, name)
      cert = await createAwardCertificate({ type, holderName: name, serial, verifyCode, metaJson })
    }
    if (!cert) {
      return NextResponse.json(
        { ok: false, error: 'Não foi possível gerar um serial único. Tente novamente.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      id: cert.id,
      serial: cert.serial,
      verifyCode: cert.verifyCode,
      issuedAt: cert.createdAt.toISOString(),
      type: cert.type,
      holderName: cert.holderName,
    })
  } catch (err) {
    console.error('[certificate:POST]', err)
    return NextResponse.json({ ok: false, error: 'Erro interno ao emitir certificado.' }, { status: 500 })
  }
}
