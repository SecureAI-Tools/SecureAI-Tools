import { ChatDocument, Prisma } from "@prisma/client";

import { TxPrismaClient } from "lib/api/core/db";
import { Id } from "lib/types/core/id";
import { ChatResponse } from "lib/types/api/chat.response";
import { prismaClient } from "lib/api/db";
import { ChatDocumentResponse } from "lib/types/api/chat-document.response";
import { API } from "lib/api/core/api.utils";

export interface ChatDocumentCreateInput {
  id: Id<ChatDocumentResponse>;
  mimeType: string;
  chatId: Id<ChatResponse>;
}

export class ChatDocumentService {
  async create(i: ChatDocumentCreateInput): Promise<ChatDocument> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createWithTxn(tx, i);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    i: ChatDocumentCreateInput,
  ): Promise<ChatDocument> {
    return await prisma.chatDocument.create({
      data: {
        id: i.id.toString(),
        mimeType: i.mimeType,
        chatId: i.chatId.toString(),
      },
    });
  }

  async get(id: Id<ChatDocumentResponse>): Promise<ChatDocument | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getWithTxn(tx, id);
    });
  }

  async getWithTxn(
    prisma: TxPrismaClient,
    id: Id<ChatDocumentResponse>,
  ): Promise<ChatDocument | null> {
    return await prisma.chatDocument.findFirst({
      where: {
        id: id.toString(),
      },
    });
  }

  async getAll(
    where?: Prisma.ChatDocumentWhereInput,
    orderBy?: Prisma.ChatDocumentOrderByWithRelationInput,
    pagination?: API.PaginationParams,
  ): Promise<ChatDocument[]> {
    return await prismaClient.$transaction(
      async (prisma: TxPrismaClient): Promise<ChatDocument[]> => {
        return await this.getAllTxn(prisma, where, orderBy);
      },
    );
  }

  async getAllTxn(
    prisma: TxPrismaClient,
    where?: Prisma.ChatDocumentWhereInput,
    orderBy?: Prisma.ChatDocumentOrderByWithRelationInput,
    pagination?: API.PaginationParams,
  ): Promise<ChatDocument[]> {
    return await prisma.chatDocument.findMany({
      where: where,
      orderBy: orderBy,
      skip: pagination?.skip(),
      take: pagination?.take(),
    });
  }

  async delete(id: Id<ChatDocumentResponse>): Promise<ChatDocument | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await tx.chatDocument.delete({
        where: {
          id: id.toString(),
        },
      });
    });
  }
}
