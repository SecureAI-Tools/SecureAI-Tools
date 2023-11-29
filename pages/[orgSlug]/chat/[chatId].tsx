import type { NextPage } from "next";
import { NextRouter, useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Message } from "ai";
import { useChat } from "ai/react";
import { tw } from "twind";
import { Spinner } from "flowbite-react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { HiOutlineClipboard, HiOutlineClipboardCheck } from "react-icons/hi";
import clipboardCopy from "clipboard-copy";

import LoggedInLayout from "lib/fe/components/logged-in-layout";
import { Id } from "lib/types/core/id";
import { FE } from "lib/fe/route-utils";
import ChatInput from "lib/fe/components/chat-input";
import { ChatResponse } from "lib/types/api/chat.response";
import {
  postChatMessagesApiPath,
  chatTitleApiPath,
  getChatMessagesApiPath,
  chatApiPath,
} from "lib/fe/api-paths";
import { createFetcher, postStreaming } from "lib/fe/api";
import { ChatTitleRequest } from "lib/types/api/chat-title.request";
import {
  ChatMessageResponse,
  chatMessageResponsetoMessage,
} from "lib/types/api/chat-message.response";
import { DEFAULT_CHAT_TITLE } from "lib/core/constants";
import { isEmpty } from "lib/core/string-utils";
import { ChatTitle } from "lib/fe/components/chat-title";
import { Analytics } from "lib/fe/analytics";
import { Sidebar } from "lib/fe/components/side-bar";

const appendParam = "append";
const chatIdParam = "chatId";
const orgSlugParam = "orgSlug";

const ChatPage: NextPage = () => {
  const router = useRouter();
  const chatIdRaw = FE.getFirstQueryParam(router, chatIdParam);

  return (
    <LoggedInLayout>
      {chatIdRaw ? <Chat chatId={Id.from(chatIdRaw)} /> : null}
    </LoggedInLayout>
  );
};

export default ChatPage;

const MessageEntry = ({ message }: { message: Message }) => {
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);

  return (
    <div
      key={message.id}
      className={tw(
        "group w-full text-token-text-primary border-b border-black/10 dark:border-gray-900/50",
        message.role === "user"
          ? "dark:bg-gray-800"
          : "bg-gray-50 dark:bg-[#444654]",
      )}
    >
      <div
        className={tw("p-4 justify-center text-base md:gap-6 md:py-6 m-auto")}
      >
        <div
          className={tw(
            "flex flex-1 gap-4 text-base mx-auto md:gap-6 md:max-w-2xl lg:max-w-[38rem] xl:max-w-3xl",
          )}
        >
          <div className={tw("flex-shrink-0 flex flex-col relative w-10")}>
            {message.role === "user" ? "User: " : "AI: "}
          </div>
          <div
            className={tw(
              "relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-[calc(100%-115px)] whitespace-pre-wrap",
            )}
          >
            {message.content}
          </div>
          {copiedToClipboard ? (
            <HiOutlineClipboardCheck />
          ) : (
            <HiOutlineClipboard
              className={tw("cursor-pointer hover:bg-slate-200 rounded")}
              onClick={(event) => {
                clipboardCopy(message.content);

                // Show success icon for a bit and then go back to copy-clipboard icon.
                setCopiedToClipboard(true);
                setTimeout(() => {
                  setCopiedToClipboard(false);
                }, 2048);

                Analytics.track({
                  event: Analytics.Event.ChatMessageCopiedToClipboard,
                  payload: {
                    messageRole: message.role,
                  },
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const getAppendMessageParam = (router: NextRouter): string | undefined => {
  const appendMessageRaw = FE.getFirstQueryParam(router, appendParam);
  return appendMessageRaw ? decodeURIComponent(appendMessageRaw) : undefined;
};

function Chat({ chatId }: { chatId: Id<ChatResponse> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState<string | undefined>(DEFAULT_CHAT_TITLE);
  const [isTitleGenerating, setIsTitleGenerating] = useState<boolean>(false);
  const [orgSlug, setOrgSlug] = useState<string | undefined>();
  const formRef = useRef(null);
  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
  } = useChat({
    api: postChatMessagesApiPath(chatId),
    onFinish: (message: Message) => {
      const appendMessage = getAppendMessageParam(router);
      if (appendMessage) {
        FE.updateSearchParams({
          params: {},
          ignoreKeys: [appendParam, chatIdParam, orgSlugParam],
          router,
          searchParams,
          pathname,
          type: "replace",
        });
      }
    },
  });

  const shouldFetchChat = status === "authenticated" && chatId !== undefined;
  const { data: fetchChatResponse, error: fetchChatError } = useSWR(
    shouldFetchChat ? chatApiPath(chatId) : null,
    createFetcher<ChatResponse>(),
    {
      // Don't refetch on focus.
      // Fetching on refocus causes issues if http response is still streaming and user re-focuses!
      revalidateOnFocus: false,
    },
  );
  // TODO: Handle errors!

  useEffect(() => {
    if (!fetchChatResponse) {
      return;
    }

    const chatTitle = fetchChatResponse.response.title;
    setTitle(chatTitle);
    if (document) {
      document.title = chatTitle ?? DEFAULT_CHAT_TITLE;
    }
  }, [fetchChatResponse]);

  const shouldFetchChatMessages =
    status === "authenticated" && chatId !== undefined;
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

  useEffect(() => {
    if (!chatMessagesResponse) {
      return;
    }

    const msgs = chatMessagesResponse.response.map((cm) =>
      chatMessageResponsetoMessage(cm),
    );
    const appendMessage = getAppendMessageParam(router);

    // Set initial message if appending it while it generates!
    if (msgs.length === 0 && appendMessage) {
      setMessages([
        {
          id: "dummy",
          role: "user",
          content: appendMessage,
        },
      ]);
    } else {
      setMessages(msgs);
    }
  }, [chatMessagesResponse, router.isReady]);

  useEffect(() => {
    const slug = FE.getFirstQueryParam(router, orgSlugParam)
    setOrgSlug(slug);

    const appendMessage = getAppendMessageParam(router);
    if (appendMessage) {
      append({
        content: appendMessage,
        role: "user",
      });
    }
  }, [router.isReady]);

  useEffect(() => {
    if (
      !isLoading &&
      isEmpty(title) &&
      !isTitleGenerating &&
      messages.length === 2 &&
      messages[0].role === "user"
    ) {
      // First message was generated. Trigger title generation!
      setIsTitleGenerating(true);
      postStreaming<ChatTitleRequest>({
        input: chatTitleApiPath(chatId),
        req: {
          messages: [messages[0]],
        },
        onGeneratedChunk: (chunk, newTitle) => {
          setTitle(newTitle);
          if (document) {
            document.title = newTitle;
          }
        },
        onFinish: () => {
          setIsTitleGenerating(false);
        },
      });
    }
  }, [messages, title, isLoading, isTitleGenerating]);

  return (
    <div className={tw("flex flex-row")}>
      <Sidebar orgSlug={orgSlug ?? ''} />
      <div className={tw("flex flex-col w-full h-screen")}>
        <div className={tw("flex-1 flex-col overflow-auto")}>
          <header className={tw("z-10 w-full bg-white font-medium")}>
            <ChatTitle
              title={title}
              chatId={chatId}
              isGenerating={isTitleGenerating}
            />
          </header>
          {messages.length > 0
            ? messages.map((m) => <MessageEntry message={m} key={m.id} />)
            : null}
        </div>
        <div
          className={tw(
            "shrink-0 bottom-0 left-0 w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient pt-2 md:pl-2 md:w-[calc(100%-.5rem)]",
          )}
        >
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className={tw(
              "stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl",
            )}
          >
            <div className={tw("relative flex h-full flex-1 items-stretch")}>
              <div className={tw("flex w-full items-center")}>
                <ChatInput
                  value={input}
                  onEnter={() => {
                    if (!formRef.current) {
                      console.log("formRef not set yet!");
                      return;
                    }
                    (formRef.current as HTMLFormElement).dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true }),
                    );
                  }}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="Say something..."
                />
              </div>
              <div className={tw("m-auto pl-2")}>
                <Spinner
                  aria-label="generating response..."
                  size="lg"
                  className={tw(isLoading ? "visible" : "invisible")}
                />
              </div>
            </div>
          </form>
        </div>
        <style global jsx>
          {globalStyle}
        </style>
      </div>
    </div>
  );
}

const globalStyle = `
body, html, #__next {
  height: 100%;
}
`;
