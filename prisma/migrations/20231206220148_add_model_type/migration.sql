-- AlterTable
ALTER TABLE "Chat" ADD COLUMN "modelType" TEXT;

-- AlterTable
ALTER TABLE "DocumentCollection" ADD COLUMN "modelType" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "defaultModelType" TEXT;
