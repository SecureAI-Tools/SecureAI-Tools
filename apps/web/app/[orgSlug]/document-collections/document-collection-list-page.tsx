"use client";

import useSWR from "swr";
import ReactTimeAgo from "react-time-ago";
import { tw } from "twind";
import { useEffect, useState } from "react";
import { Button } from "flowbite-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";
import { PageTitle } from "lib/fe/components/page-title";
import { FrontendRoutes } from "lib/fe/routes";
import { RenderCellsFn, StudioTable } from "lib/fe/components/studio-table";
import useTableState, { PAGE_PARAM } from "lib/fe/hooks/use-table-state";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { numberOfPages } from "lib/core/pagination-utils";
import { DEFAULT_DOCUMENT_COLLECTION_NAME, PAGINATION_DEFAULT_PAGE_SIZE } from "lib/core/constants";
import { getOrganizationsIdOrSlugDocumentCollectionApiPath } from "lib/fe/api-paths";
import { Id } from "lib/types/core/id";
import { TokenUser } from "lib/types/core/token-user";
import { createFetcher } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { formatDateTime } from "lib/core/date-format";
import { Link } from "lib/fe/components/link";
import { FE } from "lib/fe/route-utils";
import { isEmpty } from "lib/core/string-utils";

const pageSize = PAGINATION_DEFAULT_PAGE_SIZE;

const DocumentCollectionListPage = ({ orgSlug }: { orgSlug: string }) => {
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [tableState, setTableState] = useTableState();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const pageParamValue = searchParams?.get(PAGE_PARAM);
    FE.updateSearchParams({
      params: {
        [PAGE_PARAM]: tableState.pagination.currentPage.toString(),
      },
      ignoreKeys: ["orgSlug"],
      router,
      searchParams,
      pathname,
      // 'replace' when going from no page param to page param.
      // Otherwise the back navigation gets stuck between those two pages
      type: isEmpty(pageParamValue) ? "replace" : "push",
    });
  }, [tableState]);

  const shouldFetchDocumentCollections =
    sessionStatus === "authenticated" && session;
  const {
    data: documentCollectionsResponse,
    error: documentCollectionsFetchError,
  } = useSWR(
    shouldFetchDocumentCollections
      ? getOrganizationsIdOrSlugDocumentCollectionApiPath({
          orgIdOrSlug: orgSlug,
          userId: Id.from((session.user as TokenUser).id),
          ordering: {
            orderBy: 'createdAt',
            order: 'desc',
          },
          pagination: {
            page: tableState.pagination.currentPage,
            pageSize: pageSize,
          },
        })
      : null,
    createFetcher<DocumentCollectionResponse[]>(),
  );

  const onPageChange = (newPage: number) => {
    setTableState((old) => ({
      ...old,
      pagination: {
        currentPage: newPage,
      },
    }));
  };

  const renderCells: RenderCellsFn<DocumentCollectionResponse> = ({ item }) => {
    return [
      <div
        className={tw(
          "flex items-center text-gray-900 whitespace-nowrap dark:text-white",
        )}
      >
        <div>
          <div className={tw("flex flex-row")}>
            <div className={tw("text-base font-normal")}>
              <Link
                href={FrontendRoutes.getDocumentCollectionRoute(orgSlug, Id.from(item.id))}
              >
                {item.name ?? <span className={tw("italic")}>{DEFAULT_DOCUMENT_COLLECTION_NAME}</span>}
              </Link>
            </div>
          </div>
          <div className={tw("text-sm font-normal text-gray-500 mt-1")}>
            {item.description ?? ""}
          </div>
        </div>
      </div>,
      <div className={tw("flex flex-col")}>
        <div>{formatDateTime(item.createdAt)}</div>
        <div className={tw("mt-1 text-sm")}>
          <ReactTimeAgo date={item.createdAt} locale="en-US" />
        </div>
      </div>
    ];
  }

  if (documentCollectionsFetchError) {
    return renderErrors(documentCollectionsFetchError);
  }

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} activeItem="document-collections" />
        <div className={tw("items-center justify-center w-full p-8 max-h-screen overflow-scroll")}>
          <div className={tw("flow-root w-full align-middle")}>
            <div className={tw("float-left h-full align-middle")}>
              <PageTitle
                title="Document collections"
              />
            </div>
            <div className={tw("float-right")}>
              <Button
                color="gray"
                pill
                href={FrontendRoutes.getNewDocumentCollectionsRoute(orgSlug)}
              >
                Add Collection
              </Button>
            </div>
          </div>

          <div className={tw("mt-4")}>
            <StudioTable
              loading={isTableLoading}
              data={documentCollectionsResponse?.response}
              columns={["Document Collection", "Created Date"]}
              renderCells={renderCells}
              page={tableState.pagination.currentPage}
              totalPages={numberOfPages(documentCollectionsResponse?.headers.pagination?.totalCount ?? 0, pageSize)}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default DocumentCollectionListPage;
