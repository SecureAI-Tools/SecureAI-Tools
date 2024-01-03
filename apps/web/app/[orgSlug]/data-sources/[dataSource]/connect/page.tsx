import { Metadata } from "next";
import { notFound } from "next/navigation";

import ConnectDataSource from "./connect-data-source";

import { DataSource } from "@repo/core";

export const metadata: Metadata = {
  title: "Connect to data source",
};

const Page = ({
  params,
}: {
  params: { orgSlug: string; dataSource: string };
}) => {
  // Return 404 if dataSource is not a valid data source!
  if (
    !Object.values<string>(DataSource).includes(
      params.dataSource.toUpperCase(),
    ) ||
    params.dataSource === DataSource.UPLOAD
  ) {
    return notFound();
  }

  return (
    <ConnectDataSource
      orgSlug={params.orgSlug}
      dataSource={params.dataSource}
    />
  );
};

export default Page;
