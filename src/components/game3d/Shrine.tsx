'use client'

// CAPYBER Trilha 3D — santuário de fase: pedestal de pedra + cristal flutuante
// colorido por estado (trancado / aberto / concluído) + placa HTML.

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import type { ShrineState } from '@/lib/game-bus'
import { requestOpenPhase } from '@/lib/game-bus'
import { LabelSprite } from '@/components/game3d/LabelSprite'

const STATE_COLOR: Record<ShrineState, string> = {
  locked: '#8496ab',
  open: '#f5920b',
  done: '#21a44a',
}

export function Shrine({
  phaseId,
  x,
  z,
  num,
  short,
  area,
  state,
  isBoss = false,
}: {
  phaseId: string
  x: number
  z: number
  num: string
  short: string
  area: string
  state: ShrineState
  isBoss?: boolean
}) {
  const crystal = useRef<Group>(null)
  const ring = useRef<Group>(null)
  const color = STATE_COLOR[state]

  useFrame((rs, dt) => {
    const c = crystal.current
    if (c) {
      c.rotation.y += dt * (state === 'open' ? 1.6 : 0.5)
      c.position.y = (isBoss ? 3.4 : 2.35) + Math.sin(rs.clock.elapsedTime * 1.6 + x) * 0.14
    }
    const r = ring.current
    if (r) {
      r.rotation.z += dt * 0.4
      const pulse = 1 + Math.sin(rs.clock.elapsedTime * 3) * 0.06
      r.scale.set(pulse, pulse, 1)
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* pedestal */}
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[1.25, 1.5, 0.44, 12]} />
        <meshStandardMaterial color="#9fb4cc" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.62, 0.85, 0.66, 10]} />
        <meshStandardMaterial color="#b7c6d8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.78, 0.6, 0.14, 10]} />
        <meshStandardMaterial color="#8a99ad" roughness={0.75} />
      </mesh>

      {/* anel de estado no chão */}
      <group ref={ring} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.9, 2.25, 40]} />
          <meshBasicMaterial color={color} transparent opacity={state === 'locked' ? 0.35 : 0.75} />
        </mesh>
      </group>

      {/* cristal de fase (clicável) */}
      <group
        ref={crystal}
        onClick={(e) => {
          e.stopPropagation()
          if (state !== 'locked') requestOpenPhase(phaseId)
        }}
        onPointerOver={() => (document.body.style.cursor = state !== 'locked' ? 'pointer' : 'default')}
        onPointerOut={() => (document.body.style.cursor = 'default')}
      >
        <mesh scale={isBoss ? 1.5 : 1} castShadow>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color={state === 'locked' ? '#b9c4d2' : '#ffffff'}
            emissive={color}
            emissiveIntensity={state === 'locked' ? 0.12 : 0.8}
            roughness={0.18}
            metalness={0.2}
            transparent
            opacity={state === 'locked' ? 0.75 : 1}
          />
        </mesh>
        {state !== 'locked' && (
          <pointLight color={color} intensity={2.2} distance={5.5} position={[0, 0.3, 0]} />
        )}
      </group>

      {/* tranca flutuante nos santuários bloqueados */}
      {state === 'locked' && (
        <group position={[0, isBoss ? 4.9 : 3.6, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 0.26, 0.12]} />
            <meshStandardMaterial color="#5b7285" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
            <torusGeometry args={[0.11, 0.035, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#5b7285" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* placa da fase (sprite com CanvasTexture) */}
      <LabelSprite
        title={`${num === '★' ? '★ CHEFE' : `FASE ${num}`} · ${short}`}
        titleColor={
          state === 'done' ? '#0d6b2e' : state === 'open' ? '#8a5300' : '#54708f'
        }
        border={
          state === 'done' ? '#21a44a' : state === 'open' ? '#f5920b' : '#8496ab'
        }
        sub={area}
        y={isBoss ? 5.7 : 4.3}
        height={1.05}
      />
    </group>
  )
}
