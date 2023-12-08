-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentChunkId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "documentId" TEXT NOT NULL,
    "chatMessageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Citation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Citation_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "ChatMessage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Citation_id_idx" ON "Citation"("id");
