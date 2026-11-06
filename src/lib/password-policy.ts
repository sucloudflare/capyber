// CAPYBER — política de senha forte (FONTE ÚNICA, client-safe).
// Este módulo não importa nada de servidor (sem cookies/db/bcrypt) e pode ser
// usado no cliente (AuthGate, Central de segurança) e no servidor —
// src/lib/auth.ts apenas reexporta daqui para manter uma só implementação.

export interface PasswordCheck {
  ok: boolean
  issues: string[]
  score: number // 0–4
  label: string
}

export interface PasswordRequirement {
  id: string
  label: string
  pass: boolean
}

const SEQ_RE = /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf|zxcv)/i
const REPEAT_RE = /(.)\1{3,}/

/** Avalia a senha contra a política forte (mín. 12 + 4 classes, sem sequências). */
export function checkPassword(pw: string): PasswordCheck {
  const issues: string[] = []
  if (!pw || pw.length < 12) issues.push('Pelo menos 12 caracteres')
  if (!/[a-z]/.test(pw)) issues.push('Uma letra minúscula (a–z)')
  if (!/[A-Z]/.test(pw)) issues.push('Uma letra maiúscula (A–Z)')
  if (!/[0-9]/.test(pw)) issues.push('Um número (0–9)')
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push('Um símbolo (!@#$%…)')
  if (SEQ_RE.test(pw)) issues.push('Sem sequências óbvias (1234, abcd, qwer…)')
  if (REPEAT_RE.test(pw)) issues.push('Sem repetição de 4+ caracteres iguais')

  let score = 0
  if (pw.length >= 12) score++
  if (pw.length >= 16) score++
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length
  score += classes >= 3 ? 1 : 0
  score += classes === 4 && pw.length >= 16 ? 1 : 0
  score = Math.min(4, score)
  const labels = ['MUITO FRACA', 'FRACA', 'RAZOÁVEL', 'FORTE', 'EXCELENTE']
  return { ok: issues.length === 0, issues, score, label: labels[score] ?? 'MUITO FRACA' }
}

/** Checklist item a item para o medidor de requisitos em tempo real. */
export function passwordRequirements(pw: string): PasswordRequirement[] {
  const empty = pw.length === 0
  return [
    { id: 'len', label: 'Pelo menos 12 caracteres', pass: pw.length >= 12 },
    { id: 'upper', label: 'Uma letra maiúscula (A–Z)', pass: /[A-Z]/.test(pw) },
    { id: 'lower', label: 'Uma letra minúscula (a–z)', pass: /[a-z]/.test(pw) },
    { id: 'digit', label: 'Um número (0–9)', pass: /[0-9]/.test(pw) },
    { id: 'symbol', label: 'Um símbolo (!@#$%…)', pass: /[^A-Za-z0-9]/.test(pw) },
    { id: 'seq', label: 'Sem sequências óbvias (1234, abcd, qwer…)', pass: !empty && !SEQ_RE.test(pw) },
    { id: 'rep', label: 'Sem repetição de 4+ caracteres iguais', pass: !empty && !REPEAT_RE.test(pw) },
  ]
}

/* ─────────── gerador de senha forte (16 chars) ─────────── */

const SET_LOWER = 'abcdefghijkmnpqrstuvwxyz' // sem l/o ambíguos
const SET_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // sem I/O ambíguos
const SET_DIGIT = '23456789' // sem 0/1 ambíguos
const SET_SYMBOL = '!@#$%&*?+-='
const SET_ALL = SET_LOWER + SET_UPPER + SET_DIGIT + SET_SYMBOL

/** Inteiro aleatório uniforme em [0, max) via crypto (client e server safe). */
function randomInt(max: number): number {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (c && typeof c.getRandomValues === 'function') {
    const buf = new Uint32Array(1)
    const limit = Math.floor(0x100000000 / max) * max
    let v = 0
    do {
      c.getRandomValues(buf)
      v = buf[0]
    } while (v >= limit)
    return v % max
  }
  return Math.floor(Math.random() * max)
}

function pick(set: string): string {
  return set.charAt(randomInt(set.length))
}

function shuffle(chars: string[]): string[] {
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    const tmp = chars[i]
    chars[i] = chars[j]
    chars[j] = tmp
  }
  return chars
}

/** Sugere uma senha forte de 16 caracteres (4 classes, sem sequências). */
export function suggestPassword(length = 16): string {
  const target = Math.max(16, length)
  for (let attempt = 0; attempt < 12; attempt++) {
    const chars: string[] = [
      pick(SET_LOWER),
      pick(SET_UPPER),
      pick(SET_DIGIT),
      pick(SET_SYMBOL),
    ]
    while (chars.length < target) chars.push(pick(SET_ALL))
    const pw = shuffle(chars).join('')
    if (pw.length === target && checkPassword(pw).ok) return pw
  }
  // fallback estático (impossível na prática): 16 chars, 4 classes, sem sequência
  return 'Cq!7kR$9mZ%2pW&4'
}
