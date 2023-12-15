import { ModelType } from "@repo/core/src/types/model-type";

export class OrganizationUpdateRequest {
  name?: string;
  slug?: string;
  defaultModel?: string;
  defaultModelType?: ModelType;
}
