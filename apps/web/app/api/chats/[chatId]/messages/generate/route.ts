import { StreamingTextResponse, LangChainStream, Message } from "ai";
import { AIMessage, HumanMessage } from "langchain/schema";
import { NextRequest } from "next/server";
import { Chat } from "@prisma/client";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { Chroma } from "langchain/vectorstores/chroma";
import { Document as LangchainDocument } from "langchain/dist/document";
import { BaseChatModel } from "langchain/dist/chat_models/base";

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
import { ModelProviderService } from "lib/api/services/model-provider-service";
import { CitationService } from "lib/api/services/citation-service";
import { TxPrismaClient } from "lib/api/core/db";
import { prismaClient } from "lib/api/db";
import { DocumentChunkMetadata } from "lib/types/core/document-chunk-metadata";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";
import getLogger from "lib/api/core/logger";

const chatMessageService = new ChatMessageService();
const documentCollectionService = new DocumentCollectionService();
const permissionService = new PermissionService();
const chatService = new ChatService();
const modelProviderService = new ModelProviderService();
const citationService = new CitationService();
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

  if (chat.type == ChatType.CHAT_WITH_DOCS) {
    return generateChatWithDocs(chat, chatMessagesRequest);
  } else {
    return generateChatWithAI(chat, chatMessagesRequest);
  }
}

async function generateChatWithAI(
  chat: Chat,
  chatMessagesRequest: ChatMessagesRequest,
) {
  // The langChainHandlers put data into streams on appropriate langchain events
  const { stream, handlers: langChainHandlers } = LangChainStream();

  const wrappedHandlers = {
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

  const llm = modelProviderService.getChatModel(chat);

  llm
    .call(
      (chatMessagesRequest.messages as Message[]).map((m) =>
        m.role == "user"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content),
      ),
      {},
      [wrappedHandlers],
    )
    .catch(logger.error);

  return new StreamingTextResponse(stream);
}

async function generateChatWithDocs(
  chat: Chat,
  chatMessagesRequest: ChatMessagesRequest,
) {
  if (!chat.documentCollectionId) {
    return NextResponseErrors.badRequest();
  }

  const documentCollection = await documentCollectionService.get(
    Id.from<DocumentCollectionResponse>(chat.documentCollectionId),
  );
  if (!documentCollection) {
    return NextResponseErrors.notFound();
  }

  const embeddingModel =
    modelProviderService.getEmbeddingModel(documentCollection);

  const vectorDb = await Chroma.fromExistingCollection(embeddingModel, {
    url: process.env.VECTOR_DB_SERVER,
    collectionName: documentCollection.internalName,
  });

  const llm = modelProviderService.getChatModel(chat);

  const { messages } = chatMessagesRequest;

  const query = messages.pop();
  if (!query) {
    return NextResponseErrors.badRequest();
  }

  logger.debug("original question: ", { query: query.content });
  const chatHistory = serializeChatHistory(messages);

  // Rewrite query if needed;
  const rewrittenQuestion =
    messages.length > 0
      ? await rewriteHistoryAsStandaloneQuestion(
          llm,
          query.content,
          chatHistory,
        )
      : query.content;

  const sourcesWithScores = await vectorDb.similaritySearchWithScore(
    rewrittenQuestion,
    process.env.DOCS_RETRIEVAL_K ? parseInt(process.env.DOCS_RETRIEVAL_K) : 4,
  );

  logger.debug("sources: ", { sources: sourcesWithScores });

  // The langChainHandlers put data into streams on appropriate langchain events
  const { stream, handlers: langChainHandlers } = LangChainStream();

  const wrappedHandlers = {
    ...langChainHandlers,
    handleLLMEnd: (output: any, runId: string): Promise<void> => {
      // Save the LLM generated responses
      output.generations.map(async (generation: any) => {
        const content = generation.map((chunk: any) => chunk.text).join();
        await prismaClient.$transaction(async (tx: TxPrismaClient) => {
          const chatMessage = await chatMessageService.createWithTxn(tx, {
            content: content,
            role: ChatMessageRole.ASSISTANT,
            chatId: chat.id,
          });

          const chatMessageId = Id.from<ChatMessageResponse>(chatMessage.id);
          const promises = sourcesWithScores.map(async (s) => {
            const [lcDoc, score] = s;
            const meta = lcDoc.metadata as DocumentChunkMetadata;
            await citationService.createWithTxn(tx, {
              documentChunkId: meta.documentChunkId,
              score: score,
              chatMessageId: chatMessageId,
              documentId: Id.from(meta.documentId),
            });
          });

          await Promise.all(promises);
        });
      });

      return langChainHandlers.handleLLMEnd(output, runId);
    },
  };

  const questionChain = new LLMChain({
    llm: llm,
    prompt: questionPrompt,
  });

  questionChain
    .call(
      {
        question: query.content,
        chatHistory: chatHistory,
        context: serializeSources(sourcesWithScores.map((s) => s[0])),
      },
      [wrappedHandlers],
    )
    .catch(logger.error);

  return new StreamingTextResponse(stream);
}

const rewriteHistoryAsStandaloneQuestion = async (
  llm: BaseChatModel,
  intialQuery: string,
  chatHistory: string,
): Promise<string> => {
  const questionRewritingChain = new LLMChain({
    llm: llm,
    prompt: questionRewritingPrompt,
  });

  const { text: rewrittenQuestion } = await questionRewritingChain.call({
    question: intialQuery,
    chatHistory: chatHistory,
  });

  logger.debug("re-written question: ", { rewrittenQuery: rewrittenQuestion });

  return rewrittenQuestion;
};

const serializeChatHistory = (
  messages: Pick<Message, "role" | "content">[],
): string => {
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
};

const serializeSources = (sources: LangchainDocument[]): string => {
  return sources
    .map((source, i) => {
      return `Source: ${i + 1}\n` + source.pageContent;
    })
    .join("\n\n");
};

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
Standalone question:`,
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
Helpful Answer:`,
);
