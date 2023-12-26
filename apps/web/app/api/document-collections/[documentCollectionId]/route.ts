import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";

import { Id, DocumentCollectionResponse } from "@repo/core";
import { DocumentCollectionService, NextResponseErrors } from "@repo/backend";
import { DocumentCollectionUpdateRequest } from "lib/types/api/document-collection-update.request";

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

export async function DELETE(
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
    await permissionService.hasWriteDocumentCollectionPermission(
      userId!,
      documentCollectionId,
    );
  if (!permission) {
    return resp;
  }

  const documentCollection =
    await documentCollectionService.delete(documentCollectionId);
  if (!documentCollection) {
    return NextResponseErrors.notFound();
  }
  return NextResponse.json({});
}

export async function PATCH(
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
    await permissionService.hasWriteDocumentCollectionPermission(
      userId!,
      documentCollectionId,
    );
  if (!permission) {
    return resp;
  }

  const documentCollectionUpdateRequest =
    (await req.json()) as DocumentCollectionUpdateRequest;

  const updatedDocumentCollection = await documentCollectionService.update(
    documentCollectionId,
    {
      name: documentCollectionUpdateRequest.name,
      description: documentCollectionUpdateRequest.description,
    },
  );
  if (!updatedDocumentCollection) {
    return NextResponseErrors.notFound();
  }
  return NextResponse.json(
    DocumentCollectionResponse.fromEntity(updatedDocumentCollection),
  );
}
