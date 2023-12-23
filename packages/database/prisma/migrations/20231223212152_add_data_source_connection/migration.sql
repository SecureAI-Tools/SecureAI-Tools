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

-- CreateTable
CREATE TABLE "DocumentToDataSource" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "dataSourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentToDataSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataSourceConnection_id_idx" ON "DataSourceConnection"("id");

-- CreateIndex
CREATE INDEX "DocumentToDataSource_id_idx" ON "DocumentToDataSource"("id");

-- AddForeignKey
ALTER TABLE "DataSourceConnection" ADD CONSTRAINT "DataSourceConnection_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrgMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentToDataSource" ADD CONSTRAINT "DocumentToDataSource_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentToDataSource" ADD CONSTRAINT "DocumentToDataSource_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSourceConnection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
