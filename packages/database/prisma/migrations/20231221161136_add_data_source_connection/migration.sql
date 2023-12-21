-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "connectionId" TEXT;

-- CreateTable
CREATE TABLE "DataSourceConnection" (
    "id" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "baseUrl" TEXT,
    "accessToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "membershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSourceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataSourceConnection_id_idx" ON "DataSourceConnection"("id");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DataSourceConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSourceConnection" ADD CONSTRAINT "DataSourceConnection_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrgMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
