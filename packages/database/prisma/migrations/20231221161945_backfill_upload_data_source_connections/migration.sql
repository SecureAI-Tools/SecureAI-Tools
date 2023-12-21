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

-- For each uploaded document, connect to corresponding connection
UPDATE
  public."Document"
SET
  "connectionId" = sq."dataSourceConnectionId"
FROM 
  (
    SELECT
      d.id AS "documentId",
      dsc.id AS "dataSourceConnectionId"
    FROM
      public."Document" d
      JOIN public."DocumentCollection" dc ON dc."id" = d."collectionId"
      JOIN public."OrgMembership" om ON (
        om."orgId" = dc."organizationId" AND
        om."userId" = dc."ownerId"
      )
      JOIN public."DataSourceConnection" dsc on dsc."membershipId" = om."id"
  ) AS sq /* sub-query */
WHERE
  public."Document"."id" = sq."documentId"
;
