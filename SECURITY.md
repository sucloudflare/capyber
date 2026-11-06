# Política de segurança

## Reportando uma vulnerabilidade

Encontrou uma falha no CAPYBER? **Não abra uma issue pública.** Use o recurso
*Private vulnerability reporting* do GitHub (aba **Security → Report a vulnerability**)
deste repositório, com passos de reprodução e impacto estimado.

Compromisso: resposta inicial em até 7 dias e correção priorizada por severidade.

## Escopo

Autenticação/sessões/MFA, rotas `/api/*`, emissão de certificados, motor CAPYCORE
(`mini-services/threat-engine`) e a configuração de contêiner. Todos os cenários,
alvos e métricas da plataforma são **dados sintéticos** — achados sobre eles não
configuram vazamento.

## Controles já presentes

- Senhas com bcrypt (custo 12) + política forte (mín. 12 caracteres, 4 classes).
- Sessões por token opaco em cookie `httpOnly`/`SameSite=Lax`/`Secure` (prod);
  **só o SHA-256 do token é gravado no banco**.
- MFA TOTP (RFC 6238) com comparação em tempo constante.
- Rate limit no login (por IP+e-mail **e** por IP), demo, certificados e rotas de IA.
- Login com tempo de resposta equalizado (sem enumeração de contas por timing).
- CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`; CI com osv-scanner e Dependabot.

## Limitações conhecidas

- Rate limit em memória: com várias instâncias, trocar por store compartilhado (Redis).
- CSP ainda usa `'unsafe-inline'` em scripts/estilos (migrar para nonce via middleware).
- Códigos TOTP podem ser reutilizados dentro da janela de ±30 s (sem anti-replay).
