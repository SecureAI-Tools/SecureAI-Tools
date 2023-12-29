export interface DataSourceConnectionDocumentResponse {
  // Id in the DataSource
  externalId: string;
  // Name from DataSource
  name: string;
  // Created-at timestamp from DataSource
  createdAt: number;
  mimeType: string;

  // DataSource specific metadata
  metadata?: any;
}
