'use client'

// VIGIA — narradora de voz pt-BR (Web Speech API) com fila priorizada, categorias de
// conteúdo, limitador de ritmo (token bucket), janela de horários, mudo em segundo
// plano e lembretes agendados.
//
// API original preservada: speak(text, priority), speakNow, boot, toggle, setEnabled,
// stop, subscribe, getState, getServerState.
//
// GATE DE ÁUDIO: a voz nasce TRANCADA (locked). Nenhuma fala toca antes de
// vigia.unlock() — chamado pelo orquestrador quando (usuário autenticado) E
// (tutorial concluído ou pulado). O unlock não é persistido: a cada carregamento
// o gate recomeça trancado. isLocked() expõe o estado para leitura.

export type VigiaCategory =
  | 'boot'
  | 'ameaca_critica'
  | 'ameaca_alta'
  | 'ameaca_moderada'
  | 'resposta'
  | 'auditoria'
  | 'osint'
  | 'trilha'
  | 'tutorial'
  | 'chat'
  | 'lembretes'

export type VigiaSchedule = {
  /** dias da semana ativos (0 = domingo … 6 = sábado) */
  activeDays: number[]
  /** minutos a partir da meia-noite */
  startMin: number
  /** minutos a partir da meia-noite */
  endMin: number
  /** se true, fica em silêncio fora da janela (críticos podem passar, ver criticalBypass) */
  quietOutside: boolean
}

export type VigiaSettings = {
  enabled: boolean
  /** voiceURI da voz escolhida ('' = escolha automática da melhor voz pt-BR) */
  voiceURI: string
  /** velocidade da fala (0.5–2) */
  rate: number
  /** tom da fala (0–2) */
  pitch: number
  /** volume (0–1) */
  volume: number
  /** quais categorias de conteúdo ela pode falar */
  categories: Record<VigiaCategory, boolean>
  /** pausa em segundos entre falas enfileiradas (0–60) */
  delaySec: number
  /** limite de falas por minuto (1–30) — excedentes são descartados */
  maxPerMinute: number
  /** janela de horários em que ela atua */
  schedule: VigiaSchedule
  /** ameaças críticas ignoram o silêncio fora da janela */
  criticalBypass: boolean
  /** silencia novas falas comuns quando a aba está oculta */
  muteWhenHidden: boolean
}

export type VigiaAnnouncement = {
  id: string
  /** hora do disparo (0–23) */
  hh: number
  /** minuto do disparo (0–59) */
  mm: number
  text: string
  /** dias da semana (0–6); vazio = todos os dias */
  days: number[]
  enabled: boolean
}

export type VigiaState = {
  enabled: boolean
  speaking: boolean
  caption: string
  voiceName: string
  supported: boolean
  settings: VigiaSettings
  announcements: VigiaAnnouncement[]
  /** timestamp (Date.now) da última fala iniciada */
  lastSpokenAt: number
  /** falas descartadas pelo limite de ritmo */
  droppedCount: number
}

export const PRIORITY_NORMAL = 1
export const PRIORITY_CRITICAL = 2

export const VIGIA_SETTINGS_KEY = 'capy_vigia_settings'
export const VIGIA_ANNOUNCEMENTS_KEY = 'capy_vigia_announcements'

const ALL_CATEGORIES: VigiaCategory[] = [
  'boot',
  'ameaca_critica',
  'ameaca_alta',
  'ameaca_moderada',
  'resposta',
  'auditoria',
  'osint',
  'trilha',
  'tutorial',
  'chat',
  'lembretes',
]

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v)
    Object.freeze(value)
  }
  return value
}

const DEFAULT_SETTINGS: VigiaSettings = deepFreeze({
  enabled: true,
  voiceURI: '',
  rate: 1.04,
  pitch: 0.82,
  volume: 1,
  categories: {
    boot: true,
    ameaca_critica: true,
    ameaca_alta: true,
    ameaca_moderada: true,
    resposta: true,
    auditoria: true,
    osint: true,
    trilha: true,
    tutorial: true,
    chat: true,
    lembretes: true,
  },
  delaySec: 0,
  maxPerMinute: 12,
  schedule: { activeDays: [0, 1, 2, 3, 4, 5, 6], startMin: 480, endMin: 1320, quietOutside: false },
  criticalBypass: true,
  muteWhenHidden: false,
})

// Snapshot estável para o getServerSnapshot do useSyncExternalStore (hidratação SSR).
export const VIGIA_SERVER_STATE: VigiaState = deepFreeze({
  enabled: true,
  speaking: false,
  caption: '',
  voiceName: '',
  supported: false,
  settings: DEFAULT_SETTINGS,
  announcements: [],
  lastSpokenAt: 0,
  droppedCount: 0,
})

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback
  return Math.min(max, Math.max(min, n))
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `vig-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeCategories(raw: unknown): Record<VigiaCategory, boolean> {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out = {} as Record<VigiaCategory, boolean>
  for (const cat of ALL_CATEGORIES) {
    out[cat] = typeof obj[cat] === 'boolean' ? (obj[cat] as boolean) : true
  }
  return out
}

function normalizeSchedule(raw: unknown): VigiaSchedule {
  const d = DEFAULT_SETTINGS.schedule
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const days = Array.isArray(obj.activeDays)
    ? (obj.activeDays as unknown[]).filter((n): n is number => typeof n === 'number' && n >= 0 && n <= 6)
    : d.activeDays
  return {
    activeDays: [...days],
    startMin: clampNum(obj.startMin, 0, 1439, d.startMin),
    endMin: clampNum(obj.endMin, 0, 1440, d.endMin),
    quietOutside: typeof obj.quietOutside === 'boolean' ? obj.quietOutside : d.quietOutside,
  }
}

function normalizeSettings(raw: unknown): VigiaSettings {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    enabled: typeof obj.enabled === 'boolean' ? obj.enabled : DEFAULT_SETTINGS.enabled,
    voiceURI: typeof obj.voiceURI === 'string' ? obj.voiceURI : '',
    rate: clampNum(obj.rate, 0.5, 2, DEFAULT_SETTINGS.rate),
    pitch: clampNum(obj.pitch, 0, 2, DEFAULT_SETTINGS.pitch),
    volume: clampNum(obj.volume, 0, 1, DEFAULT_SETTINGS.volume),
    categories: normalizeCategories(obj.categories),
    delaySec: clampNum(obj.delaySec, 0, 60, DEFAULT_SETTINGS.delaySec),
    maxPerMinute: clampNum(obj.maxPerMinute, 1, 30, DEFAULT_SETTINGS.maxPerMinute),
    schedule: normalizeSchedule(obj.schedule),
    criticalBypass: typeof obj.criticalBypass === 'boolean' ? obj.criticalBypass : true,
    muteWhenHidden: typeof obj.muteWhenHidden === 'boolean' ? obj.muteWhenHidden : false,
  }
}

function normalizeAnnouncement(raw: unknown): VigiaAnnouncement | null {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const text = typeof obj.text === 'string' ? obj.text.trim() : ''
  if (!text) return null
  const days = Array.isArray(obj.days)
    ? (obj.days as unknown[]).filter((n): n is number => typeof n === 'number' && n >= 0 && n <= 6)
    : []
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : newId(),
    hh: clampNum(obj.hh, 0, 23, 9),
    mm: clampNum(obj.mm, 0, 59, 0),
    text,
    days: [...days],
    enabled: typeof obj.enabled === 'boolean' ? obj.enabled : true,
  }
}

class VigiaVoice {
  private queue: { text: string; priority: number }[] = []
  private speaking = false
  private voice: SpeechSynthesisVoice | null = null
  private listeners = new Set<() => void>()
  private booted = false
  // gate de áudio: começa trancado a cada carregamento; unlock() destrava
  private locked = true
  /** linha de boas-vindas falada no boot/destravamento */
  private bootLine =
    'CAPYBER online. Defesa de endpoints ativa. Vigilância contínua em todos os dispositivos. VIGIA no ar.'
  private loaded = false
  private settings: VigiaSettings = DEFAULT_SETTINGS
  private announcements: VigiaAnnouncement[] = []
  private checker: number | null = null
  private delayTimer: number | null = null
  private tokens = DEFAULT_SETTINGS.maxPerMinute
  private lastRefill = 0
  private lastFired = new Map<string, string>()
  // utterance atual: callbacks de utterances antigas (canceladas) são ignorados —
  // evita a corrida entre cancel() e onend/onerror que sobrescrevia a fala crítica
  private currentUtter: SpeechSynthesisUtterance | null = null
  private state: VigiaState = {
    enabled: true,
    speaking: false,
    caption: '',
    voiceName: '',
    supported: false,
    settings: DEFAULT_SETTINGS,
    announcements: [],
    lastSpokenAt: 0,
    droppedCount: 0,
  }

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.state = { ...this.state, supported: true }
      this.ensureLoaded()
      this.pickVoice()
      window.speechSynthesis.onvoiceschanged = () => this.pickVoice()
    }
  }

  // ── infra de estado reativo ──────────────────────────────────────

  subscribe = (cb: () => void) => {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  getState = (): VigiaState => this.state

  getServerState = (): VigiaState => VIGIA_SERVER_STATE

  private emit() {
    this.listeners.forEach((cb) => cb())
  }

  private setState(patch: Partial<VigiaState>) {
    this.state = { ...this.state, ...patch }
    this.emit()
  }

  // ── persistência (somente cliente; carregamento preguiçoso) ──────

  private ensureLoaded() {
    if (this.loaded) return
    this.loaded = true
    if (typeof window === 'undefined') return
    try {
      const rawSettings = window.localStorage.getItem(VIGIA_SETTINGS_KEY)
      if (rawSettings) this.settings = normalizeSettings(JSON.parse(rawSettings))
      const rawAnn = window.localStorage.getItem(VIGIA_ANNOUNCEMENTS_KEY)
      if (rawAnn) {
        const parsed: unknown = JSON.parse(rawAnn)
        if (Array.isArray(parsed)) {
          this.announcements = parsed
            .map(normalizeAnnouncement)
            .filter((a): a is VigiaAnnouncement => a !== null)
        }
      }
    } catch {
      // storage indisponível/corrompido: segue com os padrões
    }
    this.tokens = this.settings.maxPerMinute
    this.lastRefill = Date.now()
    this.state = {
      ...this.state,
      enabled: this.settings.enabled,
      settings: this.settings,
      announcements: this.announcements,
    }
    this.startChecker()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibility)
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(VIGIA_SETTINGS_KEY, JSON.stringify(this.settings))
    } catch {
      // quota/modo privado: ignora
    }
  }

  private saveAnnouncements() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(VIGIA_ANNOUNCEMENTS_KEY, JSON.stringify(this.announcements))
    } catch {
      // quota/modo privado: ignora
    }
  }

  // ── voz ──────────────────────────────────────────────────────────

  /** Lista de vozes disponíveis no navegador (lista vazia fora do cliente). */
  getVoices = (): SpeechSynthesisVoice[] => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
    return window.speechSynthesis.getVoices()
  }

  private pickVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const voices = window.speechSynthesis.getVoices()
    if (!voices.length) return
    if (this.settings.voiceURI) {
      const chosen = voices.find((v) => v.voiceURI === this.settings.voiceURI)
      if (chosen) {
        this.voice = chosen
        this.state = { ...this.state, voiceName: chosen.name }
        this.emit()
        return
      }
    }
    const ptBR = voices.filter((v) => /pt(-|_)BR/i.test(v.lang))
    const prefer = [/luciana/i, /francisca/i, /maria/i, /google.*pt/i, /microsoft.*maria/i, /thalita/i, /camila/i]
    this.voice =
      ptBR.find((v) => prefer.some((rx) => rx.test(v.name))) ??
      ptBR[0] ??
      voices.find((v) => v.lang.startsWith('pt')) ??
      null
    this.state = { ...this.state, voiceName: this.voice?.name ?? '' }
    this.emit()
  }

  // ── controle básico (API original preservada) ────────────────────

  setEnabled(on: boolean) {
    this.ensureLoaded()
    this.settings = { ...this.settings, enabled: on }
    this.setState({ enabled: on, settings: this.settings })
    this.saveSettings()
    if (!on) {
      this.queue = []
      this.stop()
    }
  }

  toggle() {
    this.setEnabled(!this.state.enabled)
  }

  stop() {
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer)
      this.delayTimer = null
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    // invalida a utterance em curso: onend/onerror dela vira no-op
    this.currentUtter = null
    this.speaking = false
    this.setState({ speaking: false })
  }

  // ── filtros: categorias, horário, aba oculta e ritmo ─────────────

  private isHiddenMuted(): boolean {
    return this.settings.muteWhenHidden && typeof document !== 'undefined' && document.hidden
  }

  /** true quando ela está liberada para falar agora (janela de horários/dias). */
  inScheduleWindow(now: Date = new Date()): boolean {
    const s = this.settings.schedule
    if (!s.quietOutside) return true
    if (s.activeDays.length > 0 && !s.activeDays.includes(now.getDay())) return false
    const m = now.getHours() * 60 + now.getMinutes()
    return s.startMin <= s.endMin
      ? m >= s.startMin && m < s.endMin
      : m >= s.startMin || m < s.endMin // janela virando a madrugada
  }

  /** Token bucket: recarrega maxPerMinute falas a cada minuto. */
  private takeToken(): boolean {
    const capacity = this.settings.maxPerMinute
    const now = Date.now()
    if (this.lastRefill === 0) {
      this.lastRefill = now
      this.tokens = capacity
    }
    const elapsedSec = Math.max(0, (now - this.lastRefill) / 1000)
    if (elapsedSec > 0) {
      this.tokens = Math.min(capacity, this.tokens + (elapsedSec / 60) * capacity)
      this.lastRefill = now
    }
    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }
    return false
  }

  // ── fila e fala ──────────────────────────────────────────────────

  /**
   * Enfileira uma fala respeitando: botão geral, categoria, aba oculta,
   * janela de horários e limite por minuto. Prioridade crítica (2) atropela
   * a fila e pode romper o silêncio (criticalBypass) e o limite de ritmo.
   */
  speak(text: string, priority: number = PRIORITY_NORMAL, category: VigiaCategory = 'auditoria') {
    this.ensureLoaded()
    if (this.locked) return // gate: descarta silenciosamente antes do destravamento
    if (!text || !this.state.enabled || !this.state.supported) return
    if (!this.settings.categories[category]) return
    if (this.isHiddenMuted() && priority < PRIORITY_CRITICAL) return
    const allowedNow = this.inScheduleWindow()
    if (!allowedNow && (priority < PRIORITY_CRITICAL || !this.settings.criticalBypass)) return
    if (this.queue.some((q) => q.text === text)) return
    if (priority < PRIORITY_CRITICAL && !this.takeToken()) {
      this.setState({ droppedCount: this.state.droppedCount + 1 })
      return
    }
    if (priority >= PRIORITY_CRITICAL) {
      this.queue = []
      this.stop()
    }
    this.enqueue(text, priority)
    this.pump()
  }

  /** Fala manual imediata: ignora categorias, horário, ritmo e mudo (estúdio/testes). */
  speakNow(text: string) {
    this.ensureLoaded()
    if (this.locked) return // gate: idem speak()
    if (!text || !this.state.supported || typeof window === 'undefined') return
    this.queue = []
    this.stop()
    this.enqueue(text, PRIORITY_CRITICAL)
    this.pump(true)
  }

  private enqueue(text: string, priority: number) {
    if (this.queue.some((q) => q.text === text)) return
    this.queue.push({ text, priority })
    if (this.queue.length > 6) this.queue.shift()
  }

  private pump(force = false) {
    if (this.locked) return // gate: cobre o único acesso direto a speechSynthesis.speak
    if (this.speaking) return
    if (!force && this.isHiddenMuted()) return
    const next = this.queue.shift()
    if (!next) {
      this.setState({ speaking: false, caption: '' })
      return
    }
    this.speaking = true
    this.setState({ speaking: true, caption: next.text, lastSpokenAt: Date.now() })

    try {
      const utter = new SpeechSynthesisUtterance(next.text)
      if (this.voice) utter.voice = this.voice
      utter.lang = this.voice?.lang || 'pt-BR'
      utter.rate = this.settings.rate
      utter.pitch = this.settings.pitch
      utter.volume = this.settings.volume
      this.currentUtter = utter
      utter.onend = () => {
        if (this.currentUtter !== utter) return // utterance antiga cancelada
        this.currentUtter = null
        this.speaking = false
        this.scheduleNext()
      }
      utter.onerror = () => {
        if (this.currentUtter !== utter) return // utterance antiga cancelada
        this.currentUtter = null
        this.speaking = false
        this.scheduleNext()
      }
      window.speechSynthesis.speak(utter)
    } catch {
      this.currentUtter = null
      this.speaking = false
      this.pump()
    }
  }

  /** Espera delaySec entre falas enfileiradas antes de puxar a próxima. */
  private scheduleNext() {
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer)
      this.delayTimer = null
    }
    const delayMs = Math.max(0, this.settings.delaySec) * 1000
    if (delayMs > 0) {
      this.delayTimer = window.setTimeout(() => {
        this.delayTimer = null
        this.pump()
      }, delayMs)
    } else {
      this.pump()
    }
  }

  private handleVisibility = () => {
    if (typeof document === 'undefined' || !this.settings.muteWhenHidden) return
    if (!document.hidden) this.pump() // voltou ao primeiro plano: retoma a fila
  }

  // ── ajustes (persistidos em localStorage) ────────────────────────

  setSettings = (patch: Partial<VigiaSettings>) => {
    this.ensureLoaded()
    const wasEnabled = this.settings.enabled
    this.settings = {
      ...this.settings,
      ...patch,
      categories: patch.categories
        ? { ...this.settings.categories, ...patch.categories }
        : this.settings.categories,
      schedule: patch.schedule ? { ...this.settings.schedule, ...patch.schedule } : this.settings.schedule,
    }
    if (patch.voiceURI !== undefined) this.pickVoice()
    if (wasEnabled && this.settings.enabled === false) {
      this.queue = []
      this.stop()
    }
    this.tokens = Math.min(this.tokens, this.settings.maxPerMinute)
    this.setState({ settings: this.settings, enabled: this.settings.enabled })
    this.saveSettings()
  }

  setCategory = (category: VigiaCategory, on: boolean) => {
    const categories = { ...this.settings.categories }
    categories[category] = on
    this.setSettings({ categories })
  }

  resetDroppedCount = () => {
    this.setState({ droppedCount: 0 })
  }

  // ── lembretes agendados ──────────────────────────────────────────

  private startChecker() {
    if (this.checker !== null || typeof window === 'undefined') return
    this.checker = window.setInterval(() => this.checkAnnouncements(), 15000)
  }

  private checkAnnouncements() {
    if (!this.announcements.length) return
    const now = new Date()
    const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const day = now.getDay()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    for (const a of this.announcements) {
      if (!a.enabled) continue
      if (a.days.length > 0 && !a.days.includes(day)) continue
      const target = a.hh * 60 + a.mm
      if (nowMin < target || nowMin > target + 4) continue // tolerância de 5 min
      if (this.lastFired.get(a.id) === dayKey) continue
      this.lastFired.set(a.id, dayKey)
      this.speak(a.text, PRIORITY_NORMAL, 'lembretes')
    }
  }

  listAnnouncements = (): VigiaAnnouncement[] => this.announcements

  addAnnouncement = (
    a: { id?: string; hh: number; mm: number; text: string; days?: number[]; enabled?: boolean }
  ): VigiaAnnouncement | null => {
    this.ensureLoaded()
    const text = (a.text ?? '').trim()
    if (!text) return null
    const ann: VigiaAnnouncement = {
      id: a.id && a.id.trim() ? a.id : newId(),
      hh: clampNum(a.hh, 0, 23, 9),
      mm: clampNum(a.mm, 0, 59, 0),
      text,
      days: Array.isArray(a.days)
        ? [...new Set(a.days.filter((n) => typeof n === 'number' && n >= 0 && n <= 6))].sort((x, y) => x - y)
        : [],
      enabled: a.enabled ?? true,
    }
    this.announcements = [...this.announcements.filter((x) => x.id !== ann.id), ann].sort(
      (x, y) => x.hh * 60 + x.mm - (y.hh * 60 + y.mm)
    )
    this.setState({ announcements: this.announcements })
    this.saveAnnouncements()
    return ann
  }

  /** Atalho para agendar um lembrete persistido. */
  scheduleAnnouncement = (
    a: { id?: string; hh: number; mm: number; text: string; days?: number[]; enabled?: boolean }
  ): VigiaAnnouncement | null => this.addAnnouncement(a)

  removeAnnouncement = (id: string) => {
    this.ensureLoaded()
    this.announcements = this.announcements.filter((a) => a.id !== id)
    this.lastFired.delete(id)
    this.setState({ announcements: this.announcements })
    this.saveAnnouncements()
  }

  toggleAnnouncement = (id: string, on?: boolean) => {
    this.ensureLoaded()
    this.announcements = this.announcements.map((a) =>
      a.id === id ? { ...a, enabled: on ?? !a.enabled } : a
    )
    this.setState({ announcements: this.announcements })
    this.saveAnnouncements()
  }

  // ── gate de áudio (destravamento feito pelo orquestrador) ────────

  /**
   * Destrava a voz: chamar quando (usuário autenticado) E (tutorial concluído
   * ou pulado). Chamadas repetidas são ignoradas. Não é persistido — a cada
   * carregamento o gate recomeça trancado. Se o boot() já aconteceu, a voz
   * está habilitada e ela não está falando, pronuncia a linha de boot.
   */
  unlock() {
    if (!this.locked) return
    this.locked = false
    if (this.booted && this.state.enabled && !this.speaking) {
      this.speak(this.bootLine, PRIORITY_CRITICAL, 'boot')
    }
  }

  /** true enquanto a voz estiver trancada (nenhuma fala toca). */
  isLocked(): boolean {
    return this.locked
  }

  // ── boot ─────────────────────────────────────────────────────────

  boot() {
    if (this.booted) return
    this.booted = true
    if (this.locked) return // fala de boas-vindas só ocorre após o destravamento
    this.speak(this.bootLine, PRIORITY_CRITICAL, 'boot')
  }
}

export const vigia = new VigiaVoice()
