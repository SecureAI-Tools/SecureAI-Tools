import { Chat } from "@prisma/client";
import { ChatType } from "lib/types/core/chat-type";

export class ChatResponse {
  id!: string;
  title?: string;
  type?: string;
  model!: string;
  membershipId!: string;
  createdAt!: number;
  updatedAt!: number;
  deletedAt?: number;

  static fromEntity(e: Chat): ChatResponse {
    return {
      id: e.id,
      title: e.title ?? undefined,
      type: e.type ?? ChatType.CHAT_WITH_LLM,
      model: e.model,
      membershipId: e.membershipId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
      deletedAt: e.deletedAt?.getTime(),
    };
  }
}
