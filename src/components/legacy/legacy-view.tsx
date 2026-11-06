'use client'

// CAPYBER — Aba LEGADO: o final da jornada. Fica travada até o operador
// concluir TODAS as experiências da página (cursos, jogos, lab, OSINT…).
// Ao desbloquear: montagem de carreira (jornal, 20 CVEs, blogs, podcast,
// prêmio) → oferta da ferramenta → cadastro de rede/dispositivos → compra
// simulada → onboarding da empresa → marketing anti-APT de estado-nação.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Award, Check, ChevronRight, CircleDashed, Coins, Eye, Lock, LockOpen,
  Newspaper, Play, RotateCcw, Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/components/auth/guest-context'
import { CapyBadge, GateSpiral, MascotCapy } from '@/components/art'
import {
  LEGACY_MODULES, useLegacyProgress, resolveOperatorName, markMontageWatched,
  readDevices, type LegacyModuleId,
} from '@/lib/legacy'
import { CareerMontage } from '@/components/legacy/montage'
import { OfferHeader, DeviceRegistration, Checkout, CompanyOnboarding } from '@/components/legacy/offer'
import { AptWar } from '@/components/legacy/apt-war'

/* ─────────────────────────── portão (travado) ─────────────────────────── */

function ModuleStatusIcon({ done }: { done: boolean }) {
  return done ? (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#21a44a] text-white shadow-[0_2px_10px_rgba(33,164,74,0.4)]">
      <Check className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
    </span>
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--cap-border)] text-[var(--cap-dim)]">
      <CircleDashed className="h-[18px] w-[18px]" aria-hidden />
    </span>
  )
}

function LockedGate({ onPeek }: { onPeek: (id: LegacyModuleId) => void }) {
  const p = useLegacyProgress()
  const pct = Math.round((p.doneCount / p.totalCount) * 100)
  return (
    <div className="space-y-4">
      <div className="cap-panel relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-[0.07]" aria-hidden>
          <MascotCapy size={220} />
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#10315c] to-[#1d4d7f] text-[#ffb020] shadow-lg">
            <Lock className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--cap-orange-deep)]">Conteúdo secreto</p>
            <h2 className="cap-heading text-2xl sm:text-3xl">LEGADO — o final da sua história</h2>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--cap-text)]">
          Existe um último capítulo escondido no CAPYBER: a simulação do que acontece com quem
          <strong> termina tudo</strong> — o jornal, as 20 CVEs, os blogs, os podcasts, o SOC — e o convite para
          usar de verdade a ferramenta que você treinou. Conclua as {p.totalCount} experiências abaixo para desbloquear.
        </p>

        <div className="mt-4 max-w-xl">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.85rem] font-bold text-[var(--cap-bright)]">Progresso geral</span>
            <span className="cap-mono text-base font-black text-[var(--cap-bright)]">{p.doneCount}/{p.totalCount}</span>
          </div>
          <Progress value={pct} className="mt-1.5 h-3" aria-label={`Progresso do Legado: ${pct}%`} />
        </div>

        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {LEGACY_MODULES.map((m) => {
            const done = p.done[m.id]
            const c = p.counts[m.id]
            return (
              <li key={m.id}>
                <button
                  onClick={() => onPeek(m.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    done ? 'border-[#21a44a]/50 bg-[#21a44a]/[0.06]' : 'border-[var(--cap-border)] bg-[var(--cap-panel-raised)] hover:border-[var(--cap-cyan)]/50'
                  }`}
                  title={`Ir para ${m.label}`}
                >
                  <ModuleStatusIcon done={done} />
                  <span className="min-w-0">
                    <span className="block text-[0.95rem] font-extrabold text-[var(--cap-bright)]">{m.label}</span>
                    <span className="block truncate text-[0.8rem] text-[var(--cap-text)]">{m.hint}</span>
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1.5">
                    <span className={`cap-mono rounded px-1.5 py-0.5 text-[0.72rem] font-black ${done ? 'bg-[#21a44a]/15 text-[#1f9648]' : 'bg-[#dcebfd] text-[var(--cap-dim)]'}`}>
                      {Math.min(c.done, c.total)}/{c.total}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--cap-dim)] transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* teaser desfocado */}
      <div className="cap-panel relative overflow-hidden p-5 text-center">
        <div className="pointer-events-none select-none opacity-25 blur-[6px]" aria-hidden>
          <p className="cap-heading text-xl sm:text-2xl">“{resolveOperatorName().split(' ')[0]} vira fenômeno global da cibersegurança”</p>
          <p className="mt-1 text-[0.9rem] text-[var(--cap-text)]">GAZETA DO BIT · capa de 14/03/2026 · 20 CVEs coordenadas · SOC Tier 3 · prêmio nacional</p>
        </div>
        <p className="mt-3 flex items-center justify-center gap-2 text-[0.85rem] font-bold text-[var(--cap-dim)]">
          <Eye className="h-4 w-4" aria-hidden /> Continue as experiências para ler a sua própria manchete
        </p>
      </div>
    </div>
  )
}

/* ─────────────────────────── herói (desbloqueado) ──────────────────────── */

function UnlockedHero({
  name, coins, certificates, ctfXp, watched, onPlay,
}: { name: string; coins: number; certificates: number; ctfXp: number; watched: boolean; onPlay: () => void }) {
  return (
    <div className="cap-panel relative overflow-hidden p-5 sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-10 opacity-10" aria-hidden>
        <MascotCapy size={230} />
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#ffd54d] to-[#c76e00] text-[#10315c] shadow-[0_6px_24px_rgba(255,180,40,0.45)]">
          <Trophy className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--cap-orange-deep)]">100% concluído · capítulo secreto aberto</p>
          <h2 className="cap-heading text-2xl sm:text-3xl">LEGADO de {name}</h2>
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--cap-text)]">
        Você fez os cursos, venceu os jogos, esgotou tudo o que a página oferece. Hora de ver o que isso significa
        no mundo real: <strong>rode a simulação ilustrada</strong> da sua carreira e, em seguida, conheça a ferramenta
        que faz tudo isso acontecer dentro de uma empresa de verdade.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-4">
        {[
          { icon: Coins, k: 'Moedas da Trilha', v: String(coins) },
          { icon: Award, k: 'Certificados emitidos', v: String(certificates) },
          { icon: RotateCcw, k: 'XP do CTF Fantasma', v: String(ctfXp) },
          { icon: Newspaper, k: 'CVEs coordenadas (na simulação)', v: '20' },
        ].map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-3"
          >
            <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-[var(--cap-dim)]">
              <s.icon className="h-3.5 w-3.5" aria-hidden /> {s.k}
            </p>
            <p className="text-xl font-black text-[var(--cap-bright)]">{s.v}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={onPlay} className="cap-btn-primary h-14 px-6 text-base">
          <Play className="mr-2 h-5 w-5" aria-hidden />
          {watched ? 'Rever a simulação de carreira' : 'Reproduzir a simulação de carreira'}
        </Button>
        <a href="#legado-oferta" className="cap-btn-ghost inline-flex h-14 items-center px-5 text-[0.95rem] font-bold">
          Ir direto à ferramenta <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </a>
        {!watched && (
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--cap-orange)]/15 px-3 py-1 text-[0.75rem] font-black uppercase tracking-wider text-[var(--cap-orange-deep)]">
            <LockOpen className="h-3.5 w-3.5" aria-hidden /> estreia recomendada
          </span>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────── view raiz ─────────────────────────────── */

export function LegacyView() {
  const { user } = useAuth()
  const progress = useLegacyProgress()
  const [montageOpen, setMontageOpen] = useState(false)
  const [booting, setBooting] = useState(true)

  const name = resolveOperatorName(user)

  // splash curtinho enquanto o snapshot carrega no cliente
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 350)
    return () => clearTimeout(t)
  }, [])

  // primeira visita já desbloqueada → abre a montagem automaticamente
  useEffect(() => {
    if (booting || !progress.unlocked) return
    if (!progress.montageWatched) {
      const t = setTimeout(() => setMontageOpen(true), 700)
      return () => clearTimeout(t)
    }
  }, [booting, progress.unlocked, progress.montageWatched])

  const closeMontage = () => {
    setMontageOpen(false)
    if (!progress.montageWatched) markMontageWatched()
    setTimeout(() => {
      document.getElementById('legado-oferta')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
  }

  const peekModule = (id: LegacyModuleId) => {
    const meta = LEGACY_MODULES.find((m) => m.id === id)
    if (meta) window.location.hash = meta.href.replace('#', '')
  }

  if (booting) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center gap-3">
        <GateSpiral size={56} spin title="Abrindo o cofre do Legado" />
        <p className="text-base font-bold text-[#7cb6ec]">Verificando suas conquistas…</p>
      </div>
    )
  }

  const devicesCount = readDevices().length

  return (
    <div className="space-y-4">
      {progress.unlocked ? (
        <>
          <UnlockedHero
            name={name}
            coins={progress.coins}
            certificates={progress.certificates}
            ctfXp={progress.ctfXp}
            watched={progress.montageWatched}
            onPlay={() => setMontageOpen(true)}
          />
          <OfferHeader onBuy={() => document.getElementById('legado-compra')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <DeviceRegistration />
          <Checkout onDone={() => undefined} />
          <CompanyOnboarding devicesCount={devicesCount} />
          <AptWar onBuy={() => document.getElementById('legado-compra')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />

          {/* selo final */}
          <div className="cap-panel flex flex-col items-center gap-2 p-6 text-center">
            <CapyBadge size={56} />
            <p className="cap-heading text-xl sm:text-2xl">Você viu tudo o que o CAPYBER tem a oferecer.</p>
            <p className="max-w-2xl text-[0.9rem] text-[var(--cap-text)]">
              Da primeira lição da Trilha à defesa contra APTs de estado-nação — a jornada termina aqui,
              mas a sua carreira está só começando.
            </p>
          </div>
        </>
      ) : (
        <LockedGate onPeek={peekModule} />
      )}

      <CareerMontage open={montageOpen} name={name} onClose={closeMontage} />
    </div>
  )
}
