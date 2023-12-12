import { DocumentCollection } from "@prisma/client";
import { ModelType, toModelType } from "lib/types/core/model-type";

export class DocumentCollectionResponse {
  id!: string;
  name?: string;
  model!: string;
  modelType!: ModelType;
  ownerId!: string;
  organizationId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: DocumentCollection): DocumentCollectionResponse {
    return {
      id: e.id,
      name: e.name ?? undefined,
      model: e.model,
      modelType: e.modelType ? toModelType(e.modelType) : ModelType.OLLAMA,
      ownerId: e.ownerId,
      organizationId: e.organizationId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
