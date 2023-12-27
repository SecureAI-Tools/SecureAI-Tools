import { DocumentToCollection } from "@repo/database";
import {
  DocumentIndexingStatus,
  toDocumentIndexingStatus,
} from "./document-indexing-status";

export class DocumentToCollectionResponse {
  id!: string;
  documentId!: string;
  collectionId!: string;
  indexingStatus!: DocumentIndexingStatus;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: DocumentToCollection): DocumentToCollectionResponse {
    return {
      id: e.id,
      documentId: e.documentId,
      collectionId: e.collectionId,
      indexingStatus: toDocumentIndexingStatus(e.indexingStatus),
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
