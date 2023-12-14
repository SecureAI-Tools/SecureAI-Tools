import { ModelType } from "..";

export interface ModelProviderConfig {
  type: ModelType;
  apiBaseUrl: string;
  apiKey?: string;
}
