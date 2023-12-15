import {
  ChatMessage,
  Prisma,
  TxPrismaClient,
  prismaClient,
} from "@repo/database";
import { API } from "@repo/core";
import { Id } from "@repo/core";

import { ChatMessageResponse } from "lib/types/api/chat-message.response";
import { ChatMessageRole } from "lib/types/core/chat-message-role";


export interface ChatMessageCreateInput {
  content: string;
  role: ChatMessageRole;
  chatId: string;
}

export class ChatMessageService {
  async create(i: ChatMessageCreateInput): Promise<ChatMessage> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createWithTxn(tx, i);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    i: ChatMessageCreateInput,
  ): Promise<ChatMessage> {
    return await prisma.chatMessage.create({
      data: {
        id: Id.generate(ChatMessageResponse).toString(),
        role: i.role,
        content: i.content,
        chatId: i.chatId,
      },
    });
  }

  async getAll(
    where?: Prisma.ChatMessageWhereInput,
    orderBy?: Prisma.ChatMessageOrderByWithRelationInput,
    pagination?: API.PaginationParams,
  ): Promise<ChatMessage[]> {
    return await prismaClient.$transaction(
      async (prisma: TxPrismaClient): Promise<ChatMessage[]> => {
        return await this.getAllTxn(prisma, where, orderBy, pagination);
      },
    );
  }

  async getAllTxn(
    prisma: TxPrismaClient,
    where?: Prisma.ChatMessageWhereInput,
    orderBy?: Prisma.ChatMessageOrderByWithRelationInput,
    pagination?: API.PaginationParams,
  ): Promise<ChatMessage[]> {
    return await prisma.chatMessage.findMany({
      where: where,
      orderBy: orderBy,
      skip: pagination?.skip(),
      take: pagination?.take(),
    });
  }

  async count(where: Prisma.ChatMessageWhereInput): Promise<number> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.chatMessage.count({
        where: where,
      });
    });
  }
}
