import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CAPYBER — Proteção de Endpoints',
    short_name: 'CAPYBER',
    description:
      'EDR/XDR, MDM, zero trust e MITRE ATT&CK no dispositivo — SOC em tempo real contra APTs e ameaças internas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#eef5fe',
    theme_color: '#10315c',
    lang: 'pt-BR',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
