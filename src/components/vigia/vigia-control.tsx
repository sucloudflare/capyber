'use client'

// VIGIA · STUDIO — sala de controle de transmissão da narradora do CAPYBER.
// O que ela fala (categorias e predefinições), quando fala (janela de horários e
// lembretes agendados) e como soa (voz, velocidade, tom, volume e ritmo).

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from 'react'
import { vigia, VIGIA_SERVER_STATE, type VigiaCategory, type VigiaState } from '@/lib/voice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  BellRing,
  CalendarClock,
  Gauge,
  ListChecks,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'

const getServerSnapshot = (): VigiaState => VIGIA_SERVER_STATE

/** Estado reativo da VIGIA (hidratação segura: snapshot estável no servidor). */
export function useVigia(): VigiaState {
  return useSyncExternalStore(vigia.subscribe, vigia.getState, getServerSnapshot)
}

// ── catálogo de conteúdo ───────────────────────────────────────────

const CATEGORY_INFO: { id: VigiaCategory; label: string; desc: string }[] = [
  { id: 'boot', label: 'Abertura do sistema', desc: 'Saudação de boot — “CAPYBER online. VIGIA no ar.”' },
  { id: 'ameaca_critica', label: 'Ameaças críticas', desc: 'Ataques sendo neutralizados agora — prioridade máxima.' },
  { id: 'ameaca_alta', label: 'Ameaças altas', desc: 'Invasões detectadas em andamento nos dispositivos.' },
  { id: 'ameaca_moderada', label: 'Ameaças moderadas', desc: 'Varreduras, sondagens e tentativas contidas.' },
  { id: 'resposta', label: 'Respostas do sistema', desc: 'Neutralizações, quarentenas e ações defensivas.' },
  { id: 'auditoria', label: 'Auditoria', desc: 'Eventos do log de auditoria e de conformidade.' },
  { id: 'osint', label: 'OSINT', desc: 'Inteligência de fontes abertas e reputação externa.' },
  { id: 'trilha', label: 'Trilha 3D', desc: 'Movimentação de ataques no mapa global.' },
  { id: 'tutorial', label: 'Tutorial', desc: 'Dicas de uso da plataforma.' },
  { id: 'chat', label: 'Chat do mascote', desc: 'Mensagens do copiloto e da capivara.' },
  { id: 'lembretes', label: 'Lembretes agendados', desc: 'Avisos que você programou para horários específicos.' },
]

function buildCategories(on: Partial<Record<VigiaCategory, boolean>>): Record<VigiaCategory, boolean> {
  const out = {} as Record<VigiaCategory, boolean>
  for (const c of CATEGORY_INFO) out[c.id] = on[c.id] ?? false
  return out
}

const PRESETS: { label: string; categories: Record<VigiaCategory, boolean> }[] = [
  { label: 'Só crítico', categories: buildCategories({ ameaca_critica: true }) },
  {
    label: 'Padrão SOC',
    categories: buildCategories({
      boot: true,
      ameaca_critica: true,
      ameaca_alta: true,
      ameaca_moderada: true,
      resposta: true,
      lembretes: true,
    }),
  },
  {
    label: 'Tudo',
    categories: buildCategories(
      Object.fromEntries(CATEGORY_INFO.map((c) => [c.id, true])) as Partial<Record<VigiaCategory, boolean>>
    ),
  },
  { label: 'Silêncio total', categories: buildCategories({}) },
]

// ── utilitários de tempo e dias ────────────────────────────────────

const DAY_PILL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DAY_NAME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const DAY_ABBR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function minToTime(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map((n) => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return -1
  return h * 60 + m
}

function daysLabel(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  if (sorted.length === 0 || sorted.length === 7) return 'todos os dias'
  const key = sorted.join(',')
  if (key === '1,2,3,4,5') return 'seg–sex'
  if (key === '0,6') return 'fins de semana'
  return sorted.map((d) => DAY_ABBR[d] ?? '').join(', ')
}

const SAMPLE_TEXT = 'Amostra de voz da VIGIA. É assim que eu falo com estes ajustes.'
const TEST_TEXT = 'Teste de transmissão da VIGIA. Todos os sistemas operando com normalidade.'

// ── peças de UI reutilizáveis ──────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="rounded-xl border-2 border-[var(--cap-border)] bg-white p-4 shadow-[0_1px_0_rgba(18,58,107,0.06)]"
    >
      <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-extrabold uppercase tracking-widest text-[var(--cap-bright)]">
        <Icon className="h-4 w-4 text-[#157034]" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  )
}

function SettingSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onValueChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onValueChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-bold text-[var(--cap-text)]">
          {label}
        </Label>
        <span className="rounded-md border border-[var(--cap-border)] bg-white px-1.5 py-0.5 text-xs font-extrabold tabular-nums text-[var(--cap-bright)]">
          {format(value)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(vals) => onValueChange(vals[0] ?? value)}
        className="mt-2.5"
        aria-label={label}
      />
    </div>
  )
}

function DayPills({
  selected,
  onToggle,
  groupLabel,
}: {
  selected: number[]
  onToggle: (day: number) => void
  groupLabel: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${groupLabel} — dias da semana`}>
      {DAY_PILL.map((label, day) => {
        const on = selected.includes(day)
        return (
          <button
            key={day}
            type="button"
            onClick={() => onToggle(day)}
            aria-pressed={on}
            aria-label={`${DAY_NAME[day]}${on ? ' (ativado)' : ' (desativado)'}`}
            title={DAY_NAME[day]}
            className={`h-8 w-8 rounded-full border-2 text-xs font-extrabold transition-all ${
              on
                ? 'border-[#157034]/60 bg-gradient-to-b from-[#3ecb6e] to-[#21a44a] text-white'
                : 'border-[var(--cap-border)] bg-white text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ── seção: ao vivo ─────────────────────────────────────────────────

function LiveSection() {
  const state = useVigia()
  const status = !state.supported
    ? 'INDISPONÍVEL'
    : !state.enabled
      ? 'SILENCIADA'
      : state.speaking
        ? 'TRANSMITINDO'
        : 'EM ESCUTA'
  const statusColor = state.speaking
    ? 'text-red-600'
    : !state.enabled || !state.supported
      ? 'text-[var(--cap-dim)]'
      : 'text-[#157034]'

  return (
    <section
      aria-label="Ao vivo"
      className="rounded-xl border-2 border-[var(--cap-border-strong)] bg-[var(--cap-panel-raised)] p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex h-3 w-3" aria-hidden>
          {state.speaking && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-3 w-3 rounded-full ${
              state.speaking ? 'bg-red-500' : state.enabled ? 'bg-[#21a44a]' : 'bg-[var(--cap-border-strong)]'
            }`}
          />
        </span>
        <span className={`font-heading text-sm font-extrabold tracking-widest ${statusColor}`}>{status}</span>
        {state.lastSpokenAt > 0 && (
          <span className="ml-auto text-xs tabular-nums text-[var(--cap-dim)]">
            última fala às {new Date(state.lastSpokenAt).toLocaleTimeString('pt-BR')}
          </span>
        )}
      </div>
      <p className="mt-2 min-h-10 text-sm leading-snug text-[var(--cap-text)]">
        {state.caption || 'Aguardando eventos para narrar…'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => vigia.speakNow(TEST_TEXT)}
          disabled={!state.supported}
          aria-label="Falar uma frase de teste"
        >
          <Play className="h-4 w-4" aria-hidden />
          Falar teste
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => vigia.stop()} disabled={!state.speaking}>
          <Square className="h-4 w-4" aria-hidden />
          Parar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => vigia.toggle()}
          aria-pressed={!state.enabled}
          disabled={!state.supported}
        >
          {state.enabled ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
          {state.enabled ? 'Mudo' : 'Desmudar'}
        </Button>
      </div>
      {!state.supported && (
        <p className="mt-2 text-xs text-[var(--cap-dim)]">
          Este navegador não suporta síntese de voz (Web Speech API).
        </p>
      )}
    </section>
  )
}

// ── seção: voz e timbre ────────────────────────────────────────────

function VoiceSection({ onPreview }: { onPreview: () => void }) {
  const state = useVigia()
  const s = state.settings
  const [voices, setVoices] = useState<{ pt: SpeechSynthesisVoice[]; rest: SpeechSynthesisVoice[] }>(() => {
    const all = vigia.getVoices().filter((v) => v.voiceURI)
    return {
      pt: all.filter((v) => /^pt/i.test(v.lang)),
      rest: all.filter((v) => !/^pt/i.test(v.lang)),
    }
  })

  const refreshVoices = useCallback(() => {
    const all = vigia.getVoices().filter((v) => v.voiceURI)
    setVoices({
      pt: all.filter((v) => /^pt/i.test(v.lang)),
      rest: all.filter((v) => !/^pt/i.test(v.lang)),
    })
  }, [])

  // acompanha a lista de vozes do navegador (chegada assíncrona) + recarga manual
  useEffect(() => {
    const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
    synth?.addEventListener('voiceschanged', refreshVoices)
    return () => synth?.removeEventListener('voiceschanged', refreshVoices)
  }, [refreshVoices])

  const allVoices = [...voices.pt, ...voices.rest]
  const selectedURI = s.voiceURI && allVoices.some((v) => v.voiceURI === s.voiceURI) ? s.voiceURI : 'auto'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Label htmlFor="vigia-voice" className="text-sm font-bold text-[var(--cap-text)]">
            Voz do navegador
          </Label>
          <Select
            value={selectedURI}
            onValueChange={(val) => {
              vigia.setSettings({ voiceURI: val === 'auto' ? '' : val })
              onPreview()
            }}
          >
            <SelectTrigger id="vigia-voice" className="mt-1.5 w-full">
              <SelectValue placeholder="Escolher voz" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="auto">Automática (melhor pt-BR)</SelectItem>
              </SelectGroup>
              {voices.pt.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Português</SelectLabel>
                  {voices.pt.map((v, i) => (
                    <SelectItem key={`${v.voiceURI}-${i}`} value={v.voiceURI}>
                      {v.name} · {v.lang}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
              {voices.rest.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Outros idiomas</SelectLabel>
                  {voices.rest.map((v, i) => (
                    <SelectItem key={`${v.voiceURI}-${i}`} value={v.voiceURI}>
                      {v.name} · {v.lang}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={refreshVoices}
            aria-label="Recarregar lista de vozes"
            title="Recarregar lista de vozes"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={onPreview}
            disabled={!state.supported}
          >
            <Volume2 className="h-4 w-4" aria-hidden />
            Ouvir amostra
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SettingSlider
          id="vigia-rate"
          label="Velocidade"
          value={s.rate}
          min={0.5}
          max={2}
          step={0.05}
          format={(v) => `${v.toFixed(2)}×`}
          onValueChange={(v) => {
            vigia.setSettings({ rate: v })
            onPreview()
          }}
        />
        <SettingSlider
          id="vigia-pitch"
          label="Tom"
          value={s.pitch}
          min={0}
          max={2}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onValueChange={(v) => {
            vigia.setSettings({ pitch: v })
            onPreview()
          }}
        />
        <SettingSlider
          id="vigia-volume"
          label="Volume"
          value={s.volume}
          min={0}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onValueChange={(v) => {
            vigia.setSettings({ volume: v })
            onPreview()
          }}
        />
      </div>
    </div>
  )
}

// ── seção: o que ela pode falar ────────────────────────────────────

function CategoriesSection() {
  const state = useVigia()
  const cats = state.settings.categories

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Predefinições de conteúdo">
        {PRESETS.map((p) => {
          const active = CATEGORY_INFO.every((c) => cats[c.id] === p.categories[c.id])
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => vigia.setSettings({ categories: p.categories })}
              aria-pressed={active}
              className={`rounded-full border-2 px-3 py-1 text-xs font-extrabold tracking-wide transition-all ${
                active
                  ? 'border-[#157034]/60 bg-gradient-to-b from-[#3ecb6e] to-[#21a44a] text-white shadow-[0_2px_8px_rgba(33,164,74,0.4)]'
                  : 'border-[var(--cap-border-strong)] bg-white text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>
      <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-lg border border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-1.5 [scrollbar-width:thin]">
        {CATEGORY_INFO.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--cap-bright)]">{c.label}</p>
              <p className="text-xs leading-snug text-[var(--cap-dim)]">{c.desc}</p>
            </div>
            <Switch
              checked={cats[c.id]}
              onCheckedChange={(v) => vigia.setCategory(c.id, v)}
              aria-label={`${c.label} — ${cats[c.id] ? 'ativado' : 'desativado'}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── seção: ritmo e silêncio ────────────────────────────────────────

function RhythmSection() {
  const state = useVigia()
  const s = state.settings

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SettingSlider
          id="vigia-delay"
          label="Pausa entre falas"
          value={s.delaySec}
          min={0}
          max={60}
          step={1}
          format={(v) => (v === 0 ? 'sem pausa' : `${v} s`)}
          onValueChange={(v) => vigia.setSettings({ delaySec: v })}
        />
        <SettingSlider
          id="vigia-maxmin"
          label="Limite por minuto"
          value={s.maxPerMinute}
          min={1}
          max={30}
          step={1}
          format={(v) => `${v}/min`}
          onValueChange={(v) => vigia.setSettings({ maxPerMinute: v })}
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-3 py-2.5">
        <div className="min-w-0">
          <Label htmlFor="vigia-hidden" className="text-sm font-bold text-[var(--cap-bright)]">
            Silenciar em segundo plano
          </Label>
          <p className="text-xs text-[var(--cap-dim)]">
            Com a aba oculta, novas falas comuns são ignoradas — as críticas continuam.
          </p>
        </div>
        <Switch
          id="vigia-hidden"
          checked={s.muteWhenHidden}
          onCheckedChange={(v) => vigia.setSettings({ muteWhenHidden: v })}
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-[var(--cap-border-strong)] bg-white px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--cap-bright)]">Falas descartadas pelo ritmo</p>
          <p className="text-xs text-[var(--cap-dim)]">
            Excedentes do limite de {s.maxPerMinute} falas/min são calados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-md border border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-2 py-1 text-sm font-extrabold tabular-nums text-[var(--cap-bright)]"
            aria-live="polite"
          >
            {state.droppedCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--cap-dim)]"
            onClick={() => vigia.resetDroppedCount()}
            aria-label="Zerar contador de falas descartadas"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── seção: horários de atuação ─────────────────────────────────────

function ScheduleSection() {
  const state = useVigia()
  const s = state.settings.schedule
  const bypass = state.settings.criticalBypass
  const inWindow = vigia.inScheduleWindow()

  const toggleDay = (day: number) => {
    const has = s.activeDays.includes(day)
    const activeDays = (has ? s.activeDays.filter((x) => x !== day) : [...s.activeDays, day]).sort(
      (a, b) => a - b
    )
    vigia.setSettings({ schedule: { ...s, activeDays } })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-bold text-[var(--cap-text)]">Dias de atuação</Label>
        <Badge
          variant="outline"
          className={
            s.quietOutside
              ? inWindow
                ? 'border-[#21a44a] text-[#157034]'
                : 'border-[var(--cap-border-strong)] text-[var(--cap-dim)]'
              : 'border-[var(--cap-border-strong)] text-[var(--cap-dim)]'
          }
        >
          {s.quietOutside
            ? inWindow
              ? 'Na janela agora'
              : 'Fora da janela — silêncio'
            : 'Sem restrição de horário'}
        </Badge>
      </div>
      <DayPills selected={s.activeDays} onToggle={toggleDay} groupLabel="Janela de fala" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="vigia-start" className="text-sm font-bold text-[var(--cap-text)]">
            Começa a falar às
          </Label>
          <Input
            id="vigia-start"
            type="time"
            value={minToTime(s.startMin)}
            onChange={(e) => {
              const m = timeToMin(e.target.value)
              if (m >= 0) vigia.setSettings({ schedule: { ...s, startMin: m } })
            }}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="vigia-end" className="text-sm font-bold text-[var(--cap-text)]">
            Encerra às
          </Label>
          <Input
            id="vigia-end"
            type="time"
            value={minToTime(s.endMin)}
            onChange={(e) => {
              const m = timeToMin(e.target.value)
              if (m >= 0) vigia.setSettings({ schedule: { ...s, endMin: m } })
            }}
            className="mt-1.5"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-3 py-2.5">
        <div className="min-w-0">
          <Label htmlFor="vigia-quiet" className="text-sm font-bold text-[var(--cap-bright)]">
            Silêncio fora do horário
          </Label>
          <p className="text-xs text-[var(--cap-dim)]">
            Fora da janela ela não fala — exceto ameaças críticas, se o bypass estiver ativo.
          </p>
        </div>
        <Switch
          id="vigia-quiet"
          checked={s.quietOutside}
          onCheckedChange={(v) => vigia.setSettings({ schedule: { ...s, quietOutside: v } })}
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-3 py-2.5">
        <div className="min-w-0">
          <Label htmlFor="vigia-bypass" className="text-sm font-bold text-[var(--cap-bright)]">
            Críticos ignoram o silêncio
          </Label>
          <p className="text-xs text-[var(--cap-dim)]">
            Ataques críticos em andamento rompem a janela de silêncio.
          </p>
        </div>
        <Switch
          id="vigia-bypass"
          checked={bypass}
          onCheckedChange={(v) => vigia.setSettings({ criticalBypass: v })}
        />
      </div>
      <p className="rounded-lg border border-[var(--cap-border)] bg-white px-3 py-2 text-sm text-[var(--cap-text)]">
        Ela falará entre{' '}
        <strong className="font-extrabold text-[var(--cap-bright)]">{minToTime(s.startMin)}</strong> e{' '}
        <strong className="font-extrabold text-[var(--cap-bright)]">{minToTime(s.endMin)}</strong>,{' '}
        {daysLabel(s.activeDays)}
        {s.quietOutside
          ? `. Fora disso, só críticos ${bypass ? 'passam' : 'também são calados'}.`
          : ' — restrição desligada, ela fala a qualquer hora.'}
      </p>
    </div>
  )
}

// ── seção: lembretes agendados ─────────────────────────────────────

function AnnouncementsSection() {
  const state = useVigia()
  const list = state.announcements
  const [time, setTime] = useState('09:00')
  const [text, setText] = useState('')
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const m = timeToMin(time)
    const t = text.trim()
    if (m < 0 || !t) return
    vigia.addAnnouncement({ hh: Math.floor(m / 60), mm: m % 60, text: t, days })
    setText('')
  }

  const toggleFormDay = (day: number) =>
    setDays((prev) =>
      prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day].sort((a, b) => a - b)
    )

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="w-full sm:w-28">
          <Label htmlFor="vigia-ann-time" className="text-sm font-bold text-[var(--cap-text)]">
            Horário
          </Label>
          <Input
            id="vigia-ann-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Label htmlFor="vigia-ann-text" className="text-sm font-bold text-[var(--cap-text)]">
            Mensagem
          </Label>
          <Input
            id="vigia-ann-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex.: Revisar fila de alertas"
            maxLength={140}
            className="mt-1.5"
          />
        </div>
        <Button type="submit" size="sm" className="h-9 shrink-0" disabled={!text.trim()}>
          <Plus className="h-4 w-4" aria-hidden />
          Agendar
        </Button>
      </form>
      <DayPills selected={days} onToggle={toggleFormDay} groupLabel="Novo lembrete" />
      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--cap-border-strong)] bg-[var(--cap-panel-raised)] px-3 py-4 text-center text-xs text-[var(--cap-dim)]">
          Nenhum lembrete agendado. Escolha um horário, escreva a mensagem e clique em Agendar.
        </p>
      ) : (
        <ul className="max-h-60 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {list.map((a) => {
            const t = minToTime(a.hh * 60 + a.mm)
            return (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--cap-border)] bg-white px-3 py-2"
              >
                <Badge
                  variant="outline"
                  className="shrink-0 border-[var(--cap-border-strong)] font-bold tabular-nums text-[var(--cap-bright)]"
                >
                  {t}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--cap-bright)]">
                    Às {t} ela dirá: {a.text}
                  </p>
                  <p className="text-xs text-[var(--cap-dim)]">
                    {daysLabel(a.days)}
                    {a.enabled ? '' : ' · pausado'}
                  </p>
                </div>
                <Switch
                  checked={a.enabled}
                  onCheckedChange={(v) => vigia.toggleAnnouncement(a.id, v)}
                  aria-label={`${a.enabled ? 'Pausar' : 'Ativar'} lembrete das ${t}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-[var(--cap-dim)] hover:text-red-600"
                  onClick={() => vigia.removeAnnouncement(a.id)}
                  aria-label={`Remover lembrete das ${t}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── painel e botões ────────────────────────────────────────────────

/** Painel de Transmissão da VIGIA (Dialog autônomo — controle open/onOpenChange). */
export function VigiaControlPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedulePreview = useCallback(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => {
      previewTimer.current = null
      vigia.speakNow(SAMPLE_TEXT)
    }, 650)
  }, [])

  useEffect(() => {
    return () => {
      if (previewTimer.current) {
        clearTimeout(previewTimer.current)
        previewTimer.current = null
      }
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-tut="vigia-panel"
        className="flex h-[92vh] w-[95vw] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 font-heading text-lg font-extrabold tracking-wide text-[var(--cap-bright)]">
            <Radio className="h-5 w-5 text-[#157034]" aria-hidden />
            VIGIA · Estúdio de Transmissão
          </DialogTitle>
          <DialogDescription>
            Sala de controle da narradora: o que ela fala, quando fala e como soa.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 p-4">
            <LiveSection />
            <Section title="Voz e timbre" icon={Volume2}>
              <VoiceSection onPreview={schedulePreview} />
            </Section>
            <Section title="O que ela pode falar" icon={ListChecks}>
              <CategoriesSection />
            </Section>
            <Section title="Ritmo e silêncio" icon={Gauge}>
              <RhythmSection />
            </Section>
            <Section title="Horários de atuação" icon={CalendarClock}>
              <ScheduleSection />
            </Section>
            <Section title="Lembretes agendados" icon={BellRing}>
              <AnnouncementsSection />
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/** Botão de cabeçalho com rótulo — abre o estúdio montado localmente. */
export function VigiaControlButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        data-tut="vigia-panel-open"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Abrir estúdio da VIGIA"
        title="VIGIA·STUDIO — sala de controle da narradora"
        className="flex min-h-[34px] items-center gap-1.5 rounded-full border-2 border-[var(--cap-border-strong)] bg-white px-3 py-1 text-base font-extrabold tracking-wide text-[var(--cap-dim)] transition-all hover:border-[#157034]/60 hover:text-[#157034]"
      >
        <Radio className="h-4 w-4" aria-hidden />
        VIGIA·STUDIO
      </button>
      <VigiaControlPanel open={open} onOpenChange={setOpen} />
    </>
  )
}
