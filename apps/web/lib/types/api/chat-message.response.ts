import { ChatMessage } from "@repo/database";
import { Message } from "ai";

import {
  ChatMessageRole,
  toChatMessageRole,
  toMessageRole,
} from "lib/types/core/chat-message-role";

export class ChatMessageResponse {
  id!: string;
  content!: string;
  role!: ChatMessageRole;
  chatId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: ChatMessage): ChatMessageResponse {
    return {
      id: e.id,
      content: e.content,
      role: toChatMessageRole(e.role),
      chatId: e.chatId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}

export function chatMessageResponseToMessage(r: ChatMessageResponse): Message {
  return {
    id: r.id,
    createdAt: new Date(r.createdAt),
    content: r.content,
    role: toMessageRole(r.role),
  };
}
