// CAPYBER CORE — Tipos compartilhados do motor de defesa (v2)
// Novidades v2: playbook por cenário (perguntas de triagem, prevenção e resposta),
// auditoria de ações do operador, ações remotas de dispositivo.

export type Severity = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
export type EventStatus = 'DETECTADO' | 'MITIGANDO' | 'NEUTRALIZADO'

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

export interface VoiceScript {
  detect: string
  mitigating: string
  resolved: string
}

/** Playbook do alerta: as 3 perguntas que o analista deve responder, como prevenir e como agir. */
export interface Playbook {
  questions: { q: string; why: string }[]
  prevent: string[]
  actions: { step: string; detail: string; planRef?: string }[]
}

export interface ScenarioDef {
  id: string
  title: string
  kind: string
  severity: Severity
  mitre: MitreRef
  killChain: number[] // índices das fases percorridas
  origin: GeoPoint
  targetId: string
  description: string
  mitigations: string[] // referências aos pontos do plano (P01..P40)
  playbook: Playbook
  voice: VoiceScript
  valueProtectedBRL: number
  isolateDeviceId?: string
  flagDeviceId?: string
}

export interface ThreatEvent {
  id: string
  scenarioId: string
  title: string
  kind: string
  severity: Severity
  mitre: MitreRef
  phaseIndex: number // posição dentro de killChain
  phase: number // índice global da kill chain (0..5)
  phaseName: string
  status: EventStatus
  origin: GeoPoint
  target: TargetPoint
  description: string
  mitigation: string
  voiceLine: string
  playbook: Playbook
  ts: number
}

export interface DeviceControl {
  name: string
  active: boolean
}

export type DeviceStatus = 'SEGURO' | 'ALERTA' | 'ISOLADO'
export type DeviceActionName = 'ISOLAR' | 'LIBERAR' | 'VARREDURA' | 'REVOGAR_SESSOES'

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
  status: DeviceStatus
  threatScore: number
  controls: DeviceControl[]
  lastCheckin: string
  lastAction?: { action: DeviceActionName; by: string; at: string }
}

/** Registro de auditoria: toda ação humana ou de IA deixa rastro imutável nesta sessão. */
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
