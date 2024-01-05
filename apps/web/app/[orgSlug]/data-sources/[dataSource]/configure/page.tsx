import { Metadata } from "next";
import { notFound } from "next/navigation";

import ConfigureDataSource from "./configure-data-source";

import { DataSource, isOrgAdminConfigurableDataSource, toDataSource } from "@repo/core";

export const metadata: Metadata = {
  title: "Configure data source",
};

const Page = ({
  params,
}: {
  params: { orgSlug: string; dataSource: string };
}) => {
  // Return 404 if dataSource is not a valid data source!
  if (!isOrgAdminConfigurableDataSource(toDataSource(params.dataSource.toUpperCase()))) {
    return notFound();
  }

  return (
    <ConfigureDataSource
      orgSlug={params.orgSlug}
      dataSource={params.dataSource}
    />
  );
};

export default Page;
