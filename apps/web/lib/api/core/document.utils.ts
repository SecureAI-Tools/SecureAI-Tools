import path from "path";
import sanitize from "sanitize-filename";

import { Id, IdType } from "@repo/core";

export function getDocumentObjectKey({
  orgId,
  documentCollectionId,
  documentId,
  file,
}: {
  orgId: Id<IdType.Organization>;
  documentCollectionId: Id<IdType.DocumentCollection>;
  documentId: Id<IdType.Document>;
  file: File;
}): string {
  return path.join(
    "orgs",
    orgId.toString(),
    "document-collections",
    documentCollectionId.toString(),
    `${documentId.toString()}-${sanitize(file.name)}`,
  );
}
