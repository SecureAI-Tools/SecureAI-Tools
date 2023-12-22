"use client";

import useSWR from "swr";
import { tw } from "twind";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { HiOutlineCheckCircle } from "react-icons/hi";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";
import { PageTitle } from "lib/fe/components/page-title";
import { FrontendRoutes } from "lib/fe/routes";
import { RenderCellsFn, Table } from "lib/fe/components/table";
import { getOrganizationsIdOrSlugDataSourceConnectionsApiPath } from "lib/fe/api-paths";
import { TokenUser } from "lib/types/core/token-user";
import { createFetcher } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { formatDateTime } from "lib/core/date-format";
import useToasts from "lib/fe/hooks/use-toasts";
import { Toasts } from "lib/fe/components/toasts";

import {
  PAGINATION_STARTING_PAGE_NUMBER,
  Id,
  DataSourceConnectionResponse,
  DataSource,
  dataSourceToReadableName,
} from "@repo/core";

interface DataSourceRecord {
  dataSource: DataSource;
  connection?: DataSourceConnectionResponse;
}

const DataSourcesListPage = ({ orgSlug }: { orgSlug: string }) => {
  const [dataSourceRecords, setDataSourceRecords] = useState<
    DataSourceRecord[] | undefined
  >(undefined);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [toasts, addToast] = useToasts();

  // Fetch ALL connections
  const shouldFetchDataSourceConnections =
    sessionStatus === "authenticated" && session;
  const {
    data: dataSourceConnectionsResponse,
    error: dataSourceConnectionsFetchError,
    mutate: mutateDataSourceConnectionResponse,
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
    if (!dataSourceConnectionsResponse) {
      return;
    }
    const dataSourceConnections = dataSourceConnectionsResponse.response;
    var dataSourceConnectionsMap = new Map(
      dataSourceConnections.map((dsc) => [dsc.dataSource, dsc]),
    );

    // Remove implicit data sources like upload and web
    const dataSources = Object.values(DataSource).filter(
      (d) => d !== DataSource.UPLOAD,
    );

    // Sort alphabetically
    dataSources.sort();

    const newDataSourceRecords = dataSources.map((ds): DataSourceRecord => {
      return {
        dataSource: ds,
        connection: dataSourceConnectionsMap.get(ds),
      };
    });

    setDataSourceRecords([...newDataSourceRecords]);
  }, [dataSourceConnectionsResponse]);

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
                src={`/data-source-logos/${item.dataSource.toLowerCase()}.svg`}
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
      <Toasts toasts={toasts} />
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
