import { ModelType } from "./model-type";

export interface ModelProviderConfig {
  type: ModelType;
  apiBaseUrl: string;
  apiKey?: string;

  // Model provider specific options.
  // All fields except for model-name and api-key! Those two fields are overridden based on the model selected in UI and apiBaseUrl above!
  // 
  // Ollama: https://api.js.langchain.com/interfaces/langchain_community_llms_ollama.OllamaInput.html
  // OpenAI: https://api.js.langchain.com/interfaces/langchain_llms_openai.OpenAIInput.html
  options?: any;
}
