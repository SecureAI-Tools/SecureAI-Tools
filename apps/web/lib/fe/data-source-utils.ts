import { DataSourceConnectionCheckRequest } from "lib/types/api/data-source-connection-check.request";
import { DataSourceConnectionCheckResponse } from "lib/types/api/data-source-connection-check.response";
import { post } from "lib/fe/api";
import {
  checkDataSourceConnectionsApiPath,
  postDataSourceConnectionsApiPath,
} from "lib/fe/api-paths";
import { DataSourceConnectionCreateRequest } from "lib/types/api/data-source-connection-create.request";
import { DataSource, DataSourceConnectionResponse, toDataSource } from "@repo/core";
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

export interface DataSourceRecord {
  dataSource: DataSource;
  configured: boolean,
  connection?: DataSourceConnectionResponse;
}

export const getDataSourceRecords = (
  dataSourceConnections: DataSourceConnectionResponse[],
  dataSourcesResponse: DataSourcesResponse,
): DataSourceRecord[] => {
  var dataSourceConnectionsMap = new Map(
    dataSourceConnections.map((dsc) => [dsc.dataSource, dsc]),
  );

  const dataSources = Object.keys(DataSource).map(s => toDataSource(s));
  const configuredDataSources = new Set(dataSourcesResponse.configuredDataSources.map(s => toDataSource(s)));

  // Sort alphabetically
  dataSources.sort();

  return dataSources.map((ds): DataSourceRecord => {
    return {
      dataSource: ds,
      configured: configuredDataSources.has(ds),
      connection: dataSourceConnectionsMap.get(ds),
    };
  });
};
