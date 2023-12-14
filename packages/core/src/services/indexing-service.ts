import { DocumentResponse } from "../types/document.response";
import { Id } from "../types/id";
import { getLogger } from "../logger";
import { LocalObjectStorageService } from "./local-object-storage-service";
import { ModelProviderService } from "./model-provider-service";
import { DocumentChunkMetadata } from "../types/document-chunk-metadata";
import { isEmpty, removeTrailingSlash } from "../utils/string-utils";
import { DocumentIndexingStatus } from "../types/document-indexing-status";
import { DocumentService } from "./document-service";
import { DocumentCollectionService } from "./document-collection-service";

import { Document as LangchainDocument } from "langchain/dist/document";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { ChromaClient } from "chromadb";
import { DocumentCollectionResponse } from "../types/document-collection.response";

const documentService = new DocumentService();
const documentCollectionService = new DocumentCollectionService;
const objectStorageService = new LocalObjectStorageService();
const modelProviderService = new ModelProviderService();
const chromaClient = new ChromaClient({
  path: removeTrailingSlash(process.env.VECTOR_DB_SERVER!),
});

const logger = getLogger("model-provider-service");

export class IndexingService {
  async index(documentId: Id<DocumentResponse>): Promise<any> {
    const document = await documentService.get(documentId);

    if (!document) {
      throw new Error(`Document does not exist: ${documentId.toString()}`);
    }

    const documentCollection = await documentCollectionService.get(Id.from<DocumentCollectionResponse>(document.collectionId));
    if (!documentCollection) {
      throw new Error(`Document collection does not exist: ${document.collectionId.toString()}`);
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
        throw new Error(`MimeType not supported: ${document.mimeType}`);
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
          documentCollectionId: document.collectionId,
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

