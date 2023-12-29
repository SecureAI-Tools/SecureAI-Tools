import { DataSource } from "@repo/core";

const OAUTH_SUPPORTED_DATA_SOURCES = new Set<DataSource>([
  DataSource.GOOGLE_DRIVE,
]);

export function isOAuthDataSource(dataSource: DataSource): boolean {
  return OAUTH_SUPPORTED_DATA_SOURCES.has(dataSource);
}
