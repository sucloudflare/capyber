'use client'

// CAPYBER CTF — "O FANTASMA DO CHAT" · quadro do detetive
// ─────────────────────────────────────────────────────────────────────────────
// Jogo de detetive 100% defensivo/fictício: o jogador analisa 6 evidências
// (log, ROT13, base64, headers de e-mail, Vigenère e OSINT de padrões) para
// descobrir quem é a fantasma que loga no chat às 03:33:33.
// A verificação canônica é o POST /api/ctf/verify (rate-limited); o progresso
// fica em localStorage (capy_ctf_progress).
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  Binary,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Fingerprint,
  Flag,
  Ghost,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Radar,
  RotateCcw,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CertificateButton } from '@/components/certificates/certificate-button'
import { FullscreenButton } from '@/components/fullscreen-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/* ══════════════════════════════ tipos ══════════════════════════════ */

type ChallengeIcon = 'log' | 'cipher' | 'estego' | 'mail' | 'vigenere' | 'osint'

interface PublicSuspect {
  id: string
  name: string
  handle: string
  role: string
  color: string
  initials: string
  traits: string[]
  bio: string
}

interface PublicChallenge {
  id: string
  order: number
  tag: string
  icon: ChallengeIcon
  title: string
  xp: number
  hintCost: number
  story: string
  question: string
  placeholder: string
  artifact: string
  hints: string[]
}

interface CtfMeta {
  title: string
  subtitle: string
  banner: string
  caseCode: string
  briefing: string[]
  flagFormat: string
  finalUnlockAt: number
  xpHintCost: number
  finalBonusXp: number
  totalXp: number
  storageKey: string
}

interface EvidenceRecord {
  flagPart: string
  reveals: string
  eliminates: string[]
  xpEarned: number
  at: string
}

interface GhostIdentity {
  suspectId: string
  name: string
  handle: string
  fullName: string
  role: string
  color: string
  initials: string
  flag: string
}

interface Progress {
  solved: Record<string, EvidenceRecord>
  hints: Record<string, number>
  xp: number
  finalDone: boolean
  finalAt?: string
  finalPick?: string
  finalResult?: { ghost: GhostIdentity; narrative: string }
}

interface ToastItem {
  id: number
  kind: 'success' | 'error' | 'info'
  title: string
  msg?: string
}

interface ConfettiPiece {
  id: number
  x: number
  y: number
  r: number
  c: string
  d: number
  s: number
}

/* ════════════════════════════ constantes ════════════════════════════ */

const STORAGE_KEY = 'capy_ctf_progress'

const EMPTY_PROGRESS: Progress = { solved: {}, hints: {}, xp: 0, finalDone: false }

const SLIM_SCROLL =
  '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#21a44a]/40'

const CONFETTI_COLORS = ['#21a44a', '#4ade80', '#8b5cf6', '#a78bfa', '#ffb020', '#e8f2ff']

const CH_ICON: Record<ChallengeIcon, React.ComponentType<{ className?: string }>> = {
  log: ScrollText,
  cipher: KeyRound,
  estego: Binary,
  mail: Mail,
  vigenere: LockKeyhole,
  osint: Radar,
}

const pad2 = (n: number) => String(n).padStart(2, '0')

function fmtWhen(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—' // timestamp inválido no progresso salvo
  }
}

/* ═════════════════════════ subcomponentes ═════════════════════════ */

function GhostSvg({ className }: { className?: string }) {
  const raw = React.useId()
  const gid = `cap-ghost-${raw.replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Fantasma do chat">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#21a44a" />
        </linearGradient>
      </defs>
      <path
        d="M32 6C19.3 6 10 15.6 10 28.4V56l7-6.4L24 56l8-7.3L40 56l7-6.4L54 56V28.4C54 15.6 44.7 6 32 6Z"
        fill={`url(#${gid})`}
        opacity="0.95"
      />
      <circle cx="25" cy="30" r="3.2" fill="#06121f" />
      <circle cx="39" cy="30" r="3.2" fill="#06121f" />
      <path
        d="M26.5 38.5c2 2.4 9 2.4 11 0"
        stroke="#06121f"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function ProgressRing({ solved, total }: { solved: number; total: number }) {
  const R = 30
  const CIRC = 2 * Math.PI * R
  const pct = total > 0 ? Math.min(1, solved / total) : 0
  return (
    <div
      className="relative h-[72px] w-[72px] shrink-0"
      role="img"
      aria-label={`Caso: ${solved} de ${total} evidências resolvidas`}
    >
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={R} fill="none" stroke="#1d3a63" strokeWidth="7" />
        <motion.circle
          cx="36"
          cy="36"
          r={R}
          fill="none"
          stroke="#21a44a"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={false}
          animate={{ strokeDashoffset: CIRC * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
          style={{ filter: 'drop-shadow(0 0 5px rgba(33,164,74,.6))' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="cap-num font-mono text-sm font-black text-white">
          {solved}
          <span className="text-[#5f7ba3]">/{total}</span>
        </span>
      </div>
    </div>
  )
}

function TerminalBlock({ title, content }: { title: string; content: string }) {
  const lines = content.split('\n')
  return (
    <div className="overflow-hidden rounded-lg border-2 border-[#1d3a63] bg-[#0d1b33] shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-[#1d3a63] bg-[#10315c]/70 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffb020]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#21a44a]/80" />
        <span className="ml-2 truncate font-mono text-[11px] text-[#7cb6ec]">{title}</span>
        <span className="cap-neon ml-auto shrink-0 font-mono text-[10px] tracking-widest">
          ● PRESERVADA
        </span>
      </div>
      <div className={cn('cap-scroll-slim max-h-64 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed sm:text-[12.5px]', SLIM_SCROLL)}>
        {lines.map((l, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-6 shrink-0 select-none text-right text-[#33507c]">{i + 1}</span>
            <span
              className={cn(
                'whitespace-pre-wrap break-words',
                l.includes('FANTASMA-7') || l.includes('FANTASMA PATCH') ? 'text-[#c4b5fd]' : 'text-[#7ef0a8]',
              )}
            >
              {l || '\u00A0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SuspectCard({
  s,
  eliminated,
  isGhost,
}: {
  s: PublicSuspect
  eliminated: boolean
  isGhost: boolean
}) {
  return (
    <motion.article
      layout
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border-2 p-4 transition-colors duration-300',
        eliminated
          ? 'border-[#7f1d1d]/70 bg-[#140b13]/80 saturate-50'
          : 'border-[#1d3a63] bg-[#10315c]/60 hover:-translate-y-0.5 hover:border-[#2a4a7d]',
      )}
    >
      {isGhost && !eliminated && (
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#8b5cf6]/60 bg-[#8b5cf6]/15 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-[#c4b5fd]">
          <Ghost className="h-3 w-3" /> A FANTASMA
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-black"
          style={{
            borderColor: s.color,
            color: s.color,
            background: `${s.color}1a`,
            boxShadow: eliminated ? 'none' : `0 0 14px ${s.color}33`,
          }}
        >
          {s.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{s.name}</p>
          <p className="truncate font-mono text-xs" style={{ color: s.color }}>
            &quot;{s.handle}&quot;
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7cb6ec]">{s.role}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {s.traits.map((t) => (
          <li
            key={t}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10.5px] leading-tight',
              eliminated ? 'border-[#5f2733] text-[#a97b85]' : 'border-[#2a4a7d] text-[#a9c2e2]',
            )}
          >
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-[#8fa8c9]">{s.bio}</p>
      <AnimatePresence>
        {eliminated && (
          <motion.div
            initial={{ scale: 2.6, opacity: 0, rotate: 14 }}
            animate={{ scale: 1, opacity: 1, rotate: -11 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 17 }}
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <span className="rounded-md border-[3px] border-[#f87171] bg-[#2a0d12]/75 px-3 py-1.5 font-mono text-base font-black tracking-[0.18em] text-[#f87171] backdrop-blur-[1.5px]">
              ELIMINADO(A)
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

function Celebration({
  ghost,
  narrative,
  xp,
  finalAt,
  onRestart,
  onClose,
}: {
  ghost: GhostIdentity
  narrative: string
  xp: number
  finalAt?: string
  onRestart: () => void
  onClose: () => void
}) {
  const [stage, setStage] = React.useState<'ghost' | 'avatar'>('ghost')

  React.useEffect(() => {
    setStage('ghost')
    const t = window.setTimeout(() => setStage('avatar'), 1300)
    return () => window.clearTimeout(t)
  }, [ghost.suspectId])

  return (
    <div className="mt-1">
      {/* morph: fantasma → avatar da suspeita */}
      <div className="relative mx-auto h-28 w-28">
        <div className="absolute inset-0 rounded-full bg-[#8b5cf6]/25 blur-2xl" aria-hidden />
        <AnimatePresence mode="wait">
          {stage === 'ghost' ? (
            <motion.div
              key="ghost"
              className="absolute inset-0 grid place-items-center"
              exit={{ y: -70, opacity: 0, scale: 0.5, rotate: 14 }}
              transition={{ duration: 0.5, ease: 'easeIn' }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <GhostSvg className="h-24 w-24 drop-shadow-[0_0_18px_rgba(139,92,246,0.6)]" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="avatar"
              className="absolute inset-0 grid place-items-center"
              initial={{ scale: 0.2, opacity: 0, rotate: -24 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 15 }}
            >
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full border-4 font-mono text-2xl font-black"
                style={{
                  borderColor: ghost.color,
                  color: ghost.color,
                  background: `${ghost.color}1a`,
                  boxShadow: `0 0 36px ${ghost.color}66`,
                }}
              >
                {ghost.initials}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-center font-mono text-[11px] tracking-[0.2em] text-[#a78bfa]">
        {stage === 'ghost' ? 'DECODIFICANDO IDENTIDADE…' : 'IDENTIDADE CONFIRMADA'}
      </p>

      <div className="mt-4 rounded-xl border-2 border-[#21a44a]/60 bg-[#21a44a]/10 p-4 text-center">
        <p className="cap-neon font-mono text-[11px] tracking-widest">A FANTASMA DO CHAT É</p>
        <p className="mt-1 text-xl font-black text-white sm:text-2xl">{ghost.fullName}</p>
        <p className="mt-0.5 text-xs text-[#8fa8c9]">{ghost.role}</p>
        <p className="mt-2 inline-block rounded-md border border-[#21a44a]/50 bg-[#0a1830] px-3 py-1.5 font-mono text-sm font-bold text-[#7ef0a8]">
          {ghost.flag}
        </p>
      </div>

      <div className="mt-4 rounded-xl border-2 border-[#1d3a63] bg-[#10315c]/50 p-4">
        <p className="mb-2 flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.2em] text-[#7cb6ec]">
          <BookOpen className="h-3.5 w-3.5" /> EPÍLOGO DO CASO
        </p>
        <div className={cn('max-h-56 space-y-3 overflow-y-auto pr-1 text-sm leading-relaxed text-[#b9cce6]', SLIM_SCROLL)}>
          {narrative.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-[#8b5cf6]/50 bg-[#8b5cf6]/10 p-4 text-center">
          <Trophy className="mx-auto h-7 w-7 text-[#ffb020]" aria-hidden />
          <p className="mt-1.5 font-mono text-sm font-black tracking-widest text-white">
            CAÇADOR DE FANTASMAS
          </p>
          <p className="mt-1 font-mono text-[11px] text-[#a78bfa]">
            selo concedido em {fmtWhen(finalAt)}
          </p>
        </div>
        <div className="rounded-xl border-2 border-[#1d3a63] bg-[#10315c]/50 p-4 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-[#4ade80]" aria-hidden />
          <p className="cap-num mt-1.5 font-mono text-2xl font-black text-white">{xp} XP</p>
          <p className="mt-1 text-[11px] text-[#8fa8c9]">experiência total do caso</p>
        </div>
      </div>

      <CertificateButton
        type="ctf"
        ready
        label="Certificado de Investigação Mestre"
        className="min-h-[44px] w-full justify-center"
        meta={{
          evidencias: 'caso encerrado',
          xp: String(xp),
          fantasma: ghost.fullName,
          encerradoEm: finalAt?.slice(0, 10) ?? '',
        }}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          onClick={onRestart}
          className="h-11 flex-1 border-[#7f1d1d]/70 bg-transparent text-[#f87171] hover:bg-[#2a0d12] hover:text-[#f87171]"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar caso
        </Button>
        <Button onClick={onClose} className="h-11 flex-1 bg-[#21a44a] font-bold text-white hover:bg-[#1c8f3f]">
          Arquivar caso
        </Button>
      </div>
    </div>
  )
}

/* ═════════════════════════════ visão principal ═════════════════════════════ */

export function GhostCtf() {
  /* dados do caso (GET — sem respostas, fair play) */
  const [meta, setMeta] = React.useState<CtfMeta | null>(null)
  const [suspects, setSuspects] = React.useState<PublicSuspect[]>([])
  const [challenges, setChallenges] = React.useState<PublicChallenge[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadErr, setLoadErr] = React.useState(false)

  /* progresso persistente */
  const [progress, setProgress] = React.useState<Progress>(EMPTY_PROGRESS)

  /* UI */
  const [openCh, setOpenCh] = React.useState<string | null>(null)
  const [finalOpen, setFinalOpen] = React.useState(false)
  const [diaryOpen, setDiaryOpen] = React.useState(false)
  const [glitch, setGlitch] = React.useState(false)
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [confetti, setConfetti] = React.useState<ConfettiPiece[]>([])

  /* diálogo de evidência */
  const [answer, setAnswer] = React.useState('')
  const [checking, setChecking] = React.useState(false)
  const [wrong, setWrong] = React.useState(false)
  const [shakeKey, setShakeKey] = React.useState(0)
  const [success, setSuccess] = React.useState<{
    flagPart: string
    reveals: string
    eliminates: string[]
    xpEarned: number
  } | null>(null)

  /* diálogo final */
  const [ghostPick, setGhostPick] = React.useState('')
  const [finalAnswer, setFinalAnswer] = React.useState('')
  const [finalChecking, setFinalChecking] = React.useState(false)
  const [finalWrong, setFinalWrong] = React.useState(false)
  const [finalShake, setFinalShake] = React.useState(0)
  const [finalView, setFinalView] = React.useState<'form' | 'celebrate'>('form')

  /* ── carga ── */
  const loadData = React.useCallback(async () => {
    setLoading(true)
    setLoadErr(false)
    try {
      const res = await fetch('/api/ctf/verify')
      const data = (await res.json()) as {
        ok?: boolean
        meta?: CtfMeta
        suspects?: PublicSuspect[]
        challenges?: PublicChallenge[]
      }
      if (data?.ok && data.meta && data.suspects && data.challenges) {
        setMeta(data.meta)
        setSuspects(data.suspects)
        setChallenges(data.challenges)
      } else {
        setLoadErr(true)
      }
    } catch {
      setLoadErr(true)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setProgress({ ...EMPTY_PROGRESS, ...(JSON.parse(raw) as Partial<Progress>) })
    } catch {
      /* localStorage indisponível — segue com progresso vazio */
    }
  }, [])

  /* glitch ocasional do fantasma */
  React.useEffect(() => {
    let t2: number | undefined
    const t1 = window.setInterval(() => {
      setGlitch(true)
      t2 = window.setTimeout(() => setGlitch(false), 240)
    }, 3600)
    return () => {
      window.clearInterval(t1)
      if (t2) window.clearTimeout(t2)
    }
  }, [])

  const saveProgress = React.useCallback((p: Progress) => {
    setProgress(p)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* sem persistência disponível — jogo segue em memória */
    }
  }, [])

  const pushToast = React.useCallback((kind: ToastItem['kind'], title: string, msg?: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-3), { id, kind, title, msg }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const burst = React.useCallback((count = 24) => {
    const pieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      x: (Math.random() - 0.5) * 520,
      y: (Math.random() - 0.75) * 420,
      r: Math.random() * 720 - 360,
      c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      d: Math.random() * 0.25,
      s: 6 + Math.random() * 8,
    }))
    setConfetti(pieces)
    window.setTimeout(() => setConfetti([]), 1900)
  }, [])

  /* ── derivados ── */
  const totalCh = challenges.length || 6
  const solvedCount = Object.keys(progress.solved).length
  const eliminatedIds = React.useMemo(() => {
    const set = new Set<string>()
    Object.values(progress.solved).forEach((r) => r.eliminates.forEach((id) => set.add(id)))
    return set
  }, [progress.solved])
  const finalUnlockAt = meta?.finalUnlockAt ?? 5
  const unlocked = solvedCount >= finalUnlockAt
  const openChallenge = challenges.find((c) => c.id === openCh) ?? null
  const hintsUsed = openChallenge ? progress.hints[openChallenge.id] ?? 0 : 0
  const diaryEntries = Object.entries(progress.solved)

  /* ── ações: evidências ── */
  function openChallengeDialog(ch: PublicChallenge) {
    setAnswer('')
    setWrong(false)
    setChecking(false)
    const rec = progress.solved[ch.id]
    setSuccess(
      rec
        ? { flagPart: rec.flagPart, reveals: rec.reveals, eliminates: rec.eliminates, xpEarned: rec.xpEarned }
        : null,
    )
    setOpenCh(ch.id)
  }

  function revealHint(ch: PublicChallenge) {
    const used = progress.hints[ch.id] ?? 0
    if (used >= ch.hints.length) return
    saveProgress({ ...progress, hints: { ...progress.hints, [ch.id]: used + 1 } })
    pushToast('info', `Dica ${used + 1} revelada`, `Custa ${ch.hintCost} XP no fechamento desta evidência.`)
  }

  async function submitAnswer(ch: PublicChallenge) {
    if (!answer.trim() || checking) return
    setChecking(true)
    setWrong(false)
    try {
      const res = await fetch('/api/ctf/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: ch.id, answer }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        correct?: boolean
        error?: string
        flagPart?: string
        reveals?: string
        eliminates?: string[]
        xp?: number
      }
      if (res.status === 429) {
        pushToast('info', 'Servidor de verificação', data?.error ?? 'Muitas tentativas. Respire e volte.')
        return
      }
      if (data?.correct && data.flagPart && data.reveals) {
        const used = progress.hints[ch.id] ?? 0
        const earned = Math.max(0, ch.xp - (meta?.xpHintCost ?? 10) * used)
        const rec: EvidenceRecord = {
          flagPart: data.flagPart,
          reveals: data.reveals,
          eliminates: data.eliminates ?? [],
          xpEarned: earned,
          at: new Date().toISOString(),
        }
        saveProgress({
          ...progress,
          solved: { ...progress.solved, [ch.id]: rec },
          xp: progress.xp + earned,
        })
        setSuccess({ flagPart: rec.flagPart, reveals: rec.reveals, eliminates: rec.eliminates, xpEarned: earned })
        pushToast('success', 'Evidência validada!', `${rec.flagPart} · +${earned} XP`)
        burst(26)
      } else {
        setWrong(true)
        setShakeKey((k) => k + 1)
      }
    } catch {
      pushToast('error', 'Falha de rede', 'Não consegui falar com o servidor de verificação. Tente de novo.')
    } finally {
      setChecking(false)
    }
  }

  /* ── ações: acusação final ── */
  function openFinal() {
    setFinalWrong(false)
    setFinalAnswer('')
    if (progress.finalDone && progress.finalResult) {
      setFinalView('celebrate')
      setGhostPick(progress.finalPick ?? progress.finalResult.ghost.suspectId)
    } else {
      setFinalView('form')
      setGhostPick('')
    }
    setFinalOpen(true)
  }

  async function submitFinal() {
    if (!finalAnswer.trim() || !ghostPick || finalChecking) return
    setFinalChecking(true)
    setFinalWrong(false)
    try {
      const res = await fetch('/api/ctf/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: 'final', answer: finalAnswer, suspectId: ghostPick }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        correct?: boolean
        error?: string
        ghost?: GhostIdentity
        narrative?: string
        bonusXp?: number
      }
      if (res.status === 429) {
        pushToast('info', 'Servidor de verificação', data?.error ?? 'Muitas tentativas. Respire e volte.')
        return
      }
      if (data?.correct && data.ghost && data.narrative) {
        const alreadyDone = progress.finalDone
        const bonus = alreadyDone ? 0 : data.bonusXp ?? meta?.finalBonusXp ?? 250
        saveProgress({
          ...progress,
          finalDone: true,
          finalAt: progress.finalAt ?? new Date().toISOString(),
          finalPick: ghostPick,
          finalResult: { ghost: data.ghost, narrative: data.narrative },
          xp: progress.xp + bonus,
        })
        setFinalView('celebrate')
        burst(40)
        pushToast('success', 'Caso encerrado!', alreadyDone ? 'Epílogo reaberto.' : `Acusação aceita · +${bonus} XP`)
      } else {
        setFinalWrong(true)
        setFinalShake((k) => k + 1)
      }
    } catch {
      pushToast('error', 'Falha de rede', 'Não consegui falar com o servidor de verificação. Tente de novo.')
    } finally {
      setFinalChecking(false)
    }
  }

  function restartCase() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* sem localStorage — apenas reseta o estado */
    }
    setProgress(EMPTY_PROGRESS)
    setFinalView('form')
    setGhostPick('')
    setFinalAnswer('')
    setFinalOpen(false)
    setSuccess(null)
    setAnswer('')
    pushToast('info', 'Caso reiniciado', 'O dossiê voltou para a prateleira. Boa sorte, analista.')
  }

  /* ── render ── */
  return (
    <div data-fs-root className="flex min-h-screen flex-col bg-[#081120] text-[#cfe0f5]">
      {/* brilhos de fundo */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-[15%] h-80 w-80 rounded-full bg-[#8b5cf6]/15 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[#21a44a]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[#10315c]/40 blur-3xl" />
      </div>

      {/* ─────────────── cabeçalho ─────────────── */}
      <header className="cap-aurora relative border-b border-[#1d3a63]/70 bg-[#0d1b33]/80">
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              className="shrink-0"
            >
              <motion.div
                animate={
                  glitch
                    ? { x: [0, -4, 3, -2, 0], opacity: [1, 0.45, 0.9, 0.55, 1] }
                    : { x: 0, opacity: 1 }
                }
                transition={{ duration: 0.28 }}
              >
                <GhostSvg className="h-24 w-24 drop-shadow-[0_0_18px_rgba(139,92,246,0.55)] sm:h-28 sm:w-28" />
              </motion.div>
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-[#8b5cf6]/50 bg-[#8b5cf6]/10 font-mono text-[11px] tracking-widest text-[#c4b5fd]"
                >
                  {meta?.caseCode ?? 'CASO 033 · ARQUIVO CAPYBER'}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[#21a44a]/50 bg-[#21a44a]/10 font-mono text-[11px] tracking-widest text-[#7ef0a8]"
                >
                  <span className="relative mr-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#21a44a] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#21a44a]" />
                  </span>
                  <Clock className="mr-1 h-3 w-3" aria-hidden />
                  SINAL ATIVO · 03:33:33
                </Badge>
                <FullscreenButton label="CTF em tela cheia" className="ml-auto" />
              </div>
              <h1 className="font-mono text-2xl font-black tracking-tight text-white sm:text-4xl">
                CTF · O{' '}
                <motion.span
                  animate={glitch ? { x: [0, -3, 2, 0] } : { x: 0 }}
                  className="cap-neon"
                >
                  FANTASMA
                </motion.span>{' '}
                DO CHAT
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[#9db6d8] sm:text-base">
                {meta?.subtitle ?? 'Alguém morreu e continua logada às 03:33. Prove quem era.'}
              </p>
            </div>
          </div>

          {/* banner ético */}
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-[#21a44a]/40 bg-[#21a44a]/10 px-3 py-2.5 text-xs leading-relaxed text-[#9fe8bd] sm:items-center sm:text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4ade80] sm:mt-0" aria-hidden />
            <span>
              {meta?.banner ??
                'Simulação 100% defensiva · evidências fictícias · técnicas usadas por analistas SOC reais'}
            </span>
          </div>
        </div>
      </header>

      {/* ─────────────── conteúdo ─────────────── */}
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* briefing */}
        <section
          aria-labelledby="briefing-h"
          className="rounded-xl border-2 border-[#1d3a63] bg-[#10315c]/50 p-5 sm:p-6"
        >
          <h2
            id="briefing-h"
            className="flex items-center gap-2 font-mono text-sm font-bold tracking-[0.2em] text-[#7ef0a8]"
          >
            <Fingerprint className="h-4 w-4" aria-hidden /> BRIEFING DO CASO · 13/04/2023
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#b9cce6]">
            {(meta?.briefing ?? []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {loading && <p className="font-mono text-xs text-[#5f7ba3]">Abrindo o dossiê…</p>}
          </div>
        </section>

        {/* barra de status */}
        <section className="mt-6 flex flex-col gap-5 rounded-xl border-2 border-[#1d3a63] bg-[#10315c]/50 p-4 sm:p-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <ProgressRing solved={solvedCount} total={totalCh} />
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-[#7cb6ec]">PROGRESSO DO CASO</p>
              <p className="mt-1 text-sm text-[#b9cce6]">
                <span className="font-bold text-white">{solvedCount}</span> de{' '}
                <span className="font-bold text-white">{totalCh}</span> evidências resolvidas
              </p>
              <p className="mt-1 text-[11px] text-[#8fa8c9]">
                {unlocked
                  ? 'O dossiê está pronto para a acusação final.'
                  : `A acusação final destranca com ${finalUnlockAt} evidências.`}
              </p>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 lg:max-w-xs">
            <div className="rounded-lg border border-[#1d3a63] bg-[#0d1b33]/70 p-3 text-center">
              <Sparkles className="mx-auto h-4 w-4 text-[#ffb020]" aria-hidden />
              <p className="cap-num mt-1 font-mono text-lg font-black text-white">{progress.xp}</p>
              <p className="text-[10px] tracking-widest text-[#5f7ba3]">XP TOTAL</p>
            </div>
            <div className="rounded-lg border border-[#1d3a63] bg-[#0d1b33]/70 p-3 text-center">
              <XCircle className="mx-auto h-4 w-4 text-[#f87171]" aria-hidden />
              <p className="cap-num mt-1 font-mono text-lg font-black text-white">{eliminatedIds.size}</p>
              <p className="text-[10px] tracking-widest text-[#5f7ba3]">ELIMINADOS</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:ml-auto">
            {progress.finalDone && (
              <CertificateButton
                type="ctf"
                ready
                label="Certificado de Investigação Mestre"
                meta={{
                  evidencias: `${solvedCount}/${totalCh}`,
                  xp: String(progress.xp),
                  fantasma: progress.finalResult?.ghost.fullName ?? '',
                  encerradoEm: progress.finalAt?.slice(0, 10) ?? '',
                }}
              />
            )}
            <Button
              variant="outline"
              onClick={() => setDiaryOpen(true)}
              className="h-11 border-[#1d3a63] bg-[#0d1b33] text-[#cfe0f5] hover:bg-[#10315c] hover:text-white"
            >
              <BookOpen className="mr-2 h-4 w-4" aria-hidden /> Diário do detetive
            </Button>
            <Button
              onClick={openFinal}
              disabled={!unlocked}
              className="h-11 bg-[#8b5cf6] font-bold text-white hover:bg-[#7c3aed] disabled:opacity-40"
            >
              {progress.finalDone ? (
                <>
                  <Ghost className="mr-2 h-4 w-4" aria-hidden /> Ver epílogo
                </>
              ) : (
                <>
                  <Flag className="mr-2 h-4 w-4" aria-hidden /> Acusação final
                </>
              )}
            </Button>
          </div>
        </section>

        {/* suspeitos */}
        <section aria-labelledby="suspects-h" className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2
              id="suspects-h"
              className="flex items-center gap-2 font-mono text-sm font-bold tracking-[0.2em] text-[#7cb6ec]"
            >
              <Search className="h-4 w-4" aria-hidden /> SUSPEITOS · ANTIGO CHAT DA COMUNIDADE
            </h2>
            <span className="font-mono text-xs text-[#5f7ba3]">
              {suspects.length - eliminatedIds.size}/{suspects.length || 5} ativos
            </span>
          </div>
          {loadErr ? (
            <div className="rounded-xl border-2 border-dashed border-[#7f1d1d]/60 bg-[#140b13]/60 p-8 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-[#f87171]" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-[#f87171]">
                Não consegui abrir o dossiê do caso.
              </p>
              <Button
                onClick={() => void loadData()}
                className="mt-4 h-11 bg-[#21a44a] font-bold text-white hover:bg-[#1c8f3f]"
              >
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden /> Tentar de novo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 animate-pulse rounded-xl border-2 border-[#1d3a63] bg-[#10315c]/40"
                    />
                  ))
                : suspects.map((s) => (
                    <SuspectCard
                      key={s.id}
                      s={s}
                      eliminated={eliminatedIds.has(s.id)}
                      isGhost={progress.finalDone && progress.finalResult?.ghost.suspectId === s.id}
                    />
                  ))}
            </div>
          )}
        </section>

        {/* evidências */}
        <section aria-labelledby="evidence-h" className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2
              id="evidence-h"
              className="flex items-center gap-2 font-mono text-sm font-bold tracking-[0.2em] text-[#7cb6ec]"
            >
              <Fingerprint className="h-4 w-4" aria-hidden /> EVIDÊNCIAS · TERMINAL DE ANÁLISE
            </h2>
            <span className="font-mono text-xs text-[#5f7ba3]">
              clique para abrir o terminal · dicas custam {meta?.xpHintCost ?? 10} XP
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-44 animate-pulse rounded-xl border-2 border-[#1d3a63] bg-[#10315c]/40"
                  />
                ))
              : challenges.map((ch) => {
                  const rec = progress.solved[ch.id]
                  const Icon = CH_ICON[ch.icon] ?? ScrollText
                  return (
                    <motion.button
                      key={ch.id}
                      type="button"
                      onClick={() => openChallengeDialog(ch)}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.985 }}
                      aria-label={`Abrir evidência ${ch.title}${rec ? ' (resolvida)' : ''}`}
                      className={cn(
                        'group relative min-h-[176px] rounded-xl border-2 p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]',
                        rec
                          ? 'border-[#21a44a]/60 bg-gradient-to-br from-[#0f2a1c]/90 to-[#10315c]/70'
                          : 'border-[#1d3a63] bg-[#10315c]/60 hover:border-[#2a4a7d]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg border',
                            rec
                              ? 'border-[#21a44a]/60 bg-[#21a44a]/15 text-[#4ade80]'
                              : 'border-[#2a4a7d] bg-[#0d1b33] text-[#7cb6ec]',
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-mono text-[10px]',
                            rec ? 'border-[#21a44a]/60 text-[#7ef0a8]' : 'border-[#2a4a7d] text-[#8fa8c9]',
                          )}
                        >
                          {ch.tag}
                        </Badge>
                      </div>
                      <p className="mt-3 font-mono text-[10px] tracking-widest text-[#5f7ba3]">
                        EVID-{pad2(ch.order)}
                      </p>
                      <h3 className="mt-0.5 text-base font-bold leading-snug text-white">{ch.title}</h3>
                      <div className="mt-3 flex items-center justify-between">
                        {rec ? (
                          <motion.span
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#7ef0a8]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> RESOLVIDO
                          </motion.span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#ffb020]">
                            <ChevronRight className="h-3.5 w-3.5" aria-hidden /> ABERTO — analisar
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-[#8fa8c9]">{ch.xp} XP</span>
                      </div>
                      {rec && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="mt-2 truncate font-mono text-[11px] text-[#c4b5fd]"
                        >
                          {rec.flagPart}
                        </motion.p>
                      )}
                    </motion.button>
                  )
                })}
          </div>
        </section>

        {/* rodapé de técnicas */}
        <section className="mt-10 rounded-xl border-2 border-[#1d3a63] bg-[#10315c]/40 p-4 sm:p-5">
          <p className="text-center font-mono text-[11px] leading-relaxed text-[#5f7ba3]">
            técnicas de analista de verdade, em versão de brinquedo: leitura de log · cifra de César
            (ROT13) · esteganografia em base64 · forense de cabeçalhos de e-mail · Vigenère · OSINT de
            padrões
          </p>
        </section>
      </main>

      {/* ─────────────── rodapé ─────────────── */}
      <footer className="relative mt-auto border-t border-[#1d3a63]/70 bg-[#0d1b33]/70 px-4 py-5 text-center">
        <p className="font-mono text-[11px] leading-relaxed text-[#5f7ba3]">
          CAPYBER CTF · exercício 100% defensivo e fictício · nenhum sistema real foi acessado ·
          &quot;log é poesia&quot; — ass. Patchwork
        </p>
      </footer>

      {/* ─────────────── diálogo: terminal de análise ─────────────── */}
      <Dialog open={!!openChallenge} onOpenChange={(o) => !o && setOpenCh(null)}>
        <DialogContent className="max-h-[88vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-2 border-[#1d3a63] bg-[#0d1b33] p-0 text-[#cfe0f5] sm:max-w-2xl">
          {openChallenge && (
            <div className="p-5 sm:p-6">
              <DialogHeader className="text-left">
                <p className="font-mono text-[10px] tracking-[0.25em] text-[#5f7ba3]">
                  TERMINAL DE ANÁLISE
                </p>
                <div className="flex flex-wrap items-center gap-2 pr-10">
                  <Badge
                    variant="outline"
                    className="border-[#2a4a7d] font-mono text-[10px] text-[#8fa8c9]"
                  >
                    EVID-{pad2(openChallenge.order)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#8b5cf6]/50 bg-[#8b5cf6]/10 font-mono text-[10px] text-[#c4b5fd]"
                  >
                    {openChallenge.tag}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#ffb020]/40 bg-[#ffb020]/10 font-mono text-[10px] text-[#ffd28a]"
                  >
                    {openChallenge.xp} XP
                  </Badge>
                  {success && (
                    <Badge className="border-[#21a44a]/60 bg-[#21a44a]/20 font-mono text-[10px] text-[#7ef0a8]">
                      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden /> RESOLVIDA
                    </Badge>
                  )}
                </div>
                <DialogTitle className="mt-1 font-mono text-xl font-black text-white">
                  {openChallenge.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Terminal de análise da evidência {openChallenge.title}.
                </DialogDescription>
              </DialogHeader>

              <p className="mt-3 text-sm leading-relaxed text-[#b9cce6]">{openChallenge.story}</p>

              <div className="mt-3 rounded-lg border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 px-3 py-2.5 text-sm leading-relaxed text-[#ddd0fe]">
                <span className="font-bold">Pergunta:</span> {openChallenge.question}
              </div>

              <div className="mt-4">
                <TerminalBlock
                  title={`evidencia-${pad2(openChallenge.order)}.log`}
                  content={openChallenge.artifact}
                />
              </div>

              {/* dicas progressivas */}
              {!success && (
                <div className="mt-4 space-y-2">
                  {openChallenge.hints.slice(0, hintsUsed).map((h, i) => (
                    <div
                      key={i}
                      className="cap-card-hover rounded-lg border border-[#ffb020]/40 bg-[#ffb020]/10 px-3 py-2 text-sm leading-relaxed text-[#ffd28a]"
                    >
                      <span className="font-mono font-bold">DICA {i + 1}:</span> {h}
                    </div>
                  ))}
                  {hintsUsed < openChallenge.hints.length && (
                    <Button
                      variant="outline"
                      onClick={() => revealHint(openChallenge)}
                      className="h-11 w-full border-[#ffb020]/40 bg-transparent text-[#ffd28a] hover:bg-[#ffb020]/10 hover:text-[#ffd28a]"
                    >
                      <Eye className="mr-2 h-4 w-4" aria-hidden /> Revelar dica {hintsUsed + 1}/
                      {openChallenge.hints.length} (−{openChallenge.hintCost} XP)
                    </Button>
                  )}
                </div>
              )}

              {/* resposta / resultado */}
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 rounded-xl border-2 border-[#21a44a]/70 bg-[#21a44a]/10 p-4"
                  >
                    <p className="flex items-center gap-2 font-mono text-sm font-black tracking-wide text-[#7ef0a8]">
                      <CheckCircle2 className="h-5 w-5" aria-hidden /> EVIDÊNCIA VALIDADA
                    </p>
                    <p className="mt-2 font-mono text-base font-bold text-white">{success.flagPart}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#b9cce6]">
                      <span className="font-bold text-[#7ef0a8]">Atributo revelado:</span>{' '}
                      {success.reveals}
                    </p>
                    {success.eliminates.length > 0 && (
                      <p className="mt-2 text-sm text-[#f87171]">
                        <span className="font-bold">Eliminado(a) do quadro:</span>{' '}
                        {success.eliminates
                          .map((id) => suspects.find((s) => s.id === id)?.name ?? id)
                          .join(', ')}
                        .
                      </p>
                    )}
                    <p className="mt-2 font-mono text-xs text-[#8fa8c9]">
                      +{success.xpEarned} XP registrados no diário do detetive.
                    </p>
                    <Button
                      onClick={() => setOpenCh(null)}
                      className="mt-4 h-11 w-full bg-[#21a44a] font-bold text-white hover:bg-[#1c8f3f]"
                    >
                      Fechar análise
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void submitAnswer(openChallenge)
                    }}
                    className="mt-5"
                  >
                    <motion.div
                      key={shakeKey}
                      animate={wrong ? { x: [0, -10, 10, -8, 8, -4, 0] } : { x: 0 }}
                      transition={{ duration: 0.45 }}
                    >
                      <label htmlFor={`ans-${openChallenge.id}`} className="sr-only">
                        Resposta da evidência
                      </label>
                      <Input
                        id={`ans-${openChallenge.id}`}
                        value={answer}
                        onChange={(e) => {
                          setAnswer(e.target.value)
                          setWrong(false)
                        }}
                        placeholder={openChallenge.placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        className="h-11 border-2 border-[#2a4a7d] bg-[#0a1830] font-mono text-sm text-[#7ef0a8] placeholder:text-[#4f7099]"
                      />
                      {wrong && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#f87171]">
                          <XCircle className="h-4 w-4" aria-hidden /> Tente novamente, analista.
                        </p>
                      )}
                    </motion.div>
                    <Button
                      type="submit"
                      disabled={checking || !answer.trim()}
                      className="mt-3 h-11 w-full bg-[#21a44a] font-bold text-white hover:bg-[#1c8f3f] disabled:opacity-50"
                    >
                      {checking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Verificando…
                        </>
                      ) : (
                        <>
                          <Fingerprint className="mr-2 h-4 w-4" aria-hidden /> Submeter
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─────────────── diálogo: acusação final ─────────────── */}
      <Dialog open={finalOpen} onOpenChange={(o) => !o && setFinalOpen(false)}>
        <DialogContent className="max-h-[88vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-2 border-[#8b5cf6]/50 bg-[#0d1b33] p-0 text-[#cfe0f5] sm:max-w-2xl">
          <div className="p-5 sm:p-6">
            <DialogHeader className="text-left">
              <DialogTitle className="font-mono text-xl font-black text-white">
                ACUSAÇÃO FINAL · QUEM É A FANTASMA?
              </DialogTitle>
              <DialogDescription className="text-[#8fa8c9]">
                Escolha a suspeita e digite a flag no formato{' '}
                <span className="font-mono text-[#c4b5fd]">
                  {meta?.flagFormat ?? 'CAPY{FANTASMA_<NOME>}'}
                </span>
                .
              </DialogDescription>
            </DialogHeader>

            {finalView === 'celebrate' && progress.finalResult ? (
              <Celebration
                ghost={progress.finalResult.ghost}
                narrative={progress.finalResult.narrative}
                xp={progress.xp}
                finalAt={progress.finalAt}
                onRestart={restartCase}
                onClose={() => setFinalOpen(false)}
              />
            ) : (
              <>
                <p className="mt-3 rounded-lg border border-[#21a44a]/40 bg-[#21a44a]/10 px-3 py-2 text-xs leading-relaxed text-[#9fe8bd]">
                  Destravado com {solvedCount}/{totalCh} evidências. A flag contém o primeiro nome ou
                  o apelido da fantasma. Bônus: +{meta?.finalBonusXp ?? 250} XP.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {suspects.map((s) => {
                    const sel = ghostPick === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setGhostPick(s.id)}
                        aria-pressed={sel}
                        className={cn(
                          'flex min-h-[64px] items-center gap-2.5 rounded-lg border-2 p-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]',
                          sel
                            ? 'border-[#8b5cf6] bg-[#8b5cf6]/15'
                            : 'border-[#1d3a63] bg-[#10315c]/60 hover:border-[#2a4a7d]',
                          eliminatedIds.has(s.id) && !sel && 'opacity-60',
                        )}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[11px] font-black"
                          style={{ borderColor: s.color, color: s.color, background: `${s.color}1a` }}
                        >
                          {s.initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold text-white">{s.name}</span>
                          <span className="block truncate font-mono text-[10px]" style={{ color: s.color }}>
                            &quot;{s.handle}&quot;
                          </span>
                        </span>
                        {sel && <BadgeCheck className="ml-auto h-4 w-4 shrink-0 text-[#a78bfa]" aria-hidden />}
                      </button>
                    )
                  })}
                </div>

                <motion.form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void submitFinal()
                  }}
                  className="mt-4"
                >
                  <motion.div
                    key={finalShake}
                    animate={finalWrong ? { x: [0, -10, 10, -8, 8, -4, 0] } : { x: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <label htmlFor="final-flag" className="sr-only">
                      Flag final
                    </label>
                    <Input
                      id="final-flag"
                      value={finalAnswer}
                      onChange={(e) => {
                        setFinalAnswer(e.target.value)
                        setFinalWrong(false)
                      }}
                      placeholder="CAPY{FANTASMA_...}"
                      autoComplete="off"
                      spellCheck={false}
                      className="h-11 border-2 border-[#2a4a7d] bg-[#0a1830] font-mono text-sm uppercase tracking-wide text-[#c4b5fd] placeholder:normal-case placeholder:text-[#4f7099]"
                    />
                    {finalWrong && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#f87171]">
                        <XCircle className="h-4 w-4" aria-hidden /> A acusação não se sustenta… revise
                        as evidências, analista.
                      </p>
                    )}
                  </motion.div>
                  <Button
                    type="submit"
                    disabled={finalChecking || !ghostPick || !finalAnswer.trim()}
                    className="mt-3 h-11 w-full bg-[#8b5cf6] font-bold text-white hover:bg-[#7c3aed] disabled:opacity-50"
                  >
                    {finalChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Consultando os
                        arquivos…
                      </>
                    ) : (
                      <>
                        <Flag className="mr-2 h-4 w-4" aria-hidden /> Acusar
                      </>
                    )}
                  </Button>
                  {!ghostPick && (
                    <p className="mt-2 text-center text-[11px] text-[#8fa8c9]">
                      Selecione um suspeito para habilitar a acusação.
                    </p>
                  )}
                </motion.form>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─────────────── diário do detetive (painel lateral) ─────────────── */}
      <Sheet open={diaryOpen} onOpenChange={setDiaryOpen}>
        <SheetContent
          side="right"
          className="cap-scroll-slim w-full overflow-y-auto border-l-2 border-[#1d3a63] bg-[#0d1b33] p-0 text-[#cfe0f5] sm:max-w-md"
        >
          <div className="p-5">
            <SheetHeader className="p-0 text-left">
              <SheetTitle className="flex items-center gap-2 font-mono text-base font-black text-white">
                <BookOpen className="h-4 w-4 text-[#7ef0a8]" aria-hidden /> DIÁRIO DO DETETIVE
              </SheetTitle>
              <SheetDescription className="text-[#8fa8c9]">
                Evidências coletadas, atributos revelados e suspeitos eliminados.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              {diaryEntries.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-[#1d3a63] p-6 text-center text-sm text-[#5f7ba3]">
                  Nenhuma evidência coletada ainda. Abra uma evidência no quadro e comece a analisar.
                </div>
              )}
              {diaryEntries.map(([id, rec]) => (
                <div key={id} className="cap-card-hover rounded-lg border-2 border-[#21a44a]/40 bg-[#10315c]/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs font-bold text-[#7ef0a8]">{rec.flagPart}</p>
                    <span className="shrink-0 font-mono text-[10px] text-[#5f7ba3]">
                      {fmtWhen(rec.at)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#b9cce6]">{rec.reveals}</p>
                  {rec.eliminates.length > 0 && (
                    <p className="mt-1.5 text-[11px] text-[#f87171]">
                      Elimina:{' '}
                      {rec.eliminates
                        .map((eid) => suspects.find((s) => s.id === eid)?.name ?? eid)
                        .join(', ')}
                      .
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[10px] text-[#8fa8c9]">
                    +{rec.xpEarned} XP · dicas usadas: {progress.hints[id] ?? 0}
                  </p>
                </div>
              ))}
            </div>
            <Separator className="my-4 bg-[#1d3a63]" />
            <div className="rounded-lg border border-[#1d3a63] bg-[#10315c]/50 p-3 font-mono text-xs text-[#8fa8c9]">
              <p>
                XP total: <span className="text-[#7ef0a8]">{progress.xp}</span>
              </p>
              <p className="mt-1">
                Evidências: <span className="text-[#7ef0a8]">{solvedCount}/{totalCh}</span> ·
                Eliminados: <span className="text-[#f87171]">{eliminatedIds.size}</span>
              </p>
              <p className="mt-1">
                Caso:{' '}
                <span className={progress.finalDone ? 'text-[#a78bfa]' : 'text-[#ffd28a]'}>
                  {progress.finalDone ? 'ENCERRADO' : 'EM ANDAMENTO'}
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={restartCase}
              className="mt-4 h-11 w-full border-[#7f1d1d]/70 bg-transparent text-[#f87171] hover:bg-[#2a0d12] hover:text-[#f87171]"
            >
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden /> Reiniciar caso
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─────────────── toasts ─────────────── */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,22rem)] flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60 }}
              className={cn(
                'pointer-events-auto rounded-lg border bg-[#0d1b33]/95 p-3 shadow-xl backdrop-blur',
                t.kind === 'success' && 'border-[#21a44a]/60 border-l-4 border-l-[#21a44a]',
                t.kind === 'error' && 'border-[#f87171]/60 border-l-4 border-l-[#f87171]',
                t.kind === 'info' && 'border-[#8b5cf6]/60 border-l-4 border-l-[#8b5cf6]',
              )}
            >
              <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                {t.kind === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4ade80]" aria-hidden />
                ) : t.kind === 'error' ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-[#f87171]" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4 shrink-0 text-[#a78bfa]" aria-hidden />
                )}
                {t.title}
              </p>
              {t.msg && <p className="mt-0.5 pl-5 text-xs leading-relaxed text-[#9db6d8]">{t.msg}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─────────────── confete ─────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
        <AnimatePresence>
          {confetti.map((p) => (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/3 block rounded-[2px]"
              style={{ width: p.s, height: p.s * 0.55, backgroundColor: p.c }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.r }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: p.d }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
