export enum ChatType {
  CHAT_WITH_LLM = "CHAT_WITH_LLM",
  CHAT_WITH_DOCS = "CHAT_WITH_DOCS",
}

export const toChatType = (s: string): ChatType =>
  ChatType[s as keyof typeof ChatType];
