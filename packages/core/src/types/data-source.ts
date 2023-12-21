export enum DataSource {
  UPLOAD = "UPLOAD",

  // Coming soon
  // PAPERLESS_NGX = "PAPERLESS_NGX",
  // NOTION = "NOTION",
  // and many more...
}

export const toDataSource = (s: string): DataSource =>
  DataSource[s as keyof typeof DataSource];
