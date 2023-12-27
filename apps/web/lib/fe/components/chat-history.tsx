"use client";

import { Button, Modal } from "flowbite-react";
import { ChatResponse } from "lib/types/api/chat.response";
import useSWR from "swr";
import { tw } from "twind";
import ReactTimeAgo from "react-time-ago";
import { useSession } from "next-auth/react";
import {
  HiOutlineExclamationCircle,
  HiOutlinePlus,
  HiOutlineDocumentText,
  HiOutlineChatAlt,
} from "react-icons/hi";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { createFetcher, delete_ } from "lib/fe/api";
import { chatApiPath, chatsApiPath } from "lib/fe/api-paths";
import { TokenUser } from "lib/types/core/token-user";
import useToasts from "lib/fe/hooks/use-toasts";
import { Toasts } from "lib/fe/components/toasts";
import { FrontendRoutes } from "lib/fe/routes";
import useTableState, { PAGE_PARAM } from "lib/fe/hooks/use-table-state";
import { FE } from "lib/fe/route-utils";
import { numberOfPages } from "lib/core/pagination-utils";
import { renderErrors } from "lib/fe/components/generic-error";
import { EmptyState } from "lib/fe/components/empty-state";
import { RenderCellsFn, Table } from "lib/fe/components/table";
import { formatDateTime } from "lib/core/date-format";
import { ActionMenu } from "lib/fe/components/action-menu";
import { Link } from "lib/fe/components/link";
import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";
import { PageTitle } from "lib/fe/components/page-title";
import { ChatType } from "lib/types/core/chat-type";

import {
  DEFAULT_CHAT_TITLE,
  Id,
  IdType,
  isEmpty,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@repo/core";

const pageSize = PAGINATION_DEFAULT_PAGE_SIZE;

export default function ChatHistory({ orgSlug }: { orgSlug: string }) {
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

  const shouldFetchChats = sessionStatus === "authenticated" && session;
  const chatsSWRKey = chatsApiPath({
    orgIdOrSlug: orgSlug,
    userId: (session?.user as TokenUser)?.id,
    ordering: {
      orderBy: "createdAt",
      order: "desc",
    },
    pagination: {
      page: tableState.pagination.currentPage,
      pageSize: pageSize,
    },
  });
  const {
    data: chatsResponse,
    error: fetchChatsError,
    isLoading: isChatsResponseLoading,
    mutate: mutateChatsResponse,
  } = useSWR(
    shouldFetchChats ? chatsSWRKey : null,
    createFetcher<ChatResponse[]>(),
  );

  const onPageChange = (newPage: number) => {
    setTableState((old) => ({
      ...old,
      pagination: {
        currentPage: newPage,
      },
    }));
  };

  const renderCells: RenderCellsFn<ChatResponse> = ({ item }) => {
    return [
      <div
        className={tw(
          "flex items-center text-gray-900 whitespace-nowrap dark:text-white max-w-4xl 2xl:max-w-6xl truncate",
        )}
      >
        <div>
          <div
            className={tw("flex flex-row text-base font-normal items-center")}
          >
            {item.type === ChatType.CHAT_WITH_DOCS ? (
              <HiOutlineDocumentText className={tw("mr-4 h-8 w-8")} />
            ) : (
              <HiOutlineChatAlt className={tw("mr-4 h-8 w-8")} />
            )}
            <Link href={FrontendRoutes.getChatRoute(orgSlug, Id.from(item.id))}>
              {item.title ?? (
                <span className={tw("italic")}>{DEFAULT_CHAT_TITLE}</span>
              )}
            </Link>
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
        chat={item}
        onDeleteSuccess={() => {
          addToast({
            type: "success",
            children: <p>Successfully deleted chat</p>,
          });

          // Refetch current page to relfect updated values!
          mutateChatsResponse();
        }}
        onDeleteError={(e) => {
          console.log("something went wrong while trying to delete chat!", e);
          addToast({
            type: "failure",
            children: <p>Something went wrong! Please try again later</p>,
          });
        }}
        key={`${item.id}.actions`}
      />,
    ];
  };

  if (fetchChatsError) {
    return renderErrors(fetchChatsError);
  }

  const shouldRenderEmptyState =
    !isChatsResponseLoading &&
    tableState.pagination.currentPage === 1 &&
    chatsResponse?.response.length === 0;

  return (
    <AppsLoggedInLayout>
      <Toasts toasts={toasts} />
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} activeItem="chat-history" />
        <div
          className={tw(
            "flex flex-col w-full p-8 max-h-screen overflow-scroll",
          )}
        >
          <div className={tw("flow-root w-full align-middle")}>
            <div className={tw("float-left h-full align-middle")}>
              <PageTitle>Chat History</PageTitle>
            </div>
            <div className={tw("float-right")}>
              <Button pill href={FrontendRoutes.getOrgHomeRoute(orgSlug)}>
                New Chat
              </Button>
            </div>
          </div>

          <div className={tw("mt-4 grow")}>
            {shouldRenderEmptyState ? (
              <EmptyState
                title="Create your first chat"
                subTitle="You don't have any chats yet. Start by creating your first chat."
                cta={
                  <Button
                    outline
                    size="lg"
                    href={FrontendRoutes.getOrgHomeRoute(orgSlug)}
                  >
                    <HiOutlinePlus className="mr-2 h-5 w-5" />
                    New Chat
                  </Button>
                }
              />
            ) : (
              <Table
                loading={isChatsResponseLoading}
                data={chatsResponse?.response}
                columns={["Chat", "Created Date", "Actions"]}
                renderCells={renderCells}
                page={tableState.pagination.currentPage}
                totalPages={numberOfPages(
                  chatsResponse?.headers.pagination?.totalCount ?? 0,
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
}

function RowActionItem({
  chat,
  onDeleteSuccess,
  onDeleteError,
}: {
  chat: ChatResponse;
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
              {chat.title ?? DEFAULT_CHAT_TITLE}"?
            </h3>
            <div className={tw("flex justify-center gap-4")}>
              <Button
                color="failure"
                isProcessing={deletionInProgress}
                onClick={() => {
                  setDeletionInProgress(true);

                  deleteChat(Id.from(chat.id))
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

async function deleteChat(id: Id<IdType.Chat>): Promise<ChatResponse> {
  return (await delete_<ChatResponse>(chatApiPath(id))).response;
}

function ChatHistoryEmptyState() {
  return (
    <div className={tw("text-xl")}>
      No chats yet.
      <br />
      As you chat, your chat history will appear here.
    </div>
  );
}
