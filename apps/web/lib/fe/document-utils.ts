import { patch, post } from "lib/fe/api";
import { FetchError } from "lib/fe/types/fetch-error";
import { DocumentCollectionCreateRequest } from "lib/types/api/document-collection-create.request";
import {
  getDocumentCollectionApiPath,
  uploadDocumentApiPath,
  postOrganizationsIdOrSlugDocumentCollectionApiPath,
} from "lib/fe/api-paths";
import { IndexingMode } from "lib/types/core/indexing-mode";

import { DocumentCollectionResponse, Id, DocumentResponse } from "@repo/core";
import { DocumentCollectionUpdateRequest } from "lib/types/api/document-collection-update.request";

export const createDocumentCollection = async (
  orgSlug: string,
  req: DocumentCollectionCreateRequest,
): Promise<DocumentCollectionResponse> => {
  return (
    await post<DocumentCollectionCreateRequest, DocumentCollectionResponse>(
      postOrganizationsIdOrSlugDocumentCollectionApiPath(orgSlug),
      req,
    )
  ).response;
};

export const updateDocumentCollection = async (
  documentCollectionId: Id<DocumentCollectionResponse>,
  req: DocumentCollectionUpdateRequest,
): Promise<DocumentCollectionResponse> => {
  return (
    await patch<DocumentCollectionCreateRequest, DocumentCollectionResponse>(
      getDocumentCollectionApiPath(documentCollectionId),
      req,
    )
  ).response;
};

export const uploadDocument = async (
  documentCollectionId: Id<DocumentCollectionCreateRequest>,
  file: File,
  indexingMode: IndexingMode,
): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("indexingMode", indexingMode);

  const res = await fetch(
    uploadDocumentApiPath(documentCollectionId),
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.ok) {
    throw new FetchError(
      "An error occurred while fetching the data.",
      res.status,
      await res.json(),
    );
  }

  return await res.json();
};
