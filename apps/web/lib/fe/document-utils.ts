import { patch, post } from "lib/fe/api";
import { FetchError } from "lib/fe/types/fetch-error";
import { DocumentCollectionCreateRequest } from "lib/types/api/document-collection-create.request";
import {
  getDocumentCollectionApiPath,
  uploadDocumentApiPath,
  postOrganizationsIdOrSlugDocumentCollectionApiPath,
  postDocumentApiPath,
} from "lib/fe/api-paths";
import { IndexingMode } from "lib/types/core/indexing-mode";
import { DocumentCollectionUpdateRequest } from "lib/types/api/document-collection-update.request";
import { SelectedDocument } from "lib/fe/types/selected-document";
import { DocumentCreateRequest } from "lib/types/api/document-create.request";

import { DocumentCollectionResponse, Id, DocumentResponse, DataSource, IdType } from "@repo/core";

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
  documentCollectionId: Id<IdType.DocumentCollection>,
  req: DocumentCollectionUpdateRequest,
): Promise<DocumentCollectionResponse> => {
  return (
    await patch<DocumentCollectionCreateRequest, DocumentCollectionResponse>(
      getDocumentCollectionApiPath(documentCollectionId),
      req,
    )
  ).response;
};

export const createDocument = async (
  documentCollectionId: Id<IdType.DocumentCollection>,
  selectedDocument: SelectedDocument,
  indexingMode: IndexingMode,
): Promise<DocumentResponse> => {
  if (selectedDocument.dataSource === DataSource.UPLOAD) {
    return await uploadDocument(documentCollectionId, selectedDocument.file!, indexingMode);
  }

  // Create doc
  return (
    await post<DocumentCreateRequest, DocumentResponse>(
      postDocumentApiPath(documentCollectionId),
      {
        name: selectedDocument.name,
        externalId: selectedDocument.externalId!,
        dataSourceConnectionId: selectedDocument.dataSourceConnectionId!.toString(),
        indexingMode: indexingMode,
      },
    )
  ).response;
}

const uploadDocument = async (
  documentCollectionId: Id<IdType.DocumentCollection>,
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
