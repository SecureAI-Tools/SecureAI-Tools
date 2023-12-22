export enum DataSource {
  UPLOAD = "UPLOAD",
  PAPERLESS_NGX = "PAPERLESS_NGX",

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
    default:
      return type;
  }
};
