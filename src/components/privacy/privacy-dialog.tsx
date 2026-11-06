'use client'

// CAPYBER — Política de Privacidade e Proteção de Dados (LGPD).
//
// Exports:
//   <PrivacyDialog open onOpenChange />  — diálogo largo (max-w-3xl) com o aviso completo
//   <PrivacyTrigger className />         — botão discreto "Privacidade e LGPD" (auto-contido,
//                                          renderiza e controla o próprio PrivacyDialog)
//
// Uso pelo orquestrador:
//   • No footer: <PrivacyTrigger />
//   • Via banner de cookies: <CookieConsent /> (ele já abre o PrivacyDialog internamente,
//     ou repassa para um diálogo externo se a prop onOpenPrivacy for informada).

import * as React from 'react'
import {
  Ban,
  CheckCircle2,
  Cookie,
  Database,
  FileText,
  Gavel,
  KeyRound,
  ListChecks,
  LockKeyhole,
  Mail,
  Scale,
  Server,
  Settings2,
  Share2,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ── blocos tipográficos auxiliares ─────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-[#10315c] uppercase">
        <Icon className="size-4 shrink-0 text-[#2569b8]" aria-hidden="true" />
        {title}
      </h3>
      <div className="space-y-1.5 text-sm leading-relaxed text-[#33517a]">{children}</div>
    </section>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5">
      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#21a44a]" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

function InfoLine({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-[#2569b8]" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

// ── diálogo principal ──────────────────────────────────────────────

export function PrivacyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b-2 border-[#cfe2f7] bg-[#f2f7ff] p-5 pb-4 sm:text-left">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold text-[#10315c]">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(33,164,74,0.14)] text-[#21a44a]"
              aria-hidden="true"
            >
              <ShieldCheck className="size-5" />
            </span>
            Privacidade e Proteção de Dados (LGPD)
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#52729c]">
            Como a CAPYBER coleta, usa e protege seus dados — e como exercer seus direitos.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-5 p-5">
            {/* (a) Quem somos / controlador */}
            <Section icon={ShieldCheck} title="Quem somos (controlador)">
              <p>
                <strong className="font-extrabold text-[#10315c]">CAPYBER</strong> é uma plataforma
                <strong className="font-extrabold text-[#10315c]"> educativa de cibersegurança defensiva</strong>.
                Todos os cenários, ataques e alvos são <strong className="font-extrabold text-[#10315c]">dados sintéticos</strong>{' '}
                em ambientes simulados — nenhum sistema real é acessado. O controlador dos dados
                pessoais é o próprio projeto CAPYBER, responsável por decidir sobre o tratamento.
              </p>
            </Section>

            {/* (b) Dados que coletamos */}
            <Section icon={Database} title="Dados que coletamos">
              <ul className="space-y-1.5">
                <InfoLine icon={KeyRound}>
                  <span>
                    <strong className="font-bold text-[#10315c]">Conta:</strong> nome, e-mail, hash
                    bcrypt da senha e segredo MFA (TOTP). Nunca armazenamos a senha em texto puro.
                  </span>
                </InfoLine>
                <InfoLine icon={Server}>
                  <span>
                    <strong className="font-bold text-[#10315c]">Sessões:</strong> token de sessão,
                    endereço IP, user-agent e datas de acesso.
                  </span>
                </InfoLine>
                <InfoLine icon={Settings2}>
                  <span>
                    <strong className="font-bold text-[#10315c]">Preferências locais</strong> (no seu
                    navegador, via localStorage): voz da VIGIA, tutorial, progresso de jogo/livro e
                    consentimento de cookies.
                  </span>
                </InfoLine>
                <InfoLine icon={FileText}>
                  <span>
                    <strong className="font-bold text-[#10315c]">Logs operacionais</strong> da própria
                    plataforma, para auditoria e segurança do serviço.
                  </span>
                </InfoLine>
              </ul>
            </Section>

            {/* (c) Finalidades */}
            <Section icon={ListChecks} title="Para que usamos (finalidades)">
              <ul className="space-y-1">
                <Bullet>Autenticação e segurança: login, MFA e proteção contra abuso.</Bullet>
                <Bullet>
                  Funcionamento das funcionalidades: voz, trilhas, laboratórios, chat e eventos.
                </Bullet>
                <Bullet>Melhorias de experiência: preferências e estatísticas locais.</Bullet>
              </ul>
            </Section>

            {/* (d) Base legal */}
            <Section icon={Scale} title="Base legal (art. 7º da LGPD)">
              <p>
                Tratamos seus dados com base no{' '}
                <strong className="font-bold text-[#10315c]">consentimento</strong> e na{' '}
                <strong className="font-bold text-[#10315c]">execução de serviço</strong> solicitado
                pelo titular — art. 7º, incisos I e V, da Lei nº 13.709/2018. Os cookies de
                preferências e estatísticas só são usados após o seu consentimento no banner.
              </p>
            </Section>

            {/* (e) Cookies */}
            <Section icon={Cookie} title="Cookies">
              <div className="overflow-hidden rounded-lg border-2 border-[#c9ddf3]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#eaf3fd] text-xs uppercase tracking-wide text-[#2569b8]">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-extrabold">Categoria</th>
                      <th scope="col" className="px-3 py-2 font-extrabold">Para quê</th>
                      <th scope="col" className="px-3 py-2 font-extrabold">Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbe8f8] text-[#33517a]">
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#10315c]">Essenciais</td>
                      <td className="px-3 py-2">Sessão de login e segurança</td>
                      <td className="px-3 py-2">Sempre ativos</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#10315c]">Preferências</td>
                      <td className="px-3 py-2">Voz, tema e progresso local</td>
                      <td className="px-3 py-2">Banner de cookies</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-[#10315c]">Estatísticas locais</td>
                      <td className="px-3 py-2">Contadores de uso no seu navegador</td>
                      <td className="px-3 py-2">Banner de cookies</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="pt-1">
                Você gerencia tudo pelo <strong className="font-bold text-[#10315c]">banner de cookies</strong>{' '}
                (canto inferior da tela). Se ele não estiver visível, recarregue a página para
                reexibi-lo e ajustar ou revogar seu consentimento.
              </p>
            </Section>

            {/* (f) Compartilhamento */}
            <Section icon={Share2} title="Compartilhamento com terceiros">
              <p className="flex items-start gap-1.5">
                <Ban className="mt-0.5 size-4 shrink-0 text-[#c0182b]" aria-hidden="true" />
                <span>
                  <strong className="font-bold text-[#10315c]">Nenhum dado é compartilhado com
                  terceiros.</strong>{' '}
                  Não vendemos, alugamos nem trocamos dados pessoais. Tudo fica na infraestrutura
                  da própria plataforma.
                </span>
              </p>
            </Section>

            {/* (g) Retenção e eliminação */}
            <Section icon={Trash2} title="Retenção e eliminação">
              <ul className="space-y-1">
                <Bullet>A sessão expira automaticamente após logout ou inatividade.</Bullet>
                <Bullet>
                  A exclusão da conta apaga credenciais (senha/MFA) e dados de perfil.
                </Bullet>
                <Bullet>
                  Preferências locais ficam no seu navegador e podem ser limpas a qualquer momento
                  pelas configurações do próprio navegador.
                </Bullet>
              </ul>
            </Section>

            {/* (h) Seus direitos */}
            <Section icon={Gavel} title="Seus direitos (art. 18 da LGPD)">
              <ul className="grid gap-1 sm:grid-cols-2">
                <Bullet>Confirmação da existência de tratamento.</Bullet>
                <Bullet>Acesso aos dados que tratamos.</Bullet>
                <Bullet>Correção de dados incompletos ou desatualizados.</Bullet>
                <Bullet>Anonimização, bloqueio ou eliminação de dados desnecessários.</Bullet>
                <Bullet>Portabilidade dos dados a outro fornecedor.</Bullet>
                <Bullet>Eliminação dos dados tratados com base no consentimento.</Bullet>
                <Bullet>
                  Informação sobre com quem os dados foram compartilhados.
                </Bullet>
                <Bullet>
                  Informação sobre a possibilidade de não fornecer consentimento (e as consequências).
                </Bullet>
              </ul>
            </Section>

            {/* (i) Segurança */}
            <Section icon={LockKeyhole} title="Segurança">
              <ul className="space-y-1">
                <Bullet>Senhas armazenadas apenas como hash bcrypt.</Bullet>
                <Bullet>Rate-limit nos endpoints sensíveis contra força bruta e abuso.</Bullet>
                <Bullet>MFA TOTP opcional para proteger sua conta.</Bullet>
                <Bullet>
                  Conteúdo do jogo 100% sintético: nada do que você vê aqui é dado real de
                  terceiros.
                </Bullet>
              </ul>
            </Section>

            {/* (j) Contato do encarregado */}
            <Section icon={Mail} title="Contato do encarregado (DPO)">
              <p>
                Encarregado de Dados (DPO):{' '}
                <a
                  href="mailto:dpo@capyber.local"
                  className="cap-mono font-bold text-[#2569b8] underline decoration-[#7cb6ec] underline-offset-2 transition-colors hover:text-[#10315c]"
                >
                  dpo@capyber.local
                </a>{' '}
                — canal para exercer seus direitos (art. 18), tirar dúvidas sobre esta política ou
                reportar incidentes de privacidade.
              </p>
            </Section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ── gatilho discreto (uso no footer) ───────────────────────────────

export function PrivacyTrigger({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          'inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-[#2569b8] underline-offset-4 transition-colors hover:text-[#10315c] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2569b8]',
          className
        )}
      >
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Privacidade e LGPD
      </button>
      <PrivacyDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
