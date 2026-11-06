// CAPYBER — Conteúdo da "Sala Segura" · Operação Capivara Silenciosa
// ─────────────────────────────────────────────────────────────────────────────
// Material 100% EDUCATIVO de privacidade e OPSEC (defesa pessoal legítima):
// proteção contra rastreamento digital, anti-doxing e higiene operacional —
// o mesmo conhecimento que protege jornalistas, ativistas e profissionais
// de segurança. As "missões" são simulações contra alvos FICTÍCIOS do
// laboratório CAPYBER, com consentimento — nenhuma técnica real é executada.
// ─────────────────────────────────────────────────────────────────────────────

export const STORAGE_KEY = 'capy_stealth_progress'
export const MAX_LIVES = 5
export const FOOTPRINT_LIMIT = 5

/* ══════════════════════════════ tipos ══════════════════════════════ */

export type ModuleIcon =
  | 'radar'
  | 'shield'
  | 'globe'
  | 'fingerprint'
  | 'file'
  | 'message'
  | 'user'
  | 'server'

export interface QuizQuestion {
  q: string
  options: string[]
  /** índice da opção correta */
  correct: number
  explain: string
}

export interface CourseModule {
  id: string
  title: string
  icon: ModuleIcon
  summary: string
  /** parágrafos da aula (~150–250 palavras no total) */
  lesson: string[]
  checklist: string[]
  quiz: QuizQuestion[]
}

export interface MissionOption {
  label: string
  /** traço digital deixado pela escolha: 0 = seguro · 1–3 = arriscado */
  cost: number
  feedback: string
}

export interface MissionStep {
  prompt: string
  options: MissionOption[]
}

export interface Mission {
  id: string
  codename: string
  target: string
  brief: string[]
  mentorTip: string
  clearText: string
  steps: MissionStep[]
}

export interface StealthProgress {
  modulesDone: string[]
  bestScore: number
  victories: number
  unlocked: boolean
}

export function emptyProgress(): StealthProgress {
  return { modulesDone: [], bestScore: 0, victories: 0, unlocked: false }
}

/* ═════════════════════════ curso (8 módulos) ═════════════════════════ */

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 'm1',
    title: 'Rastreador em ação: IP, cookies, fingerprint e metadados',
    icon: 'radar',
    summary: 'Como os quatro principais rastros digitais te entregam — e por que nenhum deles é mágico.',
    lesson: [
      'Toda vez que você abre um site, ele não vê só a página: ele vê pistas. O seu IP revela a rede de onde você sai — o provedor, a cidade, às vezes o bairro. Cookies ficam gravados no navegador e voltam a te reconhecer em visitas seguintes; os cookies de terceiros fazem isso em milhares de sites ao mesmo tempo, costurando seu histórico numa linha só.',
      'Pior: hoje nem precisa de cookie. O fingerprinting mede como o SEU navegador desenha, quais fontes ele tem, a placa de vídeo, o fuso horário — e cria uma assinatura que te identifica mesmo sem armazenar nada. Os metadados completam o dossiê: a foto mostra o rosto, o EXIF mostra onde e quando ela foi tirada.',
      'Nenhum desses rastros é mágico: são hábitos. Quem entende como o rastreamento funciona consegue reduzir a superfície — menos identificadores, contextos separados, arquivos limpos. É exatamente isso que protege jornalistas, ativistas e qualquer pessoa contra doxing e vigilância indesejada.',
    ],
    checklist: [
      'Descobrir seu IP atual e entender o que ele revela',
      'Limpar cookies de terceiros e testar o navegador depois',
      'Conferir as permissões de localização dos apps do celular',
      'Desligar a geotag (localização) da câmera por padrão',
      'Fazer um teste de fingerprint e medir sua unicidade',
    ],
    quiz: [
      {
        q: 'O que o endereço IP entrega de imediato sobre você?',
        options: [
          'Seu nome completo e seus documentos',
          'A rede/provedor de onde você conecta e uma região aproximada',
          'Nada — IP é anônimo por definição',
          'As senhas salvas no seu navegador',
        ],
        correct: 1,
        explain: 'O IP identifica a rede de saída. Não traz seu nome, mas o provedor sabe qual cliente usava aquele IP naquele horário — por isso a confiança no provedor importa tanto.',
      },
      {
        q: 'Por que o fingerprinting é mais difícil de escapar do que os cookies?',
        options: [
          'Porque só funciona em celulares',
          'Porque não depende de arquivos gravados: combina atributos do dispositivo e do navegador',
          'Porque exige permissão do usuário para rodar',
          'Porque só funciona com o navegador fechado',
        ],
        correct: 1,
        explain: 'Apagar cookies não muda a resolução da tela, as fontes ou o WebGL. A assinatura é calculada na hora, não armazenada — não existe "apagar" o hardware.',
      },
      {
        q: 'Qual metadado costuma ser o mais sensível numa foto compartilhada?',
        options: [
          'A marca da câmera',
          'As coordenadas GPS gravadas no EXIF',
          'O tamanho do arquivo',
          'O nome do fotógrafo',
        ],
        correct: 1,
        explain: 'O EXIF pode guardar GPS, data, hora e modelo do aparelho. Publicar a foto "crua" pode entregar onde você mora, estuda ou trabalha.',
      },
    ],
  },
  {
    id: 'm2',
    title: 'VPN: o que esconde, o que NÃO esconde',
    icon: 'shield',
    summary: 'O túnel protege o caminho — mas desloca a confiança para o operador da VPN.',
    lesson: [
      'Uma VPN cria um túnel criptografado entre você e o servidor dela. Para os sites, quem está acessando é o servidor da VPN — seu IP desaparece da visão deles. Para o seu provedor de internet, sobra ver apenas que você conversa com a VPN, e quanto dado trafega: o conteúdo vira ruído cifrado.',
      'Agora a parte que a propaganda não conta: a VPN NÃO te esconde da própria VPN. Quem opera o túnel vê tudo o que antes o provedor via — por isso só faz sentido confiar numa empresa com política de no-logs auditada de forma independente e jurisdição clara. E a VPN não esconde logins: se você entra na sua conta real, o site sabe exatamente quem é você, esteja o IP onde estiver.',
      'Ferramentas que separam os dois mundos: kill switch (corta a internet se o túnel cair, evitando expor o IP real sem você perceber), testes de vazamento de DNS e WebRTC, protocolos modernos como WireGuard. A regra de ouro: VPN é deslocamento de confiança, não anonimato. E VPN "grátis" geralmente se financia vendendo justamente o dado que você queria proteger.',
    ],
    checklist: [
      'Ativar o kill switch no cliente da VPN',
      'Rodar um teste de vazamento de DNS e WebRTC',
      'Evitar VPNs gratuitas desconhecidas',
      'Preferir provedores com auditoria independente publicada',
      'Nunca esperar que a VPN "lave" um login de conta real',
    ],
    quiz: [
      {
        q: 'Com a VPN ativa, o que o seu provedor de internet consegue ver?',
        options: [
          'O conteúdo de tudo que você acessa',
          'Que você se conecta à VPN e o volume/horário dos dados',
          'As senhas digitadas nos sites',
          'O histórico completo de navegação em texto claro',
        ],
        correct: 1,
        explain: 'O túnel cifra o conteúdo. Sobra metadado: destino (a VPN), volume e horários — que ainda assim dizem bastante, e por isso o horário é dado sensível.',
      },
      {
        q: 'Por que "a VPN não esconde o seu login"?',
        options: [
          'Porque VPNs vendem seus dados para os sites',
          'Porque, se você se autentica numa conta, o site sabe quem você é independentemente do IP',
          'Porque logins só funcionam sem VPN',
          'Porque o login é transmitido fora do túnel',
        ],
        correct: 1,
        explain: 'Identidade de sessão supera identidade de rede. Trocar o IP não ajuda se você entrega o nome na porta: conta pessoal + VPN = conta pessoal localizada.',
      },
      {
        q: 'Para que serve o kill switch?',
        options: [
          'Desligar o computador em caso de invasão',
          'Bloquear anúncios durante a navegação',
          'Cortar o tráfego se o túnel cair, para não expor o IP real',
          'Trocar de servidor automaticamente',
        ],
        correct: 2,
        explain: 'Conexões VPN caem. Sem kill switch, o sistema reconecta pela rede aberta e seu IP real vaza para tudo que estiver aberto — geralmente sem nenhum aviso.',
      },
    ],
  },
  {
    id: 'm3',
    title: 'Tor e a rede de cebolas: camadas, nós e limites',
    icon: 'globe',
    summary: 'Três nós, três camadas: ninguém sozinho conhece origem e destino — mas há limites reais.',
    lesson: [
      'O Tor (The Onion Router) roteia seu tráfego por três voluntários espalhados pelo mundo. Cada camada de criptografia é "descascada" por um nó: o primeiro (guardião) conhece seu IP mas não o destino; o último (saída) conhece o destino mas não você. Nenhum nó sozinho liga origem e destino — essa é a ideia da rede de cebolas, e sites .onion escondem também o destino.',
      'Limitações que o usuário precisa saber de cor: o nó de SAÍDA enxerga o destino e qualquer tráfego sem HTTPS — então HTTPS sempre, sem exceção. O Tor é lento; torrent e streaming pesado poluem a rede e criam hábitos identificáveis. Sites com JavaScript ativo podem tentar desmascarar o navegador. E um adversário global, capaz de observar entrada e saída ao mesmo tempo, pode tentar correlacionar tempos.',
      'Regras de bolso: use o Tor Browser do jeito que ele veio — não maximize a janela (muda a assinatura), não instale extensões, não faça login com identidade real. Para situações sérias, Tails e Whonix roteiam TUDO pelo Tor e quase não deixam rastro no disco. Bridges (pontes) ajudam onde o Tor é bloqueado.',
    ],
    checklist: [
      'Usar o Tor Browser oficial, sem extensões extras',
      'Manter a janela no tamanho padrão recomendado',
      'Exigir HTTPS em todo acesso pela rede Tor',
      'Nunca entrar com contas reais dentro do Tor',
      'Saber o que são bridges e quando usá-las',
    ],
    quiz: [
      {
        q: 'Quem enxerga o seu IP real quando você usa o Tor?',
        options: [
          'Todos os três nós',
          'Somente o primeiro nó (guardião)',
          'Somente o nó de saída',
          'Ninguém — o IP desaparece da rede',
        ],
        correct: 1,
        explain: 'Só o guardião conhece a origem; só a saída conhece o destino. A segurança mora em nenhum nó saber as duas pontas.',
      },
      {
        q: 'O que o nó de SAÍDA consegue observar?',
        options: [
          'Seu IP e sua localização exata',
          'O destino acessado e o conteúdo que não estiver criptografado',
          'As senhas mesmo em sites com HTTPS',
          'Nada — a saída só repassa pacotes cegos',
        ],
        correct: 1,
        explain: 'A camada final é aberta no destino. Sem HTTPS, o conteúdo passa em texto claro pelas mãos de um desconhecido — HTTPS é obrigatório dentro do Tor.',
      },
      {
        q: 'Por que NÃO maximizar a janela do Tor Browser?',
        options: [
          'Porque quebra o túnel criptográfico',
          'Porque o tamanho da janela entra no fingerprint — maximizar cria uma assinatura rara',
          'Porque o navegador reinicia',
          'Porque consome mais dados do relay',
        ],
        correct: 1,
        explain: 'O Tor Browser padroniza dimensões para você parecer com a multidão. Redimensionar a janela fabrica uma assinatura própria — o oposto do objetivo.',
      },
    ],
  },
  {
    id: 'm4',
    title: 'Navegador e fingerprint: fugindo da unicidade',
    icon: 'fingerprint',
    summary: 'Canvas, WebGL, fontes e User-Agent: como sua combinação vira assinatura — e como diluir.',
    lesson: [
      'Seu navegador é um coporto de detalhes: User-Agent, resolução, fontes instaladas, fuso, idioma, extensões e o jeito único como a placa de vídeo desenha (canvas e WebGL). Separados, são atributos inofensivos. Juntos, formam uma impressão digital com boa chance de ser única no planeta.',
      'Teste você mesmo: o projeto Cover Your Tracks, da EFF, mede o quão raro é o seu conjunto. O objetivo do hardening não é ficar invisível — é fugir da unicidade. No Firefox: privacy.resistFingerprinting (iguala relógio, tela e User-Agent aos da multidão), uBlock Origin para cortar rastreadores e contêineres multi-account para separar identidades no mesmo navegador.',
      'Cuidado com truques que pioram tudo: User-Agent falso e exótico te DESTACA em vez de esconder; dez extensões "anti-rastreio" criam um fingerprint próprio e reconhecível. Menos é mais: navegador limpo e uniforme, JavaScript bloqueado quando a função permite, e a regra mais forte de todas — navegadores ou perfis diferentes para identidades diferentes.',
    ],
    checklist: [
      'Rodar o teste da EFF e medir sua unicidade',
      'Ativar privacy.resistFingerprinting no Firefox',
      'Instalar uBlock Origin e nada além do necessário',
      'Usar contêineres ou perfis por identidade',
      'Evitar User-Agents falsos e personalizações exóticas',
    ],
    quiz: [
      {
        q: 'O que o canvas fingerprinting faz?',
        options: [
          'Desenha pixels invisíveis e mede o resultado para gerar um hash do hardware/software',
          'Rouba as imagens do seu histórico',
          'Grava um cookie escondido no cache de vídeo',
          'Instala um rastreador na placa de vídeo',
        ],
        correct: 0,
        explain: 'O mesmo desenho produz pixels levemente diferentes em cada combinação de GPU, driver e fontes. O hash dessa diferença é estável — e identifica você sem armazenar nada.',
      },
      {
        q: 'Qual ação provavelmente PIORA a sua privacidade?',
        options: [
          'Bloquear JavaScript em sites desconhecidos',
          'Instalar um User-Agent raro e único',
          'Usar uBlock Origin com listas padrão',
          'Manter o navegador atualizado',
        ],
        correct: 1,
        explain: 'Fingerprint é unicidade. Um User-Agent de mil usuários no mundo é um farol: você deixa de parecer a multidão e passa a ser um caso único — fácil de seguir.',
      },
      {
        q: 'Bloquear JavaScript ajuda a reduzir o rastreamento porque…',
        options: [
          'Desliga a internet dos rastreadores',
          'A maior parte da coleta de fingerprint roda via scripts — sem JS, boa parte da medição para',
          'Impede o site de saber seu IP',
          'Apaga os cookies automaticamente',
        ],
        correct: 1,
        explain: 'Sem scripts não há canvas, WebGL, sondagem de fontes ou beacons. Custo: muitos sites quebram — por isso é técnica para contextos sensíveis, não para todo dia.',
      },
    ],
  },
  {
    id: 'm5',
    title: 'Metadados e arquivos: limpando antes de compartilhar',
    icon: 'file',
    summary: 'EXIF, PDFs e documentos de Office guardam memória — aprenda a apagar antes de enviar.',
    lesson: [
      'Arquivos têm memória. O EXIF de uma foto guarda GPS, hora, modelo do aparelho e às vezes o número de série. Um PDF guarda autor, máquina criadora, software e histórico de revisões. Um .docx pode conter comentários e versões antigas de texto que você apagou — mas que continuam lá dentro, intactas.',
      'Limpar antes de compartilhar é rotina, não paranoia. O comando exiftool -all= arquivo.jpg remove os metadados da imagem; re-exportar ou "imprimir em PDF" achata o documento e mata camadas, revisões e anotações; simplesmente recomprimir a imagem (salvar de novo como JPG/PNG) já elimina a maioria dos EXIF. Melhor ainda: desligar a geolocalização da câmera do celular para o rastro nem nascer.',
      'Armadilhas clássicas: screenshots com barras de abas, nomes e horários visíveis; miniaturas que preservam EXIF mesmo depois de "limpar" a foto; documentos colaborativos (Docs, Office 365) cujo histórico de versões conta toda a sua história de edição. Antes de enviar, faça a pergunta de ouro: o que esse arquivo sabe sobre mim que o texto não deveria contar?',
    ],
    checklist: [
      'exiftool -all= no pipeline de qualquer envio',
      'Geolocalização da câmera desligada por padrão',
      'Exportar PDFs achatados, sem camadas nem revisões',
      'Revisar a área visível de cada screenshot',
      'Lembrar que histórico de versão colaborativo vaza',
    ],
    quiz: [
      {
        q: 'O que faz o comando "exiftool -all= foto.jpg"?',
        options: [
          'Comprime a foto para economizar espaço',
          'Remove os metadados embutidos no arquivo',
          'Envia a foto para a nuvem',
          'Criptografa a foto com senha',
        ],
        correct: 1,
        explain: 'O parâmetro -all= zera os blocos de metadados (EXIF, IPTC, XMP). A imagem visual continua igual — o dossiê embutido é que vai embora.',
      },
      {
        q: 'Antes de publicar a foto de um encontro presencial, o mais seguro é…',
        options: [
          'Publicar em modo "privado" e pronto',
          'Re-encodar/limpar o EXIF — de preferência já fotografar sem GPS',
          'Aplicar um filtro escuro na imagem',
          'Renomear o arquivo para algo genérico',
        ],
        correct: 1,
        explain: 'Renomear não toca no EXIF; filtro também não. Re-encodar remove o bloco de metadados — e fotografar sem GPS evita o risco desde a origem.',
      },
      {
        q: 'Seu relatório .docx tem revisões antigas sensíveis. O que fazer antes de enviar?',
        options: [
          'Aceitar as alterações e enviar o mesmo arquivo',
          'Exportar para um PDF achatado/limpo e enviar este',
          'Comprimir o .docx em ZIP antes de anexar',
          'Enviar normalmente — revisões antigas são apagadas ao enviar',
        ],
        correct: 1,
        explain: 'Aceitar alterações mantém o histórico no arquivo. O PDF achatado leva só a aparência final: sem camadas, sem comentários, sem versões.',
      },
    ],
  },
  {
    id: 'm6',
    title: 'Comunicação criptografada: E2E, Signal e verificação de chaves',
    icon: 'message',
    summary: 'A criptografia protege o canal — mas quem garante que a pessoa do outro lado é quem diz ser?',
    lesson: [
      'Criptografia de ponta a ponta (E2E) garante que só você e o destinatário conseguem ler a mensagem: o servidor que transporta vê apenas dados cifrados. HTTPS/TLS protege o caminho até um site; E2E protege a conversa inteira mesmo contra o dono do servidor. O Signal Protocol, usado pelo Signal, é a referência atual do setor.',
      'O elo fraco costuma ser a identidade. Como ter certeza de que a "Ana" do outro lado é a Ana? Comparando o safety number (número de segurança) ou o fingerprint das chaves por um canal diferente — uma ligação de voz, uma conversa pessoal. Se esse número muda sem explicação, o app avisa: nunca ignore, pode ser reinstalação… ou interceptação.',
      'Higiene completa: mensagens efêmeras para reduzir o que existe para vazar; backups cifrados com passphrase; cuidado com grupos (cada participante tem uma cópia); e a verdade dura — E2E protege o CANAL, não as pontas. Dispositivo comprometido significa conversa comprometida, com chave ou sem. Para fontes jornalísticas sensíveis, SecureDrop supera e-mail+PGP em segurança usável.',
    ],
    checklist: [
      'Verificar safety numbers por um segundo canal',
      'Ativar mensagens efêmeras em conversas sensíveis',
      'Manter backups cifrados com passphrase',
      'Não discutir operação em grupos grandes',
      'Atualizar o app: falhas de protocolo são corrigidas com o tempo',
    ],
    quiz: [
      {
        q: 'Qual a diferença entre HTTPS e criptografia E2E?',
        options: [
          'Nenhuma — são nomes para a mesma coisa',
          'HTTPS protege você↔servidor; E2E protege remetente↔destinatário, mesmo contra o servidor',
          'HTTPS é mais forte que E2E',
          'E2E só funciona em e-mails',
        ],
        correct: 1,
        explain: 'No HTTPS o servidor decifra tudo no meio do caminho. No E2E ele nunca tem a chave: transporta cifrado do início ao fim.',
      },
      {
        q: 'O safety number da sua conversa mudou do nada. O que você faz?',
        options: [
          'Ignora — apps mudam chaves toda hora',
          'Re-verifica por outro canal antes de continuar a conversa',
          'Desinstala e reinstala o app',
          'Manda a senha da conversa por e-mail',
        ],
        correct: 1,
        explain: 'Mudança de chave pode ser reinstalação inofensiva — ou troca de SIM/ataque. O protocolo avisa justamente para você confirmar fora do canal possivelmente comprometido.',
      },
      {
        q: 'O que a criptografia E2E NÃO protege?',
        options: [
          'O conteúdo das mensagens contra o servidor',
          'Os dispositivos nas pontas — tela aberta, malware, ombro alheio',
          'O texto contra o provedor da rede',
          'Nada — protege absolutamente tudo',
        ],
        correct: 1,
        explain: 'A mensagem nasce cifrada depois do teclado e morre antes da tela do outro. Tudo que estiver antes ou depois dessas pontas está fora do alcance da criptografia.',
      },
    ],
  },
  {
    id: 'm7',
    title: 'Higiene de identidade: pseudônimos que não colam',
    icon: 'user',
    summary: 'E-mails separados, senhas únicas, 2FA forte — e o erro nº 1: cruzar contextos.',
    lesson: [
      'Identidades se cruzam por acidente. O pseudônimo capy07 cai na tentação de usar o e-mail pessoal como recuperação, o número do celular, ou "só uma vez" a foto do perfil real. Algoritmos de correlação — e doxers pacientes — juntam esses fios rápido. Até o jeito de escrever (stylometry) entrega autoria: ritmo, pontuação, vícios de linguagem.',
      'A receita: uma identidade = um e-mail próprio, criado sem dados seus; navegador ou perfil de navegador dedicado; estilo de escrita e horários consistentes com a persona; zero material reaproveitado do mundo real (fotos, apelidos antigos, telefones, links de recuperação). Mantenha um mapa — mental ou cifrado — do que pertence a qual identidade.',
      'Base de tudo: gerenciador de senhas (KeePassXC, Bitwarden) para ter senha única e forte em cada serviço; 2FA por app autenticador (TOTP) ou chave física (FIDO2), nunca por SMS — a clonagem de chip (SIM swap) é um ataque real, barato e devastador. E revise o passado: um post antigo que liga duas identidades vale mais para o caçador do que dez exploits.',
    ],
    checklist: [
      'Uma identidade = um e-mail e um perfil de navegador',
      'Gerenciador de senhas com senha-mestre forte',
      '2FA por TOTP ou chave física — nunca SMS',
      'Nunca reutilizar foto, telefone ou e-mail entre identidades',
      'Auditar posts antigos que cruzem identidades',
    ],
    quiz: [
      {
        q: 'O que mais DELICADAMENTE liga o seu pseudônimo a você?',
        options: [
          'Usar horários diferentes para postar',
          'Reaproveitar a mesma foto ou username de outro perfil',
          'Escrever textos compridos',
          'Usar um e-mail recém-criado',
        ],
        correct: 1,
        explain: 'Busca reversa de imagem e comparação de usernames são o primeiro passo de qualquer doxer. Material visual reutilizado é um atalho direto entre identidades.',
      },
      {
        q: 'Qual é a forma mais resistente de segundo fator?',
        options: [
          'SMS no chip principal',
          'E-mail de recuperação',
          'Chave física FIDO2 (segunda melhor: app TOTP)',
          'Pergunta de segurança ("nome do primeiro animal")',
        ],
        correct: 2,
        explain: 'SMS cai com SIM swap; e-mail cai junto com a caixa; pergunta de segurança é adivinhável. Chave física verifica o domínio do site — phishing não a rouba.',
      },
      {
        q: 'Por que usar um gerenciador de senhas?',
        options: [
          'Para lembrar uma única senha-mestre e ter senhas únicas e fortes em todo o resto',
          'Para gerar senhas curtas e fáceis',
          'Para salvar senhas no navegador e sincronizar em texto claro',
          'Para evitar usar 2FA',
        ],
        correct: 0,
        explain: 'Reuso de senha é a porta de entrada de quase todo vazamento em cascata. Com o gerenciador, cada site tem uma senha única — o vazamento de um não abre os outros.',
      },
    ],
  },
  {
    id: 'm8',
    title: 'OPSEC operacional: modelo de ameaça, assume breach e rotina',
    icon: 'server',
    summary: 'Antes da ferramenta, o plano: quem te persegue, com o quê — e o que você faz quando o pior dia chegar.',
    lesson: [
      'OPSEC começa antes de qualquer ferramenta, com o modelo de ameaça: QUEM pode querer te rastrear (um colega chato? um doxer? a polícia? um estado?), COM QUE capacidade (acesso ao provedor? ação física? orçamento para falhas de dia zero?) e O QUE precisa ficar protegido. Defesas sem modelo de ameaça são armadura contra o inimigo errado.',
      'Assume breach: trabalhe assumindo que um dia a máquina cai. A pergunta muda de "como evito ser invadido?" para "quanto dano esse dia causa?". A resposta boa é: o mínimo possível. Compartimentalização (nada sensível morando junto), dados mínimos guardados e um plano escrito do que fazer na primeira hora de um incidente: isolar, girar credenciais, avaliar, comunicar.',
      'Rotina operacional: máquina virtual descartável (ou Tails/Qubes) para atividades sensíveis; DNS criptografado (DoH/DoT) ou resolvido dentro do túnel; Wi-Fi público tratado como hostil — VPN/Tor ativos, nada de portal cativo com login social; disco cifrado, tela travada, cabos que só carregam energia. E atualizações em dia: a maioria das invasões reais usa porta velha aberta, não magia.',
    ],
    checklist: [
      'Escrever seu modelo de ameaça em uma página',
      'VM descartável ou Tails para operação sensível',
      'DoH/DoT ativo ou DNS resolvido pelo túnel',
      'Wi-Fi público tratado como rede hostil',
      'Disco cifrado + plano de resposta a incidente',
    ],
    quiz: [
      {
        q: 'Qual é o primeiro passo de um plano de OPSEC?',
        options: [
          'Instalar a VPN mais cara do mercado',
          'Definir o modelo de ameaça: quem, com o quê, protegendo o quê',
          'Comprar um notebook novo',
          'Apagar todas as redes sociais',
        ],
        correct: 1,
        explain: 'Sem saber contra quem (e com que capacidade) você se defende, qualquer ferramenta é chute. O modelo de ameaça prioriza o que importa — e ignora o que é teatro.',
      },
      {
        q: 'Num Wi-Fi público, a postagem correta é…',
        options: [
          'Confiar, afinal o café é confiável',
          'Tratá-lo como hostil: VPN/Tor ativos, HTTPS, nada de login sensível sem túnel',
          'Conectar só para checar e-mails rapidinho',
          'Desligar o firewall para o portal funcionar',
        ],
        correct: 1,
        explain: 'Você não sabe quem controla o roteador — nem quem está sentado ao lado farejando. Rede alheia é rede hostil até prova em contrário.',
      },
      {
        q: '"Assume breach" significa…',
        options: [
          'Desistir da segurança porque todo mundo é invadido',
          'Operar assumindo que a falha pode ocorrer e minimizar o dano quando ocorrer',
          'Contratar seguro contra hackers',
          'Denunciar o ataque à polícia imediatamente',
        ],
        correct: 1,
        explain: 'Não é fatalismo: é arquitetura. Dados mínimos guardados, compartimentos separados e plano de resposta transformam um desastre numa terça-feira chata.',
      },
    ],
  },
]

/* ══════════════════ missões simuladas (laboratório CAPYBER) ══════════════════ */

export const MISSIONS: Mission[] = [
  {
    id: 'op01',
    codename: 'Recon Limpo',
    target: 'Alvo-07 · portal de treino lab-capy07.local (fictício)',
    brief: [
      'O laboratório CAPYBER liberou o portal de treino "Alvo-07" para este exercício. Toda a infraestrutura é fictícia e autorizada — mas o diário de bordo do laboratório registra CADA pacote que chega.',
      'Sua tarefa: mapear as informações públicas do alvo sem deixar o seu cartão de visitas no log.',
    ],
    mentorTip: 'Antes da ferramenta, o ambiente. O recon revela mais sobre quem varre do que sobre o alvo.',
    clearText: 'Logs do laboratório conferidos: nenhuma origem real exposta. Recon limpo, operador.',
    steps: [
      {
        prompt: 'Onde você vai executar o recon do Alvo-07?',
        options: [
          {
            label: 'VM descartável com navegador limpo, via túnel do laboratório',
            cost: 0,
            feedback: 'Perfeito: máquina isolada, sem extensões, tráfego pelo túnel do lab. O log do alvo vê um IP do laboratório — o seu nunca aparece.',
          },
          {
            label: 'Seu navegador do dia a dia, direto de casa',
            cost: 2,
            feedback: 'Cookies, extensões e seu IP doméstico foram junto. O log do alvo agora sabe seu bairro, seu provedor e que você usa 14 fontes exóticas. Cada requisição assina seu nome.',
          },
          {
            label: 'Notebook do trabalho, com o e-mail corporativo logado',
            cost: 3,
            feedback: 'Você cruzou a identidade profissional com a operação. O alvo (e qualquer investigador) agora sabe em qual empresa o "anonimato" senta das 9 às 18.',
          },
        ],
      },
      {
        prompt: 'Como você vai pesquisar dorks e dados públicos sobre o alvo?',
        options: [
          {
            label: 'Busca pelo túnel do lab, sem login, com scripts bloqueados',
            cost: 0,
            feedback: 'Consulta sem conta, sem JavaScript e pelo túnel: o motor de busca não liga a pesquisa ao seu perfil e não injeta rastreadores na sessão.',
          },
          {
            label: 'Logado na sua conta pessoal, com histórico ligado',
            cost: 2,
            feedback: 'Sua conta pessoal acabou de arquivar "dorks do Alvo-07" no histórico sincronizado. O histórico de buscas é o diário que você não sabia que mantinha.',
          },
          {
            label: 'Baixar uma ferramenta "milagrosa" de fórum aleatório',
            cost: 3,
            feedback: 'Ferramenta pirata = presente embrulhado: telemetria embutida, talvez malware. Metade dos "hackers" de fórum é rastreada pela própria ferramenta.',
          },
        ],
      },
      {
        prompt: 'Onde guardar as anotações desta missão?',
        options: [
          {
            label: 'Pasta cifrada dentro da VM, sob o pseudônimo da operação',
            cost: 0,
            feedback: 'Anotações cifradas, dentro do compartimento certo, assinadas pela persona. Se a máquina vazar, vaza ruído — não dossiê.',
          },
          {
            label: 'Documento na sua nuvem pessoal com seu nome real',
            cost: 1,
            feedback: 'A nuvem pessoal anexou sua identidade real à operação. Metadado de conta + nome do arquivo = trilha pronta para cruzamento.',
          },
          {
            label: 'Print colado no grupo da família para "guardar"',
            cost: 3,
            feedback: 'O grupo da família sincroniza com o celular da sua mãe, do seu tio… e com qualquer um que pegue os celulares emprestados. OPSEC morre no compartilhamento casual.',
          },
        ],
      },
    ],
  },
  {
    id: 'op02',
    codename: 'Varredura Silenciosa',
    target: 'Range de treino 10.66.0.24/24 do laboratório (fictício)',
    brief: [
      'O laboratório autorizou uma varredura do range de treino. Autorizada no papel — mas o IDS (detector de intrusão) do lab mede COMO você varre: ritmo, origem, destino e o que você faz com o resultado.',
      'Não seja um elefante num corredor de vidro.',
    ],
    mentorTip: 'Varredura educada é varredura lenta e delimitada. Pressa no scan é declaração de presença.',
    clearText: 'IDS registrou varredura educada e sem origem real. O corredor de vidro nem ouviu você passar.',
    steps: [
      {
        prompt: 'De onde parte a varredura?',
        options: [
          {
            label: 'Da VM de operação, pela VPN dedicada do exercício',
            cost: 0,
            feedback: 'Origem do laboratório, ambiente isolado: o range de treino vê um visitante do próprio lab. Zero traço real.',
          },
          {
            label: 'Direto do Wi-Fi de casa',
            cost: 2,
            feedback: 'Seu IP residencial agora é o autor de uma varredura de portas. Mesmo autorizada, ficou associada à sua casa no registro do exercício.',
          },
          {
            label: 'Do hotspot do seu celular pessoal',
            cost: 3,
            feedback: 'O chip está no seu CPF: a operadora liga o tráfego a você em segundos. Hotspot pessoal é identidade carimbada, não anonimato.',
          },
        ],
      },
      {
        prompt: 'Como configurar a ferramenta de varredura?',
        options: [
          {
            label: 'Varredura lenta e delimitada (--max-rate), só nos alvos autorizados',
            cost: 0,
            feedback: 'Ritmo educado, escopo fechado no autorizado: o IDS classifica como exercício e segue o baile. Educação operacional também é OPSEC.',
          },
          {
            label: 'Scanner gráfico "tudo de uma vez", plugins em disparada',
            cost: 1,
            feedback: 'Varredura barulhenta: o IDS disparou 47 alertas. Ninguém te pegou — desta vez — mas sua assinatura de varredura ficou famosa no diário do lab.',
          },
          {
            label: 'Script copiado de fórum com "recursos secretos"',
            cost: 3,
            feedback: 'O "recurso secreto" era um beacon: o script telefonou para casa contando tudo — incluindo seu IP e o range varrido. Script alheio é rastreador alheio.',
          },
        ],
      },
      {
        prompt: 'A varredura terminou. O que você faz com os resultados?',
        options: [
          {
            label: 'Exportar para a pasta cifrada da VM, no pseudônimo',
            cost: 0,
            feedback: 'Resultado cifrado no compartimento da operação. Relatório existe, rastro não.',
          },
          {
            label: 'Colar tudo num pastebin público "para não perder"',
            cost: 3,
            feedback: 'O pastebin público publicou sua varredura para o mundo — com timestamps, ferramenta e padrão. Arquivos públicos são lembranças permanentes.',
          },
          {
            label: 'Mandar no grupo da turma para "mostrar o progresso"',
            cost: 2,
            feedback: 'Agora 30 pessoas têm o resultado (e as capturas de tela têm seu nome de usuário). Compartimentalização quebra com um forward.',
          },
        ],
      },
    ],
  },
  {
    id: 'op03',
    codename: 'Chaves do Portal',
    target: 'Portal de credenciais de treino do laboratório (fictício)',
    brief: [
      'O laboratório entregou credenciais de treino para o portal do exercício (usuário operador-capy, senha guardada onde VOCÊ escolher guardar). O portal exige segundo fator.',
      'Missão: acessar sem virar vítima clássica de roubo de credencial ou de sessão.',
    ],
    mentorTip: 'Credencial é identidade. Onde ela mora, quem a carrega e como a sessão morre — cada detalhe conta.',
    clearText: 'Acesso limpo: credencial no cofre, 2FA forte, sessão morta ao sair. O portal não sabe seu nome.',
    steps: [
      {
        prompt: 'Onde guardar a senha de treino?',
        options: [
          {
            label: 'No gerenciador de senhas, atrás de uma senha-mestre forte',
            cost: 0,
            feedback: 'Cofre certo: senha única, gerada, invisível até para você. O gerenciador é a diferença entre memória e memória auxiliada por criptografia.',
          },
          {
            label: 'Num bloco de notas do celular (sem criptografia)',
            cost: 3,
            feedback: 'Notas do celular sincronizam com a nuvem, backup de apps e às vezes com o teclado preditivo. Senha em nota = senha em três lugares que você não controla.',
          },
          {
            label: 'Num post-it no monitor, como no filme',
            cost: 2,
            feedback: 'Funciona no cinema porque o roteirista escreve o roteiro. Na vida real, o post-it é o exploit mais barato do mundo — quem passa atrás de você lê.',
          },
        ],
      },
      {
        prompt: 'Como você configura o segundo fator do portal?',
        options: [
          {
            label: 'App autenticador (TOTP) ou chave física',
            cost: 0,
            feedback: 'TOTP/chave física: o código nasce no seu bolso e morre em 30 segundos. Chave física ainda verifica o domínio — phishing não a rouba.',
          },
          {
            label: 'SMS no seu chip principal',
            cost: 2,
            feedback: 'SMS depende do chip — e chips se clonam (SIM swap). O segundo fator que mora no seu CPF não é fator, é formalidade.',
          },
          {
            label: 'Reaproveitar os códigos de outro serviço',
            cost: 3,
            feedback: 'Códigos TOTP são sementes únicas por serviço. Reaproveitar é demolir o segundo fator dos dois lados de uma vez.',
          },
        ],
      },
      {
        prompt: 'A sessão no portal está aberta e o cookie é valioso. Ao encerrar…',
        options: [
          {
            label: 'Logout, cookies apagados, na janela dedicada da operação',
            cost: 0,
            feedback: 'Sessão morta, cookie enterrado, janela da persona limpa. Um cookie abandonado é uma credencial que não precisa de senha.',
          },
          {
            label: 'Deixar logado "para agilizar amanhã"',
            cost: 2,
            feedback: 'Cookie vivo = sessão viva. Malware, familiar curioso ou o próximo usuário da máquina entram sem senha. Comodidade é o nome do buraco.',
          },
          {
            label: 'Exportar o cookie e enviar à parceira da missão',
            cost: 3,
            feedback: 'Sequestro de sessão — mesmo entre aliados, o cookie em trânsito é credencial solta: copia, vaza, vira cadeia de responsabilidade. Sessão não se compartilha.',
          },
        ],
      },
    ],
  },
  {
    id: 'op04',
    codename: 'Relatório Sem Cheiro',
    target: 'Relatório de achados do Alvo-07 (exercício fictício)',
    brief: [
      'Você terminou o relatório do Alvo-07. Antes de entregá-lo ao coordenador do laboratório, o documento precisa estar limpo: arquivos falam mais do que o texto mostra.',
      'O coordenador vai executar "exiftool" no que você mandar. Capaz de te identificar pelo autor do PDF?',
    ],
    mentorTip: 'Todo arquivo nasce com passaporte. Quem envia sem ler o passaporte viaja junto.',
    clearText: 'Relatório achatado, sem EXIF, canal E2E. O exiftool do coordenador encontrou apenas elogios.',
    steps: [
      {
        prompt: 'O documento carrega suas propriedades (autor, máquina, revisões). O que fazer?',
        options: [
          {
            label: 'Limpar metadados e exportar PDF achatado',
            cost: 0,
            feedback: 'exiftool -all= + export achatado: autor, máquina e histórico evaporam. O documento agora conta só o que você quis contar.',
          },
          {
            label: 'Enviar o .docx original como está',
            cost: 2,
            feedback: 'O .docx chegou com "Autor: Seu Nome Completo", nome do seu computador e três revisões antigas. O relatório entregou o autor de graça.',
          },
          {
            label: 'Enviar um print do editor aberto, com seu nome na tela',
            cost: 3,
            feedback: 'O print mostrou barra de tarefas, abas, nome do usuário e hora. Um screenshot é um dossiê recortado — ninguém limpa o que não percebe que está lá.',
          },
        ],
      },
      {
        prompt: 'Como enviar o relatório ao coordenador?',
        options: [
          {
            label: 'Pelo canal E2E do laboratório, com mensagem efêmera',
            cost: 0,
            feedback: 'Canal E2E verificado, mensagem que se apaga: o relatório existe para quem precisa e não mora em servidor nenhum.',
          },
          {
            label: 'Anexo por e-mail pessoal, assunto "hack do Alvo-07"',
            cost: 2,
            feedback: 'Cabeçalhos de e-mail guardam rotas, horários e assunto. Assunto chamativo + conta pessoal = trilha indexável para sempre nos servidores.',
          },
          {
            label: 'Link público do seu drive pessoal',
            cost: 3,
            feedback: 'Link público com sua conta real: dono visível, contadores de acesso, histórico. Você publicou o relatório com o crachá pendurado.',
          },
        ],
      },
      {
        prompt: 'Precisa anexar fotos do laboratório tiradas hoje. Como prepará-las?',
        options: [
          {
            label: 'Fotografar sem geotag, limpar EXIF e renomear',
            cost: 0,
            feedback: 'Sem GPS desde a origem, EXIF zerado no pipeline: a foto mostra o laboratório, não a rota até a sua mesa.',
          },
          {
            label: 'Enviar as originais da câmera, com GPS e serial',
            cost: 3,
            feedback: 'EXIF original = coordenadas do momento da foto, modelo, serial. Quem abrir as propriedades sabe o logradouro e a hora exata.',
          },
          {
            label: 'Baixar fotos do perfil público de outra pessoa',
            cost: 2,
            feedback: 'Além do risco jurídico, fotos de terceiros carregam a identidade DELES — você misturou duas trilhas que não deviam se tocar.',
          },
        ],
      },
    ],
  },
  {
    id: 'op05',
    codename: 'Encontro das Capivaras',
    target: 'Canal de comunicação com a operadora parceira Ana-Capy (exercício)',
    brief: [
      'O laboratório designou a operadora "Ana-Capy" como sua parceira. Vocês precisam alinhar os próximos passos do exercício.',
      'Detalhe: o "adversário vermelho" do lab está ouvindo TODOS os canais abertos. Escolha onde, como e com quem falar.',
    ],
    mentorTip: 'Canal certo, identidade verificada, arquivo suspeito na gaiola. Conversa segura é tríade, não sorte.',
    clearText: 'Alinhamento feito por canal E2E, identidade verificada e anexo aberto na gaiola. O adversário vermelho ouviu apenas estática.',
    steps: [
      {
        prompt: 'Qual canal você escolhe para falar com a Ana-Capy?',
        options: [
          {
            label: 'Mensageiro E2E (Signal), mensagens efêmeras, safety number verificado',
            cost: 0,
            feedback: 'E2E + efemeridade + verificação: mesmo o adversário vermelho capturando pacotes, colhe cifrado que expira. É o padrão ouro do exercício.',
          },
          {
            label: 'O chat aberto do jogo, com apelidos óbvios',
            cost: 3,
            feedback: 'Canal aberto = conferência pública. O adversário vermelho anotou os apelidos, os horários e o plano. Chat aberto é megafone.',
          },
          {
            label: 'E-mail pessoal com assunto "PRECISAMOS CONVERSAR (secreto)"',
            cost: 2,
            feedback: 'E-mail não é E2E: servidores guardam cabeçalhos. Assunto alarmante + conta pessoal = trilha indexável e curiosa para sempre.',
          },
        ],
      },
      {
        prompt: 'Como garantir que você fala com a Ana-Capy de verdade?',
        options: [
          {
            label: 'Comparar o safety number por um canal combinado antes',
            cost: 0,
            feedback: 'Verificação por canal independente: mesmo um adversário no meio não consegue bater as duas pontas ao mesmo tempo. Aliança verificada.',
          },
          {
            label: 'Confiar na foto e no nome do perfil',
            cost: 2,
            feedback: 'Foto e nome se copiam com dois cliques. Perfil não é identidade — é um cartão de visita que qualquer um imprime.',
          },
          {
            label: 'Pedir para o adversário vermelho confirmar',
            cost: 3,
            feedback: 'Perguntar ao lobo se o lobo é o lobo. O adversário confirmou, claro — e ganhou a operação inteira de presente.',
          },
        ],
      },
      {
        prompt: 'A Ana-Capy manda um .zip "da equipe". O que você faz?',
        options: [
          {
            label: 'Abrir só na VM descartável, escanear, sem privilégios',
            cost: 0,
            feedback: 'Anexo suspeito na gaiola: VM isolada, rede limitada, snapshot antes. Se explodir, explode num mundo descartável.',
          },
          {
            label: 'Abrir direto na sua máquina principal, como administrador',
            cost: 3,
            feedback: 'Anexo desconhecido + admin na máquina principal = o adversário dentro de casa. Toda a compartimentalização da operação foi de uma vez.',
          },
          {
            label: 'Abrir no computador do trabalho',
            cost: 2,
            feedback: 'Você emprestou a rede e a identidade da empresa ao exercício. Cruzamento de contexto + incidente corporativo: dupla falta com um duplo clique.',
          },
        ],
      },
    ],
  },
  {
    id: 'op06',
    codename: 'Pseudônimo à Prova de Stylometry',
    target: 'Fórum fictício do laboratório (persona de treino "Capy-07")',
    brief: [
      'O laboratório pediu uma identidade de cobertura para o fórum do exercício: a persona "Capy-07". Criar o pseudônimo é fácil — manter ele vivo e desligado do seu mundo é o desafio.',
      'Cada detalhe abaixo é uma chance de costurar Capy-07 com você.',
    ],
    mentorTip: 'Pseudônimo não é máscara: é rotina. E-mail limpo, material novo, janelas separadas.',
    clearText: 'Persona Capy-07 operando isolada: nenhum fio puxado entre o fórum e o mundo real. Stylometry aprovou.',
    steps: [
      {
        prompt: 'Como criar o e-mail da persona?',
        options: [
          {
            label: 'Conta nova, sem telefone/contatos seus, criada pelo túnel',
            cost: 0,
            feedback: 'Nascimento limpo: sem número, sem contatos, sem IP real no cadastro. A conta nasce órfã — é exatamente isso que ela deve ser.',
          },
          {
            label: 'Seu e-mail pessoal com ponto extra (capy.07@)',
            cost: 3,
            feedback: 'Provedores tratam ponto como detalhe; sistemas de correlação tratam como identidade. Você acabou de assinar o pseudônimo com o seu nome.',
          },
          {
            label: 'Conta nova, mas recuperada pelo seu número de celular',
            cost: 2,
            feedback: 'O telefone de recuperação é o cabo de aço entre a persona e você. Um vazamento do provedor e a corrente aparece inteira.',
          },
        ],
      },
      {
        prompt: 'O fórum pede avatar e bio para Capy-07. O que usar?',
        options: [
          {
            label: 'Imagem gerada, texto da persona, horários plausíveis',
            cost: 0,
            feedback: 'Material sem vínculo com o mundo real + rotina consistente: a persona é crível e não puxa fio nenhum para casa.',
          },
          {
            label: 'Uma foto sua "do ano passado, ninguém reconhece"',
            cost: 3,
            feedback: 'Busca reversa de imagem não perdoa. A foto "antiga" é um cordão umbilical de alta resolução entre Capy-07 e você.',
          },
          {
            label: 'A foto do seu cachorro, que também está no seu perfil real',
            cost: 2,
            feedback: 'Imagem reversa cruza os dois perfis na hora — o cachorro virou ponte entre identidades. Até o bicho fez OPSEC errado.',
          },
        ],
      },
      {
        prompt: 'Numa pressa, você quase posta no fórum pelo perfil real. Protocolo?',
        options: [
          {
            label: 'Navegadores/janelas separados por identidade + revisão antes de enviar',
            cost: 0,
            feedback: 'Separação física (perfis/janelas) torna o erro difícil; a revisão vira hábito. Errar fica estruturalmente difícil — isso é OPSEC maduro.',
          },
          {
            label: 'Postar e torcer para ninguém notar',
            cost: 2,
            feedback: 'Screenshots são eternos e colecionadores de lapsos existem. Torcer não é controle — é esperança gerenciando risco.',
          },
          {
            label: 'Apagar a conta real e criar outra do zero',
            cost: 3,
            feedback: 'Pânico + ação drástica = mais traços: notificações, e-mails, espelho para conhecidos. Incidente se contém com plano, não com fogo.',
          },
        ],
      },
    ],
  },
  {
    id: 'op07',
    codename: 'Café Capivara',
    target: 'Rede Wi-Fi simulada "cafe-capy" (adversário controla o roteador)',
    brief: [
      'O laboratório simula um café: rede "cafe-capy", portal cativo e um detalhe — o "adversário vermelho" controla o roteador.',
      'Missão: consultar o painel do Alvo-07 por essa rede sem entregar nada. Boa sorte: o café é hostil.',
    ],
    mentorTip: 'Rede alheia é rede hostil. Túnel antes do café, DNS criptografado, portal cativo com desconfiança.',
    clearText: 'Você tomou o café por cima do túnel: o adversário viu pacotes cifrados indo para lugar nenhum útil.',
    steps: [
      {
        prompt: 'Antes de abrir qualquer coisa na rede do café…',
        options: [
          {
            label: 'Desligar compartilhamentos, VPN do exercício ativa com kill switch',
            cost: 0,
            feedback: 'Postura correta: superfície fechada, túnel antes do primeiro pacote, kill switch de guarda. O roteador hostil só vê um tubo cifrado.',
          },
          {
            label: 'Conectar e aceitar o certificado do "portal do café"',
            cost: 2,
            feedback: 'Certificado estranho aceito = o roteador agora pode intermediar tudo (MITM). O portal cativo do adversário agradece a confiança.',
          },
          {
            label: 'Conectar direto, afinal "é só olhar uma página"',
            cost: 3,
            feedback: 'O primeiro pacote já anunciou seus domínios, seu dispositivo e seus horários. No café do adversário, até o DNS é microfone.',
          },
        ],
      },
      {
        prompt: 'O portal cativo do café pede "entre com sua conta para navegar".',
        options: [
          {
            label: 'Nada de login social: seguir pelo túnel, identidade descartável se precisar',
            cost: 0,
            feedback: 'Portal cativo não autentica — coleta. Você passou sem entregar conta nenhuma: o café continua sem saber quem toma o café.',
          },
          {
            label: 'Logar com sua conta Google real para liberar rápido',
            cost: 3,
            feedback: 'OAuth com conta real: o roteador (e quem o controla) recebe identidade, e-mail e escopo. Você trocou Wi-Fi por crachá.',
          },
          {
            label: 'Logar com a conta do pseudônimo Capy-07',
            cost: 2,
            feedback: 'Melhor que a conta real, mas ainda ligou a persona a um local físico e horário. Personas também não frequentam cafés hostis.',
          },
        ],
      },
      {
        prompt: 'O adversário intercepta consultas DNS para mapear seus acessos.',
        options: [
          {
            label: 'DNS pelo túnel (ou DoH/DoT): consultas cifradas junto ao resto',
            cost: 0,
            feedback: 'DNS dentro do túnel: o roteador hostil vê pacotes opacos, não uma lista dos seus destinos. O mapa que ele desenha é um borrão.',
          },
          {
            label: 'Usar o DNS do roteador do café',
            cost: 2,
            feedback: 'Entregar o DNS é entregar o índice do livro: cada consulta revela destino, padrão e horário — o perfil de navegação inteiro.',
          },
          {
            label: 'Digitar IPs direto na barra e esquecer o resto',
            cost: 1,
            feedback: 'Escapou do DNS, mas o SNI do TLS e o tráfego ainda desenham padrões. Meia solução é meio traço — e traços somam.',
          },
        ],
      },
    ],
  },
  {
    id: 'op08',
    codename: 'Assume Breach (Exame Final)',
    target: 'Simulação de comprometimento da estação de operação (exercício)',
    brief: [
      'Exame final do laboratório: eles vão SIMULAR o pior dia — você desconfia que a máquina de operação foi comprometida.',
      'Quem aplica tudo que aprendeu encerra a operação limpo. Quem improvisa, vira estatística. Esta é a última missão.',
    ],
    mentorTip: 'O pior dia já está no calendário. OPSEC de verdade é o que acontece DEPOIS do susto.',
    clearText: 'Incidente contido, identidade rotacionada, relatório limpo. O laboratório carimba: OPERADOR INRASTREÁVEL.',
    steps: [
      {
        prompt: 'Você desconfia que a máquina foi comprometida. Primeira ação?',
        options: [
          {
            label: 'Isolar a máquina da rede, girar credenciais de OUTRO dispositivo, seguir o plano',
            cost: 0,
            feedback: 'Resposta de manual: rede cortada, credenciais giradas de fora da máquina suspeita, plano de resposta em mãos. O incidente vira terça-feira chata.',
          },
          {
            label: 'Continuar operando "com mais cuidado"',
            cost: 3,
            feedback: 'Operar sobre máquina comprometida é sussurrar no ouvido do adversário. Cada ação seguinte ensina ele mais sobre você.',
          },
          {
            label: 'Baixar um "antivírus turbo" de fórum para dar conta',
            cost: 2,
            feedback: 'Ferramenta não verificada sobre máquina suspeita é segunda infecção com cara de solução. Incidente se resolve com plano — não com esperança empacotada.',
          },
        ],
      },
      {
        prompt: 'Contido o incidente, como encerrar a identidade Capy-07?',
        options: [
          {
            label: 'Rotação planejada: novo pseudônimo sem vínculos, arquivos cifrados arquivados',
            cost: 0,
            feedback: 'Rotação limpa: nada liga a velha persona à nova; o arquivo morto é cifrado e mínimo. Identidades se aposentam com contabilidade.',
          },
          {
            label: 'Postar um "adeus" no fórum explicando a operação',
            cost: 3,
            feedback: 'A despedida virou confissão pública: roteiro, horários, motivo. O que era uma persona virou um estudo de caso com seu dedo assinando.',
          },
          {
            label: 'Reaproveitar a senha da persona na próxima identidade',
            cost: 2,
            feedback: 'Senha reutilizada é um rabisco permanente ligando duas identidades. Vazou numa, achou a outra — rotação de persona exige rotação de segredos.',
          },
        ],
      },
      {
        prompt: 'Relatório final do laboratório: provar o aprendizado sem expor nada. Como?',
        options: [
          {
            label: 'Resumo das lições + checklist aplicada, metadados limpos, pelo canal E2E',
            cost: 0,
            feedback: 'O relatório ensina sem expor: lições, checklist, zero metadado, canal verificado. É o espírito do certificado que vem por aí.',
          },
          {
            label: 'Anexar os logs crus com IPs reais e horários',
            cost: 3,
            feedback: 'Logs crus = timeline completa com origem real. Você entregaria ao laboratório (e a quem mais tiver o arquivo) o mapa exato de quem você é.',
          },
          {
            label: 'Gravar um vídeo mostrando a tela e seu rosto',
            cost: 2,
            feedback: 'Rosto + tela + ambiente = identidade, contexto e rotina num só arquivo. Vídeo é o formato de maior densidade de vazamento que existe.',
          },
        ],
      },
    ],
  },
]

/* ══════════════════════════════ derivados ══════════════════════════════ */

export const TOTAL_SAFE_CHOICES = MISSIONS.length * 3

export function isModuleDone(progress: StealthProgress, id: string): boolean {
  return progress.modulesDone.includes(id)
}

export function courseComplete(progress: StealthProgress): boolean {
  return COURSE_MODULES.every((m) => progress.modulesDone.includes(m.id))
}
