"use client";

import useSWR from "swr";
import ReactTimeAgo from "react-time-ago";
import { tw } from "twind";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Dropdown,
  Progress,
  Spinner,
  Tooltip,
} from "flowbite-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { HiBadgeCheck, HiDotsHorizontal } from "react-icons/hi";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";
import { PageTitle } from "lib/fe/components/page-title";
import { RenderCellsFn, Table } from "lib/fe/components/table";
import useTableState, { PAGE_PARAM } from "lib/fe/hooks/use-table-state";
import { numberOfPages } from "lib/core/pagination-utils";
import {
  documentCollectionDocumentApiPath,
  getDocumentCollectionApiPath,
  getDocumentCollectionDocumentsApiPath,
  getDocumentCollectionStatsApiPath,
} from "lib/fe/api-paths";
import { createFetcher, get } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { formatDateTime } from "lib/core/date-format";
import { Link } from "lib/fe/components/link";
import { FE } from "lib/fe/route-utils";
import { DocumentCollectionStatsResponse } from "lib/types/api/document-collection-stats.response";
import ChatCreationModal from "./chat-creation-modal";
import { EmptyState } from "lib/fe/components/empty-state";
import useToasts from "lib/fe/hooks/use-toasts";
import { Toasts } from "lib/fe/components/toasts";
import { FrontendRoutes } from "lib/fe/routes";
import DocumentCollectionUpdateModal from "./document-collection-update-modal";

import {
  PAGINATION_DEFAULT_PAGE_SIZE,
  Id,
  DocumentCollectionResponse,
  DocumentResponse,
  DEFAULT_DOCUMENT_COLLECTION_NAME,
  DocumentIndexingStatus,
  isEmpty,
} from "@repo/core";

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
  const [processingStats, setProcessingStats] = useState<ProcessingStats>();
  const [showChatCreationModal, setShowChatCreationModal] =
    useState<boolean>(false);
  const [
    showDocumentCollectionUpdateModal,
    setShowDocumentCollectionUpdateModal,
  ] = useState<boolean>(false);
  const [tableState, setTableState] = useTableState();
  const { data: session, status: sessionStatus } = useSession();
  const [toasts, addToast] = useToasts();
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
    mutate: mutateDocumentCollectionResponse,
  } = useSWR(
    shouldFetchDocumentCollection
      ? getDocumentCollectionApiPath(documentCollectionId)
      : null,
    createFetcher<DocumentCollectionResponse>(),
  );

  const shouldFetchDocuments = sessionStatus === "authenticated" && session;
  const {
    data: documentsResponse,
    error: documentsFetchError,
    isLoading: isDocumentsResponseLoading,
    mutate: mutateDocumentsResponse
  } = useSWR(
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
        mutateDocumentsResponse();
      }, pollingIntervalMS);
    } else {
      // Refetch current page to reflect updated statuses.
      mutateDocumentsResponse();
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

  const shouldRenderEmptyState =
    !isDocumentsResponseLoading &&
    tableState.pagination.currentPage === 1 &&
    documentsResponse?.response.length === 0;

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
          <div className={tw("flex flex-col")}>
            <div className={tw("flow-root w-full align-middle")}>
              <div
                className={tw(
                  "float-left h-full align-middle max-w-4xl truncate",
                )}
              >
                <PageTitle>
                  {documentCollectionResponse
                    ? documentCollectionResponse.response.name ?? (
                        <span className={tw("italic")}>
                          {DEFAULT_DOCUMENT_COLLECTION_NAME}
                        </span>
                      )
                    : null}
                </PageTitle>
              </div>
              <div className={tw("flex flex-row float-right")}>
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
                <Dropdown
                  label=""
                  dismissOnClick={false}
                  renderTrigger={() => {
                    return (
                      <Button
                        pill
                        outline
                        disabled={disableNewChat}
                        className={tw("ml-2")}
                      >
                        <HiDotsHorizontal className={tw("h-6 w-6")} />
                      </Button>
                    );
                  }}
                >
                  <Dropdown.Item
                    onClick={() => {
                      setShowDocumentCollectionUpdateModal(true);
                    }}
                  >
                    Edit
                  </Dropdown.Item>
                </Dropdown>
              </div>
            </div>
            <div className={tw("mt-2 text-sm")}>
              {documentCollectionResponse?.response.description ?? (
                <span className={tw("italic")}>No description</span>
              )}
            </div>
          </div>

          <div className={tw("mt-6 grow")}>
            {shouldRenderEmptyState ? (
              <EmptyState
                title="No documents in this collection yet!"
                subTitle="You don't have any documents in this collections. Start by adding documents to this collection."
                // TODO: Add CTA when we have the ability to upload documents into a collection (after it is created)!
                cta={null}
              />
            ) : (
              <div className={tw("mt-4")}>
                <div className={tw("flex flex-row items-center pr-2 pb-2")}>
                  <div className={tw("grow text-lg font-medium")}>
                    Documents
                  </div>
                  <div>{renderDocumentCollectionIndexingStatus()}</div>
                </div>
                <Table
                  loading={isDocumentsResponseLoading}
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
            )}
          </div>
        </div>
      </div>
      <div>
        <ChatCreationModal
          documentCollectionId={documentCollectionId}
          orgSlug={orgSlug}
          show={showChatCreationModal}
          onSuccess={(chatId) => {
            router.push(
              `${FrontendRoutes.getChatRoute(
                orgSlug,
                chatId,
              )}?src=doc-collection-new-chat`,
            );
          }}
          onError={(e) => {
            addToast({
              type: "failure",
              children: <p>Something went wrong. Please try again later.</p>,
            });
          }}
          onClose={() => {
            setShowChatCreationModal(false);
          }}
        />
      </div>
      <div>
        {documentCollectionResponse ? (
          <DocumentCollectionUpdateModal
            documentCollection={documentCollectionResponse.response}
            show={showDocumentCollectionUpdateModal}
            onSuccess={() => {
              addToast({
                type: "success",
                children: <p>Successfully updated document collection.</p>,
              });
              mutateDocumentCollectionResponse();
              setShowDocumentCollectionUpdateModal(false);
            }}
            onError={(e) => {
              addToast({
                type: "failure",
                children: <p>Something went wrong. Please try again later.</p>,
              });
            }}
            onClose={() => {
              setShowDocumentCollectionUpdateModal(false);
            }}
          />
        ) : null}
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
