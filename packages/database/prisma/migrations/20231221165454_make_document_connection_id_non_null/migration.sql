/*
  Warnings:

  - Made the column `connectionId` on table `Document` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_connectionId_fkey";

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "connectionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DataSourceConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
