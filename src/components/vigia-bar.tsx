'use client'

// Console da VIGIA: controle de voz + estado reativo + atalho para o estúdio
// de transmissão (painel montado aqui, sem mudanças no page.tsx).

import { useState } from 'react'
import { vigia } from '@/lib/voice'
import { VolumeX, CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { VigiaControlPanel, useVigia } from '@/components/vigia/vigia-control'

export { useVigia }

export function VigiaToggle() {
  const state = useVigia()
  return (
    <>
      <button
        onClick={() => vigia.toggle()}
        className={`flex min-h-[34px] items-center gap-1.5 rounded-full border-2 px-3 py-1 text-base font-extrabold tracking-wide transition-all ${
          state.enabled
            ? 'border-[#157034]/60 bg-gradient-to-b from-[#3ecb6e] to-[#21a44a] text-white shadow-[0_2px_10px_rgba(33,164,74,0.45)]'
            : 'border-[var(--cap-border-strong)] bg-white text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
        }`}
        aria-pressed={state.enabled}
        aria-label={state.enabled ? 'Desativar voz da Vigia' : 'Ativar voz da Vigia'}
        title={state.supported ? `Voz: ${state.voiceName || 'padrão pt-BR'}` : 'Voz não suportada neste navegador'}
      >
        {state.enabled ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
        VIGIA {state.enabled ? 'ON' : 'OFF'}
      </button>
      <VigiaStudioButton />
    </>
  )
}

/** Botão pequeno que abre o estúdio da VIGIA (painel montado localmente). */
export function VigiaStudioButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        data-tut="vigia-panel-open"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Abrir estúdio da VIGIA"
        title="Estúdio da VIGIA — voz, ritmo, horários e lembretes"
        className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-full border-2 border-[var(--cap-border-strong)] bg-white p-1.5 text-[var(--cap-dim)] transition-all hover:border-[#157034]/60 hover:text-[#157034]"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
      </button>
      <VigiaControlPanel open={open} onOpenChange={setOpen} />
    </>
  )
}
