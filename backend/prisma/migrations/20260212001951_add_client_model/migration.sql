-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "client_id" TEXT;

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nome_fantasia" TEXT NOT NULL,
    "razao_social" TEXT,
    "cnpj" TEXT NOT NULL,
    "endereco" TEXT,
    "contato_nome" TEXT,
    "contato_email" TEXT,
    "contato_telefone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_cnpj_key" ON "clients"("cnpj");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
