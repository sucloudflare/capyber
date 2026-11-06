// CAPYBER — PDF do certificado digital da Trilha 3D.
// GET /api/certificates/:code/pdf → PDF A4 paisagem gerado com pdf-lib.

import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import { db } from '@/lib/db'

const GOLD = rgb(0.79, 0.64, 0.29)
const GOLD_SOFT = rgb(0.92, 0.84, 0.6)
const INK = rgb(0.06, 0.19, 0.36)
const BLUE = rgb(0.15, 0.41, 0.72)
const GREEN = rgb(0.13, 0.64, 0.29)
const DIM = rgb(0.33, 0.44, 0.56)

function drawGhost(page: PDFPage, x: number, y: number, scale: number) {
  // fantasmagoria do mascote: cúpula + barra ondulada (SVG path, origem topo-esquerda)
  const path =
    'M 0 44 C 0 19.6 10.7 0 24 0 C 37.3 0 48 19.6 48 44 ' +
    'L 48 66 L 40 60 L 32 66 L 24 60 L 16 66 L 8 60 L 0 66 Z'
  page.drawSvgPath(path, {
    x,
    y,
    scale,
    borderColor: GREEN,
    borderWidth: 2.2,
    color: rgb(1, 1, 1),
  })
  // olhos
  page.drawCircle({ x: x + 17 * scale, y: y - 34 * scale, size: 3.1 * scale, color: INK })
  page.drawCircle({ x: x + 31 * scale, y: y - 34 * scale, size: 3.1 * scale, color: INK })
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code: rawCode } = await params
    const code = decodeURIComponent(rawCode).trim().toUpperCase()

    const cert = await db.certificate.findUnique({ where: { code } })
    if (!cert) {
      return NextResponse.json({ error: 'Certificado não encontrado.' }, { status: 404 })
    }

    const pdf = await PDFDocument.create()
    pdf.setTitle(`Certificado CAPYBER — ${cert.area}`)
    pdf.setSubject('Certificado digital da Trilha 3D CAPYBER')
    pdf.setKeywords(['CAPYBER', 'Blue Team', 'certificado', cert.code])

    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

    // A4 paisagem
    const W = 842
    const H = 595
    const page = pdf.addPage([W, H])

    // fundo suave
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.98, 0.99, 1) })
    page.drawRectangle({
      x: 0,
      y: 0,
      width: W,
      height: 120,
      color: rgb(0.91, 0.95, 1),
      opacity: 0.6,
    })

    // moldura dupla
    page.drawRectangle({
      x: 22,
      y: 22,
      width: W - 44,
      height: H - 44,
      borderColor: GOLD,
      borderWidth: 3,
    })
    page.drawRectangle({
      x: 30,
      y: 30,
      width: W - 60,
      height: H - 60,
      borderColor: GOLD_SOFT,
      borderWidth: 1.2,
    })

    // cabeçalho
    drawGhost(page, 58, H - 52, 0.9)
    page.drawText('CAPYBER', {
      x: 118,
      y: H - 78,
      size: 26,
      font: bold,
      color: BLUE,
    })
    page.drawText('SOC · Trilha 3D · Vale dos Fantasmas', {
      x: 118,
      y: H - 96,
      size: 11,
      font,
      color: DIM,
    })
    const headTitle = 'CERTIFICADO DIGITAL DE CONHECIMENTO'
    page.drawText(headTitle, {
      x: W - 52 - bold.widthOfTextAtSize(headTitle, 15),
      y: H - 78,
      size: 15,
      font: bold,
      color: GOLD,
    })

    // corpo
    page.drawText('Certificamos que', {
      x: W / 2 - 58,
      y: H - 165,
      size: 16,
      font,
      color: DIM,
    })

    const nameSize = cert.holderName.length > 34 ? 28 : 34
    const nameW = bold.widthOfTextAtSize(cert.holderName, nameSize)
    page.drawText(cert.holderName, {
      x: (W - nameW) / 2,
      y: H - 208,
      size: nameSize,
      font: bold,
      color: INK,
    })
    // linha sob o nome
    page.drawLine({
      start: { x: W / 2 - 200, y: H - 220 },
      end: { x: W / 2 + 200, y: H - 220 },
      thickness: 1.4,
      color: GOLD,
    })

    page.drawText(
      `concluiu com aprovação a fase "${cert.phaseName}" da Trilha 3D,`,
      { x: W / 2 - 190, y: H - 252, size: 14, font, color: INK },
    )
    page.drawText(`com nota ${cert.score}% na prova de certificação.`, {
      x: W / 2 - 155,
      y: H - 272,
      size: 14,
      font,
      color: INK,
    })

    // área de conhecimento
    const areaSize = 22
    const areaW = bold.widthOfTextAtSize(cert.area, areaSize)
    page.drawRectangle({
      x: (W - areaW) / 2 - 22,
      y: H - 330,
      width: areaW + 44,
      height: 38,
      color: rgb(1, 0.965, 0.9),
      borderColor: GOLD,
      borderWidth: 1.4,
    })
    page.drawText(cert.area, {
      x: (W - areaW) / 2,
      y: H - 317,
      size: areaSize,
      font: bold,
      color: rgb(0.55, 0.34, 0.02),
    })

    // referências de certificação
    const refLines = wrap(`Fundamentação técnica: ${cert.certRef}`, font, 11, 520)
    refLines.forEach((l, i) => {
      const lw = font.widthOfTextAtSize(l, 11)
      page.drawText(l, { x: (W - lw) / 2, y: H - 360 - i * 15, size: 11, font, color: DIM })
    })

    // selo
    page.drawCircle({
      x: W - 130,
      y: 120,
      size: 44,
      color: rgb(1, 0.97, 0.88),
      borderColor: GOLD,
      borderWidth: 2.4,
    })
    page.drawCircle({ x: W - 130, y: 120, size: 37, borderColor: GOLD_SOFT, borderWidth: 1 })
    page.drawText('CAPY', { x: W - 146, y: 126, size: 13, font: bold, color: GOLD })
    page.drawText('BER', { x: W - 144, y: 110, size: 13, font: bold, color: GOLD })

    // assinatura fictícia da narradora VIGIA
    page.drawText('VIGIA', { x: 110, y: 130, size: 16, font: bold, color: INK })
    page.drawLine({
      start: { x: 90, y: 124 },
      end: { x: 210, y: 124 },
      thickness: 1,
      color: DIM,
    })
    page.drawText('Narradora do SOC · CAPYBER', {
      x: 90,
      y: 108,
      size: 10,
      font,
      color: DIM,
    })

    // rodapé de verificação
    const issued = new Date(cert.issuedAt)
    const dateBR = issued.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    const verifyUrl = `${req.nextUrl.origin}/api/certificates/${cert.code}`

    page.drawLine({
      start: { x: 60, y: 82 },
      end: { x: W - 60, y: 82 },
      thickness: 0.8,
      color: GOLD_SOFT,
    })

    const footerSize = 10
    page.drawText(`Emitido em ${dateBR} · Documento gerado digitalmente pelo motor CAPYBER`, {
      x: 60,
      y: 62,
      size: footerSize,
      font,
      color: DIM,
    })
    page.drawText(`Código de verificação: ${cert.code}`, {
      x: 60,
      y: 47,
      size: footerSize,
      font: bold,
      color: BLUE,
    })
    page.drawText(`Verificar em: ${verifyUrl}`, {
      x: 60,
      y: 33,
      size: footerSize,
      font,
      color: BLUE,
      // link
    })
    page.drawText(`Integridade: ${cert.hash}`, {
      x: 60,
      y: 19,
      size: 8.4,
      font,
      color: DIM,
    })

    const bytes = await pdf.save()

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-capyber-${cert.code}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[certificates:pdf]', err)
    return NextResponse.json({ error: 'Erro ao gerar o PDF.' }, { status: 500 })
  }
}
