import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";

import { Id, DocumentToCollectionResponse, IdType } from "@repo/core";
import { NextResponseErrors, DocumentToCollectionService } from "@repo/backend";

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

  const { searchParams } = new URL(req.url);
  const documentIdsStr = searchParams.get("documentIds");
  const documentIds = documentIdsStr?.split(",");
  if (!documentIds || documentIds.length === 0) {
    return NextResponseErrors.badRequest("documentIds is required");
  }

  const documentToCollections = await documentToCollectionService.getAll({
    where: {
      collectionId: documentCollectionId.toString(),
      documentId: {
        in: documentIds,
      },
    },
  });
  return NextResponse.json(
    documentToCollections.map((d) =>
      DocumentToCollectionResponse.fromEntity(d),
    ),
  );
}
