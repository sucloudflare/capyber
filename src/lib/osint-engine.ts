// CAPYBER — Motor OSINT real (servidor).
// Cadeia de transforms estilo Maltego: cada módulo consome entidades
// (domínio, IP, e-mail, usuário) e produz novas entidades, permitindo pivôs
// reais: cert-transparency → subdomínios → DNS → IPs → ASN/geo → rDNS →
// e-mails → vazamentos. Todas as fontes são APIs públicas sem chave:
// crt.sh, Cloudflare DoH, RDAP, ip-api, Wayback CDX, XposedOrNot, Gravatar,
// GitHub, Reddit, HackerTarget + gerador automático de Google Dorks.

import { createHash } from 'crypto'
import {
  OSINT_MODULES,
  type OsintEdge,
  type OsintEmitter,
  type OsintNode,
} from '@/lib/osint-modules'

export { OSINT_MODULES } from '@/lib/osint-modules'
export type { OsintEdge, OsintEvent, OsintNode, OsintType } from '@/lib/osint-modules'

/* ============ constantes e helpers ============ */

const UA = 'CAPYBER-OSINT/1.0 (defensive-research; contact: soc@capyber.local)'
const MAX_NODES = 260
const T = (ms: number) => AbortSignal.timeout(ms)

const RE_IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RE_DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

async function fetchJson<T>(url: string, timeoutMs = 9000, headers?: Record<string, string>): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'application/json, text/json, */*', ...(headers ?? {}) },
      signal: T(timeoutMs),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function fetchText(url: string, timeoutMs = 8000, headers?: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, ...(headers ?? {}) },
      signal: T(timeoutMs),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const txt = await res.text()
    return txt.slice(0, 20_000)
  } catch {
    return null
  }
}

function md5(s: string): string {
  return createHash('md5').update(s).digest('hex')
}

function cut(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

const SLD_SET = new Set([
  'com.br', 'net.br', 'org.br', 'gov.br', 'com.ar', 'co.uk', 'com.au', 'co.jp',
  'com.mx', 'com.pt', 'com.co', 'com.pe', 'com.uy', 'com.py', 'com.bo', 'com.ve', 'com.ec',
])

function rootOf(host: string): string {
  const parts = host.toLowerCase().replace(/\.$/, '').split('.')
  if (parts.length <= 2) return parts.join('.')
  const two = parts.slice(-2).join('.')
  if (SLD_SET.has(two)) return parts.slice(-3).join('.')
  return two
}

export function isIpv4(s: string): boolean {
  const m = RE_IPV4.exec(s.trim())
  if (!m) return false
  return m.slice(1).every((p) => Number(p) >= 0 && Number(p) <= 255)
}

export interface DetectedTarget {
  kind: 'domain' | 'ip' | 'email' | 'username'
  value: string // forma normalizada (alvo principal)
  domain?: string // domínio raiz associado (quando existir)
  email?: string
  username?: string
  ip?: string
}

export function detectTarget(raw: string): DetectedTarget | null {
  const input = raw.trim()
  if (!input) return null

  // URL → extrai host
  let hostish = input
  if (/^https?:\/\//i.test(input)) {
    hostish = input.replace(/^https?:\/\//i, '').split(/[/?#]/)[0] ?? ''
  }

  if (hostish.includes('@')) {
    const email = hostish.toLowerCase()
    if (RE_EMAIL.test(email)) {
      return { kind: 'email', value: email, email, domain: rootOf(email.split('@')[1] ?? '') }
    }
    // @usuário (não é e-mail) → trata como username
    const handle = email.replace(/^@/, '').split('@')[0]?.trim() ?? ''
    if (/^[a-z0-9._-]{2,40}$/.test(handle)) {
      return { kind: 'username', value: handle, username: handle }
    }
    return null
  }

  const single = hostish.toLowerCase().replace(/^www\./, '')
  if (isIpv4(single)) return { kind: 'ip', value: single, ip: single }
  if (RE_DOMAIN.test(single)) {
    return { kind: 'domain', value: single, domain: rootOf(single) }
  }
  // usuário: remove @ inicial e espaços
  const user = input.replace(/^@/, '').trim()
  if (/^[a-z0-9._-]{2,40}$/i.test(user)) return { kind: 'username', value: user, username: user }
  return null
}

/* ============ grafo ============ */

export class Graph {
  nodes = new Map<string, OsintNode>()
  edges = new Map<string, OsintEdge>()
  overflow = false

  addNode(n: OsintNode): boolean {
    if (this.nodes.size >= MAX_NODES && !this.nodes.has(n.id)) {
      this.overflow = true
      return false
    }
    const cur = this.nodes.get(n.id)
    if (cur) {
      cur.depth = Math.min(cur.depth, n.depth)
      if (!cur.url && n.url) cur.url = n.url
      if (n.meta) cur.meta = { ...(cur.meta ?? {}), ...n.meta }
      return false
    }
    this.nodes.set(n.id, n)
    return true
  }

  addEdge(from: string, to: string, label: string): boolean {
    if (from === to) return false
    if (!this.nodes.has(from) || !this.nodes.has(to)) return false // nunca aresta solta
    const key = `${from}→${to}→${label}`
    const rev = `${to}→${from}→${label}`
    if (this.edges.has(key) || this.edges.has(rev)) return false
    this.edges.set(key, { from, to, label })
    return true
  }
}

/* ============ contexto do scan ============ */

interface Ctx {
  g: Graph
  emit: OsintEmitter
  tgt: DetectedTarget
  alvoId: string
}

function pushNode(ctx: Ctx, n: Omit<OsintNode, 'depth'> & { depth?: number }, parentIds?: string[], edgeLabel = 'relacionado'): void {
  const node: OsintNode = { ...n, depth: n.depth ?? 1 }
  if (!ctx.g.addNode(node)) return
  ctx.emit({ t: 'node', node })
  const parents = parentIds && parentIds.length ? parentIds : [ctx.alvoId]
  for (const p of parents) {
    if (ctx.g.addEdge(p, node.id, edgeLabel)) {
      ctx.emit({ t: 'edge', edge: { from: p, to: node.id, label: edgeLabel } })
    }
  }
}

async function runModule(ctx: Ctx, id: string, label: string, fn: () => Promise<string | null>): Promise<void> {
  ctx.emit({ t: 'module', id, label, status: 'running' })
  try {
    const info = await fn()
    ctx.emit({ t: 'module', id, label, status: info === null ? 'empty' : 'done', info: info ?? undefined })
  } catch (e) {
    ctx.emit({ t: 'module', id, label, status: 'error', info: e instanceof Error ? cut(e.message, 60) : 'falhou' })
  }
}

/** Executa tarefas com concorrência limitada. */
async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      try {
        await fn(items[idx] as T)
      } catch {
        /* módulos já tratam erros individualmente */
      }
    }
  })
  await Promise.all(workers)
}

/* ============ DoH (Cloudflare) ============ */

interface DohAnswer { name: string; type: number; TTL: number; data: string }
interface DohResp { Status: number; Answer?: DohAnswer[] }

async function doh(name: string, type: string): Promise<DohAnswer[]> {
  const r = await fetchJson<DohResp>(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    7000,
    { accept: 'application/dns-json' },
  )
  return r?.Status === 0 ? (r.Answer ?? []) : []
}

const MX_PROVIDERS: [RegExp, string][] = [
  [/aspmx.*google|google\.com\.?$/i, 'Google Workspace'],
  [/outlook\.com|protection\.outlook/i, 'Microsoft 365'],
  [/zoho/i, 'Zoho Mail'],
  [/proton/i, 'Proton Mail'],
  [/yandex/i, 'Yandex'],
  [/mail\.ru/i, 'Mail.ru'],
  [/secureserver|godaddy/i, 'GoDaddy'],
  [/messagingengine|fastmail/i, 'Fastmail'],
  [/amazonaws|awsapps/i, 'AWS WorkMail'],
  [/mimecast/i, 'Mimecast'],
  [/ proofpoint|pphosted/i, 'Proofpoint'],
]

function detectMailProvider(host: string): string | null {
  for (const [re, name] of MX_PROVIDERS) if (re.test(host)) return name
  return null
}

/* ============ módulos: domínio ============ */

async function modDns(ctx: CtxFull): Promise<string | null> {
  const d = ctx.tgt.domain
  if (!d) return null
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CAA', 'SOA'] as const
  const results = await Promise.all(types.map((t) => doh(d, t)))
  let found = 0
  const emails: string[] = []
  const ips: string[] = []

  types.forEach((t, i) => {
    const answers = results[i] ?? []
    if (!answers.length) return
    found++
    const data = answers.map((a) => a.data.replace(/^"|"$/g, ''))
    const meta: Record<string, string | number | boolean | null> = { tipo: t, ttl: answers[0]?.TTL ?? null }

    if (t === 'MX') {
      const provs = new Set(data.map((mx) => detectMailProvider(mx)).filter(Boolean) as string[])
      if (provs.size) meta.provedor = [...provs].join(', ')
    }
    if (t === 'TXT') {
      const spf = data.find((x) => x.startsWith('v=spf1'))
      meta.spf = spf ? cut(spf, 120) : 'sem SPF'
      if (spf) {
        if (/[-~?]all/.test(spf)) meta.spf_politica = /-all/.test(spf) ? 'rígida (-all)' : 'flexível (softfail)'
      }
    }
    pushNode(
      ctx,
      { id: `dns:${d}:${t}`, type: 'dns', label: `${t} · ${cut(data[0] ?? '', 26)}`, value: data.join(' | ').slice(0, 400), source: 'dns', meta },
      undefined,
      'dns',
    )

    if (t === 'A' || t === 'AAAA') {
      for (const a of answers) {
        const val = a.data.replace(/^"|"$/g, '')
        if (!isIpv4(val) && !val.includes(':')) continue
        ips.push(val)
        pushNode(
          ctx,
          { id: `ip:${val}`, type: 'ip', label: val, value: val, source: 'dns', meta: { via: `DNS ${t}` } },
          [`dns:${d}:${t}`],
          'resolve',
        )
      }
    }
    if (t === 'SOA') {
      // RNAME do SOA = contato administrativo (pivô real; pontos escapados \\.)
      const raw = (answers[0]?.data ?? '').split(' ')[0] ?? ''
      const email = raw.replace(/\\\./g, '\u0000').replace('.', '@').replace(/\u0000/g, '.').replace(/\.$/, '')
      if (email.includes('@') && RE_EMAIL.test(email)) emails.push(email)
    }
  })

  // DMARC — política real (analisada)
  const dmarc = await doh(`_dmarc.${d}`, 'TXT')
  const dmarcRec = dmarc.map((a) => a.data).find((x) => x.includes('v=DMARC1'))
  if (dmarcRec) {
    const p = /p=(\w+)/.exec(dmarcRec)?.[1] ?? 'none'
    found++
    pushNode(
      ctx,
      {
        id: `dns:${d}:DMARC`,
        type: 'dns',
        label: `DMARC · p=${p}`,
        value: dmarcRec.slice(0, 300),
        source: 'dns',
        meta: { tipo: 'DMARC', politica: p, rigor: p === 'reject' ? 'rígida' : p === 'quarantine' ? 'média' : 'fraca (p=none)' },
      },
      undefined,
      'dns',
    )
  }

  ctx.tgtExtraEmails?.push(...emails)
  ctx.ipPool.push(...ips)
  return found ? `${found} tipos de registro` : null
}

interface CtxExt {
  tgtExtraEmails: string[]
  ipPool: string[]
  subPool: string[]
  emailPool: () => string[]
}
type CtxFull = Ctx & CtxExt

async function resolveHostIps(ctx: CtxFull, host: string, depth: number, parentId: string): Promise<void> {
  const ans = await doh(host, 'A')
  for (const a of ans) {
    const ip = a.data
    if (!isIpv4(ip)) continue
    const fresh = ctx.g.addNode({ id: `ip:${ip}`, type: 'ip', label: ip, value: ip, source: 'crtsh', depth: depth + 1, meta: { via: host } })
    if (fresh) {
      const node = ctx.g.nodes.get(`ip:${ip}`)
      if (node) ctx.emit({ t: 'node', node })
    }
    ctx.ipPool.push(ip)
    if (ctx.g.addEdge(parentId, `ip:${ip}`, 'resolve')) {
      ctx.emit({ t: 'edge', edge: { from: parentId, to: `ip:${ip}`, label: 'resolve' } })
    }
  }
}

async function modCrtsh(ctx: CtxFull): Promise<string | null> {
  const d = ctx.tgt.domain
  if (!d) return null
  const rows = await fetchJson<{ name_value: string; issuer_value: string; not_before: string }[]>(
    `https://crt.sh/?q=%25.${encodeURIComponent(d)}&output=json`,
    14_000,
  )
  if (!rows?.length) return null
  const subs = new Set<string>()
  const issuers = new Set<string>()
  for (const r of rows.slice(0, 400)) {
    issuers.add((r.issuer_value ?? '').replace(/.*O=/, '').split(',')[0] ?? '')
    for (const raw of (r.name_value ?? '').split('\n')) {
      const host = raw.trim().toLowerCase().replace(/^\*\./, '')
      if (!host.endsWith(d) || host === d) continue
      subs.add(host)
    }
  }
  const list = [...subs].slice(0, 60)
  let newest = ''
  for (const r of rows) if (r.not_before > newest) newest = r.not_before ?? ''
  for (const s of list) {
    pushNode(
      ctx,
      {
        id: `sub:${s}`,
        type: 'subdominio',
        label: cut(s, 34),
        value: s,
        source: 'crtsh',
        meta: { origem: 'certificate transparency', cert_mais_novo: newest ? newest.slice(0, 10) : null },
        url: `https://${s}`,
      },
      undefined,
      'cert transparency',
    )
    ctx.subPool.push(s)
  }
  const issuerTop = [...issuers].filter(Boolean)[0] ?? null
  if (issuerTop && ctx.g.nodes.has(`sub:${list[0]}`)) {
    pushNode(
      ctx,
      { id: `org:${md5(issuerTop)}`, type: 'org', label: cut(issuerTop, 30), value: issuerTop, source: 'crtsh', meta: { papel: 'CA emissora' } },
      list.slice(0, 1).map((s) => `sub:${s}`),
      'emitido por',
    )
  }
  return `${list.length} subdomínios`
}

async function modHackerTarget(ctx: CtxFull): Promise<string | null> {
  const d = ctx.tgt.domain
  if (!d) return null
  const txt = await fetchText(`https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(d)}`, 10_000)
  if (!txt || txt.includes('API count exceeded') || txt.includes('error')) return null
  let count = 0
  for (const line of txt.split('\n').slice(0, 40)) {
    const [host, ip] = line.trim().split(',')
    if (!host || !host.includes('.')) continue
    count++
    pushNode(
      ctx,
      {
        id: `sub:${host.toLowerCase()}`,
        type: 'subdominio',
        label: cut(host, 34),
        value: host.toLowerCase(),
        source: 'hackertarget',
        meta: ip ? { ip: ip.trim() } : undefined,
        url: `https://${host}`,
      },
      undefined,
      'hostsearch',
    )
    if (ip && isIpv4(ip.trim())) {
      const ipn = ip.trim()
      const fresh = ctx.g.addNode({ id: `ip:${ipn}`, type: 'ip', label: ipn, value: ipn, source: 'hackertarget', depth: 2, meta: { via: host } })
      if (fresh) {
        const node = ctx.g.nodes.get(`ip:${ipn}`)
        if (node) ctx.emit({ t: 'node', node })
      }
      ctx.ipPool.push(ipn)
      if (ctx.g.addEdge(`sub:${host.toLowerCase()}`, `ip:${ipn}`, 'resolve')) {
        ctx.emit({ t: 'edge', edge: { from: `sub:${host.toLowerCase()}`, to: `ip:${ipn}`, label: 'resolve' } })
      }
    }
  }
  return count ? `${count} hosts` : null
}

interface RdapDomain {
  ldhName?: string
  status?: string[]
  events?: { eventAction: string; eventDate: string }[]
  entities?: { roles?: string[]; vcardArray?: unknown[]; handle?: string }[]
  nameservers?: { ldhName?: string }[]
}

async function modRdapDomain(ctx: CtxFull): Promise<string | null> {
  const d = ctx.tgt.domain
  if (!d) return null
  const r = await fetchJson<RdapDomain>(`https://rdap.org/domain/${encodeURIComponent(d)}`, 10_000)
  if (!r) return null
  const reg = r.events?.find((e) => e.eventAction === 'registration')?.eventDate ?? null
  const exp = r.events?.find((e) => e.eventAction === 'expiration')?.eventDate ?? null
  const upd = r.events?.find((e) => e.eventAction === 'last changed')?.eventDate ?? null
  const registrar = r.entities?.find((e) => e.roles?.includes('registrar'))
  const regName = (registrar?.vcardArray?.[1] as unknown[] | undefined)
    ?.flatMap((f) => (Array.isArray(f) && f[0] === 'fn' ? [String(f[3])] : []))
    .join('') ?? null
  pushNode(
    ctx,
    {
      id: `whois:${d}`,
      type: 'whois',
      label: 'Registro do domínio',
      value: d,
      source: 'rdap',
      meta: {
        registrador: regName,
        criado_em: reg ? reg.slice(0, 10) : null,
        expira_em: exp ? exp.slice(0, 10) : null,
        atualizado_em: upd ? upd.slice(0, 10) : null,
        status: r.status?.slice(0, 4).join(', ') ?? null,
      },
      url: `https://rdap.org/domain/${encodeURIComponent(d)}`,
    },
    undefined,
    'whois/rdap',
  )
  for (const ns of r.nameservers?.slice(0, 6) ?? []) {
    const host = ns.ldhName?.toLowerCase()
    if (!host) continue
    pushNode(
      ctx,
      { id: `dns:ns:${host}`, type: 'dns', label: `NS · ${cut(host, 30)}`, value: host, source: 'rdap', meta: { tipo: 'NS', origem: 'rdap' } },
      [`whois:${d}`],
      'nameserver',
    )
  }
  return regName ? `registrador: ${cut(regName, 26)}` : 'registro localizado'
}

async function modWayback(ctx: CtxFull): Promise<string | null> {
  const d = ctx.tgt.domain
  if (!d) return null
  const rows = await fetchJson<string[][]>(
    `https://web.archive.org/cdx/search/cdx?url=*.${encodeURIComponent(d)}&output=json&fl=original,timestamp,statuscode&collapse=urlkey&filter=statuscode:200&limit=300`,
    14_000,
  )
  if (!rows || rows.length < 2) return null
  const data = rows.slice(1)
  const seen = new Set<string>()
  let count = 0
  for (const [orig, ts] of data) {
    if (!orig || seen.has(orig)) continue
    seen.add(orig)
    if (count < 12) {
      let path = orig
      try {
        const u = new URL(orig)
        path = u.pathname + u.search
      } catch {
        /* mantém original */
      }
      pushNode(
        ctx,
        {
          id: `url:${orig}`,
          type: 'url',
          label: cut(path || '/', 40),
          value: orig,
          source: 'wayback',
          meta: { snapshot: ts ? `${ts.slice(0, 8)}` : null, origem: 'Wayback Machine' },
          url: orig.startsWith('http') ? orig : `https://${orig}`,
        },
        undefined,
        'arquivo histórico',
      )
    }
    count++
  }
  return `${count} URLs históricas`
}

async function modFiles(ctx: CtxFull): Promise<string | null> {
  const d = ctx.tgt.domain
  if (!d) return null
  let achados = 0
  const [robots, sec] = await Promise.all([
    fetchText(`https://${d}/robots.txt`, 8000),
    fetchText(`https://${d}/.well-known/security.txt`, 8000),
  ])
  if (robots && !/<html/i.test(robots)) {
    const paths = new Set<string>()
    const sitemaps: string[] = []
    for (const line of robots.split('\n')) {
      const [k, ...rest] = line.split(':')
      const key = (k ?? '').trim().toLowerCase()
      const val = rest.join(':').trim()
      if (key === 'sitemap' && val.startsWith('http')) sitemaps.push(val)
      if (key === 'disallow' && val && val !== '/') paths.add(val)
    }
    pushNode(
      ctx,
      {
        id: `url:robots:${d}`,
        type: 'url',
        label: 'robots.txt',
        value: `https://${d}/robots.txt`,
        source: 'files',
        meta: { diretorios: [...paths].slice(0, 8).join(' ') || '—', n_diretorios: paths.size },
        url: `https://${d}/robots.txt`,
      },
      undefined,
      'recon direto',
    )
    achados++
    for (const sm of sitemaps.slice(0, 3)) {
      pushNode(
        ctx,
        { id: `url:${sm}`, type: 'url', label: `sitemap · ${cut(sm.split('/').pop() ?? sm, 30)}`, value: sm, source: 'files', url: sm },
        [`url:robots:${d}`],
        'sitemap',
      )
      achados++
    }
  }
  if (sec && sec.toLowerCase().includes('contact:')) {
    pushNode(
      ctx,
      { id: `url:sectxt:${d}`, type: 'url', label: 'security.txt', value: `https://${d}/.well-known/security.txt`, source: 'files', url: `https://${d}/.well-known/security.txt` },
      undefined,
      'recon direto',
    )
    achados++
    for (const line of sec.split('\n')) {
      const m = /^contact:\s*(mailto:)?(\S+@\S+)/i.exec(line.trim())
      if (m?.[2]) {
        const email = m[2].toLowerCase()
        pushNode(
          ctx,
          { id: `email:${email}`, type: 'email', label: cut(email, 34), value: email, source: 'files', meta: { origem: 'security.txt' } },
          [`url:sectxt:${d}`],
          'contato',
        )
        ctx.tgtExtraEmails.push(email)
        achados++
      }
    }
  }
  return achados ? `${achados} artefatos` : null
}

/* ============ módulos: IP ============ */

interface IpApiResponse {
  status: string
  country?: string
  city?: string
  lat?: number
  lon?: number
  isp?: string
  org?: string
  as?: string
  asname?: string
  reverse?: string
  proxy?: boolean
  hosting?: boolean
  query?: string
}

async function modIpIntel(ctx: CtxFull): Promise<string | null> {
  const ips = [...new Set(ctx.ipPool)].slice(0, 10)
  if (!ips.length) return null
  let ok = 0
  await pool(ips, 4, async (ip) => {
    const r = await fetchJson<IpApiResponse>(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,city,lat,lon,isp,org,as,asname,reverse,proxy,hosting,query`,
      9000,
    )
    if (!r || r.status !== 'success') return
    ok++
    const asn = r.as?.split(' ')[0] ?? null
    const ipNode = ctx.g.nodes.get(`ip:${ip}`)
    if (ipNode) ipNode.meta = { ...(ipNode.meta ?? {}), isp: r.isp ?? null, org: r.org ?? null, proxy: r.proxy ?? false, hosting: r.hosting ?? false, rdns: r.reverse || null }

    pushNode(
      ctx,
      {
        id: `geo:${ip}`,
        type: 'geo',
        label: `${r.city ?? r.country ?? 'local'}`,
        value: `${r.city ?? '?'}, ${r.country ?? '?'}`,
        source: 'ip-intel',
        meta: { lat: r.lat ?? null, lon: r.lon ?? null, pais: r.country ?? null, cidade: r.city ?? null },
      },
      [`ip:${ip}`],
      'geolocalização',
    )
    if (asn) {
      pushNode(
        ctx,
        {
          id: `asn:${asn}`,
          type: 'asn',
          label: `${asn}`,
          value: `${r.as ?? asn} · ${r.asname ?? r.org ?? ''}`,
          source: 'ip-intel',
          meta: { operadora: r.asname ?? r.org ?? r.isp ?? null },
        },
        [`ip:${ip}`],
        'asn',
      )
    }
    if (r.reverse) {
      const host = r.reverse.toLowerCase().replace(/\.$/, '')
      const root = ctx.tgt.domain
      if (root && host.endsWith(root)) {
        pushNode(
          ctx,
          { id: `sub:${host}`, type: 'subdominio', label: cut(host, 34), value: host, source: 'rdns', meta: { via: `PTR de ${ip}` }, url: `https://${host}` },
          [`ip:${ip}`],
          'dns reverso',
        )
      }
    }
  })

  // RDAP de rede apenas quando o alvo É o IP (profundidade maior no foco)
  if (ctx.tgt.kind === 'ip') {
    const r = await fetchJson<{ handle?: string; name?: string; startAddress?: string; endAddress?: string; country?: string; entities?: { roles?: string[]; vcardArray?: unknown[] }[] }>(
      `https://rdap.org/ip/${encodeURIComponent(ctx.tgt.ip ?? '')}`,
      10_000,
    )
    if (r) {
      const org = r.entities?.find((e) => e.roles?.includes('registrant') || e.roles?.includes('administrative'))
      const orgName = (org?.vcardArray?.[1] as unknown[] | undefined)
        ?.flatMap((f) => (Array.isArray(f) && f[0] === 'fn' ? [String(f[3])] : []))
        .join('') ?? r.name ?? null
      pushNode(
        ctx,
        {
          id: `org:net:${r.handle ?? md5(ctx.tgt.ip ?? '')}`,
          type: 'org',
          label: 'Bloco de rede',
          value: orgName ?? 'netblock',
          source: 'ip-intel',
          meta: { faixa: `${r.startAddress ?? '?'} – ${r.endAddress ?? '?'}`, pais: r.country ?? null, handle: r.handle ?? null },
        },
        [`ip:${ctx.tgt.ip}`],
        'netblock',
      )
      ok++
    }
  }
  return ok ? `${ok} IPs enriquecidos` : null
}

async function modRdns(ctx: CtxFull): Promise<string | null> {
  const ips = [...new Set(ctx.ipPool)].slice(0, 8)
  if (!ips.length) return null
  let hits = 0
  await pool(ips, 4, async (ip) => {
    const m = RE_IPV4.exec(ip)
    if (!m) return
    const arpa = `${m[4]}.${m[3]}.${m[2]}.${m[1]}.in-addr.arpa`
    const ans = await doh(arpa, 'PTR')
    const host = ans[0]?.data?.toLowerCase().replace(/\.$/, '')
    if (!host) return
    hits++
    const root = ctx.tgt.domain
    if (root && host.endsWith(root) && !ctx.g.nodes.has(`sub:${host}`)) {
      pushNode(
        ctx,
        { id: `sub:${host}`, type: 'subdominio', label: cut(host, 34), value: host, source: 'rdns', meta: { via: `PTR ${ip}` }, url: `https://${host}` },
        [`ip:${ip}`],
        'dns reverso',
      )
      ctx.subPool.push(host)
    } else if (!ctx.g.nodes.has(`ip:${ip}`)) {
      // IP descoberto só pelo PTR
      pushNode(
        ctx,
        { id: `ip:${ip}`, type: 'ip', label: ip, value: ip, source: 'rdns', meta: { ptr: host } },
        undefined,
        'dns reverso',
      )
    } else {
      const node = ctx.g.nodes.get(`ip:${ip}`)
      if (node) node.meta = { ...(node.meta ?? {}), ptr: host }
    }
  })
  return hits ? `${hits} PTR` : null
}

async function modReverseIp(ctx: CtxFull): Promise<string | null> {
  const ip = [...new Set(ctx.ipPool)][0]
  if (!ip) return null
  const txt = await fetchText(`https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(ip)}`, 10_000)
  if (!txt || txt.includes('API count exceeded') || txt.includes('error')) return null
  const hosts = txt.split('\n').map((h) => h.trim().toLowerCase()).filter((h) => h.includes('.')).slice(0, 15)
  let added = 0
  for (const host of hosts) {
    if (ctx.g.nodes.has(`sub:${host}`)) continue
    added++
    pushNode(
      ctx,
      {
        id: `sub:${host}`,
        type: 'subdominio',
        label: cut(host, 34),
        value: host,
        source: 'reverseip',
        meta: { co_hospedado_em: ip },
        url: `https://${host}`,
      },
      [`ip:${ip}`],
      'mesmo IP',
    )
  }
  return added ? `${added} co-hospedados` : null
}

/* ============ módulos: e-mail ============ */

interface XonDetails { breaches_details?: { breach?: string; xposed_date?: string; xposed_records?: number; xposed_data?: string[] }[] }
interface XonAnalytics { ExposedBreaches?: XonDetails; BreachesMetrics?: Record<string, Record<string, unknown>> }

/** Garante que o nó do e-mail exista antes de pendurar vazamentos/perfis nele. */
function ensureEmailNode(ctx: CtxFull, email: string): void {
  const id = `email:${email}`
  if (ctx.g.nodes.has(id)) return
  pushNode(
    ctx,
    { id, type: 'email', label: cut(email, 34), value: email, source: 'breach', meta: { origem: 'derivado' } },
    [ctx.alvoId],
    'e-mail',
  )
}

async function modBreach(ctx: CtxFull): Promise<string | null> {
  const emails = ctx.emailPool()
  if (!emails.length) return null
  let total = 0
  await pool(emails.slice(0, 4), 2, async (email) => {
    ensureEmailNode(ctx, email)
    let details: XonDetails['breaches_details'] | null = null
    const r = await fetchJson<XonAnalytics>(
      `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`,
      10_000,
    )
    details = r?.ExposedBreaches?.breaches_details ?? null
    if (!details) {
      const simple = await fetchJson<{ breaches?: string[] }>(
        `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`,
        9000,
      )
      if (simple?.breaches?.length) details = simple.breaches.map((b) => ({ breach: b }))
    }
    if (!details?.length) return
    for (const b of details.slice(0, 12)) {
      const name = b.breach ?? 'vazamento'
      total++
      pushNode(
        ctx,
        {
          id: `breach:${name}:${email}`,
          type: 'breach',
          label: cut(name, 30),
          value: name,
          source: 'breach',
          meta: {
            email,
            data: b.xposed_date ?? null,
            registros: b.xposed_records ?? null,
            dados_expostos: b.xposed_data?.slice(0, 6).join(', ') ?? null,
          },
          url: `https://xposedornot.com/breaches/${encodeURIComponent(name)}`,
        },
        [`email:${email}`],
        'vazamento',
      )
    }
  })
  return total ? `${total} vazamentos` : null
}

interface GravatarEntry {
  hash?: string
  preferredUsername?: string
  profileUrl?: string
  displayName?: string
  aboutme?: string
  thumbnailUrl?: string
}

async function modGravatar(ctx: CtxFull): Promise<string | null> {
  const emails = ctx.emailPool()
  if (!emails.length) return null
  let hits = 0
  await pool(emails.slice(0, 3), 2, async (email) => {
    ensureEmailNode(ctx, email)
    const r = await fetchJson<GravatarEntry[]>(`https://www.gravatar.com/${md5(email.trim().toLowerCase())}.d.json`, 8000)
    const p = Array.isArray(r) ? r[0] : null
    if (!p) return
    hits++
    pushNode(
      ctx,
      {
        id: `user:gravatar:${email}`,
        type: 'usuario',
        label: `Gravatar · ${cut(p.preferredUsername ?? p.displayName ?? email, 24)}`,
        value: p.profileUrl ?? `https://gravatar.com/${md5(email)}`,
        source: 'gravatar',
        meta: { nome: p.displayName ?? null, bio: p.aboutme ? cut(p.aboutme, 140) : null, email },
        url: p.profileUrl ?? undefined,
      },
      [`email:${email}`],
      'perfil público',
    )
  })
  return hits ? `${hits} perfil(is)` : null
}

/* ============ módulos: usuário ============ */

interface GithubUser {
  login?: string
  name?: string
  bio?: string
  company?: string
  blog?: string
  location?: string
  created_at?: string
  public_repos?: number
  followers?: number
  html_url?: string
  avatar_url?: string
}
interface GithubRepo { full_name?: string; stargazers_count?: number; language?: string; html_url?: string; description?: string }

async function modGithub(ctx: CtxFull): Promise<string | null> {
  const u = ctx.tgt.username
  if (!u) return null
  const gh = await fetchJson<GithubUser>(`https://api.github.com/users/${encodeURIComponent(u)}`, 9000, {
    accept: 'application/vnd.github+json',
  })
  if (!gh?.login) return null
  pushNode(
    ctx,
    {
      id: 'user:github:' + gh.login.toLowerCase(),
      type: 'usuario',
      label: `GitHub · ${gh.login}`,
      value: gh.html_url ?? `https://github.com/${gh.login}`,
      source: 'github',
      meta: {
        nome: gh.name ?? null,
        bio: gh.bio ? cut(gh.bio, 120) : null,
        empresa: gh.company ?? null,
        local: gh.location ?? null,
        site: gh.blog ?? null,
        repos_publicos: gh.public_repos ?? 0,
        seguidores: gh.followers ?? 0,
        criado_em: gh.created_at ? gh.created_at.slice(0, 10) : null,
      },
      url: gh.html_url,
    },
    undefined,
    'perfil',
  )
  const repos = await fetchJson<GithubRepo[]>(`https://api.github.com/users/${encodeURIComponent(u)}/repos?sort=updated&per_page=5`, 9000, {
    accept: 'application/vnd.github+json',
  })
  let count = 0
  for (const r of repos ?? []) {
    if (!r.full_name) continue
    count++
    pushNode(
      ctx,
      {
        id: `repo:${r.full_name}`,
        type: 'repo',
        label: cut(r.full_name, 30),
        value: r.html_url ?? `https://github.com/${r.full_name}`,
        source: 'github',
        meta: { estrelas: r.stargazers_count ?? 0, linguagem: r.language ?? null, desc: r.description ? cut(r.description, 90) : null },
        url: r.html_url,
      },
      ['user:github:' + gh.login.toLowerCase()],
      'repositório',
    )
  }
  return `${count + 1} entidades no GitHub`
}

interface RedditAbout {
  data?: { name?: string; total_karma?: number; created_utc?: number; is_mod?: boolean; over_18?: boolean; icon_img?: string }
}

async function modReddit(ctx: CtxFull): Promise<string | null> {
  const u = ctx.tgt.username
  if (!u) return null
  const r = await fetchJson<RedditAbout>(`https://www.reddit.com/user/${encodeURIComponent(u)}/about.json`, 9000)
  const d = r?.data
  if (!d?.name) return null
  pushNode(
    ctx,
    {
      id: `user:reddit:${d.name.toLowerCase()}`,
      type: 'usuario',
      label: `Reddit · u/${d.name}`,
      value: `https://www.reddit.com/user/${d.name}`,
      source: 'reddit',
      meta: {
        karma_total: d.total_karma ?? 0,
        criado_em: d.created_utc ? new Date(d.created_utc * 1000).toISOString().slice(0, 10) : null,
        moderador: d.is_mod ?? false,
      },
      url: `https://www.reddit.com/user/${d.name}`,
    },
    undefined,
    'perfil',
  )
  return 'perfil encontrado'
}

/* ============ módulo: Google Dorks (automação real) ============ */

interface DorkDef {
  q: string
  desc: string
  extraUrl?: { nome: string; url: string }[]
}

function buildDorks(tgt: DetectedTarget): DorkDef[] {
  const g: DorkDef[] = []
  const mk = (q: string, desc: string, extra?: DorkDef['extraUrl']): DorkDef => ({
    q,
    desc,
    extraUrl: extra,
  })

  if (tgt.domain) {
    const d = tgt.domain
    g.push(
      mk(`site:${d}`, 'Superfície indexada do domínio', [
        { nome: 'Shodan', url: `https://www.shodan.io/search?query=hostname%3A${encodeURIComponent(d)}` },
        { nome: 'Censys', url: `https://search.censys.io/search?resource=hosts&q=${encodeURIComponent(d)}` },
        { nome: 'urlscan', url: `https://urlscan.io/domain/${encodeURIComponent(d)}` },
        { nome: 'VirusTotal', url: `https://www.virustotal.com/gui/domain/${encodeURIComponent(d)}` },
        { nome: 'crt.sh', url: `https://crt.sh/?q=${encodeURIComponent(d)}` },
        { nome: 'Wayback', url: `https://web.archive.org/web/*/${encodeURIComponent(d)}/*` },
      ]),
      mk(`site:${d} (filetype:pdf OR filetype:docx OR filetype:xlsx OR filetype:pptx)`, 'Documentos expostos'),
      mk(`site:${d} (inurl:admin OR inurl:painel OR inurl:login OR inurl:signin)`, 'Painéis administrativos'),
      mk(`site:${d} intitle:"index of"`, 'Listagens de diretório abertas'),
      mk(`site:${d} (filetype:env OR filetype:sql OR filetype:bak OR filetype:log OR filetype:yml)`, 'Arquivos sensíveis'),
      mk(`site:${d} (inurl:wp-admin OR inurl:wp-content OR inurl:wp-login)`, 'Superfície WordPress'),
      mk(`site:${d} (inurl:api OR inurl:swagger OR inurl:graphql OR inurl:actuator OR inurl:.git)`, 'APIs e repositórios expostos'),
      mk(`"@${d}" -site:${d}`, 'E-mails do domínio em sites terceiros'),
      mk(`site:${d} (intitle:login OR intitle:signin OR intitle:dashboard)`, 'Portais de autenticação'),
      mk(`inurl:${d} -site:${d}`, 'Referências externas / possível phishing'),
      mk(`"${d}" (site:pastebin.com OR site:justpaste.it OR site:textbin.net)`, 'Vazamentos em pastebins'),
      mk(`site:${d} (filetype:csv OR filetype:xls) (senha OR password OR credenciais)`, 'Planilhas com credenciais'),
    )
  }
  if (tgt.ip) {
    const ip = tgt.ip
    g.push(
      mk(`"${ip}"`, 'Menções ao IP na web', [
        { nome: 'Shodan', url: `https://www.shodan.io/host/${encodeURIComponent(ip)}` },
        { nome: 'Censys', url: `https://search.censys.io/search?resource=hosts&q=${encodeURIComponent(ip)}` },
        { nome: 'VirusTotal', url: `https://www.virustotal.com/gui/ip-address/${encodeURIComponent(ip)}` },
      ]),
      mk(`"${ip}" (site:pastebin.com OR site:justpaste.it)`, 'Vazamentos citando o IP'),
      mk(`netblock:"${ip}"`, 'Vizinhos de rede (busca ampla)'),
    )
  }
  if (tgt.email) {
    const e = tgt.email
    g.push(
      mk(`"${e}"`, 'Menções exatas ao e-mail', [{ nome: 'HIBP', url: `https://haveibeenpwned.com/account/${encodeURIComponent(e)}` }]),
      mk(`"@${e.split('@')[1]}" site:linkedin.com`, 'Pessoas do domínio no LinkedIn'),
      mk(`"@${e.split('@')[1]}" site:github.com`, 'Credenciais/repos do domínio no GitHub'),
      mk(`"${e}" (site:pastebin.com OR site:justpaste.it)`, 'Vazamentos em pastebins'),
      mk(`"${e}" (senha OR password OR dump OR leak OR credenciais)`, 'Termos de vazamento junto ao e-mail'),
    )
  }
  if (tgt.username) {
    const u = tgt.username
    g.push(
      mk(`"${u}" site:linkedin.com/in`, 'Perfil no LinkedIn'),
      mk(`site:github.com "${u}"`, 'Atividade no GitHub'),
      mk(`"${u}" (site:x.com OR site:twitter.com)`, 'Perfil no X/Twitter'),
      mk(`"${u}" (site:instagram.com OR site:facebook.com OR site:tiktok.com)`, 'Redes sociais'),
      mk(`"${u}" (fórum OR forum OR underground OR discord)`, 'Fóruns e comunidades'),
      mk(`intitle:"${u}"`, 'Páginas com o nome no título'),
    )
  }
  return g
}

async function modDorks(ctx: CtxFull): Promise<string | null> {
  const dorks = buildDorks(ctx.tgt)
  if (!dorks.length) return null
  const parentId = ctx.alvoId
  dorks.forEach((dk, i) => {
    pushNode(
      ctx,
      {
        id: `dork:${ctx.tgt.kind}:${i}`,
        type: 'dork',
        label: dk.desc,
        value: dk.q,
        source: 'dorks',
        meta: { consulta: dk.q, motores: 'Google · Bing · DuckDuckGo', extras: dk.extraUrl?.map((e) => e.nome).join(', ') || null },
        url: `https://www.google.com/search?q=${encodeURIComponent(dk.q)}`,
      },
      [parentId],
      'dork',
    )
    // mantém também o link direto para o dork no Bing/DDG via meta (usado no inspector)
    const node = ctx.g.nodes.get(`dork:${ctx.tgt.kind}:${i}`)
    if (node) {
      const extras: Record<string, string> = {
        url_bing: `https://www.bing.com/search?q=${encodeURIComponent(dk.q)}`,
        url_ddg: `https://duckduckgo.com/?q=${encodeURIComponent(dk.q)}`,
      }
      dk.extraUrl?.forEach((e, j) => {
        extras[`link_${j}_nome`] = e.nome
        extras[`link_${j}_url`] = e.url
      })
      node.meta = { ...(node.meta ?? {}), ...extras }
    }
  })
  return `${dorks.length} dorks`
}

/* ============ orquestração ============ */

export async function runOsintScan(rawTarget: string, emit: OsintEmitter): Promise<void> {
  const t0 = Date.now()
  const tgt = detectTarget(rawTarget)
  if (!tgt) {
    emit({
      t: 'module',
      id: 'alvo',
      label: 'Validação do alvo',
      status: 'error',
      info: 'alvo inválido — use domínio, IP, e-mail ou @usuário',
    })
    emit({ t: 'done', summary: { nodes: 0, edges: 0, sec: 0 } })
    return
  }

  const g = new Graph()
  const ctx: CtxFull = {
    g,
    emit,
    tgt,
    alvoId: `alvo:${tgt.value}`,
    tgtExtraEmails: [],
    ipPool: [],
    subPool: [],
    emailPool() {
      const set = new Set<string>(ctx.tgtExtraEmails.map((e) => e.toLowerCase()))
      if (tgt.email) set.add(tgt.email)
      if (tgt.domain) set.add(`contato@${tgt.domain}`)
      return [...set].filter((e) => RE_EMAIL.test(e))
    },
  }

  const alvoNode: OsintNode = {
    id: ctx.alvoId,
    type: 'alvo',
    label: cut(tgt.value, 30),
    value: tgt.value,
    source: 'alvo',
    depth: 0,
    meta: { tipo: tgt.kind, observacao: 'alvo principal do recon' },
  }
  g.addNode(alvoNode)
  emit({ t: 'target', kind: tgt.kind, value: tgt.value })
  emit({ t: 'node', node: alvoNode })

  // sementes de pivô conforme o tipo de alvo
  if (tgt.ip) {
    ctx.ipPool.push(tgt.ip)
    pushNode(
      ctx,
      { id: `ip:${tgt.ip}`, type: 'ip', label: tgt.ip, value: tgt.ip, source: 'alvo', meta: { via: 'alvo informado' } },
      [ctx.alvoId],
      'identidade',
    )
  }
  if (tgt.email) {
    pushNode(
      ctx,
      { id: `email:${tgt.email}`, type: 'email', label: cut(tgt.email, 34), value: tgt.email, source: 'alvo', meta: { origem: 'alvo informado' } },
      [ctx.alvoId],
      'identidade',
    )
  }

  const wave = (fns: (() => Promise<void>)[]) => Promise.allSettled(fns.map((f) => f()))
  const M = (id: string, label: string, fn: () => Promise<string | null>) => () => runModule(ctx, id, label, fn)

  const emailKind = tgt.kind === 'email'
  const domainPipeline = () =>
    wave([
      M('dns', OSINT_MODULES[0].label, () => modDns(ctx)),
      M('crtsh', OSINT_MODULES[1].label, () => modCrtsh(ctx)),
      M('hackertarget', OSINT_MODULES[2].label, () => modHackerTarget(ctx)),
      M('rdap', OSINT_MODULES[3].label, () => modRdapDomain(ctx)),
      M('wayback', OSINT_MODULES[4].label, () => modWayback(ctx)),
      M('files', OSINT_MODULES[5].label, () => modFiles(ctx)),
      M('dorks', OSINT_MODULES[9].label, () => modDorks(ctx)),
    ])

  if (tgt.kind === 'domain' || emailKind) {
    await domainPipeline()
  }

  // ---- pivô: resolver subdomínios → IPs (profundidade 2, cadeia real)
  if (ctx.subPool.length) {
    const subs = [...new Set(ctx.subPool)].slice(0, 10)
    await pool(subs, 5, async (host) => {
      await resolveHostIps(ctx, host, 2, `sub:${host}`)
    })
  }

  // ---- pivô: enriquecimento de IPs (geo/ASN/rDNS)
  await Promise.allSettled([
    runModule(ctx, 'ip-intel', OSINT_MODULES[6].label, () => modIpIntel(ctx)),
    runModule(ctx, 'rdns', OSINT_MODULES[7].label, () => modRdns(ctx)),
  ])

  // ---- pivô: reverse IP no primeiro IP
  if (ctx.ipPool.length && tgt.kind !== 'email') {
    await runModule(ctx, 'reverseip', OSINT_MODULES[8].label, () => modReverseIp(ctx))
  }

  // ---- pivô: e-mails encontrados → vazamentos + gravatar
  if (tgt.kind === 'email' || ctx.tgtExtraEmails.length) {
    await Promise.allSettled([
      runModule(ctx, 'breach', OSINT_MODULES[10].label, () => modBreach(ctx)),
      runModule(ctx, 'gravatar', OSINT_MODULES[11].label, () => modGravatar(ctx)),
    ])
  }

  if (tgt.kind === 'username') {
    await Promise.allSettled([
      runModule(ctx, 'github', OSINT_MODULES[12].label, () => modGithub(ctx)),
      runModule(ctx, 'reddit', OSINT_MODULES[13].label, () => modReddit(ctx)),
      runModule(ctx, 'dorks', OSINT_MODULES[9].label, () => modDorks(ctx)),
    ])
  }

  if (tgt.kind === 'ip') {
    await Promise.allSettled([
      runModule(ctx, 'dorks', OSINT_MODULES[9].label, () => modDorks(ctx)),
    ])
  }

  emit({
    t: 'done',
    summary: { nodes: g.nodes.size, edges: g.edges.size, sec: Math.round((Date.now() - t0) / 100) / 10 },
  })
}
