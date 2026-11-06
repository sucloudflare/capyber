'use client'

// CAPYBER — efeitos sonoros retrô (WebAudio) para a trilha. Sintetizados, sem arquivos.

type SfxName = 'coin' | 'correct' | 'wrong' | 'complete' | 'unlock' | 'select'

let ctx: AudioContext | null = null
let enabled = true
const sfxListeners = new Set<() => void>()

try {
  enabled = typeof window === 'undefined' ? true : localStorage.getItem('capyber.sfx') !== 'off'
} catch {
  /* SSR */
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') {
    // pode rejeitar por política de autoplay — sem catch vira unhandled rejection
    ctx.resume().catch(() => {
      /* o próximo play (pós-gesto) retenta */
    })
  }
  return ctx
}

function blip(c: AudioContext, t0: number, f0: number, f1: number, dur: number, type: OscillatorType, vol: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t0)
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(vol, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(c.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

const RECIPES: Record<SfxName, (c: AudioContext, t: number) => void> = {
  select: (c, t) => blip(c, t, 660, 660, 0.06, 'square', 0.06),
  coin: (c, t) => {
    blip(c, t, 988, 988, 0.07, 'square', 0.09)
    blip(c, t + 0.07, 1319, 1319, 0.16, 'square', 0.09)
  },
  correct: (c, t) => {
    blip(c, t, 523, 523, 0.09, 'square', 0.08)
    blip(c, t + 0.09, 784, 784, 0.14, 'square', 0.08)
  },
  wrong: (c, t) => blip(c, t, 220, 110, 0.22, 'sawtooth', 0.07),
  unlock: (c, t) => {
    blip(c, t, 392, 392, 0.08, 'square', 0.08)
    blip(c, t + 0.08, 587, 587, 0.08, 'square', 0.08)
    blip(c, t + 0.16, 784, 784, 0.12, 'square', 0.08)
  },
  complete: (c, t) => {
    const seq = [523, 659, 784, 1047, 784, 1047]
    seq.forEach((f, i) => blip(c, t + i * 0.11, f, f, 0.12, 'square', 0.09))
  },
}

export const sfx = {
  play(name: SfxName) {
    if (!enabled) return
    const c = getCtx()
    if (!c) return
    try {
      RECIPES[name](c, c.currentTime + 0.01)
    } catch {
      /* silencioso */
    }
  },
  isEnabled: () => enabled,
  subscribe(cb: () => void): () => void {
    sfxListeners.add(cb)
    return () => {
      sfxListeners.delete(cb)
    }
  },
  getSnapshot: () => enabled,
  getServerSnapshot: () => true,
  setEnabled(on: boolean) {
    enabled = on
    try {
      localStorage.setItem('capyber.sfx', on ? 'on' : 'off')
    } catch {
      /* noop */
    }
    sfxListeners.forEach((cb) => cb())
  },
}
