import { NextRequest, NextResponse } from "next/server";

import { isEmpty, toDataSource, OAuthAuthorizeUrlResponse, Id } from "@repo/core";
import { NextResponseErrors, OAuthService } from "@repo/backend";

import { isAuthenticated } from "lib/api/core/auth";
import { isOAuthDataSource } from "lib/api/core/data-source.utils";
import { OrganizationService } from "lib/api/services/organization-service";

const oauthService = new OAuthService();
const orgService = new OrganizationService();

export async function GET(
  req: NextRequest,
  { params }: { params: { dataSource: string, orgIdOrSlug: string, } },
) {
  // Return 404 if dataSource is not a valid data source!
  const dataSource = toDataSource(params.dataSource.toUpperCase());
  if (!isOAuthDataSource(dataSource)) {
    return NextResponseErrors.notFound();
  }

  const [authenticated, _] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  const org = await orgService.get(params.orgIdOrSlug);
  if (!org) {
    return NextResponseErrors.notFound();
  }

  const { searchParams } = new URL(req.url);
  const redirectUri = searchParams.get("redirectUri");
  const scopes = searchParams.getAll("scope").filter(s => !isEmpty(s));
  if (isEmpty(redirectUri) || scopes.length < 1) {
    return NextResponseErrors.badRequest("redirectUri and scope are required");
  }

  const resp: OAuthAuthorizeUrlResponse = {
    authorizeUrl: await oauthService.getAuthorizeUrl({
      dataSource: dataSource,
      redirectUri: redirectUri!,
      scopes: scopes,
      orgId: Id.from(org.id),
    }),
  }
  return NextResponse.json(resp);
}
