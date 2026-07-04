-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('CONSULTA', 'INCLUSAO_EDICAO', 'ESPECIAL');

-- AlterTable: Add granular permission columns to menus table
ALTER TABLE "menus"
ADD COLUMN "roles_consulta" "AppRole"[] DEFAULT ARRAY['admin']::"AppRole"[],
ADD COLUMN "roles_inclusao_edicao" "AppRole"[] DEFAULT ARRAY['admin']::"AppRole"[],
ADD COLUMN "roles_especial" "AppRole"[] DEFAULT ARRAY['admin']::"AppRole"[];

-- AlterTable: Add granular permission columns to submenus table
ALTER TABLE "submenus"
ADD COLUMN "roles_consulta" "AppRole"[] DEFAULT ARRAY['admin']::"AppRole"[],
ADD COLUMN "roles_inclusao_edicao" "AppRole"[] DEFAULT ARRAY['admin']::"AppRole"[],
ADD COLUMN "roles_especial" "AppRole"[] DEFAULT ARRAY['admin']::"AppRole"[];

-- Update existing records to copy roles to all permission types
UPDATE "menus" SET
  "roles_consulta" = "roles",
  "roles_inclusao_edicao" = "roles",
  "roles_especial" = "roles";

UPDATE "submenus" SET
  "roles_consulta" = "roles",
  "roles_inclusao_edicao" = "roles",
  "roles_especial" = "roles";

-- Comment on columns
COMMENT ON COLUMN "menus"."roles_consulta" IS 'Roles permitidos para consulta/visualização';
COMMENT ON COLUMN "menus"."roles_inclusao_edicao" IS 'Roles permitidos para inclusão e edição';
COMMENT ON COLUMN "menus"."roles_especial" IS 'Roles permitidos para ações especiais (aprovar, exportar, etc)';

COMMENT ON COLUMN "submenus"."roles_consulta" IS 'Roles permitidos para consulta/visualização';
COMMENT ON COLUMN "submenus"."roles_inclusao_edicao" IS 'Roles permitidos para inclusão e edição';
COMMENT ON COLUMN "submenus"."roles_especial" IS 'Roles permitidos para ações especiais (aprovar, exportar, etc)';
