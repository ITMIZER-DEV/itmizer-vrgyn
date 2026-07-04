-- CreateTable
CREATE TABLE "migration_plans" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "migration_plans_pkey" PRIMARY KEY ("id")
);
