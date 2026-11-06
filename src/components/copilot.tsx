'use client'

// CAPYBER — Operador IA: triagem assistida por IA com execução auditada.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Cog, CheckCircle2, Sparkles } from 'lucide-react'
import type { Device, ThreatEvent } from '@/lib/types'

interface CopilotLine {
  ts: number
  kind: 'info' | 'thinking' | 'decision' | 'action'
  text: string
}

const THINK_MS = 900

function actorLabel(action: string): string {
  switch (action) {
    case 'ISOLAR': return 'isolar endpoint'
    case 'VARREDURA': return 'varredura da frota'
    case 'REVOGAR_SESSOES': return 'revogação de sessões'
    default: return action
  }
}

export function CopilotPanel({
  events,
  devices,
  connected,
}: {
  events: ThreatEvent[]
  devices: Device[]
  connected: boolean
}) {
  const [active, setActive] = useState(false)
  const [lines, setLines] = useState<CopilotLine[]>([])
  const [busy, setBusy] = useState(false)
  const handledRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  const toggleActive = (next: boolean) => {
    setActive(next)
    if (!next) {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      setBusy(false)
    }
  }

  const push = useCallback((kind: CopilotLine['kind'], text: string) => {
    setLines((prev) => [...prev.slice(-40), { ts: Date.now(), kind, text }])
  }, [])

  const execute = useCallback(
    async (deviceId: string | undefined, action: string, justification: string) => {
      try {
        const res = await fetch('/api/device/action?XTransformPort=3003', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: deviceId ?? undefined, action, actor: 'COPILOTO_IA' }),
        })
        const data = (await res.json()) as { ok?: boolean; message?: string }
        push(
          'action',
          data.ok
            ? `Executado (${actorLabel(action)}): ${data.message} — ${justification}`
            : `Ação ${action} recusada pelo motor: ${data.message ?? 'estado inconsistente'}`
        )
      } catch {
        push('info', `Ação ${action} não pôde ser enviada (motor offline).`)
      }
    },
    [push]
  )

  const handleEvent = useCallback(
    async (ev: ThreatEvent) => {
      setBusy(true)
      push('info', `Novo alerta: ${ev.title} (${ev.severity}) — MITRE ${ev.mitre.id}, fase ${ev.phaseName}.`)

      const t1 = setTimeout(() => push('thinking', 'Correlacionando com a postura da frota, origem e histórico de técnicas...'), THINK_MS)
      const t2 = setTimeout(async () => {
        try {
          const res = await fetch('/api/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: {
                id: ev.id,
                title: ev.title,
                kind: ev.kind,
                severity: ev.severity,
                mitreId: ev.mitre.id,
                phaseName: ev.phaseName,
                originCountry: ev.origin.country,
                targetOrg: ev.target.org,
              },
              devices: devices.map((d) => ({ id: d.id, status: d.status, threatScore: d.threatScore })),
            }),
          })
          const data = (await res.json()) as {
            source?: 'llm' | 'deterministico'
            decision?: { summary: string; confidence: number; actions: { action: string; deviceId?: string; justification: string }[] }
            error?: string
          }
          if (!data.decision) {
            push('info', 'Operador IA indisponível — alerta segue para resposta humana.')
            setBusy(false)
            return
          }
          push(
            'decision',
            `${data.source === 'llm' ? 'Decisão do modelo' : 'Decisão do motor determinístico'} (confiança ${(data.decision.confidence * 100).toFixed(0)}%): ${data.decision.summary}`
          )
          for (const a of data.decision.actions) {
            if (a.action !== 'NENHUMA') {
              await execute(a.deviceId, a.action, a.justification)
            }
          }
        } catch {
          push('info', 'Falha ao consultar o Operador IA. Alerta segue para resposta humana.')
        }
        setBusy(false)
      }, THINK_MS * 2)

      timersRef.current.push(t1, t2)
    },
    [devices, execute, push]
  )

  useEffect(() => {
    if (!active || !connected) return
    const fresh = events.filter(
      (e) => e.status === 'DETECTADO' && !handledRef.current.has(e.id)
    )
    if (fresh.length === 0) return
    const ev = fresh[0]
    handledRef.current.add(ev.id)
    void handleEvent(ev)
  }, [events, active, connected, handleEvent])

  return (
    <div className="cap-panel flex flex-col p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
            active ? 'border-[var(--cap-glow)]/50 bg-[var(--cap-glow)]/10' : 'border-[var(--cap-border-strong)] bg-[#0d2038]/5'
          }`}
        >
          <Bot className={`h-5 w-5 ${active ? 'text-[var(--cap-glow)]' : 'text-[var(--cap-bright)]'}`} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[var(--cap-bright)]">Operador IA</h3>
            {active && (
              <span className="rounded-md bg-[var(--cap-glow)]/15 px-1.5 py-0.5 text-base font-bold tracking-wide text-[var(--cap-glow)]">
                {busy ? 'ANALISANDO…' : 'ATIVO'}
              </span>
            )}
          </div>
          <p className="text-base text-[var(--cap-dim)]">
            {active
              ? 'A IA tria cada alerta, explica a decisão e executa ações seguras — com auditoria.'
              : 'A IA opera o SOC; o operador mantém poder de desfazer.'}
          </p>
        </div>
        <Switch
          checked={active}
          onCheckedChange={toggleActive}
          aria-label="Ativar modo Operador IA"
          disabled={!connected}
        />
      </div>

      <ScrollArea
        className="cap-scroll-slim mt-3 h-[190px] [&_[data-slot=scroll-area-thumb]]:bg-[#9cc3ea]"
        aria-label="Registro de triagem do Operador IA"
      >
        <div className="cap-stagger space-y-1.5 pr-2">
          {lines.length === 0 && (
            <p className="flex items-center gap-2 py-6 text-center text-base text-[var(--cap-dim)]">
              <Sparkles className="h-4 w-4" aria-hidden />
              Ative o modo IA e dispare um cenário no Laboratório.
            </p>
          )}
          {lines.map((l, i) => {
            // bolhas diferenciadas por tipo de linha (info · raciocínio · decisão · ação)
            const bubble =
              l.kind === 'thinking'
                ? 'border-l-2 border-[var(--cap-cyan)]/50 bg-[var(--cap-cyan)]/5'
                : l.kind === 'decision'
                  ? 'border-l-2 border-[var(--cap-glow)]/60 bg-[var(--cap-glow)]/10'
                  : l.kind === 'action'
                    ? 'border-l-2 border-[var(--cap-glow)]/40 bg-[var(--cap-glow)]/5'
                    : ''
            return (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-r-lg px-2 py-1 text-base ${bubble}`}
              >
                {l.kind === 'thinking' && <Cog className="cap-blink mt-0.5 h-4 w-4 shrink-0 text-[var(--cap-cyan)]" aria-hidden />}
                {l.kind === 'decision' && <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cap-glow)]" aria-hidden />}
                {l.kind === 'action' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cap-glow)]" aria-hidden />}
                {l.kind === 'info' && <span className="cap-mono mt-0.5 w-4 shrink-0 text-center text-[var(--cap-faint)]">›</span>}
                <p className={`leading-relaxed ${l.kind === 'decision' ? 'text-[var(--cap-bright)]' : 'text-[var(--cap-text)]'}`}>
                  <span className="cap-mono cap-num mr-1.5 text-base text-[var(--cap-faint)]">
                    {new Date(l.ts).toLocaleTimeString('pt-BR')}
                  </span>
                  {l.text}
                </p>
              </div>
            )
          })}

          {/* indicador de digitação: três pontos quicando (respeita reduced motion) */}
          {busy && (
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--cap-cyan)] motion-safe:animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-[var(--cap-cyan)] motion-safe:animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-[var(--cap-cyan)] motion-safe:animate-bounce [animation-delay:300ms]" />
              <span className="cap-mono ml-1 text-base text-[var(--cap-dim)]">analisando alerta…</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* rodapé fixo: estado do operador IA sempre visível */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--cap-border)] pt-2">
        <span className="cap-mono text-[11px] uppercase tracking-wider text-[var(--cap-faint)]">
          motor auditado · ações reversíveis
        </span>
        <span
          className={`cap-mono text-[11px] font-bold tracking-wider ${
            busy ? 'text-[var(--cap-cyan)]' : 'text-[var(--cap-faint)]'
          }`}
        >
          {busy ? 'PROCESSANDO' : active ? 'EM ESCUTA' : 'STANDBY'}
        </span>
      </div>
    </div>
  )
}
