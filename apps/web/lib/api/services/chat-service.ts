import {
  Chat,
  Organization,
  Prisma,
  TxPrismaClient,
  prismaClient,
} from "@repo/database";

import { Id } from "lib/types/core/id";
import { ChatResponse } from "lib/types/api/chat.response";
import { API } from "lib/api/core/api.utils";
import { UserResponse } from "lib/types/api/user.response";
import { ChatType } from "lib/types/core/chat-type";

export interface ChatCreateInput {
  title: string | undefined;
  type: ChatType;
  orgIdOrSlug: string;
  creatorId: Id<UserResponse>;
  documentCollectionId?: string | undefined;
}

export class ChatService {
  async create(i: ChatCreateInput): Promise<Chat> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createWithTxn(tx, i);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    i: ChatCreateInput,
  ): Promise<Chat> {
    const orgMembership = await prisma.orgMembership.findFirst({
      where: {
        OR: [{ orgId: i.orgIdOrSlug }, { org: { slug: i.orgIdOrSlug } }],
        userId: i.creatorId.toString(),
      },
      include: {
        org: true,
      },
    });

    if (!orgMembership) {
      throw new Error("invalid orgIdOrSlug!");
    }

    return await prisma.chat.create({
      data: {
        id: Id.generate(ChatResponse).toString(),
        title: i.title,
        type: i.type,
        membershipId: orgMembership.id,
        // TODO: This assumes that users of an org can only use one model. Change this when allowing
        // end-users to choose model at the time of chat-creation.
        model: orgMembership.org.defaultModel,
        modelType: orgMembership.org.defaultModelType,
        documentCollectionId: i.documentCollectionId,
      },
    });
  }

  async get(id: Id<ChatResponse>): Promise<Chat | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getWithTxn(tx, id);
    });
  }

  async getWithTxn(
    prisma: TxPrismaClient,
    id: Id<ChatResponse>,
  ): Promise<Chat | null> {
    return await prisma.chat.findFirst({
      where: {
        id: id.toString(),
      },
    });
  }

  async getAll(
    where?: Prisma.ChatWhereInput,
    orderBy?: Prisma.ChatOrderByWithRelationInput,
    pagination?: API.PaginationParams,
  ): Promise<Chat[]> {
    return await prismaClient.$transaction(
      async (prisma: TxPrismaClient): Promise<Chat[]> => {
        return await this.getAllTxn(prisma, where, orderBy, pagination);
      },
    );
  }

  async getAllTxn(
    prisma: TxPrismaClient,
    where?: Prisma.ChatWhereInput,
    orderBy?: Prisma.ChatOrderByWithRelationInput,
    pagination?: API.PaginationParams,
  ): Promise<Chat[]> {
    return await prisma.chat.findMany({
      where: {
        deletedAt: null,
        ...where,
      },
      orderBy: orderBy,
      skip: pagination?.skip(),
      take: pagination?.take(),
    });
  }

  async count(where: Prisma.ChatWhereInput): Promise<number> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.chat.count({
        where: {
          deletedAt: null,
          ...where,
        },
      });
    });
  }

  async update(id: Id<ChatResponse>, i: Prisma.ChatUpdateInput): Promise<Chat> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.updateWithTxn(tx, id, i);
    });
  }

  async updateWithTxn(
    prisma: TxPrismaClient,
    id: Id<ChatResponse>,
    i: Prisma.ChatUpdateInput,
  ): Promise<Chat> {
    return await prisma.chat.update({
      where: {
        id: id.toString(),
      },
      data: i,
    });
  }

  async getOrganization(id: Id<ChatResponse>): Promise<Organization | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      const chatWithOrg = await tx.chat.findUnique({
        where: {
          id: id.toString(),
        },
        include: {
          membership: {
            include: {
              org: true,
            },
          },
        },
      });

      return chatWithOrg?.membership?.org ?? null;
    });
  }

  async delete(id: Id<ChatResponse>): Promise<Chat | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await tx.chat.delete({
        where: {
          id: id.toString(),
        },
      });
    });
  }

  async deleteMany(ids: Id<ChatResponse>[]): Promise<Prisma.BatchPayload> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await tx.chat.deleteMany({
        where: {
          id: {
            in: ids.map((id) => id.toString()),
          },
        },
      });
    });
  }
}
