// CAPYBER CORE — motor de defesa EMBUTIDO no processo do Next.js.
// ─────────────────────────────────────────────────────────────────────────────
// Por quê: o sandbox recolhe processos em background soltos (mini-services),
// então o motor agora vive DENTRO do servidor Next (instrumentation.ts) —
// mesmo código do motor, mesma porta 3003 (socket.io + REST via gateway
// `?XTransformPort=3003`), ciclo de vida = ciclo de vida do app.
// ─────────────────────────────────────────────────────────────────────────────

import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import net from 'net'
import { Server } from 'socket.io'
import { engine } from '../../mini-services/threat-engine/src/engine'
import { SCENARIOS, KILL_CHAIN, TARGETS } from '../../mini-services/threat-engine/src/scenarios'
import type { DeviceActionName } from '../../mini-services/threat-engine/src/types'

const PORT = 3003
const INTERNAL_PORT = 13003
const MAX_BODY_BYTES = 8 * 1024
const API_VERSION = '2.0.0'

function logStructured(level: 'info' | 'warn' | 'error', msg: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, svc: 'capycor', msg, ...extra }))
}

function isSocketIoRequest(req: IncomingMessage): boolean {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    return url.searchParams.has('EIO') || url.searchParams.has('transport')
  } catch {
    return false
  }
}

function securityHeaders(res: ServerResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-CAPYBER-API-Version', API_VERSION)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
}

function json(res: ServerResponse, status: number, data: unknown, reqId?: string) {
  const body = JSON.stringify(data)
  securityHeaders(res)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...(reqId ? { 'X-Request-Id': reqId } : {}),
  })
  res.end(body)
}

async function readBody(req: IncomingMessage): Promise<string | null> {
  let size = 0
  let data = ''
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES) return null
    data += chunk
  }
  return data
}

const VALID_ACTIONS: DeviceActionName[] = ['ISOLAR', 'LIBERAR', 'VARREDURA', 'REVOGAR_SESSOES']
const DEVICE_ID_RE = /^[A-Z]{2}-\d{3}$/

// ── rate limit por IP (token bucket em memória) ──────────────────────
const buckets = new Map<string, { tokens: number; last: number }>()
const RATE_LIMIT = 60
const MAX_BUCKETS = 5000
function allowRequest(ip: string, isWrite: boolean): boolean {
  const now = Date.now()
  const b = buckets.get(ip) ?? { tokens: RATE_LIMIT, last: now }
  const refill = ((now - b.last) / 60000) * RATE_LIMIT
  b.tokens = Math.min(RATE_LIMIT, b.tokens + refill)
  b.last = now
  if (b.tokens < 1) {
    buckets.set(ip, b)
    return false
  }
  b.tokens -= isWrite ? 2.5 : 1
  buckets.set(ip, b)
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS
    let dropped = 0
    for (const key of buckets.keys()) {
      if (dropped++ >= excess) break
      buckets.delete(key)
    }
  }
  return true
}

function clientIp(req: IncomingMessage): string {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length > 3) {
    const parts = xf.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return req.socket.remoteAddress ?? '0.0.0.0'
}

function requestId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Inicia o motor CAPYCORE embutido (idempotente, à prova de hot-reload). */
export function startCapyCore(): void {
  const g = globalThis as unknown as { __capyCoreStarted?: boolean }
  if (g.__capyCoreStarted) return
  g.__capyCoreStarted = true

  try {
    // ── Socket.io em servidor INTERNO (loopback) ────────────────────────
    const io = new Server(
      createServer().listen(INTERNAL_PORT, '127.0.0.1'),
      {
        path: '/',
        cors: { origin: '*', methods: ['GET', 'POST'] },
        pingTimeout: 60000,
        pingInterval: 25000,
      }
    )

    // ── Servidor HTTP público (REST + delegação socket.io + upgrade WS) ──
    const httpServer = createServer(async (req, res) => {
      if (req.method === 'OPTIONS') {
        securityHeaders(res)
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        })
        return res.end()
      }

      if (isSocketIoRequest(req)) {
        const upstream = `http://127.0.0.1:${INTERNAL_PORT}${req.url}`
        const headers = new Headers()
        for (const [key, value] of Object.entries(req.headers)) {
          if (typeof value === 'string' && !['host', 'connection', 'transfer-encoding', 'content-length'].includes(key)) {
            headers.set(key, value)
          }
        }
        const method = req.method ?? 'GET'
        let body: string | undefined
        if (method !== 'GET' && method !== 'HEAD') {
          const raw = await readBody(req)
          if (raw === null) return json(res, 413, { error: 'Corpo excede o limite' })
          body = raw
          headers.set('content-type', headers.get('content-type') ?? 'text/plain;charset=UTF-8')
        }
        try {
          const resp = await fetch(upstream, { method, headers, body, redirect: 'manual' })
          const resHeaders: Record<string, string> = {}
          resp.headers.forEach((v, k) => {
            if (!['transfer-encoding', 'content-encoding', 'connection'].includes(k)) resHeaders[k] = v
          })
          res.writeHead(resp.status, resHeaders)
          const buf = await resp.arrayBuffer()
          return res.end(Buffer.from(buf))
        } catch (err) {
          logStructured('error', 'proxy socket.io falhou', { err: String(err) })
          return json(res, 502, { error: 'proxy socket.io indisponível' })
        }
      }

      const url = new URL(req.url ?? '/', 'http://localhost')
      const ip = clientIp(req)
      const path = url.pathname
      const reqId = requestId()
      const isWrite = req.method === 'POST'

      try {
        if (path === '/api/health') {
          return json(res, 200, {
            ok: true,
            name: 'CAPYBER CORE',
            version: API_VERSION,
            uptimeS: Math.floor((Date.now() - engine.startedAt) / 1000),
            scenarios: SCENARIOS.length,
            devices: engine.devices.length,
          }, reqId)
        }

        if (!allowRequest(ip, isWrite)) {
          return json(res, 429, { error: 'Limite de requisições excedido (rate limit CAPYBER).' }, reqId)
        }

        if (path === '/api/stats' && req.method === 'GET') {
          engine.stats.uptimeS = Math.floor((Date.now() - engine.startedAt) / 1000)
          engine.recomputeDefcon()
          return json(res, 200, { ...engine.stats }, reqId)
        }

        if (path === '/api/events' && req.method === 'GET') {
          const limit = Math.min(Number(url.searchParams.get('limit') ?? 40) || 40, 120)
          return json(res, 200, { events: engine.events.slice(0, limit), killChain: KILL_CHAIN }, reqId)
        }

        if (path === '/api/devices' && req.method === 'GET') {
          return json(res, 200, { devices: engine.devices }, reqId)
        }

        if (path === '/api/audit' && req.method === 'GET') {
          const limit = Math.min(Number(url.searchParams.get('limit') ?? 60) || 60, 200)
          return json(res, 200, { audit: engine.audit.slice(0, limit) }, reqId)
        }

        if (path === '/api/metrics' && req.method === 'GET') {
          const s = engine.stats
          const lines = [
            '# HELP capyber_events_total Total de eventos de ameaça processados',
            '# TYPE capyber_events_total counter',
            `capyber_events_total ${s.eventsTotal}`,
            '# HELP capyber_blocked_total Total de ataques neutralizados',
            '# TYPE capyber_blocked_total counter',
            `capyber_blocked_total ${s.blockedTotal}`,
            '# HELP capyber_actions_executed Ações de resposta executadas (humano + IA)',
            '# TYPE capyber_actions_executed counter',
            `capyber_actions_executed ${s.actionsExecuted}`,
            '# HELP capyber_active_threats Ameaças ativas no momento',
            '# TYPE capyber_active_threats gauge',
            `capyber_active_threats ${s.activeThreats}`,
            '# HELP capyber_devices_secure Endpoints com postura segura',
            '# TYPE capyber_devices_secure gauge',
            `capyber_devices_secure ${s.devicesSecure}`,
            '# HELP capyber_devices_total Total de endpoints monitorados',
            '# TYPE capyber_devices_total gauge',
            `capyber_devices_total ${s.devicesTotal}`,
            '# HELP capyber_defcon Nível de prontidão (1=crítico, 5=tranquilo)',
            '# TYPE capyber_defcon gauge',
            `capyber_defcon ${s.defcon}`,
          ]
          securityHeaders(res)
          res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' })
          return res.end(lines.join('\n') + '\n')
        }

        if (path === '/api/scenarios' && req.method === 'GET') {
          return json(res, 200, {
            scenarios: SCENARIOS.map(({ id, title, kind, severity, mitre, origin, targetId, description, mitigations, playbook }) => ({
              id, title, kind, severity, mitre, origin, targetId, description, mitigations, playbook, target: TARGETS[targetId],
            })),
            killChain: KILL_CHAIN,
          }, reqId)
        }

        if (path === '/api/scenario/trigger' && req.method === 'POST') {
          const raw = await readBody(req)
          if (raw === null) return json(res, 413, { error: 'Corpo excede 8 KB' }, reqId)
          let body: { id?: string; actor?: string } = {}
          try { body = JSON.parse(raw) } catch { /* body inválido tratado como vazio */ }
          const actor = body.actor === 'COPILOTO_IA' ? 'COPILOTO_IA' : 'OPERADOR'
          const ev = body.id ? engine.runScenario(String(body.id).slice(0, 20), actor) : engine.runRandomScenario(actor)
          if (!ev) return json(res, 404, { error: 'Cenário não encontrado', available: SCENARIOS.map((s) => s.id) }, reqId)
          return json(res, 200, { ok: true, event: ev }, reqId)
        }

        if (path === '/api/device/action' && req.method === 'POST') {
          const raw = await readBody(req)
          if (raw === null) return json(res, 413, { error: 'Corpo excede 8 KB' }, reqId)
          let body: { deviceId?: string; action?: string; actor?: string } = {}
          try { body = JSON.parse(raw) } catch { /* idem */ }
          const deviceId = String(body.deviceId ?? '')
          const action = String(body.action ?? '') as DeviceActionName
          if (!DEVICE_ID_RE.test(deviceId)) {
            return json(res, 400, { error: 'deviceId inválido (formato esperado: XX-000)' }, reqId)
          }
          if (!VALID_ACTIONS.includes(action)) {
            return json(res, 400, { error: 'Ação inválida', available: VALID_ACTIONS }, reqId)
          }
          const actor = body.actor === 'COPILOTO_IA' ? 'COPILOTO_IA' : 'OPERADOR'
          const result = engine.deviceAction(deviceId, action, actor)
          return json(res, result.ok ? 200 : 409, result, reqId)
        }

        return json(res, 404, { error: 'Endpoint não encontrado', hint: 'use /api/health, /api/stats, /api/events, /api/devices, /api/audit, /api/metrics, /api/scenarios, POST /api/scenario/trigger, POST /api/device/action' }, reqId)
      } catch (err) {
        logStructured('error', 'erro na API', { path, err: String(err) })
        return json(res, 500, { error: 'Erro interno do motor' }, reqId)
      }
    })

    // Upgrade WebSocket → proxy TCP bruto para o servidor interno do socket.io
    httpServer.on('upgrade', (req, clientSocket, head) => {
      if (!isSocketIoRequest(req)) {
        clientSocket.destroy()
        return
      }
      const rawHeaders = (req as unknown as { rawHeaders?: string[] }).rawHeaders ?? []
      const upstream = net.connect(INTERNAL_PORT, '127.0.0.1')
      upstream.on('connect', () => {
        const raw = [`GET ${req.url} HTTP/1.1`, `Host: 127.0.0.1:${INTERNAL_PORT}`]
        for (let i = 0; i < rawHeaders.length; i += 2) {
          const key = rawHeaders[i]
          const val = rawHeaders[i + 1]
          if (!['host', 'connection', 'upgrade', 'content-length'].includes(key.toLowerCase())) {
            raw.push(`${key}: ${val}`)
          }
        }
        if (!rawHeaders.length) {
          raw.push(
            `Sec-WebSocket-Version: 13`,
            `Sec-WebSocket-Key: ${Math.random().toString(36).slice(2)}==`,
            `Origin: http://127.0.0.1:${PORT}`
          )
        }
        raw.push(`Connection: Upgrade`, `Upgrade: websocket`, '', '')
        upstream.write(raw.join('\r\n'))
        if (head.length) upstream.write(head)
        clientSocket.resume()
      })
      upstream.on('data', (d: Buffer) => { clientSocket.write(d) })
      clientSocket.on('data', (d: Buffer) => { upstream.write(d) })
      upstream.on('close', () => { clientSocket.end() })
      clientSocket.on('close', () => { upstream.end() })
      upstream.on('error', () => clientSocket.destroy())
      clientSocket.on('error', () => upstream.destroy())
    })

    // ── Canal de tempo real socket.io ────────────────────────────────────
    io.on('connection', (socket) => {
      socket.emit('stats:update', { ...engine.stats, uptimeS: Math.floor((Date.now() - engine.startedAt) / 1000) })
      socket.emit('devices:update', engine.devices)
      socket.emit('events:snapshot', { events: engine.events.slice(0, 40), killChain: KILL_CHAIN })
      socket.emit('audit:snapshot', engine.audit.slice(0, 60))

      socket.on('scenario:trigger', (data?: { id?: string }, ack?: (r: unknown) => void) => {
        const ev = data?.id ? engine.runScenario(String(data.id).slice(0, 20), 'OPERADOR') : engine.runRandomScenario('OPERADOR')
        ack?.(ev ? { ok: true, event: ev } : { ok: false, error: 'Cenário não encontrado' })
      })

      socket.on('device:action', (data?: { deviceId?: string; action?: string }, ack?: (r: unknown) => void) => {
        if (!data?.deviceId || !data?.action) return ack?.({ ok: false, error: 'Parâmetros ausentes' })
        const result = engine.deviceAction(String(data.deviceId).slice(0, 12), String(data.action).slice(0, 16) as DeviceActionName, 'OPERADOR')
        ack?.(result)
      })

      socket.on('stats:get', (ack?: (r: unknown) => void) => {
        ack?.({ ...engine.stats, uptimeS: Math.floor((Date.now() - engine.startedAt) / 1000) })
      })

      socket.on('devices:get', (ack?: (r: unknown) => void) => {
        ack?.(engine.devices)
      })
    })

    // ── Pub-sub do motor → socket.io ─────────────────────────────────────
    engine.onEvent = (ev) => io.emit('threat:event', ev)
    engine.onStats = (s) => io.emit('stats:update', s)
    engine.onDevices = (d) => io.emit('devices:update', d)
    engine.onAudit = (a) => io.emit('audit:entry', a)

    httpServer.on('error', (err) => {
      // porta ocupada (outra instância do motor no ar) — não derruba o Next
      logStructured('warn', 'motor embutido não assumiu a porta', { port: PORT, err: String(err) })
    })

    httpServer.listen(PORT, () => {
      logStructured('info', 'motor de defesa no ar (embutido no Next)', { port: PORT, scenarios: SCENARIOS.length, devices: engine.devices.length, version: API_VERSION })
    })

    // primeiro evento logo no boot para o feed não nascer vazio
    setTimeout(() => engine.runRandomScenario('MOTOR'), 2500)
  } catch (err) {
    logStructured('error', 'falha ao iniciar motor embutido', { err: String(err) })
  }
}
