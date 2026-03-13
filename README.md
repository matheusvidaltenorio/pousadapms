# Pousada PMS

Sistema de gestão para pousadas, hotéis pequenos e hostels (Property Management System).

## Tecnologias

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma
- **Banco:** PostgreSQL 16

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
# Copie o exemplo e edite
cp .env.example .env

# No .env, configure pelo menos:
# DATABASE_URL="postgresql://pousada:pousada@localhost:5432/pousada_pms"
# JWT_SECRET="sua-chave-secreta-forte"
```

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
| `pnpm run db:migrate` | Executa migrations |
| `pnpm run db:studio` | Abre Prisma Studio |
| `pnpm run lint` | Executa lint em todos os pacotes |

## Licença

Proprietário - Uso comercial restrito
