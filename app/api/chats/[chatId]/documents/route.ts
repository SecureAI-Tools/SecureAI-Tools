import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { ChatDocumentResponse } from "lib/types/api/chat-document.response";
import { ChatDocumentService } from "lib/api/services/chat-document-service";
import { LocalObjectStorageService } from "lib/api/services/local-object-storage-service";
import { getChatDocumentObjectKey } from "lib/api/core/chat-document.utils";

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
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponseErrors.badRequest("file is required.");
  }
  if (file.type !== "application/pdf") {
    return NextResponseErrors.badRequest("file.type must be application/pdf");
  }

  const organization = await chatService.getOrganization(chatId);
  if (!organization) {
    return NextResponseErrors.notFound();
  }

  const chatDocumentId = Id.generate(ChatDocumentResponse);
  const chatDocumentObjectKey = getChatDocumentObjectKey({
    orgId: Id.from(organization.id),
    chatId,
    chatDocumentId,
    file,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await localObjectStorageService.put(chatDocumentObjectKey, buffer);

  const chatDocument = await chatDocumentService.create({
    id: chatDocumentId,
    name: file.name,
    mimeType: file.type,
    chatId: chatId,
    objectKey: chatDocumentObjectKey,
  });
  return NextResponse.json(ChatDocumentResponse.fromEntity(chatDocument));
}

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } },
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

  const chatDocuments = await chatDocumentService.getAll({
    where: {
      chatId: chatId.toString(),
    },
    // TODO: Support pagination and ordering params here if/when needed!
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(
    chatDocuments.map((cd) => ChatDocumentResponse.fromEntity(cd)),
  );
}
