'use client'

/**
 * ScrollView — pergaminho 3D horizontal sobre Engenharia Social (pt-BR).
 * Componente autônomo: sem imagens externas, sem dependências extras,
 * apenas Tailwind + estilos inline + CSS 3D (perspective / rotateY).
 */

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Bookmark, Maximize2, Minimize2, RotateCcw, ScrollText } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Constantes e dados                                                  */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'capy_scroll_progress_v1'

const clamp = (v: number): number => Math.min(100, Math.max(0, v))

type Section = {
  title: string
  paras: string[]
  steps?: string[]
  tips: string[]
}

const SECTIONS: Section[] = [
  {
    title: 'Psicologia da manipulação (Cialdini)',
    paras: [
      'A engenharia social não explora falhas de software, e sim atalhos do pensamento humano. Robert Cialdini catalogou os gatilhos mais abusados: autoridade (o “chefe”, o “banco”, o “técnico da TI”), prova social (“todo o setor já confirmou os dados”), escassez e urgência (“faltam 30 minutos para o bloqueio”), reciprocidade (um favor pequeno que justifica outro maior) e compromisso com a coerência (a vítima confirma um detalhe e depois se prende a ele).',
      'Mensagens maliciosas são projetadas para manter o alvo no Sistema 1 — o modo rápido e emocional — antes que o Sistema 2, analítico, entre em ação. Medo (conta bloqueada), ganância (reembolso esquecido), curiosidade (demissão em anexo) e dever (pedido do diretor) elevam a adrenalina e rebaixam o ceticismo; o prazo curto é deliberado, porque a pausa é a inimiga do golpe.',
      'A contramedida é treinável: pausa deliberada diante de urgência, verificação por um segundo canal escolhido por você e a regra de ouro de que nenhuma instituição legítima apressa alguém para pedir senha, código de verificação ou pagamento imediato.',
    ],
    tips: [
      'Desconfie por padrão de urgência, sigilo e ameaça de perda.',
      'Confirme pedidos sensíveis por um canal que você escolheu (ramal ou número conhecido).',
      'Autoridade se valida por processo oficial, não por assinatura de e-mail.',
      'Texto impecável não é sinal de legitimidade: IA generativa escreve sem erros.',
      'Nenhuma instituição séria pede senha, código MFA ou acesso remoto não solicitado.',
    ],
  },
  {
    title: 'Phishing',
    paras: [
      'Phishing é a fraude por mensagem eletrônica que imita uma organização confiável para roubar credenciais ou entregar malware. Os truques clássicos seguem eficazes: display name forjado (“Banco Seguro” sobre um domínio qualquer), typosquatting e homoglifos (rnbank.com no lugar de rmbank.com), subdomínios enganosos (seguro-login.banco-ch.com) e o texto do link que não bate com o destino real no href.',
      'A infraestrutura evoluiu: kits de phishing hospedados em serviços legítimos (Google Sites, Forms, encurtadores), páginas com certificado TLS válido — o cadeado não prova idoneidade — e proxies reversos como Evilginx, que intermediam o login, capturam o cookie de sessão e burlam até o MFA por código. Anexos perigosos vão de planilhas com macros a arquivos HTML/HTA e imagens de disco.',
      'Na defesa, a autenticação de domínio (SPF, DKIM e DMARC em p=reject) reduz o spoofing direto; gateways reescrevem URLs e sandboxes analisam anexos — mas a última linha continua sendo o usuário que inspeciona antes de clicar.',
    ],
    tips: [
      'Passe o mouse (ou segure no celular) sobre o link e leia o destino real.',
      'Desconfie de remetente com nome bonito e domínio que não confere.',
      'Não abra anexos inesperados; valide com o remetente por outro canal.',
      'Acesse sites digitando o endereço ou pelo app oficial, nunca pelo link recebido.',
      'Use o botão “Reportar phishing” do cliente de e-mail — isso alimenta os filtros.',
    ],
  },
  {
    title: 'Vishing, smishing e quishing (QR)',
    paras: [
      'Vishing é o phishing por voz: com VoIP barato e spoofing do número de origem, golpistas se passam por banco, suporte de TI ou transportadora e criam uma crise — compra suspeita, boleto vencido, “detectamos um ataque na sua conta” — que exige ação imediata. Com IA, sotaque, fluidez e até a voz de um conhecido são reproduzíveis em tempo real.',
      'Smishing chega por SMS e apps de mensagem com links curtos: falso boleto, multa, “sua encomenda está retida”. Quishing usa QR codes — adesivos colados sobre os originais em estacionamentos, cardápios e terminais redirecionam para páginas de roubo de credenciais. O QR tem duas vantagens para o atacante: não é inspecionável de longe e costuma escapar de filtros que analisam apenas texto e URL do e-mail.',
      'A verificação de retorno (callback) para o número oficial conhecido derruba praticamente todos esses golpes, porque interrompe o canal imposto pelo atacante.',
    ],
    tips: [
      'Desligue e ligue você mesmo para o número oficial antes de qualquer confirmação.',
      'Digite endereços manualmente; não siga links de SMS e mensagens.',
      'Antes de escanear um QR público, confira se há adesivo sobreposto.',
      'Não informe códigos recebidos por SMS para quem te ligou.',
      'Trate todo “suporte” que liga por conta própria como suspeito até provar o contrário.',
    ],
  },
  {
    title: 'Pretexting',
    paras: [
      'No pretexting, o atacante constrói um cenário e uma persona: auditor externo em diligência, funcionário novo sem acesso, técnico do fornecedor, recrutador, jornalista. A história é alimentada por OSINT — LinkedIn, sites institucionais, crachás visíveis em fotos de eventos, dados expostos em vazamentos — o suficiente para soar específica e verificável.',
      'Os alvos típicos são o help desk (redefinição de senha e reemissão de MFA: “perdi o celular na viagem”), o RH (dados pessoais de colaboradores), o financeiro (dados bancários de fornecedores) e a recepção (entrada física). Raramente é um contato único: é uma cadeia de pequenas confirmações que legitimam a pergunta seguinte.',
      'A defesa é processual: verificação fora de banda com informações que não são públicas, perguntas de calibração, dupla aprovação para reset de credenciais e uma cultura em que recusar e reverificar é comportamento correto, nunca grosseria.',
    ],
    tips: [
      'Help desk autentica por processo formal, não por dados acháveis no LinkedIn.',
      'Reemissão de MFA exige duas fontes de verificação e registro em log.',
      'Reduza detalhes de estrutura e de pessoas em redes sociais corporativas.',
      'Recepção e portaria confirmam toda visita com o anfitrião, por dentro.',
      'Reporte tentativas: um pretexting mapeado protege o time inteiro.',
    ],
  },
  {
    title: 'Baiting e tailgating',
    paras: [
      'Baiting explora curiosidade e ganância: pen drives “perdidos” no estacionamento ou no saguão, cabos USB com hardware malicioso embutido, softwares pagos “de graça” em espelhos de download, currículos com payload e prêmios que só são resgatados informando o login corporativo. A mídia é infectada de propósito: o golpe começa quando a vítima conecta.',
      'Tailgating (ou piggybacking) é o ataque físico de entrar colado em alguém legítimo: o “entregador” com caixas nos braços, o “técnico do ar-condicionado” com prancheta, o crachá comprado em leilão online. Dentro, o objetivo é concreto: estação desbloqueada, sala de servidores, porta de rack, um dispositivo plantado na rede.',
      'Controles físicos completam a cadeia que o digital não cobre: torniquetes e salas mantrap, escolta obrigatória de visitantes, crachá sempre visível, tela bloqueada ao se levantar (Win+L) e mesa limpa ao fim do dia.',
    ],
    tips: [
      'Nunca conecte mídia encontrada: entregue à TI/Segurança.',
      'Não segure portas para desconhecidos; indique a recepção com educação.',
      'Desconfie de prêmios e resgates que pedem login corporativo.',
      'Bloqueie a tela sempre que se ausentar, mesmo por um minuto.',
      'Reporte pessoas sem crachá visível — a segurança confirma, sem drama.',
    ],
  },
  {
    title: 'BEC: fraude ao e-mail corporativo',
    paras: [
      'O Business Email Compromise é a categoria mais lucrativa do cibercrime segundo o FBI/IC3 — bilhões de dólares de prejuízo por ano — e funciona sem malware: apenas e-mail, paciência e engano. O atacante obtém acesso a uma caixa (phishing de credenciais, infostealer, mercado negro), lê conversas por semanas e entra no momento exato, com a voz certa.',
      'Variantes clássicas: a fraude do CEO (o “diretor” pede transferência urgente e confidencial, ou gift cards), a fraude de fornecedor (fatura verdadeira com a conta bancária trocada minutos antes do pagamento) e a “conta do advogado” em negociações sigilosas. Persistência comum: regras de caixa que desviam respostas para uma pasta oculta ou encaminham mensagens com palavras-chave financeiras.',
      'A assinatura do BEC é uma trindade: urgência + confidencialidade + mudança de dados bancários. Pedido que combina os três merece verificação fora de banda obrigatória — telefonema para o número já conhecido, nunca para o que chegou no e-mail.',
    ],
    tips: [
      'Confirme troca de conta bancária por telefone, em número já conhecido.',
      'Dupla aprovação obrigatória para pagamentos e alterações de dados de pagamento.',
      'Monitore regras de encaminhamento e logins impossíveis (país, horário).',
      'Desconfie de endereços com uma letra alterada e de threads reaproveitadas.',
      'Se pagou: acione o banco imediatamente para recall e registre boletim de ocorrência.',
    ],
  },
  {
    title: 'MFA fatigue e prompt bombing',
    paras: [
      'Quando o atacante já tem a senha — roubada em phishing, credential stuffing ou infostealers — o segundo fator vira o alvo. No prompt bombing (MFA fatigue), notificações push são disparadas sem parar até a vítima aprovar: por exaustão, por medo de que algo quebre, ou de madrugada, quase dormindo. Foi o padrão dos ataques à Uber (2022), Twilio e Cisco: push aceito seguido de chamada de “TI” para o código final.',
      'As defesas modernas atacam a raiz: number matching (o push exibe um número que precisa ser digitado no telefone), limites e bloqueio após negações repetidas, verificação de contexto (geografia, dispositivo, horário) e, acima de tudo, a migração para passkeys (FIDO2/WebAuthn), atreladas ao domínio do serviço e, por desenho, imunes a phishing.',
    ],
    tips: [
      'Push inesperado: negue e reporte — significa que sua senha vazou.',
      'Nunca aprove um prompt para “fazer parar”; troque a senha imediatamente.',
      'Prefira passkeys ou chave física; SMS e voz são os mais frágeis (SIM swap).',
      'Chamada de “TI” logo após uma negação é o passo dois do ataque.',
      'Ative alertas de novo dispositivo e revise sessões periodicamente.',
    ],
  },
  {
    title: 'Deepfakes e IA generativa',
    paras: [
      'A IA generativa industrializou o engano: clonagem de voz com poucos segundos de áudio público (palestras, lives, entrevistas), vídeo sintético até em tempo real (entrevistas de emprego, reuniões), e-mails no tom exato da empresa escritos a partir de material vazado e perfis sociais falsos que sustentam a encenação.',
      'O marco do risco foi o caso Arup (2024): cerca de US$ 25 milhões transferidos em Hong Kong após uma videochamada em que o CFO e todos os colegas eram deepfakes. A lição é dura: detectar artefatos (piscadas, sombras, timbre) perde valor a cada modelo novo — a confiança precisa migrar da percepção para a verificação de canal.',
      'Contramedidas: tratar voz e vídeo como não-prova para decisões financeiras, palavras-código combinadas fora dos canais digitais, desafios dinâmicos que só a pessoa real responderia e dupla verificação fora de banda para qualquer pedido urgente de dinheiro.',
    ],
    tips: [
      'Combine palavras-código com a família e com o time para pedidos urgentes.',
      'Voz e vídeo não autenticam ninguém: trate como alegação, não como prova.',
      'Pedido de dinheiro ou acesso em call? Retorne pelo canal oficial antes de agir.',
      'Reduza o material executivo público (áudio/vídeo) disponível para clonagem.',
      'Inclua deepfakes nas simulações para calibrar a desconfiança do time.',
    ],
  },
  {
    title: 'Defesa e awareness',
    paras: [
      'Programa de awareness eficaz se mede em comportamento, não em horas de treinamento. Simulações de phishing frequentes e progressivas — do genérico ao spear phishing realista — com feedback imediato no momento do clique (o teachable moment) ensinam mais que uma palestra anual. Punição é contraproducente: ensina a esconder o erro e mata o autorreporte.',
      'A métrica mais importante é a taxa de reporte e o tempo até reportar — não a taxa de cliques: um usuário que clica e avisa em dois minutos vira sensor humano, derrubando a detecção de dias para minutos. Facilite com botão de reporte em um clique, triagem rápida pelo SOC e resposta de volta (“era phishing, bom olho!”); recompensa é o que sustenta o hábito.',
      'Awareness é uma camada entre outras: MFA resistente a phishing em tudo, DMARC em p=reject, EDR, menor privilégio, segmentação e patching em dia. O fator humano não é o elo fraco a eliminar — é um sensor a treinar e a instrumentar.',
    ],
    tips: [
      'Simule sem punir: punição ensina a ocultar, não a proteger.',
      'Reportar rápido vale mais do que não clicar.',
      'Um clique para reportar, feedback sempre: reduza o atrito.',
      'Meça tempo até reportar e taxa de reporte; comemore a evolução.',
      'Treine no momento do clique, não no dia anual de conscientização.',
    ],
  },
  {
    title: 'Resposta a incidente de phishing',
    paras: [
      'Velocidade importa mais que perfeição: o dano de um phishing é proporcional ao tempo de permanência do atacante. O roteiro abaixo serve para o usuário e para o SOC, e parte de uma premissa cultural: quem reporta primeiro nunca é punido.',
      'Enquanto o usuário executa os passos 1 a 4, o SOC paraleliza: busca os indicadores (IOCs), purga a mensagem das caixas, confere regras de encaminhamento e logins anômalos de todos os destinatários. Phishing raramente chega a uma só pessoa — cada reporte revela a campanha inteira.',
    ],
    steps: [
      'Não interaja de novo: não clique para “confirmar”, não responda, não teste o link por conta própria.',
      'Reporte imediatamente pelo botão de phishing ou help desk, anexando a mensagem original — os headers permitem bloquear o domínio e achar outras vítimas.',
      'Se clicou e digitou credenciais: troque a senha a partir de uma máquina limpa e repita em qualquer serviço onde ela se repetia.',
      'Revogue sessões e tokens: logout forçado em todos os dispositivos, refresh tokens invalidados, senhas de aplicativo removidas.',
      'Verifique persistência na caixa: regras de encaminhamento, filtros com palavras-chave financeiras, dispositivos e aliases adicionados pelo atacante.',
      'Contenha: busque a mesma mensagem em todas as caixas e remova (purge); bloqueie domínios, URLs e hashes nos gateways, no proxy e no EDR.',
      'Se houve pagamento: acione o banco imediatamente para tentativa de recall, registre boletim de ocorrência e notifique as autoridades (IC3 nos EUA; delegacia e CERT.br no Brasil).',
      'Aprenda: preserve evidências, monte a linha do tempo, atualize filtros e regras e converta o caso em simulação — sem culpar quem clicou.',
    ],
    tips: [
      'Minutos importam: reporte primeiro, analise depois.',
      'Preserve evidências (headers e anexos) antes de limpar as caixas.',
      'Nunca puna o primeiro a reportar — punição cria silêncio.',
      'Feche o ciclo dando retorno a quem reportou.',
    ],
  },
]

/* Texturas (apenas gradientes CSS, sem imagens externas) */

const PAPER_BG = [
  'radial-gradient(ellipse 60% 45% at 18% 10%, rgba(146,99,36,0.10), transparent 60%)',
  'radial-gradient(ellipse 55% 40% at 84% 88%, rgba(122,76,26,0.13), transparent 62%)',
  'radial-gradient(circle at 13% 84%, transparent 46px, rgba(112,70,20,0.11) 47px 53px, transparent 54px)',
  'radial-gradient(circle at 89% 18%, transparent 26px, rgba(112,70,20,0.09) 27px 32px, transparent 33px)',
  'repeating-linear-gradient(0deg, rgba(61,47,30,0.03) 0 1px, transparent 1px 3px)',
  'repeating-linear-gradient(90deg, rgba(61,47,30,0.026) 0 1px, transparent 1px 4px)',
  'repeating-linear-gradient(90deg, rgba(82,54,22,0.05) 0 12px, transparent 12px 56px)',
  'linear-gradient(165deg, #f6eedd 0%, #f3e9cf 38%, #e9dab4 72%, #dcc99e 100%)',
].join(', ')

const WOOD_GRAD =
  'linear-gradient(to bottom, #a4743f 0%, #7a5230 26%, #5b3a1e 54%, #42280f 78%, #2e1c0d 100%)'

const ROD_GRAIN =
  'repeating-linear-gradient(to bottom, rgba(0,0,0,0.20) 0 2px, rgba(255,228,188,0.05) 2px 4px, transparent 4px 11px)'

const KNOB_GRAD = 'radial-gradient(circle at 35% 30%, #bb8a52 0%, #6b4423 55%, #2e1c0d 100%)'

const PAPER_SHADOW =
  '0 24px 55px rgba(0,0,0,0.55), 0 5px 14px rgba(0,0,0,0.4), inset 0 0 42px rgba(96,60,18,0.30), inset 0 0 120px rgba(70,40,10,0.16)'

const ROD_SHADOW =
  '0 12px 26px rgba(0,0,0,0.55), inset 0 2px 3px rgba(255,236,200,0.40), inset 0 -6px 10px rgba(0,0,0,0.55)'

const KNOB_SHADOW = '0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,236,200,0.35)'

const BTN_CLASS =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[#7a5230] to-[#54351b] px-3 text-sm font-semibold text-[#f7ead0] shadow-md transition hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d9b0]'

const BODY_P = 'mt-2.5 text-[13px] leading-relaxed text-[#3d2f1e] sm:text-sm'

const DROP_CAP_P =
  'mt-3 text-[13px] leading-relaxed text-[#3d2f1e] sm:text-sm first-letter:float-left first-letter:mr-1.5 first-letter:mt-1 first-letter:font-serif first-letter:text-[42px] first-letter:font-bold first-letter:leading-[0.8] first-letter:text-[#8c2f2f]'

/* ------------------------------------------------------------------ */
/* Hooks e subcomponentes internos                                     */
/* ------------------------------------------------------------------ */

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (): void => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

function Separator(): JSX.Element {
  return (
    <div
      aria-hidden
      className="grid h-full w-7 flex-none select-none place-items-center bg-[#5b4632]/5 sm:w-9"
    >
      <span className="rotate-90 whitespace-nowrap font-serif text-xs tracking-[0.45em] text-[#8c2f2f]/70">
        —✦—
      </span>
    </div>
  )
}

function CoverColumn(): JSX.Element {
  return (
    <section
      aria-label="Capa"
      className="flex h-full w-[min(84vw,430px)] flex-none select-text flex-col items-center justify-center px-6 text-center"
    >
      <span aria-hidden className="font-serif text-3xl text-[#8c2f2f]">
        ❦
      </span>
      <h3 className="mt-4 font-serif text-2xl font-bold tracking-wide text-[#3d2f1e] sm:text-4xl">
        Engenharia Social
      </h3>
      <p className="mt-2 max-w-[26ch] font-serif text-sm italic text-[#5b4632] sm:text-base">
        A arte da manipulação humana e as defesas do reino digital
      </p>
      <div
        aria-hidden
        className="mt-5 h-px w-28 bg-gradient-to-r from-transparent via-[#8c2f2f]/60 to-transparent"
      />
      <p className="mt-4 text-xs text-[#5b4632] sm:text-sm">
        Compilado pela Ordem de <span className="font-bold text-[#8c2f2f]">CAPYBER</span> · Anno
        MMXXV
      </p>
      <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#8c2f2f]/80">
        Desenrole para ler ⟶
      </p>
    </section>
  )
}

function EndColumn(): JSX.Element {
  return (
    <section
      aria-label="Fim do pergaminho"
      className="flex h-full w-[min(70vw,320px)] flex-none select-text flex-col items-center justify-center px-6 text-center"
    >
      <span aria-hidden className="font-serif text-3xl text-[#8c2f2f]">
        ❦
      </span>
      <p className="mt-3 font-serif text-sm italic text-[#5b4632] sm:text-base">
        Fim do pergaminho — pratique o ceticismo verificado.
      </p>
      <div aria-hidden className="mt-5 h-px w-24 bg-[#5b4632]/30" />
      <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-[#8c2f2f]">CAPYBER · MMXXV</p>
    </section>
  )
}

function SectionColumn({ section, index }: { section: Section; index: number }): JSX.Element {
  return (
    <section
      data-column="true"
      aria-label={`Seção ${index + 1}: ${section.title}`}
      className="cap-card-hover h-full w-[min(84vw,430px)] flex-none select-text overflow-y-auto overscroll-contain px-5 py-4 sm:px-7 sm:py-5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#5b4632]/35 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(91,70,50,0.45) transparent' }}
    >
      <h3 className="font-serif text-lg font-bold leading-snug text-[#3d2f1e] sm:text-xl">
        <span aria-hidden className="mr-1.5 text-[#8c2f2f]">
          §{index + 1}.
        </span>
        {section.title}
      </h3>
      <div
        aria-hidden
        className="mt-1.5 h-px w-full bg-gradient-to-r from-[#8c2f2f]/50 via-[#5b4632]/25 to-transparent"
      />
      {section.paras.map((p, j) => (
        <p key={j} className={j === 0 ? DROP_CAP_P : BODY_P}>
          {p}
        </p>
      ))}
      {section.steps ? (
        <div className="mt-3">
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c2f2f]">
            Passo a passo
          </p>
          <ol className="mt-1.5 space-y-1.5">
            {section.steps.map((s, k) => (
              <li key={k} className="flex gap-2 text-[12.5px] leading-snug text-[#3d2f1e] sm:text-[13px]">
                <span
                  aria-hidden
                  className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#8c2f2f] text-[10px] font-bold text-[#f3e9cf]"
                >
                  {k + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <p className="mt-3 font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c2f2f]">
        Dicas do pergaminho
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {section.tips.map((t, k) => (
          <li key={k} className="flex gap-2 text-[12.5px] leading-snug text-[#5b4632] sm:text-[13px]">
            <span aria-hidden className="mt-[2px] shrink-0 text-[#8c2f2f]">
              ✦
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Roller({ side, angle, reduced }: { side: 'left' | 'right'; angle: number; reduced: boolean }): JSX.Element {
  const isLeft = side === 'left'
  const sideStyle: CSSProperties = isLeft ? { left: 0 } : { right: 0 }
  const knobSide: CSSProperties = isLeft ? { left: '-0.55rem' } : { right: '-0.55rem' }
  return (
    <div
      aria-hidden
      className="absolute top-1/2 z-20 h-[108%] w-8 sm:w-10"
      style={{
        ...sideStyle,
        transform: `translateY(-50%) translateX(${isLeft ? '-38%' : '38%'})`,
      }}
    >
      <div
        className="relative h-full w-full rounded-[8px]"
        style={{ background: WOOD_GRAD, boxShadow: ROD_SHADOW }}
      >
        {/* grão do madeiro deslizando = sensação de rotação */}
        <div
          className="absolute inset-0 rounded-[8px] opacity-60"
          style={{ backgroundImage: ROD_GRAIN, backgroundPositionY: `${angle}px` }}
        />
        <div className="absolute inset-x-[15%] top-[6%] h-[14%] rounded-full bg-white/10 blur-[2px]" />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full sm:h-6 sm:w-6"
          style={{ ...knobSide, background: KNOB_GRAD, boxShadow: KNOB_SHADOW }}
        >
          <div
            className="absolute inset-[4px] rounded-full border border-[#2e1c0d]/70"
            style={{
              transform: `rotate(${angle}deg)`,
              transition: reduced ? undefined : 'transform 150ms linear',
            }}
          >
            <div className="absolute left-1/2 top-0 h-1/2 w-px -translate-x-1/2 bg-[#2e1c0d]/80" />
          </div>
        </div>
      </div>
    </div>
  )
}

function WaxSeal(): JSX.Element {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-2 right-8 z-30 h-14 w-14 sm:h-16 sm:w-16"
      style={{ transform: 'rotate(-9deg)' }}
    >
      <div
        className="grid h-full w-full place-items-center"
        style={{
          background:
            'radial-gradient(circle at 34% 30%, #c0564c 0%, #8c2f2f 45%, #6b2020 78%, #4d1414 100%)',
          borderRadius: '47% 53% 51% 49% / 52% 48% 55% 45%',
          boxShadow:
            '0 6px 14px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,205,185,0.4), inset 0 -5px 9px rgba(45,0,0,0.5)',
        }}
      >
        <div className="grid h-[68%] w-[68%] place-items-center rounded-full border-2 border-[#f0cfc0]/35">
          <span className="font-serif text-[8px] font-bold tracking-[0.18em] text-[#f3d9c9] sm:text-[9px]">
            CAPYBER
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                */
/* ------------------------------------------------------------------ */

export default function ScrollView(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startP: number; moved: boolean } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const [progress, setProgress] = useState(0)
  const [stageW, setStageW] = useState(0)
  const [stripW, setStripW] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [nativeFs, setNativeFs] = useState(false)
  const [pseudoFs, setPseudoFs] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const reduced = useReducedMotion()

  const isFs = nativeFs || pseudoFs

  /* Toast com auto-dismiss ------------------------------------------ */
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4500)
  }, [])

  /* Marcapáginas: restaurar ao montar -------------------------------- */
  useEffect(() => {
    const restore = (): void => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const v = Number(raw)
          if (Number.isFinite(v) && v >= 3) {
            setProgress(clamp(v))
            showToast(`Retomando de ${Math.round(v)}%`)
          }
        }
      } catch {
        /* armazenamento indisponível */
      }
    }
    const t = setTimeout(restore, 0)
    return () => {
      clearTimeout(t)
      if (toastTimer.current) clearTimeout(toastTimer.current)
      if (repeatTimer.current) clearInterval(repeatTimer.current)
    }
  }, [showToast])

  /* Marcapáginas: salvar com debounce --------------------------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(Math.round(progress)))
      } catch {
        /* armazenamento indisponível */
      }
    }, 500)
    return () => clearTimeout(t)
  }, [progress])

  /* Medição do palco e da fita de conteúdo (ResizeObserver) ----------- */
  useEffect(() => {
    const stage = stageRef.current
    const strip = stripRef.current
    if (!stage || !strip) return
    const measure = (): void => {
      setStageW(stage.clientWidth)
      setStripW(strip.offsetWidth)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    ro.observe(strip)
    return () => ro.disconnect()
  }, [])

  /* Sincronizar estado da tela cheia nativa --------------------------- */
  useEffect(() => {
    const onFs = (): void => setNativeFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  /* Escape sai do fallback pseudo tela cheia -------------------------- */
  useEffect(() => {
    if (!pseudoFs) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setPseudoFs(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pseudoFs])

  /* Roda do mouse: desenrola (com escape para colunas roláveis) ------- */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (e: WheelEvent): void => {
      const target = e.target instanceof HTMLElement ? e.target : null
      const col = target ? (target.closest('[data-column]') as HTMLElement | null) : null
      if (col && col.scrollHeight > col.clientHeight + 1) {
        const atTop = col.scrollTop <= 0
        const atBottom = col.scrollTop + col.clientHeight >= col.scrollHeight - 1
        const down = e.deltaY > 0
        if ((down && !atBottom) || (!down && !atTop)) return // deixa a coluna rolar
      }
      e.preventDefault()
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      setProgress((p) => clamp(p + delta * 0.045))
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [])

  /* Botões com repetição ao segurar ----------------------------------- */
  const stopRepeat = useCallback((): void => {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current)
      repeatTimer.current = null
    }
  }, [])

  const startRepeat = useCallback(
    (dir: -1 | 1): void => {
      stopRepeat()
      const step = (): void => setProgress((p) => clamp(p + dir * 1.5))
      step()
      repeatTimer.current = setInterval(step, 40)
    },
    [stopRepeat],
  )

  useEffect(() => stopRepeat, [stopRepeat])

  /* Arrastar horizontalmente ------------------------------------------ */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragRef.current = { startX: e.clientX, startP: progress, moved: false }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* captura indisponível */
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const st = dragRef.current
    const stage = stageRef.current
    if (!st || !stage) return
    const dx = st.startX - e.clientX
    if (!st.moved && Math.abs(dx) > 3) {
      st.moved = true
      setDragging(true)
    }
    if (!st.moved) return
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) selection.removeAllRanges()
    const span = Math.max(240, stage.clientWidth * 0.75)
    setProgress(clamp(st.startP + (dx / span) * 100))
  }

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* captura já liberada */
    }
  }

  /* Teclado ------------------------------------------------------------- */
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Home') {
      e.preventDefault()
      setProgress(0)
      return
    }
    if (e.key === 'End') {
      e.preventDefault()
      setProgress(100)
      return
    }
    const steps: Record<string, number> = {
      ArrowRight: 6,
      ArrowUp: 6,
      PageDown: 15,
      ArrowLeft: -6,
      ArrowDown: -6,
      PageUp: -15,
    }
    const step = steps[e.key]
    if (step !== undefined) {
      e.preventDefault()
      setProgress((p) => clamp(p + step))
    }
  }

  /* Ações --------------------------------------------------------------- */
  const restart = (): void => {
    setProgress(0)
    showToast('Pergaminho reenrolado — recomeçando do início')
  }

  const toggleFullscreen = async (): Promise<void> => {
    if (isFs) {
      if (nativeFs) {
        try {
          await document.exitFullscreen()
        } catch {
          /* ignora */
        }
      }
      setPseudoFs(false)
      return
    }
    const el = containerRef.current
    if (el && typeof el.requestFullscreen === 'function') {
      try {
        await el.requestFullscreen()
        return
      } catch {
        /* API falhou → fallback pseudo tela cheia */
      }
    }
    setPseudoFs(true)
  }

  /* Geometria derivada --------------------------------------------------- */
  const rounded = Math.round(progress)
  const paperFrac = 0.24 + 0.7 * (progress / 100)
  const paperW = stageW > 0 ? Math.max(240, Math.round(stageW * paperFrac)) : 340
  const overflowPx = Math.max(0, stripW - paperW + 16)
  const shiftX = -(progress / 100) * overflowPx
  const rollerAngle = progress * 7.2

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Pergaminho de engenharia social"
      className={`relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#33220f] via-[#2b1d10] to-[#1b110a] shadow-2xl ring-1 ring-black/50 ${
        pseudoFs ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      style={{ height: isFs ? '100dvh' : 'clamp(540px, 74vh, 900px)' }}
    >
      {/* mesa de madeira: grão + vinheta */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(255,220,170,0.035) 0 2px, transparent 2px 8px), radial-gradient(ellipse at 50% -10%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Cabeçalho */}
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 pt-3 sm:px-6 sm:pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <ScrollText aria-hidden className="h-5 w-5 shrink-0 text-[#c65a50]" />
          <h2 className="truncate font-serif text-base font-bold tracking-wide text-[#e8d9b0] sm:text-lg">
            Pergaminho · Engenharia Social
          </h2>
        </div>
        <p className="hidden text-xs text-[#e8d9b0]/60 md:block">
          Arraste, gire a roda do mouse ou use ◀ ▶ para desenrolar
        </p>
        <span className="rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[#e8d9b0]/80 ring-1 ring-white/10">
          {rounded}% desenrolado
        </span>
      </header>

      {/* Palco 3D */}
      <div
        ref={stageRef}
        tabIndex={0}
        role="group"
        aria-label="Cena do pergaminho: arraste, role o mouse ou use as setas do teclado para desenrolar"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        className={`relative z-10 mx-2 my-1 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d9b0]/70 sm:mx-4 ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        } select-none`}
        style={{ perspective: '1500px', touchAction: 'pan-y' }}
      >
        {/* brilho quente atrás do pergaminho */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(255,225,170,0.12), transparent 65%)' }}
        />
        {/* sombra no chão */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[6%] left-1/2 h-8 w-[76%] -translate-x-1/2 rounded-[100%] bg-black/55 blur-xl"
        />

        {/* cena: papel + rolos (cresce do centro conforme o progresso) */}
        <div
          className="absolute left-1/2 top-1/2 z-10"
          style={{
            width: paperW,
            height: '76%',
            transform: 'translate(-50%, -50%) rotateX(3deg)',
            transformStyle: 'preserve-3d',
            transition: reduced ? 'none' : 'width 180ms ease-out',
          }}
        >
          {/* papel desenrolado (janela do conteúdo) */}
          <div
            className="absolute inset-0 z-10 overflow-hidden rounded-[6px] border border-[#a5834d]/45"
            style={{ backgroundColor: '#f3e9cf', backgroundImage: PAPER_BG, boxShadow: PAPER_SHADOW }}
          >
            {/* sombreamento cilíndrico topo/base */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[5]"
              style={{
                backgroundImage:
                  'linear-gradient(to bottom, rgba(58,34,10,0.20), transparent 12%, transparent 88%, rgba(58,34,10,0.26))',
              }}
            />
            {/* queimado nas bordas (sombra dos rolos) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-[6] w-10 sm:w-14"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(58,34,10,0.42), rgba(58,34,10,0.12) 45%, transparent)',
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 z-[6] w-10 sm:w-14"
              style={{
                backgroundImage:
                  'linear-gradient(to left, rgba(58,34,10,0.42), rgba(58,34,10,0.12) 45%, transparent)',
              }}
            />

            {/* fita de conteúdo: desliza conforme o progresso */}
            <div
              ref={stripRef}
              className="cap-stagger flex h-full w-max items-stretch"
              style={{
                transform: `translateX(${shiftX}px)`,
                transition: reduced ? 'none' : 'transform 170ms ease-out',
                willChange: 'transform',
              }}
            >
              <CoverColumn />
              {SECTIONS.map((s, i) => (
                <Fragment key={s.title}>
                  <Separator />
                  <SectionColumn section={s} index={i} />
                </Fragment>
              ))}
              <Separator />
              <EndColumn />
            </div>
          </div>

          {/* curvatura do papel entrando no rolo (CSS 3D) */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 z-[11] w-8 sm:w-9"
            style={{
              transformOrigin: 'right center',
              transform: 'rotateY(-48deg)',
              backfaceVisibility: 'hidden',
              backgroundColor: '#e8d9b0',
              backgroundImage:
                'linear-gradient(to right, rgba(46,26,8,0.65) 0%, rgba(46,26,8,0.18) 55%, rgba(46,26,8,0) 100%)',
              boxShadow: '-8px 0 16px rgba(0,0,0,0.28)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 z-[11] w-8 sm:w-9"
            style={{
              transformOrigin: 'left center',
              transform: 'rotateY(48deg)',
              backfaceVisibility: 'hidden',
              backgroundColor: '#e8d9b0',
              backgroundImage:
                'linear-gradient(to left, rgba(46,26,8,0.65) 0%, rgba(46,26,8,0.18) 55%, rgba(46,26,8,0) 100%)',
              boxShadow: '8px 0 16px rgba(0,0,0,0.28)',
            }}
          />

          {/* rolos de madeira que giram e se afastam */}
          <Roller side="left" angle={rollerAngle} reduced={reduced} />
          <Roller side="right" angle={rollerAngle} reduced={reduced} />

          {/* selo de cera */}
          <WaxSeal />
        </div>
      </div>

      {/* Toast marcapáginas */}
      <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-4">
        {toast ? (
          <div className="flex items-center gap-2 rounded-full bg-[#1c120a]/95 px-4 py-2 text-sm font-medium text-[#f3e9cf] shadow-xl ring-1 ring-[#8c2f2f]/50">
            <Bookmark aria-hidden className="h-4 w-4 shrink-0 text-[#c65a50]" />
            <span>{toast}</span>
          </div>
        ) : null}
      </div>

      {/* Barra de controles */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/25 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Enrolar (recuar o pergaminho)"
            onPointerDown={() => startRepeat(-1)}
            onPointerUp={stopRepeat}
            onPointerLeave={stopRepeat}
            onPointerCancel={stopRepeat}
            onBlur={stopRepeat}
            className={BTN_CLASS}
          >
            <span aria-hidden>◀</span>
            <span>Enrolar</span>
          </button>
          <button
            type="button"
            aria-label="Desenrolar (avançar o pergaminho)"
            onPointerDown={() => startRepeat(1)}
            onPointerUp={stopRepeat}
            onPointerLeave={stopRepeat}
            onPointerCancel={stopRepeat}
            onBlur={stopRepeat}
            className={BTN_CLASS}
          >
            <span>Desenrolar</span>
            <span aria-hidden>▶</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={restart}
            aria-label="Recomeçar a leitura do início"
            className={BTN_CLASS}
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">Recomeçar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              void toggleFullscreen()
            }}
            aria-label={isFs ? 'Sair da tela cheia' : 'Ver pergaminho em tela cheia'}
            aria-pressed={isFs}
            className={`${BTN_CLASS} ${isFs ? 'from-[#8c2f2f] to-[#5e1d1d]' : ''}`}
          >
            {isFs ? (
              <Minimize2 aria-hidden className="h-4 w-4" />
            ) : (
              <Maximize2 aria-hidden className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{isFs ? 'Sair da tela' : 'Tela cheia'}</span>
          </button>
        </div>

        <div className="order-last flex w-full min-w-0 basis-full items-center gap-3 sm:order-none sm:w-auto sm:basis-[220px]">
          <div
            role="progressbar"
            aria-label="Progresso de leitura do pergaminho"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={rounded}
            aria-valuetext={`${rounded}% desenrolado`}
            className="h-2.5 min-w-[110px] flex-1 overflow-hidden rounded-full bg-black/50"
            style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #6b2020 0%, #8c2f2f 45%, #b5453f 100%)',
                transition: reduced ? 'none' : 'width 140ms ease-out',
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-[#f3e9cf]">
            {rounded}%
          </span>
        </div>
      </div>
    </div>
  )
}
