-- Rename column
-- Migration manually modified to do simple column rename instead of drop-column and create-new

ALTER TABLE "Document" RENAME COLUMN "objectKey" TO "uri";
