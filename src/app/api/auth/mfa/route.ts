// CAPYBER — MFA TOTP: setup (QR), ativação e desativação.

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { db } from '@/lib/db'
import { generateTotpSecret, otpauthUri, verifyTotp } from '@/lib/totp'
import { getSessionUser, rateLimit, verifyPassword } from '@/lib/auth'

/** Gera segredo + QR para o app autenticador (ainda inativo até /enable). */
export async function POST(_req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  if (me.mfaEnabled) return NextResponse.json({ error: 'MFA já está ativo.' }, { status: 400 })
  if (!rateLimit(`mfa:${me.id}`, 10, 5 * 60_000).ok) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde.' }, { status: 429 })
  }

  const secret = generateTotpSecret()
  await db.user.update({ where: { id: me.id }, data: { mfaSecret: secret, mfaEnabled: false } })
  const uri = otpauthUri(me.email, secret)
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220, color: { dark: '#10315c', light: '#ffffff' } })

  return NextResponse.json({ secret, uri, qr })
}

/** Ativa o MFA após conferir o primeiro código válido. */
export async function PUT(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { code?: string }
  const user = await db.user.findUnique({ where: { id: me.id } })
  if (!user?.mfaSecret) return NextResponse.json({ error: 'Gere o QR primeiro (setup).' }, { status: 400 })
  if (!verifyTotp(user.mfaSecret, body.code ?? '')) {
    return NextResponse.json({ error: 'Código inválido. Verifique o app e tente de novo.' }, { status: 400 })
  }
  await db.user.update({ where: { id: me.id }, data: { mfaEnabled: true } })
  return NextResponse.json({ ok: true })
}

/** Desativa o MFA: exige senha + código válido do app. */
export async function DELETE(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { password?: string; code?: string }
  const user = await db.user.findUnique({ where: { id: me.id } })
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  if (!(await verifyPassword(body.password ?? '', user.passwordHash))) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
  }
  if (user.mfaEnabled && !verifyTotp(user.mfaSecret ?? '', body.code ?? '')) {
    return NextResponse.json({ error: 'Código MFA inválido.' }, { status: 401 })
  }
  await db.user.update({ where: { id: me.id }, data: { mfaEnabled: false, mfaSecret: null } })
  return NextResponse.json({ ok: true })
}
