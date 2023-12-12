import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

import { isAuthenticated } from "lib/api/core/auth";
import { ChatResponse } from "lib/types/api/chat.response";
import { NextResponseErrors } from "lib/api/core/utils";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { CitationService } from "lib/api/services/citation-service";
import { CitationResponse } from "lib/types/api/citation-response";
import { ChatService } from "lib/api/services/chat-service";
import { DocumentCollectionService } from "lib/api/services/document-collection-service";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { ChatType } from "lib/types/core/chat-type";
import { DocumentChunkMetadata } from "lib/types/core/document-chunk-metadata";
import { removeTrailingSlash } from "lib/core/string-utils";

const chatService = new ChatService();
const documentCollectionService = new DocumentCollectionService();
const citationService = new CitationService();
const permissionService = new PermissionService();
const chromaClient = new ChromaClient({
  path: removeTrailingSlash(process.env.VECTOR_DB_SERVER!),
});

// Endpoint to fetch a list of citations scoped to given chatId
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  const [authenticated, authUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  const chatId = Id.from<ChatResponse>(params.chatId);
  const [permission, resp] = await permissionService.hasReadPermission(
    authUserId!,
    chatId,
  );
  if (!permission) {
    return resp;
  }

  const { searchParams } = new URL(req.url);
  const chatMessageIdsStr = searchParams.get("chatMessageIds");
  const chatMessageIds = chatMessageIdsStr?.split(",");

  if (!chatMessageIds || chatMessageIds.length === 0) {
    return NextResponseErrors.badRequest("chatMessageIds is required");
  }

  const chat = await chatService.get(chatId);
  if (!chat) {
    return NextResponseErrors.notFound();
  }

  if (chat.type !== ChatType.CHAT_WITH_DOCS || !chat.documentCollectionId) {
    return NextResponse.json([]);
  }

  const documentCollection = await documentCollectionService.get(
    Id.from<DocumentCollectionResponse>(chat.documentCollectionId),
  );
  if (!documentCollection) {
    return NextResponseErrors.notFound();
  }

  const citations = await citationService.getAll({
    where: {
      // Scoped to current chat where user has permission to read data!
      chatMessage: {
        chatId: params.chatId,
      },
      chatMessageId: {
        in: chatMessageIds,
      },
    },
  });

  // Fetch relevant document-chunks from vector db and stitch data!
  const documentChunkIds = new Set(citations.map((c) => c.documentChunkId));

  const vdbCollection = await chromaClient.getCollection({
    name: documentCollection.internalName,
  });

  const getResponse = await vdbCollection.get({
    ids: Array.from(documentChunkIds),
  });

  const map: Map<string /* documentChunkId */, DocumentChunkMetadata> =
    new Map();
  getResponse.metadatas.forEach((m) => {
    const meta = m as DocumentChunkMetadata;
    map.set(meta.documentChunkId, meta);
  });

  return NextResponse.json(
    citations.map((c) => {
      const meta = map.get(c.documentChunkId);
      if (!meta) {
        // Data loss?
        throw new Error(
          `could not find document metadata for documentChunkId = ${c.documentChunkId}`,
        );
      }
      return CitationResponse.fromEntity(c, meta);
    }),
  );
}
