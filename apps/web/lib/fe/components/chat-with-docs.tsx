"use client";

import { Spinner } from "flowbite-react";
import { tw } from "twind";
import useSWR from "swr";

import { ChatResponse } from "lib/types/api/chat.response";
import {
  getDocumentCollectionDocumentsApiPath,
  getChatMessageCitationsApiPath,
  getDocumentToCollections,
} from "lib/fe/api-paths";
import { createFetcher } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { Chat } from "lib/fe/components/chat";
import { ChatMessageResponse } from "lib/types/api/chat-message.response";
import { CitationResponse } from "lib/types/api/citation-response";

import {
  Id,
  DocumentResponse,
  DocumentToCollectionResponse,
  IdType,
} from "@repo/core";

export function ChatWithDocs({
  chat,
  chatMessages,
}: {
  chat: ChatResponse;
  chatMessages: ChatMessageResponse[];
}) {
  const documentCollectionId = Id.from<IdType.DocumentCollection>(
    chat.documentCollectionId!,
  );

  // Fetch documents
  const {
    data: collectionDocumentsResponse,
    error: fetchCollectionDocumentsError,
  } = useSWR(
    getDocumentCollectionDocumentsApiPath({
      documentCollectionId: documentCollectionId,
      pagination: {
        // TODO: Allow viewing beyond first 1024 docs in a collection! Scaling problem for later
        page: 1,
        pageSize: 1024,
      },
      ordering: {
        orderBy: "createdAt",
        order: "desc",
      },
    }),
    createFetcher<DocumentResponse[]>(),
    {
      revalidateOnFocus: false,
    },
  );

  const shouldFetchDocumentToCollections =
    collectionDocumentsResponse &&
    collectionDocumentsResponse.response.length > 0;
  const {
    data: documentToCollectionsResponse,
    error: documentToCollectionsFetchError,
  } = useSWR(
    shouldFetchDocumentToCollections
      ? getDocumentToCollections({
          documentCollectionId: documentCollectionId,
          documentIds: collectionDocumentsResponse!.response.map((d) =>
            Id.from(d.id),
          ),
        })
      : null,
    createFetcher<DocumentToCollectionResponse[]>(),
  );

  const map = new Map(
    collectionDocumentsResponse?.response?.map((response) => [
      response.id,
      response,
    ]),
  );

  // Fetch citation sources and pass it down!
  const { data: citationsResponse, error: fetchCitationsError } = useSWR(
    getChatMessageCitationsApiPath({
      chatId: Id.from(chat.id),
      chatMessageIds: chatMessages.map((r) => Id.from(r.id)),
    }),
    createFetcher<CitationResponse[]>(),
    {
      // Don't refetch on focus.
      // Fetching on refocus causes issues if http response is still streaming and user re-focuses!
      revalidateOnFocus: false,
    },
  );

  if (
    fetchCollectionDocumentsError ||
    fetchCitationsError ||
    documentToCollectionsFetchError
  ) {
    return renderErrors(
      fetchCollectionDocumentsError,
      fetchCitationsError,
      documentToCollectionsFetchError,
    );
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

  const shouldRenderLoadingSpinner =
    !collectionDocumentsResponse ||
    !citationsResponse ||
    !documentToCollectionsResponse;

  const docIdToIndexingStatusMap = new Map(
    documentToCollectionsResponse?.response.map((d2c) => [
      d2c.documentId,
      d2c.indexingStatus,
    ]),
  );

  return (
    <div className={tw("flex flex-col w-full")}>
      {shouldRenderLoadingSpinner ? (
        renderLoadingSpinner()
      ) : (
        <Chat
          chat={chat}
          chatMessages={chatMessages}
          documents={collectionDocumentsResponse.response.map((d) => {
            return {
              ...d,
              indexingStatus: docIdToIndexingStatusMap.get(d.id)!,
            };
          })}
          citations={citationsResponse?.response}
        />
      )}
    </div>
  );
}
