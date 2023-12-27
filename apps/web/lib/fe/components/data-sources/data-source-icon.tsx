import Image from "next/image";
import { HiOutlineCloudUpload } from "react-icons/hi";
import { tw } from "twind";

import { getLogoSrc } from "lib/fe/data-source-utils";

import { DataSource, dataSourceToReadableName } from "@repo/core";

export const DataSourceIcon = ({ dataSource }: { dataSource: DataSource }) => {
  if (dataSource === DataSource.UPLOAD) {
    return <HiOutlineCloudUpload className={tw("w-5 h-5")} />;
  }
  // TODO: Handle WEB if/when adding it

  return (
    <Image
      src={getLogoSrc(dataSource)}
      alt={`${dataSourceToReadableName(dataSource)} logo`}
      width={20}
      height={20}
    />
  );
};
