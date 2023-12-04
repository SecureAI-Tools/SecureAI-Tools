import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { ChatDocumentService } from "lib/api/services/chat-document-service";
import { getDocumentPath } from "lib/core/document-path-utils";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document } from "langchain/dist/document";
import { CharacterTextSplitter } from "langchain/text_splitter"
import { OllamaEmbeddings } from "langchain/embeddings/ollama"
import { StatusCodes } from "http-status-codes";
import { ChatDocumentResponse } from "lib/types/api/chat-document.response";
import { ChromaClient } from "chromadb"
import { range } from "lodash";

const permissionService = new PermissionService();
const chatService = new ChatService();
const chatDocumentService = new ChatDocumentService();

// Endpoint to index documents into vector store
export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string, documentId: string } },
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

  const organization = await chatService.getOrganization(chatId);
  if (!organization) {
    return NextResponseErrors.notFound();
  }


  const chatDocument = await chatDocumentService.get(Id.from<ChatDocumentResponse>(params.documentId));

  if (!chatDocument) {
    return NextResponse.json(NextResponseErrors.notFound);
  }

  const documentPath = getDocumentPath(organization.id, chatId.toString(), chatDocument.id)!;
  var documents: Document[] = [];
  var loader;
  var docs;
  // TODO: currently there is some issue with docx loader, so removing it for now to unblock.
  switch(chatDocument.mimeType) {
    case "application/pdf":
      loader = new PDFLoader(documentPath);
      docs = await loader.load();
      documents = documents.concat(docs);
    // case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    //   loader = new DocxLoader(documentPath!);
    //   docs = await loader.load();
    //   documents = documents.concat(docs);
    // case "text/plain":
    //   loader = new TextLoader(documentPath!);
    //   docs = await loader.load();
    //   documents = documents.concat(docs);
  }

  const text_splitter = new CharacterTextSplitter({
    chunkSize: parseInt(process.env.CHUNK_SIZE!), 
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP!),
  });
  documents = await text_splitter.splitDocuments(documents);

  const documentTextChunks: string[] = documents.map(document => document.pageContent);

  const ollamaEmbeddings = new OllamaEmbeddings({
    baseUrl: process.env.INFERENCE_SERVER
  });

  const embeddings = await ollamaEmbeddings.embedDocuments(documentTextChunks);

  const chromaClient = new ChromaClient({
    path: process.env.CHROMA_SERVER
  });

  const collection = await chromaClient.getOrCreateCollection(chatId.toString);

  await collection.add({
    ids: range(embeddings.length).map(i => chatDocument.id + "_" + i),
    embeddings: embeddings,
    documents: documentTextChunks
  });
  
  // TODO: we can store index status to databse table here.
  return NextResponse.json({
    status: StatusCodes.CREATED
  });
}
