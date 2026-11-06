// CAPYBER — Tutorial RPG guiado: cadeia de missões ("Clique aqui e verás…").
//
// Dados puros (sem React): o componente <RpgTutorial /> consome TUTORIAL_STEPS
// para dirigir o holofote, os diálogos com efeito de máquina de escrever e as
// recompensas de XP. `target` é um seletor CSS [data-tut=...] garantido pelo
// integrador; quando null, a missão é apenas diálogo (posição central).

export interface TutorialStep {
  id: string
  title: string // ex: "O Portal do Comando"
  npc: string // ex: "VIGIA" ou "Mestre Capivara"
  dialogue: string[] // 2–4 falas RPG exibidas com efeito typewriter (pt-BR)
  target: string | null // seletor [data-tut=...] ou null para passo só de diálogo
  view?: string // hash (#) para navegar antes de destacar o alvo
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  xp: number // recompensa da missão
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'boas-vindas',
    title: 'O Chamado do Capim Digital',
    npc: 'Mestre Capivara',
    target: null,
    position: 'center',
    xp: 10,
    dialogue: [
      'Aproxime-se, aventureiro. Eu sou o Mestre Capivara, guardião do Capim Digital — e este forte é o CAPYBER, seu novo posto de defesa.',
      'Aqui um motor caça ameaças em tempo real, uma frota de endpoints dorme sob vigília e uma ordem de guardiões protege o reino: você.',
      'Sua missão: percorrer as 19 salas deste tutorial RPG e sair pronto para defender o reino digital. Recompensa: +10 XP.',
    ],
  },
  {
    id: 'portal-navegacao',
    title: 'O Portal do Comando',
    npc: 'Mestre Capivara',
    target: '[data-tut="nav-projeto"]',
    position: 'bottom',
    xp: 20,
    dialogue: [
      'Este é o Portal do Comando: cada aba abre uma sala do forte — Projeto, Trilha, Comando, OSINT, Frota, Laboratório e Plano 40.',
      'Quem conhece o próprio território reage em segundos, não em horas. Na defesa, segundos salvam sistemas.',
      'Sua missão: clicar aqui e verás o coração da base. Recompensa: +20 XP.',
    ],
  },
  {
    id: 'motor-capycore',
    title: 'O Coração do CAPYCORE',
    npc: 'VIGIA',
    target: '[data-tut="motor-status"]',
    position: 'bottom',
    xp: 20,
    dialogue: [
      'Aventureiro, eu sou a VIGIA, a voz da sentinela. Este selo é o pulso do CAPYCORE, o motor de detecção em tempo real.',
      'MOTOR ONLINE significa que cada pacote suspeito é analisado agora — não amanhã. Se ele piscar em vermelho, o reino está cego.',
      'Sua missão: aprender a confiar, mas sempre verificar o pulso do motor. Recompensa: +20 XP.',
    ],
  },
  {
    id: 'medidor-defcon',
    title: 'O Medidor DEFCON',
    npc: 'VIGIA',
    target: '[data-tut="defcon-badge"]',
    position: 'bottom',
    xp: 20,
    dialogue: [
      'Este é o medidor DEFCON: o nível de prontidão da base, de 5 (tranquilo) a 1 (crítico).',
      "Quando ele sobe, é a sentinela gritando 'reforçem as muralhas!'. Ignorar este aviso é servir o jantar ao invasor.",
      'Sua missão: aprender a ler o medidor antes de ler os alertas. Recompensa: +20 XP.',
    ],
  },
  {
    id: 'sala-projeto',
    title: 'A Sala do Projeto',
    npc: 'Mestre Capivara',
    target: null,
    view: 'projeto',
    position: 'center',
    xp: 20,
    dialogue: [
      'Esta é a Sala do Projeto: o mapa do forte, com a visão geral de toda a arquitetura defensiva do CAPYBER.',
      'Todo herói estuda o território antes da batalha — quem protege o quê, e por quê.',
      'Sua missão: absorver a visão geral. Logo partiremos para a guerra. Recompensa: +20 XP.',
    ],
  },
  {
    id: 'mapa-global',
    title: 'O Mapa Global de Ameaças',
    npc: 'VIGIA',
    target: null,
    view: 'comando',
    position: 'center',
    xp: 30,
    dialogue: [
      'Bem-vindo ao Centro de Comando! Este é o Mapa Global de Ameaças: cada clarão é um ataque detectado em algum canto do mundo.',
      'Um SOC sem visão global luta no escuro. Aqui você enxerga a guerra antes que ela chegue à sua porta.',
      'Sua missão: observar o mapa e sentir o pulso do mundo. Recompensa: +30 XP.',
    ],
  },
  {
    id: 'bancada-alertas',
    title: 'A Bancada de Alertas',
    npc: 'VIGIA',
    target: null,
    view: 'comando',
    position: 'center',
    xp: 30,
    dialogue: [
      'Esta é a Bancada de Alertas: todo evento crítico chega aqui para investigação, contenção e neutralização.',
      'O fluxo é sagrado: detectar, analisar, neutralizar, registrar. Um alerta sem resposta é uma porta aberta.',
      'Sua missão: quando um alerta soar, seja a primeira espada a erguer-se. Recompensa: +30 XP.',
    ],
  },
  {
    id: 'grafo-osint',
    title: 'O Grafo de Reconhecimento',
    npc: 'VIGIA',
    target: '[data-tut="osint-search"]',
    view: 'osint',
    position: 'bottom',
    xp: 40,
    dialogue: [
      'Clique aqui e verás o grafo de recon se abrir diante de você: a arte OSINT de investigar o inimigo antes que ele investigue você.',
      'Digite um domínio, e-mail ou identidade e os vínculos aparecerão — exposições, vazamentos e conexões ocultas.',
      'Sua missão: conhecer o inimigo melhor do que ele se conhece. Recompensa: +40 XP.',
    ],
  },
  {
    id: 'trilha-3d',
    title: 'A Trilha do Aprendiz',
    npc: 'Mestre Capivara',
    target: '[data-tut="trilha-canvas"]',
    view: 'trilha',
    position: 'top',
    xp: 40,
    dialogue: [
      'Ah, a Trilha do Aprendiz! Aqui o treino vira aventura: um mundo 3D com altares, fantasmas e enigmas de segurança.',
      'Cada santuário aberto é uma lição de defesa gravada na memória — e XP de verdade na sua alma.',
      'Sua missão: explorar com WASD ou joystick e despertar os altares. Recompensa: +40 XP.',
    ],
  },
  {
    id: 'tomo-guardiao',
    title: 'O Tomo do Guardião',
    npc: 'Mestre Capivara',
    target: '[data-tut="book-cover"]',
    view: 'livro',
    position: 'bottom',
    xp: 30,
    dialogue: [
      'Este é o Tomo do Guardião: um livro 3D que guarda os capítulos da arte da defesa digital.',
      'Conhecimento é escudo: quem lê as páginas certas reconhece o golpe antes do primeiro ataque.',
      'Sua missão: folhear o tomo sempre que a dúvida assombrar. Recompensa: +30 XP.',
    ],
  },
  {
    id: 'pergaminho',
    title: 'O Pergaminho dos Selos',
    npc: 'Mestre Capivara',
    target: null,
    view: 'pergaminho',
    position: 'center',
    xp: 30,
    dialogue: [
      'Este é o Pergaminho: um rolo 3D com os selos da engenharia social, os golpes que enganam pessoas e não máquinas.',
      'Desenrole, leia cada selo e aprenda a reconhecer a isca antes de morder.',
      'Sua missão: abrir o pergaminho e ler ao menos um selo. Recompensa: +30 XP.',
    ],
  },
  {
    id: 'ctf-fantasma',
    title: 'O Cemitério CTF',
    npc: 'Capivara Fantasma',
    target: '[data-tut="ctf-board"]',
    view: 'ctf',
    position: 'top',
    xp: 40,
    dialogue: [
      'Hehehe… um mortal ousa entrar no Cemitério CTF? Eu sou o Capivara Fantasma, guardião dos desafios esquecidos.',
      'Neste quadro habitam fantasmas de invasões passadas: capture as bandeiras, prove seu valor… e não vire um de nós.',
      'Sua missão: resolver os desafios e capturar as bandeiras. Se ousar. Recompensa: +40 XP.',
    ],
  },
  {
    id: 'sala-stealth',
    title: 'O Quarto do Operador',
    npc: 'Capivara Fantasma',
    target: null,
    view: 'stealth',
    position: 'center',
    xp: 40,
    dialogue: [
      'Bem-vindo à Sala Stealth: um quarto surreal onde cada objeto esconde uma lição de privacidade e OPSEC.',
      'Gire a câmera, clique no computador e conclua o curso para liberar as missões de operador inrastreável.',
      'Sua missão: explorar o quarto e abrir o PC. Recompensa: +40 XP.',
    ],
  },
  {
    id: 'defesa-celular',
    title: 'A Defesa do Celular',
    npc: 'VIGIA',
    target: null,
    view: 'celular',
    position: 'center',
    xp: 40,
    dialogue: [
      'Seu celular é a porta mais usada pelos invasores. Nesta aba, hackers atacam o app de mensagens e o e-mail.',
      'Toque nos ataques para bloquear, use firewall e antivírus no tempo certo e sobreviva a 8 ondas.',
      'Sua missão: jogar uma partida e defender os dois apps. Recompensa: +40 XP.',
    ],
  },
  {
    id: 'vigia-frota',
    title: 'A Vigília da Frota',
    npc: 'VIGIA',
    target: null,
    view: 'frota',
    position: 'center',
    xp: 30,
    dialogue: [
      'Esta é a Frota: notebooks, workstations, mobiles e servidores — cada endpoint do reino sob vigília constante.',
      'Um único dispositivo sem atualização é um portão de cerimônia aberto na muralha.',
      'Sua missão: conhecer seus dispositivos antes que o inimigo os conheça. Recompensa: +30 XP.',
    ],
  },
  {
    id: 'laboratorio',
    title: 'O Laboratório de Simulações',
    npc: 'Mestre Capivara',
    target: null,
    view: 'lab',
    position: 'center',
    xp: 30,
    dialogue: [
      'O Laboratório de Simulações: aqui você dispara ataques controlados e vê a defesa reagir — sem risco de queimar o forte.',
      'Errar no laboratório custa XP de experiência; errar em produção custa o reino.',
      'Sua missão: experimentar com coragem e aprender sem medo. Recompensa: +30 XP.',
    ],
  },
  {
    id: 'plano-40',
    title: 'O Plano das 40 Etapas',
    npc: 'Mestre Capivara',
    target: null,
    view: 'plano',
    position: 'center',
    xp: 40,
    dialogue: [
      'O Plano 40: a longa jornada em 40 etapas para transformar um aprendiz em guardião completo.',
      'Disciplina vence talento: um plano seguido vale mais que mil intenções heróicas.',
      'Sua missão: estudar o plano e escolher a próxima etapa da sua jornada. Recompensa: +40 XP.',
    ],
  },
  {
    id: 'voz-vigia',
    title: 'A Voz da Sentinela',
    npc: 'VIGIA',
    target: '[data-tut="vigia-panel-open"]',
    position: 'bottom',
    xp: 40,
    dialogue: [
      'Por fim, meu próprio altar: clique aqui e verás o meu painel de voz. Eu narro as ameaças em tempo real enquanto você trabalha.',
      'Dois olhos enxergam o presente; a voz vigilante da sentinela guarda o futuro.',
      'Sua missão: ativar minha voz e nunca mais vigiar sozinho. Recompensa: +40 XP.',
    ],
  },
  {
    id: 'certificado-iniciado',
    title: 'O Certificado de Iniciado',
    npc: 'Mestre Capivara',
    target: null,
    position: 'center',
    xp: 100,
    dialogue: [
      'Missão cumprida, aventureiro! Você percorreu todas as salas do forte e conhece cada artefato de defesa do CAPYBER.',
      'Pela ordem dos guardiões do Capim Digital, declaro você Iniciado do CAPYBER. Recompensa: +100 XP e o Certificado de Iniciado.',
      'O reino digital nunca dorme — e agora você também vigia. Até a próxima aventura!',
    ],
  },
]

/** XP total da jornada (soma das recompensas). */
export const TUTORIAL_TOTAL_XP = TUTORIAL_STEPS.reduce((acc, s) => acc + s.xp, 0)
