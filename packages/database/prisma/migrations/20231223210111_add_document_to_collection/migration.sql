-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_collectionId_fkey";

-- CreateTable
CREATE TABLE "DocumentToCollection" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "indexingStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentToCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentToCollection_id_idx" ON "DocumentToCollection"("id");

-- AddForeignKey
ALTER TABLE "DocumentToCollection" ADD CONSTRAINT "DocumentToCollection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentToCollection" ADD CONSTRAINT "DocumentToCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "DocumentCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
