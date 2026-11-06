'use client'

// CAPYBER Trilha 3D — canvas principal: cenário RPG de hora dourada (céu em
// gradiente, névoa volumétrica, sol quente), jogador fantasma (WASD/setas +
// joystick de toque), câmera perseguidora, proximidade de santuários,
// estandartes por fase, NPCs fantasma e partículas do vale.

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { AdditiveBlending, BackSide, CanvasTexture, Group, MathUtils, SRGBColorSpace } from 'three'
import {
  INTERACT_RADIUS,
  ISLAND_RADIUS,
  NPC_GHOSTS,
  PLAYER_POS,
  PLAYER_START,
  SHRINE_SPOTS,
} from '@/components/game3d/scene'
import { Banner } from '@/components/game3d/castle'
import { GhostActor } from '@/components/game3d/Ghost'
import { LabelSprite } from '@/components/game3d/LabelSprite'
import { World } from '@/components/game3d/props'
import { Shrine } from '@/components/game3d/Shrine'
import { GAME_PHASES } from '@/lib/game-courses'
import type { ShrineState } from '@/lib/game-bus'
import { gameFlags, gameInput, requestOpenPhase } from '@/lib/game-bus'

/* ---------------- jogador ---------------- */

function PlayerRig({
  onProximity,
}: {
  onProximity: (id: string | null) => void
}) {
  const group = useRef<Group>(null)
  const vel = useRef({ x: 0, z: 0 })
  const heading = useRef(0)
  const near = useRef<string | null>(null)
  const camInit = useRef(false)

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const g = group.current
    if (!g) return
    const camera = state.camera

    // posiciona a câmera atrás do jogador na primeira rodada
    if (!camInit.current) {
      camInit.current = true
      camera.position.set(PLAYER_START.x, 8.6, PLAYER_START.z + 10.2)
      camera.lookAt(PLAYER_START.x, 1.2, PLAYER_START.z)
    }

    // ----- movimento com aceleração suave (pausa trava o input) -----
    const ix = gameFlags.paused ? 0 : gameInput.x
    const iz = gameFlags.paused ? 0 : gameInput.z
    const speed = 6.4
    const tx = ix * speed
    const tz = iz * speed
    const k = 1 - Math.exp(-dt * 9)
    vel.current.x += (tx - vel.current.x) * k
    vel.current.z += (tz - vel.current.z) * k

    let nx = PLAYER_POS.x + vel.current.x * dt
    let nz = PLAYER_POS.z + vel.current.z * dt

    // limite da ilha (círculo)
    const dist = Math.hypot(nx, nz)
    if (dist > ISLAND_RADIUS - 1.2) {
      const f = (ISLAND_RADIUS - 1.2) / dist
      nx *= f
      nz *= f
    }

    PLAYER_POS.x = nx
    PLAYER_POS.z = nz
    g.position.set(nx, 0, nz)

    // ----- orientação e inclinação -----
    const sp = Math.hypot(vel.current.x, vel.current.z)
    const isMoving = sp > 0.35
    if (isMoving) heading.current = Math.atan2(vel.current.x, vel.current.z)
    g.rotation.y = MathUtils.lerp(
      g.rotation.y,
      heading.current,
      1 - Math.exp(-dt * 10),
    )
    // inclinação de "avance" no eixo local
    g.rotation.x = MathUtils.lerp(g.rotation.x, isMoving ? 0.09 : 0, 1 - Math.exp(-dt * 8))

    // ----- proximidade de santuários -----
    let best: string | null = null
    let bestD = INTERACT_RADIUS
    for (const s of SHRINE_SPOTS) {
      const d = Math.hypot(nx - s.x, nz - s.z)
      if (d < bestD) {
        bestD = d
        best = s.id
      }
    }
    if (best !== near.current) {
      near.current = best
      onProximity(best)
    }

    // ----- interação (E / botão) -----
    if (gameInput.interact) {
      gameInput.interact = false
      if (best && !gameFlags.paused) requestOpenPhase(best)
    }

    // ----- câmera perseguidora -----
    const t = state.clock.elapsedTime
    const camX = nx * 0.94
    const camY = 8.6 + Math.sin(t * 0.4) * 0.15
    const camZ = nz * 0.94 + 10.2
    const ck = 1 - Math.exp(-dt * 3.4)
    camera.position.x += (camX - camera.position.x) * ck
    camera.position.y += (camY - camera.position.y) * ck
    camera.position.z += (camZ - camera.position.z) * ck
    camera.lookAt(nx * 0.985, 1.35, nz * 0.985 - 0.6)
  })

  return (
    <group ref={group} position={[PLAYER_START.x, 0, PLAYER_START.z]}>
      <GhostActor headingRef={heading} />
      <LabelSprite
        title="FANTASMA DEFENSOR"
        titleColor="#0d6b2e"
        border="#16a34a"
        y={2.15}
        height={0.78}
      />
    </group>
  )
}

/* ---------------- NPCs ---------------- */

function NpcGhost({
  x,
  z,
  tint,
  name,
  line,
  scale,
}: {
  x: number
  z: number
  tint: string
  name: string
  line: string
  scale: number
}) {
  const bubble = useRef<Group>(null)
  const shown = useRef(false)

  // balão de fala aparece quando o jogador se aproxima
  useFrame(() => {
    const b = bubble.current
    if (!b) return
    const near = Math.hypot(PLAYER_POS.x - x, PLAYER_POS.z - z) < 3.4
    if (near !== shown.current) {
      shown.current = near
      b.visible = near
    }
  })

  return (
    <group position={[x, 0, z]} scale={scale}>
      <GhostActor tint={tint} bobSpeed={1.4} bobAmp={0.12} />
      <LabelSprite
        title={name}
        titleColor="#123a6b"
        border="#8fb8e4"
        y={2.05}
        height={0.72}
      />
      <group ref={bubble} visible={false}>
        <LabelSprite
          title={line}
          titleColor="#274b73"
          border="#b9d4f0"
          y={2.95}
          height={0.62}
        />
      </group>
    </group>
  )
}

/* ---------------- céu de hora dourada ---------------- */

let skyTex: CanvasTexture | null = null
let glowTex: CanvasTexture | null = null

/** gradiente vertical (zênite azul → horizonte dourado) pintado em canvas.
 * Retorna null se canvas 2D indisponível — a cena segue sem céu pintado,
 * sem derrubar o painel. */
function getSkyTexture(): CanvasTexture | null {
  if (skyTex) return skyTex
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, '#5f8ecf') // zênite
    g.addColorStop(0.34, '#9dbde4')
    g.addColorStop(0.52, '#e8cf9f')
    g.addColorStop(0.62, '#ffd9a0') // faixa dourada do horizonte
    g.addColorStop(0.72, '#f2b877')
    g.addColorStop(1, '#c9925f') // abaixo do horizonte
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 16, 512)
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    skyTex = tex
    return tex
  } catch {
    return null
  }
}

/** brilho radial suave (sol, auras) — sprite aditivo. null-safe em WebView antigo */
function getGlowTexture(): CanvasTexture | null {
  if (glowTex) return glowTex
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,244,214,0.95)')
    g.addColorStop(0.35, 'rgba(255,214,140,0.45)')
    g.addColorStop(1, 'rgba(255,200,120,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    glowTex = tex
    return tex
  } catch {
    return null
  }
}

function SkyDome() {
  const tex = useMemo(() => getSkyTexture(), [])
  const glow = useMemo(() => getGlowTexture(), [])
  return (
    <group>
      {/* esfera invertida com o gradiente — longe do far da câmera (220) */}
      <mesh>
        <sphereGeometry args={[150, 24, 16]} />
        <meshBasicMaterial map={tex} side={BackSide} fog={false} depthWrite={false} />
      </mesh>
      {/* sol de fim de tarde */}
      <sprite position={[82, 40, 22]} scale={[34, 34, 1]}>
        <spriteMaterial
          map={glow}
          color="#fff2cc"
          transparent
          opacity={0.9}
          depthWrite={false}
          fog={false}
          blending={AdditiveBlending}
        />
      </sprite>
      <sprite position={[82, 40, 22]} scale={[11, 11, 1]}>
        <spriteMaterial
          map={glow}
          color="#ffffff"
          transparent
          opacity={0.95}
          depthWrite={false}
          fog={false}
          blending={AdditiveBlending}
        />
      </sprite>
    </group>
  )
}

/* ---------------- cena completa ---------------- */

export function GameCanvas({
  phaseStates,
  onProximity,
}: {
  phaseStates: Record<string, ShrineState>
  onProximity: (id: string | null) => void
}) {
  const proxRef = useRef(onProximity)
  useEffect(() => {
    proxRef.current = onProximity
  }, [onProximity])

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 46, near: 0.5, far: 220, position: [0, 7.4, 28] }}
      performance={{ min: 0.5 }}
      className="!absolute inset-0"
    >
      <color attach="background" args={['#f3d9ae']} />
      {/* névoa exponencial quente: dá profundidade de "god-ray" ao vale */}
      <fogExp2 attach="fog" args={['#efd6a7', 0.0102]} />

      <SkyDome />

      {/* luzes — hora dourada: sol âmbar + preenchimento frio */}
      <hemisphereLight args={['#ffd9a8', '#5e7d94', 0.75]} />
      <directionalLight
        position={[30, 24, 14]}
        intensity={1.7}
        color="#ffb35c"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-far={90}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
      />
      <ambientLight color="#7c9cc8" intensity={0.42} />

      <World />

      {SHRINE_SPOTS.map((s) => {
        const phase = GAME_PHASES.find((p) => p.id === s.id)
        const bannerColor = phase?.bannerColor ?? '#2569b8'
        return (
          <group key={s.id}>
            <Shrine
              phaseId={s.id}
              x={s.x}
              z={s.z}
              num={s.id === 'boss' ? '★' : s.id.replace('f', '')}
              short={phase?.short ?? ''}
              area={phase?.area ?? ''}
              state={phaseStates[s.id] ?? 'locked'}
              isBoss={s.id === 'boss'}
            />
            {/* estandartes heráldicos ladeando cada santuário */}
            <Banner position={[s.x - 2.85, 0, s.z + 0.5]} color={bannerColor} rotationY={Math.PI / 5} />
            <Banner position={[s.x + 2.85, 0, s.z + 0.5]} color={bannerColor} rotationY={-Math.PI / 5} />
          </group>
        )
      })}

      {NPC_GHOSTS.map((n) => (
        <NpcGhost key={n.id} x={n.x} z={n.z} tint={n.tint} name={n.name} line={n.line} scale={n.scale} />
      ))}

      <PlayerRig onProximity={(id) => proxRef.current(id)} />

      {/* partículas do vale: pólen frio, dourado e poeira baixa */}
      <Sparkles count={90} scale={[46, 8, 46]} position={[0, 4, 0]} size={5} speed={0.35} color="#9fdcff" />
      <Sparkles count={44} scale={[34, 5, 34]} position={[0, 2.4, 0]} size={7} speed={0.28} color="#ffe08a" />
      <Sparkles count={50} scale={[40, 6, 40]} position={[0, 3.2, 0]} size={6} speed={0.22} color="#ffd9a3" />
    </Canvas>
  )
}
