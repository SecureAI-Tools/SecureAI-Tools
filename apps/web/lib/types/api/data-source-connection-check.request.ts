import { DataSource } from "@repo/core";

export class DataSourceConnectionCheckRequest {
  baseUrl!: string;
  token!: string;
  dataSource!: DataSource;
}
