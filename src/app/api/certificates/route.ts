// CAPYBER — emissão de certificados digitais da Trilha 3D.
// POST /api/certificates → emite certificado (valida fase e nota mínima).

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getPhase } from '@/lib/game-courses'

function publicBody(c: {
  code: string
  holderName: string
  phaseId: string
  phaseName: string
  area: string
  certRef: string
  score: number
  issuedAt: Date
  hash: string
}) {
  return {
    code: c.code,
    holderName: c.holderName,
    phaseId: c.phaseId,
    phaseName: c.phaseName,
    area: c.area,
    certRef: c.certRef,
    score: c.score,
    issuedAt: c.issuedAt,
    hash: c.hash,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      holderName?: unknown
      phaseId?: unknown
      score?: unknown
    }

    const holderName = typeof body.holderName === 'string' ? body.holderName.trim().slice(0, 60) : ''
    const phaseId = typeof body.phaseId === 'string' ? body.phaseId : ''
    const score = typeof body.score === 'number' && Number.isFinite(body.score) ? Math.floor(body.score) : -1

    if (holderName.length < 3) {
      return NextResponse.json({ error: 'Nome inválido (mínimo 3 caracteres).' }, { status: 400 })
    }

    const phase = getPhase(phaseId)
    if (!phase) {
      return NextResponse.json({ error: 'Fase desconhecida.' }, { status: 400 })
    }
    if (score < phase.passScore || score > 100) {
      return NextResponse.json(
        { error: `Nota ${score}% não é suficiente para emitir o certificado (mínimo ${phase.passScore}%).` },
        { status: 403 },
      )
    }

    // código público de verificação: CAPY-XXXX-XXXX (alfabeto sem ambíguos)
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    const raw = randomBytes(8)
    let code = 'CAPY-'
    for (let i = 0; i < 8; i++) {
      code += alphabet[raw[i] % alphabet.length]
      if (i === 3) code += '-'
    }

    // hash de integridade — permite verificar que código+nome+fase+nota batem
    const hash = createHash('sha256')
      .update(`${code}|${holderName}|${phase.id}|${score}`)
      .digest('hex')
      .slice(0, 32)

    const cert = await db.certificate.create({
      data: {
        code,
        holderName,
        phaseId: phase.id,
        phaseName: phase.name,
        area: phase.area,
        certRef: phase.certRef,
        score,
        hash,
      },
    })

    return NextResponse.json(publicBody(cert), { status: 201 })
  } catch (err) {
    console.error('[certificates:POST]', err)
    return NextResponse.json({ error: 'Erro interno ao emitir certificado.' }, { status: 500 })
  }
}
