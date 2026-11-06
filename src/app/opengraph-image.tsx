// CAPYBER Open Graph card — static render, no remote fonts
import { ImageResponse } from 'next/og'

export const alt = 'CAPYBER — proteção de endpoints'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          backgroundColor: '#0d2038',
          backgroundImage:
            'linear-gradient(rgba(143, 184, 228, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(143, 184, 228, 0.12) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontStyle: 'italic',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          CAPYBER
        </div>
        <div
          style={{
            display: 'flex',
            width: 140,
            height: 10,
            backgroundColor: '#f5920b',
            marginTop: 28,
            marginBottom: 36,
          }}
        />
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#ffffff', lineHeight: 1.15 }}>
          O CAPYBER protege seus endpoints.
        </div>
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: '#f5920b', marginTop: 28 }}>
          Não blindamos apenas o perímetro; blindamos o dispositivo.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#8fb8e4', marginTop: 28 }}>
          APTs de estado · hacktivistas · ameaças internas
        </div>
      </div>
    ),
    size
  )
}
