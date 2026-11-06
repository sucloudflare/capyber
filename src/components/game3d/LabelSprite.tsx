'use client'

// CAPYBER Trilha 3D — etiquetas como sprites (CanvasTexture): sempre viradas
// para a câmera, sem portais DOM (evita Roots extras do React e é mais leve).

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, LinearFilter, SRGBColorSpace, Vector3 } from 'three'
import type { Sprite, SpriteMaterial } from 'three'

export interface LabelSpriteProps {
  title: string
  titleColor: string
  border: string
  bg?: string
  sub?: string
  y?: number
  height?: number
  /** distância (unid.) onde a placa começa a sumir / some de vez */
  fadeNear?: number
  fadeFar?: number
}

const PAD = 16

/** roundRect portável — WebView antigo (iOS 15, Android 8…) não tem ctx.roundRect */
function drawRoundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.lineTo(x + w - rr, y)
  ctx.arcTo(x + w, y, x + w, y + rr, rr)
  ctx.lineTo(x + w, y + h - rr)
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr)
  ctx.lineTo(x + rr, y + h)
  ctx.arcTo(x, y + h, x, y + h - rr, rr)
  ctx.lineTo(x, y + rr)
  ctx.arcTo(x, y, x + rr, y, rr)
  ctx.closePath()
}

export function LabelSprite({
  title,
  titleColor,
  border,
  bg = 'rgba(255,255,255,0.94)',
  sub,
  y = 4.2,
  height = 0.9,
  fadeNear = 8,
  fadeFar = 17,
}: LabelSpriteProps) {
  const spriteRef = useRef<Sprite>(null)
  const matRef = useRef<SpriteMaterial>(null)
  const tmp = useMemo(() => new Vector3(), [])

  const { tex, aspect } = useMemo(() => {
    if (typeof document === 'undefined') return { tex: null, aspect: 1 }
    try {
      const canvas = document.createElement('canvas')
      const ctx0 = canvas.getContext('2d')
      if (!ctx0) return { tex: null, aspect: 1 }

      // medição (fontes do sistema — renderiza igual em qualquer SO)
      ctx0.font = '700 30px Nunito, "Trebuchet MS", sans-serif'
      const titleW = ctx0.measureText(title).width
      ctx0.font = '600 21px Nunito, "Trebuchet MS", sans-serif'
      const subW = sub ? ctx0.measureText(sub).width : 0
      const textW = Math.max(titleW, subW)

      const w = Math.ceil(textW + PAD * 2 + (sub ? 6 : 0))
      const h = sub ? 86 : 56
      canvas.width = w * 2
      canvas.height = h * 2
      const ctx = canvas.getContext('2d')
      if (!ctx) return { tex: null, aspect: 1 }
      ctx.scale(2, 2)

      const r = h / 2
      // fundo arredondado (polyfill portável)
      drawRoundRectPath(ctx, 1, 1, w - 2, h - 2, r)
      ctx.fillStyle = bg
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = border
      ctx.stroke()

      ctx.textBaseline = 'middle'
      if (sub) {
        ctx.fillStyle = titleColor
        ctx.font = '700 30px Nunito, "Trebuchet MS", sans-serif'
        ctx.fillText(title, PAD, h * 0.34)
        ctx.fillStyle = 'rgba(39,75,115,0.85)'
        ctx.font = '600 21px Nunito, "Trebuchet MS", sans-serif'
        ctx.fillText(sub, PAD, h * 0.68)
      } else {
        ctx.fillStyle = titleColor
        ctx.font = '700 30px Nunito, "Trebuchet MS", sans-serif'
        ctx.fillText(title, PAD, h / 2)
      }

      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = LinearFilter
      texture.needsUpdate = true
      return { tex: texture, aspect: w / h }
    } catch {
      // canvas 2D indisponível/disparo inesperado: sem placa, mas sem crash
      return { tex: null, aspect: 1 }
    }
  }, [title, titleColor, border, bg, sub])

  // anti-sobreposição: some com a distância, encolhe em telas estreitas (mobile)
  // e a mais próxima desenha por cima
  useFrame(({ camera, viewport }) => {
    const sp = spriteRef.current
    const m = matRef.current
    if (!sp || !m) return
    sp.getWorldPosition(tmp)
    const d = tmp.distanceTo(camera.position)
    const k = Math.min(1, Math.max(0, (fadeFar - d) / (fadeFar - fadeNear)))
    m.opacity = k
    sp.visible = k > 0.02
    sp.renderOrder = 1000 - Math.round(d * 10)
    // mobile (aspect estreito): placa ocupa menos da tela — legível e discreta
    const compactK = viewport.aspect < 0.8 ? 0.66 : viewport.aspect < 1.1 ? 0.85 : 1
    sp.scale.set(height * aspect * compactK, height * compactK, 1)
  })

  if (!tex) return null

  return (
    <sprite ref={spriteRef} position={[0, y, 0]} scale={[height * aspect, height, 1]}>
      <spriteMaterial ref={matRef} map={tex} transparent depthWrite={false} />
    </sprite>
  )
}
