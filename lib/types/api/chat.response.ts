import { Chat } from "@prisma/client";

export class ChatResponse {
  id!: string;
  title?: string;
  membershipId!: string;
  createdAt!: number;
  updatedAt!: number;
  deletedAt?: number;

  static fromEntity(e: Chat): ChatResponse {
    return {
      id: e.id,
      title: e.title ?? undefined,
      membershipId: e.membershipId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
      deletedAt: e.deletedAt?.getTime(),
    };
  }
}
