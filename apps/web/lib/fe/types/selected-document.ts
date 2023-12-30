import { DataSource, Id, IdType, MimeType } from "@repo/core";

// Selected document could either be a local file,  or a remote-file from a data-source
export interface SelectedDocument {
  dataSource: DataSource;

  name: string;

  mimeType: MimeType;

  // Present if dataSource is UPLOAD
  file?: File;

  // Present for a remote dataSource
  externalId?: string;

  dataSourceConnectionId?: Id<IdType.DataSourceConnection>;
}
