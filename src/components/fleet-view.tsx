'use client'

// CAPYBER — frota de endpoints: ações reais (isolar/varrer/revogar) com auditoria.

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Laptop, MonitorSmartphone, Smartphone, Server, ShieldOff, ScanSearch, KeyRound, Undo2, Loader2 } from 'lucide-react'
import type { Device, DeviceActionName } from '@/lib/types'

const CONTROL_LABEL: Record<string, string> = {
  EDR: 'EDR/XDR',
  DISK_CRYPT: 'Criptografia de disco',
  ALLOWLIST: 'Allowlist de apps',
  USB_BLOCK: 'USB bloqueado',
  MDM: 'MDM/MAM',
  MFA_HARD: 'MFA FIDO2',
  DLP: 'DLP',
}

const STATUS_STYLE: Record<Device['status'], { c: string; label: string }> = {
  SEGURO: { c: '#16a34a', label: 'SEGURO' },
  ALERTA: { c: '#d97706', label: 'ALERTA' },
  ISOLADO: { c: '#e11d2e', label: 'ISOLADO' },
}

function DeviceIcon({ type }: { type: Device['type'] }) {
  const cls = 'h-5 w-5 text-white'
  let icon: React.ReactNode
  if (type === 'NOTEBOOK') icon = <Laptop className={cls} aria-hidden />
  else if (type === 'MOBILE') icon = <Smartphone className={cls} aria-hidden />
  else if (type === 'SERVER') icon = <Server className={cls} aria-hidden />
  else icon = <MonitorSmartphone className={cls} aria-hidden />
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cap-ink)]">
      {icon}
    </span>
  )
}

export function FleetView({ devices }: { devices: Device[] }) {
  const [filter, setFilter] = useState<'TODOS' | Device['type']>('TODOS')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // limpa o timer do toast no unmount
  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    },
    []
  )

  function showToast(msg: string) {
    // cancela o timer do toast anterior: duas ações seguidas não se apagam mutuamente
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3500)
  }

  const shown = devices.filter((d) => filter === 'TODOS' || d.type === filter)
  const counts = {
    NOTEBOOK: devices.filter((d) => d.type === 'NOTEBOOK').length,
    WORKSTATION: devices.filter((d) => d.type === 'WORKSTATION').length,
    MOBILE: devices.filter((d) => d.type === 'MOBILE').length,
    SERVER: devices.filter((d) => d.type === 'SERVER').length,
  }

  async function act(deviceId: string, action: DeviceActionName) {
    setBusy(deviceId + action)
    try {
      const res = await fetch('/api/device/action?XTransformPort=3003', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action, actor: 'OPERADOR' }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string; error?: string } | null
      if (!res.ok || !data) {
        showToast(data?.error ?? 'Ação recusada pelo motor')
        return
      }
      showToast(data.ok ? data.message ?? 'Ação executada' : data.error ?? 'Ação recusada')
    } catch {
      showToast('Falha de rede ao falar com o motor CAPYCORE')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="cap-panel flex flex-wrap items-center gap-3 p-4">
        <h2 className="text-2xl font-bold text-[var(--cap-bright)]">Frota de endpoints</h2>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {(['TODOS', 'NOTEBOOK', 'WORKSTATION', 'MOBILE', 'SERVER'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`cap-num inline-flex min-h-10 items-center rounded-lg border-2 px-2.5 py-1 text-base font-semibold transition-colors ${
                filter === t
                  ? 'border-[var(--cap-orange)]/60 bg-[var(--cap-orange)]/15 text-[var(--cap-bright)]'
                  : 'border-[var(--cap-border)] text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
              }`}
              aria-pressed={filter === t}
            >
              {t === 'TODOS' ? 'Todos' : `${t.charAt(0) + t.slice(1).toLowerCase()} (${counts[t]})`}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div role="status" className="cap-fade-in cap-panel border-[var(--cap-glow)]/40 p-3 text-base text-[var(--cap-bright)]">
          {toast}
        </div>
      )}

      <ScrollArea className="h-[600px]">
        <div className="cap-stagger grid gap-3 pr-2 md:grid-cols-2 xl:grid-cols-3">
          {shown.length === 0 && (
            <div className="cap-fade-in col-span-full flex flex-col items-center gap-2 py-14 text-center">
              <MonitorSmartphone className="h-10 w-10 text-[var(--cap-faint)]" aria-hidden />
              <p className="text-lg font-bold text-[var(--cap-bright)]">Nenhum dispositivo nesta categoria</p>
              <p className="max-w-sm text-base text-[var(--cap-dim)]">
                A frota não tem endpoints do tipo selecionado. Ajuste o filtro para enxergar o parque completo.
              </p>
              <button
                onClick={() => setFilter('TODOS')}
                className="mt-1 min-h-10 rounded-md border border-[var(--cap-border-strong)] px-4 py-2 text-base font-semibold text-[var(--cap-cyan)] transition-colors hover:bg-[#0d2038]/5"
              >
                Ver todos os dispositivos
              </button>
            </div>
          )}
          {shown.map((d) => {
            const st = STATUS_STYLE[d.status]
            return (
              <div key={d.id} className="cap-card-hover cap-panel p-4" style={d.status !== 'SEGURO' ? { borderColor: `${st.c}66` } : undefined}>
                <div className="flex items-center gap-3">
                  <DeviceIcon type={d.type} />
                  <div className="min-w-0 flex-1">
                    <div className="cap-mono cap-num truncate text-base font-bold text-[var(--cap-bright)]">{d.name}</div>
                    <div className="truncate text-base text-[var(--cap-dim)]">
                      {d.owner} · {d.role}
                    </div>
                  </div>
                  {d.status === 'SEGURO' && (
                    <span className="cap-dot-live shrink-0" title="Online — fazendo check-in" aria-hidden />
                  )}
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-base font-bold ${d.status !== 'SEGURO' ? 'cap-blink' : ''}`}
                    style={{ color: st.c, borderColor: `${st.c}66`, background: `${st.c}14` }}
                  >
                    {st.label}
                  </span>
                </div>

                <div className="cap-mono cap-num mt-2 space-y-0.5 text-base text-[var(--cap-dim)]">
                  <div>{d.org}</div>
                  <div>{d.os} · {d.ip}</div>
                  <div>
                    {d.agent} · check-in {new Date(d.lastCheckin).toLocaleTimeString('pt-BR')}
                    {d.lastAction && ` · última ação: ${d.lastAction.action} (${d.lastAction.by === 'COPILOTO_IA' ? 'IA' : 'humano'})`}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-base text-[var(--cap-dim)]">Risco</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0d2038]/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(d.threatScore, 100)}%`,
                        background: d.threatScore > 50 ? '#e11d2e' : d.threatScore > 25 ? '#d97706' : '#16a34a',
                      }}
                    />
                  </div>
                  <span className="cap-mono cap-num w-7 text-right text-base text-[var(--cap-bright)]">{d.threatScore}</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {d.controls.map((c) => (
                    <span
                      key={c.name}
                      title={c.active ? 'Controle ativo' : 'Controle não aplicado'}
                      className={`rounded-md border px-1.5 py-0.5 text-base ${
                        c.active
                          ? 'border-[var(--cap-glow)]/30 bg-[var(--cap-glow)]/5 text-[var(--cap-glow)]'
                          : 'border-[var(--cap-border)] text-[var(--cap-dim)] opacity-50'
                      }`}
                    >
                      {c.active ? '✓' : '×'} {CONTROL_LABEL[c.name] ?? c.name}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--cap-border)] pt-3">
                  {d.status !== 'ISOLADO' ? (
                    <button
                      onClick={() => act(d.id, 'ISOLAR')}
                      disabled={busy === d.id + 'ISOLAR'}
                      title="Isolar o dispositivo da rede imediatamente"
                      className="flex min-h-10 items-center gap-1 rounded-md border border-[var(--cap-danger)]/40 bg-[var(--cap-danger)]/10 px-2 py-1.5 text-base font-semibold text-[var(--cap-danger)] transition-colors hover:bg-[var(--cap-danger)]/20 disabled:opacity-50"
                    >
                      {busy === d.id + 'ISOLAR' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <ShieldOff className="h-3.5 w-3.5" aria-hidden />
                      )}
                      <span>Isolar</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => act(d.id, 'LIBERAR')}
                      disabled={busy === d.id + 'LIBERAR'}
                      title="Devolver o dispositivo à rede"
                      className="flex min-h-10 items-center gap-1 rounded-md border border-[var(--cap-glow)]/40 bg-[var(--cap-glow)]/10 px-2 py-1.5 text-base font-semibold text-[var(--cap-glow)] transition-colors hover:bg-[var(--cap-glow)]/20 disabled:opacity-50"
                    >
                      {busy === d.id + 'LIBERAR' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Undo2 className="h-3.5 w-3.5" aria-hidden />
                      )}
                      <span>Liberar</span>
                    </button>
                  )}
                  <button
                    onClick={() => act(d.id, 'VARREDURA')}
                    disabled={busy === d.id + 'VARREDURA'}
                    title="Executar varredura completa de segurança no endpoint"
                    className="flex min-h-10 items-center gap-1 rounded-md border border-[var(--cap-border-strong)] px-2 py-1.5 text-base font-medium text-[var(--cap-bright)] transition-colors hover:bg-[#0d2038]/5 disabled:opacity-50"
                  >
                    {busy === d.id + 'VARREDURA' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <ScanSearch className="h-3.5 w-3.5" aria-hidden />
                    )}
                    <span>Varredura</span>
                  </button>
                  <button
                    onClick={() => act(d.id, 'REVOGAR_SESSOES')}
                    disabled={busy === d.id + 'REVOGAR_SESSOES'}
                    title="Encerrar todas as sessões ativas do dispositivo"
                    className="flex min-h-10 items-center gap-1 rounded-md border border-[var(--cap-border-strong)] px-2 py-1.5 text-base font-medium text-[var(--cap-bright)] transition-colors hover:bg-[#0d2038]/5 disabled:opacity-50"
                  >
                    {busy === d.id + 'REVOGAR_SESSOES' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5" aria-hidden />
                    )}
                    <span>Revogar sessões</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
