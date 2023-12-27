import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { DocumentCollectionStatsResponse } from "lib/types/api/document-collection-stats.response";

import { Id, DocumentIndexingStatus, IdType } from "@repo/core";
import { DocumentToCollectionService, NextResponseErrors } from "@repo/backend";

const permissionService = new PermissionService();
const documentToCollectionService = new DocumentToCollectionService();

export async function GET(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permission
  const documentCollectionId = Id.from<IdType.DocumentCollection>(
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

  const totalDocumentCount = await documentToCollectionService.count({
    collectionId: documentCollectionId.toString(),
  });

  const indexedDocumentCount = await documentToCollectionService.count({
    collectionId: documentCollectionId.toString(),
    indexingStatus: DocumentIndexingStatus.INDEXED,
  });

  const response: DocumentCollectionStatsResponse = {
    totalDocumentCount: totalDocumentCount,
    indexedDocumentCount: indexedDocumentCount,
  };

  return NextResponse.json(response);
}
