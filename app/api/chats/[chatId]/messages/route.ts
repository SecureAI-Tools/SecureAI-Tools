import { StreamingTextResponse, LangChainStream, Message } from "ai";
import { ChatOllama } from "langchain/chat_models/ollama";
import { AIMessage, HumanMessage } from "langchain/schema";
import { NextRequest, NextResponse } from "next/server";

import { ChatMessageService } from "lib/api/services/chat-message-service";
import {
  ChatMessageRole,
  toChatMessageRole,
} from "lib/types/core/chat-message-role";
import { ChatMessagesRequest } from "lib/types/api/chat-messages.request";
import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { API } from "lib/api/core/api.utils";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";
import { NextResponseErrors } from "lib/api/core/utils";

const chatMessageService = new ChatMessageService();
const permissionService = new PermissionService();
const chatService = new ChatService();

// Vercel AI SDK compatible API Route to handle chat messages
export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  const { messages } = (await req.json()) as ChatMessagesRequest;

  if (messages.length < 1 || params.chatId.length < 1) {
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

  const { stream, handlers: langChainHandlers } = LangChainStream();

  // Save the last message of input request messages
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === "user") {
    chatMessageService.create({
      content: lastMessage.content,
      role: toChatMessageRole(lastMessage.role),
      chatId: params.chatId,
    });
  }

  const handlerWrapper = {
    ...langChainHandlers,
    handleLLMEnd: (output: any, runId: string): Promise<void> => {
      // Save the LLM generated responses
      output.generations.map((generation: any) => {
        const content = generation.map((chunk: any) => chunk.text).join();
        chatMessageService.create({
          content: content,
          role: ChatMessageRole.ASSISTANT,
          chatId: params.chatId,
        });
      });

      return langChainHandlers.handleLLMEnd(output, runId);
    },
  };

  const org = await chatService.getOrganization(chatId);
  if (!org) {
    throw new Error("eh! this shouldn't be happening!");
  }

  const llm = new ChatOllama({
    baseUrl: process.env.INFERENCE_SERVER!,
    model: org.defaultModel,
  });

  llm
    .call(
      (messages as Message[]).map((m) =>
        m.role == "user"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content),
      ),
      {},
      [handlerWrapper],
    )
    .catch(console.error);

  return new StreamingTextResponse(stream);
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
