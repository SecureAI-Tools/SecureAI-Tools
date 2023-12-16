import path from "path";
import sanitize from "sanitize-filename";

import { Id, OrganizationResponse, DocumentCollectionResponse, DocumentResponse } from "@repo/core";

export function getDocumentObjectKey({
  orgId,
  documentCollectionId,
  documentId,
  file,
}: {
  orgId: Id<OrganizationResponse>;
  documentCollectionId: Id<DocumentCollectionResponse>;
  documentId: Id<DocumentResponse>;
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
