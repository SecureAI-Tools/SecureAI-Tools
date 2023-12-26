import { DocumentChunk, Prisma, TxPrismaClient, prismaClient } from "@repo/database";
import { Id, DocumentResponse, DocumentChunkResponse } from "@repo/core";

export interface DocumentChunkCreateInput {
  documentId: Id<DocumentResponse>;
  vectorDbId: string;
}

export class DocumentChunkService {
  async createMany(inputs: DocumentChunkCreateInput[]): Promise<Prisma.BatchPayload> {
    return await prismaClient.documentChunk.createMany({
      data: inputs.map(i => {
        return {
          id: Id.generate(DocumentChunkResponse).toString(),
          documentId: i.documentId.toString(),
          vectorDbId: i.vectorDbId,
        }
      })
    })
  }

  async getAll({
    where,
  }: {
    where: Prisma.DocumentChunkWhereInput;
  }): Promise<DocumentChunk[]> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.getAllWithTxn({
        prisma: tx,
        where,
      });
    });
  }

  async getAllWithTxn({
    prisma,
    where,
  }: {
    prisma: TxPrismaClient;
    where: Prisma.DocumentChunkWhereInput;
  }): Promise<DocumentChunk[]> {
    return await prisma.documentChunk.findMany({
      where: where,
    });
  }
}
