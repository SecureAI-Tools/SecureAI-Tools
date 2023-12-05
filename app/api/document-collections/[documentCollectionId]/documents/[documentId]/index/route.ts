import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb"
import { range } from "lodash";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document as LangchainDocument } from "langchain/dist/document";
import { CharacterTextSplitter } from "langchain/text_splitter"
import { OllamaEmbeddings } from "langchain/embeddings/ollama"
import { StatusCodes } from "http-status-codes";

import { isAuthenticated } from "lib/api/core/auth";
import { Id } from "lib/types/core/id";
import { PermissionService } from "lib/api/services/permission-service";
import { NextResponseErrors } from "lib/api/core/utils";
import { DocumentService } from "lib/api/services/document-service";
import { DocumentResponse } from "lib/types/api/document.response";
import { LocalObjectStorageService } from "lib/api/services/local-object-storage-service";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { DocumentCollectionService } from "lib/api/services/document-collection-service";
import { isEmpty } from "lib/core/string-utils";
import getLogger from "lib/api/core/logger";
import { DocumentIndexingStatus } from "lib/types/core/document-indexing-status";

const logger = getLogger();

const permissionService = new PermissionService();
const documentCollectionService = new DocumentCollectionService();
const documentService = new DocumentService();
const objectStorageService = new LocalObjectStorageService();
const chromaClient = new ChromaClient({
  path: process.env.CHROMA_SERVER
});

// Endpoint to index documents into vector store
export async function POST(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string, documentId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.documentCollectionId.length < 1 || params.documentId.length < 1) {
    return NextResponseErrors.badRequest();
  }

  // Check permissions
  const documentCollectionId = Id.from<DocumentCollectionResponse>(params.documentCollectionId);
  const [permission, resp] = await permissionService.hasWriteDocumentCollectionPermission(
    userId!,
    documentCollectionId,
  );
  if (!permission) {
    return resp;
  }

  const documentCollection = await documentCollectionService.get(documentCollectionId);
  if (!documentCollection) {
    return NextResponseErrors.notFound();
  }

  const documentId = Id.from<DocumentResponse>(params.documentId);
  const document = await documentService.get(documentId);

  if (!document) {
    return NextResponse.json(NextResponseErrors.notFound);
  }

  const fileBuffer = await objectStorageService.get(document.objectKey);
  var langchainDocuments: LangchainDocument[] = [];
  var loader;
  var docs;
  // TODO: currently there is some issue with docx loader, so removing it for now to unblock.
  switch(document.mimeType) {
    case "application/pdf":
      loader = new PDFLoader(new Blob([fileBuffer]));
      docs = await loader.load();
      langchainDocuments = langchainDocuments.concat(docs);
      break;
    default:
      return NextResponseErrors.badRequest(`Mime type ${document.mimeType} not supported`);
  }

  const textSplitter = new CharacterTextSplitter({
    chunkSize: process.env.CHUNK_SIZE ? parseInt(process.env.CHUNK_SIZE) : 1000, 
    chunkOverlap: process.env.CHUNK_OVERLAP ? parseInt(process.env.CHUNK_OVERLAP) : 200,
  });

  langchainDocuments = await textSplitter.splitDocuments(langchainDocuments);

  const documentTextChunks: string[] = langchainDocuments.map(document => document.pageContent);

  const ollamaEmbeddings = new OllamaEmbeddings({
    baseUrl: process.env.INFERENCE_SERVER,
    model: documentCollection.model,
  });

  const embeddings = await ollamaEmbeddings.embedDocuments(documentTextChunks);

  const collection = await chromaClient.getOrCreateCollection({
    name: documentCollection.internalName,
  });

  const addResponse = await collection.add({
    ids: range(embeddings.length).map(i => document.id + "_" + i),
    embeddings: embeddings,
    documents: documentTextChunks
  });

  if (!isEmpty(addResponse.error)) {
    logger.error("could not add document to vector db", {
      documentId: document.id,
      documentCollectionId: documentCollectionId,
      error: addResponse.error,
    });
    return NextResponseErrors.internalServerError("something went wrong when indexing the doc");
  }

  await documentService.update(documentId, {
    indexingStatus: DocumentIndexingStatus.INDEXED,
  });

  return NextResponse.json({
    status: StatusCodes.CREATED
  });
}
