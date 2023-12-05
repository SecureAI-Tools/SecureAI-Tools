import { StreamingTextResponse, LangChainStream, Message } from "ai";
import { ChatOllama } from "langchain/chat_models/ollama";
import { AIMessage, HumanMessage } from "langchain/schema";
import { NextRequest, NextResponse } from "next/server";

import { ChatMessageService } from "lib/api/services/chat-message-service";
import { ChatMessageRole } from "lib/types/core/chat-message-role";
import { ChatMessagesRequest } from "lib/types/api/chat-messages.request";
import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { OllamaEmbeddings } from "langchain/embeddings/ollama";
import { ConversationalRetrievalQAChain } from "langchain/chains"
import { Chroma } from "langchain/vectorstores/chroma"
import { DocumentCollectionService } from "lib/api/services/document-collection-service";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { ChatType } from "lib/types/core/chat-type";

const chatMessageService = new ChatMessageService();
const documentCollectionService = new DocumentCollectionService();
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

  const chat = await chatService.get(chatId);
  if (!chat) {
    return NextResponseErrors.notFound();
  }

  const llm = new ChatOllama({
    baseUrl: process.env.INFERENCE_SERVER!,
    model: chat.model,
  });

  if (chat.type == ChatType.CHAT_WITH_DOCS) {
    if (!chat.documentCollectionId) {
      return NextResponseErrors.notFound();
    }

    const documentCollection = await documentCollectionService.get(Id.from<DocumentCollectionResponse>(chat.documentCollectionId));
    if (!documentCollection) {
      return NextResponseErrors.notFound();
    }

    const ollamaEmbeddings = new OllamaEmbeddings({
      baseUrl: process.env.INFERENCE_SERVER,
      model: documentCollection.model,
    });

    const vectorDb = await Chroma.fromExistingCollection(ollamaEmbeddings, {
      collectionName: documentCollection.internalName
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(
      llm,
      vectorDb.asRetriever()
    );
  
    const query = messages.pop();
    if (!query) {
      return NextResponseErrors.badRequest();
    }

    const chatHistory = messages.map((m) => m.content).join("\n\n");
  
    const response = await chain.call({ question: query.content, chat_history: chatHistory });
    return NextResponse.json(response);
  } else {
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
}
