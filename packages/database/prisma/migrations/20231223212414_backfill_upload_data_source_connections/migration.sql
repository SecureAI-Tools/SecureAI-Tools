-- Migration for backfilling data source connection for documents uploaded so far.

-- Create DataSourceConnection for each membership
INSERT INTO public."DataSourceConnection"
  (
    "id",
    "dataSource",
    "membershipId",
    "createdAt",
    "updatedAt"
  )
  SELECT
    nanoid() AS "id",
    'UPLOAD' AS "dataSource",
    om."id" AS "membershipId",
    om."createdAt" as "createdAt",
    om."createdAt" AS "updatedAt"
  FROM public."OrgMembership" om
;

-- Create DocumentToDataSource for each document
INSERT INTO public."DocumentToDataSource"
  (
    "id",
    "documentId",
    "dataSourceId",
    "createdAt",
    "updatedAt"
  )
  SELECT
    nanoid() AS "id",
    d.id AS "documentId",
    dsc.id AS "dataSourceId",
    d."createdAt" as "createdAt",
    d."createdAt" AS "updatedAt"
  FROM
    public."Document" d
    JOIN public."DocumentToCollection" dtc ON dtc."documentId" = d."id"
    JOIN public."DocumentCollection" dc ON dc."id" = dtc."collectionId"
    JOIN public."OrgMembership" om ON (
      om."orgId" = dc."organizationId" AND
      om."userId" = dc."ownerId"
    )
    JOIN public."DataSourceConnection" dsc on dsc."membershipId" = om."id"
;
