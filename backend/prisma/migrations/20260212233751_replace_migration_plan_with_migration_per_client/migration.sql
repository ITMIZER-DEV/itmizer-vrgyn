/*
  Warnings:

  - You are about to drop the `migration_plans` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MigrationStatus" AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- DropTable
DROP TABLE "migration_plans";

-- CreateTable
CREATE TABLE "migrations" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "status" "MigrationStatus" NOT NULL DEFAULT 'pendente',
    "nome_contato_chave" TEXT,
    "telefone" TEXT,
    "acesso_anydesk" TEXT,
    "senha_anydesk" TEXT,
    "nome_sistema" TEXT,
    "nome_software_house" TEXT,
    "tipo_banco_dados" TEXT,
    "items" JSONB NOT NULL DEFAULT '{}',
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_history" (
    "id" TEXT NOT NULL,
    "migration_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "old_status" TEXT,
    "new_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "migrations" ADD CONSTRAINT "migrations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_history" ADD CONSTRAINT "migration_history_migration_id_fkey" FOREIGN KEY ("migration_id") REFERENCES "migrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
