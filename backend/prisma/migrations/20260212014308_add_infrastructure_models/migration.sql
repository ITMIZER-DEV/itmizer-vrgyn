-- CreateTable
CREATE TABLE "server_requirements" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "is_recommended" BOOLEAN NOT NULL DEFAULT false,
    "qnt_pdvs_min" INTEGER NOT NULL DEFAULT 0,
    "qnt_pdvs_max" INTEGER NOT NULL DEFAULT 999,
    "ram_gb" INTEGER NOT NULL,
    "cpu_cores" INTEGER,
    "cpu_model" TEXT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "storage_gb" INTEGER NOT NULL,
    "recommended_os" TEXT,
    "software" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminal_requirements" (
    "id" TEXT NOT NULL,
    "terminal_type" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "application" TEXT NOT NULL,
    "ram_gb" INTEGER NOT NULL,
    "cpu_model" TEXT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "storage_gb" INTEGER NOT NULL,
    "min_resolution" TEXT,
    "so_distribution" TEXT,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terminal_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internet_requirements" (
    "id" TEXT NOT NULL,
    "link_type" TEXT NOT NULL,
    "upload_mb" INTEGER NOT NULL,
    "download_mb" INTEGER NOT NULL,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internet_requirements_pkey" PRIMARY KEY ("id")
);
