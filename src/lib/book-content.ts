/**
 * CAPYBER — Blue Team, SOC e Engenharia de Segurança
 * Conteúdo integral do livro digital (pt-BR).
 *
 * Regras de paginação determinísticas:
 * - 1 página = no máximo 2 parágrafos; OU 1 parágrafo + 1 lista; OU 1 parágrafo + 1 callout.
 * - Cada parágrafo tem entre 40 e 80 palavras de prosa técnica real.
 */

export interface BookCallout {
  title: string
  text: string
}

export interface BookPage {
  chapter: number // 1..16 para capítulos; 98 = glossário; 99 = apêndice/playbooks
  chapterTitle: string // título completo do capítulo
  section: string // título da seção (overline exibida na página)
  paras: string[] // 1-2 parágrafos por página
  list?: string[] // lista opcional (3-8 itens)
  callout?: BookCallout // caixa destacada opcional
}

export interface BookChapter {
  num: number
  title: string
  subtitle: string
}

const P: BookPage[] = []
const push = (
  chapter: number,
  chapterTitle: string,
  section: string,
  paras: string[],
  list?: string[],
  callout?: BookCallout
) => {
  P.push({ chapter, chapterTitle, section, paras, list, callout })
}

// ============================================================
// CAPÍTULO 1 — Fundamentos do Blue Team
// ============================================================

push(1, 'Fundamentos do Blue Team', 'A missão do Blue Team', [
  'O Blue Team é o braço defensivo da segurança da informação: reúne analistas, engenheiros e respondedores cujo objetivo é detectar, conter e erradicar adversários antes que causem dano material ao negócio. Diferente do Red Team, que simula ataques pontuais e sazonais, o defensor vive o cotidiano do ambiente: conhece cada VLAN, cada serviço exposto e cada exceção de firewall. Esse conhecimento do terreno é a maior vantagem que o lado azul possui.',
  'Trabalhar na defesa exige um mindset híbrido: parte operador, seguindo playbooks sob pressão; parte cientista, formulando hipóteses sobre o que o adversário pode fazer; parte engenheiro, construindo detecções que sobrevivem ao dia seguinte. Assume breach é o princípio norteador: parta do pressuposto de que o atacante já está dentro, e projete controles, logs e alertas capazes de revelá-lo o quanto antes.',
])

push(1, 'Fundamentos do Blue Team', 'Mindset defensivo', [
  'A assimetria entre atacante e defensor é real, mas frequentemente exagerada. O adversário precisa acertar uma vez e permanecer silencioso; o defensor precisa monitorar tudo, todos os dias. Em compensação, o defensor conhece o terreno: sabe onde os dados sensíveis repousam, quais contas são privilegiadas e qual tráfego é normal no ambiente. Transformar esse conhecimento em detecções automáticas é o trabalho central de qualquer SOC maduro.',
  'Defensores eficazes pensam em cenários, não em ferramentas. Em vez de perguntar se temos EDR, pergunte: se um operador rodar Cobalt Strike amanhã, quais sinais capturaríamos, em quanto tempo e quem reagiria? Essa mudança de perspectiva — do produto para o comportamento — separa ambientes que apenas colecionam licenças de ambientes que realmente reduzem risco todos os dias.',
])

push(1, 'Fundamentos do Blue Team', 'Tríade CIA', [
  'A tríade CIA organiza os objetivos da segurança em três pilares. Confidencialidade garante que apenas pessoas autorizadas acessem a informação, por meio de criptografia, controle de acesso e DLP. Integridade assegura que os dados não foram alterados indevidamente, sustentada por hashes, assinaturas digitais e versionamento. Disponibilidade mantém serviços acessíveis quando necessários, com redundância, backups e proteção contra negação de serviço.',
  'O Blue Team opera sobre essa tríade diariamente, muitas vezes sem nomeá-la. Um ransomware ataca simultaneamente integridade (criptografa arquivos) e disponibilidade (derruba sistemas); um vazamento viola confidencialidade; um defacement afeta integridade com dano reputacional associado. Identificar qual pilar foi atingido orienta prioridade, comunicação com o negócio e a escolha correta dos controles de resposta.',
])

push(1, 'Fundamentos do Blue Team', 'Tríade CIA', [
  'Em incidentes, use a tríade como atalho de classificação: pergunte o que o adversário tocou — dados, sistemas ou ambos. Um ataque que ameaça a disponibilidade de produção costuma exigir contenção imediata e engajamento de infraestrutura; um roubo silencioso de dados pede investigação longa e preservação rigorosa de evidências. A resposta certa depende de qual pilar está em jogo.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Ao classificar a severidade de um alerta, pergunte qual pilar da tríade CIA está ameaçado. Alerta de cifragem em massa (integridade + disponibilidade) escala como P1; consulta anômala a base de dados sem exfiltração comprovada pode aguardar investigação estruturada.',
})

push(1, 'Fundamentos do Blue Team', 'Superfície de ataque', [
  'Superfície de ataque é o conjunto de todos os pontos onde um adversário pode tentar entrar ou extrair dados: aplicações expostas, VPNs, endpoints, identidades, cadeia de suprimentos e até as pessoas. Mapear e reduzir essa superfície é pré-requisito para defender, porque o SOC precisa saber o que existe para vigiar. Cada ativo esquecido é território gratuito para o atacante.',
], [
  'Perímetro digital: domínios, APIs, painéis administrativos expostos, buckets e serviços em nuvem',
  'Identidades: contas de usuário, contas de serviço, permissões excessivas, MFA ausente',
  'Endpoints e servidores: desktops, notebooks, sistemas legados, IoT e OT sem agente de segurança',
  'Pessoas: engenharia social, phishing, fraude de fornecedor (BEC)',
  'Cadeia de suprimentos: fornecedores SaaS, dependências open source, integrações de terceiros',
])

push(1, 'Fundamentos do Blue Team', 'Cyber kill chain', [
  'A cyber kill chain, publicada pela Lockheed Martin em 2011, descreve o ataque em sete estágios sequenciais: reconhecimento, weaponização, entrega, exploração, instalação, command and control e ações sobre objetivos. O valor do modelo para o defensor é estratégico: quanto mais cedo a cadeia é quebrada, menor o custo do incidente. Detectar na entrega custa horas; detectar na exfiltração custa milhões.',
  'O modelo também organiza a cobertura de detecção: cada estágio pede controles distintos — e-mail gateway na entrega, EDR na execução, NDR no C2, DLP nas ações finais. As críticas ao kill chain são legítimas: ataques modernos pulam estágios, rodam sem malware e raramente seguem uma linha reta. Ainda assim, ele permanece vocabulário comum entre defensores e base sólida para playbooks.',
])

push(1, 'Fundamentos do Blue Team', 'Cyber kill chain', [
  'Memorize os sete estágios e associe um controle e um log a cada um. Esse exercício, repetido para os ataques mais relevantes ao seu setor, constrói o mapa mental que o analista usa sob pressão: ao receber um alerta, ele sabe em que ponto da cadeia o adversário se encontra e quais próximos movimentos antecipar.',
], [
  'Reconhecimento: varreduras e OSINT — visível em logs de firewall e em feeds de inteligência',
  'Weaponização: montagem do payload — invisível ao defensor; mitigada por inteligência de ameaças',
  'Entrega: phishing, drive-by, USB — e-mail gateway, proxy, controles de mídia removível',
  'Exploração: execução do código — EDR, exploit protection, patching em dia',
  'Instalação: persistência — chaves Run, serviços, tarefas agendadas (Sysmon 13, Event ID 7045)',
  'Command and Control: beaconing — proxy, DNS, NetFlow, detecção de C2',
  'Ações sobre objetivos: exfiltração, cifragem — DLP, volume de saída, alertas de ransomware',
])

push(1, 'Fundamentos do Blue Team', 'Diamond Model', [
  'O Diamond Model descreve cada evento intrusivo por quatro vértices conectados: adversário (quem), capacidade (o quê), infraestrutura (onde) e vítima (alvo). Sua força está na pivotagem analítica: descoberto um domínio de C2 (infraestrutura), você busca outras vítimas que acessaram o mesmo domínio; identificado um binário (capacidade), você varre o parque por hashes relacionados. O modelo transforma alerta solto em investigação estruturada.',
  'Analistas usam o modelo para sair da visão de evento isolado e construir o quadro completo da intrusão. Cada novo fato preenche um vértice e sugere consultas nos demais: a vítima explica o vetor, a infraestrutura revela alcance, a capacidade indica sofisticação e atribuição. Documente suas investigações nesses quatro eixos e o relatório final quase se escreve sozinho.',
])

push(1, 'Fundamentos do Blue Team', 'Ameaça, vulnerabilidade e risco', [
  'Terminologia precisa evita decisões erradas. Ameaça é o agente capaz de causar dano: um grupo criminoso, um insider, um desastre natural. Vulnerabilidade é a fraqueza explorável: um CVE sem patch, uma senha fraca, um processo sem dono. Risco é a probabilidade de a ameaça explorar a vulnerabilidade e o impacto disso sobre o negócio. Sem ameaça ou sem vulnerabilidade, o risco despenca.',
  'Essa aritmética conceitual orienta priorização: um CVSS 9.8 sem exploit público, em sistema isolado, pode pesar menos que um CVSS 7.5 com exploit ativo catalogado no KEV da CISA no servidor de pagamentos. O vocabulário também estrutura a comunicação com executivos: eles não compram mitigação de vulnerabilidades abstrata — compram redução de risco de interrupção e vazamento.',
])

push(1, 'Fundamentos do Blue Team', 'Defesa em profundidade', [
  'Defesa em profundidade significa sobrepor controles independentes: nenhuma camada isolada é perfeita, mas a combinação — perímetro, rede, endpoint, identidade, dados e pessoas — obriga o adversário a vencer várias vezes seguidas. O papel do Blue Team é verificar onde as camadas se sobrepõem de fato e onde a sobreposição existe apenas no diagrama da apresentação.',
], undefined, {
  title: 'ARMADILHA COMUM',
  text: 'Acreditar que uma única ferramenta resolve a defesa: compramos EDR, estamos protegidos. EDR sem triagem, sem tuning e sem processo vira telemetria cara e ignorada. Ferramenta não substitui gente, processo e prática — controles precisam ser testados, monitorados e mantidos.',
})

// ============================================================
// CAPÍTULO 2 — SOC na prática
// ============================================================

push(2, 'SOC na prática', 'O que é um SOC', [
  'O Security Operations Center é a função organizacional que monitora continuamente a postura de segurança e responde a incidentes. Concretamente, é a junção de pessoas (analistas, engenheiros, gestores), processos (playbooks, SLAs, escalonamento) e tecnologia (SIEM, EDR, threat intel, SOAR) operando de forma coordenada. Um SOC sem processo vira sala de telas bonitas; um SOC sem pessoas treinadas vira um pipeline de alertas ignorados.',
  'SOC não é somente reativo. Um centro maduro alimenta regras de detecção, faz threat hunting proativo, gerencia vulnerabilidades em parceria com a TI e mede a própria performance. A distinção importante: o SOC detecta e responde a eventos; o CSIRT lidera incidentes declarados com autoridade de crise. Em organizações menores as funções coexistem nas mesmas pessoas — com papéis bem definidos.',
])

push(2, 'SOC na prática', 'Modelos operacionais', [
  'Não existe formato único: o modelo ideal depende de maturidade, orçamento e criticidade 24x7 do negócio. O que importa é clareza de responsabilidade — quem tria, quem contém, quem decide — independentemente de o analista estar no prédio ao lado ou em outro fuso horário.',
], [
  'SOC interno próprio: controle total, custo alto, difícil manter cobertura 24x7 e especialistas',
  'MSSP gerenciado: terceiro monitora; atenção redobrada a SLAs, contexto do negócio e qualidade de triagem',
  'Co-gestão (híbrido): MSSP cobre noites e fins de semana; time interno lidera horário comercial e incidentes',
  'SOC virtual: equipe distribuída sem sala física, comum em empresas cloud-first',
  'Follow-the-sun: três turnos em fusos diferentes, reduz handoffs e alivia fadiga noturna',
])

push(2, 'SOC na prática', 'Tier 1: triagem', [
  'O Tier 1 é a porta de entrada: recebe o alerta, valida se é verdadeiro ou falso positivo, enriquece com contexto (quem é o usuário, o que é o host, qual a criticidade) e decide: fechar, documentar ou escalar. O objetivo é separar sinal de ruído rápido — bons times triam a maioria dos alertas em minutos, com SLA explícito, por exemplo quinze minutos para alertas P1.',
  'O erro clássico do Tier 1 é fechar alerta por preguiça ou escalar tudo por medo. Ambos destroem o SOC: o primeiro deixa intrusões passarem, o segundo inunda o Tier 2 e quebra a confiança entre níveis. A saída é critério: playbooks claros por tipo de alerta, checklist mínimo de enriquecimento e documentação do raciocínio no ticket. Sempre.',
])

push(2, 'SOC na prática', 'Tier 2: investigação', [
  'O Tier 2 recebe o que o Tier 1 não conseguiu resolver e investiga de verdade: correlaciona fontes, monta a linha do tempo, define escopo (quais hosts, contas e dados estão envolvidos), executa contenções de baixo risco e só então escala para o Tier 3 ou para o IR formal. É o nível em que a investigação ganha estrutura: hipótese, evidência, conclusão.',
  'Ferramentas diárias: queries no SIEM, console do EDR, inteligência de IOC e histórico de tickets. O Tier 2 também alimenta o ciclo de melhoria: todo falso positivo recorrente vira pedido de tuning, todo padrão novo vira documento na base de conhecimento. Medir tempo médio de investigação e taxa de escalonamento ajuda a calibrar o equilíbrio entre os níveis.',
])

push(2, 'SOC na prática', 'Tier 3 e threat hunting', [
  'O Tier 3 concentra expertise: análise de malware, engenharia de detecção, threat hunting e suporte profundo a resposta a incidentes. Diferente dos Tiers 1 e 2, seu trabalho é majoritariamente proativo: caça hipóteses nos dados, escreve regras que automatizam o que descobriu e testa a cobertura contra técnicas do MITRE ATT&CK. É o nível que transforma o SOC de reativo em antecipativo.',
  'Esse nível também é a ponte com o Red Team: participa de exercícios purple team, valida se as detecções funcionam contra técnicas reais e traduz resultados em roadmap de melhoria. Sem capacidade de engenharia de detecção, o SOC depende eternamente de regras prontas de fornecedores — que enxergam o genérico, nunca as particularidades do seu ambiente.',
])

push(2, 'SOC na prática', 'CSIRT e coordenação', [
  'O CSIRT (Computer Security Incident Response Team) é o time formal de resposta a incidentes: declara o incidente, ativa a cadeia de comunicação, coordena contenção com jurídico, TI e negócio, e conduz o fechamento. Enquanto o SOC olha para alertas o dia inteiro, o CSIRT olha para incidentes — eventos declarados com impacto potencial e dono definido.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Defina papéis de crise antes do incidente: incident commander (decide), scribe (documenta a cronologia), analista técnico (investiga) e porta-voz (comunica). Um incidente sem incident commander degenera em dez pessoas fazendo a mesma coisa e ninguém escrevendo nada.',
})

push(2, 'SOC na prática', 'Turnos 24x7 e fadiga', [
  'Operar 24x7 significa conviver com turnos noturnos, plantões e handoffs. A ciência da fadiga é clara: após a meia-noite, atenção e julgamento caem de forma mensurável. Bons SOC mitigam com rotação que respeita limites humanos, alertas de qualidade (nada de centenas de falsos positivos às 3h da manhã), automação do repetitivo e passagem de plantão estruturada: o que está aberto, o que precisa de follow-up, o que mudou.',
  'Alert fatigue é o assassino silencioso de SOCs: quando o analista vê o mesmo falso positivo cem vezes, ele aprende a fechar sem olhar — e é exatamente nesse dia que o alerta era real. Tuning constante, supressão justificada por ticket e revisão periódica das regras mais barulhentas são manutenção obrigatória, não luxo.',
])

push(2, 'SOC na prática', 'Fluxo de alertas', [
  'Todo alerta segue um ciclo. Formalizá-lo garante que nada se perde entre turnos e que métricas possam ser extraídas de cada etapa. Um fluxo típico:',
], [
  'Evento bruto chega ao SIEM (log de firewall, EDR, IdP, proxy)',
  'Regra de correlação dispara e cria o alerta com severidade inicial',
  'Tier 1 tria: enriquece, valida e classifica (verdadeiro ou falso positivo)',
  'Escalonamento ao Tier 2 com contexto anexado, quando necessário',
  'Resposta: contenção, bloqueio, ticket para TI, comunicação aos envolvidos',
  'Fechamento com causa raiz resumida e lição aprendida registrada',
])

push(2, 'SOC na prática', 'Ticket e documentação', [
  'Ticket é memória institucional. Seis meses depois, quando o mesmo atacante volta, o histórico de tickets e timelines é o que permite reconhecer o padrão em minutos em vez de horas. Documente hipóteses, evidências consultadas (com horário em UTC), ações executadas e resultado. Um bom ticket responde três perguntas sem precisar do autor: o que aconteceu, o que foi feito e por quê.',
  'O handoff entre turnos merece ritual: quinze minutos, lista de alertas abertos, status de cada investigação, ações pendentes e eventos relevantes do dia. SOC que troca de turno por mensagem de aplicativo de conversa perde contexto, duplica trabalho e deixa alertas morrerem no vácuo entre plantões.',
])

push(2, 'SOC na prática', 'Stack mínimo do SOC', [
  'Ferramentas variam com orçamento, mas um conjunto mínimo é universal. Antes de sonhar com SOAR e XDR, garanta que a base está sólida e que existe integração real entre as peças — dado circulando, alerta fluindo e resposta acontecendo de fato.',
], [
  'SIEM operacional, com fontes críticas ingeridas e regras mantidas',
  'EDR/XDR implantado em, no mínimo, servidores e endpoints críticos',
  'Fonte de threat intelligence: feed comercial, MISP comunitário ou feeds abertos',
  'Gestão de tickets (Jira, ServiceNow, GLPI) integrada ao fluxo de alertas',
  'Canal de comunicação dedicado e base de conhecimento com playbooks',
  'Opcional, mas recomendado: SOAR para automatizar enriquecimento e resposta repetitiva',
])

// ============================================================
// CAPÍTULO 3 — SIEM e coleta de logs
// ============================================================

push(3, 'SIEM e coleta de logs', 'O papel do SIEM', [
  'O SIEM (Security Information and Event Management) é o coração analítico do SOC: centraliza logs de milhares de fontes, normaliza formatos, correlaciona eventos, dispara alertas e serve como plataforma de investigação. Splunk, Elastic Security, Microsoft Sentinel, IBM QRadar, Securonix e Wazuh dominam o mercado, cada um com linguagem de consulta e modelo de custo próprios.',
  'Mais que produto, SIEM é programa: o valor vem das fontes bem ingeridas, das regras mantidas, das buscas otimizadas e dos analistas treinados na linguagem da plataforma. Um SIEM caro com logs ruins entrega alertas ruins. Invista primeiro na qualidade da coleta e da normalização; a ferramenta escolhida é quase sempre secundária nessa equação.',
])

push(3, 'SIEM e coleta de logs', 'Arquitetura de ingestão', [
  'A arquitetura clássica separa três funções: coleta (agentes como Splunk Universal Forwarder, Winlogbeat e NXLog, ou coletores centralizados recebendo syslog), indexação (nós que processam, enriquecem e gravam os dados) e busca/análise (search head ou camada web onde os analistas consultam). Em nuvem, Sentinel e Elastic Cloud abstraem parte da infraestrutura, mas os conceitos persistem.',
  'Problemas de arquitetura aparecem como sintomas operacionais: buffers enchem e logs chegam atrasados, ingestão mal dimensionada descarta eventos em picos, e firewalls bloqueando a porta do coletor deixam servidores inteiros cegos. Monitore a saúde do pipeline como produção: agentes offline, latência de ingestão, volume por fonte e taxa de eventos por segundo (EPS).',
])

push(3, 'SIEM e coleta de logs', 'Plataformas de mercado', [
  'Cada plataforma tem identidade técnica. O analista que domina os conceitos — indexação, campos, filtros, agregações — migra entre elas em dias; o que muda é a sintaxe, não a lógica:',
], [
  'Splunk: SPL madura, apps ricos, modelo de custo por volume de ingestão diária',
  'Elastic Security: base Elasticsearch, formato ECS, visualizações fortes, self-hosted ou cloud',
  'Microsoft Sentinel: cloud-native no Azure, KQL, integração nativa com Defender e Entra ID',
  'IBM QRadar: forte em correlação e compliance, presença histórica em bancos',
  'Wazuh: open source com gestão de agentes, HIDS e SIEM leve; boa porta de entrada',
])

push(3, 'SIEM e coleta de logs', 'Normalização: CEF e LEEF', [
  'Cada fabricante inventa seu formato de log, e correlação só funciona se tudo falar a mesma língua. CEF (Common Event Format), da ArcSight, é o padrão de facto para aparelhos de rede: header fixo mais pares chave=valor (src=10.0.0.5 dst=... suser=...). LEEF, da IBM QRadar, é variante similar. No mundo moderno, ECS (Elastic Common Schema) e OCSF (Open Cybersecurity Schema Framework) assumem esse papel para telemetria rica.',
  'Normalização malfeita é a raiz silenciosa de alertas perdidos: se o campo de usuário às vezes se chama suser, às vezes src_user e às vezes accountName, sua regra de correlação falha em parte das fontes sem nenhum erro aparente. Reserve tempo de engenharia para padronizar os campos críticos — usuário, host, IP, timestamp e ação — em todas as fontes.',
])

push(3, 'SIEM e coleta de logs', 'Parsing e horários', [
  'Timestamp é o campo mais importante e mais trapaceiro de um SIEM. Logs chegam com horário local, UTC, epoch ou sem indicação de fuso; relógios de host dessincronizados fazem eventos viajarem no tempo e quebram correlações por janela temporal sem nenhum erro visível.',
], undefined, {
  title: 'ARMADILHA COMUM',
  text: 'Correlacionar eventos com horários de fontes em fusos diferentes perde intrusões inteiras silenciosamente. Padronize a ingestão em UTC, valide NTP em todos os hosts e teste sempre com um evento sintético de ponta a ponta: gerado no endpoint e encontrado no SIEM.',
})

push(3, 'SIEM e coleta de logs', 'Fontes de logs prioritárias', [
  'Ingerir tudo é caro e preguiçoso; ingerir pouco é cego. Priorize as fontes que respondem às perguntas centrais do SOC — quem, o quê, onde, quando — começando por:',
], [
  'Identidade: Active Directory, Entra ID, VPN — quem entrou, de onde, quando',
  'Endpoint: Windows Event Log, Sysmon e telemetria de EDR',
  'Rede: firewall, proxy, DNS e NetFlow — para onde o tráfego foi',
  'Aplicações críticas: falhas de autenticação e alterações administrativas',
  'Nuvem: CloudTrail (AWS), Activity Logs (Azure), audit logs do Google Workspace',
  'E-mail: gateway de segurança — o vetor de entrada número 1',
])

push(3, 'SIEM e coleta de logs', 'Retenção de logs', [
  'Retenção equilibra necessidade investigativa, exigência regulatória e custo. Regras práticas: hot storage (busca instantânea) de 30 a 90 dias cobre a maioria das investigações; warm/cold de 6 a 12 meses atende compliance — o PCI DSS exige 12 meses de log com 90 dias imediatamente disponíveis; arquivos imutáveis de longo prazo cobrem requisitos legais raros.',
  'Existe também o motivo adversarial: atacantes apagam logs (MITRE T1070, Indicator Removal). Se o log de segurança reside apenas no host, ele morre com o host. Centralize, replique e considere storage write-once para evidências críticas. Verifique periodicamente que a restauração dos logs arquivados funciona — arquivo que nunca foi restaurado não está arquivado, está perdido.',
])

push(3, 'SIEM e coleta de logs', 'Custo de ingestão', [
  'A maioria dos SIEMs cobra por volume ingerido (GB/dia), e algumas fontes estouram o orçamento: debug de aplicações falantes, health checks de balanceadores, logs repetitivos de telemetria. O caminho é filtragem inteligente na borda: descartar na origem o que nunca serviu para segurança, rotear para cold storage o que só serve para compliance e manter no hot path o que sustenta detecção.',
  'Cuidado com cortes cegos: aquele log repetitivo de firewall pode ser a única testemunha de um beacon C2. Toda exclusão deve passar por pergunta explícita: qual investigação ficaria impossível sem este dado? Documente os filtros aplicados — auditor e investigador futuro precisam saber o que foi descartado antes de chegar ao SIEM.',
])

push(3, 'SIEM e coleta de logs', 'Correlação e regras de alerta', [
  'Regras variam em complexidade. Threshold simples: mais de dez logons falhos em cinco minutos. Correlação em sequência: logons falhos seguidos de sucesso vindo do mesmo IP (brute force bem-sucedido). Baseada em baseline: processo que nunca rodou nesse host aparece às 3h. As boas regras combinam raridade estatística com significado: frequente e inofensivo é ruído; raro e inofensivo é curiosidade; raro e nocivo é alerta.',
  'Toda regra nova nasce em modo silencioso ou de auditoria sempre que possível: rode sem alertar por uma semana, meça o volume, ajuste e então ative. Documente justificativa, fonte de dados, mapeamento ATT&CK e quem é o dono. Regra sem dono é regra condenada a vencer no esquecimento.',
])

push(3, 'SIEM e coleta de logs', 'Saúde do pipeline', [
  'Pipeline de logs é infraestrutura crítica e merece o mesmo cuidado de um sistema de faturamento. Rotinas mínimas de saúde:',
], [
  'Dashboard de ingestão por fonte, com alerta de queda acima de 20% da média de 7 dias',
  'Monitor de agentes offline, priorizado pela criticidade do host',
  'Teste sintético diário: evento gerado no endpoint e verificado no SIEM',
  'Revisão mensal das regras mais barulhentas (top de falsos positivos)',
  'Verificação trimestral de restauração dos arquivos em cold storage',
  'Alerta quando o consumo atingir 80% da cota de licença ou volume contratado',
])

// ============================================================
// CAPÍTULO 4 — Análise de logs na prática
// ============================================================

push(4, 'Análise de logs na prática', 'Windows Event Log: visão geral', [
  'O Windows registra tudo em arquivos .evtx em C:\\Windows\\System32\\winevt\\Logs. Para o SOC, os canais essenciais são Security (logons, objetos, alterações), System (serviços e drivers), Sysmon (quando instalado, em Applications and Services Logs), PowerShell/Operational (script blocks, Event ID 4104) e TerminalServices (sessões RDP). Ferramentas de leitura: Event Viewer para humanos; wevtutil e Get-WinEvent para automação.',
  'Auditoria não vem ligada por padrão: políticas de auditoria de logon (sucesso e falha), criação de processos e alteração de serviços precisam ser habilitadas via GPO. Um host sem política de auditoria correta é uma câmera desligada — o SOC herda o problema e descobre só quando precisa do log. Audite a auditoria: monitore o Event ID 1102 (log de segurança limpo) e o 4719 (mudança de política).',
])

push(4, 'Análise de logs na prática', 'Event ID 4624: logon bem-sucedido', [
  'O 4624 registra todo logon bem-sucedido no Windows, e o campo mais valioso é o Logon Type. Tipo 2 é interativo (console), 3 é rede (SMB e compartilhamentos), 4 é batch (tarefas agendadas), 5 é serviço, 7 é unlock, 8 é network cleartext (básico inseguro), 10 é remote interactive (RDP) e 11 são credenciais em cache. Cada tipo tem uma expectativa de normalidade diferente por classe de host.',
  'Campos-chave para investigar: SubjectUserName (quem executou), TargetUserName (conta alvo), IpAddress e WorkstationName (origem) e LogonId — que permite amarrar eventos subsequentes (processos, acesso a objetos) a essa sessão. Um 4624 tipo 3 vindo da internet, ou tipo 10 em servidor que nunca recebeu RDP, merece olhar imediato.',
])

push(4, 'Análise de logs na prática', 'Event ID 4625: logon falho', [
  'O 4625 registra falhas de logon e o sub-status revela a natureza do problema — informação preciosa para distinguir usuário distraído de ferramenta de brute force mapeando nomes. Interprete os códigos mais comuns:',
], [
  '0xC0000064: usuário inexistente — típico de enumeração de usernames',
  '0xC000006A: senha incorreta — padrão de brute force ou usuário distraído',
  '0xC0000072: conta desabilitada — pode indicar tentativa em conta de serviço aposentada',
  '0xC0000234: conta bloqueada (lockout) — frequentemente service account com senha expirada em loop',
  '0xC000006F: logon fora do horário permitido — vale olhar em contas privilegiadas',
  '0xC0000224: usuário obrigado a trocar senha no primeiro logon — atenção em contas recém-criadas',
])

push(4, 'Análise de logs na prática', 'Event ID 4688: criação de processo', [
  'O 4688 registra a criação de processos — a espinha dorsal da investigação Windows sem EDR. Com a auditoria de criação de processos habilitada via GPO e, crucialmente, a opção de auditoria de linha de comando ativada, cada evento traz o comando completo, o criador (Creator Subject), o PID novo e o contexto do token. Sem linha de comando, você sabe o que rodou, mas não com quais argumentos — metade do valor se perde.',
  'O poder do 4688 está na encadeação: use o LogonId do 4624 para amarrar todos os processos abertos por uma sessão suspeita. powershell.exe com parâmetro -enc no meio da madrugada, cmd.exe filho de winword.exe, whoami em servidor web — padrões que saltam aos olhos numa linha do tempo de 4688 bem indexada.',
])

push(4, 'Análise de logs na prática', 'Event ID 7045: novo serviço', [
  'O 7045 registra a instalação de um novo serviço no Windows — um dos vetores de persistência e movimento lateral mais usados (psexec cria serviço, ferramentas de ransomware criam serviços para espalhar). O evento traz Service Name, Display Name, Image Path (o comando executado) e tipo de início. É barato de coletar e raramente legítimo em produção: TI cria serviços em janelas de mudança, não às 2h de sábado.',
  'Regras úteis: alerte em Image Path com PowerShell, cmd, certutil, caminhos temporários (%TEMP%, \\Users\\Public), shares UNC (\\\\servidor\\share) ou binário sem editor conhecido. Cruze com o 4688 para ver quem criou e com os eventos 5140/5145 para o acesso de rede envolvido. Persistência barata é visível — só é preciso olhar.',
])

push(4, 'Análise de logs na prática', 'Sysmon: telemetria de endpoint', [
  'O Sysmon (Sysinternals) amplia drasticamente a telemetria nativa do Windows: criação de processos com hash e linha de comando, conexões de rede por processo, carregamento de DLLs, escrita em registry, criação de arquivos e consulta DNS — tudo com riqueza muito maior que os Event IDs nativos. É gratuito, leve e o multiplicador de visibilidade com melhor custo-benefício que um ambiente Windows pode receber.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Não invente a configuração do zero: comece com o config comunitário da SwiftOnSecurity, ajuste exclusões para o seu ambiente e versione no Git. Sysmon sem exclusões gera volume enorme; com exclusões demais, gera pontos cegos. Revisite o config a cada trimestre.',
})

push(4, 'Análise de logs na prática', 'Sysmon: Event IDs essenciais', [
  'A lista completa de Event IDs do Sysmon é longa, mas dez cobrem a maior parte das investigações do dia a dia:',
], [
  'Event 1: criação de processo — linha de comando, hash, empresa assinante',
  'Event 3: conexão de rede iniciada por processo — destino, porta, processo pai',
  'Event 7: carregamento de imagem (DLL) — base para detecção de DLL hijacking',
  'Event 8: CreateRemoteThread — clássico de injeção de código',
  'Event 10: ProcessAccess com permissões de leitura de memória — credential dumping',
  'Event 11: criação de arquivo — droppers e scripts soltos em disco',
  'Event 13: alteração de registry — chaves Run, serviços, subscriptions WMI',
  'Event 22: consulta DNS por processo — resolve o destino de C2 por nome',
])

push(4, 'Análise de logs na prática', 'Linux: auth.log e secure', [
  'No Linux, autenticação mora no syslog: /var/log/auth.log no Debian/Ubuntu e /var/log/secure no RHEL/CentOS. As linhas do sshd contam a história: Failed password for invalid user admin from 203.0.113.7 mostra brute force com usernames inexistentes; Accepted publickey for deploy mostra entrada por chave; sudo registra as elevações com o comando executado. Com journald, use journalctl -u ssh --since "1 hour ago".',
  'Atenção às diferenças: sistemas modernos mandam tudo para o journald (formato binário), e o rsyslog precisa estar configurado para persistir em texto. Para o SOC, centralize: configure rsyslog ou syslog-ng para enviar o auth.log ao SIEM (UDP/TCP 514 ou via agente) e garanta que o fail2ban não esteja banindo IPs tão rápido que o log de investigação suma do host.',
])

push(4, 'Análise de logs na prática', 'Linux: wtmp, btmp e histórico', [
  'Além do auth.log, o Linux guarda artefatos binários de sessão que sobrevivem à limpeza superficial de logs. Conheça e colete:',
], [
  '/var/log/wtmp — histórico de logons; leia com last (usuário, terminal, IP, duração)',
  '/var/log/btmp — logons falhos; leia com lastb — ouro para forense de brute force',
  'lastlog — último logon de cada usuário, útil para contas dormentes comprometidas',
  '/var/log/audit/audit.log — auditoria do kernel (execve, syscalls); leia com ausearch',
  '~/.bash_history — histórico de comandos; compare timestamps e ordem por sinais de adulteração',
])

push(4, 'Análise de logs na prática', 'Logs de proxy e DNS', [
  'Proxy e DNS são as câmeras de trânsito da rede: mostram para onde o ambiente está indo, mesmo quando o endpoint não tem agente. No proxy (Squid, Zscaler, Blue Coat), campos essenciais: usuário autenticado, URL completa, método, status, bytes enviados e recebidos, user-agent e categoria. Beacons C2 aparecem como requisições regulares a domínios raros com user-agent estranho; exfiltração aparece como POSTs grandes para clouds de armazenamento.',
  'No DNS, procure padrões anômalos: taxa alta de NXDOMAIN (indicativo de DGA), domínios de entropia alta (tunneling com dnscat2 ou iodine), consultas TXT repetidas e resoluções para faixas novas. Correlacione DNS com proxy e com a conexão real (NetFlow): o malware resolve o nome antes de conectar — o DNS quase sempre dispara antes do resto.',
])

push(4, 'Análise de logs na prática', 'Caso prático: brute force seguido de sucesso', [
  'Cenário clássico de exame: um IP externo gera centenas de 4625 contra contas variadas (0xC0000064 e 0xC000006A alternados) e, às 02:47, um 4624 tipo 10 vindo do mesmo IP para uma conta privilegiada. O que fazer a partir daqui não é adivinhar — é seguir o rastro com disciplina.',
], undefined, {
  title: 'CHECKLIST',
  text: '1) Confirme o IP de origem no 4624 e cheque geo/reputação; 2) Verifique o 4672 (logon especial) da conta; 3) Puxe o 4688 da LogonId da sessão para ver comandos; 4) Cheque o 7045 e chaves Run (persistência); 5) Correlacione proxy e DNS pela janela; 6) Se confirmado, isole, resete credenciais e abra incidente com cadeia de custódia.',
})

// ============================================================
// CAPÍTULO 5 — Redes e monitoramento
// ============================================================

push(5, 'Redes e monitoramento', 'Visibilidade de rede no SOC', [
  'Telemetria de rede é a contrapartida independente do endpoint: agentes podem ser desinstalados, logs podem ser apagados, mas o tráfego passa pelos pontos de observação. O SOC precisa decidir onde olhar: SPAN ports (espelhamento em switches) são baratas e suficientes para a maioria; TAPs ópticos e passivos garantem fidelidade total em links críticos. Sem visibilidade de rede, exfiltração e C2 dependem exclusivamente de o endpoint contar a verdade.',
  'Distinga tráfego north-south (entrando e saindo do perímetro) de east-west (entre servidores, dentro do datacenter). Ataques modernos vivem no leste-oeste: movimentação lateral via SMB (445), RDP (3389), WMI e WinRM (5985/5986). Monitorar só a borda é vigiar a porta da frente e ignorar os corredores internos — é lá que a intrusão cresce.',
])

push(5, 'Redes e monitoramento', 'NetFlow e IPFIX', [
  'NetFlow e IPFIX exportam metadados de fluxo: origem, destino, portas, protocolo, bytes, pacotes e timestamps. Não trazem payload, mas entregam escala: um coletor (porta UDP 2055, 9995 ou 9996 conforme a implementação) aguenta redes inteiras com custo de storage irrisório comparado ao PCAP. Com sFlow, os switches acrescentam amostragem de pacotes para contexto extra.',
  'Casos de uso diários: detectar exfiltração por volume (host que passou a enviar 40 GB/dia para destino novo), mapear movimentação lateral (quem fala SMB com quem), validar o perímetro (tráfego atravessando segmentos que deveriam estar isolados) e reconstruir a linha do tempo de contato com infraestrutura de C2. Ferramentas: ntopng, ElastiFlow ou o módulo de fluxo do próprio SIEM.',
])

push(5, 'Redes e monitoramento', 'IDS e IPS', [
  'IDS (intrusion detection) observa cópias do tráfego e alerta; IPS (intrusion prevention) fica inline e bloqueia. O debate clássico: o IDS passivo não quebra nada e não vira gargalo, mas exige que alguém leia o alerta; o IPS bloqueia sozinho, mas um falso positivo em produção tem custo real. Muitos ambientes rodam IDS na rede interna e IPS apenas em fronteiras específicas.',
  'Os motores dominantes são Snort e Suricata (multithread, com suporte a protocolos e extração de arquivos). Assinaturas cobrem o conhecido; detecção por anomalia cobre o estranho. Ambos precisam de tuning: rulesets comunitários (ET Open, Snort Community) geram ruído em ambiente sem contexto. Diferencie a resposta: assinatura de exploit ativo (CVE crítico) é P1; scanner genérico é busca de inventário.',
])

push(5, 'Redes e monitoramento', 'Suricata e regras', [
  'Regras Snort/Suricata têm anatomia fixa: cabeçalho (ação, protocolo, origem/destino, porta) e opções (content, pcre, sid, msg). O log eve.json da Suricata é o formato mais analítico: JSON com metadados por evento, direto ao SIEM. Fundamentos que todo analista precisa reconhecer:',
], [
  'alert tcp $HOME_NET any -> $EXTERNAL_NET 443 — estrutura básica do cabeçalho',
  'content:"malware.example.com"; — correspondência literal no payload',
  'flow:established,to_server; — contexto de conexão da regra',
  'sid:1000001; — identificador único (faixa 1M+ é espaço local, evita conflito com regras oficiais)',
  'Logs: fast.log para alertas simples, eve.json para análise rica',
  'Rule sets: ET Open, Snort Community e Talos; mantenha atualização e acompanhe mudanças',
])

push(5, 'Redes e monitoramento', 'Zeek', [
  'O Zeek (antigo Bro) é um framework de análise de rede que produz logs estruturados de cada protocolo: conn.log (conexões), dns.log, http.log, ssl.log (com certificados e JA3), files.log (arquivos transferidos) e ssh.log. Mais que IDS por assinatura, o Zeek registra o que aconteceu na rede em formato investigável — é a base de muitos NDR comerciais.',
  'O poder do Zeek está nos scripts: políticas customizadas respondem a comportamentos (extrair executáveis transferidos, alertar sobre certificados autoassinados, logar requisições HTTP com user-agent raro). Para o analista, os logs Zeek respondem perguntas que logs de firewall não respondem: qual foi o certificado desse servidor, qual o user-agent, o que foi baixado. Zeek + Suricata em paralelo é arquitetura de referência — o Security Onion faz exatamente isso.',
])

push(5, 'Redes e monitoramento', 'PCAP e análise', [
  'Captura completa de pacotes (PCAP) é a evidência definitiva de rede: tudo que passou, byte a byte, reanalisável quando quiser. O custo é storage e complexidade legal — tráfego completo pode conter dados pessoais e segredos comerciais. A arquitetura híbrida funciona bem: fluxos e metadados por muito tempo, PCAP circular (ring buffer) dos últimos dias ou captura acionada por alerta.',
  'Ferramentas do dia a dia: tcpdump para captura (filtros BPF como host 10.0.0.5 and port 53), Wireshark para análise interativa (filtros de display como http.request ou tls.handshake.type==1) e tshark para automação. Em incidente, o PCAP responde o que nenhum log responde: o conteúdo exato do C2, os arquivos exfiltrados e o payload do exploit.',
])

push(5, 'Redes e monitoramento', 'Segmentação de rede', [
  'Segmentação é controle defensivo e amplificador de detecção ao mesmo tempo. VLANs e firewalls internos reduzem o raio de movimento; microssegmentação (políticas por workload, service mesh) aproxima o ideal zero trust. Do lado do SOC, cada fronteira criada é também uma fronteira observável: tráfego cruzando zonas que deveriam estar isoladas é alerta quase automático de problema — seja ataque, seja configuração errada.',
  'Padrões que merecem alerta dedicado: workstation falando SMB com servidor de outro segmento, servidor web iniciando RDP para controlador de domínio, usuário comum acessando porta de banco de dados diretamente. Cada organização define seu mapa de zonas (usuários, servidores, gestão, produção industrial), e o SOC deve conhecer esse mapa como a palma da mão.',
])

push(5, 'Redes e monitoramento', 'Detecção de exfiltração', [
  'Exfiltração (MITRE TA0010) quase sempre deixa marca no volume e no padrão: uploads grandes para destinos novos, sessões de saída longas e constantes, uso de protocolos atípicos para o host (DNS pesado em servidor web) e transferências para serviços de armazenamento em nuvem recém-registrados. Baseline por host e por destino é o pré-requisito: sem saber o normal, o anômalo é invisível.',
  'Sinais específicos: conexões regulares (beaconing) com jitter baixo; certificados TLS autoassinados ou com SAN estranho; JA3 (hash do handshake TLS) conhecido de ferramentas de ataque; tráfego DNS com consultas TXT ou subdomínios longos (tunneling); POSTs grandes para pastas públicas de cloud drive. Combine thresholds de volume com análise comportamental: volume alto sozinho pode ser backup legítimo.',
])

push(5, 'Redes e monitoramento', 'Beaconing e C2', [
  'C2 beaconing é o coração do controle pós-exploração: o malware chama casa em intervalos fixos (30s, 60s) com jitter para fugir da detecção exata. Em logs, o padrão salta: conexões regulares a um destino fixo, tamanho de pacote similar, duração pequena e repetição por dias. É a assinatura de tráfego mais confiável de presença ativa de malware.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Ferramentas como a RITA (Real Intelligence Threat Analytics) analisam beacons em logs Zeek/NetFlow automaticamente, calculando score de regularidade. Manualmente: agrupe conexões por (host, destino) e calcule o desvio-padrão dos intervalos — abaixo de cerca de 5% é suspeito.',
})

push(5, 'Redes e monitoramento', 'Caso: mapeando um incidente na rede', [
  'Um alerta de assinatura Suricata acusa tráfego para infraestrutura de Cobalt Strike. A partir daí, a investigação de rede segue roteiro: cada passo cruza uma fonte de dados diferente e preenche um vértice do Diamond Model. Antes de tocar o endpoint, extraia tudo que a rede já sabe:',
], [
  'Confirme no conn.log/NetFlow todos os contatos do host suspeito com o destino de C2',
  'Puxe o ssl.log do Zeek para o JA3 e o certificado — identifique a família de C2',
  'Busque outros hosts com beacons idênticos (mesma infraestrutura, JA3 ou SNI)',
  'Verifique movimentação lateral: SMB, RDP e WMI do host para o restante da rede',
  'Cheque volume de saída (exfiltração) e destinos de upload no proxy',
  'Preserve o PCAP da janela do incidente antes do ring buffer sobrescrever',
])

// ============================================================
// CAPÍTULO 6 — Endpoint e EDR/XDR
// ============================================================

push(6, 'Endpoint e EDR/XDR', 'Telemetria de endpoint', [
  'O EDR substitui o antivírus por assinatura por uma plataforma de telemetria e resposta: o agente coleta processos, arquivos, rede, registro e comportamento, envia à nuvem do fornecedor, e detecções comportamentais com analítica disparam alertas com contexto completo. CrowdStrike Falcon, Microsoft Defender for Endpoint, SentinelOne e Trellix dominam o mercado. O XDR amplia o conceito, correlacionando endpoint com identidade, e-mail e nuvem.',
  'Para o analista, a mudança fundamental é a unidade de investigação: de evento isolado (um log) para cadeia de execução completa (process tree com hashes, comandos, rede e arquivos). Incidentes que levavam dias com logs nativos caem para horas. Mas o EDR não é imortal: agentes podem ser desinstalados, serviços parados e hosts offline ficam cegos — monitore a saúde do parque de agentes como um SLA.',
])

push(6, 'Endpoint e EDR/XDR', 'Process tree', [
  'A investigação por process tree é o coração do trabalho com EDR: cada processo aparece com pai, filhos, linha de comando, hash, assinatura e atividades. Cadeias suspeitas saltam aos olhos: outlook.exe criando wscript.exe que executa powershell.exe com -nop -w hidden é a assinatura clássica de phishing com loader; spoolsv.exe criando cmd.exe é anomalia clara, porque o serviço de impressão não deveria abrir shell.',
  'Perguntas padrão ao ler um process tree: o pai faz sentido? A linha de comando é ofuscada (base64, concatenação, -w hidden)? O binário está onde deveria estar (System32 versus %TEMP%)? Tem assinatura válida, de quem? Depois de responder, expanda lateralmente: o mesmo hash apareceu em outros hosts? O mesmo destino de rede? O EDR moderno responde essas perguntas em segundos — use.',
])

push(6, 'Endpoint e EDR/XDR', 'Sinais de comportamento', [
  'Além do process tree, os EDRs sinalizam comportamentos classificados por técnica do ATT&CK. Os padrões que mais rendem detecções reais no dia a dia:',
], [
  'Masquerading: binário com nome de processo de sistema rodando de caminho errado (svchost.exe em C:\\Users)',
  'LOLBins: certutil, mshta, rundll32 e bitsadmin com argumentos de download ou execução',
  'Persistência: escrita em chaves Run, criação de tarefa agendada ou serviço por processo inesperado',
  'Credential access: lsass.exe acessado por processo não assinado (T1003)',
  'Defesa evadida: desativação de logs e exclusão de serviços de segurança (T1562)',
  'Cifragem em massa: processos renomeando arquivos em volume alto (ransomware)',
])

push(6, 'Endpoint e EDR/XDR', 'Living-off-the-land (LOLBin)', [
  'LOLBins são binários legítimos e assinados do próprio Windows abusados para executar código: certutil -urlcache -f baixa arquivo, bitsadmin /transfer inicia download em segundo plano, mshta roda HTA com script, rundll32 carrega DLL e regsvr32 executa remotamente (o clássico Squiblydoo). Não há binário malicioso para assinatura flagrar — o abuso é do processo legítimo, o que torna a detecção por hash inútil.',
  'A defesa é comportamental: linha de comando incomum para o binário, pai inesperado (certutil filho de winword.exe), destino de rede raro, execução em horário ou host atípico. O MITRE classifica os casos sob T1059 (Command and Scripting Interpreter) e sub técnicas. Bloquear LOLBins inteiramente quebra a TI legítima; o caminho é restringir argumentos (WDAC, políticas) e detectar padrões por telemetria.',
])

push(6, 'Endpoint e EDR/XDR', 'Allowlist e blocklist', [
  'Application control (WDAC no Windows 10/11, AppLocker em versões anteriores) é o controle que mais reduz a superfície de execução: allowlist por publisher, hash, caminho ou regra de integridade só permite rodar o que está aprovado. A blocklist (antivírus tradicional) é reativa por natureza — sempre atrás do malware. Na prática: allowlist total é viável em servidores e ambientes críticos, complexa em estações de desenvolvedores.',
  'Implemente em fases: primeiro modo auditoria (logar tudo que seria bloqueado), analisar o impacto por semanas, liberar exceções justificadas e então ativar enforcement por anel. Vazamentos existem (LOLBins rodam por padrão, regras de publisher são contornáveis), mas o custo do atacante sobe muito: cada bypass é técnica extra, tempo extra e ruído extra — exatamente o que o defensor quer.',
])

push(6, 'Endpoint e EDR/XDR', 'Políticas de PowerShell', [
  'PowerShell é a ferramenta de administração — e de ataque — mais poderosa do Windows. Endurecer sem quebrar a TI: Script Block Logging (Event ID 4104) registra o código executado mesmo ofuscado; Module Logging captura o pipeline; Transcription grava sessões inteiras; Constrained Language Mode limita o que scripts não confiáveis podem fazer. Colete tudo no SIEM.',
], undefined, {
  title: 'ARMADILHA COMUM',
  text: 'ExecutionPolicy não é controle de segurança — é conveniência de usuário, contornável com um parâmetro (-ExecutionPolicy Bypass) e amplamente tratada como tal por atacantes. O que protege de verdade é script block logging somado a WDAC e à detecção no SIEM sobre os eventos 4104.',
})

push(6, 'Endpoint e EDR/XDR', 'Integração EDR + SIEM', [
  'EDR e SIEM são complementares, não redundantes: o EDR tem contexto profundo de endpoint; o SIEM cruza esse contexto com identidade, rede, nuvem e e-mail. Integração mínima: encaminhar alertas do EDR ao SIEM (para triagem unificada), enriquecer alertas de outras fontes com dados do EDR (quais processos rodaram nesse host na última hora) e consultar o console do EDR para investigação profunda.',
  'Cuidado com volume: telemetria bruta de EDR pode estourar o custo do SIEM. Estratégias comuns: ingerir apenas alertas e eventos de alto valor (criação de processo, rede, persistência) e deixar a investigação profunda no console do EDR. O objetivo é o analista não precisar abrir cinco consoles para responder uma pergunta — mas também não pagar duas vezes pelo mesmo byte.',
])

push(6, 'Endpoint e EDR/XDR', 'Resposta via EDR', [
  'O EDR transformou a resposta a incidentes: ações que exigiam ir até o host agora são um clique, com auditoria. Domine as capacidades de resposta da sua plataforma:',
], [
  'Isolar host: corta a rede exceto o canal do agente — contém o spread mantendo o controle',
  'Encerrar processo: mata o binário malicioso em execução',
  'Quarantena de arquivo: move o artefato para contenção e gera hash para busca',
  'Live response: shell remoto no host para coleta e comandos manuais',
  'Pacote forense: coleta automática de artefatos (prefetch, eventos, memória conforme o produto)',
  'Busca global: caçar o mesmo hash ou IOC em todos os endpoints do parque',
])

push(6, 'Endpoint e EDR/XDR', 'Falsos positivos e tuning', [
  'EDR gera ruído: scripts de TI rodando PowerShell legítimo, ferramentas internas que tocam o lsass, backup que comprime milhares de arquivos. Sem tuning, o time aprende a ignorar — e a detecção real afunda no lixo. Trate exclusões como código: revisadas, versionadas, com dono e justificativa. Exclusão mal planejada cria ponto cego permanente exatamente onde os atacantes gostam de operar.',
  'Valide a cobertura de verdade: rode o Atomic Red Team (testes mapeados ao ATT&CK) em ambiente de testes com a mesma stack de produção e confira quais detecções dispararam. O resultado — tabela de técnica por detectado ou não detectado — é o mapa de prioridades de engenharia de detecção mais honesto que existe. Repita a cada atualização de política ou produto.',
])

push(6, 'Endpoint e EDR/XDR', 'Caso: detecção de ransomware no endpoint', [
  'O cenário temido: alerta de EDR acusa um processo tentando apagar shadow copies. Velocidade importa: ransomware cifra em minutos e se espalha lateralmente. A resposta tem uma sequência que vale treinar antes — e o checklist garante que ninguém esquece o essencial no calor do momento.',
], undefined, {
  title: 'CHECKLIST',
  text: '1) Isole imediatamente todos os hosts envolvidos; 2) Identifique o paciente zero e o vetor (phishing, RDP exposto); 3) Capture a memória de um host comprometido antes de reiniciar; 4) Busque contatos C2 e movimentação lateral (SMB/445); 5) Desconecte backups e verifique a integridade; 6) Ative IR formal, jurídico e comunicação; 7) Preserve amostras e evidências com hash antes de qualquer formatação.',
})

// ============================================================
// CAPÍTULO 7 — Threat Intelligence e MITRE ATT&CK
// ============================================================

push(7, 'Threat Intelligence e MITRE ATT&CK', 'O que é threat intelligence', [
  'Threat intelligence é informação sobre adversários transformada em decisão: quem ataca seu setor, com que ferramentas, que motivação e o que fazer a respeito. Níveis: estratégica (para executivos — tendências e risco), operacional (capacidades e campanhas de grupos, TTPs) e tática (IOCs prontos para consumir em máquina). O SOC consome principalmente tática e operacional; produz intel a cada investigação concluída.',
  'O erro comum é comprar feeds e chamá-lo de programa de threat intelligence. Feed sem curadoria vira festival de falsos positivos. Intel útil tem ciclo fechado: requisitos (que perguntas precisamos responder?), coleta, processamento, análise, disseminação (para quem, em que formato) e feedback. A Pirâmide da Dor organiza a discussão de valor.',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'Pirâmide da dor', [
  'A Pyramid of Pain, de David Bianco, ordena os indicadores pelo custo que impõem ao adversário: hashes (fáceis de trocar), IPs e domínios (troca barata, infraestrutura rotativa), artefatos de rede (user-agents, URIs, protocolo customizado), ferramentas (Cobalt Strike, Mimikatz) e TTPs no topo — trocar TTP exige rediscutir o modo de operação inteiro do grupo.',
  'A implicação prática muda a forma de trabalhar: IOC puro tem meia-vida de dias — ainda vale para automação, mas nunca é a estratégia. Detecções que sobrevivem ao upgrade do adversário miram comportamento: monitorar acesso ao lsass por processo não assinado intercepta qualquer credential dumper, hoje e daqui a dois anos. Quanto mais alto na pirâmide a sua detecção mora, mais durável ela é.',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'IOC vs IOA', [
  'IOC (Indicator of Compromise) é evidência de que algo já aconteceu: hash do binário, IP de C2, domínio de phishing. IOA (Indicator of Attack) é sinal de ação em curso: processo tentando acessar o lsass, script escrevendo em chave Run. IOCs alimentam busca retrospectiva e bloqueio imediato; IOAs sustentam detecção comportamental que funciona contra variantes.',
  'Fluxo saudável usa os dois: o IOC entra no SIEM/EDR como watchlist com validade (30 a 90 dias, dependendo da infraestrutura), e cada IOC de campanha relevante deve ser traduzido em pelo menos uma detecção comportamental associada. Pergunte sempre: se o atacante trocar de IP e de binário amanhã, minha detecção ainda dispara? Se a resposta for não, você detecta o exemplo, não a ameaça.',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'MITRE ATT&CK: estrutura', [
  'O MITRE ATT&CK é a taxonomia pública de comportamentos adversários reais, organizada em matrizes (Enterprise, Mobile, ICS). A coluna é a tática (o porquê: Initial Access, Persistence, Credential Access...), a linha é a técnica (o como: T1566 Phishing) com sub técnicas (T1566.001 Spearphishing Attachment). Cada técnica documenta procedimentos observados em grupos reais, mitigações e fontes de dados para detecção.',
  'O ATT&CK funciona como língua comum: o EDR de um fornecedor, o relatório de um CERT e a regra do seu SIEM podem falar da mesma técnica. Para o Blue Team, ele estrutura cobertura: em vez de perguntar se temos EDR, a pergunta vira quais técnicas cobrimos com detecção e quais estão cegas. Comece pelas técnicas mais usadas contra o seu setor — os relatórios de intel e os dados do próprio MITRE ajudam.',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'Táticas-chave (parte 1)', [
  'As quatorze táticas da matriz Enterprise contam a história do ataque em ordem. Primeira metade da jornada:',
], [
  'TA0043 Reconnaissance: OSINT e varredura — antes do ataque, difícil de ver',
  'TA0042 Resource Development: registro de domínios, compra de infraestrutura, desenvolvimento de malware',
  'TA0001 Initial Access: phishing (T1566), exploit público (T1190), credenciais válidas (T1078)',
  'TA0002 Execution: shellcode, LOLBins, scripts (T1059)',
  'TA0003 Persistence: chaves Run, tarefas agendadas (T1053), serviços (T1543)',
  'TA0004 Privilege Escalation: exploração local, abuso de token, UAC bypass',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'Táticas-chave (parte 2)', [
  'Segunda metade — onde o atacante monetiza e o defensor mais sofre:',
], [
  'TA0005 Defense Evasion: desligar logs, apagá-los (T1070), masquerading, rootkits',
  'TA0006 Credential Access: dumping (T1003), kerberoasting (T1558.003), brute force (T1110)',
  'TA0007 Discovery: quem sou, quem é admin, o que existe na rede (net commands, enumeração de AD)',
  'TA0008 Lateral Movement: SMB (T1021.002), RDP (T1021.001), WMI (T1047), pass-the-hash (T1550.002)',
  'TA0009 Collection e TA0010 Exfiltration: empacotar e enviar dados para fora',
  'TA0011 Command and Control e TA0040 Impact: C2, cifragem, extorsão, destruição',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'Técnicas emblemáticas', [
  'Algumas técnicas concentram a maior parte dos incidentes reais. T1566 (Phishing) domina o acesso inicial. T1059 (Command and Scripting Interpreter) — PowerShell, cmd, JavaScript — é o motor de execução. T1003 (OS Credential Dumping) via lsass precede quase toda movimentação séria. T1078 (Valid Accounts) transforma credenciais roubadas em presença legítima — a mais dolorosa, porque cada logon parece normal.',
  'Para cada uma, defina a detecção mínima viável: T1003 dispara com ProcessAccess ao lsass por processo não assinado (Sysmon 10); T1059 com correlação ofensiva de pai e filho (Office criando script); T1078 com análise de contexto — logon vindo de país novo, horário estranho, host inédito para a conta. Priorize pela frequência real no seu ambiente, não pela lista completa.',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'Feeds e curadoria', [
  'Feeds vêm de fornecedores comerciais (Recorded Future, Mandiant, CrowdStrike), comunidades (MISP, ISACs setoriais) e fontes abertas (CISA KEV, abuse.ch com URLhaus e ThreatFox, AlienVault OTX). Formatos: STIX para estrutura, TAXII para transporte, MISP como plataforma de compartilhamento. O gargalo nunca é falta de IOC — é curadoria e integração.',
  'Critérios de qualidade: a fonte atribui a campanha ou atacante? O indicador tem confiança, validade e contexto (quem, o quê, por quê)? A taxa de falso positivo é medida? Está integrado onde decide (SIEM, EDR, proxy, firewall) ou apenas num dashboard ignorado? Automatize o ciclo: o IOC entra com expiração, dispara busca retrospectiva, é bloqueado quando se aplica e é removido quando expira. IOC eterno vira poluição permanente.',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'Mapeando detecções ao ATT&CK', [
  'Matriz de cobertura: liste suas detecções, mapeie cada uma às técnicas ATT&CK que elas interceptam e visualize (a ferramenta DeTT&CT gera heatmaps). O resultado costuma ser humilde: manchas verdes nas técnicas que a ferramenta vendida cobre e deserto nas que exigem trabalho próprio. Esse mapa honesto é o melhor insumo de roadmap que um gestor de SOC pode apresentar.',
  'O ciclo de melhoria: escolha técnicas prioritárias (relatório de intel do setor somado aos incidentes passados), construa detecção, valide com Atomic Red Team ou exercício purple team, atualize o mapa e repita. Cobertura nunca será 100% — e não precisa ser: cobrir bem o caminho mais provável já reduz drasticamente o tempo de detecção das intrusões reais.',
])

push(7, 'Threat Intelligence e MITRE ATT&CK', 'Intel para o SOC', [
  'Inteligência só vale quando muda comportamento operacional. Relatórios de 40 páginas raramente são lidos por quem tria alertas; o SOC precisa de intel operacional condensada: o que mudou, o que procurar e como detectar. Invista nesse formato interno — curto, acionável e com prazo definido.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Publique semanalmente um one-pager: novas TTPs relevantes para o seu setor, IOCs adicionados (com validade), regras criadas ou ajustadas e técnicas ATT&CK em foco. Curto o suficiente para ser lido, concreto o suficiente para gerar busca no SIEM no mesmo dia.',
})

// ============================================================
// CAPÍTULO 8 — Threat Hunting
// ============================================================

push(8, 'Threat Hunting', 'Hunting vs detecção', [
  'Detecção automatizada responde ao conhecido; threat hunting procura o desconhecido que a detecção deixou passar. É uma atividade humana, proativa e com hipótese: o hunter parte de uma suspeita (se eu fosse atacante com esse nível de acesso, o que faria?), navega os dados com queries, raciocínio e criatividade, e termina com um de três resultados: achou intrusão, achou nada (e ganhou confiança no ambiente) ou achou lacuna de visibilidade.',
  'Todo hunt maduro termina em automação: se a hipótese era plausível e não encontrou nada, transforme-a em regra de detecção ou análise agendada — assim o SOC inteiro herda o insight e o hunter libera tempo para a próxima hipótese. Hunting que nunca vira detecção é diversão cara; hunting sem hipótese é passeio. Frameworks como PEAK e TaHiTI estruturam o ciclo.',
])

push(8, 'Threat Hunting', 'Ciclo de hunting', [
  'O ciclo PEAK (Pursue, Expose, Analyze, Know) organiza o trabalho: hipóteses partem da inteligência (Pursue), exploram os dados (Expose), analisam os achados (Analyze) e consolidam conhecimento (Know — documentação, detecções novas, requisitos de telemetria). O TaHiTI segue fluxo similar orientado a intel. O essencial em qualquer framework: hipótese escrita antes de abrir o SIEM e aprendizado registrado no fim.',
  'Meça o hunting também: hipóteses testadas por trimestre, hunts que viraram detecção, tempo médio por hunt e lacunas de visibilidade encontradas (que viram requisitos de ingestão de novos logs). Um programa de hunting sem métricas morre no orçamento — o gestor precisa mostrar que o caçador rende tanto quanto quem tria alertas.',
])

push(8, 'Threat Hunting', 'Formulando hipóteses', [
  'Boas hipóteses nascem de quatro fontes, e a melhor rotação alterna entre elas para não cair no vício de caçar sempre o mesmo tipo de coisa:',
], [
  'Orientada a intel: o APT28 usa tarefas agendadas com nomes aleatórios — há algo assim no ambiente?',
  'Orientada a anomalia: quais processos rodaram nos últimos 30 dias e nunca apareceram antes?',
  'Orientada a domínio de expertise: se eu tivesse credencial do service desk, como escalaria sem disparar alerta?',
  'Orientada a lacuna ATT&CK: não temos detecção para T1053.005 — como isso apareceria nos nossos logs?',
  'Template de hipótese: ator + técnica + fonte de dados + resultado esperado, escrito antes da primeira query',
])

push(8, 'Threat Hunting', 'Base rate fallacy', [
  'A falácia da taxa base é a armadilha estatística do hunter: um comportamento raríssimo no ambiente tem mais valor analítico do que um comportamento anômalo em volume absoluto. Exemplo: PowerShell roda milhares de vezes por dia — ver PowerShell não diz nada. PowerShell filho de winword.exe, com linha de comando em base64, num host de RH às 3h: taxa base próxima de zero, valor analítico altíssimo.',
  'Na prática, calcule a raridade: para cada artefato (binário, processo pai, destino de rede), estabeleça a frequência no ambiente nos últimos 30 dias. Caçar é buscar na interseção de raridade e risco — não no exótico sem consequência, nem no comum com potencial teórico. É o mesmo princípio da medicina diagnóstica: teste para doença rara só faz sentido em população com prevalência compatível.',
])

push(8, 'Threat Hunting', 'Achar a agulha: stacking', [
  'Stacking é a técnica manual mais poderosa do hunter: agrupe os dados por uma coluna e conte valores únicos ou raros. Stack de processos pais (quem cria o quê) revela as combinações raras; stack de binários executados por host revela o executável que só apareceu uma vez; stack de user-agents do proxy revela a ferramenta de ataque que não se disfarçou. O método é repetível e não exige ferramenta sofisticada — apenas queries agregadas bem escolhidas.',
  'Sequência típica: escolha a entidade (processo, conta, domínio), defina a janela (30 dias dá baseline estável), agregue, ordene por frequência crescente e investigue o rabo da distribuição — os valores que aparecem uma ou duas vezes. A maioria será benigna (atualizações, ferramentas de TI esquecidas), mas é exatamente aí que moram as surpresas: o que é raro merece explicação.',
])

push(8, 'Threat Hunting', 'Hunting com query languages', [
  'O hunter fluente troca de linguagem sem perder a lógica: SPL no Splunk, KQL no Sentinel, Lucene no Elastic, SQL em data lakes. Mantenha um repositório versionado de queries de hunting (no Git), com comentário de hipótese, fonte de dados e resultado esperado — queries perdem o contexto em semanas se não forem documentadas.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Comece todo hunt salvando a query com nome de hipótese (por exemplo: hunt_t1053_rare_schtask). Ao final, atualize o mesmo arquivo com resultado e conclusão. Em seis meses, esse repositório vira a base de conhecimento mais valiosa do SOC e o material de onboarding mais rápido para novos analistas.',
})

push(8, 'Threat Hunting', 'Atomic Red Team e validação', [
  'O Atomic Red Team (do Red Canary) é uma biblioteca aberta de testes mapeados a técnicas ATT&CK, executáveis via Invoke-AtomicRedTeam em PowerShell: cada atomic simula uma técnica com comandos controlados e limpos. É o padrão de facto para validar cobertura sem contratar um red team: escolha a técnica, execute no host de teste, verifique se o EDR e o SIEM detectaram.',
  'Fluxo recomendado: ambiente isolado com telemetria idêntica à de produção, execute o teste, pesquise no SIEM o que deveria ter sido detectado, registre o resultado (detectado, alertado ou silente) e transforme cada silente em tarefa de engenharia de detecção. Cadência trimestral mantém o mapa de cobertura vivo — produtos atualizam, o ambiente muda e detecções apodrecem em silêncio.',
])

push(8, 'Threat Hunting', 'Hunting de C2', [
  'Caçar C2 é caçar regularidade e novidade no tráfego. Regularidade: agrupe conexões por (origem, destino) e calcule o desvio-padrão dos intervalos — beacons têm jitter baixo. Novidade: destinos raros nos últimos 30 dias, certificados TLS recentes ou autoassinados, JA3 incomum para o perfil da rede. Volume e direção: uploads grandes para destinos novos, conexões TLS longas com pouco tráfego bidirecional.',
  'No DNS: entropia alta de subdomínios (tunneling), taxa de NXDOMAIN por host (DGA), resoluções para infraestrutura recém-registrada (verifique a idade do domínio via WHOIS). No proxy: user-agents fora do perfil, domínios sem categoria, URLs com encoding estranho. Cruze com intel de infraestrutura (domínios reportados, ASNs suspeitos) — o C2 raramente resiste a essa triangulação.',
])

push(8, 'Threat Hunting', 'Documentação do hunt', [
  'Hunt não documentado é trabalho perdido: daqui a seis meses ninguém lembra o que foi testado, com quais queries, e o mesmo hunt se repete do zero. Registre no mínimo: hipótese original e sua origem, fontes de dados e janela temporal, queries usadas, achados (inclusive negativos), conclusão e follow-up — nova detecção, novo log a ingerir ou novo teste de validação.',
  'Padronize em template (um registro por hunt: ID, data, autor, status) e mantenha num repositório compartilhado. O caderno de hunts vira ativo estratégico: mostra à liderança o trabalho proativo do SOC, alimenta o onboarding de novos hunters e evita redescobrir o que já foi explorado. Hunts negativos bem documentados valem tanto quanto os que acham intrusão.',
])

push(8, 'Threat Hunting', 'De hunt a detecção', [
  'O teste final de um hunt é a pergunta: isso pode acontecer de novo sem que eu esteja olhando? Se sim, o insight precisa virar automação — regra de correlação no SIEM, análise agendada, watchlist no EDR. Hunt que termina apenas em relatório protege só o dia em que foi escrito.',
], undefined, {
  title: 'CHECKLIST',
  text: 'Ao fechar cada hunt: 1) Hipótese confirmada ou refutada? 2) Nova detecção criada e testada? 3) Mapeamento ATT&CK atualizado? 4) Requisitos de log novo registrados? 5) Resultado publicado para o time? Se alguma resposta for não, o hunt não terminou.',
})

// ============================================================
// CAPÍTULO 9 — Resposta a incidentes
// ============================================================

push(9, 'Resposta a incidentes', 'NIST SP 800-61', [
  'O NIST SP 800-61 (Computer Security Incident Handling Guide) é a referência canônica de resposta a incidentes e define o ciclo de vida em quatro fases: preparação; detecção e análise; contenção, erradicação e recuperação; atividade pós-incidente (lições aprendidas). O ciclo é contínuo: cada incidente realimenta a preparação, que reduz o custo do próximo.',
  'A norma também fornece vetores de incidente comuns, matriz de severidade e modelo de política. O valor para o SOC não é burocrático: as fases dão vocabulário compartilhado quando a casa está em chamas. Estamos em contenção, erradicação pendente comunica mais que vinte minutos de narrativa confusa. Outros frameworks úteis: os 6 passos do SANS e a ISO/IEC 27035.',
])

push(9, 'Resposta a incidentes', 'Preparação', [
  'Preparação é a fase que determina o resultado de tudo que vem depois — e a mais negligenciada. Inclui: playbooks escritos e testados; contatos atualizados (TI, jurídico, comunicação, fornecedores, seguradora); ferramentas prontas (EDR com licenças livres para crise, mídia de recuperação, cofre de credenciais); retenção de logs adequada; e canais de comunicação alternativos, porque o atacante pode estar lendo o e-mail corporativo.',
  'Tabletop exercises simulam cenários (ransomware em produção, vazamento de dados, comprometimento de Domain Admin) e revelam falhas baratas: telefone de plantão que ninguém atende, backup que nunca foi restaurado, executivo sem contato de emergência. Uma simulação semestral de duas horas vale mais que qualquer política que ninguém leu — e é o momento de errar sem custo.',
])

push(9, 'Resposta a incidentes', 'Detecção e análise', [
  'A fase começa com o sinal: alerta do SOC, report de usuário, notificação de terceiro (CERT, fornecedor, dark web). Primeiro trabalho: validar que é incidente real, classificar severidade (impacto no negócio, urgência, escopo) e abrir o registro formal com timeline. A partir daí, toda ação tem horário em UTC, autor e evidência anexada.',
  'A análise define o escopo: quais hosts, contas, dados e períodos estão envolvidos. Perguntas-guia: como entraram (vetor), o que fizeram (TTPs via ATT&CK), o que têm agora (acesso vigente) e o que pode ter saído (exfiltração). Erro clássico: conter o host visível sem mapear o resto do acesso — o atacante volta pela porta que ninguém procurou. Escopo antes de martelo.',
])

push(9, 'Resposta a incidentes', 'Contenção', [
  'Contenção é parar o dano sem destruir evidências: isolar hosts (via EDR ou rede), desabilitar contas comprometidas, revogar tokens e sessões, bloquear infraestrutura de C2 no proxy e no firewall. As decisões de trade-off pertencem ao incident commander: isolar o servidor de faturamento às 10h tem custo de negócio; deixá-lo vivo tem custo de segurança. Documente a decisão e quem a tomou.',
  'A ordem estratégica em ataques com persistência: contenção imediata das vias de saída (e-mail, VPN, nuvem) e dos hosts críticos, seguida de contenção completa coordenada — em ransomware, isolar tudo quase ao mesmo tempo evita que o atacante perceba e detone no restante do parque. Nunca derrube tudo antes de capturar memória e estado dos hosts-chave: evidência volátil não volta.',
])

push(9, 'Resposta a incidentes', 'Erradicação e recuperação', [
  'Erradicação remove o adversário de verdade: persistências apagadas (serviços, tarefas, chaves, contas criadas), vulnerabilidade de entrada corrigida, credenciais resetadas em cascata (comece pelas privilegiadas) e malware removido ou host reconstruído do zero. Reconstruir é mais confiável que limpar: um host que rodou ransomware ou foi alvo de dumping não merece confiança residual.',
  'A recuperação devolve produção com segurança: restauração de backups limpos (verifique a data de criação dos backups — o atacante pode ter envenenado as rotinas), monitoramento reforçado (hunting focado nas TTPs do incidente) e liberação gradual por anel. Defina critérios objetivos de encerramento: sem sinais por X dias, contas normalizadas, lições documentadas. Reinfecção no dia seguinte é a falha clássica da erradicação superficial.',
])

push(9, 'Resposta a incidentes', 'Lições aprendidas', [
  'A reunião de lições aprendidas fecha o ciclo: o que funcionou, o que falhou, o que muda. O formato blameless (sem caça a culpados) é essencial — gente que teme punição esconde informação, e informação escondida mata a qualidade da análise. A saída esperada: action items com dono, prazo e verificação de conclusão.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Faça a reunião em até duas semanas após o encerramento, enquanto a memória está fresca, e convide todos que tocaram no incidente — do Tier 1 que recebeu o primeiro alerta ao gestor que aprovou a contenção. Documente a timeline completa em UTC e distribua o relatório a quem decide orçamento.',
})

push(9, 'Resposta a incidentes', 'Playbooks de resposta', [
  'Playbook é o manual do incidente mais comum: critérios de ativação, passos de investigação, ações de contenção, critérios de escalonamento e de comunicação. Comece pelos cenários de maior probabilidade e impacto: phishing, credencial comprometida, malware no endpoint, ransomware, BEC e vazamento de dados. Um playbook testado em tabletop vale mais que dez documentos ideais não testados.',
  'O SOAR codifica playbooks em automação: enriquecimento automático de IOC, isolamento de host com aprovação, abertura de ticket, busca retrospectiva. Automatize o repetitivo e mecanicamente seguro; mantenha decisão humana nos pontos de julgamento (conter produção, comunicar terceiros). Revise os playbooks após cada incidente real — o incidente sempre ensina algo sobre o playbook.',
])

push(9, 'Resposta a incidentes', 'Cadeia de custódia', [
  'Cadeia de custódia é o registro que prova que a evidência não foi alterada: quem coletou, quando, como (ferramenta e método), hash calculado (SHA-256), quem manipulou desde então e por quê. Sem ela, evidência pode ser contestada em processo trabalhista, criminal ou pela seguradora. Formulário simples basta: cada transferência de posse gera linha assinada com timestamp.',
  'Práticas que preservam a cadeia: imagem forense antes de manipular (trabalhe na cópia), hash antes e depois de cada transferência, armazenamento com controle de acesso e write-once quando possível, ferramenta documentada e versionada (nome, versão, parâmetros). Em ambiente cloud, capture também os logs de acesso à própria evidência — quem tocou no quê, quando.',
])

push(9, 'Resposta a incidentes', 'Comunicação em crise', [
  'Incidente comunicado mal se transforma em crise reputacional maior que a técnica. Defina antes de precisar: quem fala externamente (apenas uma voz), o que é dito e quando, quem é notificado internamente e em que ordem. No Brasil, a LGPD exige comunicação à ANPD e aos titulares em incidentes relevantes com dados pessoais, conforme o regulamento da autoridade:',
], [
  'O incident commander decide o quê e quando comunicar — analista não fala externamente',
  'Jurídico avalia obrigação de notificação (ANPD, titulares, parceiros contratuais)',
  'CERT.br e órgãos setoriais conforme aplicabilidade (no setor financeiro, BACEN)',
  'Seguradora cyber acionada nos prazos da apólice — leia os requisitos antes do incidente',
  'Canal out-of-band (grupo dedicado, telefone) — assuma que o e-mail corporativo pode estar monitorado',
  'Fatos, não especulação: identificamos e contivemos; nunca afirmar o que ainda não foi verificado',
])

push(9, 'Resposta a incidentes', 'Métricas de resposta', [
  'Meça o ciclo para melhorar: MTTD (tempo até detectar), MTTA (tempo até começar a tratar), MTTC (tempo até conter) e MTTR (tempo total de resolução). Meça por severidade e por tipo de incidente — a média esconde a realidade: o P1 demorado ensina mais que cem P4 instantâneos. Colete a partir dos timestamps do sistema de tickets, não da memória de ninguém.',
  'Use as métricas para atacar gargalos específicos: MTTD alto pede detecção melhor (mais cobertura ATT&CK, menos ruído); MTTA alto pede escala de plantão e automação de abertura; MTTC alto pede autoridade de contenção mais rápida e playbooks de resposta. Publique a evolução trimestral — melhoria visível sustenta investimento; número escondido não gera orçamento.',
])

push(9, 'Resposta a incidentes', 'Estudo de caso: ransomware', [
  'Ransomware é o incidente mais temido e mais treinável. Sequência realista com base em padrões recorrentes (double extortion: cifragem somada a roubo de dados):',
], [
  'Detecção: EDR alerta exclusão de shadow copies (vssadmin delete shadows) e cifragem em massa',
  'Contenção imediata: isolar todos os hosts no EDR e bloquear SMB lateral (445) entre segmentos',
  'Preservação: memória de um host comprometido, amostra do binário, logs de autenticação',
  'Escopo: busca pelo hash em todo o parque, revisão de contatos C2 no firewall e proxy',
  'Vetor: phishing (T1566), brute force em VPN (T1110) ou exploit público (T1190)',
  'Erradicação: reset de credenciais em cascata, remoção de persistências, correção do vetor',
  'Recuperação: backups verificados, restauração por anel, hunting reforçado por 30 dias',
])

// ============================================================
// CAPÍTULO 10 — Forense digital
// ============================================================

push(10, 'Forense digital', 'O que é forense digital', [
  'Forense digital (o DFIR — Digital Forensics and Incident Response) é a disciplina de coletar, preservar e analisar evidência digital com integridade garantida. No SOC, a forense responde as perguntas que os alertas não respondem: o que exatamente o adversário executou, quando entrou pela primeira vez, o que tocou e o que levou. A regra de ouro: preservar antes de analisar, analisar a cópia, nunca o original.',
  'O princípio orientador da coleta é a ordem de volatilidade (RFC 3227): capture primeiro o que desaparece primeiro. A memória RAM se perde no shutdown; processos e conexões somem em segundos; o disco sobrevive. Um host de incidente não deve ser desligado antes da coleta live — muito menos reiniciado para ver se melhora. Cada minuto de uso do host destrói evidência.',
])

push(10, 'Forense digital', 'Ordem de volatilidade', [
  'Checklist de coleta live em host Windows suspeito, em ordem de volatilidade decrescente (cada nível coletado antes do seguinte):',
], [
  'RAM: dump com WinPMEM ou DumpIt antes de qualquer outra ação',
  'Estado de rede: conexões ativas (netstat -ano), regras de firewall, tabela ARP',
  'Processos e serviços: lista com caminhos e linhas de comando (inclusive do EDR)',
  'Sessões e logons: usuários logados, sessões RDP, credenciais em memória (com autorização legal)',
  'Logs críticos e artefatos recentes: prefetch, hives de registry, arquivos temporários',
  'Disco completo (imagem) por último — é o artefato menos volátil',
])

push(10, 'Forense digital', 'Aquisição de memória', [
  'A memória RAM é onde moram os segredos mais perecíveis: malware fileless, código injetado em processos legítimos, credenciais, chaves de criptografia e conexões ativas. Aquisição no Windows: WinPMEM (open source, driver carregado em runtime) ou DumpIt; no Linux, LiME ou leitura controlada de /proc/kcore. Guarde o dump com hash e comece a análise em cópia.',
  'O Volatility 3 é o framework padrão de análise: windows.pslist e pstree mostram processos (e processos escondidos com psscan), windows.netscan revela conexões — inclusive as já fechadas —, windows.malfind aponta regiões de memória com código injetado (PAGE_EXECUTE_READWRITE fora de imagem assinada) e windows.cmdline recupera comandos. Ferramentas comerciais somam interface; o fluxo analítico é o mesmo.',
])

push(10, 'Forense digital', 'Volatility: comandos úteis', [
  'Roteiro mínimo de análise de dump de memória Windows com Volatility 3 — cada plugin responde uma pergunta da investigação:',
], [
  'windows.pslist e windows.pstree — processos vivos e árvore de parentesco',
  'windows.psscan — varre processos terminados ou escondidos (compare com o pslist)',
  'windows.malfind — regiões executáveis suspeitas (injeção de código)',
  'windows.netscan — conexões de rede, inclusive C2 já fechado',
  'windows.cmdline — linha de comando de cada processo capturado',
  'windows.dlllist e windows.handles — o que cada processo carrega e acessa',
  'windows.filescan + windows.dumpfiles — extrair arquivos da memória para análise',
])

push(10, 'Forense digital', 'Aquisição de disco', [
  'Imagem de disco é a evidência permanente: cópia bit a bit que permite análise repetível sem tocar no original. Formatos: raw/dd (simples e grande), E01 (EnCase, com compressão e metadados de custódia) e AFF4. Aquisição física (disco inteiro) para casos legais; lógica (partição e arquivos) ou triage para resposta rápida — o KAPE (Kroll Artifact Parser and Extractor) coleta artefatos selecionados em minutos.',
  'Hardware: write blocker impede qualquer escrita no disco original (obrigatório em caso judicial); em resposta corporativa, aquisição live com ferramentas (FTK Imager Lite, X-Ways, Velociraptor) é aceitável com documentação. Monte sempre read-only e anote tudo: modelo do disco, número de série, hashes. Evidência sem registro de contexto perde metade do valor.',
])

push(10, 'Forense digital', 'Prefetch, Amcache e Shimcache', [
  'Os artefatos de execução do Windows contam o que rodou mesmo sem logs: o Prefetch (C:\\Windows\\Prefetch, arquivos .pf) guarda nome, caminho, contagem de execuções e últimos arquivos tocados por binário — podendo estar desabilitado em alguns SSDs via SysMain. É o primeiro lugar para provar que um executável rodou, quando rodou e o que tocou logo depois.',
  'O Amcache.hve (registro) registra a primeira execução com hash SHA-1 do binário — precioso para provar execução mesmo de arquivo apagado; o Shimcache (AppCompatCache, hive SYSTEM) lista a ordem temporal de execuções. Juntos, os três constroem a linha do tempo de execução independente da integridade dos Event Logs — o atacante limpa logs, mas raramente conhece esses artefatos. Ferramentas: PECmd e AppCompatParser (Eric Zimmerman tools).',
])

push(10, 'Forense digital', 'Registry forense', [
  'O registro do Windows é arquivo de memória do sistema: NTUSER.DAT (por usuário) e SAM, SYSTEM, SOFTWARE e SECURITY (em C:\\Windows\\System32\\config). Investigações clássicas: persistência em chaves Run e RunOnce (HKLM e HKCU, CurrentVersion\\Run), dispositivos USB conectados (SYSTEM\\USBSTOR com serial e timestamps), programas executados (Shimcache), documentos recentes por usuário (MRUs) e TypedPaths.',
  'Análise: carregue as hives offline (RegRipper, Registry Explorer, RECmd com plugins Kroll) e extraia com timestamps. Os timestamps do registry (last write time) são espelhos do que aconteceu: uma chave Run modificada às 02:47 na madrugada do incidente é uma conclusão, não uma hipótese. Em casos de roubo de dados, os MRUs e TypedPaths mostram por onde o usuário — ou o adversário com a sessão dele — navegou.',
])

push(10, 'Forense digital', 'Criação de timeline', [
  'A linha do tempo é a espinha dorsal de qualquer caso: eventos de todas as fontes (logs, registry, filesystem, browser, prefetch) ordenados por timestamp, com horário padronizado em UTC. A ferramenta padrão é o log2timeline/plaso (super timeline) — ingere a imagem e produz um CSV gigante; a análise fica no Timeline Explorer (Zimmerman). Timeline bem construída transforma cem mil eventos numa narrativa legível de minutos-chave.',
  'Construa em camadas: primeiro os eventos-âncora (primeira execução do malware no Amcache, logon inicial no 4624, criação do serviço no 7045), depois expanda a janela ao redor de cada âncora. Atenção a fusos: artefatos Windows guardam hora local do host, logs de SIEM estão em UTC — sem normalização, a timeline se contradiz e perde credibilidade. Padronize tudo em UTC desde a coleta.',
])

push(10, 'Forense digital', 'Artefatos web e de usuário', [
  'A atividade de usuário deixa rastro rico e duradouro — o que o adversário com acesso interativo pesquisou, abriu e moveu:',
], [
  'Histórico de navegador (Chrome e Edge: History em SQLite) — downloads, pesquisas, webmail',
  'LNK files e Jump Lists — documentos e pastas abertos, com caminho original e serial do volume',
  'Recycle Bin (arquivos $I e $R) — o que foi deletado, quando e por quem',
  'ShellBags — pastas navegadas via Explorer, mesmo após exclusão',
  'Thumbcache e recent files — imagens e documentos acessados recentemente',
  'E-mails locais (OST/PST) e calendário — essenciais em casos de BEC e exfiltração por anexo',
])

push(10, 'Forense digital', 'Relatório forense', [
  'O relatório transforma análise em valor: encontrado, método, evidência, conclusão. Estrutura mínima: resumo executivo (o que aconteceu, em linguagem de negócio), metodologia (ferramentas, versões, hashes), achados com evidência anexada (capturas com contexto, não prints soltos), timeline consolidada, limitações (o que não foi possível analisar e por quê) e recomendações.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Escreva para dois públicos ao mesmo tempo: o executivo lê o resumo e as conclusões; o técnico replica a análise pelos anexos e hashes. Reprodutibilidade é o critério de qualidade: outro analista deve chegar às mesmas conclusões com o seu material. E nunca afirme além da evidência — consistente com é honesto; é, sem prova, é passivo.',
})

// ============================================================
// CAPÍTULO 11 — Análise de malware para defensores
// ============================================================

push(11, 'Análise de malware para defensores', 'Por que o SOC analisa malware', [
  'O SOC não precisa fazer engenharia reversa completa — precisa de triagem que transforme uma amostra em defesa: hashes, IOCs de rede, comportamento observado, regra YARA, mapeamento ATT&CK. Essa análise básica, feita em minutos com método, vira regra no SIEM e caça no parque — enquanto o pedido de análise ao fornecedor demora horas ou dias.',
  'Níveis de análise, em ordem de custo: identificadora (o que é essa amostra — tipo, hash, família provável), estática básica (strings, imports, metadata sem executar), dinâmica (detonação controlada e observação) e engenharia reversa completa (desassemblagem e debug — domínio do malware analyst dedicado). O analista de SOC opera as duas primeiras com fluência e reconhece quando a amostra merece escalar para as demais.',
])

push(11, 'Análise de malware para defensores', 'Ambiente seguro: sandbox', [
  'Análise de malware exige isolamento real: VM dedicada, sem credenciais reais, rede controlada (simulada com INetSim ou FakeNet, ou monitorada para capturar o C2), snapshots prontos para restaurar em segundos e host de análise fora do domínio corporativo. Regra inegociável: malware é material perigoso — nunca em máquina de trabalho, nunca em rede de produção.',
  'Sandboxes automatizam a detonação: CAPE Sandbox (open source, com extração de configuração de C2), Any.Run (interativa, com visualização em tempo real), Joe Sandbox e Hybrid Analysis. Limitação importante: malware moderno detecta sandbox (artefatos de VM, ausência de interação) e se comporta de forma benigna. Complemente com análise estática e, quando necessário, detonação manual supervisionada.',
])

push(11, 'Análise de malware para defensores', 'Análise estática básica', [
  'Comece sem executar nada: hash (SHA-256 para identificação; MD5 apenas porque ferramentas antigas o usam), tipo de arquivo (magic bytes — um .docx que é PE renomeado é clássico), tamanho e strings (FLOSS para desfazer ofuscação simples; o strings clássico para ASCII e Unicode). As strings revelam URLs, nomes de arquivos, comandos e chaves de registro — a alma confessada do malware.',
  'Para PE (executável Windows): cabeçalhos com o pestudio (indicators, seções anômalas, imports suspeitos — VirtualAlloc, WriteProcessMemory e CreateRemoteThread formam o kit de injeção), entropia por seção (alta significa packed), timestamp de compilação e certificado digital (assinado por quem?). Para scripts e documentos: oletools (VBA em Office), pdfid e peepdf (PDF) e js-beautify (JavaScript) revelam o payload sem detonação.',
])

push(11, 'Análise de malware para defensores', 'Análise dinâmica', [
  'Detonar é observação sob controle: execute na VM monitorada e capture tudo — processos criados (Procmon do Sysinternals com filtro de atividade), arquivos escritos, chaves de registro tocadas, conexões de rede (Wireshark no host ou na saída) e requisições DNS. O relatório do sandbox entrega a mesma visão automatizada, mas a detonação manual revela detalhes que o scorecard esconde.',
  'O que procurar: persistência (o que escreve em Run, tarefa agendada, serviço), credenciais (acesso ao lsass, dados de browser), C2 (domínios e IPs — enriqueça e bloqueie), payload secundário (o que baixou e onde salvou) e anti-análise (cheque de VM, sleep longo). Documente a sequência temporal: primeiro contato, segundo estágio, ações — essa narrativa vira o relatório e as detecções.',
])

push(11, 'Análise de malware para defensores', 'YARA', [
  'YARA é o grep de malware: linguagem de padrões para identificar famílias e componentes por strings, sequências hexadecimais e condições. Estrutura: bloco meta (autor, data, referência), bloco strings (literais, hex, regex) e condition (lógica que combina). Uma regra bem escrita viaja: roda no endpoint (com busca recursiva), no compartilhamento de arquivos, na esteira de e-mail e no sandbox.',
  'Escreva regras com equilíbrio: específica demais não pega variantes; genérica demais gera falsos positivos em massa. Prática: comece do que a amostra tem de único (string de configuração, URI de C2, sequência hex do unpacker), teste contra corpus de arquivos bons (Windows, Office, ferramentas corporativas) para calibrar e documente a referência (campanha, relatório, hash original) no meta.',
])

push(11, 'Análise de malware para defensores', 'YARA na prática', [
  'Esqueleto mental de uma regra e uso operacional no SOC:',
], [
  'rule nome_familia { meta: ... strings: $mz = {4D 5A 90 00} $cfg = "c2.dominio.tld" condition: uint16(0) == 0x5A4D and 2 of them }',
  'uint16(0)==0x5A4D — confere o magic MZ (executável PE) antes de avaliar as strings',
  '$hex = { E8 ?? ?? ?? ?? 68 } — wildcards em sequência hex para código com offsets variáveis',
  'any of them / 2 of them — lógica de contagem que reduz falso positivo por string isolada',
  'Varredura em massa: yara -r regra.yar /caminho — varre compartilhamentos e backups por variantes',
  'Integração no pipeline: detonação no CAPE gera regras, que entram na varredura programada do parque',
])

push(11, 'Análise de malware para defensores', 'Packer e ofuscação', [
  'Packers (UPX e derivados comerciais) comprimem ou criptografam o payload e descompactam em runtime — as strings sumitem, a entropia sobe (acima de 7.2 por seção é suspeito) e os imports encolhem para o mínimo. Sinais: poucas importações mas VirtualAlloc e LoadLibrary presentes, seções com nomes estranhos, tamanho pequeno com entropia alta. Descompactar: UPX -d quando é UPX; senão, deixar o runtime trabalhar — detonar e capturar o payload em memória ou disco.',
  'Ofuscação de scripts: PowerShell com base64, SecureString e Gzip (decodifique com o próprio PowerShell), VBA com strings XOR (o olevba extrai), JavaScript empacotado (js-beautify e avaliação manual controlada). Princípio constante: o malware precisa desofuscar para rodar — observe o momento em que isso acontece (dinamicamente) em vez de decifrar manualmente o que o runtime resolve sozinho.',
])

push(11, 'Análise de malware para defensores', 'Malware documentado', [
  'Macro em documento Office é o clássico vivo: o olevba extrai e decodifica o VBA, revela IOCs (URLs de download, rotinas autoexecutadas como AutoOpen e Document_Open) e técnicas (RunPE, shellcode em hex). PDF: o pdfid lista objetos JavaScript e launch; o peepdf desmonta. Com o endurecimento das defesas de macro (bloqueio por padrão, MOTW), o loader migrou para HTML smuggling, contêineres ISO/IMG, LNK maliciosos e abuso de OneNote — atualize os exemplos clássicos ao cenário atual.',
  'Script malware em massa: WSH (.js e .vbs), HTA, stagers PowerShell em base64 e, mais recentemente, JavaScript em páginas de captcha falsas (padrão ClickFix). O método é constante: extraia, desofusque em camadas, identifique o segundo estágio, correlacione com o sandbox. O objetivo não é vencer o malware no manual — é extrair em quinze minutos os IOCs e a detecção que protegem o parque hoje.',
])

push(11, 'Análise de malware para defensores', 'Famílias notórias', [
  'Conhecer as famílias mais recorrentes acelera a triagem: cada uma tem fôrma de comportamento e artefatos típicos:',
], [
  'Emotet — loader modular entregue por phishing; infraestrutura própria de e-mail para propagação',
  'Cobalt Strike — framework C2 comercial abusado; beacon com perfil TLS característico (JA3) e malleable C2',
  'AgentTesla e AsyncRAT — stealers e RATs massivos em anexos e loaders; telemetria de captura de teclas',
  'LockBit e BlackCat — ransomware as a service; double extortion, exfiltração antes de cifrar',
  'Mimikatz — credential dumper canônico; acesso ao lsass e chaves em memória',
  'Qakbot e IcedID — loaders bancários que entregam ransomware; padrão de DLL side-loading',
])

push(11, 'Análise de malware para defensores', 'Do malware à detecção', [
  'Toda análise termina com entrega operacional: a amostra só vale quando virou proteção. O pacote mínimo de saída do analista de SOC:',
], undefined, {
  title: 'CHECKLIST',
  text: '1) Hashes e classificação da família; 2) IOCs de rede (domínios, IPs, URI) com validade; 3) YARA testada para varredura; 4) Regra de detecção no SIEM/EDR (padrão comportamental, não só hash); 5) Mapeamento ATT&CK das técnicas observadas; 6) Busca retrospectiva: a amostra apareceu em outros hosts nos últimos 90 dias? 7) Resultado documentado na base de conhecimento.',
})

// ============================================================
// CAPÍTULO 12 — Engenharia social e phishing
// ============================================================

push(12, 'Engenharia social e phishing', 'O fator humano', [
  'Engenharia social explora o humano porque é mais barato que hackear: um e-mail convincente vence zero-days sem escrever código. Vetores principais: phishing por e-mail, spearphishing direcionado (T1566.001 com anexo, T1566.002 com link), vishing por telefone, smishing por SMS e engenharia física (pretexting no balcão, tailgating na porta). O denominador comum: pressa, autoridade, medo ou ganho — os alavancas psicológicos não mudam há décadas.',
  'Para o SOC, engenharia social é incidente operacional diário, não conceito abstrato: cada e-mail reportado é um alerta para analisar, cada clique é possível comprometimento de credencial. O objetivo do defensor não é usuários perfeitos — é reduzir o tempo entre clique e report: botão de report em um clique, resposta garantida e cultura sem punição. Usuário que reporta rápido vale mais que usuário que nunca erra.',
])

push(12, 'Engenharia social e phishing', 'Tipos de phishing', [
  'Taxonomia operacional para classificar o incidente e escolher a resposta certa:',
], [
  'Phishing em massa: amplo e genérico; resposta com filtragem e purge automático',
  'Spear phishing: direcionado e personalizado; alto risco de sucesso — triagem humana obrigatória',
  'Whaling: o alvo é executivo; consequência maior (BEC, fraude de pagamento)',
  'Smishing e vishing: SMS e voz — fake de banco, abuso de MFA; difícil de filtrar tecnicamente',
  'Quishing: QR code — salta filtros de e-mail e abre no celular, fora da proteção corporativa',
  'Comprometimento de conta (ATO): o phishing vem de dentro — conta legítima já hackeada',
])

push(12, 'Engenharia social e phishing', 'Anatomia de um e-mail', [
  'O e-mail tem duas camadas: envelope (a conversa SMTP entre servidores — MAIL FROM) e cabeçalhos (o que o cliente mostra — From, Reply-To). A fraude mora na diferença: o display name diz Diretoria - Banco X, o From real é um gmail.com e o Reply-To desvia a resposta para o atacante. Ler headers é reconstruir o caminho: cada servidor que tocou o e-mail adiciona um Received — leia de baixo para cima, do primeiro salto ao último.',
  'Campos que valem análise: Authentication-Results (SPF, DKIM e DMARC avaliados pelo servidor receptor — a sentença técnica), cadeia de Received (IPs de origem — compare com reputação e geolocalização), Message-ID (domínio da origem), X-Mailer (ferramenta de envio — bulk mailer é suspeito em e-mail de CEO) e os cabeçalhos do gateway (o que os filtros marcaram). Aprenda a análise manual antes de confiar na automática.',
])

push(12, 'Engenharia social e phishing', 'SPF', [
  'SPF (Sender Policy Framework) é um registro TXT no DNS do domínio que lista quais servidores podem enviar em seu nome; o receptor consulta e compara com o IP remetente. Qualificadores de resultado: -all (fail — rejeite), ~all (softfail — marque) e ?all (neutro — ignore). Exemplo realista: v=spf1 include:_spf.google.com include:spf.protection.outlook.com -all.',
  'Limitações que o SOC precisa saber: o SPF valida apenas o envelope (MAIL FROM), não o header From que o usuário vê; falha com forwarding simples (o servidor de repasse não está na lista) — por isso softfail é comum; e há limite de 10 lookups DNS por verificação, que domínios grandes estouram. SPF sem DMARC é meia defesa: nunca confirma sozinho a autenticidade do From visível.',
])

push(12, 'Engenharia social e phishing', 'DKIM', [
  'DKIM (DomainKeys Identified Mail) assina o e-mail: o servidor emissor calcula hash de cabeçalhos e corpo, assina com chave privada e publica a chave pública no DNS num registro com selector (exemplo: selector1._domainkey.dominio.com.br). O receptor valida a assinatura: conteúdo íntegro desde a origem e domínio realmente envolvido no envio.',
  'Forças e limites: o DKIM sobrevive ao forwarding (a assinatura viaja com a mensagem — diferente do SPF), mas valida apenas o domínio que assinou (o d=), não o From visível — um atacante pode assinar o próprio domínio (d=evil.com) com DKIM válido. É a combinação com alinhamento (DMARC) que amarra o d= ao From. Rotação de chaves é higiene obrigatória: chave DKIM antiga é segredo público com prazo de validade.',
])

push(12, 'Engenharia social e phishing', 'DMARC', [
  'DMARC amarra SPF e DKIM ao From visível por alinhamento (o domínio autenticado precisa casar com o From) e adiciona política que o receptor deve aplicar: p=none (monitorar), p=quarantine (mandar para spam) e p=reject (bloquear). Além disso, gera relatórios agregados (rua) e de falha (ruf) que mostram quem está enviando em seu nome — incluindo quem não deveria.',
  'Implantação madura em fases: p=none com relatórios por semanas (mapeia envios legítimos desconhecidos — marketing, CRM, folha de pagamento), correção das fontes quebradas, quarantine progressivo e reject como meta final. Sem DMARC em reject, display name spoofing do seu domínio passa por qualquer caixa de entrada — é a diferença entre ter controles e exercê-los.',
])

push(12, 'Engenharia social e phishing', 'Analisando headers na prática', [
  'Roteiro de análise de header para o analista de SOC — a ordem certa economiza minutos em cada triagem:',
], [
  'Authentication-Results: SPF, DKIM e DMARC do gateway — comece pela sentença',
  'Cadeia de Received de baixo para cima: o primeiro salto revela a origem real (IP, host)',
  'From versus Reply-To divergentes: sinal clássico de fraude e de BEC',
  'Display name versus domínio do From: CEO vindo de @gmail é o golpe inteiro',
  'X-Mailer e Message-ID: bulk mailers e IDs genéricos denunciam campanha',
  'URLs do corpo: compare o texto do link com o destino real (hover, nunca clique)',
])

push(12, 'Engenharia social e phishing', 'Análise de URLs e anexos', [
  'URL de phishing: detone em sandbox ou urlscan.io antes de qualquer clique (nunca no ambiente real), compare o domínio visualmente (homoglyph e punycode: rnicrosoft.com com rn é o clássico) e expanda encurtadores antes. Sinais modernos: páginas de captcha falsas (padrão ClickFix) que instruem a rodar comandos, páginas de login que pedem interação para evadir sandbox e shorteners com redirecionamento em cadeia.',
  'Anexos: .html e .htm (credenciais phish em HTML local), contêineres .iso, .img e .lnk (bypass de MOTW — clássico de 2021 a 2023), documentos Office com macro (o óbvio) e o padrão atual: PDF com link para phish em vez de payload direto. Detone com MOTW e contexto idêntico ao do usuário-alvo: sandbox genérica de Linux erra o comportamento que importa.',
])

push(12, 'Engenharia social e phishing', 'Awareness e simulações', [
  'Programa de awareness funciona com métricas e cultura: taxa de report (o que importa mais), taxa de clique e tempo entre recebimento e report. Simulações mensais com dificuldade crescente treinam o músculo; campanha punitiva destrói o programa — ninguém mais reporta por medo. O KPI maduro: tempo médio entre recebimento e report abaixo de minutos, com taxa de report subindo.',
  'Ame o botão de report: um clique, feedback garantido (até o era simulação) e integração ao fluxo do SOC (ticket automático com headers). Treinamento pontual por comportamento: quem clicou recebe micro-treinamento de três minutos, não punição. E simule as técnicas reais do seu ambiente — se os atacantes usam QR code, simule QR code; se usam fraude de fornecedor, simule BEC.',
])

push(12, 'Engenharia social e phishing', 'Playbook de phishing', [
  'O playbook de phishing é o mais executado do SOC — e o mais padronizável. Do report à resolução, tudo tem roteiro; o valor está em executar rápido e registrar tudo.',
], undefined, {
  title: 'CHECKLIST',
  text: '1) Extraia headers, remetente, URLs e anexos; 2) Detone anexo e URL em sandbox e extraia IOCs; 3) Busque quantas caixas receberam a mensagem; 4) Purge (ZAP/exclusão administrativa) de todas as caixas; 5) Bloqueie remetente, domínio e URL no gateway e no proxy; 6) Identifique quem clicou (proxy/EDR) e resete credenciais; 7) Persista IOCs e atualize a regra de filtro; 8) Feche com número de destinatários, cliques e ações.',
})

// ============================================================
// CAPÍTULO 13 — Gestão de vulnerabilidades
// ============================================================

push(13, 'Gestão de vulnerabilidades', 'Do scan ao risco', [
  'Gestão de vulnerabilidades é ciclo contínuo: descobrir ativos, escanear (Nessus, Qualys, OpenVAS/GVM, Tenable), priorizar, remediar (patch, configuração, compensação), verificar e repetir. O SOC não é dono do ciclo todo — mas é consumidor vital: vulnerabilidades conhecidas direcionam hunting, e exploits públicos mudam as prioridades de detecção do dia para a noite.',
  'O erro clássico do programa é virar fábrica de relatórios: scan roda, PDF circula, ninguém remedia. O programa maduro mede resultado (vulnerabilidades corrigidas no prazo, exposição líquida caindo), não atividade (scans executados). Duas perguntas organizam tudo: quais sistemas são críticos para o negócio, e quais vulnerabilidades estão sendo exploradas ativamente? O resto é calibração.',
])

push(13, 'Gestão de vulnerabilidades', 'CVSS', [
  'O CVSS (Common Vulnerability Scoring System) pontua de 0 a 10 a gravidade técnica de uma CVE com métricas base: Attack Vector (Network é pior), Attack Complexity, Privileges Required, User Interaction, Scope (mudança de autoridade — um high escala tudo) e impacto em Confidencialidade, Integridade e Disponibilidade. Faixas: 9.0 a 10.0 crítico, 7.0 a 8.9 alto, 4.0 a 6.9 médio, 0.1 a 3.9 baixo.',
  'A versão 3.1 é a de produção atual; o CVSS 4.0 chega com métricas de threat e ambiente mais ricas. As métricas temporais (exploit disponível? fix disponível?) e ambientais (criticidade do ativo, controles presentes) existem, mas quase ninguém calcula — e é exatamente aí que o score técnico diverge do risco real. Use o CVSS como input, nunca como decisão final de prioridade.',
])

push(13, 'Gestão de vulnerabilidades', 'Limitações do CVSS', [
  'CVSS mede severidade técnica, não risco de negócio — e o mercado aprendeu isso a duras penas: vulnerabilidades críticas anos sem exploit convivem com médias exploradas em massa. Duas camadas de realidade corrigem: o EPSS (Exploit Prediction Scoring System) estima a probabilidade de exploração em 30 dias com dados de exploit observado; e o KEV (Known Exploited Vulnerabilities) da CISA cataloga o que está sendo explorado ativamente no mundo real.',
  'Fórmula prática de priorização: KEV ou exploit público = topo da fila, independente do CVSS; EPSS acima de 0.5 (50%) = urgente; CVSS crítico somado a ativo com exposição à internet = urgente; o resto entra no fluxo normal por criticidade do ativo. Essa ordem simples corta a maior parte do desperdício de patching por pânico de score.',
])

push(13, 'Gestão de vulnerabilidades', 'Priorização baseada em risco', [
  'Fila de priorização que funciona no mundo real — de cima para baixo, sem exceção:',
], [
  'Vulnerabilidade no KEV da CISA ou com exploit público funcional: patch em dias, contenção compensatória imediata',
  'Ativo exposto à internet com CVSS crítico (9+): dias, com mitigação de firewall/WAF enquanto o patch não sai',
  'EPSS alto (acima de 0.5): probabilidade real de exploração; anteceda o ciclo normal',
  'Crown jewels (ativos críticos de negócio) com high: priorize sobre low em servidor irrelevante',
  'Credencial e identidade afetadas (CVE de AD, IdP, MFA): exploração não precisa de rede exposta',
  'O restante: ordene por criticidade do ativo dentro da janela normal de patching',
])

push(13, 'Gestão de vulnerabilidades', 'Ciclo de patching', [
  'Patching eficaz é rotina industrial: janelas fixas mensais (o Patch Tuesday da Microsoft fixa o calendário do mundo), anéis de implantação (canary de 1%, depois 10%, depois produção), teste automatizado de compatibilidade e rollback pronto. Emergências (KEV, exploit ativo) fogem do fluxo com processo próprio e aprovação acelerada — ter esse processo desenhado antes é o que evita improviso.',
  'A realidade dolorosa: as vulnerabilidades mais exploradas são antigas. Inventários falham em terceiros (Java, browsers, PDF readers) e em appliances com ciclo próprio de firmware — VPNs da Fortinet, Ivanti e Pulse são protagonistas recorrentes de crises. Inclua no escopo: firmware de rede, appliance de segurança (o scanner da própria segurança precisa de patch), contêineres, imagens base e dependências de aplicações internas.',
])

push(13, 'Gestão de vulnerabilidades', 'Inventário de ativos', [
  'Você não protege o que não conhece — e o inventário é a fundação mais falha dos programas de gestão de vulnerabilidades. Fontes: agentes (EDR, scanner), CMDB (frequentemente obsoleto), descoberta de rede, integração cloud (tags e APIs) e fontes passivas (NetFlow revela host que ninguém catalogou). O teste de verdade: puxe a lista de hosts com CVE crítica e pergunte à TI de quem é cada um — o não sei é a vulnerabilidade real.',
  'Shadow IT e servidores zumbis (ligados, esquecidos, sem patch, sem agente) são os alvos prediletos. Trate inventário como processo vivo: reconciliação semanal entre fontes, alerta para host novo não catalogado e processo de aposentadoria formal — o servidor desligado e esquecido na rede é pior que o ativo gerenciado.',
])

push(13, 'Gestão de vulnerabilidades', 'Exposure management', [
  'Exposure management amplia a vulnerabilidade técnica para a superfície explorável inteira: misconfigurations (bucket aberto, MFA desabilitado, porta de gestão exposta), permissões excessivas, credenciais vazadas (monitorar repositórios e pastebin), shadow SaaS e caminhos de ataque combinados (CVE somada a identidade e posição na rede). O CTEM (Continuous Threat Exposure Management) do Gartner estrutura o ciclo.',
  'A mudança de pergunta: de quais CVEs temos para como um atacante real chegaria aos meus crown jewels. Ferramentas de attack surface management escaneiam a internet de fora e respondem à primeira metade; simulações de attack path (BloodHound para AD, mapeamento de permissões cloud) respondem à segunda. O output que importa: a lista curta de caminhos plausíveis — e o plano de fechamento de cada um.',
])

push(13, 'Gestão de vulnerabilidades', 'SLA de remediação', [
  'SLAs transformam prioridade em compromisso com prazo — sem eles, tudo vira o mais rápido possível, que na prática significa nunca. Modelo comum para calibrar pelo seu risco:',
], [
  'Crítico com exploit ativo (KEV): 72 horas, ou contenção compensatória no mesmo dia',
  'Crítico (CVSS 9+): 7 dias',
  'Alto (7 a 8.9): 30 dias',
  'Médio (4 a 6.9): 90 dias',
  'Baixo: próximo ciclo de manutenção',
  'Exceções: justificativa formal, dono do risco e prazo de revisão — nunca exceção sem expiração',
])

push(13, 'Gestão de vulnerabilidades', 'Métricas de VM', [
  'Meça resultado, não esforço: mean time to remediate por severidade; percentual de SLA cumprido; backlog por idade (a curva de 90+ dias é a mancha que não sai); cobertura de scan (doença silenciosa: o ativo nunca escaneado que guardava a CVE crítica); e exposição líquida (vulnerabilidades críticas e altas ativas ao longo do tempo). Tendências trimestrais valem mais que snapshots mensais.',
  'Corte por unidade de negócio com contexto: a mesma CVE em servidor de pagamentos e em servidor de impressão não pesam igual — reporte por criticidade. E conecte ao risco: quantas das suas vulnerabilidades abertas hoje estão no KEV? Esse número sozinho justifica mais orçamento de patching que qualquer apresentação teórica.',
])

push(13, 'Gestão de vulnerabilidades', 'Armadilhas de VM', [
  'Programas de gestão de vulnerabilidades falham em padrões repetidos — reconhecê-los economiza anos:',
], undefined, {
  title: 'ARMADILHA COMUM',
  text: 'Três clássicos: (1) perseguir todo score 9+ com a mesma prioridade, deixando o item do KEV explorado na fila; (2) escanear apenas o range corporativo na VPN, esquecendo cloud, appliances e OT; (3) scans não autenticados, que veem metade das vulnerabilidades reais. Autentique os scans, cubra toda a superfície e ordene por exploit real.',
})

// ============================================================
// CAPÍTULO 14 — Identidade e acesso
// ============================================================

push(14, 'Identidade e acesso', 'Identidade como perímetro', [
  'Com cloud, trabalho remoto e VPN sem perímetro, identidade virou a fronteira real: quem controla credenciais controla o acesso — e a maioria dos ataques modernos não quebra perímetro, loga dentro. Vetores dominantes: phishing de credencial (a página de login falsa que coleta usuário e senha), MFA fatigue (aprovação de push às 3h até o usuário aceitar) e reuso de senha vazada em dumps públicos.',
  'A consequência para o SOC: sinais de autenticação são os logs mais valiosos do ambiente. Cada logon é uma transação a validar — origem, dispositivo, horário, padrão da conta. A pergunta operacional muda de temos firewall para se uma credencial de admin vazou hoje, quanto tempo levaria para percebermos e o que nos faria perceber? Se a resposta é vaga, priorize este capítulo.',
])

push(14, 'Identidade e acesso', 'Active Directory: fundamentos', [
  'O AD estrutura a identidade corporativa Windows: Domain Controllers autenticam via Kerberos (porta 88) e LDAP (389, ou 636 com TLS), compartilham arquivos via SMB (445) e replicam entre DCs (RPC 135 mais portas dinâmicas). Fluxo Kerberos básico: o cliente pede TGT ao AS com o hash da senha (AS-REQ/AS-REP), apresenta o TGT ao TGS para cada serviço (TGS-REQ/TGS-REP) e o serviço valida o ticket. O NTLM sobrevive como legado — e como superfície de ataque.',
  'O mapa de privilégios importa mais que os protocolos: Domain Admins, contas de serviço com SPN, grupos aninhados e delegações (constrained e unconstrained) formam a arquitetura que o atacante explora. Ferramentas de mapeamento (BloodHound com SharpHound) revelam os caminhos: de qualquer usuário comum até Domain Admin em poucos saltos. Rode contra o seu próprio domínio antes que o adversário rode contra você.',
])

push(14, 'Identidade e acesso', 'Ataques Kerberos', [
  'Kerberoasting (T1558.003) abusa do design: qualquer usuário pode pedir ticket TGS para qualquer service principal name (SPN) — o ticket vem criptografado com o hash da senha da conta de serviço, e o atacante quebra offline (Rubeus kerberoast, GetUserSPNs do Impacket). O alvo são contas de serviço com senha fraca e privilégio alto. O AS-REP Roasting (T1558.004) varia: contas com não exigir pré-autenticação entregam material quebrável direto.',
  'Detecção e mitigação: alerte no 4769 (TGS request) com criptografia RC4 (0x17) — padrão legado que o kerberoasting adora — e em rajadas de TGS de uma mesma conta; monitore o 4768 sem pré-autenticação. Mitigação: senhas longas e aleatórias nas contas de serviço (o gMSA resolve), migração de criptografia para AES e revisão de SPNs com privilégio — todo SPN poderoso é superfície de quebra offline.',
])

push(14, 'Identidade e acesso', 'Golden e silver ticket', [
  'Golden Ticket (T1558.001): com o hash NTLM da conta krbtgt — que assina todos os TGTs do domínio —, o atacante forja qualquer ticket com qualquer privilégio e validade de anos; é o jogo encerrado do AD. Consegue-se o hash via credential dumping no DC (DSInternals, secretsdump). Silver Ticket: variante menor, forja TGS para um serviço específico com o hash da conta de serviço.',
  'Detectar é duro (tickets forjados parecem legítimos), mas não impossível: TGT com validade anômala (dez anos), tickets para contas que não existem mais, padrões de 4769 sem 4768 correspondente. A resposta a golden ticket confirmado é procedimento pesado: reset duplo de krbtgt (com intervalo, porque o histórico mantém o hash anterior), rebuild de DCs comprometidas e rotação massiva de credenciais. Prevenção: proteger DCs como o tesouro que são.',
])

push(14, 'Identidade e acesso', 'NTLM e relay', [
  'NTLM é o protocolo legado de autenticação challenge-response — e o alvo favorito do movimento lateral local. O padrão de ataque: envenenamento de LLMNR/NBT-NS (Responder, Inveigh) — a rede Windows resolve nomes por broadcast, o atacante responde fingindo ser o servidor pedido, e o cliente entrega o handshake NTLM; daí o relay para outro serviço (SMB, LDAP) que aceite a autenticação — sem quebrar senha nenhuma.',
  'Mitigação em camadas: desabilitar LLMNR e NetBIOS via GPO (o envenenamento morre sem broadcast), exigir SMB signing (quebra o relay SMB), LDAP signing e channel binding, e migração para Kerberos-only onde possível. Detecção: alertar em eventos de logon tipo 3 com padrões de relay e monitorar por ferramentas de poisoning ativas na rede. Relays NTLM seguem rentáveis em redes internas mal endurecidas.',
])

push(14, 'Identidade e acesso', 'MFA', [
  'MFA é o controle de identidade com maior retorno por real investido — e o mais mal entendido. Hierarquia real: FIDO2 e passkeys (chave física ou platform authenticator) são resistentes a phishing; push com number matching melhora, mas não elimina a fraude por fadiga; TOTP (app autenticador) resiste a phish simples mas não a proxies em tempo real (Evilginx); SMS é o degrau mais fraco (SIM swap, interceptação).',
  'Ataques modernos à MFA: fadiga de push (T1621 — spame o push até o usuário aceitar cansado), proxies de phishing em tempo real (Evilginx2 capturam a sessão pós-MFA — o cookie de sessão vale mais que a senha) e abuso de fluxos de recuperação (reset via telefone e engenharia social). Resposta do mercado: number matching, conditional access por risco de dispositivo e localização, e passkeys onde for viável.',
])

push(14, 'Identidade e acesso', 'Zero trust', [
  'Zero trust troca confiar por estar na rede por verificar explicitamente a cada acesso: identidade validada, dispositivo íntegro e registrado, contexto (localização, risco, horário) avaliado e privilégio mínimo por sessão. Não é produto — é arquitetura de decisão: cada aplicação atrás de policy engine (conditional access, ZTNA), nunca atrás de apenas uma VLAN confiável.',
  'Implementação pragmática: comece por identidade (MFA resistente a phishing para admins, conditional access), depois dispositivo (integridade via EDR/MDM como condição de acesso), depois aplicação (ZTNA substituindo a VPN flat). Para o SOC, zero trust gera telemetria valiosa: toda decisão de acesso logada com contexto — o que transforma logon suspeito em detecção de alta qualidade.',
])

push(14, 'Identidade e acesso', 'Contas privilegiadas', [
  'Privilégio é o tesouro que o atacante caça — administrá-lo é reduzi-lo a custo de exploração:',
], [
  'Tiering: separar credenciais Tier 0 (DC e AD), Tier 1 (servidores) e Tier 2 (workstations) — sem reuso cruzado',
  'Contas de admin separadas: nunca administrar com o mesmo login de e-mail e browser do dia a dia',
  'PAM/JIT: elevação just-in-time com aprovação e expiração, em vez de privilégio permanente',
  'gMSA para service accounts: senhas gerenciadas e rotacionadas automaticamente',
  'LAPS: senha local de admin única por workstation, rotacionada automaticamente',
  'Monitorar logon de Domain Admin: deveria ocorrer apenas em DCs — qualquer outra origem é alerta',
])

push(14, 'Identidade e acesso', 'Detecção de comprometimento de identidade', [
  'Sinais de conta comprometida vivem no padrão: impossible travel (logons em cidades distantes em janela impossível), host desconhecido para a conta, horário fora do baseline pessoal e tentativas em sequência. Password spray é caso especial: uma senha contra centenas de usuários — detecte por volume de falhas distribuído entre contas, não concentrado numa só. Entra ID expõe risk detections nativos; o AD on-premises exige construir com 4624 e 4625 e correlação.',
  'Password spray merece regra dedicada: mais de N falhas com a mesma origem sobre mais de M contas distintas em janela curta — o atacante conta com o alerta de brute force olhar para uma conta só. E o sinal silencioso mais importante: sucesso após série de falhas distribuídas — a conta que cedeu ao spray. Correlacione com mudança de MFA (dispositivo novo registrado): registro pós-spray é comprometimento quase certo.',
])

push(14, 'Identidade e acesso', 'Higiene de identidade', [
  'Metade dos riscos de identidade morre com higiene sistemática — barata, chata e transformadora:',
], undefined, {
  title: 'CHECKLIST',
  text: '1) Desabilite contas dormentes (mais de 90 dias sem logon); 2) gMSA para service accounts e senha aleatória para as restantes; 3) LAPS em todas as workstations; 4) MFA resistente a phishing para admins; 5) Monitore logon de Domain Admin (só DC); 6) Revise delegações e SPNs com privilégio; 7) Limpe grupos aninhados perigosos (BloodHound como auditoria trimestral); 8) Tenha plano documentado de rotação do krbtgt.',
})

// ============================================================
// CAPÍTULO 15 — GRC, métricas e compliance
// ============================================================

push(15, 'GRC, métricas e compliance', 'GRC para o Blue Team', [
  'GRC (Governance, Risk and Compliance) soa como papelada, mas é o tradutor entre o SOC e o negócio: políticas definem o que deve existir, controles executam, auditorias verificam e risco prioriza tudo. Para o blue team, GRC prático significa saber quais controles precisa evidenciar, transformar requisitos legais em detecção e resposta, e falar risco em linguagem de conselho — impacto financeiro e probabilidade, não siglas.',
  'O SOC gera evidência de compliance todos os dias sem perceber: logon monitorado, incidente documentado, SLA cumprido, backup testado. O custo de ignorar isso aparece na auditoria: meses de trabalho reconstruindo o que teria sido um clique de exportação no momento certo. Integre: cada controle auditável deve ter dono, evidência agendada e local conhecido.',
])

push(15, 'GRC, métricas e compliance', 'LGPD', [
  'A LGPD (Lei 13.709/2018) regula o tratamento de dados pessoais no Brasil com princípios que o SOC sente diretamente: minimização (colete o necessário — inclusive em investigações), finalidade (dados de incidente não viram repositório paralelo) e segurança (controles técnicos razoáveis). Incidentes com dados pessoais exigem comunicação à ANPD e aos titulares, no prazo e formato do regulamento de incidentes da autoridade.',
  'No dia a dia do SOC, a LGPD aparece em decisões concretas: a investigação interna acessa e-mails de funcionários (necessidade e base legal documentadas — jurídico participa), logs com dados pessoais têm retenção justificada e acesso controlado, e o incidente que envolve vazamento tem fluxo de notificação treinado (jurídico, DPO, ANPD, titulares). Analista que ignora a LGPD cria risco legal em cima do risco técnico.',
])

push(15, 'GRC, métricas e compliance', 'ISO 27001', [
  'A ISO/IEC 27001 certifica o Sistema de Gestão de Segurança da Informação (SGSI): avaliação de riscos, tratamentos, controles do Anexo A (93 controles na versão 2022), ciclo PDCA e auditoria por organismo acreditado. Para o SOC, a norma pede controles operacionais que você já faz — monitoramento (8.16), gestão de incidentes (5.24 a 5.28), coleta de logs — e evidência estruturada de que eles acontecem.',
  'O ganho real para o blue team: a ISO transforma requisitos difusos em controle numerado com dono. Precisamos de mais segurança vira o controle 8.16 de monitoramento tem lacuna X, com risco Y e custo Z de fechar. Auditorias deixam de ser ameaça e viram alavanca de orçamento — o auditor externo apontando lacuna em monitoramento move verba que relatório interno de SOC não move.',
])

push(15, 'GRC, métricas e compliance', 'NIST CSF 2.0', [
  'O NIST Cybersecurity Framework 2.0 organiza a postura em seis funções: Govern (novo na 2.0 — estratégia e papéis), Identify, Protect, Detect, Respond e Recover, cada uma com categorias e subcategorias mapeáveis a controles. É o framework de conversa: executa-se ISO 27001 ou NIST SP 800-53, mas se comunica maturidade e lacuna com o CSF.',
  'Uso prático para o SOC: autoavaliação honesta por função (Detect: temos cobertura de ATT&CK? Respond: playbooks testados? Recover: backups restaurados em teste?), resultado em perfil atual versus perfil alvo e roadmap de fechamento. O CSF também é língua franca com clientes e seguradoras que pedem maturidade NIST — saber se posicionar nas seis funções vale contrato.',
])

push(15, 'GRC, métricas e compliance', 'PCI DSS e outros marcos', [
  'O PCI DSS (dados de cartão) é o compliance mais operacional que existe: segmentação da rede de cartão, criptografia, controle de acesso e logging exigido (retenção de 12 meses, com 3 meses imediatamente disponíveis — requisito 10). Auditoria anual por QSA com evidência viva: o SOC que monitora o escopo PCI precisa provar cobertura, retenção e resposta dentro dos prazos.',
  'Outros marcos que tocam o SOC: SOX (integridade de controles financeiros — TI evidencia), HIPAA (saúde) e, no contexto regulatório brasileiro, os requisitos do BACEN para o setor financeiro (resoluções sobre cyber e cloud com notificação de incidentes) e da ANPD via LGPD. A lição transversal: cada regime cobra logs, retenção, resposta e notificação — construa a base uma vez e evidencie para todos.',
])

push(15, 'GRC, métricas e compliance', 'MTTD e MTTR', [
  'MTTD (mean time to detect) mede do comprometimento (ou início do evento) à detecção; MTTR varia de definição — use com clareza: tempo de resolução (fim do incidente) ou de contenção (ponto médio mais honesto para segurança). Ambos vêm dos timestamps do ticket: abertura, primeira ação, contenção, encerramento. Sem definição fixa, a métrica vira propaganda.',
  'Cuidado com armadilhas: MTTD calculado do alerta (e não do comprometimento real) flerta com zero — só a forense revela quando a intrusão começou de verdade (dwell time). Melhor prática: reporte MTTD aparente (do alerta) e MTTD real (do início forense) — a diferença entre os dois é o gap de cobertura de detecção que você precisa fechar.',
])

push(15, 'GRC, métricas e compliance', 'KPIs do SOC', [
  'Painel de indicadores que equilibra operação e valor:',
], [
  'Tempo médio de triagem por alerta (Tier 1) e por investigação (Tier 2)',
  'Taxa de falsos positivos por regra — e as regras mais barulhentas do mês',
  'Cobertura ATT&CK: técnicas com detecção testada versus plano',
  'SLA de triagem e resposta cumpridos, por severidade',
  'Volume de incidentes por severidade e causa raiz (tendência)',
  'Automação: percentual de alertas com enriquecimento automático (SOAR)',
  'Satisfação do cliente interno (TI, jurídico) — pesquisa semestral simples',
])

push(15, 'GRC, métricas e compliance', 'Dashboards e relatórios', [
  'Dashboards servem a dois públicos com formatos opostos: operacional (alertas abertos, SLA em risco, cobertura de turno — tempo real e detalhe) e executivo (tendência de incidentes, risco residual, comparativo orçamento-resultado — mensal e sintético). O erro comum é o dashboard único que não serve a nenhum: gráficos demais, conclusão de menos.',
  'Relatório executivo eficaz conta história em três camadas: o que mudou (incidentes, tendência, contexto do setor), o que fizemos (resposta, melhorias, investimento) e o que pedimos (decisão, orçamento, risco assumido caso não haja). Uma página. Números que sobem sozinhos não convencem — decisão clara com custo e consequência convence.',
])

push(15, 'GRC, métricas e compliance', 'Orçamento e justificativa', [
  'Segurança não gera receita — evita perda, e a perda tem preço publicado: relatórios anuais (IBM Cost of a Data Breach) dão benchmark de custo médio por incidente no seu setor e tamanho. A quantificação honesta usa FAIR (Factor Analysis of Information Risk): cenário (atacante até o ativo e a perda), frequência estimada e magnitude — probabilidade vezes impacto em reais, o idioma que aprova verba.',
  'Justificativa eficaz conecta lacuna, risco quantificado, controle e redução de perda esperada: sem EDR com resposta, estimamos contenção de ransomware em doze dias (cenário real do setor), com custo projetado de X; com a ferramenta e o time treinado, dois dias, ao custo de Y. Incerteza assumida e documentada vence precisão falsa — o gestor sabe que número de segurança é estimativa e quer ver o raciocínio.',
])

push(15, 'GRC, métricas e compliance', 'Auditorias e evidências', [
  'Auditoria é prova de que o SOC faz o que diz. Preparar-se é acumular evidência contínua, não correr antes da visita:',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Mantenha um dossiê vivo por controle: política vigente, evidência do último ciclo (relatório de regras, logs de resposta, resultado de tabletop), dono e data de revisão. A auditoria vira conversa de 30 minutos por controle em vez de semana de caça a arquivo — e as lacunas encontradas viram roadmap, não vergonha.',
})

// ============================================================
// CAPÍTULO 16 — Carreira e certificações
// ============================================================

push(16, 'Carreira e certificações', 'Trilhas de carreira', [
  'A carreira blue team ramifica depois da base comum: analista de SOC (Tier 1 a Tier 3), engenheiro de detecção, threat hunter, respondedor de incidentes (DFIR), analista de threat intel, especialista de produto (SIEM/EDR) e gestão. A base é transversal: fundamentos de redes, sistemas, Active Directory e triagem. A especialização vem do que você repete com prazer — e do mercado local (IR demanda mais em consultoria; hunting, mais em empresas maduras).',
  'Habilidades que atravessam todas as trilhas: escrita técnica (relatórios e tickets legíveis diferenciam profissionais), comunicação sob pressão (incidente é exercício de clareza) e aprendizado contínuo (o cenário muda em meses). Em português, o mercado cresce com a LGPD e a digitalização; o domínio do inglês técnico abre relatórios, blogs e comunidades — a maior parte do conhecimento de ponta nasce em inglês.',
])

push(16, 'Carreira e certificações', 'Certificações: visão geral', [
  'Mapa das certificações mais reconhecidas para o blue team — escolha por objetivo, não por coleção:',
], [
  'CompTIA Security+ — fundamentos obrigatórios; porta de entrada reconhecida',
  'CompTIA CySA+ — análise de segurança: SIEM, gestão de vulnerabilidades e resposta; foco defensivo prático',
  'BTL1 (Blue Team Level 1) — hands-on: phishing, forense, SIEM e EDR em laboratório de 24h',
  'SC-200 (Microsoft Security Operations Analyst) — Sentinel e Defender; forte no mercado Microsoft',
  'GIAC GCIH (incident handling), GCFA (forense avançada) e GCED (defesa enterprise)',
  'BTL2 — resposta a incidentes profunda com malware e memória; referência para sênior',
])

push(16, 'Carreira e certificações', 'Security+ e CySA+', [
  'Security+ (SY0-701) cobre o vocabulário inteiro da segurança: criptografia, redes, ameaças, arquitetura e governança. É certificação de fundação — não transforma ninguém em analista, mas organiza o conhecimento e passa em filtros de RH de entrada. Para quem já trabalha no SOC, valida o que faz; para quem quer entrar, é o primeiro degrau aceitável.',
  'CySA+ (CS0-003) avança para análise: interpretação de telemetria, gestão de vulnerabilidades, resposta e ferramentas (conceitos de SIEM e EDR). Questões de múltipla escolha com cenários — prepara bem para o raciocínio de triagem. Combinação comum: Security+, depois CySA+, depois certificação hands-on (BTL1 ou SC-200). CySA+ sozinho, sem prática em laboratório, deixa o candidato bom em teoria de alerta e ruim em console — complete com prática.',
])

push(16, 'Carreira e certificações', 'BTL1 e BTL2', [
  'BTL1 (Blue Team Labs) é a certificação prática mais acessível para quem começa: 24 horas de laboratório com quatro partes — análise de phishing, forense digital, queries de SIEM e resposta a incidentes — mais relatório escrito. O diferencial é formativo: você investiga de verdade e escreve relatório, e o padrão de correção cobra o que o SOC real cobra: metodologia e comunicação.',
  'BTL2 avança para IR profissional: análise de malware, forense de memória, forense de rede e exame de 48 horas com incidente completo. É referência para sênior e para quem quer DFIR. O custo-benefício é muito melhor que o GIAC para quem paga do próprio bolso — o GIAC (SANS) mantém o padrão-ouro de conteúdo, com preço de treinamento corporativo.',
])

push(16, 'Carreira e certificações', 'SC-200', [
  'SC-200 certifica o analista de operações de segurança no ecossistema Microsoft: Microsoft Defender for Endpoint, Defender for Office 365, Defender for Identity e Microsoft Sentinel — KQL (Kusto Query Language) é a habilidade central do exame. Com a penetração do stack Microsoft nas empresas brasileiras, é das certificações com melhor retorno direto de empregabilidade.',
  'Preparação: laboratório do Microsoft Learn (o sandbox oficial), trilhas SC-200 do Learn e prática diária de KQL — a linguagem é poderosa e aparece em tudo (Sentinel, Defender, Azure Resource Graph). Quem já tria no Sentinel encontra o exame direto; quem nunca tocou no stack deve planejar dois a três meses com laboratório próprio.',
])

push(16, 'Carreira e certificações', 'GIAC', [
  'GIAC (SANS) é o padrão-ouro corporativo: GSEC (fundamentos), GCED (defesa enterprise), GCIH (incident handler — a mais reconhecida para IR), GCFA (forense avançada: memória e timeline), GREM (engenharia reversa de malware) e GNFA (network forensics). Exames open-book proctored, com índice próprio — o famoso index de livros e anotações que cada candidato constrói; a preparação é, em grande parte, fazer o índice.',
  'O valor real: o conteúdo SANS é profundo e atualizado (SEC504 para GCIH, FOR508 para GCFA são referências do setor), e a certificação abre portas em consultoria e multinacionais. O custo (treinamento somado ao exame) é alto — vale via empresa; via bolso próprio, BTL1/BTL2 e laboratórios gratuitos entregam boa parte do sinal por uma fração do preço. Na dúvida: conteúdo vale mais que certificado; certificado vale mais que nada.',
])

push(16, 'Carreira e certificações', 'Home lab', [
  'O laboratório é o diferencial que nenhuma certificação substitui: ambiente onde você quebra e conserta sem pedir licença. Versão mínima: hypervisor (VirtualBox, Proxmox, VMware), VM Windows 10/11 com Sysmon e logs auditados, VM Linux server, Splunk free ou Elastic na VM de coleta, e um atacante com Atomic Red Team ou scripts próprios. Gere eventos, colete, detecte — o ciclo completo em miniatura.',
  'Progressão: Security Onion (Zeek, Suricata e Elastic numa distro só) para a camada de rede; Wazuh para endpoint open source; Velociraptor para DFIR; Volatility para memória com amostras públicas. Documente tudo em write-ups (blog ou GitHub) — o lab documentado é portfólio, prova de método e material de entrevista. Custo real: máquina com 32 GB de RAM resolve; notebook velho dedicado também.',
])

push(16, 'Carreira e certificações', 'Aprendizado contínuo', [
  'Rotina de estudo que funciona — misture prática, leitura e comunidade:',
], [
  'Plataformas: TryHackMe (trilha SOC Level 1), LetsDefend e CyberDefenders (Blue Team Labs e desafios DFIR)',
  'HackTheBox Sherlocks — investigações DFIR realistas com ranking',
  'Blogs técnicos: SpecterOps, Red Canary, Splunk Security Blog, 13Cubed e DFIR Madness',
  'Vídeo: 13Cubed, John Hammond e canais BR que crescem no YouTube',
  'Comunidade: Discord e Slack de blue team, grupos brasileiros e r/cybersecurity',
  'Eventos: BSides (várias cidades no Brasil), H2HC, Roadsec e grupos locais do DEF CON',
])

push(16, 'Carreira e certificações', 'Portfólio e comunidade', [
  'Portfólio blue team é diferente do de desenvolvedor: mostra método, não linhas de código. Itens que valem: write-ups de laboratórios e CTFs (hipótese, investigação, conclusão), regras de detecção versionadas (GitHub com mapeamento ATT&CK), home lab documentado com diagrama, relatórios de incidente simulado (tabletop que você escreveu) e análises de malware públicas (amostras conhecidas, com hash e referência).',
  'Comunidade acelera tudo: participe (pergunte bem — contexto, tentativa, erro), contribua (traduza, escreva, responda) e construa rede real (LinkedIn técnico, meetups, BSides). Referências e indicações dominam o mercado de segurança — quem só aplica por portal perde para quem é lembrado. E seja público de forma construtiva: em segurança, reputação é ativo de carreira permanente.',
])

push(16, 'Carreira e certificações', 'Primeiros 90 dias no SOC', [
  'Os primeiros meses definem a trajetória. Foco certo: absorver o ambiente antes de querer mudá-lo — e construir reputação de confiável, que é a moeda do SOC.',
], undefined, {
  title: 'DICA DE SOC',
  text: '90 dias: (1) aprenda o ambiente — topologia, ativos críticos, donos; (2) domine o fluxo de tickets e o SIEM do SOC antes de propor melhorias; (3) documente o que ninguém documentou; (4) pergunte por quê com curiosidade genuína, não para desafiar; (5) construa relação com a TI — eles sabem o que você não sabe; (6) mantenha caderno pessoal de aprendizados e revisite semanalmente.',
})

// ============================================================
// GLOSSÁRIO (chapter 98) — 2 termos por página
// ============================================================

const GL = 'Glossário'
const gl = (section: string, a: string, b: string) =>
  push(98, GL, section, [a, b])

gl('Glossário: A', 'APT (Advanced Persistent Threat) — grupo de atacantes com recursos, organização e objetivos de longo prazo, tipicamente Estado-nação ou crime organizado sofisticado. A marca do APT é persistência: infiltra-se, mantém acesso por meses e prioriza objetivos estratégicos (espionagem, sabotagem) sobre ganho rápido. Nomes recorrentes: APT28 e APT29 (Rússia), APT40 (China), Lazarus (Coreia do Norte).', 'Allowlist — modelo de controle que só permite execução ou acesso do que está explicitamente aprovado, bloqueando por padrão todo o restante. Em endpoints, WDAC e AppLocker implementam allowlist de binários. É o inverso da blocklist, que bloqueia apenas o conhecido ruim. Mais forte contra o desconhecido, mais custosa de manter por causa das exceções.')
gl('Glossário: A', 'MITRE ATT&CK — base de conhecimento pública e gratuita de táticas e técnicas adversárias reais, organizada em matrizes (Enterprise, Mobile, ICS). Cada técnica tem ID (T1566), descrição, mitigações, fontes de dados de detecção e exemplos de grupos. É a língua franca da defesa: usada para mapear cobertura, priorizar engenharia de detecção e comunicar achados.', 'Baseline — fotografia do comportamento normal do ambiente: tráfego esperado, processos usuais, horários típicos de logon, volumes padrão. Detecção de anomalia é impossível sem baseline, porque estranho só existe em relação a normal. Bons SOCs constroem baselines por fonte (host, conta, destino) e revisam periodicamente, já que o normal do ambiente muda com o negócio.')
gl('Glossário: A–B', 'Base rate — frequência real de um evento no ambiente. A base rate fallacy é o erro de avaliar um sinal sem considerar sua raridade: um alerta que dispara para evento comum produz ruído, mesmo com precisão aparentemente alta. Em hunting e detecção, raridade multiplicada por significado define o valor; conferir a taxa base antes de criar regra economiza meses de ruído.', 'Beaconing — padrão de comunicação periódica de malware com servidor de C2: conexões em intervalos regulares (com jitter para evasão), tamanho similar e repetição por dias. É a assinatura de tráfego mais confiável de presença ativa de malware: mesmo criptografado, o ritmo denuncia. Detectável por análise de regularidade em NetFlow, Zeek ou proxy logs.')
gl('Glossário: B–C', 'Botnet — rede de máquinas comprometidas (bots) controladas remotamente pelo operador, usadas para spam, DDoS, mineração e proxy de ataques. Os bots se conectam a servidores de comando (C2) ou usam arquitetura P2P. Hosts corporativos dentro de botnet aparecem no SOC como beacons anômalos, tráfego de saída em massa ou participação em floods.', 'Brute force — ataque de adivinhação de credenciais por tentativa sistemática: password spraying (uma senha comum em muitas contas), credential stuffing (credenciais vazadas de outros sites) e brute force clássico (muitas senhas numa conta). Detectável por rajadas de falhas de logon (4625, falhas no auth.log) e mitigado com MFA, lockout, rate limiting e senhas únicas.')
gl('Glossário: C', 'C2 (Command and Control) — canal pelo qual o atacante comanda o malware comprometido e recebe dados: beacons HTTPS, DNS tunneling, domínios rotativos, tráfego via serviços legítimos (Telegram, pastebin). Quebrar o C2 não remove a presença, mas cega o adversário — contenção prioritária em qualquer incidente. No MITRE ATT&CK, é a tática TA0011.', 'Cadeia de custódia (chain of custody) — registro formal de quem coletou, manipulou e transferiu cada evidência, com timestamps e hashes que provam integridade. Sem ela, evidência digital pode ser contestada em processo ou pela seguradora. Prática mínima: hash SHA-256 na coleta, formulário de posse, armazenamento controlado e cópias analisadas em vez do original.')
gl('Glossário: C', 'CEF e LEEF — formatos de normalização de logs, respectivamente da ArcSight e da IBM QRadar. Estrutura de header mais pares chave=valor (src= dst= suser=), permitindo que equipamentos de fabricantes diferentes alimentem o SIEM com campos previsíveis. Predecessores dos schemas modernos ECS (Elastic) e OCSF.', 'Tríade CIA — modelo clássico dos objetivos de segurança: Confidencialidade (só quem deve acessa), Integridade (dados não alterados indevidamente) e Disponibilidade (serviços quando necessários). Guia a classificação de incidentes e a escolha de controles: ransomware ataca integridade e disponibilidade; vazamento, confidencialidade. Complementos modernos: autenticidade e não-repúdio.')
gl('Glossário: C', 'CSIRT (Computer Security Incident Response Team) — time formalmente designado para coordenar resposta a incidentes: declara o incidente, lidera contenção, comunica stakeholders e conduz as lições aprendidas. Diferencia-se do SOC (que monitora e tria continuamente) pela responsabilidade de coordenação formal. No Brasil, o CERT.br (NIC.br) é o CSIRT nacional.', 'CVE (Common Vulnerabilities and Exposures) — identificador único de vulnerabilidade publicada, no formato CVE-ANO-NÚMERO (CVE-2021-44228, o Log4Shell). Gerenciado pela MITRE, com CNAs atribuindo os IDs. É o endereço comum que liga scanner, patch, exploit e intel: citar o CVE comunica mais que qualquer descrição vaga.')
gl('Glossário: C–D', 'CVSS (Common Vulnerability Scoring System) — pontuação padronizada de 0 a 10 para severidade técnica de vulnerabilidade, calculada de métricas como vetor de ataque, complexidade, privilégios e impacto (versão de produção atual: 3.1). Faixas: crítico de 9 a 10, alto de 7 a 8.9. Severidade não é risco: um CVSS 10 sem exploit em sistema interno pesa menos que um 7 com exploração ativa.', 'DLP (Data Loss Prevention) — controles que identificam e bloqueiam movimento de dados sensíveis para fora dos limites aprovados: e-mail com CPF ou cartão, upload para cloud pessoal, USB em massa. Para o SOC, alertas de DLP são incidentes de exfiltração potencial — incluindo o insider threat, que raramente aparece em detecções de malware.')
gl('Glossário: D–E', 'Dwell time — tempo entre o comprometimento inicial e a detecção (ou erradicação). A medida mais honesta da maturidade de detecção: benchmarks do setor historicamente ficam entre semanas e meses. Reduzir dwell time é o objetivo central do blue team — cada dia a mais é persistência aprofundada, dados acessados e custo de resposta crescente.', 'EDR e XDR — EDR (Endpoint Detection and Response) é a plataforma que coleta telemetria profunda de endpoints (processos, arquivos, rede, registro), detecta comportamento com analítica e permite resposta remota (isolamento, kill, coleta). XDR estende a correlação para identidade, e-mail, nuvem e rede. Exemplos: CrowdStrike Falcon, Microsoft Defender for Endpoint, SentinelOne.')
gl('Glossário: E', 'EPSS (Exploit Prediction Scoring System) — pontuação de 0 a 1 que estima a probabilidade de uma CVE ser explorada nos próximos 30 dias, calculada com dados de exploit observado, telemetria e contexto. Complementa o CVSS na priorização: um CVSS 7 com EPSS 0.9 entra na fila à frente de um CVSS 9 com EPSS 0.01. Publicado pela FIRST, atualizado diariamente.', 'Exfiltração — transferência não autorizada de dados para fora do perímetro: uploads para cloud pessoal, DNS tunneling, anexos de e-mail, cópia para dispositivo removível. Última etapa dos ataques de roubo e pré-requisito do double extortion em ransomware. Detecta-se por volume anômalo de saída, destinos novos e padrões de protocolo (MITRE TA0010).')
gl('Glossário: F–H', 'Falso positivo — alerta disparado por atividade benigna. É o imposto da detecção: regras sensíveis produzem ruído, e ruído acumulado produz analista que fecha sem ler (alert fatigue). Gerir falsos positivos é trabalho contínuo de tuning: medir taxa por regra, ajustar condições, suprimir com justificativa documentada — e celebrar a regra precisa, não a que mais alerta.', 'Hardening — redução sistemática da superfície de ataque de sistemas: desabilitar serviços desnecessários, remover ferramentas, aplicar configurações seguras (os CIS Benchmarks são o padrão de facto) e minimizar privilégios. Para o blue team, hardening é prevenção que multiplica detecção: host endurecido gera menos ruído, e o que escapa é mais visível por anomalia.')
gl('Glossário: I', 'IOC (Indicator of Compromise) — evidência técnica de comprometimento já ocorrido: hash de binário, IP ou domínio de C2, URI suspeita, nome de arquivo. Alimenta bloqueio e busca retrospectiva, mas tem meia-vida curta (infraestrutura rotativa). Boa prática: usar com prazo de validade e converter cada IOC relevante em detecção comportamental durável.', 'IOA (Indicator of Attack) — sinal de comportamento ofensivo em curso, independente de artefato específico: processo acessando o lsass, script escrevendo em chave Run, winword.exe invocando PowerShell. Ao contrário do IOC, sobrevive à troca de ferramentas e de infraestrutura do atacante — por isso sustenta detecções duradouras no EDR e no SIEM.')
gl('Glossário: K', 'Kerberos — protocolo de autenticação do Active Directory: o cliente obtém TGT do AS (porta 88), troca por tickets de serviço (TGS) e o serviço valida sem transmitir senha. Robusto quando bem configurado, mas seus designs (SPNs, tickets assinados pelo krbtgt) dão origem a ataques específicos: kerberoasting, AS-REP roasting e golden ticket.', 'Cyber kill chain — modelo da Lockheed Martin que descreve o ataque em sete estágios: reconhecimento, weaponização, entrega, exploração, instalação, C2 e ações sobre objetivos. Valor defensivo: quebrar a cadeia cedo reduz o custo do incidente, e mapear controles por estágio revela lacunas. Crítica conhecida: ataques reais não são estritamente lineares.')
gl('Glossário: L', 'LOLBin (living-off-the-land binary) — binário legítimo e assinado do sistema abusado para execução maliciosa: certutil baixando payload, mshta rodando script, rundll32 carregando DLL, bitsadmin transferindo. Não há arquivo ruim para assinatura flagrar — a detecção precisa mirar comportamento: linha de comando anômala, pai inesperado, destino raro.', 'Movimentação lateral — expansão do atacante do ponto de entrada para outros hosts e privilégios: pass-the-hash, RDP, SMB, WMI, WinRM, abuso de credenciais de service account. É onde a intrusão vira desastre. Reduz-se com segmentação, tiering de credenciais e monitoramento de protocolos de administração entre zonas que não deveriam conversar.')
gl('Glossário: M', 'MFA (multi-factor authentication) — exigência de segundo fator além da senha: TOTP, push com number matching, FIDO2 e passkeys (resistentes a phishing). Elimina a maioria dos ataques de credencial, mas não todos: fadiga de push, proxies em tempo real (Evilginx) e abuso do fluxo de recuperação contornam fatores fracos. Hierarquia: FIDO2, depois TOTP, depois push, depois SMS.', 'MISP (Malware Information Sharing Platform) — plataforma open source de compartilhamento de threat intelligence: distribui IOCs, eventos e atribuições entre organizações, com feeds comunitários (CIRCL e comunidades setoriais). Integra com SIEM e EDR via API; é a infraestrutura padrão para curadoria de intel sem depender apenas de fornecedores.')
gl('Glossário: M–N', 'MTTD e MTTR — MTTD (mean time to detect) é o tempo médio entre comprometimento e detecção; MTTR (mean time to respond ou resolve) é o tempo entre detecção e resolução — defina se conta contenção ou encerramento. O par é o batimento cardíaco do SOC: medido por severidade, extraído dos tickets, reportado em tendência. MTTD alto pede cobertura de detecção; MTTR alto pede autoridade e automação de resposta.', 'NDR (Network Detection and Response) — categoria de ferramentas que monitora tráfego de rede (frequentemente com Zeek por baixo), detecta anomalias e C2, e permite resposta, como isolamento de sessão. Complementa o EDR com visibilidade independente do endpoint: agente desinstalado ou log apagado não afeta o que a rede viu.')
gl('Glossário: O–P', 'OSINT (open source intelligence) — inteligência coletada de fontes públicas: registros de domínio (WHOIS), certificados (crt.sh), repositórios, redes sociais e leak sites de ransomware. Do lado do atacante, alimenta o reconhecimento; do lado do SOC, enriquece triagem (reputação de IP, idade de domínio) e monitora vazamento de credenciais da organização.', 'PCAP — captura completa de pacotes de rede (formato padrão libpcap), a evidência definitiva de tráfego: byte a byte, reanalisável quando quiser. Caro de armazenar e sensível do ponto de vista de privacidade; estratégias comuns incluem ring buffer curto, captura acionada por alerta ou PCAP apenas em pontos críticos. Ferramentas: tcpdump para coleta, Wireshark para análise.')
gl('Glossário: P', 'Playbook — procedimento documentado para lidar com um tipo de alerta ou incidente: critérios de ativação, passos de investigação, ações de contenção, critérios de escalonamento e comunicação. É o que transforma conhecimento individual em capacidade organizacional: qualquer analista do turno executa com consistência. No SOAR, o playbook vira automação codificada.', 'Purple team — não é um time, é uma prática: red e blue trabalhando juntos, com o atacante simulando técnicas e o defensor validando e ajustando detecções em tempo real. Output esperado: tabela de técnica versus detectado, lacunas priorizadas e regras melhoradas. Automatizável com Atomic Red Team; formalizável em ciclos trimestrais.')
gl('Glossário: R–S', 'Ransomware — malware que cifra dados e extorta resgate; a vertente moderna usa double extortion: exfiltra antes de cifrar e ameaça publicar. Cadeia típica: acesso inicial (phishing, VPN sem MFA, exploit), reconhecimento, roubo de credencial, movimentação lateral, exfiltração, desativação de segurança e cifragem em massa. Defesa: MFA, patching de edge, segmentação, backups imutáveis e detecção precoce.', 'SIEM (Security Information and Event Management) — plataforma que centraliza logs, normaliza, correlaciona, alerta e serve de base de investigação: Splunk, Elastic Security, Microsoft Sentinel, QRadar. O coração analítico do SOC: sua qualidade depende menos do produto e mais das fontes ingeridas, das regras mantidas e da saúde do pipeline.')
gl('Glossário: S', 'SOAR (Security Orchestration, Automation and Response) — camada que codifica playbooks em automação: enriquecimento automático de alerta, isolamento de host com aprovação, purge de e-mail phishing, abertura de ticket. Reduz tempo de triagem e padroniza resposta; o limite é o julgamento — automatize o mecânico e mantenha decisão humana onde o custo do erro é alto.', 'Sysmon — ferramenta gratuita da Sysinternals (Windows) que amplia a telemetria do Event Log: criação de processo com hash e linha de comando, conexão de rede por processo, carregamento de DLL, acesso a processo, escrita em registro e consulta DNS. Configuração via XML (o config comunitário da SwiftOnSecurity é bom ponto de partida). O multiplicador de visibilidade mais barato do ambiente Windows.')
gl('Glossário: T', 'TTP (Tactics, Techniques and Procedures) — o modo de operação do adversário: táticas são objetivos (o porquê), técnicas são meios (o como, T1566) e procedimentos são a execução específica (o grupo X usa assunto fiscal em anexo .iso). TTPs estão no topo da Pirâmide da Dor: são o que sobra quando IOC e infraestrutura já trocaram — e o que sustenta atribuição e detecção durável.', 'Threat hunting — busca proativa e com hipótese por atividade maliciosa que escapou da detecção automatizada. Ciclo: hipótese (intel, anomalia, lacuna ATT&CK), investigação com queries, conclusão documentada e automação (nova detecção ou novo requisito de log). Não substitui a detecção: alimenta-a — hunting que nunca vira regra é custo sem retorno acumulado.')
gl('Glossário: T–Y', 'Threat intelligence — informação sobre adversários transformada em decisão: estratégica (tendência para executivos), operacional (TTPs e campanhas de grupos) e tática (IOCs para máquinas). Ciclo de vida: requisitos, coleta, processamento, análise, disseminação e feedback. Valor real se mede em detecções criadas e decisões mudadas, não em feeds assinados.', 'YARA — linguagem de padrões para identificar malware por strings, sequências hexadecimais e condições (o grep de malware). Regras têm meta, strings e condition; rodam em arquivo, diretório, memória e pipeline. Padrão de facto para compartilhar detecções de famílias: todo relatório de threat intel sério vem com regras YARA anexas.')
gl('Glossário: Z', 'Zero day — vulnerabilidade explorada antes de existir patch (o fornecedor teve zero dias para corrigir). Caras e raras: a maioria dos ataques usa credenciais roubadas e vulnerabilidades conhecidas sem patch. Para o SOC, zero day é argumento para detecção comportamental (funciona sem assinatura) e defesa em profundidade — não para pânico generalizado.', 'Zero trust — arquitetura que abandona a confiança implícita de rede: cada acesso é verificado explicitamente (identidade, dispositivo, contexto) e limitado ao mínimo necessário, assumindo que o adversário está dentro. Não é produto: é política de decisão (conditional access, ZTNA, microssegmentação). Slogan memorável: never trust, always verify.')

// ============================================================
// APÊNDICE (chapter 99) — Playbooks de resposta rápida
// ============================================================

const AP = 'Apêndice: Playbooks de resposta'
const pb = (num: number, title: string, para: string, steps: string[]) =>
  push(99, AP, `Playbook ${String(num).padStart(2, '0')} — ${title}`, [para], steps)

pb(1, 'Brute force em VPN', 'Disparo: rajada de falhas de autenticação na VPN vinda de uma ou poucas origens. Objetivo: impedir o acesso, identificar se alguma conta cedeu e fechar a porta de entrada. Prioridade alta se envolve conta privilegiada ou sucesso subsequente.', [
  '1. Extraia origens, contas alvo e janela temporal dos logs de autenticação',
  '2. Confirme se algum logon teve sucesso após a rajada — se sim, trate como conta comprometida',
  '3. Bloqueie o IP de origem no firewall/VPN',
  '4. Resete a senha das contas alvo e force reenrollment de MFA',
  '5. Revise regras de lockout e rate limiting da VPN',
  '6. Hunt: mesmo padrão de origem em outros serviços (OWA, RD Web)',
  '7. Documente volume, contas e resultado; ajuste a regra de detecção',
])

pb(2, 'Phishing reportado', 'Usuário reporta e-mail suspeito pelo botão de report. O incidente só termina quando você sabe quantos receberam, quem interagiu e a ameaça está purgada. Velocidade importa: a janela entre entrega e clique é de minutos em campanhas reais.', [
  '1. Colete headers completos, anexos e URLs da amostra',
  '2. Detone anexo e URL em sandbox e extraia IOCs',
  '3. Busque no gateway quantas caixas receberam a mensagem',
  '4. Purge (ZAP) de todas as caixas atingidas',
  '5. Bloqueie remetente, domínio e URLs no gateway e no proxy',
  '6. Identifique interações (cliques e execuções) via proxy e EDR',
  '7. Resete credenciais de quem clicou; monitore as contas por 30 dias',
])

pb(3, 'Clique confirmado em phishing', 'Log de proxy ou EDR confirma que o usuário acessou a página de phishing — ou submeteu credenciais. Agora o comprometimento é presumido até prova em contrário: a conta e o dispositivo entram em tratamento imediato.', [
  '1. Resete a senha do usuário e revogue sessões e tokens ativos',
  '2. Verifique regras de inbox (forwarding, delegação) criadas pelo atacante',
  '3. Isole o endpoint no EDR e rode varredura completa',
  '4. Confirme se o MFA foi registrado ou burlado — revise registros de dispositivo novo',
  '5. Correlacione a atividade da conta após o clique (logons, acessos a dados)',
  '6. Notifique gestor e jurídico se dados sensíveis estiverem no escopo',
  '7. Registre os IOCs da campanha e atualize a simulação de awareness',
])

pb(4, 'Malware detectado no endpoint', 'EDR ou antivírus detecta binário malicioso em execução. Antes de limpar, entenda: como chegou, o que fez, se há mais hosts. Remover sem investigar deixa a intrusão viva em outro lugar.', [
  '1. Isole o host no EDR (mantendo o canal do agente)',
  '2. Capture contexto: process tree, hash, linha de comando, persistência',
  '3. Determine o vetor: anexo, download, instalação, USB',
  '4. Busque o hash e os IOCs em todo o parque (busca global do EDR)',
  '5. Encerre o processo, coloque o arquivo em quarantena e remova persistências',
  '6. Se houve acesso a credenciais, resete em cascata',
  '7. Feche com causa raiz; alimente YARA e regra se a amostra for nova',
])

pb(5, 'Ransomware em progresso', 'Alerta de cifragem em massa ou exclusão de shadow copies. É P1 absoluto: cada minuto espalha a cifragem e consolida o acesso do adversário. Prioridades: conter rápido, preservar evidência, ativar crise.', [
  '1. Isole imediatamente todos os hosts suspeitos no EDR',
  '2. Corte SMB e RDP entre segmentos no firewall interno',
  '3. Capture a memória de um host comprometido antes de qualquer reinício',
  '4. Desconecte backups (snapshot ou air gap) e verifique a integridade',
  '5. Ative IR formal: incident commander, jurídico e comunicação',
  '6. Identifique paciente zero e vetor; bloqueie C2 no firewall e no proxy',
  '7. Não negocie antes de envolver jurídico e seguradora; preserve amostras com hash',
])

pb(6, 'Beacon de Cobalt Strike', 'Assinatura de rede ou IOC de intel indica tráfego de beacon (Cobalt Strike ou derivado). Presença ativa de operador: contenção silenciosa e mapeamento antes de derrubar tudo — o adversário pode ter gatilho de destruição.', [
  '1. Confirme no conn.log/Zeek: regularidade, JA3 e destino',
  '2. Mapeie todos os hosts com contato à mesma infraestrutura',
  '3. Prepare contenção coordenada (evite isolar um por um)',
  '4. Capture a memória de um host antes da contenção (config do beacon)',
  '5. Isole todos de uma vez; bloqueie a infraestrutura no firewall, proxy e DNS',
  '6. Rode hunting de TTPs: tarefas agendadas, serviços novos, credential dumping',
  '7. Trate como incidente formal: credenciais resetadas em cascata',
])

pb(7, 'Logon de admin fora de horário', 'Conta privilegiada logou fora do baseline (horário, país, dispositivo). Pode ser o próprio admin viajando — ou credencial roubada. Confirmar antes de conter: a cena é sensível e o falso positivo tem custo político.', [
  '1. Enriqueça: geolocalização, dispositivo, MFA usado, histórico da conta',
  '2. Fale com o dono da conta por canal alternativo (telefone, chat)',
  '3. Se confirmado legítimo: documente e ajuste o baseline',
  '4. Se não confirmado: revogue sessões e resete a senha imediatamente',
  '5. Verifique as ações executadas na sessão (4688, auditoria administrativa)',
  '6. Busque criação de contas e delegações novas na janela',
  '7. Monitore a conta reforçadamente por 30 dias',
])

pb(8, 'Kerberoasting detectado', 'Alerta de rajada de TGS requests (4769) com criptografia RC4 de uma mesma conta. Alguém está pedindo tickets de serviço para quebrar offline. A conta de origem é o ponto de partida — provavelmente já comprometida.', [
  '1. Identifique a conta de origem e contenha o host onde roda',
  '2. Liste os SPNs alvo da rajada (4769)',
  '3. Avalie o privilégio das contas de serviço alvo',
  '4. Resete as senhas das service accounts em risco (longas e aleatórias)',
  '5. Migre para gMSA onde possível; elimine o RC4',
  '6. Hunt: 4768 sem pré-auth (AS-REP roasting) e outros 4769 anômalos',
  '7. Investigue o host de origem: como o atacante chegou lá',
])

pb(9, 'Suspeita de golden ticket', 'Sinais: TGT com validade anômala, tickets para contas inexistentes ou hash do krbtgt obtido via dumping no DC. O tratamento é pesado e coordenado — meia-medida deixa o atacante com acesso eterno.', [
  '1. Confirme a evidência: validade do TGT, origem do dumping no DC',
  '2. Isole os DCs comprometidos; avalie rebuild',
  '3. Rode o reset duplo do krbtgt, com intervalo, conforme documentação da Microsoft',
  '4. Reset em cascata: Domain Admins e service accounts críticas',
  '5. Rebuild dos DCs comprometidos a partir de mídia limpa',
  '6. Hunting pós-operação: tickets anômalos, contas criadas, delegações',
  '7. Revise arquitetura: tiering, EDR nos DCs e monitoramento dedicado',
])

pb(10, 'Password spray no IdP', 'Rajada de falhas distribuídas: uma senha comum testada contra centenas de contas (4625 em massa, ou falhas de sign-in no Entra ID). O atacante conta com o alerta olhar por conta, não por origem.', [
  '1. Agregue por origem: confirme o spray (muitas contas, mesma fonte)',
  '2. Identifique contas com sucesso pós-spray — prioridade máxima',
  '3. Bloqueie a origem e aplique conditional access (país, risco)',
  '4. Force reset das contas que cederam; revogue sessões',
  '5. Revise o MFA: cobertura e registro de dispositivo novo',
  '6. Hunt: padrão repetido em outros IdPs (OWA, VPN)',
  '7. Ajuste a regra: agregação por origem com threshold de contas distintas',
])

pb(11, 'Credential stuffing', 'Credenciais vazadas em leak público sendo testadas nos serviços da empresa. Diferente do spray: usa a senha real do usuário (reuso). Detecte por sucesso anômalo de logon vindo de origens rotativas.', [
  '1. Obtenha o dump (fonte de intel) e cruze com as contas internas',
  '2. Force reset imediato das contas expostas',
  '3. Revogue sessões e tokens ativos das contas',
  '4. Verifique a atividade pós-comprometimento (e-mail, nuvem, pagamentos)',
  '5. Bloqueie as origens conhecidas do stuffing no gateway de identidade',
  '6. Comunique o risco de reuso de senha no programa de awareness',
  '7. Avalie verificação de senha vazada (API do HIBP) no fluxo de cadastro',
])

pb(12, 'Exfiltração via DNS', 'Análise de DNS revela consultas TXT em volume e subdomínios longos e aleatórios — tunneling com dnscat2 ou iodine. Canal lento, mas furtivo, frequentemente esquecido pelos controles de saída.', [
  '1. Identifique o host consultor (origem das queries) e o domínio usado',
  '2. Capture amostra do tráfego (PCAP) para confirmar o encoding',
  '3. Bloqueie a resolução do domínio no DNS interno e no resolver de saída',
  '4. Isole o host no EDR e investigue o processo responsável',
  '5. Avalie os dados enviados: volume e sensibilidade (DLP e forense)',
  '6. Hunt: entropia de subdomínios e taxa de NXDOMAIN em toda a rede',
  '7. Endureça: limite tamanho de resposta e monitore TXT e NULL massivos',
])

pb(13, 'Upload para cloud pessoal', 'DLP ou proxy alerta upload de volume alto para serviço de armazenamento pessoal (Drive, MEGA, WeTransfer). Pode ser exfiltração por insider ou por malware — o tratamento discrimina.', [
  '1. Identifique usuário, host, volume e destino exato',
  '2. Converse com o usuário e o gestor: justificativa de negócio?',
  '3. Se legítimo: registre a exceção e ofereça alternativa corporativa',
  '4. Se suspeito: isole o host e preserve evidência (logs de proxy e EDR)',
  '5. Avalie a sensibilidade do conteúdo (classificação DLP, arquivos tocados)',
  '6. Bloqueie categorias de cloud pessoal por política para o perfil',
  '7. Documente: insider threat merece trilha formal com RH e jurídico',
])

pb(14, 'PowerShell ofuscado (4104)', 'Script block logging captura PowerShell com base64, concatenação ou download cradle. Padrão clássico de loader. O conteúdo decodificado conta a história inteira.', [
  '1. Extraia o script block completo (4104) e decodifique',
  '2. Identifique o pai (process tree): Office? wscript? serviço?',
  '3. Extraia a URL do cradle e isole o payload',
  '4. Busque a mesma linha de comando em todo o parque',
  '5. Confira persistência: tarefa agendada, chave Run, subscription WMI',
  '6. Resete credenciais se houver acesso a rede ou C2',
  '7. Refine a detecção para cobrir a família de ofuscação, não só o exemplo',
])

pb(15, 'Novo serviço suspeito (7045)', 'Serviço instalado com binário em caminho temporário, share UNC ou PowerShell. Persistência e lateral clássicas (psexec cria serviço). Quem criou e de onde importa tanto quanto o quê.', [
  '1. Extraia ServiceName, ImagePath e conta criadora (7045)',
  '2. Correlacione 4624 e 4688 da mesma janela: quem, com qual sessão',
  '3. Verifique o binário: hash, assinatura, detonação se necessário',
  '4. Busque o padrão de ImagePath em outros hosts (spread)',
  '5. Remova o serviço e o binário após a coleta de evidência',
  '6. Resete as credenciais da conta criadora se houver comprometimento',
  '7. Mantenha alerta permanente: 7045 em produção fora de janela de mudança',
])

pb(16, 'Exclusão de shadow copies', 'Processo executando vssadmin delete shadows ou wmic shadowcopy delete. Quase sempre prelúdio de ransomware (T1490, Inhibit System Recovery). Ação imediata, sem esperar confirmação adicional.', [
  '1. Isole o host imediatamente no EDR',
  '2. Identifique o processo e o pai: quem executou o comando',
  '3. Busque o padrão em todo o parque (spread em curso?)',
  '4. Verifique backups: integridade e isolamento do repositório',
  '5. Rode hunting de ransomware: cifragem, C2, contas novas',
  '6. Ative o playbook de ransomware em caso de confirmação',
  '7. Falso positivo raro: documente a ferramenta legítima de TI e exclua com justificativa',
])

pb(17, 'LOLBin download (certutil)', 'certutil -urlcache ou bitsadmin transferindo de domínio externo. Executável legítimo usado como downloader — o arquivo baixado e o destino contam a história.', [
  '1. Extraia a linha de comando completa: URL e arquivo de destino',
  '2. Colete o arquivo baixado (se existir) e calcule o hash',
  '3. Detone a amostra e extraia IOCs',
  '4. Identifique o pai do processo: como o certutil foi invocado',
  '5. Bloqueie o domínio no proxy e busque o hash no parque',
  '6. Verifique a execução do payload baixado (4688, Sysmon 1)',
  '7. Reforce a política: blocklist de URLs ou controle de LOLBin via WDAC',
])

pb(18, 'Movimentação lateral via SMB', 'Conexões SMB (445) anômalas entre estações, ou de estação para servidor fora do padrão. Pass-the-hash, psexec e coleta remota via admin shares (C$ e ADMIN$) moram aqui.', [
  '1. Mapeie origem e destinos: contas usadas, volume, horário',
  '2. Confira se a conta tem justificativa para acessar os alvos',
  '3. Busque 5140 e 5145 (acesso a share) com nomes de admin shares',
  '4. Verifique execução remota: 4688 no destino, 7045, serviço novo',
  '5. Se comprometido: isole a origem e resete a credencial usada',
  '6. Hunt: pass-the-hash (4624 tipo 3 com NTLM de conta que não loga assim)',
  '7. Endureça: SMB signing, restrição de admin shares e tiering',
])

pb(19, 'RDP externo suspeito', 'Porta 3389 exposta ou acessada de origens atípicas. RDP exposto é uma das portas de entrada mais exploradas do mundo (brute force constante, com BlueKeep como precedente de exploit).', [
  '1. Confirme a exposição: quem acessa 3389 de fora (logs de firewall e VPN)',
  '2. Feche o acesso externo direto — RDP atrás de VPN ou gateway, sempre',
  '3. Revise 4624 tipo 10 e 4625 na janela: brute force? sucesso?',
  '4. Resete as credenciais das contas com logon RDP externo',
  '5. Ative NLA, lockout e restrição de grupos (Remote Desktop Users)',
  '6. Hunt: 4778 e 4779 (sessões RDP) e origens anômalas',
  '7. Avalie substituição por gateway com MFA (RD Gateway ou Azure Bastion)',
])

pb(20, 'SQL injection no WAF', 'WAF bloqueia padrões de SQLi contra aplicação web. Bloqueio não é imunidade: variações de payload escapam. O SOC valida a tentativa, escala com o time da aplicação e verifica sucesso.', [
  '1. Extraia payloads, IPs de origem e endpoints alvo',
  '2. Confirme com o WAF: bloqueado ou passado (log de ação)',
  '3. Revise logs da aplicação e do banco: queries anômalas, erros, dump?',
  '4. Verifique volume de dados lidos na janela (audit do DB, se existir)',
  '5. Escale ao time da aplicação: parametrização e validação de input',
  '6. Bloqueie origens em campanha e monitore repetição',
  '7. Registre como vulnerabilidade da aplicação no fluxo de VM — não feche só no WAF',
])

pb(21, 'Site defaced', 'Página alterada publicamente (defacement) — dano reputacional imediato e evidência de controle de publicação quebrado. Objetivo: restaurar rápido e descobrir como.', [
  '1. Tire snapshot e evidência da página alterada (prints, HTML, hashes)',
  '2. Restaure a partir de cópia limpa verificada',
  '3. Isole o servidor de publicação e preserve os logs',
  '4. Identifique o vetor: CMS desatualizado, credencial vazada, upload',
  '5. Resete as credenciais de publicação e dos administradores do CMS',
  '6. Verifique webshell e persistência no servidor',
  '7. Comunique comunicação e marketing; registre incidente formal',
])

pb(22, 'Credenciais vazadas em dump', 'Intel reporta dump com credenciais do domínio corporativo (funcionários reusando senha). O vazamento é externo; o risco é interno. Ação: provar e reduzir antes do stuffing.', [
  '1. Cruze os e-mails do dump com as contas ativas do domínio',
  '2. Force reset das contas envolvidas — todas, sem exceção',
  '3. Revogue sessões e tokens das contas resetadas',
  '4. Verifique logons anômalos das contas nos últimos 30 dias',
  '5. Rode o playbook de credential stuffing se houver sinal de uso',
  '6. Recorde a regra de senha e habilite verificação de senha vazada',
  '7. Registre e monitore: dumps reaparecem meses depois',
])

pb(23, 'Insider: USB em massa', 'Host registrou cópia de volume alto para dispositivo removível. Insider threat ou malware local — ambos precisam de resposta calibrada com RH e jurídico. Nada de acusação sem evidência sólida.', [
  '1. Confirme volume e arquivos copiados (logs de DLP e EDR)',
  '2. Identifique o dispositivo USB (registro USBSTOR, serial)',
  '3. Reúna evidência com cadeia de custódia (hashes, timestamps)',
  '4. Envolva RH e jurídico antes de qualquer contato com o usuário',
  '5. Restrinja USB por política (bloqueio de escrita, allowlist de dispositivos)',
  '6. Verifique se o conteúdo é sensível (classificação DLP)',
  '7. Documente a trilha completa — casos de insider vivem de evidência ordenada',
])

pb(24, 'Escaneamento interno', 'Padrão de varredura de portas na rede interna (nmap-like): conexões a dezenas de portas e hosts de uma origem. Pode ser usuário curioso, ferramenta de TI esquecida — ou recon do atacante.', [
  '1. Identifique a origem (IP, usuário logado, processo se EDR)',
  '2. Verifique se existe ferramenta legítima de TI que justifique (scan de inventário)',
  '3. Se não justificado: isole o host e investigue o processo',
  '4. Correlacione com logons da conta: credencial comprometida?',
  '5. Busque atividade subsequente: acesso a shares, RDP, execução remota',
  '6. Verifique o que o scan pode ter descoberto (serviços expostos internos)',
  '7. Reduza: bloqueio de scans por segmentação e alerta dedicado',
])

pb(25, 'Mineração de criptomoedas', 'Consumo de CPU anômalo ou tráfego para pool de mineração. Comum em servidor web comprometido (webshell) e em endpoints de usuário (download enganoso). Indica comprometimento mesmo quando parece só abuso.', [
  '1. Identifique o processo e o host (EDR, monitoramento de performance)',
  '2. Confirme o destino: pool conhecido (Stratum, porta 3333 e afins)',
  '3. Isole e investigue como o minerador chegou lá',
  '4. Em servidor web: busque webshell e atualize CMS e plugins',
  '5. Remova o minerador e a persistência; resete credenciais do servidor',
  '6. Bloqueie portas e pools no firewall de saída',
  '7. Hunt: padrão de CPU somado a conexões Stratum em outros hosts',
])

pb(26, 'BEC: fraude de pagamento', 'E-mail aparentando ser de executivo ou fornecedor pedindo alteração de pagamento (BEC — Business Email Compromise). Sem malware, sem IOC clássico: a fraude é social. Resposta = velocidade, bloqueio e recuperação bancária.', [
  '1. Confirme com o remetente real por canal alternativo (telefone)',
  '2. Congele o pagamento com o banco imediatamente (janela de recall)',
  '3. Colete headers: domínio look-alike? conta de fornecedor comprometida?',
  '4. Se domínio parecido: registre defesas (monitoramento de domínios similares, DMARC reject)',
  '5. Se fornecedor comprometido: notifique e revise as regras de validação',
  '6. Notifique jurídico; avalie registro de ocorrência policial',
  '7. Mude o processo: dupla aprovação de alteração bancária, sempre por canal secundário',
])

pb(27, 'Perda de dispositivo', 'Notebook ou celular com dados corporativos perdido ou roubado. O dano depende do estado: criptografado e gerenciado é incidente menor; desprotegido é exposição real. O clock começa no report.', [
  '1. Registre o report formal com horário (RH e jurídico no loop)',
  '2. Dispare wipe remoto via MDM e revogue as sessões do usuário',
  '3. Resete senha e MFA do usuário; revoque certificados do dispositivo',
  '4. Verifique criptografia (BitLocker) e acesso recente do dispositivo',
  '5. Avalie dados locais sensíveis (DLP, inventário de arquivos sincronizados)',
  '6. Notifique a ANPD via jurídico se dados pessoais estiverem em risco',
  '7. Feche com lições: criptografia obrigatória, report rápido, etiqueta de contato',
])

// ============================================================
// CAPÍTULO 17 — Segurança em Nuvem
// ============================================================

push(17, 'Segurança em Nuvem', 'Responsabilidade compartilhada', [
  'A migração para nuvem não transfere a responsabilidade de segurança — ela a fragmenta. No modelo de responsabilidade compartilhada, o provedor cuida da segurança da nuvem (física, hipervisor, rede subjacente) e o cliente cuida da segurança na nuvem: identidades, configurações, dados e aplicações. A maioria dos incidentes em cloud não explora falha do provedor, mas erro de configuração do cliente: bucket público, grupo de segurança liberado para 0.0.0.0/0, chave de acesso versionada em repositório.',
  'Para o SOC, isso cria um perímetro novo e volátil: infraestrutura nasce e morre em minutos via API, sem passar pelo change management tradicional. A resposta é tratar a nuvem como cidadã de primeira classe do monitoramento: logs de auditoria do provedor (CloudTrail, Azure Activity, GCP Audit Logs) ingestados no SIEM, alertas de configuração e detecções dedicadas a eventos de identidade. Quem monitora apenas o data center enxerga metade do ambiente.',
])

push(17, 'Segurança em Nuvem', 'Identidade é o novo perímetro', [
  'Em nuvem, quem tem a chave tem o reino: uma access key de administrador vale mais que um exploit. O IAM do provedor (AWS IAM, Microsoft Entra ID, Google Cloud IAM) define quem pode fazer o quê, e a maior parte das invasões começa por identidade: credencial vazada em dump, token de aplicação exposto, role mal configurada assumida via federation. Os princípios de on-premises valem em dobro: MFA obrigatório, mínimo privilégio e eliminação de credenciais de longa duração.',
  'Detecte comportamento de identidade, não apenas uso de recursos: logon de país nunca visto, criação de access key por conta de serviço, escalation via encadeamento de roles, sessão de console assumindo role privilegiada, desativação de MFA. Serviços como AWS GuardDuty, Entra ID Protection e análise no SIEM com schema normalizado facilitam. Cada identidade privilegiada merece alerta dedicado — são as chaves do castelo.',
])

push(17, 'Segurança em Nuvem', 'Misconfiguration e CSPM', [
  'Misconfiguration é a vulnerabilidade número um da nuvem: não é código ruim, é configuração padrão insegura. CSPM (Cloud Security Posture Management) compara continuamente o estado real da infraestrutura contra benchmarks (CIS, boas práticas do provedor) e prioriza o que expõe dados. Trate achados de CSPM como o fluxo de gestão de vulnerabilidades: com dono, prazo e métrica — não como painel decorativo. Os controles que mais evitam incidentes:',
], [
  'Bloqueio de acesso público a buckets e storages na raiz da organização',
  'Grupos de segurança sem 0.0.0.0/0 em portas administrativas (22, 3389, 445)',
  'Criptografia obrigatória em repouso imposta por policy, não por boa vontade',
  'Access keys de longa duração proibidas para humanos — SSO e roles primeiro',
  'Alerta dedicado a mudanças em logging: desligar auditoria é sinal de intrusão',
  'Guardrails via SCP, Azure Policy e GCP Organization Policy para o que não se negocia',
])

push(17, 'Segurança em Nuvem', 'Logging e detecção na cloud', [
  'O provedor entrega telemetria excelente e o cliente decide se paga para guardar. Logs de auditoria (CloudTrail, Activity Logs), fluxo de VPC, DNS e access logs de storage formam a base da investigação — sem eles, incidente em nuvem é adivinhação. Cuidado com armadilhas de custo: retenção curta demais, regiões sem ingestão e exclusão de eventos de leitura, que esconde acesso a dados. Projete ingestão por criticidade: identidade e dados primeiro, ruído depois.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Desligar ou encurtar logs é técnica de anti-forense (MITRE T1562). Crie alerta dedicado para: StopLogging, DeleteTrail, mudança de retenção, exclusão de log groups e desativação de diagnostic settings. Em nuvem, a primeira ação do atacante sofisticado costuma ser apagar o testemunho — detecte o apagão, não só o crime.',
})

push(17, 'Segurança em Nuvem', 'Workloads e containers', [
  'A segurança do workload fecha o tripé com identidade e configuração: imagens de container escaneadas antes do deploy, registro privado com assinatura, runtime protection detectando execução anômala dentro do pod e segredos em cofre — nunca em variável de ambiente versionada. Kubernetes adiciona a própria superfície: API server exposto, RBAC permissivo, containers privilegiados e service accounts com token montado por padrão.',
  'Para o SOC, priorize detecção sobre eventos cloud-native: execução de pod privilegiado, montagem de hostPath, criação de clusterrolebinding, shell dentro de container e abuso de service account para consultar a API. Ferramentas como Falco traduzem syscalls em eventos; os audit logs do kube-apiserver completam o quadro. O ataque em Kubernetes segue a lógica de qualquer intrusão — o que muda é o vocabulário dos artefatos.',
])

// ============================================================
// CAPÍTULO 18 — Supply Chain e SBOM
// ============================================================

push(18, 'Supply Chain e SBOM', 'A cadeia como alvo', [
  'Você não é hackeado — você baixa o atacante. Ataques à cadeia de suprimentos comprometem software confiável antes de chegar ao alvo: o SolarWinds (2020) contaminou o build de um produto de monitoramento e alcançou dezoito mil organizações; o incidente do xz/liblzma (2024) inseriu um backdoor cultivado por anos num projeto open source de uso universal. O vetor é a confiança: code review protege o código da empresa, não o das dependências dela.',
  'A superfície é vasta: bibliotecas open source, imagens base de container, ações de CI/CD, extensões de IDE, agentes de build e atualizações automáticas de fornecedor. A defesa combina verificação de integridade (o artefato veio de onde diz?), controle de dependência (o que uso e por quê?) e monitoramento de comportamento em runtime — porque, no fim, um pacote comprometido é um insider dentro da sua esteira de entrega.',
])

push(18, 'Supply Chain e SBOM', 'SBOM na prática', [
  'SBOM (Software Bill of Materials) é a lista de ingredientes do software: componentes, versões, licenças e relacionamentos, nos formatos SPDX ou CycloneDX. Sem SBOM, a pergunta "somos afetados pela CVE X?" leva dias; com ela, é uma query. O documento vira mapa de resposta para incidentes como Log4Shell e item de due diligence de fornecedor. Um SBOM útil contém:',
], [
  'Inventário de dependências diretas e transitivas com versão exata',
  'Hash do artefato final e proveniência do build que o gerou',
  'Fornecedor e identificador (PURL ou CPE) de cada componente',
  'Data de geração e ferramenta usada (syft, trivy, cyclonedx)',
  'Pontos de integração: pipeline, registry e software comprado de terceiro',
  'Política de atualização quando um componente entra no catálogo KEV',
])

push(18, 'Supply Chain e SBOM', 'Dependências e SCA', [
  'SCA (Software Composition Analysis) automatiza a triagem: compara o inventário de dependências contra bases de vulnerabilidade e aponta versões com CVE conhecida. O problema nunca é a falta de lista — é o excesso: mil achados de baixo impacto escondem os três críticos. Priorize por exploitabilidade real (EPSS, KEV), por exposição do componente (está no caminho das requisições?) e por viabilidade de atualização. Dependência congelada que ninguém atualiza é dívida composta.',
  'Controles de entrada valem mais que varredura de saída: pinagem de versões com lockfile, allowlist para pacotes novos (nenhuma dependência entra sem revisão), tokens de publicação com escopo mínimo e aprovação explícita para dependências transitivas novas. Ataques modernos de typosquatting e protestware entram pela esteira de instalação — o momento mais perigoso é o primeiro install.',
])

push(18, 'Supply Chain e SBOM', 'SLSA e integridade de artefatos', [
  'SLSA (Supply-chain Levels for Software Artifacts) oferece uma escada de maturidade para a integridade do build: do nível 1 (build documentado) ao nível 3 (build isolado e não falsificável). O entregável central é a provenance: metadados assinados que dizem quem construiu o artefato, a partir de qual código-fonte e em qual builder. Consumidores verificam a provenance antes do deploy — confiável não é o que assina; é o que assina com histórico verificável.',
  'Na prática: assine imagens com Sigstore/cosign, gere provenance SLSA nos pipelines (GitHub Actions e GitLab suportam) e imponha policies de admissão no cluster (Kyverno, OPA Gatekeeper) que rejeitam imagem sem assinatura válida. Para produtos comprados, exija SBOM e processo de divulgação de vulnerabilidade no contrato. A verificação desloca a confiança de pessoas para criptografia — que é exatamente o objetivo.',
])

push(18, 'Supply Chain e SBOM', 'CI/CD e pipeline', [
  'O pipeline é a fábrica do software e, como toda fábrica, é alvo: um runner comprometido exfiltrou segredos de milhares de repositórios no incidente do tj-actions (2025). Trate o CI como produção: runners efêmeros, permissões mínimas por job, segredos com escopo curto e rotação, revisão obrigatória de workflows de terceiros (ações externas rodam com o seu token) e deploy em produção só com aprovação humana registrada.',
], undefined, {
  title: 'REGRA DE OURO',
  text: 'Referências de ação por tag (action@v4) são mutáveis: quem controla a tag injeta código no seu build. Fixe dependências de CI pelo digest SHA-256 completo (action@abc123...) e atualize via PR revisado. O digest garante que a ação de hoje é a mesma que você revisou ontem.',
})

// ============================================================
// CAPÍTULO 19 — IA Defensiva
// ============================================================

push(19, 'IA Defensiva', 'IA no SOC: o que resolve', [
  'A promessa da IA no SOC é atacar o gargalo real: volume contra atenção humana. Triagem assistida agrupa alertas correlatos, resume o contexto do incidente em parágrafo legível e sugere o próximo passo com base nos playbooks; o analista deixa de pular entre dez consoles para ler um resumo bem escrito. Em produção, os ganhos medidos ficam entre 30 e 60 por cento no tempo de triagem de alertas de baixa complexidade.',
  'Mas IA não é autômago: o modelo erra com fluência, alucina IOCs que não existem e herda viés dos dados de treino. O padrão saudável é human-in-the-loop: a máquina prepara (enriquece, resume, prioriza) e o humano decide (contém, escalona, comunica). Meça como mede analista: taxa de acerto por sugestão aceita, tempo economizado e, principalmente, erros evitados — a conta que fecha é menos incidente, não menos analista.',
])

push(19, 'IA Defensiva', 'LLMs para investigação', [
  'Casos de uso que funcionam hoje: traduzir hipótese em query (o analista descreve o que procura, o modelo sugere KQL ou SPL, o analista valida antes de executar); resumir incidente de quarenta tickets em linha do tempo; decodificar ofuscação comum como base64 e PowerShell malformado, sempre com supervisão; redigir rascunho de relatório executivo a partir do ticket técnico. Em todos, o modelo é acelerador de escrita e leitura — não oráculo de verdade.',
  'Integre via contexto, não via fé: entregue ao modelo os logs relevantes (com dados sensíveis mascarados) e peça análise estruturada — o que aconteceu, o que é anômalo, quais hipóteses, quais queries verificar. Guarde prompt e resposta no ticket: investigação assistida por IA precisa de trilha de auditoria tanto quanto o acesso ao SIEM. Resposta não verificável não entra em relatório.',
])

push(19, 'IA Defensiva', 'Prompt injection e vazamento', [
  'IA introduz superfície nova e o SOC precisa vigiá-la: o OWASP Top 10 para aplicações LLM (LLM01: prompt injection) já é checklist de auditoria. Os riscos concretos para o ambiente corporativo:',
], [
  'Prompt injection indireto: instrução escondida em e-mail ou página que o assistente lê e obedece',
  'Vazamento de dados: analista colando log com PII ou segredo em chat público — DLP e treinamento',
  'Abuso de integrações: agente com acesso a e-mail, drive e código é alvo — escopo mínimo e log por ação',
  'Falsificação plausível: resposta confiante e errada vira IOC falso se ninguém valida contra a evidência',
  'Sombra de IA: contas pessoais de LLM fora do controle corporativo processando dados da empresa',
])

push(19, 'IA Defensiva', 'IA do atacante', [
  'O adversário também modernizou: phishing gramaticalmente perfeito em qualquer idioma e personalizado com OSINT saiu de caro para automático; deepfake de voz já autorizou transferências reais (o caso Arup, 25 milhões de dólares); malwares assistidos por LLM geram variações de loader e respostas de sandbox. Para o defensor, o efeito prático é erosão do sinal: o e-mail que era suspeito por ser mal escrito agora é impecável — a detecção precisa voltar ao comportamento e à infraestrutura.',
  'Do lado da defesa, isso reordena prioridades: awareness precisa de verificação de canal, não de caça a erros de português; detecção de phishing pesa em domínio, infraestrutura e histórico, não em estilo; verificação de identidade para pagamentos exige segundo fator humano. E prepare a resposta a incidentes para deepfake: palavra-código compartilhada para confirmar instruções sensíveis é controle barato e eficaz.',
])

push(19, 'IA Defensiva', 'Governança de IA', [
  'IA corporativa precisa de cerca: inventário de uso (quem usa qual modelo para quê), política de dados (o que pode ser colado onde), gateway corporativo com logging e filtro, e revisão de segurança para cada integração de agente — toda ferramenta que o LLM pode acionar é superfície de ataque. No contexto regulatório brasileiro, o marco é o PL 2338 e a LGPD: decisões automatizadas sobre pessoas exigem transparência e revisão humana.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Audite o agente. Cada agente de IA com permissões (ler e-mail, criar ticket, rodar query) é uma identidade: registre-a, dê escopo mínimo, logue cada ação e revogue por padrão. O incidente do agente que apagou a base porque alguém escreveu a frase errada no chat não é ficção — é o seu próximo tabletop.',
})

// ============================================================
// CAPÍTULO 20 — Automação e SOAR
// ============================================================

push(20, 'Automação e SOAR', 'O que automatizar primeiro', [
  'Automatize o repetitivo, não o julgamento. O mapa de priorização é simples: tudo que o analista faz igual toda vez (enriquecimento, fechamento de duplicatas, anexo de evidência ao ticket) primeiro; ações de contenção reversíveis (isolamento de host, purge de e-mail) depois; decisões de risco alto (bloqueio de conta executiva, shutdown de servidor) nunca sem humano. Um SOAR que automatiza o errado não reduz toil — industrializa o erro.',
  'Comece pela métrica: meça o tempo médio de triagem por tipo de alerta antes de automatizar qualquer coisa. Os playbooks que pagam o SOAR quase sempre são os mesmos: enriquecimento de IOC (reputação, WHOIS, detonação), resposta a phishing (purge em massa, bloqueio, reset de credencial), isolamento de endpoint confirmado pelo EDR e abertura de ticket formatado. Três playbooks bem feitos valem mais que cinquenta esboços.',
])

push(20, 'Automação e SOAR', 'Anatomia de um playbook', [
  'Um playbook de produção é código com dono: versionado, testado, documentado e monitorado como qualquer automação de infraestrutura. A anatomia que sobrevive à auditoria:',
], [
  'Gatilho explícito (alerta, webhook, agendamento) com filtro de escopo',
  'Enriquecimento paralelo com timeout curto por integração',
  'Condições de decisão escritas como regras, não como intuição do analista',
  'Ações de resposta com aprovação e procedimento de reversão documentado',
  'Tratamento de falha: retry com limite, fallback e alerta ao humano',
  'Trilha de auditoria completa anexada ao ticket do incidente',
  'Dono e data da última revisão no repositório do playbook',
])

push(20, 'Automação e SOAR', 'Enriquecimento automático', [
  'Enriquecimento é a automação de maior retorno por esforço: antes do analista abrir o ticket, o sistema já anexou reputação de IP e domínio, WHOIS e idade do domínio, hash no sandbox, dono do ativo, criticidade do usuário e ocorrências anteriores do mesmo IOC. O ganho é duplo: a triagem cai de minutos para segundos e a qualidade sobe, porque a decisão passa a ser tomada com contexto completo em vez de pressa.',
  'Faça enriquecimento com higiene: cacheie respostas (a reputação do IP não muda a cada minuto), trate timeout como dado (serviço lento não trava a fila), normalize numa taxonomia (OCSF ou o schema do SIEM) e documente a fonte de cada campo. E cuidado com loop: automação que consulta serviço que consulta sua automação é DDoS caseiro — circuit breaker em toda integração.',
])

push(20, 'Automação e SOAR', 'Resposta com aprovação humana', [
  'A contenção automatizada muda o jogo quando é rápida e segura ao mesmo tempo: isolamento de host via EDR é reversível e, por isso, candidato ideal a automação com gatilho de alta confiança (comportamento confirmado por detecção madura). O purge em massa de e-mail phishing é outro: falso positivo custa um e-mail devolvido; falso negativo custa uma campanha inteira correndo solta pela caixa de entrada.',
  'Para ações de maior impacto, o padrão é two-man rule: a automação prepara tudo (consulta afetados, redige o comando, calcula blast radius) e pede aprovação humana com um clique — o analista do turno decide com contexto na mão, não correndo para o console. Registre quem aprovou, quando e com qual informação. A meta não é remover o humano: é removê-lo da esteira, não da decisão.',
])

push(20, 'Automação e SOAR', 'Guardrails da automação', [
  'Automação sem freio é incidente agendado: playbook em loop (alerta dispara playbook que gera alerta), ação em escala errada (isolou o load balancer), integração com credencial vencida que silencia a resposta inteira. Trate o SOAR como sistema de produção: ambiente de teste, revisão de código, rollout em canário (rodar primeiro em cinco por cento dos casos), kill switch global documentado e revisão trimestral de cada playbook ativo.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'Ensaie o kill switch. Quando a automação errar — e um dia ela erra — o time precisa saber em segundos: qual botão pausa todos os playbooks, quem tem autoridade para apertá-lo e como desfazer as ações já executadas. Esse procedimento no papel vale mais que qualquer dashboard de SOAR.',
})

// ============================================================
// CAPÍTULO 21 — Deception Technology
// ============================================================

push(21, 'Deception Technology', 'A filosofia da armadilha', [
  'Deception inverte a assimetria do blue team: em vez de vigiar tudo, você planta o que não tem explicação legítima. Um servidor que ninguém deveria acessar, uma credencial que não existe em nenhum sistema real, um compartilhamento chamado rh_salarios_2025. Qualquer interação com esses artefatos é, por definição, maliciosa — taxa de falso positivo próxima de zero. É o único controle defensivo cujo alerta quase nunca mente.',
  'A base é assum breach: se o adversário já está dentro, deception é armadilha no caminho dele. A movimentação lateral exige reconhecimento interno — e é aí que o atacante encontra o honeypot, consulta a credencial canário ou abre o arquivo-isca. O tempo que ele gasta explorando a armadilha é tempo de detecção, e a detecção chega cedo, na fase de recon, antes do impacto no negócio.',
])

push(21, 'Deception Technology', 'Honeypots e canários', [
  'O espectro vai do barato ao ambicioso: canary tokens (arquivos, URLs e credenciais marcadas que alertam ao serem tocadas) custam quase nada e pagam rápido; honeypots de serviço (SSH, RDP e SMB falsos com Cowrie ou Opencanary) capturam interação real; honeynets completos simulam segmentos inteiros com dados falsos convincentes. Produtos comerciais (a Thinkst Canary é a referência de simplicidade) empacotam tudo com alerta imediato.',
  'A regra de ouro é plausibilidade: armadilha irrelevante não engana ninguém. Nomeie os hosts como o resto da rede (fin-db-03, não honeypot-01), popule os compartilhamentos com arquivos plausíveis, dê à credencial canária formato real e permissões mínimas. E isole de verdade: a armadilha não pode virar pivô — sem acesso a nada real, sem credenciais válidas e sem rota de saída.',
])

push(21, 'Deception Technology', 'Canary tokens em produção', [
  'Armadilhas baratas de implantar na semana que detectoriam intrusões que o resto do stack deixa passar:',
], [
  'Credencial fake em gerenciador de senhas e no share de credenciais da TI — uso dispara alerta',
  'Documento atraente nos shares: inventario_ativos.xlsx ou credenciais_vpn.pdf com token embutido',
  'API key fake em repositório e em .env de produção, monitorada por token de DNS ou HTTP',
  'Conta dorminhoca no AD (sem logon histórico): qualquer logon é alerta de severidade máxima',
  'Domínio canário com alerta de DNS: qualquer resolução é callback de malware ou recon',
  'Bucket honeypot na nuvem com alerta de acesso: leitura de objeto é sinal de credencial comprometida',
])

push(21, 'Deception Technology', 'Deception em camadas', [
  'Distribua as armadilhas onde o atacante caminha: uma credencial canária por serviço crítico, um honeypot por segmento de rede, tokens de arquivo em cada servidor de arquivos e armadilhas de identidade no diretório. A cobertura não precisa ser densa — precisa estar no caminho provável: o atacante que enumera o ambiente cedo ou tarde toca uma. Com dezenas de armadilhas bem colocadas, o SOC ganha um sensor de intrusão interna que nenhuma assinatura cobre.',
  'Integre ao fluxo de resposta como qualquer alerta, mas com severidade própria: interação com deception é presumida hostil — playbook dedicado, resposta imediata e forense de tudo que tocou a armadilha. E separe a métrica: cada alerta de deception entra como alta fidelidade; a taxa de acerto desses alertas é o argumento de budget para expandir o programa.',
])

push(21, 'Deception Technology', 'Operando a armadilha', [
  'Deception é programa, não projeto: inventário de armadilhas com dono, revisão de plausibilidade a cada mudança de rede, teste periódico (dispare você mesmo cada token e cronometre o alerta) e feedback do IR para o design — como o atacante se moveu e onde faltava armadilha. Documente para auditoria o propósito de cada honeypot: armadilha sem propósito é superfície de ataque decorativa.',
], undefined, {
  title: 'DICA DE SOC',
  text: 'A pior falha de deception é o silêncio: armadilha tocada e alerta perdido. Teste o caminho completo todo mês — toque o canary token, confirme o alerta no SIEM e o acionamento do on-call. Deception sem verificação de ponta a ponta é cofre sem alarme ligado.',
})

// ============================================================
// CAPÍTULO 22 — Engenharia de Detecção
// ============================================================

push(22, 'Engenharia de Detecção', 'Detecção como código', [
  'Detecção madura é engenharia: regras vivem em repositório (formatos Sigma, YARA, KQL), passam por revisão como qualquer código, têm dono, testes e versionamento. O pipeline liga CI à detecção: regra nova é testada contra telemetria sintética (Atomic Red Team) antes de produção, e cada mudança é auditável. O benefício silencioso: o conhecimento do SOC deixa de morar na cabeça do analista sênior.',
  'O mapeamento para MITRE ATT&CK dá o eixo: cada regra declara as técnicas que cobre, e a matriz do ambiente mostra onde a cobertura é real e onde é tabela vazia. Atenção ao vício de métrica: cem por cento de cobertura do ATT&CK é utopia cara — o objetivo é cobertura profunda das técnicas que o seu adversário real usa, decidida por threat intel e pelo histórico de incidentes da casa.',
])

push(22, 'Engenharia de Detecção', 'Pipeline de detecção', [
  'Do alerta à regra, o caminho que evita ruído em produção:',
], [
  'Hipótese com origem: incidente, hunt, intel ou pedido do IR',
  'Protótipo no SIEM contra dados históricos, com estimativa de volume diário',
  'Validação com técnica simulada (Atomic Red Team) — a regra precisa disparar no teste',
  'Revisão de código e de mapping ATT&CK por um segundo engenheiro',
  'Deploy em modo monitor por uma semana, medindo taxa de alerta',
  'Tuning com exceções específicas e documentadas',
  'Promoção a produção com severidade e playbook anexos',
  'Revisão trimestral da taxa de falso positivo por regra',
])

push(22, 'Engenharia de Detecção', 'Tuning e falsos positivos', [
  'Toda regra nasce ruidosa — tuning é parte do trabalho, não falha dele. O método: meça a taxa por regra (alertas por dia, percentual fechado como falso positivo), categorize o ruído (qual atividade benigna dispara?), suprima com exceção específica e documentada — nunca por origem genérica — e reavalie. Uma regra que alerta vinte vezes por dia e nunca encontra nada treina o analista a ignorá-la; e é pior que não ter regra.',
  'Exceções vivem para expirar: cada supressão carrega justificativa, dono e data de revisão. O anti-padrão clássico é o arquivo de exclusões que cresce para sempre até a detecção virar peneira. Trate exceção como dívida técnica com juros: a revisão trimestral apaga o que expirou, e qualquer exceção sem justificativa documentada é devolvida ao dono.',
])

push(22, 'Engenharia de Detecção', 'Medindo cobertura ATT&CK', [
  'A matriz do ambiente responde à pergunta do board — "estamos cobertos contra o quê?" — com honestidade: para cada tática, quais técnicas têm detecção em produção, qual fonte de dados sustenta cada uma e onde estão as lacunas. Cruzar com intel do setor (que técnicas o ransomware da sua região usa?) transforma o mapa em roadmap: as três lacunas mais perigosas valem mais que a cobertura média.',
], undefined, {
  title: 'MÉTRICA QUE IMPORTA',
  text: 'Cobertura não é número de regras. A medida que vale: para cada técnica prioritária, uma detecção que já disparou em teste, fonte de dados saudável (monitore ingestão por fonte) e playbook de resposta anexo. Regra sem fonte é papel; fonte sem regra é custo; as duas com playbook são defesa.',
})

// ============================================================
// SUMÁRIO E EXPORTAÇÃO
// ============================================================

export const BOOK_CHAPTERS: BookChapter[] = [
  { num: 1, title: 'Fundamentos do Blue Team', subtitle: 'Mindset defensivo, terminologia e princípios da defesa' },
  { num: 2, title: 'SOC na prática', subtitle: 'Estrutura, turnos, papéis e fluxo de alertas' },
  { num: 3, title: 'SIEM e coleta de logs', subtitle: 'Arquitetura, normalização, retenção e custo' },
  { num: 4, title: 'Análise de logs na prática', subtitle: 'Windows, Sysmon, Linux, proxy e DNS' },
  { num: 5, title: 'Redes e monitoramento', subtitle: 'NetFlow, IDS/IPS, Zeek e detecção de exfiltração' },
  { num: 6, title: 'Endpoint e EDR/XDR', subtitle: 'Telemetria, process tree e resposta no host' },
  { num: 7, title: 'Threat Intelligence e MITRE ATT&CK', subtitle: 'TTPs, IOC vs IOA e curadoria de feeds' },
  { num: 8, title: 'Threat Hunting', subtitle: 'Hipóteses, base rates e hunting loops' },
  { num: 9, title: 'Resposta a incidentes', subtitle: 'NIST SP 800-61, playbooks e cadeia de custódia' },
  { num: 10, title: 'Forense digital', subtitle: 'Memória, disco, artefatos e timeline' },
  { num: 11, title: 'Análise de malware para defensores', subtitle: 'Sandboxes, strings, YARA e comportamento' },
  { num: 12, title: 'Engenharia social e phishing', subtitle: 'Vetores, headers de e-mail, SPF/DKIM/DMARC' },
  { num: 13, title: 'Gestão de vulnerabilidades', subtitle: 'CVSS, EPSS, KEV e priorização por risco' },
  { num: 14, title: 'Identidade e acesso', subtitle: 'AD, ataques Kerberos, MFA e zero trust' },
  { num: 15, title: 'GRC, métricas e compliance', subtitle: 'MTTD/MTTR, LGPD, ISO 27001 e NIST CSF' },
  { num: 16, title: 'Carreira e certificações', subtitle: 'CySA+, BTL1, SC-200, GCFA e home lab' },
  { num: 17, title: 'Segurança em Nuvem', subtitle: 'IAM, responsabilidade compartilhada, CSPM e workloads' },
  { num: 18, title: 'Supply Chain e SBOM', subtitle: 'Dependências, integridade de artefatos e SLSA' },
  { num: 19, title: 'IA Defensiva', subtitle: 'LLMs no SOC, prompt injection e novos riscos' },
  { num: 20, title: 'Automação e SOAR', subtitle: 'Playbooks codificados, enriquecimento e guardrails' },
  { num: 21, title: 'Deception Technology', subtitle: 'Honeypots, canary tokens e armadilhas para o adversário' },
  { num: 22, title: 'Engenharia de Detecção', subtitle: 'Da hipótese à regra: pipeline, tuning e cobertura ATT&CK' },
  { num: 98, title: 'Glossário', subtitle: 'Os termos que o analista precisa dominar' },
  { num: 99, title: 'Apêndice: Playbooks de resposta', subtitle: '27 roteiros rápidos para os incidentes mais comuns' },
]

export const BOOK_PAGES: BookPage[] = P
