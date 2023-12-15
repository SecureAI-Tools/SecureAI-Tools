import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { DocumentCollectionStatsResponse } from "lib/types/api/document-collection-stats.response";

import { DocumentService } from "@repo/core/src/services/document-service";
import { DocumentCollectionResponse } from "@repo/core/src/types/document-collection.response";
import { DocumentIndexingStatus } from "@repo/core/src/types/document-indexing-status";
import { Id } from "@repo/core/src/types/id";
import { NextResponseErrors } from "@repo/core/src/utils/utils";

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
