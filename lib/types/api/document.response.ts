import { Document } from "@prisma/client";
import {
  DocumentIndexingStatus,
  toDocumentIndexingStatus,
} from "lib/types/core/document-indexing-status";

export class DocumentResponse {
  id!: string;
  name!: string;
  mimeType!: string;
  indexingStatus!: DocumentIndexingStatus;
  collectionId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: Document): DocumentResponse {
    return {
      id: e.id,
      name: e.name,
      mimeType: e.mimeType ?? undefined,
      indexingStatus: toDocumentIndexingStatus(e.indexingStatus),
      collectionId: e.collectionId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
