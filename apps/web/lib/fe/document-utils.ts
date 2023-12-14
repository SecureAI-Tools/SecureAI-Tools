import { Id } from "lib/types/core/id";
import { post } from "lib/fe/api";
import { FetchError } from "lib/fe/types/fetch-error";
import { DocumentResponse } from "lib/types/api/document.response";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";
import { DocumentCollectionCreateRequest } from "lib/types/api/document-collection-create.request";
import {
  documentCollectionDocumentsApiPath,
  postOrganizationsIdOrSlugDocumentCollectionApiPath,
} from "lib/fe/api-paths";

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

export const uploadDocument = async (
  documentCollectionId: Id<DocumentCollectionCreateRequest>,
  file: File,
): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    documentCollectionDocumentsApiPath(documentCollectionId),
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
