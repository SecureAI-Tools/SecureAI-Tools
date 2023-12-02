import React, { useEffect, useRef, useState } from "react";
import { Message } from "ai";
import { useChat } from "ai/react";
import { tw } from "twind";
import { Spinner } from "flowbite-react";
import { HiOutlineClipboard, HiOutlineClipboardCheck } from "react-icons/hi";
import clipboardCopy from "clipboard-copy";

import { Id } from "lib/types/core/id";
import ChatInput from "lib/fe/components/chat-input";
import { ChatResponse } from "lib/types/api/chat.response";
import {
  postChatMessagesApiPath,
  chatTitleApiPath,
  postChatMessagesGenerateApiPath,
} from "lib/fe/api-paths";
import { post, postStreaming } from "lib/fe/api";
import { ChatTitleRequest } from "lib/types/api/chat-title.request";
import {
  ChatMessageResponse,
  chatMessageResponsetoMessage,
} from "lib/types/api/chat-message.response";
import { DEFAULT_CHAT_TITLE } from "lib/core/constants";
import { ChatTitle } from "lib/fe/components/chat-title";
import { Analytics } from "lib/fe/analytics";
import { ChatMessageCreateRequest } from "lib/types/api/chat-message-create.request";

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

export function Chat({
  chat,
  chatMessages,
}: {
  chat: ChatResponse;
  chatMessages: ChatMessageResponse[];
}) {
  const chatId = Id.from(chat.id);

  const [title, setTitle] = useState<string | undefined>(DEFAULT_CHAT_TITLE);
  const [isTitleGenerating, setIsTitleGenerating] = useState<boolean>(false);
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
    api: postChatMessagesGenerateApiPath(chatId),
  });

  useEffect(() => {
    const chatTitle = chat.title;
    setTitle(chatTitle);
    if (document) {
      document.title = chatTitle ?? DEFAULT_CHAT_TITLE;
    }

    // DO NOT SUBMIT
    // TODO: Change this logic to be as follows
    //   if (chat.type === "chat-with-ai") { ... current logic ... } else { ...start indexing and then start chat... }
    const msgs = chatMessages.map((cm) => chatMessageResponsetoMessage(cm));
    if (msgs.length === 1 && msgs[0].role === "user") {
      // Trigger generation
      append(msgs[0])
        .then((x) => {
          setIsTitleGenerating(true);
          postStreaming<ChatTitleRequest>({
            input: chatTitleApiPath(chatId),
            req: {
              messages: msgs,
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
        })
    } else {
      setMessages(msgs);
    }
  }, []);

  return (
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
          onSubmit={async (e) => {
            try {
              // First create 
              await postChatMessage(chatId, {
                message: {
                  content: input,
                  role: "user",
                }
              });
              // Then trigger generation
              handleSubmit(e);
            } catch (e) {
              console.log("something went wrong: ", e);
              // TODO: Show error toast
            }
          }}
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
    </div>
  );
}

const postChatMessage = async (
  chatId: Id<ChatResponse>,
  req: ChatMessageCreateRequest,
): Promise<ChatMessageResponse> => {
  return (
    await post<ChatMessageCreateRequest, ChatMessageResponse>(
      postChatMessagesApiPath(chatId),
      req,
    )
  ).response;
};
