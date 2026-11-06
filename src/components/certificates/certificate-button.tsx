'use client'

// CAPYBER — botão de emissão de certificado de conquista (livro/CTF/stealth).
// Fluxo: POST /api/certificate → download do PDF (GET /api/certificate/[id]
// via fetch→blob→anchor) → estado de sucesso com serial + código de verificação.
// Emissões ficam em localStorage['capy_certificates'] para re-download.

import { useCallback, useEffect, useState } from 'react'
import { Award, BadgeCheck, Download, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type CertificateType = 'livro' | 'ctf' | 'stealth'

const LS_KEY = 'capy_certificates'

interface StoredCert {
  id: string
  serial: string
  verifyCode: string
  name: string
  issuedAt: string
}

type CertStore = Partial<Record<CertificateType, StoredCert>>

const DIALOG_COPY: Record<CertificateType, { title: string; desc: string }> = {
  livro: {
    title: 'Certificado de Leitura Concluída — Códice CAPYBER',
    desc: 'Você leu o Códice CAPYBER até a última página. Emita seu certificado oficial em PDF, com serial único e código de verificação.',
  },
  ctf: {
    title: 'Certificado de Investigação Mestre',
    desc: 'Caso encerrado: você desvendou o CTF do Fantasma. Emita seu certificado oficial em PDF, com serial único e código de verificação.',
  },
  stealth: {
    title: 'Certificado de Operador Inrastreável',
    desc: 'Operação Capivara Silenciosa concluída sem alarmes. Emita seu certificado oficial em PDF, com serial único e código de verificação.',
  },
}

/* ───────────────────── storage local ───────────────────── */

function readStore(): CertStore {
  try {
    if (typeof window === 'undefined') return {}
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as CertStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveToStore(type: CertificateType, rec: StoredCert): void {
  try {
    const store = readStore()
    store[type] = rec
    window.localStorage.setItem(LS_KEY, JSON.stringify(store))
  } catch {
    /* localStorage indisponível — segue sem persistir */
  }
}

/* ───────────────────── download do PDF ───────────────────── */

async function downloadPdf(id: string, serial: string): Promise<void> {
  const res = await fetch(`/api/certificate/${id}`)
  if (!res.ok) throw new Error('Não foi possível gerar o PDF do certificado.')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `certificado-capyber-${serial}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/* ───────────────────── componente ───────────────────── */

export function CertificateButton({
  type,
  ready,
  meta,
  label,
  className = '',
}: {
  type: CertificateType
  ready: boolean
  meta?: Record<string, string>
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [stored, setStored] = useState<StoredCert | null>(null)
  const [mode, setMode] = useState<'existing' | 'form' | 'success'>('form')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = DIALOG_COPY[type]

  const openDialog = useCallback(() => {
    const rec = readStore()[type] ?? null
    setStored(rec)
    setMode(rec ? 'existing' : 'form')
    setError(null)
    setOpen(true)
  }, [type])

  /* esc/atualizações: sincroniza a emissão salva quando o diálogo abre */
  useEffect(() => {
    if (!open) return
    setStored(readStore()[type] ?? null)
  }, [open, type])

  async function emit() {
    const n = name.trim()
    if (n.length < 3 || n.length > 80) {
      setError('Informe um nome entre 3 e 80 caracteres.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: n, meta }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        id?: string
        serial?: string
        verifyCode?: string
        issuedAt?: string
        error?: string
      }
      if (!res.ok || !data.ok || !data.id || !data.serial || !data.verifyCode) {
        throw new Error(data.error ?? 'Falha ao emitir o certificado.')
      }
      const rec: StoredCert = {
        id: data.id,
        serial: data.serial,
        verifyCode: data.verifyCode,
        name: n,
        issuedAt: data.issuedAt ?? new Date().toISOString(),
      }
      saveToStore(type, rec)
      setStored(rec)
      try {
        await downloadPdf(rec.id, rec.serial)
      } catch {
        /* download falhou — o usuário pode baixar de novo no painel de sucesso */
      }
      setMode('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao emitir o certificado.')
    } finally {
      setBusy(false)
    }
  }

  async function reDownload() {
    if (!stored) return
    setBusy(true)
    setError(null)
    try {
      await downloadPdf(stored.id, stored.serial)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao baixar o PDF.')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return null

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        title="Emitir certificado em PDF"
        className={`cap-btn-steel inline-flex min-h-[44px] items-center gap-2 px-4 text-base font-extrabold ${className}`}
      >
        <Award className="h-5 w-5 shrink-0" aria-hidden />
        {label ?? 'Emitir certificado'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-[#10315c]">
              <Award className="h-5 w-5 shrink-0 text-[#f5920b]" aria-hidden />
              {copy.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-[#10315c]/70">
              {copy.desc}
            </DialogDescription>
          </DialogHeader>

          {mode === 'existing' && stored && (
            <div className="mt-1 space-y-3">
              <div className="rounded-xl border-2 border-[#21a44a]/40 bg-[#21a44a]/5 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#21a44a]">
                  <BadgeCheck className="h-4 w-4" aria-hidden /> Certificado já emitido
                </p>
                <p className="mt-2 text-sm font-bold text-[#10315c]">{stored.name}</p>
                <p className="cap-mono mt-1 text-[11px] text-[#10315c]/70">
                  Série <span className="font-bold">{stored.serial}</span> · emitido em{' '}
                  {new Date(stored.issuedAt).toLocaleDateString('pt-BR')}
                </p>
                <p className="cap-mono mt-0.5 text-[11px] text-[#10315c]/70">
                  Verificação <span className="font-bold">{stored.verifyCode}</span>
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setName('')
                    setMode('form')
                  }}
                  className="h-11 border-[#10315c]/25 text-[#10315c] hover:bg-[#2569b8]/10 hover:text-[#10315c]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden /> Emitir com outro nome
                </Button>
                <Button
                  type="button"
                  onClick={() => void reDownload()}
                  disabled={busy}
                  className="cap-btn-primary h-11 px-5"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Baixando…
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" aria-hidden /> Baixar novamente
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {mode === 'form' && (
            <form
              className="mt-1 space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                void emit()
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor={`cert-name-${type}`} className="text-sm font-bold text-[#10315c]">
                  Nome completo no certificado
                </Label>
                <Input
                  id={`cert-name-${type}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError(null)
                  }}
                  placeholder="Seu nome completo"
                  maxLength={80}
                  autoComplete="name"
                  className="cap-input h-11"
                />
                <p className="text-[11px] leading-relaxed text-[#10315c]/60">
                  O nome vai impresso no PDF (3 a 80 caracteres). Guarde o serial e o código de
                  verificação exibidos após a emissão.
                </p>
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="h-11 border-[#10315c]/25 text-[#10315c] hover:bg-[#2569b8]/10 hover:text-[#10315c]"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy} className="cap-btn-primary h-11 px-5">
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Emitindo…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" aria-hidden /> Emitir e baixar PDF
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {mode === 'success' && stored && (
            <div className="mt-1 space-y-3">
              <div className="rounded-xl border-2 border-[#21a44a]/50 bg-[#21a44a]/5 p-4 text-center">
                <BadgeCheck className="mx-auto h-9 w-9 text-[#21a44a]" aria-hidden />
                <p className="mt-1.5 text-sm font-black uppercase tracking-wide text-[#21a44a]">
                  Certificado emitido!
                </p>
                <p className="mt-1 text-sm font-bold text-[#10315c]">{stored.name}</p>
                <div className="cap-mono mt-3 space-y-1 rounded-lg bg-[#10315c]/5 p-3 text-left text-[11px] text-[#10315c]/80">
                  <p>
                    Série: <span className="font-bold">{stored.serial}</span>
                  </p>
                  <p>
                    Código de verificação: <span className="font-bold">{stored.verifyCode}</span>
                  </p>
                </div>
                <p className="mt-2 text-[11px] font-semibold text-[#f5920b]">
                  Guarde este código para verificar seu certificado.
                </p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void reDownload()}
                  disabled={busy}
                  className="h-11 border-[#10315c]/25 text-[#10315c] hover:bg-[#2569b8]/10 hover:text-[#10315c]"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> Baixando…
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" aria-hidden /> Baixar PDF novamente
                    </>
                  )}
                </Button>
                <Button type="button" onClick={() => setOpen(false)} className="cap-btn-steel h-11 px-5">
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CertificateButton
