import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { NextResponseErrors } from "lib/api/core/utils";
import { ChatDocumentService } from "lib/api/services/chat-document-service";
import { LocalObjectStorageService } from "lib/api/services/local-object-storage-service";

const permissionService = new PermissionService();
const chatDocumentService = new ChatDocumentService();
const localObjectStorageService = new LocalObjectStorageService();

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string; documentId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  const chatId = Id.from<ChatResponse>(params.chatId);
  const [permission, resp] = await permissionService.hasReadPermission(
    userId!,
    chatId,
  );
  if (!permission) {
    return resp;
  }

  const chatDocument = await chatDocumentService.get(
    Id.from(params.documentId),
  );
  if (!chatDocument) {
    return NextResponseErrors.notFound();
  }

  const data = await localObjectStorageService.get(chatDocument.objectKey);

  const headers = new Headers();
  headers.append("Content-Type", chatDocument.mimeType);

  // Send read data as document with appropriate mime-type response header!
  return new Response(data, {
    headers,
  });
}
