import { Metadata } from "next";

import DocumentCollectionDetailsPage from "./document-collection-details-page";

export const metadata: Metadata = {
  title: "Document collection",
};

const Page = ({
  params,
}: {
  params: { orgSlug: string; documentCollectionId: string };
}) => {
  return (
    <DocumentCollectionDetailsPage
      orgSlug={params.orgSlug}
      documentCollectionId={params.documentCollectionId}
    />
  );
};

export default Page;
