-- CreateTable
CREATE TABLE "OrgDataSourceOAuthCredential" (
    "id" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgDataSourceOAuthCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgDataSourceOAuthCredential_id_idx" ON "OrgDataSourceOAuthCredential"("id");

-- AddForeignKey
ALTER TABLE "OrgDataSourceOAuthCredential" ADD CONSTRAINT "OrgDataSourceOAuthCredential_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
