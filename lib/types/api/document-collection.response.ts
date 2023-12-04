import { DocumentCollection } from "@prisma/client";

export class DocumentCollectionResponse {
  id!: string;
  name?: string;
  ownerId!: string;
  organizationId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: DocumentCollection): DocumentCollectionResponse {
    return {
      id: e.id,
      name: e.name ?? undefined,
      ownerId: e.ownerId,
      organizationId: e.organizationId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
