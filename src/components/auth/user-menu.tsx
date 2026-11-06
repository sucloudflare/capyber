'use client'

// CAPYBER — menu do operador autenticado (header): avatar, acesso rápido à
// Central de segurança (senha, MFA, sessões, conta) e encerramento de sessão.

import * as React from 'react'

import {
  CalendarClock,
  ChevronDown,
  Check,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  checkPassword,
  passwordRequirements,
} from '@/lib/password-policy'
import { cn } from '@/lib/utils'

/* ─────────── tipos públicos ─────────── */

export interface SafeUserLike {
  id: string
  email: string
  name: string
  mfaEnabled: boolean
  createdAt: string
  lastLoginAt: string | null
  isDemo: boolean
}

export interface UserMenuProps {
  user: SafeUserLike
  onLogout: () => void
  onUserUpdated: (u: SafeUserLike) => void
}

type SecTab = 'senha' | 'mfa' | 'sessoes' | 'conta'

interface SessionRow {
  id: string
  createdAt: string
  expiresAt: string
  userAgent: string
  ip: string
  current: boolean
}

/* ─────────── helpers ─────────── */

async function reqJSON(
  method: 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    return { ok: res.ok, status: res.status, data }
  } catch {
    throw new Error('__offline__')
  }
}

function friendlyError(e: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (e instanceof Error && e.message === '__offline__') {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
  }
  if (e instanceof Error && e.message && e.message !== '__offline__') return e.message
  return fallback
}

function str(data: Record<string, unknown>, key: string): string | null {
  const v = data[key]
  return typeof v === 'string' && v.length > 0 ? v : null
}

function initialsOf(user: { name: string; email: string }): string {
  const parts = user.name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  if (parts.length === 1 && parts[0] && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase()
  return (user.email[0] ?? '?').toUpperCase()
}

function describeUA(ua: string): { device: 'desktop' | 'mobile'; label: string } {
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  const os = /Windows/i.test(ua)
    ? 'Windows'
    : /Android/i.test(ua)
      ? 'Android'
      : /iPhone|iPad|iPod|iOS/i.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Sistema desconhecido'
  const browser = /Edg\//i.test(ua)
    ? 'Edge'
    : /OPR\//i.test(ua)
      ? 'Opera'
      : /SamsungBrowser/i.test(ua)
        ? 'Samsung Internet'
        : /Chrome\//i.test(ua)
          ? 'Chrome'
          : /Firefox\//i.test(ua)
            ? 'Firefox'
            : /Safari\//i.test(ua)
              ? 'Safari'
              : 'Navegador'
  return { device: mobile ? 'mobile' : 'desktop', label: `${browser} · ${os}` }
}

const fmtDate = (iso: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

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

/* ─────────── componente principal ─────────── */

export function UserMenu({ user, onLogout, onUserUpdated }: UserMenuProps) {
  const { toast } = useToast()
  const [centerOpen, setCenterOpen] = React.useState(false)
  const [secTab, setSecTab] = React.useState<SecTab>('senha')
  const [loggingOut, setLoggingOut] = React.useState(false)

  const initials = initialsOf(user)

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      const { ok, data } = await reqJSON('POST', '/api/auth/logout')
      if (!ok) {
        toast({
          title: 'Não foi possível sair',
          description: str(data, 'error') ?? 'Tente novamente em instantes.',
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Sessão encerrada', description: 'Até logo, operador.' })
      onLogout()
    } catch (e) {
      toast({ title: 'Falha de conexão', description: friendlyError(e), variant: 'destructive' })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Menu do operador ${user.name}`}
            className="group flex items-center gap-2.5 rounded-xl border-2 border-[var(--cap-border)] bg-white/85 py-1.5 pl-1.5 pr-2.5 text-left shadow-sm transition hover:border-[var(--cap-cyan-soft)] hover:bg-white"
          >
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#2f7fd1] to-[#1d5fae] font-display text-sm font-extrabold text-white shadow-inner ring-2 ring-white"
            >
              {initials}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-[160px] truncate text-sm font-bold leading-tight text-[var(--cap-bright)]">
                {user.name}
              </span>
              <span className="cap-mono block max-w-[160px] truncate text-[10px] leading-tight text-[var(--cap-dim)]">
                {user.email}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-[var(--cap-dim)] transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 border-2 border-[var(--cap-border)] shadow-lg">
          <DropdownMenuLabel>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-b from-[#2f7fd1] to-[#1d5fae] font-display text-xs font-extrabold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[var(--cap-bright)]">{user.name}</div>
                <div className="cap-mono truncate text-[10px] text-[var(--cap-dim)]">{user.email}</div>
              </div>
            </div>
            {user.isDemo && <span className="cap-sev cap-sev-media mt-2 inline-block">CONTA DEMO</span>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCenterOpen(true)}>
            <ShieldCheck className="text-[var(--cap-cyan)]" />
            Central de segurança
            <Badge
              variant="outline"
              className={cn(
                'cap-mono ml-auto text-[9px] tracking-wider',
                user.mfaEnabled
                  ? 'border-[var(--cap-glow)]/50 bg-[var(--cap-glow)]/10 text-[#166b34]'
                  : 'border-[var(--cap-orange)]/50 bg-[var(--cap-orange)]/10 text-[var(--cap-warn)]',
              )}
            >
              MFA {user.mfaEnabled ? 'ON' : 'OFF'}
            </Badge>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={loggingOut} onSelect={() => void handleLogout()}>
            {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
            {loggingOut ? 'Encerrando…' : 'Sair'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={centerOpen}
        onOpenChange={(o) => {
          setCenterOpen(o)
          if (!o) setSecTab('senha')
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-2 border-[var(--cap-border-strong)] bg-[var(--cap-panel)] sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--cap-bright)]">
              <ShieldCheck className="size-5 text-[var(--cap-cyan)]" />
              Central de segurança
            </DialogTitle>
            <DialogDescription>
              Gerencie sua senha, o segundo fator (MFA), as sessões ativas e os dados da conta.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={secTab} onValueChange={(v) => setSecTab(v as SecTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="senha">Senha</TabsTrigger>
              <TabsTrigger value="mfa">MFA</TabsTrigger>
              <TabsTrigger value="sessoes">Sessões</TabsTrigger>
              <TabsTrigger value="conta">Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="senha" className="mt-4">
              <PasswordTab />
            </TabsContent>
            <TabsContent value="mfa" className="mt-4">
              <MfaTab user={user} onUpdated={onUserUpdated} />
            </TabsContent>
            <TabsContent value="sessoes" className="mt-4">
              <SessionsTab active={centerOpen && secTab === 'sessoes'} />
            </TabsContent>
            <TabsContent value="conta" className="mt-4">
              <AccountTab user={user} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ─────────── aba: senha ─────────── */

function PasswordTab() {
  const { toast } = useToast()
  const [current, setCurrent] = React.useState('')
  const [next, setNext] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const check = checkPassword(next)
  const reqs = passwordRequirements(next)
  const mismatch = confirm.length > 0 && confirm !== next

  const meterColors = [
    'var(--cap-danger)',
    'var(--cap-danger)',
    'var(--cap-orange)',
    'var(--cap-yellow)',
    'var(--cap-glow)',
  ]
  const filled = next.length === 0 ? 0 : Math.max(1, check.score)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!check.ok) {
      setError('A nova senha não atende à política forte. Revise os requisitos abaixo.')
      return
    }
    if (!confirm) {
      setError('Confirme a nova senha.')
      return
    }
    if (mismatch) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    try {
      const { ok, data } = await reqJSON('POST', '/api/auth/password', { current, next })
      if (!ok) {
        const issues = Array.isArray(data.issues)
          ? (data.issues as unknown[]).filter((i): i is string => typeof i === 'string')
          : []
        setError([str(data, 'error') ?? 'Não foi possível alterar a senha.', ...issues].join(' '))
        return
      }
      toast({
        title: 'Senha alterada com sucesso',
        description: 'As outras sessões ativas foram revogadas por segurança.',
      })
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="pw-current" className="text-[var(--cap-text)]">
          Senha atual
        </Label>
        <Input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          className="cap-input"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          disabled={busy}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pw-next" className="text-[var(--cap-text)]">
          Nova senha
        </Label>
        <div className="relative">
          <Input
            id="pw-next"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            className="cap-input pr-11"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={busy}
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--cap-dim)] transition hover:bg-[var(--cap-panel-raised)] hover:text-[var(--cap-cyan)]"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {next.length > 0 && (
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-colors duration-200"
                    style={{ background: i < filled ? meterColors[check.score] : 'var(--cap-border)' }}
                  />
                ))}
              </div>
              <span
                className="cap-mono text-[10px] font-bold tracking-wider"
                style={{ color: meterColors[check.score] }}
              >
                {check.label}
              </span>
            </div>
            <ul className="mt-2 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
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
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pw-confirm" className="text-[var(--cap-text)]">
          Confirmar nova senha
        </Label>
        <Input
          id="pw-confirm"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          className="cap-input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={busy}
          required
        />
        {mismatch && <p className="text-[11px] font-semibold text-[var(--cap-danger)]">As senhas não coincidem.</p>}
        {!mismatch && confirm.length > 0 && confirm === next && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-[#166b34]">
            <Check className="size-3" /> As senhas coincidem.
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="border-[var(--cap-danger)]/40">
          <X className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="cap-btn-primary w-full" disabled={busy || mismatch}>
        {busy ? <Loader2 className="animate-spin" /> : <KeyRound />}
        {busy ? 'Alterando…' : 'Alterar senha'}
      </Button>
    </form>
  )
}

/* ─────────── aba: MFA ─────────── */

interface MfaSetup {
  secret: string
  uri: string
  qr: string
}

function MfaTab({ user, onUpdated }: { user: SafeUserLike; onUpdated: (u: SafeUserLike) => void }) {
  const { toast } = useToast()
  const [setup, setSetup] = React.useState<MfaSetup | null>(null)
  const [setupBusy, setSetupBusy] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [enableBusy, setEnableBusy] = React.useState(false)
  const [disPassword, setDisPassword] = React.useState('')
  const [disCode, setDisCode] = React.useState('')
  const [showDisPw, setShowDisPw] = React.useState(false)
  const [disableBusy, setDisableBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function startSetup() {
    setError(null)
    setSetupBusy(true)
    try {
      const { ok, data } = await reqJSON('POST', '/api/auth/mfa')
      if (!ok) {
        setError(str(data, 'error') ?? 'Não foi possível iniciar a ativação do MFA.')
        return
      }
      setSetup({ secret: str(data, 'secret') ?? '', uri: str(data, 'uri') ?? '', qr: str(data, 'qr') ?? '' })
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setSetupBusy(false)
    }
  }

  async function confirmEnable() {
    if (code.length !== 6) {
      setError('Digite os 6 dígitos do app autenticador.')
      return
    }
    setError(null)
    setEnableBusy(true)
    try {
      const { ok, data } = await reqJSON('PUT', '/api/auth/mfa', { code })
      if (!ok) {
        setError(str(data, 'error') ?? 'Código inválido. Tente o próximo ciclo do app.')
        return
      }
      toast({ title: 'MFA ativado', description: 'Agora o login exige o código do app autenticador.' })
      onUpdated({ ...user, mfaEnabled: true })
      setSetup(null)
      setCode('')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setEnableBusy(false)
    }
  }

  async function disable() {
    setError(null)
    if (!disPassword) {
      setError('Informe sua senha para desativar o MFA.')
      return
    }
    if (disCode.length !== 6) {
      setError('Informe o código atual do app autenticador.')
      return
    }
    setDisableBusy(true)
    try {
      const { ok, data } = await reqJSON('DELETE', '/api/auth/mfa', { password: disPassword, code: disCode })
      if (!ok) {
        setError(str(data, 'error') ?? 'Não foi possível desativar o MFA.')
        return
      }
      toast({ title: 'MFA desativado', description: 'Recomendamos reativar o segundo fator em breve.' })
      onUpdated({ ...user, mfaEnabled: false })
      setDisPassword('')
      setDisCode('')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setDisableBusy(false)
    }
  }

  async function copySecret() {
    if (!setup) return
    const ok = await copyText(setup.secret)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } else {
      toast({
        title: 'Não foi possível copiar',
        description: 'Selecione e copie a chave manualmente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="border-[var(--cap-danger)]/40">
          <X className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {user.mfaEnabled ? (
        <>
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-[var(--cap-glow)]/40 bg-[var(--cap-glow)]/10 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#166b34]">
              <Fingerprint className="size-5" />
              Autenticação em duas etapas
            </div>
            <Badge className="border-transparent bg-[var(--cap-glow)] text-white">ATIVO</Badge>
          </div>
          <p className="text-sm text-[var(--cap-text)]">
            Seu acesso exige um código TOTP de 6 dígitos a cada login. Para desativar, confirme com a senha e o
            código atual do app.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void disable()
            }}
            className="space-y-3"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="mfa-dis-pw" className="text-[var(--cap-text)]">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="mfa-dis-pw"
                  type={showDisPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="cap-input pr-11"
                  value={disPassword}
                  onChange={(e) => setDisPassword(e.target.value)}
                  disabled={disableBusy}
                />
                <button
                  type="button"
                  onClick={() => setShowDisPw((s) => !s)}
                  aria-label={showDisPw ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--cap-dim)] transition hover:bg-[var(--cap-panel-raised)] hover:text-[var(--cap-cyan)]"
                >
                  {showDisPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--cap-text)]">Código do app (6 dígitos)</Label>
              <InputOTP
                maxLength={6}
                value={disCode}
                onChange={setDisCode}
                disabled={disableBusy}
                containerClassName="justify-start"
              >
                <InputOTPGroup>
                  {[0, 1, 2].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-10 w-10 border-[var(--cap-border-strong)]" />
                  ))}
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  {[3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-10 w-10 border-[var(--cap-border-strong)]" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" variant="destructive" className="w-full" disabled={disableBusy}>
              {disableBusy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
              {disableBusy ? 'Desativando…' : 'Desativar MFA'}
            </Button>
          </form>
        </>
      ) : setup ? (
        <>
          <p className="text-sm text-[var(--cap-text)]">
            <strong className="text-[var(--cap-bright)]">Passo 1:</strong> abra o app autenticador (Google
            Authenticator, Authy, Aegis…) e escaneie o QR abaixo.
          </p>
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-[var(--cap-border)] bg-white p-4">
            <img
              src={setup.qr}
              alt="QR Code para ativar o MFA no app autenticador"
              width={200}
              height={200}
              className="rounded-md"
            />
            <div className="flex w-full items-center gap-2">
              <code className="cap-mono min-w-0 flex-1 truncate rounded-md border border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-2.5 py-1.5 text-xs text-[var(--cap-bright)]">
                {setup.secret}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void copySecret()}
                aria-label="Copiar chave secreta"
              >
                {copied ? <Check className="size-4 text-[#166b34]" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-center text-[11px] text-[var(--cap-dim)]">
              Não pode escanear? Digite a chave acima manualmente no app (TOTP · 30s · 6 dígitos).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[var(--cap-text)]">Passo 2: digite o código de 6 dígitos para confirmar</Label>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={enableBusy}
              containerClassName="justify-center"
            >
              <InputOTPGroup>
                {[0, 1, 2].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-10 w-10 border-[var(--cap-border-strong)]" />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                {[3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-10 w-10 border-[var(--cap-border-strong)]" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSetup(null)
                setCode('')
                setError(null)
              }}
              disabled={enableBusy}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="cap-btn-primary flex-1"
              onClick={() => void confirmEnable()}
              disabled={enableBusy || code.length !== 6}
            >
              {enableBusy ? <Loader2 className="animate-spin" /> : <Fingerprint />}
              {enableBusy ? 'Confirmando…' : 'Confirmar ativação'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-[var(--cap-orange)]/40 bg-[var(--cap-orange)]/10 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--cap-warn)]">
              <Fingerprint className="size-5" />
              Autenticação em duas etapas
            </div>
            <Badge variant="outline" className="border-[var(--cap-orange)]/50 bg-white text-[var(--cap-warn)]">
              INATIVO
            </Badge>
          </div>
          <p className="text-sm text-[var(--cap-text)]">
            Adicione uma camada extra de proteção: além da senha, o login exigirá um código de 6 dígitos gerado no
            seu app autenticador (TOTP).
          </p>
          <Button type="button" className="cap-btn-primary w-full" onClick={() => void startSetup()} disabled={setupBusy}>
            {setupBusy ? <Loader2 className="animate-spin" /> : <Fingerprint />}
            {setupBusy ? 'Gerando QR…' : 'Ativar MFA'}
          </Button>
        </>
      )}
    </div>
  )
}

/* ─────────── aba: sessões ─────────── */

function SessionsTab({ active }: { active: boolean }) {
  const { toast } = useToast()
  const [rows, setRows] = React.useState<SessionRow[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [othersBusy, setOthersBusy] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/sessions', { cache: 'no-store' })
      const data = (await res.json().catch(() => ({}))) as { sessions?: SessionRow[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível carregar as sessões.')
      setRows(Array.isArray(data.sessions) ? data.sessions : [])
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (active) void load()
  }, [active, load])

  async function revoke(id: string) {
    setBusyId(id)
    setError(null)
    try {
      const { ok, data } = await reqJSON('DELETE', '/api/auth/sessions', { id })
      if (!ok) {
        setError(str(data, 'error') ?? 'Não foi possível revogar a sessão.')
        return
      }
      toast({ title: 'Sessão revogada', description: 'O dispositivo foi desconectado.' })
      await load()
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusyId(null)
    }
  }

  async function revokeOthers() {
    const othersList = (rows ?? []).filter((r) => !r.current)
    if (othersList.length === 0) return
    setOthersBusy(true)
    setError(null)
    try {
      let n = 0
      for (const o of othersList) {
        const { ok } = await reqJSON('DELETE', '/api/auth/sessions', { id: o.id })
        if (ok) n++
      }
      toast({
        title: `${n} ${n === 1 ? 'sessão encerrada' : 'sessões encerradas'}`,
        description: 'Somente esta sessão permanece ativa.',
      })
      await load()
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setOthersBusy(false)
    }
  }

  const others = (rows ?? []).filter((r) => !r.current).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[var(--cap-text)]">
          Dispositivos conectados à sua conta. Revogue qualquer acesso suspeito.
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Recarregar sessões"
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="border-[var(--cap-danger)]/40">
          <X className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && rows === null ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-8 text-sm text-[var(--cap-dim)]">
          <Loader2 className="size-4 animate-spin" /> Carregando sessões…
        </div>
      ) : (
        <div className="cap-panel-raised max-h-72 space-y-2 overflow-y-auto rounded-xl border-2 border-[var(--cap-border)] p-2">
          {(rows ?? []).map((s) => {
            const info = describeUA(s.userAgent)
            const Icon = info.device === 'mobile' ? Smartphone : Monitor
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border-2 border-[var(--cap-border)] bg-white p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cap-panel-raised)] text-[var(--cap-cyan)]">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-[var(--cap-bright)]">{info.label}</span>
                    {s.current && (
                      <Badge className="cap-mono border-transparent bg-[var(--cap-glow)] text-[9px] tracking-wider text-white">
                        ESTA SESSÃO
                      </Badge>
                    )}
                  </div>
                  <div className="cap-mono truncate text-[11px] text-[var(--cap-dim)]">
                    IP {s.ip || '—'} · {fmtDate(s.createdAt)}
                  </div>
                </div>
                {!s.current && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[var(--cap-danger)] hover:bg-[var(--cap-danger)]/10 hover:text-[var(--cap-danger)]"
                    onClick={() => void revoke(s.id)}
                    disabled={busyId === s.id || othersBusy}
                  >
                    {busyId === s.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Revogar
                  </Button>
                )}
              </div>
            )
          })}
          {rows !== null && rows.length === 0 && (
            <p className="p-4 text-center text-sm text-[var(--cap-dim)]">Nenhuma sessão ativa encontrada.</p>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full border-[var(--cap-danger)]/40 text-[var(--cap-danger)] hover:bg-[var(--cap-danger)]/10 hover:text-[var(--cap-danger)]"
        onClick={() => void revokeOthers()}
        disabled={othersBusy || loading || others === 0}
      >
        {othersBusy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
        {othersBusy ? 'Revogando…' : `Revogar outras sessões (${others})`}
      </Button>
    </div>
  )
}

/* ─────────── aba: conta ─────────── */

function AccountTab({ user }: { user: SafeUserLike }) {
  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    {
      icon: <UserRound className="size-4 text-[var(--cap-cyan)]" />,
      label: 'Nome',
      value: <span className="font-bold text-[var(--cap-bright)]">{user.name}</span>,
    },
    {
      icon: <Mail className="size-4 text-[var(--cap-cyan)]" />,
      label: 'E-mail',
      value: <span className="cap-mono text-[13px] text-[var(--cap-bright)]">{user.email}</span>,
    },
    {
      icon: <CalendarClock className="size-4 text-[var(--cap-cyan)]" />,
      label: 'Conta criada em',
      value: <span className="text-[var(--cap-text)]">{fmtDate(user.createdAt)}</span>,
    },
    {
      icon: <CalendarClock className="size-4 text-[var(--cap-cyan)]" />,
      label: 'Último acesso',
      value: <span className="text-[var(--cap-text)]">{user.lastLoginAt ? fmtDate(user.lastLoginAt) : '—'}</span>,
    },
    {
      icon: <Fingerprint className="size-4 text-[var(--cap-cyan)]" />,
      label: 'MFA (segundo fator)',
      value: (
        <Badge
          variant="outline"
          className={cn(
            'cap-mono text-[10px] tracking-wider',
            user.mfaEnabled
              ? 'border-[var(--cap-glow)]/50 bg-[var(--cap-glow)]/10 text-[#166b34]'
              : 'border-[var(--cap-orange)]/50 bg-[var(--cap-orange)]/10 text-[var(--cap-warn)]',
          )}
        >
          {user.mfaEnabled ? 'ATIVO' : 'INATIVO'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {user.isDemo && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-[var(--cap-orange)]/40 bg-[var(--cap-orange)]/10 p-3">
          <p className="text-sm text-[var(--cap-warn)]">
            Você está usando uma conta de demonstração para avaliar a plataforma.
          </p>
          <span className="cap-sev cap-sev-media shrink-0">CONTA DEMO</span>
        </div>
      )}
      <div className="cap-panel-raised overflow-hidden rounded-xl border-2 border-[var(--cap-border)]">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t-2 border-[var(--cap-border)]')}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white">{r.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cap-dim)]">{r.label}</div>
              <div className="truncate text-sm">{r.value}</div>
            </div>
          </div>
        ))}
      </div>
      <Separator />
      <p className="cap-mono text-[10px] text-[var(--cap-faint)]">
        Precisa de ajuda? Fale com o time de segurança da sua organização.
      </p>
    </div>
  )
}
