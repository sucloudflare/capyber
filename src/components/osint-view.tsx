'use client'

// CAPYBER — Visão OSINT: recon automático com cadeia de dados em 3D.
// Consome /api/osint/scan (NDJSON em streaming) e alimenta o mapa 3D
// em tempo real: nós nascem perto da entidade que os originou, com
// pulsos de dados percorrendo as conexões. Inspector completo (tabela/JSON
// sem truncamento), tela cheia, zoom de câmera e layout responsivo
// (rail de módulos + grafo + inspector; no mobile: busca fixa, abas e
// inspector em bottom sheet).

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { markLegacy } from '@/lib/legacy'
import {
  BadgeCheck,
  Braces,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleStop,
  Clock,
  Copy,
  Crosshair,
  Download,
  ExternalLink,
  FileJson,
  Globe2,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  Network,
  Radar,
  Search,
  Table2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { GateSpiral } from '@/components/art'
import { Safe3DBoundary } from '@/components/safe3d'
import { cn } from '@/lib/utils'
import {
  OSINT_MODULES,
  OSINT_TYPE_COLOR,
  OSINT_TYPE_LABEL,
  guessTargetKind,
  type OsintEdge,
  type OsintEvent,
  type OsintNode,
  type OsintType,
} from '@/lib/osint-modules'
import type { Osint3DApi } from '@/components/osint3d-canvas'

const OsintCanvas = dynamic(() => import('@/components/osint3d-canvas'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <GateSpiral size={56} spin title="Abrindo grafo OSINT" />
      <p className="text-base font-bold text-[#7cb6ec]">Preparando o mapa 3D…</p>
    </div>
  ),
})

type ModuleStatus = 'idle' | 'running' | 'done' | 'error' | 'empty'
interface ModuleState {
  status: ModuleStatus
  info?: string
}

const EXAMPLES = ['torproject.org', 'registro.br', '8.8.8.8', '@torvalds']

const GROUP_ORDER: OsintType[] = [
  'subdominio', 'ip', 'dns', 'asn', 'geo', 'org', 'whois', 'email',
  'breach', 'usuario', 'repo', 'dork', 'url',
]

type MetaVal = string | number | boolean | null

function fmtMetaKey(k: string): string {
  return k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

function fmtMetaVal(v: MetaVal): string {
  if (v === null) return '—'
  if (typeof v === 'boolean') return v ? 'sim' : 'não'
  if (typeof v === 'number') return v.toLocaleString('pt-BR')
  return v
}

/** Chaves internas usadas como botões/links, não exibidas na tabela de metadados. */
function isLinkKey(k: string): boolean {
  return k === 'url_bing' || k === 'url_ddg' || /^link_\d+_(nome|url)$/.test(k)
}

/** Valor de metadado que é uma URL http(s) → vira link clicável. */
function isHttpUrl(v: string): boolean {
  return /^https?:\/\/\S+$/i.test(v)
}

/** Media query SSR-safe (começa falso e sincroniza no cliente). */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = (): void => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])
  return matches
}

/* ============ tela cheia (nativa com fallback webkit/CSS) ============ */

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

function fsElementNow(): Element | null {
  const d = document as FsDocument
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null
}

/* ============ ilustração de estado vazio (lupa sobre globo, SVG inline) ============ */

function EmptyStateArt(): React.ReactElement {
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 text-[#2b5e93]" role="img" aria-label="Lupa sobre um globo">
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* globo */}
        <circle cx="52" cy="52" r="33" />
        <ellipse cx="52" cy="52" rx="14" ry="33" />
        <path d="M19 52h66" />
        <path d="M27 35h50" opacity="0.55" />
        <path d="M27 69h50" opacity="0.55" />
        {/* lupa */}
        <circle cx="83" cy="83" r="17" className="text-[#37c0fb]" stroke="currentColor" />
        <path d="M95.5 95.5l11 11" className="text-[#37c0fb]" stroke="currentColor" strokeWidth="4.5" />
      </g>
    </svg>
  )
}

/* ============ linha de metadado — valor COMPLETO, sem truncamento ============ */

function MetaRow({ k, v, onCopy }: { k: string; v: MetaVal; onCopy: (text: string, title: string) => void }) {
  const display = fmtMetaVal(v)
  const isUrl = typeof v === 'string' && isHttpUrl(v)
  return (
    <div className="group/row flex items-start justify-between gap-2 px-2.5 py-2">
      <dt className="w-[38%] shrink-0 break-all pt-px text-[0.8rem] font-bold uppercase tracking-wide text-[var(--cap-dim)]">
        {fmtMetaKey(k)}
      </dt>
      <dd className="min-w-0 flex-1">
        {isUrl ? (
          <a
            href={v}
            target="_blank"
            rel="noopener noreferrer external"
            className="cap-mono block break-all text-[0.85rem] text-[var(--cap-cyan)] underline decoration-dotted underline-offset-2"
          >
            {display}
          </a>
        ) : (
          <span className="cap-mono block whitespace-pre-wrap break-all text-left text-[0.85rem] leading-relaxed text-[var(--cap-text)]">
            {display}
          </span>
        )}
      </dd>
      <button
        type="button"
        onClick={() => onCopy(display, `Campo “${fmtMetaKey(k)}” copiado`)}
        className="mt-0.5 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/row:opacity-100"
        aria-label={`Copiar valor do campo ${fmtMetaKey(k)}`}
        title="Copiar campo"
      >
        <Copy className="h-3.5 w-3.5 text-[var(--cap-dim)] transition-colors hover:text-[var(--cap-cyan)]" aria-hidden />
      </button>
    </div>
  )
}

/* ============ inspector completo do nó (tabela | JSON) ============ */

function InspectorContent({ node, onCopy }: { node: OsintNode; onCopy: (text: string, title: string) => void }) {
  const [tab, setTab] = useState<'tabela' | 'json'>('tabela')
  const [expanded, setExpanded] = useState(false)

  const metaEntries = useMemo(() => Object.entries(node.meta ?? {}), [node])
  const tableEntries = useMemo(() => metaEntries.filter(([k]) => !isLinkKey(k)), [metaEntries])
  const linkRows = useMemo(
    () =>
      metaEntries
        .filter(([k, v]) => /^link_\d+_nome$/.test(k) && typeof v === 'string')
        .map(([k, v]) => {
          const idx = k.match(/\d+/)?.[0]
          const url = node.meta?.[`link_${idx}_url`]
          return typeof url === 'string' ? { name: String(v), url } : null
        })
        .filter((x): x is { name: string; url: string } => x !== null),
    [metaEntries, node],
  )
  const json = useMemo(() => JSON.stringify(node, null, 2), [node])

  return (
    <div className="space-y-3">
      {/* identidade do nó */}
      <div className="flex items-start gap-2">
        <span
          className="mt-1 inline-block h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ background: OSINT_TYPE_COLOR[node.type] }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.85rem] font-extrabold uppercase tracking-wider text-[var(--cap-cyan)]">
            {OSINT_TYPE_LABEL[node.type]}
          </p>
          <p className="cap-mono break-all text-[1.05rem] font-bold text-[var(--cap-bright)]">{node.label}</p>
          {node.value !== node.label && (
            <p className="cap-mono mt-1 break-all whitespace-pre-wrap text-[0.9rem] text-[var(--cap-text)]">{node.value}</p>
          )}
          <p className="mt-1 text-[0.8rem] text-[var(--cap-dim)]">
            origem: <span className="font-bold">{node.source}</span> · salto {node.depth}
          </p>
        </div>
      </div>

      {/* alternância Tabela | JSON + Expandir tudo */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div
          className="flex overflow-hidden rounded border-2 border-[var(--cap-border)]"
          role="group"
          aria-label="Modo de visualização dos dados do nó"
        >
          <button
            type="button"
            onClick={() => setTab('tabela')}
            aria-pressed={tab === 'tabela'}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-[0.8rem] font-bold transition-colors',
              tab === 'tabela'
                ? 'bg-[var(--cap-cyan)] text-[#04101f]'
                : 'bg-transparent text-[var(--cap-dim)] hover:text-[var(--cap-cyan)]',
            )}
          >
            <Table2 className="h-3.5 w-3.5" aria-hidden /> Tabela
          </button>
          <button
            type="button"
            onClick={() => setTab('json')}
            aria-pressed={tab === 'json'}
            className={cn(
              'flex items-center gap-1 border-l-2 border-[var(--cap-border)] px-2.5 py-1 text-[0.8rem] font-bold transition-colors',
              tab === 'json'
                ? 'bg-[var(--cap-cyan)] text-[#04101f]'
                : 'bg-transparent text-[var(--cap-dim)] hover:text-[var(--cap-cyan)]',
            )}
          >
            <Braces className="h-3.5 w-3.5" aria-hidden /> JSON
          </button>
        </div>
        {tab === 'tabela' && tableEntries.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto h-8"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            title={expanded ? 'Voltar à lista com rolagem' : 'Mostrar todos os campos sem rolagem interna'}
          >
            {expanded ? <ChevronUp className="mr-1 h-4 w-4" aria-hidden /> : <ChevronDown className="mr-1 h-4 w-4" aria-hidden />}
            {expanded ? 'Recolher' : 'Expandir tudo'}
          </Button>
        )}
      </div>

      {tab === 'tabela' ? (
        <>
          {tableEntries.length > 0 ? (
            <div
              className="cap-scroll-slim overflow-y-auto rounded border-2 border-[var(--cap-border)]"
              style={expanded ? undefined : { maxHeight: 340 }}
            >
              <dl className="divide-y divide-[var(--cap-border)]">
                {tableEntries.map(([k, v]) => (
                  <MetaRow key={k} k={k} v={v} onCopy={onCopy} />
                ))}
              </dl>
            </div>
          ) : (
            <p className="rounded border-2 border-dashed border-[var(--cap-border)] p-3 text-center text-[0.85rem] text-[var(--cap-dim)]">
              Este nó não possui campos adicionais — os dados identificados estão acima.
            </p>
          )}

          {linkRows.length > 0 && (
            <div>
              <p className="mb-1 text-[0.8rem] font-extrabold uppercase tracking-wider text-[var(--cap-dim)]">
                Links relacionados
              </p>
              <div className="overflow-hidden rounded border-2 border-[var(--cap-border)]">
                {linkRows.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer external"
                    className="flex items-start justify-between gap-2 border-b border-[var(--cap-border)] p-2.5 transition-colors last:border-b-0 hover:bg-[var(--cap-panel-raised)]"
                  >
                    <span className="min-w-0">
                      <span className="block break-all text-[0.85rem] font-bold text-[var(--cap-text)]">{l.name}</span>
                      <span className="cap-mono block break-all text-[0.75rem] text-[var(--cap-cyan)]">{l.url}</span>
                    </span>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cap-dim)]" aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onCopy(json, 'JSON copiado')}>
            <Copy className="mr-1 h-4 w-4" aria-hidden /> Copiar JSON
          </Button>
          <pre className="cap-mono cap-scroll-slim max-h-[420px] overflow-auto rounded border-2 border-[var(--cap-border)] bg-[#0a1a2e] p-3 text-[0.78rem] leading-relaxed text-[#cfe6ff]">
            <code className="block w-max min-w-full whitespace-pre">{json}</code>
          </pre>
        </div>
      )}

      {/* ações do nó */}
      <div className="flex flex-wrap gap-1.5">
        {node.url && (
          <a href={node.url} target="_blank" rel="noopener noreferrer external">
            <Button size="sm" variant="outline">
              <ExternalLink className="mr-1 h-4 w-4" aria-hidden />
              Abrir origem
            </Button>
          </a>
        )}
        {node.type === 'dork' && (
          <>
            <a href={node.url} target="_blank" rel="noopener noreferrer external">
              <Button size="sm">Executar no Google</Button>
            </a>
            {node.meta?.url_bing && (
              <a href={String(node.meta.url_bing)} target="_blank" rel="noopener noreferrer external">
                <Button size="sm" variant="outline">Bing</Button>
              </a>
            )}
            {node.meta?.url_ddg && (
              <a href={String(node.meta.url_ddg)} target="_blank" rel="noopener noreferrer external">
                <Button size="sm" variant="outline">DuckDuckGo</Button>
              </a>
            )}
          </>
        )}
        {/* pares link_N_nome/url já são renderizados como linhas de link clicáveis acima */}
      </div>
    </div>
  )
}

/* ============ palco do grafo: canvas + overlays (reutilizado na tela cheia) ============ */

interface GraphStageProps {
  apiRef: { current: Osint3DApi | null }
  selectedId: string | null
  onSelect: (id: string | null) => void
  nodeCount: number
  scanning: boolean
  targetInfo: { kind: string; value: string } | null
  legend: { type: OsintType; count: number }[]
  className?: string
}

function GraphStage({
  apiRef,
  selectedId,
  onSelect,
  nodeCount,
  scanning,
  targetInfo,
  legend,
  className,
}: GraphStageProps): React.ReactElement {
  return (
    <div
      className={cn(
        'relative h-[72vh] min-h-[480px] overflow-hidden rounded-lg border-2 border-[#12314f] lg:h-[80vh] lg:min-h-[680px] xl:h-[84vh] xl:min-h-[760px]',
        className,
      )}
      style={{ background: 'radial-gradient(ellipse at 50% 35%, #0d2240 0%, #081726 55%, #050e1a 100%)' }}
    >
      <Safe3DBoundary title="Mapa OSINT">
        <OsintCanvas apiRef={apiRef} selectedId={selectedId} onSelect={onSelect} />
      </Safe3DBoundary>

      {/* overlay: alvo ativo */}
      {targetInfo && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[70%] rounded-md border-2 border-[#2b5e93] bg-[#08182e]/90 px-3 py-1.5">
          <p className="text-[0.8rem] font-bold uppercase tracking-wider text-[#7cb6ec]">alvo · {targetInfo.kind}</p>
          <p className="cap-mono break-all text-[1rem] font-bold text-[#eaf4ff]">{targetInfo.value}</p>
        </div>
      )}

      {/* overlay: estado vazio (+ skeletons durante a varredura) */}
      {nodeCount === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <EmptyStateArt />
          <p className="max-w-md text-[1rem] font-bold text-[#7cb6ec]">
            {scanning
              ? 'Consultando fontes públicas… os nós aparecerão aqui conforme forem descobertos.'
              : 'O grafo está vazio. Inicie um recon para ver a cadeia de dados se formar em 3D.'}
          </p>
          {scanning ? (
            <div className="flex w-full max-w-sm flex-col gap-2" aria-hidden>
              <Skeleton className="h-3 w-3/4 bg-[#164067]" />
              <Skeleton className="h-3 w-full bg-[#12314f]" />
              <Skeleton className="h-3 w-2/3 bg-[#164067]" />
            </div>
          ) : (
            <p className="max-w-md text-[0.9rem] text-[#54708f]">
              Cada orbe é uma entidade descoberta; cada linha, uma relação real entre elas.
            </p>
          )}
        </div>
      )}

      {/* overlay: legenda com contadores */}
      {legend.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 flex max-w-[75%] flex-wrap gap-1.5" aria-hidden>
          {legend.map((l) => (
            <span
              key={l.type}
              className="flex items-center gap-1 rounded-full border border-[#2b5e93] bg-[#08182e]/90 px-2 py-0.5 text-[0.78rem] font-bold text-[#cfe6ff]"
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: OSINT_TYPE_COLOR[l.type] }} />
              {OSINT_TYPE_LABEL[l.type]} · {l.count}
            </span>
          ))}
        </div>
      )}

      {/* overlay: controles de zoom / câmera */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1" role="group" aria-label="Controles de câmera do grafo">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 border-[#2b5e93] bg-[#08182e]/90 text-[#cfe6ff] hover:border-[#37c0fb] hover:bg-[#0d2240] hover:text-[#eaf4ff]"
          onClick={() => apiRef.current?.zoomIn()}
          aria-label="Aproxinar câmera"
          title="Aproximar"
        >
          <ZoomIn className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 border-[#2b5e93] bg-[#08182e]/90 text-[#cfe6ff] hover:border-[#37c0fb] hover:bg-[#0d2240] hover:text-[#eaf4ff]"
          onClick={() => apiRef.current?.zoomOut()}
          aria-label="Afastar câmera"
          title="Afastar"
        >
          <ZoomOut className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 border-[#2b5e93] bg-[#08182e]/90 text-[#cfe6ff] hover:border-[#37c0fb] hover:bg-[#0d2240] hover:text-[#eaf4ff]"
          onClick={() => apiRef.current?.resetView()}
          aria-label="Centralizar e resetar a câmera"
          title="Centralizar / resetar"
        >
          <Crosshair className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

/* ============ painel de módulos + resumo (rail desktop / aba mobile) ============ */

interface ModulesPanelProps {
  modules: Record<string, ModuleState>
  modulesOk: number
  modulesRun: number
  scanning: boolean
  railOpen: boolean
  onToggleRail: () => void
  summary: { nodes: number; edges: number; sec: number } | null
  lastScanAt: Date | null
  className?: string
}

const STATUS_LABEL: Record<ModuleStatus, string> = {
  idle: 'na fila',
  running: 'consultando…',
  done: 'concluído',
  error: 'erro',
  empty: 'sem resultados',
}

function ModulesPanel({
  modules,
  modulesOk,
  modulesRun,
  scanning,
  railOpen,
  onToggleRail,
  summary,
  lastScanAt,
  className,
}: ModulesPanelProps): React.ReactElement {
  const hasModules = Object.keys(modules).length > 0
  return (
    <section className={cn('cap-panel min-w-0 p-4', className)} aria-label="Módulos OSINT e resumo da varredura">
      <div className="mb-2 flex items-center gap-2">
        <Layers className="h-5 w-5 text-[var(--cap-cyan)]" aria-hidden />
        <h3 className="cap-heading">Módulos</h3>
        <span className="cap-mono cap-num rounded border-2 border-[var(--cap-border)] px-2 py-0.5 text-[0.8rem] font-bold text-[var(--cap-dim)]">
          {modulesOk}/{OSINT_MODULES.length}
          {modulesRun > 0 && <span className="ml-1 text-[#b45309]">· {modulesRun} rodando</span>}
        </span>
        <button
          type="button"
          onClick={onToggleRail}
          aria-expanded={railOpen}
          aria-controls="osint-rail-list"
          className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 border-[var(--cap-border)] text-[var(--cap-dim)] transition-colors hover:border-[var(--cap-cyan)] hover:text-[var(--cap-cyan)]"
          title={railOpen ? 'Recolher painel de módulos' : 'Expandir painel de módulos'}
        >
          {railOpen ? <ChevronLeft className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
          <span className="sr-only">{railOpen ? 'Recolher painel de módulos' : 'Expandir painel de módulos'}</span>
        </button>
      </div>

      {railOpen && (
        <div id="osint-rail-list" className="space-y-3">
          {hasModules ? (
            <ul className="cap-stagger divide-y divide-[var(--cap-border)] rounded border-2 border-[var(--cap-border)]">
              {OSINT_MODULES.map((m) => {
                const st = modules[m.id]?.status ?? 'idle'
                const info = modules[m.id]?.info
                const dot =
                  st === 'running'
                    ? 'bg-[#f5920b] animate-pulse'
                    : st === 'done'
                      ? 'bg-[#21a44a]'
                      : st === 'error'
                        ? 'bg-[#c0182b]'
                        : st === 'empty'
                          ? 'bg-[var(--cap-faint)]'
                          : 'bg-[var(--cap-border-strong)]'
                return (
                  <li key={m.id} className="flex items-start gap-2 px-2.5 py-1.5">
                    <span className={cn('mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.85rem] font-bold leading-snug text-[var(--cap-text)]">{m.label}</p>
                      {info && (
                        <p className={cn('break-all text-[0.78rem]', st === 'error' ? 'text-[#c0182b]' : 'text-[var(--cap-cyan)]')}>
                          {info}
                        </p>
                      )}
                    </div>
                    <span className="sr-only">status: {STATUS_LABEL[st]}</span>
                  </li>
                )
              })}
            </ul>
          ) : scanning ? (
            <div className="space-y-1.5" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ) : (
            <p className="rounded border-2 border-dashed border-[var(--cap-border)] p-3 text-center text-[0.85rem] text-[var(--cap-dim)]">
              Os módulos aparecem aqui assim que a varredura começar.
            </p>
          )}

          {/* resumo */}
          <div className="rounded border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-3">
            <p className="cap-heading text-[0.95rem]">Resumo da varredura</p>
            {summary ? (
              <p className="cap-mono cap-num mt-1 text-[0.85rem] text-[var(--cap-text)]">
                {summary.nodes} entidades · {summary.edges} conexões · {summary.sec}s
              </p>
            ) : scanning ? (
              <p className="mt-1 text-[0.85rem] text-[#b45309]">Varredura em andamento…</p>
            ) : (
              <p className="mt-1 text-[0.85rem] text-[var(--cap-dim)]">Nenhuma varredura nesta sessão.</p>
            )}
            {lastScanAt && (
              <p className="mt-1 flex items-center gap-1 text-[0.8rem] text-[var(--cap-dim)]">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Última varredura: {lastScanAt.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

/* ============ explorador de entidades por tipo ============ */

interface EntitiesPanelProps {
  grouped: Map<OsintType, OsintNode[]>
  selectedId: string | null
  onSelect: (id: string) => void
  nodeCount: number
  scanning: boolean
  modulesOk: number
  modulesRun: number
  className?: string
}

function EntitiesPanel({
  grouped,
  selectedId,
  onSelect,
  nodeCount,
  scanning,
  modulesOk,
  modulesRun,
  className,
}: EntitiesPanelProps): React.ReactElement {
  return (
    <section className={cn('cap-panel min-h-0 min-w-0 p-4', className)} aria-label="Entidades descobertas">
      <div className="mb-2 flex items-center gap-2">
        <Globe2 className="h-5 w-5 text-[var(--cap-cyan)]" aria-hidden />
        <h3 className="cap-heading">Entidades</h3>
        <span className="cap-mono cap-num ml-auto text-[0.85rem] font-bold text-[var(--cap-dim)]">
          {modulesOk}/{OSINT_MODULES.length} módulos
          {modulesRun > 0 && <span className="ml-1 text-[#b45309]">· {modulesRun} rodando</span>}
        </span>
      </div>
      {nodeCount === 0 ? (
        scanning ? (
          <div className="space-y-2 py-2" aria-hidden>
            <Skeleton className="h-4 w-1/3" />
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-24" />
              ))}
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-[0.95rem] text-[var(--cap-dim)]">Nenhuma entidade descoberta ainda.</p>
        )
      ) : (
        <ScrollArea className="max-h-[360px]">
          <div className="cap-stagger space-y-3 pr-2">
            {GROUP_ORDER.map((t) => {
              const list = grouped.get(t) ?? []
              if (!list.length) return null
              return (
                <div key={t}>
                  <p className="mb-1 flex items-center gap-1.5 text-[0.85rem] font-extrabold uppercase tracking-wider text-[var(--cap-dim)]">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: OSINT_TYPE_COLOR[t] }} aria-hidden />
                    {OSINT_TYPE_LABEL[t]}
                    <span className="cap-mono text-[var(--cap-faint)]">({list.length})</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {list.slice(0, 40).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => onSelect(n.id)}
                        className="cap-mono flex min-h-10 max-w-[240px] items-center rounded border-2 px-2.5 py-1 text-[0.85rem] font-bold transition-[transform,filter] hover:scale-105 hover:brightness-105"
                        style={{
                          borderColor: selectedId === n.id ? OSINT_TYPE_COLOR[t] : 'var(--cap-border)',
                          background: selectedId === n.id ? `${OSINT_TYPE_COLOR[t]}22` : 'var(--cap-panel-raised)',
                          color: 'var(--cap-text)',
                        }}
                        title={n.value}
                      >
                        <span className="truncate">{n.label}</span>
                      </button>
                    ))}
                    {list.length > 40 && (
                      <span className="cap-mono self-center text-[0.8rem] text-[var(--cap-faint)]">+{list.length - 40}…</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </section>
  )
}

/* ============ visão principal ============ */

type MobileTab = 'grafo' | 'modulos' | 'resultados'

export function OsintView() {
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [nodes, setNodes] = useState<Map<string, OsintNode>>(new Map())
  const [edges, setEdges] = useState<OsintEdge[]>([])
  const [modules, setModules] = useState<Record<string, ModuleState>>({})
  const [targetInfo, setTargetInfo] = useState<{ kind: string; value: string } | null>(null)
  const [summary, setSummary] = useState<{ nodes: number; edges: number; sec: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null)

  // layout / responsividade
  const [mobileTab, setMobileTab] = useState<MobileTab>('grafo')
  const [railOpen, setRailOpen] = useState(true)
  const isMobile = useMediaQuery('(max-width: 1023px)')

  // tela cheia (nativa, fallback webkit e CSS fixo)
  const [nativeFs, setNativeFs] = useState(false)
  const [cssFs, setCssFs] = useState(false)
  const [fsPanelOpen, setFsPanelOpen] = useState(true)
  const fsActive = nativeFs || cssFs

  const apiRef = useRef<Osint3DApi | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [stickyTop, setStickyTop] = useState(0)

  const kind = guessTargetKind(input)
  const selected = selectedId ? nodes.get(selectedId) ?? null : null

  /* ---- foco da câmera no nó selecionado ---- */
  useEffect(() => {
    apiRef.current?.focus(selectedId)
  }, [selectedId])

  /* ---- sincroniza estado nativo de tela cheia ---- */
  useEffect(() => {
    const sync = (): void => setNativeFs(!!fsElementNow())
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  /* ---- ESC fecha o modo CSS (fallback); nativo já sai sozinho ---- */
  useEffect(() => {
    if (!cssFs) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setCssFs(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cssFs])

  /* ---- tecla "/" foca a busca ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ---- offset da barra de busca fixa no mobile (abaixo do header do app) ---- */
  useEffect(() => {
    if (fsActive) return
    const header = document.querySelector('header')
    if (!header) return
    const update = (): void => setStickyTop(header.getBoundingClientRect().bottom)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [fsActive])

  /* ---- ao selecionar na tela cheia, abre o painel flutuante ---- */
  useEffect(() => {
    if (selectedId) setFsPanelOpen(true)
  }, [selectedId])

  const handleEvent = useCallback(
    (ev: OsintEvent) => {
      switch (ev.t) {
        case 'modules': {
          const init: Record<string, ModuleState> = {}
          for (const m of ev.modules) init[m.id] = { status: 'idle' }
          setModules(init)
          break
        }
        case 'module': {
          setModules((cur) => ({ ...cur, [ev.id]: { status: ev.status, info: ev.info } }))
          break
        }
        case 'target':
          setTargetInfo({ kind: ev.kind, value: ev.value })
          break
        case 'node': {
          apiRef.current?.addNode(ev.node)
          setNodes((cur) => {
            if (cur.has(ev.node.id)) return cur
            const next = new Map(cur)
            next.set(ev.node.id, ev.node)
            return next
          })
          break
        }
        case 'edge': {
          apiRef.current?.addEdge(ev.edge)
          setEdges((cur) => (cur.length >= 900 ? cur : [...cur, ev.edge]))
          break
        }
        case 'done': {
          setSummary(ev.summary)
          setScanning(false)
          setLastScanAt(new Date())
          if (ev.summary.nodes > 0) {
            markLegacy('osint')
            toast({
              title: 'Varredura concluída',
              description: `${ev.summary.nodes} entidades · ${ev.summary.edges} conexões · ${ev.summary.sec}s`,
            })
          } else {
            toast({
              title: 'Nada encontrado',
              description: 'As fontes públicas não retornaram dados para este alvo.',
              variant: 'destructive',
            })
          }
          break
        }
      }
    },
    [toast],
  )

  const startScan = useCallback(async () => {
    if (!kind || scanning) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setScanning(true)
    setNodes(new Map())
    setEdges([])
    setModules({})
    setTargetInfo(null)
    setSummary(null)
    setSelectedId(null)
    setMobileTab('grafo')
    apiRef.current?.reset()

    try {
      const res = await fetch('/api/osint/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ target: input.trim() }),
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? `Falha HTTP ${res.status}`)
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        let nl: number
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim()
          buf = buf.slice(nl + 1)
          if (!line) continue
          try {
            handleEvent(JSON.parse(line) as OsintEvent)
          } catch {
            /* linha parcial ignorada */
          }
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        toast({ title: 'Varredura cancelada', description: 'O recon em andamento foi interrompido.' })
      } else {
        toast({
          title: 'Erro na varredura',
          description: e instanceof Error ? e.message : 'Falha inesperada no motor OSINT.',
          variant: 'destructive',
        })
      }
    } finally {
      setScanning(false)
    }
  }, [handleEvent, input, kind, scanning, toast])

  const cancelScan = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const copyText = useCallback(
    async (text: string, title = 'Copiado para a área de transferência') => {
      try {
        await navigator.clipboard.writeText(text)
        toast({ title, description: 'O conteúdo completo está na sua área de transferência.' })
      } catch {
        toast({
          title: 'Não foi possível copiar',
          description: 'Seu navegador bloqueou o acesso à área de transferência.',
          variant: 'destructive',
        })
      }
    },
    [toast],
  )

  const exportJson = useCallback(() => {
    const report = {
      ferramenta: 'CAPYBER OSINT',
      alvo: targetInfo,
      gerado_em: new Date().toISOString(),
      resumo: summary ?? { nos: nodes.size, conexoes: edges.length },
      entidades: [...nodes.values()],
      conexoes: edges,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `osint-${(targetInfo?.value ?? 'relatorio').replace(/[^a-z0-9.-]/gi, '_')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast({ title: 'Relatório exportado', description: 'O arquivo JSON com a varredura completa foi baixado.' })
  }, [edges, nodes, summary, targetInfo, toast])

  /* ---- alternar tela cheia: nativa → webkit → CSS fixo ---- */
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current as FsElement | null
    if (!el) return
    if (fsElementNow()) {
      const d = document as FsDocument
      if (typeof d.exitFullscreen === 'function') {
        void d.exitFullscreen().catch(() => setNativeFs(false))
      } else if (typeof d.webkitExitFullscreen === 'function') {
        d.webkitExitFullscreen()
      } else {
        setNativeFs(false)
      }
      return
    }
    setFsPanelOpen(true)
    if (typeof el.requestFullscreen === 'function') {
      el.requestFullscreen().catch(() => setCssFs(true))
    } else if (typeof el.webkitRequestFullscreen === 'function') {
      try {
        void el.webkitRequestFullscreen()
      } catch {
        setCssFs(true)
      }
    } else {
      setCssFs(true)
    }
  }, [])

  const grouped = useMemo(() => {
    const groups = new Map<OsintType, OsintNode[]>()
    for (const t of GROUP_ORDER) groups.set(t, [])
    for (const n of nodes.values()) {
      const arr = groups.get(n.type)
      if (arr) arr.push(n)
    }
    return groups
  }, [nodes])

  const legend = useMemo(
    () => GROUP_ORDER.filter((t) => (grouped.get(t)?.length ?? 0) > 0).map((t) => ({ type: t, count: grouped.get(t)?.length ?? 0 })),
    [grouped],
  )

  const modulesOk = Object.values(modules).filter((m) => m.status === 'done').length
  const modulesRun = Object.values(modules).filter((m) => m.status === 'running').length
  const showMobileChips = scanning || Object.keys(modules).length > 0

  const handleSelectFromList = useCallback((id: string) => setSelectedId(id), [])

  /* ============ TELA CHEIA ============ */
  if (fsActive) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#081726]"
        aria-label="Mapa OSINT em tela cheia"
      >
        {/* barra mínima: sair, contadores, nó selecionado */}
        <header className="flex flex-wrap items-center gap-2 border-b-2 border-[#12314f] bg-[#081726] px-3 py-2 sm:px-4">
          <Radar className="h-5 w-5 shrink-0 text-[#37c0fb]" aria-hidden />
          <h2 className="cap-heading text-[1rem] text-[#eaf4ff]">Mapa OSINT · Tela cheia</h2>
          <span className="cap-mono cap-num rounded border-2 border-[#2b5e93] px-2 py-0.5 text-[0.8rem] font-bold text-[#7cb6ec]">
            {nodes.size} entidades · {edges.length} conexões
          </span>
          {scanning && (
            <span className="flex items-center gap-1.5 rounded-full border-2 border-[#f5920b] bg-[#f5920b14] px-3 py-0.5 text-[0.8rem] font-extrabold text-[#ffb24d]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> VARRENDO…
            </span>
          )}
          {selected && (
            <button
              type="button"
              onClick={() => setFsPanelOpen((v) => !v)}
              aria-expanded={fsPanelOpen}
              className="cap-mono flex min-h-10 max-w-[220px] items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-[0.8rem] font-bold sm:max-w-[280px]"
              style={{ borderColor: OSINT_TYPE_COLOR[selected.type], color: OSINT_TYPE_COLOR[selected.type] }}
              title={fsPanelOpen ? 'Ocultar inspector flutuante' : 'Mostrar inspector flutuante'}
            >
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: OSINT_TYPE_COLOR[selected.type] }} aria-hidden />
              <span className="truncate">{selected.label}</span>
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {nodes.size > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={exportJson}
                className="border-[#2b5e93] bg-[#0d2240] text-[#cfe6ff] hover:bg-[#12314f] hover:text-[#eaf4ff]"
                title="Baixar relatório JSON"
              >
                <FileJson className="mr-1 h-4 w-4" aria-hidden /> JSON
              </Button>
            )}
            <Button type="button" size="sm" onClick={toggleFullscreen}>
              <Minimize2 className="mr-1 h-4 w-4" aria-hidden /> Sair da tela cheia
            </Button>
          </div>
        </header>

        {/* grafo em tela cheia + inspector flutuante opcional */}
        <div className="relative flex min-h-0 flex-1">
          <GraphStage
            apiRef={apiRef}
            selectedId={selectedId}
            onSelect={setSelectedId}
            nodeCount={nodes.size}
            scanning={scanning}
            targetInfo={targetInfo}
            legend={legend}
            className="h-auto min-h-0 flex-1 rounded-none border-0 lg:h-auto xl:h-auto"
          />
          {selected && fsPanelOpen && (
            <div className={cn('absolute z-30', isMobile ? 'inset-x-2 bottom-3 max-h-[55%]' : 'bottom-3 right-3 top-3 w-[370px]')}>
              <div className="cap-panel flex h-full flex-col overflow-hidden rounded-lg border-2 border-[#2b5e93] p-3 shadow-2xl">
                <div className="mb-2 flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-[var(--cap-cyan)]" aria-hidden />
                  <h3 className="cap-heading">Inspector</h3>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="ml-auto h-7 w-7"
                    onClick={() => setFsPanelOpen(false)}
                    aria-label="Fechar inspector flutuante"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
                <div className="cap-scroll-slim min-h-0 flex-1 overflow-y-auto pr-1">
                  <InspectorContent node={selected} onCopy={copyText} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ============ LAYOUT NORMAL ============ */
  return (
    <div ref={containerRef} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[270px_minmax(0,1fr)_340px] xl:grid-cols-[290px_minmax(0,1fr)_360px] lg:items-start">
        {/* ===== busca (fixa no topo do mobile, primeiro bloco do rail no desktop) ===== */}
        <section
          className="cap-panel p-4 lg:col-start-1 lg:row-start-1"
          style={{ top: `${stickyTop}px` }}
          aria-label="Buscar alvo OSINT"
        >
          <div className="flex items-center gap-2">
            <Radar className="h-6 w-6 text-[var(--cap-cyan)]" aria-hidden />
            <h2 className="cap-heading text-[1.2rem]">Mapa OSINT · Cadeia de Dados 3D</h2>
          </div>
          <p className="mt-1 hidden text-[0.9rem] leading-relaxed text-[var(--cap-text)] lg:block">
            Informe um <strong>domínio</strong>, <strong>IP</strong>, <strong>e-mail</strong> ou <strong>@usuário</strong>. O motor executa
            transforms OSINT reais encadeados — cert-transparency → subdomínios → DNS → IPs → ASN/geo → rDNS → e-mails → vazamentos — e o
            gerador de <em>Google Dorks</em>, tudo conectado numa cadeia de dados 3D.
          </p>

          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              void startScan()
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--cap-faint)]" aria-hidden />
              <Input
                ref={searchRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ex.: torproject.org · 8.8.8.8 · @torvalds"
                className="cap-input cap-mono h-11 pl-10 pr-10 text-[1rem]"
                spellCheck={false}
                autoComplete="off"
                aria-label="Alvo da varredura OSINT"
                data-tut="osint-search"
              />
              <kbd
                className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border-2 border-[var(--cap-border)] px-1.5 py-0.5 text-[0.7rem] font-bold text-[var(--cap-faint)] md:block"
                aria-hidden
              >
                /
              </kbd>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="cap-mono rounded border-2 border-[var(--cap-border-strong)] px-2 py-1 text-[0.85rem] font-bold"
                style={{ color: kind ? 'var(--cap-cyan)' : 'var(--cap-faint)' }}
                aria-live="polite"
              >
                {kind ? `alvo: ${kind}` : 'alvo: —'}
              </span>
              {scanning ? (
                <Button type="button" variant="destructive" className="h-11" onClick={cancelScan}>
                  <CircleStop className="mr-1 h-5 w-5" aria-hidden /> Parar
                </Button>
              ) : (
                <Button type="submit" className="h-11" disabled={!kind}>
                  {nodes.size > 0 ? <Search className="mr-1 h-5 w-5" aria-hidden /> : <Radar className="mr-1 h-5 w-5" aria-hidden />}
                  {nodes.size > 0 ? 'Nova varredura' : 'Iniciar recon'}
                </Button>
              )}
              {nodes.size > 0 && (
                <Button type="button" variant="outline" className="h-11" onClick={exportJson} title="Baixar relatório JSON">
                  <FileJson className="mr-1 h-5 w-5" aria-hidden /> JSON
                </Button>
              )}
            </div>
          </form>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[0.85rem] font-bold text-[var(--cap-faint)]">exemplos:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setInput(ex)}
                className="cap-mono inline-flex min-h-10 items-center rounded border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-2.5 py-1 text-[0.85rem] font-bold text-[var(--cap-text)] transition-colors hover:border-[var(--cap-cyan)] hover:text-[var(--cap-cyan)]"
              >
                {ex}
              </button>
            ))}
          </div>

          <span className="cap-mono mt-2 hidden rounded border-2 border-[var(--cap-border-strong)] px-2 py-0.5 text-[0.8rem] font-bold text-[var(--cap-dim)] lg:inline-block">
            fontes públicas reais · sem API key
          </span>
        </section>

        {/* ===== abas (somente mobile) ===== */}
        <div className="lg:hidden">
          <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as MobileTab)}>
            <TabsList className="h-11 w-full grid grid-cols-3 rounded-lg border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)]">
              <TabsTrigger value="grafo" className="gap-1.5 font-bold">
                <Network className="h-4 w-4" aria-hidden /> Grafo
              </TabsTrigger>
              <TabsTrigger value="modulos" className="gap-1.5 font-bold">
                <Layers className="h-4 w-4" aria-hidden /> Módulos
              </TabsTrigger>
              <TabsTrigger value="resultados" className="gap-1.5 font-bold">
                <Globe2 className="h-4 w-4" aria-hidden /> Resultados
                {nodes.size > 0 && (
                  <span className="cap-mono ml-0.5 rounded-full bg-[var(--cap-cyan)] px-1.5 text-[0.7rem] font-extrabold text-[#04101f]">
                    {nodes.size}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ===== chips de módulos em rolagem horizontal (mobile) ===== */}
        {showMobileChips && (
          <div
            className="cap-fade-x cap-scroll-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden"
            role="group"
            aria-label="Status dos módulos OSINT"
          >
            {OSINT_MODULES.map((m) => {
              const st = modules[m.id]?.status ?? 'idle'
              const dot =
                st === 'running'
                  ? 'bg-[#f5920b] animate-pulse'
                  : st === 'done'
                    ? 'bg-[#21a44a]'
                    : st === 'error'
                      ? 'bg-[#c0182b]'
                      : st === 'empty'
                        ? 'bg-[var(--cap-faint)]'
                        : 'bg-[var(--cap-border-strong)]'
              return (
                <span
                  key={m.id}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] px-2.5 py-0.5 text-[0.8rem] font-bold text-[var(--cap-text)]"
                  title={modules[m.id]?.info ?? m.label}
                >
                  <span className={cn('inline-block h-2 w-2 rounded-full', dot)} aria-hidden />
                  {m.label.split('·')[0]?.trim() ?? m.label}
                </span>
              )
            })}
          </div>
        )}

        {/* ===== grafo 3D (sempre no desktop; aba "Grafo" no mobile) ===== */}
        <section
          className={cn(
            'cap-panel min-w-0 p-4 lg:col-start-2 lg:row-span-2 lg:row-start-1',
            mobileTab !== 'grafo' && 'max-lg:hidden',
          )}
          aria-label="Mapa 3D da cadeia de dados"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Network className="h-5 w-5 text-[var(--cap-cyan)]" aria-hidden />
            <h3 className="cap-heading">Grafo 3D · cadeia de dados</h3>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {lastScanAt && (
                <span
                  className="cap-mono hidden items-center gap-1 text-[0.8rem] text-[var(--cap-faint)] md:flex"
                  title={`Última varredura concluída em ${lastScanAt.toLocaleString('pt-BR')}`}
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {lastScanAt.toLocaleTimeString('pt-BR')}
                </span>
              )}
              {scanning && (
                <span className="flex items-center gap-1.5 rounded-full border-2 border-[#f5920b] bg-[#f5920b14] px-3 py-0.5 text-[0.85rem] font-extrabold text-[#b45309]">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> VARRENDO…
                </span>
              )}
              <span className="cap-mono cap-num rounded border-2 border-[var(--cap-border)] px-2 py-0.5 text-[0.85rem] font-bold text-[var(--cap-dim)]">
                {nodes.size} entidades · {edges.length} conexões
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={toggleFullscreen}
                aria-pressed={fsActive}
                title="Alternar tela cheia (o navegador também sai com ESC)"
              >
                <Maximize2 className="mr-1 h-4 w-4" aria-hidden /> Tela cheia
              </Button>
            </div>
          </div>

          <GraphStage
            apiRef={apiRef}
            selectedId={selectedId}
            onSelect={setSelectedId}
            nodeCount={nodes.size}
            scanning={scanning}
            targetInfo={targetInfo}
            legend={legend}
          />

          <p className="mt-2 text-[0.85rem] text-[var(--cap-faint)]">
            Arraste para girar · scroll para zoom · clique num orbe para investigar · clique fora para limpar a seleção · tecla “/” foca a
            busca.
          </p>
        </section>

        {/* ===== rail de módulos + resumo (desktop sempre; aba "Módulos" no mobile) ===== */}
        <ModulesPanel
          modules={modules}
          modulesOk={modulesOk}
          modulesRun={modulesRun}
          scanning={scanning}
          railOpen={railOpen}
          onToggleRail={() => setRailOpen((v) => !v)}
          summary={summary}
          lastScanAt={lastScanAt}
          className={cn('lg:col-start-1 lg:row-start-2', mobileTab !== 'modulos' && 'max-lg:hidden')}
        />

        {/* ===== coluna direita: inspector (desktop) + entidades ===== */}
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <section className="cap-panel p-4 max-lg:hidden" aria-label="Inspector do nó selecionado">
            <div className="mb-2 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-[var(--cap-cyan)]" aria-hidden />
              <h3 className="cap-heading">Inspector</h3>
              {selected && (
                <span className="cap-mono ml-auto text-[0.85rem] font-bold text-[var(--cap-dim)]">
                  {Object.keys(selected.meta ?? {}).length} campos
                </span>
              )}
            </div>
            {!selected ? (
              <p className="py-6 text-center text-[0.95rem] text-[var(--cap-dim)]">
                Selecione um nó no mapa 3D (ou na lista de entidades) para ver <strong>todos</strong> os dados coletados — nada é
                truncado.
              </p>
            ) : (
              <InspectorContent node={selected} onCopy={copyText} />
            )}
          </section>

          <EntitiesPanel
            grouped={grouped}
            selectedId={selectedId}
            onSelect={handleSelectFromList}
            nodeCount={nodes.size}
            scanning={scanning}
            modulesOk={modulesOk}
            modulesRun={modulesRun}
            className={cn(mobileTab !== 'resultados' && 'max-lg:hidden')}
          />
        </div>
      </div>

      {/* inspector em bottom sheet (mobile) — portal, funciona acima de tudo */}
      {isMobile && selected && (
        <Drawer
          open={!fsActive}
          onOpenChange={(o) => {
            if (!o) setSelectedId(null)
          }}
        >
          <DrawerContent className="h-[70vh]" aria-describedby={undefined}>
            <DrawerHeader className="p-4 pb-2 text-left">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 shrink-0 text-[var(--cap-cyan)]" aria-hidden />
                <DrawerTitle className="cap-heading truncate text-[1rem]">
                  Inspector · {OSINT_TYPE_LABEL[selected.type]}
                </DrawerTitle>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="ml-auto h-8 w-8 shrink-0"
                  onClick={() => setSelectedId(null)}
                  aria-label="Fechar inspector"
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <DrawerDescription className="sr-only">
                Dados completos da entidade selecionada no grafo OSINT.
              </DrawerDescription>
            </DrawerHeader>
            <div className="cap-scroll-slim min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              <InspectorContent node={selected} onCopy={copyText} />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <p className="px-1 text-[0.85rem] leading-relaxed text-[var(--cap-faint)]">
        <Download className="mr-1 inline h-4 w-4" aria-hidden />
        <strong>Uso responsável:</strong> recon restrito a fontes públicas, para defesa e educação. Consulte apenas alvos
        que você tem autorização para investigar; respeite os termos de cada fonte (crt.sh, Wayback, HackerTarget, ip-api,
        XposedOrNot, Gravatar, GitHub, Reddit) e a LGPD. APIs que exigem chave (Shodan, VirusTotal, HaveIBeenPwned) são
        disponibilizadas como links prontos no inspector.
      </p>
    </div>
  )
}
