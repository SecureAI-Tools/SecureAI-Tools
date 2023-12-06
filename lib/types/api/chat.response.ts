import { Chat } from "@prisma/client";
import { ChatType, toChatType } from "lib/types/core/chat-type";

export class ChatResponse {
  id!: string;
  title?: string;
  type?: ChatType;
  model!: string;
  membershipId!: string;
  documentCollectionId?: string;
  createdAt!: number;
  updatedAt!: number;
  deletedAt?: number;

  static fromEntity(e: Chat): ChatResponse {
    return {
      id: e.id,
      title: e.title ?? undefined,
      type: toChatType(e.type ?? ChatType.CHAT_WITH_LLM),
      model: e.model,
      membershipId: e.membershipId,
      documentCollectionId: e.documentCollectionId ?? undefined,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
      deletedAt: e.deletedAt?.getTime(),
    };
  }
}
