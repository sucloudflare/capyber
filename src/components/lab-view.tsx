'use client'

// CAPYBER — laboratório: disparo de cenários de ameaça a endpoints (dados sintéticos).

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FlaskConical, Dices, Loader2 } from 'lucide-react'
import { markLegacy } from '@/lib/legacy'
import type { Severity } from '@/lib/types'

const SEV_LABEL: Record<Severity, string> = {
  CRITICA: 'CRÍTICA',
  ALTA: 'ALTA',
  MEDIA: 'MÉDIA',
  BAIXA: 'BAIXA',
}

function SevPill({ s }: { s: Severity }) {
  return <span className={`cap-sev cap-sev-${s.toLowerCase()}`}>{SEV_LABEL[s]}</span>
}

const SCENARIOS: {
  id: string
  label: string
  kind: string
  severity: Severity
  mitre: string
  origin: string
  desc: string
}[] = [
  {
    id: 'SC-DRAIN-03',
    label: 'Drainer Web3',
    kind: 'Fraude Cripto',
    severity: 'CRITICA',
    mitre: 'T1566',
    origin: 'Coreia do Norte',
    desc: 'Aprovação de contrato malicioso no navegador do dev de carteiras — o dreno espera a assinatura.',
  },
  {
    id: 'SC-PHSH-04',
    label: 'Spearphishing ao CFO',
    kind: 'Engenharia Social',
    severity: 'ALTA',
    mitre: 'T1566.001',
    origin: 'Nigéria',
    desc: 'E-mail sob medida com anexo armadilha abre a porta no notebook do CFO do banco.',
  },
  {
    id: 'SC-INSI-05',
    label: 'Ameaça Interna',
    kind: 'Abuso de Acesso',
    severity: 'ALTA',
    mitre: 'T1567',
    origin: 'Interno · BR',
    desc: 'Contratado com acesso legítimo exporta chaves e dados de clientes — DLP e UEBA pegam o desvio.',
  },
  {
    id: 'SC-RNSM-06',
    label: 'Ransomware no Endpoint',
    kind: 'Impacto',
    severity: 'CRITICA',
    mitre: 'T1486',
    origin: 'Rússia',
    desc: 'Criptografia em massa de arquivos na workstation — o EDR isola a máquina em segundos.',
  },
  {
    id: 'SC-SUPC-07',
    label: 'Supply Chain npm',
    kind: 'Cadeia de Suprimentos',
    severity: 'CRITICA',
    mitre: 'T1195.002',
    origin: 'China',
    desc: 'Pacote malicioso compromete a máquina de build — o mesmo roteiro do Bybit (2025).',
  },
  {
    id: 'SC-MFAF-08',
    label: 'MFA Fatigue',
    kind: 'Identidade',
    severity: 'MEDIA',
    mitre: 'T1621',
    origin: 'Coreia do Norte',
    desc: 'Bombardeio de push até alguém aprovar no celular — MFA FIDO2 e number matching blindam.',
  },
  {
    id: 'SC-CRED-09',
    label: 'Credential Dumping',
    kind: 'Roubo de Credencial',
    severity: 'ALTA',
    mitre: 'T1003',
    origin: 'China',
    desc: 'Infostealer varre senhas e sessões do navegador no endpoint do analista.',
  },
  {
    id: 'SC-C2-10',
    label: 'Beacon C2',
    kind: 'Comando e Controle',
    severity: 'ALTA',
    mitre: 'T1071',
    origin: 'Rússia',
    desc: 'Processo suspeito conversa com servidor de comando e controle — detecção comportamental no host.',
  },
]

export function LabView({ onTriggered }: { onTriggered: () => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [fired, setFired] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // limpa timers pendentes no unmount
  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  async function trigger(id?: string) {
    if (busy) return
    setBusy(id ?? 'random')
    setFailed(false)
    try {
      const res = await fetch('/api/scenario/trigger?XTransformPort=3003', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {}),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null
      // só confirma com HTTP 2xx E ok do motor — motor offline nunca vira "disparado"
      if (!res.ok || !data?.ok) {
        setFailed(true)
        return
      }
      setFired(id ?? 'random')
      markLegacy('lab')
      if (!id) {
        const t = setTimeout(() => onTriggered(), 900)
        timersRef.current.push(t)
      }
    } catch {
      setFailed(true)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="cap-panel flex flex-wrap items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2f7fd1] text-white shadow-[0_2px_8px_rgba(47,127,209,0.5)]">
          <FlaskConical className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-2xl font-bold text-[var(--cap-bright)]">Laboratório</h2>
        <Button
          onClick={() => trigger()}
          disabled={busy !== null}
          className="cap-btn-primary ml-auto h-10 shrink-0 tracking-wide disabled:opacity-60"
        >
          {busy === 'random' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Dices className="mr-2 h-4 w-4" aria-hidden />
          )}
          {busy === 'random' ? 'DISPARANDO...' : 'CENÁRIO ALEATÓRIO'}
        </Button>
      </div>

      {failed && (
        <div role="alert" className="cap-fade-in cap-panel border-[var(--cap-danger)]/40 p-3 text-base text-[var(--cap-bright)]">
          Motor CAPYCORE indisponível — o cenário não foi disparado. Verifique o status do motor e tente de novo.
        </div>
      )}

      {fired && (
        <div role="status" className="cap-fade-in cap-panel border-[var(--cap-warn)]/40 p-3 text-base text-[var(--cap-bright)]">
          Cenário em andamento — acompanhe a kill chain no Centro de Comando.
        </div>
      )}

      <div className="cap-panel p-4">
        <div className="cap-stagger grid gap-2.5 md:grid-cols-2">
          {SCENARIOS.map((s) => (
            <div
              key={s.id}
              className={`cap-card-hover relative flex min-w-0 flex-col rounded-xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-3 ${
                busy === s.id || fired === s.id ? 'cap-pulse-ring border-[var(--cap-cyan)]/40' : ''
              }`}
            >
              <div className="flex items-center gap-1.5">
                <SevPill s={s.severity} />
                {(busy === s.id || fired === s.id) && (
                  <span className="flex items-center gap-1 text-[0.7rem] font-extrabold uppercase tracking-wider text-[var(--cap-text)]">
                    <span className="cap-dot-live" aria-hidden />
                    em andamento
                  </span>
                )}
                <span className="cap-mono ml-auto rounded border border-[var(--cap-border)] px-1 py-0.5 text-[0.8rem] text-[var(--cap-dim)]">
                  {s.mitre}
                </span>
              </div>
              <p className="mt-1.5 truncate text-base font-bold text-[var(--cap-bright)]">{s.label}</p>
              <p className="mt-0.5 line-clamp-2 min-h-[2.4em] text-[0.85rem] leading-snug text-[var(--cap-text)]">{s.desc}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="cap-mono truncate text-[0.8rem] text-[var(--cap-dim)]">
                  {s.kind} · {s.origin}
                </span>
                <Button
                  size="sm"
                  onClick={() => trigger(s.id)}
                  disabled={busy !== null}
                  className="cap-btn-ghost ml-auto h-10 shrink-0 rounded-lg px-3 text-[0.85rem] font-bold disabled:opacity-50"
                  aria-label={`Disparar cenário ${s.label}`}
                  title={`Disparar cenário ${s.label}`}
                >
                  {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Disparar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
