export enum DataSource {
  UPLOAD = "UPLOAD",
  PAPERLESS_NGX = "PAPERLESS_NGX",
  GOOGLE_DRIVE = "GOOGLE_DRIVE",
  NOTION = "NOTION",
}

export const toDataSource = (s: string): DataSource =>
  DataSource[s as keyof typeof DataSource];

export const dataSourceToReadableName = (type: DataSource): string => {
  switch (type) {
    case DataSource.PAPERLESS_NGX:
      return "Paperless-ngx";
    case DataSource.UPLOAD:
      return "Upload";
    case DataSource.GOOGLE_DRIVE:
      return "Google Drive";
    case DataSource.NOTION:
      return "Notion";
    default:
      return type;
  }
};

export const isOrgAdminConfigurableDataSource = (dataSource: DataSource): boolean => {
  return ORG_ADMIN_CONFIGURABLE_DATA_SOURCES.has(dataSource)
}

export function isOAuthDataSource(dataSource: DataSource): boolean {
  return OAUTH_SUPPORTED_DATA_SOURCES.has(dataSource);
}

const ORG_ADMIN_CONFIGURABLE_DATA_SOURCES = new Set<DataSource>([
  DataSource.GOOGLE_DRIVE,
]);

const OAUTH_SUPPORTED_DATA_SOURCES = new Set<DataSource>([
  DataSource.GOOGLE_DRIVE,
  DataSource.NOTION,
]);
