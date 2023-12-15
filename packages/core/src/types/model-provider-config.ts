import { ModelType } from "./model-type";

export interface ModelProviderConfig {
  type: ModelType;
  apiBaseUrl: string;
  apiKey?: string;
}
