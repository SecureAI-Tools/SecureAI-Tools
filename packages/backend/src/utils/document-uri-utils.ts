import { Id, IdType } from "@repo/core";

export function generateDocumentUri({
  orgId,
  dataSourceBaseUrl,
  guidInDataSource,
}: {
  orgId: Id<IdType.Organization>,
  dataSourceBaseUrl: string,
  // Globally unique id of the document in data source instance
  guidInDataSource: string,
}): string {
  return `${orgId.toString()}/${dataSourceBaseUrl}/${guidInDataSource}`;
}
