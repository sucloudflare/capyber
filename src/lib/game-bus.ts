// CAPYBER — barramento do jogo 3D: ponte mutável e leve entre a UI (DOM)
// e o canvas (react-three-fiber). Estado de input atualiza a 60fps sem
// causar re-render no React; eventos de proximidade/abertura usam listeners.

export type ShrineState = 'locked' | 'open' | 'done'

export interface InputState {
  /** eixo de movimento [-1..1] — teclado ou joystick analógico */
  x: number
  z: number
  /** joystick analógico ativo (mobile) — desliga o snap de teclado */
  analog: boolean
  /** tecla/tap de interação consumível */
  interact: boolean
}

export const gameInput: InputState = { x: 0, z: 0, analog: false, interact: false }

/** trava de jogo: UI (diálogos) pausa o movimento sem desligar o canvas */
export const gameFlags = { paused: false }

// ------------- teclado -------------

const keys = new Set<string>()

function refreshKeyboard() {
  if (gameInput.analog) return // joystick tem prioridade
  let x = 0
  let z = 0
  if (keys.has('w') || keys.has('arrowup')) z -= 1
  if (keys.has('s') || keys.has('arrowdown')) z += 1
  if (keys.has('a') || keys.has('arrowleft')) x -= 1
  if (keys.has('d') || keys.has('arrowright')) x += 1
  const len = Math.hypot(x, z)
  gameInput.x = len > 1 ? x / len : x
  gameInput.z = len > 1 ? z / len : z
}

export function attachKeyboard(): () => void {
  const down = (e: KeyboardEvent) => {
    const el = document.activeElement
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
    const k = e.key.toLowerCase()
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(k)) {
      if (k === 'e') gameInput.interact = true
      else {
        keys.add(k)
        refreshKeyboard()
      }
      e.preventDefault()
    }
  }
  const up = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    keys.delete(k)
    refreshKeyboard()
  }
  const blur = () => {
    keys.clear()
    refreshKeyboard()
  }
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', blur)
  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', blur)
  }
}

// ------------- joystick (touch) -------------

export function setJoystick(x: number, z: number) {
  gameInput.analog = true
  gameInput.x = x
  gameInput.z = z
}

export function releaseJoystick() {
  gameInput.analog = false
  gameInput.x = 0
  gameInput.z = 0
  refreshKeyboard()
}

// ------------- eventos -------------

type BusEvent =
  | { type: 'proximity'; phaseId: string | null }
  | { type: 'openPhase'; phaseId: string }
  | { type: 'toast'; message: string; tone?: 'info' | 'warn' | 'good' }

const listeners = new Set<(e: BusEvent) => void>()

export function onGameEvent(cb: (e: BusEvent) => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function emitGameEvent(e: BusEvent) {
  listeners.forEach((cb) => cb(e))
}

export function requestOpenPhase(phaseId: string) {
  emitGameEvent({ type: 'openPhase', phaseId })
}

export function requestInteract() {
  gameInput.interact = true
}
