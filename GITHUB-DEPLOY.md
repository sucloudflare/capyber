# 🚀 Como publicar o CAPYBER no GitHub

Este repositório já está **pronto para o GitHub**. Siga os passos abaixo (2 minutos).

---

## Opção 1 — Enviar este repositório (com histórico de commits) ✅ recomendado

### 1. Crie o repositório no GitHub
1. Acesse [github.com/new](https://github.com/new)
2. Nome sugerido: `capyber`
3. **NÃO** marque "Add a README", "Add .gitignore" ou "Choose a license" (deixe vazio)
4. Clique em **Create repository**

### 2. Conecte e envie
Copie o repositório para uma máquina com `git` instalado e rode:

```bash
cd capyber
git remote add origin https://github.com/sucloudflare/capyber.git
git branch -M main
git push -u origin main
```

> Se preferir SSH: `git remote add origin git@github.com:sucloudflare/capyber.git`

Se você recebeu o arquivo `capyber-github.bundle`, ele contém **todo o histórico**:

```bash
git clone capyber-github.bundle capyber
cd capyber
git remote add origin https://github.com/sucloudflare/capyber.git
git push -u origin main
```

---

## Opção 2 — Subir apenas o código (sem histórico)

```bash
cd capyber
rm -rf .git
git init
git add .
git commit -m "CAPYBER — plataforma de simulação e defesa cibernética"
git branch -M main
git remote add origin https://github.com/sucloudflare/capyber.git
git push -u origin main
```

---

## ▶️ Como rodar o projeto depois de clonar

Requisitos: [Node.js 20+](https://nodejs.org) ou [Bun](https://bun.sh)

```bash
# 1. instalar dependências
bun install        # ou: npm install

# 2. configurar variáveis de ambiente
cp .env.example .env

# 3. criar/atualizar o banco de dados (SQLite)
bun run db:push

# 4. iniciar o motor de ameaças (serviço separado, porta 3003)
cd mini-services/threat-engine && bun install && bun run dev &
cd ../..

# 5. iniciar a aplicação (porta 3000)
bun run dev        # ou: npm run dev
```

Acesse `http://localhost:3000`. Se houver um gateway Caddy na frente (porta 81), acesse por ele para o socket.io funcionar.

---

## 📦 O que está incluído

| Pasta/Arquivo | Descrição |
|---|---|
| `src/` | Aplicação Next.js 16 (App Router) + componentes |
| `mini-services/threat-engine/` | Motor de ameaças em tempo real (socket.io, porta 3003) |
| `prisma/` | Schema do banco (SQLite via Prisma ORM) |
| `db/custom.db` | Banco de dados SQLite já populado |
| `public/` | Logo, vídeos e arquivos estáticos |
| `examples/` | Exemplo de websocket de referência |
| `.github/workflows/` | CI pronta para o GitHub Actions |
| `GITHUB-DEPLOY.md` | Este guia |

## 🔒 Segurança

- O `.env` **não** versionado (apenas `.env.example`). 
- Verificações do Dependabot já configuradas em `.github/dependabot.yml`.
- Consulte `SECURITY.md` para a política de segurança.
