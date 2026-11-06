// CAPYBER — núcleo de autenticação (servidor): bcrypt, sessões em banco,
// política de senha forte, rate limit anti brute-force e helpers de cookie.

import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'capy_session'
const SESSION_TTL_DAYS = 30
const BCRYPT_ROUNDS = 12

export interface SafeUser {
  id: string
  email: string
  name: string
  mfaEnabled: boolean
  createdAt: string
  lastLoginAt: string | null
  isDemo: boolean
}

/* ─────────── senha: política forte (mín. 12 + 4 classes) ─────────── */
// Fonte única client-safe: implementação vive em password-policy.ts
// (usada também pelo AuthGate no cliente) e é apenas reexportada aqui.

export { checkPassword, passwordRequirements, suggestPassword } from '@/lib/password-policy'
export type { PasswordCheck, PasswordRequirement } from '@/lib/password-policy'

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_ROUNDS)
}

export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}

let dummyHash: Promise<string> | null = null
/** Hash bcrypt descartável: comparar contra ele quando o usuário não existe iguala o tempo de resposta. */
export function getDummyHash(): Promise<string> {
  return (dummyHash ??= bcrypt.hash(randomBytes(16).toString('hex'), BCRYPT_ROUNDS))
}

/* ─────────── sessões: token opaco em cookie httpOnly ─────────── */

/** Token opaco (384 bits de entropia) → o banco guarda só o SHA-256: um dump do DB não vira sessão válida. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string, meta: { ua?: string; ip?: string }) {
  const token = randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000)
  await db.session.create({
    data: {
      token: hashToken(token),
      userId,
      expiresAt,
      userAgent: meta.ua?.slice(0, 250),
      ip: meta.ip?.slice(0, 60),
    },
  })
  // limpeza oportunista de sessões expiradas (sem cron); falha aqui nunca derruba o login
  void db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {})
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 86_400,
  })
  return token
}

export async function destroyCurrentSession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) await db.session.deleteMany({ where: { token: hashToken(token) } })
  jar.delete(SESSION_COOKIE)
}

export async function getSessionUser(): Promise<(SafeUser & { sessionId: string; loginAt: Date }) | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  const s = await db.session.findUnique({
    where: { token: hashToken(token) },
    include: { user: true },
  })
  if (!s || s.expiresAt < new Date()) return null
  return {
    sessionId: s.id,
    loginAt: s.createdAt,
    id: s.user.id,
    email: s.user.email,
    name: s.user.name ?? s.user.email.split('@')[0],
    mfaEnabled: s.user.mfaEnabled,
    createdAt: s.user.createdAt.toISOString(),
    lastLoginAt: s.user.lastLoginAt?.toISOString() ?? null,
    isDemo: s.user.email.endsWith('@capyber.demo'),
  }
}

export function toSafeUser(u: {
  id: string
  email: string
  name: string | null
  mfaEnabled: boolean
  createdAt: Date
  lastLoginAt: Date | null
}): SafeUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? u.email.split('@')[0],
    mfaEnabled: u.mfaEnabled,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    isDemo: u.email.endsWith('@capyber.demo'),
  }
}

/* ─────────── rate limit em memória (anti brute-force) ─────────── */

const buckets = new Map<string, { count: number; resetAt: number }>()

const MAX_BUCKETS = 10_000 // teto de memória: um atacante variando a chave não pode inflar o Map

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryInSec: number } {
  const now = Date.now()
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k)
    // ainda cheio (ataque em andamento)? descarta os mais antigos (Map preserva ordem de inserção)
    if (buckets.size > MAX_BUCKETS) {
      let drop = buckets.size - MAX_BUCKETS
      for (const k of buckets.keys()) {
        if (drop-- <= 0) break
        buckets.delete(k)
      }
    }
  }
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryInSec: 0 }
  }
  b.count++
  if (b.count > limit) return { ok: false, retryInSec: Math.ceil((b.resetAt - now) / 1000) }
  return { ok: true, retryInSec: 0 }
}

// Fonte única: lê a última entrada de X-Forwarded-For (a do gateway confiável).
// A primeira é controlada pelo cliente — usá-la permitia burlar o rate limit do login.
export { clientIp } from '@/lib/rate-limit'

/* ─────────── sanitização de e-mail/nome ─────────── */

export function normEmail(email: string): string {
  return (email || '').trim().toLowerCase()
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}
