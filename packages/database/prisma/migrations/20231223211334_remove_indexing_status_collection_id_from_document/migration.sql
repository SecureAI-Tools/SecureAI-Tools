/*
  Warnings:

  - You are about to drop the column `collectionId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `indexingStatus` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "collectionId",
DROP COLUMN "indexingStatus";
