'use client'

// CAPYBER — ilustrações vetoriais do painel (escudo, adversário, mascote, bandeiras).

const CYAN = '#2f7fd1'
const CYAN_SOFT = '#7cc4f5'
const ORANGE = '#f5920b'
const YELLOW = '#ffc94d'
const NAVY = '#0d2038'

function Sparkle({ x, y, s = 10, fill = '#ffffff', o = 0.9 }: { x: number; y: number; s?: number; fill?: string; o?: number }) {
  return (
    <path
      d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`}
      fill={fill}
      opacity={o}
    />
  )
}

function spiralPath(cx: number, cy: number, maxR: number, turns = 2.6, points = 140): string {
  const pts: string[] = []
  for (let i = 0; i <= points; i++) {
    const t = i / points
    const angle = t * turns * Math.PI * 2
    const r = maxR * t
    pts.push(`${i === 0 ? 'M' : 'L'}${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`)
  }
  return pts.join(' ')
}

export function CapShield({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Escudo do CAPYBER" className="shrink-0 drop-shadow-[0_3px_6px_rgba(37,105,184,0.45)]">
      <defs>
        <linearGradient id="shield-outer-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6fb1ec" />
          <stop offset="55%" stopColor="#2f7fd1" />
          <stop offset="100%" stopColor="#1d5fae" />
        </linearGradient>
        <linearGradient id="shield-face-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbeafc" />
        </linearGradient>
      </defs>
      <path d="M32 3 L57 11.5 V30 C57 46.5 46.5 56.5 32 61 C17.5 56.5 7 46.5 7 30 V11.5 Z" fill="url(#shield-outer-g)" stroke="#10315c" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M32 9 L51 15.5 V30 C51 42.5 43 50.5 32 54.5 C21 50.5 13 42.5 13 30 V15.5 Z" fill="url(#shield-face-g)" stroke="#10315c" strokeWidth="1.6" strokeLinejoin="round" />
      <g>
        <path d="M13 15.5 L32 9 V22 L13 28 Z" fill="#4a94dd" opacity="0.85" />
        <path d="M32 22 L51 15.5 V28.5 L32 35 Z" fill="#8cc0f0" opacity="0.9" />
        <path d="M13 28 L32 22 V35 L13 41 Z" fill="#8cc0f0" opacity="0.9" />
        <path d="M32 35 L51 28.5 V42 L32 48.5 Z" fill="#4a94dd" opacity="0.85" />
        <path d="M13 41 L32 35 V48.5 L21.5 52.4 C16.5 49.3 13 44.6 13 41 Z" fill="#c7def7" opacity="0.95" />
      </g>
      <path d="M32 9 L51 15.5 V30 C51 42.5 43 50.5 32 54.5 C21 50.5 13 42.5 13 30 V15.5 Z" fill="none" stroke="#10315c" strokeWidth="1.6" strokeLinejoin="round" />
      <Sparkle x={44} y={18} s={4.5} fill="#ffffff" o={0.95} />
    </svg>
  )
}

export function HoodFigure({ size = 96, seed = 0 }: { size?: number; seed?: number }) {
  const eyeGlow = seed % 3 === 0 ? 1 : seed % 3 === 1 ? 0.85 : 0.95
  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 100 112" role="img" aria-label="Adversário encapuzado (ilustração)">
      <defs>
        <radialGradient id={`hood-halo-${seed}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#a03040" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#a03040" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`hood-g-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a46" />
          <stop offset="60%" stopColor="#23232d" />
          <stop offset="100%" stopColor="#17171f" />
        </linearGradient>
        <linearGradient id={`hood-inner-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12060a" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="46" rx="44" ry="42" fill={`url(#hood-halo-${seed})`} />
      <path d="M50 6 C26 10 16 30 17 52 C18 72 26 88 34 98 L66 98 C74 88 82 72 83 52 C84 30 74 10 50 6 Z" fill={`url(#hood-g-${seed})`} stroke="#0c0c12" strokeWidth="2.5" />
      <path d="M30 22 C24 34 22 48 24 62" stroke="#0c0c12" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M70 22 C76 34 78 48 76 62" stroke="#0c0c12" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M36 34 C42 28 58 28 64 34 C68 42 68 56 62 64 C56 70 44 70 38 64 C32 56 32 42 36 34 Z" fill={`url(#hood-inner-${seed})`} />
      <g>
        <ellipse cx="42.5" cy="46" rx="4.6" ry="2.6" fill="#ff2b3e" opacity={eyeGlow} />
        <ellipse cx="57.5" cy="46" rx="4.6" ry="2.6" fill="#ff2b3e" opacity={eyeGlow} />
        <ellipse cx="42.5" cy="46" rx="8.5" ry="4.6" fill="#ff2b3e" opacity={0.28 * eyeGlow} />
        <ellipse cx="57.5" cy="46" rx="8.5" ry="4.6" fill="#ff2b3e" opacity={0.28 * eyeGlow} />
      </g>
      <path d="M20 112 C22 98 32 94 50 94 C68 94 78 98 80 112 Z" fill={`url(#hood-g-${seed})`} stroke="#0c0c12" strokeWidth="2.5" />
    </svg>
  )
}

export function MascotCapy({ size = 150, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 0.92} viewBox="0 0 150 138" role="img" aria-label="Capy Fantasma, mascote do CAPYBER" className={className}>
      <defs>
        <linearGradient id="capy-body-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#eaf3fd" />
          <stop offset="100%" stopColor="#cfe4fa" />
        </linearGradient>
        <linearGradient id="goggle-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb24d" />
          <stop offset="100%" stopColor="#e07f0a" />
        </linearGradient>
      </defs>
      <ellipse cx="75" cy="72" rx="62" ry="56" fill="#7cb6ec" opacity="0.18" />
      <path d="M75 8 C40 8 24 34 24 64 C24 84 20 100 12 112 C24 116 34 112 40 104 C42 114 50 120 58 118 C62 126 72 128 78 122 C84 128 94 126 98 118 C106 120 114 114 114 106 C122 112 132 110 138 102 C124 96 120 82 121 64 C122 34 110 8 75 8 Z" fill="url(#capy-body-g)" stroke="#5d86b8" strokeWidth="3" strokeLinejoin="round" />
      <path d="M38 22 C34 14 40 8 46 12 C48 14 48 20 46 24 Z" fill="#ffffff" stroke="#5d86b8" strokeWidth="2.6" />
      <path d="M112 22 C116 14 110 8 104 12 C102 14 102 20 104 24 Z" fill="#ffffff" stroke="#5d86b8" strokeWidth="2.6" />
      <g>
        <rect x="26" y="26" width="98" height="22" rx="11" fill="url(#goggle-g)" stroke="#10315c" strokeWidth="3" />
        <rect x="34" y="31" width="34" height="12" rx="6" fill="#ffd9a3" stroke="#10315c" strokeWidth="2" opacity="0.95" />
        <rect x="82" y="31" width="34" height="12" rx="6" fill="#ffd9a3" stroke="#10315c" strokeWidth="2" opacity="0.95" />
        <rect x="70" y="34" width="10" height="6" rx="2" fill="#10315c" opacity="0.85" />
      </g>
      <g fill="#10315c">
        <ellipse cx="56" cy="64" rx="6.5" ry="8.5" />
        <ellipse cx="94" cy="64" rx="6.5" ry="8.5" />
        <circle cx="58.5" cy="61" r="2.2" fill="#ffffff" />
        <circle cx="96.5" cy="61" r="2.2" fill="#ffffff" />
      </g>
      <ellipse cx="75" cy="74" rx="6.5" ry="4.5" fill="#e9f3fd" stroke="#5d86b8" strokeWidth="2" />
      <path d="M60 84 C66 96 84 96 90 84 C86 92 80 95 75 95 C70 95 64 92 60 84 Z" fill="#10315c" />
      <path d="M64 88 C70 93 80 93 86 88 C82 90 68 90 64 88 Z" fill="#ff8fa0" />
      <ellipse cx="46" cy="76" rx="6" ry="4" fill="#ffc9d4" opacity="0.8" />
      <ellipse cx="104" cy="76" rx="6" ry="4" fill="#ffc9d4" opacity="0.8" />
      <path d="M22 58 C14 52 10 42 14 34 C20 40 24 48 26 54 Z" fill="#ffffff" stroke="#5d86b8" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M128 58 C136 52 140 42 136 34 C130 40 126 48 124 54 Z" fill="#ffffff" stroke="#5d86b8" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M118 40 l2.4 5 5 2.4 -5 2.4 -2.4 5 -2.4 -5 -5 -2.4 5 -2.4 Z" fill="#ffd21c" stroke="#e07f0a" strokeWidth="1" />
    </svg>
  )
}

export function CapyBadge({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Emblema da VIGIA" className="shrink-0">
      <defs>
        <linearGradient id="badge-rim-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7cb6ec" />
          <stop offset="100%" stopColor="#1d5fae" />
        </linearGradient>
      </defs>
      <path d="M32 2 L58 17 V47 L32 62 L6 47 V17 Z" fill="url(#badge-rim-g)" stroke="#10315c" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 8 L52.5 20 V44 L32 56 L11.5 44 V20 Z" fill="#ffffff" stroke="#10315c" strokeWidth="1.6" />
      <path d="M11.5 26 H52.5 V36 C46 40 40 38 32 38 C24 38 18 40 11.5 36 Z" fill="#f5920b" />
      <ellipse cx="32" cy="42" rx="11" ry="8" fill="#fff3e2" stroke="#10315c" strokeWidth="2" />
      <circle cx="28" cy="42" r="1.8" fill="#10315c" />
      <circle cx="36" cy="42" r="1.8" fill="#10315c" />
      <ellipse cx="32" cy="46.5" rx="3.4" ry="2" fill="#10315c" opacity="0.85" />
      <circle cx="23.5" cy="31.5" r="2.6" fill="#10315c" />
      <circle cx="40.5" cy="31.5" r="2.6" fill="#10315c" />
    </svg>
  )
}

export function Flag({ cc, className }: { cc: string; className?: string }) {
  const w = 23
  const h = 15
  const common = { width: w, height: h, className, 'aria-hidden': true } as const
  const frame = <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx="2" fill="none" stroke="#10315c" strokeWidth="1" opacity="0.55" />
  switch (cc) {
    case 'CN':
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w} height={h} rx="2" fill="#de2910" />
          <path d="M5 3.2 l1 2.1 2.3 .3 -1.7 1.6 .4 2.3 -2 -1.1 -2 1.1 .4 -2.3 -1.7 -1.6 2.3 -.3 Z" fill="#ffde00" />
          {frame}
        </svg>
      )
    case 'RU':
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w} height={h / 3} rx="2" fill="#ffffff" />
          <rect y={h / 3} width={w} height={h / 3} fill="#0039a6" />
          <rect y={(2 * h) / 3} width={w} height={h / 3} rx="2" fill="#d52b1e" />
          {frame}
        </svg>
      )
    case 'KP':
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w} height={h} rx="2" fill="#024fa2" />
          <rect y={2} width={w} height={h - 4} fill="#ffffff" />
          <rect y={4} width={w} height={h - 8} fill="#ed1c27" />
          <circle cx="7" cy="7.5" r="2.6" fill="#ffffff" />
          <circle cx="7.8" cy="7.5" r="2.1" fill="#ed1c27" />
          {frame}
        </svg>
      )
    case 'IR':
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w} height={h / 3} rx="2" fill="#239f40" />
          <rect y={h / 3} width={w} height={h / 3} fill="#ffffff" />
          <rect y={(2 * h) / 3} width={w} height={h / 3} rx="2" fill="#da0000" />
          {frame}
        </svg>
      )
    case 'VN':
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w} height={h} rx="2" fill="#da251d" />
          <path d="M11.5 2.8 l1.2 2.6 2.9 .4 -2.1 2 .5 2.9 -2.5 -1.4 -2.5 1.4 .5 -2.9 -2.1 -2 2.9 -.4 Z" fill="#ffff00" />
          {frame}
        </svg>
      )
    case 'NG':
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w / 3} height={h} rx="2" fill="#008751" />
          <rect x={w / 3} width={w / 3} height={h} fill="#ffffff" />
          <rect x={(2 * w) / 3} width={w / 3} height={h} rx="2" fill="#008751" />
          {frame}
        </svg>
      )
    case 'NL':
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w} height={h / 3} rx="2" fill="#ae1c28" />
          <rect y={h / 3} width={w} height={h / 3} fill="#ffffff" />
          <rect y={(2 * h) / 3} width={w} height={h / 3} rx="2" fill="#21468b" />
          {frame}
        </svg>
      )
    case 'BR':
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w} height={h} rx="2" fill="#009c3b" />
          <path d={`M${w / 2} 1.8 L${w - 2.2} ${h / 2} L${w / 2} ${h - 1.8} L2.2 ${h / 2} Z`} fill="#ffdf00" />
          <circle cx={w / 2} cy={h / 2} r="3.4" fill="#002776" />
          <path d={`M${w / 2 - 3} ${h / 2 - 1} q3 -1.4 6 0`} stroke="#ffffff" strokeWidth="1.1" fill="none" />
          {frame}
        </svg>
      )
    default:
      return (
        <svg {...common} viewBox={`0 0 ${w} ${h}`}>
          <rect width={w} height={h} rx="2" fill="#b9d4f0" />
          {frame}
        </svg>
      )
  }
}

export function GateSpiral({ size = 72, spin = false, title }: { size?: number; spin?: boolean; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label={title ?? 'Portal digital'} className={spin ? 'cap-gate-spin' : undefined}>
      <defs>
        <linearGradient id="gate-spiral-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={CYAN_SOFT} />
          <stop offset="55%" stopColor={CYAN} />
          <stop offset="100%" stopColor={ORANGE} />
        </linearGradient>
        <radialGradient id="gate-core-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="45%" stopColor={CYAN} stopOpacity="0.35" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="6" y="6" width="84" height="84" rx="20" fill={NAVY} stroke={CYAN} strokeWidth="4" />
      <rect x="12" y="12" width="72" height="72" rx="15" fill="none" stroke={CYAN} strokeWidth="1.6" opacity="0.45" />
      <circle cx="48" cy="48" r="34" fill="url(#gate-core-g)" />
      <path d={spiralPath(48, 48, 27)} fill="none" stroke="url(#gate-spiral-g)" strokeWidth="5.5" strokeLinecap="round" />
      <Sparkle x={74} y={22} s={7} o={0.95} />
      <Sparkle x={22} y={72} s={5} fill={YELLOW} o={0.9} />
    </svg>
  )
}
