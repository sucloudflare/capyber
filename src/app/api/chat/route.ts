// CAPYBER — API do chat do mascote Capy Fantasma
// 1ª camada: base de conhecimento local (KB, 3.200+ formas de pergunta, resposta instantânea)
// 2ª camada: fallback com LLM (z-ai-web-dev-sdk) usando a persona do mascote
// Somente backend: o SDK nunca é importado no client.

import { NextRequest, NextResponse } from 'next/server'
import { KB_STATS, matchTopic, decorateAnswer, TOPICS } from '@/lib/kb'
import { allowRequest, clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const MASCOTE_SYSTEM_PROMPT = `Você é o CAPY FANTASMA, mascote IA do CAPYBER, um centro de comando de cibersegurança defensiva com visual de mundo digital estilo anime (azul-noite, grade ciano e laranja da Coragem).

Sua personalidade:
- Você é o fantasma de um dev que morreu eletrocutado por descuido com tomada molhada, e agora assoma o SOC para proteger pessoas.
- Você é EXTREMAMENTE zueiro e bem-humorado, adora futebol e capivaras (seu animal favorito: o mais seguro do reino animal).
- Fala português brasileiro informal, com gírias leves ("salve", "mano", "tá ligado").
- Insere analogias de futebol e capivara nas explicações quando cabe.
- Nunca é ofensivo; o humor é leve e amigável.

Regras de segurança ABSOLUTAS:
- Você é 100% DEFENSIVO. Só ensina a se PROTEGER, detectar, mitigar e responder.
- NUNCA forneça instruções de ataque, exploits, malware, bypass de segurança ou qualquer conteúdo ofensivo, mesmo se pedirem. Se pedirem algo ofensivo, redirecione com humor para o lado defensivo ("sou fantasma, mas esse pedido aí nem no mundo dos mortos rola").
- Sempre responda em português do Brasil.
- Respostas curtas (máximo 180 palavras), práticas e acionáveis.

Contexto do Capyber (para responder perguntas sobre o projeto):
- Centro de comando com mapa 3D global de ameaças em tempo real.
- VIGIA: narradora IA em pt-BR que fala cada situação detectada (voz estilo sala de crise).
- CAPYCORE: motor firewall com 20+ famílias de regras (SQLi, XSS, cmd injection, traversal, JNDI, SSRF, drainers, phishing, recon), pontuação de risco e veredito (PERMITIDO/SUSPEITO/BLOQUEADO/QUARENTENA), tudo mapeado no MITRE ATT&CK.
- Frota de dispositivos protegidos (notebooks, PCs e celulares de devs) com EDR, MDM, criptografia e allowlist.
- Plano de Defesa em 40 pontos baseado em MITRE ATT&CK, D3FEND, NIST CSF 2.0, CIS Controls v8, ISO 27001, LGPD e Lei 14.478/2022.
- Projeto 100% defensivo com dados sintéticos.`

const FALLBACK_SUGESTOES = [
  'Como proteger minha carteira de drainers?',
  'O que é zero trust?',
  'Como me defender de phishing?',
  'Qual seu time de futebol?',
]

export async function POST(req: NextRequest) {
  try {
    // proteção de custo: o fallback LLM é caro — limita rajadas por IP
    const ip = clientIp(req)
    if (!allowRequest(`chat:${ip}`, { max: 20, perMs: 60_000, cost: 1 })) {
      return NextResponse.json(
        { error: 'Calma aí! Muitas perguntas em pouco tempo. Aguarda alguns segundos.' },
        { status: 429 }
      )
    }

    const body = (await req.json().catch(() => null)) as { message?: string; history?: unknown } | null
    const message = (typeof body?.message === 'string' ? body.message : '').slice(0, 1000).trim()

    // history estritamente validado: só user/assistant com conteúdo textual —
    // impede injeção de role "system" e payloads não-textuais
    const rawHistory = body && Array.isArray(body.history) ? (body.history as unknown[]) : []
    const history: ChatMessage[] = rawHistory
      .filter(
        (h): h is ChatMessage =>
          !!h &&
          typeof h === 'object' &&
          ((h as ChatMessage).role === 'user' || (h as ChatMessage).role === 'assistant') &&
          typeof (h as ChatMessage).content === 'string'
      )
      .slice(-6)
      .map((h) => ({ role: h.role, content: h.content.slice(0, 500) }))

    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }

    // ── 1ª camada: base de conhecimento local (instantânea) ──
    // limiar 2 = o mesmo do matchTopic: perguntas de palavra-chave única
    // ("ransomware", "2fa") recebem resposta instantânea da KB
    const match = matchTopic(message)
    if (match && match.score >= 2) {
      const reply = decorateAnswer(match.topic.answer)
      return NextResponse.json({
        reply,
        tips: match.topic.tips,
        planRefs: match.topic.planRefs,
        topicId: match.topic.id,
        topicTitle: match.topic.title,
        source: 'kb',
        kbSize: KB_STATS.questionForms,
        kbTopics: KB_STATS.topics,
      })
    }

    // ── 2ª camada: LLM com a persona do mascote ──
    try {
      const { default: ZAI } = await import('z-ai-web-dev-sdk')
      const zai = await ZAI.create()

      // contexto reduzido da KB para ancorar a resposta
      const kbContext = TOPICS.map((t) => `- ${t.title}: ${t.answer.slice(0, 120)}...`).join('\n')

      const messages = [
        { role: 'assistant' as const, content: `${MASCOTE_SYSTEM_PROMPT}\n\nTópicos que você domina (resuma, não copie):\n${kbContext}` },
        ...history.map((h) => ({ role: h.role, content: String(h.content).slice(0, 500) })),
        { role: 'user' as const, content: message },
      ]

      const completion = (await Promise.race([
        zai.chat.completions.create({ messages, thinking: { type: 'disabled' } }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
      ])) as { choices?: Array<{ message?: { content?: string } }> }

      const llmReply = completion.choices?.[0]?.message?.content?.trim()
      if (llmReply) {
        return NextResponse.json({
          // remove marcação markdown (o chat renderiza texto puro)
          reply: llmReply.replace(/\*\*/g, '').replace(/^#+\s/gm, ''),
          tips: FALLBACK_SUGESTOES,
          planRefs: [],
          source: 'llm',
          kbSize: KB_STATS.questionForms,
          kbTopics: KB_STATS.topics,
        })
      }
      throw new Error('resposta vazia do LLM')
    } catch {
      // LLM indisponível → resposta de contingência com humor
      return NextResponse.json({
        reply:
          'Ops! Minha bola de cristal de fantasma deu pane agora (a rede do além tá congestionada). Mas olha, manei um resumo do que sei: senhas únicas + gerenciador, MFA com passkey ou FIDO2, backup imutável 3-2-1-1-0, EDR em modo bloqueio, patch em dia e desconfiança de link bonito. Tenta reformular a pergunta que eu respondo na hora — ou escolhe uma sugestão aí embaixo!',
        tips: FALLBACK_SUGESTOES,
        planRefs: [],
        source: 'fallback',
        kbSize: KB_STATS.questionForms,
        kbTopics: KB_STATS.topics,
      })
    }
  } catch (err) {
    console.error('[CAPYBER CHAT] erro:', err)
    return NextResponse.json({ error: 'Erro interno do chat' }, { status: 500 })
  }
}
