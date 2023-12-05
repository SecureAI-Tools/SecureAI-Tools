"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { tw } from "twind";
import Image from "next/image";

import { post } from "lib/fe/api";
import {
  documentCollectionDocumentsApiPath,
  organizationsIdOrSlugChatApiPath,
  organizationsIdOrSlugDocumentCollectionApiPath,
  postChatMessagesApiPath,
} from "lib/fe/api-paths";
import useToasts from "lib/fe/hooks/use-toasts";
import { FrontendRoutes } from "lib/fe/routes";
import ChatInput from "lib/fe/components/chat-input";
import { StudioToasts } from "lib/fe/components/studio-toasts";
import { ChatCreateRequest } from "lib/types/api/chat-create.request";
import { ChatResponse } from "lib/types/api/chat.response";
import { Id } from "lib/types/core/id";
import { ChatMessageCreateRequest } from "lib/types/api/chat-message-create.request";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";
import { FilesUpload } from "lib/fe/components/files-upload";
import { ChatType } from "lib/types/core/chat-type";
import { DocumentResponse } from "lib/types/api/document.response";
import { FetchError } from "lib/fe/types/fetch-error";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { DocumentCollectionCreateRequest } from "lib/types/api/document-collection-create.request";

export default function NewChat({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [toasts, addToast] = useToasts();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const chatType: ChatType =
        selectedFiles.length === 0
          ? ChatType.CHAT_WITH_LLM
          : ChatType.CHAT_WITH_DOCS;

      let documentCollectionId: Id<DocumentCollectionResponse> | undefined = undefined;
      if (chatType === ChatType.CHAT_WITH_DOCS) {
        const documentCollection = await createDocumentCollection(orgSlug);
        documentCollectionId = Id.from(documentCollection.id)
        await uploadDocuments(documentCollectionId, selectedFiles);
      }

      const chatResponse = await postChat(orgSlug, {
        type: chatType,
        documentCollectionId: documentCollectionId?.toString()
      });
      const chatId = Id.from(chatResponse.id);

      const chatMessageResponse = await postChatMessage(chatId, {
        message: {
          content: input,
          role: "user",
        },
      });

      router.push(
        `${FrontendRoutes.getChatRoute(orgSlug, chatId)}?src=new-chat`,
      );
    } catch (e) {
      console.log("couldn't create chat/chat-message", e);
      addToast({
        type: "failure",
        children: <p>Something went wrong. Please try again later.</p>,
      });
      setIsSubmitting(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length < 1) {
      console.log("eh! got no files");
      return;
    }

    setSelectedFiles((currentlySelectedFiles) => {
      // TODO: Deduplicate? How to do without full file path?
      return [...currentlySelectedFiles, ...files];
    });
  };

  return (
    <>
      <StudioToasts toasts={toasts} />
      <div className={tw("flex flex-col w-full h-screen")}>
        <div className={tw("flex flex-col grow items-center justify-center")}>
          <div className={tw("flex flex-col items-center")}>
            <Image
              className={tw(`h-20 w-20`)}
              src="/logo.png"
              alt="logo"
              width={80}
              height={80}
            />
            <span className={tw("font-semibold text-xl mt-4")}>
              How can I help you today?
            </span>
          </div>
        </div>
        <div
          className={tw(
            "shrink-0 bottom-0 left-0 w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient pt-2 md:pl-2 md:w-[calc(100%-.5rem)]",
          )}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();

              handleSubmit();
            }}
            className={tw(
              "stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl",
            )}
          >
            <div className={tw("relative flex h-full flex-1 items-stretch")}>
              <div className={tw("flex flex-col w-full items-center")}>
                <ChatInput
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                  }}
                  onEnter={handleSubmit}
                  disabled={isSubmitting}
                  placeholder="Type something and hit Enter to start a new chat..."
                />
                <div id="fileUpload" className={tw("mt-4 w-full h-24")}>
                  <FilesUpload
                    cta={<p>Attach PDFs to chat with them (optional)</p>}
                    help={
                      selectedFiles.length === 0 ? (
                        <p>Click to upload</p>
                      ) : (
                        <div
                          className={tw(
                            "flex flex-col items-center max-h-10 overflow-scroll",
                          )}
                        >
                          Selected {selectedFiles.length} files
                          {selectedFiles.map((f, i) => {
                            return (
                              <div key={i}>
                                {f.name}
                              </div>
                            );
                          })}
                        </div>
                      )
                    }
                    onFilesSelected={handleFilesSelected}
                    accept=".pdf"
                    disabled={isSubmitting}
                    spinner={isSubmitting}
                    multiple
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

const postChat = async (
  orgIdOrSlug: string,
  req: ChatCreateRequest,
): Promise<ChatResponse> => {
  return (
    await post<ChatCreateRequest, ChatResponse>(
      organizationsIdOrSlugChatApiPath(orgIdOrSlug),
      req,
    )
  ).response;
};

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

const createDocumentCollection = async (
  orgSlug: string,
): Promise<DocumentCollectionResponse> => {
  return (
    await post<DocumentCollectionCreateRequest, DocumentCollectionResponse>(
      organizationsIdOrSlugDocumentCollectionApiPath(orgSlug),
      {},
    )
  ).response;
};

const uploadDocuments = async (
  documentCollectionId: Id<DocumentCollectionCreateRequest>,
  files: File[],
): Promise<DocumentResponse[]> => {
  const promises = files.map((f) => {
    return uploadDocument(documentCollectionId, f);
  });

  return await Promise.all(promises);
};

const uploadDocument = async (
  documentCollectionId: Id<DocumentCollectionCreateRequest>,
  file: File,
): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(documentCollectionDocumentsApiPath(documentCollectionId), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new FetchError(
      "An error occurred while fetching the data.",
      res.status,
      await res.json(),
    );
  }

  return await res.json();
};
