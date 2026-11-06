'use client'

// CAPYBER — Sala Segura 3D · "Operação Capivara Silenciosa" (v2 · Grande Salto)
// ─────────────────────────────────────────────────────────────────────────────
// Quarto low-poly com traços realistas: estante de livros, mesa com PC
// (monitor emissivo/terminal), menino de capuz digitando, janela com cortina,
// cama + pelúcia de capivara e pôster. Quando o jogador é "RASTREADO"
// (educativo), a cena vira um mini-filme:
//   · BATIDAS na porta (maçaneta treme, porta entreabre)
//   · ARROMBAMENTO com overshoot + poeira + tremor de câmera
//   · 2 agentes entram CAMINHANDO (pernas/braços animados) com lanternas
//   · sirene vermelha/ciano pulsando na janela e no teto
// Câmera dinâmica: presets (orbital, PC, porta, janela, cama, cinema) com
// transições suaves, "respiração" de idle e órbita cinematográfica.
// Modo Sonho (surreal): mobília flutua, luz vira aurora e a órbita desacelera.
// Tudo é simulação lúdica — nenhum conteúdo real é executado.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* ══════════════════════════════ constantes ══════════════════════════════ */

export type CamPreset = 'orbital' | 'pc' | 'porta' | 'janela' | 'cama' | 'cinema'
export type RaidStage = 'none' | 'knock' | 'breach'

const DEFAULT_CAM = new THREE.Vector3(8.8, 5.0, 9.4)
const DEFAULT_LOOK = new THREE.Vector3(0.2, 1.05, -1.4)
const PC_CAM = new THREE.Vector3(2.35, 1.7, -2.15)
const PC_LOOK = new THREE.Vector3(2.4, 1.42, -4.6)

/** Presets de câmera — a "região" do quarto em foco. */
export const CAM_PRESETS: Record<
  CamPreset,
  { cam: THREE.Vector3; look: THREE.Vector3; label: string }
> = {
  orbital: { cam: DEFAULT_CAM.clone(), look: DEFAULT_LOOK.clone(), label: 'Orbital' },
  pc: { cam: PC_CAM.clone(), look: PC_LOOK.clone(), label: 'PC' },
  porta: { cam: new THREE.Vector3(5.6, 2.4, 2.6), look: new THREE.Vector3(5.6, 1.35, -2.8), label: 'Porta' },
  janela: { cam: new THREE.Vector3(1.6, 2.3, 0.4), look: new THREE.Vector3(-3.4, 2.25, -5.4), label: 'Janela' },
  cama: { cam: new THREE.Vector3(-1.2, 2.2, 4.9), look: new THREE.Vector3(-5.2, 0.75, 2.4), label: 'Cama' },
  cinema: { cam: DEFAULT_CAM.clone(), look: DEFAULT_LOOK.clone(), label: 'Cinema' },
}

const BOOK_COLORS = ['#f5920b', '#21a44a', '#8b5cf6', '#2569b8', '#e94f37', '#e8c93d', '#14355f', '#d97706', '#7c3aed']

/** PRNG determinístico (mulberry32) para livros/objetos estáveis entre renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/* ═══════════════════════════ texturas (canvas) ═══════════════════════════ */

function makeTerminalTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 400
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const ctx = c.getContext('2d')
  if (!ctx) return tex
  ctx.fillStyle = '#06131f'
  ctx.fillRect(0, 0, 640, 400)
  // scanlines sutis
  ctx.fillStyle = 'rgba(92,243,193,0.045)'
  for (let y = 0; y < 400; y += 4) ctx.fillRect(0, y, 640, 2)
  // barra de título
  ctx.fillStyle = 'rgba(37,105,184,0.4)'
  ctx.fillRect(0, 0, 640, 36)
  ctx.font = 'bold 17px monospace'
  ctx.fillStyle = '#8fd3ff'
  ctx.fillText('CAPY-OS v3.7 — sala segura', 14, 24)
  ctx.fillStyle = '#f5920b'
  ctx.fillText('●', 604, 24)
  const lines: Array<[string, string]> = [
    ['$ capy opsec --status', '#4ade80'],
    ['[ok] túnel do laboratório ativo', '#4ade80'],
    ['[ok] DNS criptografado (DoH)', '#4ade80'],
    ['[ok] fingerprint uniforme ✔', '#4ade80'],
    ['$ curso privacidade --modulo 1/8', '#9fe8ff'],
    ['> carregando aula: rastreadores…', '#9fe8ff'],
    ['$ _', '#4ade80'],
  ]
  ctx.font = '15px monospace'
  lines.forEach(([l, col], i) => {
    ctx.fillStyle = col
    ctx.fillText(l, 14, 70 + i * 27)
  })
  tex.needsUpdate = true
  return tex
}

function makePosterTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 352
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const ctx = c.getContext('2d')
  if (!ctx) return tex
  const g = ctx.createLinearGradient(0, 0, 0, 352)
  g.addColorStop(0, '#10315c')
  g.addColorStop(1, '#1d5fae')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 352)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let y = 0; y < 352; y += 18) ctx.fillRect(0, y, 256, 2)
  // escudo capivara
  ctx.fillStyle = '#f5920b'
  ctx.beginPath()
  ctx.moveTo(128, 60)
  ctx.lineTo(196, 92)
  ctx.lineTo(196, 168)
  ctx.lineTo(128, 210)
  ctx.lineTo(60, 168)
  ctx.lineTo(60, 92)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#10315c'
  ctx.font = 'bold 46px monospace'
  ctx.fillText('C', 112, 152)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px monospace'
  ctx.fillText('CAPYBER', 34, 262)
  ctx.font = 'bold 15px monospace'
  ctx.fillStyle = '#bcd9f7'
  ctx.fillText('PRIVACIDADE & OPSEC', 30, 292)
  ctx.font = '12px monospace'
  ctx.fillText('lab fictício · simulação', 52, 322)
  tex.needsUpdate = true
  return tex
}

/** Céu noturno com estrelas (janela) — ganha aurora no modo sonho. */
// texturas procedurais leves (256px) — piso e parede com visual de jogo surreal
function makeFloorTexture(dream: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(5, 4)
  if (!ctx) return tex
  const a = dream ? ['#3b2354', '#52307a'] : ['#6b4426', '#85572f']
  const rng = mulberry32(dream ? 11 : 5)
  for (let y = 0; y < 2; y++)
    for (let x = 0; x < 2; x++) {
      const g = ctx.createLinearGradient(x * 128, y * 128, x * 128 + 128, y * 128 + 128)
      g.addColorStop(0, a[(x + y) % 2])
      g.addColorStop(1, a[(x + y + 1) % 2])
      ctx.fillStyle = g
      ctx.fillRect(x * 128, y * 128, 128, 128)
    }
  ctx.strokeStyle = dream ? 'rgba(255,214,120,0.55)' : 'rgba(40,22,8,0.45)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, 254, 254)
  ctx.beginPath()
  ctx.moveTo(128, 0); ctx.lineTo(128, 256); ctx.moveTo(0, 128); ctx.lineTo(256, 128)
  ctx.stroke()
  // veios de madeira / runas
  for (let i = 0; i < 26; i++) {
    const x = rng() * 256, y = rng() * 256
    ctx.strokeStyle = dream ? `rgba(180,140,255,${0.15 + rng() * 0.25})` : `rgba(30,16,6,${0.12 + rng() * 0.2})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + 20, y + 10, x + 40, y - 10, x + 60 + rng() * 20, y + 4)
    ctx.stroke()
  }
  if (dream) {
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(255,230,150,${0.4 + rng() * 0.5})`
      ctx.beginPath()
      ctx.arc(rng() * 256, rng() * 256, 1.5 + rng() * 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  return tex
}

function makeWallTexture(dream: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 1)
  if (!ctx) return tex
  const g = ctx.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, dream ? '#4a2a78' : '#9fc3e6')
  g.addColorStop(1, dream ? '#7a4aa8' : '#c3d9f0')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const rng = mulberry32(dream ? 23 : 9)
  // espirais surreais
  ctx.lineWidth = 2
  ctx.strokeStyle = dream ? 'rgba(255,214,140,0.5)' : 'rgba(60,110,170,0.35)'
  for (const [cx, cy] of [[64, 70], [192, 180]] as Array<[number, number]>) {
    ctx.beginPath()
    for (let t = 0; t < 14; t += 0.2) {
      const r = 2 + t * 3.4
      const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  // olho que observa
  ctx.fillStyle = dream ? 'rgba(255,240,200,0.85)' : 'rgba(255,255,255,0.7)'
  ctx.beginPath()
  ctx.ellipse(192, 60, 26, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = dream ? '#7c3aed' : '#2f7fd1'
  ctx.beginPath()
  ctx.arc(192, 60, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#10062a'
  ctx.beginPath()
  ctx.arc(192, 60, 3.5, 0, Math.PI * 2)
  ctx.fill()
  // estrelas e pontos
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = dream ? `rgba(255,235,170,${0.2 + rng() * 0.6})` : `rgba(255,255,255,${0.2 + rng() * 0.4})`
    ctx.fillRect(rng() * 256, rng() * 256, 2, 2)
  }
  return tex
}

function makeSkyTexture(dream: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 192
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const ctx = c.getContext('2d')
  if (!ctx) return tex
  const g = ctx.createLinearGradient(0, 0, 0, 192)
  if (dream) {
    g.addColorStop(0, '#2a1052')
    g.addColorStop(0.55, '#5b2a86')
    g.addColorStop(1, '#a44abf')
  } else {
    g.addColorStop(0, '#0a1a33')
    g.addColorStop(0.6, '#14355f')
    g.addColorStop(1, '#2c5f9e')
  }
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 192)
  // estrelas
  const rng = mulberry32(7)
  for (let i = 0; i < 90; i++) {
    const x = rng() * 256
    const y = rng() * 130
    const r = rng() * 1.3 + 0.4
    ctx.fillStyle = `rgba(255,255,255,${0.35 + rng() * 0.65})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // constelação da capivara (surreal S9): perfil simplificado
  ctx.strokeStyle = dream ? 'rgba(255,220,120,0.85)' : 'rgba(190,220,255,0.6)'
  ctx.lineWidth = 1.2
  const pts: Array<[number, number]> = [
    [52, 66], [74, 52], [102, 46], [128, 52], [150, 62],
    [158, 76], [146, 88], [120, 92], [92, 90], [66, 82],
  ]
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.stroke()
  pts.forEach(([x, y]) => {
    ctx.fillStyle = dream ? '#ffe9a8' : '#cfe4ff'
    ctx.beginPath()
    ctx.arc(x, y, 2.1, 0, Math.PI * 2)
    ctx.fill()
  })
  // aurora (modo sonho)
  if (dream) {
    for (let i = 0; i < 3; i++) {
      const ag = ctx.createLinearGradient(0, 20 + i * 22, 256, 60 + i * 22)
      ag.addColorStop(0, 'rgba(47,214,173,0)')
      ag.addColorStop(0.5, i % 2 ? 'rgba(124,252,212,0.28)' : 'rgba(159,122,244,0.3)')
      ag.addColorStop(1, 'rgba(47,214,173,0)')
      ctx.fillStyle = ag
      ctx.beginPath()
      ctx.moveTo(0, 34 + i * 20)
      for (let x = 0; x <= 256; x += 16) {
        ctx.lineTo(x, 34 + i * 20 + Math.sin(x / 28 + i * 2) * 12)
      }
      ctx.lineTo(256, 0)
      ctx.lineTo(0, 0)
      ctx.closePath()
      ctx.fill()
    }
  }
  // lua
  ctx.fillStyle = dream ? 'rgba(255,236,170,0.95)' : 'rgba(220,235,255,0.9)'
  ctx.beginPath()
  ctx.arc(206, 38, 11, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = dream ? 'rgba(90,40,130,0.55)' : 'rgba(20,53,95,0.55)'
  ctx.beginPath()
  ctx.arc(200, 34, 9, 0, Math.PI * 2)
  ctx.fill()
  tex.needsUpdate = true
  return tex
}

/* ══════════════════════════════ iluminação ══════════════════════════════ */

function SceneLights({ dream, raidStage }: { dream: boolean; raidStage: RaidStage }) {
  const ambient = useRef<THREE.AmbientLight>(null)
  const warm = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // flicker MUITO sutil da luz quente (vida) — some no modo sonho
    if (warm.current && !dream) {
      warm.current.intensity = 7 + Math.sin(t * 1.7) * 0.35 + Math.sin(t * 9.3) * 0.12
    }
    // transição de cor do ambiente para o sonho
    if (ambient.current) {
      const target = dream ? '#e8d9ff' : '#e8f1ff'
      ambient.current.color.lerp(new THREE.Color(target), 0.04)
      ambient.current.intensity = THREE.MathUtils.damp(ambient.current.intensity, dream ? 0.5 : 0.62, 3, 0.016)
    }
    if (warm.current) {
      const targetColor = dream ? '#d9b0ff' : '#fff2dd'
      warm.current.color.lerp(new THREE.Color(targetColor), 0.04)
    }
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.62} color="#e8f1ff" />
      <hemisphereLight args={[dream ? '#7c5cd6' : '#dfeaff', '#3a2f26', 0.5]} />
      {/* luz fria "da janela" */}
      <directionalLight position={[-4, 6.5, 2.5]} intensity={0.55} color={dream ? '#c9a7ff' : '#cfe4ff'} />
      {/* preenchimento central quente */}
      <pointLight ref={warm} position={[0, 3.3, 0.6]} intensity={7} distance={14} decay={1.8} color="#fff2dd" />
      {/* Durante o arrombamento: clarão branco da lanterna */}
      {raidStage === 'breach' && <pointLight position={[5.4, 2.4, -2.4]} intensity={4} distance={8} decay={2} color="#dff0ff" />}
    </>
  )
}

/* ══════════════════════════════ poeira ambiente ══════════════════════════════ */

/** Motas de poeira flutuando no feixe da janela — sutileza que dá vida. */
function DustMotes() {
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const rng = mulberry32(99)
    const n = 70
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = -4 + rng() * 8.4
      pos[i * 3 + 1] = 0.3 + rng() * 2.8
      pos[i * 3 + 2] = -5 + rng() * 9
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  useEffect(() => () => geo.dispose(), [geo])

  useFrame((state) => {
    const pts = ref.current
    if (!pts) return
    const t = state.clock.elapsedTime
    const arr = (pts.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += Math.sin(t * 0.5 + i) * 0.0006
      arr[i] += Math.cos(t * 0.3 + i * 0.7) * 0.0005
    }
    ;(pts.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.028} color="#cfe4ff" transparent opacity={0.34} sizeAttenuation depthWrite={false} />
    </points>
  )
}

/** Explosão de poeira quando a porta é arrombada. */
function DustBurst({ active }: { active: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const born = useRef(0)
  const geo = useMemo(() => {
    const rng = mulberry32(4242)
    const n = 60
    const pos = new Float32Array(n * 3)
    const vel: number[] = []
    for (let i = 0; i < n; i++) {
      pos[i * 3] = 6.2
      pos[i * 3 + 1] = 0.6 + rng() * 1.5
      pos[i * 3 + 2] = -2.9 + (rng() - 0.5) * 1.1
      vel.push(-1.4 - rng() * 2.2, (rng() - 0.3) * 1.1, (rng() - 0.5) * 2.6)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('vel', new THREE.Float32BufferAttribute(vel, 3))
    return g
  }, [])

  useEffect(() => {
    if (active) born.current = performance.now()
  }, [active])
  useEffect(() => () => geo.dispose(), [geo])

  useFrame((_, dt) => {
    const pts = ref.current
    if (!pts) return
    pts.visible = active
    if (!active) return
    const life = (performance.now() - born.current) / 1000
    const mat = pts.material as THREE.PointsMaterial
    mat.opacity = Math.max(0, 0.75 * (1 - life / 1.4))
    const pos = pts.geometry.getAttribute('position') as THREE.BufferAttribute
    const vel = pts.geometry.getAttribute('vel') as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const v = vel.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += v[i] * dt
      arr[i + 1] += v[i + 1] * dt
      arr[i + 2] += v[i + 2] * dt
      v[i + 1] -= dt * 0.9 // gravidade suave
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geo} visible={false}>
      <pointsMaterial size={0.06} color="#d9c9a8" transparent opacity={0} sizeAttenuation depthWrite={false} />
    </points>
  )
}

/* ══════════════════════════════ quarto ══════════════════════════════ */

/** Envolve móveis para flutuar no modo sonho (surreal). */
function DreamFloat({ dream, phase = 0, children }: { dream: boolean; phase?: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    const g = ref.current
    if (!g) return
    const t = state.clock.elapsedTime
    const target = dream ? Math.sin(t * 0.9 + phase) * 0.075 : 0
    g.position.y = THREE.MathUtils.damp(g.position.y, target, 2.4, 0.016)
    if (dream) g.rotation.z = Math.sin(t * 0.6 + phase) * 0.012
    else g.rotation.z = THREE.MathUtils.damp(g.rotation.z, 0, 3, 0.016)
  })
  return <group ref={ref}>{children}</group>
}

function Room({ dream, raidStage, onPosterClick }: { dream: boolean; raidStage: RaidStage; onPosterClick: () => void }) {
  const poster = useMemo(() => makePosterTexture(), [])
  const sky = useMemo(() => makeSkyTexture(dream), [dream])
  const floorTex = useMemo(() => makeFloorTexture(dream), [dream])
  const wallTex = useMemo(() => makeWallTexture(dream), [dream])
  const curtainL = useRef<THREE.Mesh>(null)
  const curtainR = useRef<THREE.Mesh>(null)
  const skyMat = useRef<THREE.MeshStandardMaterial>(null)
  const posterMesh = useRef<THREE.Mesh>(null)

  useEffect(() => () => sky.dispose(), [sky])
  useEffect(() => () => floorTex.dispose(), [floorTex])
  useEffect(() => () => wallTex.dispose(), [wallTex])

  // cortina balança levemente (vento) + céu respira
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const sway = Math.sin(t * 0.7) * 0.02 + Math.sin(t * 1.9) * 0.008
    if (curtainL.current) curtainL.current.rotation.z = 0.05 + sway
    if (curtainR.current) curtainR.current.rotation.z = -0.05 - sway
    if (skyMat.current) {
      skyMat.current.emissiveIntensity = dream
        ? 0.85 + Math.sin(t * 0.8) * 0.18
        : 0.55 + Math.sin(t * 0.4) * 0.05
      if (raidStage === 'breach') {
        // reflexo da sirene no vidro da janela
        const pulse = Math.sin(t * 9)
        skyMat.current.emissive.lerpColors(
          new THREE.Color(dream ? '#8b5cf6' : '#2c5f9e'),
          new THREE.Color(pulse > 0 ? '#ff2338' : '#3f8cff'),
          Math.abs(pulse) * 0.55,
        )
      } else if (dream) {
        skyMat.current.emissive.lerp(new THREE.Color('#a44abf'), 0.05)
      } else {
        skyMat.current.emissive.lerp(new THREE.Color('#2c5f9e'), 0.05)
      }
    }
  })

  return (
    <group>
      {/* orbes e cristais flutuantes (surreal, barato: 6 malhas) */}
      {[[-4.6, 3.3, -3.4], [4.9, 3.6, -2.2], [-2.2, 3.9, 1.2], [3.2, 3.2, 3.4], [-5.2, 2.8, 3.8], [0.6, 3.8, -4.2]].map(([x, y, z], i) => (
        <DreamFloat key={i} dream phase={i * 1.3}>
          <mesh position={[x, y, z]}>
            <octahedronGeometry args={[0.16 + (i % 3) * 0.05, 0]} />
            <meshStandardMaterial color={dream ? '#ffd98a' : '#8fc4ff'} emissive={dream ? '#ff9ad6' : '#3f8cff'} emissiveIntensity={0.9} />
          </mesh>
        </DreamFloat>
      ))}
      {/* piso de madeira */}
      <mesh position={[0, -0.05, 0]} receiveShadow={false}>
        <boxGeometry args={[13, 0.1, 11]} />
        <meshStandardMaterial map={floorTex} color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* tábuas (linhas) */}
      {[-4.5, -3, -1.5, 0, 1.5, 3, 4.5].map((z) => (
        <mesh key={z} position={[0, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[13, 0.05]} />
          <meshBasicMaterial color={dream ? '#54325a' : '#6d4523'} transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* parede do fundo (BackSide = visível só de dentro) */}
      <mesh position={[0, 2.2, -5.5]}>
        <boxGeometry args={[13, 4.4, 0.12]} />
        <meshStandardMaterial map={wallTex} color="#ffffff" side={THREE.BackSide} />
      </mesh>
      {/* parede esquerda */}
      <mesh position={[-6.5, 2.2, 0]}>
        <boxGeometry args={[0.12, 4.4, 11]} />
        <meshStandardMaterial map={wallTex} color="#ffffff" side={THREE.BackSide} />
      </mesh>
      {/* parede direita */}
      <mesh position={[6.5, 2.2, 0]}>
        <boxGeometry args={[0.12, 4.4, 11]} />
        <meshStandardMaterial map={wallTex} color="#ffffff" side={THREE.BackSide} />
      </mesh>
      {/* rodapés */}
      <mesh position={[0, 0.09, -5.42]}>
        <boxGeometry args={[13, 0.18, 0.06]} />
        <meshStandardMaterial color="#5f4630" side={THREE.BackSide} />
      </mesh>

      {/* janela no fundo: moldura + céu noturno estrelado */}
      <group position={[-3.4, 2.3, -5.43]}>
        <mesh>
          <boxGeometry args={[2.1, 1.6, 0.08]} />
          <meshStandardMaterial color="#5f4630" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[1.9, 1.4, 0.02]} />
          <meshStandardMaterial ref={skyMat} color="#0d1d38" emissive="#2c5f9e" emissiveIntensity={0.55} emissiveMap={sky} map={sky} />
        </mesh>
        <mesh position={[0, 0, 0.075]}>
          <boxGeometry args={[0.05, 1.4, 0.02]} />
          <meshStandardMaterial color="#5f4630" />
        </mesh>
        {/* cortina laranja aberta (balança) */}
        <mesh ref={curtainL} position={[-1.2, 0.02, 0.14]}>
          <boxGeometry args={[0.34, 1.8, 0.07]} />
          <meshStandardMaterial color={dream ? '#7c3aed' : '#a44a1f'} />
        </mesh>
        <mesh ref={curtainR} position={[1.2, 0.02, 0.14]}>
          <boxGeometry args={[0.34, 1.8, 0.07]} />
          <meshStandardMaterial color={dream ? '#7c3aed' : '#a44a1f'} />
        </mesh>
        <mesh position={[0, 1.02, 0.14]}>
          <boxGeometry args={[2.7, 0.07, 0.09]} />
          <meshStandardMaterial color="#3c2a1a" />
        </mesh>
      </group>

      {/* pôster CAPYBER — clique 3× abre o PORTAL (easter egg) */}
      <mesh
        ref={posterMesh}
        position={[-0.7, 2.45, -5.42]}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPosterClick()
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <planeGeometry args={[1.15, 1.55]} />
        <meshStandardMaterial map={poster} emissive={dream ? '#7c3aed' : '#000000'} emissiveIntensity={dream ? 0.35 : 0} />
      </mesh>

      {/* tapete */}
      <mesh position={[0.7, 0.012, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 28]} />
        <meshStandardMaterial color={dream ? '#b04ac2' : '#d97c2b'} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.7, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.28, 28]} />
        <meshStandardMaterial color={dream ? '#5b2a86' : '#a44a1f'} side={THREE.DoubleSide} />
      </mesh>

      {/* cama (canto esquerdo-frontal) + pelúcia de capivara */}
      <DreamFloat dream={dream} phase={1.2}>
        <group position={[-5.3, 0, 2.4]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[1.7, 0.44, 2.3]} />
            <meshStandardMaterial color="#6d4523" />
          </mesh>
          <mesh position={[0.06, 0.52, 0]}>
            <boxGeometry args={[1.56, 0.2, 2.2]} />
            <meshStandardMaterial color="#d8e6f7" />
          </mesh>
          <mesh position={[-0.4, 0.63, -0.72]}>
            <boxGeometry args={[0.7, 0.14, 0.5]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.1, 0.64, 0.42]}>
            <boxGeometry args={[1.46, 0.1, 1.3]} />
            <meshStandardMaterial color={dream ? '#7c3aed' : '#2c7f52'} />
          </mesh>
          <mesh position={[-0.88, 0.9, 0]}>
            <boxGeometry args={[0.12, 0.9, 2.3]} />
            <meshStandardMaterial color="#5f4630" />
          </mesh>
          {/* pelúcia capivara (design + marca) */}
          <group position={[0.35, 0.66, -0.75]} rotation={[0, 0.5, 0]}>
            <mesh position={[0, 0.09, 0]}>
              <boxGeometry args={[0.26, 0.18, 0.36]} />
              <meshStandardMaterial color="#b07b3e" />
            </mesh>
            <mesh position={[0, 0.21, 0.14]}>
              <boxGeometry args={[0.19, 0.16, 0.2]} />
              <meshStandardMaterial color="#b07b3e" />
            </mesh>
            {[-0.06, 0.06].map((x) => (
              <mesh key={x} position={[x, 0.31, 0.1]}>
                <boxGeometry args={[0.045, 0.05, 0.04]} />
                <meshStandardMaterial color="#8a5a26" />
              </mesh>
            ))}
            <mesh position={[0, 0.2, 0.245]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial color="#3a2410" />
            </mesh>
            {[-0.08, 0.08].map((x) => (
              <mesh key={`e${x}`} position={[x, 0.22, 0.245]}>
                <meshBasicMaterial color="#1a1006" />
                <sphereGeometry args={[0.014, 6, 6]} />
              </mesh>
            ))}
          </group>
        </group>
      </DreamFloat>

      {/* luminária de chão */}
      <DreamFloat dream={dream} phase={2.6}>
        <group position={[0.4, 0, -4.7]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.22, 0.26, 0.06, 12]} />
            <meshStandardMaterial color="#222c3a" />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.7, 8]} />
            <meshStandardMaterial color="#222c3a" />
          </mesh>
          <mesh position={[0, 1.78, 0]}>
            <coneGeometry args={[0.26, 0.3, 12, 1, true]} />
            <meshStandardMaterial color="#f5920b" side={THREE.DoubleSide} emissive="#f5920b" emissiveIntensity={0.25} />
          </mesh>
          <pointLight position={[0, 1.62, 0]} intensity={dream ? 9 : 11} distance={9} decay={1.7} color={dream ? '#c9a7ff' : '#ffb35c'} />
        </group>
      </DreamFloat>
    </group>
  )
}

/* ══════════════════════════════ estante de livros ══════════════════════════════ */

interface BookSpec {
  z: number
  y: number
  h: number
  w: number
  color: string
  lean: number
}

function Bookshelf({ dream }: { dream: boolean }) {
  const shelves = [0.42, 1.02, 1.62]
  const { booksByShelf, pileBooks } = useMemo(() => {
    const rng = mulberry32(20240607)
    const byShelf: BookSpec[][] = shelves.map((sy) => {
      const specs: BookSpec[] = []
      let z = -3.52
      while (z < -1.38) {
        const w = 0.055 + rng() * 0.085
        const h = 0.3 + rng() * 0.16
        const gap = rng() < 0.12 ? 0.1 + rng() * 0.12 : 0
        const lean = rng() < 0.08 ? (rng() - 0.5) * 0.24 : 0
        specs.push({ z: z + w / 2, y: sy, h, w, color: BOOK_COLORS[Math.floor(rng() * BOOK_COLORS.length)], lean })
        z += w + gap
      }
      return specs
    })
    const pile: BookSpec[] = []
    let py = 2.28
    for (let i = 0; i < 3; i++) {
      pile.push({ z: -2.4 + (i - 1) * 0.02, y: py + 0.025, h: 0.05, w: 0.3, color: BOOK_COLORS[i * 3 % BOOK_COLORS.length], lean: (i - 1) * 0.04 })
      py += 0.05
    }
    return { booksByShelf: byShelf, pileBooks: pile }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <DreamFloat dream={dream} phase={0.4}>
      <group position={[-6.42, 0, 0]}>
        {/* estrutura: laterais, fundo, prateleiras */}
        <mesh position={[0.2, 1.15, -3.68]}>
          <boxGeometry args={[0.42, 2.3, 0.06]} />
          <meshStandardMaterial color="#5f4630" />
        </mesh>
        <mesh position={[0.2, 1.15, -1.28]}>
          <boxGeometry args={[0.42, 2.3, 0.06]} />
          <meshStandardMaterial color="#5f4630" />
        </mesh>
        <mesh position={[0.02, 1.15, -2.48]}>
          <boxGeometry args={[0.05, 2.3, 2.46]} />
          <meshStandardMaterial color="#4e3a27" />
        </mesh>
        {[0, ...shelves, 2.28].map((y) => (
          <mesh key={y} position={[0.2, y, -2.48]}>
            <boxGeometry args={[0.42, 0.045, 2.4]} />
            <meshStandardMaterial color="#7a5230" />
          </mesh>
        ))}
        {/* livros em pé */}
        {booksByShelf.map((row, ri) =>
          row.map((b, bi) => (
            <mesh key={`${ri}-${bi}`} position={[0.2, b.y + b.h / 2 + 0.023, b.z]} rotation={[b.lean, 0, 0]}>
              <boxGeometry args={[0.3, b.h, b.w]} />
              <meshStandardMaterial color={b.color} />
            </mesh>
          )),
        )}
        {/* pilha no topo da estante */}
        {pileBooks.map((b, i) => (
          <mesh key={`pile-${i}`} position={[0.2, b.y, b.z]} rotation={[b.lean, 0, 0]}>
            <boxGeometry args={[b.w, b.h, 0.22]} />
            <meshStandardMaterial color={b.color} />
          </mesh>
        ))}
      </group>
    </DreamFloat>
  )
}

/* ══════════════════════════════ mesa + PC ══════════════════════════════ */

function DeskArea({ onOpenPC, pcOpen, dream }: { onOpenPC: () => void; pcOpen: boolean; dream: boolean }) {
  const terminal = useMemo(() => makeTerminalTexture(), [])
  const screenMat = useRef<THREE.MeshStandardMaterial>(null)

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [])

  // brilho do monitor "digita" — flicker orgânico sutil
  useFrame((state) => {
    if (screenMat.current) {
      const t = state.clock.elapsedTime
      screenMat.current.emissiveIntensity = 1.18 + Math.sin(t * 7.3) * 0.07 + Math.sin(t * 23.7) * 0.03
    }
  })

  const handleOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = 'pointer'
  }, [])
  const handleOut = useCallback(() => {
    document.body.style.cursor = 'auto'
  }, [])
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      onOpenPC()
    },
    [onOpenPC],
  )

  return (
    <DreamFloat dream={dream} phase={3.4}>
      <group>
        {/* tampo e pernas */}
        <mesh position={[2.4, 0.74, -4.6]}>
          <boxGeometry args={[2.5, 0.08, 1]} />
          <meshStandardMaterial color="#7a5230" />
        </mesh>
        {[
          [1.35, -4.25],
          [3.45, -4.25],
          [1.35, -4.95],
          [3.45, -4.95],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.35, z]}>
            <boxGeometry args={[0.09, 0.7, 0.09]} />
            <meshStandardMaterial color="#5f4630" />
          </mesh>
        ))}

        {/* torre do PC */}
        <group position={[3.75, 0, -4.72]}>
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.36, 0.84, 0.78]} />
            <meshStandardMaterial color="#16202e" />
          </mesh>
          <mesh position={[0, 0.42, 0.395]}>
            <boxGeometry args={[0.26, 0.6, 0.01]} />
            <meshStandardMaterial color="#0b1220" emissive="#2569b8" emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, 0.78, 0.4]}>
            <boxGeometry args={[0.05, 0.03, 0.02]} />
            <meshBasicMaterial color="#5cf3c1" toneMapped={false} />
          </mesh>
        </group>

        {/* monitor */}
        <group position={[2.35, 0, -4.85]}>
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[0.55, 0.04, 0.32]} />
            <meshStandardMaterial color="#1c2733" />
          </mesh>
          <mesh position={[0, 1.05, -0.02]}>
            <boxGeometry args={[0.09, 0.42, 0.07]} />
            <meshStandardMaterial color="#1c2733" />
          </mesh>
          <mesh position={[0, 1.62, 0]} rotation={[0.06, 0, 0]}>
            <boxGeometry args={[1.55, 0.98, 0.07]} />
            <meshStandardMaterial color="#101820" />
          </mesh>
          <mesh position={[0, 1.62, 0.045]} rotation={[0.06, 0, 0]}>
            <planeGeometry args={[1.42, 0.85]} />
            <meshStandardMaterial
              ref={screenMat}
              color="#000000"
              emissive="#ffffff"
              emissiveMap={terminal}
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* área de clique do PC (hitbox invisível) */}
        <mesh position={[2.35, 1.35, -4.75]} onPointerOver={handleOver} onPointerOut={handleOut} onPointerDown={handleClick}>
          <boxGeometry args={[1.9, 1.35, 0.55]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* teclado + mouse */}
        <mesh position={[2.4, 0.8, -4.3]} rotation={[0.04, 0, 0]}>
          <boxGeometry args={[0.66, 0.035, 0.22]} />
          <meshStandardMaterial color="#1c2733" />
        </mesh>
        <mesh position={[2.4, 0.822, -4.3]} rotation={[0.04, 0, 0]}>
          <boxGeometry args={[0.6, 0.012, 0.18]} />
          <meshStandardMaterial color="#263442" />
        </mesh>
        <mesh position={[2.95, 0.81, -4.26]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#263442" />
        </mesh>

        {/* caneca + livros na mesa */}
        <mesh position={[1.55, 0.87, -4.4]}>
          <cylinderGeometry args={[0.07, 0.06, 0.16, 10]} />
          <meshStandardMaterial color="#f5920b" />
        </mesh>
        <mesh position={[1.7, 0.83, -4.75]} rotation={[0, 0.25, 0]}>
          <boxGeometry args={[0.26, 0.05, 0.19]} />
          <meshStandardMaterial color="#21a44a" />
        </mesh>
        <mesh position={[1.72, 0.885, -4.74]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.24, 0.05, 0.17]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>

        {/* etiqueta flutuante "abrir PC" */}
        {!pcOpen && (
          <Html position={[2.35, 2.42, -4.8]} center distanceFactor={9} zIndexRange={[12, 0]}>
            <button
              type="button"
              onClick={onOpenPC}
              aria-label="Abrir o computador do quarto (curso e missões)"
              className="cap-btn-steel cap-mono cursor-pointer px-3 py-1.5 text-xs font-extrabold whitespace-nowrap"
            >
              ▶ abrir PC
            </button>
          </Html>
        )}
      </group>
    </DreamFloat>
  )
}

/* ══════════════════════════════ menino de capuz ══════════════════════════════ */

function HoodedBoy({ raidStage }: { raidStage: RaidStage }) {
  const leftHand = useRef<THREE.Mesh>(null)
  const rightHand = useRef<THREE.Mesh>(null)
  const head = useRef<THREE.Group>(null)
  const chair = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const scared = raidStage === 'breach'
    // digitando → assustado: mãos sobem
    if (leftHand.current) {
      const base = scared ? 1.02 : 0.815
      const amp = scared ? 0.012 : 0.022
      leftHand.current.position.y = THREE.MathUtils.damp(leftHand.current.position.y, base + Math.sin(t * (scared ? 18 : 13)) * amp, 8, 0.016)
    }
    if (rightHand.current) {
      const base = scared ? 1.04 : 0.815
      const amp = scared ? 0.012 : 0.022
      rightHand.current.position.y = THREE.MathUtils.damp(rightHand.current.position.y, base + Math.sin(t * (scared ? 18 : 13) + 2.2) * amp, 8, 0.016)
    }
    // cabeça vira para a porta
    if (head.current) {
      const yawT = scared ? 0.85 : Math.sin(t * 0.85) * 0.09
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, yawT, 6, 0.016)
      head.current.rotation.z = scared ? Math.sin(t * 14) * 0.02 : Math.sin(t * 0.55) * 0.035
    }
    // tronco encolhe levemente
    if (torso.current) {
      const target = scared ? 0.94 : 1
      torso.current.scale.y = THREE.MathUtils.damp(torso.current.scale.y, target, 6, 0.016)
    }
    // cadeia desliza para trás no susto
    if (chair.current) {
      const target = scared ? -0.22 : 0
      chair.current.position.z = THREE.MathUtils.damp(chair.current.position.z, target, 4, 0.016)
    }
  })

  return (
    <group position={[2.35, 0, -3.62]} rotation={[0, Math.PI, 0]}>
      {/* cadeira de escritório (desliza no susto) */}
      <group ref={chair}>
        <mesh position={[0, 0.46, 0.05]}>
          <boxGeometry args={[0.56, 0.08, 0.56]} />
          <meshStandardMaterial color="#2b3442" />
        </mesh>
        <mesh position={[0, 0.9, -0.32]}>
          <boxGeometry args={[0.5, 0.72, 0.09]} />
          <meshStandardMaterial color="#2b3442" />
        </mesh>
        <mesh position={[0, 0.24, 0.05]}>
          <cylinderGeometry args={[0.035, 0.035, 0.42, 8]} />
          <meshStandardMaterial color="#3c4a5c" />
        </mesh>
        {[
          [0.24, 0.24],
          [-0.24, 0.24],
          [0.24, -0.24],
          [-0.24, -0.24],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.035, z]} rotation={[0, Math.atan2(x, z), 0]}>
            <boxGeometry args={[0.34, 0.04, 0.06]} />
            <meshStandardMaterial color="#222c38" />
          </mesh>
        ))}
      </group>

      {/* pernas (sentado): coxas + canelas + tênis */}
      {[-0.14, 0.14].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.52, 0.24]}>
            <boxGeometry args={[0.19, 0.15, 0.48]} />
            <meshStandardMaterial color="#3a4a63" />
          </mesh>
          <mesh position={[x, 0.27, 0.44]}>
            <boxGeometry args={[0.16, 0.44, 0.16]} />
            <meshStandardMaterial color="#33415a" />
          </mesh>
          <mesh position={[x, 0.05, 0.5]}>
            <boxGeometry args={[0.17, 0.09, 0.26]} />
            <meshStandardMaterial color="#d97706" />
          </mesh>
        </group>
      ))}

      {/* tronco (moletom laranja) — encolhe no susto */}
      <group ref={torso}>
        <mesh position={[0, 0.98, 0.02]}>
          <boxGeometry args={[0.54, 0.6, 0.32]} />
          <meshStandardMaterial color="#f5920b" />
        </mesh>
        <mesh position={[0, 0.82, 0.19]}>
          <boxGeometry args={[0.3, 0.14, 0.02]} />
          <meshStandardMaterial color="#c9750a" />
        </mesh>

        {/* braços até o teclado */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.32, 1.02, 0.05]} rotation={[0, 0, s * 0.5]}>
              <boxGeometry args={[0.13, 0.34, 0.13]} />
              <meshStandardMaterial color="#f5920b" />
            </mesh>
            <mesh position={[s * 0.2, 0.83, 0.22]} rotation={[0, 0, s * 0.18]}>
              <boxGeometry args={[0.11, 0.11, 0.3]} />
              <meshStandardMaterial color="#d97706" />
            </mesh>
            {/* mão (anima digitação) */}
            <mesh ref={s === -1 ? leftHand : rightHand} position={[s * 0.13, 0.815, 0.44]}>
              <boxGeometry args={[0.11, 0.055, 0.13]} />
              <meshStandardMaterial color="#f2c197" />
            </mesh>
          </group>
        ))}

        {/* cabeça com capuz */}
        <group ref={head} position={[0, 1.47, 0]} rotation={[0.14, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.175, 16, 14]} />
            <meshStandardMaterial color="#f2c197" />
          </mesh>
          {/* capuz: "gorro" cobrindo topo/trás */}
          <mesh position={[0, 0.035, -0.02]} rotation={[-0.12, 0, 0]}>
            <sphereGeometry args={[0.215, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
            <meshStandardMaterial color="#c9750a" side={THREE.DoubleSide} />
          </mesh>
          {/* pescoço do capuz atrás */}
          <mesh position={[0, -0.1, -0.16]}>
            <boxGeometry args={[0.3, 0.22, 0.1]} />
            <meshStandardMaterial color="#c9750a" />
          </mesh>
          {/* sombra do capuz no rosto */}
          <mesh position={[0, 0.05, 0.135]} rotation={[0.3, 0, 0]}>
            <planeGeometry args={[0.2, 0.08]} />
            <meshBasicMaterial color="#8a4a06" transparent opacity={0.55} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

/* ═══════════════════════════ porta + polícia ═══════════════════════════ */

/**
 * Porta com física de mola: nenhum estágio = fechada · knock = entreabre com
 * a maçaneta tremendo · breach = arrombamento com overshoot elástico.
 */
function DoorRaid({ raidStage }: { raidStage: RaidStage }) {
  const hinge = useRef<THREE.Group>(null)
  const knob = useRef<THREE.Mesh>(null)
  const rot = useRef(0)
  const vel = useRef(0)

  useFrame((state, dtRaw) => {
    const h = hinge.current
    if (!h) return
    const dt = Math.min(dtRaw, 0.05)
    const t = state.clock.elapsedTime

    const target = raidStage === 'breach' ? -2.1 : raidStage === 'knock' ? -0.26 : 0

    if (raidStage === 'breach') {
      // mola subamortecida → overshoot dramático e assentamento
      const stiff = 42
      const damp = 5.2
      vel.current += (target - rot.current) * stiff * dt
      vel.current -= vel.current * damp * dt
      rot.current += vel.current * dt
    } else if (raidStage === 'knock') {
      // entreabrir devagar + tremor da maçaneta
      rot.current = THREE.MathUtils.damp(rot.current, target, 4, dt)
      if (knob.current) {
        knob.current.position.x = 0.06 + Math.sin(t * 34) * 0.012
        knob.current.rotation.y = Math.sin(t * 30) * 0.14
      }
    } else {
      rot.current = THREE.MathUtils.damp(rot.current, 0, 5, dt)
      vel.current = 0
      if (knob.current) {
        knob.current.position.x = THREE.MathUtils.damp(knob.current.position.x, 0.06, 8, dt)
        knob.current.rotation.y = THREE.MathUtils.damp(knob.current.rotation.y, 0, 8, dt)
      }
    }
    h.rotation.y = rot.current
  })

  return (
    <group position={[6.42, 0, -2.9]}>
      {/* batente */}
      <mesh position={[0.04, 1.12, 0.62]}>
        <boxGeometry args={[0.14, 2.28, 0.08]} />
        <meshStandardMaterial color="#4e3a27" />
      </mesh>
      <mesh position={[0.04, 1.12, -0.62]}>
        <boxGeometry args={[0.14, 2.28, 0.08]} />
        <meshStandardMaterial color="#4e3a27" />
      </mesh>
      <mesh position={[0.04, 2.24, 0]}>
        <boxGeometry args={[0.14, 0.1, 1.32]} />
        <meshStandardMaterial color="#4e3a27" />
      </mesh>
      {/* folha da porta (dobra para dentro do quarto) */}
      <group ref={hinge} position={[0, 0, -0.56]}>
        <mesh position={[0.02, 1.07, 0.56]}>
          <boxGeometry args={[0.07, 2.14, 1.04]} />
          <meshStandardMaterial color="#8a5a33" side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={knob} position={[0.06, 1.05, 0.94]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#d9b23a" />
        </mesh>
      </group>
    </group>
  )
}

/** Agente com pernas/braços animados, lanterna e head-turn após chegar. */
function PoliceFigure({
  raidStage,
  delay,
  waypoints,
  speed = 0.42,
}: {
  raidStage: RaidStage
  delay: number
  waypoints: THREE.Vector3[]
  speed?: number
}) {
  const group = useRef<THREE.Group>(null)
  const legL = useRef<THREE.Group>(null)
  const legR = useRef<THREE.Group>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const beam = useRef<THREE.Group>(null)
  const flash = useRef<THREE.SpotLight>(null)

  const prog = useRef(0)
  const enteredAt = useRef<number | null>(null)

  const totalLen = useMemo(() => {
    let len = 0
    for (let i = 1; i < waypoints.length; i++) len += waypoints[i].distanceTo(waypoints[i - 1])
    return len
  }, [waypoints])

  useFrame((state, dtRaw) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(dtRaw, 0.05)
    const t = state.clock.elapsedTime

    if (raidStage !== 'breach') {
      prog.current = 0
      enteredAt.current = null
      g.visible = false
      return
    }
    g.visible = true

    // avanço ao longo dos waypoints (delay por agente)
    if (enteredAt.current === null) enteredAt.current = t + delay
    if (t >= enteredAt.current) {
      prog.current = Math.min(1, prog.current + dt * speed / Math.max(totalLen, 0.01) * 2.4)
    }
    const e = easeInOutCubic(prog.current)

    // posição ao longo dos waypoints
    const pos = new THREE.Vector3()
    if (waypoints.length === 2) {
      pos.lerpVectors(waypoints[0], waypoints[1], e)
    } else {
      const segs = waypoints.length - 1
      const f = e * segs
      const si = Math.min(segs - 1, Math.floor(f))
      const fe = f - si
      pos.lerpVectors(waypoints[si], waypoints[si + 1], fe)
    }
    const walking = prog.current > 0 && prog.current < 1
    // passo: bob + balanço
    g.position.copy(pos)
    g.position.y = walking ? Math.abs(Math.sin(t * 9 + delay * 3)) * 0.045 : 0

    // orientação para o próximo waypoint
    const nextIdx = Math.min(waypoints.length - 1, Math.ceil(prog.current * (waypoints.length - 1)))
    const prevIdx = Math.max(0, nextIdx - 1)
    const dir = new THREE.Vector3().subVectors(waypoints[nextIdx], waypoints[prevIdx])
    if (dir.lengthSq() > 0.0001) g.rotation.y = Math.atan2(dir.x, dir.z) - Math.PI / 2

    // pernas/braços alternando (só enquanto caminha; senão assentam)
    const swing = walking ? Math.sin(t * 9 + delay * 3) * 0.55 : 0
    const settle = THREE.MathUtils.damp(0, 0, 1, dt) // no-op para manter refs vivas
    if (legL.current) legL.current.rotation.x = THREE.MathUtils.lerp(legL.current.rotation.x, swing, walking ? 0.5 : 0.1)
    if (legR.current) legR.current.rotation.x = THREE.MathUtils.lerp(legR.current.rotation.x, -swing, walking ? 0.5 : 0.1)
    if (armL.current) armL.current.rotation.x = THREE.MathUtils.lerp(armL.current.rotation.x, -swing * 0.7, walking ? 0.5 : 0.1)
    if (armR.current) armR.current.rotation.x = THREE.MathUtils.lerp(armR.current.rotation.x, swing * 0.25, walking ? 0.5 : 0.1)
    void settle

    // cabeça procura o menino após chegar
    if (head.current) {
      const yawT = prog.current >= 1 ? Math.sin(t * 0.8 + delay) * 0.3 : 0
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, yawT, 4, dt)
    }

    // lanterna: forte durante a entrada, afrouxa ao chegar
    if (flash.current) {
      flash.current.intensity = prog.current >= 1 ? 1.6 : 4.2
    }
    if (beam.current) {
      const m = beam.current.children[0] as THREE.Mesh
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = prog.current >= 1 ? 0.05 : 0.14
      beam.current.visible = true
    }
  })

  return (
    <group ref={group} visible={false}>
      {/* pernas com pivô no quadril */}
      {[-0.11, 0.11].map((x) => (
        <group key={x} ref={x < 0 ? legL : legR} position={[x, 0.72, 0]}>
          <mesh position={[0, -0.36, 0]}>
            <boxGeometry args={[0.16, 0.72, 0.18]} />
            <meshStandardMaterial color="#1a2740" />
          </mesh>
          <mesh position={[0, -0.68, 0.04]}>
            <boxGeometry args={[0.17, 0.09, 0.26]} />
            <meshStandardMaterial color="#0e1826" />
          </mesh>
        </group>
      ))}
      {/* tronco + colete */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[0.44, 0.54, 0.26]} />
        <meshStandardMaterial color="#22355c" />
      </mesh>
      <mesh position={[0, 1.0, 0.14]}>
        <boxGeometry args={[0.36, 0.4, 0.04]} />
        <meshStandardMaterial color="#31465f" />
      </mesh>
      {/* braços com pivô no ombro */}
      {[-1, 1].map((s) => (
        <group key={s} ref={s < 0 ? armL : armR} position={[s * 0.3, 1.18, 0]}>
          <mesh position={[0, -0.24, 0.02]} rotation={[0, 0, s * 0.16]}>
            <boxGeometry args={[0.12, 0.48, 0.13]} />
            <meshStandardMaterial color="#1a2740" />
          </mesh>
        </group>
      ))}
      {/* cabeça + quepe */}
      <group ref={head} position={[0, 1.42, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 12, 10]} />
          <meshStandardMaterial color="#e8b98d" />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.165, 0.17, 0.09, 12]} />
          <meshStandardMaterial color="#16233c" />
        </mesh>
        <mesh position={[0, 0.07, 0.15]}>
          <boxGeometry args={[0.2, 0.03, 0.16]} />
          <meshStandardMaterial color="#16233c" />
        </mesh>
      </group>
      {/* distintivo */}
      <mesh position={[0.12, 1.05, 0.17]}>
        <boxGeometry args={[0.07, 0.09, 0.01]} />
        <meshStandardMaterial color="#f2d43d" emissive="#f2d43d" emissiveIntensity={0.4} />
      </mesh>
      {/* lanterna: spot real + cone volumétrico fake */}
      <spotLight
        ref={flash}
        position={[0.16, 1.1, 0.2]}
        angle={0.5}
        penumbra={0.55}
        distance={9}
        decay={1.6}
        intensity={0}
        color="#eaf4ff"
        target-position={[0, 0.4, 3]}
      />
      <group ref={beam} position={[0.16, 1.05, 0.24]} rotation={[0.55, 0, 0]}>
        <mesh position={[0, 0, 1.05]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.42, 2.2, 14, 1, true]} />
          <meshBasicMaterial color="#bfe0ff" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

function PoliceRaid({ raidStage }: { raidStage: RaidStage }) {
  const wps = useMemo(
    () => [
      [new THREE.Vector3(7.4, 0, -2.7), new THREE.Vector3(5.2, 0, -2.6), new THREE.Vector3(3.1, 0, -1.7)],
      [new THREE.Vector3(7.4, 0, -3.1), new THREE.Vector3(5.0, 0, -3.15), new THREE.Vector3(4.2, 0, -3.2)],
    ],
    [],
  )
  return (
    <>
      <PoliceFigure raidStage={raidStage} delay={0.55} waypoints={wps[0]} />
      <PoliceFigure raidStage={raidStage} delay={1.35} waypoints={wps[1]} />
    </>
  )
}

function SirenLights({ raidStage }: { raidStage: RaidStage }) {
  const red = useRef<THREE.PointLight>(null)
  const blue = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const active = raidStage === 'breach'
    if (red.current) red.current.intensity = active ? Math.max(0, Math.sin(t * 9)) * 26 : 0
    if (blue.current) blue.current.intensity = active ? Math.max(0, Math.sin(t * 9 + Math.PI)) * 26 : 0
  })
  return (
    <>
      <pointLight ref={red} position={[5.2, 3.2, -2.2]} color="#ff2338" distance={13} decay={1.6} intensity={0} />
      <pointLight ref={blue} position={[4.4, 3.2, -3.8]} color="#3f8cff" distance={13} decay={1.6} intensity={0} />
    </>
  )
}

/* ══════════════════════════════ câmera ══════════════════════════════ */

type OrbitTarget = { target: THREE.Vector3; update: () => void }

/**
 * Região de câmera:
 * · presets suaves com lerp exponencial
 * · "respiração" (idle drift) no orbital — o quarto nunca parece morto
 * · cinema: órbita lenta automática em volta da mesa
 * · raid: empurra a câmera para ver a porta + tremor no arrombamento
 * · sonho: deriva mais lenta e hipnótica
 */
function CameraDirector({
  preset,
  pcOpen,
  raidStage,
  dream,
  busy,
  onArrived,
}: {
  preset: CamPreset
  pcOpen: boolean
  raidStage: RaidStage
  dream: boolean
  busy: boolean
  onArrived: () => void
}) {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as OrbitTarget | null
  const arrived = useRef(true)
  const shake = useRef(0)
  const lastStage = useRef<RaidStage>('none')

  // dispara tremor no arrombamento
  useFrame(() => {
    if (raidStage === 'breach' && lastStage.current !== 'breach') shake.current = 1
    lastStage.current = raidStage
  })

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const t = state.clock.elapsedTime

    let camT: THREE.Vector3
    let lookT: THREE.Vector3

    if (pcOpen) {
      camT = PC_CAM
      lookT = PC_LOOK
    } else if (raidStage === 'breach') {
      // câmera aciona para enquadrar a porta e a entrada dos agentes
      camT = new THREE.Vector3(3.4, 2.6, 3.2)
      lookT = new THREE.Vector3(5.2, 1.15, -2.6)
    } else if (preset === 'cinema') {
      const a = t * 0.12
      camT = new THREE.Vector3(Math.cos(a) * 9.6, 4.4 + Math.sin(t * 0.31) * 0.8, Math.sin(a) * 9.6)
      lookT = new THREE.Vector3(0.2, 1.15, -1.2)
    } else {
      const p = CAM_PRESETS[preset]
      camT = p.cam
      lookT = p.look
    }

    // respiração de idle: deriva sinusoidal sutil (fora do PC e do raid)
    if (!pcOpen && raidStage === 'breach' === false && preset !== 'cinema') {
      const amp = dream ? 0.22 : 0.09
      const sp = dream ? 0.35 : 0.55
      camT = camT.clone().add(
        new THREE.Vector3(
          Math.sin(t * sp) * amp,
          Math.sin(t * sp * 0.8 + 1.4) * amp * 0.5,
          Math.cos(t * sp * 0.9 + 2.2) * amp,
        ),
      )
    }

    const k = 1 - Math.exp(-dt * (preset === 'cinema' ? 2.2 : 3.4))
    camera.position.lerp(camT, k)

    // tremor do arrombamento (decai exponencialmente)
    if (shake.current > 0.001) {
      shake.current *= Math.exp(-dt * 4.2)
      camera.position.add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.09 * shake.current,
          (Math.random() - 0.5) * 0.07 * shake.current,
          (Math.random() - 0.5) * 0.09 * shake.current,
        ),
      )
    }

    if (controls) {
      controls.target.lerp(lookT, k)
      controls.update()
    }

    const close = camera.position.distanceTo(camT) < 0.05
    if (close && busy && !arrived.current) {
      arrived.current = true
      onArrived()
    }
    if (!close) arrived.current = false
  })
  return null
}

/* ══════════════════════════════ cena raiz ══════════════════════════════ */

export interface StealthSceneProps {
  /** polícia no quarto (foi rastreado) */
  raid: boolean
  /** estágio da invasão: knock = batidas · breach = arrombamento + agentes */
  raidStage: RaidStage
  /** preset de câmera ativo */
  camPreset: CamPreset
  /** modo sonho (surreal): mobília flutua, luz vira aurora */
  dream: boolean
  /** PC aberto: câmera aproxima e controles travam */
  pcOpen: boolean
  onOpenPC: () => void
  /** clique no pôster (easter egg do portal) */
  onPosterClick?: () => void
}

export default function StealthScene({
  raid,
  raidStage,
  camPreset,
  dream,
  pcOpen,
  onOpenPC,
  onPosterClick,
}: StealthSceneProps) {
  const [camBusy, setCamBusy] = useState(false)
  const onArrived = useCallback(() => setCamBusy(false), [])
  const stage: RaidStage = raid ? raidStage : 'none'

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: DEFAULT_CAM.toArray(), fov: 44, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[dream ? '#160b2e' : '#0b1626']} />
      <fog attach="fog" args={[dream ? '#160b2e' : '#0b1626', 18, 34]} />
      <SceneLights dream={dream} raidStage={stage} />
      <Room dream={dream} raidStage={stage} onPosterClick={() => onPosterClick?.()} />
      <Bookshelf dream={dream} />
      <DeskArea onOpenPC={onOpenPC} pcOpen={pcOpen} dream={dream} />
      <HoodedBoy raidStage={stage} />
      <DoorRaid raidStage={stage} />
      <PoliceRaid raidStage={stage} />
      <SirenLights raidStage={stage} />
      <DustMotes />
      <DustBurst active={stage === 'breach'} />
      <CameraDirector
        preset={camPreset}
        pcOpen={pcOpen}
        raidStage={stage}
        dream={dream}
        busy={camBusy}
        onArrived={onArrived}
      />
      <OrbitControls
        makeDefault
        enabled={!pcOpen && !camBusy && camPreset === 'orbital' && stage !== 'breach'}
        target={DEFAULT_LOOK.toArray()}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={dream && camPreset === 'orbital'}
        autoRotateSpeed={0.6}
        minDistance={3.2}
        maxDistance={15}
        minPolarAngle={0.22}
        maxPolarAngle={1.45}
        minAzimuthAngle={-1.15}
        maxAzimuthAngle={1.15}
      />
    </Canvas>
  )
}
