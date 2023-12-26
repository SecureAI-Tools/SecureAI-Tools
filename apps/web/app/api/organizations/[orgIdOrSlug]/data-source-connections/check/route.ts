import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { OrganizationService } from "lib/api/services/organization-service";
import { getWebLogger } from "lib/api/core/logger";

import {
  DataSource,
  dataSourceToReadableName,
} from "@repo/core";
import {
  NextResponseErrors,
  PaperlessNgxClient,
} from "@repo/backend";
import { DataSourceConnectionCheckRequest } from "lib/types/api/data-source-connection-check.request";
import { DataSourceConnectionCheckResponse } from "lib/types/api/data-source-connection-check.response";

const orgMembershipService = new OrgMembershipService();
const orgService = new OrganizationService();
const logger = getWebLogger();

export async function POST(
  req: NextRequest,
  { params }: { params: { orgIdOrSlug: string } },
) {
  const [authenticated, userId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.orgIdOrSlug.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const org = await orgService.get(params.orgIdOrSlug);
  if (!org) {
    return NextResponseErrors.notFound();
  }

  const hasPermissions = await orgMembershipService.isActiveMember(
    userId!,
    params.orgIdOrSlug,
  );
  if (!hasPermissions) {
    return NextResponseErrors.forbidden();
  }

  const dataSourceConnectionCheckRequest =
    (await req.json()) as DataSourceConnectionCheckRequest;
  const { dataSource, baseUrl, token } = dataSourceConnectionCheckRequest;
  if (dataSource !== DataSource.PAPERLESS_NGX) {
    return NextResponseErrors.badRequest(`${dataSource} can't be checked`);
  }

  // TODO: Add switch case when we have more data sources that can be checked!

  const client = new PaperlessNgxClient(baseUrl, token);
  try {
    const resp = await client.getDocuments({});
    if (!resp.ok) {
      const response: DataSourceConnectionCheckResponse = {
        ok: false,
        status: resp.status,
        error: resp.statusText,
      };
      return NextResponse.json(response);
    }

    if (resp.data!.count == 0) {
      const response: DataSourceConnectionCheckResponse = {
        ok: false,
        status: resp.status,
        error: `Did not receive any documents from ${dataSourceToReadableName(
          dataSource,
        )}. Make sure that the user of API auth token has access to documents.`,
      };
      return NextResponse.json(response);
    }

    const response: DataSourceConnectionCheckResponse = {
      ok: true,
      status: resp.status,
    };
    return NextResponse.json(response);
  } catch (error) {
    logger.error(`could not fetch documents from ${dataSource} @ ${baseUrl}`, {
      error: error,
      dataSource: dataSource,
      baseUrl: baseUrl,
    });
    return NextResponseErrors.internalServerError(`could not get documents from ${dataSource} @ ${baseUrl}`);
  }
}
