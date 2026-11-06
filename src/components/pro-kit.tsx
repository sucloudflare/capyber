'use client'

// CAPYBER PRO KIT — pacote de melhorias profissionais:
// · Paleta de comandos (Ctrl+K) com navegação e ações rápidas
// · Ajuda de atalhos de teclado (tecla ?)
// · Notificações do navegador para ameaças críticas com aba oculta
// · Botão "voltar ao topo"
// · Título da aba dinâmico por visão + restauração da última visão
// · Toast de boas-vindas pós-login

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen, Crosshair, FlaskConical, Gamepad2, Ghost, Home, Keyboard,
  Laptop, Radar, RotateCcw, ShieldCheck, Volume2, VolumeX, Command,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { vigia } from '@/lib/voice'
import { startTutorial } from '@/lib/tutorial-bus'
import type { View } from '@/components/overview'

/* ───────────────────────── notificações do navegador ───────────────────────── */

const NOTIFY_KEY = 'capy_notify'

export function notificationsEnabled(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  return Notification.permission === 'granted' && localStorage.getItem(NOTIFY_KEY) === '1'
}

/** Dispara notificação se a aba estiver oculta e o operador ativou o recurso. */
export function notifyCritical(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (!document.hidden || !notificationsEnabled()) return
  try {
    const n = new Notification(`CAPYBER · ${title}`, { body, icon: '/icon.svg', tag: 'capy-critica' })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* alguns navegadores exigem service worker — falha silenciosa é aceitável */
  }
}

export function NotifyBell() {
  const { toast } = useToast()
  const [state, setState] = useState<'off' | 'on' | 'unsupported'>('off')

  useEffect(() => {
    const t = setTimeout(() => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setState('unsupported')
        return
      }
      setState(
        Notification.permission === 'granted' && localStorage.getItem(NOTIFY_KEY) === '1' ? 'on' : 'off'
      )
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const toggle = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast({ title: 'Sem suporte', description: 'Este navegador não suporta notificações.', variant: 'destructive' })
      return
    }
    if (state === 'on') {
      localStorage.setItem(NOTIFY_KEY, '0')
      setState('off')
      toast({ title: 'Notificações desativadas', description: 'Você não será avisado quando a aba estiver oculta.' })
      return
    }
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (perm === 'granted') {
      localStorage.setItem(NOTIFY_KEY, '1')
      setState('on')
      toast({
        title: 'Notificações ativadas',
        description: 'Ameaças críticas aparecem mesmo com a aba oculta.',
      })
      vigia.speak('Notificações do navegador ativadas. Avisarei ameaças críticas mesmo com a aba oculta.', 1, 'auditoria')
    } else {
      toast({ title: 'Permissão negada', description: 'Libere notificações nas configurações do navegador.', variant: 'destructive' })
    }
  }, [state, toast])

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      title={state === 'on' ? 'Notificações ON — clique para desativar' : 'Ativar notificações de ameaças críticas'}
      className="hidden h-9 gap-1.5 px-2.5 text-base font-bold sm:flex"
      aria-pressed={state === 'on'}
    >
      {state === 'on' ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
      {state === 'on' ? 'ALERTAS ON' : state === 'unsupported' ? '—' : 'ALERTAS OFF'}
    </Button>
  )
}

/* ───────────────────────────── paleta de comandos ───────────────────────────── */

const VIEW_ITEMS: { id: View; label: string; icon: typeof Home; hint: string }[] = [
  { id: 'projeto', label: 'Projeto — apresentação do CAPYBER', icon: Home, hint: '1' },
  { id: 'trilha', label: 'Trilha 3D — jogo de aprendizado', icon: Gamepad2, hint: '2' },
  { id: 'comando', label: 'Comando — mapa e alertas ao vivo', icon: Crosshair, hint: '3' },
  { id: 'osint', label: 'OSINT — recon automático', icon: Radar, hint: '4' },
  { id: 'livro', label: 'Livro 3D — Códice Blue Team', icon: BookOpen, hint: '5' },
  { id: 'ctf', label: 'CTF — O Fantasma do Chat', icon: Ghost, hint: '6' },
  { id: 'frota', label: 'Frota — dispositivos protegidos', icon: Laptop, hint: '7' },
  { id: 'lab', label: 'Laboratório — simular ataques', icon: FlaskConical, hint: '8' },
  { id: 'plano', label: 'Plano 40 — postura de defesa', icon: ShieldCheck, hint: '9' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setVoiceOn(vigia.getState().enabled), 0)
    const unsub = vigia.subscribe(() => setVoiceOn(vigia.getState().enabled))
    return () => {
      clearTimeout(t)
      unsub()
    }
  }, [])

  const run = useCallback((fn: () => void) => {
    setOpen(false)
    setTimeout(fn, 60)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} aria-label="Paleta de comandos">
      <CommandInput placeholder="Digite um comando ou busca… (ex.: osint, tutorial, voz)" />
      <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>
      <CommandGroup heading="Navegação">
        {VIEW_ITEMS.map((v) => (
          <CommandItem
            key={v.id}
            value={v.label}
            onSelect={() => run(() => {
              window.location.hash = v.id
            })}
          >
            <v.icon className="mr-2 h-4 w-4" aria-hidden />
            {v.label}
            <CommandShortcut>{v.hint}</CommandShortcut>
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Ações rápidas">
        <CommandItem
          value="Iniciar tutorial RPG guiado"
          onSelect={() => run(() => startTutorial())}
        >
          <Keyboard className="mr-2 h-4 w-4" aria-hidden />
          Iniciar tutorial RPG guiado
          <CommandShortcut>T</CommandShortcut>
        </CommandItem>
        <CommandItem
          value={voiceOn ? 'Silenciar voz da VIGIA' : 'Ativar voz da VIGIA'}
          onSelect={() => run(() => vigia.toggle())}
        >
          {voiceOn ? <VolumeX className="mr-2 h-4 w-4" aria-hidden /> : <Volume2 className="mr-2 h-4 w-4" aria-hidden />}
          {voiceOn ? 'Silenciar voz da VIGIA' : 'Ativar voz da VIGIA'}
          <CommandShortcut>V</CommandShortcut>
        </CommandItem>
        <CommandItem
          value="Imprimir relatório executivo"
          onSelect={() => run(() => window.print())}
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
          Imprimir relatório executivo (PDF)
          <CommandShortcut>Ctrl+P</CommandShortcut>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <div className="flex items-center gap-2 px-3 py-2 text-base text-[var(--cap-dim)]">
        <Command className="h-4 w-4" aria-hidden />
        Dica: pressione <kbd className="cap-mono rounded border border-[var(--cap-border)] px-1">?</kbd> para ver todos os atalhos.
      </div>
    </CommandDialog>
  )
}

/* ─────────────────────────── ajuda de atalhos (?) ─────────────────────────── */

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: '1 – 9', desc: 'Navegar entre as visões do SOC' },
  { keys: 'Ctrl + K', desc: 'Abrir a paleta de comandos' },
  { keys: 'V', desc: 'Ligar/desligar a voz da VIGIA' },
  { keys: '/', desc: 'Focar a busca OSINT (na visão OSINT)' },
  { keys: '← →', desc: 'Virar páginas do Livro 3D' },
  { keys: '?', desc: 'Abrir esta ajuda' },
  { keys: 'Esc', desc: 'Fechar painéis e sair do tutorial' },
  { keys: 'Ctrl + P', desc: 'Imprimir relatório executivo' },
]

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      if (e.key === '?') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md" aria-label="Atalhos de teclado">
        <DialogHeader>
          <DialogTitle className="cap-heading flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-[var(--cap-cyan)]" aria-hidden />
            Atalhos de teclado
          </DialogTitle>
          <DialogDescription>
            Opere o CAPYBER como um analista veterano, sem sair do teclado.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center gap-3 rounded-lg border border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-3 py-2">
              <kbd className="cap-mono min-w-[76px] rounded-md border-2 border-[var(--cap-border-strong)] bg-white px-2 py-1 text-center text-sm font-extrabold text-[var(--cap-bright)]">
                {s.keys}
              </kbd>
              <span className="text-base text-[var(--cap-text)]">{s.desc}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

/* ──────────────────────────── voltar ao topo ──────────────────────────── */

export function ScrollTopButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="cap-btn-steel fixed bottom-36 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full p-0 shadow-lg sm:bottom-24 sm:right-6"
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}

/* ─────────────────── título dinâmico + última visão ─────────────────── */

const VIEW_TITLE: Record<View, string> = {
  projeto: 'Projeto',
  trilha: 'Trilha 3D',
  comando: 'Comando',
  osint: 'OSINT',
  livro: 'Livro 3D',
  pergaminho: 'Pergaminho',
  ctf: 'CTF Fantasma',
  stealth: 'Sala Stealth',
  celular: 'Defesa do Celular',
  frota: 'Frota',
  lab: 'Laboratório',
  plano: 'Plano 40',
  legado: 'Legado',
}

export function useViewMeta(view: View) {
  useEffect(() => {
    document.title = `${VIEW_TITLE[view]} · CAPYBER — SOC em tempo real`
    try {
      localStorage.setItem('capy_last_view', view)
    } catch { /* modo privado */ }
  }, [view])
}

export function lastView(): View | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem('capy_last_view') as View | null
    return v && v in VIEW_TITLE ? v : null
  } catch {
    return null
  }
}

/* ──────────────────────── toast de boas-vindas ──────────────────────── */

export function WelcomeToast({ name, guest }: { name: string; guest: boolean }) {
  const { toast } = useToast()
  useEffect(() => {
    let shown = false
    try {
      shown = sessionStorage.getItem('capy_welcomed') === '1'
    } catch { /* modo privado */ }
    if (shown) return
    try {
      sessionStorage.setItem('capy_welcomed', '1')
    } catch { /* ignora */ }
    const t = setTimeout(() => {
      toast({
        title: guest ? 'Modo visitante ativo' : `Bem-vindo de volta, ${name}!`,
        description: guest
          ? 'Explore tudo; crie sua conta para MFA e certificados com seu nome.'
          : 'Sessão segura restabelecida. A VIGIA está de olho nos endpoints.',
        duration: 6000,
      })
    }, 900)
    return () => clearTimeout(t)
  }, [name, guest, toast])
  return null
}

/* hook utilitário memoizado para listas estáticas do kit */
export function useShortcutList() {
  return useMemo(() => SHORTCUTS, [])
}
