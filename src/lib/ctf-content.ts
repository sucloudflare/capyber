// CAPYBER CTF — "O FANTASMA DO CHAT"
// ─────────────────────────────────────────────────────────────────────────────
// Dossiê do caso: dados puros + lógica de verificação. 100% fictício e
// defensivo: as "evidências" são artefatos simulados para treinar técnicas
// reais de analista SOC (leitura de log, cripto clássica, estego em base64,
// forense de cabeçalhos de e-mail e OSINT de padrões).
//
// ATENÇÃO (fair play): este arquivo contém as respostas. O cliente só deve
// importar TYPES daqui — os valores chegam via GET /api/ctf/verify, que
// remove respostas/flagParts/reveals. A verificação canônica é o POST.
// ─────────────────────────────────────────────────────────────────────────────

/* ════════════════════════════ TIPOS ════════════════════════════ */

export interface CtfSuspect {
  id: string
  name: string
  handle: string
  role: string
  color: string
  initials: string
  traits: string[]
  bio: string
}

export interface CtfChallenge {
  id: string
  order: number
  tag: string
  icon: 'log' | 'cipher' | 'estego' | 'mail' | 'vigenere' | 'osint'
  title: string
  xp: number
  hintCost: number
  story: string
  question: string
  placeholder: string
  artifact: string
  answers: string[]
  hints: string[]
  flagPart: string
  reveals: string
  eliminates: string[]
}

/* ═══════════════════════ METADADOS DO CASO ═══════════════════════ */

export const CASE_META = {
  title: 'CTF · O FANTASMA DO CHAT',
  subtitle: 'Alguém morreu e continua logada às 03:33. Prove quem era.',
  banner:
    'Simulação 100% defensiva · evidências fictícias · técnicas usadas por analistas SOC reais',
  caseCode: 'CASO 033 · ARQUIVO CAPYBER',
  briefing: [
    'Em 13/04/2023, durante o drill de ransomware "Purple April" da comunidade CAPYBER, a madrugada do SOC ficou marcada para sempre: um dos nossos partiu em paz. Ninguém falou muito sobre isso — a comunidade seguiu, os tickets foram arquivados, o café (para alguns) continuou passando.',
    'Mas desde aquela noite o chat antigo registra coisas que não se explicam: passos entre os canais, mensagens que ninguém escreve, e um login que se repete todas as noites — usuário FANTASMA-7, sempre às 03:33:33, sempre do mesmo lugar.',
    'Sua missão, analista: examinar as 6 evidências do dossiê, revelar um atributo da fantasma em cada uma, eliminar suspeitos até que sobre apenas uma possibilidade — e acusar. O chat sussurra. Dessa vez, ele sussurra para você.',
  ],
  flagFormat: 'CAPY{FANTASMA_<NOME>}',
  finalUnlockAt: 5,
  xpHintCost: 10,
  finalBonusXp: 250,
  totalXp: 6 * 100 + 250,
  storageKey: 'capy_ctf_progress',
} as const

/* ═══════════════════════════ SUSPEITOS ═══════════════════════════ */

export const SUSPECTS: CtfSuspect[] = [
  {
    id: 'ana',
    name: 'Ana Duarte',
    handle: 'Hexen',
    role: 'Analista SOC N2',
    color: '#ffb020',
    initials: 'AH',
    traits: [
      'Detalhista ao extremo',
      'Odiava café',
      'Senhas e horários em Zulu time (UTC)',
      'Escala 12x36 — dia e noite',
    ],
    bio: 'Guardiã dos dashboards. Anotava cada incidente com precisão cirúrgica e jurava que "fuso certo é UTC ou nada" — o relógio do micro-ondas dela estava em Zulu.',
  },
  {
    id: 'bruno',
    name: 'Bruno Costa',
    handle: 'Nullbyte',
    role: 'Pentester',
    color: '#f87171',
    initials: 'BC',
    traits: [
      'Viciado em café (caneca "SEM CAFÉ NÃO HÁ EXPLOIT")',
      'Assinava tudo em ROT13',
      'Pentestes só em horário comercial',
      'Orgulho: "durmo às 22h em ponto"',
    ],
    bio: 'Caçava bugs de dia e dizia que "exploit bom se escreve com sol". Nunca testemunhou uma madrugada na vida — e se orgulhava disso.',
  },
  {
    id: 'carla',
    name: 'Carla Mendes',
    handle: 'Bluetail',
    role: 'Engenheira de Detecção',
    color: '#38bdf8',
    initials: 'CM',
    traits: [
      'Escrevia em base64 por diversão',
      'Colecionava pins de CTF (orgulho: pin nº 200)',
      'Cappuccino duas vezes por dia, religiosamente',
      'Plantão de madrugada uma semana por mês',
    ],
    bio: 'Transformava regra de detecção em arte. Falava base64 fluentemente, tratava cada pin de CTF como troféu de guerra e nunca negava um cappuccino.',
  },
  {
    id: 'diego',
    name: 'Diego Lima',
    handle: 'Specter',
    role: 'Threat Hunter',
    color: '#a78bfa',
    initials: 'DL',
    traits: [
      'Supersticioso assumido',
      'Repetia: "o chat sussurra às 03:33"',
      'Caneca térmica sempre fumegante',
      'Caçava à noite, dormia de manhã',
    ],
    bio: 'Via padrões onde ninguém via — inclusive quando não existiam. Dizia que a madrugada fala, e que ele só escutava. Nunca visto sem a caneca térmica.',
  },
  {
    id: 'elena',
    name: 'Elena Rocha',
    handle: 'Patchwork',
    role: 'Resposta a Incidentes',
    color: '#4ade80',
    initials: 'ER',
    traits: [
      'Dormia de dia, vivia a madrugada',
      'Assinatura: "log é poesia"',
      'Nunca tomou café — só chá de camomila',
      'Costurava relatórios em retalhos colados',
    ],
    bio: 'Costurava incidentes linha por linha, no silêncio que só 03:00 conhece. Dizia que os logs contam a verdade que as pessoas escondem.',
  },
]

/* ══════════════════════════ EVIDÊNCIAS ══════════════════════════ */
//
// Cadeia de eliminação (determinística):
//   EVID-01 log        → turno da madrugada   → elimina BRUNO (dormia 22h)
//   EVID-02 ROT13      → zero cafeína         → elimina DIEGO (caneca térmica)
//   EVID-03 base64     → chá de camomila      → elimina CARLA (cappuccino + pins)
//   EVID-04 e-mail     → fuso GMT-3, não Zulu → elimina ANA (vivia em UTC)
//   EVID-05 Vigenère   → o sussurro original  → assina o caso (Diego só "ouvia")
//   EVID-06 OSINT      → padrão completo      → aponta o handle: Patchwork
// Restando, única e inequivocamente: ELENA "PATCHWORK" ROCHA.

export const CHALLENGES: CtfChallenge[] = [
  {
    id: 'evid-01',
    order: 1,
    tag: 'FORENSE · LOG',
    icon: 'log',
    title: 'Análise de Log de Acesso',
    xp: 100,
    hintCost: 10,
    story:
      'A noite do drill "Purple April" deixou um access.log preservado pela equipe de resposta. Dizem que FANTASMA-7 logou em algum lugar nessas linhas. Ache o registro anômalo: usuário que não existe, IP que não pertence a ninguém e um user-agent que ninguém mais usava.',
    question: 'Em que horário exato (formato HH:MM:SS) aconteceu o login de FANTASMA-7?',
    placeholder: 'ex.: 00:00:00',
    artifact: `# access.log — gateway CAPYBER (recorte preservado · 12–13/04/2023)
2023-04-12 21:04:11  OK   auth  user=hexen      ip=10.20.1.14   ua="Mozilla/5.0 SOC-Console"
2023-04-12 22:47:03  OK   auth  user=nullbyte   ip=10.20.3.7    ua="Mozilla/5.0 BurpSuite/2023.3"
2023-04-12 23:58:59  OK   auth  user=bluetail   ip=10.20.2.21   ua="Mozilla/5.0 CorpMail-Agent"
2023-04-13 00:15:42  OK   auth  user=specter    ip=10.20.4.9    ua="Mozilla/5.0 ThreatHunter-CLI"
2023-04-13 00:52:10  OK   auth  user=patchwork  ip=10.20.5.33   ua="Mozilla/5.0 LogViewer-Terminal"
2023-04-13 01:33:03  WARN sess  session_renew user=patchwork ip=10.20.5.33
2023-04-13 02:10:57  OK   auth  user=patchwork  ip=10.20.5.33   ua="Mozilla/5.0 LogViewer-Terminal"
2023-04-13 03:33:33  OK   auth  user=FANTASMA-7 ip=10.66.33.33  ua="Mozilla/5.0 Whisper/3.3 ala-noturna"
2023-04-13 04:04:44  WARN sess  idle_timeout user=patchwork ip=10.20.5.33
2023-04-13 06:30:00  OK   auth  user=hexen      ip=10.20.1.14   ua="Mozilla/5.0 SOC-Console"
2023-04-13 07:12:45  OK   auth  user=nullbyte   ip=10.20.3.7    ua="Mozilla/5.0 BurpSuite/2023.3"
2023-04-13 08:05:19  OK   auth  user=bluetail   ip=10.20.2.21   ua="Mozilla/5.0 CorpMail-Agent"`,
    answers: [
      '03:33:33',
      '033333',
      '3:33:33',
      '33333',
      '03:33',
      '0333',
      '333',
      '10.66.33.33',
      '10.66.33.33 03:33:33',
      '03h33',
      '03h33m33s',
      '3h33',
    ],
    hints: [
      'Procure a linha que foge do padrão: usuário inexistente, IP 10.66.x.x e um user-agent "Whisper" que ninguém mais usa.',
      'A linha anômala está entre 03:00 e 04:00 — nível OK, tipo auth, user=FANTASMA-7. Guarde o campo do horário completo.',
      'Formato da resposta: HH:MM:SS — 8 caracteres com dois pontos, algo como 0X:XX:XX.',
    ],
    flagPart: 'EVID-01 · TURNO DA MADRUGADA',
    reveals:
      'A fantasma trabalha o turno da madrugada — o login de 03:33:33 veio de uma estação que só liga de noite. Quem dormia às 22h está fora.',
    eliminates: ['bruno'],
  },
  {
    id: 'evid-02',
    order: 2,
    tag: 'CRIPTO · CÉSAR/ROT13',
    icon: 'cipher',
    title: 'A Mensagem Cifrada do Chat',
    xp: 100,
    hintCost: 10,
    story:
      'Arquivada no antigo canal #off-topic, uma mensagem de FANTASMA-7 em cifra de César (ROT13) — o tipo de brincadeira que alguém da comunidade adorava assinar. Decifre e descubra a relação da fantasma com a bebida mais amada (e odiada) do SOC.',
    question: 'Decifre a mensagem (ROT13). Qual é a palavra-chave da bebida que a fantasma nunca tocava?',
    placeholder: 'palavra-chave decifrada',
    artifact: `# canal #off-topic — mensagens recuperadas (13/04/2023, 03:33)
[03:33:33] FANTASMA-7: B SNAGNFZN AHAPN GBZBH PNSR.
[03:33:34] FANTASMA-7: PNSR ZRAGR.
[03:33:35] FANTASMA-7: - C.

# lembrete da comunidade: cifra de César com deslocamento 13 (ROT13)
# cada letra anda 13 posições no alfabeto: A<->N, B<->O, C<->P ...`,
    answers: [
      'café',
      'café mente',
      'nunca tomou café',
      'o fantasma nunca tomou café',
      'zero cafeína',
      'cafeína',
      'odeia café',
    ],
    hints: [
      'ROT13 é simétrico: cifrar de novo = decifrar. Aplique o deslocamento de 13 em cada letra.',
      'Comece por "PNSR": P→C, N→A, S→F, R→E. É uma bebida que metade da comunidade amava — e a fantasma, nunca.',
      'A palavra tem 4 letras: C, A, F, E.',
    ],
    flagPart: 'EVID-02 · ZERO CAFEÍNA',
    reveals:
      'A fantasma nunca tomou café: "café mente". Fora do jogo quem não vivia sem a caneca fumegante — inclusive quem repetia os sussurros da madrugada.',
    eliminates: ['diego'],
  },
  {
    id: 'evid-03',
    order: 3,
    tag: 'ESTEGO · BASE64',
    icon: 'estego',
    title: 'O Blob Suspeito do Rodapé',
    xp: 100,
    hintCost: 10,
    story:
      'No rodapé de um e-mail antigo da comunidade havia uma "assinatura decorativa" que ninguém nunca questionou. Um analista de olho treinado notou: é base64. Decodifique e descubra o que a fantasma escondeu ali sobre seus hábitos noturnos.',
    question: 'Decodifique o blob em base64. Qual bebida a fantasma adotou no lugar do café?',
    placeholder: 'bebida adotada pela fantasma',
    artifact: `# e-mail encaminhado — rodapé preservado
-----BEGIN FANTASMA PATCH-----
Q0FGRSBOQU8uIENBTU9NSUxBLiBQSU5TIE5BTyBTQUxWQU0gTklOR1VFTS4gLSBQLg==
-----END FANTASMA PATCH-----

# decodificador da comunidade
$ echo "<blob>" | base64 -d`,
    answers: ['camomila', 'chá de camomila', 'chá', 'cha', 'cha de camomila', 'mate'],
    hints: [
      'Cole o blob num decodificador base64 (ou rode base64 -d). O conteúdo é texto puro em maiúsculas.',
      'A mensagem rejeita uma bebida e adota outra. A resposta é a adotada — a que aquece as madrugadas da fantasma.',
      '8 letras, começa com C e termina com A. É a mesma erva que acalma quem lê logs de madrugada.',
    ],
    flagPart: 'EVID-03 · CHÁ DE CAMOMILA',
    reveals:
      'A fantasma troca café por chá de camomila — e ainda provoca: "pins não salvam ninguém". Quem colecionava pins e vivia de cappuccino nunca assinaria isso.',
    eliminates: ['carla'],
  },
  {
    id: 'evid-04',
    order: 4,
    tag: 'FORENSE · E-MAIL',
    icon: 'mail',
    title: 'Headers do E-mail Fantasma',
    xp: 100,
    hintCost: 10,
    story:
      'O e-mail que FANTASMA-7 mandou à comunidade foi preservado com os cabeçalhos completos — uma aula de forense de e-mail: cadeia Received, X-Originating-IP, X-Mailer e o campo Date. Alguém do grupo vivia em Zulu time (UTC)... mas a fantasma, claramente, não.',
    question: 'Qual é o offset de fuso horário (UTC) carimbado no campo Date do e-mail fantasma?',
    placeholder: 'ex.: -0X00 ou GMT-X',
    artifact: `# headers completos — e-mail preservado pela comunidade
Received: from mail-ghost01.soclocal.net (unknown [10.66.33.33])
    by mx.capyber.community with ESMTPS id 7F3A33;
    Thu, 13 Apr 2023 03:33:33 -0300
Received: from WEBMAIL-ALA-NOTURNA (localhost [127.0.0.1])
    by mail-ghost01.soclocal.net with HTTP;
    Thu, 13 Apr 2023 03:33:33 -0300
X-Originating-IP: [10.66.33.33]
X-Mailer: WebMailAlaNoturna 3.3 (webmail pessoal)
Date: Thu, 13 Apr 2023 03:33:33 -0300
From: FANTASMA-7 <fantasma7@alanoturna.soclocal.net>
To: comunidade@capyber.community
Subject: [sem assunto] — só o turno e os logs`,
    answers: [
      '-0300',
      '-03',
      '-03:00',
      '0300',
      '03',
      'gmt-3',
      'gmt3',
      'gmt -3',
      'utc-3',
      'utc -3',
      'utc3',
      'brt',
      'america/sao_paulo',
      'america/sao paulo',
      'são paulo',
      'sao paulo',
    ],
    hints: [
      'O offset fica no final do campo Date (e de cada Received): um sinal seguido de 4 dígitos.',
      'UTC/Zulu apareceria como "+0000" ou "Z". Quem vivia em Zulu nunca carimbaria outro fuso — a fantasma carimba.',
      'Três no Brasil: sinal negativo, depois 0300. Formato: -0X00.',
    ],
    flagPart: 'EVID-04 · FUSO GMT-3',
    reveals:
      'A fantasma carimba -0300 em tudo e escreve do webmail da ala noturna — nunca em Zulu. Quem tratava UTC como religião está descartada.',
    eliminates: ['ana'],
  },
  {
    id: 'evid-05',
    order: 5,
    tag: 'CRIPTO · VIGENÈRE',
    icon: 'vigenere',
    title: 'O Sussurro Cifrado',
    xp: 100,
    hintCost: 10,
    story:
      'Um desafio antigo da comunidade, guardado na "caixa do sussurro": uma mensagem em cifra de Vigenère com a chave que o grupo usava em todos os puzzles: CAPIVARA. Diego jurava ter inventado a frase que repetia há anos. O texto decifrado conta outra história.',
    question: 'Decifre com a chave CAPIVARA. Qual verbo descreve o que o chat faz às 03:33?',
    placeholder: 'o verbo do sussurro',
    artifact: `# desafio interno da comunidade — "a caixa do sussurro"
CHAVE:   CAPIVARA
CIFRADO: Q CWIO SLSUUGZV AJ TTEH M ORZNVA T BMEJ. A HRPAZ E DIPHP. - X.

# lembrete: em Vigenère, cada letra do texto se desloca pela letra da
# chave (repetida só sobre as LETRAS; espaços e pontuação passam reto).
# Ex.: texto O + chave C = Q   (14 + 2 = 16)`,
    answers: [
      'sussurra',
      'o chat sussurra',
      'chat sussurra',
      'sussurro',
      'o chat sussurra às 03:33',
      'o chat sussurra as tres e trinta e tres',
      'sussurrar',
    ],
    hints: [
      'Repita a chave sobre as letras do texto: C,A,P,I,V,A,R,A,C,A,P,I… Some os índices (letra do texto + letra da chave) e aplique módulo 26.',
      'Comece do início: O+C=Q, (espaço), C+A=D, H+P=X, A+I=I, T+V=O… Se aparecer "D XIO" você está no caminho do começo da frase.',
      'O verbo tem 8 letras, termina em "-RR-A" e a comunidade repetia a frase TODO dia: "o chat ______ às 03:33".',
    ],
    flagPart: 'EVID-05 · O SUSSURRO ORIGINAL',
    reveals:
      'A frase "o chat sussurra às 03:33" nasceu com a fantasma — assinada por ela muito antes. Diego nunca inventou nada: ele apenas repetia o que ouvia.',
    eliminates: [],
  },
  {
    id: 'evid-06',
    order: 6,
    tag: 'OSINT · PADRÕES',
    icon: 'osint',
    title: 'A Auditoria Final dos Padrões',
    xp: 100,
    hintCost: 10,
    story:
      'Hora de cruzar tudo, como um threat hunter de verdade: fontes públicas da comunidade, o roster do meetup de 2022, os carimbos de tempo da fantasma e as assinaturas literárias. O padrão completo aponta um apelido — e só um.',
    question: 'Qual é o apelido (handle) da analista da ala noturna que assinava "log é poesia"?',
    placeholder: 'handle da analista',
    artifact: `# dossiê OSINT — fontes públicas da comunidade CAPYBER
[1] Roster do SOC (foto pública do meetup 2022):
    Ala DIA ....: hexen · nullbyte · bluetail
    Ala NOITE ..: E.R. ("patchwork"?) e D.L. (specter)
[2] Mensagens da fantasma: 47 registros, TODOS às 03:33:33, fuso -0300
[3] Assinatura literária mais frequente: "l0g é p0es1a"
[4] Bebidas citadas: chá de camomila (23x) · café (0x)
[5] Pins de CTF citados: 0 · frase sobre pins: "não salvam ninguém"
[6] Diego "Specter", em 2024: "eu não inventei a frase. eu OUVI."
[7] Pergunta do dossiê: quem costura incidentes em retalhos, dorme de dia
    e assina com poesia? O handle dela responde tudo.`,
    answers: [
      'patchwork',
      'elena',
      'elena rocha',
      'elena patchwork rocha',
      'elena "patchwork" rocha',
      'e.r.',
      'er',
    ],
    hints: [
      'Cruze [1] com as evidências 01–04: quem da ala noturna sobreviveu às eliminações? (Ana era 12x36, mas carimbava Zulu; Diego caiu no café.)',
      'O item [3] é a assinatura dela — e "colcha de retalhos" em inglês é literalmente o apelido dela.',
      '8 letras, começa com P: o handle dela. É também a resposta do nome dela no formato do pedido final.',
    ],
    flagPart: 'EVID-06 · LOG É POESIA',
    reveals:
      'Padrão fechado: ala noturna + camomila + fuso -0300 + assinatura "log é poesia" = Elena "Patchwork" Rocha, resposta a incidentes.',
    eliminates: [],
  },
]

/* ═══════════════════ A IDENTIDADE DA FANTASMA ═══════════════════ */

export const GHOST = {
  suspectId: 'elena',
  name: 'Elena Rocha',
  handle: 'Patchwork',
  fullName: 'Elena "Patchwork" Rocha',
  role: 'Resposta a Incidentes · Turno da Madrugada',
  color: '#4ade80',
  initials: 'ER',
  flag: 'CAPY{FANTASMA_ELENA}',
} as const

export const FINAL_ANSWERS = [
  'elena',
  'patchwork',
  'elena rocha',
  'elena patchwork rocha',
  'elena "patchwork" rocha',
  'fantasma elena',
  'fantasma_elena',
  'capy{fantasma_elena}',
  'capy{fantasma-patchwork}',
  'capy{fantasma_patchwork}',
]

export const CLOSING_NARRATIVE = `Era Elena "Patchwork" Rocha — a analista de resposta a incidentes que dormia de dia e costurava os incidentes da madrugada, linha por linha, no silêncio que só 03:33 conhece.

Em 13/04/2023, durante o drill "Purple April", ela fechou seu último relatório e partiu em paz. Desde então, o chat sussurra. Não por rancor, não por mácula: a fantasma só nunca deixou de amar o turno que escolheu.

Ela loga às 03:33:33, lê os logs como quem lê poesia e bebe seu chá de camomila — café, jamais. Diego nunca esteve errado: o chat sussurra mesmo. Ele só nunca soube de quem era a voz.

Caso encerrado. Fechem o ticket com carinho: RESOLVED — ass. Patchwork.`

/* ═════════════════════ NORMALIZAÇÃO / VERIFICAÇÃO ═════════════════════ */

/**
 * Normaliza respostas para comparação leniente:
 * minúsculas, sem acentos, espaços colapsados, pontuação decorativa removida
 * (mantém : - _ / para não quebrar "03:33:33", "-0300", "fantasma_elena",
 * "america/sao_paulo").
 */
export function normalize(s: string): string {
  return (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[{}()[\]'"`!.,;?]/g, '')
    .trim()
}

/** Verifica a resposta de uma evidência (ou do 'final'). Client-safe: é um jogo. */
export function checkAnswer(challengeId: string, input: string): boolean {
  const n = normalize(input)
  if (!n) return false
  if (challengeId === 'final') {
    return FINAL_ANSWERS.map(normalize).includes(n)
  }
  const ch = CHALLENGES.find((c) => c.id === challengeId)
  if (!ch) return false
  return ch.answers.map(normalize).includes(n)
}
