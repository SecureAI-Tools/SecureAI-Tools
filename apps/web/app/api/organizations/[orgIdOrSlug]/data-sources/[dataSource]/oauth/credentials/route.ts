import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { OrganizationService } from "lib/api/services/organization-service";
import { OrgDataSourceOAuthCredentialCreateRequest } from "lib/types/api/org-data-source-oauth-credential-create.request";
import { OrgDataSourceOAuthCredentialResponse } from "lib/types/api/org-data-source-oauth-credential.response";

import {
  Id,
  toDataSource,
  isOrgAdminConfigurableDataSource,
} from "@repo/core";
import {
  NextResponseErrors,
  OrgDataSourceOAuthCredentialService,
} from "@repo/backend";

const orgMembershipService = new OrgMembershipService();
const orgService = new OrganizationService();
const orgDataSourceOAuthCredentialService = new OrgDataSourceOAuthCredentialService();

export async function POST(
  req: NextRequest,
  { params }: { params: { orgIdOrSlug: string, dataSource: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.orgIdOrSlug.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const dataSource = toDataSource(params.dataSource.toUpperCase());

  if (!isOrgAdminConfigurableDataSource(dataSource)) {
    return NextResponseErrors.badRequest(`${dataSource} can not be configured`);
  }

  const org = await orgService.get(params.orgIdOrSlug);
  if (!org) {
    return NextResponseErrors.notFound();
  }

  const hasPermissions = await orgMembershipService.hasAdminPermission(
    userId!,
    org.id,
  );
  if (!hasPermissions) {
    return NextResponseErrors.forbidden();
  }

  const createRequest =
    (await req.json()) as OrgDataSourceOAuthCredentialCreateRequest;

  const credential = await orgDataSourceOAuthCredentialService.create({
    clientId: createRequest.clientId,
    clientSecret: createRequest.clientSecret,
    raw: createRequest.raw,
    orgId: Id.from(org.id),
    dataSource: dataSource,
  });

  return NextResponse.json(OrgDataSourceOAuthCredentialResponse.fromEntity(credential));
}
