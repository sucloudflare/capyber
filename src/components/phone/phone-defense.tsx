'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  Ban,
  BatteryMedium,
  Bug,
  Crosshair,
  Eye,
  Flame,
  Home,
  KeyRound,
  Lightbulb,
  Lock,
  Mail,
  MailWarning,
  MessageCircle,
  MessageSquareWarning,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Signal,
  Smartphone,
  Swords,
  Trophy,
  VenetianMask,
  Wifi,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { markLegacy } from '@/lib/legacy'

// ---------- Tipos ----------

type AppId = 'sms' | 'email'
type Phase = 'idle' | 'playing' | 'paused' | 'gameover' | 'victory'
type AttackTypeId = 'phishing' | 'bruteforce' | 'smishing' | 'social' | 'malware' | 'spyware'
type FloaterTone = 'score' | 'damage'

interface AttackTypeDef {
  id: AttackTypeId
  label: string
  short: string
  icon: LucideIcon
  color: string
  damage: number
  pts: number
  targets: AppId[]
  tip: string
}

interface Attack {
  id: number
  typeId: AttackTypeId
  target: AppId
  from: { x: number; y: number }
  to: { x: number; y: number }
  launchAt: number
  arriveAt: number
  flying: boolean
}

interface Floater {
  id: number
  text: string
  x: number
  y: number
  tone: FloaterTone
}

interface LogEntry {
  id: number
  icon: LucideIcon
  color: string
  text: string
}

interface LandedRecord {
  id: number
  typeId: AttackTypeId
  app: AppId
}

// ---------- Constantes de jogo ----------

const BEST_KEY = 'capy_phone_defense_best'
const BEST_EVENT = 'capy_phone_defense_best_changed'
const TOTAL_WAVES = 8
const MAX_ATTACKS = 8
const MAX_COMBO = 9
const SPAWN_BASE_MS = 1400
const SPAWN_FLOOR_MS = 650
const SPAWN_STEP_MS = 100
const TRAVEL_BASE_MS = 5200
const TRAVEL_FLOOR_MS = 2600
const TRAVEL_STEP_MS = 350
const FIREWALL_DURATION_MS = 5000
const FIREWALL_COOLDOWN_MS = 14000
const ANTIVIRUS_COOLDOWN_MS = 25000
const INTERWAVE_MS = 2500
const SPAWN_FLIP_MS = 60
const TRANSITION_BUFFER_MS = 120

const APP_META: Record<AppId, { name: string; icon: LucideIcon; accent: string; anchor: { x: number; y: number } }> = {
  sms: { name: 'Mensagens', icon: MessageCircle, accent: '#22c55e', anchor: { x: 0.28, y: 0.14 } },
  email: { name: 'E-mail', icon: Mail, accent: '#f5920b', anchor: { x: 0.72, y: 0.14 } },
}

const ATTACK_TYPES: Record<AttackTypeId, AttackTypeDef> = {
  phishing: {
    id: 'phishing', label: 'Phishing', short: 'Phishing', icon: MailWarning, color: '#c0182b',
    damage: 18, pts: 15, targets: ['email'],
    tip: 'Não clique em links suspeitos — verifique o remetente.',
  },
  bruteforce: {
    id: 'bruteforce', label: 'Força bruta', short: 'Força bruta', icon: KeyRound, color: '#8b5cf6',
    damage: 12, pts: 10, targets: ['email'],
    tip: 'Use senhas longas e ative a verificação em duas etapas.',
  },
  smishing: {
    id: 'smishing', label: 'Smishing', short: 'Smishing', icon: MessageSquareWarning, color: '#e94f37',
    damage: 15, pts: 12, targets: ['sms'],
    tip: 'Desconfie de SMS urgentes que pedem dados ou pagamentos.',
  },
  social: {
    id: 'social', label: 'Engenharia social', short: 'Eng. social', icon: VenetianMask, color: '#d97706',
    damage: 14, pts: 12, targets: ['sms'],
    tip: 'Nunca compartilhe códigos de verificação por telefone.',
  },
  malware: {
    id: 'malware', label: 'Malware', short: 'Malware', icon: Bug, color: '#65a30d',
    damage: 20, pts: 20, targets: ['sms', 'email'],
    tip: 'Instale aplicativos apenas de lojas oficiais.',
  },
  spyware: {
    id: 'spyware', label: 'Spyware', short: 'Spyware', icon: Eye, color: '#7c3aed',
    damage: 16, pts: 18, targets: ['sms', 'email'],
    tip: 'Revise com frequência as permissões dos aplicativos.',
  },
}

// Pool de sorteio com pesos (phishing/smishing mais comuns)
const SPAWN_POOL: AttackTypeId[] = [
  'phishing', 'phishing', 'phishing',
  'smishing', 'smishing', 'smishing',
  'bruteforce', 'bruteforce',
  'social', 'social',
  'malware', 'malware',
  'spyware', 'spyware',
]

const SECURITY_TIPS: { icon: LucideIcon; text: string }[] = [
  { icon: KeyRound, text: 'Ative a verificação em duas etapas (2FA) em todas as contas.' },
  { icon: RefreshCw, text: 'Mantenha o sistema e os aplicativos sempre atualizados.' },
  { icon: Lock, text: 'Use bloqueio de tela com PIN, senha ou biometria.' },
  { icon: Ban, text: 'Não clique em links de remetentes desconhecidos.' },
  { icon: ShieldCheck, text: 'Crie senhas longas e únicas para cada serviço.' },
  { icon: Eye, text: 'Revise as permissões concedidas aos aplicativos.' },
]

// Fundo da tela: campo de estrelas barato com radial-gradients repetidos
const SCREEN_BG = [
  'radial-gradient(1.4px 1.4px at 14px 22px, rgba(255,255,255,0.4) 50%, transparent 51%)',
  'radial-gradient(1px 1px at 68px 74px, rgba(255,255,255,0.26) 50%, transparent 51%)',
  'radial-gradient(1.2px 1.2px at 122px 46px, rgba(124,182,236,0.34) 50%, transparent 51%)',
  'linear-gradient(180deg, #0d1724 0%, #16263c 100%)',
].join(', ')
const SCREEN_BG_SIZE = '130px 130px, 190px 190px, 260px 260px, 100% 100%'

// ---------- Utilitários ----------

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const quotaFor = (wave: number) => 4 + wave * 2
const spawnDelayFor = (wave: number) => Math.max(SPAWN_FLOOR_MS, SPAWN_BASE_MS - (wave - 1) * SPAWN_STEP_MS)
const travelTimeFor = (wave: number) => Math.max(TRAVEL_FLOOR_MS, TRAVEL_BASE_MS - (wave - 1) * TRAVEL_STEP_MS)
const hpBarColor = (hp: number) => (hp > 50 ? '#22c55e' : hp > 25 ? '#f5920b' : '#c0182b')
const appName = (id: AppId) => APP_META[id].name

/** Posição interpolada do ataque em um instante (movimento linear). */
const attackPosAt = (a: Attack, t: number): { x: number; y: number } => {
  const p = clamp((t - a.launchAt) / Math.max(1, a.arriveAt - a.launchAt), 0, 1)
  return { x: a.from.x + (a.to.x - a.from.x) * p, y: a.from.y + (a.to.y - a.from.y) * p }
}

// ---------- Slot de app dentro da tela do celular ----------

function AppSlot(props: {
  appId: AppId
  hp: number
  shielded: boolean
  shieldSecs: number
  cooldown: number
  active: boolean
  onShield: (app: AppId) => void
}) {
  const meta = APP_META[props.appId]
  const Icon = meta.icon
  const label = props.shielded
    ? `ATIVO ${props.shieldSecs}s`
    : props.cooldown > 0
      ? `AGUARDE ${props.cooldown}s`
      : 'ESCUDO'
  return (
    <div className="flex w-[88px] flex-col items-center gap-1">
      <div className="relative">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl border-b-4 border-black/30 shadow-lg sm:h-[52px] sm:w-[52px]"
          style={{ background: `linear-gradient(180deg, ${meta.accent}, ${meta.accent}cc)` }}
        >
          <Icon className="h-6 w-6 text-white" strokeWidth={2.2} aria-hidden="true" />
        </div>
        {props.shielded && (
          <div
            className="pointer-events-none absolute -inset-1.5 rounded-[1.15rem] border-2 border-[#7cb6ec]"
            style={{ boxShadow: '0 0 16px rgba(124,182,236,0.9)' }}
          >
            <Shield className="absolute -right-1.5 -top-2 h-4 w-4 rounded-full bg-[#0d1724] p-0.5 text-[#7cb6ec]" aria-hidden="true" />
          </div>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={props.hp}
        aria-label={`Integridade do app ${meta.name}`}
        className="h-1.5 w-14 overflow-hidden rounded-full bg-white/15"
      >
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${props.hp}%`, background: hpBarColor(props.hp) }} />
      </div>
      <span className="text-[10px] font-bold text-slate-200">{meta.name}</span>
      <button
        type="button"
        onClick={() => props.onShield(props.appId)}
        disabled={!props.active || (!props.shielded && props.cooldown > 0)}
        aria-label={`Ativar escudo do app ${meta.name}`}
        className="cap-btn-steel min-h-11 w-full rounded-md px-1 text-[10px] leading-tight disabled:opacity-60"
      >
        {label}
      </button>
    </div>
  )
}

// ---------- Componente principal ----------

export function PhoneDefenseView() {
  // Fases: idle -> playing <-> paused -> gameover | victory
  const [phase, setPhase] = useState<Phase>('idle')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(1)
  const [wave, setWave] = useState(1)
  const [spawnedThisWave, setSpawnedThisWave] = useState(0)
  const [apps, setApps] = useState<Record<AppId, number>>({ email: 100, sms: 100 })
  const [shieldedUntil, setShieldedUntil] = useState<Record<AppId, number>>({ email: 0, sms: 0 })
  const [firewallReadyAt, setFirewallReadyAt] = useState(0)
  const [antivirusReadyAt, setAntivirusReadyAt] = useState(0)
  const [attacks, setAttacks] = useState<Attack[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [landedLog, setLandedLog] = useState<LandedRecord[]>([])
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [interWave, setInterWave] = useState<number | null>(null)
  const [fellApp, setFellApp] = useState<AppId | null>(null)
  const [announce, setAnnounce] = useState('')
  const [shaking, setShaking] = useState(false)
  const [now, setNow] = useState(0)
  // Espelho em estado do instante da pausa (usado apenas na renderização)
  const [pausedAtMs, setPausedAtMs] = useState(0)

  // Refs: dados mutáveis do motor do jogo (evitam closures obsoletas)
  const screenRef = useRef<HTMLDivElement | null>(null)
  const phaseRef = useRef<Phase>('idle')
  const scoreRef = useRef(0)
  const comboRef = useRef(1)
  const waveRef = useRef(1)
  const spawnedRef = useRef(0)
  const appsRef = useRef<Record<AppId, number>>({ email: 100, sms: 100 })
  const shieldRef = useRef<Record<AppId, number>>({ email: 0, sms: 0 })
  const firewallReadyRef = useRef(0)
  const antivirusReadyRef = useRef(0)
  const interWaveRef = useRef<number | null>(null)
  const interWaveUntilRef = useRef(0)
  const pausedAtRef = useRef(0)
  const nextIdRef = useRef(1)
  const attacksRef = useRef<Attack[]>([])
  const timersRef = useRef<Set<number>>(new Set())

  /** setTimeout com registro para limpeza total no unmount. */
  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id)
      fn()
    }, ms)
    timersRef.current.add(id)
  }, [])

  // Limpeza de todos os timers pendentes ao desmontar
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
      timers.clear()
    }
  }, [])

  /** Única fonte de mutação da lista de ataques (ref + estado espelhado). */
  const updateAttacks = useCallback((fn: (list: Attack[]) => Attack[]) => {
    attacksRef.current = fn(attacksRef.current)
    setAttacks(attacksRef.current)
  }, [])

  const addScore = useCallback((pts: number) => {
    scoreRef.current += pts
    setScore(scoreRef.current)
  }, [])

  const pushLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    const full: LogEntry = { ...entry, id: nextIdRef.current++ }
    setLogs((prev) => [full, ...prev].slice(0, 6))
  }, [])

  /** Micro animação flutuante (+pts / -dano), máximo 4 simultâneas. */
  const addFloater = useCallback(
    (text: string, x: number, y: number, tone: FloaterTone) => {
      const id = nextIdRef.current++
      setFloaters((prev) => [...prev, { id, text, x, y, tone }].slice(-4))
      later(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 700)
    },
    [later],
  )

  /** Âncora (px) de um app dentro da tela. */
  const anchorPx = useCallback((app: AppId): { x: number; y: number } => {
    const rect = screenRef.current?.getBoundingClientRect()
    const a = APP_META[app].anchor
    if (!rect) return { x: 0, y: 0 }
    return { x: a.x * rect.width, y: a.y * rect.height }
  }, [])

  const gotoPhase = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  /** Encerra a partida (derrota ou vitória). */
  const endGame = useCallback(
    (outcome: 'gameover' | 'victory', app?: AppId) => {
      if (phaseRef.current !== 'playing') return
      gotoPhase(outcome)
      updateAttacks(() => [])
      if (outcome === 'gameover' && app) {
        setFellApp(app)
        pushLog({ icon: ShieldAlert, color: '#c0182b', text: `${appName(app)} foi comprometido!` })
        setAnnounce(`Fim de jogo: o app ${appName(app)} foi comprometido.`)
      } else {
        pushLog({ icon: Trophy, color: '#21a44a', text: 'Todas as ondas foram repelidas!' })
        setAnnounce('Vitória! O celular foi defendido.')
        markLegacy('celular')
      }
    },
    [gotoPhase, pushLog, updateAttacks],
  )

  /** Resolve um ataque que chegou ao app: escudo bloqueia, senão aplica dano. */
  const resolveArrival = useCallback(
    (atk: Attack, t: number) => {
      const def = ATTACK_TYPES[atk.typeId]
      if (shieldRef.current[atk.target] > t) {
        const pts = Math.ceil(def.pts / 2)
        addScore(pts)
        addFloater(`+${pts}`, atk.to.x, atk.to.y, 'score')
        pushLog({ icon: ShieldCheck, color: '#21a44a', text: `Escudo bloqueou ${def.label} (+${pts} pts)` })
        setAnnounce(`Escudo bloqueou ataque de ${def.label}`)
        return
      }
      const anchor = anchorPx(atk.target)
      const hp = Math.max(0, appsRef.current[atk.target] - def.damage)
      appsRef.current = { ...appsRef.current, [atk.target]: hp }
      setApps({ ...appsRef.current })
      comboRef.current = 1
      setCombo(1)
      setShaking(true)
      later(() => setShaking(false), 460)
      addFloater(`-${def.damage}`, anchor.x, anchor.y + 34, 'damage')
      pushLog({ icon: def.icon, color: def.color, text: `${def.label} atingiu ${appName(atk.target)} (-${def.damage})` })
      setLandedLog((prev) => [{ id: atk.id, typeId: atk.typeId, app: atk.target }, ...prev].slice(0, 5))
      setAnnounce(`${def.label} atingiu o app ${appName(atk.target)}`)
      if (hp <= 0) endGame('gameover', atk.target)
    },
    [addFloater, addScore, anchorPx, endGame, later, pushLog],
  )

  /** Inicia a faixa entre ondas com bônus de pontuação. */
  const beginInterWave = useCallback(
    (t: number) => {
      const bonus = 50 * waveRef.current
      addScore(bonus)
      interWaveRef.current = waveRef.current
      setInterWave(waveRef.current)
      interWaveUntilRef.current = t + INTERWAVE_MS
      pushLog({ icon: Trophy, color: '#21a44a', text: `Onda ${waveRef.current} eliminada (+${bonus} pts)` })
      setAnnounce(`Onda ${waveRef.current} eliminada`)
    },
    [addScore, pushLog],
  )

  /** Encerra a faixa: próxima onda ou vitória. */
  const endInterWave = useCallback(() => {
    interWaveRef.current = null
    setInterWave(null)
    if (waveRef.current >= TOTAL_WAVES) {
      endGame('victory')
      return
    }
    waveRef.current += 1
    setWave(waveRef.current)
    spawnedRef.current = 0
    setSpawnedThisWave(0)
    pushLog({ icon: Swords, color: '#f5920b', text: `Onda ${waveRef.current} iniciou` })
    setAnnounce(`Onda ${waveRef.current}: novos ataques se aproximando`)
  }, [endGame, pushLog])

  /** Relógio do jogo: resolve chegadas, controla faixa entre ondas. */
  const runClockTick = useCallback(() => {
    const t = Date.now()
    setNow(t)
    if (phaseRef.current !== 'playing') return
    const arrived = attacksRef.current.filter((a) => a.arriveAt <= t)
    if (arrived.length > 0) {
      const ids = new Set(arrived.map((a) => a.id))
      updateAttacks((list) => list.filter((a) => !ids.has(a.id)))
      arrived.forEach((a) => resolveArrival(a, t))
    }
    if (interWaveRef.current === null && spawnedRef.current >= quotaFor(waveRef.current) && attacksRef.current.length === 0) {
      beginInterWave(t)
    } else if (interWaveRef.current !== null && t >= interWaveUntilRef.current) {
      endInterWave()
    }
  }, [beginInterWave, endInterWave, resolveArrival, updateAttacks])

  useEffect(() => {
    if (phase !== 'playing') return
    const iv = window.setInterval(runClockTick, 100)
    return () => window.clearInterval(iv)
  }, [phase, runClockTick])

  /** Gera um novo ataque vindo de uma borda da tela. */
  const spawnAttack = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    const screen = screenRef.current
    if (!screen) return
    if (interWaveRef.current !== null) return
    if (attacksRef.current.length >= MAX_ATTACKS) return
    if (spawnedRef.current >= quotaFor(waveRef.current)) return
    const rect = screen.getBoundingClientRect()
    if (rect.width < 10 || rect.height < 10) return
    const typeId = SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)]
    const def = ATTACK_TYPES[typeId]
    const target: AppId = def.targets.length === 2 ? (Math.random() < 0.5 ? 'sms' : 'email') : def.targets[0]
    // Origem: majoritariamente por baixo, às vezes pelas laterais
    const r = Math.random()
    let fx: number
    let fy: number
    if (r < 0.62) {
      fx = (0.06 + Math.random() * 0.88) * rect.width
      fy = 1.08 * rect.height
    } else if (r < 0.81) {
      fx = -0.08 * rect.width
      fy = (0.34 + Math.random() * 0.66) * rect.height
    } else {
      fx = 1.08 * rect.width
      fy = (0.34 + Math.random() * 0.66) * rect.height
    }
    const anchor = APP_META[target].anchor
    const t = Date.now()
    const atk: Attack = {
      id: nextIdRef.current++,
      typeId,
      target,
      from: { x: fx, y: fy },
      to: { x: anchor.x * rect.width, y: anchor.y * rect.height },
      launchAt: t + SPAWN_FLIP_MS,
      arriveAt: t + SPAWN_FLIP_MS + travelTimeFor(waveRef.current),
      flying: false,
    }
    updateAttacks((list) => [...list, atk])
    spawnedRef.current += 1
    setSpawnedThisWave(spawnedRef.current)
    later(() => {
      updateAttacks((list) => list.map((a) => (a.id === atk.id ? { ...a, flying: true } : a)))
    }, SPAWN_FLIP_MS)
  }, [later, updateAttacks])

  // Intervalo de spawn: um por vez, recriado por onda/faixa
  useEffect(() => {
    if (phase !== 'playing' || interWave !== null) return
    const iv = window.setInterval(spawnAttack, spawnDelayFor(wave))
    return () => window.clearInterval(iv)
  }, [phase, interWave, wave, spawnAttack])

  // Recorde: lido via useSyncExternalStore (seguro com SSR, sem setState em efeitos)
  const subscribeBest = useCallback((onStoreChange: () => void) => {
    window.addEventListener(BEST_EVENT, onStoreChange)
    return () => window.removeEventListener(BEST_EVENT, onStoreChange)
  }, [])

  const getBestSnapshot = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(BEST_KEY)
      const parsed = raw ? Number.parseInt(raw, 10) : 0
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    } catch {
      return 0
    }
  }, [])

  const best = useSyncExternalStore(subscribeBest, getBestSnapshot, () => 0)

  // Recorde: gravação ao fim da partida
  useEffect(() => {
    if (phase !== 'gameover' && phase !== 'victory') return
    if (scoreRef.current > getBestSnapshot()) {
      try {
        window.localStorage.setItem(BEST_KEY, String(scoreRef.current))
        window.dispatchEvent(new Event(BEST_EVENT))
      } catch {
        // armazenamento indisponível
      }
    }
  }, [phase, getBestSnapshot])

  /** Toque no ataque: destrói, pontua com multiplicador de combo. */
  const tapAttack = useCallback(
    (atk: Attack) => {
      if (phaseRef.current !== 'playing') return
      const def = ATTACK_TYPES[atk.typeId]
      const pts = def.pts * Math.min(comboRef.current, MAX_COMBO)
      updateAttacks((list) => list.filter((a) => a.id !== atk.id))
      const pos = atk.flying ? attackPosAt(atk, Date.now()) : atk.from
      addScore(pts)
      addFloater(`+${pts}`, pos.x, pos.y, 'score')
      comboRef.current = Math.min(comboRef.current + 1, MAX_COMBO)
      setCombo(comboRef.current)
    },
    [addFloater, addScore, updateAttacks],
  )

  /** Escudo de firewall de um app (cooldown compartilhado). */
  const activateShield = useCallback(
    (app: AppId) => {
      if (phaseRef.current !== 'playing') return
      const t = Date.now()
      if (t < firewallReadyRef.current) return
      firewallReadyRef.current = t + FIREWALL_COOLDOWN_MS
      setFirewallReadyAt(firewallReadyRef.current)
      shieldRef.current = { ...shieldRef.current, [app]: t + FIREWALL_DURATION_MS }
      setShieldedUntil({ ...shieldRef.current })
      pushLog({ icon: ShieldCheck, color: '#2569b8', text: `Escudo ativado em ${appName(app)} por 5s` })
      setAnnounce(`Escudo ativado no app ${appName(app)}`)
    },
    [pushLog],
  )

  /** Antivírus: elimina todos os ataques em tela por pontos cheios. */
  const activateAntivirus = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    const t = Date.now()
    if (t < antivirusReadyRef.current) return
    const alive = attacksRef.current
    if (alive.length === 0) return
    antivirusReadyRef.current = t + ANTIVIRUS_COOLDOWN_MS
    setAntivirusReadyAt(antivirusReadyRef.current)
    updateAttacks(() => [])
    let gained = 0
    alive.forEach((a) => {
      const def = ATTACK_TYPES[a.typeId]
      gained += def.pts
      const pos = a.flying ? attackPosAt(a, t) : a.from
      addFloater(`+${def.pts}`, pos.x, pos.y, 'score')
    })
    addScore(gained)
    pushLog({ icon: Crosshair, color: '#f5920b', text: `Antivírus eliminou ${alive.length} ataque(s) (+${gained} pts)` })
    setAnnounce(`Antivírus eliminou ${alive.length} ataques`)
  }, [addFloater, addScore, pushLog, updateAttacks])

  /** Pausa: congela ataques; tempos são deslocados na retomada. */
  const pauseGame = useCallback(() => {
    if (phaseRef.current !== 'playing') return
    pausedAtRef.current = Date.now()
    setPausedAtMs(pausedAtRef.current)
    gotoPhase('paused')
    setAnnounce('Jogo pausado')
  }, [gotoPhase])

  const resumeGame = useCallback(() => {
    if (phaseRef.current !== 'paused') return
    const delta = Date.now() - pausedAtRef.current
    updateAttacks((list) => list.map((a) => ({ ...a, launchAt: a.launchAt + delta, arriveAt: a.arriveAt + delta })))
    shieldRef.current = { email: shieldRef.current.email + delta, sms: shieldRef.current.sms + delta }
    setShieldedUntil({ ...shieldRef.current })
    firewallReadyRef.current += delta
    setFirewallReadyAt(firewallReadyRef.current)
    antivirusReadyRef.current += delta
    setAntivirusReadyAt(antivirusReadyRef.current)
    if (interWaveRef.current !== null) interWaveUntilRef.current += delta
    gotoPhase('playing')
    setAnnounce('Jogo retomado')
  }, [gotoPhase, updateAttacks])

  /** (Re)inicia a partida do zero. */
  const startGame = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    comboRef.current = 1
    setCombo(1)
    waveRef.current = 1
    setWave(1)
    spawnedRef.current = 0
    setSpawnedThisWave(0)
    appsRef.current = { email: 100, sms: 100 }
    setApps({ email: 100, sms: 100 })
    shieldRef.current = { email: 0, sms: 0 }
    setShieldedUntil({ email: 0, sms: 0 })
    firewallReadyRef.current = 0
    setFirewallReadyAt(0)
    antivirusReadyRef.current = 0
    setAntivirusReadyAt(0)
    interWaveRef.current = null
    setInterWave(null)
    updateAttacks(() => [])
    setLogs([{ id: nextIdRef.current++, icon: Swords, color: '#f5920b', text: 'Defesa iniciada — Onda 1' }])
    setLandedLog([])
    setFloaters([])
    setFellApp(null)
    pausedAtRef.current = 0
    setAnnounce('Defesa iniciada. Onda 1: proteja Mensagens e E-mail.')
    gotoPhase('playing')
  }, [gotoPhase, updateAttacks])

  const backToIdle = useCallback(() => {
    interWaveRef.current = null
    setInterWave(null)
    updateAttacks(() => [])
    setFloaters([])
    setAnnounce('')
    gotoPhase('idle')
  }, [gotoPhase, updateAttacks])

  // ---------- Derivados de render ----------

  const isPlaying = phase === 'playing'
  const shieldSecs = (app: AppId) => Math.max(0, Math.ceil((shieldedUntil[app] - now) / 1000))
  const isShielded = (app: AppId) => shieldedUntil[app] > now
  const firewallCd = Math.max(0, Math.ceil((firewallReadyAt - now) / 1000))
  const antivirusCd = Math.max(0, Math.ceil((antivirusReadyAt - now) / 1000))
  const remainingQuota = Math.max(0, quotaFor(wave) - spawnedThisWave)

  /** Transform + transition do ataque conforme o estado de voo/pausa. */
  const attackStyle = (a: Attack): { transform: string; transition: string; willChange: 'transform' } => {
    const fmt = (x: number, y: number) => `translate(calc(${x}px - 50%), calc(${y}px - 50%))`
    if (!a.flying) return { transform: fmt(a.from.x, a.from.y), transition: 'none', willChange: 'transform' }
    if (phase === 'paused') {
      const p = attackPosAt(a, pausedAtMs)
      return { transform: fmt(p.x, p.y), transition: 'none', willChange: 'transform' }
    }
    const ms = Math.max(0, a.arriveAt - now - TRANSITION_BUFFER_MS)
    return { transform: fmt(a.to.x, a.to.y), transition: `transform ${ms}ms linear`, willChange: 'transform' }
  }

  return (
    <section aria-label="Minigame Defenda seu Celular" className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <style>{`
        @keyframes cap-pd-shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(2px); } }
        .cap-pd-shake { animation: cap-pd-shake 0.45s ease; }
        @keyframes cap-pd-float { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); } 18% { opacity: 1; transform: translate(-50%, -58%) scale(1.05); } 100% { opacity: 0; transform: translate(-50%, calc(-50% - 36px)) scale(1); } }
        .cap-pd-float { animation: cap-pd-float 0.7s ease-out both; }
      `}</style>

      <p className="sr-only" aria-live="polite">{announce}</p>

      {/* Cabeçalho */}
      <header className="cap-panel flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--cap-border-strong)] bg-[linear-gradient(180deg,#ddebfb,#a5c8ec)]">
            <Smartphone className="h-5 w-5 text-[var(--cap-ink)]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="cap-heading text-base sm:text-lg">Defesa do Celular · Repelir os Hackers</h1>
            <p className="text-xs text-[var(--cap-text)]">Simulação educativa: neutralize golpes digitais antes que alcancem seus aplicativos.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="cap-chip flex items-center gap-1.5 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-[#f5920b]" aria-hidden="true" />
            <span className="cap-mono text-xs font-black text-[var(--cap-bright)]">{score} pts</span>
          </span>
          <span className="cap-chip flex items-center gap-1.5 px-3 py-1.5">
            <Swords className="h-3.5 w-3.5 text-[#2569b8]" aria-hidden="true" />
            <span className="cap-mono text-xs font-black text-[var(--cap-bright)]">Onda {wave}/{TOTAL_WAVES}</span>
          </span>
          <span className="cap-chip flex items-center gap-1.5 px-3 py-1.5">
            <Trophy className="h-3.5 w-3.5 text-[#f5920b]" aria-hidden="true" />
            <span className="cap-mono text-xs font-black text-[var(--cap-bright)]">Recorde {best}</span>
          </span>
        </div>
      </header>

      {/* Cartões educativos (apenas na introdução) */}
      {phase === 'idle' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="cap-panel-raised rounded-lg border-2 border-[var(--cap-border)] p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#22c55e]" aria-hidden="true" />
              <Mail className="h-5 w-5 text-[#f5920b]" aria-hidden="true" />
              <h2 className="cap-heading text-sm">Dois apps, uma missão</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--cap-text)]">
              Proteja Mensagens e E-mail ao mesmo tempo. Cada app tem barra de integridade própria: se qualquer um chegar a zero, a defesa cai.
            </p>
          </section>
          <section className="cap-panel-raised rounded-lg border-2 border-[var(--cap-border)] p-4">
            <div className="flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-[#c0182b]" aria-hidden="true" />
              <ShieldCheck className="h-5 w-5 text-[#21a44a]" aria-hidden="true" />
              <h2 className="cap-heading text-sm">Toque para neutralizar</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--cap-text)]">
              Toque nos ataques antes que alcancem a tela. O Escudo protege um app por 5s e o Antivírus limpa toda a área — use nos momentos críticos.
            </p>
          </section>
        </div>
      )}

      {/* Grade principal: celular + HUD */}
      <div className="grid items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Coluna do celular */}
        <div className="relative mx-auto w-full max-w-[380px]">
          <div className={`select-none ${shaking ? 'cap-pd-shake' : ''}`}>
            <div className="relative mx-auto h-[460px] w-[264px] overflow-hidden rounded-[2.2rem] border-[6px] border-[#0d1724] bg-[#0d1724] shadow-[0_24px_48px_-20px_rgba(13,23,36,0.65),0_0_0_2px_rgba(124,182,236,0.25)] sm:h-[600px] sm:w-[270px]">
              {/* Tela */}
              <div
                ref={screenRef}
                className="absolute inset-0 flex flex-col overflow-hidden rounded-[1.85rem]"
                style={{ backgroundImage: SCREEN_BG, backgroundSize: SCREEN_BG_SIZE }}
              >
                {/* Barra de status */}
                <div className="relative z-20 flex items-center justify-between px-4 pt-2 text-[11px] text-slate-300">
                  <span className="cap-mono font-bold">23:59</span>
                  <span className="flex items-center gap-1.5">
                    <Signal className="h-3.5 w-3.5" aria-hidden="true" />
                    <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
                    <BatteryMedium className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>

                {/* Apps protegidos */}
                <div aria-label="Aplicativos protegidos" className="relative z-20 flex items-start justify-center gap-6 px-3 pt-1">
                  <AppSlot
                    appId="sms"
                    hp={apps.sms}
                    shielded={isShielded('sms')}
                    shieldSecs={shieldSecs('sms')}
                    cooldown={firewallCd}
                    active={isPlaying}
                    onShield={activateShield}
                  />
                  <AppSlot
                    appId="email"
                    hp={apps.email}
                    shielded={isShielded('email')}
                    shieldSecs={shieldSecs('email')}
                    cooldown={firewallCd}
                    active={isPlaying}
                    onShield={activateShield}
                  />
                </div>

                {/* Campo de batalha: ataques + flutuantes */}
                <div className="pointer-events-none absolute inset-0 z-10">
                  {attacks.map((atk) => {
                    const def = ATTACK_TYPES[atk.typeId]
                    const Icon = def.icon
                    const st = attackStyle(atk)
                    return (
                      <div key={atk.id} className="absolute left-0 top-0" style={st}>
                        <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => tapAttack(atk)}
                            aria-label={`Bloquear ataque ${def.label}`}
                            className="pointer-events-auto flex h-11 w-11 touch-manipulation select-none items-center justify-center rounded-full border-2 bg-[#0b1420]/85 shadow-lg transition-transform hover:brightness-125 active:scale-90"
                            style={{ borderColor: def.color, boxShadow: `0 0 12px ${def.color}55, inset 0 0 8px ${def.color}33` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: def.color }} strokeWidth={2.4} aria-hidden="true" />
                          </button>
                          <span
                            className="whitespace-nowrap rounded bg-[#0b1420]/85 px-1 text-[8px] font-bold uppercase tracking-wide"
                            style={{ color: def.color }}
                          >
                            {def.short}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {floaters.map((f) => (
                    <span
                      key={f.id}
                      className="cap-pd-float absolute text-sm font-black"
                      style={{ left: f.x, top: f.y, color: f.tone === 'score' ? '#ffb020' : '#ff6b7a', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
                    >
                      {f.text}
                    </span>
                  ))}
                </div>

                {/* Faixa entre ondas */}
                {interWave !== null && (
                  <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                    <div className="cap-fade-in rounded-xl border-2 border-[#7cb6ec] bg-[#0d1724]/90 px-4 py-3 text-center shadow-[0_0_24px_rgba(124,182,236,0.5)]">
                      <p className="cap-mono text-sm font-black tracking-[0.2em] text-[#7cb6ec]">ONDA {interWave} ELIMINADA</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-300">Bônus +{50 * interWave} pontos · preparando a próxima onda...</p>
                    </div>
                  </div>
                )}

                {/* Dica sutil no campo */}
                {isPlaying && interWave === null && (
                  <p className="pointer-events-none absolute inset-x-0 bottom-7 z-0 text-center text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Toque nos ataques
                  </p>
                )}

                {/* Indicador home */}
                <div className="pointer-events-none absolute bottom-2 left-1/2 z-0 h-1 w-24 -translate-x-1/2 rounded-full bg-white/20" />

                {/* Overlay: introdução */}
                {phase === 'idle' && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#0d1724]/90 p-4 text-center backdrop-blur-[2px]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#7cb6ec] bg-[#16263c]">
                      <Smartphone className="h-6 w-6 text-[#7cb6ec]" aria-hidden="true" />
                    </div>
                    <p className="cap-mono text-[10px] font-bold tracking-[0.3em] text-[#7cb6ec]">SIMULAÇÃO DE ATAQUE</p>
                    <h2 className="text-lg font-black text-white">Defenda seu celular</h2>
                    <p className="max-w-[212px] text-xs leading-relaxed text-slate-300">
                      Hackers atacam em ondas. Toque nos ataques antes que alcancem os apps{' '}
                      <span className="font-bold text-[#22c55e]">Mensagens</span> e <span className="font-bold text-[#f5920b]">E-mail</span>.
                    </p>
                    <button type="button" onClick={startGame} className="cap-btn-primary min-h-11 w-full max-w-[210px] rounded-md px-4 text-sm">
                      COMEÇAR DEFESA
                    </button>
                    <p className="text-[10px] text-slate-400">8 ondas · escudo e antivírus disponíveis</p>
                  </div>
                )}

                {/* Overlay: pausa */}
                {phase === 'paused' && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#0d1724]/90 p-4 text-center backdrop-blur-[2px]">
                    <Pause className="h-8 w-8 text-[#7cb6ec]" aria-hidden="true" />
                    <h2 className="text-lg font-black text-white">PAUSADO</h2>
                    <p className="text-xs text-slate-300">Os ataques estão congelados.</p>
                    <button type="button" onClick={resumeGame} className="cap-btn-primary min-h-11 w-full max-w-[190px] rounded-md px-4 text-sm">
                      RETOMAR
                    </button>
                    <button type="button" onClick={backToIdle} className="cap-btn-ghost min-h-11 w-full max-w-[190px] rounded-md px-4 text-sm">
                      Voltar ao início
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overlay: derrota */}
          {phase === 'gameover' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-2">
              <div className="cap-danger-panel cap-fade-in max-h-full w-full max-w-[340px] overflow-y-auto p-4 [scrollbar-width:thin]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6 shrink-0 text-[#ff8f9d]" aria-hidden="true" />
                  <h2 className="cap-heading text-base text-[#ffe9ec]">APLICATIVO COMPROMETIDO</h2>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#ffd4da]">
                  O app <strong>{fellApp ? appName(fellApp) : '—'}</strong> foi derrubado na Onda {wave}. Pontuação:{' '}
                  <strong className="cap-mono">{score}</strong> · Recorde: <strong className="cap-mono">{best}</strong>
                </p>
                {landedLog.length > 0 && (
                  <div className="mt-3">
                    <p className="cap-mono text-[10px] font-bold tracking-[0.2em] text-[#ffb3bd]">ATAQUES QUE PASSARAM</p>
                    <ul className="mt-1 flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {landedLog.map((l) => {
                        const def = ATTACK_TYPES[l.typeId]
                        const Icon = def.icon
                        return (
                          <li key={l.id} className="cap-danger-card flex items-start gap-2 p-2">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: def.color }} aria-hidden="true" />
                            <div>
                              <p className="text-[11px] font-bold text-[#ffe9ec]">{def.label} → {appName(l.app)}</p>
                              <p className="text-[10px] leading-snug text-[#ffc9d1]">{def.tip}</p>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                <div className="mt-3">
                  <p className="cap-mono text-[10px] font-bold tracking-[0.2em] text-[#ffb3bd]">COMO SE PROTEGER</p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {SECURITY_TIPS.slice(0, 4).map((tip) => {
                      const Icon = tip.icon
                      return (
                        <li key={tip.text} className="flex items-start gap-2">
                          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ffc9d1]" aria-hidden="true" />
                          <span className="text-[10px] leading-snug text-[#ffd4da]">{tip.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <button type="button" onClick={startGame} className="cap-btn-primary flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-sm">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Tentar de novo
                  </button>
                  <button type="button" onClick={backToIdle} className="cap-btn-ghost flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-sm">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    Voltar ao início
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overlay: vitória */}
          {phase === 'victory' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-2">
              <div className="cap-fade-in max-h-full w-full max-w-[340px] overflow-y-auto rounded-[10px] border-2 border-[#0e5c2f] bg-[linear-gradient(180deg,#1f8f4a,#12693a)] p-4 text-[#eafff2] shadow-[0_0_20px_rgba(33,164,74,0.4)] [scrollbar-width:thin]">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 shrink-0 text-[#ffe08a]" aria-hidden="true" />
                  <h2 className="cap-heading text-base text-white">CELULAR DEFENDIDO</h2>
                </div>
                <p className="mt-2 cap-mono text-[10px] font-bold tracking-[0.2em] text-[#a5f0c3]">CERTIFICADO DE GUARDIÃO DO CELULAR</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Você repeliu as {TOTAL_WAVES} ondas de ataques. Mensagens e E-mail seguem intactos — seus dados estão seguros.
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="flex-1 rounded-lg border border-[#a5f0c3]/40 bg-black/15 p-2 text-center">
                    <span className="block text-[9px] font-bold tracking-[0.15em] text-[#a5f0c3]">PONTUAÇÃO</span>
                    <span className="cap-mono text-lg font-black text-white">{score}</span>
                  </span>
                  <span className="flex-1 rounded-lg border border-[#a5f0c3]/40 bg-black/15 p-2 text-center">
                    <span className="block text-[9px] font-bold tracking-[0.15em] text-[#a5f0c3]">RECORDE</span>
                    <span className="cap-mono text-lg font-black text-white">{best}</span>
                  </span>
                </div>
                <ul className="mt-3 flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {SECURITY_TIPS.map((tip) => {
                    const Icon = tip.icon
                    return (
                      <li key={tip.text} className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a5f0c3]" aria-hidden="true" />
                        <span className="text-[10px] leading-snug">{tip.text}</span>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-4 flex flex-col gap-2">
                  <button type="button" onClick={startGame} className="cap-btn-primary flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-sm">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Tentar de novo
                  </button>
                  <button type="button" onClick={backToIdle} className="cap-btn-ghost flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-sm">
                    <Home className="h-4 w-4" aria-hidden="true" />
                    Voltar ao início
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Painel HUD lateral */}
        <aside aria-label="Painel de controle da defesa" className="cap-panel flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="cap-mono text-[10px] font-bold tracking-[0.25em] text-[var(--cap-dim)]">PONTUAÇÃO</p>
              <p className="cap-mono text-4xl font-black leading-none text-[var(--cap-bright)]">{score}</p>
            </div>
            <span
              className={`cap-chip flex items-center gap-1.5 px-3 py-1.5 ${combo > 1 ? 'text-[#f5920b]' : 'text-[var(--cap-dim)]'}`}
              aria-label={`Combo de bloqueios: x${combo}`}
            >
              <Flame className="h-4 w-4" aria-hidden="true" />
              <span className="cap-mono text-xs font-black">COMBO x{combo}</span>
            </span>
          </div>

          <div className="cap-panel-raised rounded-lg border-2 border-[var(--cap-border)] p-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-black text-[var(--cap-bright)]">
                <Swords className="h-4 w-4 text-[#f5920b]" aria-hidden="true" />
                Onda {wave} de {TOTAL_WAVES}
              </p>
              <p className="cap-mono text-[10px] font-bold text-[var(--cap-dim)]">Recorde: {best}</p>
            </div>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: TOTAL_WAVES }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < wave - 1 ? 'bg-[#21a44a]' : i === wave - 1 ? 'bg-[#f5920b]' : 'bg-[#b9d4f0]'}`}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--cap-text)]">
              {interWave !== null ? 'Preparando a próxima onda...' : `Restam ${remainingQuota} ataques nesta onda`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={activateAntivirus}
              disabled={!isPlaying || antivirusCd > 0}
              className="cap-btn-steel flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 text-xs disabled:opacity-60"
            >
              <Crosshair className="h-4 w-4 shrink-0" aria-hidden="true" />
              {antivirusCd > 0 ? `ANTIVÍRUS ${antivirusCd}s` : 'ANTIVÍRUS'}
            </button>
            <button
              type="button"
              onClick={isPlaying ? pauseGame : resumeGame}
              disabled={!isPlaying && phase !== 'paused'}
              className="cap-btn-ghost flex min-h-11 items-center justify-center gap-1.5 rounded-md px-2 text-xs disabled:opacity-60"
            >
              {phase === 'paused' ? <Play className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Pause className="h-4 w-4 shrink-0" aria-hidden="true" />}
              {phase === 'paused' ? 'RETOMAR' : 'PAUSAR'}
            </button>
          </div>

          <div>
            <p className="cap-heading text-sm">REGISTRO DE DEFESA</p>
            <div className="cap-panel-raised mt-2 max-h-48 overflow-y-auto rounded-lg border-2 border-[var(--cap-border)] p-2 [scrollbar-width:thin]">
              {logs.length === 0 ? (
                <p className="p-2 text-xs text-[var(--cap-dim)]">Nenhum evento registrado ainda.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {logs.map((l) => {
                    const Icon = l.icon
                    return (
                      <li key={l.id} className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: l.color }} aria-hidden="true" />
                        <span className="text-xs leading-snug text-[var(--cap-text)]">{l.text}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <div>
            <p className="cap-heading flex items-center gap-1.5 text-sm">
              <Lightbulb className="h-4 w-4 text-[#f5920b]" aria-hidden="true" />
              DICAS DE SEGURANÇA
            </p>
            <ul className="cap-panel-raised mt-2 flex max-h-56 flex-col gap-2 overflow-y-auto rounded-lg border-2 border-[var(--cap-border)] p-3 [scrollbar-width:thin]">
              {SECURITY_TIPS.map((tip) => {
                const Icon = tip.icon
                return (
                  <li key={tip.text} className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2569b8]" aria-hidden="true" />
                    <span className="text-xs leading-snug text-[var(--cap-text)]">{tip.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default PhoneDefenseView
