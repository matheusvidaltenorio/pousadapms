# Configuração do Banco de Dados — Pousada PMS

Este documento descreve a configuração do banco de dados, como identificar problemas de conexão e como garantir que os dados sejam persistidos corretamente no PostgreSQL.

---

## ETAPA 1 — Banco de Dados Utilizado

### Banco: **PostgreSQL** (via Prisma ORM)

O projeto **não utiliza** SQLite, MySQL ou outro banco. A conexão é exclusivamente com **PostgreSQL**.

### Onde está definida a conexão

| Arquivo | Responsabilidade |
|---------|------------------|
| `apps/api/prisma/schema.prisma` | Define `provider = "postgresql"` e `url = env("DATABASE_URL")` |
| `apps/api/.env` | Contém a variável `DATABASE_URL` (não versionada) |
| `apps/api/.env.example` | Exemplo da configuração esperada |
| `apps/api/src/shared/database/prisma.service.ts` | PrismaService que conecta ao banco na inicialização |

### Trecho do schema.prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## ETAPA 2 — Verificação da Conexão com PostgreSQL

### Configuração esperada

| Parâmetro | Valor padrão (Docker) | Descrição |
|-----------|----------------------|-----------|
| **host** | `localhost` | Servidor PostgreSQL |
| **porta** | `5432` | Porta padrão do PostgreSQL |
| **database** | `pousada_pms` | **Nome do banco** (com underscore) |
| **user** | `postgres` | Usuário de conexão |
| **password** | `postgres` | Senha (ajustar em produção) |
| **schema** | `public` | Esquema padrão |

### ⚠️ ATENÇÃO: Nome do banco

O projeto está configurado para usar o banco **`pousada_pms`** (com underscore).

Se você estiver visualizando no pgAdmin um banco chamado **`pousadapms`** (sem underscore), são **databases diferentes**. As tabelas estarão no `pousada_pms`, não no `pousadapms`.

**No pgAdmin, verifique:**
- Databases → **pousada_pms** (não `pousadapms`)
- Ou crie o banco `pousada_pms` se ele não existir

### Formato da DATABASE_URL

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

**Exemplo (desenvolvimento local):**
```
postgresql://postgres:postgres@localhost:5432/pousada_pms?schema=public
```

**Exemplo (Render ou outro host remoto):**
```
postgresql://user:senha@host.exemplo.com:5432/pousada_pms?schema=public
```

---

## ETAPA 3 — Criar as Tabelas (Migrations)

O Prisma já possui migrations prontas. As tabelas são criadas ao executar:

```bash
# Na raiz do projeto
cd apps/api

# Ou a partir da raiz
npm run db:migrate
```

Isso executa `prisma migrate dev`, que:
1. Conecta ao banco definido em `DATABASE_URL`
2. Cria a tabela `_prisma_migrations` (controle de migrations)
3. Aplica as migrations em `apps/api/prisma/migrations/`

### Tabelas criadas (mapeamento Prisma → PostgreSQL)

| Modelo Prisma | Tabela PostgreSQL |
|---------------|-------------------|
| User | `users` |
| Property | `properties` |
| PropertyUser | `property_users` |
| RoomType | `room_types` |
| Room | `rooms` |
| Guest | `guests` |
| Booking | `bookings` |
| BookingGuest | `booking_guests` |
| Payment | `payments` |
| Expense | `expenses` |
| Integration | `integrations` |
| SyncLog | `sync_logs` |

Equivalência com os nomes informados:

- **quartos** → `rooms` (número, status) + `room_types` (tipo, capacidade, preço)
- **hospedes** → `guests`
- **reservas** → `bookings`
- **pagamentos** → `payments`

---

## ETAPA 4 — Garantir Persistência

### 1. Banco em execução

```bash
# Com Docker (recomendado)
docker-compose up -d
```

### 2. `DATABASE_URL` correta

Crie/edite `apps/api/.env`:

```bash
cp apps/api/.env.example apps/api/.env
# Edite apps/api/.env e ajuste DATABASE_URL se necessário
```

### 3. Executar migrations

```bash
npm run db:migrate
```

### 4. Executar seed (dados iniciais)

```bash
npm run db:seed
```

Isso cria:
- Usuário admin: `admin@pousada.com` / `admin123`
- Propriedade de exemplo
- 2 quartos (101, 102)
- 1 hóspede de exemplo

---

## ETAPA 5 — Teste de Conexão

### Via API (endpoint de saúde)

Com a API rodando (`npm run dev:api`), acesse:

```
GET http://localhost:3000/health
GET http://localhost:3000/health/db
```

- `/health` — verifica se a API está no ar
- `/health/db` — verifica conexão com PostgreSQL e lista tabelas

### Via Prisma Studio

```bash
npm run db:studio
```

Abre interface gráfica em `http://localhost:5555` para visualizar e editar dados.

### Via linha de comando

```bash
cd apps/api
npx prisma migrate status
```

Mostra o status das migrations (aplicadas ou pendentes).

---

## ETAPA 6 — Deploy no Render

### 1. Criar banco PostgreSQL no Render

1. Acesse [render.com](https://render.com)
2. Dashboard → **New** → **PostgreSQL**
3. Crie o banco e anote:
   - **Internal Database URL** (para uso dentro do Render)
   - **External Database URL** (para acesso externo)

### 2. Configurar variável no serviço da API

No serviço Web Service da API no Render:
- **Environment** → adicione:
  - `DATABASE_URL` = URL fornecida pelo Render (ex: `postgres://user:pass@dpg-xxx.oregon-postgres.render.com/dbname`)

O Render oferece a URL no formato correto. Use a **Internal Database URL** se API e banco estiverem no mesmo ambiente.

### 3. Rodar migrations no deploy

No Render, no build da API, adicione:

**Build Command:**
```
npm install && npx prisma generate && npm run build
```

**Start Command:**
```
npx prisma migrate deploy && node dist/main
```

Ou use um script de start que rode `prisma migrate deploy` antes de iniciar a API.

---

## Resumo de Comandos

| Objetivo | Comando |
|----------|---------|
| Subir PostgreSQL (Docker) | `docker-compose up -d` |
| Criar/atualizar tabelas | `npm run db:migrate` |
| Deploy de migrations (produção) | `cd apps/api && npx prisma migrate deploy` |
| Dados iniciais | `npm run db:seed` |
| Ver status das migrations | `cd apps/api && npx prisma migrate status` |
| Interface visual do banco | `npm run db:studio` |

---

## Problemas Comuns

### "Nenhuma tabela no pgAdmin"

- Verifique se está no banco **`pousada_pms`** (não `pousadapms`)
- Execute `npm run db:migrate` e confira em `apps/api` se `DATABASE_URL` em `.env` aponta para esse banco

### "Authentication failed"

- Confira usuário e senha em `DATABASE_URL`
- Docker: user `postgres`, senha `postgres` (conforme `docker-compose.yml`)

### "Connection refused"

- PostgreSQL não está rodando: use `docker-compose up -d` ou inicie o serviço localmente
