"use client";

import { useEffect, useState } from "react";
import { Dropdown, Spinner } from "flowbite-react";
import { tw } from "twind";
import useSWR from "swr";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";
import Link from "next/link";
import { Viewer, Worker } from '@react-pdf-viewer/core';

import '@react-pdf-viewer/core/lib/styles/index.css';

import { ChatResponse } from "lib/types/api/chat.response";
import { Id } from "lib/types/core/id";
import { documentCollectionDocumentApiPath, documentCollectionDocumentsApiPath } from "lib/fe/api-paths";
import { createFetcher } from "lib/fe/api";
import { DocumentResponse } from "lib/types/api/document.response";
import { renderErrors } from "lib/fe/components/generic-error";
import { Chat } from "lib/fe/components/chat";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";

export function ChatWithDocs({
  chat,
  chatMessages,
}: {
  chat: ChatResponse;
  chatMessages: ChatMessageResponse[];
}) {
  const [previewDocumentId, setPreviewDocumentId] = useState<
    string | undefined
  >();

  const chatId = Id.from<ChatResponse>(chat.id);
  const documentCollectionId = Id.from<DocumentCollectionResponse>(chat.documentCollectionId!);

  // Fetch documents
  const { data: collectionDocumentsResponse, error: fetchCollectionDocumentsError } =
    useSWR(
      documentCollectionDocumentsApiPath(documentCollectionId),
      createFetcher<DocumentResponse[]>(),
      {
        revalidateOnFocus: false,
      },
    );

  const map = new Map(
    collectionDocumentsResponse?.response?.map((response) => [response.id, response]),
  );

  useEffect(() => {
    const responses = collectionDocumentsResponse?.response;
    if (responses && responses?.length > 0) {
      setPreviewDocumentId(responses[0].id);
    }
  }, [collectionDocumentsResponse]);

  if (fetchCollectionDocumentsError) {
    return renderErrors(fetchCollectionDocumentsError);
  }

  function changeDocument(docId: string) {
    setPreviewDocumentId(docId);
  }

  // Loading spinner for various doc preview elements
  const renderLoadingSpinner = () => {
    return (
      <div className={tw("flex flex-col items-center justify-center h-screen")}>
        <Spinner size="xl" />
        <p className={tw("mt-4")}>Loading...</p>
      </div>
    );
  };

  const previewDocument = previewDocumentId
    ? map.get(previewDocumentId)
    : undefined;

  return (
    <div className={tw("flex flex-col w-full")}>
      {!collectionDocumentsResponse || !previewDocument ? (
        renderLoadingSpinner()
      ) : (
        <div className={tw("flex")}>
          <div className={tw("w-1/2 border-r-2")}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <div className={tw("flex flex-col h-screen")}>
                <div
                  className={tw(
                    "flex flex-row flex p-4 bg-gray-50 top-0 items-center z-50 border-b border-black/10",
                  )}
                >
                  <div className={tw("grow flex flex-row justify-center")}>
                    <Dropdown
                      label={
                        <span className={tw("font-semibold")}>
                          {previewDocument.name}
                        </span>
                      }
                      className={tw("z-50")}
                      placement="bottom"
                      inline
                    >
                      {collectionDocumentsResponse.response.map((doc) => (
                        <Dropdown.Item
                          onClick={() => {
                            changeDocument(doc.id);
                          }}
                          key={doc.id}
                        >
                          <span
                            className={tw(
                              doc.id === previewDocumentId ? "font-bold" : "",
                            )}
                          >
                            {doc.name}
                          </span>
                        </Dropdown.Item>
                      ))}
                    </Dropdown>
                  </div>
                  <Link
                    href={documentCollectionDocumentApiPath(
                      documentCollectionId,
                      Id.from(previewDocument.id),
                    )}
                    target="_blank"
                    className={tw("mr-4")}
                    aria-label="open document in new tab"
                  >
                    <HiArrowTopRightOnSquare />
                  </Link>
                </div>
                <div className={tw("grow overflow-scroll")}>
                  <Viewer
                    fileUrl={documentCollectionDocumentApiPath(
                      documentCollectionId,
                      Id.from(previewDocument.id),
                    )}
                  />
                </div>
              </div>
            </Worker>
          </div>
          <div className={tw("w-1/2")}>
            <Chat chat={chat} chatMessages={chatMessages} documents={collectionDocumentsResponse.response} />
          </div>
        </div>
      )}
    </div>
  );
}
