// CAPYBER — healthcheck da aplicação (probes de Docker/K8s/monitor externo).
// Relata o estado do app e a disponibilidade do motor CAPYCORE (:3003 via gateway).

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  let engine: 'online' | 'offline' = 'offline'
  let engineVersion: string | null = null

  try {
    const res = await fetch('http://127.0.0.1:3003/api/health', {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    })
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; version?: string }
      engine = data.ok ? 'online' : 'offline'
      engineVersion = data.version ?? null
    }
  } catch {
    // motor offline: o app continua saudável — a UI mostra MOTOR OFFLINE
  }

  return NextResponse.json({
    ok: true,
    name: 'CAPYBER',
    uptimeS: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    engine,
    engineVersion,
  })
}
