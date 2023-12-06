import path from "path";
import sanitize from "sanitize-filename";

import { OrganizationResponse } from "lib/types/api/organization.response";
import { Id } from "lib/types/core/id";
import { DocumentResponse } from "lib/types/api/document.response";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";

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
