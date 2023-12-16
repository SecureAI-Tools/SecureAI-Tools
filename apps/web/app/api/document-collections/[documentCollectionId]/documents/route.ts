import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { getDocumentObjectKey } from "lib/api/core/document.utils";
import { IndexingMode } from "lib/types/core/indexing-mode";

import { Id, DocumentCollectionResponse, DocumentResponse, DocumentIndexingStatus, IndexingQueueMessage } from "@repo/core";
import { DocumentCollectionService, DocumentService, LocalObjectStorageService, NextResponseErrors, getAMQPChannel, API } from "@repo/backend";

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const indexingMode = formData.get("indexingMode") as IndexingMode | null ?? IndexingMode.OFFLINE;
  if (!file) {
    return NextResponseErrors.badRequest("file is required.");
  }
  if (file.type !== "application/pdf") {
    return NextResponseErrors.badRequest("file.type must be application/pdf");
  }

  const documentCollection =
    await documentCollectionService.get(documentCollectionId);
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

  if (indexingMode === IndexingMode.OFFLINE) {
    // Insert document into the queue so task-master can process it offline!
    const msg: IndexingQueueMessage = {
      documentId: documentId.toString(),
    }
    const amqpServerUrl = process.env.AMQP_SERVER_URL;
    if (!amqpServerUrl) {
      throw new Error("Invalid AMQP_SERVER_URL");
    }
    const queueName = process.env.AMQP_DOCS_INDEXING_QUEUE_NAME;
    if (!queueName) {
      throw new Error("Invalid AMQP_DOCS_INDEXING_QUEUE_NAME");
    }

    const channel = await getAMQPChannel(amqpServerUrl);
    await channel.assertQueue(queueName);
    await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(msg)));
  }

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
