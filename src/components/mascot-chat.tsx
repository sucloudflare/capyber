'use client'

// CAPYBER — Capy Fantasma: mascote IA do SOC (KB local + fallback LLM).

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SendHorizonal, X } from 'lucide-react'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
  tips?: string[]
  planRefs?: string[]
  source?: string
}

function GhostAvatar({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="cap-ghost" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d7e2ee" />
        </linearGradient>
      </defs>
      <path
        d="M32 6c-13 0-21 9.5-21 22v26c0 2.6 3 4 5 2.2 1.8-1.6 4.2-1.6 6 0 1.9 1.7 4.7 1.7 6.6 0 1.9-1.7 4.7-1.7 6.6 0 1.9 1.7 4.7 1.7 6.6 0 1.8-1.6 4.2-1.6 6 0 2 1.8 5 .4 5-2.2V28C53 15.5 45 6 32 6z"
        fill="url(#cap-ghost)"
        stroke="#16a34a"
        strokeWidth="2.5"
      />
      <circle cx="25" cy="30" r="4" fill="#0d2038" />
      <circle cx="40" cy="30" r="4" fill="#0d2038" />
      <path d="M27 42q5 4 10 0" stroke="#0d2038" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

const GREETING: ChatMsg = {
  role: 'assistant',
  content:
    'Salve! Sou o CAPY FANTASMA — o fantasma do SOC. Sei tudo sobre blindar notebook, PC e celular contra APTs de estado, hacktivistas e gente de dentro. Manda a braba!',
  tips: [
    'Como protejo meu notebook de trabalho?',
    'Como proteger minha carteira de drainers?',
    'O que é zero trust?',
    'Como me defender de phishing?',
  ],
}

export function MascotChat({
  open,
  onToggle,
  onGoPlan,
  kbSize,
  hideLauncher = false,
}: {
  open: boolean
  onToggle: () => void
  onGoPlan: (ref: string) => void
  kbSize: number
  hideLauncher?: boolean
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-chat-end]')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, loading])

  // Esc fecha o chat (overlay customizado)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onToggle])

  async function send(text?: string) {
    const message = (text ?? input).trim()
    if (!message || loading) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', content: message }])
    setLoading(true)
    try {
      const history = msgs.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      })
      const data = await res.json()
      setMsgs((m) => [
        ...m,
        {
          role: 'assistant',
          content: data.reply ?? 'Ops, erro na rede do além. Tenta de novo!',
          tips: data.tips,
          planRefs: data.planRefs,
          source: data.source,
        },
      ])
    } catch {
      setMsgs((m) => [
        ...m,
        { role: 'assistant', content: 'A rede do além caiu. Tenta de novo aí!' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && !hideLauncher && (
        <button
          onClick={onToggle}
          className="cap-pulse-ring fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0d2038]/60 bg-white shadow-[0_8px_28px_rgba(13,32,56,0.35)] transition-transform hover:scale-110 sm:bottom-6"
          aria-label="Abrir chat com o Capy Fantasma"
          title="Falar com o Capy Fantasma"
        >
          <GhostAvatar size={38} />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-black bg-[var(--cap-glow)] cap-blink" />
        </button>
      )}

      {open && (
        <div className="cap-panel cap-fade-in fixed bottom-20 right-4 z-50 flex h-[min(560px,72vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden sm:bottom-6">
          <div className="flex items-center gap-2.5 border-b border-[var(--cap-border)] p-3">
            <span className="cap-float shrink-0">
              <GhostAvatar size={40} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-[var(--cap-bright)]">CAPY FANTASMA</div>
              <div className="truncate text-base text-[var(--cap-dim)]">
                IA do SOC · {kbSize.toLocaleString('pt-BR')} perguntas mapeadas
              </div>
            </div>
            <button
              onClick={onToggle}
              className="rounded-md p-1.5 text-[var(--cap-dim)] hover:bg-[#0d2038]/5 hover:text-[var(--cap-bright)]"
              aria-label="Fechar chat"
              title="Fechar chat (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ScrollArea
            className="cap-scroll-slim min-h-0 flex-1 [&_[data-slot=scroll-area-thumb]]:bg-[#9cc3ea]"
            aria-label="Conversa com o Capy Fantasma"
          >
            <div ref={scrollRef} className="cap-stagger space-y-3 p-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && <GhostAvatar size={26} />}
                  <div className={`relative max-w-[85%] ${m.role === 'user' ? 'text-right' : ''}`}>
                    {/* rabinho de balão via borda rotacionada */}
                    <span
                      aria-hidden
                      className={`absolute top-3 h-2.5 w-2.5 rotate-45 rounded-[2px] ${
                        m.role === 'user'
                          ? '-right-1 border-r border-t border-[#0d2038]/30 bg-[#0d2038]/8'
                          : '-left-1 border-b border-l border-[var(--cap-border)] bg-[var(--cap-panel-raised)]'
                      }`}
                    />
                    <div
                      className={`relative whitespace-pre-line rounded-xl border p-2.5 text-base leading-relaxed ${
                        m.role === 'user'
                          ? 'border-[#0d2038]/30 bg-[#0d2038]/8 font-medium text-[var(--cap-bright)]'
                          : 'border-[var(--cap-border)] bg-[var(--cap-panel-raised)] text-[var(--cap-text)]'
                      }`}
                    >
                      {m.content}
                    </div>

                    {m.planRefs && m.planRefs.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.planRefs.map((r) => (
                          <button
                            key={r}
                            onClick={() => onGoPlan(r)}
                            className="cap-mono rounded-md border border-[var(--cap-glow)]/40 px-1.5 py-0.5 text-base text-[var(--cap-glow)] hover:bg-[var(--cap-glow)]/10"
                          >
                            {r} no Plano 40
                          </button>
                        ))}
                      </div>
                    )}

                    {m.tips && i === msgs.length - 1 && !loading && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.tips.map((t) => (
                          <button
                            key={t}
                            onClick={() => send(t)}
                            className="rounded-full border border-[var(--cap-border)] px-2.5 py-1.5 text-base text-[var(--cap-text)] transition-colors hover:border-[#0d2038]/50 hover:text-[var(--cap-bright)]"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2">
                  <GhostAvatar size={26} />
                  <div className="relative rounded-xl border border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-3 py-2.5">
                    <span
                      aria-hidden
                      className="absolute -left-1 top-3 h-2.5 w-2.5 rotate-45 rounded-[2px] border-b border-l border-[var(--cap-border)] bg-[var(--cap-panel-raised)]"
                    />
                    <span
                      className="flex items-center gap-1"
                      role="status"
                      aria-label="Capy Fantasma está digitando"
                    >
                      <span className="h-2 w-2 rounded-full bg-[var(--cap-cyan-soft)] motion-safe:animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-[var(--cap-cyan-soft)] motion-safe:animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-[var(--cap-cyan-soft)] motion-safe:animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div data-chat-end />
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t border-[var(--cap-border)] p-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte ao Capy Fantasma…"
                className="cap-input text-base"
                aria-label="Mensagem para o Capy Fantasma"
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className="cap-btn-primary h-10 w-10 shrink-0"
                aria-label="Enviar mensagem"
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
