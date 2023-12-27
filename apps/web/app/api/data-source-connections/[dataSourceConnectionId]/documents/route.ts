import { NextRequest, NextResponse } from "next/server";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { getWebLogger } from "lib/api/core/logger";

import {
  NextResponseErrors,
  API,
  DataSourceConnectionService,
  PaperlessNgxClient,
  toDataSourceConnectionDocumentResponse,
} from "@repo/backend";
import { DataSource, Id, IdType } from "@repo/core";

const permissionService = new PermissionService();
const dataSourceConnectionService = new DataSourceConnectionService();
const logger = getWebLogger();

export async function GET(
  req: NextRequest,
  { params }: { params: { dataSourceConnectionId: string } },
) {
  const [authenticated, authUserId] = await isAuthenticated(req);
  if (!authenticated) {
    return NextResponseErrors.unauthorized();
  }

  if (params.dataSourceConnectionId.length < 1) {
    return NextResponseErrors.badRequest();
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  // Check permissions
  const dataSourceConnectionId = Id.from<IdType.DataSourceConnection>(
    params.dataSourceConnectionId,
  );
  const [hasPermissions, resp] =
    await permissionService.hasReadDocumentsFromDataSourceConnectionPermission(
      authUserId!,
      dataSourceConnectionId,
    );
  if (!hasPermissions) {
    return resp;
  }

  const dataSourceConnection = await dataSourceConnectionService.get(
    dataSourceConnectionId,
  );
  if (!dataSourceConnection) {
    return NextResponseErrors.notFound();
  }

  // TODO: Make this more dynamic when adding support for more data sources!
  if (dataSourceConnection.dataSource !== DataSource.PAPERLESS_NGX) {
    return NextResponseErrors.badRequest(
      `${dataSourceConnection.dataSource} data sources aren't supported`,
    );
  }

  const paginationParams = API.PaginationParams.from(searchParams);
  const paperlessNgxClient = new PaperlessNgxClient(
    dataSourceConnection.baseUrl!,
    dataSourceConnection.accessToken!,
  );
  try {
    const documentsSearchResponse = await paperlessNgxClient.getDocuments({
      query: query ?? undefined,
      page: paginationParams.page,
      pageSize: paginationParams.pageSize,
    });

    if (!documentsSearchResponse.ok) {
      return NextResponseErrors.internalServerError(
        `could not search documents from ${dataSourceConnection.dataSource} at ${dataSourceConnection.baseUrl}. Received "${documentsSearchResponse.statusText}" (${documentsSearchResponse.status})`,
      );
    }

    return NextResponse.json(
      documentsSearchResponse.data!.results.map((r) =>
        toDataSourceConnectionDocumentResponse(r),
      ),
      {
        headers: API.createResponseHeaders({
          pagination: {
            totalCount: documentsSearchResponse.data!.count,
          },
        }),
      },
    );
  } catch (error) {
    logger.error(
      `could not fetch documents from ${dataSourceConnection.dataSource}`,
      {
        error: error,
        dataSourceConnectionId: dataSourceConnection.id,
      },
    );
    return NextResponseErrors.internalServerError(
      `could not get documents from ${dataSourceConnection.dataSource}`,
    );
  }
}
