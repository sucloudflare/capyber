'use client'

// CAPYBER — Mapa OSINT 3D: cadeia de dados em tempo real.
// Nós surgem perto da entidade que os originou e o layout de forças
// (repulsão + molas + viés por tipo) organiza a rede em 3D, com pulsos
// de dados viajando pelas conexões — estilo grafo de investigação.

import { useEffect, useRef, useState } from 'react'
import { Network } from 'lucide-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OSINT_TYPE_COLOR, type OsintEdge, type OsintNode, type OsintType } from '@/lib/osint-modules'

/* ============ API exposta ao pai ============ */

export interface Osint3DApi {
  addNode: (n: OsintNode) => void
  addEdge: (e: OsintEdge) => void
  reset: () => void
  focus: (id: string | null) => void
  /** Aproxima a câmera do ponto orbital (dolly-in). */
  zoomIn: () => void
  /** Afasta a câmera do ponto orbital (dolly-out). */
  zoomOut: () => void
  /** Limpa o foco e devolve a câmera à posição/aluvo inicial. */
  resetView: () => void
}

interface Props {
  apiRef: { current: Osint3DApi | null }
  selectedId: string | null
  onSelect: (id: string | null) => void
}

/* ============ texturas ============ */

function makeGlowTexture(inner: string, outer: string): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64)
    g.addColorStop(0, inner)
    g.addColorStop(0.45, outer)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  return new THREE.CanvasTexture(c)
}

function makeLabelTexture(text: string): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 96
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 512, 96)
    ctx.font = 'bold 40px "JetBrains Mono", ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(2,8,20,0.95)'
    ctx.shadowBlur = 10
    ctx.fillStyle = '#eaf4ff'
    ctx.fillText(text, 256, 48)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

/* ============ estruturas internas ============ */

interface NodeObj {
  id: string
  data: OsintNode
  group: THREE.Group
  core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  halo: THREE.Sprite
  label: THREE.Sprite
  vel: THREE.Vector3
  born: number
  baseScale: number
  color: THREE.Color
  /** largura base do sprite de nome (calculada na criação) */
  labelW: number
}

const MAX_EDGES = 900
const NODE_SIZE: Partial<Record<OsintType, number>> = { alvo: 0.95, breach: 0.62 }
const REST_LEN = 7.2
const SPRING_K = 0.018
const REPULSION = 42
const CENTER_PULL = 0.0016
const TYPE_BIAS = 0.05
/** largura abaixo da qual o canvas é considerado compacto (mobile) — labels só no nó focado */
const COMPACT_WIDTH_PX = 640

/** direção de aglomeração por tipo (determinística) */
function typeBias(type: OsintType): THREE.Vector3 {
  let h = 2166136261
  for (let i = 0; i < type.length; i++) {
    h ^= type.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const a = ((h >>> 0) % 3600) / 3600 * Math.PI * 2
  const b = (((h >>> 10) % 1800) / 1800) * Math.PI - Math.PI / 2
  const r = 6 + ((h >>> 20) % 40) / 10
  return new THREE.Vector3(r * Math.cos(a), b * 1.2, r * Math.sin(a))
}
const TYPE_BIAS_MAP = new Map<OsintType, THREE.Vector3>()
function biasOf(t: OsintType): THREE.Vector3 {
  let v = TYPE_BIAS_MAP.get(t)
  if (!v) {
    v = typeBias(t)
    TYPE_BIAS_MAP.set(t, v)
  }
  return v
}

export default function Osint3DCanvas({ apiRef, selectedId, onSelect }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const hoverRef = useRef<string | null>(null)
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; label: string; sub: string } | null>(null)
  const [webglFailed, setWebglFailed] = useState(false)

  // refs compartilhados com o loop de animação
  const nodesRef = useRef<Map<string, NodeObj>>(new Map())
  const edgesRef = useRef<{ from: string; to: string }[]>([])
  const selectedRef = useRef<string | null>(selectedId)
  const focusRef = useRef<THREE.Vector3 | null>(null)

  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const mountEl: HTMLDivElement = mount
    const nodes = nodesRef.current
    const edges = edgesRef.current

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x06101f, 0.011)

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500)
    camera.position.set(0, 10, 30)

    // WebGL pode falhar em WebView/driver antigo — fallback amigável, sem derrubar o painel
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setWebglFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mountEl.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 6
    controls.maxDistance = 120
    controls.autoRotate = !prefersReduced
    controls.autoRotateSpeed = 0.5

    // luzes + grid de fundo (estilo sala de análise)
    scene.add(new THREE.AmbientLight(0xbfdcff, 0.9))
    const p1 = new THREE.PointLight(0x37c0fb, 1.1, 300)
    p1.position.set(40, 60, 30)
    scene.add(p1)
    const p2 = new THREE.PointLight(0xf5920b, 0.7, 300)
    p2.position.set(-50, -20, -40)
    scene.add(p2)

    const grid = new THREE.GridHelper(160, 32, 0x1d4a7a, 0x12314f)
    const gm = grid.material as THREE.Material
    gm.transparent = true
    gm.opacity = 0.22
    grid.position.y = -16
    scene.add(grid)

    // glow compartilhado
    const glowWhite = makeGlowTexture('rgba(255,255,255,0.85)', 'rgba(150,200,255,0.30)')
    const pulseTex = makeGlowTexture('rgba(255,255,255,0.95)', 'rgba(140,190,255,0.35)')

    /* ---- arestas (LineSegments único) + pulsos (Points único) ---- */
    const edgePos = new Float32Array(MAX_EDGES * 2 * 3)
    const edgeCol = new Float32Array(MAX_EDGES * 2 * 3)
    const edgeGeo = new THREE.BufferGeometry()
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3))
    edgeGeo.setAttribute('color', new THREE.BufferAttribute(edgeCol, 3))
    const edgeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5 })
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat)
    edgeLines.frustumCulled = false
    scene.add(edgeLines)

    const pulsePos = new Float32Array(MAX_EDGES * 3)
    const pulseCol = new Float32Array(MAX_EDGES * 3)
    const pulseGeo = new THREE.BufferGeometry()
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3))
    pulseGeo.setAttribute('color', new THREE.BufferAttribute(pulseCol, 3))
    const pulseMat = new THREE.PointsMaterial({
      size: 1.15,
      map: pulseTex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    const pulsePoints = new THREE.Points(pulseGeo, pulseMat)
    pulsePoints.frustumCulled = false
    scene.add(pulsePoints)

    /* ---- registro de nós/arestas ---- */

    function spawnPosition(parentId?: string): THREE.Vector3 {
      const parent = parentId ? nodes.get(parentId) : undefined
      if (parent) {
        return parent.group.position
          .clone()
          .add(new THREE.Vector3().randomDirection().multiplyScalar(2.6 + Math.random() * 2.4))
      }
      return new THREE.Vector3().randomDirection().multiplyScalar(9 + Math.random() * 9)
    }

    function addNode(n: OsintNode): void {
      if (nodes.has(n.id) || nodes.size >= 260) return
      const color = new THREE.Color(OSINT_TYPE_COLOR[n.type] ?? '#7cb6ec')
      const baseScale = NODE_SIZE[n.type] ?? 0.58
      const depth = Math.min(n.depth, 3)

      const group = new THREE.Group()
      group.position.copy(spawnPosition(depth > 0 ? findParent(n.id) : undefined))
      group.scale.setScalar(0.001)

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(baseScale, 22, 22),
        new THREE.MeshBasicMaterial({ color }),
      )
      core.userData.nodeId = n.id
      group.add(core)

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowWhite,
          color,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      )
      halo.scale.setScalar(baseScale * 4.2)
      group.add(halo)

      const label = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: makeLabelTexture(n.label), transparent: true, depthWrite: false }),
      ) as THREE.Sprite
      const w = Math.min(3.4 + n.label.length * 0.14, 9)
      label.scale.set(w, (w * 96) / 512, 1)
      label.position.y = baseScale + 1.05
      group.add(label)

      scene.add(group)
      nodes.set(n.id, {
        id: n.id,
        data: n,
        group,
        core,
        halo,
        label,
        vel: new THREE.Vector3(),
        born: performance.now(),
        baseScale,
        color,
        labelW: w,
      })
      // nó novo força reavaliar todos os pulsos (nº de arestas muda pouco, ok)
    }

    /** pai já posicionado (aresta que chega primeiro) — para nascer perto dele */
    function findParent(nodeId: string): string | undefined {
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i]
        if (e && e.to === nodeId && nodes.has(e.from)) return e.from
        if (e && e.from === nodeId && nodes.has(e.to)) return e.to
      }
      return undefined
    }

    function addEdge(e: { from: string; to: string }): void {
      if (edges.length >= MAX_EDGES) return
      if (!nodes.has(e.from) || !nodes.has(e.to)) return
      if (edges.some((x) => (x.from === e.from && x.to === e.to) || (x.from === e.to && x.to === e.from))) return
      edges.push({ from: e.from, to: e.to })
    }

    function reset(): void {
      for (const n of nodes.values()) {
        scene.remove(n.group)
        n.core.geometry.dispose()
        n.core.material.dispose()
        n.halo.material.dispose()
        n.label.material.map?.dispose()
        n.label.material.dispose()
      }
      nodes.clear()
      edges.length = 0
      edgeGeo.setDrawRange(0, 0)
      pulseGeo.setDrawRange(0, 0)
      focusRef.current = null
    }

    function focus(id: string | null): void {
      if (!id) {
        focusRef.current = null
        return
      }
      const n = nodes.get(id)
      if (n) focusRef.current = n.group.position.clone()
    }

    /** dolly ao longo do eixo alvo→câmera, respeitando os limites do OrbitControls */
    function dolly(factor: number): void {
      const offset = camera.position.clone().sub(controls.target)
      const len = THREE.MathUtils.clamp(
        offset.length() * factor,
        controls.minDistance + 0.4,
        controls.maxDistance - 2,
      )
      offset.setLength(len)
      camera.position.copy(controls.target).add(offset)
    }

    /** recente o grafo: solta o foco do nó e restaura a câmera inicial */
    function resetView(): void {
      focusRef.current = null
      controls.target.set(0, 0, 0)
      camera.position.set(0, 10, 30)
      controls.update()
    }

    apiRef.current = {
      addNode,
      addEdge,
      reset,
      focus,
      zoomIn: () => dolly(0.78),
      zoomOut: () => dolly(1.28),
      resetView,
    }

    /* ---- interação: raycaster ---- */
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let downAt: { x: number; y: number; t: number } | null = null
    let hoverFrame = 0

    function pick(ev: PointerEvent): string | null {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const meshes: THREE.Object3D[] = []
      for (const n of nodes.values()) meshes.push(n.core)
      const hit = raycaster.intersectObjects(meshes, false)[0]
      return (hit?.object.userData.nodeId as string | undefined) ?? null
    }

    function onPointerDown(ev: PointerEvent): void {
      downAt = { x: ev.clientX, y: ev.clientY, t: Date.now() }
    }

    function onPointerUp(ev: PointerEvent): void {
      if (!downAt) return
      const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y)
      const quick = Date.now() - downAt.t < 500
      downAt = null
      if (!quick || moved > 6) return // foi drag da câmera
      const id = pick(ev)
      onSelect(id) // clicar fora limpa a seleção
    }

    function onPointerMove(ev: PointerEvent): void {
      if (++hoverFrame % 3 !== 0) return
      const id = pick(ev)
      if (id !== hoverRef.current) {
        hoverRef.current = id
        renderer.domElement.style.cursor = id ? 'pointer' : 'grab'
        if (!id) setHoverInfo(null)
      }
      if (id) {
        const n = nodes.get(id)
        if (n) {
          const rect = renderer.domElement.getBoundingClientRect()
          setHoverInfo({
            x: ev.clientX - rect.left,
            y: ev.clientY - rect.top,
            label: n.data.label,
            sub: `${n.data.type} · salto ${n.data.depth} · via ${n.data.source}`,
          })
        }
      }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.style.cursor = 'grab'

    /* ---- resize ---- */
    // modo compacto (mobile): esconde os nomes flutuantes para não cobrir o grafo
    let compact = mountEl.clientWidth < COMPACT_WIDTH_PX
    const resize = (): void => {
      const w = mountEl.clientWidth || 1
      const h = mountEl.clientHeight || 1
      compact = w < COMPACT_WIDTH_PX
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mountEl)

    // Segurança extra: ao entrar/sair da tela cheia alguns navegadores
    // disparam o evento antes do ResizeObserver — força dois frames.
    const onFsChange = (): void => {
      resize()
      requestAnimationFrame(resize)
    }
    window.addEventListener('fullscreenchange', onFsChange)
    window.addEventListener('webkitfullscreenchange', onFsChange)

    /* ---- loop de animação: forças + arestas + pulsos ---- */
    const tmpA = new THREE.Vector3()
    const tmpB = new THREE.Vector3()
    let raf = 0
    let last = performance.now()

    function animate(now: number): void {
      raf = requestAnimationFrame(animate)
      const dt = Math.min((now - last) / 16.666, 3)
      last = now
      const arr = [...nodes.values()]

      // nascimento (scale-in elástico)
      for (const n of arr) {
        const age = now - n.born
        const s = prefersReduced ? 1 : Math.min(1, age / 380)
        const ease = 1 + 2.2 * Math.pow(1 - s, 2) * Math.sin(Math.min(s, 1) * Math.PI) // overshoot suave
        n.group.scale.setScalar(Math.max(0.001, s * (0.75 + 0.25 * ease)))
      }

      // simulação de forças (3D): repulsão + molas + centro + viés por tipo
      if (!prefersReduced || now < 6000) {
        for (let i = 0; i < arr.length; i++) {
          const a = arr[i]
          if (!a) continue
          for (let j = i + 1; j < arr.length; j++) {
            const b = arr[j]
            if (!b) continue
            tmpA.subVectors(b.group.position, a.group.position)
            const d2 = Math.max(tmpA.lengthSq(), 0.35)
            if (d2 > 220) continue
            const f = REPULSION / d2
            tmpA.normalize().multiplyScalar(f * dt)
            a.vel.sub(tmpA)
            b.vel.add(tmpA)
          }
        }
        for (const e of edges) {
          const a = nodes.get(e.from)
          const b = nodes.get(e.to)
          if (!a || !b) continue
          tmpB.subVectors(b.group.position, a.group.position)
          const dist = Math.max(tmpB.length(), 0.1)
          tmpB.multiplyScalar(((dist - REST_LEN) * SPRING_K * dt) / dist)
          a.vel.add(tmpB)
          b.vel.sub(tmpB)
        }
        for (const n of arr) {
          const bias = biasOf(n.data.type)
          n.vel.addScaledVector(bias, TYPE_BIAS * dt * 0.01)
          n.vel.addScaledVector(n.group.position, -CENTER_PULL * dt)
          n.vel.multiplyScalar(Math.pow(0.86, dt))
          if (n.vel.length() > 1.4) n.vel.setLength(1.4)
          n.group.position.addScaledVector(n.vel, dt)
        }
      }

      // realce do nó selecionado
      const sel = selectedRef.current
      for (const n of arr) {
        const isSel = n.id === sel
        const isHover = n.id === hoverRef.current
        n.core.scale.setScalar(isSel ? 1.55 : isHover ? 1.25 : 1)
        n.halo.material.opacity = isSel ? 0.85 : isHover ? 0.65 : 0.5
        n.halo.scale.setScalar(n.baseScale * (isSel ? 6 : 4.2))
        // mobile/compacto: nomes só no alvo e no nó selecionado (hover em touch
        // dispara durante o arrasto — excluído para não piscar sobre o mapa)
        // desktop: nomes visíveis (atenuados quando o grafo é grande)
        const showLabel = compact
          ? isSel || n.data.type === 'alvo'
          : true
        n.label.visible = showLabel
        // compacto: nomes 35% menores para nunca cobrir o grafo
        const lk = compact ? 0.62 : 1
        n.label.scale.set(n.labelW * lk, (n.labelW * 96 * lk) / 512, 1)
        n.label.material.opacity = isSel || isHover || (!compact && arr.length < 30) ? 1 : 0.82
      }

      // arestas: posição + cor por tipo de origem
      let ei = 0
      for (const e of edges) {
        const a = nodes.get(e.from)
        const b = nodes.get(e.to)
        if (!a || !b) continue
        const o = ei * 6
        edgePos[o] = a.group.position.x
        edgePos[o + 1] = a.group.position.y
        edgePos[o + 2] = a.group.position.z
        edgePos[o + 3] = b.group.position.x
        edgePos[o + 4] = b.group.position.y
        edgePos[o + 5] = b.group.position.z
        const c = a.color
        edgeCol[o] = c.r
        edgeCol[o + 1] = c.g
        edgeCol[o + 2] = c.b
        edgeCol[o + 3] = c.r * 0.35
        edgeCol[o + 4] = c.g * 0.35
        edgeCol[o + 5] = c.b * 0.35
        ei++
      }
      edgeGeo.setDrawRange(0, ei * 2)
      edgeGeo.attributes.position.needsUpdate = true
      edgeGeo.attributes.color.needsUpdate = true

      // pulsos de dados viajando pelas conexões
      const tSec = now / 1000
      for (let i = 0; i < ei; i++) {
        const e = edges[i]
        if (!e) continue
        const a = nodes.get(e.from)
        const b = nodes.get(e.to)
        if (!a || !b) continue
        const t = (tSec * 0.22 + i * 0.173) % 1
        const o = i * 3
        pulsePos[o] = a.group.position.x + (b.group.position.x - a.group.position.x) * t
        pulsePos[o + 1] = a.group.position.y + (b.group.position.y - a.group.position.y) * t
        pulsePos[o + 2] = a.group.position.z + (b.group.position.z - a.group.position.z) * t
        const c = a.color
        pulseCol[o] = c.r
        pulseCol[o + 1] = c.g
        pulseCol[o + 2] = c.b
      }
      pulseGeo.setDrawRange(0, ei)
      pulseGeo.attributes.position.needsUpdate = true
      pulseGeo.attributes.color.needsUpdate = true

      // aproxima a câmera do nó selecionado
      if (focusRef.current) {
        controls.target.lerp(focusRef.current, 0.06)
      }

      controls.update()
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('fullscreenchange', onFsChange)
      window.removeEventListener('webkitfullscreenchange', onFsChange)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      controls.dispose()
      reset()
      glowWhite.dispose()
      pulseTex.dispose()
      edgeGeo.dispose()
      edgeMat.dispose()
      pulseGeo.dispose()
      pulseMat.dispose()
      gm.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mountEl) mountEl.removeChild(renderer.domElement)
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (webglFailed) {
    return (
      <div className="relative h-full w-full" data-testid="osint-3d-canvas">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Network className="h-10 w-10 text-[#2b5e93]" aria-hidden />
          <p className="max-w-sm text-[1rem] font-bold text-[#7cb6ec]">
            O motor gráfico 3D não abriu neste dispositivo.
          </p>
          <p className="max-w-md text-[0.9rem] text-[#54708f]">
            O resto do painel de recon continua funcionando — as entidades descobertas ficam
            listadas nas abas Tabela e JSON.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full" data-testid="osint-3d-canvas">
      <div ref={mountRef} className="h-full w-full" />
      {hoverInfo && (
        <div
          className="pointer-events-none absolute z-20 max-w-[280px] rounded-md border-2 border-[#2b5e93] bg-[#08182e]/95 px-2.5 py-1.5 shadow-xl"
          style={{ left: Math.min(hoverInfo.x + 14, 999), top: Math.max(hoverInfo.y - 44, 4) }}
          role="tooltip"
        >
          <p className="truncate text-[0.95rem] font-bold text-[#eaf4ff]">{hoverInfo.label}</p>
          <p className="truncate text-[0.8rem] text-[#7cb6ec]">{hoverInfo.sub}</p>
        </div>
      )}
    </div>
  )
}
