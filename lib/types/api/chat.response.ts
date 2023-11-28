import { Chat } from "@prisma/client";

export class ChatResponse {
  id!: string;
  title?: string;
  model!: string;
  membershipId!: string;
  createdAt!: number;
  updatedAt!: number;
  deletedAt?: number;

  static fromEntity(e: Chat): ChatResponse {
    return {
      id: e.id,
      title: e.title ?? undefined,
      model: e.model,
      membershipId: e.membershipId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
      deletedAt: e.deletedAt?.getTime(),
    };
  }
}
