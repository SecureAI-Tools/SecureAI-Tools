"use client";

import { tw } from "twind";
import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Alert, Spinner } from "flowbite-react";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { PageTitle } from "lib/fe/components/page-title";
import { PaperlessNgxConnector } from "lib/fe/components/data-sources/connectors/paperless-ngx";
import { TokenUser } from "lib/types/core/token-user";
import { getOrganizationsIdOrSlugDataSourceConnectionsApiPath } from "lib/fe/api-paths";
import { createFetcher } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { formatDateTime } from "lib/core/date-format";
import { GoogleDriveConnector } from "lib/fe/components/data-sources/connectors/google-drive";
import { NotionConnector } from "lib/fe/components/data-sources/connectors/notion";

import {
  DataSource,
  DataSourceConnectionResponse,
  Id,
  IdType,
  PAGINATION_STARTING_PAGE_NUMBER,
  dataSourceToReadableName,
  toDataSource,
} from "@repo/core";

const ConnectDataSource = ({
  orgSlug,
  dataSource: dataSourceRaw,
}: {
  orgSlug: string;
  dataSource: string;
}) => {
  const { data: session, status: sessionStatus } = useSession();

  const dataSource = toDataSource(dataSourceRaw.toUpperCase());

  const shouldFetchDataSourceConnections =
    sessionStatus === "authenticated" && session;
  const {
    data: dataSourceConnectionsResponse,
    error: dataSourceConnectionsFetchError,
  } = useSWR(
    shouldFetchDataSourceConnections
      ? getOrganizationsIdOrSlugDataSourceConnectionsApiPath({
          orgIdOrSlug: orgSlug,
          userId: Id.from((session.user as TokenUser).id),
          ordering: {
            orderBy: "createdAt",
            order: "desc",
          },
          pagination: {
            page: PAGINATION_STARTING_PAGE_NUMBER,
            pageSize: 1,
          },
          dataSources: [dataSource],
        })
      : null,
    createFetcher<DataSourceConnectionResponse[]>(),
  );

  const dataSourceReadableName = dataSourceToReadableName(dataSource);
  useEffect(() => {
    if (document) {
      document.title = `Connect to ${dataSourceReadableName}`;
    }
  }, []);

  const renderConnector = (): ReactNode => {
    if (session === undefined || dataSourceConnectionsResponse === undefined) {
      return <Spinner size="xl" />;
    }

    const tokenUser = session!.user as TokenUser;

    if (dataSourceConnectionsResponse.response.length > 0) {
      return (
        <Alert color="success">
          <div className={tw("font-medium mb-2")}>Already connected!</div>
          Your account ({tokenUser.email}) is already connected to{" "}
          {dataSourceReadableName} since{" "}
          {formatDateTime(dataSourceConnectionsResponse.response[0]!.createdAt)}
        </Alert>
      );
    }

    const userId = Id.from<IdType.User>(tokenUser.id);

    switch (dataSource) {
      case DataSource.PAPERLESS_NGX:
        return <PaperlessNgxConnector orgSlug={orgSlug} userId={userId} />;
      case DataSource.GOOGLE_DRIVE:
        return <GoogleDriveConnector orgSlug={orgSlug} userId={userId} />;
      case DataSource.NOTION:
        return <NotionConnector orgSlug={orgSlug} userId={userId} />;
      default:
        return <div>Unsupported data source "{dataSourceReadableName}"</div>;
    }
  };

  if (dataSourceConnectionsFetchError) {
    return renderErrors(dataSourceConnectionsFetchError);
  }

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-col items-center m-6")}>
        <div className={tw("mb-6")}>
          <PageTitle>Connect to {dataSourceReadableName}</PageTitle>
        </div>
        <div className={tw("w-[450px]")}>{renderConnector()}</div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default ConnectDataSource;
