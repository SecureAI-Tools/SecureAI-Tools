import path from "path";
import sanitize from "sanitize-filename";

import { DocumentCollectionResponse } from "@repo/core/src/types/document-collection.response";
import { DocumentResponse } from "@repo/core/src/types/document.response";
import { Id } from "@repo/core/src/types/id";
import { OrganizationResponse } from "@repo/core/src/types/organization.response";

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
