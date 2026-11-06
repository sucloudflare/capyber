// CAPYBER CORE — Motor de detecção, correlação e resposta (estado em memória)
// v2: playbooks nos eventos, log de auditoria imutável e ações remotas de dispositivo.
// Foco do objetivo: blindar o DISPOSITIVO — nada de firewall de perímetro.

import type {
  AuditEntry,
  Device,
  DeviceActionName,
  EventStatus,
  Stats,
  ThreatEvent,
} from './types'
import { KILL_CHAIN, SCENARIOS, TARGETS } from './scenarios'

const MAX_EVENTS = 120
const MAX_AUDIT = 200

function rid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Frota de dispositivos (dados sintéticos de demonstração) ─────────
type DeviceControlNames =
  | 'EDR' | 'DISK_CRYPT' | 'ALLOWLIST' | 'USB_BLOCK' | 'MDM' | 'MFA_HARD' | 'DLP'

const ALL_CONTROLS: DeviceControlNames[] = [
  'EDR', 'DISK_CRYPT', 'ALLOWLIST', 'USB_BLOCK', 'MDM', 'MFA_HARD', 'DLP',
]

function mkDevice(
  id: string,
  name: string,
  type: Device['type'],
  owner: string,
  role: string,
  org: string,
  os: string,
  ip: string,
  controls: DeviceControlNames[],
  mobile = false
): Device {
  return {
    id, name, type, owner, role, org, os, ip,
    agent: mobile ? 'CAPY-Agent v2.4.1 (MDM)' : 'CAPY-Agent v2.4.1',
    status: 'SEGURO',
    threatScore: Math.floor(Math.random() * 12) + 2,
    controls: ALL_CONTROLS.map((c) => ({ name: c, active: controls.includes(c) })),
    lastCheckin: new Date().toISOString(),
  }
}

function seedDevices(): Device[] {
  return [
    mkDevice('NB-001', 'MBP-SQUID-CARTEIRAS', 'NOTEBOOK', 'Ana R.', 'Dev Sênior — Carteiras', 'CriptoBR Exchange', 'macOS 15 (FileVault)', '10.30.1.11', ['EDR', 'DISK_CRYPT', 'ALLOWLIST', 'USB_BLOCK', 'MFA_HARD']),
    mkDevice('NB-002', 'TP-SQUID-PAGAMENTOS', 'NOTEBOOK', 'Bruno T.', 'Dev Pleno — Pagamentos', 'CriptoBR Exchange', 'Ubuntu 24.04 LTS (LUKS)', '10.30.1.12', ['EDR', 'DISK_CRYPT', 'ALLOWLIST', 'USB_BLOCK', 'MDM']),
    mkDevice('NB-003', 'XPS-SQUID-FRONT', 'NOTEBOOK', 'Carla M.', 'Dev Frontend', 'CriptoBR Exchange', 'Windows 11 Pro (BitLocker)', '10.30.1.13', ['EDR', 'DISK_CRYPT', 'ALLOWLIST', 'MDM', 'MFA_HARD']),
    mkDevice('NB-004', 'TP-INTERNO-ESTAG', 'NOTEBOOK', 'Diego P.', 'Estagiário — Dados', 'BancoAI S.A.', 'Windows 11 Pro (BitLocker)', '10.40.2.21', ['EDR', 'DISK_CRYPT', 'USB_BLOCK', 'MDM']),
    mkDevice('NB-005', 'MBP-CFO', 'NOTEBOOK', 'Eduarda L.', 'CFO', 'BancoAI S.A.', 'macOS 15 (FileVault)', '10.40.2.22', ['EDR', 'DISK_CRYPT', 'ALLOWLIST', 'MFA_HARD', 'DLP']),
    mkDevice('NB-006', 'XPS-SEC-OPS', 'NOTEBOOK', 'Felipe S.', 'Analista SOC N2', 'CapyHoldings', 'Fedora 41 (LUKS)', '10.50.3.14', ['EDR', 'DISK_CRYPT', 'ALLOWLIST', 'USB_BLOCK', 'MFA_HARD']),
    mkDevice('WS-001', 'WS-BUILD-RUNNER-01', 'WORKSTATION', 'Serviço CI/CD', 'Runner de Build', 'CriptoBR Exchange', 'Debian 12 (headless)', '10.30.9.31', ['EDR', 'ALLOWLIST', 'USB_BLOCK']),
    mkDevice('WS-002', 'WS-CHAVES-KMS', 'WORKSTATION', 'Serviço KMS', 'Estação de Chaves', 'CriptoBR Exchange', 'Ubuntu 24.04 LTS (FIPS)', '10.30.9.32', ['EDR', 'ALLOWLIST', 'USB_BLOCK', 'DLP']),
    mkDevice('WS-003', 'WS-ANALISE-FRAUDE', 'WORKSTATION', 'Gabriel K.', 'Cientista de Dados — Antifraude', 'BancoAI S.A.', 'Windows 11 Pro (BitLocker)', '10.40.9.33', ['EDR', 'DISK_CRYPT', 'ALLOWLIST', 'MDM']),
    mkDevice('MB-001', 'IPH-CFO-15', 'MOBILE', 'Eduarda L.', 'CFO', 'BancoAI S.A.', 'iOS 18 (MDM)', '10.40.7.41', ['MDM', 'MFA_HARD', 'DLP'], true),
    mkDevice('MB-002', 'S24-DEV-ANA', 'MOBILE', 'Ana R.', 'Dev Sênior — Carteiras', 'CriptoBR Exchange', 'Android 15 (Work Profile)', '10.30.7.42', ['MDM', 'MFA_HARD', 'USB_BLOCK'], true),
    mkDevice('MB-003', 'PX8-ONCALL', 'MOBILE', 'Helena V.', 'Eng. Confiabilidade (On-call)', 'CriptoBR Exchange', 'Android 15 (Work Profile)', '10.30.7.43', ['MDM', 'MFA_HARD', 'DLP'], true),
    mkDevice('MB-004', 'IPH-SOC-OPS', 'MOBILE', 'Felipe S.', 'Analista SOC N2', 'CapyHoldings', 'iOS 18 (MDM)', '10.50.7.44', ['MDM', 'MFA_HARD', 'DLP'], true),
    mkDevice('SV-001', 'SRV-API-SP01-A', 'SERVER', 'Infra Cloud', 'API da Exchange', 'CriptoBR Exchange', 'Ubuntu 24.04 LTS (FIPS)', '10.30.0.51', ['EDR', 'ALLOWLIST']),
    mkDevice('SV-002', 'SRV-CORE-BANCARIO', 'SERVER', 'Infra Core', 'Core Banking', 'BancoAI S.A.', 'RHEL 9 (FIPS)', '10.40.0.52', ['EDR', 'ALLOWLIST']),
  ]
}

// ── Estado global ────────────────────────────────────────────────────
class Engine {
  events: ThreatEvent[] = []
  devices: Device[] = seedDevices()
  audit: AuditEntry[] = []
  stats: Stats = {
    blockedTotal: 12873,
    activeThreats: 0,
    protectedBRL: 467_700,
    devicesSecure: 15,
    devicesTotal: 15,
    defcon: 5,
    uptimeS: 0,
    actionsExecuted: 0,
    byCountry: { CN: 4126, RU: 3395, KP: 2215, IR: 980, VN: 742, NG: 613, NL: 423, BR: 193 },
    eventsTotal: 12873,
  }
  startedAt = Date.now()
  private scenarioSeq = 0
  private timers: NodeJS.Timeout[] = []

  /** Agenda um timeout rastreável; a referência sai do array quando dispara (sem vazamento). */
  private later(fn: () => void, ms: number): void {
    const t = setTimeout(() => {
      this.timers = this.timers.filter((x) => x !== t)
      fn()
    }, ms)
    t.unref()
    this.timers.push(t)
  }

  onEvent: ((e: ThreatEvent) => void) | null = null
  onStats: ((s: Stats) => void) | null = null
  onDevices: ((d: Device[]) => void) | null = null
  onAudit: ((a: AuditEntry) => void) | null = null

  constructor() {
    // snapshot inicial de alertas (fiel ao painel: 5 linhas com idades T+3s…T+21s;
    // apenas a MÉDIA segue ativa para manter DEFCON 5 · 1 ameaça ativa)
    this.seedInitialAlerts()

    // loop de simulação: novo cenário a cada 9–16s
    const scheduleNext = () => {
      const delay = 9000 + Math.random() * 7000
      this.later(() => {
        this.runRandomScenario('MOTOR')
        scheduleNext()
      }, delay)
    }
    scheduleNext()

    // heartbeat de stats a cada 2s
    this.timers.push(
      setInterval(() => {
        this.stats.uptimeS = Math.floor((Date.now() - this.startedAt) / 1000)
        this.recomputeDefcon()
        this.onStats?.({ ...this.stats })
      }, 2000).unref()
    )

    // check-in aleatório de dispositivos a cada 6s
    this.timers.push(
      setInterval(() => {
        const d = this.devices[Math.floor(Math.random() * this.devices.length)]
        if (d.status === 'SEGURO') {
          d.threatScore = Math.max(1, Math.min(20, d.threatScore + (Math.random() > 0.5 ? 1 : -1)))
          d.lastCheckin = new Date().toISOString()
          this.onDevices?.(this.devices)
        }
      }, 6000).unref()
    )
  }

  /** Alertas iniciais do painel (mesmas 5 linhas do pôster, idades T+3s…T+21s). */
  private seedInitialAlerts() {
    const seeds: { id: string; ageS: number; status: EventStatus }[] = [
      { id: 'SC-SUPC-07', ageS: 3, status: 'NEUTRALIZADO' },
      { id: 'SC-RNSM-06', ageS: 7, status: 'NEUTRALIZADO' },
      { id: 'SC-DRAIN-03', ageS: 13, status: 'NEUTRALIZADO' },
      { id: 'SC-CRED-09', ageS: 18, status: 'NEUTRALIZADO' },
      { id: 'SC-MFAF-08', ageS: 21, status: 'DETECTADO' },
    ]
    const now = Date.now()
    for (const s of seeds) {
      const sc = SCENARIOS.find((x) => x.id === s.id)
      if (!sc) continue
      const target = TARGETS[sc.targetId]
      const lastPhase = sc.killChain[sc.killChain.length - 1]
      const phaseIdx = s.status === 'NEUTRALIZADO' ? lastPhase : sc.killChain[0]
      this.events.push({
        id: rid('EVT'),
        scenarioId: sc.id,
        title: sc.title,
        kind: sc.kind,
        severity: sc.severity,
        mitre: sc.mitre,
        phaseIndex: s.status === 'NEUTRALIZADO' ? sc.killChain.length - 1 : 0,
        phase: phaseIdx,
        phaseName: KILL_CHAIN[phaseIdx],
        status: s.status,
        origin: sc.origin,
        target,
        description: sc.description,
        mitigation: sc.mitigations[sc.mitigations.length - 1],
        playbook: sc.playbook,
        voiceLine: s.status === 'NEUTRALIZADO' ? sc.voice.resolved : sc.voice.detect,
        ts: now - s.ageS * 1000,
      })
    }
    this.recomputeDefcon()
  }

  recomputeDefcon() {
    const crit = this.events.filter((e) => e.status !== 'NEUTRALIZADO' && e.severity === 'CRITICA').length
    const alta = this.events.filter((e) => e.status !== 'NEUTRALIZADO' && e.severity === 'ALTA').length
    let defcon = 5
    if (crit >= 1) defcon = 3
    if (crit >= 2) defcon = 2
    if (crit >= 3 || (crit >= 1 && alta >= 2)) defcon = 1
    else if (alta >= 2) defcon = 4
    this.stats.defcon = defcon
    this.stats.activeThreats = this.events.filter((e) => e.status !== 'NEUTRALIZADO').length
    // postura da frota acompanha o estado real dos endpoints
    this.stats.devicesSecure = this.devices.filter((d) => d.status === 'SEGURO').length
    this.stats.devicesTotal = this.devices.length
  }

  private addAudit(entry: Omit<AuditEntry, 'id' | 'ts'>) {
    const a: AuditEntry = { ...entry, id: rid('AUD'), ts: Date.now() }
    this.audit.unshift(a)
    if (this.audit.length > MAX_AUDIT) this.audit.pop()
    this.onAudit?.(a)
    return a
  }

  /** Executa uma ação remota em um dispositivo (com validação + auditoria). */
  deviceAction(deviceId: string, action: DeviceActionName, actor: 'OPERADOR' | 'COPILOTO_IA'): { ok: boolean; message: string } {
    const d = this.devices.find((x) => x.id === deviceId)
    if (!d) return { ok: false, message: `Dispositivo ${deviceId} não encontrado` }

    switch (action) {
      case 'ISOLAR':
        if (d.status === 'ISOLADO') return { ok: false, message: 'Já está isolado' }
        d.status = 'ISOLADO'
        d.threatScore = Math.max(d.threatScore, 70)
        break
      case 'LIBERAR':
        if (d.status !== 'ISOLADO' && d.status !== 'ALERTA') return { ok: false, message: 'Dispositivo já está seguro' }
        d.status = 'SEGURO'
        d.threatScore = Math.floor(Math.random() * 12) + 2
        break
      case 'VARREDURA':
        d.lastCheckin = new Date().toISOString()
        d.threatScore = Math.max(1, d.threatScore - 4)
        break
      case 'REVOGAR_SESSOES':
        d.threatScore = Math.max(1, d.threatScore - 6)
        break
    }
    d.lastAction = { action, by: actor, at: new Date().toISOString() }
    this.stats.actionsExecuted += 1
    this.addAudit({
      actor,
      action,
      targetId: d.id,
      detail: `${action} executado em ${d.name} (${d.owner}) por ${actor === 'COPILOTO_IA' ? 'Operador IA' : 'operador humano'}`,
    })
    this.onDevices?.(this.devices)
    return { ok: true, message: `${action} executado em ${d.name}` }
  }

  runScenario(scenarioId: string, actor: 'OPERADOR' | 'COPILOTO_IA' | 'MOTOR' = 'MOTOR'): ThreatEvent | null {
    const sc = SCENARIOS.find((s) => s.id === scenarioId)
    if (!sc) return null
    const target = TARGETS[sc.targetId]
    const ev: ThreatEvent = {
      id: rid('EVT'),
      scenarioId: sc.id,
      title: sc.title,
      kind: sc.kind,
      severity: sc.severity,
      mitre: sc.mitre,
      phaseIndex: 0,
      phase: sc.killChain[0],
      phaseName: KILL_CHAIN[sc.killChain[0]],
      status: 'DETECTADO',
      origin: sc.origin,
      target,
      description: sc.description,
      mitigation: sc.mitigations[0],
      playbook: sc.playbook,
      voiceLine: sc.voice.detect,
      ts: Date.now(),
    }
    this.events.unshift(ev)
    if (this.events.length > MAX_EVENTS) this.events.pop()
    this.stats.eventsTotal += 1
    this.stats.byCountry[sc.origin.countryCode] =
      (this.stats.byCountry[sc.origin.countryCode] ?? 0) + 1
    if (actor !== 'MOTOR') {
      this.stats.actionsExecuted += 1
      this.addAudit({ actor, action: 'CENARIO_DISPARADO', targetId: sc.id, detail: `Cenário ${sc.id} (${sc.title}) disparado por ${actor}` })
    }
    this.recomputeDefcon()
    this.onEvent?.(ev)

    // efeitos na frota
    if (sc.isolateDeviceId) {
      const d = this.devices.find((x) => x.id === sc.isolateDeviceId)
      if (d) {
        d.status = 'ISOLADO'
        d.threatScore = 88
        this.addAudit({ actor: 'MOTOR', action: 'ISOLAR', targetId: d.id, detail: `Isolamento automático do EDR em ${d.name} (${sc.title})` })
        this.onDevices?.(this.devices)
      }
    }
    if (sc.flagDeviceId) {
      const d = this.devices.find((x) => x.id === sc.flagDeviceId)
      if (d) {
        d.status = 'ALERTA'
        d.threatScore = 61
        this.onDevices?.(this.devices)
      }
    }

    // progressão da kill chain (com delay — a situação evolui em etapas)
    const seq = ++this.scenarioSeq
    const phaseDelay = 2600 + (seq % 3) * 400
    sc.killChain.slice(1).forEach((phaseIdx, i) => {
      this.later(() => {
        const cur = this.events.find((e) => e.id === ev.id)
        if (!cur || cur.status === 'NEUTRALIZADO') return
        cur.phase = phaseIdx
        cur.phaseIndex = i + 1
        cur.phaseName = KILL_CHAIN[phaseIdx]
        cur.status = 'MITIGANDO'
        cur.voiceLine = sc.voice.mitigating
        cur.mitigation = sc.mitigations[Math.min(i + 1, sc.mitigations.length - 1)]
        this.onEvent?.({ ...cur })
      }, phaseDelay * (i + 1))
    })

    // neutralização
    const resolveDelay = phaseDelay * sc.killChain.length + 1500
    this.later(() => {
      const cur = this.events.find((e) => e.id === ev.id)
      if (!cur || cur.status === 'NEUTRALIZADO') return
      cur.status = 'NEUTRALIZADO'
      cur.voiceLine = sc.voice.resolved
      this.stats.blockedTotal += 1
      this.stats.protectedBRL += sc.valueProtectedBRL
      this.recomputeDefcon()
      this.onEvent?.({ ...cur })

      // frota volta ao normal
      if (sc.isolateDeviceId || sc.flagDeviceId) {
        for (const id of [sc.isolateDeviceId, sc.flagDeviceId]) {
          if (!id) continue
          const d = this.devices.find((x) => x.id === id)
          if (d && d.status !== 'SEGURO') {
            d.status = 'SEGURO'
            d.threatScore = Math.floor(Math.random() * 12) + 2
            d.lastCheckin = new Date().toISOString()
            this.onDevices?.(this.devices)
          }
        }
      }
    }, resolveDelay)

    return ev
  }

  runRandomScenario(actor: 'OPERADOR' | 'COPILOTO_IA' | 'MOTOR' = 'MOTOR'): ThreatEvent | null {
    const sc = SCENARIOS[this.scenarioSeq % SCENARIOS.length]
    return this.runScenario(sc.id, actor)
  }
}

export const engine = new Engine()
