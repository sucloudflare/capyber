'use client'

// CAPYBER Trilha 3D — arquitetura de RPG construída com primitivas three.js:
// castelos procedurais (torre de menagem com ameias, torres de canto com
// telhados cônicos de ardósia, muralhas ameadas, portão em arco com ponte
// levadiça, bandeiras ondulando), torres de vigia com facho e estandartes de
// fase. Textura de pedra gerada em canvas — zero assets externos.

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
} from 'three'

export type CastleVariant = 'granite' | 'sandstone' | 'obsidian'

interface CastlePalette {
  /** parede base (alimentada pela textura) */
  wall: string
  /** frisos, parapeitos e anéis */
  trim: string
  /** telhados cônicos de ardósia */
  roof: string
  /** juntas/argamassa + ferro escuro */
  mortar: string
  /** fendas de janela emissivas */
  window: string
  /** tecido das bandeiras */
  flag: string
  /** intensidade das janelas */
  windowGlow: number
}

const PALETTES: Record<CastleVariant, CastlePalette> = {
  granite: {
    wall: '#9aa3b2',
    trim: '#b3bcc9',
    roof: '#46536b',
    mortar: '#5c6675',
    window: '#ffb85c',
    flag: '#2569b8',
    windowGlow: 1.6,
  },
  sandstone: {
    wall: '#d2b78c',
    trim: '#e4cca4',
    roof: '#8a5c38',
    mortar: '#8f7a56',
    window: '#ffcf6e',
    flag: '#b01226',
    windowGlow: 1.5,
  },
  obsidian: {
    wall: '#434959',
    trim: '#5d6478',
    roof: '#23283a',
    mortar: '#20242f',
    window: '#ff7a45',
    flag: '#8a1c2b',
    windowGlow: 2,
  },
}

/* ---------------- textura de pedra em canvas ---------------- */

const stoneTexCache: Partial<Record<CastleVariant, CanvasTexture>> = {}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.min(255, Math.max(0, v + amt))
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 0xff)},${ch(n & 0xff)})`
}

/** tijolos + ruído desenhados em canvas → realismo sem baixar nada */
function getStoneTexture(variant: CastleVariant): CanvasTexture {
  const cached = stoneTexCache[variant]
  if (cached) return cached

  const p = PALETTES[variant]
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d indisponível')
  ctx.fillStyle = p.wall
  ctx.fillRect(0, 0, 256, 256)

  const rows = 8
  const rowH = 256 / rows
  for (let r = 0; r < rows; r++) {
    const off = r % 2 === 0 ? 0 : 32
    for (let b = -1; b < 5; b++) {
      const jitter = (((r * 7 + b * 13) % 5) - 2) * 4 // -8..8
      ctx.fillStyle = shade(p.wall, jitter)
      ctx.fillRect(b * 64 + off + 1.5, r * rowH + 1.5, 61, rowH - 3)
    }
  }
  // juntas
  ctx.strokeStyle = p.mortar
  ctx.lineWidth = 2.4
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath()
    ctx.moveTo(0, r * rowH)
    ctx.lineTo(256, r * rowH)
    ctx.stroke()
  }
  for (let r = 0; r < rows; r++) {
    const off = r % 2 === 0 ? 0 : 32
    for (let b = 0; b <= 4; b++) {
      const x = b * 64 + off
      ctx.beginPath()
      ctx.moveTo(x, r * rowH)
      ctx.lineTo(x, (r + 1) * rowH)
      ctx.stroke()
    }
  }
  // ruído de desgaste
  let seed = variant.length * 7919 + 41
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < 1100; i++) {
    ctx.globalAlpha = 0.04 + rnd() * 0.07
    ctx.fillStyle = rnd() > 0.5 ? '#000000' : '#ffffff'
    ctx.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2.6, 1 + rnd() * 2.2)
  }
  ctx.globalAlpha = 1

  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(2.6, 2.2)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  stoneTexCache[variant] = tex
  return tex
}

interface CastleMaterials {
  wall: MeshStandardMaterial
  trim: MeshStandardMaterial
  roof: MeshStandardMaterial
  dark: MeshStandardMaterial
  window: MeshStandardMaterial
  palette: CastlePalette
}

function useCastleMaterials(variant: CastleVariant): CastleMaterials {
  return useMemo(() => {
    const p = PALETTES[variant]
    return {
      wall: new MeshStandardMaterial({ map: getStoneTexture(variant), roughness: 0.93, metalness: 0.02 }),
      trim: new MeshStandardMaterial({ color: p.trim, roughness: 0.85 }),
      roof: new MeshStandardMaterial({ color: p.roof, roughness: 0.72, metalness: 0.08 }),
      dark: new MeshStandardMaterial({ color: p.mortar, roughness: 0.95 }),
      window: new MeshStandardMaterial({
        color: p.window,
        emissive: p.window,
        emissiveIntensity: p.windowGlow,
        roughness: 0.4,
      }),
      palette: p,
    }
  }, [variant])
}

/* ---------------- geometrias compartilhadas ---------------- */

const MERLON_GEO = new BoxGeometry(0.46, 0.52, 0.3)
const MERLON_SMALL_GEO = new BoxGeometry(0.34, 0.38, 0.24)
const SLIT_GEO = new BoxGeometry(0.16, 0.62, 0.12)
const FINIAL_GEO = new SphereGeometry(0.06, 8, 6)

/* ---------------- peças ---------------- */

/** anel de ameias (merlões) no topo de um raio */
function MerlonRing({
  radius,
  count,
  y,
  small = false,
  mat,
}: {
  radius: number
  count: number
  y: number
  small?: boolean
  mat: MeshStandardMaterial
}) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2
        return { x: Math.cos(a) * radius, z: Math.sin(a) * radius, r: -a }
      }),
    [radius, count],
  )
  return (
    <group position={[0, y, 0]}>
      {items.map((it, i) => (
        <mesh
          key={i}
          geometry={small ? MERLON_SMALL_GEO : MERLON_GEO}
          material={mat}
          position={[it.x, 0, it.z]}
          rotation={[0, it.r, 0]}
        />
      ))}
    </group>
  )
}

/** fenda de janela emissiva voltada para o ângulo `a` */
function Slit({
  a,
  radius,
  y,
  mat,
  h = 1,
}: {
  a: number
  radius: number
  y: number
  mat: MeshStandardMaterial
  h?: number
}) {
  return (
    <mesh
      geometry={SLIT_GEO}
      material={mat}
      position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
      rotation={[0, Math.PI / 2 - a, 0]}
      scale={[1, h, 1]}
    />
  )
}

/** bandeira ondulando: deformação senoidal dos vértices do plano */
function Flag({
  color,
  position,
  rotationY = 0,
  poleH = 1.6,
}: {
  color: string
  position: [number, number, number]
  rotationY?: number
  poleH?: number
}) {
  const geo = useMemo(() => new PlaneGeometry(1.05, 0.6, 7, 3), [])
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo])
  const cloth = useMemo(
    () => new MeshStandardMaterial({ color, roughness: 0.85, side: DoubleSide }),
    [color],
  )
  const ref = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const attr = mesh.geometry.attributes.position
    const t = clock.elapsedTime * 5.2
    for (let i = 0; i < attr.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      const reach = (x + 0.525) / 1.05 // 0 no mastro → 1 na ponta
      attr.setZ(i, Math.sin(x * 5 + t + y * 2.4) * 0.085 * reach)
    }
    attr.needsUpdate = true
  })

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={FINIAL_GEO} position={[0, poleH, 0]}>
        <meshStandardMaterial color="#e9c767" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, poleH / 2, 0]} scale={[1, poleH / 1.6, 1]}>
        <cylinderGeometry args={[0.026, 0.038, 1.6, 6]} />
        <meshStandardMaterial color="#3c414d" roughness={0.55} metalness={0.4} />
      </mesh>
      <mesh ref={ref} geometry={geo} material={cloth} position={[0.535, poleH - 0.32, 0]} />
    </group>
  )
}

/** torre de menagem: cilindro ameado + anel de ameias + torre interna */
function MainKeep({ mats }: { mats: CastleMaterials }) {
  const windowAngles = useMemo(() => [0.35, 1.4, 2.45, 3.5, 4.55, 5.6], [])
  return (
    <group>
      <mesh position={[0, 3.6, 0]} castShadow receiveShadow material={mats.wall}>
        <cylinderGeometry args={[2.55, 2.95, 7.2, 14]} />
      </mesh>
      {/* cornija + parapeito */}
      <mesh position={[0, 7.32, 0]} castShadow material={mats.trim}>
        <cylinderGeometry args={[2.82, 2.62, 0.5, 14]} />
      </mesh>
      <mesh position={[0, 7.78, 0]} material={mats.wall}>
        <cylinderGeometry args={[2.85, 2.85, 0.55, 14]} />
      </mesh>
      <MerlonRing radius={2.62} count={12} y={8.3} mat={mats.wall} />
      {/* torre interna com telhado e bandeira */}
      <mesh position={[0, 8.85, 0]} castShadow material={mats.wall}>
        <cylinderGeometry args={[1.15, 1.38, 2.1, 12]} />
      </mesh>
      <mesh position={[0, 10.75, 0]} castShadow material={mats.roof}>
        <coneGeometry args={[1.58, 1.95, 12]} />
      </mesh>
      <Flag color={mats.palette.flag} position={[0, 11.68, 0]} rotationY={0.5} poleH={1.5} />
      {/* janelas em fenda, dois níveis */}
      {windowAngles.map((a, i) => (
        <Slit key={`w${i}`} a={a} radius={2.78} y={3.1} mat={mats.window} />
      ))}
      {windowAngles.map((a, i) => (
        <Slit key={`w2${i}`} a={a + 0.5} radius={2.66} y={5.5} mat={mats.window} h={0.85} />
      ))}
    </group>
  )
}

/** torre de canto com telhado cônico de ardósia */
function CornerTower({
  position,
  mats,
  withFlag,
}: {
  position: [number, number, number]
  mats: CastleMaterials
  withFlag?: boolean
}) {
  return (
    <group position={position}>
      <mesh position={[0, 2.7, 0]} castShadow receiveShadow material={mats.wall}>
        <cylinderGeometry args={[1.05, 1.3, 5.4, 10]} />
      </mesh>
      <mesh position={[0, 5.58, 0]} material={mats.trim}>
        <cylinderGeometry args={[1.34, 1.2, 0.36, 10]} />
      </mesh>
      <mesh position={[0, 6.86, 0]} castShadow material={mats.roof}>
        <coneGeometry args={[1.66, 2.2, 10]} />
      </mesh>
      <Slit a={0.9} radius={1.18} y={3.4} mat={mats.window} />
      {withFlag && (
        <Flag color={mats.palette.flag} position={[0, 7.94, 0]} rotationY={2.2} poleH={1.3} />
      )}
    </group>
  )
}

/** muralha ameada entre as torres de canto */
function WallSegment({
  position,
  length,
  horizontal,
  mats,
}: {
  position: [number, number, number]
  length: number
  horizontal: boolean
  mats: CastleMaterials
}) {
  const merlons = useMemo(() => {
    const n = Math.max(2, Math.round(length / 1.35))
    return Array.from({ length: n }, (_, i) => -length / 2 + ((i + 0.5) * length) / n)
  }, [length])
  return (
    <group position={position} rotation={[0, horizontal ? 0 : Math.PI / 2, 0]}>
      <mesh position={[0, 1.55, 0]} castShadow receiveShadow material={mats.wall}>
        <boxGeometry args={[length, 3.1, 0.7]} />
      </mesh>
      {merlons.map((x, i) => (
        <mesh key={i} geometry={MERLON_SMALL_GEO} material={mats.wall} position={[x, 3.29, 0]} />
      ))}
    </group>
  )
}

/** portão em arco: torres gêmeas + meio-toro + grade + ponte levadiça */
function Gatehouse({ mats }: { mats: CastleMaterials }) {
  return (
    <group position={[0, 0, 3.9]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.42, 0, 0]}>
          <mesh position={[0, 1.8, 0]} castShadow material={mats.wall}>
            <cylinderGeometry args={[0.62, 0.76, 3.6, 9]} />
          </mesh>
          <mesh position={[0, 4.28, 0]} castShadow material={mats.roof}>
            <coneGeometry args={[0.95, 1.25, 9]} />
          </mesh>
        </group>
      ))}
      {/* arco (meio-toro) + verga */}
      <mesh position={[0, 2.05, 0]} material={mats.trim}>
        <torusGeometry args={[1.06, 0.3, 8, 14, Math.PI]} />
      </mesh>
      <mesh position={[0, 3.42, 0]} castShadow material={mats.wall}>
        <boxGeometry args={[3.5, 0.5, 0.85]} />
      </mesh>
      {/* portão de ferro + fendas âmbar */}
      <mesh position={[0, 1.0, 0]} material={mats.dark}>
        <boxGeometry args={[1.7, 2.0, 0.16]} />
      </mesh>
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} geometry={SLIT_GEO} material={mats.window} position={[x, 1.0, 0.1]} scale={[0.7, 0.55, 1]} />
      ))}
      {/* ponte levadiça de madeira */}
      <mesh position={[0, 0.1, 1.05]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[1.9, 0.12, 2.0]} />
        <meshStandardMaterial color="#5d4630" roughness={0.92} />
      </mesh>
    </group>
  )
}

/**
 * Castelo procedural completo, sempre de frente para o centro do vale.
 * Variantes: `granite` (cinza-azulado), `sandstone` (arenito) e
 * `obsidian` (castelo do chefe, janelas em brasa).
 */
export function Castle({
  position,
  variant = 'granite',
  scale = 1,
}: {
  position: [number, number, number]
  variant?: CastleVariant
  scale?: number
}) {
  const mats = useCastleMaterials(variant)
  const rotY = Math.atan2(-position[0], -position[2])

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      {/* pátio de terra batida */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[5.35, 5.6, 0.16, 22]} />
        <meshStandardMaterial color="#7d6a4c" roughness={1} />
      </mesh>

      <MainKeep mats={mats} />
      {(
        [
          [3.9, 3.9],
          [-3.9, 3.9],
          [3.9, -3.9],
          [-3.9, -3.9],
        ] as const
      ).map(([x, z], i) => (
        <CornerTower key={i} position={[x, 0, z]} mats={mats} withFlag={i === 1} />
      ))}

      {/* muralhas leste/oeste completas + norte completa + sul com portão */}
      <WallSegment position={[0, 0, -3.9]} length={6.6} horizontal mats={mats} />
      <WallSegment position={[3.9, 0, 0]} length={6.6} horizontal={false} mats={mats} />
      <WallSegment position={[-3.9, 0, 0]} length={6.6} horizontal={false} mats={mats} />
      <WallSegment position={[2.95, 0, 3.9]} length={1.9} horizontal mats={mats} />
      <WallSegment position={[-2.95, 0, 3.9]} length={1.9} horizontal mats={mats} />

      <Gatehouse mats={mats} />
    </group>
  )
}

/**
 * Torre de vigia: cilindro alto, balcão com corrimão, telhado cônico e
 * facho âmbar (emissivo + feixe aditivo — sem PointLight, orçamento de luz).
 */
export function WatchTower({
  position,
  variant = 'granite',
  withFlag = false,
}: {
  position: [number, number, number]
  variant?: CastleVariant
  withFlag?: boolean
}) {
  const mats = useCastleMaterials(variant)
  const rotY = Math.atan2(-position[0], -position[2])
  const posts = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return [Math.cos(a) * 1.5, Math.sin(a) * 1.5] as const
      }),
    [],
  )

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[1.9, 2.1, 0.18, 14]} />
        <meshStandardMaterial color="#7d6a4c" roughness={1} />
      </mesh>
      <mesh position={[0, 3.7, 0]} castShadow receiveShadow material={mats.wall}>
        <cylinderGeometry args={[1.15, 1.5, 7.4, 12]} />
      </mesh>
      {/* porta de madeira */}
      <mesh position={[0, 0.68, 1.42]}>
        <boxGeometry args={[0.72, 1.35, 0.14]} />
        <meshStandardMaterial color="#4c3a26" roughness={0.95} />
      </mesh>
      <Slit a={2.4} radius={1.24} y={3.2} mat={mats.window} />
      <Slit a={-2.4} radius={1.24} y={5.4} mat={mats.window} />
      {/* balcão + corrimão */}
      <mesh position={[0, 7.6, 0]} castShadow material={mats.trim}>
        <cylinderGeometry args={[1.62, 1.46, 0.42, 12]} />
      </mesh>
      <mesh position={[0, 8.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.dark}>
        <torusGeometry args={[1.55, 0.055, 6, 18]} />
      </mesh>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 8.16, z]} material={mats.dark}>
          <cylinderGeometry args={[0.045, 0.045, 0.72, 5]} />
        </mesh>
      ))}
      {/* telhado cônico sustentado pelos mastros */}
      <mesh position={[0, 9.35, 0]} castShadow material={mats.roof}>
        <coneGeometry args={[2.0, 2.7, 12]} />
      </mesh>
      {/* facho */}
      <mesh position={[0, 8.21, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 6]} />
        <meshStandardMaterial color="#3c414d" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 8.78, 0]} scale={[1, 1.4, 1]}>
        <octahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial
          color="#ffd27a"
          emissive="#ff9a2e"
          emissiveIntensity={2.6}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 8.82, 0]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshBasicMaterial color="#ff9a2e" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      {withFlag && (
        <Flag color={mats.palette.flag} position={[0, 10.78, 0]} rotationY={1.2} poleH={1.4} />
      )}
    </group>
  )
}

/** estandarte heráldico de fase: mastro, travessa e pano ondulante */
export function Banner({
  position,
  color,
  rotationY = 0,
}: {
  position: [number, number, number]
  color: string
  rotationY?: number
}) {
  const geo = useMemo(() => new PlaneGeometry(0.8, 1.5, 6, 5), [])
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array), [geo])
  const cloth = useMemo(
    () => new MeshStandardMaterial({ color, roughness: 0.8, side: DoubleSide }),
    [color],
  )
  const ref = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const attr = mesh.geometry.attributes.position
    const t = clock.elapsedTime * 3.6
    for (let i = 0; i < attr.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      const hang = (0.75 - y) / 1.5 // 0 no topo (presa) → 1 na barra
      attr.setZ(i, (Math.sin(x * 4.2 + t) * 0.08 + Math.sin(y * 2.4 + t * 0.7) * 0.04) * hang)
    }
    attr.needsUpdate = true
  })

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.17, 0.23, 0.14, 8]} />
        <meshStandardMaterial color="#6a7482" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 3.2, 6]} />
        <meshStandardMaterial color="#4a4f5c" roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0, 3.0, 0]}>
        <boxGeometry args={[0.92, 0.06, 0.06]} />
        <meshStandardMaterial color="#3c414d" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh geometry={FINIAL_GEO} position={[0, 3.24, 0]}>
        <meshStandardMaterial color="#e9c767" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={ref} geometry={geo} material={cloth} position={[0, 2.18, 0]} />
    </group>
  )
}
