// CAPYBER — rate limit em memória (token bucket por IP) para as rotas de API.
// Protege endpoints com custo (LLM) contra abuso acidental ou proposital.
// Em multi-instância real, trocar por um store compartilhado (Redis etc.).

interface Bucket {
  tokens: number
  last: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000 // teto de memória: evita crescimento sem limite

/**
 * Janela por recarga contínua. `max` = rajada máxima; `perMs` = janela de recarga.
 * `cost` permite cobrar mais por rotas pesadas.
 */
export function allowRequest(key: string, opts: { max: number; perMs: number; cost?: number }): boolean {
  const now = Date.now()
  const cost = opts.cost ?? 1
  const b = buckets.get(key) ?? { tokens: opts.max, last: now }
  const refill = ((now - b.last) / opts.perMs) * opts.max
  b.tokens = Math.min(opts.max, b.tokens + refill)
  b.last = now
  if (b.tokens < cost) {
    buckets.set(key, b)
    return false
  }
  b.tokens -= cost
  buckets.set(key, b)
  if (buckets.size > MAX_BUCKETS) {
    // evict dos mais antigos (Map preserva ordem de inserção)
    let dropped = 0
    for (const k of buckets.keys()) {
      if (dropped++ >= buckets.size - MAX_BUCKETS) break
      buckets.delete(k)
    }
  }
  return true
}

/** IP do cliente priorizando a última entrada de X-Forwarded-For (definida pelo gateway confiável). */
export function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) {
    const parts = xf.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return 'local'
}
