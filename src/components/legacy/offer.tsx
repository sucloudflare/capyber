'use client'

// CAPYBER — Legado: oferta da ferramenta após a montagem de carreira.
// O que o sistema faz → valor → cadastro de rede/dispositivos (demo) →
// compra simulada (checkout 3 passos) → onboarding de toda a empresa.

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck, Building2, Check, CheckCircle2, Copy, CreditCard, Cpu, Eye,
  FlaskConical, Gamepad2, Globe2, Laptop, Layers, Loader2, LockKeyhole,
  MonitorSmartphone, Network, QrCode, RadioTower, Server, ShieldCheck,
  ShoppingCart, Smartphone, Sparkles, UserPlus, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  readDevices, saveDevices, readLicense, saveLicense,
  readOnboarded, saveOnboarded, type LegacyDevice,
} from '@/lib/legacy'

/* ───────────────────────── cabeçalho: valor + features ────────────────── */

const FEATURES = [
  { icon: Cpu, title: 'Motor CAPYCORE em tempo real', desc: 'Kill chain viva, DEFCON dinâmico e resposta a ameaças em segundos — o mesmo motor que você viu reagir no Centro de Comando.' },
  { icon: RadioTower, title: 'VIGIA, copiloto de IA', desc: 'Narra, explica e sugere a próxima ação do analista. Cada alerta vira decisão em linguagem humana.' },
  { icon: Network, title: 'Frota de endpoints', desc: 'Notebooks, celulares, workstations e servidores sob um olhar só — foco no dispositivo, não no perímetro.' },
  { icon: Globe2, title: 'Superfície OSINT', desc: 'Varredura contínua do que a internet sabe sobre a sua empresa: pessoas, domínios e exposições.' },
  { icon: Gamepad2, title: 'Time treinado por dentro', desc: 'Trilha, CTF, Sala Stealth e Laboratório: onboarding de SOC que forma analista em semanas, não em anos.' },
  { icon: Layers, title: 'Plano 40 embutido', desc: '40 controles mapeados em MITRE ATT&CK, NIST CSF 2.0, CIS v8 e LGPD — auditoria pronta para o CISO.' },
]

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function OfferHeader({ onBuy }: { onBuy: () => void }) {
  return (
    <section id="legado-oferta" className="scroll-mt-24 space-y-4">
      <div className="cap-panel p-4 sm:p-6">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--cap-orange-deep)]">Agora que você terminou tudo…</p>
        <h2 className="cap-heading mt-1 text-2xl sm:text-3xl">Você pode comprar a ferramenta deste site</h2>
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-[var(--cap-text)]">
          Cada coisa que você concluiu — Trilha, CTF, Sala Stealth, Celular, Laboratório, OSINT — roda sobre a
          <strong> plataforma CAPYBER Enterprise</strong>: a mesma tecnologia usada por exchanges, bancos e empresas
          que não podem falhar. Você não vai comprá-la no escuro: você já a operou por dentro.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* features */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="cap-card-hover rounded-xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-3"
              >
                <p className="flex items-center gap-2 text-[0.95rem] font-extrabold text-[var(--cap-bright)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dcebfd] text-[var(--cap-cyan)]">
                    <f.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden />
                  </span>
                  {f.title}
                </p>
                <p className="mt-1 text-[0.85rem] leading-snug text-[var(--cap-text)]">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* preço */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--cap-orange)]/50 bg-gradient-to-b from-[#fff7ea] to-[var(--cap-panel-raised)] p-4 shadow-[0_10px_40px_rgba(245,146,11,0.18)] sm:p-5">
            <span className="absolute right-[-38px] top-4 rotate-45 rounded bg-[var(--cap-orange-deep)] px-10 py-1 text-[0.7rem] font-black tracking-widest text-white shadow-lg">
              LEGADO −25%
            </span>
            <p className="flex items-center gap-2 text-[0.75rem] font-black uppercase tracking-[0.22em] text-[var(--cap-orange-deep)]">
              <Sparkles className="h-4 w-4" aria-hidden /> CAPYBER Enterprise
            </p>
            <p className="mt-2 text-[0.85rem] font-semibold text-[var(--cap-text)]">
              Valor de mercado: <s className="opacity-70">R$ 27.600/ano</s>
            </p>
            <p className="text-[2.1rem] font-black leading-none text-[var(--cap-bright)] sm:text-3xl">
              {fmtBRL(11025)}
              <span className="text-base font-bold text-[var(--cap-text)]">/1º ano</span>
            </p>
            <p className="mt-1 text-[0.85rem] text-[var(--cap-text)]">
              depois {fmtBRL(14700)}/ano · ou {fmtBRL(1225)}/mês · frota 100+: sob consulta
            </p>
            <ul className="mt-3 space-y-1.5 text-[0.85rem] font-semibold text-[var(--cap-bright)]">
              {[
                'Dispositivos ilimitados no 1º ano',
                'VIGIA IA + Co-piloto incluídos',
                'Academia completa para o time (o que você acabou de fazer)',
                'Onboarding guiado da empresa em 1 dia',
              ].map((li) => (
                <li key={li} className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#21a44a]" aria-hidden /> {li}
                </li>
              ))}
            </ul>
            <Button onClick={onBuy} className="cap-btn-primary mt-4 h-12 w-full text-base">
              <ShoppingCart className="mr-2 h-5 w-5" aria-hidden />
              Comprar agora (simulação)
            </Button>
            <p className="mt-2 text-center text-[0.7rem] font-bold uppercase tracking-wider text-[var(--cap-dim)]">
              Fluxo demonstrativo — nenhum pagamento real é cobrado
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── cadastro de rede e dispositivos (demo interativo) ─────── */

const DEVICE_TYPES: { id: LegacyDevice['type']; label: string; icon: typeof Laptop }[] = [
  { id: 'NOTEBOOK', label: 'Notebook', icon: Laptop },
  { id: 'CELULAR', label: 'Celular', icon: Smartphone },
  { id: 'WORKSTATION', label: 'Workstation', icon: MonitorSmartphone },
  { id: 'SERVIDOR', label: 'Servidor', icon: Server },
]

const SAMPLE_DEVICES: LegacyDevice[] = [
  { id: 'demo-1', name: 'NB-DEV-07', type: 'NOTEBOOK' },
  { id: 'demo-2', name: 'CEL-FIN-12', type: 'CELULAR' },
  { id: 'demo-3', name: 'WS-SOC-03', type: 'WORKSTATION' },
  { id: 'demo-4', name: 'SRV-EXCH-01', type: 'SERVIDOR' },
]

const REG_STEPS = [
  { icon: Network, title: '1 · Aponte para sua rede', desc: 'Instale o agente em qualquer máquina: ele descobre a rede sozinho em minutos.' },
  { icon: Eye, title: '2 · Deixe a descoberta agir', desc: 'O CAPYBER enumera hosts, sistemas e serviços — inclusive os esquecidos pela TI.' },
  { icon: UserPlus, title: '3 · Nomeie e agrupe', desc: 'Cada dispositivo entra numa frota com dono, política e criticidade próprios.' },
  { icon: ShieldCheck, title: '4 · Monitore e responda', desc: 'A partir daí: kill chain em tempo real, VIGIA narrando e playbook com um clique.' },
]

export function DeviceRegistration() {
  // leitura única do storage na inicialização (componente é client-only)
  const [devices, setDevices] = useState<LegacyDevice[]>(() => readDevices())
  const [name, setName] = useState('')
  const [type, setType] = useState<LegacyDevice['type']>('NOTEBOOK')

  const add = (d: LegacyDevice) => {
    setDevices((cur) => {
      const next = [...cur.filter((x) => x.id !== d.id), d].slice(0, 24)
      saveDevices(next)
      return next
    })
  }

  const submit = () => {
    const clean = name.trim().toUpperCase().replace(/\s+/g, '-')
    if (!clean) return
    add({ id: `u-${Date.now()}`, name: clean.slice(0, 24), type })
    setName('')
  }

  return (
    <section className="cap-panel p-4 sm:p-6">
      <h3 className="cap-heading flex items-center gap-2 text-xl sm:text-2xl">
        <Network className="h-6 w-6 text-[var(--cap-cyan)]" aria-hidden />
        Como cadastrar sua rede e dispositivos
      </h3>
      <p className="mt-1 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--cap-text)]">
        Na plataforma real, o agente CAPYBER faz o trabalho pesado. Aqui, experimente o gesto essencial —
        registrar um dispositivo na frota protegida (fica salvo na sua sessão):
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* passos */}
        <ol className="space-y-2.5">
          {REG_STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 rounded-xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dcebfd] text-[var(--cap-cyan)]">
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-[0.95rem] font-extrabold text-[var(--cap-bright)]">{s.title}</p>
                <p className="text-[0.85rem] leading-snug text-[var(--cap-text)]">{s.desc}</p>
              </div>
            </motion.li>
          ))}
          <li className="rounded-xl border-2 border-dashed border-[var(--cap-border)] bg-[#f4f9ff] p-3 font-mono text-[0.8rem] text-[var(--cap-text)]">
            <span className="text-[#21a44a]">$</span> capy-agent --enroll cby://suaempresa
            <br /><span className="opacity-70">✓ agente conectado · 0 cliques extras</span>
          </li>
        </ol>

        {/* demo interativa */}
        <div className="rounded-2xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-3 sm:p-4">
          <p className="text-[0.8rem] font-black uppercase tracking-[0.18em] text-[var(--cap-dim)]">Demo · registrar dispositivo</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Ex.: NB-DEV-08"
              className="cap-input h-11 flex-1"
              aria-label="Nome do dispositivo"
              maxLength={24}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LegacyDevice['type'])}
              className="cap-input h-11 rounded-md px-2 font-semibold"
              aria-label="Tipo do dispositivo"
            >
              {DEVICE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <Button onClick={submit} disabled={!name.trim()} className="cap-btn-primary h-11 shrink-0 disabled:opacity-50">
              <ShieldCheck className="mr-1 h-4 w-4" aria-hidden /> Registrar
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => SAMPLE_DEVICES.forEach(add)}
              className="cap-btn-ghost h-9 px-2.5 text-[0.8rem] font-bold"
            >
              <Zap className="mr-1 h-4 w-4" aria-hidden /> Preencher frota de exemplo
            </Button>
            {devices.length > 0 && (
              <button
                onClick={() => { setDevices([]); saveDevices([]) }}
                className="text-[0.75rem] font-bold text-[var(--cap-dim)] underline-offset-2 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="mt-2 max-h-56 overflow-y-auto pr-1" role="list" aria-label="Frota registrada">
            {devices.length === 0 && (
              <p className="rounded-xl border-2 border-dashed border-[var(--cap-border)] p-4 text-center text-[0.85rem] text-[var(--cap-dim)]">
                Nenhum dispositivo registrado ainda. Registre o primeiro acima — na ferramenta real, esse passo é automático.
              </p>
            )}
            <AnimatePresence initial={false}>
              {devices.map((d) => {
                const t = DEVICE_TYPES.find((x) => x.id === d.type) ?? DEVICE_TYPES[0]
                return (
                  <motion.div
                    key={d.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="mb-1.5 flex items-center gap-2 rounded-lg border border-[var(--cap-border)] bg-white/80 px-2.5 py-2"
                    role="listitem"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dcebfd] text-[var(--cap-cyan)]">
                      <t.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[0.85rem] font-extrabold text-[var(--cap-bright)]">{d.name}</p>
                      <p className="text-[0.7rem] text-[var(--cap-dim)]">{t.label}</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-[#21a44a]/10 px-2 py-0.5 text-[0.68rem] font-black text-[#1f9648]">
                      <span className="cap-dot-live" aria-hidden /> agente online
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
          {devices.length > 0 && (
            <p className="mt-1 text-right text-[0.75rem] font-bold text-[var(--cap-dim)]">
              Frota protegida: <strong className="text-[#1f9648]">{devices.length}</strong> dispositivo(s)
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────── checkout simulado (3 passos) ─────────────────── */

type PlanId = 'ANUAL' | 'MENSAL' | 'FROTA'

const PLANS: { id: PlanId; label: string; price: string; note: string; best?: boolean }[] = [
  { id: 'ANUAL', label: 'Anual · Legado', price: fmtBRL(11025), note: '1º ano com −25% · depois R$ 14.700/ano', best: true },
  { id: 'MENSAL', label: 'Mensal', price: fmtBRL(1225), note: 'flexível · cancele quando quiser' },
  { id: 'FROTA', label: 'Frota 100+', price: 'Sob consulta', note: 'preço por dispositivo a partir de R$ 29/mês' },
]

function genKey() {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CBY-ENT-${seg()}-${seg()}-${seg()}`
}

/** QR "falso" determinístico — apenas ilustrativo (21×21). */
function FakePixQr() {
  const cells = useMemo(() => {
    const out: boolean[] = []
    let seed = 987654321
    for (let i = 0; i < 21 * 21; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648
      out.push((seed >> 16) % 2 === 1)
    }
    return out
  }, [])
  const isFinder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7
    return inBox(0, 0) || inBox(0, 14) || inBox(14, 0)
  }
  return (
    <svg viewBox="0 0 21 21" className="h-40 w-40 rounded-lg border-4 border-white bg-white p-1 shadow-lg" role="img" aria-label="QR Code PIX simulado (ilustrativo)">
      {cells.map((on, i) => {
        const r = Math.floor(i / 21)
        const c = i % 21
        if (isFinder(r, c)) return null
        return on ? <rect key={i} x={c} y={r} width="1" height="1" fill="#10315c" /> : null
      })}
      {[[0, 0], [0, 14], [14, 0]].map(([r, c], i) => (
        <g key={i}>
          <rect x={c} y={r} width="7" height="7" fill="#10315c" />
          <rect x={c + 1} y={r + 1} width="5" height="5" fill="#fff" />
          <rect x={c + 2} y={r + 2} width="3" height="3" fill="#10315c" />
        </g>
      ))}
    </svg>
  )
}

export function Checkout({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [plan, setPlan] = useState<PlanId | null>(null)
  const [method, setMethod] = useState<'PIX' | 'CARTAO'>('PIX')
  const [processing, setProcessing] = useState(false)
  const [license, setLicense] = useState<string | null>(() => readLicense())
  const [copied, setCopied] = useState(false)

  const confirmPayment = () => {
    setStep(2)
  }

  const activate = () => {
    setProcessing(true)
    setTimeout(() => {
      const key = license ?? genKey()
      saveLicense(key)
      setLicense(key)
      setProcessing(false)
      onDone()
    }, 1700)
  }

  const STEPS = ['Plano', 'Pagamento', 'Ativação']
  const pixCode = '00020126capyber.pix.simulacao5204000053039865802BR5909CAPYBER6009SAO PAULO62070503***6304C0PY'

  return (
    <section id="legado-compra" className="cap-panel scroll-mt-24 p-4 sm:p-6">
      <h3 className="cap-heading flex items-center gap-2 text-xl sm:text-2xl">
        <CreditCard className="h-6 w-6 text-[var(--cap-cyan)]" aria-hidden />
        Como comprar
      </h3>
      <p className="mt-1 text-[0.95rem] text-[var(--cap-text)]">
        Fluxo completo de assinatura — <strong>100% simulado</strong> para demonstração. Nenhum dado real é enviado.
      </p>

      {/* trilha de passos */}
      <ol className="mt-4 flex items-center gap-2" aria-label="Etapas da compra">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.85rem] font-black ${
                i < step ? 'bg-[#21a44a] text-white' : i === step ? 'bg-[var(--cap-cyan)] text-white' : 'bg-[#dcebfd] text-[var(--cap-dim)]'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className={`hidden text-[0.8rem] font-bold sm:inline ${i === step ? 'text-[var(--cap-bright)]' : 'text-[var(--cap-dim)]'}`}>{s}</span>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < step ? 'bg-[#21a44a]' : 'bg-[var(--cap-border)]'}`} aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="mt-4 min-h-[280px]">
        {/* passo 1 — plano */}
        {step === 0 && (
          <div className="grid gap-2.5 sm:grid-cols-3">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPlan(p.id); setTimeout(() => setStep(1), 250) }}
                className={`relative rounded-2xl border-2 p-4 text-left transition-all hover:-translate-y-0.5 ${
                  plan === p.id ? 'border-[var(--cap-cyan)] bg-[#eaf4ff] shadow-lg' : 'border-[var(--cap-border)] bg-[var(--cap-panel-raised)] hover:border-[var(--cap-cyan)]/50'
                }`}
              >
                {p.best && (
                  <span className="absolute -top-2.5 left-3 rounded-full bg-[var(--cap-orange-deep)] px-2 py-0.5 text-[0.62rem] font-black tracking-wider text-white">
                    RECOMENDADO
                  </span>
                )}
                <p className="text-[0.8rem] font-black uppercase tracking-wider text-[var(--cap-dim)]">{p.label}</p>
                <p className="mt-1 text-xl font-black text-[var(--cap-bright)] sm:text-2xl">{p.price}</p>
                <p className="mt-0.5 text-[0.78rem] text-[var(--cap-text)]">{p.note}</p>
              </button>
            ))}
          </div>
        )}

        {/* passo 2 — pagamento */}
        {step === 1 && (
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex gap-2">
                {(['PIX', 'CARTAO'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 text-[0.9rem] font-extrabold transition-colors ${
                      method === m ? 'border-[var(--cap-cyan)] bg-[#eaf4ff] text-[var(--cap-bright)]' : 'border-[var(--cap-border)] text-[var(--cap-dim)] hover:text-[var(--cap-bright)]'
                    }`}
                    aria-pressed={method === m}
                  >
                    {m === 'PIX' ? <QrCode className="h-4 w-4" aria-hidden /> : <CreditCard className="h-4 w-4" aria-hidden />}
                    {m === 'PIX' ? 'PIX' : 'Cartão'}
                  </button>
                ))}
              </div>

              {method === 'PIX' ? (
                <div className="mt-3 rounded-2xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <FakePixQr />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9rem] font-extrabold text-[var(--cap-bright)]">PIX copia e cola (simulado)</p>
                      <p className="mt-1 break-all rounded-lg bg-white/80 p-2 font-mono text-[0.7rem] text-[var(--cap-text)]">{pixCode}</p>
                      <Button
                        variant="outline"
                        onClick={() => { try { void navigator.clipboard?.writeText(pixCode) } catch { /* noop */ } setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                        className="mt-2 h-10 text-[0.8rem] font-bold"
                      >
                        <Copy className="mr-1 h-4 w-4" aria-hidden /> {copied ? 'Copiado!' : 'Copiar código'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid gap-2 rounded-2xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-4">
                  <Input placeholder="Número do cartão — 0000 0000 0000 0000" className="cap-input h-11" inputMode="numeric" aria-label="Número do cartão (simulado)" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Validade MM/AA" className="cap-input h-11" aria-label="Validade (simulada)" />
                    <Input placeholder="CVV 000" className="cap-input h-11" inputMode="numeric" aria-label="CVV (simulado)" />
                  </div>
                  <Input placeholder="Nome impresso no cartão" className="cap-input h-11" aria-label="Nome no cartão (simulado)" />
                  <p className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--cap-dim)]">Nada é enviado — é uma simulação</p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="cap-btn-ghost h-11">Voltar</Button>
                <Button onClick={confirmPayment} className="cap-btn-primary h-11 flex-1 sm:flex-none">
                  <LockKeyhole className="mr-1 h-4 w-4" aria-hidden /> Confirmar pagamento (simulado)
                </Button>
              </div>
            </div>

            {/* resumo */}
            <div className="rounded-2xl border-2 border-[var(--cap-border)] bg-gradient-to-b from-[#fff7ea] to-[var(--cap-panel-raised)] p-4">
              <p className="text-[0.75rem] font-black uppercase tracking-[0.2em] text-[var(--cap-dim)]">Resumo do pedido</p>
              <div className="mt-2 flex items-center justify-between text-[0.95rem] font-bold text-[var(--cap-bright)]">
                <span>CAPYBER Enterprise · {plan ?? 'ANUAL'}</span>
                <span>{plan === 'MENSAL' ? fmtBRL(1225) + '/mês' : plan === 'FROTA' ? 'Sob consulta' : fmtBRL(11025)}</span>
              </div>
              <ul className="mt-2 space-y-1 text-[0.8rem] text-[var(--cap-text)]">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#21a44a]" aria-hidden /> Ativação imediata da licença</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#21a44a]" aria-hidden /> Onboarding guiado no mesmo dia</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#21a44a]" aria-hidden /> Academia CAPYBER para todo o time</li>
              </ul>
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#21a44a]/10 px-2.5 py-1.5 text-[0.75rem] font-bold text-[#1f9648]">
                <LockKeyhole className="h-3.5 w-3.5" aria-hidden /> Ambiente de demonstração — dados ficam só no seu navegador
              </p>
            </div>
          </div>
        )}

        {/* passo 3 — ativação */}
        {step === 2 && (
          <div className="mx-auto max-w-xl rounded-2xl border-2 border-[var(--cap-border)] bg-[var(--cap-panel-raised)] p-5 text-center sm:p-6">
            {processing && (
              <div className="py-6">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--cap-cyan)]" aria-hidden />
                <p className="mt-3 font-bold text-[var(--cap-bright)]">Ativando licença na nuvem CAPYBER…</p>
                <p className="text-[0.8rem] text-[var(--cap-dim)]">assinando certificado · provisionando tenant · liberando agente</p>
              </div>
            )}
            {!processing && !license && (
              <div className="py-6">
                <ShieldCheck className="mx-auto h-14 w-14 text-[var(--cap-cyan)]" aria-hidden />
                <h4 className="mt-2 text-xl font-black text-[var(--cap-bright)] sm:text-2xl">Pagamento aprovado (simulado)</h4>
                <p className="mx-auto mt-1 max-w-sm text-[0.9rem] text-[var(--cap-text)]">
                  Último passo: ativar a licença e provisionar o tenant da sua empresa na nuvem CAPYBER.
                </p>
                <Button onClick={activate} className="cap-btn-primary mt-4 h-12 px-6 text-base">
                  <Zap className="mr-2 h-5 w-5" aria-hidden /> Ativar licença agora
                </Button>
              </div>
            )}
            {!processing && license && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <CheckCircle2 className="mx-auto h-14 w-14 text-[#21a44a]" aria-hidden />
                <h4 className="mt-2 text-xl font-black text-[var(--cap-bright)] sm:text-2xl">Licença ativada!</h4>
                <p className="mt-1 text-[0.9rem] text-[var(--cap-text)]">Chave de licença (guarde-a — também fica salva no seu navegador):</p>
                <p className="mx-auto mt-2 inline-block rounded-xl border-2 border-dashed border-[#21a44a]/60 bg-[#21a44a]/10 px-4 py-2 font-mono text-base font-black tracking-wider text-[#1f9648]">
                  {license}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button
                    onClick={() => document.getElementById('legado-empresa')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="cap-btn-primary h-11"
                  >
                    <Building2 className="mr-1.5 h-4 w-4" aria-hidden /> Colocar a empresa na ferramenta
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

/* ──────────────────────── onboarding de toda a empresa ─────────────────── */

const ONBOARD_STEPS = [
  { icon: Globe2, text: 'Domínio suaempresa.com.br verificado (TXT no DNS)' },
  { icon: UserPlus, text: 'Diretório importado — 38 colaboradores e grupos mapeados' },
  { icon: LockKeyhole, text: 'Políticas base aplicadas: MFA FIDO2 · USB OFF · Allowlist' },
  { icon: Laptop, text: 'Agente distribuído — 42/42 dispositivos com proteção ativa' },
  { icon: FlaskConical, text: 'Primeira varredura de superfície concluída — 0 surpresas críticas' },
]

export function CompanyOnboarding({ devicesCount }: { devicesCount: number }) {
  const [started, setStarted] = useState(() => readOnboarded())
  const [done, setDone] = useState(() => (readOnboarded() ? ONBOARD_STEPS.length : 0))
  const finished = started && done >= ONBOARD_STEPS.length

  useEffect(() => {
    if (!started) return
    if (done >= ONBOARD_STEPS.length) {
      saveOnboarded(true) // escrita em sistema externo (localStorage) — não é setState
      return
    }
    const t = setTimeout(
      () => setDone((d) => Math.min(ONBOARD_STEPS.length, d + 1)),
      done === 0 ? 350 : 1250,
    )
    return () => clearTimeout(t)
  }, [started, done])

  return (
    <section id="legado-empresa" className="cap-panel scroll-mt-24 p-4 sm:p-6">
      <h3 className="cap-heading flex items-center gap-2 text-xl sm:text-2xl">
        <Building2 className="h-6 w-6 text-[var(--cap-cyan)]" aria-hidden />
        Colocar toda a empresa na ferramenta
      </h3>
      <p className="mt-1 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--cap-text)]">
        Compra feita, é hora de trazer a operação inteira: identidades, dispositivos e políticas em um único onboarding guiado.
        {devicesCount > 0 && <> Os <strong>{devicesCount}</strong> dispositivos que você registrou acima entram automaticamente na contagem.</>}
      </p>

      {!started && (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--cap-border)] bg-[#f4f9ff] p-6 text-center">
          <p className="max-w-md text-[0.95rem] text-[var(--cap-text)]">
            O assistente conecta domínio, diretório, políticas e frota — o CISO acompanha tudo em uma tela.
          </p>
          <Button onClick={() => setStarted(true)} className="cap-btn-primary h-12 text-base">
            <Zap className="mr-2 h-5 w-5" aria-hidden /> Iniciar onboarding da empresa
          </Button>
        </div>
      )}

      {started && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <ol className="space-y-2" aria-label="Etapas do onboarding">
            {ONBOARD_STEPS.map((s, i) => {
              const state = i < done ? 'done' : i === done ? 'doing' : 'todo'
              return (
                <li
                  key={s.text}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                    state === 'done' ? 'border-[#21a44a]/50 bg-[#21a44a]/[0.06]' : state === 'doing' ? 'border-[var(--cap-cyan)]/60 bg-[#eaf4ff]' : 'border-[var(--cap-border)] bg-[var(--cap-panel-raised)] opacity-60'
                  }`}
                  aria-current={state === 'doing' ? 'step' : undefined}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    state === 'done' ? 'bg-[#21a44a] text-white' : 'bg-[#dcebfd] text-[var(--cap-cyan)]'
                  }`}>
                    {state === 'done' ? <Check className="h-5 w-5" aria-hidden /> : state === 'doing' ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <s.icon className="h-5 w-5" aria-hidden />}
                  </span>
                  <span className="text-[0.9rem] font-bold text-[var(--cap-bright)]">{s.text}</span>
                </li>
              )
            })}
          </ol>

          <div className={`rounded-2xl border-2 p-4 transition-colors ${finished ? 'border-[#21a44a]/50 bg-gradient-to-b from-[#f0fff4] to-[var(--cap-panel-raised)]' : 'border-[var(--cap-border)] bg-[var(--cap-panel-raised)]'}`}>
            <p className="text-[0.75rem] font-black uppercase tracking-[0.2em] text-[var(--cap-dim)]">Painel do CISO</p>
            {finished ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mt-2 flex items-center gap-2 text-lg font-black text-[var(--cap-bright)]">
                  <BadgeCheck className="h-6 w-6 text-[#21a44a]" aria-hidden /> Frota protegida
                </p>
                {/* gauge risco */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-[0.8rem] font-bold text-[var(--cap-text)]">
                    <span>Risco de superfície</span>
                    <span className="text-[#1f9648]">92% → 8%</span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-[#dcebfd]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#21a44a] to-[#4ade80]"
                      initial={{ width: '92%' }} animate={{ width: '8%' }} transition={{ duration: 1.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    { k: 'Dispositivos', v: String(42 + devicesCount) },
                    { k: 'MTTD', v: '4 min' },
                    { k: 'Cobertura', v: '100%' },
                  ].map((s) => (
                    <div key={s.k} className="rounded-xl bg-white/80 p-2">
                      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--cap-dim)]">{s.k}</p>
                      <p className="text-base font-black text-[var(--cap-bright)]">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href="#comando" className="cap-btn-primary inline-flex h-11 items-center px-4 text-[0.9rem] font-bold">
                    Abrir Centro de Comando
                  </a>
                  <a href="#frota" className="cap-btn-ghost inline-flex h-11 items-center px-4 text-[0.9rem] font-bold">
                    Ver Frota
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cap-cyan)]" aria-hidden />
                <p className="text-[0.85rem] font-bold text-[var(--cap-text)]">Provisionando tenant corporativo…</p>
                <p className="text-[0.75rem] text-[var(--cap-dim)]">{done}/{ONBOARD_STEPS.length} etapas concluídas</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
