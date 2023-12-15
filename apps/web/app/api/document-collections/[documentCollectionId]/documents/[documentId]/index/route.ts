import { NextResponseErrors } from "@repo/core";
import { DocumentService } from "@repo/core";
import { DocumentResponse } from "@repo/core";
import { LocalObjectStorageService } from "@repo/core";
import { DocumentCollectionResponse } from "@repo/core";
import { DocumentCollectionService } from "@repo/core";
import { isEmpty, removeTrailingSlash } from "@repo/core";
import { DocumentIndexingStatus } from "@repo/core";
import { StreamChunkResponse } from "@repo/core";
import { ModelProviderService } from "@repo/core";
import { DocumentChunkMetadata } from "@repo/core";
import { Id } from "@repo/core";

import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document as LangchainDocument } from "langchain/dist/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { getWebLogger } from "lib/api/core/logger";

const logger = getWebLogger();

const permissionService = new PermissionService();
const documentCollectionService = new DocumentCollectionService();
const documentService = new DocumentService();
const objectStorageService = new LocalObjectStorageService();
const modelProviderService = new ModelProviderService();
const chromaClient = new ChromaClient({
  path: removeTrailingSlash(process.env.VECTOR_DB_SERVER!),
});

// Endpoint to index documents into vector store
export async function POST(
  req: NextRequest,
  { params }: { params: { documentCollectionId: string; documentId: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.documentCollectionId.length < 1 || params.documentId.length < 1) {
    return NextResponseErrors.badRequest();
  }

  // Check permissions
  const documentCollectionId = Id.from<DocumentCollectionResponse>(
    params.documentCollectionId,
  );
  const [permission, resp] =
    await permissionService.hasWriteDocumentCollectionPermission(
      userId!,
      documentCollectionId,
    );
  if (!permission) {
    return resp;
  }

  const documentCollection =
    await documentCollectionService.get(documentCollectionId);
  if (!documentCollection) {
    return NextResponseErrors.notFound();
  }

  const documentId = Id.from<DocumentResponse>(params.documentId);
  const document = await documentService.get(documentId);

  if (!document) {
    return NextResponse.json(NextResponseErrors.notFound);
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: process.env.DOCS_INDEXING_CHUNK_SIZE
      ? parseInt(process.env.DOCS_INDEXING_CHUNK_SIZE)
      : 1000,
    chunkOverlap: process.env.DOCS_INDEXING_CHUNK_OVERLAP
      ? parseInt(process.env.DOCS_INDEXING_CHUNK_OVERLAP)
      : 200,
  });

  const fileBuffer = await objectStorageService.get(document.objectKey);
  var langchainDocuments: LangchainDocument[] = [];
  var loader;
  var docs;
  switch (document.mimeType) {
    case "application/pdf":
      loader = new PDFLoader(new Blob([fileBuffer]));
      docs = await loader.loadAndSplit(textSplitter);
      langchainDocuments = langchainDocuments.concat(docs);
      break;
    default:
      return NextResponseErrors.badRequest(
        `Mime type ${document.mimeType} not supported`,
      );
  }

  const embeddingModel =
    modelProviderService.getEmbeddingModel(documentCollection);

  const encoder = new TextEncoder();

  const encodeChunk = (chunk: StreamChunkResponse): Uint8Array => {
    const serializedChunk = JSON.stringify(chunk);
    return encoder.encode(`${serializedChunk}\n`);
  };

  // Index document and yield stream-chunks
  const indexDocument = async function* () {
    yield encodeChunk({ status: "Splitting documents into chunks" });

    const documentTextChunks: string[] = langchainDocuments.map(
      (document) => document.pageContent,
    );

    yield encodeChunk({
      status: `Processing ${documentTextChunks.length} chunks`,
    });
    let embeddings: number[][] = [];
    for (let i = 0; i < documentTextChunks.length; i++) {
      yield encodeChunk({
        status: `Processing chunk ${i + 1} of ${documentTextChunks.length}`,
      });
      const documentTextChunk = documentTextChunks[i];
      const chunkEmbedding = await embeddingModel.embedDocuments([
        documentTextChunk!,
      ]);
      embeddings.push(chunkEmbedding[0]!);
    }

    const collection = await chromaClient.getOrCreateCollection({
      name: documentCollection.internalName,
    });

    const addResponse = await collection.add({
      ids: embeddings.map((_, i) => toDocumentChunkId(document.id, i)),
      embeddings: embeddings,
      documents: documentTextChunks,
      metadatas: langchainDocuments.map((langchainDocument, i) =>
        toDocumentChunkMetadata(document.id, i, langchainDocument),
      ),
    });

    if (!isEmpty(addResponse.error)) {
      logger.error("could not add document to vector db", {
        documentId: document.id,
        documentCollectionId: documentCollectionId,
        error: addResponse.error,
      });
      yield encodeChunk({
        error: "something went wrong when indexing the doc",
      });
      return;
    }

    await documentService.update(documentId, {
      indexingStatus: DocumentIndexingStatus.INDEXED,
    });
    yield encodeChunk({ status: "Document processed successfully" });
  };

  const stream = iteratorToStream(indexDocument());

  return new Response(stream);
}

function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

function toDocumentChunkMetadata(
  documentId: string,
  chunkIndex: number,
  lcDoc: LangchainDocument,
): DocumentChunkMetadata {
  return {
    // We have to stuff document-chunk-id in metadata because Langchain doesn't return it during retrieval
    // https://github.com/langchain-ai/langchain/issues/11592
    documentChunkId: toDocumentChunkId(documentId, chunkIndex),
    pageNumber: lcDoc.metadata["loc"]["pageNumber"],
    fromLine: lcDoc.metadata["loc"]["lines"]["from"],
    toLine: lcDoc.metadata["loc"]["lines"]["to"],
    documentId: documentId,
  };
}

function toDocumentChunkId(documentId: string, i: number): string {
  return `${documentId}:${i}`;
}
