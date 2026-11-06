import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  const { sessionId, loginAt, ...safe } = user
  return NextResponse.json({ user: safe, session: { id: sessionId, loginAt } })
}
