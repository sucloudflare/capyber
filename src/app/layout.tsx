// CAPYBER root layout — brand fonts, SEO metadata, PWA and JSON-LD structured data
// Fontes: variáveis definidas em globals.css (:root) com stacks de sistema —
// sem dependência de rede (next/font/google falha em ambientes sem internet).
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_KEYWORDS } from '@/lib/site'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: '%s | CAPYBER' },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'Time CAPYBER' }],
  creator: 'Time CAPYBER',
  publisher: 'Time CAPYBER',
  applicationName: SITE_NAME,
  category: 'technology',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: { telephone: false },
  icons: { icon: '/icon.svg' },
  appleWebApp: {
    capable: true,
    title: 'CAPYBER',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#eef5fe',
  width: 'device-width',
  initialScale: 1,
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'security operations',
      availableLanguage: ['pt-BR'],
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'pt-BR',
    publisher: { '@id': `${SITE_URL}/#organization` },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web, Windows, macOS, Linux, iOS, Android',
    description: SITE_DESCRIPTION,
    inLanguage: 'pt-BR',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    featureList: [
      'EDR/XDR comportamental no dispositivo',
      'MDM e MFA FIDO2',
      'Detecção correlacionada MITRE ATT&CK',
      'Resposta a incidentes com playbooks',
      'Operador IA com auditoria',
      'Mapa global de ameaças em tempo real',
      'Trilha gamificada anti engenharia social',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'Por que o maior alvo é uma pessoa? — CAPYBER',
    description:
      'Vídeo educativo sobre engenharia social: por que a pessoa é o alvo inicial dos ataques e como o clique humano se torna a porta de entrada para os dispositivos internos.',
    thumbnailUrl: [`${SITE_URL}/video/eng-social-poster.jpg`],
    uploadDate: '2025-11-04',
    contentUrl: `${SITE_URL}/video/eng-social.mp4`,
    contentSize: '10MB',
    encodingFormat: 'video/mp4',
    duration: 'PT45S',
    inLanguage: 'pt-BR',
    isFamilyFriendly: true,
    publisher: { '@id': `${SITE_URL}/#organization` },
    about: 'Engenharia social, phishing, smishing, vishing e prevenção em endpoints',
  },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
