"use client";

import useSWR from "swr";
import ReactTimeAgo from "react-time-ago";
import { tw } from "twind";
import { useEffect, useState } from "react";
import { Badge, Button, Progress, Spinner, Tooltip } from "flowbite-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { HiBadgeCheck } from "react-icons/hi";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";
import { PageTitle } from "lib/fe/components/page-title";
import { RenderCellsFn, StudioTable } from "lib/fe/components/studio-table";
import useTableState, { PAGE_PARAM } from "lib/fe/hooks/use-table-state";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { numberOfPages } from "lib/core/pagination-utils";
import {
  DEFAULT_DOCUMENT_COLLECTION_NAME,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "lib/core/constants";
import {
  documentCollectionDocumentApiPath,
  getDocumentCollectionApiPath,
  getDocumentCollectionDocumentsApiPath,
  getDocumentCollectionStatsApiPath,
  getOrganizationsIdOrSlugDocumentCollectionApiPath,
} from "lib/fe/api-paths";
import { Id } from "lib/types/core/id";
import { createFetcher, get } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { formatDateTime } from "lib/core/date-format";
import { Link } from "lib/fe/components/link";
import { FE } from "lib/fe/route-utils";
import { isEmpty } from "lib/core/string-utils";
import { DocumentResponse } from "lib/types/api/document.response";
import { DocumentCollectionStatsResponse } from "lib/types/api/document-collection-stats.response";
import { DocumentIndexingStatus } from "lib/types/core/document-indexing-status";
import ChatCreationModal from "./chat-creation-modal";

const pageSize = PAGINATION_DEFAULT_PAGE_SIZE;
const pollingIntervalMS = 10000;

interface ProcessingStats {
  stats: DocumentCollectionStatsResponse;
  updatedAt: Date;
}

const DocumentCollectionDetailsPage = ({
  orgSlug,
  documentCollectionId: documentCollectionIdRaw,
}: {
  orgSlug: string;
  documentCollectionId: string;
}) => {
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
  const [processingStats, setProcessingStats] = useState<ProcessingStats>();
  const [showChatCreationModal, setShowChatCreationModal] =
    useState<boolean>(false);
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

  const documentCollectionId = Id.from<DocumentCollectionResponse>(
    documentCollectionIdRaw,
  );

  const shouldFetchDocumentCollection =
    sessionStatus === "authenticated" && session;
  const {
    data: documentCollectionResponse,
    error: documentCollectionFetchError,
  } = useSWR(
    shouldFetchDocumentCollection
      ? getDocumentCollectionApiPath(documentCollectionId)
      : null,
    createFetcher<DocumentCollectionResponse>(),
  );

  const shouldFetchDocuments = sessionStatus === "authenticated" && session;
  const { data: documentsResponse, error: documentsFetchError } = useSWR(
    shouldFetchDocuments
      ? getDocumentCollectionDocumentsApiPath({
          documentCollectionId: documentCollectionId,
          ordering: {
            orderBy: "createdAt",
            order: "desc",
          },
          pagination: {
            page: tableState.pagination.currentPage,
            pageSize: pageSize,
          },
        })
      : null,
    createFetcher<DocumentResponse[]>(),
  );

  useEffect(() => {
    if (document && documentCollectionResponse) {
      document.title = `Document collection: ${
        documentCollectionResponse?.response.name ??
        DEFAULT_DOCUMENT_COLLECTION_NAME
      }`;
    }
  }, [documentCollectionResponse]);

  const refreshStats = async () => {
    const responseWithHeaders = await get<DocumentCollectionStatsResponse>(
      getDocumentCollectionStatsApiPath(documentCollectionId),
    );
    const stats = responseWithHeaders.response;
    setProcessingStats({
      stats: stats,
      updatedAt: new Date(),
    });
  };

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    if (!processingStats) {
      return;
    }

    const stats = processingStats.stats;

    if (stats.indexedDocumentCount < stats.totalDocumentCount) {
      // Refetch in a few seconds
      setTimeout(() => {
        refreshStats();
      }, pollingIntervalMS);
    }
  }, [processingStats]);

  const onPageChange = (newPage: number) => {
    setTableState((old) => ({
      ...old,
      pagination: {
        currentPage: newPage,
      },
    }));
  };

  const renderCells: RenderCellsFn<DocumentResponse> = ({ item }) => {
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
                href={documentCollectionDocumentApiPath(
                  documentCollectionId,
                  Id.from(item.id),
                )}
                target="_blank"
              >
                {item.name}
              </Link>
            </div>
          </div>
        </div>
      </div>,
      <div className={tw("flex flex-col items-start")}>
        {renderIndexingStatus(item.indexingStatus)}
      </div>,
      <div className={tw("flex flex-col")}>
        <div>{formatDateTime(item.createdAt)}</div>
        <div className={tw("mt-1 text-sm")}>
          <ReactTimeAgo date={item.createdAt} locale="en-US" />
        </div>
      </div>,
    ];
  };

  const renderDocumentCollectionIndexingStatus = (): React.ReactNode => {
    if (!processingStats) {
      return null;
    }

    const { stats, updatedAt } = processingStats;

    if (stats.indexedDocumentCount === stats.totalDocumentCount) {
      return (
        <Tooltip content="All documents processed">
          <div className={tw("flex flex-col items-center text-xs")}>
            <HiBadgeCheck className={tw("h-6 w-6 mb-1")} />
            Processed
          </div>
        </Tooltip>
      );
    }

    return (
      <Tooltip
        content={
          <>
            Last checked{" "}
            <ReactTimeAgo date={updatedAt} locale="en-US" timeStyle="mini" />{" "}
            ago
          </>
        }
      >
        <div className={tw("flex flex-col items-center")}>
          <div className={tw("flex flex-row items-center mb-2 text-sm")}>
            Processed {stats.indexedDocumentCount} of {stats.totalDocumentCount}{" "}
            documents
            <Spinner size="sm" className={tw("ml-2")} />
          </div>
          <Progress
            progress={
              (stats.indexedDocumentCount * 100) / stats.totalDocumentCount
            }
            size="sm"
            className={tw("w-64")}
          />
        </div>
      </Tooltip>
    );
  };

  if (documentCollectionFetchError || documentsFetchError) {
    return renderErrors(documentCollectionFetchError, documentsFetchError);
  }

  const disableNewChat =
    !processingStats ||
    processingStats.stats.indexedDocumentCount !==
      processingStats.stats.totalDocumentCount;

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} />
        <div
          className={tw(
            "items-center justify-center w-full p-8 max-h-screen overflow-scroll",
          )}
        >
          <div className={tw("flex flex-col")}>
            <div className={tw("flow-root w-full align-middle")}>
              <div
                className={tw(
                  "float-left h-full align-middle max-w-4xl truncate",
                )}
              >
                <PageTitle
                  title={
                    documentCollectionResponse
                      ? documentCollectionResponse.response.name ?? (
                          <span className={tw("italic")}>
                            {DEFAULT_DOCUMENT_COLLECTION_NAME}
                          </span>
                        )
                      : ""
                  }
                />
              </div>
              <div className={tw("float-right")}>
                <Tooltip
                  content={
                    disableNewChat
                      ? "Waiting for all documents to be processed"
                      : "Create a new chat"
                  }
                >
                  <Button
                    pill
                    disabled={disableNewChat}
                    onClick={() => {
                      setShowChatCreationModal(true);
                    }}
                  >
                    New Chat
                  </Button>
                </Tooltip>
              </div>
            </div>
            <div className={tw("mt-2 text-sm")}>
              {documentCollectionResponse?.response.description ?? (
                <span className={tw("italic")}>No description</span>
              )}
            </div>
          </div>

          <div className={tw("mt-6")}>
            <div className={tw("flex flex-row items-center")}>
              <div className={tw("grow text-lg font-medium")}>Documents</div>
              <div>{renderDocumentCollectionIndexingStatus()}</div>
            </div>
            <div className={tw("mt-4")}>
              <StudioTable
                loading={isTableLoading}
                data={documentsResponse?.response}
                columns={["Document", "Status", "Added Date"]}
                renderCells={renderCells}
                page={tableState.pagination.currentPage}
                totalPages={numberOfPages(
                  documentsResponse?.headers.pagination?.totalCount ?? 0,
                  pageSize,
                )}
                onPageChange={onPageChange}
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <ChatCreationModal
          documentCollectionId={documentCollectionId}
          orgSlug={orgSlug}
          show={showChatCreationModal}
          onClose={() => {
            setShowChatCreationModal(false);
          }}
        />
      </div>
    </AppsLoggedInLayout>
  );
};

export default DocumentCollectionDetailsPage;

const renderIndexingStatus = (indexingStatus: DocumentIndexingStatus) => {
  let color = "";
  let text = "";
  let tooltip = "";
  switch (indexingStatus) {
    case DocumentIndexingStatus.INDEXED:
      color = "info";
      text = "Processed";
      tooltip = "Processed successfully";
      break;
    case DocumentIndexingStatus.NOT_INDEXED:
      color = "gray";
      text = "Processing";
      tooltip = "Document is being processed in the background";
      break;
  }

  return (
    <Tooltip content={tooltip}>
      <Badge color={color} className={tw("ml-2")}>
        {text}
      </Badge>
    </Tooltip>
  );
};
