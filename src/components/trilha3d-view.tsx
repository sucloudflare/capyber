'use client'

// CAPYBER — Trilha 3D: RPG do fantasma defensor. Explore o vale simétrico em
// 3D, aproxime-se dos santuários, faça o CURSO (módulos técnicos), passe na
// PROVA (estilo certificação) e emita o CERTIFICADO digital em PDF por fase.

import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {
  Award,
  BadgeCheck,
  BookOpen,
  Castle,
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  Download,
  Gamepad2,
  GraduationCap,
  KeyRound,
  Lock,
  Maximize,
  Minimize,
  Move,
  PenLine,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useFullscreen } from '@/components/fullscreen-button'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { GateSpiral } from '@/components/art'
import { GAME_PHASES, getPhase, type ExamQuestion, type GamePhase } from '@/lib/game-courses'
import { gameStore, type EarnedCertificate, type GameProgress } from '@/lib/game-store'
import { Safe3DBoundary } from '@/components/safe3d'
import {
  attachKeyboard,
  gameFlags,
  gameInput,
  onGameEvent,
  releaseJoystick,
  requestInteract,
  setJoystick,
} from '@/lib/game-bus'
import { sfx } from '@/lib/sfx'

const GameCanvas = dynamic(
  () => import('@/components/game3d/GameCanvas').then((m) => m.GameCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#dcedff]">
        <GateSpiral size={56} spin title="Abrindo o vale dos fantasmas" />
        <p className="font-heading text-base font-bold text-[var(--cap-dim)]">
          Carregando o vale 3D…
        </p>
      </div>
    ),
  },
)

/* ============ joystick de toque ============ */

function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const active = useRef(false)
  const origin = useRef({ x: 0, y: 0 })
  const MAX = 42

  const setKnob = (dx: number, dy: number) => {
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`
  }

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const base = baseRef.current
    if (!base) return
    active.current = true
    base.setPointerCapture(e.pointerId)
    const r = base.getBoundingClientRect()
    origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    onMove(e)
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active.current) return
    let dx = e.clientX - origin.current.x
    let dy = e.clientY - origin.current.y
    const len = Math.hypot(dx, dy)
    if (len > MAX) {
      dx = (dx / len) * MAX
      dy = (dy / len) * MAX
    }
    setKnob(dx, dy)
    // z negativo = para frente (câmera olha -z), então dy inverte
    setJoystick(dx / MAX, dy / MAX)
  }

  const onUp = () => {
    active.current = false
    setKnob(0, 0)
    releaseJoystick()
  }

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Analógico de movimento — arraste para andar"
      className="pointer-events-auto absolute bottom-4 left-4 z-30 flex h-28 w-28 cursor-grab touch-none items-center justify-center rounded-full border-2 border-[#c9a227]/70 bg-[#221c12]/55 backdrop-blur-sm ring-1 ring-inset ring-white/10 active:cursor-grabbing"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        ref={knobRef}
        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#8a5300] bg-gradient-to-b from-[#ffd27a] to-[#e07f0a] shadow-lg transition-transform duration-75"
      >
        <Move className="h-5 w-5 text-white" aria-hidden />
      </div>
      <span className="cap-mono pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 text-[0.7rem] font-bold text-[#f5ecd7] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        MOVER
      </span>
    </div>
  )
}

/* ============ peças do HUD de RPG ============ */

/** botão circular ornamentado (≥44px, toque amigável) */
/** Botão circular do HUD que alterna a tela cheia do palco 3D da trilha. */
function TrilhaFullscreenButton() {
  const getEl = useCallback(() => document.getElementById('trilha-fs-root'), [])
  const { active, toggle } = useFullscreen(getEl)
  const label = active ? 'Sair da tela cheia (Esc)' : 'Tela cheia (F)'
  return (
    <RoundHUDButton label={label} onClick={toggle}>
      {active ? <Minimize className="h-5 w-5" aria-hidden /> : <Maximize className="h-5 w-5" aria-hidden />}
    </RoundHUDButton>
  )
}

function RoundHUDButton({
  label,
  onClick,
  dataTut,
  badge,
  children,
}: {
  label: string
  onClick: () => void
  dataTut?: string
  badge?: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-tut={dataTut}
      className="pointer-events-auto relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#c9a227]/75 bg-[#221c12]/85 text-[#f5ecd7] shadow-[0_4px_14px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/10 transition hover:bg-[#3a2e1b] active:scale-95"
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#5c4a1f] bg-[#21a44a] px-1 text-[0.65rem] font-extrabold text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

/** ornamento dourado de canto da moldura */
function CornerOrnament({ className }: { className: string }) {
  return (
    <div className={`pointer-events-none absolute z-30 h-6 w-6 ${className}`} aria-hidden>
      <div className="absolute inset-0 rotate-45 rounded-[4px] border-2 border-[#c9a227] bg-gradient-to-br from-[#8a7431] to-[#5c4a1f] shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
      <div className="absolute inset-[7px] rotate-45 rounded-full bg-[#e9c767]" />
    </div>
  )
}

/** entrada épica: portão de madeira abrindo para revelar o vale (1×/sessão) */
function GateIntro() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(['left', 'right'] as const).map((side) => (
        <motion.div
          key={side}
          className={`absolute inset-y-0 w-1/2 border-[#241a0e] ${
            side === 'left' ? 'left-0 border-r-4' : 'right-0 border-l-4'
          }`}
          initial={{ x: 0 }}
          animate={{ x: side === 'left' ? '-101%' : '101%' }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.7, 0, 0.3, 1] }}
          style={{
            background:
              'repeating-linear-gradient(90deg, #5f4527 0px, #5f4527 42px, #4a3520 42px, #4a3520 48px, #6b4e2d 48px, #6b4e2d 92px), linear-gradient(180deg, rgba(255,220,150,0.14), rgba(0,0,0,0.38))',
          }}
        >
          <div className="absolute inset-x-0 top-[22%] h-3 bg-gradient-to-b from-[#3d4450] to-[#23272f] opacity-80" />
          <div className="absolute inset-x-0 bottom-[22%] h-3 bg-gradient-to-b from-[#3d4450] to-[#23272f] opacity-80" />
          <div
            className={`absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-4 border-[#2c313a] bg-[#454c58] ${
              side === 'left' ? 'right-6' : 'left-6'
            }`}
          />
        </motion.div>
      ))}
      {/* emblema central que se dissolve */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="text-center"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.12 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#c9a227] bg-[#221c12]/90 shadow-2xl">
            <Castle className="h-10 w-10 text-[#e9c767]" aria-hidden />
          </div>
          <p className="cap-mono mt-3 whitespace-nowrap text-sm font-bold uppercase tracking-[0.3em] text-[#f5ecd7] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            O vale se abre…
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ============ prova (exame) ============ */

type ExamPhase = 'intro' | 'running' | 'result'

function ExamRunner({
  phase,
  onFinish,
}: {
  phase: GamePhase
  onFinish: (score: number, passed: boolean) => void
}) {
  const [step, setStep] = useState<ExamPhase>('intro')
  const [idx, setIdx] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [lastRight, setLastRight] = useState(false)

  const q: ExamQuestion = phase.exam[idx]
  const total = phase.exam.length

  const start = () => {
    setStep('running')
    setIdx(0)
    setChoice(null)
    setChecked(false)
    setCorrect(0)
    sfx.play('select')
  }

  const check = () => {
    if (choice === null || checked) return
    const right = choice === q.answer
    setChecked(true)
    setLastRight(right)
    if (right) setCorrect((c) => c + 1)
    sfx.play(right ? 'correct' : 'wrong')
  }

  const next = () => {
    if (idx + 1 < total) {
      setIdx((i) => i + 1)
      setChoice(null)
      setChecked(false)
      sfx.play('select')
      return
    }
    const score = Math.round((correct / total) * 100)
    const passed = score >= phase.passScore
    setStep('result')
    sfx.play(passed ? 'complete' : 'wrong')
    onFinish(score, passed)
  }

  if (step === 'intro') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="cap-skew-plate flex h-16 w-16 items-center justify-center">
          <ScrollText className="h-8 w-8 text-[var(--cap-orange-deep)]" aria-hidden />
        </span>
        <h4 className="font-heading text-xl font-extrabold text-[var(--cap-bright)]">
          Prova de certificação — {phase.name}
        </h4>
        <p className="max-w-md text-base text-[var(--cap-text)]">
          {total} questões no estilo das certificações {phase.certRef}. Nota mínima:{' '}
          <strong>{phase.passScore}%</strong>. Você pode refazer quantas vezes quiser — vale a
          melhor nota.
        </p>
        <Button size="lg" onClick={start} className="cap-btn-primary">
          <PenLine className="mr-2 h-5 w-5" aria-hidden />
          Iniciar prova
        </Button>
      </div>
    )
  }

  if (step === 'result') {
    const score = Math.round((correct / total) * 100)
    const passed = score >= phase.passScore
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span
          className="cap-skew-plate flex h-16 w-16 items-center justify-center"
          style={{ background: passed ? '#eafff2' : '#fdeaea' }}
        >
          {passed ? (
            <Trophy className="h-8 w-8 text-[#0d6b2e]" aria-hidden />
          ) : (
            <X className="h-8 w-8 text-[#b01226]" aria-hidden />
          )}
        </span>
        <h4 className="font-heading text-xl font-extrabold text-[var(--cap-bright)]">
          {passed ? 'Aprovado!' : 'Quase lá, operador!'} Nota: <span className="cap-num">{score}%</span>
        </h4>
        <p className="max-w-md text-base text-[var(--cap-text)]">
          {passed
            ? `Você acertou ${correct} de ${total}. O certificado da fase "${phase.name}" está liberado na aba Certificado.`
            : `Você acertou ${correct} de ${total} (mínimo ${phase.passScore}%). Revise os módulos e tente novamente — a melhor nota fica registrada.`}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={start}>
            <ScrollText className="mr-2 h-4 w-4" aria-hidden />
            Refazer prova
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="cap-mono cap-num text-sm font-bold text-[var(--cap-dim)]">
          Questão {idx + 1}/{total}
        </span>
        <Progress value={((idx + (checked ? 1 : 0)) / total) * 100} className="h-2" />
        <span className="cap-mono cap-num text-sm font-bold text-[var(--cap-cyan)]">{correct} ✓</span>
      </div>

      <p className="font-heading text-lg font-bold leading-snug text-[var(--cap-bright)]">{q.q}</p>

      <div className="grid gap-2" role="radiogroup" aria-label="Alternativas da questão">
        {q.options.map((opt, i) => {
          const isChoice = choice === i
          const reveal = checked && i === q.answer
          const wrong = checked && isChoice && i !== q.answer
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isChoice}
              disabled={checked}
              onClick={() => {
                setChoice(i)
                sfx.play('select')
              }}
              className={`rounded-xl border-2 px-4 py-3 text-left text-base font-semibold transition-all ${
                reveal
                  ? 'border-[#21a44a] bg-[#eafff2] text-[#0d6b2e]'
                  : wrong
                    ? 'border-[#c0182b] bg-[#fdeaea] text-[#7a0a18]'
                    : isChoice
                      ? 'border-[var(--cap-orange)] bg-[#fff7e6] text-[#8a5300]'
                      : 'border-[var(--cap-border)] bg-white text-[var(--cap-text)] hover:border-[var(--cap-border-strong)]'
              } ${checked ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="cap-mono mr-2 font-bold opacity-60">
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {checked && (
        <div
          className={`rounded-xl border-2 p-3 text-base ${
            lastRight
              ? 'border-[#21a44a]/50 bg-[#f2fff7] text-[#0d6b2e]'
              : 'border-[#c0182b]/40 bg-[#fff5f5] text-[#7a0a18]'
          }`}
        >
          <strong>{lastRight ? 'Correto! ' : 'Incorreto. '}</strong>
          {q.explain}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {!checked ? (
          <Button onClick={check} disabled={choice === null} className="cap-btn-primary">
            Confirmar resposta
          </Button>
        ) : (
          <Button onClick={next} className="cap-btn-primary">
            {idx + 1 < total ? 'Próxima questão' : 'Ver resultado'}
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  )
}

/* ============ aba do certificado ============ */

function CertificateTab({
  phase,
  progress,
  onIssued,
}: {
  phase: GamePhase
  progress: GameProgress
  onIssued: (cert: EarnedCertificate) => void
}) {
  const { toast } = useToast()
  const earned = progress.certificates[phase.id]
  const passed = (progress.examBest[phase.id] ?? 0) >= phase.passScore
  const [name, setName] = useState(progress.playerName)
  const [issuing, setIssuing] = useState(false)

  const issue = async () => {
    const holder = name.trim()
    if (holder.length < 3) {
      toast({ title: 'Nome muito curto', description: 'Digite ao menos 3 caracteres.', variant: 'destructive' })
      return
    }
    setIssuing(true)
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holderName: holder, phaseId: phase.id, score: progress.examBest[phase.id] ?? 0 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao emitir o certificado')
      const cert: EarnedCertificate = {
        code: data.code,
        holderName: data.holderName,
        score: data.score,
        issuedAt: data.issuedAt,
        area: data.area,
      }
      gameStore.setPlayerName(holder)
      onIssued(cert)
      sfx.play('complete')
      toast({
        title: 'Certificado emitido!',
        description: `Código de verificação: ${cert.code}`,
      })
    } catch (err) {
      toast({
        title: 'Erro ao emitir certificado',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIssuing(false)
    }
  }

  if (!passed) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Lock className="h-10 w-10 text-[var(--cap-dim)]" aria-hidden />
        <p className="max-w-sm text-base text-[var(--cap-text)]">
          O certificado de <strong>{phase.area}</strong> é liberado com nota ≥ {phase.passScore}%
          na prova desta fase.
        </p>
      </div>
    )
  }

  if (earned) {
    const issued = new Date(earned.issuedAt)
    return (
      <div className="flex flex-col gap-4 py-2">
        <div className="relative overflow-hidden rounded-2xl border-4 border-double border-[#c9a24b] bg-gradient-to-br from-[#fffdf5] via-[#fff8e8] to-[#fff3d6] p-5 text-center shadow-lg">
          <div className="pointer-events-none absolute inset-2 rounded-xl border border-[#c9a24b]/40" aria-hidden />
          <BadgeCheck className="mx-auto h-10 w-10 text-[#c9a24b]" aria-hidden />
          <p className="cap-mono mt-1 text-xs font-bold uppercase tracking-widest text-[#8a6a1f]">
            CAPYBER · Certificado Digital de Conhecimento
          </p>
          <h4 className="mt-2 font-heading text-2xl font-extrabold text-[var(--cap-bright)]">
            {earned.holderName}
          </h4>
          <p className="mt-1 text-base text-[var(--cap-text)]">
            concluiu com nota <strong className="cap-num">{earned.score}%</strong> a fase
          </p>
          <p className="font-heading text-xl font-extrabold text-[var(--cap-orange-deep)]">
            {phase.name} — {phase.area}
          </p>
          <p className="cap-mono mt-2 text-sm text-[var(--cap-dim)]">
            Emitido em {issued.toLocaleDateString('pt-BR')} · Verificação:{' '}
            <strong className="text-[var(--cap-cyan)]">{earned.code}</strong>
          </p>
          <p className="mt-1 text-xs text-[var(--cap-dim)]">
            Referências: {phase.certRef}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <a href={`/api/certificates/${earned.code}/pdf`} download>
            <Button className="cap-btn-primary">
              <Download className="mr-2 h-5 w-5" aria-hidden />
              Baixar certificado (PDF)
            </Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="rounded-xl border-2 border-[var(--cap-border)] bg-white p-4 text-center">
        <Award className="mx-auto h-10 w-10 text-[var(--cap-orange)]" aria-hidden />
        <h4 className="mt-2 font-heading text-xl font-extrabold text-[var(--cap-bright)]">
          Você passou em {phase.name}!
        </h4>
        <p className="mt-1 text-base text-[var(--cap-text)]">
          Emita o certificado digital de <strong>{phase.area}</strong> em PDF com código de
          verificação único.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`cert-name-${phase.id}`} className="sr-only">
          Nome completo para o certificado
        </label>
        <Input
          id={`cert-name-${phase.id}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo"
          maxLength={60}
          className="flex-1"
        />
        <Button onClick={issue} disabled={issuing} className="cap-btn-primary">
          {issuing ? (
            <GateSpiral size={18} spin title="Emitindo" />
          ) : (
            <Award className="mr-2 h-5 w-5" aria-hidden />
          )}
          Emitir certificado
        </Button>
      </div>
    </div>
  )
}

/* ============ conteúdo do card de missão (compartilhado chip/folha) ============ */

function QuestCardContent({
  currentPhase,
  currentObjective,
  clearedCount,
  xpPct,
  onOpenPhase,
}: {
  currentPhase: GamePhase | null
  currentObjective: string
  clearedCount: number
  xpPct: number
  /** abre o curso da fase atual sem precisar andar até o santuário */
  onOpenPhase?: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <Castle className="h-4 w-4 shrink-0 text-[#8a5300]" aria-hidden />
        <span className="cap-mono text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#8a5300]">
          Missão atual
        </span>
        {onOpenPhase && currentPhase && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenPhase()
            }}
            className="cap-mono ml-auto flex min-h-9 items-center gap-1 rounded-lg border-2 border-[#c9a227] bg-[#e07f0a] px-2.5 text-[0.72rem] font-extrabold uppercase tracking-wide text-white shadow transition-transform active:scale-95"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            Abrir fase {currentPhase.num}
          </button>
        )}
      </div>
      <p className="mt-1 font-heading text-base font-extrabold leading-tight text-[#3b2f1e] [text-shadow:0_1px_0_rgba(255,255,255,0.6)]">
        {currentPhase
          ? `Fase ${currentPhase.num} — ${currentPhase.name}`
          : 'Vale conquistado!'}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[#6b5a3f]">
        {currentObjective}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#0d6b2e]" aria-hidden />
        <div
          className="cap-xpbar h-2.5 min-w-0 flex-1"
          style={{ background: '#e0d0a8' }}
          role="progressbar"
          aria-label="Progresso de XP da trilha"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={xpPct}
        >
          <i style={{ width: `${xpPct}%` }} />
        </div>
        <span className="cap-mono cap-num text-xs font-bold text-[#6b5a3f]">
          {clearedCount}/{GAME_PHASES.length}
        </span>
      </div>
    </>
  )
}

/* ============ diálogo da fase ============ */

function PhaseDialog({
  phaseId,
  progress,
}: {
  phaseId: string
  progress: GameProgress
}) {
  const [tab, setTab] = useState<'curso' | 'prova' | 'cert'>('curso')
  const phase = getPhase(phaseId)
  if (!phase) return null
  const lessonsTotal = phase.lessons.length
  const lessonsDone = phase.lessons.filter((l) =>
    progress.lessonsDone.includes(`${phase.id}:${l.id}`),
  ).length
  const allLessons = lessonsDone === lessonsTotal
  const passed = (progress.examBest[phase.id] ?? 0) >= phase.passScore
  const cert = progress.certificates[phase.id]

  const completeLesson = (lessonId: string) => {
    if (gameStore.completeLesson(phase.id, lessonId)) sfx.play('coin')
  }

  return (
    <DialogContent className="top-auto bottom-0 left-0 max-h-[94dvh] w-full max-w-[100vw] translate-x-0 translate-y-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-t-2xl rounded-b-none border-x-0 border-b-0 border-t-2 border-[var(--cap-border-strong)] bg-[var(--cap-panel)] p-0 [&>*]:min-w-0 sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:max-h-[92vh] sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:grid-rows-none sm:gap-4 sm:rounded-2xl sm:border-2">
      <div className="cap-panel rounded-t-2xl px-4 pb-4 pt-5 sm:px-5 sm:py-4">
        <div className="flex items-start gap-3">
          <span className="cap-skew-plate flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12">
            {phase.id === 'boss' ? (
              <ShieldCheck className="h-6 w-6 text-[var(--cap-glow)]" aria-hidden />
            ) : (
              <span className="font-heading text-2xl font-extrabold text-[var(--cap-bright)]">
                {phase.num}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="break-words font-heading text-lg font-extrabold leading-tight text-[var(--cap-bright)] sm:text-2xl">
              Fase {phase.num} — {phase.name}
            </DialogTitle>
            <DialogDescription className="mt-0.5 break-words text-sm text-[var(--cap-text)] sm:text-base">
              <strong>{phase.area}</strong> · referências {phase.certRef}
            </DialogDescription>
          </div>
          <span className="cap-mono hidden items-center gap-1 rounded-full bg-[#fff7e6] px-3 py-1 text-sm font-bold text-[#8a5300] sm:flex">
            <Coins className="h-4 w-4" aria-hidden /> +{phase.coins}
          </span>
        </div>
        <p className="mt-2 break-words text-sm text-[var(--cap-text)] sm:text-base">{phase.intro}</p>
      </div>

      <div className="min-h-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 sm:px-5 sm:pb-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="mb-3 grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-[#e2eefc] p-1">
            <TabsTrigger
              value="curso"
              className="rounded-lg px-1 py-2 font-heading text-[0.8rem] font-bold leading-tight data-[state=active]:bg-white data-[state=active]:shadow sm:text-base"
            >
              <BookOpen className="mr-1 h-4 w-4 shrink-0 sm:mr-1.5" aria-hidden />
              <span className="truncate">
                Curso <span className="cap-num">({lessonsDone}/{lessonsTotal})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="prova"
              className="rounded-lg px-1 py-2 font-heading text-[0.8rem] font-bold leading-tight data-[state=active]:bg-white data-[state=active]:shadow sm:text-base"
            >
              <ScrollText className="mr-1 h-4 w-4 shrink-0 sm:mr-1.5" aria-hidden />
              <span className="truncate">
                Prova {passed ? <span className="cap-num">· {progress.examBest[phase.id]}%</span> : ''}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="cert"
              className="rounded-lg px-1 py-2 font-heading text-[0.8rem] font-bold leading-tight data-[state=active]:bg-white data-[state=active]:shadow sm:text-base"
            >
              <Award className="mr-1 h-4 w-4 shrink-0 sm:mr-1.5" aria-hidden />
              <span className="truncate">Certificado {cert ? '· ✓' : ''}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curso" className="mt-0">
            <div className="cap-scroll-slim h-[42dvh] overflow-y-auto overscroll-contain rounded-lg pr-1.5 sm:h-[46vh] sm:pr-3">
              <div className="cap-stagger flex flex-col gap-3">
                {phase.lessons.map((l, i) => {
                  const done = progress.lessonsDone.includes(`${phase.id}:${l.id}`)
                  return (
                    <article
                      key={l.id}
                      className={`min-w-0 rounded-xl border-2 bg-white p-3 transition-colors sm:p-4 ${
                        done ? 'border-[#21a44a]/60' : 'border-[var(--cap-border)]'
                      }`}
                    >
                      <header className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold ${
                            done ? 'bg-[#21a44a] text-white' : 'bg-[#e2eefc] text-[var(--cap-cyan)]'
                          }`}
                        >
                          {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                        </span>
                        <h4 className="min-w-0 break-words font-heading text-base font-extrabold leading-snug text-[var(--cap-bright)] sm:text-lg">
                          {l.title}
                        </h4>
                        <span className="cap-mono cap-num ml-auto flex shrink-0 items-center gap-1 text-sm text-[var(--cap-dim)]">
                          <Timer className="h-3.5 w-3.5" aria-hidden />
                          {l.minutes} min
                        </span>
                      </header>

                      <div className="mt-2 min-w-0 space-y-2 text-[0.925rem] leading-relaxed text-[var(--cap-text)] sm:text-base [overflow-wrap:anywhere]">
                        {l.body.map((p, j) => (
                          <p key={j}>{p}</p>
                        ))}
                      </div>

                      {l.code && (
                        <figure className="mt-3 overflow-hidden rounded-lg border-2 border-[#0d2038]/80 bg-[#0d2038]">
                          <figcaption className="flex items-center justify-between bg-[#12335a] px-3 py-1.5">
                            <span className="cap-mono text-xs font-bold text-[#9fdcff]">
                              {l.code.caption}
                            </span>
                            <span className="cap-mono rounded bg-white/10 px-1.5 py-0.5 text-[0.7rem] font-bold uppercase text-[#ffe08a]">
                              {l.code.lang}
                            </span>
                          </figcaption>
                          <pre className="max-h-64 overflow-auto p-3 text-[0.85rem] leading-relaxed text-[#d9ecff]">
                            <code>{l.code.content}</code>
                          </pre>
                        </figure>
                      )}

                      <ul className="mt-3 min-w-0 space-y-1.5 [overflow-wrap:anywhere]">
                        {l.keyPoints.map((kp, j) => (
                          <li key={j} className="flex items-start gap-2 text-[0.925rem] text-[var(--cap-text)] sm:text-base">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cap-orange)]" aria-hidden />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 flex justify-end">
                        {done ? (
                          <span className="flex items-center gap-1.5 rounded-full bg-[#eafff2] px-3 py-1.5 text-sm font-bold text-[#0d6b2e]">
                            <Check className="h-4 w-4" aria-hidden /> Módulo concluído
                          </span>
                        ) : (
                          <Button size="sm" onClick={() => completeLesson(l.id)} className="cap-btn-primary">
                            <GraduationCap className="mr-1.5 h-4 w-4" aria-hidden />
                            Concluir módulo (+5 moedas)
                          </Button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
            {!allLessons && (
              <p className="mt-2 rounded-lg bg-[#fff7e6] px-3 py-2 text-sm font-semibold text-[#8a5300]">
                Conclua todos os módulos ({lessonsDone}/{lessonsTotal}) para liberar a prova.
              </p>
            )}
          </TabsContent>

          <TabsContent value="prova" className="mt-0">
            {allLessons ? (
              <div className="cap-scroll-slim h-[42dvh] overflow-y-auto overscroll-contain rounded-lg pr-1.5 sm:h-[46vh] sm:pr-3">
                <ExamRunner
                  phase={phase}
                  onFinish={(score, passedNow) => {
                    gameStore.recordExam(phase.id, score)
                    if (passedNow) {
                      gameStore.clearPhase(phase.id, phase.coins)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Lock className="h-10 w-10 text-[var(--cap-dim)]" aria-hidden />
                <p className="max-w-sm text-base text-[var(--cap-text)]">
                  A prova é liberada após concluir os <strong>{lessonsTotal} módulos</strong> do
                  curso desta fase.
                </p>
                <Progress value={(lessonsDone / lessonsTotal) * 100} className="h-2 w-48" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="cert" className="mt-0">
            <div className="cap-scroll-slim h-[42dvh] overflow-y-auto overscroll-contain rounded-lg pr-1.5 sm:h-[46vh] sm:pr-3">
              <CertificateTab
                phase={phase}
                progress={progress}
                onIssued={(c) => gameStore.saveCertificate(phase.id, c)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  )
}

/* ============ coleção de certificados ============ */

function CertificateCollection({
  open,
  onOpenChange,
  progress,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  progress: GameProgress
}) {
  const earned = GAME_PHASES.filter((p) => progress.certificates[p.id])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-2 border-[var(--cap-border-strong)] bg-[var(--cap-panel)]">
        <DialogTitle className="font-heading text-2xl font-extrabold text-[var(--cap-bright)]">
          <Award className="mr-2 inline h-6 w-6 text-[var(--cap-orange)]" aria-hidden />
          Meus certificados
        </DialogTitle>
        <DialogDescription className="text-base text-[var(--cap-text)]">
          Certificados digitais emitidos com verificação pública.
        </DialogDescription>
        <ScrollArea className="max-h-[50vh] pr-2">
          {earned.length === 0 ? (
            <p className="py-6 text-center text-base text-[var(--cap-dim)]">
              Nenhum certificado ainda — conclua a primeira fase!
            </p>
          ) : (
            <ul className="cap-stagger flex flex-col gap-2">
              {earned.map((p) => {
                const c = progress.certificates[p.id]
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border-2 border-[#c9a24b]/50 bg-[#fffdf5] p-3"
                  >
                    <BadgeCheck className="h-8 w-8 shrink-0 text-[#c9a24b]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-base font-extrabold text-[var(--cap-bright)]">
                        {p.area}
                      </p>
                      <p className="cap-mono cap-num truncate text-sm text-[var(--cap-dim)]">
                        {c.code} · {c.holderName} · {c.score}%
                      </p>
                    </div>
                    <a href={`/api/certificates/${c.code}/pdf`} download aria-label={`Baixar PDF ${p.area}`}>
                      <Button size="icon" variant="outline" aria-hidden>
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/* ============ diário de missões ============ */

function QuestJournal({
  open,
  onOpenChange,
  progress,
  phaseStates,
  onOpenPhase,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  progress: GameProgress
  phaseStates: Record<string, 'locked' | 'open' | 'done'>
  /** abre o curso da fase tocada (só quando liberada) */
  onOpenPhase?: (phaseId: string) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full gap-0 border-r-4 border-[#8a6a3f] bg-[#f5ecd7] p-0 sm:max-w-md"
      >
        <div className="border-b-2 border-[#c9b285] bg-gradient-to-b from-[#f2e6c4] to-[#e9d9b0] px-5 pb-4 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#8a6a3f] bg-[#e2cfa3]">
              <ScrollText className="h-5 w-5 text-[#8a5300]" aria-hidden />
            </span>
            <div className="min-w-0">
              <SheetTitle className="font-heading text-xl font-extrabold text-[#3b2f1e]">
                Diário de Missões
              </SheetTitle>
              <SheetDescription className="text-sm text-[#6b5a3f]">
                As sete provações do vale — curso, prova e certificado.
              </SheetDescription>
            </div>
          </div>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <ul className="flex flex-col pb-6">
            {GAME_PHASES.map((p) => {
              const st = phaseStates[p.id]
              const done = st === 'done'
              const clickable = (st === 'open' || done) && !!onOpenPhase
              const lessonsTotal = p.lessons.length
              const lessonsDone = p.lessons.filter((l) =>
                progress.lessonsDone.includes(`${p.id}:${l.id}`),
              ).length
              const best = progress.examBest[p.id] ?? 0
              const pct = done
                ? 100
                : Math.min(
                    99,
                    Math.round((lessonsDone / lessonsTotal) * 55 + (best / p.passScore) * 45),
                  )
              return (
                <li
                  key={p.id}
                  className="relative flex gap-3 border-b border-[#d8c49a] px-5 py-4 pr-10"
                >
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => {
                      if (!clickable) return
                      sfx.play('select')
                      onOpenChange(false)
                      onOpenPhase?.(p.id)
                    }}
                    aria-label={
                      clickable
                        ? `Abrir curso da fase ${p.id === 'boss' ? 'final' : p.num}: ${p.name}`
                        : `Fase ${p.id === 'boss' ? 'final' : p.num} bloqueada`
                    }
                    className="absolute inset-0 z-[1] text-left disabled:cursor-default"
                  />
                  {done && (
                    <span
                      className="absolute right-7 top-0 h-11 w-5 bg-gradient-to-b from-[#21a44a] to-[#0d6b2e] shadow"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)' }}
                      aria-hidden
                    />
                  )}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 font-heading text-lg font-extrabold ${
                      done
                        ? 'border-[#0d6b2e] bg-[#0d6b2e] text-[#f5ecd7]'
                        : st === 'open'
                          ? 'border-[#b45309] bg-[#e07f0a] text-[#fff7e6]'
                          : 'border-[#a08c66] bg-[#e2d4b2] text-[#8a7a5a]'
                    }`}
                  >
                    {p.id === 'boss' ? '★' : p.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-base font-extrabold text-[#3b2f1e] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]">
                      {p.id === 'boss' ? 'Chefe final — ' : ''}
                      {p.name}
                    </p>
                    <p className="text-sm text-[#6b5a3f]">{p.area}</p>
                    <p className="mt-1 text-sm font-semibold text-[#8a5300]">
                      {done
                        ? 'Prova aprovada — castelo conquistado!'
                        : st === 'open'
                          ? (
                            <>
                              Módulos: <span className="cap-num">{lessonsDone}/{lessonsTotal}</span> · melhor nota:{' '}
                              <span className="cap-num">{best}%</span>
                            </>
                          )
                          : 'Aprove a fase anterior para abrir este castelo'}
                    </p>
                    {clickable && (
                      <p className="cap-mono mt-1 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#b45309]">
                        toque para {done ? 'revisar a fase' : 'fazer o curso'} →
                      </p>
                    )}
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dcc9a0]">
                      <div
                        className={`h-full rounded-full ${done ? 'bg-[#0d6b2e]' : 'bg-[#b45309]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`absolute bottom-3 right-4 rotate-6 rounded border-2 px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-wider ${
                      done
                        ? 'border-[#0d6b2e] text-[#0d6b2e]'
                        : st === 'open'
                          ? 'border-[#b45309] text-[#b45309]'
                          : 'border-[#a08c66] text-[#8a7a5a]'
                    }`}
                  >
                    {done ? 'Feita' : st === 'open' ? 'Ativa' : 'Futura'}
                  </span>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

/* ============ view principal ============ */

export function TrilhaView3D() {
  const progress = useSyncExternalStore(gameStore.subscribe, gameStore.get, gameStore.getServer)
  const [nearPhase, setNearPhase] = useState<string | null>(null)
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  // no mobile o card de missão começa recolhido (chip) para não cobrir o jogo
  const [questOpen, setQuestOpen] = useState(false)
  const sfxOn = useSyncExternalStore(sfx.subscribe, sfx.getSnapshot, sfx.getServerSnapshot)
  const { toast } = useToast()

  // estados dos santuários no mapa 3D
  const phaseStates = useMemo(() => {
    const states: Record<string, 'locked' | 'open' | 'done'> = {}
    let prevPassed = true
    for (const p of GAME_PHASES) {
      const passed = (progress.examBest[p.id] ?? 0) >= p.passScore
      states[p.id] = passed ? 'done' : prevPassed ? 'open' : 'locked'
      prevPassed = passed
    }
    return states
  }, [progress])

  const tryOpen = useCallback(
    (id: string) => {
      const state = phaseStates[id]
      const phase = getPhase(id)
      if (!phase) return
      if (state === 'locked') {
        sfx.play('wrong')
        toast({
          title: 'Santuário trancado',
          description: `Aprove a prova da fase anterior para liberar "${phase.name}".`,
          variant: 'destructive',
        })
        return
      }
      gameInput.interact = false
      sfx.play('select')
      setOpenPhaseId(id)
    },
    [phaseStates, toast],
  )

  // teclado + eventos do barramento
  useEffect(() => attachKeyboard(), [])

  // portão de entrada: abre épico uma vez por sessão
  useEffect(() => {
    const KEY = 'capyber.trilha3d.gate'
    try {
      if (sessionStorage.getItem(KEY)) return
    } catch {
      /* noop */
    }
    const show = window.setTimeout(() => setGateOpen(true), 50)
    const hide = window.setTimeout(() => {
      setGateOpen(false)
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        /* noop */
      }
    }, 1850)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [])

  useEffect(
    () =>
      onGameEvent((e) => {
        if (e.type === 'openPhase') tryOpen(e.phaseId)
        else if (e.type === 'proximity') setNearPhase(e.phaseId)
      }),
    [tryOpen],
  )

  // pausa o movimento enquanto um diálogo está aberto
  useEffect(() => {
    gameFlags.paused = openPhaseId !== null
    if (openPhaseId === null) {
      gameInput.interact = false
      releaseJoystick()
    }
    return () => {
      gameFlags.paused = false
    }
  }, [openPhaseId])

  const clearedCount = GAME_PHASES.filter((p) => (progress.examBest[p.id] ?? 0) >= p.passScore).length
  const lessonsDoneCount = progress.lessonsDone.length
  const certsCount = Object.keys(progress.certificates).length
  const nearData = nearPhase ? getPhase(nearPhase) : null
  const nearState = nearPhase ? phaseStates[nearPhase] : null

  // missão atual = primeira fase ainda aberta (alimenta a quest card do HUD)
  const currentPhase = useMemo(
    () => GAME_PHASES.find((p) => phaseStates[p.id] === 'open') ?? null,
    [phaseStates],
  )
  const currentObjective = useMemo(() => {
    if (!currentPhase) return 'Vale conquistado! Você provou seu valor em todas as provações.'
    const total = currentPhase.lessons.length
    const done = currentPhase.lessons.filter((l) =>
      progress.lessonsDone.includes(`${currentPhase.id}:${l.id}`),
    ).length
    const best = progress.examBest[currentPhase.id] ?? 0
    if (done < total) return `Conclua os módulos do curso (${done}/${total}).`
    if (best < currentPhase.passScore)
      return `Aprove a prova com ≥ ${currentPhase.passScore}% (melhor nota: ${best}%).`
    if (!progress.certificates[currentPhase.id]) return 'Emita seu certificado em PDF desta fase.'
    return 'Fase limpa — siga para o próximo castelo!'
  }, [currentPhase, progress])
  const xpPct = Math.round((clearedCount / GAME_PHASES.length) * 100)

  return (
    <section className="space-y-4" aria-label="Trilha 3D — RPG de cursos e provas Blue Team">
      {/* barra de status */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cap-panel flex items-center gap-3 p-3">
          <span className="cap-skew-plate flex h-11 w-11 items-center justify-center">
            <Gamepad2 className="h-6 w-6 text-[var(--cap-cyan)]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="cap-eyebrow">RPG · Blue Team</p>
            <p className="font-heading text-base font-extrabold leading-tight text-[var(--cap-bright)]">
              Trilha 3D · Vale dos Fantasmas
            </p>
            <p className="text-sm text-[var(--cap-dim)]">
              <span className="cap-num font-bold text-[var(--cap-text)]">
                {clearedCount}/{GAME_PHASES.length}
              </span>{' '}
              fases aprovadas
            </p>
          </div>
        </div>
        <div className="cap-panel flex items-center gap-3 p-3">
          <span className="cap-skew-plate flex h-11 w-11 items-center justify-center">
            <Coins className="h-6 w-6 text-[var(--cap-orange-deep)]" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-base font-extrabold text-[var(--cap-bright)]">
              <span className="cap-num">{progress.coins}</span> moedas
            </p>
            <p className="text-sm text-[var(--cap-dim)]">
              <span className="cap-num font-bold">{lessonsDoneCount}</span> módulos estudados
            </p>
          </div>
        </div>
        <div className="cap-panel flex items-center gap-3 p-3">
          <span className="cap-skew-plate flex h-11 w-11 items-center justify-center">
            <Award className="h-6 w-6 text-[#c9a24b]" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-base font-extrabold text-[var(--cap-bright)]">
              <span className="cap-num">{certsCount}</span> certificado{certsCount === 1 ? '' : 's'}
            </p>
            <button
              className="-ml-1 inline-flex min-h-10 items-center rounded px-2 text-sm font-bold text-[var(--cap-cyan)] underline-offset-2 hover:underline"
              onClick={() => setCollectionOpen(true)}
            >
              abrir coleção →
            </button>
          </div>
        </div>
        <div className="cap-panel flex items-center gap-3 p-3">
          <span className="cap-skew-plate flex h-11 w-11 items-center justify-center">
            <KeyRound className="h-6 w-6 text-[var(--cap-glow)]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-base font-extrabold text-[var(--cap-bright)]">
              Controles
            </p>
            <p className="truncate text-sm text-[var(--cap-dim)]">
              WASD/setas · <strong>E</strong> interage · joystick no toque
            </p>
          </div>
        </div>
      </div>

      {/* mundo 3D — moldura de castelo com filete dourado */}
      <div className="relative" id="trilha-fs-root" data-fs-root data-tut="trilha-canvas">
        <div className="fs-frame relative rounded-[22px] bg-gradient-to-b from-[#5b6472] via-[#454e5c] to-[#38404c] p-[9px] shadow-[0_18px_50px_-12px_rgba(13,32,56,0.55)]">
          {/* rebites da moldura de pedra */}
          <span className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full bg-[#2c333d] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]" aria-hidden />
          <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-[#2c333d] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]" aria-hidden />
          <span className="absolute bottom-3 left-3 h-1.5 w-1.5 rounded-full bg-[#2c333d] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]" aria-hidden />
          <span className="absolute bottom-3 right-3 h-1.5 w-1.5 rounded-full bg-[#2c333d] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]" aria-hidden />

          <div className="fs-inner relative rounded-[16px] border-[3px] border-[#c9a227] bg-[#1d2a3d] p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_2px_14px_rgba(0,0,0,0.5)]">
            <CornerOrnament className="-left-2 -top-2" />
            <CornerOrnament className="-right-2 -top-2" />
            <CornerOrnament className="-bottom-2 -left-2" />
            <CornerOrnament className="-bottom-2 -right-2" />

            <div className="fs-stage relative h-[62vh] min-h-[440px] w-full overflow-hidden rounded-[12px] bg-[#f3d9ae] sm:h-[68vh]">
              <Safe3DBoundary title="Vale dos Fantasmas">
                <GameCanvas phaseStates={phaseStates} onProximity={setNearPhase} />
              </Safe3DBoundary>

              {/* vinheta cinematográfica */}
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  background:
                    'radial-gradient(115% 90% at 50% 40%, transparent 58%, rgba(24,17,6,0.3) 100%)',
                }}
                aria-hidden
              />

              {/* HUD superior: fases · ações · missão atual */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-2.5 sm:p-3">
                {/* faixa de fases + moedas */}
                <div className="pointer-events-auto order-1 flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-[#c9a227]/60 bg-[#221c12]/85 px-2.5 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-sm sm:order-1">
                  {GAME_PHASES.map((p) => {
                    const passed = (progress.examBest[p.id] ?? 0) >= p.passScore
                    const st = phaseStates[p.id]
                    return (
                      <span
                        key={p.id}
                        title={`Fase ${p.num} — ${p.name}`}
                        className={`flex h-7 min-w-7 items-center justify-center rounded-md border px-1 text-xs font-extrabold ${
                          passed
                            ? 'border-[#3ddc84]/60 bg-[#0d6b2e] text-white'
                            : st === 'open'
                              ? 'border-[#ffd27a]/70 bg-[#f5920b] text-white shadow-[0_0_12px_rgba(245,146,11,0.55)]'
                              : 'border-white/15 bg-white/10 text-white/45'
                        }`}
                      >
                        {p.num}
                      </span>
                    )
                  })}
                  <span className="cap-mono cap-num ml-1 flex items-center gap-1 rounded-md border border-[#ffd27a]/40 bg-[#3a2c12]/90 px-2 py-0.5 text-sm font-bold text-[#ffd27a]">
                    <Coins className="h-3.5 w-3.5" aria-hidden />
                    {progress.coins}
                  </span>
                </div>

                {/* botões circulares ornamentados */}
                <div className="pointer-events-auto order-2 flex gap-2 sm:order-3">
                  <RoundHUDButton
                    label="Abrir Diário de Missões"
                    dataTut="trilha-journal"
                    onClick={() => setJournalOpen(true)}
                  >
                    <ScrollText className="h-5 w-5" aria-hidden />
                  </RoundHUDButton>
                  <RoundHUDButton
                    label="Abrir coleção de certificados"
                    badge={certsCount}
                    onClick={() => setCollectionOpen(true)}
                  >
                    <Award className="h-5 w-5 text-[#e9c767]" aria-hidden />
                  </RoundHUDButton>
                  <RoundHUDButton
                    label={sfxOn ? 'Desativar efeitos sonoros' : 'Ativar efeitos sonoros'}
                    onClick={() => sfx.setEnabled(!sfxOn)}
                  >
                    {sfxOn ? (
                      <Volume2 className="h-5 w-5" aria-hidden />
                    ) : (
                      <VolumeX className="h-5 w-5" aria-hidden />
                    )}
                  </RoundHUDButton>
                  <TrilhaFullscreenButton />
                </div>

                {/* quest card: missão atual + XP com escudo */}
                {/* mobile: chip compacto recolhido — o jogo fica livre; toque expande */}
                <button
                  type="button"
                  onClick={() => setQuestOpen((v) => !v)}
                  aria-expanded={questOpen}
                  aria-label="Alternar card de missão atual"
                  data-tut="trilha-quest-card"
                  className={`pointer-events-auto order-3 flex max-w-full items-center gap-1.5 rounded-lg border border-[#c9a227]/70 bg-[#f5ecd7]/90 px-2.5 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-transform active:scale-95 sm:hidden ${
                    questOpen ? 'ring-2 ring-[#c9a227]/50' : ''
                  }`}
                >
                  <Castle className="h-3.5 w-3.5 shrink-0 text-[#8a5300]" aria-hidden />
                  <span className="cap-mono shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#8a5300]">
                    Missão
                  </span>
                  <span className="truncate text-xs font-extrabold text-[#3b2f1e]">
                    {currentPhase ? `Fase ${currentPhase.num} · ${currentPhase.short}` : 'Vale conquistado!'}
                  </span>
                  <span className="cap-mono cap-num shrink-0 text-[0.7rem] font-bold text-[#6b5a3f]">
                    {clearedCount}/{GAME_PHASES.length}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-[#8a5300] transition-transform duration-200 ${
                      questOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>

                {/* quest card desktop: missão atual + XP no topo */}
                <div className="pointer-events-auto hidden order-2 sm:block sm:w-[300px] lg:w-[340px]">
                  <div className="relative rounded-xl border-2 border-[#c9a227]/80 bg-[#f5ecd7]/95 p-3 shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
                    <QuestCardContent
                      currentPhase={currentPhase}
                      currentObjective={currentObjective}
                      clearedCount={clearedCount}
                      xpPct={xpPct}
                      onOpenPhase={() => tryOpen(currentPhase?.id ?? '')}
                    />
                  </div>
                </div>
              </div>

              {/* mobile: card de missão abre como folha inferior sobre o jogo — nunca cobre a cena inteira */}
              <AnimatePresence>
                {questOpen && (
                  <motion.div
                    initial={{ y: 90, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 90, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="pointer-events-auto absolute inset-x-2 bottom-2 z-40 sm:hidden"
                  >
                  <div className="relative rounded-xl border-2 border-[#c9a227]/80 bg-[#f5ecd7]/97 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setQuestOpen(false)}
                      aria-label="Fechar card de missão"
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-[#6b5a3f] transition-colors hover:bg-[#3b2f1e]/10 active:scale-90"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                    <QuestCardContent
                      currentPhase={currentPhase}
                      currentObjective={currentObjective}
                      clearedCount={clearedCount}
                      xpPct={xpPct}
                      onOpenPhase={() => {
                        setQuestOpen(false)
                        tryOpen(currentPhase?.id ?? '')
                      }}
                    />
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* certificados conquistados — fichas de inventário */}
              {certsCount > 0 && (
                <div className="pointer-events-auto absolute bottom-3 right-3 z-20 flex max-w-[46vw] flex-wrap justify-end gap-1.5 sm:max-w-[250px]">
                  {GAME_PHASES.filter((p) => progress.certificates[p.id]).map((p) => {
                    const cert = progress.certificates[p.id]
                    return (
                      <span
                        key={p.id}
                        title={`${p.area} — certificado ${cert.code}`}
                        className="flex items-center gap-1 rounded-lg border border-[#c9a227]/70 bg-[#221c12]/85 px-2 py-1 text-xs font-bold text-[#f5ecd7] shadow backdrop-blur-sm"
                      >
                        <Award className="h-3.5 w-3.5 text-[#e9c767]" aria-hidden />
                        {p.short}
                        <span className="text-[#9fdcff]">{cert.score}%</span>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* prompt de interação */}
              {nearData && !openPhaseId && (
                <div className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 sm:bottom-5">
                  <button
                    onClick={() => requestInteract()}
                    className={`pointer-events-auto flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-heading text-sm font-extrabold shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform hover:scale-105 sm:text-base ${
                      nearState === 'locked'
                        ? 'border-[#8a6a3f] bg-[#e9dcc0] text-[#6b5a3f]'
                        : 'border-[#c9a227] bg-[#f5ecd7] text-[#3b2f1e]'
                    }`}
                  >
                    {nearState === 'locked' ? (
                      <Lock className="h-5 w-5" aria-hidden />
                    ) : (
                      <KeyRound className="h-5 w-5 text-[#b45309]" aria-hidden />
                    )}
                    {nearState === 'locked'
                      ? `Trancado — aprove a fase anterior`
                      : `Abrir ${nearData.id === 'boss' ? 'o chefe' : `fase ${nearData.num}`}: ${nearData.short}`}
                    <span className="cap-mono rounded-md border border-[#f5ecd7]/40 bg-[#3b2f1e] px-1.5 py-0.5 text-xs text-[#f5ecd7]">
                      E
                    </span>
                  </button>
                </div>
              )}

              <Joystick />

              {/* entrada épica: portão abrindo (1× por sessão) */}
              <AnimatePresence>{gateOpen && <GateIntro />}</AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* rodapé informativo */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="cap-panel p-4">
          <p className="cap-eyebrow">Etapa 1 · Aprendizagem</p>
          <h3 className="cap-heading mb-1.5 mt-1.5 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[var(--cap-cyan)]" aria-hidden />
            Curso antes da prova
          </h3>
          <p className="text-base text-[var(--cap-text)]">
            Cada santuário guarda um curso técnico com módulos, comandos e consultas reais
            (KQL, YARA, Zeek). Conclua os módulos para liberar a prova.
          </p>
        </div>
        <div className="cap-panel p-4">
          <p className="cap-eyebrow">Etapa 2 · Avaliação</p>
          <h3 className="cap-heading mb-1.5 mt-1.5 flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-[var(--cap-cyan)]" aria-hidden />
            Provas estilo certificação
          </h3>
          <p className="text-base text-[var(--cap-text)]">
            Questões no formato dos exames CySA+, BTL1, SC-200, GCIH e eCIR — cenário,
            análise e explicação da resposta correta.
          </p>
        </div>
        <div className="cap-panel p-4">
          <p className="cap-eyebrow">Etapa 3 · Certificação</p>
          <h3 className="cap-heading mb-1.5 mt-1.5 flex items-center gap-2">
            <Award className="h-5 w-5 text-[#c9a24b]" aria-hidden />
            Certificado digital em PDF
          </h3>
          <p className="text-base text-[var(--cap-text)]">
            Aprovado? Emita o certificado de cada fase/tipo de conhecimento em PDF com
            código de verificação público.
          </p>
        </div>
      </div>

      {/* diálogo da fase */}
      <Dialog open={openPhaseId !== null} onOpenChange={(o) => !o && setOpenPhaseId(null)}>
        {openPhaseId && <PhaseDialog phaseId={openPhaseId} progress={progress} />}
      </Dialog>

      <QuestJournal
        open={journalOpen}
        onOpenChange={setJournalOpen}
        progress={progress}
        phaseStates={phaseStates}
        onOpenPhase={tryOpen}
      />

      <CertificateCollection
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
        progress={progress}
      />
    </section>
  )
}
