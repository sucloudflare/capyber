'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import {
  AArrowDown,
  AArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Flag,
  ListTree,
  Maximize2,
  Minimize2,
  Search,
  Shield,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { BOOK_CHAPTERS, BOOK_PAGES } from '@/lib/book-content'

const TOTAL = BOOK_PAGES.length
const FLIP_DURATION = 0.7 // segundos
const FLIP_EASE: [number, number, number, number] = [0.32, 0.02, 0.28, 1]

/** Chaves de localStorage usadas pelo Códice. */
export const BOOK_LS = {
  last: 'capy_book_last',
  max: 'capy_book_max',
  marks: 'capy_book_marks',
  notes: 'capy_book_notes',
} as const

/** Evento custom disparado quando marcadores/anotações mudam. */
export const BOOK_STORE_EVENT = 'capy-book-store'

// ------------------------------------------------------------
// helpers de storage (sempre guardados por typeof window)
// ------------------------------------------------------------

function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota/desabilitado — ignora */
  }
}

/** true se a página index inicia uma nova seção (para drop cap). */
function startsSection(index: number): boolean {
  if (index <= 0) return true
  const a = BOOK_PAGES[index - 1]
  const b = BOOK_PAGES[index]
  return a.chapter !== b.chapter || a.section !== b.section
}

// ------------------------------------------------------------
// Página (memorizada) — pergaminho, serifas, drop cap, cabeçalho
// ------------------------------------------------------------

type Side = 'left' | 'right' | 'single'

interface PageFaceProps {
  index: number
  side: Side
  fontScale: number
  hasNote: boolean
  marked: boolean
}

const PageFace = memo(function PageFace({ index, side, fontScale, hasNote, marked }: PageFaceProps) {
  const page = BOOK_PAGES[index]
  if (!page) return null
  const drop = startsSection(index)
  const overline =
    page.chapter === 98 ? 'Glossário' : page.chapter === 99 ? 'Apêndice' : `Capítulo ${page.chapter} · ${page.chapterTitle}`

  return (
    <div
      className={cn(
        'cb3d-page cb3d-noise',
        side === 'left' && 'cb3d-page-left',
        side === 'right' && 'cb3d-page-right',
        side === 'single' && 'cb3d-page-single',
      )}
      style={{ '--cb3d-fs': String(fontScale) } as React.CSSProperties}
      aria-hidden={false}
    >
      <div className="cb3d-pagepad">
        <div className="cb3d-runhead">
          <span className="cb3d-runline" aria-hidden />
          <span className="cb3d-runtext">{page.chapterTitle}</span>
          <span className="cb3d-runline cb3d-runline-r" aria-hidden />
        </div>
        <div className="cb3d-overline">{overline}</div>
        <h3 className="cb3d-section">{page.section}</h3>

        {page.paras.map((p, i) =>
          drop && i === 0 ? (
            <p key={i} className="cb3d-para">
              <span aria-hidden className="cb3d-dropcap">
                {p.slice(0, 1)}
              </span>
              {p.slice(1)}
            </p>
          ) : (
            <p key={i} className="cb3d-para">
              {p}
            </p>
          ),
        )}

        {page.list && page.list.length > 0 && (
          <ul className="cb3d-ul">
            {page.list.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}

        {page.callout && (
          <div className="cb3d-callout">
            <div className="cb3d-callout-title">{page.callout.title}</div>
            <p className="cb3d-callout-text">{page.callout.text}</p>
          </div>
        )}
      </div>

      <div className="cb3d-foot">
        <span className={cn('cb3d-pagenum', side === 'left' ? 'cb3d-pagenum-l' : 'cb3d-pagenum-r')}>
          {index + 1}
          {hasNote && <StickyNote size={13} aria-label="Página com anotação" />}
        </span>
      </div>

      {marked && <span aria-hidden className={cn('cb3d-ribbon', side === 'left' ? 'cb3d-ribbon-l' : 'cb3d-ribbon-r')} />}
    </div>
  )
})

// ------------------------------------------------------------
// CSS 3D do livro (couro, pergaminho, fólio, sombras de vinco)
// ------------------------------------------------------------

const CSS = `
.cb3d-stage { width:100%; perspective:2400px; perspective-origin:50% 42%; }
.cb3d-book {
  position:relative; margin:0 auto;
  width:min(100%, calc(78vh * 1.42));
  aspect-ratio:2/1.42;
  transform-style:preserve-3d;
}
.cb3d-book.cb3d-mobile { width:min(100%, calc(64vh * 0.78)); aspect-ratio:3/4.05; }

.cb3d-backcover {
  position:absolute; left:50%; right:-3px; top:5px; bottom:0;
  border-radius:4px 14px 14px 4px;
  background:linear-gradient(152deg,#182c4d,#0d1930 60%,#12203a);
  transform:translateZ(-16px);
  box-shadow:0 36px 60px -24px rgba(6,18,38,.6);
}
.cb3d-backcover-l {
  position:absolute; left:-3px; right:50%; top:5px; bottom:0;
  border-radius:14px 4px 4px 14px;
  background:linear-gradient(208deg,#182c4d,#0d1930 60%,#12203a);
  transform:translateZ(-16px);
}

.cb3d-foreedge { position:absolute; top:9px; bottom:9px; width:12px; z-index:4; border-radius:2px;
  background:repeating-linear-gradient(90deg,#efe4c8 0 1.5px,#d8c69e 1.5px 3px); }
.cb3d-foreedge-r { right:-10px; box-shadow:2px 3px 8px rgba(16,49,92,.28); }
.cb3d-foreedge-l { left:-10px; box-shadow:-2px 3px 8px rgba(16,49,92,.28);
  background:repeating-linear-gradient(-90deg,#efe4c8 0 1.5px,#d8c69e 1.5px 3px); }

.cb3d-page {
  position:absolute; top:0; bottom:0; z-index:10; overflow:hidden;
  font-family:Georgia,'Iowan Old Style','Palatino Linotype','Book Antiqua',serif;
  color:#43331a;
  background:
    radial-gradient(90% 60% at 8% 8%, rgba(255,255,255,.5), transparent 55%),
    radial-gradient(70% 55% at 92% 90%, rgba(164,120,52,.12), transparent 60%),
    linear-gradient(100deg,#faf3e0 0%,#f6edd4 48%,#f0e2bf 100%);
}
.cb3d-page-left { left:0; width:50%; border-radius:8px 2px 2px 8px;
  box-shadow:inset -26px 0 32px -22px rgba(90,55,10,.55), inset 3px 0 8px rgba(255,255,255,.55), 0 3px 10px rgba(16,49,92,.14); }
.cb3d-page-right { left:50%; width:50%; border-radius:2px 8px 8px 2px;
  box-shadow:inset 26px 0 32px -22px rgba(90,55,10,.55), inset -3px 0 8px rgba(255,255,255,.55), 0 3px 10px rgba(16,49,92,.14); }
.cb3d-page-single { left:0; width:100%; border-radius:10px;
  box-shadow:inset 22px 0 30px -22px rgba(90,55,10,.4), inset -22px 0 30px -22px rgba(90,55,10,.4), 0 3px 10px rgba(16,49,92,.14); }

.cb3d-noise::after { content:''; position:absolute; inset:0; pointer-events:none; z-index:2;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E"); }

.cb3d-pagepad { position:absolute; inset:0; z-index:1; overflow:hidden; padding:1.5rem 1.8rem 2.5rem; }
.cb3d-page-left .cb3d-pagepad { padding-right:2.3rem; }
.cb3d-page-right .cb3d-pagepad { padding-left:2.3rem; }

.cb3d-runhead { display:flex; align-items:center; gap:.6rem; margin-bottom:.65rem; }
.cb3d-runline { flex:1; height:1px; background:linear-gradient(90deg,transparent,rgba(160,118,39,.5)); }
.cb3d-runline-r { background:linear-gradient(90deg,rgba(160,118,39,.5),transparent); }
.cb3d-runtext { font-size:calc(.58rem * var(--cb3d-fs,1)); letter-spacing:.16em; text-transform:uppercase; color:#8a6a35;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:72%; }
.cb3d-overline { font-size:calc(.58rem * var(--cb3d-fs,1)); letter-spacing:.2em; text-transform:uppercase; color:#a07627; font-weight:700; }
.cb3d-section { font-size:calc(1.14rem * var(--cb3d-fs,1)); color:#5c3d10; margin:.12rem 0 .5rem; font-weight:700; }
.cb3d-para { font-size:calc(.855rem * var(--cb3d-fs,1)); line-height:1.6; margin:0 0 .65rem; text-align:justify; hyphens:auto; }
.cb3d-dropcap { float:left; font-size:3em; line-height:.8; padding:.05em .1em 0 0; font-weight:700; color:#8a5a12; text-shadow:0 1px 0 rgba(255,255,255,.5); }
.cb3d-ul { margin:.05rem 0 .55rem; padding:0; list-style:none; }
.cb3d-ul li { position:relative; padding-left:1.05rem; font-size:calc(.82rem * var(--cb3d-fs,1)); line-height:1.5; margin-bottom:.3rem; }
.cb3d-ul li::before { content:'\\25B8'; position:absolute; left:0; color:#b8842c; }
.cb3d-callout { margin-top:.55rem; border:1px solid rgba(160,118,39,.45); border-radius:8px; padding:.6rem .75rem;
  background:linear-gradient(180deg,rgba(245,215,140,.34),rgba(245,215,140,.14)); }
.cb3d-callout-title { font-size:calc(.6rem * var(--cb3d-fs,1)); letter-spacing:.18em; font-weight:800; color:#8a5a12; }
.cb3d-callout-text { font-size:calc(.8rem * var(--cb3d-fs,1)); line-height:1.5; margin-top:.22rem; color:#4c3a1c; }

.cb3d-foot { position:absolute; left:0; right:0; bottom:0; height:2.1rem; display:flex; align-items:center; padding:0 1.8rem; pointer-events:none; z-index:3; }
.cb3d-pagenum { font-family:Georgia,serif; font-size:calc(.72rem * var(--cb3d-fs,1)); color:#8a6a35; display:inline-flex; align-items:center; gap:.35rem; }
.cb3d-pagenum-l { margin-right:auto; }
.cb3d-pagenum-r { margin-left:auto; }

.cb3d-ribbon { position:absolute; top:0; width:22px; height:34px; z-index:3;
  background:linear-gradient(180deg,#f5920b,#d97e06);
  clip-path:polygon(0 0,100% 0,100% 100%,50% 74%,0 100%);
  box-shadow:0 2px 4px rgba(0,0,0,.25); }
.cb3d-ribbon-l { left:34px; }
.cb3d-ribbon-r { right:34px; }

.cb3d-gutter { position:absolute; left:50%; top:0; bottom:0; width:58px; transform:translateX(-50%);
  background:linear-gradient(90deg,transparent 0%,rgba(90,55,10,.16) 32%,rgba(60,35,8,.34) 50%,rgba(90,55,10,.16) 68%,transparent 100%);
  z-index:26; pointer-events:none; }

.cb3d-sheet { position:absolute; left:50%; top:0; bottom:0; width:50%;
  transform-origin:left center; transform-style:preserve-3d; z-index:30; }
.cb3d-face { position:absolute; inset:0; overflow:hidden;
  backface-visibility:hidden; -webkit-backface-visibility:hidden; }
.cb3d-face-front { border-radius:2px 8px 8px 2px; }
.cb3d-face-back { transform:rotateY(180deg); border-radius:8px 2px 2px 8px; }
.cb3d-shade { position:absolute; inset:0; pointer-events:none; z-index:5; }
.cb3d-shade-front { background:linear-gradient(to right,rgba(56,34,6,.5),rgba(56,34,6,0) 58%); }
.cb3d-shade-back { background:linear-gradient(to left,rgba(56,34,6,.5),rgba(56,34,6,0) 58%); }

.cb3d-coverwrap { position:absolute; left:50%; top:0; bottom:0; width:50%; z-index:50;
  transform-style:preserve-3d; cursor:pointer; }
.cb3d-coverface { position:absolute; inset:0; transform-origin:left center;
  backface-visibility:hidden; -webkit-backface-visibility:hidden;
  border-radius:8px 14px 14px 8px;
  background:
    radial-gradient(130% 150% at 18% -10%, rgba(120,160,220,.18), transparent 50%),
    repeating-linear-gradient(48deg, rgba(255,255,255,.016) 0 2px, transparent 2px 6px),
    repeating-linear-gradient(-48deg, rgba(0,0,0,.055) 0 3px, transparent 3px 8px),
    linear-gradient(152deg,#1d3357 0%,#16283f 46%,#0d1a2e 100%);
  box-shadow:inset 0 0 0 1px rgba(246,212,124,.18), inset 0 0 44px rgba(0,0,0,.5),
    0 30px 60px -20px rgba(6,18,38,.65), 0 10px 22px -10px rgba(6,18,38,.55); }
.cb3d-coverface:focus-visible { outline:2px solid #e9b64e; outline-offset:3px; }
.cb3d-coverframe { position:absolute; inset:13px; border:1.5px solid rgba(233,182,78,.5); border-radius:9px;
  box-shadow:inset 0 0 0 4px rgba(233,182,78,.1), inset 0 0 30px rgba(0,0,0,.4); pointer-events:none; }
.cb3d-spine { position:absolute; left:0; top:0; bottom:0; width:30px; border-radius:8px 0 0 8px;
  background:linear-gradient(90deg,rgba(0,0,0,.6),rgba(255,255,255,.05) 55%,transparent); pointer-events:none; }
.cb3d-coverbody { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:.55rem; padding-left:34px; padding-right:16px; text-align:center; }
.cb3d-gold { background:linear-gradient(180deg,#f8dc8a 0%,#e9b64e 45%,#c08c2e 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
.cb3d-covertitle { font-family:Georgia,'Times New Roman',serif; font-size:clamp(1.45rem,3.2vw,2.35rem); font-weight:900;
  letter-spacing:.16em; line-height:1.14; text-shadow:0 2px 3px rgba(0,0,0,.45); }
.cb3d-coversub { font-size:clamp(.5rem,1vw,.62rem); letter-spacing:.28em; color:rgba(246,212,124,.78); font-weight:700; }
.cb3d-coverrule { width:84px; height:1px; background:linear-gradient(90deg,transparent,rgba(233,182,78,.7),transparent); margin:.3rem 0; }
.cb3d-emblem { width:46px; height:46px; border-radius:9999px; border:1.5px solid rgba(233,182,78,.6);
  display:flex; align-items:center; justify-content:center; color:#e9b64e;
  box-shadow:inset 0 0 12px rgba(0,0,0,.4), 0 0 0 4px rgba(233,182,78,.07);
  background:radial-gradient(60% 60% at 50% 35%, rgba(233,182,78,.12), transparent); }
.cb3d-coverhint { margin-top:.35rem; font-size:.55rem; letter-spacing:.32em; color:rgba(246,212,124,.55);
  animation:cb3d-pulse 2.2s ease-in-out infinite; }
@keyframes cb3d-pulse { 0%,100%{opacity:.45} 50%{opacity:1} }

.cb3d-edgezone { position:absolute; top:0; bottom:0; width:52px; z-index:40; cursor:pointer; background:transparent; border:0; padding:0; }
.cb3d-edgezone-r { right:0; }
.cb3d-edgezone-l { left:0; }
.cb3d-edgezone:focus-visible { outline:2px solid #2569b8; outline-offset:-2px; border-radius:8px; }
.cb3d-peel { position:absolute; top:0; bottom:0; width:100%; opacity:0; pointer-events:none;
  transition:opacity .22s ease, transform .22s ease; }
.cb3d-peel-r { right:0; transform-origin:left center;
  background:linear-gradient(to right,rgba(70,44,10,0) 0%,rgba(70,44,10,.05) 40%,rgba(70,44,10,.3) 100%);
  box-shadow:-6px 0 14px -8px rgba(70,44,10,.5); }
.cb3d-edgezone-r:hover .cb3d-peel-r, .cb3d-edgezone-r:focus-visible .cb3d-peel-r { opacity:1; transform:perspective(700px) rotateY(-9deg); }
.cb3d-peel-l { left:0; transform-origin:right center;
  background:linear-gradient(to left,rgba(70,44,10,0) 0%,rgba(70,44,10,.05) 40%,rgba(70,44,10,.3) 100%);
  box-shadow:6px 0 14px -8px rgba(70,44,10,.5); }
.cb3d-edgezone-l:hover .cb3d-peel-l, .cb3d-edgezone-l:focus-visible .cb3d-peel-l { opacity:1; transform:perspective(700px) rotateY(9deg); }

.cb3d-book.cb3d-mobile .cb3d-coverwrap { left:0; width:100%; }
.cb3d-book.cb3d-mobile .cb3d-backcover { left:0; right:0; border-radius:10px; }
.cb3d-book.cb3d-mobile .cb3d-sheet { left:0; width:100%; }
.cb3d-book.cb3d-mobile .cb3d-face-front, .cb3d-book.cb3d-mobile .cb3d-face-back { border-radius:10px; }
.cb3d-book.cb3d-mobile .cb3d-gutter { display:none; }

@media (prefers-reduced-motion: reduce) {
  .cb3d-coverhint { animation:none; }
}
`

// ------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------

interface FlipState {
  dir: 'fwd' | 'back'
  next: number
  front: number
  back: number
}

export function Book3D() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [page, setPage] = useState(0)
  const [mobile, setMobile] = useState(false)
  const [opened, setOpened] = useState(false)
  const [coverGone, setCoverGone] = useState(false)
  const [fontScale, setFontScale] = useState(1)
  const [marks, setMarks] = useState<Set<number>>(new Set())
  const [notes, setNotes] = useState<Record<number, { text: string; ts: number }>>({})
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [maxPage, setMaxPage] = useState(0)
  const [lastRead, setLastRead] = useState<number | null>(null)
  const [fs, setFs] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [flip, setFlip] = useState<FlipState | null>(null)

  const flipAngle = useMotionValue(0)
  const coverRot = useMotionValue(0)
  const busyRef = useRef(false)
  const flipIdRef = useRef(0)
  const [mounted, setMounted] = useState(false)

  // sombras de curvatura durante a virada
  const shadeFront = useTransform(flipAngle, [0, -45, -90, -135, -180], [0, 0.28, 0.5, 0.3, 0.08])
  const shadeBack = useTransform(flipAngle, [-180, -135, -90, -45, 0], [0.08, 0.3, 0.5, 0.28, 0])

  // ----------------------------------------------------------
  // derivados de posição (clamp ao modo atual)
  // ----------------------------------------------------------
  const maxIdx = mobile ? TOTAL - 1 : TOTAL - 2
  const pageSafe = Math.min(page, maxIdx)

  const commitPage = useCallback((next: number) => {
    setPage(next)
    setMaxPage((prev) => Math.max(prev, next))
  }, [])

  // ----------------------------------------------------------
  // boot: carrega localStorage (marcadores, notas, último lugar)
  // ----------------------------------------------------------
  useEffect(() => {
    queueMicrotask(() => {
      setMarks(new Set(readJSON<number[]>(BOOK_LS.marks, [])))
      const n = readJSON<Record<string, { text: string; ts: number }>>(BOOK_LS.notes, {})
      const norm: Record<number, { text: string; ts: number }> = {}
      Object.entries(n || {}).forEach(([k, v]) => {
        const i = Number(k)
        if (Number.isInteger(i) && v && typeof v.text === 'string') norm[i] = v
      })
      setNotes(norm)
      const mx = readJSON<number>(BOOK_LS.max, 0)
      if (typeof mx === 'number' && mx >= 0 && mx < TOTAL) setMaxPage(mx)
      const last = readJSON<number>(BOOK_LS.last, 0)
      if (typeof last === 'number' && Number.isInteger(last) && last > 0 && last < TOTAL) setLastRead(last)
      setMounted(true)
    })
  }, [])

  // ----------------------------------------------------------
  // modo único (mobile) por media query
  // ----------------------------------------------------------
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const apply = () => setMobile(mq.matches)
    const t = window.setTimeout(apply, 0)
    mq.addEventListener('change', apply)
    return () => {
      window.clearTimeout(t)
      mq.removeEventListener('change', apply)
    }
  }, [])

  // ----------------------------------------------------------
  // persistência da leitura (última página + máximo lido)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!mounted) return
    try {
      window.localStorage.setItem(BOOK_LS.last, String(pageSafe))
      window.localStorage.setItem(BOOK_LS.max, String(Math.max(maxPage, pageSafe)))
    } catch {
      /* noop */
    }
  }, [pageSafe, maxPage, mounted])

  // ----------------------------------------------------------
  // marcadores persistidos
  // ----------------------------------------------------------
  useEffect(() => {
    if (!mounted) return
    writeJSON(BOOK_LS.marks, Array.from(marks))
    window.dispatchEvent(new Event(BOOK_STORE_EVENT))
  }, [marks, mounted])

  // ----------------------------------------------------------
  // tela cheia (Fullscreen API com fallback CSS)
  // ----------------------------------------------------------
  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFs = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        /* noop */
      }
      setFs(false)
      return
    }
    try {
      await el.requestFullscreen()
    } catch {
      setFs((v) => !v) // fallback: modo CSS fixed
    }
  }, [])

  // ----------------------------------------------------------
  // abrir capa
  // ----------------------------------------------------------
  const openCover = useCallback(() => {
    if (coverGone || busyRef.current) return
    busyRef.current = true
    setOpened(true)
    animate(coverRot, -180, {
      duration: 0.95,
      ease: FLIP_EASE,
      onComplete: () => {
        setCoverGone(true)
        busyRef.current = false
      },
    })
  }, [coverGone, coverRot])

  // ----------------------------------------------------------
  // virada de página (folha única animada)
  // ----------------------------------------------------------
  const go = useCallback(
    (dir: 'fwd' | 'back') => {
      if (busyRef.current || !coverGone) return
      const step = mobile ? 1 : 2
      if (dir === 'fwd' ? pageSafe >= maxIdx : pageSafe <= 0) return
      const next = dir === 'fwd' ? Math.min(pageSafe + step, maxIdx) : Math.max(pageSafe - step, 0)
      const front = dir === 'fwd' ? (mobile ? pageSafe : pageSafe + 1) : pageSafe - 1
      const back = dir === 'fwd' ? (mobile ? pageSafe + 1 : pageSafe + 2) : pageSafe
      const id = ++flipIdRef.current
      busyRef.current = true
      flipAngle.set(dir === 'fwd' ? 0 : -180)
      setFlip({ dir, next, front, back })
      animate(flipAngle, dir === 'fwd' ? -180 : 0, {
        duration: FLIP_DURATION,
        ease: FLIP_EASE,
        onComplete: () => {
          if (flipIdRef.current !== id) return
          commitPage(next)
          setFlip(null)
          busyRef.current = false
        },
      })
    },
    [pageSafe, maxIdx, mobile, coverGone, flipAngle, commitPage],
  )

  const jump = useCallback(
    (idx: number) => {
      const t = Math.min(Math.max(idx, 0), maxIdx)
      flipIdRef.current++
      busyRef.current = false
      setFlip(null)
      commitPage(t)
    },
    [maxIdx, commitPage],
  )

  // ----------------------------------------------------------
  // teclado: ← / →
  // ----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (!coverGone) openCover()
        else go('fwd')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (coverGone) go('back')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, openCover, coverGone])

  // ----------------------------------------------------------
  // marcador da página atual
  // ----------------------------------------------------------
  const toggleMark = useCallback(() => {
    setMarks((prev) => {
      const nx = new Set(prev)
      if (nx.has(pageSafe)) nx.delete(pageSafe)
      else nx.add(pageSafe)
      return nx
    })
  }, [pageSafe])

  const removeMark = useCallback((i: number) => {
    setMarks((prev) => {
      const nx = new Set(prev)
      nx.delete(i)
      return nx
    })
  }, [])

  // ----------------------------------------------------------
  // anotações
  // ----------------------------------------------------------
  const saveNote = useCallback(() => {
    const text = (drafts[pageSafe] ?? notes[pageSafe]?.text ?? '').trim()
    setNotes((prev) => {
      const nx = { ...prev }
      if (text) nx[pageSafe] = { text, ts: Date.now() }
      else delete nx[pageSafe]
      writeJSON(BOOK_LS.notes, nx)
      window.dispatchEvent(new Event(BOOK_STORE_EVENT))
      return nx
    })
    setDrafts((prev) => {
      const nx = { ...prev }
      if (!text) delete nx[pageSafe]
      return nx
    })
  }, [drafts, notes, pageSafe])

  const removeNote = useCallback((i: number) => {
    setNotes((prev) => {
      const nx = { ...prev }
      delete nx[i]
      writeJSON(BOOK_LS.notes, nx)
      window.dispatchEvent(new Event(BOOK_STORE_EVENT))
      return nx
    })
  }, [])

  const exportNotes = useCallback(() => {
    const entries = Object.entries(notes)
      .map(([k, v]) => ({ i: Number(k), text: v.text, ts: v.ts }))
      .sort((a, b) => a.i - b.i)
    if (!entries.length) return
    const body = entries
      .map((e) => `Página ${e.i + 1} — ${BOOK_PAGES[e.i]?.section ?? ''}\n${'-'.repeat(48)}\n${e.text}\n`)
      .join('\n')
    const header = `Códice CAPYBER — Blue Team, SOC & Engenharia de Segurança\nAnotações exportadas em ${new Date().toLocaleString('pt-BR')}\n\n`
    try {
      const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'codice-capyber-anotacoes.txt'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* noop */
    }
  }, [notes])

  // ----------------------------------------------------------
  // busca em todo o texto
  // ----------------------------------------------------------
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const out: { i: number; snippet: string }[] = []
    for (let i = 0; i < TOTAL && out.length < 8; i++) {
      const p = BOOK_PAGES[i]
      const hay = (
        p.section +
        ' ' +
        p.paras.join(' ') +
        (p.list ? ' ' + p.list.join(' ') : '') +
        (p.callout ? ' ' + p.callout.text : '')
      )
        .toLowerCase()
        .replace(/\s+/g, ' ')
      const k = hay.indexOf(q)
      if (k >= 0) {
        const s = Math.max(0, k - 42)
        out.push({ i, snippet: (s > 0 ? '…' : '') + hay.slice(s, s + 110).trim() + '…' })
      }
    }
    return out
  }, [query])

  const chapterStart = useMemo(() => {
    const m = new Map<number, number>()
    BOOK_PAGES.forEach((p, i) => {
      if (!m.has(p.chapter)) m.set(p.chapter, i)
    })
    return m
  }, [])

  // ----------------------------------------------------------
  // derivados de render
  // ----------------------------------------------------------
  const staticLeft = flip ? (flip.dir === 'fwd' ? pageSafe : flip.next) : pageSafe
  const staticRight = flip
    ? flip.dir === 'fwd'
      ? Math.min(flip.next + 1, TOTAL - 1)
      : pageSafe + 1
    : Math.min(pageSafe + 1, TOTAL - 1)
  const staticSingle = flip ? flip.next : pageSafe
  const progress = Math.round(((maxPage + 1) / TOTAL) * 100)
  const ringP = Math.min(1, (maxPage + 1) / TOTAL)
  const ringC = 2 * Math.PI * 31
  const current = BOOK_PAGES[pageSafe]
  const notesList = useMemo(
    () =>
      Object.entries(notes)
        .map(([k, v]) => ({ i: Number(k), ...v }))
        .sort((a, b) => b.ts - a.ts),
    [notes],
  )
  const marksList = useMemo(() => Array.from(marks).sort((a, b) => a - b), [marks])

  const btnCls =
    'cap-btn-steel inline-flex h-11 min-h-11 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-bold text-[#10315c] disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col gap-4 py-2',
        fs && 'fixed inset-0 z-[100] overflow-y-auto bg-[#eef5fe] p-4',
      )}
    >
      <style>{CSS}</style>

      {/* ------------------------------------------------ palco 3D */}
      <div className="cb3d-stage select-none">
        <motion.div
          className={cn('cb3d-book', mobile && 'cb3d-mobile')}
          initial={false}
          animate={{ x: !opened && !mobile ? '-25%' : '0%' }}
          transition={{ duration: 0.95, ease: FLIP_EASE }}
        >
          <div className="cb3d-backcover" aria-hidden />
          {opened && <div className="cb3d-backcover-l" aria-hidden />}
          <div className="cb3d-foreedge cb3d-foreedge-r" aria-hidden />
          {opened && <div className="cb3d-foreedge cb3d-foreedge-l" aria-hidden />}

          {opened &&
            (mobile ? (
              <motion.div
                className="absolute inset-0 z-10"
                drag={coverGone && !flip ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go('fwd')
                  else if (info.offset.x > 60) go('back')
                }}
              >
                <PageFace
                  side="single"
                  index={staticSingle}
                  fontScale={fontScale}
                  hasNote={Boolean(notes[staticSingle])}
                  marked={marks.has(staticSingle)}
                />
              </motion.div>
            ) : (
              <>
                <PageFace
                  side="left"
                  index={staticLeft}
                  fontScale={fontScale}
                  hasNote={Boolean(notes[staticLeft])}
                  marked={marks.has(staticLeft)}
                />
                <PageFace
                  side="right"
                  index={staticRight}
                  fontScale={fontScale}
                  hasNote={Boolean(notes[staticRight])}
                  marked={marks.has(staticRight)}
                />
              </>
            ))}

          {opened && <div className="cb3d-gutter" aria-hidden />}

          {/* folha em movimento (uma única página extra no DOM) */}
          {flip && (
            <motion.div className="cb3d-sheet" style={{ rotateY: flipAngle }}>
              <div className="cb3d-face cb3d-face-front">
                <PageFace
                  side={mobile ? 'single' : 'right'}
                  index={flip.front}
                  fontScale={fontScale}
                  hasNote={Boolean(notes[flip.front])}
                  marked={marks.has(flip.front)}
                />
                <motion.div className="cb3d-shade cb3d-shade-front" style={{ opacity: shadeFront }} />
              </div>
              <div className="cb3d-face cb3d-face-back">
                <PageFace
                  side={mobile ? 'single' : 'left'}
                  index={flip.back}
                  fontScale={fontScale}
                  hasNote={Boolean(notes[flip.back])}
                  marked={marks.has(flip.back)}
                />
                <motion.div className="cb3d-shade cb3d-shade-back" style={{ opacity: shadeBack }} />
              </div>
            </motion.div>
          )}

          {/* zonas de virada nas bordas (efeito peel no hover) */}
          {coverGone && !flip && (
            <>
              <div
                role="button"
                tabIndex={0}
                aria-label="Página anterior"
                className="cb3d-edgezone cb3d-edgezone-l"
                onClick={() => go('back')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    go('back')
                  }
                }}
              >
                <span className="cb3d-peel cb3d-peel-l" aria-hidden />
              </div>
              <div
                role="button"
                tabIndex={0}
                aria-label="Próxima página"
                className="cb3d-edgezone cb3d-edgezone-r"
                onClick={() => go('fwd')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    go('fwd')
                  }
                }}
              >
                <span className="cb3d-peel cb3d-peel-r" aria-hidden />
              </div>
            </>
          )}

          {/* capa em couro com título em ouro */}
          {!coverGone && (
            <motion.div
              className="cb3d-coverwrap"
              whileHover={opened ? undefined : { rotateX: 3, rotateY: -2.5 }}
              transition={{ duration: 0.35 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <motion.div
                className="cb3d-coverface cb3d-noise"
                style={{ rotateY: coverRot }}
                onClick={openCover}
                role="button"
                tabIndex={0}
                aria-label="Abrir o Códice CAPYBER"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openCover()
                  }
                }}
              >
                <div className="cb3d-coverframe" aria-hidden />
                <div className="cb3d-spine" aria-hidden />
                <div className="cb3d-coverbody">
                  <div className="cb3d-emblem" aria-hidden>
                    <Shield size={24} strokeWidth={1.6} />
                  </div>
                  <div className="cb3d-covertitle cb3d-gold">
                    CÓDICE
                    <br />
                    CAPYBER
                  </div>
                  <div className="cb3d-coversub">BLUE TEAM · SOC · ENGENHARIA DE SEGURANÇA</div>
                  <div className="cb3d-coverrule" aria-hidden />
                  <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
                    <circle cx="36" cy="36" r="31" fill="none" stroke="rgba(246,212,124,.18)" strokeWidth="5" />
                    <circle
                      cx="36"
                      cy="36"
                      r="31"
                      fill="none"
                      stroke="#e9b64e"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={ringC}
                      strokeDashoffset={ringC * (1 - ringP)}
                      transform="rotate(-90 36 36)"
                    />
                    <text x="36" y="40.5" textAnchor="middle" fontSize="13" fill="#f6d47c" fontFamily="Georgia, serif">
                      {progress}%
                    </text>
                  </svg>
                  <div className="cb3d-coverhint">TOQUE PARA ABRIR</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ------------------------------------------------ controles */}
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          {lastRead !== null && lastRead !== pageSafe && (
            <button
              type="button"
              onClick={() => {
                jump(lastRead)
                setLastRead(null)
              }}
              className="cap-chip inline-flex h-11 min-h-11 items-center gap-2 px-4 text-sm font-bold text-[#10315c]"
            >
              <BookOpen size={15} aria-hidden /> Continuar da página {lastRead + 1}
            </button>
          )}
          {current && (
            <span className="cap-mono text-xs font-bold uppercase tracking-wider text-[#10315c]/70">
              Cap. {current.chapter === 98 ? 'Glossário' : current.chapter === 99 ? 'Apêndice' : current.chapter} —{' '}
              {current.chapterTitle}
            </span>
          )}
        </div>

        <div className="cap-panel flex flex-wrap items-center justify-center gap-2 p-3 sm:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" className={btnCls} onClick={() => go('back')} disabled={!coverGone || pageSafe <= 0} aria-label="Página anterior">
              <ChevronLeft size={18} aria-hidden />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <button
              type="button"
              className={btnCls}
              onClick={() => go('fwd')}
              disabled={!coverGone || pageSafe >= maxIdx}
              aria-label="Próxima página"
            >
              <span className="hidden sm:inline">Próxima</span>
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>

          <div className="order-last flex w-full items-center gap-3 sm:order-none sm:w-auto sm:min-w-56 sm:flex-1">
            <Slider
              value={[pageSafe]}
              min={0}
              max={maxIdx}
              step={1}
              onValueChange={(v) => jump(v[0])}
              aria-label="Ir para página"
            />
            <span className="cap-mono whitespace-nowrap text-xs font-bold text-[#10315c]/80">
              {pageSafe + 1}
              {!mobile && pageSafe + 1 < TOTAL ? `–${pageSafe + 2}` : ''} / {TOTAL}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Sumário */}
            <Sheet open={tocOpen} onOpenChange={setTocOpen}>
              <SheetTrigger asChild>
                <button type="button" className={btnCls} aria-label="Abrir sumário">
                  <ListTree size={17} aria-hidden />
                  <span className="hidden md:inline">Sumário</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[88vw] max-w-md overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="cap-heading text-lg font-black">Sumário</SheetTitle>
                </SheetHeader>
                <div className="mt-1 flex flex-col gap-1 pb-8">
                  {BOOK_CHAPTERS.map((c) => {
                    const start = chapterStart.get(c.num) ?? 0
                    return (
                      <button
                        key={c.num}
                        type="button"
                        onClick={() => {
                          jump(start)
                          setTocOpen(false)
                        }}
                        className="flex items-start justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition hover:border-[#b9d4f0] hover:bg-white/70"
                      >
                        <span className="min-w-0">
                          <span className="cap-mono text-[10px] font-black tracking-widest text-[#f5920b]">
                            {c.num >= 90 ? (c.num === 98 ? 'GLOSSÁRIO' : 'APÊNDICE') : `CAPÍTULO ${c.num}`}
                          </span>
                          <span className="block truncate text-sm font-bold text-[#10315c]">{c.title}</span>
                          <span className="block text-xs text-[#10315c]/60">{c.subtitle}</span>
                        </span>
                        <span className="cap-mono mt-0.5 shrink-0 text-[11px] font-bold text-[#2569b8]">pág. {start + 1}</span>
                      </button>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>

            {/* Marcadores */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(btnCls, marks.has(pageSafe) && 'cap-btn-primary')}
                  aria-label="Marcadores da página"
                >
                  <Flag size={17} aria-hidden />
                  {marksList.length > 0 && (
                    <span className="cap-mono text-[11px] font-black">{marksList.length}</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={toggleMark}
                    className={cn(
                      'inline-flex h-10 items-center justify-center gap-2 rounded-md border-2 border-[#b9d4f0] bg-white px-3 text-sm font-bold text-[#10315c] hover:bg-[#eef5fe]',
                    )}
                  >
                    <Flag size={15} aria-hidden />
                    {marks.has(pageSafe) ? 'Desmarcar página atual' : 'Marcar página atual'}
                  </button>
                  {marksList.length === 0 ? (
                    <p className="text-xs text-[#10315c]/60">
                      Nenhum marcador ainda — toque na bandeira para marcar a página atual.
                    </p>
                  ) : (
                    <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                      {marksList.map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-md border border-[#b9d4f0]/70 bg-white px-2.5 py-2"
                        >
                          <button
                            type="button"
                            onClick={() => jump(i)}
                            className="min-w-0 flex-1 text-left"
                            aria-label={`Ir para página ${i + 1}`}
                          >
                            <span className="cap-mono block text-[11px] font-black text-[#2569b8]">pág. {i + 1}</span>
                            <span className="block truncate text-xs text-[#10315c]/80">{BOOK_PAGES[i]?.section}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMark(i)}
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#10315c]/60 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remover marcador da página ${i + 1}`}
                          >
                            <X size={14} aria-hidden />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Anotações */}
            <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(btnCls, notes[pageSafe] && 'cap-btn-primary')}
                  aria-label="Anotações"
                >
                  <StickyNote size={17} aria-hidden />
                  {notesList.length > 0 && <span className="cap-mono text-[11px] font-black">{notesList.length}</span>}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[88vw] max-w-md flex-col overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="cap-heading text-lg font-black">Anotações</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 pb-8">
                  <div className="rounded-lg border-2 border-[#b9d4f0] bg-white p-3">
                    <p className="cap-mono mb-2 text-[11px] font-black uppercase tracking-widest text-[#2569b8]">
                      Página {pageSafe + 1} — {current?.section}
                    </p>
                    <Textarea
                      value={drafts[pageSafe] ?? notes[pageSafe]?.text ?? ''}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [pageSafe]: e.target.value }))}
                      rows={4}
                      placeholder="Escreva sua anotação sobre esta página…"
                      aria-label={`Anotação da página ${pageSafe + 1}`}
                    />
                    <button
                      type="button"
                      onClick={saveNote}
                      className="cap-btn-primary mt-2 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold text-white"
                    >
                      Salvar anotação
                    </button>
                  </div>

                  {notesList.length === 0 ? (
                    <p className="text-xs text-[#10315c]/60">Nenhuma anotação ainda — as notas ficam salvas neste navegador.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {notesList.map((n) => (
                        <div key={n.i} className="rounded-lg border border-[#b9d4f0]/70 bg-white p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="cap-mono text-[11px] font-black text-[#2569b8]">
                              pág. {n.i + 1} · {BOOK_PAGES[n.i]?.section}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeNote(n.i)}
                              className="flex size-8 items-center justify-center rounded-md text-[#10315c]/60 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remover anotação da página ${n.i + 1}`}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                          </div>
                          <p className="mt-1 line-clamp-3 text-xs text-[#10315c]/80">{n.text}</p>
                          <button
                            type="button"
                            onClick={() => {
                              jump(n.i)
                              setNotesOpen(false)
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#2569b8] hover:underline"
                          >
                            <ChevronRight size={13} aria-hidden /> Ir para página
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={exportNotes}
                    disabled={notesList.length === 0}
                    className="cap-btn-steel inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-[#10315c] disabled:opacity-40"
                  >
                    <Download size={15} aria-hidden /> Exportar .txt
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Busca */}
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <button type="button" className={btnCls} aria-label="Buscar no livro">
                  <Search size={17} aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 max-w-[92vw]">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar termo no livro…"
                  aria-label="Buscar no livro"
                  autoFocus
                />
                <div className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={r.i}
                      type="button"
                      onClick={() => {
                        jump(r.i)
                        setSearchOpen(false)
                        setQuery('')
                      }}
                      className="rounded-md border border-transparent px-2.5 py-2 text-left transition hover:border-[#b9d4f0] hover:bg-white"
                    >
                      <span className="cap-mono block text-[11px] font-black text-[#2569b8]">
                        pág. {r.i + 1} · {BOOK_PAGES[r.i].section}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-[#10315c]/75">{r.snippet}</span>
                    </button>
                  ))}
                  {query.trim().length >= 2 && results.length === 0 && (
                    <p className="px-2 py-3 text-xs text-[#10315c]/60">Nenhum resultado para &quot;{query}&quot;.</p>
                  )}
                  {query.trim().length < 2 && (
                    <p className="px-2 py-3 text-xs text-[#10315c]/60">
                      Digite ao menos 2 caracteres — a busca cobre todos os {TOTAL} páginas.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Fonte A- / A+ */}
            <button
              type="button"
              className={btnCls}
              aria-label="Diminuir tamanho da fonte"
              onClick={() => setFontScale((v) => Math.max(0.85, Math.round((v - 0.1) * 100) / 100))}
            >
              <AArrowDown size={17} aria-hidden />
            </button>
            <button
              type="button"
              className={btnCls}
              aria-label="Aumentar tamanho da fonte"
              onClick={() => setFontScale((v) => Math.min(1.35, Math.round((v + 0.1) * 100) / 100))}
            >
              <AArrowUp size={17} aria-hidden />
            </button>

            {/* Tela cheia */}
            <button type="button" className={btnCls} onClick={toggleFs} aria-label={fs ? 'Sair da tela cheia' : 'Tela cheia'}>
              {fs ? <Minimize2 size={17} aria-hidden /> : <Maximize2 size={17} aria-hidden />}
            </button>
          </div>
        </div>

        {/* progresso de leitura */}
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#b9d4f0]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2569b8] to-[#3b82c4] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="cap-mono whitespace-nowrap text-xs font-bold text-[#10315c]/80">Você leu {progress}%</span>
        </div>
      </div>
    </div>
  )
}
