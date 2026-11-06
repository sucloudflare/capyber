'use client'

// CAPYBER — Legado: "Enquanto isso, no mundo real" — marketing de defesa contra
// APTs patrocinadas por estados (Coreia do Norte, China, Rússia) que miram os
// DISPOSITIVOS internos (notebooks, celulares, PCs de devs) com engenharia
// social, drenando cripto, vazando dados e roubando dinheiro.

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase, Bug, CreditCard, Database, FileWarning, Fingerprint, Laptop,
  LockKeyhole, MessageSquareWarning, QrCode, Package, Smartphone, Usb,
  Wallet, ShieldX, ShieldCheck, Flame, Target,
} from 'lucide-react'
import { Flag, CapShield } from '@/components/art'

/* ───────────────────────────── dados dos grupos ────────────────────────── */

const GROUPS = [
  {
    name: 'Lazarus Group', cc: 'KP', accent: '#ff8f9c',
    headline: 'Operation Dream Job — o recrutador que não existe',
    lines: [
      'Vagas falsas em empresas de cripto; o “teste técnico” é um PDF/IDE armadilhado que instala o backdoor no notebook do dev.',
      'Drainers esperam a assinatura da carteira: o Bybit perdeu US$ 1,5 bi em 2025 num roteiro idêntico.',
      'Alvo favorito: notebook do desenvolvedor e o celular do analista — não o datacenter.',
    ],
  },
  {
    name: 'APT41', cc: 'CN', accent: '#ffb020',
    headline: 'Cadeia de suprimentos: o veneno vem de dentro do npm',
    lines: [
      'Pacotes typosquat e tokens vazados comprometem a máquina de build — o malware embarca no próximo deploy.',
      'Infostealers varrem navegadores e sessões: uma senha salva vale um repositório inteiro.',
      'Espionagem silenciosa por meses: o objetivo é credencial e propriedade intelectual, não ruído.',
    ],
  },
  {
    name: 'Sandworm', cc: 'RU', accent: '#7cb6ec',
    headline: 'Ransomware e wipe: destruição como estratégia',
    lines: [
      'Phishing direcionado a operadores com credenciais de VPN; movimento lateral até o impacto máximo.',
      'Wipers disfarçados de ransomware já derrubaram grids e portos — destruição antes do resgate.',
      'O endpoint é a porta: um único notebook vulnerável basta para parar a operação inteira.',
    ],
  },
]

const VECTORS = [
  { icon: Briefcase, label: 'Oferta de emprego falsa (PDF/IDE)' },
  { icon: QrCode, label: 'QR falso no estacionamento' },
  { icon: Package, label: 'Pacote npm typosquat' },
  { icon: MessageSquareWarning, label: 'Clonagem de voz no WhatsApp' },
  { icon: Smartphone, label: 'MFA fatigue no celular' },
  { icon: Usb, label: 'USB “perdido” no estacionamento' },
  { icon: CreditCard, label: 'Clerk de clipboard troca a carteira' },
  { icon: FileWarning, label: 'Zoom falso de “suporte de TI”' },
  { icon: Fingerprint, label: 'Infostealer no navegador do dev' },
]

const TICKER = [
  { t: '02:14', dev: 'NB-DEV-07', atk: 'Oferta de emprego maliciosa · Lazarus', act: 'BLOQUEADO em 1,2s', ok: true },
  { t: '03:33', dev: 'CEL-FIN-12', atk: 'MFA fatigue · 47 pushes', act: 'NEGADO por FIDO2', ok: true },
  { t: '05:02', dev: 'WS-SOC-03', atk: 'Infostealer no navegador', act: 'ISOLADO + credenciais rotacionadas', ok: true },
  { t: '09:41', dev: 'SRV-EXCH-01', atk: 'Pacote npm typosquat · APT41', act: 'BUILD BLOQUEADA no allowlist', ok: true },
  { t: '11:18', dev: 'NB-DEV-07', atk: 'Drainer aguardando assinatura Web3', act: 'TRANSAÇÃO INTERROMPIDA', ok: true },
  { t: '14:26', dev: 'CEL-FIN-12', atk: 'Vishing com voz clonada do “CFO”', act: 'MARCADO + alerta ao SOC', ok: true },
  { t: '17:55', dev: 'WS-SOC-03', atk: 'USB com payload de arranque', act: 'USB OFF pela política', ok: true },
  { t: '21:03', dev: 'SRV-EXCH-01', atk: 'Beacon C2 pós-phishing · Sandworm', act: 'BLOQUEADO em 0,8s', ok: true },
]

const RESPONSE = [
  { vector: 'Recrutador falso + payload', control: 'VIGIA IA + sandbox de anexos', result: 'Abertura neutralizada' },
  { vector: 'Roubo de sessão / MFA fatigue', control: 'MFA FIDO2 com number matching', result: 'Phishing inútil' },
  { vector: 'Supply chain no build', control: 'Allowlist de apps + SBOM', result: 'Execução bloqueada' },
  { vector: 'Drainer no navegador', control: 'EDR comportamental + DLP', result: 'Assinatura interrompida' },
  { vector: 'Movimento lateral', control: 'Microssegmentação + kill chain viva', result: 'Trajetória cortada' },
  { vector: 'Exfiltração de dados', control: 'DLP + UEBA na frota', result: 'Canal fechado' },
]

/* ───────────────────────── mapa abstrato de ataques ────────────────────── */

function AttackMap() {
  // coordenadas percentuais no palco
  const origins = [
    { x: 84, y: 20, cc: 'KP', label: 'Pyongyang' },
    { x: 73, y: 31, cc: 'CN', label: 'Pequim' },
    { x: 55, y: 13, cc: 'RU', label: 'Moscou' },
  ]
  const targets = [
    { x: 28, y: 56, icon: Laptop, label: 'Notebook do dev' },
    { x: 44, y: 76, icon: Smartphone, label: 'Celular do analista' },
    { x: 14, y: 80, icon: Database, label: 'Exchange / cripto' },
  ]
  return (
    <div className="relative h-[280px] overflow-hidden rounded-2xl border border-[#1f3a5c] bg-[#060d19] sm:h-[300px]" aria-hidden>
      {/* grade */}
      <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'linear-gradient(#2f7fd1 1px, transparent 1px), linear-gradient(90deg, #2f7fd1 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
      {/* vínculos de ataque */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {origins.map((o, i) =>
          targets.map((t, j) => (
            <path
              key={`${i}-${j}`}
              d={`M ${o.x} ${o.y} Q ${(o.x + t.x) / 2} ${Math.min(o.y, t.y) - 14} ${t.x} ${t.y}`}
              fill="none"
              stroke={i === 0 ? '#ff8f9c' : i === 1 ? '#ffb020' : '#7cb6ec'}
              strokeWidth="0.45"
              strokeDasharray="2.4 2"
              className="capy-dash"
              style={{ animationDelay: `${(i * 3 + j) * 0.7}s`, opacity: 0.85 }}
            />
          )),
        )}
      </svg>
      {/* origens */}
      {origins.map((o) => (
        <div key={o.cc} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${o.x}%`, top: `${o.y}%` }}>
          <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-[#c0182b]/40" />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ff8f9c]/70 bg-[#200a10]">
            <Flag cc={o.cc} className="h-4 w-4" />
          </span>
          <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[0.6rem] font-bold text-[#ff8f9c]">{o.label}</span>
        </div>
      ))}
      {/* alvos */}
      {targets.map((t) => (
        <div key={t.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#21a44a]/60 bg-[#08210f] text-[#4be38a]">
            <t.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </span>
          <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[0.6rem] font-bold text-[#4be38a]">{t.label}</span>
        </div>
      ))}
      {/* rodapé */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#1f3a5c] bg-[#060d19]/80 px-3 py-1.5 text-[0.62rem] font-bold tracking-wider text-[#6d94c4]">
        <span className="hidden sm:inline">MAPA DE TTPs · SÍNTESE ILUSTRATIVA</span>
        <span className="flex items-center gap-1 text-[#ff8f9c]"><Flame className="h-3 w-3" /> 3 estados-nação · 24/7</span>
      </div>
    </div>
  )
}

/* ───────────────────────────── ticker ao vivo ──────────────────────────── */

function LiveTicker() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setIdx((i) => (i + 1) % TICKER.length), 2600)
    return () => clearInterval(iv)
  }, [])
  const e = TICKER[idx]
  return (
    <div className="rounded-2xl border border-[#1f3a5c] bg-[#081120] p-3">
      <p className="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#6d94c4]">
        <Target className="h-4 w-4 text-[#ff8f9c]" aria-hidden /> Últimas 24h numa frota protegida
        <span className="ml-auto flex items-center gap-1 text-[#4be38a]"><span className="cap-dot-live" aria-hidden /> AO VIVO</span>
      </p>
      <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.85rem]">
        <span className="font-bold text-[#7cb6ec]">{e.t}</span>
        <span className="rounded bg-[#133a68] px-1.5 py-0.5 text-[0.75rem] font-bold text-white">{e.dev}</span>
        <span className="text-[#c8ddf2]">{e.atk}</span>
        <span className="ml-auto flex items-center gap-1 font-black text-[#4be38a]">
          <ShieldCheck className="h-4 w-4" aria-hidden /> {e.act}
        </span>
      </motion.div>
    </div>
  )
}

/* ───────────────────────────── seção completa ──────────────────────────── */

export function AptWar({ onBuy }: { onBuy: () => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border-2 border-[#1f3a5c] bg-gradient-to-b from-[#081120] to-[#040a14] p-4 text-[#e8f2ff] shadow-[0_20px_80px_rgba(4,10,20,0.5)] sm:p-6">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[#ff8f9c]">Enquanto isso, no mundo real…</p>
      <h3 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
        As maiores APTs do planeta não atacam vulnerabilidades.
        <span className="text-[#ffb020]"> Atacam pessoas — e os dispositivos delas.</span>
      </h3>
      <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-[#c8ddf2]">
        Notebook do dev, celular do analista, workstation do exchange. Engenharia social em massa, drenagem de
        cripto, vazamento de dados e roubo direto de dinheiro — patrocinados por Coreia do Norte, China e Rússia.
        É contra isso que a CAPYBER foi construída.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <AttackMap />
        <div className="space-y-2.5">
          {GROUPS.map((g, i) => (
            <motion.article
              key={g.name}
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="rounded-2xl border border-[#1f3a5c] bg-[#0d1e35]/80 p-3.5"
            >
              <p className="flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-9 items-center justify-center overflow-hidden rounded border border-[#1f3a5c] bg-[#081120]">
                  <Flag cc={g.cc} className="h-4 w-6" />
                </span>
                <span className="text-[0.95rem] font-black tracking-wide" style={{ color: g.accent }}>{g.name}</span>
                <span className="rounded bg-[#5c0e18]/60 px-1.5 py-0.5 text-[0.6rem] font-black tracking-widest text-[#ff8f9c]">ESTADO-NAÇÃO</span>
              </p>
              <p className="mt-1 text-[0.9rem] font-bold text-white">{g.headline}</p>
              <ul className="mt-1.5 space-y-1">
                {g.lines.map((l) => (
                  <li key={l.slice(0, 24)} className="flex gap-1.5 text-[0.8rem] leading-snug text-[#c8ddf2]">
                    <ShieldX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff8f9c]" aria-hidden /> {l}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>

      {/* vetores */}
      <p className="mt-5 text-[0.72rem] font-black uppercase tracking-[0.24em] text-[#6d94c4]">Vetores de engenharia social em massa</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {VECTORS.map((v) => (
          <span key={v.label} className="flex items-center gap-1.5 rounded-full border border-[#1f3a5c] bg-[#0d1e35] px-2.5 py-1 text-[0.78rem] font-bold text-[#c8ddf2]">
            <v.icon className="h-3.5 w-3.5 text-[#ffb020]" aria-hidden /> {v.label}
          </span>
        ))}
      </div>

      {/* ticker */}
      <div className="mt-4">
        <LiveTicker />
      </div>

      {/* resposta CAPYBER */}
      <div className="mt-5 rounded-2xl border border-[#21a44a]/40 bg-[#07170d]/80 p-4">
        <p className="flex items-center gap-2 text-[0.95rem] font-black text-[#4be38a] sm:text-base">
          <CapShield size={28} /> A resposta CAPYBER — vetor a vetor
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {RESPONSE.map((r) => (
            <div key={r.vector} className="rounded-xl border border-[#134d2a] bg-[#081f12] p-2.5">
              <p className="text-[0.78rem] font-bold text-[#ff8f9c]">{r.vector}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[0.8rem] font-bold text-[#e8f2ff]">
                <LockKeyhole className="h-3.5 w-3.5 shrink-0 text-[#4be38a]" aria-hidden /> {r.control}
              </p>
              <p className="mt-0.5 text-[0.72rem] font-black uppercase tracking-wider text-[#4be38a]">✓ {r.result}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="flex items-center gap-2 text-center text-[0.9rem] font-bold text-[#e8f2ff] sm:text-left">
            <Wallet className="h-5 w-5 shrink-0 text-[#ffb020]" aria-hidden />
            Sua empresa pode ter essa defesa hoje — com o time que você já formou.
          </p>
          <button
            onClick={onBuy}
            className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-[#ffb24d] to-[#f5920b] px-6 text-[0.95rem] font-black tracking-wide text-[#10315c] shadow-[0_8px_30px_rgba(245,146,11,0.35)] transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Bug className="h-4 w-4" aria-hidden /> Quero essa defesa
          </button>
        </div>
      </div>

      <p className="mt-3 text-center text-[0.68rem] leading-relaxed text-[#6d94c4]">
        Conteúdo educativo com dados ilustrativos. TTPs são públicos e documentados (MITRE ATT&CK · relatórios abertos);
        nenhuma técnica ofensiva é executada nesta página.
      </p>
    </section>
  )
}
