import { ModelType } from "@repo/core";

export class OrganizationUpdateRequest {
  name?: string;
  slug?: string;
  defaultModel?: string;
  defaultModelType?: ModelType;
}
