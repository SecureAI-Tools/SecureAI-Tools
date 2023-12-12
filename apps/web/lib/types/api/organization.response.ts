import { Organization } from "@repo/database";
import { ModelType, toModelType } from "lib/types/core/model-type";

export class OrganizationResponse {
  id!: string;
  name!: string;
  slug!: string;
  defaultModel!: string;
  defaultModelType!: ModelType;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: Organization): OrganizationResponse {
    return {
      id: e.id,
      name: e.name,
      slug: e.slug,
      defaultModel: e.defaultModel,
      defaultModelType: e.defaultModelType
        ? toModelType(e.defaultModelType)
        : ModelType.OLLAMA,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
