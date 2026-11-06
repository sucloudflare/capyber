'use client'

// CAPYBER — contexto global de autenticação do cliente.
// Expõe o operador logado (user), o modo visitante (isGuest, persistido em
// localStorage para sobreviver a refresh) e ações simples de sessão.
//
// Uso na integração:
//   <AuthProvider>            → envolver a aplicação (uma vez, no topo)
//   const { user, isGuest, isAuthed, ready, signIn, signOut, refresh } = useAuth()
//   - AuthGate.onSuccess(userOrNull) → signIn(userOrNull)   (null = visitante)
//   - UserMenu.onLogout()            → signOut()
//   - render splash enquanto ready === false

import * as React from 'react'

import type { SafeUserLike } from './user-menu'

/** Chave do localStorage que marca o modo visitante. */
export const GUEST_KEY = 'capy_guest'

/** Lê a flag de modo visitante (client-side; seguro fora do browser). */
export function readGuestFlag(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(GUEST_KEY) === '1'
  } catch {
    return false
  }
}

function persistGuestFlag(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (on) window.localStorage.setItem(GUEST_KEY, '1')
    else window.localStorage.removeItem(GUEST_KEY)
  } catch {
    /* storage indisponível (modo privado etc.) — segue sem persistir */
  }
}

export interface AuthContextValue {
  /** Operador autenticado (null quando anônimo ou em modo visitante). */
  user: SafeUserLike | null
  /** Modo visitante: navega sem conta (user é null). */
  isGuest: boolean
  /** true se há usuário OU modo visitante — a UI principal pode ser exibida. */
  isAuthed: boolean
  /** false até a checagem inicial de sessão (/api/auth/me) terminar. */
  ready: boolean
  /**
   * Entra com um usuário (AuthGate sucesso) ou ativa o modo visitante com null
   * (AuthGate "Explorar como visitante"). Persiste/limpa a flag de visitante.
   */
  signIn: (user: SafeUserLike | null) => void
  /** Limpa usuário e modo visitante localmente (sem chamar a API). */
  signOut: () => void
  /** Revalida a sessão com GET /api/auth/me. */
  refresh: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SafeUserLike | null>(null)
  const [isGuest, setIsGuest] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  const signIn = React.useCallback((u: SafeUserLike | null) => {
    if (u) {
      persistGuestFlag(false)
      setIsGuest(false)
      setUser(u)
    } else {
      setUser(null)
      persistGuestFlag(true)
      setIsGuest(true)
    }
  }, [])

  const signOut = React.useCallback(() => {
    setUser(null)
    setIsGuest(false)
    persistGuestFlag(false)
  }, [])

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { user?: SafeUserLike | null }
        if (data.user) {
          persistGuestFlag(false)
          setIsGuest(false)
          setUser(data.user)
          setReady(true)
          return
        }
      }
      setUser(null)
      setIsGuest(readGuestFlag())
    } catch {
      // offline: preserva o estado local (visitante continua visitante)
      setUser(null)
      setIsGuest((g) => g || readGuestFlag())
    } finally {
      setReady(true)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, isGuest, isAuthed: user !== null || isGuest, ready, signIn, signOut, refresh }),
    [user, isGuest, ready, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  return ctx
}
