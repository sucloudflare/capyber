'use client'

// CAPYBER — Download do projeto (código-fonte + repositório GitHub-ready).
//
// Exporta <ProjectDownload /> — botão discreto para o footer, no mesmo padrão
// do <PrivacyTrigger />. Oferece:
//   • /capyber-final.zip        — código-fonte completo (git archive do HEAD)
//   • /capyber-github.bundle    — bundle git com TODO o histórico (push-ready)
//
// Os arquivos são servidos como estáticos pelo Next.js (pasta public/).

import * as React from 'react'
import {
  Download,
  FileArchive,
  GitBranch,
  PackageOpen,
  Terminal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export function ProjectDownload({ className }: { className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-haspopup="menu"
          aria-label="Baixar projeto CAPYBER"
          className={cn(
            'inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-[#2569b8] underline-offset-4 transition-colors hover:text-[#10315c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2569b8]',
            className
          )}
        >
          <Download className="size-3.5" aria-hidden="true" />
          Baixar projeto
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        className="w-[min(92vw,22rem)] border-2 border-[#c9ddf3] bg-[#f7fbff] p-2 shadow-xl"
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-[0.7rem] font-extrabold uppercase tracking-wider text-[#2569b8]">
          <PackageOpen className="size-3.5" aria-hidden="true" />
          Código-fonte CAPYBER
        </DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <a
            href="/capyber-final.zip"
            download="CAPYBER-projeto-completo.zip"
            className="cursor-pointer gap-2.5 rounded-lg py-2.5"
          >
            <FileArchive className="size-4 shrink-0 text-[#21a44a]" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#10315c]">
                Projeto completo (.zip) — 11 MB
              </span>
              <span className="block text-xs text-[#52729c]">
                Código-fonte + banco de dados + vídeos. Extraia e rode.
              </span>
            </span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a
            href="/capyber-github.bundle"
            download="CAPYBER-github.bundle"
            className="cursor-pointer gap-2.5 rounded-lg py-2.5"
          >
            <GitBranch className="size-4 shrink-0 text-[#2569b8]" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#10315c]">
                Repositório Git (.bundle) — 53 MB
              </span>
              <span className="block text-xs text-[#52729c]">
                Histórico completo de commits, pronto para dar push no GitHub.
              </span>
            </span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#dbe8f8]" />

        <div className="rounded-lg border border-[#c9ddf3] bg-[#eaf3fd] p-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-[#2569b8]">
            <Terminal className="size-3.5" aria-hidden="true" />
            Publicar no GitHub
          </p>
          <pre className="overflow-x-auto rounded-md bg-[#10315c] p-2 font-mono text-[0.68rem] leading-relaxed text-[#cfe8ff]">
{`git clone capyber-github.bundle capyber
cd capyber
git remote add origin https://github.com/
  SEU_USUARIO/capyber.git
git push -u origin main`}
          </pre>
          <p className="mt-1.5 text-[0.68rem] leading-snug text-[#52729c]">
            Guia completo no arquivo <strong className="font-bold text-[#10315c]">GITHUB-DEPLOY.md</strong> incluído no download.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
