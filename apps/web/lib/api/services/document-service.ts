import { Document, Prisma, TxPrismaClient, prismaClient } from "@repo/database";

import { Id } from "lib/types/core/id";
import { DocumentResponse } from "lib/types/api/document.response";
import { API } from "lib/api/core/api.utils";
import { DocumentIndexingStatus } from "lib/types/core/document-indexing-status";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";

export interface DocumentCreateInput {
  id: Id<DocumentResponse>;
  name: string;
  indexingStatus: DocumentIndexingStatus;
  mimeType: string;
  collectionId: Id<DocumentCollectionResponse>;
  objectKey: string;
}

export class DocumentService {
  async create(i: DocumentCreateInput): Promise<Document> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createWithTxn(tx, i);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    i: DocumentCreateInput,
  ): Promise<Document> {
    return await prisma.document.create({
      data: {
        id: i.id.toString(),
        name: i.name,
        mimeType: i.mimeType,
        indexingStatus: i.indexingStatus,
        collectionId: i.collectionId.toString(),
        objectKey: i.objectKey,
      },
    });
  }

  async get(id: Id<DocumentResponse>): Promise<Document | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getWithTxn(tx, id);
    });
  }

  async getWithTxn(
    prisma: TxPrismaClient,
    id: Id<DocumentResponse>,
  ): Promise<Document | null> {
    return await prisma.document.findFirst({
      where: {
        id: id.toString(),
      },
    });
  }

  async getAll({
    where,
    orderBy,
    pagination,
  }: {
    where: Prisma.DocumentWhereInput;
    orderBy?:
      | Prisma.DocumentOrderByWithRelationInput
      | Prisma.DocumentOrderByWithRelationInput[];
    pagination?: API.PaginationParams;
  }): Promise<Document[]> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getAllWithTxn({
        prisma: tx,
        where,
        orderBy,
        pagination,
      });
    });
  }

  async getAllWithTxn({
    prisma,
    where,
    orderBy,
    pagination,
  }: {
    prisma: TxPrismaClient;
    where: Prisma.DocumentWhereInput;
    orderBy?:
      | Prisma.DocumentOrderByWithRelationInput
      | Prisma.DocumentOrderByWithRelationInput[];
    pagination?: API.PaginationParams;
  }): Promise<Document[]> {
    return await prisma.document.findMany({
      where: where,
      orderBy: orderBy,
      skip: pagination?.skip(),
      take: pagination?.take(),
    });
  }

  async count(where: Prisma.DocumentWhereInput): Promise<number> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.document.count({
        where: where,
      });
    });
  }

  async delete(id: Id<DocumentResponse>): Promise<Document | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await tx.document.delete({
        where: {
          id: id.toString(),
        },
      });
    });
  }

  async update(
    id: Id<DocumentResponse>,
    data: Pick<
      Prisma.DocumentUpdateInput,
      "name" | "indexingStatus" | "mimeType" | "objectKey"
    >,
  ): Promise<Document | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await tx.document.update({
        where: {
          id: id.toString(),
        },
        data: data,
      });
    });
  }
}
