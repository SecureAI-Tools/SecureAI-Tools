import { OrganizationResponse } from "@repo/core";
import { Id } from "@repo/core";
import { DocumentResponse } from "@repo/core";
import { DocumentCollectionResponse } from "@repo/core";

import path from "path";
import sanitize from "sanitize-filename";


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
