import { NextRequest, NextResponse } from "next/server";

import { ChatMessageService } from "lib/api/services/chat-message-service";
import { toChatMessageRole } from "lib/types/core/chat-message-role";
import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";
import { ChatMessageCreateRequest } from "lib/types/api/chat-message-create.request";

import { Id } from "@repo/core";
import { NextResponseErrors, API } from "@repo/backend";

const chatMessageService = new ChatMessageService();
const permissionService = new PermissionService();

// Creates a chat-message without generating AI response.
export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  const { message } = (await req.json()) as ChatMessageCreateRequest;

  if (
    message.content.length < 1 ||
    message.role.length < 1 ||
    params.chatId.length < 1
  ) {
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

  const createdChatMessage = await chatMessageService.create({
    content: message.content,
    role: toChatMessageRole(message.role),
    chatId: chatId.toString(),
  });

  return NextResponse.json(ChatMessageResponse.fromEntity(createdChatMessage));
}

// Endpoint to fetch messages of a chat
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

  const { searchParams } = new URL(req.url);

  const where = {
    chatId: chatId.toString(),
  };
  const chatMessages = await chatMessageService.getAll(
    where,
    API.searchParamsToOrderByInput(searchParams),
    API.PaginationParams.from(searchParams),
  );
  const count = await chatMessageService.count(where);

  return NextResponse.json(
    chatMessages.map((c) => ChatMessageResponse.fromEntity(c)),
    {
      headers: API.createResponseHeaders({
        pagination: {
          totalCount: count,
        },
      }),
    },
  );
}
