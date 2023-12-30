import { Document as LangchainDocument } from "langchain/document";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChromaClient, IncludeEnum } from "chromadb";

import { getLogger } from "../logger";
import { ModelProviderService } from "./model-provider-service";
import { DocumentService } from "./document-service";
import { DocumentCollectionService } from "./document-collection-service";
import { DocumentToCollectionService } from "./document-to-collection-service";
import { DocumentChunkService } from "./document-chunk-service";
import { DataSourceConnectionService } from "./data-source-connection-service";

import {
  Id,
  IdType,
  DocumentChunkMetadata,
  DocumentIndexingStatus,
  StreamChunkResponse,
  isEmpty,
  removeTrailingSlash,
  MimeType,
} from "@repo/core";
import { Document, DocumentCollection } from "@repo/database";

const logger = getLogger("indexing-service");

export class IndexingService {
  private documentService = new DocumentService();
  private documentChunkService = new DocumentChunkService();
  private documentCollectionService = new DocumentCollectionService();
  private documentToCollectionService = new DocumentToCollectionService();
  private dataSourceConnectionService = new DataSourceConnectionService();
  private modelProviderService = new ModelProviderService();
  private chromaClient = new ChromaClient({
    path: removeTrailingSlash(process.env.VECTOR_DB_SERVER!),
  });

  // Indexes given document and yields statuses that can be streamed or logged.
  async *index(
    documentId: Id<IdType.Document>,
    collectionId: Id<IdType.DocumentCollection>,
    dataSourceConnectionId: Id<IdType.DataSourceConnection>,
  ): AsyncGenerator<StreamChunkResponse> {
    const document = await this.documentService.get(documentId);

    if (!document) {
      throw new Error(`Document does not exist: ${documentId.toString()}`);
    }

    const documentCollection =
      await this.documentCollectionService.get(collectionId);
    if (!documentCollection) {
      throw new Error(
        `Document collection does not exist: ${collectionId.toString()}`,
      );
    }

    // Check other document collections to see if this document has already been indexed!
    const indexedDocumentToCollections =
      await this.documentToCollectionService.getAll({
        where: {
          documentId: documentId.toString(),
          indexingStatus: DocumentIndexingStatus.INDEXED,
          // Bound to same organization of the document collection
          collection: {
            organizationId: documentCollection.organizationId,
          },
        },
      });

    if (indexedDocumentToCollections.length > 0) {
      // Document has already been indexed through some other collection; Reuse data from that indexing run!
      yield* this.copyDocumentIndex(
        document,
        documentCollection,
        Id.from(indexedDocumentToCollections[0]!.collectionId),
      );
    } else {
      // Document has not yet been indexed! Compute embeddings and everything it!
      yield* this.indexNewDocument(
        document,
        documentCollection,
        dataSourceConnectionId,
      );
    }
  }

  // Indexes a document that hasn't been indexed yet! Not safe for an already indexed document.
  private async *indexNewDocument(
    document: Document,
    documentCollection: DocumentCollection,
    dataSourceConnectionId: Id<IdType.DataSourceConnection>,
  ): AsyncGenerator<StreamChunkResponse> {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: process.env.DOCS_INDEXING_CHUNK_SIZE
        ? parseInt(process.env.DOCS_INDEXING_CHUNK_SIZE)
        : 1000,
      chunkOverlap: process.env.DOCS_INDEXING_CHUNK_OVERLAP
        ? parseInt(process.env.DOCS_INDEXING_CHUNK_OVERLAP)
        : 200,
    });

    if (document.mimeType !== MimeType.PDF) {
      throw new Error(`MimeType not supported: ${document.mimeType}`);
    }

    const dataSourceConnection = await this.dataSourceConnectionService.get(
      dataSourceConnectionId,
    );
    if (!dataSourceConnection) {
      throw new Error(
        `invalid dataSourceConnectionId ${dataSourceConnectionId}`,
      );
    }

    // Index document and yield stream-chunks
    yield { status: "Splitting documents into chunks" };
    const blob = await this.documentService.read(
      document,
      dataSourceConnection,
    );
    const loader = new PDFLoader(blob);
    const langchainDocuments: LangchainDocument[] =
      await loader.loadAndSplit(textSplitter);

    const embeddingModel =
      this.modelProviderService.getEmbeddingModel(documentCollection);

    const documentTextChunks: string[] = langchainDocuments.map(
      (document) => document.pageContent,
    );

    yield { status: `Processing ${documentTextChunks.length} chunks` };
    let embeddings: number[][] = [];
    for (let i = 0; i < documentTextChunks.length; i++) {
      yield {
        status: `Processing chunk ${i + 1} of ${documentTextChunks.length}`,
      };
      const documentTextChunk = documentTextChunks[i];
      const chunkEmbedding = await embeddingModel.embedDocuments([
        documentTextChunk!,
      ]);
      embeddings.push(chunkEmbedding[0]!);
    }

    const chunkIdsInVectorDb = embeddings.map((_, i) =>
      toDocumentChunkId(document.id, i),
    );

    if (documentTextChunks.length > 0) {
      const vectorDbCollection = await this.chromaClient.getOrCreateCollection({
        name: documentCollection.internalName,
      });

      const addResponse = await vectorDbCollection.add({
        ids: chunkIdsInVectorDb,
        embeddings: embeddings,
        documents: documentTextChunks,
        metadatas: langchainDocuments.map((langchainDocument, i) =>
          toDocumentChunkMetadata(document.id, i, langchainDocument),
        ),
      });

      if (!isEmpty(addResponse.error)) {
        logger.error("could not add document to vector db", {
          documentId: document.id,
          documentCollectionId: documentCollection.id,
          error: addResponse.error,
        });
        yield { error: "something went wrong when indexing the doc" };
        return;
      }
    } else {
      logger.error("could not get any text chunks from document", {
        documentId: document.id,
        documentName: document.name,
      });
      yield { status: "could not get any text chunks from document; Skipping document..." };
    }

    const documentId = Id.from<IdType.Document>(document.id);

    await this.documentService.updateIndexingStatus({
      documentId: documentId,
      collectionId: Id.from(documentCollection.id),
      indexingStatus: DocumentIndexingStatus.INDEXED,
    });

    // Insert document chunks into db!
    await this.documentChunkService.createMany(
      chunkIdsInVectorDb.map((vid) => {
        return {
          vectorDbId: vid,
          documentId: documentId,
        };
      }),
    );

    yield { status: "Document processed successfully" };
  }

  private async *copyDocumentIndex(
    document: Document,
    documentCollection: DocumentCollection,
    sourceDocumentCollectionId: Id<IdType.DocumentCollection>,
  ): AsyncGenerator<StreamChunkResponse> {
    yield { status: "Document is already indexed. Copying index data" };

    // Get source vector db collection
    const sourceDocumentCollection = await this.documentCollectionService.get(
      sourceDocumentCollectionId,
    );
    if (!sourceDocumentCollection) {
      throw new Error(
        `source document collection does not exist: ${sourceDocumentCollectionId.toString()}`,
      );
    }
    const sourceVectorDbCollection = await this.chromaClient.getCollection({
      name: sourceDocumentCollection.internalName,
    });

    // Get existing index data from source vector db collection
    const documentChunks = await this.documentChunkService.getAll({
      where: {
        documentId: document.id,
      },
    });
    const getResponse = await sourceVectorDbCollection.get({
      ids: documentChunks.map((dc) => dc.vectorDbId),
      include: [
        IncludeEnum.Embeddings,
        IncludeEnum.Documents,
        IncludeEnum.Metadatas,
      ],
    });

    if (getResponse.error) {
      yield {
        error: `Could not get data from source collection. Received this error: ${getResponse.error}`,
      };
      return;
    }

    // Add data into destination vector db collection
    const destinationVectorDbCollection =
      await this.chromaClient.getOrCreateCollection({
        name: documentCollection.internalName,
      });
    const addResponse = await destinationVectorDbCollection.add({
      ids: getResponse.ids,
      embeddings: getResponse.embeddings!,
      documents: getResponse.documents.map((d) => d!),
      metadatas: getResponse.metadatas.map((m) => m!),
    });

    if (!isEmpty(addResponse.error)) {
      logger.error("could not add document to vector db", {
        documentId: document.id,
        documentCollectionId: documentCollection.id,
        error: addResponse.error,
      });
      yield { error: "something went wrong when indexing the doc" };
      return;
    }

    await this.documentService.updateIndexingStatus({
      documentId: Id.from(document.id),
      collectionId: Id.from(documentCollection.id),
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
