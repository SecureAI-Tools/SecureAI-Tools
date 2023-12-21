import { DataSourceConnection } from "@repo/database";
import { DataSource, toDataSource } from "./data-source";

export class DataSourceConnectionResponse {
  id!: string;
  dataSource!: DataSource;
  baseUrl?: string;
  membershipId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: DataSourceConnection): DataSourceConnectionResponse {
    return {
      id: e.id,
      dataSource: toDataSource(e.dataSource),
      baseUrl: e.baseUrl ?? undefined,
      membershipId: e.membershipId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
