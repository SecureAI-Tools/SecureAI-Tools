import { StreamingTextResponse, LangChainStream } from "ai";
import { ChatOllama } from "langchain/chat_models/ollama";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { NextRequest } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatTitleRequest } from "lib/types/api/chat-title.request";
import { ChatService } from "lib/api/services/chat-service";
import { ChatResponse } from "lib/types/api/chat.response";

import { ModelProviderService, NextResponseErrors } from "@repo/backend";
import { Id } from "@repo/core";

const permissionService = new PermissionService();
const chatService = new ChatService();
const modelProviderService = new ModelProviderService();

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  const { messages } = (await req.json()) as ChatTitleRequest;

  if (messages.length < 1 || params.chatId.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length < 1) {
    return NextResponseErrors.badRequest(
      "at least one message needs to be from user",
    );
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

  const handlerWrapper = {
    ...langChainHandlers,
    handleLLMEnd: async (output: any, runId: string): Promise<void> => {
      if (output.generations.length < 1) {
        return;
      }

      // Save the generated title
      const generation = output.generations.at(0);
      const content = generation.map((chunk: any) => chunk.text).join();
      await chatService.update(Id.from(params.chatId), {
        title: content.replaceAll('"', "").trim(),
      });

      return langChainHandlers.handleLLMEnd(output, runId);
    },
  };

  const org = await chatService.getOrganization(chatId);
  if (!org) {
    throw new Error("eh! this shouldn't be happening!");
  }

  const llm = modelProviderService.getChatModel({
    model: org.defaultModel,
    modelType: org.defaultModelType,
  });

  llm
    .call(
      [
        // Human message is first because if we keep it as last, then LLMs sometime start auto-completing that!
        // We instead want LLMs to auto-complete the system message, and so that is why it is kept last!
        new HumanMessage(`<---->\n${userMessages.at(0)?.content!}\n<---->`),
        new SystemMessage(TITLE_PROMPT),
      ],
      {},
      [handlerWrapper],
    )
    .catch(console.error);

  return new StreamingTextResponse(stream);
}

const TITLE_PROMPT = `
Above is a message from user (enclosed in between two "<---->"). Come up with a title for that message.

The title must be as short as possible. It should capture the essense of the conversation.
Only respond with ONE title. Do not respond with anything else. Do not put double quotes around the title.
`;
