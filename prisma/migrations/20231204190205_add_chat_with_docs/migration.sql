-- CreateTable
CREATE TABLE "DocumentCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "internalName" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DocumentCollection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DocumentCollection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "indexingStatus" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "DocumentCollection" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "type" TEXT,
    "model" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "documentCollectionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Chat_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrgMembership" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chat_documentCollectionId_fkey" FOREIGN KEY ("documentCollectionId") REFERENCES "DocumentCollection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Chat" ("createdAt", "deletedAt", "id", "membershipId", "model", "title", "updatedAt") SELECT "createdAt", "deletedAt", "id", "membershipId", "model", "title", "updatedAt" FROM "Chat";
DROP TABLE "Chat";
ALTER TABLE "new_Chat" RENAME TO "Chat";
CREATE INDEX "Chat_id_idx" ON "Chat"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCollection_internalName_key" ON "DocumentCollection"("internalName");

-- CreateIndex
CREATE INDEX "DocumentCollection_id_idx" ON "DocumentCollection"("id");

-- CreateIndex
CREATE INDEX "Document_id_idx" ON "Document"("id");
