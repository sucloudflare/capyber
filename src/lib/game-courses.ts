// CAPYBER — Trilha 3D: cursos técnicos de Blue Team em nível de certificação.
// Conteúdo alinhado aos domínios de CompTIA CySA+, BTL1 (Blue Team Level 1),
// Microsoft SC-200, GIAC GCIH e eCIR — escrito em pt-BR para estudo aplicado.

export interface CourseCode {
  lang: string
  caption: string
  content: string
}

export interface CourseLesson {
  id: string
  title: string
  minutes: number
  body: string[]
  code?: CourseCode
  keyPoints: string[]
}

export interface ExamQuestion {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface GamePhase {
  id: string
  num: string
  name: string
  short: string
  area: string
  certRef: string
  intro: string
  passScore: number
  coins: number
  lessons: CourseLesson[]
  exam: ExamQuestion[]
  /** metadado visual: cor do estandarte do santuário no mapa 3D */
  bannerColor?: string
}

export const PASS_SCORE_PADRAO = 70

export const GAME_PHASES: GamePhase[] = [
  {
    id: 'f1',
    num: '1',
    name: 'Torre do SOC',
    short: 'SOC & SIEM',
    area: 'SOC, Monitoramento & SIEM',
    certRef: 'CompTIA CySA+ (Dom. 1) · Microsoft SC-200',
    bannerColor: '#2569b8',
    intro:
      'Base de tudo: como um SOC organiza pessoas, processos e o SIEM para detectar o invasor antes do impacto.',
    passScore: PASS_SCORE_PADRAO,
    coins: 40,
    lessons: [
      {
        id: 'l1',
        title: 'SOC: níveis, triagem e fluxo de alerta',
        minutes: 6,
        body: [
          'Um Security Operations Center (SOC) trabalha em camadas. O Tier 1 faz a triagem dos alertas: valida se o alerta é verdadeiro, coleta contexto (usuário, host, IP, horário) e fecha falsos positivos. O Tier 2 investiga o que o Tier 1 escalou — correlaciona eventos, consulta threat intel e monta a linha do tempo. O Tier 3 cuida de threat hunting e detecção avançada, caçando o que nenhuma regra pegou.',
          'Um alerta não é um incidente. A triagem existe para separar ruído de sinal: cada alerta precisa de severidade (impacto potencial) e confiabilidade (a fonte de dados sustenta a hipótese?). A pergunta que orienta tudo é a do Pyramyd of Pain: quanto trabalho dá para o invasor trocar este indicador?',
          'O fluxo padrão é: alerta → enriquecimento (WHOIS, GeoIP, reputação, CMDB) → triagem → classificação (verdadeiro/falso positivo) → contenção se necessário → documentação no ticket. Sem ticket, não existe métrica — e sem métrica o SOC não prova valor (MTTD, MTTR, taxa de FP).',
        ],
        keyPoints: [
          'Tier 1 tria, Tier 2 investiga, Tier 3 caça (hunting).',
          'Severidade ≠ confiabilidade: analise os dois eixos.',
          'Todo alerta gera ticket — MTTD e MTTR são as métricas do SOC.',
          'Falso positivo bem documentado melhora a regra; falso positivo fechado sem análise esconde detecção falha.',
        ],
      },
      {
        id: 'l2',
        title: 'SIEM na prática: ingestão, normalização e correlação',
        minutes: 7,
        body: [
          'O SIEM centraliza logs de endpoints, rede, nuvem e identidade, normalizando tudo para um schema comum (ex.: OCSF, ECS). Ingestão sem plano vira custo: priorize fontes pelo valor de detecção — autenticação, EDR, proxy/DNS e VPN valem mais que log genérico de aplicação.',
          'Correlação é o coração do SIEM: uma regra combina eventos para produzir o alerta. Exemplo clássico: muitas falhas 4625 seguidas de um 4624 de sucesso no mesmo host = possível brute force bem-sucedido. Regras boas têm janela de tempo, limiar (threshold), lista de exclusão e — principalmente — lógica documentada.',
          'No Microsoft Sentinel (SC-200), regras analíticas são escritas em KQL e agendadas como consultas. A qualidade da regra se mede por precisão (baixo FP) e cobertura (mapeia técnicas do MITRE ATT&CK).',
        ],
        code: {
          lang: 'kql',
          caption: 'Sentinel — força bruta seguida de login (janela de 15 min)',
          content: `let janela = 15m;
SecurityEvent
| where EventID == 4625 and TimeGenerated > ago(janela)
| summarize falhas = count() by TargetUserName, Computer
| where falhas >= 10
| join kind=inner (
    SecurityEvent
    | where EventID == 4624 and LogonType == 10
        and TimeGenerated > ago(janela)
    | project TargetUserName, Computer, TimeGenerated
  ) on TargetUserName, Computer
| project TargetUserName, Computer, falhas, TimeGenerated
| sort by falhas desc`,
        },
        keyPoints: [
          'Normalize para um schema comum antes de escrever regras.',
          'Autenticação + EDR + proxy/DNS são as fontes de maior valor.',
          'Regra de correlação = eventos + janela de tempo + limiar + exclusões.',
          'Cada regra deve citar as técnicas ATT&CK que cobre.',
        ],
      },
      {
        id: 'l3',
        title: 'MITRE ATT&CK e a linguagem da detecção',
        minutes: 6,
        body: [
          'MITRE ATT&CK é a matriz de táticas (o PORQUÊ: Acesso Inicial, Persistência, Escalada…) e técnicas (o COMO: T1566 Phishing, T1059 PowerShell…). Sub-técnicas refinam o como (T1059.001 PowerShell com ofuscação). É o vocabulário comum entre blue team, red team e threat intel.',
          'O Pyramyd of Pain ordena indicadores por custo de troca para o atacante: hashes e IPs são fáceis de trocar (base da pirâmide); TTPs (técnicas e comportamentos) estão no topo — mudar TTP custa caro. Detecção madura caça comportamento, não assinatura.',
          'Monte um ATT&CK Navigator da sua cobertura: cada regra do SIEM cobre células da matriz. As células vazias são o mapa do seu hunting.',
        ],
        keyPoints: [
          'Tática = objetivo; técnica = método; sub-técnica = variação.',
          'Pyramyd of Pain: TTP no topo — indicadores simples derretem rápido.',
          'Mapeie regras → ATT&CK para achar lacunas de cobertura.',
          'Threat intel útil é o que vira detecção (intel-to-detection).',
        ],
      },
    ],
    exam: [
      {
        q: 'Um analista Tier 1 recebe 200 alertas de "processo suspeito" em 10 minutos, todos do mesmo host após uma atualização de software. Qual a ação correta na triagem?',
        options: [
          'Escalar todos ao Tier 2 para não perder nada',
          'Correlacionar com a janela de mudança (change window), validar assinatura do binário e classificar como falso positivo provável com evidência no ticket',
          'Fechar todos sem documentar, pois é volume alto',
          'Isolar o host imediatamente como contenção padrão',
        ],
        answer: 1,
        explain:
          'Triagem é correlação com contexto: atualização agendada + binário assinado = FP provável. Escalar 200 alertas satura o Tier 2; fechar sem documentar elimina a métrica; isolar host por ruído gera impacto sem evidência.',
      },
      {
        q: 'Qual fonte de log tem o MAIOR valor de detecção para identificar movimento lateral no ambiente Windows?',
        options: [
          'Log de aplicação web do servidor interno',
          'Eventos 4624/4625 (logon) do controlador de domínio, com LogonType e Source IP',
          'Log de impressão dos endpoints',
          'Log de firewall do escritório voltado à internet',
        ],
        answer: 1,
        explain:
          'Movimento lateral em Windows quase sempre passa por autenticação (SMB, WinRM, RDP). Os 4624/4625 do DC com LogonType (3 = rede, 10 = RDP) e IP de origem são a fonte central — base da detecção de lateral movement.',
      },
      {
        q: 'No MITRE ATT&CK, "Credential Access" e "T1003.001 LSASS Memory" são, respectivamente…',
        options: [
          'Uma técnica e uma tática',
          'Uma tática e uma sub-técnica',
          'Duas táticas',
          'Um procedimento e uma técnica',
        ],
        answer: 1,
        explain:
          'Táticas são objetivos (Credential Access); técnicas são métodos (T1003 OS Credential Dumping); sub-técnicas são variações (T1003.001 LSASS Memory). A ordem tática → técnica → sub-técnica é a hierarquia da matriz.',
      },
      {
        q: 'Uma regra de correlação dispara quando há 20 falhas 4625 e depois um 4624 de sucesso, em 10 minutos. Qual elemento é ESSENCIAL para reduzir falsos positivos em ambientes com serviços de autenticação legítimos que erram senha?',
        options: [
          'Remover o limiar (threshold) para pegar tudo',
          'Lista de exclusão por contas de serviço/grupos conhecidos e por hosts de teste, mantendo a janela e o limiar',
          'Enviar o alerta direto para contenção automática',
          'Reduzir a janela para 1 minuto',
        ],
        answer: 1,
        explain:
          'Exclusões documentadas (contas de serviço, PAM, hosts de teste) são o mecanismo padrão de redução de FP em regras de força bruta. Remover limiar aumenta ruído; janela menor quebra a lógica do ataque; contenção automática nesse cenário causa impacto indevido.',
      },
      {
        q: 'Segundo o Pyramyd of Pain, qual conjunto de indicadores exige MAIOR esforço do adversário para trocar após ser detectado?',
        options: [
          'Hashes de arquivo e domínios',
          'Endereços IP e portas',
          'Ferramentas e TTPs (técnicas, táticas e procedimentos)',
          'User-agents HTTP',
        ],
        answer: 2,
        explain:
          'A pirâmide ordena por custo de troca: rede/artefatos (IP, domínio, hash) estão na base — trocar é barato. Ferramentas e TTPs estão no topo: mudar o comportamento do ataque exige retrabalho real do adversário.',
      },
    ],
  },
  {
    id: 'f2',
    num: '2',
    name: 'Lagoa dos Cabeçalhos',
    short: 'PHISHING',
    area: 'Análise de E-mail & Anti-Phishing',
    certRef: 'BTL1 (Phishing Analysis) · CySA+',
    bannerColor: '#d23b4e',
    intro:
      'O vetor nº 1 de acesso inicial, dissecação técnica: headers, SPF/DKIM/DMARC e triagem sem detonar a máquina do analista.',
    passScore: PASS_SCORE_PADRAO,
    coins: 40,
    lessons: [
      {
        id: 'l1',
        title: 'Anatomia dos cabeçalhos de e-mail',
        minutes: 7,
        body: [
          'Headers contam a história real da mensagem. Leia de baixo para cima: o bloco mais antigo (do servidor de envio) até o mais novo. Os campos-chave: Received (saltos reais, do último ao primeiro), Return-Path/Envelope-From (o MAIL FROM do SMTP), From (o que o usuário vê — forjável), Reply-To (para onde a resposta vai — o golpe clássico), Message-ID e Authentication-Results.',
          'Discrepância é a palavra: From diz banco@banco.com, mas Return-Path aponta para domínio russo e Reply-To para um Gmail. O envelope (Return-Path) nunca mente sobre quem transmitiu; o From é apenas exibição.',
          'X-Originating-IP e os Received revelam a infraestrutura de origem — cruze com WHOIS e reputação. Análise de phishing é forense de metadados antes de ser análise de link.',
        ],
        keyPoints: [
          'Leia os Received de baixo para cima (mais novo → mais antigo).',
          'From é cosmético; Return-Path (envelope) mostra quem enviou de verdade.',
          'Reply-To divergente é o indicador clássico de Business Email Compromise.',
          'Authentication-Results resume SPF/DKIM/DMARC da borda.',
        ],
      },
      {
        id: 'l2',
        title: 'SPF, DKIM e DMARC sem mistério',
        minutes: 7,
        body: [
          'SPF valida se o IP que transmitiu está autorizado no DNS do domínio do envelope (Return-Path). Falha SPF = o servidor de envio não é legítimo para aquele domínio. Limitação: SPF morre no reencaminhamento (forwarding).',
          'DKIM assina a mensagem com criptografia assimétrica: o servidor de destino busca a chave pública no DNS (selector._domainkey) e valida a integridade dos headers assinados. DKIM sobrevive a forwarding (enquanto o corpo não for alterado).',
          'DMARC alinha os dois com o domínio VISÍVEL (From) e define política: p=none (monitorar), p=quarantine, p=reject. Os relatórios (RUA/RUF) mostram quem envia em nome do seu domínio — é o mapa para fechar o escopo. Sem DMARC em p=quarantine/reject, phishing de domínio próprio continua chegando na caixa do usuário.',
        ],
        code: {
          lang: 'dns',
          caption: 'Diagnóstico DMARC/SPF via dig',
          content: `# Política DMARC do domínio
dig TXT _dmarc.bancoai.com +short
# -> "v=DMARC1; p=reject; rua=mailto:dmarc@bancoai.com"

# SPF do domínio (quem pode transmitir)
dig TXT bancoai.com +short
# -> "v=spf1 include:_spf.proveedor.com -all"

# DKIM por selector
dig TXT selector1._domainkey.bancoai.com +short

# Header típico de phishing: spf=fail dkim=none dmarc=fail
Authentication-Results: mx.bancoai.com;
  spf=fail (sender IP is 45.155.x.x) smtp.mailfrom=banco-secure-login.com;
  dkim=none; dmarc=fail action=quarantine header.from=bancoai.com`,
        },
        keyPoints: [
          'SPF valida o envelope; DKIM valida integridade; DMARC alinha com o From e aplica política.',
          'p=none é só observação — sem proteção real.',
          'Forwarding quebra SPF; DKIM resiste se o corpo não mudar.',
          'dmarc=fail + dkim=none + spf=fail = assinatura forte de spoofing.',
        ],
      },
      {
        id: 'l3',
        title: 'Triagem de phishing: do e-mail ao IOC',
        minutes: 8,
        body: [
          'Fluxo BTL1: (1) nunca clicar — detonar em sandbox online (ANY.RUN, Joe Sandbox) ou VM isolada sem rede de produção; (2) extrair IOCs: domínios, URLs, hashes de anexo, IPs; (3) enriquecer: WHOIS (idade do domínio — registro de 3 dias é isco), VirusTotal, reputação; (4) verificar impacto: alguém clicou? Consulte proxy/EDR pelos IOCs no período; (5) responder: bloquear remetente/domínio na borda, remover da caixa de todos (purge), bloquear IOCs e caçar por todo o fleet.',
          'Anexos: PDF com link é o isco mais comum; Office com macro exige defusal; HTML em anexo (hTA) às vezes traz credential phishing autocontido — abra como texto e leia o form/action.',
          'Fecha o ciclo: se alguém digitou credenciais, é reset + revogação de sessão imediatos (isso vira incidente, não só triagem). Documente tudo no ticket — o phishing de hoje é o intel do hunting de amanhã.',
        ],
        keyPoints: [
          'Detonar só em sandbox/VM isolada — nunca no host do analista.',
          'IOC primeiro, impacto depois: a pergunta é "quem JÁ clicou?"',
          'Purge + bloqueio na borda + hunting por IOCs = resposta mínima.',
          'Credencial digitada = incidente com reset e revogação de sessão.',
        ],
      },
    ],
    exam: [
      {
        q: 'Um e-mail exibe From: ceo@empresa.com, mas Reply-To: ceo.empresa.pagamentos@gmail.com. SPF/DKIM/DMARC passam no domínio empresa.com porque a mensagem saiu de um serviço de marketing legítimo. Qual a leitura correta?',
        options: [
          'É legítimo, pois a autenticação passou',
          'Indicador clássico de BEC: divergência From × Reply-To; autenticação passar não valida a intenção do Reply-To',
          'Basta bloquear o domínio gmail.com inteiro',
          'É falso positivo, pois marketing sempre altera Reply-To',
        ],
        answer: 1,
        explain:
          'Autenticação valida o domínio do envelope/assinatura, não o destino da resposta. From legítimo + Reply-To externo divergente é o padrão do Business Email Compromise — a resposta (e o dinheiro) iria para o atacante.',
      },
      {
        q: 'Uma mensagem tem spf=fail, dkim=none e dmarc=fail no Authentication-Results. O que isso significa tecnicamente?',
        options: [
          'O e-mail foi assinado e validado de ponta a ponta',
          'O IP de envio não está autorizado no SPF do envelope, não há assinatura DKIM válida e nada alinhou com o domínio do From — perfil típico de spoofing',
          'Apenas o DKIM falhou; o resto está íntegro',
          'O usuário precisa aprovar a mensagem manualmente',
        ],
        answer: 1,
        explain:
          'É o pior cenário possível de autenticação: nenhum dos três pilares valida a mensagem. Com dmarc=fail, a política do domínio (quarantine/reject) deve segurar a mensagem na borda.',
      },
      {
        q: 'Na triagem de um e-mail suspeito com anexo em PDF, qual sequência segue o método seguro de análise?',
        options: [
          'Abrir o PDF no host do analista, depois extrair IOCs',
          'Detonar em sandbox, extrair IOCs (URLs/hashes), enriquecer (WHOIS/VT), verificar se algum usuário interagiu (proxy/EDR) e só então bloquear e caçar',
          'Responder ao remetente pedindo contexto e aguardar',
          'Encaminhar ao time de negócios para validar o conteúdo',
        ],
        answer: 1,
        explain:
          'Sandbox primeiro (sem risco), IOCs em seguida, enriquecimento para contexto, e a etapa que separa triagem de incidente: impact assessment — descobrir se alguém JÁ interagiu antes de responder em massa.',
      },
      {
        q: 'Por que o SPF frequentemente falha em e-mails legitimos que foram reencaminhados (forwarding)?',
        options: [
          'Porque o forwarding altera o corpo da mensagem',
          'Porque o servidor que reencaminha não está autorizado no registro SPF do domínio do envelope original — SPF valida o transmissor, não a cadeia',
          'Porque o DKIM expira a cada reencaminhamento',
          'Porque o DMARC bloqueia todo forwarding por padrão',
        ],
        answer: 1,
        explain:
          'SPF avalia o IP que está transmitindo contra o domínio do envelope. No forwarding, um novo servidor transmite sem estar no SPF do remetente original. DKIM sobrevive (corpo intacto) e é por isso que DMARC com DKIM resolve o forwarding.',
      },
      {
        q: 'Após confirmar um phishing de credenciais em que 3 funcionários digitaram a senha, qual ação é PRIORITÁRIA e imediata?',
        options: [
          'Educar os usuários com um quiz na semana seguinte',
          'Reset das senhas + revogação de tokens/sessões ativas dos 3 usuários, além do bloqueio dos IOCs',
          'Aguardar o relatório semanal para incluir no ticket',
          'Bloquear apenas o anexo original na borda',
        ],
        answer: 1,
        explain:
          'Credencial digitada = acesso provável do adversário. O relógio do incidente começa: reset + revogação de sessão/token mata o acesso ativo. Bloquear só o anexo não remove o atacante que já entrou.',
      },
    ],
  },
  {
    id: 'f3',
    num: '3',
    name: 'Cripta do Malware',
    short: 'MALWARE',
    area: 'Análise de Malware & YARA',
    certRef: 'BTL1 (Malware Analysis) · GIAC GCIH',
    bannerColor: '#7c3aed',
    intro:
      'Autópsia técnica do binário: estática, dinâmica, sandbox e a arte de escrever regras YARA que caçam famílias inteiras.',
    passScore: PASS_SCORE_PADRAO,
    coins: 45,
    lessons: [
      {
        id: 'l1',
        title: 'Análise estática: quem é o binário sem executá-lo',
        minutes: 7,
        body: [
          'Análise estática examina o arquivo sem rodar. Primeiro o fingerprint: MD5/SHA-1/SHA-256 para intel e dedupe (hash idêntico = mesma amostra já catalogada). Depois strings: URLs, comandos, chaves de registro e mensagens — versão em ASCII e UTF-16 (binários Windows carregam strings wide).',
          'Em PE (Windows): importe a tabela de funções (IAT) para inferir capacidade — VirtualAlloc + WriteProcessMemory + CreateRemoteThread gritam process injection; WinExec/URLDownloadToFile indicam dropper. Metadados (compile timestamp, seções com entropia alta = packed) orientam a próxima etapa.',
          'Entropia por seção > 7.2 costuma indicar empacotamento (UPX, crypter) — o que explica strings vazias e manda a amostra para detonation.',
        ],
        code: {
          lang: 'bash',
          caption: 'Fingerprint e strings na bancada Linux',
          content: `# hashes (dedupe + intel)
sha256sum sample.exe ; md5sum sample.exe

# strings ASCII e UTF-16LE filtradas
strings -n 8 sample.exe | egrep -i 'http|https|\\.exe|HKEY|cmd|powershell' | sort -u
strings -e l -n 8 sample.exe | head -40

# entropia por seção (packed?) — via radare2
r2 -q -c 'iS; p= entropy sample.exe' sample.exe 2>/dev/null || \
python3 - <<'EOF'
import math,collections
d=open('sample.exe','rb').read()
c=collections.Counter(d); n=len(d)
e=-sum((v/n)*math.log2(v/n) for v in c.values())
print(f'entropia global: {e:.2f} (packed se >7.2)')
EOF`,
        },
        keyPoints: [
          'SHA-256 é o fingerprint canônico; hash igual = amostra conhecida.',
          'Strings wide (UTF-16) são metade das strings em binários Windows.',
          'IAT revela capacidade: injection, download, execução.',
          'Entropia alta = packed → siga para análise dinâmica.',
        ],
      },
      {
        id: 'l2',
        title: 'Análise dinâmica e sandbox: o que o binário FAZ',
        minutes: 7,
        body: [
          'Análise dinâmica executa a amostra em ambiente controlado (VM com snapshot, rede simulada — INetSim/FAKeNet — e sem acesso à produção) para observar comportamento real: processos filhos, chaves de persistência (Run/RunOnce, serviços, tarefas agendadas), arquivos droppados e tráfego C2.',
          'Sandbox online (ANY.RUN, Joe Sandbox, Hybrid Analysis) acelera a triagem, mas tem armadilhas: malwares com anti-VM (checar CPUID, RAM, artefatos VMware) e malwares que exigem interação (clickfix, decoy document) não detonam sozinhos. Behavior report mapeia para ATT&CK — uma execução que cria scheduled task + contata domínio novo = T1053 + C2 para hunting.',
          'O output que interessa ao blue team: IOCs de rede (domínio/IP/URI do C2), IOCs de host (paths, chaves, mutex) e TTPs. IOC alimenta bloqueio; TTP alimenta detecção comportamental.',
        ],
        keyPoints: [
          'VM com snapshot + rede simulada = bancada segura.',
          'Anti-VM e malware que exige interação enganam sandbox automático.',
          'Persistência observada (Run key, service, scheduled task) é prioridade de detecção.',
          'Report vira três coisas: IOC de rede, IOC de host e TTPs (ATT&CK).',
        ],
      },
      {
        id: 'l3',
        title: 'YARA: escrevendo regras que caçam famílias',
        minutes: 8,
        body: [
          'YARA é o grep de malware: descreve padrões (strings, byte sequences, PE features) e identifica amostras que casam. Uma regra boa equilibra especificidade e cobertura: pega a família, não só o hash — sobrevive a rebuilds com pequenas mudanças.',
          'Estrutura: meta (autor, data, referência), strings ($s1 = "..." ascii / wide, $hex = { 6A 40 68 ?? 35 }), condição (all of them, 2 of ($s*), uint16(0)==0x5A4D para PE). Condicionais PE (pe.imports, pe.sections) exigem módulo pe. Falsos positivos se combatem com contexto: exija combinação de strings incomuns, não uma string genérica.',
          'No blue team, YARA roda em três lugares: varredura de endpoints (Loki/YARA-Nyx), varredura de repositórios/e-mails em massa e integração com sandbox/EDR (custom detections). Valide a regra contra um corpus benigno (System32, instaladores) antes de escalar — regra que grita lobo é regra desligada.',
        ],
        code: {
          lang: 'yara',
          caption: 'Regra YARA: loader PowerShell-ofuscado em PE',
          content: `rule Capy_Loader_PS_Obfuscated
{
  meta:
    author      = "CAPYBER Blue Team"
    date        = "2025-11"
    reference   = "Trilha 3D - Fase 3"
    family      = "generic ps loader"
    severity    = "high"

  strings:
    $pe_mz       = { 4D 5A }
    $ps_obf1     = "frombase64string" nocase ascii wide
    $ps_obf2     = "invoke-expression" nocase ascii wide
    $ps_iex      = /\\(\\s*iex\\s+\\[convert\\]/ nocase
    $dl_cradle   = /downloadfile|downloadstring|net\\.webclient/ nocase

  condition:
    $pe_mz at 0 and filesize < 3MB and
    2 of ($ps_obf*, $ps_iex) and $dl_cradle
}`,
        },
        keyPoints: [
          'Regra YARA = strings + condição; equilibre cobertura e FP.',
          'Ancore no magic MZ (4D 5A) para regras de PE.',
          'Quantificadores (2 of ($s*)) dão resiliência a rebuilds.',
          'Valide contra corpus benigno antes de distribuir.',
        ],
      },
    ],
    exam: [
      {
        q: 'Na tabela de imports de um PE você encontra VirtualAllocEx, WriteProcessMemory e CreateRemoteThread. Qual inferência é mais tecnicamente correta?',
        options: [
          'É um instalador legítimo de driver',
          'Forte indicador de process injection — o binário escreve em outro processo e executa código remotamente (T1055)',
          'É um compilador, pois essas APIs são de compilação',
          'Indica apenas coleta de dados do sistema (T1082)',
        ],
        answer: 1,
        explain:
          'O trio alocação remota + escrita + thread remota é o padrão clássico de process injection (MITRE T1055). Nenhuma das outras leituras sustenta essa combinação de APIs.',
      },
      {
        q: 'Uma amostra roda no sandbox e não apresenta comportamento: sem rede, sem persistência, sem filhos. No host vítima real ela detona normalmente. Qual a explicação mais provável?',
        options: [
          'A amostra é um arquivo corrupto e não executa nada',
          'Evasão de sandbox: checagens anti-VM/anti-análise fazem o malware dormir ou sair em ambiente virtualizado',
          'O sandbox está com as definições de antivírus desatualizadas',
          'Malware só executa em horário específico do dia',
        ],
        answer: 1,
        explain:
          'Comportamento diferente entre sandbox e host real é a assinatura de evasão: checagem de artefatos de VM, sleep tricks, exigência de interação. Análise deve avançar para sandbox interativa/instrumentada.',
      },
      {
        q: 'Qual condição YARA é a base correta para uma regra que deve casar apenas com arquivos executáveis Windows (PE) válidos?',
        options: [
          'filesize > 0',
          'uint16(0) == 0x5A4D (magic "MZ" no offset 0)',
          'pe.number_of_sections > 0 sem checar magic',
          'strings.imphash() != "" em qualquer arquivo',
        ],
        answer: 1,
        explain:
          'O magic MZ (bytes 4D 5A lidos como uint16 little-endian = 0x5A4D) no offset 0 é a verificação canônica de PE. As demais condições casam arquivos arbitrários ou dependem do módulo pe em arquivos não-PE.',
      },
      {
        q: 'Na análise estática, strings ASCII retornou quase nada e a entropia das seções .text/.data está em 7.8. A conclusão operacional correta é:',
        options: [
          'O arquivo está vazio; descartar a amostra',
          'A amostra provavelmente está empacotada/criptografada (packed) — seguir para análise dinâmica e unpacking',
          'Strings wide nunca existem em binários Windows',
          'A entropia alta prova que é um falso positivo',
        ],
        answer: 1,
        explain:
          'Entropia > ~7.2 por seção é o marcador clássico de packing/cifragem. Strings ausentes corroboram. O caminho é detonar/desempacotar para recuperar a carga real antes de escrever regras.',
      },
      {
        q: 'Qual par de artefatos de uma análise dinâmica é MAIS valioso, respectivamente, para (a) bloqueio imediato na borda e (b) detecção comportamental duradoura?',
        options: [
          '(a) TTPs, (b) hash SHA-256',
          '(a) IOCs de rede do C2 (domínio/IP/URI), (b) TTPs mapeados no ATT&CK',
          '(a) nome do arquivo, (b) tamanho em bytes',
          '(a) hash MD5, (b) hash MD5 de novo',
        ],
        answer: 1,
        explain:
          'IOC de rede dá bloqueio imediato (DNS/proxy/firewall). TTPs (ex.: scheduled task + beacon em intervalo) sustentam detecção comportamental que sobrevive a troca de infraestrutura — a lógica do Pyramyd of Pain aplicada a malware.',
      },
    ],
  },
  {
    id: 'f4',
    num: '4',
    name: 'Caverna dos Logs',
    short: 'LOGS',
    area: 'Análise de Logs Windows, Sysmon & KQL',
    certRef: 'Microsoft SC-200 · CompTIA CySA+',
    bannerColor: '#0e7490',
    intro:
      'O invasor deixa rastro no Windows: Event IDs, LogonTypes, Sysmon e consultas KQL que expõem movimento lateral.',
    passScore: PASS_SCORE_PADRAO,
    coins: 45,
    lessons: [
      {
        id: 'l1',
        title: 'Event IDs essenciais do Windows Security',
        minutes: 7,
        body: [
          'Autenticação: 4624 (logon sucesso), 4625 (falha), 4648 (logon com credenciais explícitas — clássico de ferramentas como runas/mimikatz), 4672 (logon com privilégios especiais). O LogonType conta COMO: 2 = interativo (console), 3 = rede (SMB/compartilhamentos), 10 = RDP, 5 = serviço. Pass-the-hash aparece como 4624 LogonType 3 com NTLM em conta sensível.',
          'Gestão de identidade e sistema: 4720 (conta criada), 4728/4732 (membro adicionado a grupo), 4740 (conta bloqueada), 4768/4769/4771 (Kerberos TGT/TGS e falhas — Kerberoasting aparece como rajada de 4769 com encriptação RC4), 7045 (System Event Log: novo serviço instalado — persistência favorita) e 1102 (log limpo — anti-forense).',
          'A combinação importa mais que o evento isolado: 4720 + 4732 no Domain Admins + 7045 em minutos = sequência de intrusão típica. É isso que a regra de correlação deve capturar.',
        ],
        keyPoints: [
          '4624/4625 com LogonType: 3 = rede, 10 = RDP, 5 = serviço.',
          '4648 + conta sensível = uso de credencial explícita (investigue).',
          'Rajada de 4769 com RC4 = suspeita de Kerberoasting.',
          '7045 (novo serviço) e 1102 (log limpo) são alertas de alta fidelidade.',
        ],
      },
      {
        id: 'l2',
        title: 'Sysmon: telemetria que o Security log não traz',
        minutes: 7,
        body: [
          'O Sysmon (Sysinternals) enriquece o Windows com eventos operacionais: Event ID 1 (criação de processo COM command line + hash do binário), 3 (conexão de rede POR PROCESSO — com IP/porta/processo pai), 7 (image loaded — DLLs carregadas), 8 (CreateRemoteThread — injection), 10 (ProcessAccess com GRAntedAccess suspeito — acesso à LSASS), 11 (file create), 13 (registry set) e 22 (DNS query por processo).',
          'Event ID 10 com TargetImage terminando em lsass.exe e GrantedAccess 0x1010/0x1FFFFF é o sinal direto de credential dumping (mimikatz). Event ID 3 mostra o beacon saindo de qual processo — powershell.exe falando com IP novo às 3h é alerta de cargo.',
          'A configuração faz a diferença: o SwiftOnSecurity sysmon-config é o ponto de partida comunitário. Sysmon sem filtragem gera volume imenso; com exclusões bem feitas, vira a melhor fonte de detecção comportamental do Windows.',
        ],
        code: {
          lang: 'kql',
          caption: 'KQL — acesso à LSASS e processo falando com C2',
          content: `// Credential dumping: ProcessAccess na LSASS (Sysmon 10)
DeviceEvents
| where ActionType == "ProcessAccessedViaAzure"
    or ActionType == "ProcessAccess"
| where InitiatingProcessAccountName != "SYSTEM"
| where tostring(AdditionalFields.TargetImage) endswith "\\\\lsass.exe"
| project TimeGenerated, DeviceName,
          InitiatingProcessFileName, AccountName
| sort by TimeGenerated desc

// Beacon de processo: powershell abrindo conexão externa (Sysmon 3)
DeviceNetworkEvents
| where InitiatingProcessFileName in~ ("powershell.exe","cmd.exe","wscript.exe")
    and RemoteIPType == "Public"
    and RemotePort in (443, 80, 8080)
| summarize conexoes = count(),
          destinos = dcount(RemoteIP) by DeviceName,
          InitiatingProcessFileName, bin = tostring(InitiatingProcessFileName)
| where conexoes > 50 and destinos == 1`,
        },
        keyPoints: [
          'Sysmon 1 (cmdline + hash), 3 (rede por processo), 7 (DLLs), 10 (ProcessAccess), 11 (arquivos), 13 (registro), 22 (DNS).',
          'Sysmon 10 → lsass.exe com GrantedAccess agressivo = credential dumping.',
          'Sysmon 3 liga processo ← → destino: quem gerou o tráfego.',
          'Config filtrada (SwiftOnSecurity) equilibra cobertura e volume.',
        ],
      },
      {
        id: 'l3',
        title: 'KQL de caça: lateral movement e execução suspeita',
        minutes: 8,
        body: [
          'KQL (Kusto) é a linguagem do Sentinel/Defender. A lógica de caça de movimento lateral: logons de rede (4624 tipo 3) de uma mesma origem para MUITOS destinos em janela curta; uso de admin$ ; execução de ferramentas remotas (psexec, wmic /node, winrm).',
          'Execução suspeita de ofuscamento: powershell.exe com -enc/-w hidden/-nop, rundll32 com DLL inexistente em %temp%, mshta/wscript com URL. O padrão "binário do sistema + command line anômala + pai inesperado" (ex.: word.exe → cmd.exe → powershell.exe) é a essência da detecção de documento malicioso.',
          'Sempre normalize: contas de serviço geram ruído em qualquer regra. Exclua com documentação e trate toda exclusão como risco aceito com dono e data de revisão.',
        ],
        code: {
          lang: 'kql',
          caption: 'KQL — varredura de movimento lateral (SMB/admin$)',
          content: `// Um host logando em muitos hosts em 10 min = pivô
let janela = 10m;
SecurityEvent
| where EventID == 4624 and LogonType == 3
    and TimeGenerated > ago(1h)
| where TargetUserName !endswith "$"        // exclui contas de máquina
| summarize hosts = dcount(Computer),
          destinos = make_set(Computer) by
          origem = IpAddress, conta = TargetUserName, bin = bin(TimeGenerated, janela)
| where hosts >= 5
| project TimeGenerated = bin, origem, conta, hosts
| sort by hosts desc`,
        },
        keyPoints: [
          'Lateral = poucos logins de uma origem para muitos destinos (dcount).',
          'Pai anômalo + cmdline ofuscada > assinatura de nome de arquivo.',
          'word/excel → cmd/powershell é o pipeline de documento malicioso.',
          'Toda exclusão de FP vira registro com dono e data de revisão.',
        ],
      },
    ],
    exam: [
      {
        q: 'Um servidor de arquivos registra vários 4624 com LogonType 3 para uma conta de administrador a partir de um IP de estação de trabalho fora do padrão, seguidos de acesso a \\admin$. Qual hipótese tem prioridade?',
        options: [
          'Backup agendado do antivírus',
          'Movimento lateral com possível pass-the-hash / uso de credencial de admin — iniciar investigação e contenção de credencial',
          'Sincronização de hora do domínio',
          'Reboot do servidor',
        ],
        answer: 1,
        explain:
          'LogonType 3 (rede) com conta privilegiada + origem inesperada + acesso a admin$ é o padrão de lateral movement. Backup geraria conta de serviço; NTP e reboot não fazem logon interativo de rede com admin$.',
      },
      {
        q: 'No Sysmon, um Event ID 10 mostra GrantedAccess 0x1FFFFF com TargetImage C:\\Windows\\system32\\lsass.exe e processo de origem desconhecido. Isso indica:',
        options: [
          'Compilação de driver de filtro de teclado',
          'Tentativa (provável sucesso) de credential dumping na LSASS — manusear como incidente possível e validar o processo de origem',
          'Atualização de definição do Defender',
          'Reinicialização do serviço de log de eventos',
        ],
        answer: 1,
        explain:
          'ProcessAccess com acesso total/profundidade na LSASS por processo desconhecido é o caminho do mimikatz e derivados. 0x1FFFFF = PROCESS_ALL_ACCESS. Verificar o binário de origem, isolar e rotacionar credenciais.',
      },
      {
        q: 'Qual par Event ID + contexto melhor detecta a instalação de persistência via serviço no Windows?',
        options: [
          '4624 tipo 2 no fim do expediente',
          '7045 — "Serviço instalado no sistema" — com ServiceFileName apontando para %TEMP% ou cmd.exe/powershell.exe',
          '5140 (compartilhamento acessado) em servidor de arquivos',
          '1102 (log de segurança limpo) em estação de trabalho',
        ],
        answer: 1,
        explain:
          'O 7045 registra a criação de serviço; a persistência maliciosa quase sempre aponta binário em path de usuário (%TEMP%, %APPDATA%) ou invoca interpretador. 5140 é acesso a compartilhamento; 1102 é anti-forense (alerta, mas não instalação).',
      },
      {
        q: 'Qual consulta KQL melhor expõe um host fazendo movimento lateral em SMB pela rede?',
        options: [
          'Contar eventos de impressão por usuário',
          'Sumarizar 4624 LogonType 3 por IP de origem com dcount(Computer) >= N em janela curta, excluindo contas de máquina e PAM',
          'Somar volume de tráfego HTTP por dia',
          'Listar eventos 4771 (falha Kerberos) de uma conta só',
        ],
        answer: 1,
        explain:
          'Lateral movement tem assinatura estatística: uma origem, muitos destinos, logons de rede, janela curta. dcount por origem com exclusões documentadas é o padrão de caça — as outras opções medem ruído sem relação com pivô.',
      },
      {
        q: 'Você vê word.exe criando cmd.exe que executa powershell.exe -nop -w hidden -enc <base64>. Qual avaliação é correta?',
        options: [
          'Cadeia normal de instalação do Office',
          'Pipeline clássico de documento malicioso: dropper Office → shell → PowerShell ofuscado; isolas o host e caço por outros hosts com o mesmo padrão de execução',
          'É apenas o corretor automático compilando plugin',
          'Basta ignorar, pois PowerShell é assinado pela Microsoft',
        ],
        answer: 1,
        explain:
          'A relação pai-filho (Office → cmd → powershell) com -w hidden e -enc é o pipeline de macro/dropper. O binário assinado é da Microsoft, mas o COMANDO é do atacante — assinatura do binário não valida a execução.',
      },
    ],
  },
  {
    id: 'f5',
    num: '5',
    name: 'Correnteza de Rede',
    short: 'REDE',
    area: 'Forense & Análise de Tráfego de Rede',
    certRef: 'CompTIA CySA+ · eCIR (Network Analysis)',
    bannerColor: '#0d6b2e',
    intro:
      'O tráfego não mente: pcap, Zeek e NetFlow revelam C2, beaconing, DNS tunneling e exfiltração que o endpoint não vê.',
    passScore: PASS_SCORE_PADRAO,
    coins: 45,
    lessons: [
      {
        id: 'l1',
        title: 'As três lentes: pcap, Zeek e NetFlow',
        minutes: 6,
        body: [
          'pcap é a captura bruta de pacotes (Wireshark/tcpdump) — máxima profundidade, alto custo de storage e análise. Zeek (Bro) transforma tráfego em LOGS estruturados por protocolo: conn.log (conexões), dns.log, http.log, ssl.log, files.log — é a lente padrão de um SOC maduro. NetFlow/IPFIX resume METADADOS (quem falou com quem, quando, quanto volume) sem conteúdo — ideal para escala e caça estatística.',
          'Regra de ouro do triage: comece pelo NetFlow (anomalia de volume/conexões), aprofunde no Zeek (contexto de protocolo) e só vá ao pcap quando precisar do payload exato. A cadeia flow → log → packet mantém o analista rápido.',
          'Filtros que valem ouro no Wireshark: http.request ou dns.qry.name contains "suspeito"; ssl.handshake.type == 1 para ClientHellos; tcp.flags.syn==1 && tcp.flags.ack==0 para varreduras.',
        ],
        keyPoints: [
          'NetFlow = metadados em escala; Zeek = logs por protocolo; pcap = payload bruto.',
          'Fluxo de análise: anomalia em flow → contexto em Zeek → prova em pcap.',
          'conn.log tem a métrica do beacon: orig/resp bytes e duração por conexão.',
          'dns.log expõe domínios novos e consultas TXT gigantes (tunneling).',
        ],
      },
      {
        id: 'l2',
        title: 'C2 e beaconing: intervalo, jitter e JA3',
        minutes: 7,
        body: [
          'Malware beacona: conexões periódicas ao C2 com intervalo fixo + jitter (variação aleatória para escapar). No conn.log/NetFlow, o padrão é conexão pequena (check-in de poucos bytes) repetida a cada N±10% segundos por horas. Detecção: desvio padrão dos intervalos baixo + contagem alta + payload pequeno.',
          'JA3/JA3S fingerprintam o handshake TLS (versões, cifras, extensões) do CLIENTE — malware em biblioteca customizada tem JA3 diferente do Chrome legítimo. Combinar JA3 + destino novo + SNI duvidoso derruba C2 cifrado sem precisar do payload.',
          'Canais de disfarce: C2 sobre HTTPS (443 legítimo), DNS over HTTPS, services de tunneling (ngrok-like), CDN/domínio novo com certificate transparency recente. Domínio registrado há 2 dias + JA3 raro + beacon periódico = conclusão.',
        ],
        code: {
          lang: 'bash',
          caption: 'Zeek — detecção estatística de beaconing',
          content: `# em um ambiente Zeek (ou com zkg install policy/misc/detect-beaconing)
# conn.log: uma origem falando N vezes com payload pequeno e intervalo estável
cat conn.log | zeek-cut id.orig_h id.resp_h duration orig_bytes ts \\
 | awk '$3<1 && $4<300 {print $1, $2}' | sort | uniq -c | sort -rn | head

# intervalo entre conexões do par suspeito (jitter baixo = beacon)
zeek-cut -r conn.log ts id.orig_h id.resp_h \\
 | grep '10.0.5.44\\t185.220.x.x' | awk '{print $1}' \\
 | python3 -c "
import sys,datetime,statistics as st
ts=[datetime.datetime.fromisoformat(l.strip()) for l in sys.stdin]
d=[(b-a).total_seconds() for a,b in zip(ts,ts[1:])]
print('n=%d media=%.1fs desvio=%.1f' % (len(d),st.mean(d),st.stdev(d)))"

# JA3 dos ClientHellos (zeek
zeek-cut -r ssl.log ja3 id.orig_h server_name | sort | uniq -c | sort -rn | head`,
        },
        keyPoints: [
          'Beacon = intervalo estável (baixo desvio) + check-ins pequenos + repetição longa.',
          'Jitter existe para derrotar threshold simples — use estatística, não contagem.',
          'JA3 identifica o cliente TLS mesmo sem payload legível.',
          'Domínio novo (CT log recente) + beacon = C2 provável.',
        ],
      },
      {
        id: 'l3',
        title: 'Exfiltração e DNS tunneling',
        minutes: 6,
        body: [
          'Exfiltração clássica: upload para serviço de storage (mega, anonfiles), e-mail, e o sorrateiro DNS tunneling — dados codificados em subdomínios (ex.: aGVsbG8.secret.example.com) via consultas TXT/NULL. Sinais: volume de consultas TXT anômalo, tamannho de query raro (> 60 bytes), entropia alta de subdomínio, um host consultando milhares de subdomínios de UM domínio.',
          'No http.log, exfil POST: uploads com body grande para domínio novo/arquivo-no-mal (file.php?name=...), user-agent inconsistente, e horário fora da janela do usuário. No NetFlow: saída de volume anômala por host/dia (baseline por setor).',
          'DLP e segmentação reduzem o sucesso, mas a DETECÇÃO vem de baseline: o que é "normal" de sair da sua rede por dia/hora. Sem baseline, exfileração lenta (low and slow) passa invisível.',
        ],
        keyPoints: [
          'DNS tunneling: TXT/NULL, subdomínios únicos e longos, um domínio só.',
          'Baseline de volume de saída por host/setor = fundação da detecção de exfil.',
          'POST grande para domínio novo fora de janela = exfil suspeita.',
          'Low and slow exige baseline temporal, não regra estática.',
        ],
      },
    ],
    exam: [
      {
        q: 'Um host corporativo gera 1 conexão TLS a cada 60±3 segundos por 14 horas, com ~200 bytes enviados por conexão, sempre para o mesmo IP externo. A avaliação mais correta:',
        options: [
          'Tráfego normal de keepalive do sistema operacional',
          'Beaconing de C2 clássico: intervalo estável (jitter baixo), check-in pequeno e persistência temporal — extrair SNI/JA3 e bloquear/caçar outros hosts',
          'Vazamento do MTU do link',
          'Sincronização NTP mal configurada',
        ],
        answer: 1,
        explain:
          'Intervalo fixo com jitter mínimo, payload mínimo e repetição longa é a assinatura estatística do beacon. NTP/keepalive não falam TLS para IP externo único por 14h; MTU não gera conexões periódicas.',
      },
      {
        q: 'Qual característica no dns.log é o indicador mais forte de DNS tunneling?',
        options: [
          'Aumento de consultas ao domínio do antivírus',
          'Milhares de subdomínios ÚNICOS e longos (alta entropia) sob UM mesmo domínio, majoritariamente TXT/NULL',
          'Consultas AAAA para servidores da Microsoft',
          'TTL baixo em registros MX do provedor de e-mail',
        ],
        answer: 1,
        explain:
          'O tunneling codifica dados no NOME da consulta: subdomínios únicos, longos e de alta entropia sob um domínio controlado pelo atacante, com tipos TXT/NULL. MX/AAAA de provedores conhecidos são ruído cotidiano.',
      },
      {
        q: 'Em um SOC sem capacidade de guardar pcap completo, qual cadeia de análise é a mais eficiente para investigar uma conexão suspeita?',
        options: [
          'Pular direto ao pcap do dia inteiro e filtrar manualmente',
          'NetFlow (anomalia de volume/destinos) → Zeek logs (contexto de protocolo, SNI, JA3, HTTP) → pcap cirúrgico do fluxo específico se necessário',
          'Somente logs de firewall com contagem de pacotes',
          'Pedir ao usuário um print da tela do navegador',
        ],
        answer: 1,
        explain:
          'A pirâmide flow → log → packet otimiza storage e tempo: flow acha a anomalia, Zeek dá o contexto (domínio, URI, handshake), e pcap só do fluxo específico serve como prova final.',
      },
      {
        q: 'JA3 de um processo corporativo difere do JA3 padrão do Chrome/Edge da organização e o SNI aponta para um domínio registrado há 3 dias. Conclusão técnica:',
        options: [
          'Chrome atualizou a lista de cifras; nada a fazer',
          'Fingerprint TLS incomum + infraestrutura recém-criada = C2 provável; priorizar isolamento do host e caçar o padrão em outros endpoints',
          'JA3 não se aplica a tráfego HTTPS legítimo',
          'Basta liberar no proxy para o usuário continuar trabalhando',
        ],
        answer: 1,
        explain:
          'JA3 identifica a pilha TLS do cliente. Bibliotecas de malware têm fingerprints próprios. Combinação com domínio novo (CT log) é correlação de alta fidelidade de C2 — as demais opções ignoram a evidência.',
      },
      {
        q: 'Qual uso do NetFlow é mais adequado para detectar exfiltração "low and slow" ao longo de semanas?',
        options: [
          'Alertar em qualquer conexão externa',
          'Baseline diário de volume de saída por host/setor e alertar desvios consistentes (ex.: +300% na média móvel de 14 dias)',
          'Procurar apenas downloads grandes de entrada',
          'Desligar a coleta à noite para economizar',
        ],
        answer: 1,
        explain:
          'Exfil lenta não estoura alertas instantâneos: ela desloca o baseline. Médias móveis de volume de SAÍDA por host/setor expõem o desvio cumulativo — exatamente o caso que regras estáticas perdem.',
      },
    ],
  },
  {
    id: 'f6',
    num: '6',
    name: 'Bastião da Resposta',
    short: 'IR/NIST',
    area: 'Resposta a Incidentes (NIST SP 800-61)',
    certRef: 'GIAC GCIH · ISO/IEC 27035',
    bannerColor: '#b45309',
    intro:
      'Da detecção à lição aprendida: o ciclo NIST 800-61, contenção cirúrgica, cadeia de custódia e o relatório que sobrevive ao tribunal.',
    passScore: PASS_SCORE_PADRAO,
    coins: 50,
    lessons: [
      {
        id: 'l1',
        title: 'O ciclo NIST SP 800-61r2',
        minutes: 7,
        body: [
          'Fase 1 — Preparação: playbook, contato, ferramentas, baseline, retainer de forense. É a fase que decide a velocidade das outras. Fase 2 — Detecção & Análise: o alerta vira incidente por escopo/impacto; linha do tempo (TPM: quando entrou, o que tocou, de onde veio) com correlação de logs, EDR e rede.',
          'Fase 3 — Contenção, Erradicação e Recuperação: contenção (estratégia por impacto — isolar host, bloquear conta/domínio, derrubar VPN), evidência preservada ANTES da limpeza (memória antes de disco!), erradicação (remover persistência, fechar vetor) e recuperação (restaurar com monitoração reforçada — reinfecção acontece quando o vetor fica aberto).',
          'Fase 4 — Atividade Pós-Incidente: relatório, lições aprendidas, atualização de detecções e playbooks. Incidente sem retroalimentação vai se repetir com o mesmo vetor. Métricas: MTTD, MTTR, tempo de contenção.',
        ],
        keyPoints: [
          'Preparação define a velocidade: playbook + contatos + retainer.',
          'Preserve evidência antes de limpar: memória RAM antes do desligamento.',
          'Recuperação sem fechar o vetor = reinfecção garantida.',
          'Pós-incidente vira detecção nova — o loop que melhora o SOC.',
        ],
      },
      {
        id: 'l2',
        title: 'Contenção cirúrgica: decidir sob pressão',
        minutes: 6,
        body: [
          'Contenção tem trade-off: agir rápido corta o dano, mas queima a chance de observar o adversário e mapear o alcance completo. A decisão depende de criticidade do ativo, evidência do alcance e fase do ataque — ransomware com criptografia em curso = contenção imediata em massa; intrusão silenciosa em segmento monitorado = observação controlada com blocker de C2.',
          'Playbook mínimo de contenção: (1) isolar host via EDR (rede off, agente vivo); (2) revogar sessões/tokens e resetar credenciais do usuário afetado; (3) bloquear IOCs na borda (DNS, proxy, firewall); (4) snapshot/forensic image antes de reimagem; (5) registrar cada ação com horário e responsável.',
          'Comunicação: canal DEDICADO fora do ambiente possivelmente comprometido (o atacante lê o e-mail corporativo). Jurídico/compliance entram cedo se PII/dados regulados aparecerem.',
        ],
        keyPoints: [
          'Isolar ≠ desligar: agente EDR vivo mantém visibilidade e memória.',
          'Revogação de sessão/token junto com reset — senha nova não mata sessão ativa.',
          'Forensic image antes de reimagem; sem isso, a evidência morre.',
          'Comunicação por canal externo ao possível escopo do invasor.',
        ],
      },
      {
        id: 'l3',
        title: 'Evidência, cadeia de custódia e relatório',
        minutes: 6,
        body: [
          'Evidência digital só vale se a cadeia de custódia provar origem e integridade: hash no momento da coleta (SHA-256), registro de quem coletou, quando, como e onde a evidência foi armazenada. Memória volátil primeiro (coleta com ferramenta validada), depois disco (imagem bit-a-bit com write blocker).',
          'O relatório de incidente estruturado: sumário executivo (impacto de negócio), linha do tempo técnica (UTC! — horários sem fuso quebram a análise cruzada), escopo confirmado, vetor inicial, dados afetados, ações de resposta, evidências com hashes, recomendações priorizadas. Sumário para o board, detalhe para o técnico.',
          'Lições aprendidas têm dono e prazo — "melhorar detecção de T1053" vira regra nova no SIEM com data de entrega. Incidente fechado sem itens acionáveis é incidente destinado a se repetir.',
        ],
        keyPoints: [
          'Hash SHA-256 na coleta = integridade verificável depois.',
          'Memória antes de disco; write blocker sempre em imagem de disco.',
          'Linha do tempo em UTC com fonte citada por evento.',
          'Relatório tem dois públicos: executivo (impacto) e técnico (evidência).',
        ],
      },
    ],
    exam: [
      {
        q: 'Durante a resposta a uma intrusão confirmada em um servidor crítico, qual sequência de contenção/evidência segue a boa prática forense?',
        options: [
          'Reimagem imediata e depois tentar reconstituir os logs',
          'Isolar pela rede via EDR (mantendo o agente ativo), coletar memória volátil, fazer imagem forense de disco com hash, e só então erradicar/reimagemar',
          'Desligar o servidor na tomada para preservar tudo',
          'Executar antivírus completo e aguardar o resultado',
        ],
        answer: 1,
        explain:
          'Isolar via EDR preserva visibilidade; memória é volátil e morre no desligamento (tomada = destruição de evidência); imagem com hash garante integridade. Reimagem sem coleta destrói a linha do tempo.',
      },
      {
        q: 'Ransomware está cifrando arquivos AGORA em um file server. A decisão de contenção tecnicamente correta é:',
        options: [
          'Observar por 2 horas para mapear TTPs antes de agir',
          'Contenção imediata: isolar o host (e segmentos afetados) na rede, revogar sessões do usuário, e bloquear o C2/propagação (SMB, RDP) na borda',
          'Aguardar o fim da criptografia para analisar o ransomware em paz',
          'Apenas abrir ticket de prioridade normal',
        ],
        answer: 1,
        explain:
          'Criptografia em curso = dano ativo e irreversível por minuto: contenção imediata prevalece sobre observação (que serve para intrusões silenciosas em ativos não-críticos). Cada segundo cifra mais arquivos e propaga por SMB.',
      },
      {
        q: 'Por que revogar tokens/sessões ativas além de resetar a senha de um usuário comprometido?',
        options: [
          'Porque o reset de senha invalida automaticamente todas as sessões',
          'Porque sessões e tokens já emitidos podem continuar válidos após o reset — o adversário conectado permanece conectado até a revogação',
          'Porque tokens só expiram com o reboot do endpoint',
          'Porque a revogação aumenta a entropia da senha',
        ],
        answer: 1,
        explain:
          'Senha nova não expira cookie de sessão, token OAuth ou ticket Kerberos já emitidos. Resposta completa = reset + revogação de sessões/refresh tokens (e reautenticação forçada via MFA).',
      },
      {
        q: 'Na fase de Detecção & Análise do NIST 800-61, qual produto define melhor o ESCOPO do incidente?',
        options: [
          'O primeiro alerta do EDR com o binário malicioso',
          'Linha do tempo correlacionada (logs de identidade, EDR, rede, nuvem) respondendo: vetor inicial, contas/hosts tocados, direção de propagação e dados acessados',
          'A opinião do usuário que reportou',
          'O número total de alertas no SIEM no dia',
        ],
        answer: 1,
        explain:
          'Escopo é a fronteira do incidente no tempo e no espaço: quem entrou, onde circulou, o que acessou. Só a linha do tempo correlacionada de múltiplas fontes responde isso — o alerta inicial é só a ponta.',
      },
      {
        q: 'Qual elemento é OBRIGATÓRIO para que uma imagem de disco seja aceita como evidência com integridade demonstrável?',
        options: [
          'Compressão ZIP com senha forte',
          'Registro de cadeia de custódia + hash SHA-256 calculado na coleta (com write blocker)',
          'Screenshot do disco antes da imagem',
          'Envio por e-mail criptografado ao jurídico',
        ],
        answer: 1,
        explain:
          'Cadeia de custódia (quem/coleta/quando/armazenamento) + hash no momento da coleta provam que a evidência não foi alterada. Write blocker garante que a coleta não modificou a mídia. ZIP/screenshot não demonstram integridade forense.',
      },
    ],
  },
  {
    id: 'boss',
    num: '★',
    name: 'Cume do Caçador',
    short: 'HUNTING',
    area: 'Threat Hunting & Detection Engineering',
    certRef: 'BTL2 · eCIR (Threat Hunting)',
    bannerColor: '#8a1c2b',
    intro:
      'Chefe final: caça orientada a hipótese, ATT&CK Navigator, Pyramid of Pain aplicado e engenharia de detecção que fecha o loop com o purple team.',
    passScore: 70,
    coins: 100,
    lessons: [
      {
        id: 'l1',
        title: 'Hunting orientado a hipótese',
        minutes: 8,
        body: [
          'Threat hunting é busca PROATIVA por adversários que a detecção automática deixou passar. Parte de uma hipótese: "se houvesse persistência via scheduled task maliciosa, veríamos X nos logs". Métodos estruturados: TaHiTI (por threat intel e processo de negócio), PEAK (hypothesis, investigation, aggregated analytics), e o ciclo clássico: disparador (intel, anomalia, lacuna ATT&CK) → hipótese → coleta → análise → descoberta → nova detecção.',
          'Fontes de hipótese: threat intel aplicado (campaigns relevantes ao seu setor), lacunas no Navigator (células ATT&CK sem cobertura), anomalias estatísticas (processos raros por host — cardinality), e relatórios de IR (o que outros caíram, você também está exposto?).',
          'Resultado do hunt tem três destinos: descoberta de comprometimento (vira IR), nova detecção (vira regra no SIEM) ou melhoria de telemetria (vira requisito de log/Grupo de fontes). Hunt que não gera nenhum dos três é turismo.',
        ],
        keyPoints: [
          'Hunting = proativo + hipótese testável + dados suficientes.',
          'TaHiTI/PEAK dão estrutura; "procurar qualquer coisa" não é caça.',
          'Lacunas do Navigator e intel do setor alimentam hipóteses.',
          'Todo hunt termina em detecção nova, IR ou telemetria melhor.',
        ],
      },
      {
        id: 'l2',
        title: 'Detection engineering: da regra ao pipeline',
        minutes: 8,
        body: [
          'Detecção é engenharia: regra versionada em repositório (Git), revisada por pares, testada contra dados sintéticos (Atomic Red Team, Sigma datasets) e com dono. Sigma é o YAML portátil de detecção — escreve uma vez, converte para KQL/Splunk/Elastic.',
          'Pipeline da detecção: telemetria → regra/analytics → triage → feedback. Métricas de qualidade: taxa de FP por regra, tempo até detecção (MTTD), e cobertura ATT&CK (células cobertas × técnicas observadas em intel). Regra sem dono e sem revisão vira ruído em 6 meses.',
          'Purple teaming fecha o loop: o red executa técnicas (Atomic Red Team/Caldera) e o blue prova se a detecção disparou — resultado vira backlog: telemetria faltante, regra nova, exclusão corrigida. Detecção validada ≠ detecção escrita.',
        ],
        code: {
          lang: 'sigma',
          caption: 'Sigma — persistência via scheduled task suspeita',
          content: `title: Scheduled Task com binário em path de usuário
id: c0a1f1c4-3d5e-4c1e-9e77-capyber0001
status: experimental
description: Persistência T1053.005 com binário fora de system32
author: CAPYBER Blue Team
logsource:
    product: windows
    service: taskscheduler
detection:
    selection_action:
        ActionName|endswith:
            - '\\\\cmd.exe'
            - '\\\\powershell.exe'
    selection_path:
        Path|contains:
            - 'AppData\\\\Local'
            - 'Users\\\\Public'
    condition: all
falsepositives:
    - Instaladores legítimos de usuário (revisar por asset)
level: high
tags:
    - attack.persistence
    - attack.t1053.005`,
        },
        keyPoints: [
          'Detecção vive em Git: versionada, revisada, testada, com dono.',
          'Sigma = formato portátil; conversores geram KQL/Splunk/Elastic.',
          'Métricas: FP por regra, MTTD, cobertura ATT&CK × intel.',
          'Purple team (Atomic Red Team) valida detecção END-TO-END.',
        ],
      },
      {
        id: 'l3',
        title: 'Pyramid of Pain aplicado ao hunting',
        minutes: 6,
        body: [
          'Aplicação prática: bloquear o hash do malware é necessário e irrelevante em 24h (o invasor recompila). Bloquear o domínio do C2 força troca de infraestrutura. Detectar a TTP (ex.: criação de scheduled task com binário em path de usuário) dói de verdade — o invasor precisa mudar o COMO inteiro.',
          'O hunting maduro sobe a pirâmide: começa de um IOC (intel) e pergunta "qual TTP produz esse IOC?". A regra que captura a TTP cobre todos os variantes futuros da mesma técnica — é alavancagem de detecção.',
          'Fecho do curso: SOC maduro = telemetria certa (Sysmon/EDR/rede) + detecções versionadas com dono + hunting periódico com hipótese + purple team validando + métricas provando evolução (MTTD, cobertura). Isso é Blue Team em produção.',
        ],
        keyPoints: [
          'Hash morre rápido; domínio exige infra nova; TTP exige retrabalho total.',
          'De IOC para TTP: pergunte sempre qual técnica produz o indicador.',
          'Regra de TTP cobre variantes futuros — alavancagem real.',
          'SOC maduro: telemetria + detecção versionada + hunting + purple + métricas.',
        ],
      },
    ],
    exam: [
      {
        q: 'Qual é a definição operacional correta de threat hunting?',
        options: [
          'Responder alertas do SIEM em ordem de severidade',
          'Busca proativa e iterativa por adversários/atividades que evitaram as detecções existentes, partindo de hipóteses testáveis sobre os dados',
          'Coletar threat intel e publicar relatórios semanais',
          'Executar varredura de antivírus em todos os endpoints',
        ],
        answer: 1,
        explain:
          'Hunting parte do pressuposto de que o adversário já contornou as regras: busca proativa com hipótese, dados e método (TaHiTI/PEAK). Responder alerta é triagem, não caça; varredura AV é higiene.',
      },
      {
        q: 'Um hunt confirmou execução suspeita de rundll32 com DLL em %TEMP% em 4 hosts, sem comprometimento final confirmado. Qual é o desfecho CORRETO do ciclo de hunting?',
        options: [
          'Arquivar o resultado, pois não houve incidente',
          'Gerar os três desfechos do hunt: abrir investigação/IR dos 4 hosts, criar detecção dedicada no SIEM e, se a telemetria foi insuficiente, requisitar nova fonte',
          'Apenas bloquear o hash do rundll32.exe original da Microsoft',
          'Escalar ao Tier 1 como alerta comum e encerrar o hunt',
        ],
        answer: 1,
        explain:
          'Todo hunt produtivo termina em: IR (se achou atividade), detecção nova (industrializa a descoberta) e/ou telemetria (fecha lacuna). Bloquear hash de binário assinado da Microsoft não faz sentido; arquivar desperdiça a descoberta.',
      },
      {
        q: 'No ATT&CK Navigator, as células T1053.005 (Scheduled Task) e T1547.001 (Run Key) estão sem cobertura na sua organização. Isso significa tecnicamente que:',
        options: [
          'Essas técnicas nunca são usadas por invasores',
          'Não existem detecções/telemetria mapeadas para essas técnicas — são lacunas prioritárias para hunting e detecção (persistência é categoria de alta frequência)',
          'O Navigator precisa ser atualizado para incluir novas regras',
          'A organização está imune a essas técnicas por design',
        ],
        answer: 1,
        explain:
          'Célula vazia = lacuna de visibilidade/detecção. Persistência (T1053/T1547) está entre as técnicas mais usadas em intrusões reais — lacuna ali é prioridade máxima de hunting e de engenharia de detecção.',
      },
      {
        q: 'Qual artefato melhor valida END-TO-END que uma detecção de T1003.001 (LSASS dumping) funciona em produção?',
        options: [
          'Revisão manual do KQL da regra pelo analista sênior',
          'Execução da técnica com Atomic Red Team no lab/rede de teste confirmada pelo disparo do alerta no SIEM/EDR com o tempo registrado',
          'Leitura da documentação da Microsoft sobre LSASS',
          'Aprovação do jurídico para a regra entrar em produção',
        ],
        answer: 1,
        explain:
          'Purple teaming: executar a técnica real (simulação segura) e PROVAR que o alerta dispara com a telemetria esperada. Revisão de código ajuda, mas só a execução validada prova o caminho inteiro (evento → log → regra → alerta).',
      },
      {
        q: 'Um IOC do threat intel (IP de C2) foi detectado em 2 hosts. Aplicando o Pyramid of Pain, qual resposta maximiza o custo do adversário?',
        options: [
          'Bloquear o IP no firewall e encerrar o caso',
          'Subir a pirâmide: identificar a TTP que produziu a conexão (ex.: beacon TLS com JA3 raro + persistência) e criar detecção comportamental dessa técnica, além do bloqueio imediato',
          'Mudar o range de IP corporativo',
          'Solicitar ao provedor de internet o bloqueio global do IP',
        ],
        answer: 1,
        explain:
          'Bloqueio de IP é tático (o invasor troca de IP em minutos). Detectar a TTP (comportamento) força o adversário a redesenhar o ataque — é o topo da pirâmide e a alavancagem real do blue team.',
      },
      {
        q: 'Qual conjunto caracteriza um programa de detecção MADURO (não apenas funcional)?',
        options: [
          'Antivírus em todos os endpoints e backup diário',
          'Regras versionadas em Git com dono e testes, mapeamento ATT&CK com lacunas visíveis, hunting periódico com hipótese documentada e purple team validando detecções',
          'A maior quantidade possível de alertas de severidade crítica',
          'UM vendor de SIEM com todas as regras prontas do fabricante',
        ],
        answer: 1,
        explain:
          'Maturidade = processo: versionamento/dono (engenharia), cobertura ATT&CK (estratégia), hunting com hipótese (proatividade) e validação purple (confiança). Volume de alertas e regras prontas sem dono são anti-padrões.',
      },
    ],
  },
]

export const GAME_PHASE_TOTAL = GAME_PHASES.length

export function getPhase(id: string): GamePhase | undefined {
  return GAME_PHASES.find((p) => p.id === id)
}
