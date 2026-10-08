# 🐳 Guia de Deploy & Migração: Docker + Portainer (ITmizer-VR)

Este guia orienta o processo de migração do **Prisma Platform / Vercel** para **Containers Docker gerenciados pelo Portainer**, além de detalhar o uso das ferramentas automatizadas de **Backup** e **Restore**.

---

## 1. Ferramentas de Backup & Restore

O projeto possui scripts inteligentes desenvolvidos para extrair e restaurar 100% dos dados com preservação de integridade referencial.

### 📦 A. Gerando Backup do Banco Antigo

Para extrair os dados do banco atual para um arquivo JSON estruturado em `/backups`:

```bash
cd backend
npm run db:backup
```

> **Dica:** Você pode passar uma URL específica de conexão diretamente via parâmetro:
> ```bash
> npm run db:backup -- --url="postgresql://usuario:senha@host:5432/banco"
> ```

O arquivo será gravado em `backups/backup_itmizer_YYYY-MM-DD_HH-mm-ss.json`.

---

### 📥 B. Restaurando os Dados no Novo Banco (Docker)

Após subir o novo PostgreSQL no Docker e rodar as migrações:

```bash
cd backend
npm run db:restore
```

> Por padrão, o script seleciona automaticamente o **backup mais recente** da pasta `/backups`.
> Para restaurar um arquivo específico ou apontar para um banco remoto:
> ```bash
> npm run db:restore -- --file=backups/backup_itmizer_2026-10-08.json --url="postgresql://postgres:senha@ip-do-servidor:5432/itmizer_vr"
> ```

---

## 2. Testando Localmente com Docker

Se desejar testar o novo fluxo em seu computador antes de subir no Portainer:

### 1. Subir apenas o banco PostgreSQL local:
```bash
docker compose -f docker-compose.local.yml up -d
```
*(O banco ficará disponível em `localhost:5432` com usuário `postgres` e senha `postgrespassword`)*

### 2. Aplicar as Migrations do Prisma:
```bash
cd backend
npx prisma migrate deploy
```

### 3. Restaurar o Backup:
```bash
npm run db:restore -- --url="postgresql://postgres:postgrespassword@localhost:5432/itmizer_vr"
```

### 4. Iniciar o Backend localmente:
```bash
npm run start:dev
```

---

## 3. Como Criar e Subir a Stack no Portainer

1. Acesse seu painel do **Portainer**.
2. Vá em **Stacks** > **Add stack**.
3. Defina o nome da Stack (ex: `itmizer-vr`).
4. Selecione **Web editor** ou **Repository** (apontando para este repositório Git).
5. Cole o conteúdo do arquivo `docker-compose.yml`.
6. Na seção **Environment variables**, adicione as variáveis com base no [.env.docker.example](file:///d:/Projects/vr/itmizer-VR/.env.docker.example):
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `JWT_SECRET`
   - `CREDENTIAL_ENCRYPTION_KEY`
   - `VITE_API_URL`
   - `BACKEND_PORT` (ex: 3000)
   - `FRONTEND_PORT` (ex: 8080)
7. Clique em **Deploy the stack**.

---

## 4. Persistência de Dados e Segurança

- **Volume Persistente**: O volume `itmizer_pgdata` garante que seus dados do PostgreSQL não serão perdidos ao reiniciar, atualizar ou recriar containers.
- **Isolamento de Rede**: O PostgreSQL roda na rede interna do Docker (`itmizer_network`), protegendo a porta 5432 contra acessos externos não autorizados na internet.
- **Criptografia LGPD**: Credenciais de clientes continuam protegidas via AES-256-GCM através da `CREDENTIAL_ENCRYPTION_KEY`.
