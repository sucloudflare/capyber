// CAPYBER — API OSINT: varredura real em streaming (NDJSON).
// Cada linha é um evento JSON: módulos, nós, arestas e resumo final.
// Rate-limit em memória protege as fontes públicas contra abuso.

import type { NextRequest } from 'next/server'
import { allowRequest } from '@/lib/rate-limit'
import { runOsintScan } from '@/lib/osint-engine'
import { OSINT_MODULES, type OsintEvent } from '@/lib/osint-modules'

export const runtime = 'nodejs'
export const maxDuration = 60

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for') ?? ''
  return `osint:${fwd.split(',')[0]?.trim() || 'local'}`
}

export async function POST(req: NextRequest): Promise<Response> {
  let target = ''
  try {
    const body = (await req.json()) as { target?: unknown }
    if (typeof body.target === 'string') target = body.target
  } catch {
    /* corpo inválido tratado abaixo */
  }
  target = target.trim().slice(0, 200)

  if (!target) {
    return Response.json(
      { error: 'Informe um alvo: domínio, IP, e-mail ou @usuário.' },
      { status: 400 },
    )
  }

  if (!allowRequest(clientKey(req), { max: 15, perMs: 5 * 60_000, cost: 1 })) {
    return Response.json(
      { error: 'Limite de varreduras atingido (15 a cada 5 min). Aguarde um pouco.' },
      { status: 429 },
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (ev: OsintEvent): void => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(JSON.stringify(ev) + '\n'))
        } catch {
          closed = true
        }
      }

      // registro de módulos primeiro — o cliente monta os chips
      send({ t: 'modules', modules: OSINT_MODULES })

      try {
        await runOsintScan(target, send)
      } catch (e) {
        send({
          t: 'module',
          id: 'motor',
          label: 'Motor OSINT',
          status: 'error',
          info: e instanceof Error ? e.message.slice(0, 80) : 'erro inesperado',
        })
        send({ t: 'done', summary: { nodes: 0, edges: 0, sec: 0 } })
      }
      closed = true
      controller.close()
    },
    cancel() {
      // cliente abortou — runOsintScan termina sozinho (timeouts curtos por módulo)
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store, no-transform',
      'x-accel-buffering': 'no',
    },
  })
}
