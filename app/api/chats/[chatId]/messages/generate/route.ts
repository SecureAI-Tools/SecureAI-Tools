import { StreamingTextResponse, LangChainStream, Message } from "ai";
import { ChatOllama } from "langchain/chat_models/ollama";
import { AIMessage, HumanMessage } from "langchain/schema";
import { NextRequest } from "next/server";
import { Chat } from "@prisma/client";
import { PromptTemplate } from "langchain/prompts";
import { OllamaEmbeddings } from "langchain/embeddings/ollama";
import { LLMChain } from "langchain/chains"
import { Chroma } from "langchain/vectorstores/chroma"
import { Document as LangchainDocument } from "langchain/dist/document";
import { Callbacks as LangchainCallbacks } from "langchain/dist/callbacks";
import { SimpleChatModel } from "langchain/dist/chat_models/base";

import { ChatMessageService } from "lib/api/services/chat-message-service";
import { ChatMessageRole } from "lib/types/core/chat-message-role";
import { ChatMessagesRequest } from "lib/types/api/chat-messages.request";
import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { DocumentCollectionService } from "lib/api/services/document-collection-service";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { ChatType } from "lib/types/core/chat-type";
import getLogger from "lib/api/core/logger";

const chatMessageService = new ChatMessageService();
const documentCollectionService = new DocumentCollectionService();
const permissionService = new PermissionService();
const chatService = new ChatService();
const logger = getLogger();

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

  // The langChainHandlers put data into streams on appropriate langchain events
  const { stream, handlers: langChainHandlers } = LangChainStream();

  const callbacks: LangchainCallbacks = [{
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
  }];

  if (chat.type == ChatType.CHAT_WITH_DOCS) {
    generateChatWithDocs(chat, chatMessagesRequest, callbacks);
  } else {
    generateChatWithAI(chat, chatMessagesRequest, callbacks);
  }

  return new StreamingTextResponse(stream);
}

async function generateChatWithAI(chat: Chat, chatMessagesRequest: ChatMessagesRequest, callbacks: LangchainCallbacks) {
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
      callbacks,
    )
    .catch(logger.error);
}


async function generateChatWithDocs(chat: Chat, chatMessagesRequest: ChatMessagesRequest, callbacks: LangchainCallbacks) {
  if (!chat.documentCollectionId) {
    return NextResponseErrors.badRequest();
  }

  const documentCollection = await documentCollectionService.get(Id.from<DocumentCollectionResponse>(chat.documentCollectionId));
  if (!documentCollection) {
    return NextResponseErrors.notFound();
  }

  const embeddingsLLM = new OllamaEmbeddings({
    baseUrl: process.env.INFERENCE_SERVER,
    model: documentCollection.model,
  });

  const vectorDb = await Chroma.fromExistingCollection(embeddingsLLM, {
    collectionName: documentCollection.internalName
  });

  const llm = new ChatOllama({
    baseUrl: process.env.INFERENCE_SERVER!,
    model: chat.model,
  });

  const { messages } = chatMessagesRequest;

  const query = messages.pop();
  if (!query) {
    return NextResponseErrors.badRequest();
  }

  logger.debug("original question: ", { query: query.content });
  const chatHistory = serializeChatHistory(messages);

  // Rewrite query if needed;
  const rewrittenQuestion = messages.length > 0 ? await rewriteHistoryAsStandaloneQuestion(llm, query.content, chatHistory) : query.content;

  const sources = await vectorDb.similaritySearch(rewrittenQuestion, process.env.DOCS_RETRIEVAL_K ? parseInt(process.env.DOCS_RETRIEVAL_K) : 4);

  logger.debug("sources: ", { sources: sources });

  const questionChain = new LLMChain({
    llm: llm,
    prompt: questionPrompt,
  });

  questionChain
    .call({
      question: query.content,
      chatHistory: chatHistory,
      context: serializeSources(sources),
    },
      callbacks,
    )
    .catch(logger.error);
}

const rewriteHistoryAsStandaloneQuestion = async (llm: SimpleChatModel, intialQuery: string, chatHistory: string): Promise<string> => {
  const questionRewritingChain = new LLMChain({
    llm: llm,
    prompt: questionRewritingPrompt,
  });

  const { text: rewrittenQuestion } = await questionRewritingChain
    .call({
      question: intialQuery,
      chatHistory: chatHistory,
    });

  logger.debug("re-written question: ", { rewrittenQuery: rewrittenQuestion });

  return rewrittenQuestion;
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

const serializeSources = (sources: LangchainDocument[]): string => {
  return sources
    .map((source, i) => {
      return `Source: ${i + 1}\n` + source.pageContent;
    }).join("\n\n");
}

// Prompt that rewrites chat-history as a standalone question
const questionRewritingPrompt = PromptTemplate.fromTemplate(
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

// Prompt that answers user's question
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