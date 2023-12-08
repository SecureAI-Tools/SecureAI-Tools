export enum ModelType {
  OLLAMA = "OLLAMA",
  OPENAI = "OPENAI",
  AZURE_OPENAI = "AZURE_OPENAI",
}

export const toModelType = (s: string): ModelType =>
  ModelType[s as keyof typeof ModelType];

export const modelTypeToReadableName = (type: ModelType): string => {
  switch (type) {
    case ModelType.OPENAI:
      return "OpenAI";
    case ModelType.OLLAMA:
      return "Ollama";
    default:
      return type;
  }
};
