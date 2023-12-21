import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";

import { Id, DocumentCollectionResponse, DocumentResponse } from "@repo/core";
import { DocumentService, NextResponseErrors, API } from "@repo/backend";

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

  const { searchParams } = new URL(req.url);
  const where = {
    collectionId: documentCollectionId.toString(),
  };
  const documents = await documentService.getAll({
    where: where,
    orderBy: API.searchParamsToOrderByInput(searchParams),
    pagination: API.PaginationParams.from(searchParams),
  });
  const count = await documentService.count(where);

  return NextResponse.json(
    documents.map((cd) => DocumentResponse.fromEntity(cd)),
    {
      headers: API.createResponseHeaders({
        pagination: {
          totalCount: count,
        },
      }),
    },
  );
}
