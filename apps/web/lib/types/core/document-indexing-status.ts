export enum DocumentIndexingStatus {
  NOT_INDEXED = "NOT_INDEXED",
  INDEXED = "INDEXED",
}

export const toDocumentIndexingStatus = (s: string): DocumentIndexingStatus =>
  DocumentIndexingStatus[s as keyof typeof DocumentIndexingStatus];
