// CAPYBER — Base de conhecimento do Capy Fantasma (mascote IA)
// Combinação de sinônimos × objetos × ameaças gera milhares de formas de pergunta
// reconhecíveis pelo matcher (contagem calculada em KB_STATS de forma combinatória e honesta).

export interface KbTopic {
  id: string
  title: string
  keywords: string[] // frases/palavras-chave (normalizadas automaticamente)
  objects: string[] // objetos protegidos, com artigo ("minha senha")
  atkNouns: string[] // nomes da ameaça ("ransomware")
  answer: string
  tips: string[]
  planRefs: string[]
  mitre?: string
}

const DEF_VERBS = ['proteger', 'prevenir', 'evitar', 'bloquear', 'defender', 'impedir', 'se blindar contra', 'combater']

export const TOPICS: KbTopic[] = [
  {
    id: 'senha-forte', title: 'Senhas fortes',
    keywords: ['senha', 'senhas', 'password', 'senha forte', '123456', 'senha fraca'],
    objects: ['minha senha', 'minhas senhas', 'meu password', 'a senha do banco', 'a senha do email'],
    atkNouns: ['hackers', 'ataques de força bruta', 'roubo de senha', 'crackers'],
    answer:
      'Ah, a clássica "senha123"... Nem capivara usa isso, e capivara nem tem senha! Regra de ouro: senha longa (>14 caracteres) e ÚNICA para cada serviço. O melhor jeito? Nem você precisa decorar — usa um gerenciador de senhas e deixa ele inventar coisas tipo "Tr7$mala-de-capiVARA-92x!". Aí nem o fantasma mais teimoso do Planeta acerta.',
    tips: [
      'Mínimo de 14 caracteres — comprimento vence complexidade',
      'Nunca reutilize senha entre serviços (uma vaza, tudo vaza)',
      'Use frases-senha: "CapiVara@Nada#De#Golpe!2026" é forte e você lembra',
      'Ative alerta de vazamento no seu gerenciador',
    ],
    planRefs: ['P04', 'P03'], mitre: 'T1110',
  },
  {
    id: 'gestor-senhas', title: 'Gerenciador de senhas',
    keywords: ['gerenciador de senhas', 'cofre de senhas', 'bitwarden', '1password', 'lastpass', 'kepass', 'keepass'],
    objects: ['minhas senhas', 'meus logins', 'meus cadastros'],
    atkNouns: ['esquecimento', 'roubo de credenciais', 'vazamentos'],
    answer:
      'Gerenciador de senhas é tipo bolsa de capivara: guarda tudo e a capivara não se preocupa com nada. Bitwarden, 1Password, KeePass — escolhe o seu, ativa no navegador e no celular, e deixa ele gerar senhas aleatórias. Você só precisa decorar UMA senha-mestra (que não pode ser "capivara123", juro por mim, fantasma).',
    tips: [
      'Prefira gerenciadores com auditoria de vazamentos integrada',
      'A senha-mestra deve ser longa e única',
      'Compartilhamento familiar/empresarial é mais seguro pelo cofre do que por WhatsApp',
    ],
    planRefs: ['P04'],
  },
  {
    id: 'mfa', title: 'Autenticação em dois fatores (MFA/2FA)',
    keywords: ['mfa', '2fa', 'dois fatores', 'autenticação de dois', 'passkey', 'yubikey', 'token físico', 'verificação em duas etapas'],
    objects: ['minha conta', 'meu email', 'minha conta do banco', 'minha exchange'],
    atkNouns: ['roubo de senha', 'ataques de credencial', 'phishing'],
    answer:
      'MFA é o zagueiro da sua conta: a senha pode ser driblada, mas com o segundo fator o atacante vai pro chão. E olha o nível avançado: passkeys e chaves físicas FIDO2 (YubiKey) são imunes a phishing — o site falso NÃO consegue usar sua chave. SMS é o pior dos melhores, mas ainda melhor que nada.',
    tips: [
      'Prefira app autenticador (Aegis, Authy) no lugar de SMS',
      'Melhor ainda: passkey ou chave física FIDO2',
      'Guarde os códigos de recuperação em papel, num lugar seguro',
    ],
    planRefs: ['P02'], mitre: 'T1621',
  },
  {
    id: 'mfa-fatigue', title: 'MFA fatigue (bombardeio de push)',
    keywords: ['mfa fatigue', 'push mfa', 'notificação de login que não pedi', 'aprovando notificação', 'fadiga de mfa', 'push que aparece toda hora'],
    objects: ['meu celular', 'minhas notificações', 'minha conta'],
    atkNouns: ['bombardeio de push', 'atacante com minha senha'],
    answer:
      'Recebeu 47 push de MFA sem ter pedido nenhum? Isso é MFA fatigue: o atacante JÁ TEM sua senha e está rezando pra você apertar "aprovar" sem querer, igual torcedor no VAR. Regra absoluta: NUNCA aprove sem saber. A defesa séria é number matching e chaves FIDO2, que nem dão push pra apertar.',
    tips: [
      'Nunca aprovar notificação que você não iniciou',
      'Exigir number matching (mostrar número e digitar)',
      'Se os pushes vierem em série: troque a senha AGORA e reporte',
    ],
    planRefs: ['P02', 'P33'], mitre: 'T1621',
  },
  {
    id: 'phishing', title: 'Phishing (e-mail e mensagem falsa)',
    keywords: ['phishing', 'email suspeito', 'e-mail falso', 'golpe de email', 'link suspeito', 'clique aqui', 'mensagem falsa', 'fishing'],
    objects: ['meu email', 'meu whatsapp', 'minha conta', 'os funcionários da empresa'],
    atkNouns: ['phishing', 'golpistas', 'atacantes'],
    answer:
      'Phishing é o atacante fingindo ser seu banco, sua chefe ou a agência dos sonhos do seu time. Sinal clássico: URGÊNCIA + LINK. Golpista tem pressa, banco tem calma de capivara. Passe o mouse no link (no celular, segure), confira o domínio LETRA POR LETRA e, na dúvida, não clique: vá direto no app oficial.',
    tips: [
      'Urgência + link + pedir senha = phishing em 99% dos casos',
      'Confira o remetente real, não só o nome de exibição',
      'Nenhum banco ou exchange pede senha ou código por mensagem',
      'Reporte no botão "phishing" do seu e-mail',
    ],
    planRefs: ['P20', 'P37'], mitre: 'T1566',
  },
  {
    id: 'smishing', title: 'Golpe por SMS/WhatsApp e falso PIX',
    keywords: ['sms suspeito', 'whatsapp golpe', 'falso pix', 'golpe do pix', 'whatsapp clonado', 'smishing', 'boleto falso'],
    objects: ['meu celular', 'meu pix', 'meu whatsapp'],
    atkNouns: ['golpistas', 'falsos cobradores', 'clonagem de whatsapp'],
    answer:
      '"Oi mãe, troquei de número" — é golpe, tio. E o clássico falso PIX: cobrança com pressa, QR estranho e desconto absurdo. PIX no Brasil é instantâneo: ninguém precisa de "confirmação por link". Ativou verificação em duas etapas no WhatsApp? Ótimo, senão o atacante clona e fala com a sua família inteira usando sua cara.',
    tips: [
      'Ative a verificação em duas etapas do WhatsApp',
      'Desconfie de cobrança com pressa ou "urgência familiar"',
      'Confirme por outro canal (ligue pra pessoa!) antes de pagar',
      'Nunca instale APK que "o banco mandou" por link',
    ],
    planRefs: ['P20', 'P37'], mitre: 'T1656',
  },
  {
    id: 'ransomware', title: 'Ransomware (sequestro de dados)',
    keywords: ['ransomware', 'arquivos criptografados', 'meus arquivos sequestrados', 'resgate', 'criptolocker', 'nota do ransomware', 'lockbit'],
    objects: ['meus arquivos', 'os computadores da empresa', 'meu notebook'],
    atkNouns: ['ransomware', 'grupos de ransomware', 'afiliados'],
    answer:
      'Ransomware é o pesadelo de qualquer empresa: cifra seus arquivos e pede resgate em cripto. A defesa não é pagar — é ter backup IMUTÁVEL e testado (3-2-1-1-0, pesquisa a regra!). Pagou? 40% dos pagadores não recuperam tudo e entram na lista de "clientela" dos bandidos. EDR detectando comportamento de criptografia em massa + isolamento automático do host = ransomware morrendo no berço.',
    tips: [
      'Backup imutável (Object Lock) com teste de restauração mensal',
      'EDR com bloqueio comportamental ligado em modo "bloquear"',
      'Desconecte a máquina infectada da rede imediatamente',
      'Nunca pague sem acionar resposta a incidentes e as autoridades',
    ],
    planRefs: ['P28', 'P06', 'P34'], mitre: 'T1486',
  },
  {
    id: 'engenharia-social', title: 'Engenharia social',
    keywords: ['engenharia social', 'manipulação', 'vishing', 'ligação do banco', 'falso suporte', 'pretexting', 'golpe da ligação'],
    objects: ['minha família', 'os funcionários', 'o financeiro da empresa', 'minha equipe'],
    atkNouns: ['golpistas', 'engenheiros sociais', 'atacantes'],
    answer:
      'Engenharia social é hackear o sistema operacional mais vulnerável do mundo: o ser humano. O atacante pesquisa você (LinkedIn, Instagram, vazamentos), depois liga fingindo ser do "suporte do banco" com dados REAIS pra parecer confiável. Defesa? Protocolo e desconfiança saudável: desligue, ligue você pro número oficial, confirme. E treine o time todo — inclusive o CEO, que é o alvo favorito.',
    tips: [
      'Desligue e retorne pelo número oficial do banco/empresa',
      'Ninguém legítimo pede senha, código ou acesso remoto',
      'Fraude do CEO: transferência pedida por e-mail precisa de confirmação por voz/presencial',
    ],
    planRefs: ['P37', 'P35'], mitre: 'T1656',
  },
  {
    id: 'wifi-publico', title: 'Wi-Fi público e viagem',
    keywords: ['wifi publico', 'wi-fi de aeroporto', 'wifi de café', 'wi-fi do hotel', 'rede aberta', 'wifi gratuito'],
    objects: ['meu notebook', 'meu celular', 'minhas senhas'],
    atkNouns: ['evil twins', 'atacantes na mesma rede', 'sniffers'],
    answer:
      'Wi-Fi de aeroporto é tipo fila de lanchonete de estádio: você não sabe quem está do seu lado, e um fantasma mal-intencionado pode estar capturando tudo. Se precisar usar: VPN ligada SEMPRE, e desative compartilhamento. Melhor ainda: o 4G/5G do seu próprio celular vale ouro.',
    tips: [
      'VPN ativa antes de abrir qualquer coisa em rede pública',
      'Prefira o hotspot do seu próprio celular',
      'Desative "conectar automaticamente" em redes abertas',
      'Cuidado com nome de rede parecido ("Aeroporto_Free_2") — evil twin!',
    ],
    planRefs: ['P05', 'P14'], mitre: 'T1557',
  },
  {
    id: 'vpn', title: 'VPN',
    keywords: ['vpn', 'rede privada virtual', 'vpn corporativa', 'tunnel'],
    objects: ['meu tráfego', 'minha conexão', 'o acesso remoto da empresa'],
    atkNouns: ['espionagem de rede', 'interceptação', 'atacantes'],
    answer:
      'VPN é o túnel secreto do seu tráfego — o wi-fi do café vira um cano fechado. Detalhe importante: VPN moderna (ZTNA) não dá chave da cidade inteira, dá passagem só pro que você precisa. A VPN velha estilo "acesso total à rede" é a porta que os atacantes amam (pedem credencial, entram, passeiam).',
    tips: [
      'Use VPN confiável em redes públicas',
      'Empresa: prefira ZTNA (acesso por aplicação) a VPN de rede inteira',
      'VPN não te torna anônimo de tudo — é túnel, não manto mágico',
    ],
    planRefs: ['P05'], mitre: 'T1133',
  },
  {
    id: 'atualizacoes', title: 'Atualizações e patches',
    keywords: ['atualização', 'atualizar sistema', 'patch', 'update pendente', 'atualizacao de segurança', 'windows update'],
    objects: ['meu sistema', 'meu celular', 'o servidor da empresa', 'o roteador'],
    atkNouns: ['exploits conhecidos', 'vulnerabilidades antigas', 'atacantes'],
    answer:
      'Deixar patch pendente é deixar a janela aberta num bairro com ladrão de chave de carona — a maioria dos grandes hacks usou falha JÁ conhecida com correção disponível. Ativa atualização automática no SO, no navegador, no roteador e no firmware. Seu celular pedindo update às 2h da manhã? Deixa ele, é menos incômodo que ser notícia.',
    tips: [
      'Ative atualização automática em tudo (SO, apps, firmware)',
      'Roteador e IoT também recebem patch (ninguém lembra deles!)',
      'CVE crítica com patch = prioridade máxima, não "depois vejo"',
    ],
    planRefs: ['P12'], mitre: 'T1190',
  },
  {
    id: 'usb', title: 'USB desconhecido e mídia removível',
    keywords: ['pendrive', 'usb', 'achei um pendrive', 'usb desconhecido', 'cabo de presente', 'juice jacking'],
    objects: ['meu computador', 'a empresa', 'meu celular'],
    atkNouns: ['badusb', 'malware de pendrive', 'cabo armadilhado'],
    answer:
      '"Achei um pendrive no estacionamento, vou plugá-lo pra achar o dono!" — NÃO, meu filho. Isso é enredo de filme de terror, e você seria o primeiro a morrer. BadUSB parece teclado pro computador e digita comandos sozinho. Pendrive achado vai pro saco de lixo (com segurança, preferencialmente), e o dono não vai morrer sem ele.',
    tips: [
      'Nunca plugue mídia de origem desconhecida',
      'Use carregador próprio ou power bank — não USB de desconhecido',
      'Empresa: bloqueio de USB por padrão com allowlist (regra P10!)',
    ],
    planRefs: ['P10'], mitre: 'T1091',
  },
  {
    id: 'carteira-fria', title: 'Carteira fria (cold wallet)',
    keywords: ['cold wallet', 'carteira fria', 'hardware wallet', 'ledger', 'trezor', 'carteira de hardware', 'cold storage'],
    objects: ['minhas criptos', 'meu bitcoin', 'meu portfólio de longo prazo'],
    atkNouns: ['hackers', 'drainers', 'roubo online'],
    answer:
      'Regra de capivara: quanto maior o valor, mais fria a carteira. Cold wallet = chave privada NUNCA toca internet. Aquele BTC de longo prazo dorme no hardware wallet; o troco do dia a dia fica na quente. E cuidado na compra: compre DIRETO do fabricante, nunca de marketplace de terceiro — já vi hardware wallet adulterada chegar "de presente" no correio. Suspeite!',
    tips: [
      'Compre só no site oficial do fabricante',
      'Teste a recuperação ANTES de colocar valores grandes',
      'Frases-senha adicionais (passphrase) para camada extra',
    ],
    planRefs: ['P24', 'P25'],
  },
  {
    id: 'seed-phrase', title: 'Seed phrase (frase de recuperação)',
    keywords: ['seed phrase', 'frase de recuperação', '12 palavras', '24 palavras', 'frase secreta', 'seed'],
    objects: ['minha seed phrase', 'minha carteira'],
    atkNouns: ['golpistas', 'phishing', 'drainers'],
    answer:
      'REPETE COMIGO: ninguém legítimo pede minha seed phrase. NINGUÉM. Nem suporte, nem exchange, nem o "Ash Ketchum da Binance". Seed phrase é a chave MESTRA da carteira: quem tem ela, tem TUDO, e não existe reversão. Nunca digite num site, nunca tire print, nunca mande por mensagem. Papel ou metal, num cofre, longe de olhos e de umidade.',
    tips: [
      'Seed phrase nunca vai para site, print, nuvem ou mensagem',
      'Suporte de carteira NUNCA pede as 12/24 palavras',
      'Considere gravar em metal (à prova de fogo e enchente)',
    ],
    planRefs: ['P26', 'P24'], mitre: 'T1555',
  },
  {
    id: 'multisig', title: 'Multi-sig e tesouraria cripto',
    keywords: ['multisig', 'multi-sig', 'gnosis safe', 'múltiplas assinaturas', 'tesouraria', 'assinaturas múltiplas'],
    objects: ['a tesouraria da empresa', 'meu cofre de cripto', 'os fundos da exchange'],
    atkNouns: ['roubo de chave única', 'insiders', 'atacantes'],
    answer:
      'Multi-sig é o cofre que precisa de duas chaves viradas ao mesmo tempo, estilo filme de assalto — mas as chaves estão com pessoas diferentes, em lugares diferentes. 3-de-5 significa que o atacante precisa comprometer 3 pessoas ao mesmo tempo (complicado até pra ele). Time-lock de 24-48h em saque novo é o toque final: dá tempo de cancelar qualquer movimentação esquisita.',
    tips: [
      'Use 3-de-5 com assinantes em geografias diferentes',
      'Whitelist de endereços + time-lock para saques',
      'Faça simulação de recuperação semestral',
    ],
    planRefs: ['P25', 'P40'],
  },
  {
    id: 'drainer', title: 'Drainers e aprovações maliciosas',
    keywords: ['drainer', 'drainers', 'drenagem', 'drenar', 'mint de nft', 'mint nft', 'aprovar contrato', 'aprovação de contrato', 'setapprovalforall', 'airdrop falso', 'approve', 'contrato malicioso', 'revoke', 'revogar aprovação'],
    objects: ['minha carteira web3', 'meus tokens', 'os clientes da exchange'],
    atkNouns: ['drainers', 'contratos maliciosos', 'kits de drenagem'],
    answer:
      'O drainer é o cara que te convence a dar a chave do apartamento "só pra trocar um chuveiro" — e troca o chuveiro, os móveis e o título de posse. Tecnicamente: você aprova (approve/setApprovalForAll) um contrato malicioso que pode mover seus tokens SEMPRE. Defesa: simulação de transação antes de assinar, revogação periódica de approvals (revoke.cash e similares) e zero airdrop misterioso de "mint grátis".',
    tips: [
      'Use simulação de transação (o Capyber tem!) antes de assinar',
      'Revogue aprovações antigas periodicamente',
      'Mint grátis do airdrop que você não pediu = armadilha',
      'Endereço do contrato? Confira em explorador de blockchains',
    ],
    planRefs: ['P26'], mitre: 'T1566',
  },
  {
    id: 'sim-swap', title: 'SIM swap (clonagem de chip)',
    keywords: ['sim swap', 'chip clonado', 'chip', 'clonado', 'clonaram meu chip', 'portabilidade que não pedi', 'perdi o sinal do celular', 'clonagem de chip', 'sem sinal'],
    objects: ['meu chip', 'minhas contas com SMS'],
    atkNouns: ['sim swappers', 'atacantes'],
    answer:
      'Seu celular ficou sem sinal do nada? PODE SER SIM SWAP: o atacante migrou seu número pra chip dele e agora recebe seus SMS — inclusive códigos 2FA. Ação: contatar operadora IMEDIATAMENTE, trocar senhas de contas críticas, e migrar 2FA pra app ou chave física (SMS como 2FA é frágil por causa exatamente disso).',
    tips: [
      'Perdeu sinal? Suspeite de SIM swap e aja rápido',
      'Coloque senha/senha de portabilidade na operadora',
      'Migre 2FA de SMS para app autenticador ou FIDO2',
    ],
    planRefs: ['P02'], mitre: 'T1621',
  },
  {
    id: 'insider', title: 'Ameaça interna (insider threat)',
    keywords: ['insider', 'ameaça interna', 'funcionário interno', 'ex-funcionário', 'contratado malicioso', 'colaborador golpista'],
    objects: ['a empresa', 'os dados internos', 'as chaves da exchange'],
    atkNouns: ['insiders', 'contratados maliciosos', 'contas comprometidas'],
    answer:
      'Nem todo fantasma vem de fora — às vezes mora dentro do castelo. Insider é o contratado (ou conta de contratado) que abusa do acesso: exporta chaves, baixa base de clientes, planta backdoor. Defesa: privilégio mínimo, segregação de funções, UEBA observando desvios de comportamento e DLP bloqueando saída de dados. Confiança é boa, telemetria é melhor.',
    tips: [
      'Privilégio mínimo: cada um acessa só o necessário',
      'Desligamento = revogação de acessos no mesmo dia',
      'Alertas de comportamento anômalo (volume, horário, destino)',
    ],
    planRefs: ['P33', 'P03', 'P10'], mitre: 'T1567',
  },
  {
    id: 'ddos', title: 'DDoS (negação de serviço)',
    keywords: ['ddos', 'site fora do ar', 'negação de serviço', 'site travado', 'flood', 'ataque volumétrico'],
    objects: ['meu site', 'a API da empresa', 'a exchange'],
    atkNouns: ['botnets', 'ataques de negação de serviço', 'flooding'],
    answer:
      'DDoS é o maratonista que traz 10 mil primos pra correr no seu lugar: o serviço simplesmente não consegue atender cliente de verdade. Defesa: anycast (o ataque se espalha pelo mundo e vira gota d\'água), rate limiting e CDN com proteção anti-DDoS. E runbook "modo sob ataque" — a hora do ataque NÃO é hora de improvisar.',
    tips: [
      'Publique o site atrás de CDN/proteção anti-DDoS',
      'Rate limit por rota (login e PIX ganham proteção extra)',
      'Monitore: quando o gráfico só sobe, é hora do runbook',
    ],
    planRefs: ['P16'], mitre: 'T1498',
  },
  {
    id: 'sql-injection', title: 'Injeção de SQL (defesa)',
    keywords: ['sql injection', 'sqli', 'injeção de sql', 'union select', 'or 1=1'],
    objects: ['meu site', 'o banco de dados', 'a aplicação'],
    atkNouns: ['injeção de sql', 'atacantes explorando formulários'],
    answer:
      'SQLi é o atacante digitando código no campo de busca e o banco obedecendo tipo autômato. A defesa do dev: queries parametrizadas (prepared statements) SEMPRE, nunca concatenar string com input do usuário; ORM ajuda, mas não é manto sagrado; e WAF na frente (tipo o CAPYCORE aqui do Capyber, que bloqueia isso ao vivo no Laboratório!).',
    tips: [
      'Queries parametrizadas sempre — concatenação de string NUNCA',
      'Menos privilégio pro usuário do banco (não roda DROP TABLE)',
      'WAF com OWASP CRS como camada extra',
      'Teste seu app com payloads em ambiente próprio',
    ],
    planRefs: ['P15', 'P21'], mitre: 'T1190',
  },
  {
    id: 'xss', title: 'XSS (cross-site scripting)',
    keywords: ['xss', 'cross site scripting', 'script malicioso', 'tag de script', 'injeção de javascript'],
    objects: ['meu site', 'os cookies dos usuários', 'a aplicação'],
    atkNouns: ['injeção de script', 'atacantes'],
    answer:
      'XSS é o atacante injetando JavaScript na página e rodando código no NAVEGADOR das vítimas — rouba cookie de sessão, keylogga, redireciona pra phishing. Defesa: escape de saída por contexto, Content-Security-Policy restritiva (sem inline script!), e bibliotecas de sanitização. Se seu site mostra input do usuário, seu site precisa dessa conversa.',
    tips: [
      'Escape todo input renderizado, por contexto (HTML, attr, JS)',
      'CSP restritiva: script-src com nonce, sem inline',
      'HttpOnly nos cookies de sessão',
    ],
    planRefs: ['P27', 'P21'], mitre: 'T1059.007',
  },
  {
    id: 'zero-trust', title: 'Zero Trust',
    keywords: ['zero trust', 'confiança zero', 'perímetro', 'rede confiável interna'],
    objects: ['a rede da empresa', 'o acesso interno', 'os sistemas'],
    atkNouns: ['movimentação lateral', 'atacantes dentro da rede', 'contas comprometidas'],
    answer:
      'Zero Trust é a filosofia da capivara experiente: confie em ninguém, verifique TODOS. O modelo velho ("dentro da rede é confiável") morreu quando o atacante aprendeu a entrar. Zero Trust verifica identidade, dispositivo e contexto EM CADA requisição, e segmenta tudo — se um sistema cai, o atacante fica preso no cubículo dele.',
    tips: [
      'Autenticação forte em cada acesso, não só no portão',
      'Microssegmentação: prod não fala com rh',
      'Acesso por aplicação (ZTNA), não por rede',
    ],
    planRefs: ['P01', 'P05', 'P14'], mitre: 'T1021',
  },
  {
    id: 'edr', title: 'EDR / antivírus moderno',
    keywords: ['edr', 'antivírus', 'antivirus', 'xdr', 'defender', 'crowdstrike', 'detecção de endpoint'],
    objects: ['meu computador', 'a frota da empresa', 'os servidores'],
    atkNouns: ['malware', 'ransomware', 'ataques de dia zero'],
    answer:
      'Antivírus de assinatura é o vigia com lista de fotos de bandidos; EDR é o detetive que observa COMPORTAMENTO: esse processo tentou injetar código na memória de outro? Acessou a memória do LSASS? Criptografou 500 arquivos em 30s? EDR grita, bloqueia e isola. No Capyber, o ransomware do cenário morre exatamente assim.',
    tips: [
      'EDR em modo BLOQUEIO, não só em modo "avisar"',
      'Cobertura 100%: um endpoint sem agente é a porta de entrada',
      'Telemetria do EDR deve alimentar o SIEM',
    ],
    planRefs: ['P06'], mitre: 'T1055',
  },
  {
    id: 'firewall', title: 'Firewall e WAF',
    keywords: ['firewall', 'waf', 'firewall de aplicação', 'filtro de rede', 'capycore'],
    objects: ['minha rede', 'minha aplicação', 'a exchange'],
    atkNouns: ['tráfego malicioso', 'explorações web', 'scanners'],
    answer:
      'Firewall de rede decide quem passa pelo portão; WAF (firewall de aplicação) é o security insider examinando CADA requisição HTTP à procura de arma — SQLi, XSS, traversal. O CAPYBER tem o próprio motor (CAPYCORE): 20+ famílias de regras, pontuação de risco e veredito. Vai no Laboratório e testa um payload pra ver o coração batendo!',
    tips: [
      'Regra padrão: negar tudo, permitir o necessário',
      'WAF com OWASP CRS na frente de aplicações web',
      'Log dos bloqueios alimenta detecção e CTI',
    ],
    planRefs: ['P15', 'P14'], mitre: 'T1190',
  },
  {
    id: 'backup', title: 'Backups (3-2-1-1-0)',
    keywords: ['backup', 'backups', 'cópia de segurança', 'restaurar dados', '3-2-1'],
    objects: ['meus arquivos', 'os dados da empresa', 'os servidores'],
    atkNouns: ['ransomware', 'falha de disco', 'exclusão acidental'],
    answer:
      'Backup sem teste de restauração é "eu juro que salvei" — e na hora do desespero, o arquivo tá corrompido. Regra 3-2-1-1-0: 3 cópias, 2 mídias, 1 fora do local, 1 IMUTÁVEL (ransomware não apaga o que não consegue tocar) e 0 erros no teste mensal. Backup imutável é o Kryptonita do ransomware.',
    tips: [
      '1 cópia com Object Lock (imutável)',
      'Teste de restore MENSAL automatizado',
      'Backup em conta separada com credenciais diferentes',
    ],
    planRefs: ['P28'], mitre: 'T1490',
  },
  {
    id: 'bug-bounty', title: 'Bug bounty e disclosure',
    keywords: ['bug bounty', 'recompensa por falha', 'researcher', 'disclosure', 'encontrei uma falha', 'responsable disclosure'],
    objects: ['a empresa', 'o programa de bounty'],
    atkNouns: ['falhas desconhecidas', 'exploração privada'],
    answer:
      'Pagar US$ 5 mil pro researcher é infinitamente mais barato que perder US$ 500 milhões pro atacante. Bug bounty bem feito: escopo claro, triagem rápida e recompensa justa. Encontrou uma falha num serviço? Reporte pelo canal oficial — hacking ético com autorização é lindo, e sem autorização é crime (mesmo com boas intenções).',
    tips: [
      'Empresa: publique security.txt e política de disclosure',
      'Researcher: teste SÓ em sistemas seus ou com autorização escrita',
      'Recompense rápido e reconheça publicamente (com licença do researcher)',
    ],
    planRefs: ['P36'],
  },
  {
    id: 'senha-reusada', title: 'Reutilização de senha',
    keywords: ['mesma senha', 'reutilizar senha', 'senha repetida', 'usar a mesma senha'],
    objects: ['minhas contas', 'meus cadastros'],
    atkNouns: ['credential stuffing', 'vazamentos', 'atacantes'],
    answer:
      'Reutilizar senha é tipo usar a mesma chave pra casa, carro, escritório e caixa-forte — basta UMA cópia vazar (e vazamentos acontecem TODOS os dias) pra atacante testar em tudo. Isso tem nome: credential stuffing, e é automático, milhões de tentativas por hora. Senhas únicas + gerenciador + 2FA = credential stuffing quebrando a cara no portão.',
    tips: [
      'Cada serviço, uma senha única (o gerenciador faz isso por você)',
      '2FA em tudo, prioridade para e-mail e banco',
      'Vazou? Troque já e verifique onde reutilizou',
    ],
    planRefs: ['P04'], mitre: 'T1110.003',
  },
  {
    id: 'deepfake', title: 'Deepfake e voz clonada',
    keywords: ['deepfake', 'voz clonada', 'vídeo falso', 'ligação com a voz do chefe', 'deep fake', 'clonagem de voz'],
    objects: ['o financeiro', 'a diretoria', 'minha família'],
    atkNouns: ['deepfakes', 'golpistas com IA'],
    answer:
      'Bem-vindo ao 2026, onde a voz do seu CEO pedindo transferência urgente pode ser gerada por IA com 30 segundos de áudio do podcast dele. Defesa corporativa: código secreto verbal para ordens financeiras + confirmação por segundo canal + regra de ouro (transferência grande nunca sai por pedido de voz/e-mail sozinho).',
    tips: [
      'Estabeleça palavra-código verbal com a diretoria',
      'Ordem de pagamento exige confirmação por canal diferente',
      'Suspeite de urgência + segredo + exceção ao processo (a trinca clássica)',
    ],
    planRefs: ['P37', 'P35'], mitre: 'T1656',
  },
  {
    id: 'quishing', title: 'QR code falso (quishing)',
    keywords: ['qr code', 'qrcode falso', 'quishing', 'qr de estacionamento', 'pix por qr'],
    objects: ['meu celular', 'meu pix'],
    atkNouns: ['quishing', 'golpistas'],
    answer:
      'QR code é caixa-preta: você escaneia e confia. Adesivo de estacionamento por cima do QR oficial? Menu de restaurante com QR que baixa APK? Pode ser quishing. Confira o domínio DEPOIS de escanear e ANTES de digitar qualquer coisa, e desconfie de QR adesivado por cima de outro QR.',
    tips: [
      'Pré-visualize a URL antes de abrir',
      'QR adesivado por cima = suspeita máxima',
      'Pagamento por QR: confira nome do recebedor na tela do banco',
    ],
    planRefs: ['P37'], mitre: 'T1656',
  },
  {
    id: 'evil-twin', title: 'Evil twin (rede Wi-Fi falsa)',
    keywords: ['evil twin', 'rede wifi falsa', 'wifi falso', 'rede clonada', 'ataque de ponto de acesso'],
    objects: ['meu notebook', 'meu celular'],
    atkNouns: ['evil twins', 'atacantes com roteador portátil'],
    answer:
      'Evil twin é o atacante criando uma rede "Aeroporto_Free_WiFi_2" e esperando você conectar. Com HTTPS hoje o dano é menor que antigamente, mas ele ainda pode DNS-phishing e capturar o que não é criptografado. Defesa: use o hotspot do próprio celular, confirme o nome oficial da rede com o estabelecimento, e VPN sempre.',
    tips: [
      'Confirme o nome exato da rede oficial com o estabelecimento',
      'VPN ligada em qualquer rede que não seja sua',
      'Desative conexão automática em redes abertas',
    ],
    planRefs: ['P05', 'P14'], mitre: 'T1557',
  },
  {
    id: 'keylogger', title: 'Keyloggers e infostealers',
    keywords: ['keylogger', 'infostealer', 'roubam o que digito', 'malware de senha', 'redline', 'stealer'],
    objects: ['meu computador', 'minhas senhas', 'os devs da empresa'],
    atkNouns: ['infostealers', 'keyloggers'],
    answer:
      'Infostealer é o malware que varre seu navegador, cofre de senhas, sessões e carteira e manda tudo pro atacante — virou produto: vende-se assinatura por R$ 40/mês (sim, crime com suporte ao cliente). Defesa: EDR comportamental, application allowlisting, MFA FIDO2 (o stealer rouba senha, mas não a chave física) e zero crack de software baixado de "site confiável".',
    tips: [
      'EDR ligado em modo bloqueio',
      'MFA resistente a phishing (FIDO2/passkey) nas contas críticas',
      'NUNCA instale software crackeado (é o vetor nº 1 de stealer)',
    ],
    planRefs: ['P06', 'P02', 'P11'], mitre: 'T1555',
  },
  {
    id: 'laptop-roubado', title: 'Dispositivo roubado ou perdido',
    keywords: ['notebook roubado', 'perdi o celular', 'celular roubado', 'furtaram meu notebook', 'dispositivo perdido'],
    objects: ['meu notebook', 'meu celular'],
    atkNouns: ['roubo físico', 'acesso local'],
    answer:
      'Calma, respira: com criptografia de disco e MDM bem configurados, notebook roubado é prejuízo de patrimônio, não de dados. Passo a passo: 1) reporte pro MDM pra apagar/remotamente travar; 2) troque senhas das contas logadas; 3) registre B.O.; 4) revogue sessões do navegador roubado.',
    tips: [
      'Criptografia de disco (BitLocker/FileVault/LUKS) SEMPRE ativa',
      'MDM com apagamento remoto testado',
      'Boletim de ocorrência + aviso ao TI em minutos, não dias',
    ],
    planRefs: ['P08', 'P07'],
  },
  {
    id: 'byod', title: 'Dispositivo pessoal no trabalho (BYOD)',
    keywords: ['byod', 'dispositivo pessoal no trabalho', 'celular pessoal no trabalho', 'notebook pessoal pro trabalho'],
    objects: ['meu celular pessoal', 'o trabalho no meu dispositivo pessoal'],
    atkNouns: ['mistura de contextos', 'malware pessoal'],
    answer:
      'Trabalhar no dispositivo pessoal tá ok SE separado: work profile (Android) ou container gerenciado (iOS/Windows) cria uma "bolha" — apps corporativos isolados, dados criptografados, apagamento remoto que afeta só o trabalho, não suas fotos do churrasco. Nunca administre a empresa no dispositivo pessoal sem esse container.',
    tips: [
      'Use work profile / MAM para isolar dados corporativos',
      'Aceite o MDM da empresa (é ele que te protege)',
      'Dados de trabalho não saem da bolha (copiar/colar controlado)',
    ],
    planRefs: ['P13', 'P07'],
  },
  {
    id: 'service-account', title: 'Contas de serviço e API keys',
    keywords: ['service account', 'conta de serviço', 'api key', 'token de api', 'chave de api', 'secret key'],
    objects: ['as contas de serviço', 'as api keys da empresa'],
    atkNouns: ['vazamento de token', 'abuso de chave'],
    answer:
      'Conta de serviço com senha que nunca expira e privilégio de deus? Isso não é conta, é presente de natal pra atacante. Boas práticas: escopo mínimo, rotação automática, expiração curta (tokens de curta duração), e NUNCA hardcoded no código — vai pro cofre (Vault). E monitora uso: API key que dorme 6 meses e de repente acorda às 3h é sinal ruim.',
    tips: [
      'Escopo mínimo e rotação automática de credenciais',
      'Tokens de curta duração > credenciais eternas',
      'Segredos no cofre, nunca no código ou CI/CD',
    ],
    planRefs: ['P03', 'P23'], mitre: 'T1528',
  },
  {
    id: 'supply-chain', title: 'Segurança da cadeia de suprimentos',
    keywords: ['supply chain', 'cadeia de suprimentos', 'dependência maliciosa', 'npm malicioso', 'pacote npm', 'typosquatting', 'biblioteca comprometida'],
    objects: ['o pipeline da empresa', 'as dependências do projeto', 'o frontend'],
    atkNouns: ['pacotes maliciosos', 'ataques à cadeia de suprimentos', 'CDN comprometida'],
    answer:
      'Seu código pode estar impecável — e morrer por causa de uma dependência de terceiros com 40 linhas e um postinstall malicioso. Caso Bybit 2025: US$ 1,5 bi perdidos porque o JS do frontend de assinatura foi comprometido na infra do fornecedor. Defesa: SBOM (nota fiscal das dependências), assinatura de artefatos (Sigstore), lockfile e registry com allowlist.',
    tips: [
      'Gere SBOM e monitore vulnerabilidades das dependências',
      'Assine artefatos e verifique no deploy',
      'Cuidado com typosquatting: confira o nome do pacote letra por letra',
    ],
    planRefs: ['P22', 'P27'], mitre: 'T1195.002',
  },
  {
    id: 'secrets-repo', title: 'Segredos no código/repositório',
    keywords: ['segredo no código', 'chave no github', 'env commitado', 'commit de senha', 'hardcoded secret', 'gitleaks'],
    objects: ['o repositório', 'as credenciais do projeto'],
    atkNouns: ['bots de varredura', 'atacantes'],
    answer:
      'Cada segundo, bots varrem commits públicos atrás de AWS keys, senhas de banco e tokens — uma chave exposta leva, em média, MINUTOS pra ser explorada (bots são mais rápidos que seu "ops, vou remover"). Se vazou: ROTEIE A CREDENCIAL imediatamente, remover o commit não adianta (fica no histórico). Prevenção: gitleaks no pre-commit + segredos no Vault.',
    tips: [
      'Segredos vivem no cofre, não no .env commitado',
      'Gitleaks/TruffleHog no CI e pre-commit',
      'Vazou? ROTAÇÃO primeiro, limpeza de histórico depois',
    ],
    planRefs: ['P23', 'P03'], mitre: 'T1552.001',
  },
  {
    id: 'lgpd', title: 'LGPD e proteção de dados',
    keywords: ['lgpd', 'dados pessoais', 'vazamento de dados', 'anpd', 'proteção de dados'],
    objects: ['os dados dos clientes', 'a empresa', 'o tratamento de dados'],
    atkNouns: ['vazamentos', 'multas da ANPD', 'incidentes de dados'],
    answer:
      'LGPD em resumo de capivara: colete o mínimo, protega o que coletou, e avise quando algo der errado (a ANPD gosta de saber em prazo razoável). Segurança é o alicerce da LGPD: dados vazados geram multa de até 2% do faturamento (limitada a R$ 50 mi por infração) + dano reputacional incalculável. E cuidado: demonstração de projeto usa DADOS SINTÉTICOS, nunca dado real de terceiros!',
    tips: [
      'Minimização: colete só o necessário',
      'Plano de resposta a incidente com notificação à ANPD',
      'Criptografia e controle de acesso como padrão',
    ],
    planRefs: ['P39', 'P35'],
  },
  {
    id: 'reportar-incidente', title: 'Fui hackeado — o que fazer',
    keywords: ['fui hackeado', 'me hackearam', 'sofri um ataque', 'conta invadida', 'o que fazer depois do ataque', 'incidí num golpe'],
    objects: ['minha conta', 'meu computador', 'a empresa'],
    atkNouns: ['ataque em andamento', 'invasão'],
    answer:
      'Respira, capivara. Plano de emergência: 1) DESCONECTA da internet (não desliga, desconecta — preserva evidência); 2) troca senhas DE OUTRO dispositivo limpo, começando pelo e-mail (ele reseta tudo); 3) revoga sessões e tokens; 4) ativa/reverifica 2FA; 5) escaneia com EDR/antivírus; 6) registre B.O. se houve prejuízo; 7) no trabalho, aciona o SOC AGORA — tempo é dinheiro.',
    tips: [
      'Desconecte, não desligue (preserva memória/evidências)',
      'E-mail é a conta-mestra: proteja ele primeiro',
      'Nas empresas: acione o plano de resposta a incidentes',
    ],
    planRefs: ['P35', 'P34'],
  },
  {
    id: 'mitre', title: 'MITRE ATT&CK',
    keywords: ['mitre', 'mitre attack', 'attack framework', 'ttp', 'técnica t1190', 'kill chain'],
    objects: ['as detecções', 'o SOC'],
    atkNouns: ['técnicas de ataque', 'adversários'],
    answer:
      'MITRE ATT&CK é a enciclopédia viva de como atacantes operam de verdade: cada técnica tem ID (T1190 = explorar aplicação exposta, T1486 = ransomware...). O Blue Team usa isso pra mapear cobertura: "quais técnicas eu DETETO? quais eu BLOQUEIO? quais tô cego?" — no Capyber, cada veredito e cada cenário carrega o ID MITRE pra você ver isso ao vivo.',
    tips: [
      'Cada regra do CAPYCORE mapeia pra uma técnica ATT&CK',
      'ATT&CK Navigator: visualiza sua cobertura de detecção',
      'Purple team usa ATT&CK pra testar detecção técnica por técnica',
    ],
    planRefs: ['P29', 'P38'],
  },
  {
    id: 'honeypot', title: 'Honeypots e canarytokens',
    keywords: ['honeypot', 'canarytoken', 'canário', 'armadilha digital', 'deception', 'pote de mel'],
    objects: ['a rede', 'os compartilhamentos', 'as credenciais'],
    atkNouns: ['atacantes explorando', 'movimentação lateral'],
    answer:
      'Honeypot é o pote de mel com câmera: ninguém legítimo toca nele, então QUALQUER toque é alerta de atacante com zero falsos positivos — o sonho do SOC. Canarytoken disfarçado de credencial de admin num compartilhamento esquecido? Quando o atacante usa, você sabe EXATAMENTE onde ele está.',
    tips: [
      'Distribua tokens em superfícies críticas',
      'Alerta de honeypot = prioridade máxima (sempre real)',
      'Um honeypot por segmento sensível já muda o jogo',
    ],
    planRefs: ['P31'], mitre: 'T1078',
  },
  {
    id: 'soc', title: 'SOC e centro de operações',
    keywords: ['soc', 'centro de operações de segurança', 'n1 n2 n3', 'analista de segurança', 'blue team'],
    objects: ['a empresa', 'o time de segurança'],
    atkNouns: ['ataques em andamento', 'incidentes'],
    answer:
      'SOC é o estúdio de guerra do Blue Team: N1 triageia, N2 investiga, N3 caça, e o time responde com playbook. O Capyber é exatamente a cara disso — mapa global, feed de eventos, kill chain e voz da VIGIA narrando tudo estilo sala de crise. A diferença pro SOC real? Aqui a capivara tem boca de fantasma.',
    tips: [
      'Métrica-chave: MTTC (tempo até contenção) — alvo < 1 minuto com SOAR',
      'Alerta de honeypot e eventos críticos têm prioridade máxima',
      'Turnos cobertos 24×7, ou automação prendendo o banco',
    ],
    planRefs: ['P29', 'P34'],
  },
  {
    id: 'capyber-oque-e', title: 'O que é o Capyber',
    keywords: ['capyber', 'esse projeto', 'esse site', 'esse sistema', 'capiber', 'projeto capyber', 'como funciona esse site'],
    objects: ['esse projeto', 'a plataforma'],
    atkNouns: [],
    answer:
      'Eu PRESENTEIO: o Capyber é um centro de comando de ciberdefesa com visual de mundo digital estilo anime (azul-noite, grade ciano e laranja da Coragem — gostosinho de ver, igual tela de cineminha). Temos: o mapa 3D global de ameaças, a VIGIA (narradora IA pt-BR que fala cada situação), o CAPYCORE (firewall coração do sistema, com 20+ regras reais), a frota de dispositivos protegidos, o Plano de Defesa em 40 pontos baseado em MITRE/NIST/CIS... e EU, o fantasma mais bem informado do futebol brasileiro.',
    tips: [
      'Aba COMANDO: mapa 3D e feed em tempo real',
      'Aba LABORATÓRIO: teste payloads reais no firewall',
      'Aba PLANO 40: o plano de defesa completo',
      'Aba FROTA: notebooks, PCs e celulares protegidos',
    ],
    planRefs: [],
  },
  {
    id: 'mascote', title: 'Quem é o Capy Fantasma',
    keywords: ['quem é você', 'quem e voce', 'seu nome', 'o que você é', 'fantasma', 'capy fantasma', 'mascote', 'você é um fantasma'],
    objects: [],
    atkNouns: [],
    answer:
      'Sou o CAPY FANTASMA: morri eletrocutado ao tentar carregar o notebook na tomada durante um temporal (segurança elétrica importa, gente!), e desde então assomo este SOC pra proteger devs, bancos e exchanges. Amo futebol (ninguém marca o fantasma — ele joga a bola através do zagueiro), amo capivara (o animal mais seguro do Brasil: zero phishing, zero estresse) e sei TUDO sobre prevenir ataques. Pergunta qualquer coisa!',
    tips: [
      'Me pergunte sobre qualquer tipo de ataque ou defesa',
      'Pergunta sobre futebol e capivara também vale',
      'Sou 100% defensivo: só ensino a SE PROTEGER',
    ],
    planRefs: [],
  },
  {
    id: 'futebol', title: 'Futebol (paixão nacional)',
    keywords: ['futebol', 'time', 'bola', 'gol', 'campeonato', 'seu time', 'brasileirão', 'libertadores', 'jogo'],
    objects: [],
    atkNouns: [],
    answer:
      'Ah, futebol! Meu time? O Espectro Futebol Clube, invicto há 80 anos — ninguém desarma um fantasma, o VAR não me vê e eu entro em campo através da marcação. Brincadeiras à parte (não), a defesa de futebol e a defesa cibernética são irmãs: linha de passes (segmentação de rede), goleiro (backup), zagueiro com leitura (EDR), e camisa 10 criativo (que aqui é a VIGIA narrando os ataques). O único "hackeamento" que aprovo é o hacker de tatame que te dribla!',
    tips: [
      'Ataque também se defende com time: SOC é elenco, não jogador solo',
      'Treino constante = temporada de phishing simulada',
    ],
    planRefs: [],
  },
  {
    id: 'capivara', title: 'Capivaras (o melhor animal)',
    keywords: ['capivara', 'capivaras', 'capybara', 'seu animal', 'animal favorito'],
    objects: [],
    atkNouns: [],
    answer:
      'A capivara é o maior roedor do mundo e o SER mais seguro do planeta: vive em grupo (segmentação social!), é tolerante com todas as espécies (zero ódio, zero troll), nada melhor que anda (DR multi-região: terra, água...) e dorme tranquila (zero alerta de SIEM). Meu sonho? Um dia me materializar e sentar numa beira de rio com uma capivara, vendo o pôr do sol sem nenhum ataque de rank 1 no feed.',
    tips: [
      'Seja capivara: calma, método e grupo confiável',
      'Capivara não cai em phishing porque não clica em nada',
    ],
    planRefs: [],
  },
  {
    id: 'piada', title: 'Piadas de segurança',
    keywords: ['piada', 'piadas', 'conta uma piada', 'engraçado', 'zoeira', 'humor'],
    objects: [],
    atkNouns: [],
    answer:
      'Por que o fantasma virou analista de SOC? Porque ele JÁ passou pro outro lado e conhece todos os endpoints! Qual o programa favorito do hacker aposentado? Firewall... ele parou de trafegar! Essa foi fraca, melhor essa: hacker Rank 1 tentou me dar phishing — mas eu sou fantasma, minha senha é "bootar-no-outro-lado-123" e meu 2FA é atravessar parede. Senta que lá vem mais: por que a capivara nunca é hackeada? Porque ela não clica em link, não abre anexo e ainda tem o melhor firewall do reino animal: INSENSIBILIDADE.',
    tips: ['Piada de segurança ruim é melhor que segurança sem piada', 'Humor aumenta retenção do treinamento (sério, tem estudo!)'],
    planRefs: [],
  },
  {
    id: 'saudacao', title: 'Saudação',
    keywords: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e ai', 'opa', 'salve', 'hello'],
    objects: [],
    atkNouns: [],
    answer:
      'Salve, humano! Capy Fantasma na área — o único fantasma que protege em vez de assombrar. Sou especialista em prevenir ataques a devs, bancos, exchanges e qualquer coisa que tenha IP ou carteira. Pergunta sobre senha, phishing, ransomware, cripto, firewall... ou me chama pra conversa de futebol. O que a gente resolve hoje?',
    tips: ['Pergunte "como proteger minha carteira de drainers"', 'Ou "o que é zero trust"', 'Ou me peça uma piada de segurança'],
    planRefs: [],
  },
  {
    id: 'agradecer', title: 'Agradecimento',
    keywords: ['obrigado', 'obrigada', 'valeu', 'vlw', 'muito bom', 'top', 'show', 'parabéns'],
    objects: [],
    atkNouns: [],
    answer:
      'Disponha, meu bem! Lembrando o mantra da capivara: segurança não é produto, é hábito — MFA em tudo, senha única em cada conta, backup testado e desconfiança saudável de link bonito. Se precisar, estou aqui flutuando (literalmente). E comenta aí qual time você torce, que eu juro que não vou zuar... muito.',
    tips: ['Volte sempre: minha base de conhecimento só cresce'],
    planRefs: [],
  },
]

// ── Estatísticas combinatórias da KB (contagem honesta e verificável) ──
function countForms(): number {
  let total = 0
  for (const t of TOPICS) {
    const combos = t.objects.length * DEF_VERBS.length * Math.max(t.atkNouns.length, 1)
    total += combos
    // perguntas meta: "o que é X", "sinais de X", "o que fazer se X", "ferramentas para X",
    // "como identificar X", "melhor forma de lidar com X"
    total += 6 * Math.max(t.atkNouns.length, 1)
  }
  return total
}

export const KB_STATS = {
  topics: TOPICS.length,
  questionForms: countForms(),
  defVerbs: DEF_VERBS.length,
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Matcher: encontra o melhor tópico para a pergunta ─────────────────
export interface KbMatch {
  topic: KbTopic
  score: number
}

export function matchTopic(question: string): KbMatch | null {
  const q = normalizeText(question)
  if (!q) return null
  const words = new Set(q.split(' '))
  let best: KbMatch | null = null

  for (const topic of TOPICS) {
    let score = 0
    for (const kw of topic.keywords) {
      const nk = normalizeText(kw)
      if (!nk) continue
      if (nk.length <= 4) {
        // keywords curtas exigem palavra inteira (evita "mongolia" dar match em "gol")
        if (words.has(nk)) score += 2
      } else if (q.includes(nk)) {
        // frases multi-palavra pesam mais
        score += nk.includes(' ') ? 4 : 2
      } else if (q.includes(nk.slice(0, Math.max(5, nk.length - 2)))) {
        // tolerância a plural/terminação (só para palavras longas)
        score += 1
      }
    }
    // bônus se a pergunta menciona objetos do tópico
    for (const obj of topic.objects) {
      const objWords = normalizeText(obj).split(' ').filter((w) => w.length > 3)
      if (objWords.some((w) => q.includes(w))) score += 1
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { topic, score }
    }
  }
  return best && best.score >= 2 ? best : null
}

// variação de resposta para o mesmo tópico não ficar repetitiva
const ZUEIRAS = [
  'E olha que eu sou fantasma: nem material eu tenho e ainda me protejo melhor que muito dev com senha "admin".',
  'A VIGIA aprova essa mensagem. Ela aprova quase tudo, menos phishing.',
  'Salvei essa dica no meu cofre de fantasma (que é imune a drainers, diga-se).',
  'Se o atacante tentar de novo, a VIGIA narra o over aqui do lado. Fica ligado.',
  'Dica gratuita de quem morreu por tomada molhada: segurança elétrica também é segurança.',
]

export function decorateAnswer(base: string): string {
  const z = ZUEIRAS[Math.floor(Math.random() * ZUEIRAS.length)]
  return `${base}\n\n${z}`
}
