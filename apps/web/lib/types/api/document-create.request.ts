import { MimeType } from "@repo/core";
import { IndexingMode } from "../core/indexing-mode";

export class DocumentCreateRequest {
  name!: string;
  externalId!: string;
  dataSourceConnectionId!: string;
  indexingMode!: IndexingMode;
  mimeType!: MimeType;
}
