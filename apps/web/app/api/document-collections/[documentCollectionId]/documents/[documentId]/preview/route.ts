import { NextRequest } from "next/server";
import { redirect } from 'next/navigation'

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";

import { DataSource, Id, IdType } from "@repo/core";
import {
  DataSourceConnectionService,
  DocumentCollectionService,
  DocumentService,
  NextResponseErrors,
} from "@repo/backend";

const permissionService = new PermissionService();
const documentService = new DocumentService();
const documentCollectionService = new DocumentCollectionService();
const dataSourceConnectionService = new DataSourceConnectionService();

export async function GET(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string; documentId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.documentCollectionId.length < 1 || params.documentId.length < 1) {
    return NextResponseErrors.badRequest();
  }

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

  const document = await documentService.get(Id.from(params.documentId));
  if (!document) {
    return NextResponseErrors.notFound();
  }

  // Get DataSourceConnection of DocumentCollection owner. It works because only document collection owner can
  // add documents into the collection right now.
  //
  // TODO: When allowing others to add documents to collection, capture "which connection was used to add document
  //       to collection" explicitly and use it here!
  const documentCollection =
    await documentCollectionService.get(documentCollectionId);
  const dataSourceConnections = await dataSourceConnectionService.getAll({
    where: {
      documents: {
        some: {
          documentId: document.id,
        },
      },
      membership: {
        userId: documentCollection!.ownerId,
        orgId: documentCollection!.organizationId,
      },
    },
  });
  if (dataSourceConnections.length < 1) {
    return NextResponseErrors.internalServerError(
      "no data source connections found!",
    );
  }
  const dataSourceConnection = dataSourceConnections[0]!;

  if (dataSourceConnection.dataSource === DataSource.UPLOAD) {
    const blob = await documentService.read(document, dataSourceConnection);

    const headers = new Headers();
    headers.append("Content-Type", document.mimeType);

    // Send read data as document with appropriate mime-type response header!
    return new Response(blob.stream(), {
      headers,
    });
  }

  // Redirect to data source specific link
  const url = await documentService.getPreviewUrl(document, dataSourceConnection);
  redirect(url);
}
