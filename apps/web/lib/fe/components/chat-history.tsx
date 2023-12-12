"use client";

import { Button, Card, Modal, Spinner } from "flowbite-react";
import { DEFAULT_CHAT_TITLE } from "lib/core/constants";
import { ChatResponse } from "lib/types/api/chat.response";
import useSWR, { useSWRConfig } from "swr";
import { tw } from "twind";
import ReactTimeAgo from "react-time-ago";
import { useSession } from "next-auth/react";
import {
  HiOutlineTrash,
  HiOutlineExclamationCircle,
  HiOutlineChatAlt,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { useState } from "react";

import { createFetcher, delete_ } from "lib/fe/api";
import { chatApiPath, chatsApiPath } from "lib/fe/api-paths";
import { TokenUser } from "lib/types/core/token-user";
import { clip } from "lib/core/string-utils";
import { Id } from "lib/types/core/id";
import useToasts from "lib/fe/hooks/use-toasts";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import { FrontendRoutes } from "lib/fe/routes";
import { ChatType } from "lib/types/core/chat-type";

export default function ChatHistory({ orgSlug }: { orgSlug: string }) {
  const { data: session, status } = useSession();
  const { mutate } = useSWRConfig();
  const [toasts, addToast] = useToasts();

  const shouldFetchChats = status === "authenticated";
  const chatsSWRKey = chatsApiPath({
    orgIdOrSlug: orgSlug,
    userId: (session?.user as TokenUser)?.id,
    ordering: {
      orderBy: "createdAt",
      order: "desc",
    },
    // Only loads the first page of size 512 items for now!
    // TODO(Optimization): Build proper pagination UI controls and make this dynamic!
    pagination: {
      page: 1,
      pageSize: 512,
    },
  });
  const { data: chatsResponse, error: fetchChatsError } = useSWR(
    shouldFetchChats ? chatsSWRKey : null,
    createFetcher<ChatResponse[]>(),
  );

  const renderChatList = (chats: ChatResponse[]) => {
    return chats.map((chat) => (
      <ChatHistoryListItem
        chat={chat}
        orgSlug={orgSlug}
        key={chat.id}
        onDeleteSuccess={(deletedChat) => {
          mutate(chatsSWRKey);
          addToast({
            type: "success",
            children: (
              <p>
                Successfully deleted "
                {clip(deletedChat.title ?? DEFAULT_CHAT_TITLE, 32)}".
              </p>
            ),
          });
        }}
        onDeleteError={(error) => {
          addToast({
            type: "failure",
            children: <p>Something went wrong. Please try again later.</p>,
          });
        }}
      />
    ));
  };

  return (
    <div>
      <StudioToasts toasts={toasts} />
      <div>
        {chatsResponse ? (
          chatsResponse.response.length > 0 ? (
            renderChatList(chatsResponse.response)
          ) : (
            <ChatHistoryEmptyState />
          )
        ) : (
          <div>
            <Spinner size="md" className={tw("mr-2")} /> Loading...
          </div>
        )}
      </div>
    </div>
  );
}

function ChatHistoryListItem({
  chat,
  orgSlug,
  onDeleteSuccess,
  onDeleteError,
}: {
  chat: ChatResponse;
  orgSlug: string;
  onDeleteSuccess: (deletedChat: ChatResponse) => void;
  onDeleteError: (err: Error) => void;
}) {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [deletionInProgress, setDeletionInProgress] = useState<boolean>(false);
  const props = { openModal, setOpenModal };

  const chatTitle = chat.title ?? DEFAULT_CHAT_TITLE;

  return (
    <>
      <div className={tw("mt-2")}>
        <Card
          href={`${FrontendRoutes.getChatRoute(
            orgSlug,
            Id.from(chat.id),
          )}?src=chat-history`}
        >
          <div className={tw("flex flex-row items-center")}>
            {chat.type === ChatType.CHAT_WITH_DOCS ? (
              <HiOutlineDocumentText className={tw("mr-4 h-8 w-8")} />
            ) : (
              <HiOutlineChatAlt className={tw("mr-4 h-8 w-8")} />
            )}
            <div className={tw("grow")}>
              <div className={tw("flex flex-row items-center")}>
                <h5
                  className={tw(
                    "w-full text-md font-medium tracking-tight text-gray-900",
                  )}
                >
                  <p>{chatTitle}</p>
                </h5>
                <HiOutlineTrash
                  onClick={(event) => {
                    event.preventDefault();
                    props.setOpenModal(true);
                  }}
                  className={tw("h-4 w-4")}
                />
              </div>
              <p className={tw("text-xs font-normal text-gray-700")}>
                Created <ReactTimeAgo date={chat.createdAt} locale="en-US" />
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        popup
        size="lg"
        position="center"
        show={props.openModal}
        onClose={() => props.setOpenModal(false)}
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
              Are you sure you want to delete "{clip(chatTitle, 32)}"?
            </h3>
            <div className={tw("flex justify-center gap-4")}>
              <Button
                color="failure"
                isProcessing={deletionInProgress}
                onClick={() => {
                  setDeletionInProgress(true);

                  deleteChat(chat.id)
                    .then(onDeleteSuccess)
                    .catch((err) => {
                      console.log("error while deleting chat", err);

                      onDeleteError(err);
                    })
                    .finally(() => {
                      props.setOpenModal(false);
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
                onClick={() => props.setOpenModal(false)}
                disabled={deletionInProgress}
              >
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

async function deleteChat(chatId: string): Promise<ChatResponse> {
  return (await delete_<ChatResponse>(chatApiPath(Id.from(chatId)))).response;
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
