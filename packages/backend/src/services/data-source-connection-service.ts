import { DataSourceConnection, TxPrismaClient, prismaClient } from "@repo/database";
import { Id, DataSourceConnectionResponse, UserResponse, OrganizationResponse, DataSource } from "@repo/core";

export class DataSourceConnectionService {
  async getOrCreate(
    userId: Id<UserResponse>,
    orgId: Id<OrganizationResponse>,
    dataSource: DataSource,
  ): Promise<DataSourceConnection> {
    return await prismaClient.$transaction(async (tx: TxPrismaClient) => {
      const memberships = await tx.orgMembership.findMany({
        where: {
          userId: userId.toString(),
          orgId: orgId.toString(),
        }
      });
      if (memberships.length !== 1) {
        throw new Error(`found ${memberships.length} memberships for userId=${userId} orgId=${orgId}`);
      }
      const membership = memberships[0]!;

      const connections = await tx.dataSourceConnection.findMany({
        where: {
          membershipId: membership.id,
          dataSource: dataSource,
        }
      });

      if (connections.length > 1) {
        throw new Error(`found multiple connections for membershipId=${membership.id} dataSource=${dataSource}`);
      }

      if (connections.length === 1) {
        return connections[0]!;
      }

      // Create a new one
      return await tx.dataSourceConnection.create({
        data: {
          id: Id.generate(DataSourceConnectionResponse).toString(),
          dataSource: dataSource,
          membershipId: membership.id,
        }
      });
    });
  }
}
