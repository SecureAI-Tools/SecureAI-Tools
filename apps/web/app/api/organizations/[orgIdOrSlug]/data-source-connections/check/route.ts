import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

import { isAuthenticated } from "lib/api/core/auth";
import { OrgMembershipService } from "lib/api/services/org-membership-service";
import { OrganizationService } from "lib/api/services/organization-service";
import { DocumentCollectionCreateRequest } from "lib/types/api/document-collection-create.request";

import {
  removeTrailingSlash,
  Id,
  toModelType,
  ModelType,
  DocumentCollectionResponse,
  DataSource,
  dataSourceToReadableName,
} from "@repo/core";
import {
  DocumentCollectionService,
  NextResponseErrors,
  API,
  PaperlessNgxClient,
} from "@repo/backend";
import { DataSourceConnectionCheckRequest } from "lib/types/api/data-source-connection-check.request";
import { DataSourceConnectionCheckResponse } from "lib/types/api/data-source-connection-check.response";

const orgMembershipService = new OrgMembershipService();
const orgService = new OrganizationService();
const documentCollectionService = new DocumentCollectionService();
const chromaClient = new ChromaClient({
  path: removeTrailingSlash(process.env.VECTOR_DB_SERVER!),
});

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
  const resp = await client.getDocuments();
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
}
