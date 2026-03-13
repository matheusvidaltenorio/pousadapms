# Pousada PMS

Sistema de gestão para pousadas, hotéis pequenos e hostels (Property Management System).

## Aplicação em produção

| Ambiente | URL |
|----------|-----|
| **Frontend** | [https://pousadapms-web.onrender.com](https://pousadapms-web.onrender.com) |
| **API** | [https://pousada-api-zfm4.onrender.com/api](https://pousada-api-zfm4.onrender.com/api) |

**Stack de deploy:** Banco (Supabase) · API (Render, Docker) · Frontend (Render, Static Site)

Guia completo: [DEPLOY.md](DEPLOY.md)

---

## Tecnologias

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma
- **Banco:** PostgreSQL (Supabase em produção)

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (ou npm/yarn)
- Docker e Docker Compose (para PostgreSQL local)

## Setup

### 1. Instalar dependências

```bash
# Com npm (já vem com Node.js)
npm install

# Ou com pnpm
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
# Copie o exemplo e edite (o .env fica em apps/api/)
cp apps/api/.env.example apps/api/.env

# No apps/api/.env, configure pelo menos:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pousada_pms?schema=public"
# JWT_SECRET="sua-chave-secreta-forte"
```

> **Importante:** O banco de dados do projeto é `pousada_pms` (com underscore).  
> No pgAdmin, verifique em **Databases → pousada_pms**. Se você criou `pousadapms` (sem underscore), são bancos diferentes.

### 3. Subir o banco de dados

```bash
docker-compose up -d
```

Se não tiver Docker, use um PostgreSQL local e ajuste o `DATABASE_URL` no `.env`.

### 4. Executar migrations e seed

```bash
npm run db:migrate
npm run db:seed
```

O seed cria um usuário de teste: **admin@pousada.com** / **admin123**.

### 5. Iniciar desenvolvimento

Abra dois terminais:

```bash
# Terminal 1 - Backend
npm run dev:api

# Terminal 2 - Frontend
npm run dev:web
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Banco:** localhost:5432

## Estrutura do Projeto

```
pousada-pms/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend React
├── packages/
│   └── shared-types/ # Tipos TypeScript compartilhados
├── docker-compose.yml
└── README.md
```

## Scripts Principais

| Comando | Descrição |
|---------|-----------|
| `pnpm run dev` | Inicia API e Web em paralelo |
| `pnpm run dev:api` | Apenas backend |
| `pnpm run dev:web` | Apenas frontend |
| `pnpm run build` | Build de produção |
| `pnpm run db:migrate` | Executa migrations (dev) |
| `pnpm run db:migrate:deploy` | Executa migrations (produção) |
| `pnpm run db:seed` | Popula dados iniciais |
| `pnpm run db:verify` | Verifica status das migrations |
| `pnpm run db:studio` | Abre Prisma Studio |
| `pnpm run lint` | Executa lint em todos os pacotes |

## Diagnóstico do banco

Se as tabelas não aparecem no pgAdmin:

1. **Banco correto?** Verifique **Databases → pousada_pms** (com underscore).
2. **Migrations aplicadas?** Execute `npm run db:migrate` e depois `npm run db:verify`.
3. **API no ar?** Acesse `http://localhost:3000/health/db` — retorna conexão e lista de tabelas.

Documentação detalhada: [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)

## Licença

Proprietário - Uso comercial restrito
