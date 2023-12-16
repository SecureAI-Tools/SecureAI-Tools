import {
  DocumentCollection,
  Prisma,
  TxPrismaClient,
  prismaClient,
} from "@repo/database";
import { customAlphabet } from "nanoid";

import { API } from "../utils/api.utils";
import { Id, OrganizationResponse, ModelType, DocumentCollectionResponse, UserResponse } from "@repo/core";

export interface DocumentCollectionCreateInput {
  name?: string;
  description?: string;
  ownerId: Id<UserResponse>;
  orgId: Id<OrganizationResponse>;
  model: string;
  modelType: ModelType;
}

export class DocumentCollectionService {
  async create(i: DocumentCollectionCreateInput): Promise<DocumentCollection> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createWithTxn(tx, i);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    i: DocumentCollectionCreateInput,
  ): Promise<DocumentCollection> {
    return prisma.documentCollection.create({
      data: {
        id: Id.generate(DocumentCollectionResponse).toString(),
        name: i.name,
        description: i.description,
        internalName: generateInternalName(),
        ownerId: i.ownerId.toString(),
        organizationId: i.orgId.toString(),
        model: i.model,
        modelType: i.modelType,
      },
    });
  }

  async get(
    id: Id<DocumentCollectionResponse>,
  ): Promise<DocumentCollection | null> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getWithTxn(tx, id);
    });
  }

  async getWithTxn(
    prisma: TxPrismaClient,
    id: Id<DocumentCollectionResponse>,
  ): Promise<DocumentCollection | null> {
    return await prisma.documentCollection.findFirst({
      where: {
        id: id.toString(),
      },
    });
  }

  async getAll(params: {
    where?: Prisma.DocumentCollectionWhereInput;
    orderBy?: Prisma.DocumentCollectionOrderByWithRelationInput;
    pagination?: API.PaginationParams;
  }): Promise<DocumentCollection[]> {
    return await prismaClient.$transaction(
      async (prisma: TxPrismaClient): Promise<DocumentCollection[]> => {
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
    where?: Prisma.DocumentCollectionWhereInput;
    orderBy?: Prisma.DocumentCollectionOrderByWithRelationInput;
    pagination?: API.PaginationParams;
  }): Promise<DocumentCollection[]> {
    return await prisma.documentCollection.findMany({
      where: where,
      orderBy: orderBy,
      skip: pagination?.skip(),
      take: pagination?.take(),
    });
  }

  async count(where: Prisma.DocumentCollectionWhereInput): Promise<number> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.documentCollection.count({
        where: where,
      });
    });
  }
}

// ChromaDB compatible alphabet
//
// Requirements:
//    (1) contains 3-63 characters,
//    (2) starts and ends with an alphanumeric character,
//    (3) otherwise contains only alphanumeric characters, underscores or hyphens (-),
//    (4) contains no two consecutive periods (..) and
//    (5) is not a valid IPv4 address
const customAlphabetNanoid = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  32,
);

// Generates a compatible internal name of a doc collection
const generateInternalName = (): string => {
  return customAlphabetNanoid();
};
