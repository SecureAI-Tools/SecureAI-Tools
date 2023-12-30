import { MimeType } from "./mime-type";

export interface DataSourceConnectionDocumentResponse {
  // Id in the DataSource
  externalId: string;
  // Name from DataSource
  name: string;
  // Created-at timestamp from DataSource
  createdAt: number;
  mimeType: MimeType;

  // DataSource specific metadata
  metadata?: any;
}
