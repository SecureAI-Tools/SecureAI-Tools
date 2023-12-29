import { NextRequest, NextResponse } from "next/server";

import { NextResponseErrors, OAuthService } from "@repo/backend";

import { isAuthenticated } from "lib/api/core/auth";
import { DataSourcesResponse } from "lib/types/api/data-sources.response";
import { DataSource } from "@repo/core";

const oauthService = new OAuthService();

export async function GET(
  req: NextRequest,
) {
  const [authenticated, _] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  const dataSourceOAuthConfigs = oauthService.getConfigs();

  const response: DataSourcesResponse = {
    enabledDataSources: [
      DataSource.UPLOAD,
      DataSource.PAPERLESS_NGX,
      ...dataSourceOAuthConfigs.map(c => c.dataSource),
    ]
  }

  response.enabledDataSources.sort();

  return NextResponse.json(response);
}
