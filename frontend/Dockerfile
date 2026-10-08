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
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=861662437462-aiqf9g5nhiqi0f13tv1bki24s9h70amm.apps.googleusercontent.com
ARG VITE_FIREBASE_API_KEY=AIzaSyD2Fkp1yEJrhbNktz7u-AmNvy-NJ3i5uRY
ARG VITE_FIREBASE_AUTH_DOMAIN=itmizer-vr.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=itmizer-vr
ARG VITE_FIREBASE_STORAGE_BUCKET=itmizer-vr.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=861662437462
ARG VITE_FIREBASE_APP_ID=1:861662437462:web:a7b41f068f43e4d6a49bf7
ARG VITE_FIREBASE_MEASUREMENT_ID=G-YRHERM0PTH

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

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
