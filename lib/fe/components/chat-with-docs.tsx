"use client";

import { useEffect, useState } from "react";
import { Button, Dropdown, Spinner } from "flowbite-react";
import { tw } from "twind";
import useSWR from "swr";
import { Document as PDFDocument, Page as PDFPage, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";

import { ChatResponse } from "lib/types/api/chat.response";
import { Id } from "lib/types/core/id";
import { chatDocumentApiPath, chatDocumentsApiPath } from "lib/fe/api-paths";
import { createFetcher } from "lib/fe/api";
import { ChatDocumentResponse } from "lib/types/api/chat-document.response";
import { renderErrors } from "lib/fe/components/generic-error";
import Link from "next/link";
import { Chat } from "./chat";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";

export function ChatWithDocs({
  chat,
  chatMessages,
}: {
  chat: ChatResponse;
  chatMessages: ChatMessageResponse[];
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState<
    string | undefined
  >();
  const [pageNumber, setPageNumber] = useState(1);

  const chatId = Id.from(chat.id);

  // Fetch chat documents
  const { data: chatDocumentsResponse, error: fetchChatDocumentsError } =
    useSWR(
      chatDocumentsApiPath(chatId),
      createFetcher<ChatDocumentResponse[]>(),
      {
        revalidateOnFocus: false,
      },
    );

  const map = new Map(
    chatDocumentsResponse?.response?.map((response) => [response.id, response]),
  );

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.js",
      import.meta.url,
    ).toString();
  }, []);

  useEffect(() => {
    const responses = chatDocumentsResponse?.response;
    if (responses && responses?.length > 0) {
      setPreviewDocumentId(responses[0].id);
    }
  }, [chatDocumentsResponse]);

  if (fetchChatDocumentsError) {
    return renderErrors(fetchChatDocumentsError);
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(delta: number) {
    setPageNumber((prevPageNumber) => prevPageNumber + delta);
  }

  function changeDocument(docId: string) {
    setPreviewDocumentId(docId);
    changePage(1);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
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
      <div className={tw("flex")}>
        <div className={tw("w-1/2 border-r-2")}>
          {!chatDocumentsResponse || !previewDocument ? (
            renderLoadingSpinner()
          ) : (
            <div>
              <div>
                <PDFDocument
                  file={chatDocumentApiPath(
                    chatId,
                    Id.from(previewDocument.id),
                  )}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className={tw("max-h-screen overflow-scroll")}
                  loading={renderLoadingSpinner}
                >
                  <div
                    className={tw(
                      "flex flex-row p-4 bg-gray-50 sticky top-0 items-center z-50 border-b border-black/10",
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
                        {chatDocumentsResponse.response.map((doc) => (
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
                      href={chatDocumentApiPath(
                        chatId,
                        Id.from(previewDocument.id),
                      )}
                      target="_blank"
                      className={tw("ml-3")}
                      aria-label="open document in new tab"
                    >
                      <HiArrowTopRightOnSquare />
                    </Link>
                  </div>
                  <PDFPage
                    pageNumber={pageNumber}
                    loading={renderLoadingSpinner}
                  />
                  <div
                    className={tw(
                      "flex flex-row items-center sticky bottom-0 p-2 bg-gray-50 items-center z-50 border-t border-black/10",
                    )}
                  >
                    <div className={tw("flex-none")}>
                      <Button disabled={pageNumber <= 1} onClick={previousPage}>
                        Previous
                      </Button>
                    </div>
                    <div className={tw("grow text-center")}>
                      Page {pageNumber || (numPages ? 1 : "--")} of{" "}
                      {numPages || "--"}
                    </div>
                    <div className={tw("flex-none")}>
                      <Button
                        disabled={pageNumber >= (numPages ?? 0)}
                        onClick={nextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </PDFDocument>
              </div>
            </div>
          )}
        </div>
        <div className={tw("w-1/2")}>
          <Chat chat={chat} chatMessages={chatMessages} />
        </div>
      </div>
    </div>
  );
}
