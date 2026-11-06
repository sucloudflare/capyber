// CAPYBER — Tipos do frontend (espelham o motor CAPYCORE v2)

export type Severity = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
export type EventStatus = 'DETECTADO' | 'MITIGANDO' | 'NEUTRALIZADO'
export type DeviceActionName = 'ISOLAR' | 'LIBERAR' | 'VARREDURA' | 'REVOGAR_SESSOES'

export interface GeoPoint {
  country: string
  countryCode: string
  city: string
  lat: number
  lon: number
}

export interface TargetPoint {
  id: string
  name: string
  org: string
  lat: number
  lon: number
}

export interface MitreRef {
  id: string
  name: string
}

/** Playbook do alerta: perguntas de triagem, prevenção e runbook de resposta. */
export interface Playbook {
  questions: { q: string; why: string }[]
  prevent: string[]
  actions: { step: string; detail: string; planRef?: string }[]
}

export interface ThreatEvent {
  id: string
  scenarioId: string
  title: string
  kind: string
  severity: Severity
  mitre: MitreRef
  phaseIndex: number
  phase: number
  phaseName: string
  status: EventStatus
  origin: GeoPoint
  target: TargetPoint
  description: string
  mitigation: string
  playbook: Playbook
  voiceLine: string
  ts: number
}

export interface Device {
  id: string
  name: string
  type: 'NOTEBOOK' | 'WORKSTATION' | 'MOBILE' | 'SERVER'
  owner: string
  role: string
  org: string
  os: string
  ip: string
  agent: string
  status: 'SEGURO' | 'ALERTA' | 'ISOLADO'
  threatScore: number
  controls: { name: string; active: boolean }[]
  lastCheckin: string
  lastAction?: { action: DeviceActionName; by: string; at: string }
}

export interface AuditEntry {
  id: string
  ts: number
  actor: 'OPERADOR' | 'COPILOTO_IA' | 'MOTOR'
  action: DeviceActionName | 'CENARIO_DISPARADO'
  targetId: string
  detail: string
}

export interface Stats {
  blockedTotal: number
  activeThreats: number
  protectedBRL: number
  devicesSecure: number
  devicesTotal: number
  defcon: number
  uptimeS: number
  actionsExecuted: number
  byCountry: Record<string, number>
  eventsTotal: number
}

export const KILL_CHAIN = [
  'Reconhecimento',
  'Intrusão Inicial',
  'Escalação de Privilégios',
  'Movimentação Lateral',
  'Impacto',
  'Exfiltração',
]

// Cores de severidade legíveis no papel claro do pôster (e visíveis no globo marinho)
export const SEVERITY_COLOR: Record<Severity, string> = {
  CRITICA: '#e11d2e',
  ALTA: '#d97706',
  MEDIA: '#2f7fd1',
  BAIXA: '#16a34a',
}

export const TARGETS: Record<string, TargetPoint> = {
  SP01: { id: 'SP01', name: 'CRIPTOBR-SP01', org: 'CriptoBR Exchange', lat: -23.55, lon: -46.63 },
  RJDC: { id: 'RJDC', name: 'BANCOAI-RJDC', org: 'BancoAI S.A.', lat: -22.9, lon: -43.17 },
  BSBX: { id: 'BSBX', name: 'CAPHQ-BSBX', org: 'CapyHoldings — Matriz', lat: -15.79, lon: -47.88 },
}
