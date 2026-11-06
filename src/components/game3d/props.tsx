'use client'

// CAPYBER Trilha 3D — mundo: ilha com grama texturizada (caminho de terra e
// rio pintados em canvas), água, castelos e torres de vigia, montanhas na
// linha do horizonte, ponte de pedra, tochas com fogo tremulante, ruínas,
// cercas, decoração SIMÉTRICA (cada item de scene.ts é renderizado também
// espelhado em -x), moedas colecionáveis e nuvens.

import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Group, SRGBColorSpace } from 'three'
import type { PointLight } from 'three'
import {
  BRIDGE_SPOT,
  CASTLE_SPOTS,
  COIN_SPOTS,
  CRYSTAL_SPOTS,
  FENCE_RUNS,
  ISLAND_VISUAL_RADIUS,
  LAMP_SPOTS,
  PATH_CURVE,
  PLAYER_POS,
  ROCK_SPOTS,
  RIVER_CURVE,
  RUIN_SPOTS,
  TORCH_SPOTS,
  TREE_SPOTS,
  WATCHTOWER_SPOTS,
  type Point,
} from '@/components/game3d/scene'
import { Castle, WatchTower } from '@/components/game3d/castle'
import { gameStore } from '@/lib/game-store'
import { sfx } from '@/lib/sfx'

/** helper: renderiza um item e seu espelho no eixo X */
function Mirrored<T extends { x: number }>({
  items,
  render,
}: {
  items: T[]
  render: (item: T, i: number) => React.ReactNode
}) {
  return (
    <>
      {items.map((item, i) => (
        <group key={`a${i}`}>{render(item, i)}</group>
      ))}
      {items.map((item, i) => (
        <group key={`b${i}`}>{render(mirrorX(item), i)}</group>
      ))}
    </>
  )
}

function mirrorX<T extends { x: number }>(item: T): T {
  return { ...item, x: -item.x }
}

/** PRNG determinístico para texturas/ornamentos (mesma ilha sempre) */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------------- textura do chão (grama + caminho + rio) ---------------- */

let groundTex: CanvasTexture | null = null

/** Mapa top-down da ilha pintado em canvas: grama orgânica, falhas douradas
 * de fim de tarde, caminho de terra com pedras e um rio azul. Zero assets. */
function getGroundTexture(): CanvasTexture {
  if (groundTex) return groundTex

  const S = 1024
  const R = ISLAND_VISUAL_RADIUS
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d indisponível')
  const px = (x: number) => (0.5 + x / (2 * R)) * S
  const pz = (z: number) => (0.5 + z / (2 * R)) * S
  const rnd = mulberry32(20250917)

  // base de grama
  ctx.fillStyle = '#7cab60'
  ctx.fillRect(0, 0, S, S)

  const ellipse = (x: number, y: number, rx: number, ry: number, rot: number) => {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
    ctx.fill()
  }

  // manchas orgânicas de grama
  const greens = ['#6d9c53', '#88b56a', '#93c074', '#61924b', '#79a95d']
  for (let i = 0; i < 260; i++) {
    ctx.globalAlpha = 0.14 + rnd() * 0.16
    ctx.fillStyle = greens[Math.floor(rnd() * greens.length)]
    ellipse(rnd() * S, rnd() * S, 14 + rnd() * 70, 10 + rnd() * 44, rnd() * Math.PI)
  }
  // falhas douradas (luz de fim de tarde)
  for (let i = 0; i < 120; i++) {
    ctx.globalAlpha = 0.06 + rnd() * 0.1
    ctx.fillStyle = '#c2b464'
    ellipse(rnd() * S, rnd() * S, 20 + rnd() * 90, 14 + rnd() * 50, rnd() * Math.PI)
  }
  ctx.globalAlpha = 1

  const trace = (pts: Point[], width: number, color: string, alpha = 1) => {
    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    pts.forEach((p, i) => {
      const X = px(p.x)
      const Y = pz(p.z)
      if (i === 0) ctx.moveTo(X, Y)
      else ctx.lineTo(X, Y)
    })
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // caminho de terra: borda escura → miolo claro
  trace(PATH_CURVE, 68, '#8a744d', 0.75)
  trace(PATH_CURVE, 50, '#b39a6b', 0.95)
  trace(PATH_CURVE, 26, '#c4ac7e', 0.9)

  // rio: margens escuras → água → brilho central
  trace(RIVER_CURVE, 64, '#5c8a4a', 0.55)
  trace(RIVER_CURVE, 50, '#5f9ec4', 0.95)
  trace(RIVER_CURVE, 30, '#79b7e8', 0.95)
  trace(RIVER_CURVE, 10, '#a5d5ef', 0.8)

  // pedras do calçamento pintadas (complementam as pedras 3D)
  for (let i = 0; i < PATH_CURVE.length; i++) {
    const p = PATH_CURVE[i]
    for (let j = 0; j < 3; j++) {
      ctx.globalAlpha = 0.5 + rnd() * 0.3
      ctx.fillStyle = rnd() > 0.5 ? '#d8cba6' : '#cbc0a3'
      ellipse(
        px(p.x) + (rnd() - 0.5) * 34,
        pz(p.z) + (rnd() - 0.5) * 34,
        5 + rnd() * 8,
        4 + rnd() * 6,
        rnd() * Math.PI,
      )
    }
  }
  ctx.globalAlpha = 1

  // ruído fino
  for (let i = 0; i < 2800; i++) {
    ctx.globalAlpha = 0.05 + rnd() * 0.06
    ctx.fillStyle = rnd() > 0.5 ? '#2f4a26' : '#e8e0b8'
    ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2.4, 1 + rnd() * 2.4)
  }
  ctx.globalAlpha = 1

  // vinheta radial (escurece a borda da ilha)
  const grad = ctx.createRadialGradient(S / 2, S / 2, S * 0.33, S / 2, S / 2, S * 0.62)
  grad.addColorStop(0, 'rgba(30,44,24,0)')
  grad.addColorStop(1, 'rgba(30,44,24,0.26)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, S, S)

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  groundTex = tex
  return tex
}

/* ---------------- ilha e água ---------------- */

function Island() {
  const ground = useMemo(() => getGroundTexture(), [])
  const R = ISLAND_VISUAL_RADIUS
  return (
    <group>
      {/* platô de grama (topo exatamente em y=0) */}
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[R, R + 1.2, 1.7, 72]} />
        <meshStandardMaterial color="#6d8f55" roughness={0.98} />
      </mesh>
      {/* topo texturizado (grama + caminho + rio) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[R, 72]} />
        <meshStandardMaterial map={ground} roughness={0.95} />
      </mesh>
      {/* faixa de terra do penhasco */}
      <mesh position={[0, -2.35, 0]}>
        <cylinderGeometry args={[R + 1.2, R - 1, 1.9, 72]} />
        <meshStandardMaterial color="#a97e52" roughness={1} />
      </mesh>
      {/* base rochosa afilada */}
      <mesh position={[0, -5.4, 0]}>
        <cylinderGeometry args={[R - 1, 14, 5.2, 56]} />
        <meshStandardMaterial color="#7d6248" roughness={1} />
      </mesh>
    </group>
  )
}

function Water() {
  const foam = useRef<Group>(null)
  useFrame((_, dt) => {
    if (foam.current) foam.current.rotation.y += dt * 0.02
  })
  const R = ISLAND_VISUAL_RADIUS + 1.2
  return (
    <group position={[0, -2.6, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[115, 72]} />
        <meshStandardMaterial color="#5f9ec4" roughness={0.3} metalness={0.15} />
      </mesh>
      <group ref={foam}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}>
          <ringGeometry args={[R, R + 2.2, 72]} />
          <meshBasicMaterial color="#dff0f8" transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
          <ringGeometry args={[R + 3.2, R + 4.4, 72]} />
          <meshBasicMaterial color="#cfe8ff" transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  )
}

/* ---------------- montanhas no horizonte ---------------- */

function Mountains() {
  const peaks = useMemo(() => {
    const rnd = mulberry32(777)
    const arr: { x: number; z: number; h: number; r: number; c: string }[] = []
    // colinas próximas
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + rnd() * 0.24
      const rad = 40 + rnd() * 7
      arr.push({
        x: Math.cos(a) * rad,
        z: Math.sin(a) * rad,
        h: 9 + rnd() * 7,
        r: 12 + rnd() * 8,
        c: i % 2 === 0 ? '#4c5d72' : '#54667d',
      })
    }
    // cordilheira distante
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.14 + rnd() * 0.3
      const rad = 60 + rnd() * 8
      arr.push({
        x: Math.cos(a) * rad,
        z: Math.sin(a) * rad,
        h: 20 + rnd() * 16,
        r: 16 + rnd() * 10,
        c: i % 2 === 0 ? '#3b4a63' : '#34425c',
      })
    }
    return arr
  }, [])
  return (
    <group>
      {peaks.map((m, i) => (
        <mesh key={i} position={[m.x, m.h / 2 - 2.5, m.z]}>
          <coneGeometry args={[m.r, m.h, 7]} />
          <meshStandardMaterial color={m.c} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- rio 3D + ponte de pedra ---------------- */

function River3D() {
  const segments = useMemo(() => {
    const segs: { x: number; z: number; len: number; rotY: number }[] = []
    for (let i = 0; i < RIVER_CURVE.length - 1; i++) {
      const p = RIVER_CURVE[i]
      const q = RIVER_CURVE[i + 1]
      const dx = q.x - p.x
      const dz = q.z - p.z
      segs.push({
        x: (p.x + q.x) / 2,
        z: (p.z + q.z) / 2,
        len: Math.hypot(dx, dz) + 1.2,
        rotY: Math.atan2(dx, dz),
      })
    }
    return segs
  }, [])
  return (
    <group>
      {segments.map((s, i) => (
        <mesh key={i} position={[s.x, 0.035, s.z]} rotation={[0, s.rotY, 0]}>
          <boxGeometry args={[2.3, 0.04, s.len]} />
          <meshStandardMaterial
            color="#6fb7d9"
            transparent
            opacity={0.72}
            roughness={0.15}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}

function StoneBridge() {
  const steps = [-2, -1, 0, 1, 2]
  return (
    <group position={[BRIDGE_SPOT.x, 0, BRIDGE_SPOT.z]} rotation={[0, BRIDGE_SPOT.rotY, 0]}>
      {/* tabuede em arco */}
      {steps.map((i) => (
        <mesh key={i} position={[0, 0.16 + (2 - Math.abs(i)) * 0.13, i * 0.92]} receiveShadow castShadow>
          <boxGeometry args={[2.4, 0.14, 0.98]} />
          <meshStandardMaterial color="#9aa2ad" roughness={0.85} />
        </mesh>
      ))}
      {/* guardas-corpo */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 1.18, 0.62, 0]} castShadow>
            <boxGeometry args={[0.1, 0.14, 4.7]} />
            <meshStandardMaterial color="#8a929d" roughness={0.85} />
          </mesh>
          {steps.map((i) => (
            <mesh key={i} position={[side * 1.18, 0.42, i * 0.92]} castShadow>
              <boxGeometry args={[0.14, 0.5, 0.14]} />
              <meshStandardMaterial color="#7f8792" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      {/* alicerces */}
      {[-2.4, 2.4].map((z) => (
        <mesh key={z} position={[0, 0.14, z]} castShadow>
          <boxGeometry args={[2.9, 0.5, 0.7]} />
          <meshStandardMaterial color="#8a929d" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- tochas com fogo tremulante ---------------- */

function Torch({ lit = false }: { lit?: boolean }) {
  const flame = useRef<Group>(null)
  const light = useRef<PointLight>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const f = 0.86 + Math.sin(t * 11.3) * 0.09 + Math.sin(t * 23.7) * 0.06
    if (light.current) light.current.intensity = 4.6 * f
    if (flame.current) {
      flame.current.scale.setScalar(0.88 + f * 0.2)
      flame.current.rotation.y = t * 2.4
    }
  })

  return (
    <group>
      {/* poste de madeira */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.085, 1.7, 6]} />
        <meshStandardMaterial color="#5d4630" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.24, 6]} />
        <meshStandardMaterial color="#4a4f5c" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* taça de ferro */}
      <mesh position={[0, 1.78, 0]}>
        <cylinderGeometry args={[0.17, 0.07, 0.24, 8]} />
        <meshStandardMaterial color="#33373f" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* chama */}
      <group ref={flame} position={[0, 2.02, 0]}>
        <mesh scale={[1, 1.45, 1]}>
          <icosahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#ffd27a" emissive="#ff9a2e" emissiveIntensity={2.8} roughness={0.35} />
        </mesh>
        <mesh scale={[1.6, 2.0, 1.6]}>
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshBasicMaterial color="#ff9a2e" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      </group>
      {lit && <pointLight ref={light} color="#ff9a3e" intensity={4.6} distance={7} decay={2} position={[0, 2.1, 0]} />}
    </group>
  )
}

/* ---------------- ruínas, cercas e decoração ---------------- */

/** colunas quebradas de um templo antigo */
function Ruins({ s = 1 }: { s?: number }) {
  const columns = useMemo(
    () => [
      { x: -0.7, z: -0.4, h: 1.7, fallen: false },
      { x: 0.5, z: 0.3, h: 0.9, fallen: false },
      { x: -0.2, z: 0.8, h: 2.3, fallen: false },
    ],
    [],
  )
  return (
    <group scale={s}>
      {/* laje partida */}
      <mesh position={[0, 0.07, 0]} rotation={[0, 0.4, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.65, 0.14, 9]} />
        <meshStandardMaterial color="#a3adb8" roughness={0.95} />
      </mesh>
      {columns.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.66, 0.2, 0.66]} />
            <meshStandardMaterial color="#98a3af" roughness={0.95} />
          </mesh>
          <mesh position={[0, c.h / 2 + 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.21, 0.26, c.h, 9]} />
            <meshStandardMaterial color="#b3bec9" roughness={0.9} />
          </mesh>
          {i === 2 && (
            <mesh position={[0, c.h + 0.28, 0]} castShadow>
              <boxGeometry args={[0.62, 0.24, 0.62]} />
              <meshStandardMaterial color="#9aa5b1" roughness={0.9} />
            </mesh>
          )}
        </group>
      ))}
      {/* tambor caído + entulho */}
      <mesh position={[1.15, 0.2, -0.75]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.21, 0.21, 1.15, 9]} />
        <meshStandardMaterial color="#b3bec9" roughness={0.9} />
      </mesh>
      {[
        [0.9, 0.35],
        [-1.2, 0.9],
        [0.3, -1.1],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.14, z]} rotation={[i, i * 2, 0]}>
          <dodecahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color="#a3adb8" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/** cerca de madeira entre dois pontos */
function FenceRun({ from, to }: { from: Point; to: Point }) {
  const posts = useMemo(() => {
    const len = Math.hypot(to.x - from.x, to.z - from.z)
    const n = Math.max(2, Math.round(len / 0.95))
    return Array.from({ length: n + 1 }, (_, i) => ({
      x: from.x + ((to.x - from.x) * i) / n,
      z: from.z + ((to.z - from.z) * i) / n,
      tilt: (i % 2 === 0 ? 1 : -1) * 0.04,
    }))
  }, [from, to])
  const len = Math.hypot(to.x - from.x, to.z - from.z)
  const rotY = Math.atan2(to.x - from.x, to.z - from.z)
  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={[p.x, 0.42, p.z]} rotation={[p.tilt, 0, p.tilt]} castShadow>
          <boxGeometry args={[0.1, 0.85, 0.1]} />
          <meshStandardMaterial color="#6b4e2f" roughness={0.95} />
        </mesh>
      ))}
      {[0.34, 0.62].map((y) => (
        <mesh key={y} position={[(from.x + to.x) / 2, y, (from.z + to.z) / 2]} rotation={[0, rotY, 0]} castShadow>
          <boxGeometry args={[0.055, 0.07, len]} />
          <meshStandardMaterial color="#7a5a36" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- decoração original (polida) ---------------- */

function Tree({ s = 1, rot = 0 }: { s?: number; rot?: number }) {
  return (
    <group scale={s} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.27, 1.1, 8]} />
        <meshStandardMaterial color="#6b4a30" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[0.98, 1.65, 8]} />
        <meshStandardMaterial color="#2e7d4f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.55, 0]} castShadow>
        <coneGeometry args={[0.72, 1.25, 8]} />
        <meshStandardMaterial color="#3a9a60" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.28, 0]} castShadow>
        <coneGeometry args={[0.46, 0.88, 8]} />
        <meshStandardMaterial color="#46ad6e" roughness={0.85} />
      </mesh>
    </group>
  )
}

function Crystal({ s = 1 }: { s?: number }) {
  const ref = useRef<Group>(null)
  useFrame((state, dt) => {
    const g = ref.current
    if (!g) return
    g.rotation.y += dt * 0.6
    g.position.y = 0.9 + Math.sin(state.clock.elapsedTime * 1.3 + s * 5) * 0.12
  })
  return (
    <group scale={s}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.34, 0.5, 0.36, 7]} />
        <meshStandardMaterial color="#9fb4cc" roughness={0.8} />
      </mesh>
      <group ref={ref}>
        <mesh castShadow>
          <octahedronGeometry args={[0.52, 0]} />
          <meshStandardMaterial
            color="#bfe8ff"
            emissive="#2fa3d8"
            emissiveIntensity={0.7}
            roughness={0.12}
            metalness={0.25}
          />
        </mesh>
      </group>
    </group>
  )
}

/** lanterna de ferro forjado com vidro âmbar */
function Lamp() {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.09, 1.5, 8]} />
        <meshStandardMaterial color="#2f3540" roughness={0.55} metalness={0.55} />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <cylinderGeometry args={[0.2, 0.16, 0.42, 6]} />
        <meshStandardMaterial color="#ffdf9e" emissive="#ffb24d" emissiveIntensity={1.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.26, 0.2, 6]} />
        <meshStandardMaterial color="#2f3540" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.24, 0.3, 0.12, 10]} />
        <meshStandardMaterial color="#3a414d" roughness={0.8} metalness={0.3} />
      </mesh>
    </group>
  )
}

function Rock({ s = 1 }: { s?: number }) {
  return (
    <group position={[0, 0.16 * s, 0]} scale={s}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color="#a8b2bd" roughness={0.98} />
      </mesh>
      <mesh position={[0.22 * s, -0.06, 0.14]} scale={0.55}>
        <dodecahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color="#98a3af" roughness={0.98} />
      </mesh>
    </group>
  )
}

/** pedras do calçamento sobre o caminho pintado */
function PathStones() {
  const stones = useMemo(
    () =>
      PATH_CURVE.map((p, i) => ({
        x: p.x + Math.sin(i * 1.7) * 0.22,
        z: p.z,
        r: 0.52 + ((i * 7) % 3) * 0.09,
        rot: i * 1.3,
        tone: i % 3,
      })),
    [],
  )
  return (
    <group position={[0, 0.02, 0]}>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]} receiveShadow>
          <cylinderGeometry args={[s.r, s.r * 1.08, 0.12, 7]} />
          <meshStandardMaterial
            color={s.tone === 0 ? '#d6c9a4' : s.tone === 1 ? '#cbc0a3' : '#c2b89a'}
            roughness={0.88}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- marcos e monumento ---------------- */

/** marcos de entrada: dois pilares ladeando o início do caminho */
function StartPylons({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 3.4, 0, 0]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <coneGeometry args={[0.5, 1.8, 8]} />
            <meshStandardMaterial color="#8a99ad" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.95, 0]}>
            <octahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color="#f5920b" emissive="#f5920b" emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** monumento central: cristal suspenso alto — passa por baixo sem colisão */
function Monument() {
  const halo = useRef<Group>(null)
  useFrame((state, dt) => {
    const g = halo.current
    if (!g) return
    g.rotation.y += dt * 0.5
    g.position.y = 5.2 + Math.sin(state.clock.elapsedTime * 0.9) * 0.25
  })
  return (
    <group>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 2.3, 40]} />
        <meshStandardMaterial color="#c8b98d" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.55, 0.8, 0.6, 8]} />
        <meshStandardMaterial color="#9fb4cc" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.9, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 4.6, 8, 1, true]} />
        <meshBasicMaterial color="#bfe8ff" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <group ref={halo}>
        <mesh>
          <octahedronGeometry args={[1.05, 0]} />
          <meshStandardMaterial
            color="#d9f2ff"
            emissive="#2fa3d8"
            emissiveIntensity={0.75}
            roughness={0.1}
            metalness={0.3}
          />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 1.9, Math.sin(a * 2) * 0.3, Math.sin(a) * 1.9]}>
              <octahedronGeometry args={[0.26, 0]} />
              <meshStandardMaterial
                color="#bfe8ff"
                emissive="#f5b73d"
                emissiveIntensity={0.55}
                roughness={0.2}
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

/* ---------------- nuvens ---------------- */

function Cloud({ x, y, z, s }: { x: number; y: number; z: number; s: number }) {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    const g = ref.current
    if (!g) return
    g.position.x = x + Math.sin(state.clock.elapsedTime * 0.05 + z) * 1.4
    g.position.y = y + Math.sin(state.clock.elapsedTime * 0.22 + x) * 0.22
  })
  return (
    <group ref={ref} position={[x, y, z]} scale={s}>
      <mesh>
        <sphereGeometry args={[1.5, 14, 10]} />
        <meshStandardMaterial color="#fff6e6" transparent opacity={0.85} roughness={1} />
      </mesh>
      <mesh position={[1.5, -0.25, 0.2]}>
        <sphereGeometry args={[1.05, 12, 10]} />
        <meshStandardMaterial color="#fff6e6" transparent opacity={0.85} roughness={1} />
      </mesh>
      <mesh position={[-1.5, -0.3, -0.1]}>
        <sphereGeometry args={[0.95, 12, 10]} />
        <meshStandardMaterial color="#fdf1dc" transparent opacity={0.85} roughness={1} />
      </mesh>
    </group>
  )
}

/* ---------------- moedas ---------------- */

function Coins() {
  const [taken, setTaken] = useState<Set<number>>(new Set())
  const groupRefs = useRef<(Group | null)[]>([])

  useFrame((state, dt) => {
    const player = PLAYER_POS
    COIN_SPOTS.forEach((c, i) => {
      if (taken.has(i)) return
      const g = groupRefs.current[i]
      if (!g) return
      g.rotation.y += dt * 2.4
      g.position.y = 0.85 + Math.sin(state.clock.elapsedTime * 2.2 + i) * 0.12
      const d = Math.hypot(player.x - c.x, player.z - c.z)
      if (d < 1.15) {
        setTaken((prev) => {
          const next = new Set(prev)
          next.add(i)
          return next
        })
        gameStore.addCoins(2)
        sfx.play('coin')
      }
    })
  })

  return (
    <group>
      {COIN_SPOTS.map((c, i) => (
        <group key={i} ref={(el) => { groupRefs.current[i] = el }} position={[c.x, 0.85, c.z]}>
          {!taken.has(i) && (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.26, 0.26, 0.07, 20]} />
                <meshStandardMaterial
                  color="#ffcf4d"
                  emissive="#f5920b"
                  emissiveIntensity={0.55}
                  roughness={0.18}
                  metalness={0.85}
                />
              </mesh>
              <mesh position={[0, 0.045, 0]}>
                <torusGeometry args={[0.17, 0.035, 10, 20]} />
                <meshStandardMaterial color="#e07f0a" metalness={0.7} roughness={0.25} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

/* ---------------- mundo completo ---------------- */

export function World() {
  return (
    <group>
      <Island />
      <Water />
      <Mountains />
      <River3D />
      <StoneBridge />
      <PathStones />
      <Monument />

      <Mirrored items={TREE_SPOTS} render={(t, i) => <group position={[t.x, 0, t.z]}><Tree s={t.s} rot={i * 1.7} /></group>} />
      <Mirrored items={CRYSTAL_SPOTS} render={(c) => <group position={[c.x, 0, c.z]}><Crystal s={c.s} /></group>} />
      <Mirrored items={LAMP_SPOTS} render={(l) => <group position={[l.x, 0, l.z]}><Lamp /></group>} />
      <Mirrored items={ROCK_SPOTS} render={(r) => <group position={[r.x, 0, r.z]}><Rock s={r.s} /></group>} />
      <Mirrored items={RUIN_SPOTS} render={(r) => <group position={[r.x, 0, r.z]}><Ruins s={r.s} /></group>} />

      {/* castelos por zona de dificuldade + torres de vigia */}
      {CASTLE_SPOTS.map((c, i) => (
        <Castle key={i} position={[c.x, 0, c.z]} variant={c.variant} scale={c.scale} />
      ))}
      {WATCHTOWER_SPOTS.map((w, i) => (
        <WatchTower key={i} position={[w.x, 0, w.z]} variant={i % 2 === 0 ? 'granite' : 'sandstone'} withFlag={i < 2} />
      ))}

      {/* tochas (só as `lit` têm luz — orçamento de performance) */}
      {TORCH_SPOTS.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <Torch lit={t.lit} />
        </group>
      ))}

      {/* cercas de madeira */}
      {FENCE_RUNS.map((f, i) => (
        <FenceRun key={i} from={f.from} to={f.to} />
      ))}

      <Coins />

      {/* marco de entrada (sul) — o portão norte agora é o castelo do chefe */}
      <StartPylons z={21.4} />

      {/* nuvens em pares simétricos */}
      <Cloud x={-17} y={9.5} z={8} s={1.5} />
      <Cloud x={17} y={9.5} z={8} s={1.5} />
      <Cloud x={-14} y={11} z={-14} s={1.2} />
      <Cloud x={14} y={11} z={-14} s={1.2} />
      <Cloud x={0} y={12.5} z={0} s={1.7} />
    </group>
  )
}
