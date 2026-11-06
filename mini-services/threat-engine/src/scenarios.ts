// CAPYBER CORE — Cenários de ataque simulados (dados sintéticos de demonstração)
// Nenhum dado real de terceiros é utilizado — conformidade com o item 6.9 do Regulamento.
// v2: cada cenário carrega um PLAYBOOK completo — perguntas de triagem com delay,
// medidas de prevenção e runbook de resposta — igual a um incidente real de SOC.

import type { ScenarioDef, TargetPoint } from './types'

export const KILL_CHAIN = [
  'Reconhecimento',
  'Intrusão Inicial',
  'Escalação de Privilégios',
  'Movimentação Lateral',
  'Impacto',
  'Exfiltração',
]

export const TARGETS: Record<string, TargetPoint> = {
  SP01: { id: 'SP01', name: 'CRIPTOBR-SP01', org: 'CriptoBR Exchange', lat: -23.55, lon: -46.63 },
  RJDC: { id: 'RJDC', name: 'BANCOAI-RJDC', org: 'BancoAI S.A.', lat: -22.9, lon: -43.17 },
  BSBX: { id: 'BSBX', name: 'CAPHQ-BSBX', org: 'CapyHoldings — Matriz', lat: -15.79, lon: -47.88 },
}

export const SCENARIOS: ScenarioDef[] = [
  // Foco do objetivo CAPYBER: ameaças que nascem no DISPOSITIVO (endpoint) —
  // APTs de estado, hacktivistas e ameaças internas. Nada de perímetro de rede.
  {
    id: 'SC-DRAIN-03',
    title: 'Drainer Web3 — Aprovação de Contrato Malicioso',
    kind: 'Fraude Cripto',
    severity: 'CRITICA',
    mitre: { id: 'T1566', name: 'Phishing' },
    killChain: [0, 4, 5],
    origin: { country: 'Coreia do Norte', countryCode: 'KP', city: 'Pyongyang', lat: 39.03, lon: 125.75 },
    targetId: 'SP01',
    description:
      'Cliente recebeu link de "mint de NFT" que solicita setApprovalForAll para contrato drainer. Simulação de transação (Tenderly-style) reprovou a chamada.',
    mitigations: ['P26', 'P24', 'P25'],
    valueProtectedBRL: 3400000,
    playbook: {
      questions: [
        { q: 'A transação foi simulada e reprovada antes do broadcast?', why: 'É a única garantia real de que fundos não saíram da carteira.' },
        { q: 'O contrato drainer já está em listas de ameaças on-chain?', why: 'Permite bloquear todos os endereços ligados ao esquema de uma vez.' },
        { q: 'Outros clientes receberam o mesmo link?', why: 'Define o tamanho da campanha e se vira comunicado em massa.' },
      ],
      prevent: [
        'Simular TODA transação antes de assinar (Blockaid/Tenderly-style) e bloquear aprovacões a contratos não verificados.',
        'Blacklist on-chain atualizada por threat intel em tempo real.',
        'Educar clientes: nunca aprovar setApprovalForAll sem auditoria do contrato.',
        'Limites de saída por transação e por dia com confirmação extra (2º canal).',
      ],
      actions: [
        { step: 'Reprovar transação na simulação', detail: 'Motor de simulação marca a chamada como drenagem e impede a assinatura.', planRef: 'P26' },
        { step: 'Revogar aprovações ativas', detail: 'Verificar allowances abertos da carteira e revogar o que não for conhecido.', planRef: 'P24' },
        { step: 'Incluir drainer na blacklist', detail: 'Endereço e derivados entram na intel compartilhada com parceiros.', planRef: 'P25' },
        { step: 'Notificar o cliente', detail: 'Canal seguro explica o ocorrido e orienta verificação de dispositivo.' },
        { step: 'Monitorar réplicas', detail: 'Detectar novas variantes do contrato no mempool por 30 dias.' },
      ],
    },
    voice: {
      detect:
        'Alerta máximo. Tentativa de drenagem de carteira em andamento. Contrato malicioso simulando cunhagem de NFT. Origem presumida: grupo Lazarus. Simulação de transação reprovou a operação.',
      mitigating:
        'Aprovação de contrato revogada. Endereço do drainer incluído na blacklisting on-chain. Cliente notificado no canal seguro.',
      resolved:
        'Carteira preservada. Fundos intactos. Setenta e dois endereços ligados ao esquema adicionados à inteligência de ameaças.',
    },
  },
  {
    id: 'SC-PHSH-04',
    title: 'Spearphishing Dirigido ao CFO',
    kind: 'Engenharia Social',
    severity: 'ALTA',
    mitre: { id: 'T1566.001', name: 'Spearphishing com Anexo' },
    killChain: [0, 1],
    origin: { country: 'Nigéria', countryCode: 'NG', city: 'Lagos', lat: 6.52, lon: 3.37 },
    targetId: 'BSBX',
    description:
      'Anexo "Fatura_Boleto_PDF.html" com macro de roubo de sessão enviado ao CFO. Gateway de e-mail reprovou DMARC e detonou o anexo em sandbox.',
    mitigations: ['P20', 'P31', 'P37'],
    valueProtectedBRL: 410000,
    playbook: {
      questions: [
        { q: 'Alguém abriu o anexo antes da quarentena?', why: 'Se sim, o dispositivo do usuário entra em investigação imediata.' },
        { q: 'O remetente passou por quantos destinatários da empresa?', why: 'Mapeia o alcance real da campanha e quem precisa ser imunizado.' },
        { q: 'As credenciais canário foram acionadas?', why: 'Canário acionado = credenciais vazadas em outro lugar, reset geral.' },
      ],
      prevent: [
        'DMARC em modo reject + SPF/DKIM rigorosos em todos os domínios.',
        'Detonação de anexos em sandbox antes da entrega (safe links/safe attachments).',
        'FIDO2/passkey para diretoria — phishing-resistant por definição.',
        'Treinamento trimestral com simulações e relatório por squad.',
      ],
      actions: [
        { step: 'Quarentena no gateway', detail: 'Remover mensagem de todas as caixas e bloquear domínio do remetente.', planRef: 'P20' },
        { step: 'Identificar destinatários', detail: 'Listar todos que receberam a campanha e notificar com aviso de segurança.' },
        { step: 'Verificar dispositivos', detail: 'Checar telemetria EDR de quem interagiu com o anexo.', planRef: 'P6' },
        { step: 'Resetar credenciais preventivas', detail: 'Se houve interação, resetar senha e revogar tokens de sessão.', planRef: 'P3' },
        { step: 'Compartilhar indicadores', detail: 'Enviar IOCs ao MISP e à comunidade do setor financeiro.', planRef: 'P31' },
      ],
    },
    voice: {
      detect:
        'Atenção. Campanha de spearphishing dirigida à diretoria financeira. Anexo armadilhado detectado. Canário de credenciais acionado.',
      mitigating:
        'Mensagem quarentenada no gateway. Domínio remetente bloqueado. Todos os destinatários da campanha identificados e imunizados.',
      resolved:
        'Campanha de phishing contida. Zero cliques registrados. Indicadores compartilhados via MISP com parceiros do setor.',
    },
  },
  {
    id: 'SC-INSI-05',
    title: 'Ameaça Interna — Exportação de Chaves',
    kind: 'Insider Threat',
    severity: 'CRITICA',
    mitre: { id: 'T1567', name: 'Exfiltração por Serviço Web' },
    killChain: [2, 4, 5],
    origin: { country: 'Brasil', countryCode: 'BR', city: 'São Paulo — Interno', lat: -23.55, lon: -46.63 },
    targetId: 'SP01',
    description:
      'Contratado da squad de carteiras tentou exportar variáveis de ambiente com chaves KMS. UEBA detectou desvio de comportamento; DLP bloqueou a transferência.',
    mitigations: ['P33', 'P3', 'P10', 'P23'],
    valueProtectedBRL: 2600000,
    playbook: {
      questions: [
        { q: 'A exportação foi parcialmente concluída?', why: 'Define se a rotação de chaves é preventiva ou emergencial.' },
        { q: 'O usuário acessou dados fora do escopo do cargo?', why: 'Delimita o perímetro forense e a notificação ao jurídico.' },
        { q: 'Há outros acessos com o mesmo padrão de desvio?', why: 'Pode ser aliciamento de mais de um funcionário (padrão em caso reais).' },
      ],
      prevent: [
        'Just-in-time access: nenhum segredo permanente na máquina do dev, tudo via cofre com TTL curto.',
        'DLP com bloqueio de upload para serviços de armazenamento pessoal e IA pública.',
        'UEBA com baseline por função e alerta de desvio em tempo real.',
        'Separação de funções: quem opera chaves não aprova transfers (dual control).',
      ],
      actions: [
        { step: 'Encerrar sessão remota', detail: 'Matar sessões ativas do usuário em todos os sistemas.', planRef: 'P3' },
        { step: 'Suspender credenciais', detail: 'Revogar tokens, chaves SSH e certificados emitidos para o usuário.', planRef: 'P10' },
        { step: 'Rotacionar segredos expostos', detail: 'Cofre KMS rotaciona automaticamente as chaves tocadas.', planRef: 'P23' },
        { step: 'Preservar evidências', detail: 'Snapshot da máquina, logs imutáveis e cadeia de custódia.' },
        { step: 'Escalar para RH/Jurídico', detail: 'LGPD e contrato definem os próximos passos legais.', planRef: 'P33' },
      ],
    },
    voice: {
      detect:
        'Alerta crítico. Desvio de comportamento detectado em usuário interno. Tentativa de exportação de chaves criptográficas. Prevenção de perda de dados interveio.',
      mitigating:
        'Sessão encerrada remotamente. Credenciais revogadas. Cofre de segredos iniciou rotação imediata. Auditoria preservada para perícia.',
      resolved:
        'Ameaça interna neutralizada. Chaves rotacionadas. Acesso do usuário suspenso pendente investigação de recursos humanos.',
    },
    flagDeviceId: 'WS-002',
  },
  {
    id: 'SC-RNSM-06',
    title: 'Ransomware em Endpoint da Rede',
    kind: 'Ransomware',
    severity: 'CRITICA',
    mitre: { id: 'T1486', name: 'Dados Criptografados para Impacto' },
    killChain: [1, 2, 4, 5],
    origin: { country: 'Rússia', countryCode: 'RU', city: 'Moscou', lat: 55.75, lon: 37.61 },
    targetId: 'BSBX',
    description:
      'Binário de ransomware (afiliado LockBit-style) detonou via anexo em notebook. EDR detectou criptografia em massa, isolou o host e travou processos filhos.',
    mitigations: ['P6', 'P28', 'P34', 'P11'],
    valueProtectedBRL: 1950000,
    playbook: {
      questions: [
        { q: 'O host foi isolado automaticamente pelo EDR?', why: 'Isolamento automático impede propagação lateral — a decisão mais crítica do minuto.' },
        { q: 'Quais shares de rede o processo tocou?', why: 'Mapeia máquinas que precisam de varredura preventiva imediata.' },
        { q: 'O backup mais recente está íntegro e imutável?', why: 'Define o RTO real e elimina pressão por pagamento de resgate.' },
      ],
      prevent: [
        'EDR em modo bloqueio (não só detecção) com proteção anti-tamper ativa.',
        'Backups 3-2-1-1-0: três cópias, duas mídias, uma offsite, uma imutável, zero erros de restore testado.',
        'Allowlist de aplicações em máquinas sensíveis (nada não assinado executa).',
        'Segmentação: estação de usuário não alcança shares de produção com credencial do dia a dia.',
      ],
      actions: [
        { step: 'Isolar o host na rede', detail: 'EDR corta toda conectividade exceto canal de gerenciamento.', planRef: 'P6' },
        { step: 'Encerrar processos filhos', detail: 'Matar árvore do processo malicioso e preservar memória para perícia.' },
        { step: 'Varrer contatos do host', detail: 'Sweep em todo dispositivo que compartilhou arquivo com o afetado.', planRef: 'P28' },
        { step: 'Validar backups imutáveis', detail: 'Confirmar integridade e iniciar plano de restauração.', planRef: 'P34' },
        { step: 'Notificar autoridades', detail: 'Registro de criptoativo e LGPD definem obrigações de comunicação.', planRef: 'P11' },
      ],
    },
    voice: {
      detect:
        'Alerta máximo. Ransomware detonando em endpoint corporativo. Criptografia em massa detectada pelo EDR. Isolamento de rede automático executado.',
      mitigating:
        'Host isolado em quarentena de rede. Processos maliciosos encerrados. Backups imutáveis verificados e intactos.',
      resolved:
        'Ransomware contido. Apenas um endpoint afetado, zero propagação lateral. Restauração a partir de backup imutável concluída.',
    },
    isolateDeviceId: 'NB-004',
  },
  {
    id: 'SC-SUPC-07',
    title: 'Supply Chain — Pacote npm Malicioso',
    kind: 'Ataque à Cadeia de Suprimentos',
    severity: 'ALTA',
    mitre: { id: 'T1195.002', name: 'Comprometer Cadeia de Software' },
    killChain: [0, 1, 4],
    origin: { country: 'Países Baixos', countryCode: 'NL', city: 'Amsterdã', lat: 52.37, lon: 4.89 },
    targetId: 'SP01',
    description:
      'Pacote typosquatting "react-domm" com pós-install malicioso entrou no mirror do registry. SBOM + verificação Sigstore Cosign rejeitaram o artefato no pipeline.',
    mitigations: ['P22', 'P21', 'P23'],
    valueProtectedBRL: 880000,
    playbook: {
      questions: [
        { q: 'Alguma máquina de dev ou runner executou o pós-install?', why: 'Define se o ataque passou da teoria para o endpoint real.' },
        { q: 'O pacote entrou em algum lockfile comitado?', why: 'Determina se o PR precisa ser revertido e auditado.' },
        { q: 'Quais segredos estavam acessíveis aos runners afetados?', why: 'Escopo exato da rotação de credenciais necessária.' },
      ],
      prevent: [
        'Registry interno com allowlist e espelho aprovado — npm direto é bloqueado.',
        'Assinatura obrigatória de artefatos (Sigstore Cosign) e verificação no pipeline.',
        'SBOM gerado em todo build e diff automático de dependências em PRs.',
        'Runners efêmeros com rede restrita e segredos injetados via OIDC de curta duração.',
      ],
      actions: [
        { step: 'Congelar o pipeline', detail: 'Interromper builds em execução até confirmação de higiene.', planRef: 'P22' },
        { step: 'Rejeitar o artefato', detail: 'Verificação de assinatura falha → pacote bloqueado no registry.', planRef: 'P21' },
        { step: 'Auditar runners expostos', detail: 'Varredura EDR nas máquinas que baixaram o pacote.', planRef: 'P6' },
        { step: 'Rotacionar segredos de CI', detail: 'Tokens OIDC e credenciais de deploy da fila afetada.', planRef: 'P23' },
        { step: 'Publicar aviso interno', detail: 'Devs são os alvos: aviso com IOCs no canal de engenharia.' },
      ],
    },
    voice: {
      detect:
        'Alerta. Pacote suspeito detectado na cadeia de suprimentos de software. Typosquatting com script de pós-instalação. Assinatura Sigstore inválida.',
      mitigating:
        'Pipeline interrompido antes do merge. Artefato rejeitado. Pacote adicionado à lista de bloqueio do registry interno.',
      resolved:
        'Ataque à cadeia de suprimentos frustrado. Nenhum build comprometido. Relatório de SBOM atualizado e compartilhado.',
    },
  },
  {
    id: 'SC-MFAF-08',
    title: 'MFA Fatigue — Bombardeio de Push',
    kind: 'Acesso Não Autorizado',
    severity: 'MEDIA',
    mitre: { id: 'T1621', name: 'Geração de Solicitações MFA' },
    killChain: [0, 1, 2],
    origin: { country: 'Coreia do Norte', countryCode: 'KP', city: 'Hamhung', lat: 39.92, lon: 127.54 },
    targetId: 'BSBX',
    description:
      '47 notificações push de MFA em 3 minutos após vazamento de senha. Políticas de number matching + FIDO2 e condição de risco bloquearam o acesso.',
    mitigations: ['P2', 'P5', 'P33'],
    valueProtectedBRL: 350000,
    playbook: {
      questions: [
        { q: 'O funcionário aprovou alguma notificação sem querer?', why: 'Um push aprovado = sessão do atacante válida; exige revogação imediata.' },
        { q: 'De onde veio a senha vazada?', why: 'Identifica a fonte do vazamento (malware de endpoint, reuso pessoal, breach externo).' },
        { q: 'O dispositivo do usuário está com postura saudável?', why: 'Exclui (ou confirma) roubo de token local por malware.' },
      ],
      prevent: [
        'Number matching obrigatório: o push mostra o número a digitar, mata aprovação cega.',
        'Migrar diretoria e admins para FIDO2/passkey — resistente a phishing.',
        'Política de risco: push bloqueado quando login vem de dispositivo/rede nova + senha correta.',
        'Monitorar credenciais da empresa em breaches (Have I Been Pwned Enterprise).',
      ],
      actions: [
        { step: 'Bloquear condição de risco', detail: 'Política de acesso nega novas tentativas do contexto do atacante.', planRef: 'P2' },
        { step: 'Forçar reset de senha', detail: 'Senha atual é considerada comprometida por definição.', planRef: 'P5' },
        { step: 'Revogar todas as sessões', detail: 'Tokens de push emitidos são invalidados em massa.' },
        { step: 'Verificar o dispositivo', detail: 'EDR/MDM confere se houve roubo de token no endpoint.', planRef: 'P6' },
        { step: 'Conversar com o usuário', detail: 'Educar sobre o padrão do ataque e como reconhecê-lo.', planRef: 'P33' },
      ],
    },
    voice: {
      detect:
        'Atenção. Bombardeio de notificações de autenticação multifator. Quarenta e sete tentativas em três minutos. Senha possivelmente vazada.',
      mitigating:
        'Autenticação resistente a phishing exigida. Sessão do atacante bloqueada por política de risco. Senha forçada a reset.',
      resolved:
        'Ataque de fadiga de MFA neutralizado. Conta protegida por chave física FIDO2. Acesso do atacante encerrado.',
    },
  },
  {
    id: 'SC-CRED-09',
    title: 'Credential Dumping no Servidor de Build',
    kind: 'Pós-Exploração',
    severity: 'ALTA',
    mitre: { id: 'T1003', name: 'Despejo de Credenciais do SO' },
    killChain: [1, 2, 3, 5],
    origin: { country: 'Rússia', countryCode: 'RU', city: 'São Petersburgo', lat: 59.93, lon: 30.34 },
    targetId: 'SP01',
    description:
      'Processo mimikatz-style acessou LSASS no runner de CI. EDR em modo kernel bloqueou o acesso, e o Vault rotacionou todos os segredos da fila.',
    mitigations: ['P6', 'P3', 'P34'],
    valueProtectedBRL: 1150000,
    playbook: {
      questions: [
        { q: 'O acesso à memória foi bloqueado no kernel ou apenas detectado?', why: 'Bloqueio no kernel significa zero credenciais extraídas.' },
        { q: 'Quais segredos o runner tinha em escopo?', why: 'Define o raio exato da rotação no cofre.' },
        { q: 'Houve movimentação lateral a partir do runner?', why: 'Runner comprometido pode pivotar para registries e clouds.' },
      ],
      prevent: [
        'Credential Guard / proteção de LSASS habilitada em todos os endpoints e runners.',
        'Runners efêmeros: nada persiste entre builds, imagem base reconstruída por commit.',
        'Segredos via OIDC federado de curta duração — nada de PATs de longa vida.',
        'EDR com política de bloqueio para acesso a LSASS por processo não assinado.',
      ],
      actions: [
        { step: 'Encerrar processo atacante', detail: 'EDR mata a árvore e aplica quarentena do binário.', planRef: 'P6' },
        { step: 'Bloquear acesso ao cofre', detail: 'Política temporária nega novos despejos enquanto investiga.', planRef: 'P3' },
        { step: 'Rotacionar segredos da fila', detail: 'Vault rotaciona automaticamente o escopo mapeado.', planRef: 'P34' },
        { step: 'Coletar pacote forense', detail: 'Memória, logs EDR e timeline do processo para o IR.' },
        { step: 'Caça por variantes', detail: 'Procurar o mesmo padrão em toda a frota de runners.' },
      ],
    },
    voice: {
      detect:
        'Alerta. Tentativa de despejo de credenciais no servidor de integração contínua. Acesso à memória do processo detectado pelo EDR.',
      mitigating:
        'Processo encerrado em tempo real. Acesso ao armazenamento de credenciais negado. Rotação de segredos iniciada automaticamente.',
      resolved:
        'Credenciais rotacionadas. Nenhum segredo válido em mãos do adversário. Pacote forense coletado para análise.',
    },
  },
  {
    id: 'SC-C2-10',
    title: 'Beacon C2 para Domínio Recém-Registrado',
    kind: 'Comando e Controle',
    severity: 'ALTA',
    mitre: { id: 'T1071.001', name: 'Protocolos Web' },
    killChain: [1, 3, 5],
    origin: { country: 'Vietnã', countryCode: 'VN', city: 'Hanói', lat: 21.03, lon: 105.85 },
    targetId: 'RJDC',
    description:
      'Estação de trabalho iniciou beacon HTTPS a cada 60s para domínio registrado há 6 horas. DNS filtrante + NDR correlacionaram e bloquearam o canal.',
    mitigations: ['P18', 'P14', 'P29'],
    valueProtectedBRL: 640000,
    playbook: {
      questions: [
        { q: 'O beacon saiu de qual processo e usuário?', why: 'Processo legítimo comprometido vs. binário novo define a resposta.' },
        { q: 'Houve upload de dados no canal antes do bloqueio?', why: 'Quantifica potencial de exfiltração e aciona DLP/forense.' },
        { q: 'Outros hosts falaram com a mesma infraestrutura?', why: 'Expande a caça de indicadores para toda a frota.' },
      ],
      prevent: [
        'DNS filtrante com categoria "domínios recém-registrados" bloqueada por padrão.',
        'Egress filtering: saída para a internet só via proxy autenticado com TLS inspection.',
        'NDR com baseline de beaconing (jitter, periodicidade) em toda a rede interna.',
        'Allowlist de destinos de telemetria em máquinas que tocam produção.',
      ],
      actions: [
        { step: 'Afundar o domínio', detail: 'DNS interno passa a resolver o domínio para sinkhole.', planRef: 'P18' },
        { step: 'Derrubar conexões ativas', detail: 'Firewall de host e de rede matam o canal imediatamente.', planRef: 'P14' },
        { step: 'Isolar e reimager o host', detail: 'Máquina comprometida volta do zero — confiança não se recupera.', planRef: 'P6' },
        { step: 'Caça em toda a frota', detail: 'Buscar IOCs (domínio, hash, JA3) em todos os endpoints.', planRef: 'P29' },
        { step: 'Compartilhar intel', detail: 'Indicadores vão para o MISP e para o ISAC do setor.' },
      ],
    },
    voice: {
      detect:
        'Alerta. Canal de comando e controle detectado. Estação de trabalho comunicando com domínio recém-registrado. Correlação de rede confirmou padrão de beacon.',
      mitigating:
        'Domínio afundado noDNS. Conexão derrubada. Host marcado para reimagem. Caça proativa iniciada no segmento.',
      resolved:
        'Canal de comando e controle eliminado. Nenhum dado exfiltrado. Caça a indicadores estendida a toda a frota.',
    },
  },
]
