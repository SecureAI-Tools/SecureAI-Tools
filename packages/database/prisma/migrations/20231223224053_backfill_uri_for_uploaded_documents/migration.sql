UPDATE
  public."Document"
SET
  "uri" = sq."uri"
FROM 
  (
  SELECT
    d."id" AS "documentId",
    CONCAT(om."orgId", '/upload/', d."externalId") as "uri"
  FROM
    public."Document" d
    JOIN public."DocumentToCollection" dtc ON dtc."documentId" = d."id"
    JOIN public."DocumentCollection" dc ON dc."id" = dtc."collectionId"
    JOIN public."OrgMembership" om ON (
      om."orgId" = dc."organizationId" AND
      om."userId" = dc."ownerId"
    )
  ) AS sq /* sub-query */
WHERE
  public."Document"."id" = sq."documentId"
;
