// CAPYBER — "Legado": agregador do progresso de TODAS as experiências da página.
// Concluiu tudo (cursos, jogos, lab, OSINT…) → desbloqueia a aba Legado:
// a simulação de carreira (jornal, 20 CVEs, blogs, podcast) + oferta da ferramenta.
//
// O progresso vive em localStorage (mesmo padrão dos demais módulos) e é
// re-lido com useSyncExternalStore + assinatura de conteúdo, então qualquer
// aba que escrever os próprios dados dispara o desbloqueio automaticamente.

import { useSyncExternalStore, useCallback } from 'react'
import { GAME_PHASES } from '@/lib/game-courses'
import { BOOK_PAGES } from '@/lib/book-content'
import { COURSE_MODULES } from '@/lib/stealth-content'
import { CHALLENGES } from '@/lib/ctf-content'

/* ─────────────────────────── definição dos módulos ─────────────────────── */

export type LegacyModuleId =
  | 'trilha'
  | 'livro'
  | 'pergaminho'
  | 'ctf'
  | 'stealth'
  | 'celular'
  | 'osint'
  | 'lab'

export interface LegacyModuleMeta {
  id: LegacyModuleId
  label: string
  hint: string
  href: string
}

export const LEGACY_MODULES: LegacyModuleMeta[] = [
  { id: 'trilha', label: 'Trilha 3D', hint: `Conclua as ${GAME_PHASES.length} fases do curso (inclui o boss final)`, href: '#trilha' },
  { id: 'livro', label: 'Códice (Livro 3D)', hint: `Leia todas as ${BOOK_PAGES.length} páginas`, href: '#livro' },
  { id: 'pergaminho', label: 'Pergaminho', hint: 'Leia 100% do pergaminho de engenharia social', href: '#pergaminho' },
  { id: 'ctf', label: 'CTF Fantasma', hint: `Resolva os ${CHALLENGES.length} desafios e desmascare o fantasma`, href: '#ctf' },
  { id: 'stealth', label: 'Sala Stealth', hint: `Complete os ${COURSE_MODULES.length} módulos de OPSEC`, href: '#stealth' },
  { id: 'celular', label: 'Defesa do Celular', hint: 'Sobreviva às 8 ondas de ataques', href: '#celular' },
  { id: 'osint', label: 'OSINT', hint: 'Conclua sua primeira varredura de superfície', href: '#osint' },
  { id: 'lab', label: 'Laboratório', hint: 'Dispare um cenário de ameaça no laboratório', href: '#lab' },
]

/* ────────────────────────────── chaves lidas ───────────────────────────── */

const LS = {
  trilha: 'capyber.trilha3d.v1', // via gameStore
  bookMax: 'capy_book_max',
  scroll: 'capy_scroll_progress_v1',
  ctf: 'capy_ctf_progress',
  stealth: 'capy_stealth_progress',
  celular: 'capy_phone_defense_victory', // gravado ao vencer as 8 ondas
  osint: 'capy_osint_scan_done', // gravado ao concluir varredura
  lab: 'capy_lab_attack_done', // gravado ao disparar cenário
} as const

export const MONTAGE_KEY = 'capy_legacy_montage_watched'
const DEVICES_KEY = 'capy_legacy_devices'
const LICENSE_KEY = 'capy_legacy_license'
const ONBOARD_KEY = 'capy_legacy_onboarded'

/* ───────────────────────────── leitura bruta ───────────────────────────── */

function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function readNum(key: string): number {
  try {
    if (typeof window === 'undefined') return 0
    const raw = window.localStorage.getItem(key)
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function readFlag(key: string): boolean {
  try {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export interface ModuleCount {
  done: number
  total: number
}

export interface LegacySnapshot {
  counts: Record<LegacyModuleId, ModuleCount>
  done: Record<LegacyModuleId, boolean>
  unlocked: boolean
  doneCount: number
  totalCount: number
  /** estatísticas vaidosas para a tela final */
  coins: number
  certificates: number
  ctfXp: number
  montageWatched: boolean
  /** assinatura interna p/ detectar mudanças sem re-render desnecessário */
  sig: string
}

const MODULE_IDS = LEGACY_MODULES.map((m) => m.id) as LegacyModuleId[]

const EMPTY_SNAPSHOT: LegacySnapshot = {
  counts: {
    trilha: { done: 0, total: GAME_PHASES.length },
    livro: { done: 0, total: BOOK_PAGES.length },
    pergaminho: { done: 0, total: 100 },
    ctf: { done: 0, total: CHALLENGES.length + 1 },
    stealth: { done: 0, total: COURSE_MODULES.length },
    celular: { done: 0, total: 1 },
    osint: { done: 0, total: 1 },
    lab: { done: 0, total: 1 },
  },
  done: {
    trilha: false,
    livro: false,
    pergaminho: false,
    ctf: false,
    stealth: false,
    celular: false,
    osint: false,
    lab: false,
  },
  unlocked: false,
  doneCount: 0,
  totalCount: LEGACY_MODULES.length,
  coins: 0,
  certificates: 0,
  ctfXp: 0,
  montageWatched: false,
  sig: '',
}

function compute(): LegacySnapshot {
  if (typeof window === 'undefined') return EMPTY_SNAPSHOT

  // leitura DIRETA do progresso da Trilha (o gameStore cacheia e não invalida
  // quando outra view escreve o localStorage na mesma aba)
  const gpRaw = readJSON<{
    cleared?: unknown
    coins?: unknown
    certificates?: Record<string, unknown>
    playerName?: unknown
  }>(LS.trilha, {})
  const cleared = Array.isArray(gpRaw.cleared) ? gpRaw.cleared.filter((x): x is string => typeof x === 'string') : []
  const gpCoins = typeof gpRaw.coins === 'number' && Number.isFinite(gpRaw.coins) ? Math.max(0, Math.floor(gpRaw.coins)) : 0
  const certCount = gpRaw.certificates && typeof gpRaw.certificates === 'object' ? Object.keys(gpRaw.certificates).length : 0
  const bookMax = readNum(LS.bookMax) // índice 0-based da maior página alcançada
  const scrollPct = Math.min(100, Math.max(0, readNum(LS.scroll)))
  const ctf = readJSON<{ solved?: Record<string, unknown>; finalDone?: boolean; xp?: number }>(LS.ctf, {})
  const ctfSolved = ctf.solved ? Object.keys(ctf.solved).filter((k) => Boolean(ctf.solved?.[k])).length : 0
  const ctfFinal = Boolean(ctf.finalDone)
  const stealth = readJSON<{ modulesDone?: string[]; unlocked?: boolean }>(LS.stealth, {})
  const stealthDone = Array.isArray(stealth.modulesDone) ? stealth.modulesDone.length : 0
  const stealthUnlocked = Boolean(stealth.unlocked) || stealthDone >= COURSE_MODULES.length
  const celular = readFlag(LS.celular)
  const osint = readFlag(LS.osint)
  const lab = readFlag(LS.lab)

  const counts: Record<LegacyModuleId, ModuleCount> = {
    trilha: { done: cleared.length, total: GAME_PHASES.length },
    livro: { done: Math.min(BOOK_PAGES.length, bookMax + (bookMax > 0 ? 1 : 0)), total: BOOK_PAGES.length },
    pergaminho: { done: scrollPct, total: 100 },
    ctf: { done: Math.min(CHALLENGES.length + 1, ctfSolved + (ctfFinal ? 1 : 0)), total: CHALLENGES.length + 1 },
    stealth: { done: Math.min(COURSE_MODULES.length, stealthDone), total: COURSE_MODULES.length },
    celular: { done: celular ? 1 : 0, total: 1 },
    osint: { done: osint ? 1 : 0, total: 1 },
    lab: { done: lab ? 1 : 0, total: 1 },
  }

  const done: Record<LegacyModuleId, boolean> = {
    trilha: counts.trilha.done >= counts.trilha.total,
    livro: counts.livro.done >= counts.livro.total,
    pergaminho: counts.pergaminho.done >= 100,
    ctf: ctfSolved >= CHALLENGES.length && ctfFinal,
    stealth: stealthUnlocked && counts.stealth.done >= counts.stealth.total,
    celular,
    osint,
    lab,
  }

  const doneCount = MODULE_IDS.filter((id) => done[id]).length
  const sig = JSON.stringify({
    t: counts.trilha,
    b: counts.livro.done,
    s: scrollPct,
    c: [ctfSolved, ctfFinal],
    st: stealthDone,
    ce: celular,
    o: osint,
    l: lab,
    g: gpCoins,
    cert: certCount,
    m: readFlag(MONTAGE_KEY),
  })

  return {
    counts,
    done,
    unlocked: doneCount >= MODULE_IDS.length,
    doneCount,
    totalCount: MODULE_IDS.length,
    coins: gpCoins,
    certificates: certCount,
    ctfXp: typeof ctf.xp === 'number' ? ctf.xp : 0,
    montageWatched: readFlag(MONTAGE_KEY),
    sig,
  }
}

/* ──────────────────────────── store externo ────────────────────────────── */

let cached: LegacySnapshot | null = null
const listeners = new Set<() => void>()

const CHANGE_EVENT = 'capy-legacy-change'

function current(): LegacySnapshot {
  if (!cached) cached = compute()
  return cached
}

function refresh() {
  const next = compute()
  if (cached && next.sig === cached.sig) return
  cached = next
  listeners.forEach((cb) => cb())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === null || Object.values(LS).includes(e.key as never) || e.key === MONTAGE_KEY) {
      cached = null
      refresh()
    }
  })
  window.addEventListener(CHANGE_EVENT, () => refresh())
  // hooks que escrevem sem avisar (CTF, Stealth, Pergaminho, Livro, Trilha)
  window.addEventListener('capy-book-store', () => refresh())
  setInterval(refresh, 1500)
}

export function markLegacy(id: LegacyModuleId) {
  try {
    window.localStorage.setItem(id === 'celular' ? LS.celular : id === 'osint' ? LS.osint : LS.lab, '1')
  } catch {
    /* modo privado */
  }
  refresh()
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function markMontageWatched() {
  try {
    window.localStorage.setItem(MONTAGE_KEY, '1')
  } catch {
    /* modo privado */
  }
  refresh()
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/* ─────────────────────── dados auxiliares da oferta ────────────────────── */

export interface LegacyDevice {
  id: string
  name: string
  type: 'NOTEBOOK' | 'CELULAR' | 'SERVIDOR' | 'WORKSTATION'
}

export function readDevices(): LegacyDevice[] {
  return readJSON<LegacyDevice[]>(DEVICES_KEY, [])
}

export function saveDevices(devices: LegacyDevice[]) {
  try {
    window.localStorage.setItem(DEVICES_KEY, JSON.stringify(devices.slice(0, 24)))
  } catch {
    /* modo privado */
  }
}

export function readLicense(): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(LICENSE_KEY)
  } catch {
    return null
  }
}

export function saveLicense(key: string) {
  try {
    window.localStorage.setItem(LICENSE_KEY, key)
  } catch {
    /* modo privado */
  }
}

export function readOnboarded(): boolean {
  return readFlag(ONBOARD_KEY)
}

export function saveOnboarded(on: boolean) {
  try {
    window.localStorage.setItem(ONBOARD_KEY, on ? '1' : '0')
  } catch {
    /* modo privado */
  }
}

/* ─────────────────────────────── hooks ─────────────────────────────────── */

export function useLegacyProgress(): LegacySnapshot {
  return useSyncExternalStore(
    useCallback((cb: () => void) => {
      listeners.add(cb)
      return () => {
        listeners.delete(cb)
      }
    }, []),
    current,
    () => EMPTY_SNAPSHOT,
  )
}

/** Nome exibido nas cenas (jornal, podcast…): conta logada → jogador da Trilha → fallback. */
export function resolveOperatorName(user?: { name?: string | null } | null): string {
  const fromGame =
    typeof window !== 'undefined'
      ? (() => {
          try {
            const raw = window.localStorage.getItem(LS.trilha)
            const v = raw ? (JSON.parse(raw) as { playerName?: unknown }) : null
            return typeof v?.playerName === 'string' ? v.playerName.trim() : ''
          } catch {
            return ''
          }
        })()
      : ''
  const raw = user?.name?.trim() || fromGame || 'Operador Capivara'
  const words = raw
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
  return words.join(' ') || 'Operador Capivara'
}

/** Primeiro nome (para falas curtas). */
export function firstName(full: string): string {
  return full.split(/\s+/)[0] ?? full
}
