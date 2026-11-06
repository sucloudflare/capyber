// CAPYBER — verificação pública de certificados.
// GET /api/certificates/CAPY-XXXX-XXXX → JSON com os dados do certificado.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code: rawCode } = await params
    const code = decodeURIComponent(rawCode).trim().toUpperCase()

    const cert = await db.certificate.findUnique({ where: { code } })
    if (!cert) {
      return NextResponse.json(
        { valid: false, error: 'Certificado não encontrado para este código.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      valid: true,
      code: cert.code,
      holderName: cert.holderName,
      phaseId: cert.phaseId,
      phaseName: cert.phaseName,
      area: cert.area,
      certRef: cert.certRef,
      score: cert.score,
      issuedAt: cert.issuedAt,
      hash: cert.hash,
    })
  } catch (err) {
    console.error('[certificates:verify]', err)
    return NextResponse.json({ error: 'Erro interno na verificação.' }, { status: 500 })
  }
}
