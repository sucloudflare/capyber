'use client'

// CAPYBER — Painel "Meu progresso" da Sala Segura (aba do PC).
// Lê/grava em localStorage (capy_stealth_progress): módulos concluídos,
// melhor pontuação OPSEC, vitórias e certificados emitidos.

import { useState } from 'react'
import { BookOpen, CheckCircle2, Circle, Fingerprint, RotateCcw, Trophy } from 'lucide-react'
import {
  COURSE_MODULES,
  TOTAL_SAFE_CHOICES,
  type StealthProgress,
} from '@/lib/stealth-content'

interface ProgressPanelProps {
  progress: StealthProgress
  onReset: () => void
}

export function ProgressPanel({ progress, onReset }: ProgressPanelProps) {
  const [confirming, setConfirming] = useState(false)
  const doneCount = COURSE_MODULES.filter((m) => progress.modulesDone.includes(m.id)).length

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-[#15324d] bg-[#0b2033] p-3 text-center">
          <BookOpen className="mx-auto mb-1 h-5 w-5 text-[#4ade80]" aria-hidden />
          <p className="cap-mono text-xl font-extrabold text-[#eaf5ff]">{doneCount}/8</p>
          <p className="cap-mono text-[10px] font-bold tracking-wider text-[#5f8fc0]">MÓDULOS</p>
        </div>
        <div className="rounded-md border border-[#15324d] bg-[#0b2033] p-3 text-center">
          <Fingerprint className="mx-auto mb-1 h-5 w-5 text-[#f5920b]" aria-hidden />
          <p className="cap-mono text-xl font-extrabold text-[#eaf5ff]">
            {progress.bestScore}/{TOTAL_SAFE_CHOICES}
          </p>
          <p className="cap-mono text-[10px] font-bold tracking-wider text-[#5f8fc0]">MELHOR OPSEC</p>
        </div>
        <div className="rounded-md border border-[#15324d] bg-[#0b2033] p-3 text-center">
          <Trophy className="mx-auto mb-1 h-5 w-5 text-[#f2d43d]" aria-hidden />
          <p className="cap-mono text-xl font-extrabold text-[#eaf5ff]">{progress.victories}</p>
          <p className="cap-mono text-[10px] font-bold tracking-wider text-[#5f8fc0]">VITÓRIAS</p>
        </div>
        <div className="rounded-md border border-[#15324d] bg-[#0b2033] p-3 text-center">
          <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-[#21a44a]" aria-hidden />
          <p className="cap-mono text-xl font-extrabold text-[#eaf5ff]">{progress.victories}</p>
          <p className="cap-mono text-[10px] font-bold tracking-wider text-[#5f8fc0]">CERTIFICADOS</p>
        </div>
      </div>

      <div className="rounded-md border border-[#15324d] bg-[#071626] p-3.5">
        <p className="cap-mono mb-2 text-[10px] font-bold tracking-widest text-[#4ade80]">MÓDULOS DO CURSO</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {COURSE_MODULES.map((m, i) => {
            const done = progress.modulesDone.includes(m.id)
            return (
              <li
                key={m.id}
                className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs ${
                  done ? 'border-[#1d4a2c] bg-[#0a2117] text-[#bfe6cd]' : 'border-[#15324d] bg-[#0b2033] text-[#7295ba]'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4ade80]" aria-hidden />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[#3f6f9f]" aria-hidden />
                )}
                <span className="flex-1 truncate">
                  {String(i + 1).padStart(2, '0')} · {m.title}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-md border border-[#15324d] bg-[#0a1e33] p-3">
        <p className="cap-mono mb-1 text-[10px] font-bold tracking-widest text-[#5f8fc0]">DADOS LOCAIS</p>
        <p className="mb-2.5 text-xs leading-relaxed text-[#7295ba]">
          Seu progresso fica salvo apenas neste navegador (chave <span className="cap-mono">capy_stealth_progress</span>).
          Nada é enviado a servidores — combina com o tema da aula, não é?
        </p>
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#ff5f6d]">Apagar todo o progresso (curso, vitórias e recordes)?</span>
            <button
              type="button"
              onClick={() => {
                onReset()
                setConfirming(false)
              }}
              className="cap-btn-steel inline-flex min-h-[36px] items-center gap-1.5 px-3 text-xs"
            >
              Sim, apagar tudo
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cap-btn-ghost inline-flex min-h-[36px] items-center gap-1.5 px-3 text-xs"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Apagar todo o progresso salvo neste navegador"
            className="cap-btn-ghost inline-flex min-h-[36px] items-center gap-1.5 px-3 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Zerar progresso
          </button>
        )}
      </div>
    </div>
  )
}

export default ProgressPanel
