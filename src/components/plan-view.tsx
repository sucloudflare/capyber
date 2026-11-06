'use client'

// CAPYBER — Plano de Defesa em 40 Pontos (MITRE ATT&CK · D3FEND · NIST · CIS · LGPD).

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ShieldHalf } from 'lucide-react'
import { PLAN, PLAN_CATEGORIES, type PlanCategory } from '@/lib/plan-data'

const CAT_COLOR: Record<PlanCategory, string> = {
  'Identidade & Zero Trust': '#8b5cf6',
  'Endpoint & Dispositivos': '#16a34a',
  'Rede & Perímetro': '#2f7fd1',
  'Aplicação & Cripto': '#d97706',
  'Detecção & SOC': '#e11d2e',
  'Resposta & Pessoas': '#f5920b',
}

export function PlanView({ highlightRef }: { highlightRef: string | null }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<'TODAS' | PlanCategory>('TODAS')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PLAN.filter(
      (p) =>
        (cat === 'TODAS' || p.category === cat) &&
        (!q ||
          p.title.toLowerCase().includes(q) ||
          p.resumo.toLowerCase().includes(q) ||
          p.id.toLowerCase() === q ||
          p.mitre.some((m) => m.toLowerCase().includes(q)))
    )
  }, [query, cat])

  useEffect(() => {
    if (!highlightRef) return
    const el = document.getElementById(`plan-${highlightRef}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-[var(--cap-glow)]/70')
      const t = setTimeout(() => el.classList.remove('ring-2', 'ring-[var(--cap-glow)]/70'), 4000)
      return () => clearTimeout(t)
    }
  }, [highlightRef])

  return (
    <div className="space-y-4">
      <div className="cap-panel flex flex-wrap items-center gap-3 p-4">
        <ShieldHalf className="h-6 w-6 shrink-0 text-[var(--cap-glow)]" aria-hidden />
        <div className="min-w-0">
          <p className="cap-eyebrow">Segurança · Endurecimento</p>
          <h2 className="cap-gradient-text text-2xl font-bold">Plano de Defesa em 40 Pontos</h2>
          <p className="text-base text-[var(--cap-dim)]">
            MITRE ATT&CK · D3FEND · NIST CSF 2.0 · CIS Controls v8 · ISO 27001 · LGPD · Lei 14.478/2022
          </p>
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cap-faint)]" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ponto, técnica MITRE..."
            className="cap-input pl-8"
            aria-label="Buscar no plano de defesa"
          />
        </div>
      </div>

      <div className="cap-panel flex items-center gap-3 px-4 py-2.5">
        <span className="cap-eyebrow hidden shrink-0 sm:inline-flex">Cobertura</span>
        <div
          className="cap-xpbar h-2 min-w-0 flex-1"
          role="progressbar"
          aria-label="Medidas do plano visíveis no filtro atual"
          aria-valuemin={0}
          aria-valuemax={PLAN.length}
          aria-valuenow={filtered.length}
        >
          <i style={{ width: `${Math.round((filtered.length / PLAN.length) * 100)}%` }} />
        </div>
        <span className="cap-num shrink-0 text-base font-bold text-[var(--cap-bright)]">
          {filtered.length}/{PLAN.length}
        </span>
        <span className="hidden shrink-0 text-sm text-[var(--cap-dim)] lg:inline">medidas no filtro atual</span>
      </div>

      <div className="cap-fade-x cap-scroll-slim flex gap-1.5 overflow-x-auto py-1">
        <button
          onClick={() => setCat('TODAS')}
          className={`inline-flex min-h-10 shrink-0 items-center rounded-md border px-3 py-1.5 text-base font-medium transition-colors ${
            cat === 'TODAS' ? 'border-[var(--cap-orange)]/60 bg-[var(--cap-orange)]/15 text-[var(--cap-bright)]' : 'border-[var(--cap-border)] text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
          }`}
          aria-pressed={cat === 'TODAS'}
        >
          Todas as trilhas
        </button>
        {PLAN_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`inline-flex min-h-10 shrink-0 items-center rounded-md border px-3 py-1.5 text-base font-medium transition-colors ${
              cat === c ? 'border-[var(--cap-orange)]/60 bg-[var(--cap-orange)]/15 text-[var(--cap-bright)]' : 'border-[var(--cap-border)] text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
            }`}
            aria-pressed={cat === c}
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: CAT_COLOR[c] }} aria-hidden />
            {c}
          </button>
        ))}
      </div>

      <div className="cap-stagger space-y-3">
        {filtered.map((p) => (
          <article key={p.id} id={`plan-${p.id}`} className="cap-card-hover cap-panel p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="cap-mono cap-num rounded-md bg-[#0d2038]/8 px-2 py-0.5 text-base font-bold text-[var(--cap-bright)]">{p.id}</span>
              <h3 className="text-lg font-bold text-[var(--cap-bright)]">{p.title}</h3>
              <span
                className="ml-auto rounded-md px-2 py-0.5 text-base font-bold"
                style={{ color: CAT_COLOR[p.category], background: `${CAT_COLOR[p.category]}14` }}
              >
                {p.category}
              </span>
            </div>

            <p className="mt-2 text-base font-medium text-[var(--cap-text)]">{p.resumo}</p>
            <p className="mt-1.5 text-base leading-relaxed text-[var(--cap-dim)]">{p.detalhe}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.mitre.map((m) => (
                <Badge key={m} variant="outline" className="cap-badge cap-mono text-base">
                  {m}
                </Badge>
              ))}
              <Badge variant="outline" className="cap-badge text-base">
                D3FEND: {p.defenda}
              </Badge>
              <Badge variant="outline" className="cap-badge text-base">
                NIST: {p.nist}
              </Badge>
              <Badge variant="outline" className="cap-badge text-base">
                CIS: {p.cis}
              </Badge>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1.5 text-base font-bold uppercase tracking-wide text-[var(--cap-dim)]">Como implementar</p>
                <ul className="space-y-1">
                  {p.passos.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-base text-[var(--cap-text)]">
                      <span className="cap-mono cap-num mt-0.5 text-base text-[var(--cap-glow)]">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-base font-bold uppercase tracking-wide text-[var(--cap-dim)]">Ferramentas & custo</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.ferramentas.map((f) => (
                    <span key={f} className="rounded-md border border-[var(--cap-border)] px-1.5 py-0.5 text-base text-[var(--cap-text)]">
                      {f}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-base text-[var(--cap-dim)]">
                  Impacto: <strong className="text-[var(--cap-bright)]">{p.impacto}</strong> · Custo: <strong className="text-[var(--cap-bright)]">{p.custo}</strong>
                </p>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-base text-[var(--cap-dim)]">Nenhum ponto encontrado para “{query}”.</p>
        )}
      </div>
    </div>
  )
}
