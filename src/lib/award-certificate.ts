// CAPYBER — acesso a dados dos certificados de conquista (model AwardCertificate).
// Caminho nativo tipado (db.awardCertificate) + fallback SQL cru pelas conexões
// do próprio cliente: cobre o caso raro de dev sem restart em que o PrismaClient
// em memória foi gerado ANTES do model existir no schema (cache de módulo do
// bundler). Após qualquer restart, o caminho nativo é usado direto.

import { randomUUID } from 'crypto'
import { db } from '@/lib/db'

export interface AwardCert {
  id: string
  type: string
  holderName: string
  serial: string
  verifyCode: string
  metaJson: string | null
  createdAt: Date
}

export type AwardCertInput = Omit<AwardCert, 'id' | 'createdAt'>

function toDate(v: unknown): Date {
  if (v instanceof Date) return v
  if (typeof v === 'number') return new Date(v)
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? new Date() : d
}

function isUniqueViolation(e: unknown): boolean {
  const code = (e as { code?: string }).code
  if (code === 'P2002') return true
  return e instanceof Error && e.message.includes('UNIQUE constraint failed')
}

/* ─────────────── criação ─────────────── */

async function createNative(input: AwardCertInput): Promise<AwardCert | null> {
  try {
    const cert = await db.awardCertificate.create({ data: { ...input } })
    return { ...cert }
  } catch (e) {
    if (isUniqueViolation(e)) return null
    throw e
  }
}

async function createRaw(input: AwardCertInput): Promise<AwardCert | null> {
  try {
    const id = randomUUID()
    const createdAt = new Date()
    const metaJson = input.metaJson ?? null
    await db.$executeRaw`
      INSERT INTO "AwardCertificate"
        ("id", "type", "holderName", "serial", "verifyCode", "metaJson", "createdAt")
      VALUES
        (${id}, ${input.type}, ${input.holderName}, ${input.serial}, ${input.verifyCode}, ${metaJson}, ${createdAt})
    `
    return { id, createdAt, ...input }
  } catch (e) {
    if (isUniqueViolation(e)) return null
    throw e
  }
}

/** Insere o certificado; retorna null se serial/verifyCode colidirem. */
export async function createAwardCertificate(input: AwardCertInput): Promise<AwardCert | null> {
  if ('awardCertificate' in db) return createNative(input)
  return createRaw(input)
}

/* ─────────────── consulta ─────────────── */

interface AwardCertRow {
  id: string
  type: string
  holderName: string
  serial: string
  verifyCode: string
  metaJson: string | null
  createdAt: unknown
}

function rowToCert(r: AwardCertRow): AwardCert {
  return {
    id: r.id,
    type: r.type,
    holderName: r.holderName,
    serial: r.serial,
    verifyCode: r.verifyCode,
    metaJson: r.metaJson ?? null,
    createdAt: toDate(r.createdAt),
  }
}

async function findNative(id: string): Promise<AwardCert | null> {
  const cert = await db.awardCertificate.findUnique({ where: { id } })
  return cert ? { ...cert } : null
}

async function findRaw(id: string): Promise<AwardCert | null> {
  const rows = await db.$queryRaw<AwardCertRow[]>`
    SELECT "id", "type", "holderName", "serial", "verifyCode", "metaJson", "createdAt"
    FROM "AwardCertificate"
    WHERE "id" = ${id}
    LIMIT 1
  `
  const r = rows[0]
  return r ? rowToCert(r) : null
}

/** Busca o certificado pelo id (ou null se não existir). */
export async function findAwardCertificate(id: string): Promise<AwardCert | null> {
  if ('awardCertificate' in db) return findNative(id)
  return findRaw(id)
}
