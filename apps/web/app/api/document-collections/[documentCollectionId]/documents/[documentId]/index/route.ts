import { NextRequest } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";

import { Id, DocumentCollectionResponse, DocumentResponse, StreamChunkResponse } from "@repo/core";
import { IndexingService, NextResponseErrors } from "@repo/backend";

const permissionService = new PermissionService();
const indexingService = new IndexingService();

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

  const documentId = Id.from<DocumentResponse>(params.documentId);
  const stream = iteratorToStream(indexingService.index(documentId));

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
