import { Citation } from "@repo/database";
import { DocumentChunkMetadata } from "@repo/core/src/types/document-chunk-metadata";

export class CitationResponse {
  id!: string;
  score!: number;
  pageNumber!: number;
  fromLine!: number;
  toLine!: number;
  documentId!: string;
  chatMessageId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(
    e: Citation,
    meta: DocumentChunkMetadata,
  ): CitationResponse {
    return {
      id: e.id,
      score: e.score,
      pageNumber: meta.pageNumber,
      fromLine: meta.fromLine,
      toLine: meta.toLine,
      documentId: e.documentId,
      chatMessageId: e.chatMessageId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
