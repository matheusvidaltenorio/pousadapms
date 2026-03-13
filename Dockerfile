# Dockerfile para deploy da API Pousada PMS
# Usa node:20-slim (Debian) - Alpine causa problemas com Prisma/OpenSSL
FROM --platform=linux/amd64 node:20-slim AS builder

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY apps/api ./apps/api
COPY packages ./packages

# Gerar Prisma Client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build da API
RUN npm run build:api

# Estágio de produção
FROM --platform=linux/amd64 node:20-slim

WORKDIR /app

# Dependências para Prisma (libssl, etc)
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copiar dependências e build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production

EXPOSE 3000

# Migrações + start
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
