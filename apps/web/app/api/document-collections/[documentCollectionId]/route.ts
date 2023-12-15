import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";

import { DocumentCollectionService } from "@repo/core/src/services/document-collection-service";
import { DocumentCollectionResponse } from "@repo/core/src/types/document-collection.response";
import { Id } from "@repo/core/src/types/id";
import { NextResponseErrors } from "@repo/core/src/utils/utils";

const permissionService = new PermissionService();
const documentCollectionService = new DocumentCollectionService();

export async function GET(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permissions
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

  const documentCollection =
    await documentCollectionService.get(documentCollectionId);
  if (!documentCollection) {
    return NextResponseErrors.notFound();
  }
  return NextResponse.json(
    DocumentCollectionResponse.fromEntity(documentCollection),
  );
}
