import { ChatDocument } from "@prisma/client";

export class ChatDocumentResponse {
  id!: string;
  mimeType!: string;
  chatId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: ChatDocument): ChatDocumentResponse {
    return {
      id: e.id,
      mimeType: e.mimeType ?? undefined,
      chatId: e.chatId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
