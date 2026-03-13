# Deploy no Render - Pousada PMS

Este guia descreve como fazer o deploy do Pousada PMS no [Render](https://render.com) usando o Blueprint (`render.yaml`).

## Pré-requisitos

- Conta no [Render](https://render.com)
- Repositório no GitHub com o código do projeto

## Passo 1: Conectar o repositório

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **New** → **Blueprint**
3. Conecte sua conta do GitHub (se ainda não estiver conectada)
4. Selecione o repositório `matheusvidaltenorio/pousadapms`
5. Render detectará automaticamente o `render.yaml` na raiz

## Passo 2: Deploy inicial

1. Clique em **Apply** para criar os recursos:
   - **PostgreSQL** (`pousada-db`)
   - **API NestJS** (`pousada-api`)
   - **Static Site** (`pousada-web`)

2. Durante o deploy, a API e o banco serão provisionados. O Static Site solicitará variáveis que não estão no Blueprint.

## Passo 3: Variáveis manuais (após primeiro deploy)

Após o deploy, é necessário configurar **duas variáveis** manualmente no Dashboard:

### API (`pousada-api`)

| Variável    | Valor                                                                 | Onde definir                         |
|------------|-----------------------------------------------------------------------|--------------------------------------|
| `CORS_ORIGIN` | URL do frontend (ex: `https://pousada-web.onrender.com`)             | Environment → API → Add Variable     |

### Static Site (`pousada-web`)

| Variável       | Valor                                                                 | Onde definir                         |
|----------------|-----------------------------------------------------------------------|--------------------------------------|
| `VITE_API_URL` | URL da API + `/api` (ex: `https://pousada-api.onrender.com/api`)     | Environment → Static Site → Add Variable |

⚠️ **Importante:** `VITE_API_URL` é usada em **build time** pelo Vite. Depois de adicionar essa variável, é preciso fazer um **redeploy manual** do Static Site (Dashboard → pousada-web → Manual Deploy).

## Passo 4: Redeploy do frontend

1. Vá em **pousada-web** no Dashboard
2. **Environment** → adicione `VITE_API_URL` = `https://pousada-api.onrender.com/api` (use a URL real da sua API)
3. Salve
4. **Manual Deploy** → **Deploy latest commit**

## Ordem recomendada

1. Aguarde a API (`pousada-api`) concluir o deploy
2. Copie a URL da API (ex: `https://pousada-api.onrender.com`)
3. Configure `CORS_ORIGIN` na API com a URL do frontend
4. Configure `VITE_API_URL` no Static Site com `https://pousada-api.onrender.com/api`
5. Faça redeploy do Static Site

## URLs finais

- **Frontend:** `https://pousada-web.onrender.com` (ou conforme nome do projeto)
- **API:** `https://pousada-api.onrender.com/api` (prefixo `/api` já incluído)

## Troubleshooting

### API não conecta ao banco

- Confirme que `DATABASE_URL` está sendo injetada via `fromDatabase`
- O banco deve ser criado antes ou junto com a API pelo Blueprint

### CORS bloqueando requisições

- Garanta que `CORS_ORIGIN` na API seja exatamente a URL do frontend (sem barra no final)

### Frontend não chama a API

- Verifique se `VITE_API_URL` está definida e se houve redeploy após alteração
- No navegador, confira se as requisições vão para a URL correta da API
