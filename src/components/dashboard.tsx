'use client'

// CAPYBER — painéis do Centro de Comando: stats, feed, workbench, radar, origens, frota.

import { useMemo, useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Radio, ShieldCheck, Activity, Globe2, Zap, HelpCircle, ShieldAlert, ListChecks, Check, SearchX } from 'lucide-react'
import {
  KILL_CHAIN,
  SEVERITY_COLOR,
  type Device,
  type Stats,
  type ThreatEvent,
  type Severity,
  type EventStatus,
} from '@/lib/types'

export function fmtBRL(v: number): string {
  if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(2).replace('.', ',')} bi`
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')} mi`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')} mil`
  return `R$ ${v}`
}

export function fmtUptime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function StatsBar({ stats, connected }: { stats: Stats | null; connected: boolean }) {
  const items = [
    {
      icon: ShieldCheck,
      label: 'Ataques neutralizados',
      value: stats ? stats.blockedTotal.toLocaleString('pt-BR') : '—',
      color: '#16a34a',
      cls: 'text-[var(--cap-bright)]',
    },
    {
      icon: Globe2,
      label: 'Valor protegido',
      value: stats ? fmtBRL(stats.protectedBRL) : '—',
      color: '#f5920b',
      cls: 'text-[var(--cap-bright)]',
    },
    {
      icon: Activity,
      label: 'Ameaças ativas',
      value: stats ? String(stats.activeThreats) : '—',
      color: '#e11d2e',
      cls: stats && stats.activeThreats > 0 ? 'text-[var(--cap-danger)]' : 'text-[var(--cap-glow)]',
    },
    {
      icon: Zap,
      label: 'Frota segura',
      value: stats ? `${stats.devicesSecure}/${stats.devicesTotal}` : '—',
      color: '#2f7fd1',
      cls: 'text-[var(--cap-bright)]',
    },
    {
      icon: Radio,
      label: 'Motor CAPYCORE',
      value: connected ? 'ONLINE' : 'OFFLINE',
      color: connected ? '#16a34a' : '#e11d2e',
      cls: connected ? 'text-[var(--cap-glow)]' : 'text-[var(--cap-danger)]',
    },
  ]
  return (
    <div className="cap-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="cap-panel cap-card-hover flex items-center gap-3 p-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_10px_-4px_rgba(16,49,92,0.35)]"
            style={{ borderColor: `${it.color}55`, background: `linear-gradient(180deg, ${it.color}1f, ${it.color}0d)` }}
          >
            <it.icon className="h-[22px] w-[22px]" style={{ color: it.color }} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="text-base font-semibold leading-tight text-[var(--cap-dim)]">{it.label}</div>
            {!stats && it.label !== 'Motor CAPYCORE' ? (
              <div className="cap-skeleton mt-0.5 h-6 w-20" aria-hidden />
            ) : (
              <div className={`cap-mono cap-num text-xl font-bold leading-tight ${it.cls}`}>{it.value}</div>
            )}
          </div>
        </div>
      ))}
      {!connected && (
        <div className="col-span-2 flex items-center sm:col-span-3 lg:col-span-5">
          <span className="cap-mono inline-flex items-center gap-1.5 rounded-lg border-2 border-[#d9770666] bg-[#d977060d] px-2.5 py-1 text-sm font-bold text-[#b45309]">
            <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden />
            exibindo último snapshot — dados podem estar desatualizados
          </span>
        </div>
      )}
    </div>
  )
}

export function SeverityChip({ s }: { s: Severity }) {
  const label = s === 'CRITICA' ? 'CRÍTICA' : s === 'MEDIA' ? 'MÉDIA' : s
  return <span className={`cap-sev cap-sev-${s.toLowerCase()}`}>{label}</span>
}

export function StatusChip({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, { c: string; label: string }> = {
    DETECTADO: { c: '#ff5d78', label: 'DETECTADO' },
    MITIGANDO: { c: '#ffc94d', label: 'MITIGANDO' },
    NEUTRALIZADO: { c: '#3fe37e', label: 'NEUTRALIZADO' },
  }
  const { c, label } = map[status]
  return (
    <span
      className={`inline-block rounded-lg border-2 px-2 py-0.5 text-base font-bold tracking-wide ${status !== 'NEUTRALIZADO' ? 'cap-blink' : ''}`}
      style={{ color: c, borderColor: `${c}66`, background: `${c}14` }}
    >
      {label}
    </span>
  )
}

export function ThreatFeed({
  events,
  selectedId,
  onSelect,
}: {
  events: ThreatEvent[]
  selectedId: string | null
  onSelect: (e: ThreatEvent) => void
}) {
  const [sev, setSev] = useState<'TODAS' | Severity>('TODAS')
  const [status, setStatus] = useState<'TODOS' | 'ATIVOS' | EventStatus>('TODOS')
  const [q, setQ] = useState('')

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (sev === 'TODAS' || e.severity === sev) &&
          (status === 'TODOS' ||
            (status === 'ATIVOS' ? e.status !== 'NEUTRALIZADO' : e.status === status)) &&
          (!q ||
            e.title.toLowerCase().includes(q.toLowerCase()) ||
            e.target?.name?.toLowerCase().includes(q.toLowerCase()) ||
            e.origin?.country?.toLowerCase().includes(q.toLowerCase()) ||
            e.mitre?.id?.toLowerCase().includes(q.toLowerCase()))
      ),
    [events, sev, status, q]
  )

  return (
    <div className="cap-panel flex min-h-0 flex-col p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="cap-eyebrow">Ao vivo</span>
          <h3 className="cap-heading">Alertas em tempo real</h3>
        </div>
        <span className="cap-dot-live mt-1.5 shrink-0" aria-hidden />
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por título, endpoint, país ou MITRE…"
        className="cap-input mb-2 h-9 w-full px-3 text-base"
        aria-label="Buscar alertas"
      />

      <div className="mb-2.5 flex flex-wrap gap-1">
        {(['TODAS', 'CRITICA', 'ALTA', 'MEDIA'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSev(s)}
            className={`rounded-lg border-2 px-2 py-0.5 text-base font-semibold transition-colors ${
              sev === s
                ? 'border-[var(--cap-orange)]/60 bg-[var(--cap-orange)]/15 text-[var(--cap-bright)]'
                : 'border-[var(--cap-border)] text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
            }`}
            aria-pressed={sev === s}
          >
            {s === 'TODAS' ? 'Todas' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
        <span className="mx-1 w-px self-stretch bg-[var(--cap-border)]" aria-hidden />
        {(['ATIVOS', 'DETECTADO', 'MITIGANDO', 'NEUTRALIZADO'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg border-2 px-2 py-0.5 text-base font-semibold transition-colors ${
              status === s
                ? 'border-[var(--cap-orange)]/60 bg-[var(--cap-orange)]/15 text-[var(--cap-bright)]'
                : 'border-[var(--cap-border)] text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
            }`}
            aria-pressed={status === s}
          >
            {s === 'ATIVOS' ? 'Ativos' : s === 'NEUTRALIZADO' ? 'Resolvidos' : s === 'DETECTADO' ? 'Detectados' : 'Mitigando'}
          </button>
        ))}
      </div>

      <div className="cap-scroll-slim h-[300px] min-h-0 overflow-y-auto pr-1 lg:h-[400px]">
        <ul className="cap-stagger space-y-1.5">
          {filtered.length === 0 && (
            <li className="cap-fade-in flex flex-col items-center gap-1.5 py-10 text-center">
              <SearchX className="h-8 w-8 text-[var(--cap-faint)]" aria-hidden />
              <p className="text-base font-bold text-[var(--cap-dim)]">Nenhum alerta neste filtro</p>
              <p className="text-sm text-[var(--cap-faint)]">Ajuste a busca ou os filtros para ver mais resultados.</p>
            </li>
          )}
          {filtered.map((ev) => (
            <li key={ev.id}>
              <button
                onClick={() => onSelect(ev)}
                className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                  selectedId === ev.id
                    ? 'border-[var(--cap-orange)]/55 bg-[var(--cap-orange)]/10'
                    : 'border-[var(--cap-border)] bg-[var(--cap-panel-raised)] hover:border-[var(--cap-cyan)]/40 hover:bg-[#e3f0ff] hover:shadow-[0_6px_16px_-10px_rgba(16,49,92,0.45)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SeverityChip s={ev.severity} />
                  <StatusChip status={ev.status} />
                  <span className="cap-mono ml-auto rounded-lg border border-[var(--cap-border)] px-1.5 py-0.5 text-base text-[var(--cap-dim)]">
                    {ev.mitre.id}
                  </span>
                </div>
                <div className="mt-1.5 truncate text-base font-bold text-[var(--cap-bright)]">
                  {ev.title}
                </div>
                <div className="mt-0.5 truncate text-base text-[var(--cap-dim)]">
                  {ev.origin.country} · {ev.origin.city} → {ev.target.name} · {ev.phaseName}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function AlertWorkbench({
  event,
  onGoPlan,
}: {
  event: ThreatEvent | null
  onGoPlan: (ref: string) => void
}) {
  const [tab, setTab] = useState<'perguntas' | 'prevenir' | 'agir'>('perguntas')
  const [done, setDone] = useState<Set<string>>(new Set())
  // relógio local para o T+ sem chamar Date.now() durante o render (pureza)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!event) {
    return (
      <div className="cap-panel cap-fade-in flex h-full min-h-[260px] flex-col items-center justify-center gap-2 p-8 text-center">
        <ShieldAlert className="h-9 w-9 text-[var(--cap-faint)]" aria-hidden />
        <p className="text-base text-[var(--cap-dim)]">
          Selecione um alerta para abrir o <strong className="text-[var(--cap-bright)]">workbench de resposta</strong>.
        </p>
      </div>
    )
  }

  const pb = event.playbook
  const toggleDone = (k: string) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  const elapsed = Math.max(0, Math.round((now - event.ts) / 1000))

  return (
    <div className="cap-panel flex min-h-0 flex-col p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="cap-heading">Workbench de resposta</h3>
        <SeverityChip s={event.severity} />
        <StatusChip status={event.status} />
        <span className="cap-mono cap-num ml-auto text-base text-[var(--cap-dim)]">
          T+{elapsed}s · {event.mitre.id} {event.mitre.name}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-1 sm:grid-cols-6">
        {KILL_CHAIN.map((phase, i) => {
          const passed = event.phase >= i
          const current = event.phase === i && event.status !== 'NEUTRALIZADO'
          return (
            <div key={phase} className="text-center">
              <div
                className={`mx-auto mb-1 h-1.5 w-full rounded-full ${
                  current
                    ? 'cap-blink bg-[var(--cap-danger)]'
                    : passed
                      ? 'bg-[var(--cap-glow)]'
                      : 'bg-[#0d2038]/10'
                }`}
              />
              <div
                className={`text-base leading-tight ${current ? 'font-bold text-[var(--cap-warn)]' : passed ? 'text-[var(--cap-bright)]' : 'text-[var(--cap-faint)]'}`}
              >
                {phase}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-lg font-bold text-[var(--cap-bright)]">{event.title}</p>
      <p className="mt-1 text-base leading-relaxed text-[var(--cap-text)]">{event.description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="cap-badge cap-mono">
          {event.origin.city} ({event.origin.countryCode})
        </Badge>
        <Badge variant="outline" className="cap-badge">
          alvo: {event.target.org}
        </Badge>
        <Badge variant="outline" className="cap-badge">
          contramedida: {event.mitigation}
        </Badge>
      </div>

      <div className="mt-4 flex gap-1 border-b border-[var(--cap-border)]">
        {([
          ['perguntas', 'Perguntas de triagem', HelpCircle],
          ['prevenir', 'Como prevenir', ShieldCheck],
          ['agir', 'Como agir', ListChecks],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-base font-bold transition-colors ${
              tab === key
                ? 'border-[var(--cap-orange)] text-[var(--cap-bright)]'
                : 'border-transparent text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
            }`}
            aria-pressed={tab === key}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="pt-3">
        {tab === 'perguntas' && (
          <ul className="cap-stagger space-y-2">
            {pb.questions.map((qa, i) => (
              <li key={i} className="rounded-xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-3">
                <p className="text-base font-bold text-[var(--cap-bright)]">
                  {i + 1}. {qa.q}
                </p>
                <p className="mt-0.5 text-base text-[var(--cap-dim)]">{qa.why}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === 'prevenir' && (
          <ul className="cap-stagger space-y-1.5">
            {pb.prevent.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-base text-[var(--cap-text)]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cap-glow)]" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        )}

        {tab === 'agir' && (
          <ol className="cap-stagger space-y-1.5">
            {pb.actions.map((a, i) => {
              const key = `${event.id}-${i}`
              const isDone = done.has(key)
              return (
                <li key={i} className="flex items-start gap-2">
                  <button
                    onClick={() => toggleDone(key)}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      isDone
                        ? 'border-[var(--cap-glow)] bg-[var(--cap-glow)]/20 text-[var(--cap-glow)]'
                        : 'border-[var(--cap-border-strong)] text-transparent hover:border-[#0d2038]/50'
                    }`}
                    aria-label={`Marcar passo ${i + 1} como executado`}
                    aria-pressed={isDone}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-base font-bold ${isDone ? 'text-[var(--cap-dim)] line-through' : 'text-[var(--cap-bright)]'}`}>
                      {a.step}
                    </p>
                    <p className="text-base text-[var(--cap-dim)]">{a.detail}</p>
                  </div>
                  {a.planRef && (
                    <button
                      onClick={() => {
                        if (a.planRef) onGoPlan(a.planRef)
                      }}
                      title="Abrir o plano relacionado"
                      className="cap-mono shrink-0 rounded-lg border-2 border-[var(--cap-border-strong)] px-1.5 py-0.5 text-base text-[var(--cap-cyan)] hover:bg-[#0d2038]/5"
                    >
                      {a.planRef}
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}

export function RadarPanel({ events, stats }: { events: ThreatEvent[]; stats: Stats | null }) {
  const active = useMemo(() => events.filter((e) => e.status !== 'NEUTRALIZADO'), [events])
  const blips = useMemo(
    () =>
      active.map((ev) => {
        let hash = 0
        for (let i = 0; i < ev.id.length; i++) hash = (hash * 31 + ev.id.charCodeAt(i)) % 360
        const angle = (hash * Math.PI) / 180
        const radius = ev.severity === 'CRITICA' ? 18 : ev.severity === 'ALTA' ? 34 : 50
        return {
          ev,
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius,
          color: SEVERITY_COLOR[ev.severity],
        }
      }),
    [active]
  )
  return (
    <div className="cap-panel p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="cap-eyebrow">Varredura</span>
          <h3 className="cap-heading">Radar de setores</h3>
        </div>
        <span className="cap-mono cap-num shrink-0 text-base text-[var(--cap-dim)]">
          DEFCON {stats?.defcon ?? '—'}
        </span>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[240px]">
        <div className="cap-radar absolute inset-0 rounded-full">
          <div className="cap-radar-sweep" aria-hidden />
          {blips.map((b) => (
            <div
              key={b.ev.id}
              className={`cap-blink absolute h-2.5 w-2.5 rounded-full ${b.ev.severity === 'CRITICA' ? 'cap-pulse-ring' : ''}`}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                background: b.color,
                boxShadow: `0 0 10px ${b.color}`,
              }}
              title={`${b.ev.title} — ${b.ev.status}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-base text-[var(--cap-dim)]">
        <span className="cap-num font-bold text-[var(--cap-bright)]">{active.length}</span> sinal(is) na área
      </p>
    </div>
  )
}

export function OriginPanel({ stats }: { stats: Stats | null }) {
  const rows = useMemo(() => {
    if (!stats?.byCountry) return []
    return Object.entries(stats.byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [stats])
  const max = rows[0]?.[1] ?? 1
  return (
    <div className="cap-panel p-4">
      <div className="mb-3">
        <span className="cap-eyebrow">Origens</span>
        <h3 className="cap-heading">Top origens detectadas</h3>
      </div>
      <ul className="cap-stagger space-y-2">
        {rows.map(([cc, n]) => (
          <li key={cc} className="flex items-center gap-2 text-base">
            <span className="cap-mono w-9 font-bold text-[var(--cap-bright)]">{cc}</span>
            <div className="cap-xpbar h-2.5 flex-1">
              <i
                style={{
                  width: `${(n / max) * 100}%`,
                  background: 'linear-gradient(90deg, rgba(47,127,209,0.45), #2f7fd1)',
                }}
              />
            </div>
            <span className="cap-mono cap-num w-16 text-right text-base text-[var(--cap-dim)]">{n.toLocaleString('pt-BR')}</span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="cap-fade-in flex flex-col items-center gap-1.5 py-8 text-center">
            <Globe2 className="h-8 w-8 text-[var(--cap-faint)]" aria-hidden />
            <p className="text-base font-bold text-[var(--cap-dim)]">Sem dados de origem ainda</p>
            <p className="text-sm text-[var(--cap-faint)]">As detecções aparecem aqui assim que o motor reportar.</p>
          </li>
        )}
      </ul>
    </div>
  )
}

export function FleetMini({ devices }: { devices: Device[] }) {
  const iso = devices.filter((d) => d.status === 'ISOLADO').length
  const alert = devices.filter((d) => d.status === 'ALERTA').length
  return (
    <div className="cap-panel p-4">
      <div className="mb-3">
        <span className="cap-eyebrow">Frota</span>
        <h3 className="cap-heading">Frota monitorada</h3>
      </div>
      <div className="cap-stagger grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="cap-mono cap-num text-3xl font-bold text-[var(--cap-glow)]">
            {devices.filter((d) => d.status === 'SEGURO').length}
          </div>
          <div className="text-base text-[var(--cap-dim)]">Seguras</div>
        </div>
        <div>
          <div className={`cap-mono cap-num text-3xl font-bold ${alert ? 'text-[var(--cap-warn)]' : 'text-[var(--cap-faint)]'}`}>{alert}</div>
          <div className="text-base text-[var(--cap-dim)]">Em alerta</div>
        </div>
        <div>
          <div className={`cap-mono cap-num text-3xl font-bold ${iso ? 'text-[var(--cap-danger)]' : 'text-[var(--cap-faint)]'}`}>{iso}</div>
          <div className="text-base text-[var(--cap-dim)]">Isoladas</div>
        </div>
      </div>
    </div>
  )
}
