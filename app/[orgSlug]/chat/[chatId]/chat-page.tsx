"use client";

import { tw } from "twind";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Id } from "lib/types/core/id";
import { Sidebar } from "lib/fe/components/side-bar";
import { Chat } from "lib/fe/components/chat";
import { chatApiPath, getChatMessagesApiPath } from "lib/fe/api-paths";
import { ChatResponse } from "lib/types/api/chat.response";
import { createFetcher } from "lib/fe/api";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";
import { renderErrors } from "lib/fe/components/generic-error";
import { Spinner } from "flowbite-react";

const ChatPage = ({ orgSlug, chatId: chatIdRaw }: { orgSlug: string; chatId: string }) => {
  const { status: sessionStatus } = useSession();

  const chatId = Id.from(chatIdRaw);

  const shouldFetchChat = sessionStatus === "authenticated";
  const { data: fetchChatResponse, error: fetchChatError } = useSWR(
    shouldFetchChat ? chatApiPath(chatId) : null,
    createFetcher<ChatResponse>(),
    {
      // Don't refetch on focus.
      // Fetching on refocus causes issues if http response is still streaming and user re-focuses!
      revalidateOnFocus: false,
    },
  );

  const shouldFetchChatMessages = sessionStatus === "authenticated";
  const { data: chatMessagesResponse, error: fetchChatMessagesError } = useSWR(
    shouldFetchChatMessages
      ? getChatMessagesApiPath({
        chatId: chatId,
        ordering: {
          orderBy: "createdAt",
          order: "asc",
        },
        pagination: {
          page: 1,
          pageSize: 512,
        },
      })
      : null,
    createFetcher<ChatMessageResponse[]>(),
    {
      // Don't refetch on focus.
      // Fetching on refocus causes issues if http response is still streaming and user re-focuses!
      revalidateOnFocus: false,
    },
  );

  if (fetchChatError || fetchChatMessagesError) {
    return renderErrors(fetchChatError, fetchChatMessagesError);
  }

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} />
        {fetchChatResponse && chatMessagesResponse ? (
          <Chat chat={fetchChatResponse.response} chatMessages={chatMessagesResponse.response} />
        ) : (
          <div className={tw("flex flex-col justify-center items-center w-full")}>
            <Spinner size="xl" />
          </div>
        )}
      </div>
    </AppsLoggedInLayout>
  );
};

export default ChatPage;
