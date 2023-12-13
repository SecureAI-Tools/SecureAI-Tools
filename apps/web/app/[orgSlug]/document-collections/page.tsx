import { Metadata } from "next";

import DocumentCollectionListPage from "./document-collection-list-page";

export const metadata: Metadata = {
  title: "Document collections",
};

const Page = ({ params }: { params: { orgSlug: string } }) => {
  return <DocumentCollectionListPage orgSlug={params.orgSlug} />;
};

export default Page;
