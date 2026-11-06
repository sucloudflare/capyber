// CAPYBER — Plano de Defesa em 40 Pontos
// Baseado em frameworks Blue Team reais: MITRE ATT&CK, MITRE D3FEND (conceitos),
// NIST CSF 2.0, CIS Controls v8, ISO/IEC 27001:2022, LGPD e Lei 14.478/2022.

export interface PlanPoint {
  id: string // P01..P40
  num: number
  title: string
  category: PlanCategory
  resumo: string
  detalhe: string
  ferramentas: string[]
  mitre: string[] // técnicas ATT&CK mitigadas
  defenda: string // conceito D3FEND
  nist: string // função NIST CSF 2.0
  cis: string // CIS Control v8
  passos: string[]
  impacto: 'ALTO' | 'MÉDIO'
  custo: 'BAIXO' | 'MÉDIO' | 'ALTO'
}

export type PlanCategory =
  | 'Identidade & Zero Trust'
  | 'Endpoint & Dispositivos'
  | 'Rede & Perímetro'
  | 'Aplicação & Cripto'
  | 'Detecção & SOC'
  | 'Resposta & Pessoas'

export const PLAN_CATEGORIES: PlanCategory[] = [
  'Identidade & Zero Trust',
  'Endpoint & Dispositivos',
  'Rede & Perímetro',
  'Aplicação & Cripto',
  'Detecção & SOC',
  'Resposta & Pessoas',
]

export const PLAN: PlanPoint[] = [
  // ───────────────────────── IDENTIDADE & ZERO TRUST ─────────────────────────
  {
    id: 'P01', num: 1, title: 'Arquitetura Zero Trust (NIST SP 800-207)',
    category: 'Identidade & Zero Trust',
    resumo: 'Nunca confie, sempre verifique: nenhuma requisição é confiável por estar "dentro da rede".',
    detalhe:
      'Substitui o modelo de perímetro por verificação contínua de identidade, dispositivo e contexto em cada requisição. Microssegmentação limita o movimento lateral (T1021) e o blast radius de qualquer comprometimento. O Capyber implementa o conceito com políticas por serviço e mTLS entre componentes.',
    ferramentas: ['SPIFFE/SPIRE', 'Istio mTLS', 'Cloudflare Zero Trust'],
    mitre: ['T1021', 'T1550', 'T1078'], defenda: 'Isolamento de rede e verificação de identidade',
    nist: 'PR (Proteger)', cis: 'CIS 6 — Controle de Acesso',
    passos: ['Inventariar fluxos leste-oeste', 'Definir políticas por identidade de serviço', 'Impor mTLS entre todos os serviços'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P02', num: 2, title: 'MFA resistente a phishing (FIDO2 / passkeys)',
    category: 'Identidade & Zero Trust',
    resumo: 'Chaves físicas FIDO2 e passkeys eliminam a classe inteira de roubo de segundo fator.',
    detalhe:
      'Tokens FIDO2/WebAuthn são vinculados à origem: um site falso de phishing não consegue reutilizá-los. Mata de frente o MFA fatigue (T1621) e o adversário-in-the-middle (T1557) usado por kits como Evilginx. Números de correspondência (number matching) acabam com o aprovador zombie de push.',
    ferramentas: ['YubiKey', 'Chaves passkey nativas', 'Entra ID / WorkOS'],
    mitre: ['T1621', 'T1557', 'T1110'], defenda: 'Hardening de credenciais',
    nist: 'PR (Proteger)', cis: 'CIS 5/6 — Contas e Acesso',
    passos: ['Distribuir chaves físicas para admins e financeiro', 'Exigir passkeys para acesso interno', 'Desligar gradualmente SMS e push simples'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P03', num: 3, title: 'PAM — cofre de privilégios e admin just-in-time',
    category: 'Identidade & Zero Trust',
    resumo: 'Credenciais privilegiadas vivem em cofre, com rotação automática e elevação temporária com aprovação.',
    detalhe:
      'Ninguém conhece a senha de produção: o cofre injeta segredos em runtime e rotaciona após cada uso (mitiga T1003 e T1555). Elevações JIT duram horas, não existem contas admin permanentes, e todo acesso privilegiado é gravado em sessão (evidência forense).',
    ferramentas: ['HashiCorp Vault', 'CyberArk', 'Teleport'],
    mitre: ['T1003', 'T1555', 'T1078.004'], defenda: 'Rotação de credenciais',
    nist: 'PR (Proteger)', cis: 'CIS 5 — Gestão de Contas',
    passos: ['Migrar todos os segredos para o Vault', 'Ativar rotação automática de chaves', 'Substituir admin permanente por JIT aprovado'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P04', num: 4, title: 'Gerenciador de senhas corporativo + passwordless',
    category: 'Identidade & Zero Trust',
    resumo: 'Senhas únicas e fortes geradas pelo cofre da equipe; reuso de senha deixa de existir.',
    detalhe:
      'O reuso de credenciais vazadas é a porta de entrada nº 1 (T1078 — conta válida). Gerenciador corporativo com políticas de força, alerta de vazamento (Have I Been Pwned integrado) e SSO passwordless reduz a superfície de ataque de credenciais a quase zero.',
    ferramentas: ['1Password Business', 'Bitwarden Enterprise', 'SSO OIDC'],
    mitre: ['T1078', 'T1110.003', 'T1555'], defenda: 'Hardening de credenciais',
    nist: 'PR (Proteger)', cis: 'CIS 5 — Gestão de Contas',
    passos: ['Contratar licença corporativa', 'Bloquear senhas fracas/reusadas por política', 'Migrar apps para SSO'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P05', num: 5, title: 'ZTNA no lugar da VPN legada',
    category: 'Identidade & Zero Trust',
    resumo: 'Acesso remoto por aplicação (não por rede), com verificação de postura do dispositivo.',
    detalhe:
      'VPN dá acesso à rede inteira; ZTNA dá acesso a um app específico após validar identidade + saúde do dispositivo (patch em dia, EDR ativo). Extingue o cenário clássico de comprometimento de serviço remoto (T1133) e de credencial de VPN vendida por insider.',
    ferramentas: ['Cloudflare Access', 'Tailscale', 'Netskope ZTNA'],
    mitre: ['T1133', 'T1078', 'T1219'], defenda: 'Isolamento de rede',
    nist: 'PR (Proteger)', cis: 'CIS 6 — Controle de Acesso',
    passos: ['Publicar apps internos atrás do ZTNA', 'Exigir postura de dispositivo', 'Desligar portas VPN/RDP/SSH expostas'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },

  // ───────────────────────── ENDPOINT & DISPOSITIVOS ─────────────────────────
  {
    id: 'P06', num: 6, title: 'EDR/XDR comportamental em 100% dos endpoints',
    category: 'Endpoint & Dispositivos',
    resumo: 'Antivírus de assinatura não basta: EDR caça comportamento (injeção de processo, dumping de LSASS).',
    detalhe:
      'EDR observa comportamento em tempo real e bloqueia cadeias de ataque como processo injetando em outro (T1055), acesso a LSASS (T1003) e desativação de defesas (T1562.001). No Capyber, o cenário de ransomware e de credential dumping é contido por essa camada em segundos.',
    ferramentas: ['Defender for Endpoint', 'CrowdStrike', 'Wazuh (open source)'],
    mitre: ['T1055', 'T1003', 'T1562.001'], defenda: 'Detecção de execução de processo',
    nist: 'DE (Detectar)', cis: 'CIS 10 — Defesas contra Malware',
    passos: ['Instalar agente em todo device gerenciado', 'Ativar modos de bloqueio (não só alerta)', 'Integrar telemetria ao SIEM'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P07', num: 7, title: 'MDM/MAM para notebooks e celulares',
    category: 'Endpoint & Dispositivos',
    resumo: 'Frota gerenciada: criptografia forçada, patch obrigatório e container corporativo no celular pessoal.',
    detalhe:
      'MDM garante que nenhum device entre na rede sem criptografia de disco, PIN forte, patch de segurança em SLA e sem apps proibidos. No celular, o work profile isola dados corporativos do uso pessoal — o QR code do banco nunca mistura com o app de desconhecido.',
    ferramentas: ['Microsoft Intune', 'Kandji', 'Android Enterprise'],
    mitre: ['T1203', 'T1091', 'T1547'], defenda: 'Hardening de componente de plataforma',
    nist: 'PR (Proteger)', cis: 'CIS 1/4 — Inventário e Configuração',
    passos: ['Recrutar devices no MDM', 'Baseline CIS por plataforma', 'Política de compliance bloqueante'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P08', num: 8, title: 'Criptografia de disco total + TPM',
    category: 'Endpoint & Dispositivos',
    resumo: 'Notebook roubado é prejuízo de hardware, não de dados.',
    detalhe:
      'BitLocker, FileVault e LUKS com chave selada no TPM tornam inútil o disco removido do device (mitiga T1539 e T1552.001 em roubo físico). O MDM verifica diariamente e trava o device sem criptografia. Para o financeiro, exigimos também chaves em token externo.',
    ferramentas: ['BitLocker', 'FileVault', 'LUKS', 'TPM 2.0'],
    mitre: ['T1539', 'T1552.001'], defenda: 'Criptografia de dados em repouso',
    nist: 'PR (Proteger)', cis: 'CIS 3 — Proteção de Dados',
    passos: ['Habilitar criptografia em 100% da frota', 'Escrow de chave de recuperação no cofre', 'Auditoria mensal de cobertura'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P09', num: 9, title: 'Hardening com CIS Benchmarks automatizado',
    category: 'Endpoint & Dispositivos',
    resumo: 'Baseline de configuração segura aplicado por código, com desvio revertido automaticamente.',
    detalhe:
      '90% dos ataques bem-sucedidos exploram configuração padrão insegura, não zero-day. CIS Benchmarks (nível 1/2) aplicados por Ansible/Intune desligam serviços desnecessários, forçam política de senha e fecham portas locais — elimina técnicas de descoberta e de escalada básicas (T1087, T1548).',
    ferramentas: ['CIS Benchmarks', 'Ansible', 'OpenSCAP'],
    mitre: ['T1548', 'T1087', 'T1112'], defenda: 'Hardening de configuração',
    nist: 'PR (Proteger)', cis: 'CIS 4 — Configuração Segura',
    passos: ['Escolher benchmark por plataforma', 'Aplicar como código com drift detection', 'Exceções documentadas e temporárias'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P10', num: 10, title: 'Controle de USB e DLP de endpoint',
    category: 'Endpoint & Dispositivos',
    resumo: 'Pendrive desconhecido não roda nada; dados sensíveis não saem por canal não aprovado.',
    detalhe:
      'Bloqueia replicação por mídia removível (T1091) e exfiltração local. O DLP classifica dados (chaves, PII, código de carteira) e impede cópia para USB, upload web e impressão sem justificativa. No cenário insider do Capyber, é o DLP que para a exportação de chaves.',
    ferramentas: ['Defender DLP', 'Endpoint Protector', 'USB/IP allowlist'],
    mitre: ['T1091', 'T1567', 'T1052'], defenda: 'Verificação de permissão de transferência',
    nist: 'PR (Proteger)', cis: 'CIS 3 — Proteção de Dados',
    passos: ['Classificar dados em 3 níveis', 'Bloquear USB por padrão, allowlist por ID', 'Regras DLP para segredos cripto'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P11', num: 11, title: 'Application allowlisting (WDAC/AppArmor)',
    category: 'Endpoint & Dispositivos',
    resumo: 'Só binários assinados e aprovados executam: malware de zero-day não roda.',
    detalhe:
      'Inverte a lógica do antivírus: em vez de lista de bloqueio infinita, lista de permissão assinada. Um ransomware novo (T1486) simplesmente não executa — o Windows Defender Application Control nega por política. Nas estações de chave (KMS), a lista é mínima: só o essencial.',
    ferramentas: ['WDAC', 'AppArmor', 'SELinux'],
    mitre: ['T1486', 'T1204', 'T1059'], defenda: 'Verificação de assinatura executável',
    nist: 'PR (Proteger)', cis: 'CIS 2/10 — Software e Malware',
    passos: ['Auditar e mapear softwares de trabalho', 'Modo auditoria por 30 dias', 'Aplicar bloqueio com exceções revisadas'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P12', num: 12, title: 'Patch management com SLA por severidade',
    category: 'Endpoint & Dispositivos',
    resumo: 'CVE crítica em componente exposto: patch em 72h. Sem exceções não aprovadas.',
    detalhe:
      'A maioria das grandes invasões (incluindo casos de exchanges) usou vulnerabilidade já conhecida e com patch disponível. Inventário automático + priorização por CVSS + exposição define SLA: crítico 72h, alto 7 dias. Compensating controls quando o patch atrasa.',
    ferramentas: ['WSUS', 'Intune', 'Trivy', 'Qualys'],
    mitre: ['T1190', 'T1210', 'T1203'], defenda: 'Atualização de componente de software',
    nist: 'PR (Proteger)', cis: 'CIS 7 — Gestão de Vulnerabilidades',
    passos: ['Inventário contínuo de versões', 'SLA por severidade publicado', 'Relatório semanal de envelhecimento de CVE'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P13', num: 13, title: 'BYOD seguro com work profile e VDI para dev',
    category: 'Endpoint & Dispositivos',
    resumo: 'Trabalho em dispositivo pessoal só dentro de container gerenciado ou desktop virtualizado.',
    detalhe:
      'Desenvolvedor usa máquina pessoal? O código sensível roda em VDI/Cloud Workstation sem download local, ou em work profile com MAM (app wrapper com criptografia, copiar/colar controlado). Evita que o malware do jogo pirata do filho do dev toque no repositório da exchange.',
    ferramentas: ['Chrome Remote Desktop / Cloud Workstations', 'Intune MAM', 'Windows 365'],
    mitre: ['T1204', 'T1539'], defenda: 'Isolamento de aplicativo',
    nist: 'PR (Proteger)', cis: 'CIS 1 — Inventário de Ativos',
    passos: ['Definir política de BYOD assinada', 'Provisionar VDI para funções sensíveis', 'MAM wrapper em apps corporativos'],
    impacto: 'MÉDIO', custo: 'MÉDIO',
  },

  // ───────────────────────── REDE & PERÍMETRO ─────────────────────────
  {
    id: 'P14', num: 14, title: 'Microssegmentação de rede (east-west)',
    category: 'Rede & Perímetro',
    resumo: 'A rede interna não é flat: prod não fala com rh, e o build runner não fala com o cofre de chaves.',
    detalhe:
      'Compartimentos por função com regras deny-by-default entre eles. Um host comprometido (T1021, T1570) fica preso no seu segmento. eBPF/Cilium permite políticas por identidade de workload, não por IP — e o Capyber visualiza cada bloqueio lateral no mapa.',
    ferramentas: ['Cilium eBPF', 'VLAN/ACL', 'Firewall de 3ª geração'],
    mitre: ['T1021', 'T1570', 'T1210'], defenda: 'Isolamento de rede',
    nist: 'PR (Proteger)', cis: 'CIS 12 — Infraestrutura de Rede',
    passos: ['Mapear fluxos reais (Zeek)', 'Definir zonas e políticas deny-by-default', 'Aplicar gradualmente em modo log → block'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P15', num: 15, title: 'WAF com OWASP CRS na frente de tudo',
    category: 'Rede & Perímetro',
    resumo: 'O coração do Capyber: firewall de aplicação inspeciona cada requisição contra 20+ classes de ataque.',
    detalhe:
      'ModSecurity/Coraza + OWASP Core Rule Set bloqueiam SQLi, XSS, traversal, RCE e ferramentas de recon antes de tocarem o app. O motor CAPYCORE implementa as mesmas famílias de regras em software próprio, com pontuação de risco, veredito e resposta automática — visível ao vivo no Laboratório.',
    ferramentas: ['Coraza WAF', 'ModSecurity', 'OWASP CRS', 'Cloudflare WAF'],
    mitre: ['T1190', 'T1059', 'T1595'], defenda: 'Filtragem de comunicação de rede',
    nist: 'PR/DE (Proteger/Detectar)', cis: 'CIS 13 — Monitoramento de Rede',
    passos: ['Implantar CRS em modo detecção', 'Ajustar falsos positivos', 'Elevar para bloqueio com monitoramento'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P16', num: 16, title: 'Anti-DDoS: anycast, rate limit e absorção na borda',
    category: 'Rede & Perímetro',
    resumo: 'Ataques de 200+ Gbps morrem na borda anycast antes de chegar à origem.',
    detalhe:
      'Três camadas: anycast geodistribuído dilui o flood, rate limiting por identidade protege endpoints caros (login, PIX), e regras L3/L4 descartam bots conhecidos. Mitiga T1498/T1499. O cenário de DDoS do Capyber mostra a absorção em tempo real.',
    ferramentas: ['Cloudflare', 'AWS Shield', 'Fail2ban + nginx limit_req'],
    mitre: ['T1498', 'T1499'], defenda: 'Throttling de tráfego de rede',
    nist: 'PR/RC (Proteger/Recuperar)', cis: 'CIS 12/13 — Rede',
    passos: ['Publicar serviços atrás de anycast', 'Rate limit por rota e por chave', 'Runbook de "modo sob ataque"'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P17', num: 17, title: 'DNS filtrante + DNSSEC + sinkhole',
    category: 'Rede & Perímetro',
    resumo: 'Nenhum malware consegue resolver o domínio do C2: DNS é a portaria do tráfego de saída.',
    detalhe:
      'Resolver recursivo com categorização bloqueia domínios recém-registrados, DGA e categorias de risco; DNSSEC impede spoofing. Beacon C2 (T1071) morre no primeiro lookup. O sinkhole ainda coleta evidências de quem tentou — ouro para o hunting.',
    ferramentas: ['Quad9 / Cloudflare Gateway', 'Pi-hole', 'Unbound + DNSSEC'],
    mitre: ['T1071', 'T1568', 'T1583.001'], defenda: 'Filtragem de DNS',
    nist: 'PR/DE (Proteger/Detectar)', cis: 'CIS 9/12 — E-mail/Web e Rede',
    passos: ['Apontar toda a frota para o resolver filtrante', 'Bloquear domínios < 7 dias para o segmento corporativo', 'Logar tudo no SIEM'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P18', num: 18, title: 'NDR + IDS com regras ET Open (Zeek/Suricata)',
    category: 'Rede & Perímetro',
    resumo: 'Inspeção de tráfego em profundidade: o C2 que disfarça de HTTPS cai nos fingerprints.',
    detalhe:
      'Suricata com Emerging Threats assina exploits conhecidos; Zeek gera logs comportamentais (conn, http, ssl, files) que alimentam detecção de beaconing, tunneling e exfil (T1048). É a rede inteira virando telemetria para o SIEM.',
    ferramentas: ['Suricata', 'Zeek', 'ntopng', 'ET Open rules'],
    mitre: ['T1071.001', 'T1048', 'T1573'], defenda: 'Análise de tráfego de rede',
    nist: 'DE (Detectar)', cis: 'CIS 13 — Monitoramento de Rede',
    passos: ['Sensor em modo TAP/SPAN nos pontos-chave', 'Ajustar regras e honeyports', 'Correlacionar com EDR no SIEM'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P19', num: 19, title: 'Geo-fencing e reputação de ASN na borda interna',
    category: 'Rede & Perímetro',
    resumo: 'Serviços internos sensíveis só aceitam tráfego de geografia e provedores plausíveis.',
    detalhe:
      'Painel admin não precisa ser acessível de Pyongyang. Bloqueio por país/ASN para superfícies internas (com exceções documentadas para viagem), combinado com a base de reputação que o Capyber usa no scoring. Reduz drasticamente o volume de scanners APT (T1595) chegando no alvo.',
    ferramentas: ['MaxMind GeoIP', 'Cloudflare WAF rules', 'nftables + ipset'],
    mitre: ['T1595', 'T1190', 'T1133'], defenda: 'Filtragem de comunicação de rede',
    nist: 'PR (Proteger)', cis: 'CIS 12 — Rede',
    passos: ['Classificar serviços: público / interno / admin', 'Aplicar geo-regras por classificação', 'Fluxo de exceção temporária aprovado'],
    impacto: 'MÉDIO', custo: 'BAIXO',
  },
  {
    id: 'P20', num: 20, title: 'E-mail hardening: DMARC p=reject + sandbox de anexos',
    category: 'Rede & Perímetro',
    resumo: 'Spoof do seu domínio cai no chão; anexo desconhecido detona em sandbox antes de chegar no alvo.',
    detalhe:
      'SPF + DKIM + DMARC em p=reject eliminam spoofing direto do domínio (T1566, T1656). Gateway com detonamento em sandbox abre anexos em VM descartável e reescreve links. Detecção de lookalike domains (bancoai-safety.com) com takedown automático via registrar.',
    ferramentas: ['dmarcian', 'Proofpoint / Proton Sentry', 'GoDaddy/registrar API p/ takedown'],
    mitre: ['T1566', 'T1566.001', 'T1656'], defenda: 'Verificação de autenticidade de e-mail',
    nist: 'PR/DE (Proteger/Detectar)', cis: 'CIS 9 — E-mail e Navegador',
    passos: ['Publicar DMARC p=none → quarantine → reject', 'Sandbox para anexos e QR codes', 'Monitor de typosquatting de domínio'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },

  // ───────────────────────── APLICAÇÃO & CRIPTO ─────────────────────────
  {
    id: 'P21', num: 21, title: 'SAST/DAST/SCA obrigatório no CI/CD',
    category: 'Aplicação & Cripto',
    resumo: 'Nenhum merge com vulnerabilidade crítica: o pipeline barra, não o changelog.',
    detalhe:
      'Semgrep (SAST), ZAP (DAST) e Trivy/OWASP-DC (SCA) rodam em todo PR; finding crítico bloqueia o merge. Vulnerabilidade morre na escrita, não no incidente (mitiga T1190 na origem). Quality gate com janela de prazo e owner definido.',
    ferramentas: ['Semgrep', 'OWASP ZAP', 'Trivy', 'GitHub Actions'],
    mitre: ['T1190', 'T1505.003'], defenda: 'Análise estática de código',
    nist: 'PR (Proteger)', cis: 'CIS 16 — Segurança de Software',
    passos: ['Integrar scanners ao pipeline', 'Baseline de findings existentes', 'Gate bloqueante para críticos/altos'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P22', num: 22, title: 'Supply chain: SBOM + assinatura Sigstore + lockfile',
    category: 'Aplicação & Cripto',
    resumo: 'Todo artefato em produção tem nota fiscal verificável de origem e conteúdo.',
    detalhe:
      'SBOM (CycloneDX) inventaria cada dependência; Cosign assina imagens e o cluster só roda artefatos com assinatura válida (admission controller). Lockfile obrigatório, registry interno com allowlist e verificação de typosquatting — mata ataques tipo o caso Bybit/Safe e pacotes maliciosos de npm (T1195.002).',
    ferramentas: ['Syft/CycloneDX', 'Sigstore Cosign', 'npm audit + lockfile'],
    mitre: ['T1195.002', 'T1195.001'], defenda: 'Verificação de assinatura de código',
    nist: 'PR (Proteger)', cis: 'CIS 16 — Software',
    passos: ['Gerar SBOM em todo build', 'Assinar e verificar no deploy', 'Registry interno com allowlist'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P23', num: 23, title: 'Secrets scanning e proibição de segredo em código',
    category: 'Aplicação & Cripto',
    resumo: 'Chave no repositório é incidente: gitleaks barra e o push é rejeitado.',
    detalhe:
      'Gitleaks/TruffleHog em pre-commit e no CI, com histórico varrido; vazamento detectado → rotação automática no Vault em minutos. Elimina o erro mais comum de dev (commit de .env) que alimenta bots de varredura de GitHub em segundos (T1552.001, T1078).',
    ferramentas: ['Gitleaks', 'TruffleHog', 'Git hooks'],
    mitre: ['T1552.001', 'T1078', 'T1552'], defenda: 'Rotação de credenciais',
    nist: 'PR/DE (Proteger/Detectar)', cis: 'CIS 16 — Software',
    passos: ['Habilitar em pre-commit e CI', 'Varredura retroativa do histórico', 'Playbook de rotação automática'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P24', num: 24, title: 'Chaves cripto em MPC/HSM — nunca na máquina do dev',
    category: 'Aplicação & Cripto',
    resumo: 'Chave privada de custódia nunca toca notebook: fica em hardware ou computação multi-partidária.',
    detalhe:
      'HSM certificado FIPS 140-2 L3 ou carteiras MPC dividem a chave em shards entre múltiplos locais/pessoas — comprometer um ponto não revela a chave inteira. Assinatura exige política (quem, quanto, para quem). Neutraliza infostealers que varrem machines de devs (T1555, T1003).',
    ferramentas: ['HSM FIPS 140-2 L3', 'Fireblocks-style MPC', 'AWS KMS CloudHSM'],
    mitre: ['T1555', 'T1003', 'T1552.004'], defenda: 'Criptografia de material de chave',
    nist: 'PR (Proteger)', cis: 'CIS 3 — Dados',
    passos: ['Migrar custódia quente para MPC/HSM', 'Política de assinatura com quórum', 'Auditoria de acessos ao HSM'],
    impacto: 'ALTO', custo: 'ALTO',
  },
  {
    id: 'P25', num: 25, title: 'Multi-sig + whitelist de saque com time-lock',
    category: 'Aplicação & Cripto',
    resumo: 'Saque grande precisa de 3 de 5 assinaturas e espera 24–48h com cancelamento possível.',
    detalhe:
      'Cold storage multi-sig (Gnosis Safe 3-de-5 com geografias separadas) para reservas; saques quentes com whitelist de endereços e time-lock: endereço novo exige espera e segunda aprovação. É o padrão que teria salvo vários hacks famosos — o sequestro da chave de uma pessoa não move o dinheiro (T1539, T1098 sem quórum).',
    ferramentas: ['Safe (Gnosis)', 'Política de time-lock', 'Hardware wallets'],
    mitre: ['T1539', 'T1098', 'T1560'], defenda: 'Verificação de permissão',
    nist: 'PR (Proteger)', cis: 'CIS 6 — Acesso',
    passos: ['Definir política por faixa de valor', 'Whitelist + time-lock de 24–48h', 'Teste de recuperação semestral do multi-sig'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P26', num: 26, title: 'Anti-drainer: simulação de transação + blacklist on-chain',
    category: 'Aplicação & Cripto',
    resumo: 'Toda aprovação de contrato é simulada e confrontada com bases de endereços maliciosos.',
    detalhe:
      'Antes de assinar, a transação passa por simulação (estilo Tenderly): o usuário vê o que realmente acontece ("você está dando permissão total do seu USDT"). Endereços conhecidos de drainer (feeds como Chainalysis e TRM) são bloqueados com hard-fail. É essa camada que segura o cenário do NFT mint falso do Capyber.',
    ferramentas: ['Simulação de tx (Tenderly-style)', 'Chainalysis / TRM API', 'Blockaid-style dApp scan'],
    mitre: ['T1566', 'T1656', 'T1557'], defenda: 'Verificação de conteúdo de mensagem',
    nist: 'PR/DE (Proteger/Detectar)', cis: 'CIS 9/16',
    passos: ['Integrar simulação no fluxo de assinatura', 'Feed de endereços maliciosos com hard-fail', 'Educar usuário com alerta visual claro'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P27', num: 27, title: 'Integridade do frontend Web3 (CSP, SRI, monitor de DNS)',
    category: 'Aplicação & Cripto',
    resumo: 'O site da exchange não pode ser envenenado: CSP rígida, SRI e monitoramento de conteúdo.',
    detalhe:
      'CSP sem inline scripts + Subresource Integrity impedem que um CDN comprometido injete drainer na página (o vetor real do hack da Bybit em 2025, US$ 1,5 bi). Monitor de integridade compara o JS servido com o hash publicado e o time de resposta dispara takedown e rotação de credenciais.',
    ferramentas: ['CSP strict-dynamic', 'Subresource Integrity', 'Monitor de conteúdo (cron + hash)'],
    mitre: ['T1195.002', 'T1189', 'T1557'], defenda: 'Verificação de integridade de código',
    nist: 'PR/DE (Proteger/Detectar)', cis: 'CIS 16 — Software',
    passos: ['Publicar CSP restritiva com nonce', 'SRI em todos os assets externos', 'Monitor de hash do JS crítico 24×7'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P28', num: 28, title: 'Backups imutáveis 3-2-1-1-0 com teste de restore',
    category: 'Aplicação & Cripto',
    resumo: 'Ransomware não cifra o que não consegue tocar: cópia offline e imutável, restauração testada.',
    detalhe:
      '3 cópias, 2 mídias, 1 off-site, 1 imutável (Object Lock/WORM), 0 erros no teste de restore mensal. Mata o modelo de negócio do ransomware (T1486/T1490 — apagar shadow copies e backups): mesmo detonando, a empresa recupera sem pagar.',
    ferramentas: ['S3 Object Lock', 'Veeam/Restic', 'Teste de restore automatizado'],
    mitre: ['T1486', 'T1490', 'T1561'], defenda: 'Backup de dados e recuperação',
    nist: 'RC (Recuperar)', cis: 'CIS 11 — Recuperação de Dados',
    passos: ['Implementar Object Lock em 1 cópia', 'Automatizar teste de restore mensal', 'Runbook de recuperação por sistema'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },

  // ───────────────────────── DETECÇÃO & SOC ─────────────────────────
  {
    id: 'P29', num: 29, title: 'SIEM com correlação MITRE ATT&CK + regras Sigma',
    category: 'Detecção & SOC',
    resumo: 'Todos os logs num só lugar, com detecções versionadas e mapeadas em técnicas ATT&CK.',
    detalhe:
      'EDR + WAF + DNS + e-mail + nuvem correlacionados no SIEM; detecções escritas em Sigma (formato aberto, portável) e cobertas por heatmap do ATT&CK Navigator. O Capyber espelha isso: cada veredito carrega o MITRE ID da técnica — o analista vê a tática, não só o log.',
    ferramentas: ['Elastic Security / Wazuh', 'Sigma HQ', 'ATT&CK Navigator'],
    mitre: ['T1071', 'T1059', 'T1003', 'T1566'], defenda: 'Correlação de eventos de segurança',
    nist: 'DE (Detectar)', cis: 'CIS 8 — Gestão de Logs',
    passos: ['Centralizar logs com retenção ≥ 12 meses', 'Importar conjunto Sigma inicial', 'Cobertura mínima por tática (heatmap)'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P30', num: 30, title: 'Threat hunting proativo com hipóteses semanais',
    category: 'Detecção & SOC',
    resumo: 'O time caça o que as detecções ainda não viram — assumindo que o atacante já está dentro.',
    detalhe:
      'Ciclo semânico: hipótese (ex.: "beacon de 60s para domínio < 30 dias"), investigação em dados históricos, e cada hunt vira nova regra de detecção. Baseado em relatórios de APT (Lazarus, APT41) e CTI setorial de exchanges. Reduz dwell time de meses para dias.',
    ferramentas: ['Jupyter + pandas', 'Velociraptor', 'CTI reports (MITRE, Kaspersky)'],
    mitre: ['T1071.001', 'T1090', 'T1219'], defenda: 'Análise de alerta de rede',
    nist: 'DE (Detectar)', cis: 'CIS 13 — Monitoramento',
    passos: ['Definir cadência semanal de hunts', 'Biblioteca de hipóteses por APT relevante', 'Converter achados em detecções'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P31', num: 31, title: 'Deception: canarytokens e honeypots',
    category: 'Detecção & SOC',
    resumo: 'Armadilhas de altíssima fidelidade: quem toca no token falso é atacante, sem chance de falso positivo.',
    detalhe:
      'Canarytokens plantados (credencial falsa em compartilhamento, chave AWS fake no repositório de config, host honeypot no segmento prod) disparam alerta instantâneo ao primeiro uso (T1078, T1552). O spearphishing do cenário do Capyber é detectado exatamente assim — o canário pega o clique.',
    ferramentas: ['Thinkst Canary / Canarytokens', 'T-Pot', 'Credenciais-armadilha no Vault'],
    mitre: ['T1078', 'T1552', 'T1210'], defenda: 'Alerta de armadilha de rede',
    nist: 'DE (Detectar)', cis: 'CIS 13 — Monitoramento',
    passos: ['Distribuir tokens em superfícies críticas', 'Honeypot por segmento sensível', 'Alerta de prioridade máxima ao tocar'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P32', num: 32, title: 'CTI operacional: MISP + perfis de APT + IOC matching',
    category: 'Detecção & SOC',
    resumo: 'Inteligência de ameaças virando bloqueio e detecção automática, não relatório em PDF.',
    detalhe:
      'Feeds de IOCs (MISP, OTX, parceiros setoriais) batem contra logs e proxies em tempo real; perfis de grupos relevantes para cripto/bancos (Lazarus/APT41/TA505) guiam hunts e simulações. O motor do Capyber já usa esse conceito na reputação de IP e nos cenários atribuídos.',
    ferramentas: ['MISP', 'OpenCTI', 'AlienVault OTX'],
    mitre: ['T1588', 'T1583', 'T1071'], defenda: 'Filtragem de reputação',
    nist: 'ID/DE (Identificar/Detectar)', cis: 'CIS 13/17',
    passos: ['Subir MISP com feeds curados', 'Integração de IOC matching no SIEM/WAF', 'Relatório mensal por grupo APT'],
    impacto: 'MÉDIO', custo: 'MÉDIO',
  },
  {
    id: 'P33', num: 33, title: 'UEBA — comportamento de usuário e entidade',
    category: 'Detecção & SOC',
    resumo: 'Login de 3h da manhã, de país novo, exportando planilha gigante? O sistema nota sozinho.',
    detalhe:
      'Baseline de comportamento por usuário (horários, volume, acessos) e por entidade (servidores, service accounts). Desvios geram score de risco acumulado: insider (T1567, T1052) e conta sequestrada (T1078) aparecem como outliers, não como eventos isolados. É o cérebro do cenário de ameaça interna do Capyber.',
    ferramentas: ['Elastic ML / Splunk UBA', 'Azure AD Identity Protection'],
    mitre: ['T1567', 'T1078', 'T1052'], defenda: 'Análise de comportamento',
    nist: 'DE (Detectar)', cis: 'CIS 8 — Logs',
    passos: ['Coletar telemetria de identidade e DLP', 'Baselines por função', 'Score de risco com resposta gradativa'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },
  {
    id: 'P34', num: 34, title: 'SOAR — resposta automatizada em < 60 segundos',
    category: 'Detecção & SOC',
    resumo: 'Detectou, isolou: playbook automático corta o host, revoga o token e abre o ticket sozinho.',
    detalhe:
      'Playbooks (n8n/TheHive/Cortex) executam a primeira resposta sem esperar o analista: isolar endpoint no EDR, derrubar sessões (T1539), resetar credencial, bloquear IOC na borda. MTTC (tempo até contenção) cai de horas para menos de 1 minuto — a diferença entre quase-incidente e prejuízo bilionário.',
    ferramentas: ['TheHive + Cortex', 'n8n', 'Webhooks EDR/IDP'],
    mitre: ['T1539', 'T1078', 'T1486'], defenda: 'Isolamento de endpoint',
    nist: 'RS (Responder)', cis: 'CIS 17 — Resposta a Incidentes',
    passos: ['Automatizar contenção de endpoint', 'Integrar revogação de sessão/token', 'Métrica de MTTC publicada internamente'],
    impacto: 'ALTO', custo: 'MÉDIO',
  },

  // ───────────────────────── RESPOSTA & PESSOAS ─────────────────────────
  {
    id: 'P35', num: 35, title: 'Plano de resposta a incidentes testado (NIST 800-61)',
    category: 'Resposta & Pessoas',
    resumo: 'Runbook por cenário + tabletop trimestral: quando acontecer, ninguém improvisa.',
    detalhe:
      'Cenários mapeados (ransomware, drainer, insider, DDoS, vazamento) com papéis, cadeia de comunicação, critérios de acionamento jurídico/seguros e mensagens pré-aprovadas. Tabletop trimestral com diretoria incluída — o primeiro teste não pode ser o dia real.',
    ferramentas: ['NIST SP 800-61', 'ISO/IEC 27035', 'TheHive como case manager'],
    mitre: [], defenda: 'Planejamento de resposta a incidentes',
    nist: 'RS (Responder)', cis: 'CIS 17 — Resposta a Incidentes',
    passos: ['Escrever runbooks por cenário', 'Tabletop trimestral com cronômetro', 'Pós-mortem sem culpa (blameless)'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P36', num: 36, title: 'Bug bounty + disclosure responsável',
    category: 'Resposta & Pessoas',
    resumo: 'Pagar researcher é infinitamente mais barato que pagar hacker.',
    detalhe:
      'Programa de bounty com escopo claro (produção e apps), triagem SLA e recompensa por severidade; política de disclosure responsável publicada (security.txt). Pesquisadores externos encontram o que o scan interno não vê — e canal honesto evita que o achado vire leak no fórum.',
    ferramentas: ['HackerOne/Bugcrowd-style', 'security.txt', 'Triagem interna'],
    mitre: ['T1190'], defenda: 'Teste de segurança de aplicação',
    nist: 'ID (Identificar)', cis: 'CIS 18 — Pentest',
    passos: ['Publicar política e escopo', 'Definir tabela de recompensas', 'Métrica: tempo médio de triagem'],
    impacto: 'MÉDIO', custo: 'MÉDIO',
  },
  {
    id: 'P37', num: 37, title: 'Simulação de phishing contínua + cultura de segurança',
    category: 'Resposta & Pessoas',
    resumo: 'O fator humano treinado é o melhor IDS do mundo — e o mais barato.',
    detalhe:
      'Campanhas mensais de phishing simulado (GoPhish) com dificuldade progressiva e microtreinamento no clique; botão de "reportar suspeito" em um clique no e-mail; reconhecimento positivo (ranking lúdico). Taxa de clique cai de ~30% para menos de 5% em 6 meses — é assim que o spearphishing do CFO morre.',
    ferramentas: ['GoPhish', 'Botão de reporte (Outlook/Gmail)', 'Nuggets semanais'],
    mitre: ['T1566', 'T1656', 'T1204'], defenda: 'Treinamento de conscientização de segurança',
    nist: 'PR (Proteger)', cis: 'CIS 14 — Conscientização e Treinamento',
    passos: ['Baseline de clique inicial', 'Campanhas mensais graduais', 'Métricas por squad e premio de squad mais forte'],
    impacto: 'ALTO', custo: 'BAIXO',
  },
  {
    id: 'P38', num: 38, title: 'Purple team + pentest threat-led anual',
    category: 'Resposta & Pessoas',
    resumo: 'Red team ataca com TTPs de APT real; blue team valida se detectou cada passo.',
    detalhe:
      'Exercício purple team mapeado no ATT&CK: cada técnica do adversário simulada (em sistema próprio, conforme regulamento) com veredito detectado/bloqueado/cego; lacunas viram backlog de detecção. Pentest anual threat-led (estilo TIBER-BR) cobre o que os scans não alcançam — lógica, pessoas e processos.',
    ferramentas: ['ATT&CK Navigator', 'Atomic Red Team (em ambiente próprio)', 'Caldera'],
    mitre: ['T1190', 'T1055', 'T1003'], defenda: 'Teste de eficácia de detecção',
    nist: 'ID/DE', cis: 'CIS 18 — Pentest',
    passos: ['Escolher perfil de APT relevante', 'Executar atomic tests em lab próprio', 'Fechar lacunas de detecção com prazo'],
    impacto: 'ALTO', custo: 'ALTO',
  },
  {
    id: 'P39', num: 39, title: 'Compliance arquitetado: LGPD, PCI DSS, ISO 27001, Lei 14.478',
    category: 'Resposta & Pessoas',
    resumo: 'Conformidade como consequência da arquitetura, não como papelada de véspera de auditoria.',
    detalhe:
      'Controles coletam evidência automática (config-as-code, logs de acesso, DPO dashboard): LGPD para dados pessoais, PCI DSS 4.0 para pagamentos, ISO 27001:2022 como sistema de gestão, Res. CMN 4.893/2021 para cibersegurança bancária e Lei 14.478/2022 + regras BCB para criptoativos. Auditoria deixa de ser susto e vira exportação.',
    ferramentas: ['Vanta/Drata-style', 'LGPD + ANPD checklist', 'PCI DSS 4.0 SAQ'],
    mitre: [], defenda: 'Gestão de conformidade',
    nist: 'GV (Governar)', cis: 'CIS 15 — Gestão de Fornecedores',
    passos: ['Mapear controles por norma', 'Evidência automática por controle', 'Comitê trimestral de risco'],
    impacto: 'MÉDIO', custo: 'MÉDIO',
  },
  {
    id: 'P40', num: 40, title: 'Resiliência: DR multi-região e freeze de emergência cripto',
    category: 'Resposta & Pessoas',
    resumo: 'Botão de pânico com dois passos à frente: congelar saques em minutos e operar sem a região principal.',
    detalhe:
      'DR multi-região com RTO < 1h e failout testado; circuit-breaker de saques (freeze de emergência) acionável por quórum da diretoria de segurança em minutos — pausa retiradas, rotaciona chaves quentes e passa a operar em modo de leitura segura. Canal de comunicação de crise fora do domínio corporativo (Signal + bridge segura). É o seguro da última milha.',
    ferramentas: ['Kubernetes multi-região', 'Circuit breaker de saques', 'RTO/RPO dashboard'],
    mitre: ['T1498', 'T1486', 'T1565'], defenda: 'Contingência e recuperação',
    nist: 'RC (Recuperar)', cis: 'CIS 11 — Recuperação',
    passos: ['Definir RTO/RPO por sistema crítico', 'Implementar circuit breaker com quórum', 'Drill anual de falha de região completa'],
    impacto: 'ALTO', custo: 'ALTO',
  },
]

export const PLAN_STATS = {
  total: PLAN.length,
  altoImpacto: PLAN.filter((p) => p.impacto === 'ALTO').length,
  baixoCusto: PLAN.filter((p) => p.custo === 'BAIXO').length,
  frameworks: ['MITRE ATT&CK', 'MITRE D3FEND', 'NIST CSF 2.0', 'CIS Controls v8', 'ISO/IEC 27001:2022', 'LGPD', 'Lei 14.478/2022'],
}

// referências citadas como motivação (incidentes públicos e reais)
export const INCIDENTS = [
  { nome: 'Bybit', ano: 2025, valor: 'US$ 1,5 bi', vetor: 'Cadeia de suprimentos do frontend (Safe{Wallet}) — drainer injetado no JS', plano: 'P22, P27, P24' },
  { nome: 'Ronin Network', ano: 2022, valor: 'US$ 625 mi', vetor: 'Spearphishing + controle de nós validadores (grupo Lazarus)', plano: 'P02, P25, P32' },
  { nome: 'Poly Network', ano: 2021, valor: 'US$ 611 mi', vetor: 'Falha de contrato entre cadeias (validação de permissões)', plano: 'P26, P21, P25' },
  { nome: 'Coincheck', ano: 2018, valor: 'US$ 530 mi', vetor: 'Chaves quentes sem multi-sig/cold storage adequado', plano: 'P24, P25' },
  { nome: 'Kaseya/REvil', ano: 2021, valor: 'US$ 70 mi', vetor: 'Cadeia de suprimentos de software + ransomware em massa', plano: 'P22, P28, P06' },
]
