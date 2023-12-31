import { Document } from "@repo/database";
import { MimeType, toMimeType } from "./mime-type";

export class DocumentResponse {
  id!: string;
  name!: string;
  mimeType!: MimeType;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: Document): DocumentResponse {
    return {
      id: e.id,
      name: e.name,
      mimeType: toMimeType(e.mimeType),
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
