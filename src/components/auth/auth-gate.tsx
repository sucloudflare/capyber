'use client'

// CAPYBER — AuthGate: portal de entrada em tela cheia (login, cadastro, MFA,
// conta demo e modo visitante) com visual enterprise estilo Microsoft/Okta.

import * as React from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  Gauge,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Radar,
  Scale,
  ShieldCheck,
  UserPlus,
  Wand2,
  X,
  Zap,
} from 'lucide-react'

import { CapShield, GateSpiral } from '@/components/art'
import type { SafeUserLike } from './user-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { checkPassword, passwordRequirements, suggestPassword } from '@/lib/password-policy'
import { cn } from '@/lib/utils'

/* ─────────── API pública ─────────── */

export interface AuthGateProps {
  /**
   * Chamado quando o fluxo de autenticação conclui:
   * - com o usuário autenticado (login, cadastro, demo, sessão restaurada);
   * - com `null` quando o operador escolhe "Explorar como visitante".
   */
  onSuccess: (user: SafeUserLike | null) => void
}

/* ─────────── helpers ─────────── */

const OFFLINE_MSG =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function postJSON(
  url: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { ok: res.ok, status: res.status, data }
}

function asUser(data: Record<string, unknown>): SafeUserLike | null {
  const u = data.user
  if (u && typeof u === 'object' && !Array.isArray(u)) {
    const o = u as Record<string, unknown>
    if (typeof o.id === 'string' && typeof o.email === 'string') {
      const email = o.email
      return {
        id: o.id,
        email,
        name: typeof o.name === 'string' && o.name ? o.name : email.split('@')[0] || 'Operador',
        mfaEnabled: o.mfaEnabled === true,
        createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
        lastLoginAt: typeof o.lastLoginAt === 'string' ? o.lastLoginAt : null,
        isDemo: o.isDemo === true || email.endsWith('@capyber.demo'),
      }
    }
  }
  return null
}

function apiError(data: Record<string, unknown>, fallback: string): string {
  return typeof data.error === 'string' && data.error ? data.error : fallback
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* cai no fallback */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/* ─────────── dados de branding ─────────── */

const FEATURES = [
  { icon: Fingerprint, label: 'MFA TOTP', desc: 'Segundo fator de 6 dígitos a cada login' },
  { icon: KeyRound, label: 'bcrypt · 12 rounds', desc: 'Senhas protegidas com hash lento e salt' },
  { icon: Radar, label: 'Sessões monitoradas', desc: 'Dispositivos listados e revogáveis a qualquer momento' },
  { icon: Gauge, label: 'Rate-limit anti brute-force', desc: 'Bloqueio automático após tentativas excessivas' },
  { icon: Scale, label: 'Conformidade LGPD', desc: 'Dados pessoais tratados conforme a Lei nº 13.709' },
] as const

const METER_COLORS = [
  'var(--cap-danger)',
  'var(--cap-danger)',
  'var(--cap-orange)',
  'var(--cap-yellow)',
  'var(--cap-glow)',
]

type TabKey = 'entrar' | 'criar'

/* ─────────── componente ─────────── */

export function AuthGate({ onSuccess }: AuthGateProps) {
  const { toast } = useToast()

  const onSuccessRef = React.useRef(onSuccess)
  React.useEffect(() => {
    onSuccessRef.current = onSuccess
  })

  const [phase, setPhase] = React.useState<'checking' | 'form' | 'mfa'>('checking')
  const [tab, setTab] = React.useState<TabKey>('entrar')
  const [offline, setOffline] = React.useState(false)
  const [globalError, setGlobalError] = React.useState<string | null>(null)

  /* entrar */
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPw, setShowPw] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [loginError, setLoginError] = React.useState<string | null>(null)

  /* MFA */
  const [code, setCode] = React.useState('')
  const [mfaBusy, setMfaBusy] = React.useState(false)
  const [mfaError, setMfaError] = React.useState<string | null>(null)
  const lastTriedCodeRef = React.useRef('')
  const mfaBusyRef = React.useRef(false)
  mfaBusyRef.current = mfaBusy

  /* criar conta */
  const [name, setName] = React.useState('')
  const [regEmail, setRegEmail] = React.useState('')
  const [pw, setPw] = React.useState('')
  const [confirmPw, setConfirmPw] = React.useState('')
  const [showRegPw, setShowRegPw] = React.useState(false)
  const [regBusy, setRegBusy] = React.useState(false)
  const [regError, setRegError] = React.useState<string | null>(null)

  /* demo */
  const [demoBusy, setDemoBusy] = React.useState(false)

  /* ── restauração de sessão ── */
  React.useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!alive) return
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as { user?: SafeUserLike | null }
          if (data.user) {
            await sleep(650) // deixa o splash "Restaurando sessão…" ser percebido
            if (!alive) return
            onSuccessRef.current(data.user)
            return
          }
        }
        setPhase('form')
      } catch {
        if (!alive) return
        setOffline(true)
        setPhase('form')
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  /* ── entrar ── */
  async function submitLogin(e?: React.FormEvent) {
    e?.preventDefault()
    if (busy) return
    setLoginError(null)
    setGlobalError(null)
    if (!email.trim() || !password) {
      setLoginError('Informe e-mail e senha.')
      return
    }
    setBusy(true)
    try {
      const { ok, status, data } = await postJSON('/api/auth/login', {
        email: email.trim(),
        password,
      })
      if (data.mfaRequired === true) {
        setCode('')
        lastTriedCodeRef.current = ''
        setPhase('mfa')
        return
      }
      if (!ok) {
        setLoginError(apiError(data, status === 429 ? 'Muitas tentativas. Aguarde e tente novamente.' : 'E-mail ou senha incorretos.'))
        return
      }
      const u = asUser(data)
      if (u) {
        onSuccessRef.current(u)
        return
      }
      setLoginError('Resposta inesperada do servidor. Tente novamente.')
    } catch {
      setLoginError(OFFLINE_MSG)
    } finally {
      setBusy(false)
    }
  }

  /* ── MFA ── */
  async function submitMfa() {
    if (mfaBusy) return
    if (code.length !== 6) {
      setMfaError('Digite os 6 dígitos do código.')
      return
    }
    setMfaError(null)
    setMfaBusy(true)
    try {
      const { ok, data } = await postJSON('/api/auth/login', {
        email: email.trim(),
        password,
        code,
      })
      if (data.mfaRequired === true && !ok) {
        setMfaError(apiError(data, 'Código MFA inválido ou expirado.'))
        return
      }
      if (!ok) {
        setPhase('form')
        setLoginError(apiError(data, 'Não foi possível entrar.'))
        return
      }
      const u = asUser(data)
      if (u) {
        onSuccessRef.current(u)
        return
      }
      setMfaError('Resposta inesperada do servidor. Tente novamente.')
    } catch {
      setMfaError(OFFLINE_MSG)
    } finally {
      setMfaBusy(false)
    }
  }

  // envio automático quando o código atinge 6 dígitos
  React.useEffect(() => {
    if (phase !== 'mfa') return
    if (code.length !== 6) {
      lastTriedCodeRef.current = ''
      return
    }
    if (lastTriedCodeRef.current === code || mfaBusyRef.current) return
    lastTriedCodeRef.current = code
    void submitMfa()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, phase])

  function backToLogin() {
    setPhase('form')
    setCode('')
    setMfaError(null)
  }

  /* ── criar conta ── */
  const check = checkPassword(pw)
  const reqs = passwordRequirements(pw)
  const filled = pw.length === 0 ? 0 : Math.max(1, check.score)
  const mismatch = confirmPw.length > 0 && confirmPw !== pw

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault()
    if (regBusy) return
    setRegError(null)
    setGlobalError(null)
    if (name.trim().length < 2) {
      setRegError('Informe seu nome (2+ letras).')
      return
    }
    if (!EMAIL_RE.test(regEmail.trim())) {
      setRegError('Informe um e-mail válido.')
      return
    }
    if (!check.ok) {
      setRegError('A senha não atende à política forte. Revise os requisitos abaixo.')
      return
    }
    if (!confirmPw) {
      setRegError('Confirme a senha no último campo.')
      return
    }
    if (mismatch) {
      setRegError('As senhas não coincidem.')
      return
    }
    setRegBusy(true)
    try {
      const { ok, data } = await postJSON('/api/auth/register', {
        name: name.trim(),
        email: regEmail.trim(),
        password: pw,
      })
      if (!ok) {
        const issues = Array.isArray(data.issues)
          ? (data.issues as unknown[]).filter((i): i is string => typeof i === 'string')
          : []
        setRegError([apiError(data, 'Não foi possível criar a conta.'), ...issues].join(' '))
        return
      }
      const u = asUser(data)
      if (u) {
        toast({ title: 'Conta criada', description: 'Bem-vindo(a) ao CAPYBER SOC!' })
        onSuccessRef.current(u)
        return
      }
      setRegError('Resposta inesperada do servidor. Tente novamente.')
    } catch {
      setRegError(OFFLINE_MSG)
    } finally {
      setRegBusy(false)
    }
  }

  function generateStrong() {
    const strong = suggestPassword(16)
    setPw(strong)
    setConfirmPw(strong)
    setRegError(null)
    void copyText(strong).then((copied) => {
      toast({
        title: 'Senha forte gerada',
        description: copied
          ? 'Copiada para a área de transferência — guarde em um gerenciador de senhas.'
          : 'Não foi possível copiar automaticamente. Copie antes de enviar o formulário.',
      })
    })
  }

  /* ── demo ── */
  async function enterDemo() {
    if (demoBusy) return
    setDemoBusy(true)
    setGlobalError(null)
    try {
      const { ok, data } = await postJSON('/api/auth/demo', {})
      if (!ok) {
        setGlobalError(apiError(data, 'Não foi possível iniciar a conta demo.'))
        return
      }
      const u = asUser(data)
      if (u) {
        onSuccessRef.current(u)
        return
      }
      setGlobalError('Resposta inesperada do servidor. Tente novamente.')
    } catch {
      setGlobalError(OFFLINE_MSG)
    } finally {
      setDemoBusy(false)
    }
  }

  /* ── splash de restauração ── */
  if (phase === 'checking') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gradient-to-br from-[#10315c] via-[#11345f] to-[#123a6b] px-6 text-white">
        <GateSpiral size={88} spin />
        <div className="text-center">
          <p className="font-display text-lg font-bold tracking-wide">Restaurando sessão…</p>
          <p className="cap-mono mt-1 text-[10px] uppercase tracking-[0.28em] text-[#9cc4ef]">
            CAPYBER SOC · verificação de credenciais
          </p>
        </div>
      </div>
    )
  }

  /* ── portal completo ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen flex-col bg-[var(--cap-bg-solid)] lg:flex-row"
    >
      {/* header compacto (mobile) */}
      <header className="cap-aurora relative flex items-center gap-3 overflow-hidden border-b-2 border-[#0b2749] bg-gradient-to-r from-[#10315c] to-[#123a6b] px-4 py-3 lg:hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,182,236,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(124,182,236,0.1) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="relative">
          <CapShield size={36} />
        </motion.div>
        <div className="relative min-w-0">
          <p className="font-display text-base font-extrabold italic leading-tight tracking-wide text-white">
            CAPYBER <span className="text-[#ffb24d]">SOC</span>
          </p>
          <p className="cap-mono truncate text-[9px] uppercase tracking-[0.22em] text-[#9cc4ef]">
            Centro de operações de segurança
          </p>
        </div>
        <span className="relative ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-[#3d6aa5]/70 px-2.5 py-1 text-[10px] font-bold text-[#bfe0ff]">
          <span className="size-1.5 rounded-full bg-[#2fe06d] shadow-[0_0_6px_#2fe06d]" />
          online
        </span>
      </header>

      <div className="flex flex-1">
        {/* painel de branding (desktop) */}
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="cap-aurora relative hidden w-[44%] max-w-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#10315c] via-[#11345f] to-[#123a6b] p-10 text-white lg:flex xl:p-14"
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(124,182,236,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(124,182,236,0.09) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          <div aria-hidden className="absolute -left-24 top-1/3 size-[420px] rounded-full bg-[#2f7fd1]/20 blur-[110px]" />
          <div aria-hidden className="absolute -right-16 bottom-[-90px] size-[330px] rounded-full bg-[#f5920b]/15 blur-[100px]" />

          <motion.div
            className="relative flex items-center gap-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
          >
            <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
              <CapShield size={58} />
            </motion.div>
            <div>
              <p className="font-display text-2xl font-extrabold italic tracking-wide">
                CAPYBER <span className="text-[#ffb24d]">SOC</span>
              </p>
              <p className="cap-mono text-[10px] uppercase tracking-[0.28em] text-[#9cc4ef]">
                Centro de operações de segurança
              </p>
            </div>
          </motion.div>

          <div className="relative max-w-[440px]">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-white xl:text-[32px]"
            >
              Proteção contínua contra ameaças digitais
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.35 }}
              className="mt-3 text-[15px] leading-relaxed text-[#c9def6]"
            >
              Monitoramento, resposta a incidentes e trilhas de conscientização — tudo em um único painel
              operado 24/7.
            </motion.p>
            <ul className="mt-7 space-y-3">
              {FEATURES.map((f, i) => (
                <motion.li
                  key={f.label}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.3 }}
                  className="flex items-center gap-3"
                >
                  <span className="cap-skew-plate flex size-10 shrink-0 items-center justify-center">
                    <f.icon className="size-5 text-[var(--cap-cyan)]" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{f.label}</p>
                    <p className="text-xs text-[#a9c8ec]">{f.desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className="cap-mono relative text-[10px] uppercase tracking-[0.2em] text-[#7fa6d4]"
          >
            LGPD · criptografia em trânsito · auditoria completa
          </motion.p>
        </motion.aside>

        {/* área de formulários */}
        <main className="flex flex-1 items-center justify-center bg-[var(--cap-bg-solid)] px-4 py-10 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-[460px]"
          >
            <div className="cap-panel p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <CapShield size={46} />
                <div>
                  <p className="cap-logo text-xl leading-none">CAPYBER</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--cap-dim)]">
                    Acesse o centro de operações
                  </p>
                </div>
              </div>

              {offline && (
                <Alert role="alert" className="mb-4 border-[var(--cap-orange)]/50">
                  <X className="size-4" />
                  <AlertDescription>
                    Sem conexão com o servidor. Verifique sua internet — os formulários continuarão
                    disponíveis para nova tentativa.
                  </AlertDescription>
                </Alert>
              )}
              {globalError && (
                <Alert role="alert" variant="destructive" className="mb-4 border-[var(--cap-danger)]/40">
                  <X className="size-4" />
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              )}

              <Tabs
                value={tab}
                onValueChange={(v) => {
                  setTab(v as TabKey)
                  setGlobalError(null)
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="entrar">Entrar</TabsTrigger>
                  <TabsTrigger value="criar">Criar conta</TabsTrigger>
                </TabsList>

                <TabsContent value="entrar" className="mt-5">
                  <AnimatePresence mode="wait" initial={false}>
                    {phase === 'mfa' ? (
                      <motion.div
                        key="mfa"
                        initial={{ opacity: 0, x: 26 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -26 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="cap-skew-plate flex size-10 shrink-0 items-center justify-center">
                            <ShieldCheck className="size-5 text-[var(--cap-cyan)]" />
                          </span>
                          <div>
                            <p className="cap-heading text-base">Verificação em duas etapas</p>
                            <p className="truncate text-xs text-[var(--cap-dim)]">
                              Código do app autenticador para {email || 'sua conta'}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-center py-1">
                          <InputOTP
                            maxLength={6}
                            value={code}
                            onChange={setCode}
                            disabled={mfaBusy}
                            autoFocus
                            containerClassName="gap-2"
                          >
                            <InputOTPGroup>
                              {[0, 1, 2].map((i) => (
                                <InputOTPSlot
                                  key={i}
                                  index={i}
                                  className="h-11 w-10 rounded-md border-[var(--cap-border-strong)] text-lg"
                                />
                              ))}
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                              {[3, 4, 5].map((i) => (
                                <InputOTPSlot
                                  key={i}
                                  index={i}
                                  className="h-11 w-10 rounded-md border-[var(--cap-border-strong)] text-lg"
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>

                        {mfaError && (
                          <Alert role="alert" variant="destructive" className="border-[var(--cap-danger)]/40">
                            <X className="size-4" />
                            <AlertDescription>{mfaError}</AlertDescription>
                          </Alert>
                        )}

                        <Button
                          type="button"
                          className="cap-btn-primary w-full"
                          onClick={() => void submitMfa()}
                          disabled={mfaBusy || code.length !== 6}
                        >
                          {mfaBusy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                          {mfaBusy ? 'Verificando…' : 'Verificar e entrar'}
                        </Button>

                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={backToLogin}
                            className="flex items-center gap-1 text-xs font-semibold text-[var(--cap-dim)] transition hover:text-[var(--cap-cyan)]"
                          >
                            <ArrowLeft className="size-3.5" /> Voltar
                          </button>
                          <span className="cap-mono text-[10px] text-[var(--cap-faint)]">
                            Não recebeu? Aguarde o próximo ciclo de 30s
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="login"
                        initial={{ opacity: 0, x: -26 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 26 }}
                        transition={{ duration: 0.25 }}
                        onSubmit={(e) => void submitLogin(e)}
                        className="space-y-4"
                        noValidate
                      >
                        <div className="space-y-1.5">
                          <Label htmlFor="login-email" className="text-[var(--cap-text)]">
                            E-mail
                          </Label>
                          <Input
                            id="login-email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="operador@empresa.com"
                            className="cap-input"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value)
                              if (loginError) setLoginError(null)
                            }}
                            disabled={busy}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="login-pw" className="text-[var(--cap-text)]">
                            Senha
                          </Label>
                          <div className="relative">
                            <Input
                              id="login-pw"
                              type={showPw ? 'text' : 'password'}
                              autoComplete="current-password"
                              placeholder="Sua senha"
                              className="cap-input pr-11"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value)
                                if (loginError) setLoginError(null)
                              }}
                              disabled={busy}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((s) => !s)}
                              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                              title={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--cap-dim)] transition hover:bg-[var(--cap-panel-raised)] hover:text-[var(--cap-cyan)]"
                            >
                              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </div>

                        {loginError && (
                          <Alert role="alert" variant="destructive" className="border-[var(--cap-danger)]/40">
                            <X className="size-4" />
                            <AlertDescription>{loginError}</AlertDescription>
                          </Alert>
                        )}

                        <Button type="submit" className="cap-btn-primary w-full" disabled={busy}>
                          {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
                          {busy ? 'Verificando…' : 'Entrar'}
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="criar" className="mt-5">
                  <form onSubmit={(e) => void submitRegister(e)} className="space-y-3.5" noValidate>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name" className="text-[var(--cap-text)]">
                        Nome
                      </Label>
                      <Input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        maxLength={60}
                        placeholder="Seu nome completo"
                        className="cap-input"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          if (regError) setRegError(null)
                        }}
                        disabled={regBusy}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email" className="text-[var(--cap-text)]">
                        E-mail
                      </Label>
                      <Input
                        id="reg-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="operador@empresa.com"
                        className="cap-input"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value)
                          if (regError) setRegError(null)
                        }}
                        disabled={regBusy}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="reg-pw" className="text-[var(--cap-text)]">
                          Senha
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-[11px] font-bold text-[var(--cap-cyan)] hover:text-[var(--cap-cyan)]"
                          onClick={generateStrong}
                          disabled={regBusy}
                        >
                          <Wand2 className="size-3.5" />
                          Gerar senha forte
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="reg-pw"
                          type={showRegPw ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Mínimo 12 caracteres"
                          className="cap-input pr-11"
                          value={pw}
                          onChange={(e) => {
                            setPw(e.target.value)
                            if (regError) setRegError(null)
                          }}
                          disabled={regBusy}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPw((s) => !s)}
                          aria-label={showRegPw ? 'Ocultar senha' : 'Mostrar senha'}
                          title={showRegPw ? 'Ocultar senha' : 'Mostrar senha'}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--cap-dim)] transition hover:bg-[var(--cap-panel-raised)] hover:text-[var(--cap-cyan)]"
                        >
                          {showRegPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>

                      {/* medidor de força */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex flex-1 gap-1.5">
                          {[0, 1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 flex-1 rounded-full transition-colors duration-200"
                              style={{
                                background:
                                  pw.length > 0 && i < filled ? METER_COLORS[check.score] : 'var(--cap-border)',
                              }}
                            />
                          ))}
                        </div>
                        <span
                          className="cap-mono text-[10px] font-bold tracking-wider"
                          style={{ color: pw.length > 0 ? METER_COLORS[check.score] : 'var(--cap-faint)' }}
                        >
                          {pw.length > 0 ? check.label : 'POLÍTICA FORTE'}
                        </span>
                      </div>

                      {/* checklist de requisitos */}
                      <ul className="grid gap-x-4 gap-y-0.5 pt-1 sm:grid-cols-2">
                        {reqs.map((r) => (
                          <li
                            key={r.id}
                            className={cn(
                              'flex items-center gap-1.5 text-[11px]',
                              r.pass ? 'text-[#166b34]' : 'text-[var(--cap-faint)]',
                            )}
                          >
                            {r.pass ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
                            {r.label}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm" className="text-[var(--cap-text)]">
                        Confirmar senha
                      </Label>
                      <Input
                        id="reg-confirm"
                        type={showRegPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        className="cap-input"
                        value={confirmPw}
                        onChange={(e) => {
                          setConfirmPw(e.target.value)
                          if (regError) setRegError(null)
                        }}
                        disabled={regBusy}
                        required
                      />
                      {mismatch && (
                        <p role="alert" className="text-[11px] font-semibold text-[var(--cap-danger)]">
                          As senhas não coincidem.
                        </p>
                      )}
                      {!mismatch && confirmPw.length > 0 && confirmPw === pw && (
                        <p className="flex items-center gap-1 text-[11px] font-semibold text-[#166b34]">
                          <Check className="size-3" /> As senhas coincidem.
                        </p>
                      )}
                    </div>

                    {regError && (
                      <Alert role="alert" variant="destructive" className="border-[var(--cap-danger)]/40">
                        <X className="size-4" />
                        <AlertDescription>{regError}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="cap-btn-primary w-full" disabled={regBusy || mismatch}>
                      {regBusy ? <Loader2 className="animate-spin" /> : <UserPlus />}
                      {regBusy ? 'Criando conta…' : 'Criar conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>

            {/* conta demo + visitante */}
            <div className="mt-5 text-center">
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-[var(--cap-border)] bg-white/80 font-bold text-[var(--cap-bright)] hover:border-[var(--cap-cyan-soft)] hover:bg-white"
                onClick={() => void enterDemo()}
                disabled={demoBusy}
              >
                {demoBusy ? <Loader2 className="animate-spin" /> : <Zap className="text-[var(--cap-orange)]" />}
                {demoBusy ? 'Preparando conta demo…' : 'Acessar com conta demo'}
              </Button>
              <button
                type="button"
                onClick={() => onSuccessRef.current(null)}
                className="mt-2.5 text-xs font-semibold text-[var(--cap-dim)] underline-offset-4 transition hover:text-[var(--cap-cyan)] hover:underline"
              >
                Explorar como visitante
              </button>
            </div>

            {/* faixa de segurança */}
            <p className="cap-mono mt-6 flex items-center justify-center gap-1.5 text-center text-[10px] uppercase tracking-wide text-[var(--cap-faint)]">
              <Lock className="size-3 shrink-0" />
              Conexão protegida · Senhas com bcrypt · Sessões revogáveis
            </p>
          </motion.div>
        </main>
      </div>
    </motion.div>
  )
}
