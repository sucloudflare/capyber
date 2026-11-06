'use client'

// CAPYBER — Painel das MISSÕES no PC do quarto (Sala Segura · Capivara Silenciosa).
// "Hackear de mentira": 8 missões simuladas contra alvos FICTÍCIOS do laboratório
// CAPYBER (com consentimento). Cada missão = briefing + 3 decisões; cada decisão
// deixa um "traço digital" (0 = OPSEC correto · 1–3 = arriscado). Traço ≥ 5 na
// missão = RASTREADO: a polícia entra no quarto (cena 3D) e o jogador perde 1
// das 5 vidas. Terminar as 8 missões sem perder as 5 vidas = VITÓRIA + certificado.

import { useState } from 'react'
import {
  Award,
  BadgeCheck,
  ChevronRight,
  Fingerprint,
  Lightbulb,
  Lock,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Target,
  Trophy,
} from 'lucide-react'
import {
  FOOTPRINT_LIMIT,
  MAX_LIVES,
  MISSIONS,
  TOTAL_SAFE_CHOICES,
  type MissionOption,
} from '@/lib/stealth-content'
import { CertificateButton } from '@/components/certificates/certificate-button'

/* ══════════════════════════════ estado da partida ══════════════════════════════ */

export type RunPhase = 'playing' | 'traced' | 'clear' | 'victory' | 'defeat'

export interface RunState {
  missionIdx: number
  /** decisões já tomadas na missão atual (índices das opções escolhidas) */
  picks: number[]
  /** feedback da última decisão, exibido antes de avançar */
  lastPick: { step: number; optionIdx: number } | null
  phase: RunPhase
  /** escolhas seguras (custo 0) acumuladas nas missões CONCLUÍDAS desta partida */
  safeChoices: number
}

export function initialRun(): RunState {
  return { missionIdx: 0, picks: [], lastPick: null, phase: 'playing', safeChoices: 0 }
}

export function footprintOf(run: RunState): number {
  const mission = MISSIONS[run.missionIdx]
  if (!mission) return 0
  return run.picks.reduce((acc, oi, si) => {
    const opt: MissionOption | undefined = mission.steps[si]?.options[oi]
    return acc + (opt ? opt.cost : 0)
  }, 0)
}

interface GamePanelProps {
  lives: number
  run: RunState
  courseDone: boolean
  modulesDoneCount: number
  bestScore: number
  /** escolhe uma opção da decisão atual */
  onChoose: (optionIdx: number) => void
  /** confirma o feedback da decisão e segue (ou encerra a missão) */
  onAckStep: () => void
  /** avança para a próxima missão (ou vitória) */
  onNextMission: () => void
  /** derrota ou vitória: reinicia as missões com 5 vidas */
  onRestartRun: () => void
}

/* ══════════════════════════════ HUD helpers ══════════════════════════════ */

function LivesRow({ lives }: { lives: number }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Prisões restantes: ${lives} de ${MAX_LIVES}`}>
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <BadgeCheck key={i} className={`h-5 w-5 ${i < lives ? 'text-[#21a44a]' : 'text-[#22344a]'}`} aria-hidden />
      ))}
      <span className="cap-mono ml-1 text-xs font-bold text-[#7cb6ec]">
        {lives}/{MAX_LIVES}
      </span>
    </div>
  )
}

function FootprintBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / FOOTPRINT_LIMIT) * 100)
  const color = value >= FOOTPRINT_LIMIT ? '#e11d2f' : value >= 3 ? '#f5920b' : '#21a44a'
  return (
    <div className="min-w-[150px] flex-1">
      <div className="cap-mono mb-1 flex items-center justify-between text-[10px] font-bold tracking-wider text-[#5f8fc0]">
        <span className="flex items-center gap-1">
          <Fingerprint className="h-3 w-3" aria-hidden /> TRAÇO DIGITAL
        </span>
        <span style={{ color }}>
          {value}/{FOOTPRINT_LIMIT}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#0a1e33]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function CostDots({ cost }: { cost: number }) {
  return (
    <span className="cap-mono flex items-center gap-0.5" aria-label={`Traço digital deixado: ${cost}`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${i < cost ? 'bg-[#f5920b]' : 'bg-[#22344a]'}`} aria-hidden />
      ))}
      <span className="ml-1 text-[10px] font-bold text-[#7cb6ec]">traço +{cost}</span>
    </span>
  )
}

/* ══════════════════════════════ painel ══════════════════════════════ */

export function GamePanel({
  lives,
  run,
  courseDone,
  modulesDoneCount,
  bestScore,
  onChoose,
  onAckStep,
  onNextMission,
  onRestartRun,
}: GamePanelProps) {
  const [victoryClosed, setVictoryClosed] = useState(false)
  /* ---- bloqueado até concluir o curso ---- */
  if (!courseDone) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-md border border-[#15324d] bg-[#071626] p-6 text-center">
        <Lock className="h-10 w-10 text-[#3f6f9f]" aria-hidden />
        <h3 className="cap-heading text-xl text-[#eaf5ff]">Missões bloqueadas</h3>
        <p className="max-w-md text-sm text-[#8fb4d9]">
          Conclua os <strong className="text-[#4ade80]">8 módulos do curso</strong> no PC para desbloquear a
          Operação Capivara Silenciosa. O laboratório só autoriza operadores que aprenderam a se proteger.
        </p>
        <p className="cap-mono text-sm font-bold text-[#7cb6ec]">
          Progresso do curso: {modulesDoneCount}/8 — abra a aba CURSO
        </p>
      </div>
    )
  }

  /* ---- vitória ---- */
  if (run.phase === 'victory' && victoryClosed) {
    return (
      <div className="cap-fade-in flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-md border border-[#1d4a2c] bg-[#071626] p-5 text-center">
        <p className="cap-heading text-lg text-[#eaf5ff]">Operação concluída ✔</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <CertificateButton
            type="stealth"
            ready
            meta={{ score: `${run.safeChoices}/${TOTAL_SAFE_CHOICES} pts OPSEC`, missions: '8/8', lives: String(lives) }}
            label="Certificado de Operador Inrastreável"
          />
          <button type="button" onClick={() => setVictoryClosed(false)} className="cap-btn-ghost inline-flex min-h-[40px] items-center px-4 text-sm">
            Ver resultado
          </button>
          <button type="button" onClick={onRestartRun} className="cap-btn-ghost inline-flex min-h-[40px] items-center gap-1.5 px-4 text-sm">
            <RotateCcw className="h-4 w-4" aria-hidden /> Jogar de novo
          </button>
          <button
            type="button"
            onClick={() => setVictoryClosed(true)}
            className="cap-btn-primary inline-flex min-h-[40px] items-center px-4 text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }
  if (run.phase === 'victory') {
    return (
      <div className="cap-fade-in flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-md border border-[#1d4a2c] bg-[#071626] p-6 text-center">
        <Trophy className="h-12 w-12 text-[#f2d43d]" aria-hidden />
        <h3 className="cap-heading text-2xl text-[#eaf5ff]">OPERAÇÃO CAPIVARA SILENCIOSA — VITÓRIA!</h3>
        <p className="max-w-lg text-sm text-[#8fb4d9]">
          Você completou as 8 missões do laboratório sem ser rastreado nenhuma vez. O OPSEC funcionou:{' '}
          <strong className="text-[#4ade80]">nenhuma polícia no seu quarto</strong> — nem no jogo, nem na vida
          real. É esse conhecimento que protege jornalistas, ativistas e você mesmo contra doxing e vigilância.
        </p>
        <div className="grid w-full max-w-md grid-cols-3 gap-2">
          <div className="rounded-md border border-[#15324d] bg-[#0b2033] p-2.5">
            <p className="cap-mono text-xl font-extrabold text-[#4ade80]">8/8</p>
            <p className="cap-mono text-[10px] font-bold text-[#5f8fc0]">MISSÕES</p>
          </div>
          <div className="rounded-md border border-[#15324d] bg-[#0b2033] p-2.5">
            <p className="cap-mono text-xl font-extrabold text-[#21a44a]">
              {lives}/{MAX_LIVES}
            </p>
            <p className="cap-mono text-[10px] font-bold text-[#5f8fc0]">VIDAS</p>
          </div>
          <div className="rounded-md border border-[#15324d] bg-[#0b2033] p-2.5">
            <p className="cap-mono text-xl font-extrabold text-[#f5920b]">
              {run.safeChoices}/{TOTAL_SAFE_CHOICES}
            </p>
            <p className="cap-mono text-[10px] font-bold text-[#5f8fc0]">ESC. SEGURAS</p>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <CertificateButton
            type="stealth"
            ready
            meta={{
              score: `${run.safeChoices}/${TOTAL_SAFE_CHOICES} pts OPSEC`,
              missions: '8/8',
              lives: String(lives),
            }}
            label="Certificado de Operador Inrastreável"
          />
          <button
            type="button"
            onClick={onRestartRun}
            className="cap-btn-ghost inline-flex min-h-[40px] items-center gap-1.5 px-4 text-sm"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Jogar de novo
          </button>
        </div>
        <p className="cap-mono text-xs text-[#5f8fc0]">
          melhor pontuação OPSEC registrada: {bestScore}/{TOTAL_SAFE_CHOICES}
        </p>
      </div>
    )
  }

  /* ---- derrota (5 prisões) ---- */
  if (run.phase === 'defeat') {
    return (
      <div className="cap-fade-in flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-md border border-[#4a0a12] bg-[#230a10] p-6 text-center">
        <Siren className="h-12 w-12 text-[#ff5f6d]" aria-hidden />
        <h3 className="cap-heading text-2xl text-[#ffd7dc]">Fim de jogo — 5 prisões</h3>
        <p className="max-w-lg text-sm text-[#f3c2c9]">
          Nesta partida o traço digital falou mais alto: a polícia entrou 5 vezes. Mas repare —{' '}
          <strong>o curso continua concluído</strong>: o conhecimento fica com você. No mundo real cada erro
          desses tem preço; no jogo ele é de graça. Recomece e aplique o que aprendeu.
        </p>
        <button
          type="button"
          onClick={onRestartRun}
          className="cap-btn-primary inline-flex min-h-[44px] items-center gap-2 px-5 text-sm"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Reiniciar missões (5 vidas)
        </button>
      </div>
    )
  }

  const mission = MISSIONS[run.missionIdx]
  if (!mission) return null
  const footprint = footprintOf(run)
  const showFeedback = run.phase === 'playing' && run.lastPick !== null && run.lastPick.step === run.picks.length - 1

  return (
    <div className="flex flex-col gap-3">
      {/* aviso educativo */}
      <div className="cap-mono rounded-md border border-[#15324d] bg-[#0a1e33] px-3 py-2 text-xs leading-relaxed text-[#7cb6ec]">
        <ShieldCheck className="mr-1.5 inline h-4 w-4 text-[#21a44a]" aria-hidden />
        SIMULAÇÃO de laboratório: alvos fictícios e autorizados. Nenhuma ferramenta real é executada — o que
        está em jogo é a sua higiene de OPSEC: cada decisão deixa (ou não) um traço que a "polícia" segue.
      </div>

      {/* HUD */}
      <div className="rounded-md border border-[#15324d] bg-[#0a1e33] p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="cap-mono flex items-center gap-1.5 text-sm font-extrabold text-[#eaf5ff]">
            <Target className="h-4 w-4 text-[#f5920b]" aria-hidden />
            MISSÃO {String(run.missionIdx + 1).padStart(2, '0')}/{MISSIONS.length} · {mission.codename}
          </span>
          <LivesRow lives={lives} />
          <FootprintBar value={footprint} />
        </div>
        <p className="cap-mono mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-[#7cb6ec]">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f2d43d]" aria-hidden />
          <span>
            <strong className="text-[#f2d43d]">Mentor Capivara:</strong> {mission.mentorTip}
          </span>
        </p>
      </div>

      {/* alvo */}
      <p className="cap-mono text-xs text-[#5f8fc0]">alvo: {mission.target}</p>

      {/* briefing */}
      <div className="rounded-md border border-[#15324d] bg-[#071626] p-3.5">
        <p className="cap-mono mb-1.5 text-[10px] font-bold tracking-widest text-[#4ade80]">BRIEFING</p>
        {mission.brief.map((b, i) => (
          <p key={i} className="mb-1.5 text-sm leading-relaxed text-[#c3dcf5] last:mb-0">
            {b}
          </p>
        ))}
      </div>

      {/* decisões */}
      {run.phase === 'playing' && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            {mission.steps.map((_, i) => (
              <span
                key={i}
                className={`cap-mono flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  i < run.picks.length
                    ? 'bg-[#123c22] text-[#4ade80]'
                    : i === run.picks.length
                      ? 'bg-[#3a2506] text-[#f5920b]'
                      : 'bg-[#0a1e33] text-[#3f6f9f]'
                }`}
                aria-hidden
              >
                {i + 1}
              </span>
            ))}
            <span className="cap-mono text-xs text-[#5f8fc0]">decisão {Math.min(run.picks.length + 1, 3)}/3</span>
          </div>

          {showFeedback && run.lastPick ? (
            (() => {
              const opt = mission.steps[run.lastPick.step]?.options[run.lastPick.optionIdx]
              if (!opt) return null
              const safe = opt.cost === 0
              const isLast = run.picks.length >= mission.steps.length
              return (
                <div
                  className={`cap-fade-in rounded-md border p-3.5 ${
                    safe ? 'border-[#1d4a2c] bg-[#0a2117]' : 'border-[#6b3a08] bg-[#241503]'
                  }`}
                  aria-live="polite"
                >
                  <p className="cap-mono mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold tracking-wider">
                    {safe ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-[#4ade80]" aria-hidden />
                        <span className="text-[#4ade80]">OPSEC CORRETO</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4 text-[#f5920b]" aria-hidden />
                        <span className="text-[#f5920b]">TRAÇO DEIXADO</span>
                      </>
                    )}
                    <CostDots cost={opt.cost} />
                  </p>
                  <p className="mb-1.5 text-sm font-bold text-[#d9ecff]">“{opt.label}”</p>
                  <p className="text-sm leading-relaxed text-[#c3dcf5]">{opt.feedback}</p>
                  <button
                    type="button"
                    onClick={onAckStep}
                    className="cap-btn-steel mt-3 inline-flex min-h-[44px] items-center gap-1.5 px-4 text-sm"
                  >
                    {isLast ? 'Encerrar missão' : 'Continuar (próxima decisão)'}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )
            })()
          ) : (
            (() => {
              const stepIdx = Math.min(run.picks.length, mission.steps.length - 1)
              const step = mission.steps[stepIdx]
              if (!step) return null
              return (
                <div className="cap-fade-in rounded-md border border-[#15324d] bg-[#071626] p-3.5">
                  <p className="mb-2.5 text-base font-bold text-[#eaf5ff]">{step.prompt}</p>
                  <div className="flex flex-col gap-2">
                    {step.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onChoose(i)}
                        className="flex min-h-[48px] items-center gap-2.5 rounded-md border border-[#15324d] bg-[#0b2033] px-3 py-2 text-left text-sm transition-colors hover:border-[#f5920b] hover:bg-[#13293f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5920b]"
                      >
                        <span className="cap-mono flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#12304e] text-xs font-bold text-[#7cb6ec]">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 text-[#d9ecff]">{opt.label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#3f6f9f]" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()
          )}
        </div>
      )}

      {/* missão concluída */}
      {run.phase === 'clear' && (
        <div className="cap-fade-in rounded-md border border-[#1d4a2c] bg-[#0a2117] p-4" aria-live="polite">
          <p className="cap-mono mb-1.5 flex items-center gap-1.5 text-sm font-extrabold text-[#4ade80]">
            <Award className="h-5 w-5" aria-hidden /> MISSÃO {String(run.missionIdx + 1).padStart(2, '0')} CONCLUÍDA
          </p>
          <p className="mb-2 text-sm text-[#bfe6cd]">{mission.clearText}</p>
          <p className="cap-mono text-xs text-[#7cb6ec]">
            traço final da missão: {footprint}/{FOOTPRINT_LIMIT} ·{' '}
            {footprint === 0
              ? 'operação impecável'
              : footprint >= 3
                ? 'a polícia quase chegou — cuidado!'
                : 'alguns traços, mas você passou'}
          </p>
          <button
            type="button"
            onClick={onNextMission}
            className="cap-btn-primary mt-3 inline-flex min-h-[44px] items-center gap-2 px-5 text-sm"
          >
            {run.missionIdx < MISSIONS.length - 1 ? 'Próxima missão' : 'Finalizar operação'}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}

export default GamePanel
