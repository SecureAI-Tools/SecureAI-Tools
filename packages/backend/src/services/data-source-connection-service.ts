import {
  DataSourceConnection,
  Prisma,
  TxPrismaClient,
  prismaClient,
} from "@repo/database";
import {
  Id,
  IdType,
  DataSource,
} from "@repo/core";

import { API } from "../utils/api.utils";

export interface DataSourceConnectionCreateInput {
  dataSource: DataSource;
  baseUrl: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
  membershipId: Id<IdType.OrgMembership>;
}

export class DataSourceConnectionService {
  async create(
    i: DataSourceConnectionCreateInput,
  ): Promise<DataSourceConnection> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      return await this.createWithTxn(tx, i);
    });
  }

  async createWithTxn(
    prisma: TxPrismaClient,
    i: DataSourceConnectionCreateInput,
  ): Promise<DataSourceConnection> {
    return prisma.dataSourceConnection.create({
      data: {
        id: Id.generate<IdType.DataSourceConnection>().toString(),
        dataSource: i.dataSource,
        baseUrl: i.baseUrl,
        accessToken: i.accessToken,
        accessTokenExpiresAt: i.accessTokenExpiresAt
          ? new Date(i.accessTokenExpiresAt)
          : undefined,
        membershipId: i.membershipId.toString(),
      },
    });
  }

  async getAll(params: {
    where?: Prisma.DataSourceConnectionWhereInput;
    orderBy?: Prisma.DataSourceConnectionOrderByWithRelationInput;
    pagination?: API.PaginationParams;
  }): Promise<DataSourceConnection[]> {
    return await prismaClient.$transaction(
      async (prisma: TxPrismaClient): Promise<DataSourceConnection[]> => {
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
    where?: Prisma.DataSourceConnectionWhereInput;
    orderBy?: Prisma.DataSourceConnectionOrderByWithRelationInput;
    pagination?: API.PaginationParams;
  }): Promise<DataSourceConnection[]> {
    return await prisma.dataSourceConnection.findMany({
      where: {
        ...where,
      },
      orderBy: orderBy,
      skip: pagination?.skip(),
      take: pagination?.take(),
    });
  }

  async count(where: Prisma.DataSourceConnectionWhereInput): Promise<number> {
    return await prismaClient.$transaction(async (prisma: TxPrismaClient) => {
      return await prisma.dataSourceConnection.count({
        where: {
          ...where,
        },
      });
    });
  }

  async get(id: Id<IdType.DataSourceConnection>): Promise<DataSourceConnection | null> {
    return await prismaClient.$transaction(
      async (prisma: TxPrismaClient): Promise<DataSourceConnection | null> => {
        return await prisma.dataSourceConnection.findUnique({
          where: {
            id: id.toString(),
          }
        })
      });
  }

  async getOrCreate(
    userId: Id<IdType.User>,
    orgId: Id<IdType.Organization>,
    dataSource: DataSource,
  ): Promise<DataSourceConnection> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      const memberships = await tx.orgMembership.findMany({
        where: {
          userId: userId.toString(),
          orgId: orgId.toString(),
        },
      });
      if (memberships.length !== 1) {
        throw new Error(
          `found ${memberships.length} memberships for userId=${userId} orgId=${orgId}`,
        );
      }
      const membership = memberships[0]!;

      const connections = await tx.dataSourceConnection.findMany({
        where: {
          membershipId: membership.id,
          dataSource: dataSource,
        },
      });

      if (connections.length > 1) {
        throw new Error(
          `found multiple connections for membershipId=${membership.id} dataSource=${dataSource}`,
        );
      }

      if (connections.length === 1) {
        return connections[0]!;
      }

      // Create a new one
      return await tx.dataSourceConnection.create({
        data: {
          id: Id.generate<IdType.DataSourceConnection>().toString(),
          dataSource: dataSource,
          membershipId: membership.id,
        },
      });
    });
  }
}
