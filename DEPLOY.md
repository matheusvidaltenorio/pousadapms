# Deploy no Render - Pousada PMS

Este guia descreve como fazer o deploy do Pousada PMS no [Render](https://render.com). Há duas opções:
- **Deploy com Blueprint** (`render.yaml`) — automatizado
- **Deploy manual com Docker** — usando Dockerfile

---

## Opção A: Deploy manual com Docker

Use esta opção quando quiser controle total sobre o build e o ambiente da API.

### Pré-requisitos
- Conta no [Render](https://render.com)
- Repositório no GitHub com o código do projeto

---

### Parte 1: Banco de dados PostgreSQL

| # | Ação | Onde |
|---|------|------|
| 1.1 | Acesse [dashboard.render.com](https://dashboard.render.com) | Navegador |
| 1.2 | Clique no botão **New** (canto superior direito) | Dashboard Render |
| 1.3 | Selecione **PostgreSQL** | Menu dropdown |
| 1.4 | **Name:** `pousada-db` | Campo de nome |
| 1.5 | **Database:** `pousada_pms` | Campo database |
| 1.6 | **Region:** Oregon (ou sua preferência) | Dropdown |
| 1.7 | **Plan:** Free (ou pago) | Dropdown |
| 1.8 | Clique em **Create Database** | Botão |
| 1.9 | Aguarde o provisionamento (~1–2 min) | Tela de status |
| 1.10 | Vá em **Info** ou **Environment** | Aba do banco |
| 1.11 | Copie a **Internal Database URL** | Ex: `postgresql://user:pass@host/db` |

⚠️ Use sempre a **Internal Database URL** (para serviços na mesma região). A External URL é apenas para conexões externas.

---

### Parte 2: API (Web Service com Docker)

| # | Ação | Onde |
|---|------|------|
| 2.1 | No Dashboard, clique em **New** → **Web Service** | Menu |
| 2.2 | Conecte sua conta do GitHub (se ainda não conectou) | Integração |
| 2.3 | Selecione o repositório do projeto | Lista de repositórios |
| 2.4 | Clique em **Connect** no repositório | Botão |

**Configurações principais:**

| # | Campo | Valor |
|---|-------|-------|
| 2.5 | **Name** | `pousada-api` |
| 2.6 | **Region** | Oregon (ou mesma do banco) |
| 2.7 | **Branch** | `main` (ou branch de deploy) |
| 2.8 | **Root Directory** | Deixe em branco |
| 2.9 | **Runtime** | **Docker** ← obrigatório |
| 2.10 | **Dockerfile Path** | `Dockerfile` |
| 2.11 | **Instance Type** | Free (ou pago) |

**Variáveis de ambiente (Environment):**

| # | Key | Value |
|---|-----|-------|
| 2.12 | `DATABASE_URL` | Cole a Internal Database URL (Passo 1.11) |
| 2.13 | `JWT_SECRET` | Gere um valor aleatório (ex: `openssl rand -base64 32`) |
| 2.14 | `NODE_ENV` | `production` |
| 2.15 | `CORS_ORIGIN` | `https://pousada-web.onrender.com` (ajuste após criar o frontend) |

| # | Ação |
|---|------|
| 2.16 | Clique em **Create Web Service** |
| 2.17 | Aguarde o build do Docker (~3–5 min) |
| 2.18 | Copie a URL da API (ex: `https://pousada-api.onrender.com`) |

---

### Parte 3: Frontend (Static Site)

| # | Ação | Onde |
|---|------|------|
| 3.1 | No Dashboard, clique em **New** → **Static Site** | Menu |
| 3.2 | Selecione o mesmo repositório do projeto | Lista |
| 3.3 | Clique em **Connect** | Botão |

**Configurações principais:**

| # | Campo | Valor |
|---|-------|-------|
| 3.4 | **Name** | `pousada-web` |
| 3.5 | **Branch** | `main` |
| 3.6 | **Root Directory** | Deixe em branco |
| 3.7 | **Build Command** | `npm install && npm run build:web` |
| 3.8 | **Publish Directory** | `apps/web/dist` |

**Variáveis de ambiente:**

| # | Key | Value |
|---|-----|-------|
| 3.9 | `VITE_API_URL` | `https://pousada-api.onrender.com/api` (URL da API + `/api`) |

**Redirects (SPA - React Router):**

| # | Ação |
|---|------|
| 3.10 | Em **Redirects/Rewrites**, adicione: `/*` → `/index.html` |
| 3.11 | Clique em **Create Static Site** |
| 3.12 | Aguarde o build (~2–3 min) |
| 3.13 | Copie a URL do frontend (ex: `https://pousada-web.onrender.com`) |

---

### Parte 4: Ligar API e Frontend

| # | Ação |
|---|------|
| 4.1 | Vá no serviço **pousada-api** → **Environment** |
| 4.2 | Atualize `CORS_ORIGIN` com a URL real do frontend (Passo 3.13) |
| 4.3 | Salve (o serviço fará redeploy automático ou clique em **Manual Deploy**) |
| 4.4 | Se `VITE_API_URL` não estava definida antes do build do frontend: vá em **pousada-web** → **Environment** → adicione `VITE_API_URL` → **Manual Deploy** |

---

### Parte 5: Deploy manual (quando fizer alterações no código)

| # | Ação |
|---|------|
| 5.1 | Faça push das alterações para a branch (ex: `main`) |
| 5.2 | No Dashboard, selecione **pousada-api** |
| 5.3 | Clique em **Manual Deploy** → **Deploy latest commit** |
| 5.4 | Se alterou o frontend: repita para **pousada-web** |

---

## Opção B: Deploy com Blueprint (render.yaml)

Deploy automatizado que cria PostgreSQL, API e Static Site de uma vez.

### Parte 1: Conectar e aplicar o Blueprint

| # | Ação |
|---|------|
| 1.1 | Acesse [dashboard.render.com](https://dashboard.render.com) |
| 1.2 | **New** → **Blueprint** |
| 1.3 | Conecte o GitHub (se necessário) |
| 1.4 | Selecione o repositório (ex: `matheusvidaltenorio/pousadapms`) |
| 1.5 | Render detectará o `render.yaml` na raiz |
| 1.6 | Clique em **Apply** |
| 1.7 | Aguarde a criação dos 3 recursos: PostgreSQL, API, Static Site |

---

### Parte 2: Variáveis manuais (após primeiro deploy)

**API (`pousada-api`):**

| # | Ação |
|---|------|
| 2.1 | Vá em **pousada-api** → **Environment** |
| 2.2 | Adicione `CORS_ORIGIN` = `https://pousada-web.onrender.com` (ajuste com sua URL) |

**Static Site (`pousada-web`):**

| # | Ação |
|---|------|
| 2.3 | Vá em **pousada-web** → **Environment** |
| 2.4 | Adicione `VITE_API_URL` = `https://pousada-api.onrender.com/api` |
| 2.5 | **Manual Deploy** → **Deploy latest commit** (obrigatório: Vite usa variáveis em build time) |

---

### Ordem recomendada
1. Aguarde a API terminar o deploy
2. Copie a URL da API
3. Configure `CORS_ORIGIN` na API com a URL do frontend
4. Configure `VITE_API_URL` no Static Site com `URL_DA_API/api`
5. Redeploy do Static Site

---

## URLs finais

| Serviço | URL | Observação |
|---------|-----|------------|
| Frontend | `https://pousada-web.onrender.com` | Static Site |
| API | `https://pousada-api.onrender.com/api` | Prefixo `/api` já incluído |

---

## Troubleshooting

| Problema | Solução |
|---------|---------|
| API não conecta ao banco | Verifique se `DATABASE_URL` está correta (Internal URL). Banco e API na mesma região. |
| CORS bloqueando requisições | `CORS_ORIGIN` deve ser exatamente a URL do frontend, sem barra no final. |
| Frontend não chama a API | Confirme `VITE_API_URL` e faça redeploy do Static Site. Variáveis do Vite são em build time. |
| Build do Docker falha | Verifique se `Dockerfile` está na raiz e se o `package-lock.json` existe. |
| **500 no cadastro/registro** | 1) Verifique os **Logs** da API no Render para ver o erro real. 2) **Rode o seed**: o cadastro exige que exista pelo menos uma propriedade. Use `DATABASE_URL` do banco e execute: `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma` e depois `npx prisma db seed --schema=apps/api/prisma/schema.prisma`. 3) Se usar Supabase, confirme a Connection string (Pooler, usuário correto) e que as migrações foram aplicadas. |
