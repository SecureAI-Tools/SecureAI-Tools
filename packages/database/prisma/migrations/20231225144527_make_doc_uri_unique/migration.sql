/*
  Warnings:

  - A unique constraint covering the columns `[uri]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Document_uri_key" ON "Document"("uri");
