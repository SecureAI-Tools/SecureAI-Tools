import { NextRequest, NextResponse } from "next/server";
import { Client as NotionClient } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { isAuthenticated } from "lib/api/core/auth";
import { PermissionService } from "lib/api/services/permission-service";
import { getWebLogger } from "lib/api/core/logger";

import {
  NextResponseErrors,
  API,
  DataSourceConnectionService,
  PaperlessNgxClient,
  toDataSourceConnectionDocumentResponse,
  GoogleDriveClient,
} from "@repo/backend";
import { DataSource, DataSourceConnectionDocumentResponse, Id, IdType, MimeType, toMimeType } from "@repo/core";
import { DataSourceConnection } from "@repo/database";

const permissionService = new PermissionService();
const dataSourceConnectionService = new DataSourceConnectionService();
const logger = getWebLogger();

const QUERY_PARAM = "query";

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
  try {
    const updatedDataSourceConnection = await dataSourceConnectionService.refreshAccessTokenIfExpired(dataSourceConnection);

    return await getDocuments(updatedDataSourceConnection, searchParams);
  } catch (error) {
    console.log("error = ", error);
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

async function getDocuments(
  dataSourceConnection: DataSourceConnection,
  searchParams: URLSearchParams,
): Promise<Response> {
  switch (dataSourceConnection.dataSource) {
    case DataSource.PAPERLESS_NGX:
      return await getDocumentsFromPaperlessNgx(dataSourceConnection, searchParams);
    case DataSource.GOOGLE_DRIVE:
      return await getDocumentsFromGoogleDrive(dataSourceConnection, searchParams);
    case DataSource.NOTION:
      return await getDocumentsFromNotion(dataSourceConnection, searchParams);
    default:
      return NextResponseErrors.badRequest(
        `${dataSourceConnection.dataSource} data source is not supported`,
      );
  }
}

async function getDocumentsFromPaperlessNgx(
  dataSourceConnection: DataSourceConnection,
  searchParams: URLSearchParams,
): Promise<Response> {
  const query = searchParams.get(QUERY_PARAM);
  const paginationParams = API.PaginationParams.from(searchParams);
  const paperlessNgxClient = new PaperlessNgxClient(
    dataSourceConnection.baseUrl!,
    dataSourceConnection.accessToken!,
  );
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
}

async function getDocumentsFromGoogleDrive(
  dataSourceConnection: DataSourceConnection,
  searchParams: URLSearchParams,
): Promise<Response> {
  const query = searchParams.get(QUERY_PARAM);
  const paginationParams = API.PaginationParams.from(searchParams);
  const googleDriveClient = new GoogleDriveClient(dataSourceConnection.accessToken!);

  // Reference: https://developers.google.com/drive/api/guides/search-files#examples
  const nameQuery = query ? `name contains '${query}' and` : "";
  const queryWithMimeFilter = `${nameQuery} (mimeType = '${MimeType.PDF}' or mimeType = '${MimeType.GOOGLE_DOC}')`;
  const documentsSearchResponse = await googleDriveClient.getDocuments({
    query: queryWithMimeFilter,
    pageSize: paginationParams.pageSize,
    fields: "files(id,createdTime,mimeType,name),nextPageToken",
  });

  if (!documentsSearchResponse.ok) {
    return NextResponseErrors.internalServerError(
      `could not search documents from ${dataSourceConnection.dataSource} at ${dataSourceConnection.baseUrl}. Received "${documentsSearchResponse.statusText}" (${documentsSearchResponse.status})`,
    );
  }

  return NextResponse.json(
    documentsSearchResponse.data!.files?.map((f): DataSourceConnectionDocumentResponse => {
      return {
        externalId: f.id!,
        name: f.name!,
        createdAt: Date.parse(f.createdTime!),
        mimeType: toMimeType(f.mimeType!),
        metadata: {
          ...f,
        }
      }
    })
  );
}

async function getDocumentsFromNotion(
  dataSourceConnection: DataSourceConnection,
  searchParams: URLSearchParams,
): Promise<Response> {
  const query = searchParams.get(QUERY_PARAM);
  const paginationParams = API.PaginationParams.from(searchParams);
  const notionClient = new NotionClient({
    auth: dataSourceConnection.accessToken!,
  })

  const resp = await notionClient.search({
    query: query ?? undefined,
    page_size: paginationParams.pageSize,
    filter: {
      property: "object",
      value: "page",
    }
  });

  // TODO: Make sure this doesn't miss any non-database children pages 
  // Filter out all pages without a title!
  const results = resp.results.filter((x) => {
    const r = x as PageObjectResponse;

    const titleObject = r.properties.title as any;
    const title = titleObject?.title[0]?.plain_text;

    return title !== undefined;
  });

  return NextResponse.json(
    results.map((x): DataSourceConnectionDocumentResponse => {
      const r = x as PageObjectResponse;

      const title = r.properties.title as any;

      return {
        externalId: r.id!,
        name: title?.title[0]?.plain_text ?? "",
        createdAt: Date.parse(r.created_time!),
        mimeType: MimeType.NOTION_PAGE,
        metadata: {
          ...r,
        }
      }
    })
  );
}
