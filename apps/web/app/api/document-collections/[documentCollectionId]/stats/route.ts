import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { DocumentService } from "lib/api/services/document-service";
import { DocumentIndexingStatus } from "lib/types/core/document-indexing-status";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { DocumentCollectionStatsResponse } from "lib/types/api/document-collection-stats.response";

const permissionService = new PermissionService();
const documentService = new DocumentService();

export async function GET(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permission
  const documentCollectionId = Id.from<DocumentCollectionResponse>(
    params.documentCollectionId,
  );
  const [permission, resp] =
    await permissionService.hasReadDocumentCollectionPermission(
      userId!,
      documentCollectionId,
    );
  if (!permission) {
    return resp;
  }

  const totalDocumentCount = await documentService.count({
    collectionId: documentCollectionId.toString(),
  });

  const indexedDocumentCount = await documentService.count({
    collectionId: documentCollectionId.toString(),
    indexingStatus: DocumentIndexingStatus.INDEXED,
  });

  const response: DocumentCollectionStatsResponse = {
    totalDocumentCount: totalDocumentCount,
    indexedDocumentCount: indexedDocumentCount,
  };

  return NextResponse.json(response);
}
