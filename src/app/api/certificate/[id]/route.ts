// CAPYBER — download do PDF de um certificado de conquista.
// GET /api/certificate/[id] → application/pdf (attachment).

import { NextRequest, NextResponse } from 'next/server'
import { findAwardCertificate } from '@/lib/award-certificate'
import { buildCertificatePdf } from '@/lib/certificate-pdf'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const cert = await findAwardCertificate(id)
    if (!cert) {
      return NextResponse.json({ ok: false, error: 'Certificado não encontrado.' }, { status: 404 })
    }

    let meta: Record<string, string> | null = null
    if (cert.metaJson) {
      try {
        const parsed = JSON.parse(cert.metaJson) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          meta = parsed as Record<string, string>
        }
      } catch {
        meta = null
      }
    }

    const bytes = await buildCertificatePdf({
      type: cert.type,
      holderName: cert.holderName,
      serial: cert.serial,
      verifyCode: cert.verifyCode,
      issuedAt: cert.createdAt,
      meta,
      id: cert.id,
    })

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-capyber-${cert.serial}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[certificate:GET]', err)
    return NextResponse.json({ ok: false, error: 'Erro interno ao gerar o PDF.' }, { status: 500 })
  }
}
