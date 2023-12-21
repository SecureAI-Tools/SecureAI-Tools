import { Document as LangchainDocument } from "langchain/document";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChromaClient } from "chromadb";

import { getLogger } from "../logger";
import { LocalObjectStorageService } from "./local-object-storage-service";
import { ModelProviderService } from "./model-provider-service";
import { DocumentService } from "./document-service";
import { DocumentCollectionService } from "./document-collection-service";

import { DocumentChunkMetadata, DocumentCollectionResponse, DocumentIndexingStatus, DocumentResponse, Id, StreamChunkResponse, isEmpty, removeTrailingSlash } from "@repo/core";

const logger = getLogger("model-provider-service");

export class IndexingService {
  private documentService = new DocumentService();
  private documentCollectionService = new DocumentCollectionService;
  private objectStorageService = new LocalObjectStorageService();
  private modelProviderService = new ModelProviderService();
  private chromaClient = new ChromaClient({
    path: removeTrailingSlash(process.env.VECTOR_DB_SERVER!),
  });

  // Indexes given document and yields statuses that can be streamed or logged.
  async* index(documentId: Id<DocumentResponse>): AsyncGenerator<StreamChunkResponse> {
    const document = await this.documentService.get(documentId);

    if (!document) {
      throw new Error(`Document does not exist: ${documentId.toString()}`);
    }

    const documentCollection = await this.documentCollectionService.get(Id.from<DocumentCollectionResponse>(document.collectionId));
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

    const fileBuffer = await this.objectStorageService.get(document.uri);
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
      this.modelProviderService.getEmbeddingModel(documentCollection);

    // Index document and yield stream-chunks
    yield { status: "Splitting documents into chunks" };

    const documentTextChunks: string[] = langchainDocuments.map(
      (document) => document.pageContent,
    );

    yield { status: `Processing ${documentTextChunks.length} chunks` };
    let embeddings: number[][] = [];
    for (let i = 0; i < documentTextChunks.length; i++) {
      yield { status: `Processing chunk ${i + 1} of ${documentTextChunks.length}` };
      const documentTextChunk = documentTextChunks[i];
      const chunkEmbedding = await embeddingModel.embedDocuments([
        documentTextChunk!,
      ]);
      embeddings.push(chunkEmbedding[0]!);
    }

    const collection = await this.chromaClient.getOrCreateCollection({
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
      yield { error: "something went wrong when indexing the doc" };
      return;
    }

    await this.documentService.update(documentId, {
      indexingStatus: DocumentIndexingStatus.INDEXED,
    });
    yield { status: "Document processed successfully" };
  }
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
