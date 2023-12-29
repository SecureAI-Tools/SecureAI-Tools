import { DataSource } from "@repo/core";

export interface DataSourceOAuthConfig {
  dataSource: DataSource;
  clientId: string;
  clientSecret: string;
}
