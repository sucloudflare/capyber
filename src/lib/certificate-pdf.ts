// CAPYBER — gerador de PDF de certificados de conquistas (livro/CTF/stealth).
// pdf-lib puro + StandardFonts (WinAnsi suporta acentos pt-BR: á é ç ã — ·).
// Sem imagens externas: emblema desenhado com primitivas (círculos + estrela).

import { LineCapStyle, PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage } from 'pdf-lib'

/* ───────────────────────── marca ───────────────────────── */

const INK = rgb(0x10 / 255, 0x31 / 255, 0x5c / 255) // #10315c
const CYAN = rgb(0x25 / 255, 0x69 / 255, 0xb8 / 255) // #2569b8
const ORANGE = rgb(0xf5 / 255, 0x92 / 255, 0x0b / 255) // #f5920b
const GREEN = rgb(0x21 / 255, 0xa4 / 255, 0x4a / 255) // #21a44a
const VIOLET = rgb(0x8b / 255, 0x5c / 255, 0xf6 / 255) // #8b5cf6
const GOLD = rgb(0xff / 255, 0xb0 / 255, 0x20 / 255) // #ffb020

const PAGE_W = 841.89 // A4 paisagem
const PAGE_H = 595.28

const TEXT_SOFT = rgb(0x33 / 255, 0x50 / 255, 0x6f / 255)
const TEXT_FAINT = rgb(0x6b / 255, 0x84 / 255, 0xa6 / 255)
const PAPER_TINT = rgb(0xfb / 255, 0xfd / 255, 0xff / 255)

/* ───────────────────────── textos por tipo ───────────────────────── */

export const CERT_TITLES: Record<string, { main: string; sub: string; feat: string }> = {
  livro: {
    main: 'Certificado de Leitura Concluída',
    sub: 'CÓDICE CAPYBER',
    feat:
      'concluiu integralmente a leitura do Códice CAPYBER, a obra de referência da Academia em defesa digital, percorrendo todos os capítulos de Blue Team, SOC e engenharia de segurança até a última página.',
  },
  ctf: {
    main: 'Certificado de Investigação',
    sub: 'CTF DO FANTASMA · CASO ENCERRADO',
    feat:
      'resolveu todas as evidências do caso "O Fantasma do Chat" e encerrou a investigação com a acusação final aceita, revelando a identidade da fantasma que logava no chat às 03:33:33.',
  },
  stealth: {
    main: 'Certificado de Operador Inrastreável',
    sub: 'OPERAÇÃO CAPIVARA SILENCIOSA',
    feat:
      'concluiu a Operação Capivara Silenciosa sem disparar um único alarme, demonstrando furtividade, disciplina e sangue-frio dignos de um operador de elite da defesa digital.',
  },
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function dataPorExtenso(d: Date): string {
  return `${d.getDate()} de ${MESES[d.getMonth()] ?? 'de ?'} de ${d.getFullYear()}`
}

/* ───────────────────────── helpers de desenho ───────────────────────── */

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(cand, size) <= maxWidth || !cur) cur = cand
    else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  opacity = 1,
): void {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: (PAGE_W - w) / 2, y, size, font, color, opacity })
}

function starPoints(cx: number, cy: number, rOut: number, rIn: number): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOut : rIn
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  pts.push(pts[0] as [number, number])
  return pts
}

function drawStar(page: PDFPage, cx: number, cy: number, rOut: number, color: ReturnType<typeof rgb>): void {
  const pts = starPoints(cx, cy, rOut, rOut * 0.4)
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i] as [number, number]
    const [x2, y2] = pts[i + 1] as [number, number]
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 1.8, color, lineCap: LineCapStyle.Round })
  }
}

/** Rubrica fictícia desenhada com curvas (drawSvgPath, coordenadas SVG y→baixo). */
function drawScrawl(page: PDFPage, x: number, y: number, color: ReturnType<typeof rgb>, variant: 1 | 2): void {
  const path =
    variant === 1
      ? 'M 0 14 C 8 -6 16 22 26 6 C 34 -6 40 18 52 8 C 62 0 68 14 84 4 C 96 -2 102 10 112 6'
      : 'M 0 10 C 10 20 14 -8 24 8 C 32 20 44 -4 56 10 C 64 18 78 0 92 8 C 104 14 112 2 120 8'
  page.drawSvgPath(path, { x, y, borderColor: color, borderWidth: 1.1, borderOpacity: 0.85 })
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

/* ───────────────────────── builder principal ───────────────────────── */

export interface CertificatePdfInput {
  type: string
  holderName: string
  serial: string
  verifyCode: string
  issuedAt: string | Date
  meta?: Record<string, string> | null
  /** id do registro — habilita a linha "Verifique em /api/certificate/<id>" */
  id?: string | null
}

export async function buildCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const { type, holderName, serial, verifyCode } = input
  const issued = input.issuedAt instanceof Date ? input.issuedAt : new Date(input.issuedAt)
  const t = CERT_TITLES[type] ?? {
    main: 'Certificado CAPYBER',
    sub: 'ACADEMIA DE DEFESA DIGITAL',
    feat: 'recebeu menção honrosa da Academia CAPYBER por desempenho excepcional em defesa digital.',
  }

  const pdf = await PDFDocument.create()
  pdf.setTitle(`CAPYBER · ${t.main}`)
  pdf.setSubject('Certificado digital de conquista — Academia CAPYBER')
  pdf.setAuthor('CAPYBER · Academia de Defesa Digital')
  pdf.setKeywords(['CAPYBER', 'certificado', 'blue team', type, serial])
  pdf.setProducer('CAPYBER Cert Engine')

  const page = pdf.addPage([PAGE_W, PAGE_H])
  const helv = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique)

  /* fundo */
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(1, 1, 1) })
  page.drawRectangle({ x: 41, y: 41, width: PAGE_W - 82, height: PAGE_H - 82, color: PAPER_TINT })

  /* bordas ornamentadas (dupla) */
  page.drawRectangle({
    x: 26, y: 26, width: PAGE_W - 52, height: PAGE_H - 52,
    borderColor: INK, borderWidth: 3,
  })
  page.drawRectangle({
    x: 34, y: 34, width: PAGE_W - 68, height: PAGE_H - 68,
    borderColor: ORANGE, borderWidth: 1.2, borderDashArray: [6, 4],
  })
  page.drawRectangle({
    x: 40, y: 40, width: PAGE_W - 80, height: PAGE_H - 80,
    borderColor: CYAN, borderWidth: 0.8,
  })

  /* faixa superior escura */
  page.drawRectangle({ x: 41, y: PAGE_H - 140, width: PAGE_W - 82, height: 99, color: INK })
  drawCentered(page, 'CAPYBER · ACADEMIA DE DEFESA DIGITAL', PAGE_H - 92, 16, bold, rgb(1, 1, 1))
  drawCentered(page, 'CERTIFICADOS DIGITAIS DE CONQUISTAS · BLUE TEAM · SOC · STEALTH', PAGE_H - 114, 8.5, helv, rgb(0.61, 0.77, 0.93))
  page.drawCircle({ x: 72, y: PAGE_H - 90.5, size: 4, color: ORANGE })
  page.drawCircle({ x: PAGE_W - 72, y: PAGE_H - 90.5, size: 4, color: GREEN })
  page.drawCircle({ x: 88, y: PAGE_H - 90.5, size: 2, color: GOLD })
  page.drawCircle({ x: PAGE_W - 88, y: PAGE_H - 90.5, size: 2, color: VIOLET })

  /* marca d'água diagonal sutil */
  page.drawText('CAPYBER', {
    x: 150, y: 150, size: 96, font: bold, color: INK, opacity: 0.05, rotate: degrees(-28),
  })

  /* emblema: círculos + estrela */
  const emblemY = 400
  page.drawCircle({ x: PAGE_W / 2, y: emblemY, size: 38, color: rgb(1, 1, 1), borderColor: ORANGE, borderWidth: 2.5 })
  page.drawCircle({ x: PAGE_W / 2, y: emblemY, size: 30, borderColor: INK, borderWidth: 1.2 })
  drawStar(page, PAGE_W / 2, emblemY + 1, 17, ORANGE)
  page.drawCircle({ x: PAGE_W / 2 - 38, y: emblemY, size: 2.4, color: CYAN })
  page.drawCircle({ x: PAGE_W / 2 + 38, y: emblemY, size: 2.4, color: CYAN })

  /* título */
  drawCentered(page, t.main, 330, 22, bold, INK)
  const subW = bold.widthOfTextAtSize(t.sub, 12)
  drawCentered(page, t.sub, 308, 12, bold, CYAN)
  page.drawLine({ start: { x: PAGE_W / 2 - subW / 2 - 96, y: 312.5 }, end: { x: PAGE_W / 2 - subW / 2 - 14, y: 312.5 }, thickness: 1, color: ORANGE })
  page.drawLine({ start: { x: PAGE_W / 2 + subW / 2 + 14, y: 312.5 }, end: { x: PAGE_W / 2 + subW / 2 + 96, y: 312.5 }, thickness: 1, color: ORANGE })

  /* certificamos que */
  drawCentered(page, 'Certificamos que', 276, 12.5, italic, TEXT_SOFT)

  /* nome em destaque + sublinhado */
  let nameSize = 27
  let nameLines = wrap(holderName, bold, nameSize, 660)
  if (nameLines.length > 2) {
    nameSize = 20
    nameLines = wrap(holderName, bold, nameSize, 660)
  }
  let nameY = 232 + (nameLines.length - 1) * 16
  for (const line of nameLines) {
    drawCentered(page, line, nameY, nameSize, bold, INK)
    const w = bold.widthOfTextAtSize(line, nameSize)
    page.drawLine({
      start: { x: (PAGE_W - w) / 2 - 28, y: nameY - 9 },
      end: { x: (PAGE_W + w) / 2 + 28, y: nameY - 9 },
      thickness: 1.6, color: ORANGE,
    })
    nameY -= nameSize + 14
  }

  /* texto do feito */
  const featLines = wrap(t.feat, helv, 11.5, 600)
  let featY = Math.min(178, nameY + 10)
  for (const line of featLines) {
    drawCentered(page, line, featY, 11.5, helv, TEXT_SOFT)
    featY -= 16
  }

  /* metadados da emissão (chips em linha) */
  if (input.meta) {
    const entries = Object.entries(input.meta).filter(([, v]) => v)
    for (let take = Math.min(4, entries.length); take >= 1; take--) {
      const line = entries
        .slice(0, take)
        .map(([k, v]) => `${k.toUpperCase()}: ${truncate(v, 30)}`)
        .join('   ·   ')
      if (helv.widthOfTextAtSize(line, 9.5) <= 620 || take === 1) {
        drawCentered(page, line, featY - 6, 9.5, bold, CYAN)
        featY -= 10
        break
      }
    }
  }

  /* data por extenso */
  drawCentered(page, `Emitido em ${dataPorExtenso(issued)}`, 132, 11, bold, INK)

  /* assinaturas */
  const sigY = 96
  const sigW = 220
  const xL = PAGE_W * 0.5 - sigW - 60
  const xR = PAGE_W * 0.5 + 60
  drawScrawl(page, xL + 40, sigY, rgb(0.23, 0.35, 0.53), 1)
  drawScrawl(page, xR + 40, sigY, rgb(0.23, 0.35, 0.53), 2)
  page.drawLine({ start: { x: xL, y: sigY - 4 }, end: { x: xL + sigW, y: sigY - 4 }, thickness: 1.2, color: INK })
  page.drawLine({ start: { x: xR, y: sigY - 4 }, end: { x: xR + sigW, y: sigY - 4 }, thickness: 1.2, color: INK })
  drawCenteredAt(page, 'Diretora VIGIA', sigY - 20, sigW, xL, 11, bold, INK)
  drawCenteredAt(page, 'Coordenação Acadêmica · CAPYBER', sigY - 34, sigW, xL, 7.5, helv, TEXT_FAINT)
  drawCenteredAt(page, 'Coordenador CAPIVARA', sigY - 20, sigW, xR, 11, bold, INK)
  drawCenteredAt(page, 'Coordenação de Operações · CAPYBER', sigY - 34, sigW, xR, 7.5, helv, TEXT_FAINT)

  /* selo central */
  const sealX = PAGE_W / 2
  const sealY = 86
  page.drawCircle({ x: sealX, y: sealY, size: 26, borderColor: INK, borderWidth: 1.5 })
  page.drawCircle({ x: sealX, y: sealY, size: 20, borderColor: ORANGE, borderWidth: 1 })
  drawStar(page, sealX, sealY + 1, 11, GREEN)

  /* rodapé: serial + verificação */
  page.drawLine({ start: { x: 70, y: 56 }, end: { x: PAGE_W - 70, y: 56 }, thickness: 0.8, color: rgb(0.79, 0.85, 0.93) })
  drawCentered(
    page,
    `Série: ${serial}   ·   Código de verificação: ${verifyCode}`,
    42,
    9,
    bold,
    TEXT_SOFT,
  )
  drawCentered(
    page,
    input.id
      ? `Verifique a autenticidade em /api/certificate/${input.id}`
      : 'Verifique a autenticidade na Academia CAPYBER com o código acima',
    29,
    8,
    helv,
    TEXT_FAINT,
  )

  return pdf.save()
}

function drawCenteredAt(
  page: PDFPage,
  text: string,
  y: number,
  boxW: number,
  boxX: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
): void {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: boxX + (boxW - w) / 2, y, size, font, color })
}
