-- AlterTable
ALTER TABLE "migrations" ADD COLUMN     "responsavel_id" TEXT,
ADD COLUMN     "tipo_cobranca" TEXT DEFAULT 'hora',
ADD COLUMN     "valor_fixo" DECIMAL(10,2),
ADD COLUMN     "valor_hora" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "migration_lancamentos" (
    "id" TEXT NOT NULL,
    "migration_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horas" DECIMAL(5,2),
    "valor" DECIMAL(10,2),
    "descricao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_lancamentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "migrations" ADD CONSTRAINT "migrations_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_lancamentos" ADD CONSTRAINT "migration_lancamentos_migration_id_fkey" FOREIGN KEY ("migration_id") REFERENCES "migrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_lancamentos" ADD CONSTRAINT "migration_lancamentos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
