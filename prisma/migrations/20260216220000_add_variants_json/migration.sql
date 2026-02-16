-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "fullPrice";
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "halfPrice";
ALTER TABLE "MenuItem" ADD COLUMN "variants" JSONB;
