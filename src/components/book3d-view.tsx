'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { BookOpen, Flag, Layers, StickyNote } from 'lucide-react'
import { BOOK_CHAPTERS, BOOK_PAGES } from '@/lib/book-content'
import { Book3D, BOOK_LS, BOOK_STORE_EVENT } from './book3d'
import { CertificateButton } from '@/components/certificates/certificate-button'
import { FullscreenButton } from '@/components/fullscreen-button'

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="cap-panel cap-card-hover flex items-center gap-3 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#2569b8]/10 text-[#2569b8]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="cap-num block text-lg font-black leading-none text-[#10315c]">{value}</span>
        <span className="cap-mono block truncate text-[11px] font-bold uppercase tracking-wide text-[#10315c]/60">
          {label}
        </span>
      </span>
    </div>
  )
}

/**
 * Visão completa do Códice CAPYBER: cabeçalho, estatísticas e o livro 3D.
 * O certificado de leitura é liberado quando a marca d'água de leitura
 * (BOOK_LS.max, índice 0-based da maior página já alcançada) cobre todas as páginas.
 */
export function Book3DView() {
  const [storeStats, setStoreStats] = useState({ marks: 0, notes: 0 })
  const [pagesReached, setPagesReached] = useState(0)

  useEffect(() => {
    const upd = () => {
      try {
        const m = JSON.parse(window.localStorage.getItem(BOOK_LS.marks) || '[]')
        const n = JSON.parse(window.localStorage.getItem(BOOK_LS.notes) || '{}')
        setStoreStats({
          marks: Array.isArray(m) ? m.length : 0,
          notes: n && typeof n === 'object' ? Object.keys(n).length : 0,
        })
        // BOOK_LS.max guarda a maior página já alcançada (marca d'água 0-based
        // persistida pelo book3d) — sobrevive a reabrir o livro na capa.
        // BOOK_LS.last é a página aberta AGORA (reseta ao reabrir), então usamos max.
        const rawMax = window.localStorage.getItem(BOOK_LS.max)
        const rawLast = window.localStorage.getItem(BOOK_LS.last)
        const mx = rawMax ? parseInt(rawMax, 10) : NaN
        const last = rawLast ? parseInt(rawLast, 10) : NaN
        const best = Math.max(Number.isFinite(mx) ? mx : -1, Number.isFinite(last) ? last : -1)
        setPagesReached(best >= 0 ? best + 1 : 0)
      } catch {
        /* noop */
      }
    }
    upd()
    window.addEventListener(BOOK_STORE_EVENT, upd)
    window.addEventListener('storage', upd)
    // viradas de página persistem sem disparar BOOK_STORE_EVENT — polling leve
    const t = window.setInterval(upd, 1200)
    return () => {
      window.removeEventListener(BOOK_STORE_EVENT, upd)
      window.removeEventListener('storage', upd)
      window.clearInterval(t)
    }
  }, [])

  const total = BOOK_PAGES.length
  const pct = Math.min(100, Math.round((pagesReached / total) * 100))
  const livroConcluido = pagesReached >= total

  return (
    <section data-fs-root className="relative mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
      <div className="mb-2 flex justify-end">
        <FullscreenButton label="Livro em tela cheia" />
      </div>

      <header className="mb-6 text-center">
        <span className="cap-chip inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-wide text-[#10315c]">
          <BookOpen size={14} aria-hidden />
          {total}+ páginas de conhecimento defensivo
        </span>
        <h1 className="cap-heading mt-4 text-3xl font-black sm:text-4xl">Códice CAPYBER</h1>
        <p className="cap-eyebrow mt-3">
          Blue Team · SOC · Engenharia de Segurança — edição digital interativa em 3D
        </p>
      </header>

      <div className="mb-6 flex flex-col items-center justify-center gap-2">
        {livroConcluido ? (
          <CertificateButton
            type="livro"
            ready
            label="Certificado de Leitura Concluída"
            meta={{ pages: String(total) }}
          />
        ) : (
          <>
            <span
              role="status"
              className="cap-chip cap-mono inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold text-[#10315c]/70"
            >
              <BookOpen size={13} aria-hidden />
              <span className="cap-num">{pct}%</span> lido — conclua para ganhar o certificado
            </span>
            <div
              className="cap-xpbar h-2 w-full max-w-xs"
              role="progressbar"
              aria-label="Progresso de leitura do Códice"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <i style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Layers size={18} aria-hidden />} value={String(BOOK_CHAPTERS.filter((c) => c.num < 90).length)} label="capítulos" />
        <Stat icon={<BookOpen size={18} aria-hidden />} value={String(total)} label="páginas" />
        <Stat icon={<Flag size={18} aria-hidden />} value={String(storeStats.marks)} label="marcadores" />
        <Stat icon={<StickyNote size={18} aria-hidden />} value={String(storeStats.notes)} label="anotações" />
      </div>

      <Book3D />
    </section>
  )
}
