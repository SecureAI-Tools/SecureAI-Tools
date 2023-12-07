import { ModelType } from "lib/types/core/model-type";

export class OrganizationUpdateRequest {
  name?: string;
  slug?: string;
  defaultModel?: string;
  defaultModelType?: ModelType;
}
