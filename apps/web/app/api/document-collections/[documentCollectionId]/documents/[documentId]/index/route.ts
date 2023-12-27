import { NextRequest } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";

import {
  Id,
  StreamChunkResponse,
  OrgMembershipStatus,
  IdType,
} from "@repo/core";
import {
  DocumentCollectionService,
  IndexingService,
  NextResponseErrors,
} from "@repo/backend";
import { prismaClient } from "@repo/database";

const permissionService = new PermissionService();
const indexingService = new IndexingService();
const documentCollectionService = new DocumentCollectionService();

// Endpoint to index documents into vector store
export async function POST(
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

  const documentCollection =
    await documentCollectionService.get(documentCollectionId);
  if (!documentCollectionId) {
    return NextResponseErrors.notFound();
  }

  // This only works for the document collection owner.
  // TODO: Expand this if/when needed!
  const documentId = Id.from<IdType.Document>(params.documentId);
  const documentToDataSources =
    await prismaClient.documentToDataSource.findMany({
      where: {
        documentId: documentId.toString(),
        dataSource: {
          membership: {
            userId: userId!.toString(),
            status: OrgMembershipStatus.ACTIVE,
            orgId: documentCollection!.organizationId,
          },
        },
      },
    });
  if (documentToDataSources.length < 1) {
    return NextResponseErrors.badRequest("invalid document data source");
  }

  const stream = iteratorToStream(
    indexingService.index(
      documentId,
      documentCollectionId,
      Id.from(documentToDataSources[0]!.dataSourceId),
    ),
  );

  return new Response(stream);
}

function iteratorToStream(iterator: AsyncGenerator<StreamChunkResponse>) {
  const encoder = new TextEncoder();

  const encodeChunk = (chunk: StreamChunkResponse): Uint8Array => {
    const serializedChunk = JSON.stringify(chunk);
    return encoder.encode(`${serializedChunk}\n`);
  };

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(encodeChunk(value));
      }
    },
  });
}
