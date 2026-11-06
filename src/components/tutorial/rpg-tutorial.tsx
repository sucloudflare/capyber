'use client'

// CAPYBER — Tutorial RPG guiado ("Clique aqui e verás…").
//
// Montar UMA vez na raiz do app:
//   <RpgTutorial />  — motor do tutorial (holofote + caixa de diálogo RPG)
//   <TutorialFab />  — botão flutuante (canto inferior esquerdo) p/ iniciar/rejogar
//
// Fluxo: convite (Dialog) → missões com holofote sobre [data-tut=...] →
// celebração com "Certificado de Iniciado". Progresso em localStorage
// (capy_tutorial_done_steps / capy_tutorial_done). Inativo = renderiza null.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, HelpCircle, ListChecks, Lock, Trophy, X } from 'lucide-react'
import { CapyBadge, MascotCapy } from '@/components/art'
import { TUTORIAL_STEPS, TUTORIAL_TOTAL_XP, type TutorialStep } from '@/lib/tutorial-steps'
import {
  emitTutorialEvent,
  isTutorialDone,
  loadDoneSteps,
  markTutorialDone,
  onTutorialEvent,
  saveDoneSteps,
  startTutorial,
} from '@/lib/tutorial-bus'

// ---------------- constantes ----------------

const TYPE_MS = 18 // ms por caractere do typewriter
const NAV_WAIT_MS = 600 // espera após trocar o hash antes de medir o alvo
const FIND_TIMEOUT_MS = 5000 // polling máximo até desistir e cair no fallback central
const HOLE_PAD = 8 // folga do holofote ao redor do alvo
const EDGE = 8 // margem mínima das caixas na viewport
const SPOT_T = { type: 'tween' as const, duration: 0.35, ease: 'easeOut' as const }
const CONFETTI_COLORS = ['#f5920b', '#ffc94d', '#2569b8', '#21a44a', '#8b5cf6', '#ffffff']

const BTN_GOLD =
  'inline-flex items-center gap-1.5 rounded-lg border-2 border-[#b36a00] bg-gradient-to-b from-[#ffc94d] to-[#f5920b] px-4 py-2 text-[0.98rem] font-extrabold text-[#10315c] shadow-[0_4px_14px_rgba(245,146,11,0.45)] transition-transform hover:-translate-y-0.5 active:translate-y-0'
const BTN_DARK =
  'inline-flex items-center gap-1.5 rounded-lg border-2 border-[#2569b8]/70 bg-transparent px-4 py-2 text-[0.98rem] font-bold text-[#cfe4fc] transition-colors hover:bg-[#2569b8]/25'
const BTN_SMALL =
  'inline-flex items-center gap-1.5 rounded-md border border-[#2569b8]/60 px-2.5 py-1 text-xs font-bold text-[#9cc3ec] transition-colors hover:bg-[#2569b8]/25'

type Phase = 'closed' | 'welcome' | 'active' | 'celebrate'

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max)
}

// ---------------- avatares dos NPCs ----------------

/** Mestre Capivara: capivara-cavaleira desenhada em SVG (capacete, pluma e focinho). */
function CapyKnightAvatar({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Mestre Capivara, cavaleiro guardião do Capim Digital"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="capy-knight-helm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef5fd" />
          <stop offset="100%" stopColor="#9db9d8" />
        </linearGradient>
      </defs>
      {/* pluma laranja */}
      <path d="M32 2 C27 8 27 14 32 19 C37 14 37 8 32 2 Z" fill="#f5920b" stroke="#10315c" strokeWidth="2" />
      {/* elmo */}
      <path
        d="M12 32 C12 18 21 10 32 10 C43 10 52 18 52 32 L52 36 L12 36 Z"
        fill="url(#capy-knight-helm-g)"
        stroke="#10315c"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <rect x="12" y="32" width="40" height="6" rx="3" fill="#5d86b8" stroke="#10315c" strokeWidth="1.6" />
      {/* orelhas */}
      <circle cx="12" cy="36" r="3.4" fill="#8a5a2b" stroke="#10315c" strokeWidth="1.8" />
      <circle cx="52" cy="36" r="3.4" fill="#8a5a2b" stroke="#10315c" strokeWidth="1.8" />
      {/* crânio */}
      <ellipse cx="32" cy="44" rx="22" ry="15" fill="#b07c44" stroke="#10315c" strokeWidth="2.4" />
      {/* focinho */}
      <ellipse cx="32" cy="50" rx="12.5" ry="8" fill="#d9a86c" stroke="#10315c" strokeWidth="2" />
      <circle cx="27.5" cy="50" r="1.7" fill="#10315c" />
      <circle cx="36.5" cy="50" r="1.7" fill="#10315c" />
      {/* olhos */}
      <circle cx="23" cy="41" r="3.1" fill="#10315c" />
      <circle cx="41" cy="41" r="3.1" fill="#10315c" />
      <circle cx="24" cy="40" r="1.1" fill="#ffffff" />
      <circle cx="42" cy="40" r="1.1" fill="#ffffff" />
    </svg>
  )
}

function NpcAvatar({ npc, size = 56 }: { npc: string; size?: number }) {
  if (npc === 'VIGIA') return <CapyBadge size={size} />
  if (npc === 'Capivara Fantasma') return <MascotCapy size={size} />
  return <CapyKnightAvatar size={size} />
}

/** Máquina de escrever (~18ms/caractere). Re-montada por missão/fala via key. */
function Typewriter({
  text,
  skipRef,
  onProgress,
}: {
  text: string
  skipRef: { current: boolean }
  onProgress: (n: number) => void
}) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let i = 0
    const t = window.setInterval(() => {
      if (skipRef.current) i = text.length
      else i += 1
      const n = Math.min(i, text.length)
      setCount(n)
      onProgress(n)
      if (i >= text.length) window.clearInterval(t)
    }, TYPE_MS)
    return () => window.clearInterval(t)
  }, [text, skipRef, onProgress])
  return (
    <span aria-hidden>
      {text.slice(0, count)}
      {count < text.length && (
        <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.15em] animate-pulse bg-[#ffc94d]" />
      )}
    </span>
  )
}

// ============================================================
// RpgTutorial — motor principal (sem props)
// ============================================================

export function RpgTutorial() {
  const [phase, setPhase] = useState<Phase>('closed')
  const [stepIndex, setStepIndex] = useState(0)
  const [doneSteps, setDoneSteps] = useState<string[]>([])
  const [lineIndex, setLineIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [targetMissing, setTargetMissing] = useState(false)
  const [questLogOpen, setQuestLogOpen] = useState(false)
  const [boxSize, setBoxSize] = useState({ w: 620, h: 250 })
  const [viewport, setViewport] = useState({ w: 1280, h: 800 })
  const [nudge, setNudge] = useState(0)

  const boxRef = useRef<HTMLDivElement | null>(null)
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null)
  const skipTypeRef = useRef(false)
  const lastAdvanceRef = useRef(0)
  const doneStepsRef = useRef<string[]>([])
  const phaseRef = useRef<Phase>(phase)
  const stepIndexRef = useRef(stepIndex)

  // sincroniza refs após o commit (nunca durante o render)
  useEffect(() => {
    phaseRef.current = phase
    stepIndexRef.current = stepIndex
  }, [phase, stepIndex])

  const stepTotal = TUTORIAL_STEPS.length
  const step: TutorialStep | null = phase === 'active' ? (TUTORIAL_STEPS[stepIndex] ?? null) : null
  const line = step ? (step.dialogue[Math.min(lineIndex, step.dialogue.length - 1)] ?? '') : ''
  const typing = charCount < line.length

  // ---------- helpers de estado ----------

  const applyDone = useCallback((ids: string[]) => {
    doneStepsRef.current = ids
    setDoneSteps(ids)
    saveDoneSteps(ids)
  }, [])

  const openTutorial = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight })
    if (isTutorialDone()) {
      // já concluiu alguma vez → rejogar do zero
      applyDone([])
      setStepIndex(0)
      setLineIndex(0)
      setCharCount(0)
      setPhase('active')
      return
    }
    const stored = loadDoneSteps()
    applyDone(stored)
    const first = TUTORIAL_STEPS.findIndex((s) => !stored.includes(s.id))
    setStepIndex(first === -1 ? 0 : first)
    setLineIndex(0)
    setCharCount(0)
    setPhase('welcome')
  }, [applyDone])

  const acceptWelcome = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight })
    if (!isTutorialDone()) {
      const stored = loadDoneSteps()
      applyDone(stored)
      const first = TUTORIAL_STEPS.findIndex((s) => !stored.includes(s.id))
      setStepIndex(first === -1 ? 0 : first)
    } else {
      applyDone([])
      setStepIndex(0)
    }
    setLineIndex(0)
    setCharCount(0)
    setPhase('active')
  }, [applyDone])

  const replay = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight })
    applyDone([])
    setStepIndex(0)
    setLineIndex(0)
    setCharCount(0)
    setPhase('active')
  }, [applyDone])

  const skipTutorial = useCallback(() => {
    emitTutorialEvent({ type: 'skip' })
    setPhase('closed')
  }, [])

  const advance = useCallback(() => {
    const now = Date.now()
    if (now - lastAdvanceRef.current < 700) return // trava anti-pulo-duplo
    lastAdvanceRef.current = now
    const idx = stepIndexRef.current
    const st = TUTORIAL_STEPS[idx]
    if (!st) return
    if (!doneStepsRef.current.includes(st.id)) {
      applyDone([...doneStepsRef.current, st.id])
    }
    if (idx >= stepTotal - 1) {
      const all = TUTORIAL_STEPS.map((s) => s.id)
      applyDone(all)
      markTutorialDone()
      emitTutorialEvent({ type: 'finish', totalXp: TUTORIAL_TOTAL_XP })
      setPhase('celebrate')
      return
    }
    skipTypeRef.current = false
    setLineIndex(0)
    setCharCount(0)
    setStepIndex(idx + 1)
  }, [applyDone, stepTotal])

  const primaryAction = useCallback(() => {
    if (!step) return
    if (charCount < line.length) {
      skipTypeRef.current = true
      setCharCount(line.length)
      return
    }
    if (lineIndex < step.dialogue.length - 1) {
      skipTypeRef.current = false
      setLineIndex((i) => i + 1)
      return
    }
    advance()
  }, [step, charCount, line, lineIndex, advance])

  // ---------- montagem + convite automático ----------

  useEffect(() => {
    // lê progresso/localStorage e abre o convite após a página assentar
    const t = window.setTimeout(() => {
      const stored = loadDoneSteps()
      doneStepsRef.current = stored
      setDoneSteps(stored)
      setViewport({ w: window.innerWidth, h: window.innerHeight })
      if (!isTutorialDone()) setPhase('welcome')
    }, 700)
    return () => window.clearTimeout(t)
  }, [])

  // viewport (para posicionar caixas e recortar o holofote)
  useEffect(() => {
    const upd = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', upd)
    return () => window.removeEventListener('resize', upd)
  }, [])

  // barramento: startTutorial() / resetTutorial()
  useEffect(
    () =>
      onTutorialEvent((e) => {
        if (e.type === 'start') openTutorial()
        if (e.type === 'reset') {
          applyDone([])
          setStepIndex(0)
          setLineIndex(0)
          setCharCount(0)
          setPhase('welcome')
        }
      }),
    [openTutorial, applyDone],
  )

  // ---------- ciclo de vida da missão: navegar + achar o alvo ----------

  useEffect(() => {
    if (phase !== 'active') return
    const st = TUTORIAL_STEPS[stepIndex]
    if (!st) return
    // limpa o holofote da missão anterior no frame seguinte (sem setState síncrono)
    const resetRaf = requestAnimationFrame(() => {
      setRect(null)
      setTargetMissing(false)
      skipTypeRef.current = false
    })
    emitTutorialEvent({ type: 'step', stepId: st.id, index: stepIndex, total: stepTotal })

    if (!st.target) {
      return () => {
        cancelAnimationFrame(resetRaf)
      }
    }

    let cancelled = false
    let raf = 0
    let waitTimer = 0
    let startedAt = performance.now()

    const measure = (el: Element) => {
      const r = el.getBoundingClientRect()
      if (r.width <= 0 && r.height <= 0) return false
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height })
      return true
    }

    const tick = () => {
      if (cancelled || !st.target) return
      const el = document.querySelector(st.target)
      if (el && measure(el)) {
        const r = el.getBoundingClientRect()
        const fullyVisible =
          r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth
        if (!fullyVisible) {
          try {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' })
          } catch {
            /* navegadores antigos */
          }
        }
        return
      }
      if (performance.now() - startedAt > FIND_TIMEOUT_MS) {
        setTargetMissing(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    if (st.view) {
      if (window.location.hash !== `#${st.view}`) window.location.hash = st.view
      waitTimer = window.setTimeout(() => {
        startedAt = performance.now()
        tick()
      }, NAV_WAIT_MS)
    } else {
      tick()
    }
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      cancelAnimationFrame(resetRaf)
      if (waitTimer) window.clearTimeout(waitTimer)
    }
  }, [phase, stepIndex, stepTotal])

  // re-medir o alvo em resize/scroll/layout shift
  useEffect(() => {
    if (phase !== 'active') return
    const st = TUTORIAL_STEPS[stepIndex]
    const target = st?.target
    if (!target) return
    const remeasure = () => {
      const el = document.querySelector(target)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect((prev) => {
        const next = { left: r.left, top: r.top, width: r.width, height: r.height }
        if (
          prev &&
          Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.top - next.top) < 0.5 &&
          Math.abs(prev.width - next.width) < 0.5 &&
          Math.abs(prev.height - next.height) < 0.5
        ) {
          return prev
        }
        return next
      })
    }
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(remeasure)
    }
    window.addEventListener('resize', remeasure)
    window.addEventListener('scroll', onScroll, true)
    const iv = window.setInterval(remeasure, 250)
    return () => {
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('scroll', onScroll, true)
      window.clearInterval(iv)
      cancelAnimationFrame(raf)
    }
  }, [phase, stepIndex])

  // ---------- typewriter (componente Typewriter re-montado por fala) ----------

  // ---------- tamanho da caixa de diálogo ----------

  useEffect(() => {
    if (phase === 'closed') return
    const el = boxRef.current
    if (!el) return
    const update = () =>
      setBoxSize((prev) =>
        prev.w === el.offsetWidth && prev.h === el.offsetHeight ? prev : { w: el.offsetWidth, h: el.offsetHeight },
      )
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [phase, stepIndex, questLogOpen])

  // ---------- teclado (Esc pula) + clique no alvo ----------

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const p = phaseRef.current
      if (p === 'welcome' || p === 'active' || p === 'celebrate') setPhase('closed')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (phase !== 'active') return
    const onDocClick = (e: MouseEvent) => {
      const path = e.composedPath()
      for (const node of path) {
        if (node instanceof Element && node.closest('[data-tutorial-ui]')) return
      }
      const st = TUTORIAL_STEPS[stepIndexRef.current]
      if (!st) return
      if (!st.target) {
        advance()
        return
      }
      const el = document.querySelector(st.target)
      if (el && e.target instanceof Node && el.contains(e.target)) {
        // deixa o clique real acontecer (navegar, focar…), então avança
        window.setTimeout(() => {
          if (phaseRef.current === 'active' && TUTORIAL_STEPS[stepIndexRef.current]?.id === st.id) advance()
        }, 550)
      } else {
        setNudge((n) => n + 1) // Cutucar o aventureiro: "é ali!"
      }
    }
    window.addEventListener('click', onDocClick, true)
    return () => window.removeEventListener('click', onDocClick, true)
  }, [phase, advance])

  // foco no botão principal (acessibilidade por teclado)
  useEffect(() => {
    if (phase !== 'active') return
    const t = window.setTimeout(() => primaryBtnRef.current?.focus({ preventScroll: true }), 60)
    return () => window.clearTimeout(t)
  }, [phase, stepIndex, lineIndex])

  // ---------- geometria derivada ----------

  const hasHole = !!step?.target && !!rect && !targetMissing

  const hole = useMemo<Rect | null>(() => {
    if (!rect) return null
    const left = Math.max(rect.left - HOLE_PAD, 0)
    const top = Math.max(rect.top - HOLE_PAD, 0)
    const width = Math.min(rect.width + HOLE_PAD * 2, viewport.w - left)
    const height = Math.min(rect.height + HOLE_PAD * 2, viewport.h - top)
    return { left, top, width, height }
  }, [rect, viewport])

  // recorte atual do holofote (0x0 = tela escura inteira)
  const spot: Rect = hasHole && hole ? hole : { left: 0, top: 0, width: 0, height: 0 }

  const boxPos = useMemo(() => {
    const bw = Math.min(boxSize.w, viewport.w - 2 * EDGE)
    const bh = boxSize.h
    const center = { left: (viewport.w - bw) / 2, top: (viewport.h - bh) / 2 }
    if (!step || !rect || !step.target) return center
    const clampL = (l: number) => clamp(l, EDGE, Math.max(EDGE, viewport.w - bw - EDGE))
    const clampT = (t: number) => clamp(t, EDGE, Math.max(EDGE, viewport.h - bh - EDGE))
    const rcx = rect.left + rect.width / 2
    const rcy = rect.top + rect.height / 2
    switch (step.position ?? 'bottom') {
      case 'top':
        return { left: clampL(rcx - bw / 2), top: clampT(rect.top - 14 - bh) }
      case 'left':
        return { left: clampL(rect.left - 14 - bw), top: clampT(rcy - bh / 2) }
      case 'right':
        return { left: clampL(rect.left + rect.width + 14), top: clampT(rcy - bh / 2) }
      case 'center':
        return center
      case 'bottom':
      default:
        return { left: clampL(rcx - bw / 2), top: clampT(rect.top + rect.height + 14) }
    }
  }, [step, rect, boxSize, viewport])

  const chipPos = useMemo(() => {
    if (!hole || !hasHole) return null
    const boxBelowHole = boxPos.top > hole.top + hole.height - 4
    const top = boxBelowHole ? Math.max(hole.top - 42, 6) : hole.top + hole.height + 10
    const left = clamp(hole.left + hole.width - 132, 6, Math.max(6, viewport.w - 140))
    return { left, top }
  }, [hole, hasHole, boxPos.top, viewport.w])

  const earnedXp = useMemo(
    () => TUTORIAL_STEPS.reduce((acc, s) => acc + (doneSteps.includes(s.id) ? s.xp : 0), 0),
    [doneSteps],
  )
  const progressPct = Math.round((doneSteps.length / stepTotal) * 100)

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        // PRNG determinístico (mulberry32 com semente fixa por partícula):
        // mantém a renderização pura e o confete estável entre re-renders.
        const rnd = (k: number) => {
          let t = (i * 1013 + k * 7919) | 0
          t = Math.imul(t ^ (t >>> 15), t | 1)
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296
        }
        return {
          id: i,
          left: rnd(1) * 100,
          delay: rnd(2) * 1.2,
          dur: 2.4 + rnd(3) * 2,
          drift: (rnd(4) - 0.5) * 160,
          rot: (rnd(5) - 0.5) * 720,
          w: 6 + rnd(6) * 8,
          h: 8 + rnd(7) * 10,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        }
      }),
    [],
  )

  // ---------------- render ----------------

  if (phase === 'closed') return null

  // ---- convite (Dialog de boas-vindas) ----
  if (phase === 'welcome') {
    return (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Convite do tutorial RPG do CAPYBER"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="absolute inset-0 bg-[#06101f]/80" onClick={() => setPhase('closed')} />
        <motion.div
          data-tutorial-ui
          initial={{ scale: 0.92, y: 18, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative w-[min(540px,100%)] overflow-hidden rounded-2xl border-2 border-[#ffc94d] bg-gradient-to-b from-[#14396c] via-[#0f2c55] to-[#0a1f3d] p-6 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
        >
          <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-[#7cb6ec]/25 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <CapyKnightAvatar size={64} />
            <div className="min-w-0">
              <span className="inline-block rounded-md border border-[#ffc94d]/70 bg-[#f5920b]/15 px-2 py-0.5 text-sm font-extrabold tracking-widest text-[#ffc94d]">
                MESTRE CAPIVARA
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#ffe6ad]">Bem-vindo ao CAPYBER, aventureiro!</h2>
            </div>
          </div>
          <p className="relative mt-4 text-[1.02rem] leading-relaxed text-[#dbeafc]">
            Deseja iniciar o <strong className="text-[#ffc94d]">tutorial guiado estilo RPG</strong>? Serei seu guia
            pelas salas do forte — comando, OSINT, trilha 3D, CTF dos fantasmas e muito mais — missão por missão, com
            XP de recompensa.
          </p>
          {doneSteps.length > 0 && (
            <p className="relative mt-2 text-[0.95rem] text-[#7cb6ec]">
              Detectei progresso anterior: {doneSteps.length}/{stepTotal} missões concluídas. Posso retomar de onde
              paramos.
            </p>
          )}
          <div className="relative mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={acceptWelcome} autoFocus className={BTN_GOLD}>
              {doneSteps.length > 0 ? 'Sim, retomar missão!' : 'Sim, iniciar missão!'}
            </button>
            <button type="button" onClick={skipTutorial} className={BTN_DARK}>
              Não, explorar sozinho
            </button>
            <span className="cap-mono ml-auto text-xs text-[#54708f]">Esc pula o tutorial</span>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // ---- celebração: Certificado de Iniciado ----
  if (phase === 'celebrate') {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Certificado de Iniciado — tutorial concluído"
      >
        <div className="absolute inset-0 bg-[#06101f]/85" />
        {particles.map((p) => (
          <motion.span
            key={p.id}
            aria-hidden
            className="absolute top-0"
            style={{ left: `${p.left}%`, width: p.w, height: p.h, background: p.color, borderRadius: 2 }}
            initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', x: p.drift, rotate: p.rot, opacity: [1, 1, 0.9, 0] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <motion.div
          data-tutorial-ui
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          className="relative w-[min(560px,100%)] rounded-2xl border-2 border-[#ffc94d] bg-gradient-to-b from-[#14396c] via-[#0f2c55] to-[#0a1f3d] p-8 text-center text-white shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)]"
        >
          <div className="mx-auto mb-3 flex w-fit items-center justify-center rounded-full border-2 border-[#ffc94d]/70 bg-[#f5920b]/15 p-3">
            <Trophy className="h-9 w-9 text-[#ffc94d]" aria-hidden />
          </div>
          <p className="cap-mono text-sm font-bold tracking-[0.3em] text-[#7cb6ec]">
            ORDEM DOS GUARDIÕES DO CAPIM DIGITAL
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#ffe6ad]">Certificado de Iniciado</h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-[#dbeafc]">
            Missão cumprida, aventureiro! Você percorreu todas as salas do forte CAPYBER e conhece cada artefato de
            defesa.
          </p>
          <div className="mx-auto mt-5 w-fit rounded-lg border-2 border-[#21a44a]/60 bg-[#21a44a]/15 px-6 py-2">
            <span className="cap-mono text-2xl font-extrabold text-[#5ce08a]">+{TUTORIAL_TOTAL_XP} XP</span>
          </div>
          <p className="mt-2 text-sm text-[#7cb6ec]">
            Título desbloqueado: <strong className="text-[#ffc94d]">Iniciado do CAPYBER</strong>
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={replay} className={BTN_GOLD}>
              Rejogar tutorial
            </button>
            <button type="button" onClick={() => setPhase('closed')} className={BTN_DARK}>
              Explorar o CAPYBER
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ---- fase ativa: holofote + caixa de diálogo RPG ----
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={step ? `Tutorial RPG — Missão ${stepIndex + 1} de ${stepTotal}: ${step.title}` : 'Tutorial RPG'}
    >
      {/* 4 manchas do holofote (recorte animado ao redor do alvo) */}
      <motion.div
        className="pointer-events-auto absolute bg-[#071120]/85"
        initial={false}
        animate={{ left: 0, top: 0, width: viewport.w, height: spot.top }}
        transition={SPOT_T}
      />
      <motion.div
        className="pointer-events-auto absolute bg-[#071120]/85"
        initial={false}
        animate={{
          left: 0,
          top: spot.top,
          width: spot.left,
          height: spot.height,
        }}
        transition={SPOT_T}
      />
      <motion.div
        className="pointer-events-auto absolute bg-[#071120]/85"
        initial={false}
        animate={{
          left: spot.left + spot.width,
          top: spot.top,
          width: Math.max(viewport.w - spot.left - spot.width, 0),
          height: spot.height,
        }}
        transition={SPOT_T}
      />
      <motion.div
        className="pointer-events-auto absolute bg-[#071120]/85"
        initial={false}
        animate={{
          left: 0,
          top: spot.top + spot.height,
          width: viewport.w,
          height: Math.max(viewport.h - spot.top - spot.height, 0),
        }}
        transition={SPOT_T}
      />

      {/* anel pulsante + miras de canto sobre o alvo */}
      {hasHole && hole && (
        <motion.div
          className="pointer-events-none absolute"
          initial={false}
          animate={{ left: hole.left, top: hole.top, width: hole.width, height: hole.height }}
          transition={SPOT_T}
        >
          <motion.div
            className="absolute -inset-1 rounded-lg border-[3px] border-[#ffc94d]"
            animate={{
              opacity: [0.55, 1, 0.55],
              boxShadow: [
                '0 0 6px 1px rgba(255,176,32,0.25)',
                '0 0 26px 6px rgba(255,176,32,0.5)',
                '0 0 6px 1px rgba(255,176,32,0.25)',
              ],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="absolute -left-1 -top-1 h-4 w-4 border-l-[3px] border-t-[3px] border-[#ffe6ad]" aria-hidden />
          <span className="absolute -right-1 -top-1 h-4 w-4 border-r-[3px] border-t-[3px] border-[#ffe6ad]" aria-hidden />
          <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-[3px] border-l-[3px] border-[#ffe6ad]" aria-hidden />
          <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-[3px] border-r-[3px] border-[#ffe6ad]" aria-hidden />
        </motion.div>
      )}

      {/* chip "Clique aqui ✦" */}
      {hasHole && chipPos && (
        <motion.div
          key={step?.id}
          className="pointer-events-none absolute z-[1] rounded-md border-2 border-[#10315c] bg-gradient-to-b from-[#ffc94d] to-[#f5920b] px-3 py-1 text-sm font-extrabold text-[#10315c] shadow-[0_4px_14px_rgba(245,146,11,0.5)]"
          initial={false}
          animate={{ left: chipPos.left, top: chipPos.top }}
          transition={SPOT_T}
        >
          <motion.span
            key={nudge}
            className="inline-block"
            animate={{ x: nudge === 0 ? [0, 0] : [0, -7, 7, -4, 0] }}
            transition={{ duration: 0.4 }}
          >
            Clique aqui ✦
          </motion.span>
        </motion.div>
      )}

      {/* Diário de Missões (lista lateral) */}
      <AnimatePresence>
        {questLogOpen && (
          <motion.aside
            key="quest-log"
            data-tutorial-ui
            aria-label="Diário de missões do tutorial"
            className="pointer-events-auto absolute right-2 top-2 z-[2] w-[min(300px,calc(100vw-1rem))] rounded-xl border-2 border-[#ffc94d]/80 bg-[#0a1f3d]/95 p-3 text-white shadow-[0_24px_60px_-18px_rgba(0,0,0,0.9)] sm:right-3 sm:top-3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <div className="mb-2 flex items-center gap-2 border-b border-[#2569b8]/50 pb-2">
              <ListChecks className="h-4 w-4 text-[#ffc94d]" aria-hidden />
              <span className="text-sm font-extrabold tracking-wide text-[#ffe6ad]">Diário de Missões</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setQuestLogOpen(false)
                }}
                aria-label="Fechar diário de missões"
                className="ml-auto rounded p-1 text-[#7cb6ec] transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <ol className="max-h-[52vh] space-y-1 overflow-y-auto pr-1">
              {TUTORIAL_STEPS.map((s, i) => {
                const isDone = doneSteps.includes(s.id)
                const isCurrent = i === stepIndex
                const locked = !isDone && !isCurrent && i > stepIndex
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!locked) {
                          setStepIndex(i)
                          setLineIndex(0)
                          setCharCount(0)
                        }
                      }}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[0.92rem] transition-colors ${
                        isCurrent
                          ? 'border-[#ffc94d]/70 bg-[#f5920b]/15'
                          : locked
                            ? 'cursor-not-allowed border-transparent opacity-45'
                            : 'border-transparent hover:bg-white/10'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5ce08a]" aria-hidden />
                      ) : isCurrent ? (
                        <motion.span
                          className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ffc94d]"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0 text-[#54708f]" aria-hidden />
                      )}
                      <span
                        className={`min-w-0 flex-1 truncate ${isCurrent ? 'font-bold text-[#ffe6ad]' : 'text-[#dbeafc]'}`}
                      >
                        {s.title}
                      </span>
                      <span className="cap-mono shrink-0 text-xs text-[#7cb6ec]">+{s.xp}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className="mt-2 border-t border-[#2569b8]/50 pt-2 text-xs text-[#7cb6ec]">
              XP acumulado:{' '}
              <strong className="text-[#5ce08a]">
                {earnedXp}/{TUTORIAL_TOTAL_XP}
              </strong>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* caixa de diálogo RPG */}
      <motion.div
        ref={boxRef}
        data-tutorial-ui
        className="pointer-events-auto absolute z-[3] w-[min(620px,calc(100vw-1rem))]"
        initial={false}
        animate={{ left: boxPos.left, top: boxPos.top }}
        transition={SPOT_T}
        onClick={primaryAction}
      >
        <div className="relative rounded-2xl border-2 border-[#ffc94d] bg-gradient-to-b from-[#14396c] via-[#0f2c55] to-[#0a1f3d] p-4 pt-6 text-white shadow-[0_30px_70px_-18px_rgba(0,0,0,0.85)] sm:p-5 sm:pt-6">
          <span className="absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-[#ffc94d]/70" aria-hidden />
          <span className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-[#ffc94d]/70" aria-hidden />

          {/* tag do NPC */}
          <div className="absolute -top-4 left-4 flex items-center gap-2">
            <span className="rounded-md border-2 border-[#10315c] bg-gradient-to-b from-[#ffc94d] to-[#f5920b] px-3 py-0.5 text-sm font-extrabold tracking-wide text-[#10315c] shadow-md">
              {step?.npc ?? 'Mestre Capivara'}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div className="hidden shrink-0 rounded-xl border-2 border-[#2569b8]/60 bg-[#06101f]/60 p-1.5 sm:block">
              <NpcAvatar npc={step?.npc ?? 'Mestre Capivara'} size={56} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="min-w-0 text-lg font-extrabold text-[#ffe6ad]">{step?.title}</h2>
                <span className="cap-mono ml-auto shrink-0 rounded border border-[#2569b8]/70 bg-[#06101f]/60 px-2 py-0.5 text-xs font-bold text-[#7cb6ec]">
                  Missão {stepIndex + 1}/{stepTotal}
                </span>
                {step && (
                  <span className="cap-mono shrink-0 rounded border border-[#21a44a]/60 bg-[#21a44a]/15 px-2 py-0.5 text-xs font-extrabold text-[#5ce08a]">
                    +{step.xp} XP
                  </span>
                )}
              </div>
              <p className="mt-2 min-h-[4.4em] text-[1.05rem] leading-relaxed text-[#e7f1fd]" aria-label={line}>
                {step && line !== '' && (
                  <Typewriter
                    key={`${step.id}:${lineIndex}`}
                    text={line}
                    skipRef={skipTypeRef}
                    onProgress={setCharCount}
                  />
                )}
              </p>
            </div>
          </div>

          {/* barra de XP */}
          <div aria-hidden>
            <div className="flex items-center justify-between text-[0.8rem] text-[#7cb6ec]">
              <span className="cap-mono font-bold tracking-wider">XP DE INICIAÇÃO</span>
              <span className="cap-mono">
                {earnedXp}/{TUTORIAL_TOTAL_XP}
              </span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full border border-[#10315c] bg-[#06101f]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#ffc94d] via-[#f5920b] to-[#e07f0a]"
                animate={{ width: `${progressPct}%` }}
                transition={{ type: 'tween', duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* controles */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setQuestLogOpen((v) => !v)
              }}
              aria-expanded={questLogOpen}
              className={BTN_SMALL}
            >
              <ListChecks className="h-4 w-4" aria-hidden /> Diário
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                skipTutorial()
              }}
              className={BTN_SMALL}
            >
              Pular tutorial
            </button>
            <button ref={primaryBtnRef} type="button" onClick={(e) => { e.stopPropagation(); primaryAction() }} className={`${BTN_GOLD} ml-auto`}>
              {typing
                ? 'Pular ▶▶'
                : lineIndex < (step?.dialogue.length ?? 1) - 1
                  ? 'Continuar ▶'
                  : stepIndex >= stepTotal - 1
                    ? 'Receber recompensa ▶'
                    : 'Próxima ▶'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================
// TutorialFab — botão flutuante (inferior esquerdo, espelho do chat)
// ============================================================

export function TutorialFab() {
  // Botão estático: sem APIs de browser no render, seguro para SSR/hidratação.
  return (
    <div className="group fixed bottom-6 left-4 z-50">
      <button
        type="button"
        onClick={() => {
          startTutorial()
        }}
        aria-label="Tutorial RPG do CAPYBER"
        title="Tutorial RPG"
        className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#0d2038]/60 bg-white shadow-[0_8px_28px_rgba(13,32,56,0.35)] transition-transform hover:scale-110"
      >
        <span className="absolute inset-0 animate-ping rounded-full border-2 border-[#f5920b] opacity-60" aria-hidden />
        <HelpCircle className="relative h-6 w-6 text-[#10315c]" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="cap-mono pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border-2 border-[#10315c] bg-[#10315c] px-2.5 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        Tutorial RPG
      </span>
    </div>
  )
}
