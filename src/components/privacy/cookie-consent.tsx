'use client'

// CAPYBER — banner de consentimento de cookies (LGPD).
//
// Exports:
//   <CookieConsent onOpenPrivacy? />     — banner fixo (bottom sheet no mobile). Montar uma vez
//                                          no page.tsx; se já houver consentimento, renderiza null.
//   getCookieConsent()                   — lê e valida o consentimento salvo (null se ausente)
//   COOKIE_CONSENT_KEY                   — chave do localStorage ('capy_cookie_consent')
//   COOKIE_CONSENT_SNOOZE_KEY            — chave do "Decidir depois" (12h)
//   CookieConsentValue                   — tipo do JSON salvo
//
// Coordenação com a política de privacidade: por padrão o banner renderiza e controla um
// <PrivacyDialog /> interno ao clicar em "Política de Privacidade e LGPD". Se o integrador
// passar a prop `onOpenPrivacy`, ela tem precedência e o diálogo interno não é renderizado.
//
// Evento: ao salvar uma escolha dispara
//   window.dispatchEvent(new CustomEvent('capy:cookie-consent', { detail: CookieConsentValue }))

import * as React from 'react'
import { ChartColumn, ChevronDown, Clock, Cookie, Lock, Settings2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { PrivacyDialog } from '@/components/privacy/privacy-dialog'
import { cn } from '@/lib/utils'

export const COOKIE_CONSENT_KEY = 'capy_cookie_consent'
export const COOKIE_CONSENT_SNOOZE_KEY = 'capy_cookie_consent_snooze'
export const COOKIE_CONSENT_EVENT = 'capy:cookie-consent'

/** 12 horas em milissegundos (botão "Decidir depois"). */
const SNOOZE_MS = 12 * 60 * 60 * 1000

export type CookieConsentValue = {
  essential: true
  prefs: boolean
  analytics: boolean
  at: string
}

/** Lê o consentimento salvo; retorna null se ausente/corrompido (SSR-safe). */
export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const obj = parsed as Record<string, unknown>
    if (obj.essential !== true) return null
    return {
      essential: true,
      prefs: obj.prefs === true,
      analytics: obj.analytics === true,
      at: typeof obj.at === 'string' ? obj.at : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function saveCookieConsent(prefs: boolean, analytics: boolean): CookieConsentValue {
  const value: CookieConsentValue = {
    essential: true,
    prefs,
    analytics,
    at: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(value))
  } catch {
    /* quota/modo privado: segue sem persistir */
  }
  return value
}

function isSnoozed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_SNOOZE_KEY)
    const until = raw ? Number(raw) : NaN
    return Number.isFinite(until) && until > Date.now()
  } catch {
    return false
  }
}

function snoozeFor12h() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(COOKIE_CONSENT_SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
  } catch {
    /* idem */
  }
}

type Phase = 'checking' | 'hidden' | 'visible' | 'leaving'

export function CookieConsent({ onOpenPrivacy }: { onOpenPrivacy?: () => void }) {
  const [phase, setPhase] = React.useState<Phase>('checking')
  const [customizing, setCustomizing] = React.useState(false)
  const [prefs, setPrefs] = React.useState(false)
  const [analytics, setAnalytics] = React.useState(false)
  const [privacyOpen, setPrivacyOpen] = React.useState(false)
  const primaryRef = React.useRef<HTMLButtonElement | null>(null)
  const leaveTimer = React.useRef<number | null>(null)

  // decide exibição apenas no cliente (evita mismatch de hidratação)
  React.useEffect(() => {
    setPhase(getCookieConsent() || isSnoozed() ? 'hidden' : 'visible')
    return () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    }
  }, [])

  // foco entra no banner (botão primário) quando ele aparece
  React.useEffect(() => {
    if (phase === 'visible') primaryRef.current?.focus()
  }, [phase])

  const dismissWithAnimation = React.useCallback(() => {
    setPhase('leaving')
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => setPhase('hidden'), 320)
  }, [])

  const finish = React.useCallback(
    (p: boolean, a: boolean) => {
      const value = saveCookieConsent(p, a)
      try {
        window.dispatchEvent(new CustomEvent<CookieConsentValue>(COOKIE_CONSENT_EVENT, { detail: value }))
      } catch {
        /* ambiente sem CustomEvent: consentimento já está salvo */
      }
      dismissWithAnimation()
    },
    [dismissWithAnimation]
  )

  const decideLater = React.useCallback(() => {
    snoozeFor12h()
    dismissWithAnimation()
  }, [dismissWithAnimation])

  if (phase === 'checking' || phase === 'hidden') return null

  const openPrivacy = () => {
    if (onOpenPrivacy) {
      onOpenPrivacy()
      return
    }
    setPrivacyOpen(true)
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Consentimento de cookies"
        aria-describedby="capy-cookie-consent-text"
        className={cn(
          'cap-panel fixed right-4 bottom-4 left-4 z-[60] p-4 shadow-2xl transition-all duration-300 ease-out sm:max-w-md',
          phase === 'leaving' ? 'translate-y-6 opacity-0' : 'cap-fade-in'
        )}
        onKeyDown={(e) => {
          // Esc NÃO fecha: a decisão é exigida (só "Decidir depois" adia por 12h)
          if (e.key === 'Escape') e.preventDefault()
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(37,105,184,0.12)] text-[#2569b8]"
            aria-hidden="true"
          >
            <Cookie className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-[#10315c]">Cookies e privacidade</h2>
            <p id="capy-cookie-consent-text" className="mt-1 text-sm leading-relaxed text-[#3d5e86]">
              Usamos cookies essenciais de sessão (login e segurança) e, com o seu consentimento,
              preferências e estatísticas locais — nenhum dado vai para terceiros.{' '}
              <button
                type="button"
                onClick={openPrivacy}
                className="rounded font-bold text-[#2569b8] underline decoration-[#7cb6ec] underline-offset-2 transition-colors hover:text-[#10315c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2569b8]"
              >
                Política de Privacidade e LGPD
              </button>
              .
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            ref={primaryRef}
            type="button"
            onClick={() => finish(true, true)}
            className="cap-btn-steel min-h-[44px] flex-1 px-4 py-2 text-sm"
          >
            Aceitar todos
          </button>
          <button
            type="button"
            onClick={() => finish(false, false)}
            className="cap-btn-ghost min-h-[44px] flex-1 px-4 py-2 text-sm"
          >
            Só essenciais
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCustomizing((v) => !v)}
            aria-expanded={customizing}
            aria-controls="capy-cookie-customize"
            className="inline-flex min-h-[36px] items-center gap-1 rounded px-1 text-sm font-bold text-[#2569b8] transition-colors hover:text-[#10315c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2569b8]"
          >
            {customizing ? 'Ocultar opções' : 'Personalizar'}
            <ChevronDown
              className={cn('size-4 transition-transform', customizing && 'rotate-180')}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={decideLater}
            className="inline-flex min-h-[36px] items-center gap-1 rounded px-1 text-xs font-semibold text-[#52729c] underline-offset-2 transition-colors hover:text-[#33517a] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2569b8]"
          >
            <Clock className="size-3.5" aria-hidden="true" />
            Decidir depois
          </button>
        </div>

        {customizing && (
          <div
            id="capy-cookie-customize"
            className="cap-fade-in mt-3 space-y-2.5 rounded-lg border-2 border-[#c9ddf3] bg-[#f2f7ff] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Lock className="size-4 shrink-0 text-[#2569b8]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#10315c]">Essenciais</p>
                  <p className="text-xs text-[#52729c]">Sessão de login e segurança — sempre ativos</p>
                </div>
              </div>
              <Switch checked disabled aria-label="Cookies essenciais (sempre ativos)" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Settings2 className="size-4 shrink-0 text-[#2569b8]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#10315c]">Preferências</p>
                  <p className="text-xs text-[#52729c]">Lembrar voz, tema e progresso local</p>
                </div>
              </div>
              <Switch
                checked={prefs}
                onCheckedChange={(v) => setPrefs(v === true)}
                aria-label="Cookies de preferências"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <ChartColumn className="size-4 shrink-0 text-[#2569b8]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#10315c]">Estatísticas locais</p>
                  <p className="text-xs text-[#52729c]">Contadores de uso só no seu navegador</p>
                </div>
              </div>
              <Switch
                checked={analytics}
                onCheckedChange={(v) => setAnalytics(v === true)}
                aria-label="Cookies de estatísticas locais"
              />
            </div>

            <button
              type="button"
              onClick={() => finish(prefs, analytics)}
              className="cap-btn-steel min-h-[44px] w-full px-4 py-2 text-sm"
            >
              Salvar escolha
            </button>
          </div>
        )}
      </div>

      {/* diálogo interno: só renderizado quando ninguém passou onOpenPrivacy */}
      {onOpenPrivacy ? null : <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />}
    </>
  )
}

export default CookieConsent
