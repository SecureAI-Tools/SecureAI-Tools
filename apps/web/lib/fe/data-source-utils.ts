import { DataSourceConnectionCheckRequest } from "lib/types/api/data-source-connection-check.request";
import { DataSourceConnectionCheckResponse } from "lib/types/api/data-source-connection-check.response";
import { post } from "lib/fe/api";
import {
  checkDataSourceConnectionsApiPath,
  postDataSourceConnectionsApiPath,
} from "lib/fe/api-paths";
import { DataSourceConnectionCreateRequest } from "lib/types/api/data-source-connection-create.request";
import { DataSource, DataSourceConnectionResponse } from "@repo/core";

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
  return `/data-source-logos/${dataSource.toLowerCase()}.svg`
}

export interface DataSourceRecord {
  dataSource: DataSource;
  connection?: DataSourceConnectionResponse;
}

export const getDataSourceRecords = (
  dataSourceConnections: DataSourceConnectionResponse[],
): DataSourceRecord[] => {
  var dataSourceConnectionsMap = new Map(
    dataSourceConnections.map((dsc) => [dsc.dataSource, dsc]),
  );

  const dataSources = Object.values(DataSource);

  // Sort alphabetically
  dataSources.sort();

  return dataSources.map((ds): DataSourceRecord => {
    return {
      dataSource: ds,
      connection: dataSourceConnectionsMap.get(ds),
    };
  });
}
