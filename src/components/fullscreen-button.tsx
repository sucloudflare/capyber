'use client'

// Botão universal de tela cheia — funciona em qualquer container 3D/canvas.
// Uso: renderizar DENTRO do container que deve expandir (ancestral com
// [data-fs-root] é usado como alvo; sem marcação, usa o pai direto).

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Maximize, Minimize } from 'lucide-react'

export function useFullscreen(getEl: () => HTMLElement | null) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const toggle = useCallback(() => {
    const el = getEl()
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined)
    } else {
      void el.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => undefined)
    }
  }, [getEl])

  return { active, toggle }
}

export function FullscreenButton({
  target,
  label = 'Tela cheia',
  className = '',
}: {
  /** resolve o elemento a expandir; padrão: ancestral [data-fs-root] ou pai direto */
  target?: () => HTMLElement | null
  label?: string
  className?: string
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const getEl = useCallback(() => {
    if (target) return target()
    return (
      (btnRef.current?.closest('[data-fs-root]') as HTMLElement | null) ??
      btnRef.current?.parentElement ??
      null
    )
  }, [target])
  const { active, toggle } = useFullscreen(getEl)

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? 'Sair da tela cheia' : label}
      title={active ? 'Sair da tela cheia (Esc)' : `${label} (F)`}
      className={`cap-btn-ghost inline-flex min-h-[34px] items-center gap-1.5 px-3 text-base font-bold ${className}`}
    >
      {active ? (
        <Minimize className="h-4 w-4" aria-hidden />
      ) : (
        <Maximize className="h-4 w-4" aria-hidden />
      )}
      <span className="hidden sm:inline">{active ? 'Sair da tela cheia' : label}</span>
    </button>
  )
}

/** Atalho global opcional: tecla F alterna a tela cheia do container marcado. */
export function FullscreenHotkey({ rootId }: { rootId: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      if (e.key.toLowerCase() !== 'f') return
      const root = document.getElementById(rootId)
      if (!root) return
      if (document.fullscreenElement) {
        void document.exitFullscreen?.().catch(() => undefined)
      } else {
        void root.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => undefined)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rootId])
  return null
}

/** Envolve conteúdo e o expande em tela cheia ao clicar no botão do canto. */
export function FullscreenShell({
  rootId,
  toolbar,
  children,
  className = '',
}: {
  rootId: string
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      id={rootId}
      data-fs-root
      className={`relative flex flex-col ${className}`}
    >
      {toolbar ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">{toolbar}</div>
      ) : null}
      {children}
    </div>
  )
}

export default FullscreenButton
