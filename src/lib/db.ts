import { PrismaClient } from '@prisma/client'

// Infra de persistência opt-in: o CAPYBER roda 100% com dados sintéticos em
// memória (motor CAPYCORE) — o Prisma fica disponível para features futuras
// (auth, ranking da trilha) sem novo setup. Não importar no client.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 'query' loga cada SQL — útil só em dev; em produção mantém o log limpo
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
