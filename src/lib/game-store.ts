// CAPYBER — progresso da Trilha 3D (localStorage) com useSyncExternalStore.
// Guarda módulos do curso concluídos, melhores notas das provas, certificados
// emitidos (código real retornado pela API) e moedas do RPG.

export interface EarnedCertificate {
  code: string
  holderName: string
  score: number
  issuedAt: string
  area: string
}

export interface GameProgress {
  lessonsDone: string[] // `${phaseId}:${lessonId}`
  cleared: string[] // fases cuja prova foi aprovada (moedas pagas uma vez)
  examBest: Record<string, number> // phaseId → melhor nota (0–100)
  certificates: Record<string, EarnedCertificate> // phaseId → certificado emitido
  coins: number
  playerName: string
}

const STORAGE_KEY = 'capyber.trilha3d.v1'
const EMPTY: GameProgress = {
  lessonsDone: [],
  cleared: [],
  examBest: {},
  certificates: {},
  coins: 0,
  playerName: '',
}

let cached: GameProgress | null = null
const listeners = new Set<() => void>()

function read(): GameProgress {
  if (cached) return cached
  try {
    const raw = typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<GameProgress>
      // validação dura: localStorage é input do usuário
      cached = {
        lessonsDone: Array.isArray(p.lessonsDone)
          ? p.lessonsDone.filter((x): x is string => typeof x === 'string')
          : [],
        cleared: Array.isArray(p.cleared)
          ? p.cleared.filter((x): x is string => typeof x === 'string')
          : [],
        examBest: sanitizeRecord(p.examBest),
        certificates: sanitizeCerts(p.certificates),
        coins:
          typeof p.coins === 'number' && Number.isFinite(p.coins) && p.coins >= 0
            ? Math.floor(p.coins)
            : 0,
        playerName: typeof p.playerName === 'string' ? p.playerName.slice(0, 60) : '',
      }
    } else {
      cached = { ...EMPTY }
    }
  } catch {
    cached = { ...EMPTY }
  }
  return cached
}

function sanitizeRecord(v: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100) {
        out[k] = Math.floor(val)
      }
    }
  }
  return out
}

function sanitizeCerts(v: unknown): Record<string, EarnedCertificate> {
  const out: Record<string, EarnedCertificate> = {}
  if (v && typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const c = val as Partial<EarnedCertificate>
      if (
        c &&
        typeof c.code === 'string' &&
        typeof c.holderName === 'string' &&
        typeof c.score === 'number' &&
        typeof c.issuedAt === 'string'
      ) {
        out[k] = {
          code: c.code,
          holderName: c.holderName.slice(0, 60),
          score: Math.floor(c.score),
          issuedAt: c.issuedAt,
          area: typeof c.area === 'string' ? c.area.slice(0, 80) : '',
        }
      }
    }
  }
  return out
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(read()))
  } catch {
    /* noop */
  }
}

function emit() {
  listeners.forEach((cb) => cb())
}

export const gameStore = {
  subscribe(cb: () => void): () => void {
    listeners.add(cb)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cached = null
        cb()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', onStorage)
    }
  },
  get(): GameProgress {
    return read()
  },
  getServer(): GameProgress {
    return { ...EMPTY }
  },
  /** marca um módulo de curso como concluído (+5 moedas na primeira vez) */
  completeLesson(phaseId: string, lessonId: string): boolean {
    const p = read()
    const key = `${phaseId}:${lessonId}`
    if (p.lessonsDone.includes(key)) return false
    cached = { ...p, lessonsDone: [...p.lessonsDone, key], coins: p.coins + 5 }
    persist()
    emit()
    return true
  },
  /** registra a nota da prova (mantém a melhor) */
  recordExam(phaseId: string, score: number) {
    const p = read()
    const best = Math.max(p.examBest[phaseId] ?? 0, score)
    cached = { ...p, examBest: { ...p.examBest, [phaseId]: best } }
    persist()
    emit()
  },
  /** primeiro clear da fase: paga as moedas do curso uma única vez */
  clearPhase(phaseId: string, coinsReward: number): boolean {
    const p = read()
    if (p.cleared.includes(phaseId)) return false
    cached = {
      ...p,
      cleared: [...p.cleared, phaseId],
      coins: p.coins + coinsReward,
    }
    persist()
    emit()
    return true
  },
  /** moedas avulsas do mapa (coletáveis) */
  addCoins(n: number) {
    const p = read()
    cached = { ...p, coins: p.coins + Math.max(0, Math.floor(n)) }
    persist()
    emit()
  },
  setPlayerName(name: string) {
    const p = read()
    cached = { ...p, playerName: name.slice(0, 60) }
    persist()
    emit()
  },
  saveCertificate(phaseId: string, cert: EarnedCertificate) {
    const p = read()
    cached = { ...p, certificates: { ...p.certificates, [phaseId]: cert } }
    persist()
    emit()
  },
}
