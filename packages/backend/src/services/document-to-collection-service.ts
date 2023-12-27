import {
  DocumentToCollection,
  Prisma,
  TxPrismaClient,
  prismaClient,
} from "@repo/database";

export class DocumentToCollectionService {
  async getAll({
    where,
  }: {
    where: Prisma.DocumentToCollectionWhereInput;
  }): Promise<DocumentToCollection[]> {
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
    where: Prisma.DocumentToCollectionWhereInput;
  }): Promise<DocumentToCollection[]> {
    return await prisma.documentToCollection.findMany({
      where: where,
    });
  }

  async count(where: Prisma.DocumentToCollectionWhereInput): Promise<number> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.documentToCollection.count({
        where: where,
      });
    });
  }
}
