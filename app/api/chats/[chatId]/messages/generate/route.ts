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
import { Chat } from "@prisma/client";
import { RunnableSequence } from "langchain/schema/runnable";
import { formatDocumentsAsString } from "langchain/util/document";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";

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
    return handleGenerateChatWithDocsConversationalRetrievalQAChain(chat, chatMessagesRequest);
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

// Caveat: This does not generate the question based on chat history. It takes the last message as question and answers based on it!
// From https://js.langchain.com/docs/modules/chains/popular/chat_vector_db/#streaming
// 
// To generate the question based on chat-history, we need to either use ConversationalRetrievalQAChain or do it manually as shown in example linked below
// https://js.langchain.com/docs/modules/chains/popular/chat_vector_db/#built-in-memory
async function handleGenerateChatWithDocsRunnableSequence(chat: Chat, chatMessagesRequest: ChatMessagesRequest) {
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
  CONTEXT: {context}
  ----------
  CHAT HISTORY: {chatHistory}
  ----------
  QUESTION: {question}
  ----------
  Helpful Answer:`
  );

  // Creates basic pipe from one to the next!
  const chain = RunnableSequence.from([
    {
      question: (input: { question: string; chatHistory?: string }) =>
        input.question,
      chatHistory: (input: { question: string; chatHistory?: string }) =>
        input.chatHistory ?? "",
      context: async (input: { question: string; chatHistory?: string }) => {
        const relevantDocs = await vectorDb.asRetriever().getRelevantDocuments(input.question);
        const serialized = formatDocumentsAsString(relevantDocs);
        return serialized;
      },
    },
    questionPrompt,
    llm,
    new StringOutputParser(),
  ]);

  const { messages } = chatMessagesRequest;

  const query = messages.pop();
  if (!query) {
    return NextResponseErrors.badRequest();
  }

  const chatHistory = serializeChatHistory(messages);

  const stream = await chain.stream({ question: query.content, chatHistory: chatHistory });
  
  return new StreamingTextResponse(stream);
}

/*
Uses ConversationalRetrievalQAChain

BUG: This streams the generated question as well!
  
ConversationalRetrievalQAChain does three things:
  1. Generates question: If there is chat history, then based on chat history and latest question, it generates a question by asking LLM to do it.
  2. Document Retrieval: Then it retrieves document (chunks) from vector db matching the question from step 1.
  3. Generate answer: Finally it passes generated question, and relevant documents from previous steps into LLM to generate answer.


The problem is that `handlers` get called for question generated in step-1 above, and so generated question gets streamed to UI!

Option1:
1. Find a way not to stream generated question back -- how do we even stop it?
2. Just manually create a runnable sequence for all three steps!
   Example: https://js.langchain.com/docs/modules/chains/popular/chat_vector_db/#built-in-memory

*/
async function handleGenerateChatWithDocsConversationalRetrievalQAChain(chat: Chat, chatMessagesRequest: ChatMessagesRequest) {
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

  const questionGeneratorLLM = new ChatOllama({
    baseUrl: process.env.INFERENCE_SERVER!,
    model: chat.model,
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(
    llm,
    vectorDb.asRetriever(),
    {
      // DO NOT SUBMIT
      verbose: true,
      questionGeneratorChainOptions: {
        llm: questionGeneratorLLM,
      },
    }
  );

  const { messages } = chatMessagesRequest;

  const query = messages.pop();
  if (!query) {
    return NextResponseErrors.badRequest();
  }

  const chatHistory = serializeChatHistory(messages);

          
  const { stream, handlers } = LangChainStream();
  chain
    .call({
        question: query.content,
        chat_history: chatHistory
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
