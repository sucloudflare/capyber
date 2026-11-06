// CAPYBER — barramento do tutorial RPG: ponte leve entre qualquer parte do app
// e o componente <RpgTutorial /> (mesmo padrão de src/lib/game-bus.ts).
//
// Uso pelo integrador:
//   import { RpgTutorialApi } from '@/lib/tutorial-bus'
//   RpgTutorialApi.startTutorial()   // abre/retoma/reinicia o tutorial
//   RpgTutorialApi.isTutorialDone()  // já concluiu alguma vez?
//   RpgTutorialApi.resetTutorial()   // apaga progresso e volta ao convite
//   RpgTutorialApi.onEvent(cb)       // eventos: start | reset | skip | step | finish

import { TUTORIAL_STEPS } from '@/lib/tutorial-steps'

export const TUTORIAL_KEY_DONE = 'capy_tutorial_done'
export const TUTORIAL_KEY_STEPS = 'capy_tutorial_done_steps'

export type TutorialEvent =
  | { type: 'start' }
  | { type: 'reset' }
  | { type: 'skip' }
  | { type: 'step'; stepId: string; index: number; total: number }
  | { type: 'finish'; totalXp: number }

const listeners = new Set<(e: TutorialEvent) => void>()

export function onTutorialEvent(cb: (e: TutorialEvent) => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function emitTutorialEvent(e: TutorialEvent) {
  listeners.forEach((cb) => cb(e))
}

// ---------------- armazenamento (SSR-safe) ----------------

function readLS(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLS(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* storage cheio/bloqueado — tutorial segue sem persistir */
  }
}

/** IDs das missões concluídas (filtrados contra a cadeia atual). */
export function loadDoneSteps(): string[] {
  const raw = readLS(TUTORIAL_KEY_STEPS)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const valid = new Set(TUTORIAL_STEPS.map((s) => s.id))
    return parsed.filter((x): x is string => typeof x === 'string' && valid.has(x))
  } catch {
    return []
  }
}

export function saveDoneSteps(ids: string[]) {
  writeLS(TUTORIAL_KEY_STEPS, JSON.stringify(ids))
}

export function markTutorialDone() {
  writeLS(TUTORIAL_KEY_DONE, '1')
  // ponto onde o tutorial é marcado como concluído: dispara o evento global
  // (rpg-tutorial.tsx chama esta função — o dispatch não exige editar o componente)
  emitTutorialComplete()
}

export function isTutorialDone(): boolean {
  return readLS(TUTORIAL_KEY_DONE) === '1'
}

export function resetTutorialStorage() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(TUTORIAL_KEY_DONE)
    window.localStorage.removeItem(TUTORIAL_KEY_STEPS)
  } catch {
    /* idem */
  }
}

// ---------------- API pública ----------------

export const RpgTutorialApi = {
  startTutorial(): void {
    emitTutorialEvent({ type: 'start' })
  },
  isTutorialDone,
  resetTutorial(): void {
    resetTutorialStorage()
    emitTutorialEvent({ type: 'reset' })
  },
  onEvent: onTutorialEvent,
}

/** Atalhos soltos, para quem prefere importações nomeadas. */
export function startTutorial() {
  RpgTutorialApi.startTutorial()
}

export function resetTutorial() {
  RpgTutorialApi.resetTutorial()
}

// ---------------- gate de conclusão (helpers novos p/ orquestrador) ----------------

/** Evento CustomEvent disparado na window quando o tutorial é marcado como concluído. */
export const TUTORIAL_COMPLETE_EVENT = 'capy:tutorial-complete'

/**
 * true quando o tutorial foi concluído alguma vez. Formato existente respeitado:
 * TUTORIAL_KEY_DONE === '1' (gravado por markTutorialDone()).
 * OBS: "Pular tutorial" NÃO grava done — quem precisar tratar o pulo deve ouvir
 * o evento { type: 'skip' } via onTutorialEvent().
 */
export function isTutorialComplete(): boolean {
  return isTutorialDone()
}

/** Dispara o TUTORIAL_COMPLETE_EVENT na window (usado por markTutorialDone). */
export function emitTutorialComplete(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(TUTORIAL_COMPLETE_EVENT))
  } catch {
    /* ambiente sem CustomEvent — o polling do watchTutorialComplete cobre */
  }
}

/**
 * Observa a conclusão do tutorial sem depender de edição do rpg-tutorial.tsx:
 * combina evento customizado (TUTORIAL_COMPLETE_EVENT) + storage listener
 * (outras abas) + polling leve de 1s. Se já estiver concluído, dispara cb()
 * imediatamente. Auto-encerra após detectar. Retorna cleanup.
 */
export function watchTutorialComplete(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  let stopped = false
  const cleanups: Array<() => void> = []

  const teardown = () => {
    for (const fn of cleanups) fn()
    cleanups.length = 0
  }

  const check = (): boolean => {
    if (stopped) return true
    if (!isTutorialComplete()) return false
    stopped = true
    teardown()
    cb()
    return true
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === TUTORIAL_KEY_DONE) check()
  }
  const onCompleteEvent = () => check()
  window.addEventListener('storage', onStorage)
  window.addEventListener(TUTORIAL_COMPLETE_EVENT, onCompleteEvent)
  cleanups.push(() => window.removeEventListener('storage', onStorage))
  cleanups.push(() => window.removeEventListener(TUTORIAL_COMPLETE_EVENT, onCompleteEvent))

  // polling leve: mesma aba não dispara 'storage' e o CustomEvent cobre só quem
  // passar por markTutorialDone() após a inscrição
  const timer = window.setInterval(() => {
    if (check()) window.clearInterval(timer)
  }, 1000)
  cleanups.push(() => window.clearInterval(timer))

  check() // já concluído? dispara na hora

  return () => {
    stopped = true
    teardown()
  }
}
