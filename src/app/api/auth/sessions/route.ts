// CAPYBER — gerenciador de sessões ativas do operador (listar/revogar).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const sessions = await db.session.findMany({
    where: { userId: me.id, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      userAgent: s.userAgent ?? '',
      ip: s.ip ?? '',
      current: s.id === me.sessionId,
    })),
  })
}

export async function DELETE(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean }
  if (body.all) {
    await db.session.deleteMany({ where: { userId: me.id } })
    return NextResponse.json({ ok: true, loggedOut: true })
  }
  if (body.id) {
    await db.session.deleteMany({ where: { id: body.id, userId: me.id } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Informe id ou all.' }, { status: 400 })
}
