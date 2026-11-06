// CAPYBER — modo demonstração: cria/entra com um operador visitante
// instantâneo (senha aleatória forte, sem MFA) para avaliar a plataforma.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { clientIp, createSession, rateLimit, toSafeUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const rl = rateLimit(`demo:${clientIp(req)}`, 10, 10 * 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: `Aguarde ${rl.retryInSec}s.` }, { status: 429 })
  }

  // reutiliza um visitante dos últimos 30 min para não poluir o banco
  const recent = await db.user.findFirst({
    where: { email: { endsWith: '@capyber.demo' }, lastLoginAt: { gte: new Date(Date.now() - 30 * 60_000) } },
    orderBy: { lastLoginAt: 'desc' },
  })

  const user =
    recent ??
    (await db.user.create({
      data: {
        email: `visitante-${randomBytes(3).toString('hex')}@capyber.demo`,
        name: 'Operador Visitante',
        passwordHash: randomBytes(24).toString('base64url') + 'Aa1!',
      },
    }))

  await createSession(user.id, { ua: req.headers.get('user-agent') ?? undefined, ip: 'demo' })
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

  return NextResponse.json({ user: toSafeUser(user) })
}
