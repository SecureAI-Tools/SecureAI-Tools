import { NextRequest } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { DocumentService } from "lib/api/services/document-service";
import { LocalObjectStorageService } from "lib/api/services/local-object-storage-service";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";

const permissionService = new PermissionService();
const documentService = new DocumentService();
const objectStorageService = new LocalObjectStorageService();

export async function GET(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string; documentId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.documentCollectionId.length < 1 || params.documentId.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const documentCollectionId = Id.from<DocumentCollectionResponse>(params.documentCollectionId);
  const [permission, resp] = await permissionService.hasReadDocumentCollectionPermission(
    userId!,
    documentCollectionId,
  );
  if (!permission) {
    return resp;
  }

  const document = await documentService.get(
    Id.from(params.documentId),
  );
  if (!document) {
    return NextResponseErrors.notFound();
  }

  const data = await objectStorageService.get(document.objectKey);

  const headers = new Headers();
  headers.append("Content-Type", document.mimeType);

  // Send read data as document with appropriate mime-type response header!
  return new Response(data, {
    headers,
  });
}
