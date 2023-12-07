import { ModelType } from "lib/types/core/model-type";

export interface ModelProviderConfig {
  type: ModelType;
  apiBaseUrl: string;
  apiKey?: string;
}
