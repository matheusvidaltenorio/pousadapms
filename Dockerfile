# Dockerfile para deploy da API Pousada PMS
# Imagem completa (não slim) - máxima compatibilidade com Prisma
FROM --platform=linux/amd64 node:20 AS builder

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
FROM --platform=linux/amd64 node:20

WORKDIR /app

# Copiar dependências e build (imagem full já inclui OpenSSL)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production

EXPOSE 3000

# Só inicia a API - migrações rode localmente (DATABASE_URL apontando pro Supabase)
CMD ["node", "apps/api/dist/src/main.js"]
