import { Metadata } from "next";

import CreateDocumentCollections from "./create-document-collections";

export const metadata: Metadata = {
  title: "Create document collection",
};

const Page = ({ params }: { params: { orgSlug: string } }) => {
  return <CreateDocumentCollections orgSlug={params.orgSlug} />;
};

export default Page;
