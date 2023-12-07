export enum ModelType {
  OLLAMA = "OLLAMA",
  OPENAI = "OPENAI",
  AZURE_OPENAI = "AZURE_OPENAI",
}

export const toModelType = (s: string): ModelType =>
  ModelType[s as keyof typeof ModelType];
