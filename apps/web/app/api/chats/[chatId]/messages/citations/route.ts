import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { CitationService } from "lib/api/services/citation-service";
import { CitationResponse } from "lib/types/api/citation-response";
import { ChatService } from "lib/api/services/chat-service";
import { ChatType } from "lib/types/core/chat-type";

import { removeTrailingSlash, Id, DocumentChunkMetadata, IdType } from "@repo/core";
import { DocumentCollectionService, NextResponseErrors } from "@repo/backend";

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

  const chatId = Id.from<IdType.Chat>(params.chatId);
  const [permission, resp] = await permissionService.hasReadChatPermission(
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
    Id.from<IdType.DocumentCollection>(chat.documentCollectionId),
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
