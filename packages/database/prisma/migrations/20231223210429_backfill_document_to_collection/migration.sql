-- Migration to backfill DocumentToCollection table for the documents uploaded so far.

-- Create DocumentToCollection for each document
INSERT INTO public."DocumentToCollection"
  (
    "id",
    "documentId",
    "collectionId",
    "indexingStatus",
    "createdAt",
    "updatedAt"
  )
  SELECT
    nanoid() AS "id",
    d."id" AS "documentId",
    d."collectionId" AS "collectionId",
    d."indexingStatus" AS "indexingStatus",
    d."createdAt" as "createdAt",
    d."createdAt" AS "updatedAt"
  FROM public."Document" d
;
