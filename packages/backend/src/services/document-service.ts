import { API } from "../utils/api.utils";

import { Document, Prisma, TxPrismaClient, prismaClient } from "@repo/database";
import { Id, DocumentResponse, DocumentIndexingStatus, DocumentCollectionResponse, DocumentToCollectionResponse, DataSourceConnectionResponse } from "@repo/core";

export interface DocumentCreateInput {
  id: Id<DocumentResponse>;
  name: string;
  mimeType: string;
  uri: string;
  externalId: string;
  indexingStatus: DocumentIndexingStatus;
  collectionId: Id<DocumentCollectionResponse>;
  connectionId: Id<DataSourceConnectionResponse>;
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
    const createdDocument = await prisma.document.create({
      data: {
        id: i.id.toString(),
        name: i.name,
        mimeType: i.mimeType,
        uri: i.uri,
        externalId: i.externalId,
      },
    });

    // Create corresponding DocumentToCollection
    await prisma.documentToCollection.create({
      data: {
        id: Id.generate(DocumentToCollectionResponse).toString(),
        documentId: createdDocument.id,
        collectionId: i.collectionId.toString(),
        indexingStatus: i.indexingStatus,
      },
    });

    // Create corresponding DocumentToDataSource
    await prisma.documentToDataSource.create({
      data: {
        id: Id.generate(DocumentToCollectionResponse).toString(),
        documentId: createdDocument.id,
        dataSourceId: i.connectionId.toString(),
      },
    });

    return createdDocument;
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

  async updateIndexingStatus({
    documentId,
    collectionId,
    indexingStatus,
  }: {
    documentId: Id<DocumentResponse>,
    collectionId: Id<DocumentCollectionResponse>,
    indexingStatus: DocumentIndexingStatus,
  }): Promise<void> {
    await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      await tx.documentToCollection.updateMany({
        where: {
          documentId: documentId.toString(),
          collectionId: collectionId.toString(),
        },
        data: {
          indexingStatus: indexingStatus,
        }
      });
    });
  }
}
