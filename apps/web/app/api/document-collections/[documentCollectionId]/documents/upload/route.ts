import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { getDocumentObjectKey } from "lib/api/core/document.utils";
import { IndexingMode } from "lib/types/core/indexing-mode";

import { Id, DocumentCollectionResponse, DocumentResponse, DocumentIndexingStatus, IndexingQueueMessage, DataSource } from "@repo/core";
import { DocumentCollectionService, DocumentService, LocalObjectStorageService, NextResponseErrors, getAMQPChannel, DataSourceConnectionService } from "@repo/backend";

const permissionService = new PermissionService();
const documentCollectionService = new DocumentCollectionService();
const documentService = new DocumentService();
const objectStorageService = new LocalObjectStorageService();
const dataSourceConnectionService = new DataSourceConnectionService();

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
  const orgId = Id.from(documentCollection.organizationId);
  const documentObjectKey = getDocumentObjectKey({
    orgId: orgId,
    documentCollectionId: documentCollectionId,
    documentId: documentId,
    file,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await objectStorageService.put(documentObjectKey, buffer);

  // Get (or create) the UPLOAD data-source-connection associated with user making the
  // request under document collection's org
  const dataSourceConnection = await dataSourceConnectionService.getOrCreate(
    userId!,
    orgId,
    DataSource.UPLOAD,
  );

  const document = await documentService.create({
    id: documentId,
    name: file.name,
    mimeType: file.type,
    indexingStatus: DocumentIndexingStatus.NOT_INDEXED,
    uri: documentObjectKey,
    collectionId: documentCollectionId,
    connectionId: Id.from(dataSourceConnection.id),
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

