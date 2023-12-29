"use client";

import useSWR from "swr";
import { tw } from "twind";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { HiOutlineCheckCircle } from "react-icons/hi";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";
import { PageTitle } from "lib/fe/components/page-title";
import { FrontendRoutes } from "lib/fe/routes";
import { RenderCellsFn, Table } from "lib/fe/components/table";
import { getDataSourcesApiPath, getOrganizationsIdOrSlugDataSourceConnectionsApiPath } from "lib/fe/api-paths";
import { TokenUser } from "lib/types/core/token-user";
import { createFetcher } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { formatDateTime } from "lib/core/date-format";
import { DataSourcesResponse } from "lib/types/api/data-sources.response";

import {
  PAGINATION_STARTING_PAGE_NUMBER,
  Id,
  DataSourceConnectionResponse,
  DataSource,
  dataSourceToReadableName,
} from "@repo/core";
import {
  DataSourceRecord,
  getDataSourceRecords,
  getLogoSrc,
} from "lib/fe/data-source-utils";

const DataSourcesListPage = ({ orgSlug }: { orgSlug: string }) => {
  const [dataSourceRecords, setDataSourceRecords] = useState<
    DataSourceRecord[] | undefined
  >(undefined);
  const { data: session, status: sessionStatus } = useSession();

  const shouldFetchDataSources =
    sessionStatus === "authenticated" && session;
  const {
    data: dataSourcesResponse,
    error: dataSourcesFetchError,
  } = useSWR(
    shouldFetchDataSources
      ? getDataSourcesApiPath()
      : null,
    createFetcher<DataSourcesResponse>(),
  );

  // Fetch ALL connections
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
            // Hackity hack: It'll be a while before exceeding 1024 active connections per org-membership! ;)
            pageSize: 1024,
          },
        })
      : null,
    createFetcher<DataSourceConnectionResponse[]>(),
  );

  useEffect(() => {
    if (!dataSourceConnectionsResponse || !dataSourcesResponse) {
      return;
    }

    const dataSourceRecords = getDataSourceRecords(
      dataSourceConnectionsResponse.response,
      dataSourcesResponse.response,
    );

    // Remove implicit data sources like upload and web
    const filteredDataSources = dataSourceRecords.filter(
      (d) => d.dataSource !== DataSource.UPLOAD,
    );

    setDataSourceRecords([...filteredDataSources]);
  }, [dataSourceConnectionsResponse, dataSourcesResponse]);

  const renderCells: RenderCellsFn<DataSourceRecord> = ({ item }) => {
    return [
      <div
        className={tw(
          "flex items-center text-gray-900 whitespace-nowrap dark:text-white max-w-4xl 2xl:max-w-6xl truncate",
        )}
      >
        <div>
          <div className={tw("flex flex-row items-center")}>
            <div>
              <Image
                src={getLogoSrc(item.dataSource)}
                alt={`${dataSourceToReadableName(item.dataSource)} logo`}
                width={20}
                height={20}
              />
            </div>
            <div className={tw("text-base font-normal ml-2")}>
              {dataSourceToReadableName(item.dataSource)}
            </div>
          </div>
        </div>
      </div>,
      item.connection ? (
        <div className={tw("flex flex-row items-center")}>
          <HiOutlineCheckCircle className={tw("h-5 w-5")} />
          <div className={tw("flex flex-col ml-2 text-xs")}>
            <span>Connected on</span>
            <div>{formatDateTime(item.connection.createdAt)}</div>
          </div>
        </div>
      ) : (
        <div className={tw("w-24")}>
          <Button
            size="xs"
            pill
            href={FrontendRoutes.getConnectDataSourceRoute(
              orgSlug,
              item.dataSource,
            )}
          >
            Connect
          </Button>
        </div>
      ),
    ];
  };

  if (dataSourceConnectionsFetchError) {
    return renderErrors(dataSourceConnectionsFetchError);
  }

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} />
        <div
          className={tw(
            "flex flex-col w-full p-8 max-h-screen overflow-scroll",
          )}
        >
          <div className={tw("w-full align-middle")}>
            <PageTitle>Data Sources</PageTitle>
          </div>
          <div className={tw("mt-4 grow")}>
            <Table
              loading={dataSourceRecords === undefined}
              data={dataSourceRecords}
              columns={["Data Source", "Connection Status"]}
              renderCells={renderCells}
              page={1}
              totalPages={1}
              onPageChange={() => {
                console.log("onPageChange: should not be happening!");
              }}
            />
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default DataSourcesListPage;
