import { Id, OrganizationResponse } from "@repo/core";

export function generateDocumentUri({
  orgId,
  dataSourceBaseUrl,
  guidInDataSource,
}: {
  orgId: Id<OrganizationResponse>,
  dataSourceBaseUrl: string,
  // Globally unique id of the document in data source instance
  guidInDataSource: string,
}): string {
  return `${orgId.toString()}/${dataSourceBaseUrl}/${guidInDataSource}`;
}
