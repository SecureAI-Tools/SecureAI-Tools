import { DataSource, Id, IdType } from "@repo/core";
import {
  OrgDataSourceOAuthCredential,
  Prisma,
  TxPrismaClient,
  prismaClient,
} from "@repo/database";

export interface OrgDataSourceOAuthCredentialCreateInput {
  clientId: string;
  clientSecret: string;
  raw: any;
  dataSource: DataSource;
  orgId: Id<IdType.Organization>;
}

export class OrgDataSourceOAuthCredentialService {
  async create(i: OrgDataSourceOAuthCredentialCreateInput): Promise<OrgDataSourceOAuthCredential> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createWithTxn(tx, i);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    i: OrgDataSourceOAuthCredentialCreateInput,
  ): Promise<OrgDataSourceOAuthCredential> {
    return prisma.orgDataSourceOAuthCredential.create({
      data: {
        id: Id.generate<IdType.OrgDataSourceOAuthCredential>().toString(),
        clientId: i.clientId,
        clientSecret: i.clientSecret,
        raw: i.raw,
        dataSource: i.dataSource,
        orgId: i.orgId.toString(),
      },
    });
  }


  async getAll({
    where,
  }: {
    where: Prisma.OrgDataSourceOAuthCredentialWhereInput;
  }): Promise<OrgDataSourceOAuthCredential[]> {
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
    where: Prisma.OrgDataSourceOAuthCredentialWhereInput;
  }): Promise<OrgDataSourceOAuthCredential[]> {
    return await prisma.orgDataSourceOAuthCredential.findMany({
      where: where,
    });
  }
}
