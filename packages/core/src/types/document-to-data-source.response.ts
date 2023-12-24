import { DocumentToDataSource } from "@repo/database";

export class DocumentToDataSourceResponse {
  id!: string;
  documentId!: string;
  dataSourceId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: DocumentToDataSource): DocumentToDataSourceResponse {
    return {
      id: e.id,
      documentId: e.documentId,
      dataSourceId: e.dataSourceId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
