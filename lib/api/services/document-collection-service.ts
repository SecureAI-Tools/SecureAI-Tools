import { DocumentCollection } from "@prisma/client";
import { customAlphabet } from "nanoid";

import { TxPrismaClient } from "lib/api/core/db";
import { Id } from "lib/types/core/id";
import { prismaClient } from "lib/api/db";
import { UserResponse } from "lib/types/api/user.response";
import { OrganizationResponse } from "lib/types/api/organization.response";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";

export interface DocumentCollectionCreateInput {
  name?: string;
  ownerId: Id<UserResponse>;
  orgId: Id<OrganizationResponse>;
  model: string;
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
        internalName: generateInternalName(),
        ownerId: i.ownerId.toString(),
        organizationId: i.orgId.toString(),
        model: i.model,
      }
    });
  }

  async get(id: Id<DocumentCollectionResponse>): Promise<DocumentCollection | null> {
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
}

// ChromaDB compatible alphabet
//
// Requirements:
//    (1) contains 3-63 characters,
//    (2) starts and ends with an alphanumeric character,
//    (3) otherwise contains only alphanumeric characters, underscores or hyphens (-),
//    (4) contains no two consecutive periods (..) and
//    (5) is not a valid IPv4 address
const customAlphabetNanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 32);

// Generates a compatible internal name of a doc collection
const generateInternalName = (): string => {
  return customAlphabetNanoid();
}
