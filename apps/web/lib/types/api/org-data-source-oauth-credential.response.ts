import { DataSource, toDataSource } from "@repo/core";
import { OrgDataSourceOAuthCredential } from "@repo/database";

export class OrgDataSourceOAuthCredentialResponse {
  id!: string;
  dataSource!: DataSource;
  orgId!: string;
  createdAt!: number;
  updatedAt!: number;

  static fromEntity(e: OrgDataSourceOAuthCredential): OrgDataSourceOAuthCredentialResponse {
    return {
      id: e.id,
      dataSource: toDataSource(e.dataSource),
      orgId: e.orgId,
      createdAt: e.createdAt.getTime(),
      updatedAt: e.updatedAt.getTime(),
    };
  }
}
