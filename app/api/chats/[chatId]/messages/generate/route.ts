import { StreamingTextResponse, LangChainStream, Message } from "ai";
import { ChatOllama } from "langchain/chat_models/ollama";
import { AIMessage, HumanMessage } from "langchain/schema";
import { NextRequest } from "next/server";

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
import { LLMChain } from "langchain/chains"
import { Chroma } from "langchain/vectorstores/chroma"
import { DocumentCollectionService } from "lib/api/services/document-collection-service";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { ChatType } from "lib/types/core/chat-type";
import { Chat } from "@prisma/client";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { Document } from "langchain/dist/document";

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

  const chatMessagesRequest = (await req.json()) as ChatMessagesRequest;

  if (chatMessagesRequest.messages.length < 1 || params.chatId.length < 1) {
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

  const chat = await chatService.get(chatId);
  if (!chat) {
    return NextResponseErrors.notFound();
  }

  if (chat.type == ChatType.CHAT_WITH_DOCS) {
    return handleGenerateChatWithDocs(chat, chatMessagesRequest);
  } else {
    return handleGenerateChatWithAI(chat, chatMessagesRequest);
  }
}

async function handleGenerateChatWithAI(chat: Chat, chatMessagesRequest: ChatMessagesRequest) {
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
          chatId: chat.id,
        });
      });

      return langChainHandlers.handleLLMEnd(output, runId);
    },
  };

  const llm = new ChatOllama({
    baseUrl: process.env.INFERENCE_SERVER!,
    model: chat.model,
  });

  llm
    .call(
      (chatMessagesRequest.messages as Message[]).map((m) =>
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


async function handleGenerateChatWithDocs(chat: Chat, chatMessagesRequest: ChatMessagesRequest) {
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

  const llm = new ChatOllama({
    baseUrl: process.env.INFERENCE_SERVER!,
    model: chat.model,
  });

  const questionPrompt = PromptTemplate.fromTemplate(
    `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
  ----------
  CONTEXT:

  {context}
  ----------
  CHAT HISTORY:

  {chatHistory}
  ----------
  QUESTION:

  {question}
  ----------
  Helpful Answer:`
  );

  const queryRewritingPrompt = PromptTemplate.fromTemplate(
    `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
  ----------
  CHAT HISTORY: 
  
  {chatHistory}
  ----------
  FOLLOWUP QUESTION: 
  
  {question}
  ----------
  Standalone question:`
  );
  
  const { messages } = chatMessagesRequest;

  const query = messages.pop();
  if (!query) {
    return NextResponseErrors.badRequest();
  }

  console.log("original query: ", query.content);
  const chatHistory = serializeChatHistory(messages);

  const queryRewritingChain = new LLMChain({
    llm: llm,
    prompt: queryRewritingPrompt,
  });

  const { text: rewrittenQuery } = await queryRewritingChain
    .call({
        question: query.content,
        chatHistory: chatHistory,
      }
    );

  console.log("re-written query: ", rewrittenQuery);

  const sources = await vectorDb.similaritySearch(String(rewrittenQuery), 2);

  console.log("sources: ", sources);
  
  const questionChain = new LLMChain({
    llm: llm,
    prompt: questionPrompt,
  });

  const { stream, handlers } = LangChainStream();
  questionChain
    .call({
        question: query.content,
        chatHistory: chatHistory,
        context: serializeSources(sources),
      },
      [handlers],
    )
    .catch(console.error);
  
  return new StreamingTextResponse(stream);
}

const serializeChatHistory = (messages: Pick<Message, "role" | "content">[]): string => {
  return messages
    .map((m) => {
      if (m.role === "user") {
        return `Human: ${m.content}`;
      } else if (m.role === "assistant") {
        return `Assistant: ${m.content}`;
      } else {
        return `${m.content}`;
      }
    })
    .join("\n\n");
}

const serializeSources = (sources: Document[]): string => {
  var i = 0;
  return sources
  .map((source) => {
    i = i + 1;
    return "Source: ${i}\n" + source.pageContent;
  }).join("\n\n");
}
