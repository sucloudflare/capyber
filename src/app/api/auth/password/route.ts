// CAPYBER — troca de senha: exige senha atual + política forte; revoga as
// outras sessões por segurança.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkPassword, getSessionUser, hashPassword, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { current?: string; next?: string }
  const user = await db.user.findUnique({ where: { id: me.id } })
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  if (!(await verifyPassword(body.current ?? '', user.passwordHash))) {
    return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
  }
  const pw = checkPassword(body.next ?? '')
  if (!pw.ok) {
    return NextResponse.json({ error: 'Nova senha não atende à política forte.', issues: pw.issues }, { status: 400 })
  }
  if (await verifyPassword(body.next ?? '', user.passwordHash)) {
    return NextResponse.json({ error: 'A nova senha deve ser diferente da atual.' }, { status: 400 })
  }

  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(body.next ?? '') } })
  await db.session.deleteMany({ where: { userId: me.id, NOT: { id: me.sessionId } } })
  return NextResponse.json({ ok: true })
}
