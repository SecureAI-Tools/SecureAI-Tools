import React, { useEffect, useRef, useState } from "react";
import { Message } from "ai";
import { useChat } from "ai/react";
import { tw } from "twind";
import { Progress, Spinner, Tooltip } from "flowbite-react";
import { HiOutlineClipboard, HiOutlineClipboardCheck } from "react-icons/hi";
import clipboardCopy from "clipboard-copy";

import ChatInput from "lib/fe/components/chat-input";
import { ChatResponse } from "lib/types/api/chat.response";
import {
  postChatMessagesApiPath,
  chatTitleApiPath,
  postChatMessagesGenerateApiPath,
  documentCollectionDocumentIndexApiPath,
  getChatMessagesApiPath,
  getChatMessageCitationsApiPath,
} from "lib/fe/api-paths";
import { get, post, postStreaming } from "lib/fe/api";
import { ChatTitleRequest } from "lib/types/api/chat-title.request";
import {
  ChatMessageResponse,
  chatMessageResponseToMessage,
} from "lib/types/api/chat-message.response";
import { ChatTitle } from "lib/fe/components/chat-title";
import { Analytics } from "lib/fe/analytics";
import { ChatMessageCreateRequest } from "lib/types/api/chat-message-create.request";
import { ChatType } from "lib/types/core/chat-type";
import { CitationResponse } from "lib/types/api/citation-response";
import { Link } from "lib/fe/components/link";
import { ChatMessageRole } from "lib/types/core/chat-message-role";

import { DEFAULT_CHAT_TITLE } from "@repo/core/constants";
import { isEmpty } from "@repo/core/src/utils/string-utils";
import { DocumentIndexingStatus } from "@repo/core/src/types/document-indexing-status";
import { DocumentResponse } from "@repo/core/src/types/document.response";
import { Id } from "@repo/core/src/types/id";
import { StreamChunkResponse } from "@repo/core/src/types/stream-chunk.response";

const MessageEntry = ({
  message,
  citations,
  documents,
  onJumpToPage,
}: {
  message: Message;
  citations?: CitationResponse[];
  documents?: DocumentResponse[];
  onJumpToPage?: (docId: string, pageIndex: number) => void;
}) => {
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
          <div className={tw("flex flex-col w-[calc(100%-50px)]")}>
            <div
              className={tw(
                "relative flex gap-1 md:gap-3 lg:w-[calc(100%-115px)] whitespace-pre-wrap",
              )}
            >
              {message.content}
            </div>
            {citations && citations.length > 0 ? (
              <div className={tw("mt-4 border-t")}>
                <div className={tw("mt-2 text-xs")}>
                  <span className={tw("font-semibold")}>Sources:</span>
                  <ul className={tw("ml-2 mt-3 list-disc")}>
                    {citations
                      .sort((a, b) => b.score - a.score)
                      .map((c) => {
                        const doc = documents?.find(
                          (d) => d.id === c.documentId,
                        );
                        return (
                          <li key={c.id} className={tw("ml-5 pb-2")}>
                            <Tooltip
                              content={`Jump to page ${c.pageNumber} of ${
                                doc?.name ?? ""
                              }`}
                              animation="duration-1000"
                            >
                              <Link
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onJumpToPage?.(
                                    c.documentId,
                                    c.pageNumber - 1,
                                  );
                                }}
                              >
                                Page {c.pageNumber} (lines {c.fromLine}-
                                {c.toLine}){doc ? `, ${doc.name}` : null}
                              </Link>
                            </Tooltip>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>
            ) : null}
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
  documents,
  citations,
  onJumpToPage,
}: {
  chat: ChatResponse;
  chatMessages: ChatMessageResponse[];
  documents?: DocumentResponse[];
  citations?: CitationResponse[];
  onJumpToPage?: (docId: string, pageIndex: number) => void;
}) {
  const chatId = Id.from<ChatResponse>(chat.id);

  const [title, setTitle] = useState<string | undefined>(DEFAULT_CHAT_TITLE);
  const [isTitleGenerating, setIsTitleGenerating] = useState<boolean>(false);
  const [isProcessingDocuments, setIsProcessingDocuments] =
    useState<boolean>(false);
  const [numberOfProcessedDocuments, setNumberOfProcessedDocuments] =
    useState(0);
  const [processingDocumentName, setProcessingDocumentName] = useState("");
  const [processingDocumentStatus, setProcessingDocumentStatus] = useState("");
  const [processingDocumentsError, setProcessingDocumentsError] = useState("");
  const [messageCitations, setMessageCitations] = useState<
    Map<string /* messageId */, CitationResponse[]>
  >(toCitationMap(citations));
  const formRef = useRef(null);
  const messagesRef = useRef<Message[]>([]);
  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
  } = useChat({
    id: chat.id,
    api: postChatMessagesGenerateApiPath(chatId),
    onFinish: async (message) => {
      if (message.role !== "assistant") {
        return;
      }

      // Fetch latest message from backend to get the correct message id
      const { response: chatMessageResponses } = await get<
        ChatMessageResponse[]
      >(
        getChatMessagesApiPath({
          chatId: chatId,
          ordering: {
            orderBy: "createdAt",
            order: "desc",
          },
          pagination: {
            page: 1,
            pageSize: 1,
          },
        }),
      );

      if (chatMessageResponses.length < 1) {
        console.log("something went wrong! Didn't receive any chat messages.");
        return;
      }

      const lastChatMessage = chatMessageResponses[0]!;
      if (lastChatMessage.role !== ChatMessageRole.ASSISTANT) {
        console.log(
          "something went wrong! Last chat message isn't from assistant.",
        );
        return;
      }

      // Fetch citations of the last generated message;
      const { response: citationResponses } = await get<CitationResponse[]>(
        getChatMessageCitationsApiPath({
          chatId: chatId,
          chatMessageIds: [Id.from(lastChatMessage.id)],
        }),
      );

      // Update state to re-render messages
      setMessageCitations((current) => {
        return new Map(current.set(lastChatMessage.id, citationResponses));
      });

      // Update messages so that the last message gets correct message id!
      const newMessages: Message[] = [...messagesRef.current];
      newMessages.pop();
      newMessages.push(chatMessageResponseToMessage(lastChatMessage));
      setMessages(newMessages);
    },
  });

  // Use ref to pass messages state into onFinish() callback.
  // Directly using the messages state inside onFinish only gives the initial value
  // https://stackoverflow.com/a/60643670
  messagesRef.current = messages;

  const generateFirstCompletionAndGenerateTitle = async (
    msgs: Message[],
  ): Promise<void> => {
    return append(msgs[0]!).then((x) => {
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
    });
  };

  const indexDocuments = async (docs: DocumentResponse[]): Promise<boolean> => {
    try {
      // TODO: See if we can parallelize this in batches!
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i]!;
        setProcessingDocumentName(doc.name);
        await indexDocument({
          doc: doc,
          onGeneratedChunk: (chunk) => {
            if (chunk.status) {
              setProcessingDocumentStatus(chunk.status);
            }
          },
        });
        setNumberOfProcessedDocuments(i + 1);
      }
      setProcessingDocumentName("");
      setProcessingDocumentStatus("Processed all documents");
    } catch (e) {
      console.error("could not index documents: ", e);
      return false;
    }

    return true;
  };

  useEffect(() => {
    const chatTitle = chat.title;
    setTitle(chatTitle);
    if (document) {
      document.title = chatTitle ?? DEFAULT_CHAT_TITLE;
    }

    const msgs = chatMessages.map((cm) => chatMessageResponseToMessage(cm));
    if (msgs.length === 1 && msgs[0]!.role === "user") {
      if (
        chat.type === ChatType.CHAT_WITH_DOCS &&
        documents?.some(
          (d) => d.indexingStatus !== DocumentIndexingStatus.INDEXED,
        )
      ) {
        // Index docs, and then generate!
        setIsProcessingDocuments(true);
        setMessages(msgs);

        // Start indexing docs
        indexDocuments(documents!).then((success) => {
          // Reset messages first -- append will re-add the first message!
          setIsProcessingDocuments(false);
          if (success) {
            setMessages([]);
            return generateFirstCompletionAndGenerateTitle(msgs);
          } else {
            setProcessingDocumentsError(
              "Something went wrong while trying to process documents. Please refresh this page to retry",
            );
          }
        });
      } else {
        // Either it's a chat-with-ai, OR (it's a chat-with-docs but has all docs indexed)

        // Trigger generation
        generateFirstCompletionAndGenerateTitle(msgs);
      }
    } else {
      setMessages(msgs);
    }
  }, []);

  return (
    <div className={tw("flex flex-col w-full h-screen")}>
      <div className={tw("flex-1 flex-col overflow-auto")}>
        <header className={tw("z-10 w-full bg-white font-medium sticky top-0")}>
          <ChatTitle
            title={title}
            chatId={chatId}
            isGenerating={isTitleGenerating}
            modelType={chat.modelType}
            model={chat.model}
          />
        </header>
        {messages.length > 0
          ? messages.map((m) => (
              <MessageEntry
                key={m.id}
                message={m}
                citations={messageCitations.get(m.id)}
                documents={documents}
                onJumpToPage={onJumpToPage}
              />
            ))
          : null}
        {isProcessingDocuments && documents ? (
          <div className={tw("flex flex-col items-center mt-16")}>
            <Spinner size="xl" />
            <div className={tw("text-xl font-semibold mt-4")}>
              Processing documents
            </div>
            <div className={tw("text-sm mt-2")}>
              Processed {numberOfProcessedDocuments} of {documents.length}{" "}
              documents...
            </div>
            <Progress
              progress={(numberOfProcessedDocuments * 100) / documents.length}
              className={tw("w-80 mt-1")}
            />
            {!isEmpty(processingDocumentName) ? (
              <div className={tw("text-xs mt-2")}>
                Processing {processingDocumentName}
              </div>
            ) : null}
            {!isEmpty(processingDocumentStatus) ? (
              <div className={tw("text-xs mt-2")}>
                {processingDocumentStatus}
              </div>
            ) : null}
          </div>
        ) : null}
        {processingDocumentsError ? (
          <div className={tw("flex flex-col items-center m-16 text-red-500")}>
            <div>{processingDocumentsError}</div>
          </div>
        ) : null}
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
                },
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
                disabled={isLoading || isProcessingDocuments}
                placeholder={
                  isProcessingDocuments
                    ? "Waiting for documents to be processed..."
                    : "Say something..."
                }
              />
            </div>
            {isLoading ? (
              <div className={tw("m-auto pl-2")}>
                <Spinner aria-label="generating response..." size="lg" />
              </div>
            ) : null}
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

const indexDocument = async ({
  doc,
  onGeneratedChunk,
}: {
  doc: DocumentResponse;
  onGeneratedChunk: (chunk: StreamChunkResponse) => void;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (doc.indexingStatus === DocumentIndexingStatus.INDEXED) {
      resolve();
      return;
    }

    postStreaming<{}>({
      input: documentCollectionDocumentIndexApiPath(
        Id.from(doc.collectionId),
        Id.from(doc.id),
      ),
      req: {},
      onGeneratedChunk: (chunk) => {
        let parsedResponses = [];
        try {
          const lines = chunk.split("\n").filter((l) => !isEmpty(l));
          parsedResponses = lines.map((line) => JSON.parse(line));
        } catch (e) {
          console.log("could not parse stream chunk response", chunk, e);
        }
        parsedResponses.forEach((r) => {
          if (r.error) {
            reject(r.error);
          }

          onGeneratedChunk(r);
        });
      },
      onFinish: () => {
        resolve();
      },
    });
  });
};

const toCitationMap = (
  citations: CitationResponse[] | undefined,
): Map<string, CitationResponse[]> => {
  const map = new Map<string, CitationResponse[]>();
  citations?.forEach((c) => {
    const list = map.get(c.chatMessageId);
    if (list) {
      list.push(c);
    } else {
      map.set(c.chatMessageId, [c]);
    }
  });

  return map;
};
