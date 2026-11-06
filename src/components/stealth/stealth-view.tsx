'use client'

// CAPYBER — SALA SEGURA · "Operação Capivara Silenciosa" (v2)
// ─────────────────────────────────────────────────────────────────────────────
// Quarto 3D (livros + computador + menino de capuz digitando) com:
//   1) CURSO interativo de privacidade/OPSEC no PC (8 módulos + quiz);
//   2) MISSÕES simuladas ("hackear de mentira") contra alvos FICTÍCIOS do
//      laboratório CAPYBER — cada decisão deixa traço digital; traço ≥ 5 na
//      missão = RASTREADO: a polícia invade o quarto em 3D e o jogador perde
//      1 das 5 vidas (prisões). Completar as 8 missões sem prisões = VITÓRIA
//      + Certificado de Operador Inrastreável.
// v2 — REGIA NO QUARTO:
//   · câmera dinâmica com presets (orbital/PC/porta/janela/cama/cinema)
//   · invasão cinematográfica: BATIDAS → ARROMBAMENTO → agentes caminham
//   · tela cheia imersiva do quarto (botão flutuante + tecla F)
//   · modo sonho (surreal) e portal secreto no pôster
// Tudo é educativo e defensivo: anti-doxing, higiene de OPSEC, proteção contra
// rastreamento — o mesmo conhecimento que protege jornalistas e ativistas.
// Progresso: localStorage "capy_stealth_progress".
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  BadgeCheck,
  BookOpen,
  Camera,
  Fingerprint,
  Gamepad2,
  GraduationCap,
  Monitor,
  Moon,
  ShieldCheck,
  Siren,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FullscreenButton, FullscreenHotkey } from '@/components/fullscreen-button'
import { GateSpiral } from '@/components/art'
import {
  COURSE_MODULES,
  FOOTPRINT_LIMIT,
  MAX_LIVES,
  MISSIONS,
  STORAGE_KEY,
  courseComplete,
  emptyProgress,
  type StealthProgress,
} from '@/lib/stealth-content'
import { CoursePanel } from './course-panel'
import { GamePanel, initialRun, type RunState } from './game-panel'
import { ProgressPanel } from './progress-panel'
import type { CamPreset, RaidStage } from './stealth-scene'

const StealthScene = dynamic(() => import('./stealth-scene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b1626]">
      <GateSpiral size={56} spin title="Abrindo a Sala Segura" />
      <p className="cap-mono text-sm font-bold text-[#7cb6ec]">montando o quarto…</p>
    </div>
  ),
})

type PcTab = 'curso' | 'missoes' | 'progresso'

/* ═════════════════════ áudio da invasão (WebAudio, só no jogo) ═════════════════════ */

/** Batidas secas na porta (3x) — tensão antes do arrombamento. */
function playKnocks(): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const times = [0.05, 0.55, 1.05]
    times.forEach((base) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(96, ctx.currentTime + base)
      osc.frequency.exponentialRampToValueAtTime(52, ctx.currentTime + base + 0.11)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + base)
      gain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + base + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + base + 0.13)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + base)
      osc.stop(ctx.currentTime + base + 0.16)
    })
    setTimeout(() => void ctx.close().catch(() => undefined), 2100)
  } catch {
    /* áudio indisponível */
  }
}

/** Estouro do arrombamento + sirene contínua. Retorna o cleanup. */
function startBreachAndSiren(): () => void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return () => undefined
    const ctx = new Ctx()

    // slam: ruído grave curto
    const slamOsc = ctx.createOscillator()
    const slamGain = ctx.createGain()
    slamOsc.type = 'square'
    slamOsc.frequency.setValueAtTime(70, ctx.currentTime)
    slamOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.22)
    slamGain.gain.setValueAtTime(0.0001, ctx.currentTime)
    slamGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.015)
    slamGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.26)
    slamOsc.connect(slamGain)
    slamGain.connect(ctx.destination)
    slamOsc.start()
    slamOsc.stop(ctx.currentTime + 0.3)

    // sirene com LFO (contínua até cleanup)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 640
    lfo.type = 'sine'
    lfo.frequency.value = 1.7
    lfoGain.gain.value = 190
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    gain.gain.value = 0.028
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + 0.4)
    lfo.start(ctx.currentTime + 0.4)
    return () => {
      try {
        osc.stop()
        lfo.stop()
        void ctx.close()
      } catch {
        /* ignore */
      }
    }
  } catch {
    return () => undefined
  }
}

/* ═══════════════════════════ CSS local (sirene/scroll) ═══════════════════════════ */

const STEALTH_CSS = `
@keyframes stealth-flash {
  from { opacity: 0.06; }
  to   { opacity: 0.52; }
}
.stealth-flash-red {
  background: radial-gradient(circle at 82% 18%, rgba(255,45,70,0.75), transparent 62%),
              radial-gradient(circle at 12% 85%, rgba(255,45,70,0.4), transparent 55%);
  animation: stealth-flash 0.55s ease-in-out infinite alternate;
}
.stealth-flash-blue {
  background: radial-gradient(circle at 14% 22%, rgba(47,123,216,0.75), transparent 62%),
              radial-gradient(circle at 88% 80%, rgba(47,123,216,0.4), transparent 55%);
  animation: stealth-flash 0.55s ease-in-out infinite alternate-reverse;
}
.stealth-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.stealth-scroll::-webkit-scrollbar-track { background: #0a1e33; border-radius: 8px; }
.stealth-scroll::-webkit-scrollbar-thumb { background: #1f4f79; border-radius: 8px; border: 2px solid #0a1e33; }
.stealth-scroll::-webkit-scrollbar-thumb:hover { background: #2a649b; }
/* camera chips escuros */
.cam-chip {
  font-family: var(--font-mono-prod), monospace;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #9fd0ff;
  background: rgba(7, 22, 40, 0.78);
  border: 1px solid rgba(84, 148, 212, 0.45);
  border-radius: 8px;
  padding: 6px 10px;
  min-height: 32px;
  backdrop-filter: blur(6px);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.cam-chip:hover { background: rgba(16, 42, 70, 0.92); color: #dff0ff; transform: translateY(-1px); }
.cam-chip[data-active='true'] {
  background: linear-gradient(180deg, #f5920b, #d97706);
  border-color: #ffd9a0;
  color: #10315c;
  text-shadow: none;
}
/* knock badge */
@keyframes knock-pop {
  0% { transform: scale(0.6); opacity: 0; }
  45% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.knock-pop { animation: knock-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes knock-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}
.knock-shake { animation: knock-shake 0.4s ease-in-out; }
`

const CAM_PRESET_UI: { id: CamPreset; label: string }[] = [
  { id: 'orbital', label: 'ORBITAL' },
  { id: 'pc', label: 'PC' },
  { id: 'porta', label: 'PORTA' },
  { id: 'janela', label: 'JANELA' },
  { id: 'cama', label: 'CAMA' },
  { id: 'cinema', label: 'CINEMA' },
]

/* ═══════════════════════════════ view ═══════════════════════════════ */

export function StealthView() {
  const [mounted, setMounted] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<StealthProgress>(emptyProgress)
  const [pcOpen, setPcOpen] = useState(false)
  const [tab, setTab] = useState<PcTab>('curso')
  const [lives, setLives] = useState(MAX_LIVES)
  const [run, setRun] = useState<RunState>(initialRun)
  const [soundOn, setSoundOn] = useState(true)
  const [camPreset, setCamPreset] = useState<CamPreset>('orbital')
  const [raidStage, setRaidStage] = useState<RaidStage>('none')
  const [raidOverlay, setRaidOverlay] = useState(false)
  const [dream, setDream] = useState(false)
  const [portal, setPortal] = useState(false)
  const posterClicks = useRef(0)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  const isTraced = run.phase === 'traced'
  const courseDone = courseComplete(progress)
  const stopSirenRef = useRef<(() => void) | null>(null)

  /* ---- montagem + progresso (localStorage) ---- */
  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StealthProgress>
        const modulesDone = Array.isArray(parsed.modulesDone)
          ? parsed.modulesDone.filter((id): id is string => typeof id === 'string')
          : []
        setProgress({
          modulesDone,
          bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
          victories: typeof parsed.victories === 'number' ? parsed.victories : 0,
          unlocked: Boolean(parsed.unlocked) || modulesDone.length >= COURSE_MODULES.length,
        })
      }
    } catch {
      /* localStorage indisponível: segue sem progresso */
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      /* ignore */
    }
  }, [progress, loaded])

  /* ---- REGIA DA INVASÃO: knock → breach → overlay (com som em cada fase) ---- */
  useEffect(() => {
    if (!isTraced) {
      setRaidStage('none')
      setRaidOverlay(false)
      return
    }
    setRaidOverlay(false)
    setRaidStage('knock')
    if (soundOn) playKnocks()
    const t1 = setTimeout(() => {
      setRaidStage('breach')
      if (soundOn) {
        stopSirenRef.current = startBreachAndSiren()
      }
    }, 1900)
    const t2 = setTimeout(() => setRaidOverlay(true), 3400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      stopSirenRef.current?.()
      stopSirenRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTraced]) // soundOn intencionalmente fora: não reinicia a cena ao mutar

  // sirene some ao desligar o som no meio da invasão
  useEffect(() => {
    if (!soundOn) {
      stopSirenRef.current?.()
      stopSirenRef.current = null
    }
  }, [soundOn])

  /* ---- Escape fecha o PC + foco no fechar ---- */
  useEffect(() => {
    if (!pcOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPcOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pcOpen])

  /* ---- atalho C: cicla presets de câmera ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      if (e.key.toLowerCase() !== 'c') return
      setCamPreset((p) => {
        const ids = CAM_PRESET_UI.map((c) => c.id)
        return ids[(ids.indexOf(p) + 1) % ids.length]
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ---- handlers ---- */

  const openPC = useCallback((which: PcTab) => {
    setTab(which)
    setPcOpen(true)
  }, [])

  const completeModule = useCallback((id: string) => {
    setProgress((p) => {
      if (p.modulesDone.includes(id)) return p
      const modulesDone = [...p.modulesDone, id]
      return { ...p, modulesDone, unlocked: p.unlocked || modulesDone.length >= COURSE_MODULES.length }
    })
  }, [])

  const choose = useCallback((optionIdx: number) => {
    setRun((prev) => {
      if (prev.phase !== 'playing' || prev.lastPick) return prev
      const mission = MISSIONS[prev.missionIdx]
      const stepIdx = prev.picks.length
      const opt = mission.steps[stepIdx]?.options[optionIdx]
      if (!opt) return prev
      const picks = [...prev.picks, optionIdx]
      const fp = picks.reduce((acc, oi, si) => acc + (mission.steps[si]?.options[oi]?.cost ?? 0), 0)
      return { ...prev, picks, lastPick: { step: stepIdx, optionIdx }, phase: fp >= FOOTPRINT_LIMIT ? 'traced' : 'playing' }
    })
  }, [])

  const ackStep = useCallback(() => {
    setRun((prev) => {
      if (prev.phase !== 'playing' || !prev.lastPick) return prev
      const mission = MISSIONS[prev.missionIdx]
      if (prev.picks.length < mission.steps.length) return { ...prev, lastPick: null }
      // missão concluída sem rastreamento: contabiliza escolhas seguras
      const missionSafe = mission.steps.reduce(
        (acc, s, si) => acc + (s.options[prev.picks[si]]?.cost === 0 ? 1 : 0),
        0,
      )
      const safeChoices = prev.safeChoices + missionSafe
      setProgress((p) => ({ ...p, bestScore: Math.max(p.bestScore, safeChoices) }))
      return { ...prev, phase: 'clear', lastPick: null, safeChoices }
    })
  }, [])

  const nextMission = useCallback(() => {
    setRun((prev) => {
      if (prev.phase !== 'clear') return prev
      if (prev.missionIdx >= MISSIONS.length - 1) {
        setProgress((p) => ({
          ...p,
          victories: p.victories + 1,
          bestScore: Math.max(p.bestScore, prev.safeChoices),
          unlocked: true,
        }))
        return { ...prev, phase: 'victory' }
      }
      return { missionIdx: prev.missionIdx + 1, picks: [], lastPick: null, phase: 'playing', safeChoices: prev.safeChoices }
    })
  }, [])

  const restartRun = useCallback(() => {
    setLives(MAX_LIVES)
    setRun(initialRun())
  }, [])

  const acceptArrest = useCallback(() => {
    const remaining = lives - 1
    setLives(remaining)
    setRun((prev) => {
      if (remaining <= 0) return { ...prev, phase: 'defeat', lastPick: null }
      return { ...prev, phase: 'playing', picks: [], lastPick: null }
    })
  }, [lives])

  const resetProgress = useCallback(() => {
    setProgress(emptyProgress())
    setLives(MAX_LIVES)
    setRun(initialRun())
  }, [])

  /* ---- easter egg: 3 cliques no pôster = PORTAL ---- */
  const onPosterClick = useCallback(() => {
    posterClicks.current += 1
    if (posterClicks.current >= 3) {
      posterClicks.current = 0
      setPortal(true)
      setTimeout(() => setPortal(false), 5200)
    }
  }, [])

  /* ---- erros que entregaram o jogador (overlay de prisão) ---- */
  const tracedErrors = useMemo(() => {
    if (!isTraced) return []
    const mission = MISSIONS[run.missionIdx]
    if (!mission) return []
    return run.picks.flatMap((oi, si) => {
      const opt = mission.steps[si]?.options[oi]
      if (!opt || opt.cost <= 0) return []
      return [{ n: si + 1, label: opt.label, feedback: opt.feedback, cost: opt.cost }]
    })
  }, [isTraced, run])

  const doneCount = COURSE_MODULES.filter((m) => progress.modulesDone.includes(m.id)).length

  return (
    <div id="stealth-fs-root" data-fs-root className="relative flex flex-col gap-4">
      <style>{STEALTH_CSS}</style>
      <FullscreenHotkey rootId="stealth-fs-root" />

      {/* ══════════ cabeçalho ══════════ */}
      <header className="cap-panel cap-fade-in flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="cap-chip cap-mono inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-[#10315c]">
              <ShieldCheck className="h-4 w-4 text-[#21a44a]" aria-hidden />
              SALA 04 · STEALTH OPS
            </span>
            <span className="cap-chip cap-mono inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-[#10315c]">
              100% SIMULAÇÃO · LAB CAPIBER
            </span>
          </div>
          <h1 className="cap-heading text-2xl sm:text-3xl">Sala Segura · Operação Capivara Silenciosa</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#3f6285] sm:text-base">
            Curso interativo de <strong>privacidade e OPSEC</strong> dentro de um quarto em 3D: aprenda a não ser
            rastreado (anti-doxing, higiene digital, o mesmo conhecimento que protege jornalistas e ativistas) e
            depois enfrente as 8 missões simuladas do laboratório. Deixou traço demais?{' '}
            <strong className="text-[#c0182b]">A polícia bate na porta e entra no seu quarto</strong> — você tem 5
            prisões antes do fim de jogo. Zero rastros nas 8 missões = vitória + certificado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="cap-chip inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-extrabold text-[#10315c]"
            role="status"
            aria-label={`Vidas restantes: ${lives} de ${MAX_LIVES}`}
          >
            <BadgeCheck className={`h-4 w-4 ${lives > 0 ? 'text-[#21a44a]' : 'text-[#c0182b]'}`} aria-hidden />
            {lives}/{MAX_LIVES} vidas
          </span>
          <span className="cap-chip inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-extrabold text-[#10315c]" role="status">
            <GraduationCap className="h-4 w-4 text-[#8b5cf6]" aria-hidden />
            curso {doneCount}/8
          </span>
          <span className="cap-chip inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-extrabold text-[#10315c]" role="status">
            <Trophy className="h-4 w-4 text-[#f5920b]" aria-hidden />
            {progress.victories} {progress.victories === 1 ? 'vitória' : 'vitórias'}
          </span>
          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Desativar sons do jogo (batidas e sirene)' : 'Ativar sons do jogo (batidas e sirene)'}
            title={soundOn ? 'Sons: ligados' : 'Sons: desligados'}
            className="cap-btn-ghost inline-flex min-h-[40px] items-center gap-1.5 px-3 text-sm"
          >
            {soundOn ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
            <span className="hidden sm:inline">{soundOn ? 'Sons' : 'Mudo'}</span>
          </button>
          <FullscreenButton label="Tela cheia" />
        </div>
      </header>

      {/* ══════════ cena 3D + painel lateral ══════════ */}
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* ---- container da cena (também é a moldura do PC e do raid) ---- */}
        <section
          data-fs-scene
          aria-label="Quarto 3D da Sala Segura"
          className="relative min-h-[320px] overflow-hidden rounded-xl border-2 border-[#10315c]/40 shadow-[0_18px_40px_-24px_rgba(16,49,92,0.6)]"
        >
          <div data-tut="stealth-canvas" className="fs-stage relative h-[46vh] min-h-[340px] w-full sm:h-[54vh] lg:h-[620px]">
            {mounted ? (
              <StealthScene
                raid={isTraced}
                raidStage={raidStage}
                camPreset={camPreset}
                dream={dream}
                pcOpen={pcOpen}
                onOpenPC={() => openPC('curso')}
                onPosterClick={onPosterClick}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b1626]">
                <GateSpiral size={56} spin title="Abrindo a Sala Segura" />
                <p className="cap-mono text-sm font-bold text-[#7cb6ec]">montando o quarto…</p>
              </div>
            )}

            {/* ── barra de regia: presets de câmera + modo sonho ── */}
            {mounted && !pcOpen && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-2 sm:flex-row sm:items-start sm:justify-between sm:p-3">
                <div
                  role="toolbar"
                  aria-label="Câmeras do quarto"
                  className="pointer-events-auto flex max-w-full flex-wrap gap-1.5 overflow-x-auto sm:flex-nowrap"
                >
                  <span className="cap-mono inline-flex items-center gap-1 rounded-md bg-[rgba(7,22,40,0.78)] px-2 py-1.5 text-[11px] font-extrabold tracking-widest text-[#7cb6ec]" aria-hidden>
                    <Camera className="h-3.5 w-3.5" /> CAM
                  </span>
                  {CAM_PRESET_UI.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="cam-chip shrink-0 cursor-pointer"
                      data-active={camPreset === c.id}
                      aria-pressed={camPreset === c.id}
                      onClick={() => setCamPreset(c.id)}
                      title={`Câmera ${c.label} (tecla C cicla)`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="pointer-events-auto flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDream((d) => !d)}
                    aria-pressed={dream}
                    title="Modo Sonho — a mobília flutua e a luz vira aurora"
                    className={`cam-chip inline-flex cursor-pointer items-center gap-1.5 ${dream ? 'border-[#c9a7ff] text-[#e6d5ff]' : ''}`}
                  >
                    <Moon className="h-3.5 w-3.5" aria-hidden />
                    {dream ? 'ACORDAR' : 'SONHAR'}
                  </button>
                  <FullscreenButton
                    label="Tela cheia"
                    target={() =>
                      document.querySelector<HTMLElement>('[data-fs-scene]')
                    }
                    className="!bg-[rgba(7,22,40,0.78)] !text-[#9fd0ff] !border !border-[rgba(84,148,212,0.45)] !rounded-lg !shadow-none !px-2.5 !min-h-[32px] hover:!bg-[rgba(16,42,70,0.92)]"
                  />
                </div>
              </div>
            )}

            {/* ── letreiro das batidas (antecipação!) ── */}
            {raidStage === 'knock' && (
              <div className="knock-pop absolute left-1/2 top-14 z-30 -translate-x-1/2 sm:top-16" aria-hidden>
                <p className="cap-mono knock-shake rounded-lg border-2 border-[#ff5f6d]/60 bg-[#1a0510]/85 px-4 py-2 text-sm font-extrabold tracking-[0.3em] text-[#ff8a97] shadow-[0_0_30px_rgba(255,60,80,0.35)]">
                 toc·toc·toc
                </p>
              </div>
            )}

            {/* vinheta cinematográfica sutil sempre ativa */}
            <div className="pointer-events-none absolute inset-0 z-10 hidden sm:block" style={{ background: 'radial-gradient(ellipse at center, transparent 62%, rgba(5,12,26,0.38) 100%)' }} aria-hidden />
          </div>

          {/* overlay: PC do quarto (curso / missões / progresso) */}
          {pcOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Computador do quarto — CAPY-OS"
              className="absolute inset-0 z-40 flex items-center justify-center p-2 sm:p-4"
            >
              <div className="absolute inset-0 bg-[#04101d]/85" onClick={() => setPcOpen(false)} aria-hidden />
              <div className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl border-[6px] border-[#0d1724] bg-[#06121f] shadow-[0_0_60px_rgba(47,123,216,0.4)]">
                {/* moldura do monitor */}
                <div className="flex items-center justify-between gap-2 border-b border-[#15324d] bg-[#0a1a2b] px-3 py-2">
                  <p className="cap-mono flex items-center gap-2 text-xs font-extrabold tracking-widest text-[#4ade80]">
                    <Monitor className="h-4 w-4" aria-hidden />
                    CAPY-OS · PC DO QUARTO
                  </p>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setPcOpen(false)}
                    aria-label="Fechar o computador (Esc)"
                    title="Fechar (Esc)"
                    className="dark-control inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#15324d] bg-[#0b2033] text-[#7cb6ec] transition-colors hover:bg-[#13293f]"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <Tabs
                  value={tab}
                  onValueChange={(v) => setTab(v as PcTab)}
                  className="flex min-h-0 flex-1 flex-col gap-0 p-2 sm:p-3"
                >
                  <TabsList className="cap-mono h-auto w-full justify-start gap-1 overflow-x-auto rounded-md border border-[#15324d] bg-[#0b2033] p-1">
                    <TabsTrigger
                      value="curso"
                      className="min-h-[38px] shrink-0 gap-1.5 rounded border border-transparent px-3 text-xs font-extrabold text-[#7cb6ec] data-[state=active]:border-[#2f7bd4] data-[state=active]:bg-[#0d2a45] data-[state=active]:text-[#d9ecff]"
                    >
                      <BookOpen className="h-4 w-4" aria-hidden /> CURSO ({doneCount}/8)
                    </TabsTrigger>
                    <TabsTrigger
                      value="missoes"
                      className="min-h-[38px] shrink-0 gap-1.5 rounded border border-transparent px-3 text-xs font-extrabold text-[#7cb6ec] data-[state=active]:border-[#f5920b] data-[state=active]:bg-[#2a1d05] data-[state=active]:text-[#ffe1b8]"
                    >
                      <Gamepad2 className="h-4 w-4" aria-hidden /> MISSÕES
                      {!courseDone && <Siren className="h-3.5 w-3.5 text-[#3f6f9f]" aria-hidden />}
                    </TabsTrigger>
                    <TabsTrigger
                      value="progresso"
                      className="min-h-[38px] shrink-0 gap-1.5 rounded border border-transparent px-3 text-xs font-extrabold text-[#7cb6ec] data-[state=active]:border-[#21a44a] data-[state=active]:bg-[#0d2a18] data-[state=active]:text-[#d8f5e0]"
                    >
                      <Fingerprint className="h-4 w-4" aria-hidden /> MEU PROGRESSO
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="curso" className="stealth-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
                    <CoursePanel modulesDone={progress.modulesDone} onCompleteModule={completeModule} />
                  </TabsContent>
                  <TabsContent value="missoes" className="stealth-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
                    <GamePanel
                      lives={lives}
                      run={run}
                      courseDone={courseDone}
                      modulesDoneCount={doneCount}
                      bestScore={progress.bestScore}
                      onChoose={choose}
                      onAckStep={ackStep}
                      onNextMission={nextMission}
                      onRestartRun={restartRun}
                    />
                  </TabsContent>
                  <TabsContent value="progresso" className="stealth-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
                    <ProgressPanel progress={progress} onReset={resetProgress} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {/* overlay: RASTREADO — polícia no quarto (só depois do cinema de entrada) */}
          {isTraced && raidOverlay && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label="Você foi rastreado — a polícia entrou no seu quarto"
              className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
            >
              <div className="stealth-flash-red absolute inset-0" aria-hidden />
              <div className="stealth-flash-blue absolute inset-0" aria-hidden />
              <div className="cap-danger-panel cap-fade-in relative z-10 max-h-full w-full max-w-xl overflow-y-auto p-5 sm:p-6">
                <div className="mb-2 flex items-center gap-3">
                  <Siren className="h-9 w-9 shrink-0 text-[#ff5f6d]" aria-hidden />
                  <h3 className="cap-heading text-2xl text-[#ffd7dc] sm:text-3xl">RASTREADO!</h3>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-[#ffe9ec]">
                  A porta se abriu: <strong>2 policiais entraram no seu quarto</strong> (no jogo!). O traço digital
                  da missão chegou a <strong className="cap-mono">{FOOTPRINT_LIMIT}/{FOOTPRINT_LIMIT}</strong> — cada
                  escolha arriscada deixou uma pista, e agora elas contam a sua história:
                </p>
                <ul className="mb-3 flex flex-col gap-2">
                  {tracedErrors.map((err) => (
                    <li key={err.n} className="cap-danger-card p-3">
                      <p className="cap-mono mb-1 text-xs font-extrabold text-[#ffb3bd]">
                        DECISÃO {err.n} · traço +{err.cost} — “{err.label}”
                      </p>
                      <p className="text-sm leading-relaxed text-[#ffe9ec]">{err.feedback}</p>
                    </li>
                  ))}
                  {tracedErrors.length === 0 && (
                    <li className="cap-danger-card p-3 text-sm text-[#ffe9ec]">
                      A soma dos pequenos traços desta missão entregou a operação.
                    </li>
                  )}
                </ul>
                <p className="mb-4 text-sm leading-relaxed text-[#ffd7dc]">
                  <strong>Lição de OPSEC:</strong> no mundo real, é assim que investigações montam um dossiê —
                  não por um erro gigante, mas pela soma de escolhas descuidadas. Revise o módulo do curso que
                  trata dessa etapa e tente de novo com tudo limpo.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={acceptArrest}
                    className="cap-btn-primary inline-flex min-h-[44px] items-center gap-2 px-5 text-sm"
                  >
                    <Siren className="h-4 w-4" aria-hidden />
                    Assumir a prisão (−1 vida · restam {Math.max(0, lives - 1)})
                  </button>
                  <span className="cap-mono text-xs text-[#ffb3bd]">
                    missão {String(run.missionIdx + 1).padStart(2, '0')} será reiniciada
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* overlay: PORTAL DA CAPIVARA (easter egg surreal — 3 cliques no pôster) */}
          {portal && (
            <div className="cap-portal absolute inset-0 z-[60] flex items-center justify-center overflow-hidden" aria-hidden>
              {Array.from({ length: 42 }).map((_, i) => {
                const a = (i / 42) * Math.PI * 2
                return (
                  <span
                    key={i}
                    className="cap-portal-star"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${2 + (i % 3) * 1.6}px`,
                      height: `${2 + (i % 3) * 1.6}px`,
                      ['--dx' as string]: `${Math.cos(a) * 420}px`,
                      ['--dy' as string]: `${Math.sin(a) * 420}px`,
                      animationDelay: `${(i % 7) * 0.22}s`,
                    }}
                  />
                )
              })}
              <p className="cap-neon cap-mono relative z-10 text-center text-lg font-extrabold tracking-[0.3em] sm:text-2xl">
                PORTAL DA CAPIVARA
                <span className="mt-2 block text-[11px] font-bold tracking-[0.2em] text-[#9fd0ff]">
                  você encontrou o lado surreal do quarto ✦
                </span>
              </p>
            </div>
          )}
        </section>

        {/* ---- painel lateral rápido ---- */}
        <aside className="cap-panel cap-panel-raised cap-fade-in flex flex-col gap-3 p-4 sm:p-5" aria-label="Painel rápido da Sala Segura">
          <h2 className="cap-heading text-lg">Painel rápido</h2>
          <p className="text-sm leading-relaxed text-[#3f6285]">
            Clique no <strong>monitor do quarto 3D</strong> para usar o PC do menino. Ou entre direto:
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => openPC('curso')}
              className="cap-btn-steel flex min-h-[48px] items-center gap-2.5 px-4 text-left text-sm"
            >
              <BookOpen className="h-5 w-5 shrink-0 text-[#8b5cf6]" aria-hidden />
              <span className="flex-1">
                Curso de privacidade
                <span className="cap-mono block text-[11px] font-bold text-[#3f6285]">
                  {doneCount}/8 módulos {courseDone ? '· CONCLUÍDO' : ''}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => openPC('missoes')}
              className="cap-btn-steel flex min-h-[48px] items-center gap-2.5 px-4 text-left text-sm"
            >
              <Gamepad2 className="h-5 w-5 shrink-0 text-[#f5920b]" aria-hidden />
              <span className="flex-1">
                Missões (jogo de fuga)
                <span className="cap-mono block text-[11px] font-bold text-[#3f6285]">
                  {courseDone ? `missão ${String(run.missionIdx + 1).padStart(2, '0')}/8 · ${lives}/${MAX_LIVES} vidas` : 'bloqueado — conclua o curso'}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => openPC('progresso')}
              className="cap-btn-steel flex min-h-[48px] items-center gap-2.5 px-4 text-left text-sm"
            >
              <Fingerprint className="h-5 w-5 shrink-0 text-[#2569b8]" aria-hidden />
              <span className="flex-1">
                Meu progresso
                <span className="cap-mono block text-[11px] font-bold text-[#3f6285]">
                  {progress.victories} {progress.victories === 1 ? 'vitória' : 'vitórias'} · melhor OPSEC {progress.bestScore}/24
                </span>
              </span>
            </button>
          </div>

          <div className="rounded-md border border-[#bfd9f2] bg-[#eef6ff] p-3">
            <p className="cap-mono mb-1 text-[10px] font-extrabold tracking-widest text-[#2569b8]">COMO FUNCIONA</p>
            <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-[#3f6285]">
              <li>Estude os 8 módulos e passe nos quizzes (≥ 2 de 3).</li>
              <li>Desbloqueie as missões do laboratório (alvos fictícios).</li>
              <li>Em cada missão, 3 decisões: escolhas seguras deixam traço 0.</li>
              <li>Traço ≥ 5 = batidas na porta, arrombamento e polícia = −1 vida.</li>
              <li>8 missões limpas = vitória + certificado de Operador Inrastreável.</li>
            </ol>
          </div>

          <div className="rounded-md border border-[#d6c4f2] bg-[#f6f2ff] p-3">
            <p className="cap-mono mb-1 flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-[#7c3aed]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> SEGREDOS DO QUARTO
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-[#3f6285]">
              <li>Tecla <strong>C</strong> troca a câmera · <strong>F</strong> tela cheia.</li>
              <li>Clique 3× no <strong>pôster CAPYBER</strong> e veja o que acontece…</li>
              <li><strong>Modo Sonho</strong> faz a mobília levitar.</li>
              <li>A pelúcia da capivara guarda o posto na cama.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default StealthView
