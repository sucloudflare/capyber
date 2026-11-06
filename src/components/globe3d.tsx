'use client'

// CAPYBER — Mapa 3D global de ameaças (estilo sala de crise CIA/FBI)
// v2: contornos REAIS dos países (Natural Earth via world-atlas/TopoJSON),
// paleta neutra com texto branco, arcos de ataque animados e marcadores pulsantes.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TARGETS, type ThreatEvent } from '@/lib/types'
import { worldCountries } from '@/lib/world-geometry'

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

/** Libera material + textura associada (evita vazamento de GPU entre remounts). */
function disposeMaterial(m: THREE.Material): void {
  const candidate = (m as unknown as { map?: THREE.Texture | null }).map
  candidate?.dispose()
  m.dispose()
}

function makeGlowTexture(): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128)
    g.addColorStop(0, 'rgba(210,235,255,0.35)')
    g.addColorStop(0.35, 'rgba(124,182,236,0.14)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
  }
  return new THREE.CanvasTexture(c)
}

function makeLabelTexture(text: string): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const ctx = c.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 512, 128)
    ctx.font = 'bold 46px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, 256, 64)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

/** Constrói um único BufferGeometry com TODOS os contornos dos países (segments pares). */
function buildCountryBorderGeometry(radius: number): { geo: THREE.BufferGeometry; count: number } {
  const countries = worldCountries()
  const positions: number[] = []
  for (const country of countries) {
    for (const ring of country.rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = latLonToVec3(ring[i][0], ring[i][1], radius * 1.001)
        const b = latLonToVec3(ring[i + 1][0], ring[i + 1][1], radius * 1.001)
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
      }
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return { geo, count: positions.length / 6 }
}

interface ArcObj {
  line: THREE.Line
  packet: THREE.Mesh
  origin: THREE.Mesh
  curve: THREE.CubicBezierCurve3
  color: THREE.Color
  born: number
  fading: boolean
  fadeStart: number
}

export default function Globe3D({ events, fillParent = false }: { events: ThreatEvent[]; fillParent?: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const arcsRef = useRef<Map<string, ArcObj>>(new Map())
  const eventsRef = useRef<ThreatEvent[]>(events)

  useEffect(() => {
    eventsRef.current = events
  }, [events])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    // alias local: dentro de funções aninhadas o TS perde o narrowing do ref
    const mountEl: HTMLDivElement = mount
    const arcs = arcsRef.current

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const R = 1
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0.35, 3.05)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 1.8
    controls.maxDistance = 5
    controls.rotateSpeed = 0.5

    const globe = new THREE.Group()
    scene.add(globe)

    // esfera sólida escura (oclui as linhas de trás)
    const solid = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.985, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x1a3a68 })
    )
    globe.add(solid)

    // ── CONTORNOS DOS PAÍSES (Natural Earth 110m) ──
    const { geo: borderGeo } = buildCountryBorderGeometry(R)
    const borders = new THREE.LineSegments(
      borderGeo,
      new THREE.LineBasicMaterial({
        color: 0x8fc3f4,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      })
    )
    globe.add(borders)

    // grade de lat/lon bem sutil por baixo (estilo mapa tático)
    const gratPts: number[] = []
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 4) {
        const a = latLonToVec3(lat, lon, R * 0.999)
        const b = latLonToVec3(lat, lon + 4, R * 0.999)
        gratPts.push(a.x, a.y, a.z, b.x, b.y, b.z)
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -88; lat < 88; lat += 4) {
        const a = latLonToVec3(lat, lon, R * 0.999)
        const b = latLonToVec3(lat + 4, lon, R * 0.999)
        gratPts.push(a.x, a.y, a.z, b.x, b.y, b.z)
      }
    }
    const gratGeo = new THREE.BufferGeometry()
    gratGeo.setAttribute('position', new THREE.Float32BufferAttribute(gratPts, 3))
    const graticule = new THREE.LineSegments(
      gratGeo,
      new THREE.LineBasicMaterial({ color: 0x7cb6ec, transparent: true, opacity: 0.14, depthWrite: false })
    )
    globe.add(graticule)

    // atmosfera (halo)
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
    glow.scale.set(3.1, 3.1, 1)
    scene.add(glow)

    // campo de estrelas
    const starCount = 420
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(4 + Math.random() * 6)
      starPos.set([v.x, v.y, v.z], i * 3)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xbfe3ff, size: 0.012, transparent: true, opacity: 0.5 })
    )
    scene.add(stars)

    // marcadores fixos dos alvos brasileiros (protegidos)
    const pulseRings: { ring: THREE.Mesh; base: number }[] = []
    Object.values(TARGETS).forEach((t) => {
      const pos = latLonToVec3(t.lat, t.lon, R)
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x3fe37e })
      )
      dot.position.copy(pos)
      globe.add(dot)

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.03, 0.042, 32),
        new THREE.MeshBasicMaterial({
          color: 0x3fe37e,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        })
      )
      ring.position.copy(pos.clone().multiplyScalar(1.001))
      ring.lookAt(pos.clone().multiplyScalar(2))
      globe.add(ring)
      pulseRings.push({ ring, base: 0 })

      const label = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: makeLabelTexture(t.name), transparent: true, depthWrite: false })
      )
      label.position.copy(pos.clone().multiplyScalar(1.16))
      label.scale.set(0.52, 0.13, 1)
      globe.add(label)
    })

    // ── sincronização dos arcos de ataque com os eventos (laranja do painel) ──
    function arcColor(sev: ThreatEvent['severity']): number {
      const ORANGE_ARCS: Record<ThreatEvent['severity'], number> = {
        CRITICA: 0xff6a3c,
        ALTA: 0xff8d3c,
        MEDIA: 0xffab50,
        BAIXA: 0xffc46a,
      }
      return ORANGE_ARCS[sev] ?? 0xff8d3c
    }

    function addArc(ev: ThreatEvent) {
      const from = latLonToVec3(ev.origin.lat, ev.origin.lon, R)
      const to = latLonToVec3(ev.target.lat, ev.target.lon, R)
      const dist = from.distanceTo(to)
      const mid1 = from.clone().lerp(to, 0.35).normalize().multiplyScalar(R + dist * 0.42)
      const mid2 = from.clone().lerp(to, 0.65).normalize().multiplyScalar(R + dist * 0.42)
      const curve = new THREE.CubicBezierCurve3(from, mid1, mid2, to)

      const color = arcColor(ev.severity)
      const pts = curve.getPoints(56)
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 })
      )
      globe.add(line)

      const packet = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 8, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
      )
      globe.add(packet)

      const origin = new THREE.Mesh(
        new THREE.SphereGeometry(0.017, 10, 10),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
      )
      origin.position.copy(from)
      globe.add(origin)

      arcs.set(ev.id, { line, packet, origin, curve, color: new THREE.Color(color), born: performance.now(), fading: false, fadeStart: 0 })
    }

    function removeArc(id: string) {
      const arc = arcs.get(id)
      if (!arc) return
      globe.remove(arc.line)
      globe.remove(arc.packet)
      globe.remove(arc.origin)
      // cada mesh tem geometria + material próprios — dispose nos TRÊS
      arc.line.geometry.dispose()
      ;(arc.line.material as THREE.Material).dispose()
      arc.packet.geometry.dispose()
      ;(arc.packet.material as THREE.Material).dispose()
      arc.origin.geometry.dispose()
      ;(arc.origin.material as THREE.Material).dispose()
      arcs.delete(id)
    }

    const MAX_ARCS = 12

    // ── loop de render ──
    const t0 = performance.now()
    let raf = 0
    let disposed = false

    function resize() {
      const w = mountEl.clientWidth
      const h = mountEl.clientHeight
      // updateStyle padrão: ajusta também o style do canvas — sem isso o canvas
      // fica no tamanho em atributos (w × pixelRatio) e estoura em telas HiDPI
      renderer.setSize(w, h)
      camera.aspect = w / Math.max(h, 1)
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mountEl)

    function animate() {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      const t = (performance.now() - t0) / 1000
      const now = performance.now()

      // sincroniza eventos → arcos
      const evs = eventsRef.current
      const activeIds = new Set<string>()
      for (const ev of evs) {
        if (ev.status !== 'NEUTRALIZADO') {
          activeIds.add(ev.id)
          if (!arcs.has(ev.id)) {
            if (arcs.size < MAX_ARCS) addArc(ev)
          }
        }
      }
      for (const [id, arc] of arcs) {
        if (!activeIds.has(id) && !arc.fading) {
          arc.fading = true
          arc.fadeStart = now
        }
        if (arc.fading && now - arc.fadeStart > 900) removeArc(id)
      }

      if (!prefersReduced) globe.rotation.y = t * 0.055

      for (const pr of pulseRings) {
        pr.base = (pr.base + 0.016) % 1
        const s = 1 + pr.base * 1.8
        pr.ring.scale.set(s, s, s)
        ;(pr.ring.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - pr.base)
      }

      for (const [, arc] of arcs) {
        const age = (now - arc.born) / 1000
        const mat = arc.line.material as THREE.LineBasicMaterial
        if (arc.fading) {
          const k = Math.max(0, 1 - (now - arc.fadeStart) / 900)
          mat.opacity = 0.85 * k
          ;(arc.packet.material as THREE.MeshBasicMaterial).opacity = k
          ;(arc.origin.material as THREE.MeshBasicMaterial).opacity = 0.9 * k
        } else {
          mat.opacity = 0.6 + Math.sin(age * 6) * 0.25
        }
        if (!prefersReduced) {
          const speed = 0.5 + (arc.color.getHex() === 0xff6a3c ? 0.35 : 0)
          const tt = (age * speed) % 1
          arc.packet.position.copy(arc.curve.getPoint(tt))
          const sc = 1 + Math.sin(age * 10) * 0.2
          arc.packet.scale.setScalar(sc)
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      for (const id of Array.from(arcs.keys())) removeArc(id)
      // libera TODA a cena: geometrias, materiais e texturas (remount limpo)
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material
        if (Array.isArray(mat)) mat.forEach((m) => disposeMaterial(m))
        else if (mat) disposeMaterial(mat)
      })
      scene.clear()
      renderer.dispose()
      if (renderer.domElement.parentElement === mountEl) {
        mountEl.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={
        fillParent
          ? 'relative h-full w-full cursor-grab active:cursor-grabbing'
          : 'relative h-[340px] w-full cursor-grab active:cursor-grabbing sm:h-[420px] lg:h-[520px]'
      }
      role="img"
      aria-label="Mapa 3D global de ameaças cibernéticas em tempo real com contornos dos países"
    />
  )
}
