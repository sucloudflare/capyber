// CAPYBER CTF — verificação do caso "O FANTASMA DO CHAT"
// ─────────────────────────────────────────────────────────────────────────────
// GET  → metadados do caso para o tabuleiro do detetive (SEM respostas:
//        sem answers, flagPart, reveals, eliminates) — fair play.
// POST → verificação canônica: {challengeId, answer} (challengeId 'final'
//        para a acusação final). Respostas corretas devolvem flagPart,
//        reveals e eliminates para o cliente carimbar o tabuleiro.
// Rate limit leve em memória via rateLimit()/clientIp() de src/lib/auth.ts.
// Sem banco: caso 100% estático e fictício.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { rateLimit, clientIp } from '@/lib/auth'
import {
  CASE_META,
  CHALLENGES,
  CLOSING_NARRATIVE,
  GHOST,
  SUSPECTS,
  checkAnswer,
  normalize,
} from '@/lib/ctf-content'

export async function GET(req: Request) {
  const rl = rateLimit(`ctf-get:${clientIp(req)}`, 120, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Muitas solicitações ao arquivo do caso. Respire e tente de novo.', retryInSec: rl.retryInSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryInSec) } },
    )
  }

  // Metadados públicos: nada de answers/flagPart/reveals/eliminates aqui.
  const challenges = CHALLENGES.map((c) => ({
    id: c.id,
    order: c.order,
    tag: c.tag,
    icon: c.icon,
    title: c.title,
    xp: c.xp,
    hintCost: c.hintCost,
    story: c.story,
    question: c.question,
    placeholder: c.placeholder,
    artifact: c.artifact,
    hints: c.hints,
  }))

  const suspects = SUSPECTS.map((s) => ({
    id: s.id,
    name: s.name,
    handle: s.handle,
    role: s.role,
    color: s.color,
    initials: s.initials,
    traits: s.traits,
    bio: s.bio,
  }))

  return NextResponse.json({
    ok: true,
    meta: {
      title: CASE_META.title,
      subtitle: CASE_META.subtitle,
      banner: CASE_META.banner,
      caseCode: CASE_META.caseCode,
      briefing: CASE_META.briefing,
      flagFormat: CASE_META.flagFormat,
      finalUnlockAt: CASE_META.finalUnlockAt,
      xpHintCost: CASE_META.xpHintCost,
      finalBonusXp: CASE_META.finalBonusXp,
      totalXp: CASE_META.totalXp,
      storageKey: CASE_META.storageKey,
    },
    suspects,
    challenges,
  })
}

export async function POST(req: Request) {
  const ip = clientIp(req)
  const rl = rateLimit(`ctf-post:${ip}`, 30, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Calma aí, analista: muitas tentativas seguidas. Aguarde alguns segundos.', retryInSec: rl.retryInSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryInSec) } },
    )
  }

  let body: { challengeId?: unknown; answer?: unknown; suspectId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
  const answer = typeof body.answer === 'string' ? body.answer : ''
  const suspectId = typeof body.suspectId === 'string' ? body.suspectId : ''

  if (!challengeId || !answer.trim()) {
    return NextResponse.json({ ok: false, error: 'Envie challengeId e answer.' }, { status: 400 })
  }

  /* ── acusação final ── */
  if (challengeId === 'final') {
    const correct = checkAnswer('final', answer)
    if (!correct) {
      return NextResponse.json({ ok: true, correct: false })
    }
    return NextResponse.json({
      ok: true,
      correct: true,
      ghost: {
        suspectId: GHOST.suspectId,
        name: GHOST.name,
        handle: GHOST.handle,
        fullName: GHOST.fullName,
        role: GHOST.role,
        color: GHOST.color,
        initials: GHOST.initials,
        flag: GHOST.flag,
      },
      suspectCorrect: suspectId ? normalize(suspectId) === normalize(GHOST.suspectId) : null,
      narrative: CLOSING_NARRATIVE,
      bonusXp: CASE_META.finalBonusXp,
    })
  }

  /* ── evidências 01–06 ── */
  const ch = CHALLENGES.find((c) => c.id === challengeId)
  if (!ch) {
    return NextResponse.json({ ok: false, error: 'Evidência desconhecida no dossiê.' }, { status: 404 })
  }

  if (!checkAnswer(ch.id, answer)) {
    return NextResponse.json({ ok: true, correct: false })
  }

  return NextResponse.json({
    ok: true,
    correct: true,
    id: ch.id,
    flagPart: ch.flagPart,
    reveals: ch.reveals,
    eliminates: ch.eliminates,
    xp: ch.xp,
  })
}
