// CAPYBER — registro de módulos OSINT e tipos do grafo.
// Arquivo puro (sem node:crypto) — seguro para import no cliente e no servidor.

export type OsintType =
  | 'alvo'
  | 'subdominio'
  | 'ip'
  | 'dns'
  | 'asn'
  | 'geo'
  | 'org'
  | 'whois'
  | 'email'
  | 'breach'
  | 'usuario'
  | 'repo'
  | 'dork'
  | 'url'

export interface OsintNode {
  id: string
  type: OsintType
  label: string
  value: string
  source: string
  depth: number
  meta?: Record<string, string | number | boolean | null>
  url?: string
}

export interface OsintEdge {
  from: string
  to: string
  label: string
}

export type OsintEvent =
  | { t: 'modules'; modules: { id: string; label: string }[] }
  | { t: 'module'; id: string; label: string; status: 'running' | 'done' | 'error' | 'empty'; info?: string }
  | { t: 'node'; node: OsintNode }
  | { t: 'edge'; edge: OsintEdge }
  | { t: 'target'; kind: 'domain' | 'ip' | 'email' | 'username'; value: string }
  | { t: 'done'; summary: { nodes: number; edges: number; sec: number } }

export type OsintEmitter = (ev: OsintEvent) => void

export const OSINT_MODULES: { id: string; label: string }[] = [
  { id: 'dns', label: 'DNS · Cloudflare DoH' },
  { id: 'crtsh', label: 'crt.sh · Cert Transparency' },
  { id: 'hackertarget', label: 'HackerTarget · hostsearch' },
  { id: 'rdap', label: 'RDAP · Registro WHOIS' },
  { id: 'wayback', label: 'Wayback Machine · CDX' },
  { id: 'files', label: 'robots.txt / security.txt' },
  { id: 'ip-intel', label: 'ip-api · Geo/ASN' },
  { id: 'rdns', label: 'DNS reverso · PTR' },
  { id: 'reverseip', label: 'Reverse IP · co-hosted' },
  { id: 'dorks', label: 'Google Dorks · automação' },
  { id: 'breach', label: 'XposedOrNot · vazamentos' },
  { id: 'gravatar', label: 'Gravatar · perfil' },
  { id: 'github', label: 'GitHub · usuário/repos' },
  { id: 'reddit', label: 'Reddit · perfil' },
]

export const OSINT_TYPE_LABEL: Record<OsintType, string> = {
  alvo: 'Alvo',
  subdominio: 'Subdomínio',
  ip: 'IP',
  dns: 'DNS',
  asn: 'ASN',
  geo: 'Geolocalização',
  org: 'Organização',
  whois: 'Registro',
  email: 'E-mail',
  breach: 'Vazamento',
  usuario: 'Usuário',
  repo: 'Repositório',
  dork: 'Dork',
  url: 'URL',
}

/** Cores por tipo — paleta coerente com o tema CAPYBER. */
export const OSINT_TYPE_COLOR: Record<OsintType, string> = {
  alvo: '#ffd54a',
  subdominio: '#37c0fb',
  ip: '#35d07f',
  dns: '#8b5cf6',
  asn: '#2dd4bf',
  geo: '#fb923c',
  org: '#f472b6',
  whois: '#b7c9de',
  email: '#f87171',
  breach: '#ef4444',
  usuario: '#c4b5fd',
  repo: '#60a5fa',
  dork: '#fbbf24',
  url: '#7cb6ec',
}

/** Detecção de alvo (espelho leve, client-side, do detectTarget do motor). */
export function guessTargetKind(raw: string): 'domain' | 'ip' | 'email' | 'username' | null {
  const input = raw.trim()
  if (!input) return null
  let hostish = input
  if (/^https?:\/\//i.test(input)) hostish = input.replace(/^https?:\/\//i, '').split(/[/?#]/)[0] ?? ''
  if (hostish.includes('@')) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(hostish.toLowerCase())) return 'email'
    const handle = hostish.toLowerCase().replace(/^@/, '').split('@')[0]?.trim() ?? ''
    return /^[a-z0-9._-]{2,40}$/.test(handle) ? 'username' : null
  }
  const single = hostish.toLowerCase().replace(/^www\./, '')
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(single)) return 'ip'
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(single)) return 'domain'
  const user = input.replace(/^@/, '').trim()
  if (/^[a-z0-9._-]{2,40}$/i.test(user)) return 'username'
  return null
}
