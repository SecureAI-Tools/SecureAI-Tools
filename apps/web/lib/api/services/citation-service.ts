import { Citation, Prisma, TxPrismaClient, prismaClient } from "@repo/database";
import { API } from "@repo/backend";
import { Id, IdType } from "@repo/core";

export interface CitationCreateInput {
  documentChunkId: string;
  score: number;
  chatMessageId: Id<IdType.ChatMessage>;
  documentId: Id<IdType.Document>;
}

export class CitationService {
  async create(i: CitationCreateInput): Promise<Citation> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createWithTxn(tx, i);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    i: CitationCreateInput,
  ): Promise<Citation> {
    return await prisma.citation.create({
      data: {
        id: Id.generate<IdType.ChatMessage>().toString(),
        documentChunkId: i.documentChunkId,
        score: i.score,
        chatMessageId: i.chatMessageId.toString(),
        documentId: i.documentId.toString(),
      },
    });
  }

  async getAll(params: {
    where?: Prisma.CitationWhereInput;
    orderBy?: Prisma.CitationOrderByWithRelationInput;
    pagination?: API.PaginationParams;
  }): Promise<Citation[]> {
    return await prismaClient.$transaction(
      async (prisma: TxPrismaClient): Promise<Citation[]> => {
        return await this.getAllTxn({
          prisma,
          ...params,
        });
      },
    );
  }

  async getAllTxn({
    prisma,
    where,
    orderBy,
    pagination,
  }: {
    prisma: TxPrismaClient;
    where?: Prisma.CitationWhereInput;
    orderBy?: Prisma.CitationOrderByWithRelationInput;
    pagination?: API.PaginationParams;
  }): Promise<Citation[]> {
    return await prisma.citation.findMany({
      where: where,
      orderBy: orderBy,
      skip: pagination?.skip(),
      take: pagination?.take(),
    });
  }
}
