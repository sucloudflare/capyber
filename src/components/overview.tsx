'use client'

// CAPYBER — visão PROJETO: herói, globo, adversários, blindagem e postura do dispositivo.

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Home, Crosshair, FlaskConical, Laptop, ShieldCheck,
  Target, Coins, AlertTriangle, Zap, Search, Cpu, ClipboardList, Globe2,
  Gamepad2, Check, Smartphone, Server, MonitorSmartphone, Settings, Shield, UserX, Radar,
  BookOpen, Ghost, ScrollText, VenetianMask, Trophy,
} from 'lucide-react'
import { GateSpiral, HoodFigure, MascotCapy, Flag } from '@/components/art'
import { EngVideoPanel } from '@/components/eng-video'
import { fmtBRL } from '@/components/dashboard'
import type { Device, Severity, Stats, ThreatEvent } from '@/lib/types'

const Globe3D = dynamic(() => import('@/components/globe3d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full flex-col items-center justify-center gap-3 sm:h-[380px]">
      <GateSpiral size={56} spin title="Portal abrindo" />
    </div>
  ),
})

export type View = 'projeto' | 'trilha' | 'comando' | 'osint' | 'frota' | 'lab' | 'plano' | 'livro' | 'ctf' | 'pergaminho' | 'stealth' | 'celular' | 'legado'

export const SIDE_NAV: { id: View; label: string; icon: typeof Home }[] = [
  { id: 'projeto', label: 'Projeto', icon: Home },
  { id: 'trilha', label: 'Trilha', icon: Gamepad2 },
  { id: 'comando', label: 'Comando', icon: Crosshair },
  { id: 'osint', label: 'OSINT', icon: Radar },
  { id: 'livro', label: 'Livro', icon: BookOpen },
  { id: 'pergaminho', label: 'Pergaminho', icon: ScrollText },
  { id: 'ctf', label: 'CTF Fantasma', icon: Ghost },
  { id: 'stealth', label: 'Sala Stealth', icon: VenetianMask },
  { id: 'celular', label: 'Celular', icon: Smartphone },
  { id: 'frota', label: 'Frota', icon: Laptop },
  { id: 'lab', label: 'Laboratório', icon: FlaskConical },
  { id: 'plano', label: 'Plano 40', icon: ShieldCheck },
  { id: 'legado', label: 'Legado', icon: Trophy },
]

const CAMADAS = [
  { icon: Laptop, label: 'Endpoint primeiro' },
  { icon: Search, label: 'Detecção correlacionada' },
  { icon: Zap, label: 'Resposta com playbook' },
  { icon: Cpu, label: 'Operador IA' },
  { icon: ClipboardList, label: 'Plano de 40 pontos' },
  { icon: Gamepad2, label: 'Experiência que engaja' },
]

const PERIGO = [
  { n: 'US$ 1,5 bi', t: 'Bybit · 2025', seed: 0 },
  { n: 'US$ 625 mi', t: 'Ronin Bridge · 2022', seed: 1 },
  { n: 'R$ 100+ mi', t: 'Insiders · BC-Fraudes', seed: 2 },
]

const BLINDAGEM = [
  'EDR/XDR comportamental',
  'Criptografia de disco',
  'Allowlist de apps',
  'USB bloqueado',
  'MDM/MAM',
  'MFA FIDO2',
]

const ADVERSARIOS: { name: string; cc: string | null; ttp: string }[] = [
  { name: 'Lazarus Group', cc: 'KP', ttp: 'Drainers · supply chain' },
  { name: 'APT41', cc: 'CN', ttp: 'npm · credenciais' },
  { name: 'Sandworm', cc: 'RU', ttp: 'Ransomware · wipe' },
  { name: 'Hacktivistas', cc: null, ttp: 'DDoS · phishing em massa' },
  { name: 'Ameaça interna', cc: 'BR', ttp: 'Exfiltração · abuso de acesso' },
]

const CONTROLE_LABEL: Record<string, string> = {
  EDR: 'EDR/XDR',
  DISK_CRYPT: 'Criptografia',
  ALLOWLIST: 'Allowlist',
  USB_BLOCK: 'USB off',
  MDM: 'MDM/MAM',
  MFA_HARD: 'MFA FIDO2',
  DLP: 'DLP',
}

const TIPOS_FROTA: { id: Device['type']; label: string; icon: typeof Laptop }[] = [
  { id: 'NOTEBOOK', label: 'Notebook', icon: Laptop },
  { id: 'WORKSTATION', label: 'Workstation', icon: MonitorSmartphone },
  { id: 'MOBILE', label: 'Mobile', icon: Smartphone },
  { id: 'SERVER', label: 'Server', icon: Server },
]

type AlertFilter = 'TODOS' | 'CRITICA' | 'ALTA' | 'MEDIA' | 'ATIVOS' | 'DETECTADOS' | 'MITIGANDO' | 'RESOLVIDOS'

const SEV_LABEL: Record<Severity, string> = {
  CRITICA: 'CRÍTICA',
  ALTA: 'ALTA',
  MEDIA: 'MÉDIA',
  BAIXA: 'BAIXA',
}

function SevPill({ s }: { s: Severity }) {
  return <span className={`cap-sev cap-sev-${s.toLowerCase()}`}>{SEV_LABEL[s]}</span>
}

function SideNav({ view }: { view: View }) {
  return (
    <nav className="area-side cap-stagger flex min-h-0 flex-col justify-start gap-3.5 pt-1" aria-label="Navegação lateral">
      {SIDE_NAV.map((n) => (
        <a
          key={n.id}
          href={`#${n.id}`}
          data-state={view === n.id ? 'active' : 'inactive'}
          className="cap-side-item flex items-center gap-2.5 px-4 py-3 text-left"
          aria-current={view === n.id ? 'page' : undefined}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dcebfd] text-[var(--cap-cyan)]">
            <n.icon className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-heading text-base font-extrabold text-[var(--cap-bright)]">{n.label}</span>
        </a>
      ))}
    </nav>
  )
}

function HeroPanel() {
  return (
    <section className="cap-panel cap-fade-in area-hero flex flex-col justify-center p-6 lg:p-7" aria-label="Apresentação do CAPYBER">
      <h1 className="font-heading text-2xl font-extrabold leading-snug text-[var(--cap-bright)] lg:text-[1.65rem]">
        O CAPYBER <span className="cap-gradient-text">protege seus endpoints.</span>
      </h1>
      <p className="font-heading mt-1 text-xl font-extrabold leading-snug text-[var(--cap-orange)] lg:text-[1.45rem]">
        Não blindamos apenas o perímetro; blindamos o dispositivo.
      </p>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--cap-text)]">
        O CAPYBER protege os notebooks, exchanges e bancos contra APTs patrocinadas por estados
        (China, Coreia do Norte, Rússia), hacktivistas e ameaças internas — sem depender de sorte
        nem de perímetro de rede.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <a href="#comando" className="cap-btn-primary inline-flex h-auto items-center px-3 py-2 text-[0.95rem]">
          <span className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/95">
            <Shield className="h-4 w-4 text-[var(--cap-orange-deep)]" aria-hidden />
          </span>
          <span className="text-left leading-tight">
            Abrir Centro
            <br />
            de Comando <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden />
          </span>
        </a>
        <a
          href="#trilha"
          className="cap-btn-ghost inline-flex h-auto items-center px-3 py-2.5 text-[0.95rem]"
        >
          <Gamepad2 className="mr-1.5 h-4 w-4 text-[#1d5fae]" aria-hidden />
          Treinar contra eng. social
        </a>
      </div>
    </section>
  )
}

function StatChip({ icon: Icon, color, value, label }: {
  icon: typeof Target
  color: string
  value: string
  label: string
}) {
  return (
    <div className="cap-chip flex items-center gap-2.5 px-3 py-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center" style={{ color }}>
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="font-heading cap-num whitespace-nowrap text-lg font-extrabold leading-tight text-[var(--cap-bright)]">{value}</div>
        <div className="text-[0.8rem] font-semibold leading-tight text-[var(--cap-text)]">{label}</div>
      </div>
    </div>
  )
}

function StatChips({ stats }: { stats: Stats | null }) {
  return (
    <div className="area-chips cap-stagger grid grid-cols-2 gap-3">
      <StatChip icon={Target} color="#e11d2e" value={stats ? stats.blockedTotal.toLocaleString('pt-BR') : '—'} label="Ataques neutralizados" />
      <StatChip icon={Coins} color="#21a44a" value={stats ? fmtBRL(stats.protectedBRL) : '—'} label="Valor protegido" />
      <StatChip
        icon={AlertTriangle}
        color="#e11d2e"
        value={stats ? String(stats.activeThreats) : '—'}
        label="Ameaças ativas"
      />
      <StatChip icon={ShieldCheck} color="#21a44a" value={stats ? `${stats.devicesSecure}/${stats.devicesTotal}` : '—'} label="Frota segura" />
    </div>
  )
}

function GlobePanel({ events, connected }: { events: ThreatEvent[]; connected: boolean }) {
  return (
    <div className="area-globe relative flex min-h-[320px] items-end justify-center lg:min-h-[430px]">
      <div className="globe-pedestal" aria-hidden />
      <div className="relative z-[1] h-[300px] w-full sm:h-[380px] lg:h-[420px]">
        <Globe3D events={events} fillParent />
      </div>
      {!connected && (
        <div className="cap-glass absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 rounded-xl">
          <GateSpiral size={44} spin title="Conectando ao motor" />
          <span className="cap-mono rounded-full border-2 border-[var(--cap-border)] bg-white/70 px-2.5 py-1 text-sm font-bold text-[var(--cap-dim)]">
            conectando ao motor…
          </span>
          {events.length > 0 && (
            <span className="cap-mono rounded-full border-2 border-[#d9770666] bg-[#d977060d] px-2.5 py-1 text-sm font-bold text-[#b45309]">
              exibindo último snapshot
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function RadarCard({ events, stats }: { events: ThreatEvent[]; stats: Stats | null }) {
  const active = useMemo(() => events.filter((e) => e.status !== 'NEUTRALIZADO').length, [events])
  return (
    <div className="cap-panel cap-fade-in p-4">
      <span className="cap-eyebrow">Varredura</span>
      <h3 className="font-heading mt-0.5 text-lg font-extrabold text-[var(--cap-bright)]">Radar de setores</h3>
      <p
        className="font-heading cap-num mt-1 text-4xl font-extrabold leading-none text-[var(--cap-orange)]"
        style={{ textShadow: '1.5px 1.5px 0 rgba(16,49,92,0.18)' }}
      >
        DEFCON {stats?.defcon ?? '—'}
      </p>
      <p className="font-heading mt-1.5 text-base font-extrabold leading-snug text-[var(--cap-bright)]">
        <span className="cap-num">{active}</span> sinal(is) na área –<br />
        <span className="text-[var(--cap-cyan)]">Varredura contínua</span>
      </p>
    </div>
  )
}

function OriginsCard({ stats }: { stats: Stats | null }) {
  const rows = useMemo(() => {
    if (!stats?.byCountry) return []
    return Object.entries(stats.byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [stats])
  return (
    <div className="cap-panel p-4">
      <span className="cap-eyebrow">Origens</span>
      <h3 className="font-heading mt-0.5 text-lg font-extrabold text-[var(--cap-bright)]">Top origens</h3>
      <ul className="cap-stagger mt-2 space-y-[3px]">
        {rows.map(([cc, n]) => (
          <li key={cc} className="flex items-center gap-2 rounded-md px-1 py-[3px] odd:bg-[#f2f8ff]">
            <Flag cc={cc} />
            <span className="cap-mono text-base font-bold text-[var(--cap-bright)]">{cc}</span>
            <span className="cap-mono cap-num ml-auto text-base font-semibold text-[var(--cap-bright)]">{n.toLocaleString('pt-BR')}</span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="cap-fade-in flex flex-col items-center gap-1.5 py-8 text-center">
            <Globe2 className="h-8 w-8 text-[var(--cap-faint)]" aria-hidden />
            <p className="text-base font-bold text-[var(--cap-dim)]">Sem dados de origem ainda</p>
            <p className="text-sm text-[var(--cap-faint)]">O ranking aparece assim que o motor reportar detecções.</p>
          </li>
        )}
      </ul>
    </div>
  )
}

function AdversariosCard() {
  return (
    <section className="cap-panel p-4" aria-label="Adversários que o CAPYBER enfrenta">
      <span className="cap-eyebrow">Adversários</span>
      <h3 className="font-heading mt-0.5 text-lg font-extrabold text-[var(--cap-bright)]">Adversários</h3>
      <ul className="cap-stagger mt-2 space-y-1.5">
        {ADVERSARIOS.map((a) => (
          <li key={a.name} className="flex items-center gap-2 rounded-md px-1 py-1 odd:bg-[#f2f8ff]">
            {a.cc ? (
              <Flag cc={a.cc} />
            ) : (
              <span className="flex h-[15px] w-[23px] items-center justify-center rounded-sm bg-[#10315c]">
                <UserX className="h-3 w-3 text-white" aria-hidden />
              </span>
            )}
            <span className="min-w-0 truncate text-[0.85rem] font-bold text-[var(--cap-bright)]">{a.name}</span>
            <span className="cap-mono ml-auto shrink-0 truncate text-right text-[0.72rem] text-[var(--cap-dim)]">{a.ttp}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PerigoPanel() {
  return (
    <section id="o-perigo" className="cap-danger-panel cap-fade-in area-perigo flex flex-col gap-3 p-4 lg:flex-row lg:items-stretch">
      <div className="min-w-0 lg:w-[42%]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 shrink-0 text-[#ffb020]" aria-hidden />
          <h2 className="font-heading text-xl font-extrabold text-[#ffb020]">O perigo</h2>
        </div>
        <h3 className="font-heading mt-1.5 text-lg font-extrabold leading-snug text-white">
          O ataque começa no notebook — não no mainframe
        </h3>
      </div>
      <div className="cap-stagger grid min-w-0 flex-1 grid-cols-3 gap-2">
        {PERIGO.map((c) => (
          <div key={c.t} className="cap-danger-card flex min-w-0 flex-col items-center p-2 text-center">
            <div className="flex h-[80px] items-end justify-center">
              <HoodFigure size={72} seed={c.seed} />
            </div>
            <p className="font-heading mt-1 whitespace-nowrap text-[0.9rem] font-extrabold leading-none text-white">{c.n}</p>
            <p className="mt-1 text-[0.78rem] font-bold leading-tight text-[#ffd3d9]">{c.t}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function DefesaPanel() {
  return (
    <section id="como-previne" className="cap-panel cap-fade-in area-defesa p-5">
      <span className="cap-eyebrow">Defesa em camadas</span>
      <div className="mt-1 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10315c]">
          <ShieldCheck className="h-5 w-5 text-white" aria-hidden />
        </span>
        <h2 className="font-heading text-2xl font-extrabold text-[var(--cap-bright)]">A defesa</h2>
      </div>
      <h3 className="font-heading mt-1 text-lg font-extrabold text-[var(--cap-cyan)]">
        6 camadas em volta do dispositivo
      </h3>
      <div className="cap-stagger mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {CAMADAS.map((c, i) => (
          <div
            key={c.label}
            className="cap-badge-shield cap-card-hover flex min-w-0 flex-col items-center px-1.5 pb-5 pt-2.5 text-center"
            style={{ hyphens: 'auto', overflowWrap: 'break-word' }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-[#3b8ade] to-[#1d5fae] text-base font-extrabold text-white shadow-[0_2px_6px_rgba(29,95,174,0.5)]">
              {i + 1}
            </span>
            <c.icon className="mt-2 h-6 w-6 shrink-0 text-[#2f7fd1]" aria-hidden />
            <span className="mb-3 mt-1.5 text-[0.8rem] font-bold leading-tight text-[var(--cap-bright)]">{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// Faixa de descoberta do OSINT na home — liga o "Projeto" ao mapa de cadeia de dados 3D.
const OSINT_FLOW = ['domínio', 'subdomínios', 'IPs', 'ASN · geo', 'e-mails', 'dorks']

// Task "hacker protege": como cada técnica ofensiva vira defesa AQUI no CAPYBER.
const HACKER_FLIP = [
  {
    attack: 'Reconhecimento: o invasor mapeia domínios, subdomínios e e-mails da sua empresa antes do golpe.',
    defense: 'Você usa a visão OSINT do CAPYBER para fazer o MESMO recon primeiro — e fechar o que estiver exposto antes que ele encontre.',
    view: 'osint' as View,
    cta: 'Abrir OSINT',
  },
  {
    attack: 'O adversário conhece o MITRE ATT&CK de cor e escolhe técnicas que seu antivírus não cobre.',
    defense: 'O CAPYBER detecta pelas TÉCNICAS (T1566, T1486, T1078…) e mostra em qual fase do ataque você está sendo atingido, com playbook de resposta.',
    view: 'comando' as View,
    cta: 'Ver detecções',
  },
  {
    attack: 'Antes de atacar de verdade, criminosos testam o payload em ambiente próprio para não deixar assinatura.',
    defense: 'No Laboratório você dispara as mesmas campanhas (ransomware, phishing, C2) contra a sua frota sintética — sem risco — e vê o EDR reagir.',
    view: 'lab' as View,
    cta: 'Entrar no Lab',
  },
  {
    attack: 'Engenharia social: o golpe funciona porque o time nunca caiu em um phishing treinado.',
    defense: 'A Trilha 3D gamifica o treinamento (com certificados) e o CTF do Fantasma ensina forense real: log, cripto, estego e e-mail — a mente do atacante a seu favor.',
    view: 'trilha' as View,
    cta: 'Jogar a Trilha',
  },
  {
    attack: 'O invasor permanece semanas dentro porque ninguém olhava os logs na madrugada.',
    defense: 'A VIGIA narra ameaças 24/7 em pt-BR, com horários configuráveis, e o Plano 40 transforma tudo em postura verificável — sem depender de sorte.',
    view: 'plano' as View,
    cta: 'Ver o Plano 40',
  },
]

function HackerShieldPanel() {
  return (
    <section
      id="hacker-protege"
      className="cap-panel area-hacker p-5"
      aria-label="Como um hacker protege sua empresa com o CAPYBER"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#6d3fd4]">
          <UserX className="h-5 w-5 text-white" aria-hidden />
        </span>
        <h2 className="font-heading text-2xl font-extrabold text-[var(--cap-bright)]">
          Como um <span className="text-[var(--cap-violet)]">hacker</span> protege sua empresa aqui
        </h2>
      </div>
      <p className="mt-2 max-w-4xl text-base leading-relaxed text-[var(--cap-text)]">
        A mesma mente que ataca é a melhor aliada na defesa. Cada linha abaixo mostra{' '}
        <strong className="text-[var(--cap-bright)]">o que o invasor faz</strong> — e{' '}
        <strong className="text-[var(--cap-bright)]">como você faz igual, do lado de dentro, usando este sistema agora</strong>.
        Clique em uma ação para abrir a visão correspondente.
      </p>
      <ol className="cap-stagger mt-4 grid gap-3 lg:grid-cols-2">
        {HACKER_FLIP.map((f, i) => (
          <li
            key={i}
            className="rounded-xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-4 transition-colors hover:border-[var(--cap-violet)]/50"
          >
            <div className="flex items-start gap-2">
              <span className="cap-sev cap-sev-critica shrink-0 rounded px-1.5 py-0.5 text-sm font-extrabold text-white">ATAQUE</span>
              <p className="min-w-0 text-base leading-snug text-[var(--cap-text)]">{f.attack}</p>
            </div>
            <div className="mt-2 flex items-start gap-2">
              <span className="cap-sev cap-sev-baixa shrink-0 rounded px-1.5 py-0.5 text-sm font-extrabold text-white">DEFESA</span>
              <p className="min-w-0 text-base leading-snug text-[var(--cap-text)]">
                {f.defense}{' '}
                <a href={`#${f.view}`} className="font-extrabold text-[var(--cap-cyan)] underline decoration-dotted hover:text-[var(--cap-bright)]">
                  {f.cta} →
                </a>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}


function OsintPanel() {
  return (
    <section className="cap-panel cap-fade-in area-osint relative overflow-hidden p-5" aria-label="Mapa OSINT — cadeia de dados em 3D">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(37,105,184,0.16),transparent_65%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(33,164,74,0.10),transparent_65%)]" aria-hidden />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2569b8] text-white shadow-[0_2px_8px_rgba(37,105,184,0.5)]">
              <Radar className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="font-heading text-2xl font-extrabold text-[var(--cap-bright)]">
              Mapa OSINT · cadeia de dados 3D
            </h2>
          </div>
          <p className="mt-1.5 max-w-[760px] text-base font-semibold leading-snug text-[var(--cap-text)]">
            Recon automático com <span className="font-extrabold text-[var(--cap-bright)]">fontes públicas reais</span> —
            cert-transparency (crt.sh), DNS, RDAP/WHOIS, Wayback Machine, GitHub e{' '}
            <em>Google Dorks</em> automatizados — encadeados num grafo 3D onde cada informação
            descoberta se liga à próxima, formando a cadeia do alvo.
          </p>
          <div className="cap-stagger mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2">
            {OSINT_FLOW.map((f, i) => (
              <span key={f} className="flex items-center gap-1.5">
                <span className="cap-mono rounded-md border-2 border-[#2569b8]/35 bg-[#2569b8]/10 px-2 py-0.5 text-[0.8rem] font-bold text-[#1d5fae]">
                  {f}
                </span>
                {i < OSINT_FLOW.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--cap-dim)]" aria-hidden />
                )}
              </span>
            ))}
          </div>
        </div>
        <a
          href="#osint"
          className="cap-btn-primary inline-flex shrink-0 items-center gap-2 self-start px-5 py-3 text-base font-extrabold lg:self-center"
        >
          <Radar className="h-5 w-5" aria-hidden />
          Abrir mapa OSINT
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </section>
  )
}

function BlindagemPanel() {
  const [fired, setFired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const firedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // limpa o timer pendente no unmount (setState em componente desmontado)
  useEffect(
    () => () => {
      if (firedTimerRef.current) clearTimeout(firedTimerRef.current)
    },
    []
  )

  async function simulate() {
    if (loading) return
    setLoading(true)
    setFailed(false)
    try {
      const res = await fetch('/api/scenario/trigger?XTransformPort=3003', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null
      // só anuncia sucesso com HTTP 2xx E ok do motor — nada de "DISPARADO" falso
      if (!res.ok || !data?.ok) {
        setFailed(true)
        return
      }
      setFired(true)
      if (firedTimerRef.current) clearTimeout(firedTimerRef.current)
      firedTimerRef.current = setTimeout(() => setFired(false), 7000)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="cap-panel cap-fade-in area-payload flex flex-col p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f7fd1] text-white shadow-[0_2px_8px_rgba(47,127,209,0.5)]">
          <Shield className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="font-heading text-lg font-extrabold text-[var(--cap-bright)]">
          Blindagem do dispositivo — agente CAPY
        </h2>
      </div>
      <ul className="cap-stagger mt-3 grid flex-1 grid-cols-2 gap-x-3 gap-y-[5px] self-center">
        {BLINDAGEM.map((c) => (
          <li key={c} className="flex items-center gap-2 text-base font-semibold text-[var(--cap-bright)]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#21a44a]">
              <Check className="h-3.5 w-3.5 text-white" aria-hidden />
            </span>
            {c}
          </li>
        ))}
      </ul>
      <Button
        onClick={simulate}
        disabled={loading}
        className="cap-btn-steel mt-3 h-11 w-full max-w-[280px] self-start text-base disabled:opacity-60"
      >
        <Zap className="mr-2 h-5 w-5 text-[#1d5fae]" aria-hidden />
        {loading ? 'DISPARANDO...' : 'SIMULAR ATAQUE AO ENDPOINT'}
      </Button>

      {fired && (
        <div className="cap-fade-in mt-3 rounded-xl border-2 border-[#d9770666] bg-[#d977060d] p-2.5">
          <span className="cap-mono text-base font-extrabold text-[#b45309]">CENÁRIO DISPARADO</span>
          <span className="ml-2 text-[0.9rem] text-[var(--cap-dim)]">
            acompanhe no Centro de Comando
          </span>
        </div>
      )}

      {failed && (
        <div role="alert" className="cap-fade-in mt-3 rounded-xl border-2 border-[#c0182b66] bg-[#c0182b0d] p-2.5">
          <span className="cap-mono text-base font-extrabold text-[#c0182b]">MOTOR INDISPONÍVEL</span>
          <span className="ml-2 text-[0.9rem] text-[var(--cap-dim)]">
            não foi possível disparar o cenário — tente novamente
          </span>
        </div>
      )}
    </section>
  )
}

function PosturaPanel({ devices }: { devices: Device[] }) {
  const rows = useMemo(() => {
    if (!devices.length) return []
    const keys = ['EDR', 'DISK_CRYPT', 'ALLOWLIST', 'USB_BLOCK', 'MDM', 'MFA_HARD', 'DLP']
    return keys.map((k) => {
      const n = devices.filter((d) => d.controls.some((c) => c.name === k && c.active)).length
      return { key: k, label: CONTROLE_LABEL[k] ?? k, pct: Math.round((n / devices.length) * 100) }
    })
  }, [devices])

  return (
    <section className="cap-panel cap-fade-in flex flex-col p-4" aria-label="Cobertura de controles da frota">
      <span className="cap-eyebrow">Postura</span>
      <div className="mt-1 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#21a44a] text-white shadow-[0_2px_8px_rgba(33,164,74,0.5)]">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="font-heading text-lg font-extrabold text-[var(--cap-bright)]">Postura de blindagem</h2>
      </div>
      <ul className="cap-stagger mt-3 flex-1 space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2 text-base">
            <span className="w-24 shrink-0 truncate text-[0.8rem] font-bold text-[var(--cap-bright)]">{r.label}</span>
            <div className="cap-xpbar h-2 flex-1">
              <i
                style={{
                  width: `${r.pct}%`,
                  background: r.pct >= 90 ? '#21a44a' : r.pct >= 60 ? '#f5920b' : '#c0182b',
                }}
              />
            </div>
            <span className="cap-mono cap-num w-10 shrink-0 text-right text-[0.8rem] font-bold text-[var(--cap-bright)]">{r.pct}%</span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="cap-fade-in flex flex-col items-center gap-1.5 py-6 text-center">
            <Laptop className="h-7 w-7 text-[var(--cap-faint)]" aria-hidden />
            <p className="text-base font-bold text-[var(--cap-dim)]">Aguardando a frota conectar…</p>
            <p className="text-sm text-[var(--cap-faint)]">A cobertura de controles aparece quando os agentes reportarem.</p>
          </li>
        )}
      </ul>
    </section>
  )
}

const TABS: { id: AlertFilter; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'CRITICA', label: 'Crítica' },
  { id: 'ALTA', label: 'Alta' },
  { id: 'MEDIA', label: 'Média' },
  { id: 'ATIVOS', label: 'Ativos' },
  { id: 'DETECTADOS', label: 'Detectados' },
  { id: 'MITIGANDO', label: 'Mitigando' },
  { id: 'RESOLVIDOS', label: 'Resolvidos' },
]

function AlertsPanel({ events, onEnter }: { events: ThreatEvent[]; onEnter: (v: View) => void }) {
  const [filter, setFilter] = useState<AlertFilter>('TODOS')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        switch (filter) {
          case 'TODOS': return true
          case 'ATIVOS': return e.status !== 'NEUTRALIZADO'
          case 'DETECTADOS': return e.status === 'DETECTADO'
          case 'MITIGANDO': return e.status === 'MITIGANDO'
          case 'RESOLVIDOS': return e.status === 'NEUTRALIZADO'
          default: return e.severity === filter
        }
      }),
    [events, filter]
  )

  return (
    <section className="cap-panel cap-fade-in area-alertas flex flex-col p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c0182b] text-white shadow-[0_2px_8px_rgba(192,24,43,0.5)]">
          <Settings className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <span className="cap-eyebrow">Ameaças</span>
          <h2 className="font-heading text-xl font-extrabold leading-tight text-[var(--cap-bright)]">Alertas em tempo real</h2>
        </div>
        <a
          href="#comando"
          className="cap-link-arrow ml-auto text-base font-bold text-[var(--cap-cyan)]"
        >
          Ver todos <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>

      <div className="mt-2 flex flex-nowrap items-center gap-x-2 overflow-x-auto" role="tablist" aria-label="Filtros de alertas">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={filter === t.id}
            onClick={() => setFilter(t.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.8rem] font-bold transition-colors ${
              filter === t.id
                ? 'bg-[var(--cap-yellow)] text-[#10315c] shadow-[0_2px_8px_rgba(255,176,32,0.5)]'
                : 'text-[var(--cap-bright)] hover:bg-[#eaf3fd]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-1.5 min-h-0 flex-1">
        <ul className="cap-scroll-slim cap-stagger min-h-0 space-y-0.5 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <li className="cap-fade-in flex flex-col items-center gap-1.5 py-8 text-center">
              <Shield className="h-8 w-8 text-[var(--cap-faint)]" aria-hidden />
              <p className="text-base font-bold text-[var(--cap-dim)]">Nenhum alerta para este filtro</p>
              <p className="text-sm text-[var(--cap-faint)]">Tudo tranquilo por aqui — ajuste os filtros para revisar outros eventos.</p>
            </li>
          )}
          {filtered.slice(0, 8).map((ev) => (
            <li key={ev.id} className="border-b border-[#eaf2fc] last:border-0">
              <button
                onClick={() => onEnter('comando')}
                title="Abrir no Centro de Comando"
                className="grid w-full grid-cols-[76px_minmax(0,1fr)_48px] items-center gap-x-2 rounded-lg px-1 py-[7px] text-left transition-colors hover:bg-[#f2f8ff] hover:shadow-[inset_3px_0_0_0_var(--cap-orange)] sm:grid-cols-[84px_minmax(0,1fr)_168px_56px]"
              >
                <SevPill s={ev.severity} />
                <span className="truncate text-[0.85rem] font-bold text-[var(--cap-bright)]">{ev.title}</span>
                <span className="hidden truncate text-[0.8rem] text-[var(--cap-dim)] sm:block">
                  {ev.origin.country} • {ev.origin.city}
                </span>
                <span className="cap-mono cap-num text-right text-[0.8rem] font-semibold text-[var(--cap-dim)]">
                  T+{Math.max(0, Math.round((now - ev.ts) / 1000))}s
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function FrotaPanel({ devices }: { devices: Device[] }) {
  return (
    <section className="cap-panel cap-fade-in area-frota flex flex-col p-4">
      <div className="min-w-0">
        <span className="cap-eyebrow">Frota</span>
        <h2 className="whitespace-nowrap font-heading text-[0.95rem] font-extrabold leading-tight text-[var(--cap-bright)]">Frota de endpoints</h2>
      </div>
      <a href="#frota" className="cap-stagger mt-2 grid flex-1 grid-cols-4 gap-1 text-center" aria-label="Abrir visão da frota">
        {TIPOS_FROTA.map((t) => {
          const n = devices.filter((d) => d.type === t.id).length
          return (
            <div key={t.id} className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl p-1 transition-colors hover:bg-[#f2f8ff]">
              <t.icon className="h-7 w-7 text-[#2f7fd1]" aria-hidden />
              <span className="whitespace-nowrap text-[0.75rem] font-semibold leading-tight text-[var(--cap-text)]">{t.label}</span>
              <span className="font-heading cap-num text-2xl font-extrabold leading-none text-[var(--cap-bright)]">
                {devices.length ? n : '—'}
              </span>
            </div>
          )
        })}
      </a>
      <span className="mt-2 inline-flex items-center justify-center gap-1.5 self-stretch whitespace-nowrap rounded-full bg-gradient-to-b from-[#2fb45f] to-[#1f9648] px-2 py-2 text-[0.85rem] font-extrabold text-white shadow-[0_4px_12px_rgba(33,164,74,0.45)]">
        <Shield className="h-4.5 w-4.5 shrink-0" aria-hidden />
        {devices.length ? `${devices.length} monitorados` : 'aguardando frota…'}
      </span>
    </section>
  )
}

export function Overview({
  view,
  onEnter,
  onOpenChat,
  stats,
  events,
  devices,
  connected,
}: {
  view: View
  onEnter: (v: View) => void
  onOpenChat: () => void
  stats: Stats | null
  events: ThreatEvent[]
  devices: Device[]
  connected: boolean
}) {
  return (
    <div className="dash-grid">
      <EngVideoPanel />
      <HeroPanel />
      <SideNav view={view} />
      <StatChips stats={stats} />
      <GlobePanel events={events} connected={connected} />

      <div className="area-rail cap-stagger flex min-h-0 flex-col gap-3.5">
        <RadarCard events={events} stats={stats} />
        <OriginsCard stats={stats} />
        <AdversariosCard />
        <button
          onClick={onOpenChat}
          className="group mx-auto mt-auto flex flex-col items-center pt-1"
          aria-label="Falar com o Capy Fantasma, assistente do SOC"
        >
          <MascotCapy size={168} className="cap-float drop-shadow-[0_14px_22px_rgba(47,127,209,0.35)]" />
          <span className="mt-1 rounded-full bg-white/85 px-3 py-0.5 text-[0.9rem] font-bold text-[var(--cap-cyan)] opacity-0 transition-opacity group-hover:opacity-100">
            Fale com o Capy Fantasma
          </span>
        </button>
      </div>

      <PerigoPanel />
      <DefesaPanel />
      <HackerShieldPanel />
      <OsintPanel />
      <BlindagemPanel />
      <PosturaPanel devices={devices} />
      <AlertsPanel events={events} onEnter={onEnter} />
      <FrotaPanel devices={devices} />
    </div>
  )
}
