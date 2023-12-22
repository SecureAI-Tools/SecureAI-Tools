import { Metadata } from "next";

import DataSourcesListPage from "./data-sources-list-page";

export const metadata: Metadata = {
  title: "Data sources",
};

const Page = ({ params }: { params: { orgSlug: string } }) => {
  return <DataSourcesListPage orgSlug={params.orgSlug} />;
};

export default Page;
