// CAPYBER — cadastro de operador com política de senha forte.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  checkPassword,
  clientIp,
  createSession,
  hashPassword,
  normEmail,
  rateLimit,
  toSafeUser,
  validEmail,
} from '@/lib/auth'

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const rl = rateLimit(`register:${ip}`, 6, 10 * 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Muitas tentativas. Aguarde ${rl.retryInSec}s.` },
      { status: 429 },
    )
  }

  let body: { name?: string; email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const email = normEmail(body.email ?? '')
  const name = (body.name ?? '').trim().slice(0, 60)
  const password = body.password ?? ''

  if (!validEmail(email)) return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  if (name.length < 2) return NextResponse.json({ error: 'Informe seu nome (2+ letras).' }, { status: 400 })

  const pw = checkPassword(password)
  if (!pw.ok) {
    return NextResponse.json(
      { error: 'Senha não atende à política forte.', issues: pw.issues },
      { status: 400 },
    )
  }

  const exists = await db.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: 'Este e-mail já possui conta. Faça login.' }, { status: 409 })
  }

  const user = await db.user.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  })
  await createSession(user.id, { ua: req.headers.get('user-agent') ?? undefined, ip })
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  return NextResponse.json({ user: toSafeUser(user) })
}
