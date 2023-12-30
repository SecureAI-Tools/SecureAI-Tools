import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { DocumentCreateRequest } from "lib/types/api/document-create.request";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { IndexingMode } from "lib/types/core/indexing-mode";

import {
  Id,
  DocumentResponse,
  DataSource,
  DocumentIndexingStatus,
  IdType,
  toDataSource,
  MimeType,
} from "@repo/core";
import {
  DocumentService,
  NextResponseErrors,
  API,
  DataSourceConnectionService,
  generateDocumentUri,
  addToIndexingQueue,
} from "@repo/backend";

const SUPPORTED_DATA_SOURCES = new Set<DataSource>([
  DataSource.PAPERLESS_NGX,
  DataSource.GOOGLE_DRIVE,
]);

const permissionService = new PermissionService();
const documentService = new DocumentService();
const dataSourceConnectionService = new DataSourceConnectionService();
const orgMembershipService = new OrgMembershipService();

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
  const where = {
    collections: {
      some: {
        collectionId: documentCollectionId.toString(),
      },
    },
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
  const documentCollectionId = Id.from<IdType.DocumentCollection>(
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

  const documentCreateRequest = (await req.json()) as DocumentCreateRequest;

  // TODO: Expand this when supporting more document types!
  if (documentCreateRequest.mimeType !== MimeType.PDF) {
    return NextResponseErrors.badRequest(`unsupported mimeType ${documentCreateRequest.mimeType}`);
  }

  // Check if user has permission to use data source connection
  const dataSourceConnectionId = Id.from<IdType.DataSourceConnection>(
    documentCreateRequest.dataSourceConnectionId,
  );
  const [hasPermissions, permissionResp] =
    await permissionService.hasReadDocumentsFromDataSourceConnectionPermission(
      userId!,
      dataSourceConnectionId,
    );
  if (!hasPermissions) {
    return permissionResp;
  }

  const dataSourceConnection = await dataSourceConnectionService.get(
    dataSourceConnectionId,
  );
  if (!dataSourceConnection) {
    return NextResponseErrors.notFound();
  }

  const orgMembership = await orgMembershipService.get(
    Id.from(dataSourceConnection.membershipId),
  );
  if (!orgMembership) {
    return NextResponseErrors.notFound();
  }

  if (!SUPPORTED_DATA_SOURCES.has(toDataSource(dataSourceConnection.dataSource))) {
    return NextResponseErrors.badRequest(
      `Unsupported data source ${dataSourceConnection.dataSource}`,
    );
  }

  const uri = generateDocumentUri({
    orgId: Id.from(orgMembership.orgId),
    dataSourceBaseUrl: dataSourceConnection.baseUrl!,
    guidInDataSource: documentCreateRequest.externalId,
  });
  const document = await documentService.createOrLink({
    id: Id.generate<IdType.Document>(),
    name: documentCreateRequest.name,
    mimeType: documentCreateRequest.mimeType,
    indexingStatus: DocumentIndexingStatus.NOT_INDEXED,
    uri: uri,
    externalId: documentCreateRequest.externalId,
    collectionId: documentCollectionId,
    connectionId: Id.from(dataSourceConnection.id),
  });

  // Insert into indexing queue
  if (documentCreateRequest.indexingMode === IndexingMode.OFFLINE) {
    // Insert document into the queue so task-master can process it offline!
    await addToIndexingQueue({
      documentId: document.id,
      collectionId: documentCollectionId.toString(),
      dataSourceConnectionId: dataSourceConnection.id,
    });
  }

  return NextResponse.json(DocumentResponse.fromEntity(document));
}
