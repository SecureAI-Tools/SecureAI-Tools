import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { DocumentResponse } from "lib/types/api/document.response";
import { DocumentService } from "lib/api/services/document-service";
import { LocalObjectStorageService } from "lib/api/services/local-object-storage-service";
import { getDocumentObjectKey } from "lib/api/core/document.utils";
import { DocumentIndexingStatus } from "lib/types/core/document-indexing-status";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { DocumentCollectionService } from "lib/api/services/document-collection-service";

const permissionService = new PermissionService();
const documentCollectionService = new DocumentCollectionService();
const documentService = new DocumentService();
const objectStorageService = new LocalObjectStorageService();

// Endpoint to handle upload docs
export async function POST(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.documentCollectionId.length < 1) {
    return NextResponseErrors.badRequest();
  }

  // Check permissions
  const documentCollectionId = Id.from<DocumentCollectionResponse>(params.documentCollectionId);
  const [permission, resp] = await permissionService.hasWriteDocumentCollectionPermission(
    userId!,
    documentCollectionId,
  );
  if (!permission) {
    return resp;
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponseErrors.badRequest("file is required.");
  }
  if (file.type !== "application/pdf") {
    return NextResponseErrors.badRequest("file.type must be application/pdf");
  }

  const documentCollection = await documentCollectionService.get(documentCollectionId);
  if (!documentCollection) {
    return NextResponseErrors.notFound();
  }

  const documentId = Id.generate(DocumentResponse);
  const documentObjectKey = getDocumentObjectKey({
    orgId: Id.from(documentCollection.organizationId),
    documentCollectionId: documentCollectionId,
    documentId: documentId,
    file,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await objectStorageService.put(documentObjectKey, buffer);

  const document = await documentService.create({
    id: documentId,
    name: file.name,
    mimeType: file.type,
    indexingStatus: DocumentIndexingStatus.NOT_INDEXED,
    objectKey: documentObjectKey,
    collectionId: documentCollectionId,
  });
  return NextResponse.json(DocumentResponse.fromEntity(document));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permission
  const documentCollectionId = Id.from<DocumentCollectionResponse>(params.documentCollectionId);
  const [permission, resp] = await permissionService.hasReadDocumentCollectionPermission(
    userId!,
    documentCollectionId,
  );
  if (!permission) {
    return resp;
  }

  const documents = await documentService.getAll({
    where: {
      collectionId: documentCollectionId.toString(),
    },
    // TODO: Support pagination and ordering params here if/when needed!
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(
    documents.map((cd) => DocumentResponse.fromEntity(cd)),
  );
}
