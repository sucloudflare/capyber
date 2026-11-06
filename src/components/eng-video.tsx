'use client'

// CAPYBER — player do vídeo "Por que o maior alvo é uma pessoa?" com narração VIGIA sincronizada.
// Alternador Vídeo ⇄ Pergaminho 3D de engenharia social (ScrollView).

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Captions, Gamepad2, ScrollText, Volume2, VolumeX } from 'lucide-react'
import { vigia } from '@/lib/voice'

const Pergaminho3D = dynamic(() => import('@/components/scroll3d'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-[var(--cap-border-strong)] bg-[#081426]">
      <span className="cap-mono animate-pulse text-base font-bold text-[#7cb6ec]">Desenrolando o pergaminho…</span>
    </div>
  ),
})

// timeline gerada no encode (xfade 0.6s) — início de cada cena
const SCENES: { t: number; line: string }[] = [
  { t: 0, line: 'Por que o maior alvo de um ataque é uma pessoa?' },
  { t: 4.9, line: 'Nove em cada dez ataques começam com engenharia social. O invasor não quebra a porta: ele pede a chave.' },
  { t: 10.8, line: 'Firewall, EDR, criptografia e MFA blindam a tecnologia. O elo mais fraco é o clique humano.' },
  { t: 17.7, line: 'Um e-mail convincente, um clique errado, uma senha em site falso. E o notebook vira a porta de entrada da rede inteira.' },
  { t: 26.1, line: 'O golpe de hoje não parece golpe: WhatsApp do chefe falso, SMS do banco, USB esquecido no estacionamento.' },
  { t: 32.5, line: 'A melhor defesa é você treinado. Desconfie da pressa, verifique por outro canal e reporte sem medo.' },
  { t: 38.9, line: 'Agora passe de fase na Trilha CAPYBER e blinde seu dispositivo antes que eles cheguem a ele.' },
]

export function EngVideoPanel() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sceneIdx = useRef(-1)
  // narração (voz da VIGIA) e legenda são independentes: desligar a voz NUNCA
  // apaga as legendas — acessibilidade não depende do volume
  const [narration, setNarration] = useState(true)
  const [caption, setCaption] = useState('')
  const [modo, setModo] = useState<'video' | 'pergaminho'>('video')

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = narration ? 0.32 : 1
  }, [narration])

  function toggleNarration() {
    const next = !narration
    setNarration(next)
    if (!next) {
      vigia.stop()
    } else {
      // força re-speak da cena atual ao religar
      sceneIdx.current = -1
    }
  }

  function onTime() {
    const v = videoRef.current
    if (!v) return
    if (v.paused || v.ended) return
    const t = v.currentTime
    let idx = 0
    for (let i = SCENES.length - 1; i >= 0; i--) {
      if (t >= SCENES[i].t) {
        idx = i
        break
      }
    }
    if (idx !== sceneIdx.current) {
      sceneIdx.current = idx
      setCaption(SCENES[idx].line) // legenda sempre — independe da narração
      if (narration) vigia.speak(SCENES[idx].line, 1)
    }
  }

  function onPauseLike() {
    sceneIdx.current = -1
    setCaption('')
    vigia.stop()
  }

  return (
    <section className="cap-panel area-video flex flex-col overflow-hidden p-0" aria-label="Vídeo: por que o maior alvo é uma pessoa">
      <div className="flex flex-wrap items-center gap-2.5 px-4 pt-3 pb-2">
        <span className="cap-mono text-base font-bold text-[var(--cap-cyan)]">ENG•SOCIAL</span>
        <h2 className="font-heading text-lg font-extrabold leading-tight text-[var(--cap-bright)]">
          O maior alvo é uma pessoa
        </h2>
        <div className="cap-fade-x ml-auto flex min-w-0 items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex overflow-hidden rounded-lg border-2 border-[var(--cap-border)]" role="tablist" aria-label="Formato do conteúdo">
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'video'}
              onClick={() => setModo('video')}
              className={`px-2.5 py-1 text-[0.78rem] font-bold transition-colors ${
                modo === 'video' ? 'bg-[#10315c] text-white' : 'bg-white text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
              }`}
            >
              Vídeo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'pergaminho'}
              onClick={() => setModo('pergaminho')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[0.78rem] font-bold transition-colors ${
                modo === 'pergaminho' ? 'bg-[#10315c] text-white' : 'bg-white text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
              }`}
            >
              <ScrollText className="h-3.5 w-3.5" aria-hidden />
              Pergaminho 3D
            </button>
          </div>
          <button
            type="button"
            onClick={toggleNarration}
            aria-pressed={narration}
            title={narration ? 'Narração da VIGIA ligada (abaixa a música) — legendas sempre ativas' : 'Narração da VIGIA desligada (legendas permanecem)'}
            className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-2 py-1 text-[0.78rem] font-bold transition-colors ${
              narration
                ? 'border-[#21a44a]/60 bg-[#21a44a]/10 text-[#15803d]'
                : 'border-[var(--cap-border)] bg-white text-[var(--cap-dim)]'
            }`}
          >
            {narration ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
            VIGIA narra
          </button>
        </div>
      </div>

      {modo === 'pergaminho' ? (
        <div className="mx-4 overflow-hidden rounded-lg border-2 border-[var(--cap-border-strong)] bg-[#081426]">
          <Pergaminho3D />
        </div>
      ) : (
      <figure className="relative mx-4 aspect-video overflow-hidden rounded-lg border-2 border-[var(--cap-border-strong)] bg-[#081426]">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src="/video/eng-social.mp4"
          poster="/video/eng-social-poster.jpg"
          controls
          playsInline
          preload="metadata"
          aria-label="Vídeo explicativo: por que a pessoa é o alvo da engenharia social"
          onTimeUpdate={onTime}
          onPause={onPauseLike}
          onEnded={onPauseLike}
          onSeeking={onPauseLike}
        />
        {caption && (
          <figcaption
            aria-live="polite"
            className="cap-video-caption pointer-events-none absolute inset-x-2 bottom-12 rounded-md border-2 border-[#10315c66] bg-[#081426]/90 px-3 py-1.5 text-center text-[0.82rem] font-bold leading-snug text-[#eaf4ff] sm:bottom-14"
          >
            {caption}
          </figcaption>
        )}
      </figure>
      )}

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <a
          href="#trilha"
          title="Ir para a Trilha CAPYBER e avançar de fase"
          className="cap-btn-primary cap-link-arrow inline-flex items-center px-3 py-2 text-[0.9rem]"
        >
          <Gamepad2 className="mr-2 h-4.5 w-4.5" aria-hidden />
          Passar de fase na Trilha
        </a>
        <span className="cap-mono ml-auto text-[0.78rem] text-[var(--cap-dim)]">
          {narration ? <Captions className="mr-1 inline h-4 w-4 align-[-2px]" aria-hidden /> : null}
          45s · legendas + narração pt-BR
        </span>
      </div>
    </section>
  )
}
