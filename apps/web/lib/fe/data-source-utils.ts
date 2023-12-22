import { DataSourceConnectionCheckRequest } from "lib/types/api/data-source-connection-check.request";
import { DataSourceConnectionCheckResponse } from "lib/types/api/data-source-connection-check.response";
import { post } from "lib/fe/api";
import {
  checkDataSourceConnectionsApiPath,
  postDataSourceConnectionsApiPath,
} from "lib/fe/api-paths";
import { DataSourceConnectionCreateRequest } from "lib/types/api/data-source-connection-create.request";
import { DataSourceConnectionResponse } from "@repo/core";

export const checkDataSourceConnection = async (
  orgSlug: string,
  req: DataSourceConnectionCheckRequest,
): Promise<DataSourceConnectionCheckResponse> => {
  return (
    await post<
      DataSourceConnectionCheckRequest,
      DataSourceConnectionCheckResponse
    >(checkDataSourceConnectionsApiPath(orgSlug), req)
  ).response;
};

export const createDataSourceConnection = async (
  orgSlug: string,
  req: DataSourceConnectionCreateRequest,
): Promise<DataSourceConnectionResponse> => {
  return (
    await post<DataSourceConnectionCreateRequest, DataSourceConnectionResponse>(
      postDataSourceConnectionsApiPath(orgSlug),
      req,
    )
  ).response;
};
