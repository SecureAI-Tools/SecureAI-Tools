export enum ChatMessageRole {
  SYSTEM = "SYSTEM",
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  FUNCTION = "FUNCTION",
}

export const toChatMessageRole = (s: string): ChatMessageRole =>
  ChatMessageRole[s.toUpperCase() as keyof typeof ChatMessageRole];

export type MessageRole = "system" | "user" | "assistant" | "function";

const MESSAGE_ROLE_MAP: Map<string, MessageRole> = new Map([
  ["system", "system"],
  ["user", "user"],
  ["assistant", "assistant"],
  ["function", "function"],
]);

export const toMessageRole = (r: ChatMessageRole): MessageRole => {
  const roleStr = r.toString().toLowerCase();

  const result = MESSAGE_ROLE_MAP.get(roleStr);

  if (!result) {
    throw new Error(`unsupported role ${r}`);
  }

  return result;
};
