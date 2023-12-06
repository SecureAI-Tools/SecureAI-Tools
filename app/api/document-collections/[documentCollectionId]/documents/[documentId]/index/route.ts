import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";
import { range } from "lodash";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document as LangchainDocument } from "langchain/dist/document";
import { CharacterTextSplitter } from "langchain/text_splitter";

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
import { DocumentIndexingStatus } from "lib/types/core/document-indexing-status";
import { StreamChunkResponse } from "lib/types/api/stream-chunk.response";
import { ModelProviderService } from "lib/api/services/model-provider-service";
import getLogger from "lib/api/core/logger";

const logger = getLogger();

const permissionService = new PermissionService();
const documentCollectionService = new DocumentCollectionService();
const documentService = new DocumentService();
const objectStorageService = new LocalObjectStorageService();
const modelProviderService = new ModelProviderService();
const chromaClient = new ChromaClient({
  path: process.env.VECTOR_DB_SERVER,
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

  const fileBuffer = await objectStorageService.get(document.objectKey);
  var langchainDocuments: LangchainDocument[] = [];
  var loader;
  var docs;
  switch (document.mimeType) {
    case "application/pdf":
      loader = new PDFLoader(new Blob([fileBuffer]));
      docs = await loader.load();
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

    const textSplitter = new CharacterTextSplitter({
      chunkSize: process.env.DOCS_INDEXING_CHUNK_SIZE
        ? parseInt(process.env.DOCS_INDEXING_CHUNK_SIZE)
        : 1000,
      chunkOverlap: process.env.DOCS_INDEXING_CHUNK_OVERLAP
        ? parseInt(process.env.DOCS_INDEXING_CHUNK_OVERLAP)
        : 200,
    });

    langchainDocuments = await textSplitter.splitDocuments(langchainDocuments);
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
        documentTextChunk,
      ]);
      embeddings.push(chunkEmbedding[0]);
    }

    const collection = await chromaClient.getOrCreateCollection({
      name: documentCollection.internalName,
    });

    const addResponse = await collection.add({
      ids: range(embeddings.length).map((i) => document.id + "_" + i),
      embeddings: embeddings,
      documents: documentTextChunks,
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
