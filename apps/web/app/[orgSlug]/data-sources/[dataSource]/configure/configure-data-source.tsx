"use client";

import { tw } from "twind";
import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Alert, Spinner, TextInput } from "flowbite-react";

import AppsLoggedInLayout from "lib/fe/components/apps-logged-in-layout";
import { PageTitle } from "lib/fe/components/page-title";
import { TokenUser } from "lib/types/core/token-user";
import { getOrgDataSourcesApiPath, getOrgMembershipsApiPath } from "lib/fe/api-paths";
import { createFetcher } from "lib/fe/api";
import { renderErrors } from "lib/fe/components/generic-error";
import { DataSourcesResponse } from "lib/types/api/data-sources.response";
import { GoogleDriveConfigure } from "lib/fe/components/data-sources/configure/google-drive";
import { CopyClipboard } from "lib/fe/components/copy-clipboard";
import { isAdmin } from "lib/fe/permission-utils";

import {
  DataSource,
  Id,
  IdType,
  OrgMembershipResponse,
  dataSourceToReadableName,
  toDataSource,
} from "@repo/core";

const ConfigureDataSource = ({
  orgSlug,
  dataSource: dataSourceRaw,
}: {
  orgSlug: string;
  dataSource: string;
}) => {
  const { data: session, status: sessionStatus } = useSession();

  const dataSource = toDataSource(dataSourceRaw.toUpperCase());

  const shouldFetchDataSources =
    sessionStatus === "authenticated" && session;
  const {
    data: dataSourcesResponse,
    error: dataSourcesFetchError,
  } = useSWR(
    shouldFetchDataSources
      ? getOrgDataSourcesApiPath(orgSlug)
      : null,
    createFetcher<DataSourcesResponse>(),
  );

  const shouldFetchMemberships =
    sessionStatus === "authenticated" && session;
  const {
    data: membershipsResponse,
    error: membershipsFetchError,
  } = useSWR(
    shouldFetchMemberships
      ? getOrgMembershipsApiPath(orgSlug, {
          userId: (session!.user as TokenUser).id,
        })
      : null,
    createFetcher<OrgMembershipResponse[]>(),
  );

  const dataSourceReadableName = dataSourceToReadableName(dataSource);
  useEffect(() => {
    if (document) {
      document.title = `Configure to ${dataSourceReadableName}`;
    }
  }, []);

  const renderConfigure = (): ReactNode => {
    if (session === undefined || dataSourcesResponse === undefined || membershipsResponse === undefined) {
      return <Spinner size="xl" />;
    }

    const tokenUser = session!.user as TokenUser;

    if (dataSourcesResponse.response.configuredDataSources.includes(dataSource)) {
      return (
        <Alert color="success">
          <div className={tw("font-medium mb-2")}>{dataSourceReadableName} has been configured!</div>
          {dataSourceReadableName} was configured for your organization. Now every member of your organization can connect to it as needed to pull documents from {dataSourceReadableName}.
        </Alert>
      );
    }

    if (!isAdmin(membershipsResponse.response)) {
      const url = window ? window.location.href : "";
      return (
        <Alert color="warning">
          <div className={tw("font-semibold mb-2")}>Insufficient permission</div>
          Please ask your organization admin to configure {dataSourceReadableName}. Send them the following link and ask them to configure {dataSourceReadableName}

          <div className={tw("flex flex-row items-center mt-2")}>
            <TextInput 
              value={url}
              disabled
              size={48}
            />
            <div className={tw("ml-2")}>
              <CopyClipboard content={url} />
            </div>
          </div>
        </Alert>
      );
    }

    const userId = Id.from<IdType.User>(tokenUser.id);

    switch (dataSource) {
      case DataSource.GOOGLE_DRIVE:
        return <GoogleDriveConfigure orgSlug={orgSlug} userId={userId} />;
      default:
        return <div>Unsupported data source "{dataSourceReadableName}"</div>;
    }
  };

  if (dataSourcesFetchError || membershipsFetchError) {
    return renderErrors(dataSourcesFetchError, membershipsFetchError);
  }

  return (
    <AppsLoggedInLayout>
      <div className={tw("flex flex-col items-center m-6")}>
        <div className={tw("mb-6")}>
          <PageTitle>Configure {dataSourceReadableName}</PageTitle>
        </div>
        <div className={tw("w-[450px]")}>{renderConfigure()}</div>
      </div>
    </AppsLoggedInLayout>
  );
};

export default ConfigureDataSource;
