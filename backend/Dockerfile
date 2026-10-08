# ==========================================
# Multi-stage Dockerfile para Backend NestJS + Prisma
# ==========================================

# Estágio 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências necessárias para compilação nativa
RUN apk add --no-cache openssl

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código fonte e configurações
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Compilar NestJS
RUN npm run build

# Limpar devDependencies para economizar espaço
RUN npm prune --production

# ==========================================
# Estágio 2: Produção
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar openssl para o Prisma Engine rodar no Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copiar build e dependências de produção
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Executa migrações do Prisma e inicia a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
