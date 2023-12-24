import { Document } from "@repo/database";

export class DocumentResponse {
  id!: string;
  name!: string;
  mimeType!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: Document): DocumentResponse {
    return {
      id: e.id,
      name: e.name,
      mimeType: e.mimeType ?? undefined,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
