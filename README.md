# CAPYBER

Plataforma de simulação e defesa cibernética com foco em **endpoints**: motor de ameaças com **8 cenários** mapeados para **MITRE ATT&CK** e kill chain, frota de dispositivos, trilha da defesa com **7 fases** (quiz, terminal e certificado), plano de blindagem com **40 medidas** e o **Capy Fantasma** (base de conhecimento local + LLM), com a voz da VIGIA.

---

> ## ⚠️ Declaração de origem — transparência
> **Este código não é novo.** Este projeto é a continuação de um projeto antigo meu (chamado internamente de `projeto01`), com código escrito **antes da janela de desenvolvimento do hackathon** (antes das 21h de 04/11, horário de Brasília).
>
> - A base foi iniciada a partir de **starters públicos** (create-next-app + shadcn/ui — o pacote se chamava `nextjs_tailwind_shadcn_ts`).
> - O desenvolvimento contou com **auxílio de IA (Claude)** em partes do código.
> - Em cumprimento ao **item 6.4** do Regulamento, declaro aqui o uso de starters públicos e de IA.
>
> Como o **item 6.2** do Regulamento veda reaproveitar no repositório entregue código escrito antes da janela oficial, **este pacote deve ser tratado como backup/referência**. Antes de usá-lo como submissão oficial, confirmar com a organização (**oi@hackbrasil.com**); em caso de vedação, o repo oficial será reimplementado do zero, usando este projeto apenas como especificação.

---

## Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI)
- **Prisma** + SQLite local (`db/custom.db`)
- **three.js** (globo 3D dos alvos) + recharts (gráficos)
- Motor de ameaças próprio em `mini-services/threat-engine` (socket.io, porta 3003)
- zod, socket.io-client, z-ai-web-dev-sdk (operador IA / voz da VIGIA)

## Como rodar

```bash
# 1. copie as variáveis de ambiente de exemplo
cp .env.example .env

# 2. instale as dependências
bun install          # ou: npm install

# 3. gere o banco local (o client do Prisma é gerado no postinstall)
bunx prisma db push  # ou: npx prisma db push

# 4. suba o app
bun run dev          # ou: npm run dev  →  http://localhost:3000
```

Motor de ameaças (serviço separado, opcional em dev):

```bash
cd mini-services/threat-engine
bun install
bun run dev          # socket.io + REST na porta 3003
```

> Se o app não encontrar o banco em dev, ajuste `DATABASE_URL` no `.env` para um caminho absoluto até `db/custom.db` (exemplo comentado no `.env.example`).

---

## Engenharia

### Qualidade (QA)

- **Typecheck estrito**: `bun run typecheck` (`noImplicitAny` ligado, `strict: true`); o `next.config.ts` **não** ignora erros de TypeScript no build.
- **Lint com regras de bug reativadas**: `prefer-const`, `no-unreachable`, `no-redeclare`, `no-fallthrough`, `no-debugger`, `no-empty`, `@typescript-eslint/no-unused-vars`, `no-non-null-assertion` etc. Componentes vendidos do shadcn (`src/components/ui/**`) têm override de pureza — não são reescritos.
- Correções aplicadas na base: vazamentos de GPU/memória no globo 3D (dispose completo de geometrias/materiais/texturas), corrida na fila de voz da VIGIA, timers sem cleanup em 6 componentes, falso "CENÁRIO DISPARADO" com motor offline (agora checa `res.ok`), validação dura do `localStorage` da trilha, atalhos de teclado deixaram de sequestrar `Ctrl/Cmd+V`, legendas do vídeo desacopladas da narração, `devicesSecure` recalculado no motor, limiar da base de conhecimento alinhado com o matcher (respostas instantâneas da KB voltaram a funcionar).

### Segurança (DevSecOps)

- **CSP + HSTS** em produção (`next.config.ts`); `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` em todos os ambientes; `poweredByHeader: false`.
- **Autenticação**: bcrypt (custo 12), política de senha forte, MFA TOTP (RFC 6238) e sessões por cookie `httpOnly`/`SameSite=Lax`/`Secure`; **só o SHA-256 do token de sessão é gravado no banco** (um dump do DB não vira sessão válida) e sessões expiradas são limpas automaticamente.
- **Login resistente a abuso**: rate limit por IP+e-mail **e** por IP (barra password spraying) e tempo de resposta equalizado (bcrypt sempre executa) — sem enumeração de contas por timing.
- **Rate limiting por IP** nas rotas de IA do app (`/api/chat`, `/api/copilot`), no login/demo/certificados e no motor CAPYCORE (token bucket com teto de memória).
- **Validação de entrada**: Zod no Operador IA; history do chat filtrado (só `user`/`assistant`, impede injeção de role `system`); IDs de dispositivo com regex; corpos limitados a 8 KB no motor.
- **`X-Forwarded-For`**: uma única implementação (`src/lib/rate-limit.ts`) usa a última entrada (definida pelo gateway confiável) — a primeira é forjável pelo cliente.
- **Segredos**: `.env` fora do Git (use `.env.example`); `CERT_SALT` configurável por ambiente. Política de divulgação em [`SECURITY.md`](SECURITY.md).
- Motor escuta o socket.io interno apenas em `127.0.0.1`; encerramento gracioso (SIGTERM/SIGINT) com rede de segurança de 5 s.
- Auditoria de dependências via **osv-scanner** no CI. `z-ai-web-dev-sdk` só no backend.

### DevOps

- **CI (GitHub Actions)**: `prisma generate` → typecheck → lint → typecheck do motor → build a cada push/PR, com permissões mínimas, cancelamento de execuções obsoletas e auditoria de vulnerabilidades (osv-scanner). **Dependabot** semanal para npm/Actions/Docker.
- **Docker**: `Dockerfile` multi-stage (build standalone → runtime `node:22-alpine`), usuário sem privilégios, `HEALTHCHECK` consumindo `/api/health`; `.dockerignore` enxuto.
- **Healthcheck**: `GET /api/health` (app + status do motor CAPYCORE) e `GET /api/metrics` no motor (formato Prometheus, pronto para Grafana).
- **Scripts**: `bun run check` (typecheck + lint), `db:push` seguro (o `--accept-data-loss` foi movido para `db:push:force`).

## Estrutura

```
capyber/
├─ src/
│  ├─ app/             # páginas, layout e rotas de API (chat, copilot)
│  ├─ components/      # dashboard, overview, frota, laboratório, trilha (7 fases),
│  │                   # certificado, terminal, Capy Fantasma, VIGIA, eng-video, globo 3D
│  └─ lib/             # dados da trilha, plano de blindagem (40 medidas), KB do
│                      # Capy Fantasma, voz/sfx, tipos e helpers
├─ mini-services/
│  └─ threat-engine/   # CAPYBER CORE: motor de detecção e resposta — 8 cenários
│                      # (SC-DRAIN-03 … SC-C2-10), MITRE ATT&CK, kill chain, playbook
├─ prisma/             # schema do banco (SQLite, com índices de sessão)
├─ .github/            # CI (GitHub Actions) e Dependabot
├─ SECURITY.md         # política de divulgação e controles
├─ db/                 # custom.db — banco local (não versionado)
├─ public/             # vídeo, poster e assets
└─ examples/           # exemplo de websocket herdado do starter
```

## Dados e conteúdo

- Todos os cenários, alvos (CriptoBR Exchange, BancoAI S.A., CapyHoldings) e métricas são **dados sintéticos de demonstração** — nenhum dado real de terceiros, conforme **item 6.9** do Regulamento (declarado no próprio código, em `mini-services/threat-engine/src/scenarios.ts`).

## Vídeo

`public/video/eng-social.mp4` (~10 MB) é usado pelo componente `eng-video`. Ele fica no projeto para o modo local funcionar; para o deploy público, hospedar no YouTube/Vimeo e usar o link, que precisa ser acessível **sem login** (item 7.2). A linha para ignorá-lo no Git já está pronta (comentada) no `.gitignore`.

## Sobre este pacote

- Este projeto está versionado em Git (branch `main`, histórico Git limpo (commit único)).
- **Guia de publicação:** consulte [`GITHUB-DEPLOY.md`](./GITHUB-DEPLOY.md) para publicar no GitHub em 2 minutos — tanto enviando este repositório com histórico quanto do zero.
- Alternativa: o arquivo `capyber-github.bundle` (quando distribuído junto) contém o histórico completo e pode ser clonado diretamente:

```bash
git clone capyber-github.bundle capyber
cd capyber
git remote add origin https://github.com/sucloudflare/capyber.git
git push -u origin main
```

- Respeitando o **item 6.1**, crie o repositório e faça os commits apenas dentro da janela permitida pelo Regulamento.
