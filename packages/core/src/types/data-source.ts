export enum DataSource {
  UPLOAD = "UPLOAD",
  PAPERLESS_NGX = "PAPERLESS_NGX",
  GOOGLE_DRIVE = "GOOGLE_DRIVE"

  // Coming soon
  // NOTION = "NOTION",
  // and many more...
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
    default:
      return type;
  }
};

export const isConfigurableDataSource = (dataSource: DataSource): boolean => {
  return CONFIGURABLE_DATA_SOURCES.has(dataSource)
}

const CONFIGURABLE_DATA_SOURCES = new Set<DataSource>([
  DataSource.GOOGLE_DRIVE,
]);
