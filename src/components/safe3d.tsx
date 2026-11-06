'use client'

// CAPYBER — blindagem dos palcos 3D. Um problema de WebGL (driver antigo,
// GPU sem suporte, WebView limitado) ou de canvas 2D NUNCA pode derrubar o
// painel inteiro com o "Falha no painel" global: este boundary isola o
// canvas, exibe um fallback temático amigável e permite retomar a sessão
// (remonta o canvas) sem recarregar a página.

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Gamepad2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  /** título curto do palco (ex.: "Vale dos Fantasmas", "Mapa OSINT") */
  title?: string
  /** chave para forçar remontagem do canvas após "Retomar" */
  retryKey?: number
}

interface State {
  failed: boolean
  retries: number
}

export class Safe3DBoundary extends Component<Props, State> {
  state: State = { failed: false, retries: 0 }

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // log técnico no console (o boundary global nunca deve precisar atuar por isso)
    console.error('[CAPYBER] palco 3D falhou — fallback ativado:', error?.message ?? error, info?.componentStack?.slice(0, 400))
  }

  private retry = () => {
    this.setState((s) => ({ failed: false, retries: s.retries + 1 }))
  }

  render() {
    const { failed } = this.state

    if (failed) {
      return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#dcedff] px-6 text-center">
          <span className="cap-skew-plate flex h-14 w-14 items-center justify-center">
            <Gamepad2 className="h-7 w-7 text-[var(--cap-cyan)]" aria-hidden />
          </span>
          <p className="font-heading text-lg font-extrabold text-[var(--cap-bright)]">
            Palco 3D indisponível{this.props.title ? ` — ${this.props.title}` : ''}
          </p>
          <p className="max-w-sm text-sm text-[var(--cap-text)]">
            O motor gráfico deste dispositivo não abriu a cena. O resto do painel continua
            funcionando normalmente — tente retomar ou use outro navegador.
          </p>
          <Button onClick={this.retry} className="cap-btn-primary min-h-11">
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
            Retomar cena
          </Button>
        </div>
      )
    }

    // remonta o canvas a cada retry (nova chave = nova instância limpa)
    return <Safe3DRetryKeyInner key={this.state.retries} retryKey={this.props.retryKey}>{this.props.children}</Safe3DRetryKeyInner>
  }
}

/** separado para não remontar os filhos quando apenas props mudam */
function Safe3DRetryKeyInner({ children }: { children: ReactNode; retryKey?: number }) {
  return <>{children}</>
}
