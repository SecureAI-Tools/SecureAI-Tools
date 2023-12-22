"use client";

import useSWR from "swr";
import ReactTimeAgo from "react-time-ago";
import { tw } from "twind";
import { useEffect, useState } from "react";
import { Button, Modal } from "flowbite-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { HiOutlinePlus, HiOutlineExclamationCircle } from "react-icons/hi";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";
import { PageTitle } from "lib/fe/components/page-title";
import { FrontendRoutes } from "lib/fe/routes";
import { RenderCellsFn, Table } from "lib/fe/components/table";
import useTableState, { PAGE_PARAM } from "lib/fe/hooks/use-table-state";
import { numberOfPages } from "lib/core/pagination-utils";
import {
  getDocumentCollectionApiPath,
  getOrgMembershipsApiPath,
  getOrganizationsIdOrSlugDocumentCollectionApiPath,
  organizationsIdOrSlugApiPath,
  organizationsIdOrSlugModelsApiPath,
} from "lib/fe/api-paths";
import { TokenUser } from "lib/types/core/token-user";
import { createFetcher, delete_ } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { formatDateTime } from "lib/core/date-format";
import { Link } from "lib/fe/components/link";
import { FE } from "lib/fe/route-utils";
import { EmptyState } from "lib/fe/components/empty-state";
import { ActionMenu } from "lib/fe/components/action-menu";
import useToasts from "lib/fe/hooks/use-toasts";
import { Toasts } from "lib/fe/components/toasts";
import { isAdmin } from "lib/fe/permission-utils";
import { ModelsResponse } from "lib/types/api/models.response";
import { ModelSetupAlert } from "lib/fe/components/model-setup-alert";

import {
  PAGINATION_DEFAULT_PAGE_SIZE,
  Id,
  DocumentCollectionResponse,
  DEFAULT_DOCUMENT_COLLECTION_NAME,
  isEmpty,
  OrganizationResponse,
  ModelType,
  OrgMembershipResponse,
} from "@repo/core";

const pageSize = PAGINATION_DEFAULT_PAGE_SIZE;

const DocumentCollectionListPage = ({ orgSlug }: { orgSlug: string }) => {
  const [tableState, setTableState] = useTableState();
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [toasts, addToast] = useToasts();

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
    isLoading: isDocumentCollectionsResponseLoading,
    mutate: mutateDocumentCollectionsResponse,
  } = useSWR(
    shouldFetchDocumentCollections
      ? getOrganizationsIdOrSlugDocumentCollectionApiPath({
          orgIdOrSlug: orgSlug,
          userId: Id.from((session.user as TokenUser).id),
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
    createFetcher<DocumentCollectionResponse[]>(),
  );

  // Fetch organization
  const { data: organizationResponse, error: fetchOrganizationError } = useSWR(
    organizationsIdOrSlugApiPath(orgSlug),
    createFetcher<OrganizationResponse>(),
  );

  // Fetch current user's membership to organization
  const shouldFetchOrgMembership = organizationResponse !== undefined && session;
  const { data: orgMembershipResponse, error: fetchOrgMembershipError } =
    useSWR(
      shouldFetchOrgMembership
        ? getOrgMembershipsApiPath(Id.from(organizationResponse.response.id), {
            userId: (session!.user as TokenUser).id,
          })
        : null,
      createFetcher<OrgMembershipResponse[]>(),
    );

  // Fetch model info
  const shouldFetchModels =
    orgMembershipResponse !== undefined &&
    isAdmin(orgMembershipResponse.response) &&
    organizationResponse?.response.defaultModelType === ModelType.OLLAMA;
  const { data: modelsResponse, error: fetchModelsError } = useSWR(
    shouldFetchModels
      ? organizationsIdOrSlugModelsApiPath(
          orgSlug,
          organizationResponse.response.defaultModel,
        )
      : null,
    createFetcher<ModelsResponse>(),
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
          "flex items-center text-gray-900 whitespace-nowrap dark:text-white max-w-4xl 2xl:max-w-6xl truncate",
        )}
      >
        <div>
          <div className={tw("flex flex-row")}>
            <div className={tw("text-base font-normal")}>
              <Link
                href={FrontendRoutes.getDocumentCollectionRoute(
                  orgSlug,
                  Id.from(item.id),
                )}
              >
                {item.name ?? (
                  <span className={tw("italic")}>
                    {DEFAULT_DOCUMENT_COLLECTION_NAME}
                  </span>
                )}
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
      </div>,
      <RowActionItem
        documentCollection={item}
        onDeleteSuccess={() => {
          addToast({
            type: "success",
            children: <p>Successfully deleted document collection</p>,
          });

          // Refetch current page to relfect updated values!
          mutateDocumentCollectionsResponse();
        }}
        onDeleteError={(e) => {
          console.log(
            "something went wrong while trying to delete doc collection!",
            e,
          );
          addToast({
            type: "failure",
            children: <p>Something went wrong! Please try again later</p>,
          });
        }}
        key={`${item.id}.actions`}
      />,
    ];
  };

  if (documentCollectionsFetchError) {
    return renderErrors(documentCollectionsFetchError);
  }

  const shouldRenderEmptyState =
    !isDocumentCollectionsResponseLoading &&
    tableState.pagination.currentPage === 1 &&
    documentCollectionsResponse?.response.length === 0;

  const modelSetupRequired =
    orgMembershipResponse !== undefined &&
    isAdmin(orgMembershipResponse.response) &&
    organizationResponse?.response.defaultModelType === ModelType.OLLAMA &&
    modelsResponse !== undefined &&
    modelsResponse.response.models.length <= 0;

  return (
    <AppsLoggedInLayout>
      <Toasts toasts={toasts} />
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} activeItem="document-collections" />
        <div
          className={tw(
            "flex flex-col w-full p-8 max-h-screen overflow-scroll",
          )}
        >
          <div className={tw("flow-root w-full align-middle")}>
            <div className={tw("float-left h-full align-middle")}>
              <PageTitle>Document collections</PageTitle>
            </div>
            <div className={tw("float-right")}>
              <Button
                pill
                href={
                  modelSetupRequired
                    ? undefined
                    : FrontendRoutes.getNewDocumentCollectionsRoute(orgSlug)
                }
                disabled={modelSetupRequired}
              >
                Add Collection
              </Button>
            </div>
          </div>
          {modelSetupRequired ? <ModelSetupAlert orgSlug={orgSlug} /> : null}
          <div className={tw("mt-4 grow")}>
            {shouldRenderEmptyState ? (
              <EmptyState
                title="Add your first document collection"
                subTitle="You don't have any document collections yet. Start by creating your first document collection."
                cta={
                  <Button
                    outline
                    size="lg"
                    href={
                      modelSetupRequired
                        ? undefined
                        : FrontendRoutes.getNewDocumentCollectionsRoute(orgSlug)
                    }
                    disabled={modelSetupRequired}
                  >
                    <HiOutlinePlus className="mr-2 h-5 w-5" />
                    Add collection
                  </Button>
                }
              />
            ) : (
              <Table
                loading={isDocumentCollectionsResponseLoading}
                data={documentCollectionsResponse?.response}
                columns={["Document Collection", "Created Date", "Actions"]}
                renderCells={renderCells}
                page={tableState.pagination.currentPage}
                totalPages={numberOfPages(
                  documentCollectionsResponse?.headers.pagination?.totalCount ??
                    0,
                  pageSize,
                )}
                onPageChange={onPageChange}
              />
            )}
          </div>
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default DocumentCollectionListPage;

function RowActionItem({
  documentCollection,
  onDeleteSuccess,
  onDeleteError,
}: {
  documentCollection: DocumentCollectionResponse;
  onDeleteSuccess: () => void;
  onDeleteError: (err: Error) => void;
}) {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [deletionInProgress, setDeletionInProgress] = useState<boolean>(false);

  return (
    <div>
      <ActionMenu
        actions={[
          {
            label: "Delete",
            onClick: () => setOpenModal(true),
          },
        ]}
      />

      <Modal
        popup
        size="lg"
        position="center"
        show={openModal}
        onClose={() => setOpenModal(false)}
        dismissible
      >
        <Modal.Header />
        <Modal.Body>
          <div className={tw("text-center")}>
            <HiOutlineExclamationCircle
              className={tw(
                "mx-auto mb-4 h-14 w-14 text-red-600 dark:text-red-200",
              )}
            />
            <h3
              className={tw(
                "mb-5 text-lg font-normal text-black-500 dark:text-black-400",
              )}
            >
              Are you sure you want to delete "
              {documentCollection.name ?? DEFAULT_DOCUMENT_COLLECTION_NAME}"?
            </h3>
            <div className={tw("flex justify-center gap-4")}>
              <Button
                color="failure"
                isProcessing={deletionInProgress}
                onClick={() => {
                  setDeletionInProgress(true);

                  deleteDocumentCollection(Id.from(documentCollection.id))
                    .then(onDeleteSuccess)
                    .catch(onDeleteError)
                    .finally(() => {
                      setOpenModal(false);
                      setDeletionInProgress(false);
                    });
                }}
              >
                Yes, I'm sure
              </Button>
              <Button
                color="gray"
                className={tw(
                  "text-gray-500 enabled:hover:bg-gray-100 enabled:hover:text-gray-700",
                )}
                onClick={() => setOpenModal(false)}
                disabled={deletionInProgress}
              >
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

const deleteDocumentCollection = async (
  documentCollectionId: Id<DocumentCollectionResponse>,
): Promise<{}> => {
  return (await delete_<{}>(getDocumentCollectionApiPath(documentCollectionId)))
    .response;
};
