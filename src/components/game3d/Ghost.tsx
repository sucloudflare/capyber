'use client'

// CAPYBER Trilha 3D — o FANTASMA em 3D (o mesmo mascote do chat, agora como
// personagem jogável). Corpo de lathe com barra ondulada, olhos com brilho,
// aura esverdeada e contorno por casca invertida (inverted hull).

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Group, LatheGeometry, Vector2, Vector3 } from 'three'

const OUTLINE = '#16a34a'

/** perfil do corpo (raio, altura): cúpula arredondada afilando na base */
const BODY_PROFILE: [number, number][] = [
  [0.001, 1.06],
  [0.16, 1.02],
  [0.33, 0.92],
  [0.46, 0.74],
  [0.53, 0.5],
  [0.56, 0.2],
  [0.555, -0.18],
  [0.53, -0.5],
  [0.5, -0.62],
]

function GhostBody({ tint = '#ffffff', outline = true }: { tint?: string; outline?: boolean }) {
  const bodyGeo = useMemo(() => {
    // ordem de baixo para cima: garante normais para fora (senão as faces
    // frontais são culled e o fantasma vira só o contorno verde)
    const pts = [...BODY_PROFILE].reverse().map(([x, y]) => new Vector2(x, y))
    const geo = new LatheGeometry(pts, 40)
    geo.computeVertexNormals()
    return geo
  }, [])

  const scallops = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + Math.PI / 7
        return { pos: [Math.cos(a) * 0.42, -0.56, Math.sin(a) * 0.42] as const }
      }),
    [],
  )

  return (
    <group>
      {/* contorno: casca invertida verde */}
      {outline && (
        <mesh geometry={bodyGeo} scale={[1.055, 1.055, 1.055]}>
          <meshBasicMaterial color={OUTLINE} side={BackSide} transparent opacity={0.9} />
        </mesh>
      )}
      {/* corpo (opaco — o contorno verde não atravessa) */}
      <mesh geometry={bodyGeo} castShadow>
        <meshStandardMaterial color={tint} roughness={0.32} metalness={0.02} />
      </mesh>
      {/* barra ondulada (7 esferas na base) */}
      {scallops.map((s, i) => (
        <group key={i} position={s.pos as unknown as [number, number, number]}>
          {outline && (
            <mesh scale={1.16}>
              <sphereGeometry args={[0.13, 16, 12]} />
              <meshBasicMaterial color={OUTLINE} side={BackSide} />
            </mesh>
          )}
          <mesh>
            <sphereGeometry args={[0.13, 16, 12]} />
            <meshStandardMaterial color={tint} roughness={0.32} />
          </mesh>
        </group>
      ))}
      {/* aura suave */}
      <mesh position={[0, 0.15, 0]} scale={1.28}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshBasicMaterial color={OUTLINE} transparent opacity={0.05} depthWrite={false} />
      </mesh>
      {/* bracinhos */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.52, 0.02, 0.06]} castShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color={tint} roughness={0.32} />
        </mesh>
      ))}
      {/* olhos */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.185, 0.42, 0.42]}>
          <mesh scale={[1, 1.4, 0.55]}>
            <sphereGeometry args={[0.085, 16, 12]} />
            <meshStandardMaterial color="#0d2038" roughness={0.25} />
          </mesh>
          <mesh position={[side * 0.026, 0.05, 0.055]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
      {/* boquinha */}
      <mesh position={[0, 0.22, 0.51]} scale={[1.5, 0.9, 0.5]}>
        <sphereGeometry args={[0.05, 12, 10]} />
        <meshStandardMaterial color="#0d2038" roughness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * Fantasma que flutua: bob senoidal + leve respiração. `heading` e `moving`
 * vêm do dono (jogador em movimento ou NPC estático).
 */
export function GhostActor({
  tint,
  outline = true,
  bobSpeed = 2,
  bobAmp = 0.09,
  moving = false,
  headingRef,
  children,
}: {
  tint?: string
  outline?: boolean
  bobSpeed?: number
  bobAmp?: number
  moving?: boolean
  /** ref mutável com o ângulo de direção (yaw) — usado pelo jogador */
  headingRef?: { current: number }
  children?: React.ReactNode
}) {
  const inner = useRef<Group>(null)
  const t = useRef<number | null>(null)

  useFrame((_, dt) => {
    const g = inner.current
    if (!g) return
    if (t.current === null) t.current = Math.random() * 10
    t.current += dt * bobSpeed
    const targetY = Math.sin(t.current) * bobAmp + 0.62
    g.position.y += (targetY - g.position.y) * Math.min(1, dt * 8)
    const sq = 1 + Math.sin(t.current * 1.4) * 0.02
    g.scale.set(1 / sq, sq, 1)
    if (headingRef) {
      // gira suavemente para a direção do movimento
      let diff = headingRef.current - g.rotation.y
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      g.rotation.y += diff * Math.min(1, dt * 10)
    }
  })

  return (
    <group>
      <group ref={inner} position={[0, 0.62, 0]}>
        <GhostBody tint={tint} outline={outline} />
        {children}
      </group>
      {/* sombra suave no chão */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#274b73" transparent opacity={moving ? 0.16 : 0.12} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** pos tmp compartilhado para cálculos leves */
export const TMP_V = new Vector3()
