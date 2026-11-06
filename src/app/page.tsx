'use client'

// CAPYBER — painel SOC de defesa de endpoints (motor CAPYCORE em tempo real via socket.io).
// Portão de autenticação profissional (login/MFA/visitante) + tutorial RPG + livro 3D + CTF.

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClipboardList, Zap, LogIn, Lock, Sparkles } from 'lucide-react'
import { getSocket } from '@/lib/socket'
import { vigia } from '@/lib/voice'
import type { AuditEntry, Device, Stats, ThreatEvent } from '@/lib/types'
import { KB_STATS } from '@/lib/kb'
import {
  AlertWorkbench,
  FleetMini,
  OriginPanel,
  RadarPanel,
  StatsBar,
  ThreatFeed,
} from '@/components/dashboard'
import { LabView } from '@/components/lab-view'
import { PlanView } from '@/components/plan-view'
import { FleetView } from '@/components/fleet-view'
import { Overview, SIDE_NAV, type View } from '@/components/overview'
import { TrilhaView3D } from '@/components/trilha3d-view'
import { OsintView } from '@/components/osint-view'
import { CopilotPanel } from '@/components/copilot'
import { MascotChat } from '@/components/mascot-chat'
import { VigiaToggle, useVigia } from '@/components/vigia-bar'
import { CookieConsent } from '@/components/privacy/cookie-consent'
import { PrivacyTrigger } from '@/components/privacy/privacy-dialog'
import { ProjectDownload } from '@/components/download/project-download'
import { markTutorialDone, onTutorialEvent, watchTutorialComplete } from '@/lib/tutorial-bus'
import { CapShield, CapyBadge, GateSpiral } from '@/components/art'
import { useLegacyProgress } from '@/lib/legacy'
import { AuthProvider, useAuth } from '@/components/auth/guest-context'
import { AuthGate } from '@/components/auth/auth-gate'
import { UserMenu, type SafeUserLike } from '@/components/auth/user-menu'
import { RpgTutorial, TutorialFab } from '@/components/tutorial/rpg-tutorial'
import {
  CommandPalette,
  ShortcutsHelp,
  ScrollTopButton,
  WelcomeToast,
  NotifyBell,
  notifyCritical,
  useViewMeta,
  lastView,
} from '@/components/pro-kit'

const Globe3D = dynamic(() => import('@/components/globe3d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[340px] w-full flex-col items-center justify-center gap-3 sm:h-[420px] lg:h-[500px]">
      <GateSpiral size={64} spin title="Portal abrindo" />
    </div>
  ),
})

const Book3DView = dynamic(() => import('@/components/book3d-view').then((m) => m.Book3DView), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3">
      <GateSpiral size={56} spin title="Abrindo o Códice" />
      <p className="text-base font-bold text-[#7cb6ec]">Encadernando 190+ páginas…</p>
    </div>
  ),
})

const GhostCtf = dynamic(() => import('@/components/ctf/ghost-ctf').then((m) => m.GhostCtf), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3">
      <GateSpiral size={56} spin title="Convocando o caso" />
      <p className="text-base font-bold text-[#7cb6ec]">Abrindo o dossiê do fantasma…</p>
    </div>
  ),
})

const ScrollView = dynamic(() => import('@/components/scroll3d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3">
      <GateSpiral size={56} spin title="Desenrolando o pergaminho" />
      <p className="text-base font-bold text-[#7cb6ec]">Selos de engenharia social a caminho…</p>
    </div>
  ),
})

const LegacyView = dynamic(
  () => import('@/components/legacy/legacy-view').then((m) => m.LegacyView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3">
        <GateSpiral size={56} spin title="Abrindo o cofre do Legado" />
        <p className="text-base font-bold text-[#7cb6ec]">Verificando suas conquistas…</p>
      </div>
    ),
  },
)

const PhoneDefense = dynamic(
  () => import('@/components/phone/phone-defense').then((m) => m.PhoneDefenseView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3">
        <GateSpiral size={56} spin title="Ligando o celular" />
        <p className="text-base font-bold text-[#7cb6ec]">Carregando o desafio do celular…</p>
      </div>
    ),
  },
)

const StealthView = dynamic(
  () => import('@/components/stealth/stealth-view').then((m) => m.StealthView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3">
        <GateSpiral size={56} spin title="Abrindo a Sala Segura" />
        <p className="text-base font-bold text-[#7cb6ec]">Montando o quarto do operador…</p>
      </div>
    ),
  },
)

// fonte única de navegação (mesma lista usada na nav lateral do Projeto)
const NAV = SIDE_NAV

const VIEW_IDS = NAV.map((n) => n.id)

const DEFCON_STYLE: Record<number, { c: string; label: string }> = {
  5: { c: '#21a44a', label: 'DEFCON 5 · TRANQUILO' },
  4: { c: '#21a44a', label: 'DEFCON 4 · ATENTO' },
  3: { c: '#d97706', label: 'DEFCON 3 · ALERTA' },
  2: { c: '#d97706', label: 'DEFCON 2 · SEVERO' },
  1: { c: '#c0182b', label: 'DEFCON 1 · CRÍTICO' },
}

function isView(v: string): v is View {
  return (VIEW_IDS as string[]).includes(v)
}

function AuditTrail({ audit }: { audit: AuditEntry[] }) {
  const [actor, setActor] = useState<'TODOS' | AuditEntry['actor']>('TODOS')
  const [q, setQ] = useState('')
  const actorColor: Record<AuditEntry['actor'], string> = {
    OPERADOR: '#2569b8',
    COPILOTO_IA: '#8b5cf6',
    MOTOR: '#21a44a',
  }
  const filtered = audit.filter(
    (a) =>
      (actor === 'TODOS' || a.actor === actor) &&
      (!q || a.detail.toLowerCase().includes(q.toLowerCase()))
  )
  return (
    <section className="cap-panel p-4" aria-label="Trilha de auditoria">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <ClipboardList className="h-5 w-5 text-[var(--cap-cyan)]" aria-hidden />
        <h3 className="cap-heading">Auditoria</h3>
        <span className="cap-mono text-base text-[var(--cap-dim)]">{filtered.length} registros</span>
        <button
          onClick={() => window.print()}
          className="cap-btn-ghost ml-auto hidden min-h-[34px] px-3 text-base font-bold sm:inline-flex"
          title="Imprimir relatório executivo (Ctrl+P)"
        >
          Relatório PDF
        </button>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {(['TODOS', 'OPERADOR', 'COPILOTO_IA', 'MOTOR'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setActor(a)}
            aria-pressed={actor === a}
            className={`rounded-lg border-2 px-2 py-0.5 text-base font-semibold transition-colors ${
              actor === a
                ? 'border-[var(--cap-cyan)]/60 bg-[var(--cap-cyan)]/10 text-[var(--cap-bright)]'
                : 'border-[var(--cap-border)] text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
            }`}
          >
            {a === 'TODOS' ? 'Todos' : a === 'COPILOTO_IA' ? 'IA' : a === 'OPERADOR' ? 'Humano' : 'Motor'}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar ações…"
          className="cap-input ml-auto h-8 w-full max-w-[200px] px-2 text-base sm:w-auto"
          aria-label="Filtrar registros de auditoria"
        />
      </div>
      <ScrollArea className="h-[170px]">
        <ul className="space-y-1.5 pr-2">
          {filtered.length === 0 && (
            <li className="py-6 text-center text-base text-[var(--cap-dim)]">
              Nenhuma ação registrada para este filtro.
            </li>
          )}
          {filtered.map((a, i) => (
            <li
              key={a.id}
              className={`cap-fade-in flex items-start gap-2 rounded-lg px-1.5 py-1 text-base transition-colors hover:bg-[#e3f0ff] ${
                i % 2 === 1 ? 'bg-[var(--cap-panel-raised)]' : ''
              }`}
            >
              <span
                className="cap-mono mt-0.5 shrink-0 rounded px-1 py-0.5 text-base font-bold"
                style={{ color: actorColor[a.actor], background: `${actorColor[a.actor]}14` }}
              >
                {a.actor === 'COPILOTO_IA' ? 'IA' : a.actor === 'OPERADOR' ? 'HUMANO' : 'MOTOR'}
              </span>
              <p className="min-w-0 text-[var(--cap-text)]">
                <span className="cap-mono mr-1 text-base text-[var(--cap-faint)]">
                  {new Date(a.ts).toLocaleTimeString('pt-BR')}
                </span>
                {a.detail}
              </p>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </section>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <PageInner />
    </AuthProvider>
  )
}

function PageInner() {
  const { user, isGuest, isAuthed, ready, signIn, signOut } = useAuth()
  const [view, setView] = useState<View>('projeto')
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<ThreatEvent[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [selected, setSelected] = useState<ThreatEvent | null>(null)
  const [planRef, setPlanRef] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const vigiaState = useVigia()
  const bootedRef = useRef(false)

  useViewMeta(view)

  // restaura a última visão visitada (evita mismatch de hidratação: aplica pós-mount)
  useEffect(() => {
    const t = setTimeout(() => {
      const v = lastView()
      if (v && isView(v) && window.location.hash.replace('#', '') === '') setView(v)
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // hash → view (deep links compartilháveis + botão voltar)
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace('#', '')
      if (isView(h)) {
        setView(h)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  // atalhos: 1–9 navegam, V alterna a voz da VIGIA, F usa a tela cheia da view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // não sequestrar atalhos do navegador/sistema (Ctrl+V, Cmd+1, Alt+…)
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      const idx = Number(e.key) - 1
      if (idx >= 0 && idx < VIEW_IDS.length) {
        window.location.hash = VIEW_IDS[idx]
      } else if (e.key.toLowerCase() === 'v') {
        vigia.toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // conexão com o motor CAPYCORE
  useEffect(() => {
    const s = getSocket()

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onStats = (data: Stats) => setStats(data)
    const onDevices = (data: Device[]) => setDevices(data)
    const onSnapshot = (data: { events: ThreatEvent[] }) => {
      setEvents(data.events)
      if (data.events[0]) setSelected((cur) => cur ?? data.events[0])
    }
    const onAuditSnapshot = (data: AuditEntry[]) => setAudit(data)
    const onAuditEntry = (data: AuditEntry) => setAudit((prev) => [data, ...prev].slice(0, 60))

    const onThreatEvent = (ev: ThreatEvent) => {
      setEvents((prev) => {
        const idx = prev.findIndex((e) => e.id === ev.id)
        if (idx === -1) return [ev, ...prev].slice(0, 80)
        const next = [...prev]
        next[idx] = ev
        return next
      })
      if (ev.status === 'DETECTADO') setSelected(ev)

      const priority = ev.severity === 'CRITICA' && ev.status === 'DETECTADO' ? 2 : 1
      if (ev.status === 'DETECTADO' || ev.status === 'NEUTRALIZADO') {
        vigia.speak(ev.voiceLine, priority)
      } else if (ev.status === 'MITIGANDO' && (ev.severity === 'CRITICA' || ev.severity === 'ALTA')) {
        vigia.speak(ev.voiceLine, 1)
      }

      // notificação do navegador quando crítico e a aba está oculta
      if (ev.severity === 'CRITICA' && ev.status === 'DETECTADO') {
        notifyCritical(`Ameaça crítica: ${ev.title}`, `${ev.voiceLine} — alvo: ${ev.target?.name ?? 'endpoint'}`)
      }
    }

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('stats:update', onStats)
    s.on('devices:update', onDevices)
    s.on('events:snapshot', onSnapshot)
    s.on('audit:snapshot', onAuditSnapshot)
    s.on('audit:entry', onAuditEntry)
    s.on('threat:event', onThreatEvent)

    if (s.connected) queueMicrotask(onConnect)

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.off('stats:update', onStats)
      s.off('devices:update', onDevices)
      s.off('events:snapshot', onSnapshot)
      s.off('audit:snapshot', onAuditSnapshot)
      s.off('audit:entry', onAuditEntry)
      s.off('threat:event', onThreatEvent)
    }
  }, [])

  // primeira narração da VIGIA — só APÓS interação (Chrome exige gesto do
  // usuário para speechSynthesis; falar no mount falha e não repeta)
  useEffect(() => {
    const boot = () => {
      if (!bootedRef.current) {
        bootedRef.current = true
        vigia.boot()
      }
    }
    window.addEventListener('pointerdown', boot, { once: true })
    window.addEventListener('keydown', boot, { once: true })
    return () => {
      window.removeEventListener('pointerdown', boot)
      window.removeEventListener('keydown', boot)
    }
  }, [])

  // GATE DE ÁUDIO: a voz da VIGIA só destrava DEPOIS do login E do tutorial
  // (concluído ou pulado). Enquanto locked, speak() é no-op — nem os eventos
  // do motor CAPYCORE falam antes da hora.
  useEffect(() => {
    if (!isAuthed) return
    const unlock = () => vigia.unlock()
    const offWatch = watchTutorialComplete(unlock)
    const offBus = onTutorialEvent((e) => {
      if (e.type === 'skip') {
        // persiste a decisão de pular: a voz destrava agora e nas próximas sessões
        markTutorialDone()
        unlock()
      }
    })
    return () => {
      offWatch()
      offBus()
    }
  }, [isAuthed])

  // reagenda o scroll do plano, sempre limpando o timer anterior
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
  }, [])

  const goPlan = useCallback((ref: string) => {
    setPlanRef(ref)
    window.location.hash = 'plano'
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      document.getElementById(`plan-${ref}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 220)
  }, [])

  const defcon = DEFCON_STYLE[stats?.defcon ?? 5]
  const legacy = useLegacyProgress()

  // Portão de autenticação: splash de restauração → login profissional → dashboard
  if (!ready) {
    return (
      <div className="cap-bg-grid flex min-h-screen flex-col items-center justify-center gap-4">
        <GateSpiral size={72} spin title="Restaurando sessão" />
        <p className="cap-mono text-base font-bold text-[var(--cap-text)]">Restaurando sessão segura…</p>
      </div>
    )
  }

  if (!isAuthed) {
    return <AuthGate onSuccess={(u) => signIn(u as SafeUserLike | null)} />
  }

  return (
    <div className="cap-bg-grid flex min-h-screen flex-col">
      {/* acessibilidade: pular direto para o conteúdo */}
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-[var(--cap-ink)] focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-40 border-b-2 border-[var(--cap-border)] bg-[#f4f9ff]/90 backdrop-blur-md">
        <span className="cap-header-accent" aria-hidden />
        <div className="mx-auto flex w-full max-w-[1560px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-5">
          <a href="#projeto" className="cap-skew-plate flex items-center gap-2.5 px-4 py-1.5" aria-label="Ir para a apresentação do CAPYBER">
            <CapShield size={46} />
            <span className="cap-logo text-[1.35rem] leading-none sm:text-[1.7rem]">CAPYBER</span>
          </a>

          <nav className="order-3 w-full pb-1 sm:order-2 sm:w-auto" aria-label="Navegação principal">
            <div className="cap-nav-bar cap-nav-grid">
              {NAV.map((n, i) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="cap-tab"
                  data-tut={`nav-${n.id}`}
                  data-state={view === n.id ? 'active' : 'inactive'}
                  aria-current={view === n.id ? 'page' : undefined}
                  title={n.id === 'legado' && !legacy.unlocked ? 'Legado — conclua todas as experiências para desbloquear' : `Atalho: ${i + 1}`}
                >
                  <n.icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="cap-tab-label">{n.label}</span>
                  {n.id === 'legado' && (
                    <span
                      aria-hidden
                      className={`absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                        legacy.unlocked ? 'bg-[#21a44a] text-white' : 'bg-[#10315c]/70 text-[#ffb020]'
                      }`}
                    >
                      {legacy.unlocked ? <Sparkles className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </nav>

          <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
            <span
              className={`hidden rounded-full border-2 px-2.5 py-1 text-base font-bold tracking-wide lg:inline-block ${
                (stats?.defcon ?? 5) <= 2 ? 'cap-defcon-hot' : ''
              }`}
              style={{ color: defcon.c, borderColor: `${defcon.c}88`, background: `${defcon.c}14` }}
              title="Nível de prontidão baseado nas ameaças ativas"
              data-tut="defcon-badge"
            >
              {defcon.label}
            </span>
            <VigiaToggle />
            <NotifyBell />
            <span
              className={`flex items-center gap-1.5 rounded-full border-2 px-2 py-1 text-base font-extrabold tracking-wide sm:px-3 ${
                connected
                  ? 'border-[#c76e00]/60 bg-gradient-to-b from-[#ffb24d] to-[#f5920b] text-[#10315c] shadow-[0_2px_10px_rgba(245,146,11,0.45)]'
                  : 'cap-blink border-[#7a0a18]/60 bg-gradient-to-b from-[#e0243a] to-[#b01226] text-white'
              }`}
              data-tut="motor-status"
            >
              <Zap className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{connected ? 'MOTOR ONLINE' : 'MOTOR OFFLINE'}</span>
            </span>
            {user ? (
              <UserMenu
                user={user}
                onLogout={() => signOut()}
                onUserUpdated={(u) => signIn(u)}
              />
            ) : isGuest ? (
              <button
                onClick={() => signOut()}
                className="cap-btn-steel flex min-h-[36px] items-center gap-1.5 px-3 text-base font-extrabold"
                title="Sair do modo visitante e entrar com sua conta"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                ENTRAR
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="relative z-[1] mx-auto w-full max-w-[1560px] flex-1 px-2 pb-8 pt-4 sm:px-5 2xl:max-w-[1840px]">
        {view === 'projeto' && (
          <Overview
            view={view}
            onEnter={setView}
            onOpenChat={() => setChatOpen(true)}
            stats={stats}
            events={events}
            devices={devices}
            connected={connected}
          />
        )}

        {view === 'comando' && (
          <div className="space-y-4">
            <StatsBar stats={stats} connected={connected} />

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="cap-panel relative overflow-hidden p-4">
                  <h2 className="cap-heading mb-2">Mapa global de ameaças</h2>
                  <Globe3D events={events} />
                </div>
                <AlertWorkbench event={selected} onGoPlan={goPlan} />
                <CopilotPanel events={events} devices={devices} connected={connected} />
              </div>

              <div className="flex min-h-0 flex-col">
                <ThreatFeed events={events} selectedId={selected?.id ?? null} onSelect={setSelected} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <RadarPanel events={events} stats={stats} />
              <OriginPanel stats={stats} />
              <FleetMini devices={devices} />
            </div>

            <AuditTrail audit={audit} />
          </div>
        )}

        {view === 'trilha' && <TrilhaView3D />}
        {view === 'osint' && <OsintView />}
        {view === 'livro' && <Book3DView />}
        {view === 'pergaminho' && <ScrollView />}
        {view === 'ctf' && <GhostCtf />}
        {view === 'stealth' && <StealthView />}
        {view === 'celular' && <PhoneDefense />}
        {view === 'frota' && <FleetView devices={devices} />}
        {view === 'lab' && <LabView onTriggered={() => (window.location.hash = 'comando')} />}
        {view === 'plano' && <PlanView highlightRef={planRef} />}
        {view === 'legado' && <LegacyView />}
      </main>

      <footer className="relative z-[1] mt-auto border-t-2 border-[var(--cap-border)] bg-[#f4f9ff]/85 backdrop-blur-sm">
        <span className="cap-header-accent" aria-hidden style={{ bottom: 'auto', top: '-2px' }} />
        <div className="mx-auto flex w-full max-w-[1560px] flex-wrap items-center gap-x-5 gap-y-3 px-3 py-3 sm:px-5">
          <div className="cap-skew-plate flex min-w-0 items-center gap-3 px-4 py-2">
            <CapyBadge size={48} />
            <div className="min-w-0">
              <span className="block font-heading text-base font-extrabold tracking-wide text-[var(--cap-bright)]">
                VIGIA {vigiaState.speaking ? '• TRANSMITINDO' : '• EM ESCUTA'}
              </span>
              <span className="block truncate text-[0.95rem] text-[var(--cap-text)]" aria-live="polite">
                {vigiaState.caption || 'Monitoramento ativo.'}
              </span>
            </div>
          </div>

          <div className="cap-skew-plate ml-auto flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1 px-6 py-2">
            <span className="cap-logo text-[1.6rem] leading-none">CAPYBER</span>
            <span className="text-[0.95rem] font-semibold text-[var(--cap-text)]">
              Proteção de endpoints · 100% defensivo · dados sintéticos
            </span>
            <PrivacyTrigger />
            <ProjectDownload />
          </div>

          <div className="cap-stripes ml-auto hidden h-9 md:flex" aria-hidden>
            <i /><i /><i /><i /><i /><i />
          </div>
        </div>
      </footer>

      <MascotChat open={chatOpen} onToggle={() => setChatOpen((o) => !o)} onGoPlan={goPlan} kbSize={KB_STATS.questionForms} hideLauncher={view === 'projeto'} />

      {/* Tutorial RPG guiado (Clique aqui e verás…) + botão flutuante de ajuda */}
      <RpgTutorial />
      <TutorialFab />

      {/* Kit PRO: paleta Ctrl+K, ajuda ?, notificações, voltar ao topo, boas-vindas */}
      <CommandPalette />
      <ShortcutsHelp />
      <ScrollTopButton />
      <WelcomeToast name={user?.name ?? 'Operador'} guest={isGuest} />

      {/* LGPD: consentimento de cookies + política de privacidade (footer) */}
      <CookieConsent />
    </div>
  )
}
