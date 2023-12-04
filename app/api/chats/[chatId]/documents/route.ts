import { NextRequest, NextResponse } from "next/server";

import path from "path";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { ChatDocumentResponse } from "lib/types/api/chat-document.response";
import { ChatDocumentService } from "lib/api/services/chat-document-service";
import { LocalObjectStorageService } from "lib/api/services/local-object-storage-service";
import { getDocumentPath } from "lib/core/document-path-utils";

const permissionService = new PermissionService();
const chatService = new ChatService();
const chatDocumentService = new ChatDocumentService();
const localObjectStorageService = new LocalObjectStorageService();

// Endpoint to handle upload docs
export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.chatId.length < 1) {
    return NextResponseErrors.badRequest();
  }

  // Check permissions
  const chatId = Id.from<ChatResponse>(params.chatId);
  const [permission, resp] = await permissionService.hasWritePermission(
    userId!,
    chatId,
  );
  if (!permission) {
    return resp;
  }

  const formData = await req.formData();
  const file = formData.get("file") as Blob | null;
  if (!file) {
    return NextResponseErrors.badRequest("File blob is required.");
  }
  
  const organization = await chatService.getOrganization(chatId);
  if (!organization) {
    return NextResponseErrors.notFound();
  }

  const chatDocumentId = Id.generate(ChatDocumentResponse);
  const uploadDir = getDocumentPath(organization.id, chatId.toString(), chatDocumentId.toString());
  if (!uploadDir) {
    return NextResponseErrors.internalServerError();
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  await localObjectStorageService.put(uploadDir, buffer);

  // TODO: Add document object key field in the database table as well.
  const chatDocument = await chatDocumentService.create({
    id: chatDocumentId,
    mimeType: file.type,
    chatId: chatId,
  });
  
  return NextResponse.json(ChatDocumentResponse.fromEntity(chatDocument));
}
