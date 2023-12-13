"use client";

import { tw } from "twind";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { Sidebar } from "lib/fe/components/side-bar";
import { Id } from "lib/types/core/id";
import { DocumentCollectionResponse } from "lib/types/api/document-collection.response";

const DocumentCollectionDetailsPage = ({
  orgSlug,
  documentCollectionId: documentCollectionIdRaw,
}: {
  orgSlug: string;
  documentCollectionId: string;
}) => {
  const documentCollectionId = Id.from<DocumentCollectionResponse>(
    documentCollectionIdRaw,
  );

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-row")}>
        <Sidebar orgSlug={orgSlug} />
        <div>
          TODO: Show document collection details here (
          {documentCollectionId.toString()})
        </div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default DocumentCollectionDetailsPage;
