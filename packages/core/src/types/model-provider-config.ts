import { ModelType } from "./model-type";

export interface ModelProviderConfig {
  type: ModelType;
  apiBaseUrl: string;
  apiKey?: string;
  // Model to compute the embeddings. Supported for OpenAI only for now
  embeddingsModel?: string;

  // If specified => system will restrict users to those model strings
  // If not specified or empty => system will allow any arbitrary model name
  allowedModels?: string[];

  // Model provider specific options.
  // All fields except for model-name and api-key! Those two fields are overridden based on the model selected in UI and apiBaseUrl above!
  //
  // Ollama: https://api.js.langchain.com/interfaces/langchain_community_llms_ollama.OllamaInput.html
  // OpenAI: https://api.js.langchain.com/interfaces/langchain_llms_openai.OpenAIInput.html
  options?: any;
}
