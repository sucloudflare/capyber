// CAPYBER — Operador IA: triagem e decisão assistida por LLM
// Recebe o contexto do incidente, pede decisão ao modelo (Z.ai SDK) com saída
// validada por Zod e, se o modelo falhar, responde com motor determinístico.
// O motor determinístico replica exatamente as regras de um analista N1/N2:
// severidade + tipo → ação. Defesa nunca depende de rede externa.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { allowRequest, clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const ActionSchema = z.object({
  action: z.enum(['ISOLAR', 'VARREDURA', 'REVOGAR_SESSOES', 'NENHUMA']),
  deviceId: z.string().regex(/^[A-Z]{2}-\d{3}$/).optional(),
  justification: z.string().max(280),
})

const DecisionSchema = z.object({
  summary: z.string().max(400),
  confidence: z.number().min(0).max(1),
  actions: z.array(ActionSchema).max(4),
})

const InputSchema = z.object({
  event: z.object({
    id: z.string().max(40),
    title: z.string().max(120),
    kind: z.string().max(60),
    severity: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
    mitreId: z.string().max(20),
    phaseName: z.string().max(40),
    originCountry: z.string().max(40),
    targetOrg: z.string().max(80),
  }),
  devices: z
    .array(
      z.object({
        id: z.string().regex(/^[A-Z]{2}-\d{3}$/),
        status: z.enum(['SEGURO', 'ALERTA', 'ISOLADO']),
        threatScore: z.number().min(0).max(100),
      })
    )
    .max(30)
    .default([]),
})

type Decision = z.infer<typeof DecisionSchema>

/** Motor determinístico: mesma lógica de um analista — sempre disponível. */
function deterministicDecision(input: z.infer<typeof InputSchema>): Decision {
  const { event, devices } = input
  const actions: Decision['actions'] = []

  // dispositivo mais exposto: maior score que não esteja isolado
  const candidate = [...devices]
    .filter((d) => d.status !== 'ISOLADO')
    .sort((a, b) => b.threatScore - a.threatScore)[0]

  if (event.severity === 'CRITICA' && candidate) {
    actions.push({
      action: 'ISOLAR',
      deviceId: candidate.id,
      justification: `Severidade CRÍTICA em fase de ${event.phaseName}: isolar o endpoint mais exposto (${candidate.id}, score ${candidate.threatScore}) contém o movimento lateral.`,
    })
  }
  if (event.severity === 'CRITICA' || event.severity === 'ALTA') {
    actions.push({
      action: 'VARREDURA',
      justification: `Varredura preventiva na frota para caçar indicadores do ataque (${event.mitreId}) antes da próxima fase.`,
    })
    actions.push({
      action: 'REVOGAR_SESSOES',
      justification: `Revogar sessões dos endpoints em ALERTA: credenciais podem ter sido tocadas na fase de ${event.phaseName}.`,
    })
  } else {
    actions.push({
      action: 'VARREDURA',
      justification: `Severidade ${event.severity}: monitorar com varredura leve, sem interromper o time.`,
    })
  }

  const summary =
    event.severity === 'CRITICA'
      ? `Incidente CRÍTICO (${event.kind}) vindo de ${event.originCountry} contra ${event.targetOrg}. Recomendo contenção imediata: isolar o endpoint mais exposto e varrer a frota enquanto a kill chain avança (${event.phaseName}).`
      : event.severity === 'ALTA'
        ? `Incidente ALTO (${event.kind}, ${event.mitreId}) contra ${event.targetOrg}. Recomendo varredura da frota e revogação preventiva de sessões; isolamento só se a kill chain avançar para Impacto.`
        : `Incidente de severidade ${event.severity} contra ${event.targetOrg}. Monitorar com varredura leve; não interromper o time neste estágio.`

  return { summary, confidence: 0.82, actions: actions.slice(0, 3) }
}

const SYSTEM_PROMPT = `Você é o OPERADOR IA do CAPYBER, centro de defesa cibernética que protege notebooks, PCs e celulares de devs de exchanges e bancos brasileiros.

Responda SEMPRE em JSON válido com este formato exato:
{"summary": string (max 400 chars, pt-BR), "confidence": number 0-1, "actions": [{"action": "ISOLAR"|"VARREDURA"|"REVOGAR_SESSOES"|"NENHUMA", "deviceId": string opcional formato XX-000, "justification": string max 280}]}

Regras:
- Você é 100% defensivo. Nada de conteúdo ofensivo.
- Máximo 3 ações. ISOLAR só para severidade CRITICA e sempre com deviceId existente da lista fornecida.
- VARREDURA e REVOGAR_SESSOES podem ser sem deviceId (ação de frota).
- Fale como um analista sênior: direto, técnico, sem floreio.`

export async function POST(req: NextRequest) {
  try {
    // proteção: cada chamada pode acionar um LLM — limita rajadas por IP
    if (!allowRequest(`copilot:${clientIp(req)}`, { max: 30, perMs: 60_000, cost: 1 })) {
      return NextResponse.json({ error: 'Rate limit do Operador IA — aguarde alguns segundos.' }, { status: 429 })
    }

    const raw = await req.json().catch(() => null)
    const parsed = InputSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Contexto de incidente inválido', details: parsed.error.issues.slice(0, 3) },
        { status: 400 }
      )
    }
    const input = parsed.data

    // 1ª tentativa: LLM com saída validada
    try {
      const { default: ZAI } = await import('z-ai-web-dev-sdk')
      const zai = await ZAI.create()

      const userContext = JSON.stringify({
        incidente: input.event,
        dispositivos: input.devices.map((d) => ({ id: d.id, status: d.status, risco: d.threatScore })),
      })

      const completion = (await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: 'assistant' as const, content: SYSTEM_PROMPT },
            { role: 'user' as const, content: userContext },
          ],
          thinking: { type: 'disabled' },
        }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000)),
      ])) as { choices?: Array<{ message?: { content?: string } }> }

      const text = completion.choices?.[0]?.message?.content ?? ''
      // extrai o primeiro objeto JSON da resposta
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const candidate = JSON.parse(match[0]) as unknown
        const decision = DecisionSchema.safeParse(candidate)
        if (decision.success) {
          return NextResponse.json({ source: 'llm', decision: decision.data })
        }
      }
      throw new Error('saída do modelo fora do schema')
    } catch {
      // 2ª camada: motor determinístico (sempre disponível)
      const decision = deterministicDecision(input)
      return NextResponse.json({ source: 'deterministico', decision })
    }
  } catch (err) {
    console.error('[CAPYBER COPILOT] erro:', err)
    return NextResponse.json({ error: 'Erro interno do Operador IA' }, { status: 500 })
  }
}
