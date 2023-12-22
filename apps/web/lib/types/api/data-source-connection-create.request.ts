import { DataSource } from "@repo/core";

export class DataSourceConnectionCreateRequest {
  dataSource!: DataSource;
  baseUrl!: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
}
