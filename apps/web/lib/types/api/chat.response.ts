import { Chat } from "@repo/database";
import { ChatType, toChatType } from "lib/types/core/chat-type";
import { ModelType, toModelType } from "lib/types/core/model-type";

export class ChatResponse {
  id!: string;
  title?: string;
  type?: ChatType;
  model!: string;
  modelType!: ModelType;
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
      modelType: e.modelType ? toModelType(e.modelType) : ModelType.OLLAMA,
      membershipId: e.membershipId,
      documentCollectionId: e.documentCollectionId ?? undefined,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
      deletedAt: e.deletedAt?.getTime(),
    };
  }
}
