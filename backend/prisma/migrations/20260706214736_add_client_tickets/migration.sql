-- CreateEnum
CREATE TYPE "TicketUrgencia" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateTable
CREATE TABLE "client_tickets" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "numero" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "classificacao" "TicketUrgencia" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_tickets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "client_tickets" ADD CONSTRAINT "client_tickets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
