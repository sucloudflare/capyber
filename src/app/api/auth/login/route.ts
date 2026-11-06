// CAPYBER — login com senha + etapa opcional de MFA (TOTP 6 dígitos).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyTotp } from '@/lib/totp'
import {
  clientIp,
  createSession,
  getDummyHash,
  normEmail,
  rateLimit,
  toSafeUser,
  verifyPassword,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  let body: { email?: string; password?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  // limite por IP (qualquer e-mail): barra password spraying, que o limite por IP+e-mail não pega
  const rlIp = rateLimit(`login-ip:${ip}`, 30, 10 * 60_000)
  if (!rlIp.ok) {
    return NextResponse.json(
      { error: `Bloqueado por tentativas excessivas. Tente em ${rlIp.retryInSec}s.` },
      { status: 429, headers: { 'Retry-After': String(rlIp.retryInSec) } },
    )
  }

  const email = normEmail(typeof body.email === 'string' ? body.email : '')
  const rlKey = `login:${ip}:${email || 'anon'}`
  const rl = rateLimit(rlKey, 8, 10 * 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Bloqueado por tentativas excessivas. Tente em ${rl.retryInSec}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryInSec) } },
    )
  }

  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { email } })
  // sempre roda um bcrypt (mesmo sem usuário) → tempo constante, sem enumeração de contas
  const ok = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()))
  if (!user || !ok) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
  }

  if (user.mfaEnabled) {
    const code = (typeof body.code === 'string' ? body.code : '').trim()
    if (!code) return NextResponse.json({ mfaRequired: true })
    if (!verifyTotp(user.mfaSecret ?? '', code)) {
      return NextResponse.json({ mfaRequired: true, error: 'Código MFA inválido ou expirado.' }, { status: 401 })
    }
  }

  await createSession(user.id, { ua: req.headers.get('user-agent') ?? undefined, ip })
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  return NextResponse.json({ user: toSafeUser(user) })
}
