import { DataSourceConnectionCheckRequest } from "lib/types/api/data-source-connection-check.request";
import { DataSourceConnectionCheckResponse } from "lib/types/api/data-source-connection-check.response";
import { post } from "lib/fe/api";
import {
  checkDataSourceConnectionsApiPath,
  postDataSourceConnectionsApiPath,
} from "lib/fe/api-paths";
import { DataSourceConnectionCreateRequest } from "lib/types/api/data-source-connection-create.request";
import { DataSource, DataSourceConnectionResponse } from "@repo/core";
import { DataSourcesResponse } from "lib/types/api/data-sources.response";

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

export const getLogoSrc = (dataSource: DataSource): string => {
  return `/data-source-logos/${dataSource.toLowerCase()}.svg`;
};

export interface DataSourceRecord {
  dataSource: DataSource;
  connection?: DataSourceConnectionResponse;
}

export const getDataSourceRecords = (
  dataSourceConnections: DataSourceConnectionResponse[],
  dataSourcesResponse: DataSourcesResponse,
): DataSourceRecord[] => {
  var dataSourceConnectionsMap = new Map(
    dataSourceConnections.map((dsc) => [dsc.dataSource, dsc]),
  );

  const dataSources = dataSourcesResponse.enabledDataSources;

  // Sort alphabetically
  dataSources.sort();

  return dataSources.map((ds): DataSourceRecord => {
    return {
      dataSource: ds,
      connection: dataSourceConnectionsMap.get(ds),
    };
  });
};
