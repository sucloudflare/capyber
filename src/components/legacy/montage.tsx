'use client'

// CAPYBER — Montagem "Legado": simulação ilustrada da carreira do operador.
// Jornal com 20 CVEs → banco de CVEs → crachá SOC → blogs → podcast → prêmio
// → ponte para a oferta da ferramenta. 100% ilustrada com DOM/SVG (sem imagens).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, Bug, Briefcase, Newspaper, Podcast,
  Award, Play, Pause, Radio, Eye, Flame, ShieldCheck, Wallet, ArrowRight,
  Terminal, TrendingUp, Users,
} from 'lucide-react'
import { MascotCapy, CapyBadge } from '@/components/art'
import { firstName } from '@/lib/legacy'

/* ─────────────────────────── cenas e durações ─────────────────────────── */

type SceneId = 'boot' | 'jornal' | 'cves' | 'soc' | 'blogs' | 'podcast' | 'award' | 'cta'

const SCENES: { id: SceneId; label: string; ms: number }[] = [
  { id: 'boot', label: 'Restaurando memória', ms: 4200 },
  { id: 'jornal', label: 'Jornal', ms: 8000 },
  { id: 'cves', label: '20 CVEs', ms: 8000 },
  { id: 'soc', label: 'SOC', ms: 7200 },
  { id: 'blogs', label: 'Blogs tech', ms: 7600 },
  { id: 'podcast', label: 'Podcast', ms: 8000 },
  { id: 'award', label: 'Prêmio', ms: 7000 },
  { id: 'cta', label: 'Próximo passo', ms: 0 }, // última cena: só sai por botão
]

const BOOT_LINES = [
  '> montando linha do tempo da carreira…',
  '> buscando capa de jornal de 14/03/2026…',
  '> compilando 20 CVEs coordenadas…',
  '> sincronizando episódios de podcast…',
  '> simulação pronta. reproduzindo.',
]

interface SceneProps {
  name: string
}

/* ──────────────────────────── helpers visuais ─────────────────────────── */

function RollingNumber({ to, ms = 1400 }: { to: number; ms?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms])
  return <>{n}</>
}

function Confetti({ n = 26 }: { n?: number }) {
  // hash determinístico puro (sem Math.random nem mutação durante o render)
  const hashN = (i: number, salt: number): number => {
    let x = (i + 1) * 374761393 + salt * 668265263
    x = (x ^ (x >> 13)) * 1274126177
    x = x ^ (x >> 16)
    return (x >>> 0) / 4294967296
  }
  const pieces = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        i,
        left: hashN(i, 1) * 100,
        delay: hashN(i, 2) * 2.5,
        dur: 2.6 + hashN(i, 3) * 2.4,
        size: 6 + hashN(i, 4) * 7,
        color: ['#21a44a', '#f5920b', '#8b5cf6', '#ffb020', '#4ade80'][i % 5],
        rot: hashN(i, 5) * 360,
      })),
    [n],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <i
          key={p.i}
          className="capy-confetti absolute block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  )
}

/* ───────────────────────────────── cenas ──────────────────────────────── */

function BootScene() {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setShown((s) => Math.min(BOOT_LINES.length, s + 1)), 620)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-[#1f3a5c] bg-[#081120]/95 p-5 font-mono text-[0.95rem] leading-relaxed text-[#7cb6ec] shadow-2xl sm:p-7 sm:text-base">
      <div className="mb-3 flex items-center gap-2 border-b border-[#1f3a5c] pb-2 text-[#4be38a]">
        <Terminal className="h-4 w-4" aria-hidden />
        <span className="font-bold tracking-wider">CAPYBER · SIMULAÇÃO DE CARREIRA</span>
        <span className="ml-auto flex items-center gap-1 text-[0.8rem]">
          <span className="cap-dot-live" aria-hidden /> REC
        </span>
      </div>
      {BOOT_LINES.slice(0, shown).map((l, i) => (
        <motion.p key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="capy-fade-line">
          {l}
          {i === shown - 1 && shown < BOOT_LINES.length && <span className="capy-caret">▌</span>}
        </motion.p>
      ))}
    </div>
  )
}

function JornalScene({ name }: SceneProps) {
  return (
    <motion.div
      initial={{ rotate: -7, y: 60, opacity: 0, scale: 0.94 }}
      animate={{ rotate: -1.5, y: 0, opacity: 1, scale: 1 }}
      exit={{ rotate: 2, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      className="relative w-full max-w-3xl"
    >
      <div className="absolute inset-x-3 top-3 h-full rounded-md bg-[#e7dfc8] shadow-xl" aria-hidden />
      <article className="relative rounded-md bg-[#f8f3e4] p-4 text-[#211c12] shadow-2xl sm:p-6">
        {/* masthead */}
        <header className="border-b-4 border-double border-[#211c12] pb-1.5 text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#6b6250] sm:text-[0.72rem]">
            <span>Edição 4.213</span><span>•</span><span>São Paulo, 14 de março de 2026</span><span>•</span><span>R$ 7,90</span>
          </p>
          <h2 className="text-[1.7rem] font-black tracking-tight sm:text-4xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            GAZETA DO BIT
          </h2>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#6b6250] sm:text-[0.75rem]">
            Tecnologia • Segurança • Sociedade
          </p>
        </header>

        <p className="mt-2 inline-block -rotate-3 border-[3px] border-[#b3121f] px-2 py-0.5 text-sm font-black uppercase tracking-widest text-[#b3121f] sm:text-base">
          Extra!
        </p>

        <h3 className="mt-1 text-center text-[1.45rem] font-black leading-tight sm:text-[2.1rem]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
          “{name} vira fenômeno global da cibersegurança”
        </h3>
        <p className="mt-1 text-center text-[0.85rem] italic text-[#4c4536] sm:text-base" style={{ fontFamily: 'Georgia, serif' }}>
          Com 20 CVEs coordenadas e trajetória meteórica em SOC, pesquisador(a) do CAPYBER é capa mundial
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
          {/* foto */}
          <figure className="overflow-hidden rounded-sm border border-[#c9bfa4] bg-gradient-to-b from-[#10315c] to-[#1d4d7f]">
            <div className="flex h-32 items-center justify-center sm:h-40">
              <MascotCapy size={110} />
            </div>
            <figcaption className="bg-[#211c12] px-2 py-1 text-[0.62rem] italic text-[#e8dfc8] sm:text-[0.7rem]" style={{ fontFamily: 'Georgia, serif' }}>
              O(a) pesquisador(a) em seu datacenter — foto: arquivo CAPYBER (reconstituição)
            </figcaption>
          </figure>
          {/* texto em colunas */}
          <div className="text-justify text-[0.72rem] leading-snug text-[#2a2418] sm:text-[0.8rem]" style={{ fontFamily: 'Georgia, serif', columnCount: 2, columnGap: '1rem' }}>
            <p className="mb-1.5">
              <span className="float-left mr-1 text-4xl font-black leading-[0.8] sm:text-5xl">{name.charAt(0)}</span>
              ecomeçou como visitante curioso numa plataforma de treino e termina a semana como o nome mais citado da Blue Team nacional. Vinte vulnerabilidades coordenadas com Microsoft, Google e AWS renderam o apelido de “A Fonte” entre colegas de profissão.
            </p>
            <p className="mb-1.5">
              No SOC do CapyBank, onde lidera o time de caça a ameaças, {firstName(name)} derrubou uma campanha de drainers que já havia drenado R$ 40 milhões — antes que a próxima assinatura acontecesse.
            </p>
            <p>
              “Não existe talento, existe treino”, resumiu ao jornal. A reportagem que você lê é a simulação do que acontece quando alguém conclui TODAS as experiências do CAPYBER.
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-[#c9bfa4] pt-1 text-[0.6rem] font-semibold uppercase tracking-widest text-[#6b6250] sm:text-[0.68rem]">
          <span>Página 1 • Caderno de Tecnologia</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden /> 2,4 mi de leitores</span>
        </div>
      </article>
    </motion.div>
  )
}

const CVE_CARDS = [
  { id: 'CVE-2026-21007', cvss: '9.8', sev: 'CRÍTICA', desc: 'Deserialização insegura no gateway de pagamentos permite RCE sem autenticação.' },
  { id: 'CVE-2026-18341', cvss: '9.1', sev: 'CRÍTICA', desc: 'Contorna assinatura de transações Web3 e drena carteiras via aprovação forjada.' },
  { id: 'CVE-2025-40219', cvss: '8.7', sev: 'ALTA', desc: 'Escala de privilégio em agente EDR usado por bancos de 12 países.' },
  { id: 'CVE-2025-31764', cvss: '8.4', sev: 'ALTA', desc: 'Injeção em pipeline CI/CD planta backdoor em builds de exchange.' },
  { id: 'CVE-2025-28830', cvss: '7.9', sev: 'ALTA', desc: 'XSS persistente em painel SOC executado no navegador do analista.' },
  { id: 'CVE-2024-19953', cvss: '7.5', sev: 'MÉDIA', desc: 'Vazamento de memória expõe chaves de sessão em endpoints móveis.' },
]

function CvesScene({ name }: SceneProps) {
  return (
    <div className="w-full max-w-3xl">
      <div className="mb-3 rounded-2xl border border-[#1f3a5c] bg-[#0a1526]/95 p-4 shadow-2xl sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#133a68] text-[#7cb6ec]"><Bug className="h-5 w-5" aria-hidden /></span>
          <div className="min-w-0">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#6d94c4]">NVD · Base Nacional de Vulnerabilidades</p>
            <p className="truncate text-base font-extrabold text-white sm:text-xl">Créditos de {name}</p>
          </div>
          <div className="ml-auto flex items-baseline gap-1 rounded-xl bg-[#0e2a4d] px-3 py-1.5">
            <span className="text-3xl font-black text-[#4be38a] sm:text-4xl"><RollingNumber to={20} /></span>
            <span className="text-sm font-bold text-[#6d94c4]">CVEs</span>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {CVE_CARDS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.22 }}
              className="rounded-xl border border-[#1f3a5c] bg-[#0d1e35] p-2.5"
            >
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-black ${c.sev === 'CRÍTICA' ? 'bg-[#5c0e18] text-[#ff8f9c]' : c.sev === 'ALTA' ? 'bg-[#54330a] text-[#ffb020]' : 'bg-[#0e3a55] text-[#7cb6ec]'}`}>
                  CVSS {c.cvss} · {c.sev}
                </span>
                <span className="ml-auto font-mono text-[0.78rem] font-bold text-[#7cb6ec]">{c.id}</span>
              </div>
              <p className="mt-1 text-[0.8rem] leading-snug text-[#c8ddf2]">{c.desc}</p>
              <p className="mt-1 text-[0.68rem] text-[#6d94c4]">Coordenada por {name} · relatada de forma responsável · corrigida</p>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}
          className="mt-3 flex items-center justify-center gap-2 text-center text-[0.8rem] font-bold text-[#4be38a]"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          +14 CVEs adicionais reconhecidas por Microsoft, Google e AWS — hall completo no perfil público
        </motion.p>
      </div>
    </div>
  )
}

function SocScene({ name }: SceneProps) {
  return (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-[auto_1fr]">
      {/* crachá */}
      <motion.div
        initial={{ rotateY: -80, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 14 }}
        className="mx-auto w-60 shrink-0 rounded-2xl border border-[#1f3a5c] bg-gradient-to-b from-[#0e2a4d] to-[#081120] p-3 shadow-2xl"
      >
        <div className="flex items-center justify-between rounded-t-xl bg-[#f5920b] px-2.5 py-1">
          <span className="text-[0.7rem] font-black tracking-[0.22em] text-[#10315c]">CAPYBANK</span>
          <Briefcase className="h-4 w-4 text-[#10315c]" aria-hidden />
        </div>
        <div className="mt-2 flex flex-col items-center gap-1.5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-[#1f3a5c] bg-[#0a1b31]">
            <MascotCapy size={62} />
          </div>
          <p className="text-center text-base font-black leading-tight text-white">{name}</p>
          <p className="rounded-full bg-[#133a68] px-2 py-0.5 text-center text-[0.68rem] font-bold uppercase tracking-wider text-[#7cb6ec]">
            Analista SOC · Tier 3
          </p>
          <p className="text-center text-[0.68rem] text-[#6d94c4]">Threat Hunting &amp; Resposta</p>
          <div className="mt-1 w-full rounded-lg border border-dashed border-[#1f3a5c] px-2 py-1 text-center font-mono text-[0.7rem] text-[#4be38a]">
            MATRÍCULA CB-77421 · VÁLIDO
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-[#1f3a5c] bg-[#0d1e35] p-4 shadow-xl">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#6d94c4]">Contratação em destaque</p>
          <p className="mt-1 text-base leading-snug text-white sm:text-lg">
            “Contratar <strong className="text-[#ffb020]">{firstName(name)}</strong> foi o melhor investimento do trimestre.
            Em 90 dias, o MTTD caiu 83% e nenhum drainer tocou nossos clientes.”
          </p>
          <p className="mt-1.5 text-[0.75rem] text-[#6d94c4]">— CISO do CapyBank, entrevista interna</p>
        </motion.div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'MTTD', v: '4 min', d: '−83%' },
            { k: 'MTTR', v: '22 min', d: '−61%' },
            { k: 'Falsos positivos', v: '1,8%', d: '−92%' },
          ].map((s, i) => (
            <motion.div key={s.k} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55 + i * 0.18 }}
              className="rounded-xl border border-[#1f3a5c] bg-[#0a1526] p-2.5 text-center">
              <p className="text-[0.62rem] font-bold uppercase tracking-wider text-[#6d94c4]">{s.k}</p>
              <p className="text-lg font-black text-[#4be38a] sm:text-xl">{s.v}</p>
              <p className="flex items-center justify-center gap-0.5 text-[0.65rem] font-bold text-[#ffb020]"><TrendingUp className="h-3 w-3" aria-hidden />{s.d}</p>
            </motion.div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex items-center justify-center gap-2 text-center text-[0.8rem] font-bold text-[#7cb6ec]">
          <Users className="h-4 w-4" aria-hidden /> Squad Corvo · escala 4x2 · caça a APTs patrocinadas por estados
        </motion.p>
      </div>
    </div>
  )
}

function BlogsScene({ name }: SceneProps) {
  const BLOGS = [
    {
      brand: 'TheHackerCapy', dot: '#21a44a', tag: 'DESTAQUE',
      title: <>Pesquisador(a) do CAPYBER que coordenou <strong className="text-[#ffb020]">20 CVEs</strong> explica como desmontou uma campanha de drainers</>,
      meta: '128 mil leituras · #1 em tendências',
    },
    {
      brand: 'BleepingCapivara', dot: '#f5920b', tag: 'PERFIL',
      title: <>De visitante a referência em Blue Team: a jornada de <strong className="text-[#ffb020]">{name}</strong> começou em uma simulação</>,
      meta: '86 mil leituras · 12,4 mil compartilhamentos',
    },
    {
      brand: 'CapSec Daily', dot: '#8b5cf6', tag: 'ANÁLISE',
      title: <>Newsletter: as 5 descobertas da semana que você precisa conhecer <em>(spoiler: 4 são do mesmo autor)</em></>,
      meta: '42 mil assinantes · taxa de abertura 71%',
    },
  ]
  return (
    <div className="w-full max-w-3xl space-y-2.5">
      <p className="text-center text-[0.72rem] font-bold uppercase tracking-[0.24em] text-[#6d94c4]">A imprensa de tecnologia percebeu</p>
      {BLOGS.map((b, i) => (
        <motion.article
          key={b.brand}
          initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.3, type: 'spring', stiffness: 110, damping: 15 }}
          className="flex items-start gap-3 rounded-2xl border border-[#1f3a5c] bg-[#0d1e35] p-3.5 shadow-xl sm:p-4"
        >
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${b.dot}22`, color: b.dot }}>
            <Newspaper className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1.5 text-[0.8rem] font-black text-white"><i className="h-2 w-2 rounded-full" style={{ background: b.dot }} aria-hidden />{b.brand}</span>
              <span className="rounded bg-[#133a68] px-1.5 py-0.5 text-[0.6rem] font-black tracking-wider text-[#7cb6ec]">{b.tag}</span>
            </p>
            <h4 className="mt-0.5 text-sm font-bold leading-snug text-[#e8f2ff] sm:text-base">{b.title}</h4>
            <p className="mt-1 text-[0.72rem] text-[#6d94c4]">{b.meta}</p>
          </div>
        </motion.article>
      ))}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }} className="flex items-center justify-center gap-2 text-center text-[0.8rem] font-bold text-[#4be38a]">
        <Flame className="h-4 w-4" aria-hidden /> Nome em alta no X, Reddit e LinkedIn por 11 dias seguidos
      </motion.p>
    </div>
  )
}

const PODCAST_QUOTES = [
  '“A pergunta não é SE vão atacar seus devs. É QUANDO — e por qual dispositivo.”',
  '“Drainers não quebram senhas: esperam a assinatura certa. Defesa é ritmo, não muralha.”',
  '“Todo dev deveria passar pela Trilha do CAPYBER antes de tocar em produção.”',
]

function PodcastScene({ name }: SceneProps) {
  const [q, setQ] = useState(0)
  const [playing, setPlaying] = useState(true)
  useEffect(() => {
    const iv = setInterval(() => setQ((n) => (n + 1) % PODCAST_QUOTES.length), 2600)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-3xl border border-[#1f3a5c] bg-[#0a1526]/95 p-4 shadow-2xl sm:p-6">
        <div className="flex items-center gap-4">
          <motion.div
            animate={playing ? { boxShadow: ['0 0 0px #f5920b', '0 0 24px #f5920b88', '0 0 0px #f5920b'] } : {}}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#f5920b] to-[#c76e00] text-[#10315c] sm:h-24 sm:w-24"
          >
            <Podcast className="h-7 w-7" aria-hidden />
            <span className="text-[0.6rem] font-black tracking-widest">TECHCAST BR</span>
          </motion.div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#f5920b]">
              <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden /> AO VIVO · Ep. 234
            </p>
            <h4 className="text-base font-black leading-tight text-white sm:text-xl">
              De zero a 20 CVEs: a jornada de {firstName(name)}
            </h4>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.72rem] text-[#6d94c4]">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden /> 4,2 mil ouvintes agora</span>
              <span className="flex items-center gap-1"><Wallet className="h-3 w-3" aria-hidden /> patrocínio: CAPYBER</span>
            </p>
          </div>
        </div>

        {/* waveform */}
        <div className="mt-4 flex h-12 items-end justify-center gap-[3px]" aria-hidden>
          {Array.from({ length: 36 }, (_, i) => (
            <i
              key={i}
              className="capy-wave inline-block w-[5px] rounded-full bg-gradient-to-t from-[#f5920b] to-[#ffb020]"
              style={{ height: `${18 + ((i * 7919) % 70)}%`, animationDelay: `${(i % 12) * 0.09}s`, animationPlayState: playing ? 'running' : 'paused' }}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5920b] text-[#10315c] transition-transform hover:scale-105"
            aria-label={playing ? 'Pausar prévia simulada' : 'Tocar prévia simulada'}
          >
            {playing ? <Pause className="h-5 w-5" aria-hidden /> : <Play className="h-5 w-5" aria-hidden />}
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#133a68]">
            <motion.div className="h-full rounded-full bg-[#f5920b]" initial={{ width: '8%' }} animate={{ width: playing ? '62%' : '8%' }} transition={{ duration: 5, ease: 'linear' }} />
          </div>
          <span className="font-mono text-[0.72rem] text-[#6d94c4]">41:07</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={q}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="mt-3 rounded-xl border border-[#1f3a5c] bg-[#0d1e35] px-3 py-2 text-center text-[0.85rem] font-semibold italic leading-snug text-[#e8f2ff] sm:text-base"
          >
            {PODCAST_QUOTES[q]}
          </motion.p>
        </AnimatePresence>
        <p className="mt-2 text-center text-[0.7rem] text-[#6d94c4]">Também em: Flow Pod, Segue o Sec e DevSemCafé — as 3 maiores audiências tech do país</p>
      </div>
    </div>
  )
}

function AwardScene({ name }: SceneProps) {
  return (
    <div className="relative w-full max-w-2xl text-center">
      <Confetti />
      <motion.div
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 130, damping: 12 }}
        className="relative mx-auto flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40"
      >
        <i className="capy-rays absolute inset-[-30px] rounded-full" aria-hidden />
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#ffd54d] to-[#c76e00] shadow-[0_10px_40px_rgba(255,180,40,0.5)] sm:h-36 sm:w-36">
          <Award className="h-14 w-14 text-[#10315c] sm:h-20 sm:w-20" aria-hidden />
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-4">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[#ffb020]">Prêmio Nacional de Hacking Ético 2026</p>
        <h3 className="mt-1 text-2xl font-black text-white sm:text-4xl">{name}</h3>
        <p className="text-base font-bold text-[#7cb6ec] sm:text-lg">Pesquisador(a) de Segurança do Ano</p>
        <div className="mx-auto mt-3 flex max-w-md flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-[#1f3a5c] bg-[#0d1e35] px-3 py-1 text-[0.75rem] font-bold text-[#e8f2ff]">20 CVEs coordenadas</span>
          <span className="rounded-full border border-[#1f3a5c] bg-[#0d1e35] px-3 py-1 text-[0.75rem] font-bold text-[#e8f2ff]">Analista SOC N3</span>
          <span className="rounded-full border border-[#1f3a5c] bg-[#0d1e35] px-3 py-1 text-[0.75rem] font-bold text-[#e8f2ff]">Hall da Fama CAPYBER</span>
        </div>
        <p className="mt-3 flex items-center justify-center gap-2 text-[0.8rem] text-[#6d94c4]">
          <CapyBadge size={26} /> De visitante a lenda — 100% dentro da plataforma
        </p>
      </motion.div>
    </div>
  )
}

function CtaScene({ name, onFinish }: SceneProps & { onFinish: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl px-2 text-center">
      <CapyBadge size={72} />
      <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-4xl">
        {firstName(name)}, você provou que sabe <span className="text-[#ffb020]">jogar</span>.
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[#c8ddf2] sm:text-lg">
        Agora proteja quem joga com você. A mesma tecnologia que você treinou — motor CAPYCORE, VIGIA, Frota,
        Plano 40 — é a que protege exchanges, bancos e empresas contra APTs patrocinadas por estados.
      </p>
      <button
        onClick={onFinish}
        className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-gradient-to-b from-[#ffb24d] to-[#f5920b] px-7 text-lg font-black tracking-wide text-[#10315c] shadow-[0_8px_30px_rgba(245,146,11,0.45)] transition-transform hover:scale-[1.03] active:scale-95"
      >
        Conhecer a ferramenta
        <ArrowRight className="h-5 w-5" aria-hidden />
      </button>
      <p className="mt-3 text-[0.8rem] text-[#6d94c4]">A seguir: o que ela faz, quanto custa e como colocar sua empresa inteira nela.</p>
    </motion.div>
  )
}

/* ─────────────────────────── overlay principal ─────────────────────────── */

export function CareerMontage({ open, name, onClose }: { open: boolean; name: string; onClose: () => void }) {
  const [idx, setIdx] = useState(0)
  const last = idx >= SCENES.length - 1

  // reinicia a fila quando o overlay reabre (ajuste durante o render,
  // padrão recomendado pelo React para reações a mudança de props)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setIdx(0)
  }

  const next = useCallback(() => {
    setIdx((i) => Math.min(SCENES.length - 1, i + 1))
  }, [])
  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), [])

  // auto-avanço
  useEffect(() => {
    if (!open || last) return
    const t = setTimeout(next, SCENES[idx].ms)
    return () => clearTimeout(t)
  }, [open, idx, last, next])

  // teclado + trava de scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, next, prev, onClose])

  if (!open) return null

  const scene = SCENES[idx]

  // portal no body: escapa do z-index do <main> e cobre o header
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="capy-montage fixed inset-0 z-[90] flex flex-col overflow-y-auto"
      role="dialog" aria-modal="true" aria-label="Simulação de carreira"
    >
      {/* barra superior */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#1f3a5c]/70 bg-[#060d19]/85 px-3 py-2 backdrop-blur-md sm:px-5">
        <span className="cap-mono hidden text-[0.72rem] font-bold tracking-[0.22em] text-[#6d94c4] sm:inline">SIMULAÇÃO DE CARREIRA</span>
        <div className="flex flex-1 items-center justify-center gap-1.5">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              aria-label={`Ir para cena ${s.label}`}
              className={`min-h-0! h-1.5 rounded-full transition-all ${i === idx ? 'w-7 bg-[#ffb020]' : i < idx ? 'w-2.5 bg-[#4be38a]' : 'w-2.5 bg-[#1f3a5c]'}`}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="flex min-h-[36px] items-center gap-1 rounded-lg border border-[#1f3a5c] px-2.5 text-[0.75rem] font-bold text-[#c8ddf2] transition-colors hover:bg-[#0d1e35]"
        >
          <X className="h-4 w-4" aria-hidden /> Pular
        </button>
      </div>

      {/* palco */}
      <div className="relative flex flex-1 items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div key={scene.id} className="flex w-full justify-center">
            {scene.id === 'boot' && <BootScene />}
            {scene.id === 'jornal' && <JornalScene name={name} />}
            {scene.id === 'cves' && <CvesScene name={name} />}
            {scene.id === 'soc' && <SocScene name={name} />}
            {scene.id === 'blogs' && <BlogsScene name={name} />}
            {scene.id === 'podcast' && <PodcastScene name={name} />}
            {scene.id === 'award' && <AwardScene name={name} />}
            {scene.id === 'cta' && <CtaScene name={name} onFinish={onClose} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* controles inferiores */}
      <div className="sticky bottom-0 mt-auto border-t border-[#1f3a5c]/70 bg-[#060d19]/85 px-3 py-2 backdrop-blur-md sm:px-5">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={prev} disabled={idx === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f3a5c] text-[#c8ddf2] transition-colors hover:bg-[#0d1e35] disabled:opacity-30"
            aria-label="Cena anterior"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0d1e35]">
            {scene.ms > 0 ? (
              <motion.div
                key={`${idx}-${open}`}
                className="h-full rounded-full bg-gradient-to-r from-[#f5920b] to-[#ffb020]"
                initial={{ width: '0%' }} animate={{ width: '100%' }}
                transition={{ duration: scene.ms / 1000, ease: 'linear' }}
              />
            ) : (
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#f5920b] to-[#ffb020]" />
            )}
          </div>
          <span className="cap-mono text-[0.72rem] font-bold text-[#6d94c4]">{idx + 1}/{SCENES.length}</span>
          <button
            onClick={next} disabled={last}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f3a5c] text-[#c8ddf2] transition-colors hover:bg-[#0d1e35] disabled:opacity-30"
            aria-label="Próxima cena"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  )
}
