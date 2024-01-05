import { RedirectType, notFound, redirect } from "next/navigation";

import { getFirst, isEmpty, isOAuthDataSource, toDataSource } from "@repo/core";

import { FrontendRoutes } from "lib/fe/routes";

export default function Page({
  params,
  searchParams,
}: {
  params: { dataSource: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const dataSource = toDataSource(params.dataSource.toUpperCase());
  if (!isOAuthDataSource(dataSource)) {
    return notFound();
  }

  // TODO: Move Google Drive to use this oauth-callback as well. It will simplify redirect uri config in google drive oauth config steps!
  const code = getFirst(searchParams["code"]);
  const error = getFirst(searchParams["error"]);
  const state = getFirst(searchParams["state"]);
  const scope = getFirst(searchParams["scope"]);

  if (!state) {
    return (
      <div>
        Invalid URL. Missing required parameter "state"!
      </div>
    );
  }

  let url = `${FrontendRoutes.getConnectDataSourceRoute(state, dataSource)}?`;
  if (!isEmpty(code)) {
    url += `&code=${code}`
  }
  if (!isEmpty(error)) {
    url += `&error=${error}`
  }
  if (!isEmpty(scope)) {
    url += `&scope=${scope}`
  }

  redirect(url, RedirectType.replace);
}
