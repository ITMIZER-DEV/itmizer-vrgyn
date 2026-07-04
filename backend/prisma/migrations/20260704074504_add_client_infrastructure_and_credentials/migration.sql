-- CreateEnum
CREATE TYPE "ClientInfraType" AS ENUM ('SERVIDOR_BANCO', 'SERVIDOR_APLICACAO', 'SERVIDOR_GERENCIADOR', 'ESTACAO_TRABALHO', 'TERMINAL_PDV');

-- CreateTable
CREATE TABLE "client_infrastructure" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "type" "ClientInfraType" NOT NULL,
    "nome" TEXT NOT NULL,
    "hostname" TEXT,
    "ip_address" TEXT,
    "operating_system" TEXT,
    "cpu_model" TEXT,
    "ram_gb" INTEGER,
    "storage_gb" INTEGER,
    "storage_type" TEXT,
    "observacoes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_infrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "ClientCredentialType" AS ENUM ('ACESSO_REMOTO', 'BANCO_DADOS', 'VPN', 'SISTEMA_APLICACAO', 'OUTRO');

-- CreateTable
CREATE TABLE "client_credentials" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "type" "ClientCredentialType" NOT NULL,
    "label" TEXT NOT NULL,
    "username" TEXT,
    "secret_ciphertext" TEXT NOT NULL,
    "secret_iv" TEXT NOT NULL,
    "secret_auth_tag" TEXT NOT NULL,
    "responsavel_nome" TEXT,
    "responsavel_telefone" TEXT,
    "responsavel_email" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "ClientCredentialAction" AS ENUM ('VIEW', 'COPY');

-- CreateTable
CREATE TABLE "client_credential_access_logs" (
    "id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "ClientCredentialAction" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_credential_access_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "client_infrastructure" ADD CONSTRAINT "client_infrastructure_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_credentials" ADD CONSTRAINT "client_credentials_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_credentials" ADD CONSTRAINT "client_credentials_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_credential_access_logs" ADD CONSTRAINT "client_credential_access_logs_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "client_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_credential_access_logs" ADD CONSTRAINT "client_credential_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
