// Metadata of a document chunk. Stored as metadata in vector db!
//
// Type instead of an interface to match Record<> type in chroma db.
export type DocumentChunkMetadata = {
  documentId: string;
  documentChunkId: string;
  pageNumber?: number;
  fromLine: number;
  toLine: number;
};
