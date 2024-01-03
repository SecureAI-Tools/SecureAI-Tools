import { NextRequest, NextResponse } from "next/server";

import { NextResponseErrors, OrgDataSourceOAuthCredentialService } from "@repo/backend";
import { DataSource, toDataSource } from "@repo/core";

import { isAuthenticated } from "lib/api/core/auth";
import { DataSourcesResponse } from "lib/types/api/data-sources.response";
import { OrgMembershipService } from "lib/api/services/org-membership-service";

const orgMembershipService = new OrgMembershipService();
const orgDataSourceOAuthCredentialService = new OrgDataSourceOAuthCredentialService();

// Data sources that don't need any configs at instance or org level.
const PRE_CONFIGURED_DATA_SOURCES = [
  DataSource.UPLOAD,
  DataSource.PAPERLESS_NGX,
];

export async function GET(
  req: NextRequest,
  { params }: { params: { orgIdOrSlug: string } },
) {
  const [authenticated, authUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.orgIdOrSlug.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const hasPermissions = await orgMembershipService.isActiveMember(
    authUserId!,
    params.orgIdOrSlug,
  );
  if (!hasPermissions) {
    return NextResponseErrors.forbidden();
  }

  const creds = await orgDataSourceOAuthCredentialService.getAll({
    where: {
      org: {
        OR: [{ id: params.orgIdOrSlug }, { slug: params.orgIdOrSlug }],
      }
    }
  });
  const configuredDataSources = Array.from(new Set(creds.map(c => toDataSource(c.dataSource))));

  const response: DataSourcesResponse = {
    configuredDataSources: [
      ...PRE_CONFIGURED_DATA_SOURCES,
      ...configuredDataSources,
    ]
  }

  response.configuredDataSources.sort();

  return NextResponse.json(response);
}
