ALTER TABLE "Document" ADD COLUMN "uri" TEXT;
ALTER TABLE "Document" RENAME COLUMN "objectKey" TO "externalId";

