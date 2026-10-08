# ==========================================
# Multi-stage Dockerfile para Frontend Vite + React
# ==========================================

# Estágio 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependências
COPY package*.json ./
RUN npm ci

# Argumentos de build para Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copiar arquivos do projeto
COPY . .

# Compilar build estático para produção
RUN npm run build

# ==========================================
# Estágio 2: Nginx Server
# ==========================================
FROM nginx:1.27-alpine AS runner

# Copiar configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os arquivos gerados pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
