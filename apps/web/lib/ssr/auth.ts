import { getToken } from "next-auth/jwt";
import {
  GetServerSidePropsContext,
  PreviewData,
  GetServerSidePropsResult,
} from "next";

import { Id } from "lib/types/core/id";
import { UserResponse } from "lib/types/api/user.response";
import { ParsedUrlQuery } from "querystring";
import { FrontendRoutes } from "lib/fe/routes";
import { TokenUser } from "lib/types/core/token-user";

export async function isAuthenticated<P>(
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
): Promise<[boolean, Id<UserResponse> | undefined]> {
  const token = await getToken({ req: context.req });

  if (
    token === null ||
    (token.user as TokenUser | undefined)?.id === undefined
  ) {
    // Not logged in.
    return [false, undefined];
  }

  return [true, Id.from((token.user as TokenUser).id as string)];
}

export async function isAuthenticatedWithRedirect<P>(
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
): Promise<
  [GetServerSidePropsResult<P> | undefined, Id<UserResponse> | undefined]
> {
  const [authenticated, userId] = await isAuthenticated(context);

  if (authenticated) {
    return [undefined, userId];
  }

  // Not logged in -- redirect back to index.
  return [
    {
      redirect: {
        permanent: false,
        destination: FrontendRoutes.LOG_IN,
      },
    },
    undefined,
  ];
}
