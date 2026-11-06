'use client'

// CAPYBER global error boundary — nunca expõe detalhes sensíveis.
// Oferece "Retomar operação" (remonta a view) e, se o erro persistir,
// um recarregamento completo da sessão.

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, ShieldAlert } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [attempted, setAttempted] = useState(false)
  const loggedRef = useRef(false)

  useEffect(() => {
    if (!loggedRef.current) {
      loggedRef.current = true
      console.error(error)
    }
  }, [error])

  const handleRetry = () => {
    // 1ª tentativa: remonta sem recarregar. Se o usuário já tentou, recarrega.
    if (!attempted) {
      setAttempted(true)
      reset()
      return
    }
    window.location.reload()
  }

  return (
    <main className="cap-bg-grid flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="cap-skew-plate flex h-16 w-16 items-center justify-center">
        <ShieldAlert className="h-8 w-8 text-[#c0182b]" aria-hidden />
      </span>
      <p className="cap-mono text-sm font-bold tracking-[0.3em] text-[#c0182b]">FALHA</p>
      <h1 className="font-heading text-2xl font-extrabold text-[var(--cap-bright)]">
        Falha no painel
      </h1>
      <p className="max-w-md text-base text-[var(--cap-text)]">
        O motor de defesa encontrou um erro. Tente retomar a sessão.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={handleRetry}
          className="cap-btn-primary flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white shadow-lg transition hover:brightness-105"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Retomar operação
        </button>
      </div>
      {error?.digest && (
        <p className="cap-mono cap-num text-xs text-[var(--cap-faint)]">
          ref: {error.digest}
        </p>
      )}
    </main>
  )
}
