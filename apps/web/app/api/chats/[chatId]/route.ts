import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@repo/database";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatService } from "lib/api/services/chat-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatUpdateRequest } from "lib/types/api/chat-update.request";
import { NextResponseErrors, Id } from "@repo/core";

const permissionService = new PermissionService();
const chatService = new ChatService();

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  // Check permissions
  const chatId = Id.from<ChatResponse>(params.chatId);
  const [permission, resp] = await permissionService.hasReadPermission(
    userId!,
    chatId,
  );
  if (!permission) {
    return resp;
  }

  const chat = await chatService.get(chatId);
  if (!chat) {
    return NextResponseErrors.notFound();
  }
  return NextResponse.json(ChatResponse.fromEntity(chat));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
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

  const chat = await chatService.delete(chatId);
  if (!chat) {
    return NextResponseErrors.notFound();
  }
  return NextResponse.json(ChatResponse.fromEntity(chat));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
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

  const chatUpdateRequest = (await req.json()) as ChatUpdateRequest;
  const chatUpdateInput: Prisma.ChatUpdateInput = { ...chatUpdateRequest };

  const chat = await chatService.update(chatId, chatUpdateInput);

  if (!chat) {
    return NextResponseErrors.notFound();
  }
  return NextResponse.json(ChatResponse.fromEntity(chat));
}
